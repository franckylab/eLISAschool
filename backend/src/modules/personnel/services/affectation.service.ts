/**
 * ==================================
 * eLISAschool - Service Affectation Poste
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AffectationPoste, StatutAffectation, TypeMutation } from '../entities';
import { CreateAffectationDto, UpdateAffectationDto, QueryAffectationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { Poste, StatutPoste } from '@modules/organisation/entities';

export class AffectationService {
    private repo: Repository<AffectationPoste>;

    constructor() {
        this.repo = AppDataSource.getRepository(AffectationPoste);
    }

    /**
     * Affecter un personnel à un poste (méthode unifiée).
     * Orchestre en une transaction : vérification occupation + création AffectationPoste.
     * L'occupation est calculée via les affectations actives (plus de Poste.occupantId).
     */
    async affecterPersonnelAPoste(
        posteId: string,
        membrePersonnelId: string,
        etablissementId: string,
        options?: {
            typeMutation?: TypeMutation;
            contratId?: string;
            createurId?: string;
            req?: any;
        },
    ): Promise<{ poste: any; affectation: AffectationPoste }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Charger le poste avec validation
            const posteRepo = queryRunner.manager.getRepository(Poste);
            const poste = await posteRepo.findOne({ where: { id: posteId } });
            if (!poste) throw new AppError('Poste non trouvé', 404, 'POSTE_NOT_FOUND');

            // Vérifier si le poste est déjà occupé par un autre membre (via affectations actives)
            const affectationPosteRepo = queryRunner.manager.getRepository(AffectationPoste);
            const occupantActif = await affectationPosteRepo.findOne({
                where: { posteId, statut: StatutAffectation.ACTIF },
            });
            if (occupantActif && occupantActif.membrePersonnelId !== membrePersonnelId) {
                throw new AppError('Ce poste est déjà occupé', 409, 'POSTE_DEJA_OCCUPE');
            }

            // 2. Mettre à jour le statut du poste
            poste.statut = StatutPoste.ACTIF;
            await queryRunner.manager.save(poste);

            // 3. Terminer l'ancienne affectation active si existante
            const ancienneActive = await queryRunner.manager.findOne(AffectationPoste, {
                where: { membrePersonnelId, etablissementId, statut: StatutAffectation.ACTIF },
            });
            if (ancienneActive) {
                ancienneActive.statut = StatutAffectation.TERMINE;
                ancienneActive.dateFin = new Date();
                await queryRunner.manager.save(ancienneActive);
            }

            // 4. Créer la nouvelle affectation
            const affectation = queryRunner.manager.create(AffectationPoste, {
                membrePersonnelId,
                posteId,
                contratId: options?.contratId,
                uniteOrganisationnelleId: poste.uniteOrganisationnelleId,
                typeMutation: options?.typeMutation || TypeMutation.NOUVELLE,
                statut: StatutAffectation.ACTIF,
                dateDebut: new Date(),
                etablissementId,
            });
            const saved = await queryRunner.manager.save(affectation);

            await queryRunner.commitTransaction();

            logger.info(`Personnel ${membrePersonnelId} affecté au poste ${posteId}`, { affectationId: saved.id });
            return { poste, affectation: saved };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Créer une nouvelle affectation
     */
    async create(
        dto: CreateAffectationDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<AffectationPoste> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Vérifier si le poste existe et n'est pas déjà occupé par un autre membre
            const posteRepo = queryRunner.manager.getRepository(Poste);
            const poste = await posteRepo.findOne({ where: { id: dto.posteId } });
            if (!poste) throw new AppError('Poste non trouvé', 404, 'POSTE_NOT_FOUND');
            // Vérifier si le poste est déjà occupé par un autre membre (via affectations actives)
            const affectationPosteRepo = queryRunner.manager.getRepository(AffectationPoste);
            const occupantActif = await affectationPosteRepo.findOne({
                where: { posteId: dto.posteId, statut: StatutAffectation.ACTIF },
            });
            if (occupantActif && occupantActif.membrePersonnelId !== dto.membrePersonnelId) {
                throw new AppError('Ce poste est déjà occupé', 409, 'POSTE_DEJA_OCCUPE');
            }

            // Vérifier si le membre a déjà une affectation active
            const affectationActive = await this.repo.findOne({
                where: {
                    membrePersonnelId: dto.membrePersonnelId,
                    etablissementId,
                    statut: StatutAffectation.ACTIF,
                },
            });

            // Si oui, la terminer automatiquement
            if (affectationActive) {
                affectationActive.statut = StatutAffectation.TERMINE;
                affectationActive.dateFin = new Date();
                await queryRunner.manager.save(affectationActive);
                logger.info(`Affectation ${affectationActive.id} terminée automatiquement`);
            }

            // Mettre à jour le statut du poste
            poste.statut = StatutPoste.ACTIF;
            await queryRunner.manager.save(poste);

            // Créer la nouvelle affectation
            const affectation = new AffectationPoste();
            Object.assign(affectation, dto, {
                dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
                dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
                statut: StatutAffectation.ACTIF,
                etablissementId,
                uniteOrganisationnelleId: dto.uniteOrganisationnelleId || poste.uniteOrganisationnelleId,
            });

            await queryRunner.manager.save(affectation);

            await queryRunner.commitTransaction();

            // Workflow validation si requis pour mutations
            const requireValidation = await getParamBoolean('personnel.affectation_require_validation', { defaultValue: false });
            if (requireValidation && createurId && dto.typeMutation !== TypeMutation.NOUVELLE) {
                await validationWorkflowService.createWorkflow({
                    module: 'personnel',
                    entiteId: affectation.id,
                    entiteType: 'AffectationPoste',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: `Mutation ${dto.typeMutation} pour membre ${dto.membrePersonnelId}`,
                }, createurId);

                logger.info(`[${etablissementId}] Affectation créée en attente de validation: ${affectation.id}`);
            } else {
                logger.info(`Affectation créée: ${affectation.id} pour membre ${dto.membrePersonnelId}`);
            }

            // Audit
            if (createurId) {
                await auditService.log({
                    utilisateurId: createurId,
                    action: 'AFFECTATION_POSTE_CREATE' as any,
                    cible: 'AffectationPoste',
                    cibleId: affectation.id,
                    description: `Création affectation ${dto.typeMutation} poste ${dto.posteId}`,
                    nouvellesValeurs: dto,
                    module: 'personnel',
                }, req);
            }

            return affectation;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Lister les affectations avec pagination
     */
    async findAll(
        query: QueryAffectationDto,
        etablissementId: string
    ): Promise<PaginatedResult<AffectationPoste>> {
        const { page, limit, search, membrePersonnelId, posteId, statut, typeMutation } = query;

        const qb = this.repo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.membrePersonnel', 'mp')
            .leftJoinAndSelect('mp.utilisateur', 'u')
            .leftJoinAndSelect('a.poste', 'p')
            .leftJoinAndSelect('a.uniteOrganisationnelle', 'uo')
            .where('a.etablissementId = :etablissementId', { etablissementId });

        // Filtres optionnels
        if (membrePersonnelId) {
            qb.andWhere('a.membrePersonnelId = :membrePersonnelId', { membrePersonnelId });
        }

        if (posteId) {
            qb.andWhere('a.posteId = :posteId', { posteId });
        }

        if (statut) {
            qb.andWhere('a.statut = :statut', { statut });
        }

        if (typeMutation) {
            qb.andWhere('a.typeMutation = :typeMutation', { typeMutation });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(a.commentaire ILIKE :search OR p.intitule ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri
        const allowedFields = ['createdAt', 'dateDebut', 'dateFin', 'statut', 'typeMutation'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'dateDebut';
        qb.orderBy(`a.${orderField}`, query.sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Récupérer l'historique des affectations d'un membre
     */
    async getHistoriqueByMembre(
        membreId: string,
        etablissementId: string
    ): Promise<AffectationPoste[]> {
        return this.repo.find({
            where: { membrePersonnelId: membreId, etablissementId },
            relations: ['poste', 'uniteOrganisationnelle', 'contrat'],
            order: { dateDebut: 'DESC' },
        });
    }

    /**
     * Récupérer l'affectation active d'un membre
     */
    async getAffectationActive(
        membreId: string,
        etablissementId: string
    ): Promise<AffectationPoste | null> {
        return this.repo.findOne({
            where: {
                membrePersonnelId: membreId,
                etablissementId,
                statut: StatutAffectation.ACTIF,
            },
            relations: ['poste', 'uniteOrganisationnelle', 'contrat'],
        });
    }

    async getAffectationActiveByPoste(
        posteId: string,
        etablissementId: string
    ): Promise<AffectationPoste | null> {
        return this.repo.findOne({
            where: { posteId, etablissementId, statut: StatutAffectation.ACTIF },
            relations: ['membrePersonnel'],
        });
    }

    /**
     * Récupérer l'historique des occupants d'un poste
     */
    async getHistoriqueOccupantsPoste(
        posteId: string,
        etablissementId: string
    ): Promise<AffectationPoste[]> {
        return this.repo.find({
            where: { posteId, etablissementId },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur'],
            order: { dateDebut: 'DESC' },
        });
    }

    /**
     * Terminer une affectation
     */
    async terminer(
        id: string,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<AffectationPoste> {
        const affectation = await this.findOne(id, etablissementId);

        if (affectation.statut === StatutAffectation.TERMINE) {
            throw new AppError('Cette affectation est déjà terminée', 400, 'AFFECTATION_ALREADY_TERMINATED');
        }

        const anciennesValeurs = {
            statut: affectation.statut,
            dateFin: affectation.dateFin,
        };

        affectation.statut = StatutAffectation.TERMINE;
        affectation.dateFin = new Date();
        await this.repo.save(affectation);

        // Libérer le poste (statut → VACANT)
        const posteRepo = AppDataSource.getRepository('Poste');
        await posteRepo.update(affectation.posteId, {
            statut: 'VACANT',
        });

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: 'AFFECTATION_POSTE_TERMINER' as any,
            cible: 'AffectationPoste',
            cibleId: id,
            description: `Terminaison affectation ${id}`,
            anciennesValeurs,
            nouvellesValeurs: { statut: 'TERMINE', dateFin: affectation.dateFin },
            module: 'personnel',
        }, req);

        logger.info(`Affectation terminée: ${id}`);
        return affectation;
    }

    /**
     * Récupérer une affectation par ID
     */
    async findOne(id: string, etablissementId: string): Promise<AffectationPoste> {
        const affectation = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur', 'poste', 'uniteOrganisationnelle', 'contrat'],
        });

        if (!affectation) {
            throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        }

        return affectation;
    }

    /**
     * Mettre à jour une affectation
     */
    async update(
        id: string,
        dto: UpdateAffectationDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<AffectationPoste> {
        const affectation = await this.findOne(id, etablissementId);

        const anciennesValeurs = {
            typeMutation: affectation.typeMutation,
            salaireAssocie: affectation.salaireAssocie,
            commentaire: affectation.commentaire,
        };

        if (dto.dateDebut) dto.dateDebut = new Date(dto.dateDebut) as any;
        if (dto.dateFin) dto.dateFin = new Date(dto.dateFin) as any;

        Object.assign(affectation, dto);
        await this.repo.save(affectation);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: 'AFFECTATION_POSTE_UPDATE' as any,
            cible: 'AffectationPoste',
            cibleId: id,
            description: `Modification affectation ${id}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'personnel',
        }, req);

        logger.info(`Affectation modifiée: ${id}`);
        return affectation;
    }

    /**
     * Détecter les affectations se terminant bientôt
     */
    async getAffectationsFinProche(
        jours: number,
        etablissementId: string
    ): Promise<AffectationPoste[]> {
        const dateLimite = new Date();
        dateLimite.setDate(dateLimite.getDate() + jours);

        return this.repo.find({
            where: {
                etablissementId,
                statut: StatutAffectation.ACTIF,
                dateFin: LessThanOrEqual(dateLimite) as any,
            },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur', 'poste'],
            order: { dateFin: 'ASC' },
        });
    }
}

export const affectationService = new AffectationService();
