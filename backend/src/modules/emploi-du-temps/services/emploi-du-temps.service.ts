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
import { coefficientResolverService } from '@modules/matieres/services/coefficient-resolver.service';
import { salleAvailabilityService } from '@modules/salles/services/salle-availability.service';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { CreneauHoraire, PreferenceEmploiDuTemps, JourSemaine, TypeCreneau, StatutCreneau } from '../entities';
import { TemplateEmploiDuTemps } from '../entities/template-emploi-du-temps.entity';
import { conflitDetectionService } from './conflit-detection.service';
import {
    heureCoursService,
    ChangementsPropagation,
    RapportPropagation,
} from '@modules/personnel/services';
import { Request } from 'express';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class EmploiDuTempsService {
    private creneauRepo: Repository<CreneauHoraire>;
    private preferenceRepo: Repository<PreferenceEmploiDuTemps>;

    constructor() {
        this.creneauRepo = AppDataSource.getRepository(CreneauHoraire);
        this.preferenceRepo = AppDataSource.getRepository(PreferenceEmploiDuTemps);
    }

    // ─── CRUD CreneauHoraire ───────────────────────────────────

    async findAll(query: QueryCreneauxDto, etablissementId: string) {
        // Jointures sélectives : charger uniquement les relations nécessaires
        // - am + matiere + enseignant (+ utilisateur) + classeAnnee + classe : TOUJOURS (affichage frontend)
        // - salle : seulement si filtre salleId (économie d'1 JOIN dans le cas nominal)
        // - anneeScolaire : JAMAIS (le frontend EDT n'affiche pas le libellé année scolaire)
        const qb = this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('enseignant.utilisateur', 'enseignant_utilisateur')
            .leftJoinAndSelect('enseignant_utilisateur.profil', 'enseignant_profil')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('ch.salle', 'salle')
            // Badge HC : sous-requête EXISTS pour savoir si des instances HeureCours existent
            .addSelect(
                `EXISTS (SELECT 1 FROM heures_cours hc WHERE hc."creneauId" = ch.id AND hc."deletedAt" IS NULL)`,
                'ch_hasHeuresCours',
            )
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

        // Pagination manuelle avec getRawAndEntities pour mapper le champ virtuel hasHeuresCours
        qb.skip((query.page - 1) * query.limit).take(query.limit);
        const { entities, raw } = await qb.getRawAndEntities();
        const total = await qb.getCount();

        // Mapper le champ virtuel hasHeuresCours depuis les résultats raw
        const items = entities.map((entity, idx) => {
            const r = raw[idx];
            (entity as any).hasHeuresCours = r?.ch_hasHeuresCours === true || r?.ch_hasHeuresCours === 't' || r?.ch_hasHeuresCours === 1;
            return entity;
        });

        const meta = calculatePaginationMeta(total, query.page, query.limit, items.length);
        return { items, meta };
    }

    async findOne(id: string, etablissementId: string): Promise<CreneauHoraire> {
        const creneau = await this.creneauRepo.findOne({
            where: { id, etablissementId },
            relations: [
                'affectationMatiere',
                'affectationMatiere.matiere',
                'affectationMatiere.enseignant',
                'affectationMatiere.enseignant.utilisateur',
                'affectationMatiere.enseignant.utilisateur.profil',
                'affectationMatiere.classeAnnee',
                'affectationMatiere.classeAnnee.classe',
                'affectationMatiere.classeAnnee.anneeScolaire',
                'salle',
            ],
        });
        if (!creneau) throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');
        return creneau;
    }

    async creerCreneau(dto: CreerCreneauDto, etablissementId: string, createurId?: string, req?: Request): Promise<CreneauHoraire> {
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
            genereAutomatiquement: dto.genereAutomatiquement ?? true,
        });

        await this.creneauRepo.save(creneau);
        logger.info(`[CreneauHoraire] Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.CRENEAU_CREATE,
                cible: 'CreneauHoraire',
                cibleId: creneau.id,
                description: `Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`,
                module: 'emploi-du-temps',
            }, req);
        }

        return this.findOne(creneau.id, etablissementId);
    }

    async updateCreneau(
        id: string,
        dto: ModifierCreneauDto,
        etablissementId: string,
        userId?: string,
        req?: Request,
    ): Promise<{ creneau: CreneauHoraire; rapport?: RapportPropagation }> {
        // P0-2 : transaction unique pour créneau + propagation → atomicité garantie
        const queryRunner = this.creneauRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let resultat: { creneau: CreneauHoraire; rapport?: RapportPropagation } | undefined;

        try {
            const mgr = queryRunner.manager;

            // Chargement transactionnel avec toutes les relations nécessaires
            const creneau = await mgr.findOne(CreneauHoraire, {
                where: { id, etablissementId },
                relations: [
                    'affectationMatiere',
                    'affectationMatiere.matiere',
                    'affectationMatiere.enseignant',
                    'affectationMatiere.enseignant.utilisateur',
                    'affectationMatiere.enseignant.utilisateur.profil',
                    'affectationMatiere.classeAnnee',
                    'affectationMatiere.classeAnnee.classe',
                    'affectationMatiere.classeAnnee.anneeScolaire',
                    'salle',
                ],
            });
            if (!creneau) throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');

            // Le flag de propagation ne doit pas être écrit sur l'entité
            const { propagerForce, ...champs } = dto;

            // Vérifier les conflits si les champs critiques changent
            const nouveauJour = (champs.jour || creneau.jour) as JourSemaine;
            const nouveauDebut = champs.heureDebut || creneau.heureDebut;
            const nouveauFin = champs.heureFin || creneau.heureFin;
            const nouvelleSalle = champs.salleId !== undefined ? champs.salleId : creneau.salleId;
            const nouvelleAffectation = champs.affectationMatiereId || creneau.affectationMatiereId;

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

            // Changements à propager aux instances futures PLANIFIE (Q2)
            const changements: ChangementsPropagation = {};
            if (champs.jour) changements.jour = champs.jour as JourSemaine;
            if (champs.heureDebut) changements.heureDebut = champs.heureDebut;
            if (champs.heureFin) changements.heureFin = champs.heureFin;
            if (champs.salleId !== undefined) changements.salleId = champs.salleId;
            if (champs.typeCreneau) changements.typeCreneau = champs.typeCreneau as TypeCreneau;

            let rapport: RapportPropagation | undefined;
            const aPropager = Object.keys(changements).length > 0;

            if (aPropager) {
                // Q5 : pré-validation (dry-run) AVANT toute écriture — dans la transaction
                rapport = await heureCoursService.propagerModificationCreneau(
                    creneau,
                    changements,
                    etablissementId,
                    { dryRun: true, force: propagerForce, manager: mgr },
                );
                if (rapport.conflits.length > 0 && !propagerForce) {
                    throw new AppError(
                        `${rapport.conflits.length} instance(s) future(s) en conflit après propagation — utilisez propagerForce pour les exclure`,
                        409,
                        'CONFLITS_PROPAGATION',
                        true,
                        { rapport },
                    );
                }
            }

            Object.assign(creneau, champs);
            await mgr.save(creneau);

            if (aPropager) {
                rapport = await heureCoursService.propagerModificationCreneau(
                    creneau,
                    changements,
                    etablissementId,
                    { force: propagerForce, createurId: userId, req, manager: mgr },
                );
            }

            await queryRunner.commitTransaction();

            logger.info(`[CreneauHoraire] Créneau modifié: ${id}`);
            // Recharger hors transaction pour retourner les données à jour
            resultat = { creneau: await this.findOne(id, etablissementId), rapport };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        if (userId && resultat) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.CRENEAU_UPDATE,
                cible: 'CreneauHoraire',
                cibleId: id,
                description: resultat.rapport
                    ? `Créneau modifié (propagation: ${resultat.rapport.instancesQuiSuivent} instance(s), ${resultat.rapport.instancesInchangees} inchangée(s), ${resultat.rapport.conflits.length} en conflit)`
                    : 'Créneau modifié',
                module: 'emploi-du-temps',
            }, req);
        }
        return resultat!;
    }

    async supprimerCreneau(id: string, etablissementId: string, userId?: string, req?: Request): Promise<{ instancesAnnulees: number }> {
        // P0-2 : transaction pour soft remove + annulation instances → atomicité
        const queryRunner = this.creneauRepo.manager.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let resultat: { instancesAnnulees: number } | undefined;

        try {
            const mgr = queryRunner.manager;
            const creneau = await mgr.findOne(CreneauHoraire, {
                where: { id, etablissementId },
                relations: ['affectationMatiere', 'salle'],
            });
            if (!creneau) throw new AppError('Créneau non trouvé', 404, 'NOT_FOUND');

            await mgr.softRemove(creneau);

            // Q2 : les instances futures PLANIFIE du créneau passent à ANNULE
            const instancesAnnulees = await heureCoursService.annulerInstancesCreneaux(
                [id],
                etablissementId,
                { motif: 'Créneau supprimé', createurId: userId, req, manager: mgr },
            );

            await queryRunner.commitTransaction();
            logger.info(`[CreneauHoraire] Créneau supprimé (soft): ${id}`);
            resultat = { instancesAnnulees };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }

        if (userId && resultat) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.CRENEAU_DELETE,
                cible: 'CreneauHoraire',
                cibleId: id,
                description: `Créneau supprimé (${resultat.instancesAnnulees} instance(s) future(s) annulée(s))`,
                module: 'emploi-du-temps',
            }, req);
        }
        return resultat!;
    }

    // ─── Workflow validation ────────────────────────────────────

    async validerCreneau(id: string, etablissementId: string, createurId?: string, req?: Request): Promise<CreneauHoraire> {
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

        // Q7 Canal A : matérialisation auto des instances semaine courante → S+1
        if (creneau.genereAutomatiquement) {
            const resultat = await heureCoursService.materialiserSemainesCourantes({
                etablissementId,
                creneauIds: [creneau.id],
            });
            if (resultat.created > 0) {
                logger.info(`[CreneauHoraire] Matérialisation auto après validation ${id}: ${resultat.created} instance(s)`);
            }
        }

        logger.info(`[CreneauHoraire] Créneau validé: ${id}`);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.CRENEAU_VALIDER,
                cible: 'CreneauHoraire',
                cibleId: id,
                description: 'Créneau validé',
                module: 'emploi-du-temps',
            }, req);
        }

        return this.findOne(id, etablissementId);
    }

    async validerCreneauxClasse(
        classeAnneeId: string,
        etablissementId: string,
        createurId?: string,
        req?: Request,
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

        // Q7 Canal A : matérialisation auto des créneaux à flag genereAutomatiquement
        const idsAuto = creneauxClasse
            .filter(c => c.genereAutomatiquement)
            .map(c => c.id);
        if (idsAuto.length > 0) {
            const resultat = await heureCoursService.materialiserSemainesCourantes({
                etablissementId,
                creneauIds: idsAuto,
                classeAnneeId,
            });
            if (resultat.created > 0) {
                logger.info(`[EDT] Matérialisation auto après validation classe ${classeAnneeId}: ${resultat.created} instance(s)`);
            }
        }

        logger.info(`[EDT] ${creneauxClasse.length} créneau(x) validé(s) pour classeAnnee ${classeAnneeId}`);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.EDT_VALIDER,
                cible: 'EmploiDuTemps',
                cibleId: classeAnneeId,
                description: `Validation en lot: ${creneauxClasse.length} créneau(x)`,
                module: 'emploi-du-temps',
            }, req);
        }

        return { valide: creneauxClasse.length, total: creneauxClasse.length };
    }

    // ─── Requêtes par contexte ─────────────────────────────────

    async findByClasseAnnee(classeAnneeId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('enseignant.utilisateur', 'enseignant_utilisateur')
            .leftJoinAndSelect('enseignant_utilisateur.profil', 'enseignant_profil')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('ch.salle', 'salle')
            .where('ch.etablissementId = :etablissementId', { etablissementId })
            .andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId })
            .orderBy('ch.jour', 'ASC')
            .addOrderBy('ch.heureDebut', 'ASC')
            .getMany();
    }

    async findByEnseignant(enseignantId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('enseignant.utilisateur', 'enseignant_utilisateur')
            .leftJoinAndSelect('enseignant_utilisateur.profil', 'enseignant_profil')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('ch.salle', 'salle')
            .where('ch.etablissementId = :etablissementId', { etablissementId })
            .andWhere('am.enseignantId = :enseignantId', { enseignantId })
            .orderBy('ch.jour', 'ASC')
            .addOrderBy('ch.heureDebut', 'ASC')
            .getMany();
    }

    async findBySalle(salleId: string, etablissementId: string): Promise<CreneauHoraire[]> {
        return this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('enseignant.utilisateur', 'enseignant_utilisateur')
            .leftJoinAndSelect('enseignant_utilisateur.profil', 'enseignant_profil')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .where('ch.etablissementId = :etablissementId', { etablissementId })
            .andWhere('ch.salleId = :salleId', { salleId })
            .orderBy('ch.jour', 'ASC')
            .addOrderBy('ch.heureDebut', 'ASC')
            .getMany();
    }

    // ─── Génération automatique ────────────────────────────────

    /**
     * Prévisualisation (dry-run) de la génération d'emploi du temps.
     * Exécute l'algorithme sans sauvegarder les créneaux en base.
     * Retourne les créneaux simulés + conflits détectés pour résolution interactive.
     */
    async previsualiserGeneration(
        dto: GenererEmploiDuTempsDto,
        etablissementId: string,
    ): Promise<{
        creneaux: Array<{
            affectationMatiereId: string;
            matiereNom: string;
            matiereCouleur: string | null;
            enseignantNom: string;
            jour: string;
            heureDebut: string;
            heureFin: string;
            salleId: string | null;
            salleNom: string | null;
            volumeMinutes: number;
            numeroSeance: number;
            totalSeances: number;
        }>;
        conflits: Array<{
            type: string;
            matiereNom: string;
            seance: string;
            message: string;
        }>;
        resume: {
            totalCreneaux: number;
            totalHeures: number;
            totalConflits: number;
            matieres: number;
            joursOccupes: string[];
        };
    }> {
        const { classeAnneeId, options } = dto;
        let preferences = await this.getPreferences(etablissementId);

        // Appliquer le template si fourni
        if (dto.templateId) {
            preferences = await this.appliquerTemplate(dto.templateId, preferences, etablissementId);
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
            relations: ['matiere', 'enseignant', 'enseignant.utilisateur', 'enseignant.utilisateur.profil'],
        });

        if (affectations.length === 0) {
            return {
                creneaux: [],
                conflits: [],
                resume: { totalCreneaux: 0, totalHeures: 0, totalConflits: 0, matieres: 0, joursOccupes: [] },
            };
        }

        const dureeCreneau = preferences.dureeCreneauStandard || 55;
        const jours = preferences.joursOuvrables || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const respecterContraintes = options?.respecterContraintes ?? true;

        // Charger les volumes horaires et trier par volume décroissant
        type AffectationAvecVolume = { affectation: AffectationMatiere; volumeMinutes: number; nombreCreneaux: number };
        const affectationsTriees: AffectationAvecVolume[] = [];

        for (const affectation of affectations) {
            const matiereNiveau = await coefficientResolverService.resoudreMatiereNiveau(
                affectation.matiereId,
                classeAnnee.classe?.niveauId ?? '',
                classeAnnee.classe?.filiereId,
            );
            const volumeMinutes = matiereNiveau?.volumeHoraire || 120;
            const nombreCreneaux = Math.ceil(volumeMinutes / dureeCreneau);
            affectationsTriees.push({ affectation, volumeMinutes, nombreCreneaux });
        }

        affectationsTriees.sort((a, b) => b.volumeMinutes - a.volumeMinutes);

        // Structures de suivi des contraintes (même logique que genererEmploiDuTemps)
        const creneauxParClasseJour = new Map<string, number>();
        const matiereParJour = new Map<string, number>();
        const enseignantOccupations: Array<{ enseignantIds: string[]; jour: string; heureDebut: string; heureFin: string }> = [];
        const creneauxSimules: CreneauHoraire[] = [];

        // Résultats pour le frontend
        const creneauxPreview: Array<{
            affectationMatiereId: string;
            matiereNom: string;
            matiereCouleur: string | null;
            enseignantNom: string;
            jour: string;
            heureDebut: string;
            heureFin: string;
            salleId: string | null;
            salleNom: string | null;
            volumeMinutes: number;
            numeroSeance: number;
            totalSeances: number;
        }> = [];
        const conflitsPreview: Array<{
            type: string;
            matiereNom: string;
            seance: string;
            message: string;
        }> = [];

        for (const { affectation, volumeMinutes, nombreCreneaux } of affectationsTriees) {
            const matiereId = affectation.matiereId;

            for (let i = 0; i < nombreCreneaux; i++) {
                const placement = respecterContraintes
                    ? await this.trouverMeilleurCreneau(
                        preferences, affectation, jours, dureeCreneau,
                        creneauxParClasseJour, matiereParJour, enseignantOccupations,
                        creneauxSimules, classeAnneeId, matiereId,
                    )
                    : this.trouverCreneauLibre(
                        preferences, jours, dureeCreneau,
                        creneauxParClasseJour, enseignantOccupations,
                        affectation, classeAnneeId,
                    );

                if (placement) {
                    // Créer un créneau simulé (non persisté)
                    const creneauSimule = this.creneauRepo.create({
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
                    creneauSimule.affectationMatiere = affectation;
                    creneauxSimules.push(creneauSimule);

                    // Ajouter au preview
                    creneauxPreview.push({
                        affectationMatiereId: affectation.id,
                        matiereNom: affectation.matiere?.nom || 'Matière',
                        matiereCouleur: affectation.matiere?.couleur || null,
                        enseignantNom: affectation.enseignant
                            ? `${(affectation.enseignant as any).prenom} ${(affectation.enseignant as any).nom}`
                            : '—',
                        jour: placement.jour,
                        heureDebut: placement.heureDebut,
                        heureFin: placement.heureFin,
                        salleId: placement.salleId || null,
                        salleNom: (placement as any).salleNom || null,
                        volumeMinutes,
                        numeroSeance: i + 1,
                        totalSeances: nombreCreneaux,
                    });

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
                    conflitsPreview.push({
                        type: 'PLACEMENT_IMPOSSIBLE',
                        matiereNom: affectation.matiere?.nom || 'Matière',
                        seance: `Séance ${i + 1}/${nombreCreneaux}`,
                        message: `Impossible de placer ${affectation.matiere?.nom || 'Matière'} (séance ${i + 1}/${nombreCreneaux})`,
                    });
                }
            }
        }

        const totalMinutes = creneauxPreview.reduce((sum, c) => {
            const [h1, m1] = c.heureDebut.split(':').map(Number);
            const [h2, m2] = c.heureFin.split(':').map(Number);
            return sum + ((h2 * 60 + m2) - (h1 * 60 + m1));
        }, 0);

        const joursOccupes = Array.from(new Set(creneauxPreview.map(c => c.jour))).sort();

        return {
            creneaux: creneauxPreview,
            conflits: conflitsPreview,
            resume: {
                totalCreneaux: creneauxPreview.length,
                totalHeures: totalMinutes / 60,
                totalConflits: conflitsPreview.length,
                matieres: affectationsTriees.length,
                joursOccupes,
            },
        };
    }

    async genererEmploiDuTemps(
        dto: GenererEmploiDuTempsDto,
        etablissementId: string,
        userId?: string,
        req?: Request,
    ): Promise<{
        success: boolean;
        message: string;
        nombreCreneaux: number;
        conflits: string[];
        avertissements: string[];
    }> {
        const { classeAnneeId, options } = dto;
        let preferences = await this.getPreferences(etablissementId);

        // Appliquer le template si fourni
        if (dto.templateId) {
            preferences = await this.appliquerTemplate(dto.templateId, preferences, etablissementId);
        }

        if (options?.regenerer) {
            // Récupérer les ids AVANT suppression (soft) pour annuler les instances liées
            const idsASupprimer: Array<{ id: string }> = await this.creneauRepo
                .createQueryBuilder('ch')
                .select('ch.id', 'id')
                .where('ch.affectationMatiereId IN (SELECT id FROM affectations_matieres WHERE "classeAnneeId" = :classeAnneeId)', { classeAnneeId })
                .andWhere('ch.etablissementId = :etablissementId', { etablissementId })
                .getRawMany();

            const ids = idsASupprimer.map(r => r.id);
            if (ids.length > 0) {
                await this.creneauRepo
                    .createQueryBuilder()
                    .softDelete()
                    .whereInIds(ids)
                    .execute();
                // Q2 : les instances futures PLANIFIE des créneaux régénérés passent à ANNULE
                await heureCoursService.annulerInstancesCreneaux(
                    ids,
                    etablissementId,
                    { motif: 'Régénération de l\'emploi du temps', createurId: userId, req },
                );
            }
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
            relations: ['matiere', 'enseignant', 'enseignant.utilisateur', 'enseignant.utilisateur.profil'],
        });

        if (affectations.length === 0) {
            return { success: true, message: 'Aucune affectation trouvée. EDT vide.', nombreCreneaux: 0, conflits: [], avertissements: [] };
        }

        const requireValidation = await getParamBoolean('emploi-du-temps.require_validation', { defaultValue: false });
        const statutGenere = requireValidation ? StatutCreneau.PLANIFIE : StatutCreneau.VALIDE;
        const dureeCreneau = preferences.dureeCreneauStandard || 55;
        const jours = preferences.joursOuvrables || ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        const respecterContraintes = options?.respecterContraintes ?? true;

        // Charger les volumes horaires (en minutes/semaine — source: MatiereNiveau.volumeHoraire)
        // et trier par volume décroissant (most constrained first)
        type AffectationAvecVolume = { affectation: AffectationMatiere; volumeMinutes: number; nombreCreneaux: number };
        const affectationsTriees: AffectationAvecVolume[] = [];

        for (const affectation of affectations) {
            const matiereNiveau = await coefficientResolverService.resoudreMatiereNiveau(
                affectation.matiereId,
                classeAnnee.classe?.niveauId ?? '',
                classeAnnee.classe?.filiereId,
            );
            // volumeHoraire est en minutes/semaine (défaut 120min = 2h si non défini)
            const volumeMinutes = matiereNiveau?.volumeHoraire || 120;
            const nombreCreneaux = Math.ceil(volumeMinutes / dureeCreneau);
            affectationsTriees.push({ affectation, volumeMinutes, nombreCreneaux });
        }

        affectationsTriees.sort((a, b) => b.volumeMinutes - a.volumeMinutes);

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

    // ─── Statistiques agrégées ──────────────────────────────────

    async getStatistiques(
        etablissementId: string,
        options?: { classeAnneeId?: string; enseignantId?: string; periodeId?: string },
    ): Promise<{
        totalCreneaux: number;
        totalHeures: number;
        totalMatieres: number;
        totalClasses: number;
        totalEnseignants: number;
        totalSallesOccupees: number;
        repartitionParJour: Array<{ jour: string; nombreCreneaux: number; totalHeures: number }>;
        repartitionParMatiere: Array<{ matiereId: string; matiereNom: string; couleur: string | null; nombreCreneaux: number; totalHeures: number; volumeRequis: number | null }>;
        tauxOccupationSalle: number;
        conflitsPotentiels: number;
    }> {
        const qb = this.creneauRepo.createQueryBuilder('ch')
            .leftJoinAndSelect('ch.affectationMatiere', 'am')
            .leftJoinAndSelect('am.matiere', 'matiere')
            .leftJoinAndSelect('am.enseignant', 'enseignant')
            .leftJoinAndSelect('enseignant.utilisateur', 'enseignant_utilisateur')
            .leftJoinAndSelect('enseignant_utilisateur.profil', 'enseignant_profil')
            .leftJoinAndSelect('am.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('ch.salle', 'salle')
            .where('ch.etablissementId = :etablissementId', { etablissementId });

        if (options?.classeAnneeId) {
            qb.andWhere('am.classeAnneeId = :classeAnneeId', { classeAnneeId: options.classeAnneeId });
        }
        if (options?.enseignantId) {
            qb.andWhere('am.enseignantId = :enseignantId', { enseignantId: options.enseignantId });
        }
        if (options?.periodeId) {
            qb.andWhere('ch.periodeId = :periodeId', { periodeId: options.periodeId });
        }

        const creneaux = await qb.getMany();

        const totalCreneaux = creneaux.length;
        const totalMinutes = creneaux.reduce((sum, c) => sum + c.dureeMinutes, 0);
        const totalHeures = totalMinutes / 60;

        const matieresSet = new Set<string>();
        const classesSet = new Set<string>();
        const enseignantsSet = new Set<string>();
        const sallesSet = new Set<string>();

        const parJour = new Map<string, { nombreCreneaux: number; totalMinutes: number }>();
        const parMatiere = new Map<string, { matiereNom: string; couleur: string | null; nombreCreneaux: number; totalMinutes: number; volumeRequis: number | null }>();

        for (const c of creneaux) {
            const aff = c.affectationMatiere;
            if (aff) {
                matieresSet.add(aff.matiereId);
                classesSet.add(aff.classeAnneeId);
                enseignantsSet.add(aff.enseignantId);
            }
            if (c.salleId) sallesSet.add(c.salleId);

            // Par jour
            const jourData = parJour.get(c.jour) || { nombreCreneaux: 0, totalMinutes: 0 };
            jourData.nombreCreneaux++;
            jourData.totalMinutes += c.dureeMinutes;
            parJour.set(c.jour, jourData);

            // Par matière
            if (aff?.matiere) {
                const matKey = `${aff.matiereId}:${aff.classeAnneeId}`;
                const matData = parMatiere.get(matKey) || {
                    matiereNom: aff.matiere.nom,
                    couleur: aff.matiere.couleur,
                    nombreCreneaux: 0,
                    totalMinutes: 0,
                    volumeRequis: null,
                };
                matData.nombreCreneaux++;
                matData.totalMinutes += c.dureeMinutes;
                parMatiere.set(matKey, matData);
            }
        }

        // Résoudre les volumes requis
        for (const [key, data] of parMatiere.entries()) {
            const [matiereId, classeAnneeId] = key.split(':');
            try {
                const classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
                const classeAnnee = await classeAnneeRepo.findOne({
                    where: { id: classeAnneeId },
                    relations: ['classe'],
                });
                const matiereNiveau = await coefficientResolverService.resoudreMatiereNiveau(
                    matiereId,
                    classeAnnee?.classe?.niveauId ?? '',
                    classeAnnee?.classe?.filiereId,
                );
                data.volumeRequis = matiereNiveau?.volumeHoraire ?? null;
            } catch { /* ignore */ }
        }

        // Taux d'occupation des salles (ratio salles occupées / total salles)
        let tauxOccupationSalle = 0;
        try {
            const totalSalles = await AppDataSource.getRepository('Salle').count({ where: { etablissementId } });
            if (totalSalles > 0) {
                tauxOccupationSalle = Math.round((sallesSet.size / totalSalles) * 100);
            }
        } catch { /* ignore */ }

        const JOURS_ORDRE = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
        const repartitionParJour = Array.from(parJour.entries())
            .map(([jour, data]) => ({
                jour,
                nombreCreneaux: data.nombreCreneaux,
                totalHeures: data.totalMinutes / 60,
            }))
            .sort((a, b) => JOURS_ORDRE.indexOf(a.jour) - JOURS_ORDRE.indexOf(b.jour));

        const repartitionParMatiere = Array.from(parMatiere.entries())
            .map(([key, data]) => ({
                matiereId: key.split(':')[0],
                matiereNom: data.matiereNom,
                couleur: data.couleur,
                nombreCreneaux: data.nombreCreneaux,
                totalHeures: data.totalMinutes / 60,
                volumeRequis: data.volumeRequis,
            }))
            .sort((a, b) => b.totalHeures - a.totalHeures);

        // Calculer les conflits potentiels réels
        let conflitsPotentiels = 0;
        try {
            const auditResult = await conflitDetectionService.auditConflitsGlobaux(etablissementId, {
                periodeId: options?.periodeId,
            });
            conflitsPotentiels = auditResult.totalConflits;
        } catch { /* ignore — retourne 0 */ }

        return {
            totalCreneaux,
            totalHeures: Math.round(totalHeures * 10) / 10,
            totalMatieres: matieresSet.size,
            totalClasses: classesSet.size,
            totalEnseignants: enseignantsSet.size,
            totalSallesOccupees: sallesSet.size,
            repartitionParJour,
            repartitionParMatiere,
            tauxOccupationSalle,
            conflitsPotentiels,
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
        const h = this.normaliserHeure(heure);
        const pd = this.normaliserHeure(pauseDebut);
        const pf = this.normaliserHeure(pauseFin);
        return h >= pd && h < pf;
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
    ): Promise<{ jour: string; heureDebut: string; heureFin: string; salleId?: string } | null> {
        const maxParJour = preferences.maxCreneauxParJour || 8;
        const maxMatiereParJour = preferences.maxCreneauxMatiereParJour || 2;
        const maxConsecutifs = preferences.maxCreneauxConsecutifs || 2;
        const heureDebutCours = this.normaliserHeure(preferences.heureDebutCours || '07:30');
        const heureFinCours = this.normaliserHeure(preferences.heureFinCours || '17:00');

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

                // Vérifier max créneaux consécutifs pour cette matière
                if (!this.verifierMaxConsecutifs(matiereId, jour, heure, dureeCreneau, maxConsecutifs, creneauxGenerees)) {
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
        const heureDebutCours = this.normaliserHeure(preferences.heureDebutCours || '07:30');
        const heureFinCours = this.normaliserHeure(preferences.heureFinCours || '17:00');

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

    /** Normalise "HH:mm:ss" (PostgreSQL time) → "HH:mm" (varchar(5)) */
    private normaliserHeure(heure: string): string {
        const parts = heure.split(':');
        return `${parts[0]}:${parts[1]}`;
    }

    private heureToMinutes(heure: string): number {
        const [h, m] = heure.split(':').map(Number);
        return h * 60 + m;
    }

    private getPauseFin(heure: string, preferences: PreferenceEmploiDuTemps): string | null {
        if (this.estDansPause(heure, preferences.pauseMatineeDebut, preferences.pauseMatineeFin)) return this.normaliserHeure(preferences.pauseMatineeFin!);
        if (this.estDansPause(heure, preferences.pauseDebut, preferences.pauseFin)) return this.normaliserHeure(preferences.pauseFin!);
        if (this.estDansPause(heure, preferences.pauseApresMidiDebut, preferences.pauseApresMidiFin)) return this.normaliserHeure(preferences.pauseApresMidiFin!);
        return null;
    }

    /**
     * Vérifie qu'une matière n'a pas déjà N créneaux consécutifs à l'heure donnée
     */
    private verifierMaxConsecutifs(
        matiereId: string,
        jour: string,
        heureDebut: string,
        dureeCreneau: number,
        maxConsecutifs: number,
        creneauxGenerees: CreneauHoraire[],
    ): boolean {
        // Trouver les créneaux de cette matière le même jour, triés par heure
        const creneauxMatiereJour = creneauxGenerees
            .filter(c => {
                const affMatiereId = (c.affectationMatiere as AffectationMatiere)?.matiereId;
                return affMatiereId === matiereId && c.jour === jour;
            })
            .sort((a, b) => a.heureDebut.localeCompare(b.heureDebut));

        if (creneauxMatiereJour.length < maxConsecutifs) return true;

        // Vérifier si les N derniers créneaux sont consécutifs avec le nouveau
        const derniers = creneauxMatiereJour.slice(-maxConsecutifs);
        let estConsecutif = true;
        for (let i = 1; i < derniers.length; i++) {
            const finPrec = this.heureToMinutes(derniers[i - 1].heureFin);
            const debutCourant = this.heureToMinutes(derniers[i].heureDebut);
            if (debutCourant !== finPrec) {
                estConsecutif = false;
                break;
            }
        }

        if (!estConsecutif) return true;

        // Vérifier si le nouveau créneau serait aussi consécutif au dernier
        const dernierFin = this.heureToMinutes(derniers[derniers.length - 1].heureFin);
        const nouveauDebut = this.heureToMinutes(heureDebut);
        return nouveauDebut !== dernierFin;
    }

    /**
     * Applique la configuration d'un template en override des préférences
     */
    private async appliquerTemplate(
        templateId: string,
        preferences: PreferenceEmploiDuTemps,
        etablissementId: string,
    ): Promise<PreferenceEmploiDuTemps> {
        const templateRepo = AppDataSource.getRepository(TemplateEmploiDuTemps);
        const template = await templateRepo.findOne({
            where: [
                { id: templateId, etablissementId },
                { id: templateId, estPartage: true },
            ],
        });

        if (!template || !template.actif) {
            logger.warn(`[EDT] Template ${templateId} non trouvé ou inactif — ignoré`);
            return preferences;
        }

        const config = template.configuration;
        const overridden: any = { ...preferences };

        if (config.joursTravailles?.length) {
            overridden.joursOuvrables = config.joursTravailles as JourSemaine[];
        }
        if (config.heureDebutCours) {
            overridden.heureDebutCours = config.heureDebutCours;
        }
        if (config.heureFinCours) {
            overridden.heureFinCours = config.heureFinCours;
        }
        if (config.dureeCreneauDefaut) {
            overridden.dureeCreneauStandard = config.dureeCreneauDefaut;
        }

        logger.info(`[EDT] Template "${template.nom}" appliqué — jours: ${overridden.joursOuvrables?.join(',')}, durée: ${overridden.dureeCreneauStandard}min`);
        return overridden;
    }
}

export const emploiDuTempsService = new EmploiDuTempsService();
