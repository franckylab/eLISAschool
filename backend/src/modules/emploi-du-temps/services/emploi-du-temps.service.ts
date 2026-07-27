/**
 * ==================================
 * eLISAschool - Service CreneauHoraire (ex-EmploiDuTempsService)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Refonte : fusion EmploiDuTemps + RepartitionHoraire → CreneauHoraire.
 * Le créneau référence affectationMatiereId comme source unique.
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { HeureCours } from '@modules/personnel/entities';
import {
    CreerCreneauDto,
    ModifierCreneauDto,
    QueryCreneauxDto,
    GenererEmploiDuTempsDto,
    PreferenceEmploiDuTempsDto,
} from '../dto';
import { ClasseAnnee } from '@modules/classes/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, calculatePaginationMeta } from '@common/utils/pagination.util';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { MatiereNiveau } from '@modules/matieres/entities';
import { salleAvailabilityService } from '@modules/salles/services/salle-availability.service';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { CreneauHoraire, PreferenceEmploiDuTemps, JourSemaine, TypeCreneau, StatutCreneau } from '../entities';
import { conflitDetectionService } from './conflit-detection.service';

export class EmploiDuTempsService {
    private creneauRepo: Repository<CreneauHoraire>;
    private preferenceRepo: Repository<PreferenceEmploiDuTemps>;

    constructor() {
        this.creneauRepo = AppDataSource.getRepository(CreneauHoraire);
        this.preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
    }

    // ─── CRUD CreneauHoraire ───────────────────────────────────

    async findAll(query: QueryCreneauxDto, etablissementId: string) {
        const qb = this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('classeAnnee.anneeScolaire', 'anneeScolaire')
            .leftJoinAndSelect('ch.salle', 'salle')
            .where('ch.etablissementId = :etablissementId', { etablissementId });

        // Filtres directs
        if (query.affectationMatiereId) qb.andWhere('ch.affectationMatiereId = :affectationMatiereId', { affectationMatiereId: query.affectationMatiereId });
        if (query.salleId) qb.andWhere('ch.salleId = :salleId', { salleId: query.salleId });
        if (query.jour) qb.andWhere('ch.jour = :jour', { jour: query.jour });
        if (query.typeCreneau) qb.andWhere('ch.typeCreneau = :typeCreneau', { typeCreneau: query.typeCreneau });
        if (query.statut) qb.andWhere('ch.statut = :statut', { statut: query.statut });
        if (query.anneeScolaireId) qb.andWhere('ch.anneeScolaireId = :anneeScolaireId', { anneeScolaireId: query.anneeScolaireId });
        if (query.periodeId) qb.andWhere('ch.periodeId = :periodeId', { periodeId: query.periodeId });
        if (query.genereAutomatiquement !== undefined) qb.andWhere('ch.genereAutomatiquement = :genereAutomatiquement', { genereAutomatiquement: query.genereAutomatiquement });

        // Filtres dérivés via affectation
        if (query.classeAnneeId) qb.andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId: query.classeAnneeId });
        if (query.enseignantId) qb.andWhere('am.enseignantId = :enseignantId', { enseignantId: query.enseignantId });
        if (query.matiereId) qb.andWhere('am.matiereId = :matiereId', { matiereId: query.matiereId });

        qb.orderBy(`ch.${query.orderBy}`, query.orderDir);
        const result = await paginateWithQueryBuilder(qb, query.page, query.limit);

        return result;
    }

    async findOne(id: string, etablissementId: string): Promise<CreneauHoraire> {
        const creneau = await this.creneauRepo.findOne({
            where: { id, etablissementId },
            relations: [
                'affectationMatiere',
                'affectationMatiere.matiere',
                'affectationMatiere.enseignant',
                'affectationMatiere.classeAnnee',
                'affectationMatiere.classeAnnee.classe',
                'affectationMatiere.classeAnnee.anneeScolaire',
                'salle',
            ],
        });
        if (!creneau) throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');
        return creneau;
    }

    async creerCreneau(dto: CreerCreneauDto, etablissementId: string): Promise<CreneauHoraire> {
        // Vérifier les conflits bloquants
        const conflits = await conflitDetectionService.detecterConflits(
            {
                affectationMatiereId: dto.affectationMatiereId,
                jour: dto.jour as JourSemaine,
                heureDebut: dto.heureDebut,
                heureFin: dto.heureFin,
                salleId: dto.salleId,
            },
            etablissementId,
        );

        const conflitsBloquants = conflits.filter(c => c.severite === 'BLOQUANT');
        if (conflitsBloquants.length > 0) {
            throw new AppError(
                conflitsBloquants.map(c => c.message).join('; '),
                409,
                'CONFLITS_CRENEAU',
            );
        }

        const requireValidation = await getParamBoolean('emploi-du-temps.require_validation', { defaultValue: false });
        const statutInitial = requireValidation
            ? StatutCreneau.PLANIFIE
            : ((dto.statut || StatutCreneau.VALIDE) as StatutCreneau);

        const creneau = this.creneauRepo.create({
            affectationMatiereId: dto.affectationMatiereId,
            salleId: dto.salleId || undefined,
            jour: dto.jour as JourSemaine,
            heureDebut: dto.heureDebut,
            heureFin: dto.heureFin,
            typeCreneau: (dto.typeCreneau || TypeCreneau.COURS) as TypeCreneau,
            statut: statutInitial,
            couleur: dto.couleur || undefined,
            notes: dto.notes,
            periodeId: dto.periodeId,
            anneeScolaireId: dto.anneeScolaireId,
            etablissementId,
            genereAutomatiquement: false,
        });

        await this.creneauRepo.save(creneau);
        logger.info(`[CreneauHoraire] Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`);
        return this.findOne(creneau.id, etablissementId);
    }

    async updateCreneau(id: string, dto: ModifierCreneauDto, etablissementId: string): Promise<CreneauHoraire> {
        const creneau = await this.findOne(id, etablissementId);

        // Vérifier les conflits si les champs critiques changent
        const nouveauJour = (dto.jour || creneau.jour) as JourSemaine;
        const nouveauDebut = dto.heureDebut || creneau.heureDebut;
        const nouveauFin = dto.heureFin || creneau.heureFin;
        const nouvelleSalle = dto.salleId !== undefined ? dto.salleId : creneau.salleId;
        const nouvelleAffectation = dto.affectationMatiereId || creneau.affectationMatiereId;

        const conflits = await conflitDetectionService.detecterConflits(
            {
                affectationMatiereId: nouvelleAffectation,
                jour: nouveauJour,
                heureDebut: nouveauDebut,
                heureFin: nouveauFin,
                salleId: nouvelleSalle || undefined,
                excludeCreneauId: id,
            },
            etablissementId,
        );

        const conflitsBloquants = conflits.filter(c => c.severite === 'BLOQUANT');
        if (conflitsBloquants.length > 0) {
            throw new AppError(
                conflitsBloquants.map(c => c.message).join('; '),
                409,
                'CONFLITS_CRENEAU',
            );
        }

        Object.assign(creneau, dto);
        await this.creneauRepo.save(creneau);
        logger.info(`[CreneauHoraire] Créneau modifié: ${id}`);
        return this.findOne(id, etablissementId);
    }

    async supprimerCreneau(id: string, etablissementId: string): Promise<void> {
        const creneau = await this.findOne(id, etablissementId);
        await this.creneauRepo.remove(creneau);
        logger.info(`[CreneauHoraire] Créneau supprimé: ${id}`);
    }

    // ─── Workflow validation ────────────────────────────────────

    async validerCreneau(id: string, etablissementId: string): Promise<CreneauHoraire> {
        const creneau = await this.findOne(id, etablissementId);

        if (creneau.statut !== StatutCreneau.PLANIFIE) {
            throw new AppError(
                'Seuls les créneaux planifiés peuvent être validés',
                400,
                'STATUT_INVALIDE',
            );
        }

        creneau.statut = StatutCreneau.VALIDE;
        await this.creneauRepo.save(creneau);
        logger.info(`[CreneauHoraire] Créneau validé: ${id}`);
        return this.findOne(id, etablissementId);
    }

    async validerCreneauxClasse(
        classeAnneeId: string,
        etablissementId: string,
    ): Promise<{ valide: number; total: number }> {
        const creneaux = await this.creneauRepo.find({
            where: { etablissementId, statut: StatutCreneau.PLANIFIE },
            relations: ['affectationMatiere'],
        });

        const creneauxClasse = creneaux.filter(
            c => c.affectationMatiere?.classeAnneeId === classeAnneeId,
        );

        if (creneauxClasse.length === 0) {
            return { valide: 0, total: 0 };
        }

        const ids = creneauxClasse.map(c => c.id);
        await this.creneauRepo
            .createQueryBuilder()
            .update()
            .set({ statut: StatutCreneau.VALIDE })
            .whereInIds(ids)
            .execute();

        logger.info(`[EDT] ${creneauxClasse.length} créneau(x) validé(s) pour classeAnnee ${classeAnneeId}`);
        return { valide: creneauxClasse.length, total: creneauxClasse.length };
    }

    // ─── Requêtes par contexte ─────────────────────────────────

    async findByClasseAnnee(classeAnneeId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.find({
            where: { etablissementId },
            relations: [
                'affectationMatiere', 'affectationMatiere.matiere',
                'affectationMatiere.enseignant', 'affectationMatiere.classeAnnee',
                'salle',
            ],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        }).then(creneaux =>
            creneaux.filter(c => c.affectationMatiere?.classeAnneeId === classeAnneeId)
        );
    }

    async findByEnseignant(enseignantId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.find({
            where: { etablissementId },
            relations: [
                'affectationMatiere', 'affectationMatiere.matiere',
                'affectationMatiere.classeAnnee', 'salle',
            ],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        }).then(creneaux =>
            creneaux.filter(c => c.affectationMatiere?.enseignantId === enseignantId)
        );
    }

    async findBySalle(salleId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.find({
            where: { salleId, etablissementId },
            relations: [
                'affectationMatiere', 'affectationMatiere.matiere',
                'affectationMatiere.enseignant', 'affectationMatiere.classeAnnee',
            ],
            order: { jour: 'ASC', heureDebut: 'ASC' },
        });
    }

    // ─── Génération automatique ────────────────────────────────

    async genererEmploiDuTemps(dto: GenererEmploiDuTempsDto, etablissementId: string): Promise<{
        success: boolean;
        message: string;
        nombreCreneaux: number;
        conflits: string[];
        avertissements: string[];
    }> {
        const { classeAnneeId, options } = dto;
        const preferences = await this.getPreferences(etablissementId);

        if (options?.regenerer) {
            await this.creneauRepo
                .createQueryBuilder()
                .delete()
                .where('affectationMatiereId IN (SELECT id FROM affectations_matieres WHERE "classeAnneeId" = :classeAnneeId)', { classeAnneeId })
                .andWhere('etablissementId = :etablissementId', { etablissementId })
                .execute();
        }

        const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: classeAnneeId, etablissementId },
            relations: ['classe'],
        });
        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const affectationsRepo = AppDataSource.getRepository(AffectationMatiere);
        const affectations = await affectationsRepo.find({
            where: { classeAnneeId, etablissementId, statut: StatutAffectationMatiere.ACTIVE },
            relations: ['matiere', 'enseignant'],
        });

        if (affectations.length === 0) {
            return { success: true, message: 'Aucune affectation trouvée. EDT vide.', nombreCreneaux: 0, conflits: [], avertissements: [] };
        }

        const matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
        const requireValidation = await getParamBoolean('emploi-du-temps.require_validation', { defaultValue: false });
        const statutGenere = requireValidation ? StatutCreneau.PLANIFIE : StatutCreneau.VALIDE;
        const dureeCreneau = preferences.dureeCreneauStandard || 55;
        const jours = preferences.joursOuvrables || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const respecterContraintes = options?.respecterContraintes ?? true;

        // Charger les volumes horaires et trier par volume décroissant (most constrained first)
        type AffectationAvecVolume = { affectation: AffectationMatiere; volumeHeures: number; nombreCreneaux: number };
        const affectationsTriees: AffectationAvecVolume[] = [];

        for (const affectation of affectations) {
            const matiereNiveau = await matiereNiveauRepo.findOne({
                where: { matiereId: affectation.matiereId, niveauId: classeAnnee.classe?.niveauId ?? '' },
            });
            const volumeHeures = matiereNiveau?.volumeHoraire || 2;
            const nombreCreneaux = Math.ceil((volumeHeures * 60) / dureeCreneau);
            affectationsTriees.push({ affectation, volumeHeures, nombreCreneaux });
        }

        affectationsTriees.sort((a, b) => b.volumeHeures - a.volumeHeures);

        // Structures de suivi des contraintes
        const creneauxParClasseJour = new Map<string, number>();
        const matiereParJour = new Map<string, number>();
        const enseignantOccupations: Array<{ enseignantIds: string[]; jour: string; heureDebut: string; heureFin: string }> = [];
        const creneauxGenerees: CreneauHoraire[] = [];
        const conflits: string[] = [];
        const avertissements: string[] = [];

        for (const { affectation, nombreCreneaux } of affectationsTriees) {
            const matiereId = affectation.matiereId;

            for (let i = 0; i < nombreCreneaux; i++) {
                const placement = respecterContraintes
                    ? await this.trouverMeilleurCreneau(
                        preferences, affectation, jours, dureeCreneau,
                        creneauxParClasseJour, matiereParJour, enseignantOccupations,
                        creneauxGenerees, classeAnneeId, matiereId,
                    )
                    : this.trouverCreneauLibre(
                        preferences, jours, dureeCreneau,
                        creneauxParClasseJour, enseignantOccupations,
                        affectation, classeAnneeId,
                    );

                if (placement) {
                    const creneau = this.creneauRepo.create({
                        affectationMatiereId: affectation.id,
                        salleId: placement.salleId,
                        jour: placement.jour as JourSemaine,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                        typeCreneau: TypeCreneau.COURS,
                        statut: statutGenere,
                        anneeScolaireId: classeAnnee.anneeScolaireId,
                        etablissementId,
                        genereAutomatiquement: true,
                    });
                    creneau.affectationMatiere = affectation;
                    creneauxGenerees.push(creneau);

                    // Mettre à jour les compteurs
                    const keyCJ = `${classeAnneeId}:${placement.jour}`;
                    creneauxParClasseJour.set(keyCJ, (creneauxParClasseJour.get(keyCJ) || 0) + 1);

                    const keyMJ = `${matiereId}:${placement.jour}`;
                    matiereParJour.set(keyMJ, (matiereParJour.get(keyMJ) || 0) + 1);

                    const enseignantIds = [affectation.enseignantId, ...(affectation.coEnseignantIds || [])].filter(Boolean);
                    enseignantOccupations.push({
                        enseignantIds,
                        jour: placement.jour,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                    });
                } else {
                    conflits.push(
                        `Impossible de placer ${affectation.matiere?.nom || 'Matière'} (séance ${i + 1}/${nombreCreneaux})`,
                    );
                }
            }
        }

        if (creneauxGenerees.length > 0) {
            await this.creneauRepo.save(creneauxGenerees);
        }

        const success = conflits.length === 0;
        return {
            success,
            message: success
                ? `Emploi du temps généré : ${creneauxGenerees.length} créneaux`
                : `Génération partielle : ${creneauxGenerees.length} créneaux, ${conflits.length} conflits`,
            nombreCreneaux: creneauxGenerees.length,
            conflits,
            avertissements,
        };
    }

    // ─── Préférences ───────────────────────────────────────────

    async getPreferences(etablissementId: string): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({ where: { etablissementId } });
        if (!preferences) {
            preferences = this.preferenceRepo.create({ etablissementId });
            await this.preferenceRepo.save(preferences);
        }
        return preferences;
    }

    async updatePreferences(etablissementId: string, dto: PreferenceEmploiDuTempsDto): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({ where: { etablissementId } });
        if (!preferences) preferences = this.preferenceRepo.create({ etablissementId });
        Object.assign(preferences, dto);
        await this.preferenceRepo.save(preferences);
        return preferences;
    }

    // ─── Méthodes privées — Générateur contraint ───────────────

    private estDansPause(heure: string, pauseDebut?: string, pauseFin?: string): boolean {
        if (!pauseDebut || !pauseFin) return false;
        return heure >= pauseDebut && heure < pauseFin;
    }

    private estImposable(heure: string, heureFin: string, jour: string, creneauxImposables?: Array<{ jour: string; heureDebut: string; heureFin: string }>): boolean {
        if (!creneauxImposables?.length) return false;
        return creneauxImposables.some(ci =>
            ci.jour === jour && ci.heureDebut < heureFin && ci.heureFin > heure,
        );
    }

    private enseignantLibre(
        affectation: AffectationMatiere,
        jour: string,
        heureDebut: string,
        heureFin: string,
        occupations: Array<{ enseignantIds: string[]; jour: string; heureDebut: string; heureFin: string }>,
    ): boolean {
        const enseignantIds = [affectation.enseignantId, ...(affectation.coEnseignantIds || [])].filter(Boolean);
        return !occupations.some(occ => {
            if (occ.jour !== jour) return false;
            const chevauche = occ.heureDebut < heureFin && occ.heureFin > heureDebut;
            if (!chevauche) return false;
            return enseignantIds.some(id => occ.enseignantIds.includes(id));
        });
    }

    private async trouverMeilleurCreneau(
        preferences: PreferenceEmploiDuTemps,
        affectation: AffectationMatiere,
        jours: string[],
        dureeCreneau: number,
        creneauxParClasseJour: Map<string, number>,
        matiereParJour: Map<string, number>,
        enseignantOccupations: Array<{ enseignantIds: string[]; jour: string; heureDebut: string; heureFin: string }>,
        creneauxGenerees: CreneauHoraire[],
        classeAnneeId: string,
        matiereId: string,
    ): { jour: string; heureDebut: string; heureFin: string; salleId?: string } | null {
        const maxParJour = preferences.maxCreneauxParJour || 8;
        const maxMatiereParJour = preferences.maxCreneauxMatiereParJour || 2;
        const heureDebutCours = preferences.heureDebutCours || '07:30';
        const heureFinCours = preferences.heureFinCours || '17:00';

        // Calculer le nombre de jours où cette matière est déjà placée
        const joursAvecMatiere = new Set<string>();
        for (const j of jours) {
            if ((matiereParJour.get(`${matiereId}:${j}`) || 0) > 0) {
                joursAvecMatiere.add(j);
            }
        }

        // Tri des jours : privilégier les jours sans cette matière (répartition équilibrée)
        const joursTries = preferences.repartitionEquilibree
            ? [...jours].sort((a, b) => {
                const aMatiere = joursAvecMatiere.has(a) ? 1 : 0;
                const bMatiere = joursAvecMatiere.has(b) ? 1 : 0;
                if (aMatiere !== bMatiere) return aMatiere - bMatiere;
                const aCount = creneauxParClasseJour.get(`${classeAnneeId}:${a}`) || 0;
                const bCount = creneauxParClasseJour.get(`${classeAnneeId}:${b}`) || 0;
                return aCount - bCount;
            })
            : jours;

        for (const jour of joursTries) {
            const keyCJ = `${classeAnneeId}:${jour}`;
            if ((creneauxParClasseJour.get(keyCJ) || 0) >= maxParJour) continue;

            const keyMJ = `${matiereId}:${jour}`;
            if ((matiereParJour.get(keyMJ) || 0) >= maxMatiereParJour) continue;

            let heure = heureDebutCours;
            while (heure < heureFinCours) {
                const [h, m] = heure.split(':').map(Number);
                const finMin = h * 60 + m + dureeCreneau;
                const heureFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

                if (finMin > this.heureToMinutes(heureFinCours)) break;

                // Vérifier les pauses
                if (
                    this.estDansPause(heure, preferences.pauseMatineeDebut, preferences.pauseMatineeFin) ||
                    this.estDansPause(heure, preferences.pauseDebut, preferences.pauseFin) ||
                    this.estDansPause(heure, preferences.pauseApresMidiDebut, preferences.pauseApresMidiFin)
                ) {
                    const pauseFin = this.getPauseFin(heure, preferences);
                    if (pauseFin) { heure = pauseFin; continue; }
                }

                // Vérifier créneaux imposables
                if (this.estImposable(heure, heureFin, jour, preferences.creneauxImposables)) {
                    heure = heureFin;
                    continue;
                }

                // Vérifier disponibilité enseignant
                if (!this.enseignantLibre(affectation, jour, heure, heureFin, enseignantOccupations)) {
                    heure = heureFin;
                    continue;
                }

                // Trouver une salle disponible
                let salleId: string | undefined;
                try {
                    const salles = await salleAvailabilityService.trouverSallesDisponibles(
                        affectation.etablissementId,
                        { jour, heureDebut: heure, heureFin },
                    );
                    salleId = salles[0]?.id;
                } catch { /* pas de salle */ }

                return { jour, heureDebut: heure, heureFin, salleId };
            }
        }
        return null;
    }

    private trouverCreneauLibre(
        preferences: PreferenceEmploiDuTemps,
        jours: string[],
        dureeCreneau: number,
        creneauxParClasseJour: Map<string, number>,
        enseignantOccupations: Array<{ enseignantIds: string[]; jour: string; heureDebut: string; heureFin: string }>,
        affectation: AffectationMatiere,
        classeAnneeId: string,
    ): { jour: string; heureDebut: string; heureFin: string; salleId?: string } | null {
        const heureDebutCours = preferences.heureDebutCours || '07:30';
        const heureFinCours = preferences.heureFinCours || '17:00';

        for (const jour of jours) {
            let heure = heureDebutCours;
            while (heure < heureFinCours) {
                const [h, m] = heure.split(':').map(Number);
                const finMin = h * 60 + m + dureeCreneau;
                const heureFin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`;

                if (finMin > this.heureToMinutes(heureFinCours)) break;

                if (!this.enseignantLibre(affectation, jour, heure, heureFin, enseignantOccupations)) {
                    heure = heureFin;
                    continue;
                }

                return { jour, heureDebut: heure, heureFin, salleId: undefined };
            }
        }
        return null;
    }

    private heureToMinutes(heure: string): number {
        const [h, m] = heure.split(':').map(Number);
        return h * 60 + m;
    }

    private getPauseFin(heure: string, preferences: PreferenceEmploiDuTemps): string | null {
        if (this.estDansPause(heure, preferences.pauseMatineeDebut, preferences.pauseMatineeFin)) return preferences.pauseMatineeFin!;
        if (this.estDansPause(heure, preferences.pauseDebut, preferences.pauseFin)) return preferences.pauseFin!;
        if (this.estDansPause(heure, preferences.pauseApresMidiDebut, preferences.pauseApresMidiFin)) return preferences.pauseApresMidiFin!;
        return null;
    }
}

export const emploiDuTempsService = new EmploiDuTempsService();
