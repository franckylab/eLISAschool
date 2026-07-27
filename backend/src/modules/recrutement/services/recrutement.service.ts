/**
 * ==================================
 * eLISAschool - Service Recrutement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Logique métier complète du pipeline de recrutement :
 * - Gestion des offres d'emploi
 * - Pipeline des candidatures (reçue → examen → présélection → entretien → retenue/refusée)
 * - Planification et évaluation des entretiens
 * - Onboarding post-embauche
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    OffreEmploi,
    Candidature,
    Entretien,
    Onboarding,
    StatutOffreEmploi,
    StatutCandidature,
    StatutEntretien,
    StatutOnboarding,
    TypeEntretien,
} from '../entities';
import {
    CreateOffreEmploiDto,
    UpdateOffreEmploiDto,
    QueryOffreEmploiDto,
    CreateCandidatureDto,
    UpdateCandidatureDto,
    EvaluerCandidatureDto,
    QueryCandidatureDto,
    CreateEntretienDto,
    UpdateEntretienDto,
    EvaluerEntretienDto,
    QueryEntretienDto,
    CreateOnboardingDto,
    UpdateOnboardingDto,
    UpdateChecklistDto,
    QueryOnboardingDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';

export class RecrutementService {
    private offreRepo: Repository<OffreEmploi>;
    private candidatureRepo: Repository<Candidature>;
    private entretienRepo: Repository<Entretien>;
    private onboardingRepo: Repository<Onboarding>;

    constructor() {
        this.offreRepo = AppDataSource.getRepository(OffreEmploi);
        this.candidatureRepo = AppDataSource.getRepository(Candidature);
        this.entretienRepo = AppDataSource.getRepository(Entretien);
        this.onboardingRepo = AppDataSource.getRepository(Onboarding);
    }

    // =====================================================
    // OFFRES D'EMPLOI
    // =====================================================

    async createOffre(dto: CreateOffreEmploiDto, publieParId: string, etablissementId: string, req?: Request): Promise<OffreEmploi> {
        const offre = this.offreRepo.create({
            posteId: dto.posteId,
            uniteOrganisationnelleId: dto.uniteOrganisationnelleId,
            titre: dto.titre,
            description: dto.description,
            missions: dto.missions,
            profilRecherche: dto.profilRecherche,
            competencesRequises: dto.competencesRequises,
            experienceRequise: dto.experienceRequise,
            niveauEtudeRequis: dto.niveauEtudeRequis,
            salaireMin: dto.salaireMin,
            salaireMax: dto.salaireMax,
            typeContratPropose: dto.typeContratPropose,
            datePublication: dto.datePublication ? new Date(dto.datePublication) : undefined,
            dateLimite: dto.dateLimite ? new Date(dto.dateLimite) : undefined,
            nombrePostesDisponibles: dto.nombrePostesDisponibles,
            publieParId,
            etablissementId,
            statut: dto.datePublication ? StatutOffreEmploi.PUBLIEE : StatutOffreEmploi.BROUILLON,
        });

        await this.offreRepo.save(offre);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'OFFRE_EMPLOI_CREATE' as any,
                cible: 'OffreEmploi',
                cibleId: offre.id,
                description: `Création offre emploi: ${offre.titre}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Offre emploi créée: ${offre.id} - ${offre.titre}`);
        return offre;
    }

    async findOffres(query: QueryOffreEmploiDto, etablissementId: string): Promise<PaginatedResult<OffreEmploi>> {
        const { page, limit, search, statut, typeContrat } = query;

        const qb = this.offreRepo
            .createQueryBuilder('o')
            .leftJoinAndSelect('o.poste', 'p')
            .leftJoinAndSelect('o.uniteOrganisationnelle', 'uo')
            .leftJoinAndSelect('o.publiePar', 'mp')
            .where('o.etablissementId = :etablissementId', { etablissementId });

        if (statut) {
            qb.andWhere('o.statut = :statut', { statut });
        }

        if (typeContrat) {
            qb.andWhere('o.typeContratPropose ILIKE :typeContrat', { typeContrat: `%${typeContrat}%` });
        }

        if (search) {
            qb.andWhere(
                '(o.titre ILIKE :search OR o.description ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        const allowedFields = ['createdAt', 'datePublication', 'dateLimite', 'titre', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`o.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOffreById(id: string, etablissementId: string): Promise<OffreEmploi> {
        const offre = await this.offreRepo.findOne({
            where: { id, etablissementId },
            relations: ['poste', 'uniteOrganisationnelle', 'publiePar'],
        });

        if (!offre) {
            throw new AppError('Offre d\'emploi non trouvée', 404, 'NOT_FOUND');
        }

        return offre;
    }

    async updateOffre(id: string, dto: UpdateOffreEmploiDto, userId: string, etablissementId: string, req?: Request): Promise<OffreEmploi> {
        const offre = await this.findOffreById(id, etablissementId);

        // Empêcher modification si offre terminée ou annulée
        if (offre.statut === StatutOffreEmploi.TERMINEE || offre.statut === StatutOffreEmploi.ANNULEE) {
            throw new AppError('Impossible de modifier une offre terminée ou annulée', 400, 'OFFRE_LOCKED');
        }

        Object.assign(offre, dto);
        await this.offreRepo.save(offre);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'OFFRE_EMPLOI_UPDATE' as any,
                cible: 'OffreEmploi',
                cibleId: offre.id,
                description: `Modification offre: ${offre.titre}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        return offre;
    }

    async publierOffre(id: string, userId: string, etablissementId: string, req?: Request): Promise<OffreEmploi> {
        const offre = await this.findOffreById(id, etablissementId);

        if (offre.statut !== StatutOffreEmploi.BROUILLON) {
            throw new AppError('Seules les offres en brouillon peuvent être publiées', 400, 'INVALID_STATUT');
        }

        offre.statut = StatutOffreEmploi.PUBLIEE;
        offre.datePublication = new Date();
        await this.offreRepo.save(offre);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'OFFRE_EMPLOI_PUBLISH' as any,
                cible: 'OffreEmploi',
                cibleId: offre.id,
                description: `Publication offre: ${offre.titre}`,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Offre publiée: ${offre.id}`);
        return offre;
    }

    async clôturerOffre(id: string, userId: string, etablissementId: string, req?: Request): Promise<OffreEmploi> {
        const offre = await this.findOffreById(id, etablissementId);

        offre.statut = StatutOffreEmploi.TERMINEE;
        await this.offreRepo.save(offre);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'OFFRE_EMPLOI_CLOSE' as any,
                cible: 'OffreEmploi',
                cibleId: offre.id,
                description: `Clôture offre: ${offre.titre}`,
                module: 'recrutement',
            }, req);
        }

        return offre;
    }

    async getStatistiquesOffres(etablissementId: string): Promise<any> {
        const stats = await this.offreRepo
            .createQueryBuilder('o')
            .where('o.etablissementId = :etablissementId', { etablissementId })
            .select('o.statut', 'statut')
            .addSelect('COUNT(*)', 'nombre')
            .groupBy('o.statut')
            .getRawMany();

        const totalCandidatures = await this.candidatureRepo.count({
            where: {
                offreEmploi: { etablissementId },
            },
        });

        return {
            offresParStatut: stats,
            totalCandidatures,
        };
    }

    // =====================================================
    // CANDIDATURES
    // =====================================================

    async createCandidature(dto: CreateCandidatureDto, etablissementId: string, req?: Request): Promise<Candidature> {
        // Vérifier que l'offre existe et est publiée
        const offre = await this.offreRepo.findOne({
            where: { id: dto.offreEmploiId, etablissementId },
        });

        if (!offre) {
            throw new AppError('Offre d\'emploi non trouvée', 404, 'NOT_FOUND');
        }

        if (offre.statut !== StatutOffreEmploi.PUBLIEE) {
            throw new AppError('Cette offre n\'accepte pas de candidatures', 400, 'OFFRE_NOT_ACCEPTING');
        }

        // Vérifier doublon (email + offre)
        const existing = await this.candidatureRepo.findOne({
            where: {
                offreEmploiId: dto.offreEmploiId,
                email: dto.email,
            },
        });

        if (existing) {
            throw new AppError('Vous avez déjà postulé à cette offre', 409, 'CANDIDATURE_DUPLICATE');
        }

        const candidature = this.candidatureRepo.create({
            ...dto,
            etablissementId,
            statut: StatutCandidature.RECUE,
        });

        await this.candidatureRepo.save(candidature);

        // Incrémenter le compteur de candidatures
        offre.nombreCandidatures += 1;
        await this.offreRepo.save(offre);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'CANDIDATURE_CREATE' as any,
                cible: 'Candidature',
                cibleId: candidature.id,
                description: `Nouvelle candidature: ${candidature.nomComplet} pour ${offre.titre}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Candidature créée: ${candidature.id} - ${candidature.nomComplet}`);
        return candidature;
    }

    async findCandidatures(query: QueryCandidatureDto, etablissementId: string): Promise<PaginatedResult<Candidature>> {
        const { page, limit, search, offreEmploiId, statut } = query;

        const qb = this.candidatureRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.offreEmploi', 'o')
            .leftJoinAndSelect('c.examinePar', 'mp')
            .where('c.etablissementId = :etablissementId', { etablissementId });

        if (offreEmploiId) {
            qb.andWhere('c.offreEmploiId = :offreEmploiId', { offreEmploiId });
        }

        if (statut) {
            qb.andWhere('c.statut = :statut', { statut });
        }

        if (search) {
            qb.andWhere(
                '(c.nomComplet ILIKE :search OR c.email ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        const allowedFields = ['createdAt', 'nomComplet', 'statut', 'noteEvaluation'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`c.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findCandidatureById(id: string, etablissementId: string): Promise<Candidature> {
        const candidature = await this.candidatureRepo.findOne({
            where: { id, etablissementId },
            relations: ['offreEmploi', 'examinePar', 'entretiens'],
        });

        if (!candidature) {
            throw new AppError('Candidature non trouvée', 404, 'NOT_FOUND');
        }

        return candidature;
    }

    async evaluerCandidature(id: string, dto: EvaluerCandidatureDto, examineParId: string, etablissementId: string, req?: Request): Promise<Candidature> {
        const candidature = await this.findCandidatureById(id, etablissementId);

        candidature.statut = dto.statut as StatutCandidature;
        candidature.examineParId = examineParId;

        if (dto.noteEvaluation !== undefined) {
            candidature.noteEvaluation = dto.noteEvaluation;
        }

        if (dto.evaluationCommentaire) {
            candidature.evaluationCommentaire = dto.evaluationCommentaire;
        }

        await this.candidatureRepo.save(candidature);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'CANDIDATURE_EVALUATE' as any,
                cible: 'Candidature',
                cibleId: candidature.id,
                description: `Évaluation candidature: ${candidature.nomComplet} → ${dto.statut}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Candidature évaluée: ${candidature.id} → ${dto.statut}`);
        return candidature;
    }

    async shortlistCandidature(id: string, examineParId: string, etablissementId: string, req?: Request): Promise<Candidature> {
        return this.evaluerCandidature(id, { statut: StatutCandidature.PRESLECTIONNEE }, examineParId, etablissementId, req);
    }

    async convoquerCandidature(id: string, examineParId: string, etablissementId: string, req?: Request): Promise<Candidature> {
        return this.evaluerCandidature(id, { statut: StatutCandidature.CONVOQUEE }, examineParId, etablissementId, req);
    }

    async retenirCandidature(id: string, examineParId: string, etablissementId: string, req?: Request): Promise<Candidature> {
        const candidature = await this.evaluerCandidature(id, { statut: StatutCandidature.RETENUE }, examineParId, etablissementId, req);

        logger.info(`Candidat retenu: ${candidature.nomComplet} - Prêt pour onboarding`);
        return candidature;
    }

    async refuserCandidature(id: string, examineParId: string, etablissementId: string, req?: Request): Promise<Candidature> {
        return this.evaluerCandidature(id, { statut: StatutCandidature.REFUSEE }, examineParId, etablissementId, req);
    }

    async getPipelineStats(offreEmploiId: string, etablissementId: string): Promise<any> {
        const pipeline = await this.candidatureRepo
            .createQueryBuilder('c')
            .where('c.offreEmploiId = :offreEmploiId', { offreEmploiId })
            .andWhere('c.etablissementId = :etablissementId', { etablissementId })
            .select('c.statut', 'statut')
            .addSelect('COUNT(*)', 'nombre')
            .groupBy('c.statut')
            .getRawMany();

        const total = pipeline.reduce((sum, p) => sum + parseInt(p.nombre), 0);

        return {
            pipeline,
            total,
        };
    }

    // =====================================================
    // ENTRETIENS
    // =====================================================

    async createEntretien(dto: CreateEntretienDto, userId: string, etablissementId: string, req?: Request): Promise<Entretien> {
        // Vérifier que la candidature existe
        const candidature = await this.candidatureRepo.findOne({
            where: { id: dto.candidatureId, etablissementId },
        });

        if (!candidature) {
            throw new AppError('Candidature non trouvée', 404, 'NOT_FOUND');
        }

        const entretienData: Partial<Entretien> = {
            candidatureId: dto.candidatureId,
            offreEmploiId: dto.offreEmploiId,
            type: dto.type as TypeEntretien,
            dateEntretien: new Date(dto.dateEntretien),
            heureDebut: dto.heureDebut,
            heureFin: dto.heureFin,
            lieu: dto.lieu,
            lienVideoconference: dto.lienVideoconference,
            grilleEvaluation: dto.grilleEvaluation,
            evaluateurId: dto.evaluateurId,
            etablissementId,
            statut: StatutEntretien.PLANIFIE,
        };

        const entretien = await this.entretienRepo.save(entretienData);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'ENTRETIEN_CREATE' as any,
                cible: 'Entretien',
                cibleId: entretien.id,
                description: `Entretien planifié pour ${candidature.nomComplet}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Entretien créé: ${entretien.id} - ${dto.type}`);
        return entretien;
    }

    async findEntretiens(query: QueryEntretienDto, etablissementId: string): Promise<PaginatedResult<Entretien>> {
        const { page, limit, search, candidatureId, offreEmploiId, type, statut } = query;

        const qb = this.entretienRepo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.candidature', 'c')
            .leftJoinAndSelect('e.offreEmploi', 'o')
            .leftJoinAndSelect('e.evaluateur', 'mp')
            .where('e.etablissementId = :etablissementId', { etablissementId });

        if (candidatureId) {
            qb.andWhere('e.candidatureId = :candidatureId', { candidatureId });
        }

        if (offreEmploiId) {
            qb.andWhere('e.offreEmploiId = :offreEmploiId', { offreEmploiId });
        }

        if (type) {
            qb.andWhere('e.type = :type', { type });
        }

        if (statut) {
            qb.andWhere('e.statut = :statut', { statut });
        }

        const allowedFields = ['createdAt', 'dateEntretien', 'type', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'dateEntretien';
        qb.orderBy(`e.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async evaluerEntretien(id: string, dto: EvaluerEntretienDto, userId: string, etablissementId: string, req?: Request): Promise<Entretien> {
        const entretien = await this.findEntretienById(id, etablissementId);

        Object.assign(entretien, dto);
        await this.entretienRepo.save(entretien);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'ENTRETIEN_EVALUATE' as any,
                cible: 'Entretien',
                cibleId: entretien.id,
                description: `Entretien évalué: ${entretien.type} - Note: ${dto.note}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        return entretien;
    }

    async findEntretienById(id: string, etablissementId: string): Promise<Entretien> {
        const entretien = await this.entretienRepo.findOne({
            where: { id, etablissementId },
            relations: ['candidature', 'offreEmploi', 'evaluateur'],
        });

        if (!entretien) {
            throw new AppError('Entretien non trouvé', 404, 'NOT_FOUND');
        }

        return entretien;
    }

    // =====================================================
    // ONBOARDING
    // =====================================================

    async createOnboarding(dto: CreateOnboardingDto, userId: string, etablissementId: string, req?: Request): Promise<Onboarding> {
        // Vérifier que le membre existe
        const membre = await this.candidatureRepo.manager.query(
            'SELECT id FROM membres_personnel WHERE id = $1 AND "etablissementId" = $2 AND "deletedAt" IS NULL',
            [dto.membrePersonnelId, etablissementId]
        );

        if (!membre || membre.length === 0) {
            throw new AppError('Membre du personnel non trouvé', 404, 'NOT_FOUND');
        }

        const onboarding = this.onboardingRepo.create({
            membrePersonnelId: dto.membrePersonnelId,
            offreEmploiId: dto.offreEmploiId,
            dateDebut: new Date(dto.dateDebut),
            dateFinPrevu: new Date(dto.dateFinPrevu),
            tuteurId: dto.tuteurId,
            checklist: dto.checklist,
            formationInitiale: dto.formationInitiale,
            equipementFourni: dto.equipementFourni,
            etablissementId,
            statut: StatutOnboarding.EN_COURS,
            progressionPourcentage: 0,
        });

        await this.onboardingRepo.save(onboarding);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'ONBOARDING_CREATE' as any,
                cible: 'Onboarding',
                cibleId: onboarding.id,
                description: `Onboarding créé pour membre ${dto.membrePersonnelId}`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        logger.info(`Onboarding créé: ${onboarding.id}`);
        return onboarding;
    }

    async findOnboardings(query: QueryOnboardingDto, etablissementId: string): Promise<PaginatedResult<Onboarding>> {
        const { page, limit, search, membrePersonnelId, statut } = query;

        const qb = this.onboardingRepo
            .createQueryBuilder('o')
            .leftJoinAndSelect('o.membrePersonnel', 'mp')
            .leftJoinAndSelect('o.offreEmploi', 'of')
            .leftJoinAndSelect('o.tuteur', 't')
            .where('o.etablissementId = :etablissementId', { etablissementId });

        if (membrePersonnelId) {
            qb.andWhere('o.membrePersonnelId = :membrePersonnelId', { membrePersonnelId });
        }

        if (statut) {
            qb.andWhere('o.statut = :statut', { statut });
        }

        const allowedFields = ['createdAt', 'dateDebut', 'dateFinPrevu', 'statut', 'progressionPourcentage'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`o.${orderField}`, query.sortOrder);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async updateChecklist(id: string, dto: UpdateChecklistDto, userId: string, etablissementId: string, req?: Request): Promise<Onboarding> {
        const onboarding = await this.findOnboardingById(id, etablissementId);

        onboarding.checklist = dto.checklist;
        onboarding.progressionPourcentage = dto.progressionPourcentage;

        // Mettre à jour le statut automatiquement
        if (dto.progressionPourcentage >= 100) {
            onboarding.statut = StatutOnboarding.TERMINE;
            onboarding.dateFinReel = new Date();
        }

        await this.onboardingRepo.save(onboarding);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'ONBOARDING_UPDATE' as any,
                cible: 'Onboarding',
                cibleId: onboarding.id,
                description: `Onboarding mis à jour: ${dto.progressionPourcentage}%`,
                nouvellesValeurs: dto,
                module: 'recrutement',
            }, req);
        }

        return onboarding;
    }

    async findOnboardingById(id: string, etablissementId: string): Promise<Onboarding> {
        const onboarding = await this.onboardingRepo.findOne({
            where: { id, etablissementId },
            relations: ['membrePersonnel', 'offreEmploi', 'tuteur'],
        });

        if (!onboarding) {
            throw new AppError('Onboarding non trouvé', 404, 'NOT_FOUND');
        }

        return onboarding;
    }

    async getOnboardingStats(etablissementId: string): Promise<any> {
        const stats = await this.onboardingRepo
            .createQueryBuilder('o')
            .where('o.etablissementId = :etablissementId', { etablissementId })
            .select('o.statut', 'statut')
            .addSelect('COUNT(*)', 'nombre')
            .addSelect('AVG(o.progressionPourcentage)', 'progression_moyenne')
            .groupBy('o.statut')
            .getRawMany();

        return stats;
    }
}

export const recrutementService = new RecrutementService();
