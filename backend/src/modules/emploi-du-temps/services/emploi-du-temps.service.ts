/**
 * ==================================
 * eLISAschool - Service Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * CRUD et génération automatique d'emploi du temps
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    CreerCreneauDto,
    GenererEmploiDuTempsDto,
    PreferenceEmploiDuTempsDto,
    CreateRepartitionHoraireDto,
    UpdateRepartitionHoraireDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { EmploiDuTemps, PreferenceEmploiDuTemps, RepartitionHoraire, JourSemaine, TypeCreneau } from '../entities';

export class EmploiDuTempsService {
    private repo: Repository<EmploiDuTemps>;
    private preferenceRepo: Repository<PreferenceEmploiDuTemps>;
    private repartitionRepo: Repository<RepartitionHoraire>;

    constructor() {
        this.repo = AppDataSource.getRepository(EmploiDuTemps);
        this.preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
        this.repartitionRepo = AppDataSource.getRepository(RepartitionHoraire);
    }

    async creerCreneau(dto: CreerCreneauDto, anneeScolaireId: string): Promise<EmploiDuTemps> {
        const creneau = this.repo.create({
            classeId: dto.classeId,
            matiereId: dto.matiereId,
            enseignantId: dto.enseignantId,
            salleId: dto.salleId,
            jour: dto.jour as JourSemaine,
            heureDebut: dto.heureDebut,
            heureFin: dto.heureFin,
            typeCreneau: (dto.typeCreneau || 'COURS') as TypeCreneau,
            couleur: dto.couleur || undefined, // Convertir null en undefined pour TypeORM
            notes: dto.notes,
            anneeScolaireId,
            genereAutomatiquement: false,
            actif: true,
        });

        await this.repo.save(creneau);
        logger.info(`[EmploiDuTemps] Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`);

        return creneau;
    }

    async findByClasseAnnee(classeAnneeId: string): Promise<EmploiDuTemps[]> {
        return this.repo.find({
            where: {
                classeAnneeId,
                actif: true,
            },
            relations: ['matiere', 'enseignant', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'salle'],
            order: {
                jour: 'ASC',
                heureDebut: 'ASC',
            },
        });
    }

    async findByEnseignant(enseignantId: string, anneeScolaireId: string): Promise<EmploiDuTemps[]> {
        return this.repo.find({
            where: {
                enseignantId,
                actif: true,
            },
            relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'matiere', 'salle'],
            order: {
                jour: 'ASC',
                heureDebut: 'ASC',
            },
        }).then(creneaux => 
            // Filtrer par année scolaire côté JS (car pas de filtre direct)
            creneaux.filter(c => c.classeAnnee?.anneeScolaireId === anneeScolaireId)
        );
    }

    async genererEmploiDuTemps(dto: GenererEmploiDuTempsDto): Promise<{
        success: boolean;
        message: string;
        nombreCreneaux: number;
        conflits: string[];
    }> {
        const { classeAnneeId, etablissementId, options } = dto;

        // 1. Charger les préférences
        const preferences = await this.getPreferences(etablissementId);

        // 2. Si régénération, supprimer l'ancien emploi du temps
        if (options?.regenerer) {
            const deleted = await this.repo.delete({ classeAnneeId });
            logger.info(`[EmploiDuTemps] ${deleted.affected} créneaux supprimés pour régénération`);
        }

        // 3. Charger les affectations de matières de la classe
        const affectationsRepo = AppDataSource.getRepository(AffectationMatiere);
        const affectations = await affectationsRepo.find({
            where: { 
                classeId, 
                anneeScolaireId, 
                statut: StatutAffectationMatiere.ACTIVE // Enum correct
            },
            relations: ['matiere', 'enseignant'],
        });

        if (affectations.length === 0) {
            throw new AppError('Aucune affectation de matière trouvée pour cette classe', 400, 'NO_AFFECTATIONS');
        }

        // 4. Initialiser le plan de la semaine
        const plan = this.creerPlanVide(preferences);
        const creneauxGenerees: EmploiDuTemps[] = [];
        const conflits: string[] = [];

        // 5. Générer les créneaux pour chaque matière
        for (const affectation of affectations) {
            const volumeHebdo = affectation.volumeHoraireHebdo || 2;
            const dureeCreneau = preferences.dureeCreneauDefaut || 60;

            for (let i = 0; i < volumeHebdo; i++) {
                const placement = this.trouverCreneauDisponible(
                    plan,
                    preferences,
                    affectation,
                    creneauxGenerees,
                    options?.respecterContraintes ?? true
                );

                if (placement) {
                    // Créer le créneau
                    const creneau = this.repo.create({
                        classeId,
                        matiereId: affectation.matiereId,
                        enseignantId: affectation.enseignantId,
                        salleId: placement.salleId,
                        jour: placement.jour as JourSemaine,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                        typeCreneau: TypeCreneau.COURS, // Utiliser l'enum
                        anneeScolaireId,
                        genereAutomatiquement: true,
                        actif: true,
                    });

                    creneauxGenerees.push(creneau);

                    // Marquer le créneau comme occupé dans le plan
                    this.marquerCreneauOccupe(plan, placement, affectation);
                } else {
                    conflits.push(
                        `Impossible de placer ${affectation.matiere?.nom || 'Matière'} (séance ${i + 1}/${volumeHebdo})`
                    );
                }
            }
        }

        // 6. Sauvegarder tous les créneaux
        if (creneauxGenerees.length > 0) {
            await this.repo.save(creneauxGenerees);
            logger.info(`[EmploiDuTemps] ${creneauxGenerees.length} créneaux générés pour la classe ${classeId}`);
        }

        const success = conflits.length === 0;
        const message = success
            ? `Emploi du temps généré avec succès : ${creneauxGenerees.length} créneaux`
            : `Génération partielle : ${creneauxGenerees.length} créneaux placés, ${conflits.length} conflits`;

        return {
            success,
            message,
            nombreCreneaux: creneauxGenerees.length,
            conflits,
        };
    }

    // ==========================================
    // Méthodes privées pour la génération automatique
    // ==========================================

    private creerPlanVide(preferences: PreferenceEmploiDuTemps): any {
        const plan: any = {};
        const jours = preferences.joursTravailles || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const heureDebut = preferences.heureDebutCours || '07:00';
        const heureFin = preferences.heureFinCours || '17:00';

        for (const jour of jours) {
            plan[jour] = {};
            let heure = heureDebut;

            while (heure < heureFin) {
                plan[jour][heure] = {
                    occupe: false,
                    enseignantId: null,
                    matiereId: null,
                };

                const [h, m] = heure.split(':').map(Number);
                const nouvelleHeure = new Date();
                nouvelleHeure.setHours(h, m + (preferences.dureeCreneauDefaut || 60), 0, 0);
                heure = `${String(nouvelleHeure.getHours()).padStart(2, '0')}:${String(nouvelleHeure.getMinutes()).padStart(2, '0')}`;
            }
        }

        return plan;
    }

    private trouverCreneauDisponible(
        plan: any,
        preferences: PreferenceEmploiDuTemps,
        affectation: any,
        creneauxExistants: EmploiDuTemps[],
        respecterContraintes: boolean
    ): { jour: string; heureDebut: string; heureFin: string; salleId?: string } | null {
        const jours = preferences.joursTravailles || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const dureeCreneau = preferences.dureeCreneauDefaut || 60;
        const enseignantId = affectation.enseignantId;

        // Vérifier les préférences de jours pour cette matière
        const joursPreferes = affectation.matiere?.joursPreferences || jours;

        // Parcourir les jours
        for (const jour of joursPreferes) {
            if (!plan[jour]) continue;

            // Parcourir les créneaux horaires
            const creneaux = Object.keys(plan[jour]).sort();

            for (let i = 0; i < creneaux.length; i++) {
                const heureDebut = creneaux[i];

                // Vérifier si le créneau est libre
                if (plan[jour][heureDebut].occupe) continue;

                // Vérifier la disponibilité de l'enseignant
                if (respecterContraintes && !this.enseignantDisponible(
                    enseignantId,
                    jour,
                    heureDebut,
                    creneauxExistants
                )) {
                    continue;
                }

                // Calculer l'heure de fin
                const [h, m] = heureDebut.split(':').map(Number);
                const heureFinDate = new Date();
                heureFinDate.setHours(h, m + dureeCreneau, 0, 0);
                const heureFin = `${String(heureFinDate.getHours()).padStart(2, '0')}:${String(heureFinDate.getMinutes()).padStart(2, '0')}`;

                // Vérifier que tous les sous-créneaux sont libres
                let tousLibres = true;
                for (let j = i; j < creneaux.length && creneaux[j] < heureFin; j++) {
                    if (plan[jour][creneaux[j]].occupe) {
                        tousLibres = false;
                        break;
                    }
                }

                if (tousLibres) {
                    return { jour, heureDebut, heureFin };
                }
            }
        }

        return null;
    }

    private enseignantDisponible(
        enseignantId: string,
        jour: string,
        heureDebut: string,
        creneauxExistants: EmploiDuTemps[]
    ): boolean {
        // Vérifier dans les créneaux déjà générés
        for (const creneau of creneauxExistants) {
            if (creneau.enseignantId === enseignantId && creneau.jour === jour) {
                // Vérifier s'il y a overlap
                if (
                    (heureDebut >= creneau.heureDebut && heureDebut < creneau.heureFin) ||
                    (creneau.heureDebut >= heureDebut && creneau.heureDebut < this.calculerHeureFin(heureDebut, 60))
                ) {
                    return false;
                }
            }
        }

        // Vérifier dans la base de données
        const conflict = creneauxExistants.find(c =>
            c.enseignantId === enseignantId &&
            c.jour === jour &&
            this.yaOverlap(c.heureDebut, c.heureFin, heureDebut, this.calculerHeureFin(heureDebut, 60))
        );

        return !conflict;
    }

    private yaOverlap(debut1: string, fin1: string, debut2: string, fin2: string): boolean {
        return debut1 < fin2 && debut2 < fin1;
    }

    private calculerHeureFin(heureDebut: string, dureeMinutes: number): string {
        const [h, m] = heureDebut.split(':').map(Number);
        const finDate = new Date();
        finDate.setHours(h, m + dureeMinutes, 0, 0);
        return `${String(finDate.getHours()).padStart(2, '0')}:${String(finDate.getMinutes()).padStart(2, '0')}`;
    }

    private marquerCreneauOccupe(plan: any, placement: any, affectation: any): void {
        const dureeCreneau = 60; // minutes
        let heure = placement.heureDebut;

        while (heure < placement.heureFin) {
            if (plan[placement.jour][heure]) {
                plan[placement.jour][heure].occupe = true;
                plan[placement.jour][heure].enseignantId = affectation.enseignantId;
                plan[placement.jour][heure].matiereId = affectation.matiereId;
            }

            const [h, m] = heure.split(':').map(Number);
            const nouvelleHeure = new Date();
            nouvelleHeure.setHours(h, m + dureeCreneau, 0, 0);
            heure = `${String(nouvelleHeure.getHours()).padStart(2, '0')}:${String(nouvelleHeure.getMinutes()).padStart(2, '0')}`;
        }
    }

    async supprimerCreneau(id: string): Promise<void> {
        const creneau = await this.repo.findOne({ where: { id } });
        if (!creneau) {
            throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');
        }

        await this.repo.remove(creneau);
        logger.info(`[EmploiDuTemps] Créneau supprimé: ${id}`);
    }

    async getPreferences(etablissementId: string): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({
            where: { etablissementId },
        });

        if (!preferences) {
            preferences = this.preferenceRepo.create({ etablissementId });
            await this.preferenceRepo.save(preferences);
        }

        return preferences;
    }

    async updatePreferences(
        etablissementId: string,
        dto: PreferenceEmploiDuTempsDto
    ): Promise<PreferenceEmploiDuTemps> {
        let preferences = await this.preferenceRepo.findOne({
            where: { etablissementId },
        });

        if (!preferences) {
            // Créer avec valeurs par défaut
            preferences = this.preferenceRepo.create({ 
                etablissementId,
            });
        }
        
        // Appliquer le DTO
        Object.assign(preferences, dto);
        await this.preferenceRepo.save(preferences);
        return preferences;
    }

    // ==================================
    // Méthodes pour Répartition Horaire
    // ==================================

    async findRepartitions(filters: {
        etablissementId?: string;
        affectationId?: string;
        jourSemaine?: string;
    }): Promise<RepartitionHoraire[]> {
        const where: any = {};
        
        if (filters.etablissementId) where.etablissementId = filters.etablissementId;
        if (filters.affectationId) where.affectationId = filters.affectationId;
        if (filters.jourSemaine) where.jourSemaine = filters.jourSemaine;
        
        return this.repartitionRepo.find({
            where,
            relations: ['affectation', 'affectation.matiere', 'affectation.enseignant', 'affectation.classe'],
            order: {
                jourSemaine: 'ASC',
                heureDebut: 'ASC',
            },
        });
    }

    async createRepartition(dto: CreateRepartitionHoraireDto, etablissementId?: string): Promise<RepartitionHoraire> {
        const repartition = this.repartitionRepo.create({
            ...dto,
            etablissementId,
            jourSemaine: dto.jourSemaine as any, // Cast car l'enum est compatible
        });

        await this.repartitionRepo.save(repartition);
        logger.info(`[RepartitionHoraire] Créée: ${dto.jourSemaine} ${dto.heureDebut}-${dto.heureFin}`);

        return repartition;
    }

    async createRepartitionsBatch(
        dtos: CreateRepartitionHoraireDto[],
        etablissementId?: string
    ): Promise<RepartitionHoraire[]> {
        const repartitions = dtos.map(dto =>
            this.repartitionRepo.create({
                ...dto,
                etablissementId,
                jourSemaine: dto.jourSemaine as any, // Cast car l'enum est compatible
            })
        );

        await this.repartitionRepo.save(repartitions);
        logger.info(`[RepartitionHoraire] ${repartitions.length} répartitions créées en batch`);

        return repartitions;
    }

    async getRepartition(id: string): Promise<RepartitionHoraire> {
        const repartition = await this.repartitionRepo.findOne({
            where: { id },
            relations: ['affectation', 'affectation.matiere', 'affectation.enseignant', 'affectation.classe'],
        });

        if (!repartition) {
            throw new AppError('Répartition horaire non trouvée', 404, 'NOT_FOUND');
        }

        return repartition;
    }

    async updateRepartition(id: string, dto: UpdateRepartitionHoraireDto): Promise<RepartitionHoraire> {
        const repartition = await this.getRepartition(id);

        Object.assign(repartition, dto);
        await this.repartitionRepo.save(repartition);

        logger.info(`[RepartitionHoraire] Modifiée: ${id}`);
        return repartition;
    }

    async deleteRepartition(id: string): Promise<void> {
        const repartition = await this.getRepartition(id);

        await this.repartitionRepo.remove(repartition);
        logger.info(`[RepartitionHoraire] Supprimée: ${id}`);
    }
}

export const emploiDuTempsService = new EmploiDuTempsService();
