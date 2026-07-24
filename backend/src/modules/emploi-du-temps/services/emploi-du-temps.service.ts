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

        const creneau = this.creneauRepo.create({
            affectationMatiereId: dto.affectationMatiereId,
            salleId: dto.salleId || undefined,
            jour: dto.jour as JourSemaine,
            heureDebut: dto.heureDebut,
            heureFin: dto.heureFin,
            typeCreneau: (dto.typeCreneau || TypeCreneau.COURS) as TypeCreneau,
            statut: (dto.statut || StatutCreneau.PLANIFIE) as StatutCreneau,
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
        });
        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const affectationsRepo = AppDataSource.getRepository(AffectationMatiere);
        const affectations = await affectationsRepo.find({
            where: {
                classeAnneeId,
                etablissementId,
                statut: StatutAffectationMatiere.ACTIVE,
            },
            relations: ['matiere', 'enseignant'],
        });

        if (affectations.length === 0) {
            return { success: true, message: 'Aucune affectation trouvée. EDT vide.', nombreCreneaux: 0, conflits: [], avertissements: [] };
        }

        // Résoudre les volumes horaires depuis MatiereNiveau (source unique)
        const matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
        const creneauxGenerees: CreneauHoraire[] = [];
        const conflits: string[] = [];
        const avertissements: string[] = [];

        for (const affectation of affectations) {
            const matiereNiveau = await matiereNiveauRepo.findOne({
                where: { matiereId: affectation.matiereId, niveauId: classeAnnee.niveauId ?? '' },
            });
            const volumeHebdo = matiereNiveau?.volumeHoraire || 2;

            for (let i = 0; i < volumeHebdo; i++) {
                const placement = await this.trouverCreneauDisponible(
                    preferences, affectation, creneauxGenerees,
                    options?.respecterContraintes ?? true,
                );

                if (placement) {
                    const creneau = this.creneauRepo.create({
                        affectationMatiereId: affectation.id,
                        salleId: placement.salleId,
                        jour: placement.jour as JourSemaine,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                        typeCreneau: TypeCreneau.COURS,
                        statut: StatutCreneau.PLANIFIE,
                        anneeScolaireId: classeAnnee.anneeScolaireId,
                        etablissementId,
                        genereAutomatiquement: true,
                    });
                    creneauxGenerees.push(creneau);
                } else {
                    conflits.push(
                        `Impossible de placer ${affectation.matiere?.nom || 'Matière'} (séance ${i + 1}/${volumeHebdo})`
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

    // ─── Méthodes privées ──────────────────────────────────────

    private async trouverCreneauDisponible(
        preferences: PreferenceEmploiDuTemps,
        affectation: AffectationMatiere,
        creneauxExistants: CreneauHoraire[],
        respecterContraintes: boolean,
    ): Promise<{ jour: string; heureDebut: string; heureFin: string; salleId?: string } | null> {
        const jours = preferences.joursOuvrables || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const dureeCreneau = preferences.dureeCreneauStandard || 55;
        const heureDebutCours = preferences.heureDebutCours || '07:00';
        const heureFinCours = preferences.heureFinCours || '17:00';

        for (const jour of jours) {
            let heure = heureDebutCours;
            while (heure < heureFinCours) {
                const [h, m] = heure.split(':').map(Number);
                const finDate = new Date();
                finDate.setHours(h, m + dureeCreneau, 0, 0);
                const heureFin = `${String(finDate.getHours()).padStart(2, '0')}:${String(finDate.getMinutes()).padStart(2, '0')}`;

                if (heureFin > heureFinCours) break;

                if (respecterContraintes) {
                    const enseignantOccupe = creneauxExistants.some(c => {
                        const ensId = c.affectationMatiere?.enseignantId;
                        return ensId === affectation.enseignantId
                            && c.jour === jour
                            && c.heureDebut < heureFin
                            && c.heureFin > heure;
                    });
                    if (enseignantOccupe) {
                        heure = heureFin;
                        continue;
                    }
                }

                const estImposable = (preferences.creneauxImposables || []).some(ci =>
                    ci.jour === jour && ci.heureDebut < heureFin && ci.heureFin > heure
                );
                if (estImposable) {
                    heure = heureFin;
                    continue;
                }

                let salleId: string | undefined;
                try {
                    const salles = await salleAvailabilityService.trouverSallesDisponibles(
                        affectation.etablissementId,
                        { jour, heureDebut: heure, heureFin },
                    );
                    salleId = salles[0]?.id;
                } catch { /* pas de salle disponible */ }

                return { jour, heureDebut: heure, heureFin, salleId };
            }
        }
        return null;
    }
}

export const emploiDuTempsService = new EmploiDuTempsService();
