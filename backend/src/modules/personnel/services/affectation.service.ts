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
import { Poste } from '@modules/organisation/entities';
import { recalculerOccupantsEtStatut, verifierCapacitePoste } from './poste-occupation.helper';
import { Request } from 'express';

export class AffectationService {
    private repo: Repository<AffectationPoste>;

    constructor() {
        this.repo = AppDataSource.getRepository(AffectationPoste);
    }

    /**
     * Charge un poste et vérifie qu'il appartient bien à l'établissement (via son unité).
     */
    private async chargerPosteVerifie(
        manager: { getRepository: typeof AppDataSource.getRepository },
        posteId: string,
        etablissementId: string,
    ): Promise<Poste> {
        const poste = await manager.getRepository(Poste).findOne({
            where: { id: posteId },
            relations: ['uniteOrganisationnelle'],
        });
        if (!poste) throw new AppError('Poste non trouvé', 404, 'POSTE_NOT_FOUND');
        const uniteEtab = poste.uniteOrganisationnelle?.etablissementId;
        if (uniteEtab && uniteEtab !== etablissementId) {
            throw new AppError('Poste non trouvé', 404, 'POSTE_NOT_FOUND');
        }
        return poste;
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
            req?: Request;
        },
    ): Promise<{ poste: any; affectation: AffectationPoste }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Charger le poste avec validation tenant (via son unité)
            const poste = await this.chargerPosteVerifie(queryRunner.manager, posteId, etablissementId);

            // Vérifier la capacité du poste (multi-occupants selon nombrePostes)
            await verifierCapacitePoste(poste, membrePersonnelId, queryRunner.manager);

            // 2. Terminer l'ancienne affectation active si existante
            const ancienneActive = await queryRunner.manager.findOne(AffectationPoste, {
                where: { membrePersonnelId, etablissementId, statut: StatutAffectation.ACTIF },
            });
            if (ancienneActive) {
                ancienneActive.statut = StatutAffectation.TERMINE;
                ancienneActive.dateFin = new Date();
                await queryRunner.manager.save(ancienneActive);
            }

            // 3. Créer la nouvelle affectation
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

            // 4. Synchroniser occupantsCount + statut des postes impactés
            await recalculerOccupantsEtStatut(posteId, queryRunner.manager);
            if (ancienneActive && ancienneActive.posteId !== posteId) {
                await recalculerOccupantsEtStatut(ancienneActive.posteId, queryRunner.manager);
            }

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
        req?: Request
    ): Promise<AffectationPoste> {
        // Déterminer si validation requise AVANT transaction
        const requireValidation = await getParamBoolean('personnel.affectation_require_validation', { defaultValue: false });
        const necessiteValidation = requireValidation && dto.typeMutation !== TypeMutation.NOUVELLE;
        const statutInitial = necessiteValidation ? StatutAffectation.EN_ATTENTE : StatutAffectation.ACTIF;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Vérifier si le poste existe, appartient à l'établissement, et a encore de la capacité
            const poste = await this.chargerPosteVerifie(queryRunner.manager, dto.posteId, etablissementId);
            // Vérifier la capacité du poste (multi-occupants selon nombrePostes)
            await verifierCapacitePoste(poste, dto.membrePersonnelId, queryRunner.manager);

            // Terminer l'ancienne affectation active UNIQUEMENT si la nouvelle est directement ACTIF
            let affectationActive: AffectationPoste | null = null;
            if (statutInitial === StatutAffectation.ACTIF) {
                affectationActive = await this.repo.findOne({
                    where: {
                        membrePersonnelId: dto.membrePersonnelId,
                        etablissementId,
                        statut: StatutAffectation.ACTIF,
                    },
                });

                if (affectationActive) {
                    affectationActive.statut = StatutAffectation.TERMINE;
                    affectationActive.dateFin = new Date();
                    await queryRunner.manager.save(affectationActive);
                    logger.info(`Affectation ${affectationActive.id} terminée automatiquement`);
                }
            }

            // Créer la nouvelle affectation
            const affectation = new AffectationPoste();
            Object.assign(affectation, dto, {
                dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
                dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
                statut: statutInitial,
                etablissementId,
                uniteOrganisationnelleId: dto.uniteOrganisationnelleId || poste.uniteOrganisationnelleId,
            });

            await queryRunner.manager.save(affectation);

            // Synchroniser occupantsCount + statut des postes impactés (seulement si ACTIF)
            if (statutInitial === StatutAffectation.ACTIF) {
                await recalculerOccupantsEtStatut(dto.posteId, queryRunner.manager);
                if (affectationActive && affectationActive.posteId !== dto.posteId) {
                    await recalculerOccupantsEtStatut(affectationActive.posteId, queryRunner.manager);
                }
            }

            await queryRunner.commitTransaction();

            // Workflow validation si requis pour mutations
            if (necessiteValidation && createurId) {
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
                    action: AuditAction.AFFECTATION_POSTE_CREATE,
                    cible: 'AffectationPoste',
                    cibleId: affectation.id,
                    description: `Création affectation ${dto.typeMutation} poste ${dto.posteId}`,
                    nouvellesValeurs: dto,
                    module: 'personnel',
                    etablissementId,
                    parentCible: 'MembrePersonnel', parentCibleId: dto.membrePersonnelId,
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
        req?: Request
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

        // Synchroniser occupantsCount + statut du poste (VACANT si plus d'occupant actif)
        await recalculerOccupantsEtStatut(affectation.posteId);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.AFFECTATION_POSTE_TERMINER,
            cible: 'AffectationPoste',
            cibleId: id,
            description: `Terminaison affectation ${id}`,
            anciennesValeurs,
            nouvellesValeurs: { statut: 'TERMINE', dateFin: affectation.dateFin },
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel', parentCibleId: affectation.membrePersonnelId,
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
        req?: Request
    ): Promise<AffectationPoste> {
        const affectation = await this.findOne(id, etablissementId);

        const anciennesValeurs = {
            typeMutation: affectation.typeMutation,
            salaireAssocie: affectation.salaireAssocie,
            commentaire: affectation.commentaire,
        };

        // Fusionner les changements de dates (conversion string -> Date) sans muter le DTO
        const dateChanges: Partial<AffectationPoste> = {};
        if (dto.dateDebut) dateChanges.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin) dateChanges.dateFin = new Date(dto.dateFin);

        Object.assign(affectation, dto, dateChanges);
        await this.repo.save(affectation);

        // Audit
        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.AFFECTATION_POSTE_UPDATE,
            cible: 'AffectationPoste',
            cibleId: id,
            description: `Modification affectation ${id}`,
            anciennesValeurs,
            nouvellesValeurs: dto,
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel', parentCibleId: affectation.membrePersonnelId,
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
                dateFin: LessThanOrEqual(dateLimite),
            },
            relations: ['membrePersonnel', 'membrePersonnel.utilisateur', 'poste'],
            order: { dateFin: 'ASC' },
        });
    }
}

export const affectationService = new AffectationService();
