/**
 * ==================================
 * eLISAschool - Service Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Description: Service pour gérer les relations entre parents et élèves.
 * Permet de créer, modifier, supprimer et consulter les responsabilités.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ResponsableEleve, LienParente } from '../entities';
import { LierParentDto, UpdateResponsableDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Role } from '@modules/auth/entities';
import { Utilisateur } from '@modules/auth/entities/utilisateur.entity';
import { auditService, AuditAction } from '@modules/auth';
import { Request } from 'express';

export class ParentsService {
    private responsableRepo: Repository<ResponsableEleve>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.responsableRepo = AppDataSource.getRepository(ResponsableEleve);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Lier un parent à un élève
     */
    async lierParent(dto: LierParentDto, req?: Request): Promise<ResponsableEleve> {
        // 1. Vérifier que l'utilisateur parent existe et a le rôle PARENT
        const parent = await this.utilisateurRepo.findOne({
            where: { id: dto.parentId },
        });

        if (!parent) {
            throw new AppError('Parent non trouvé', 404, 'PARENT_NOT_FOUND');
        }

        // Vérifier le rôle (peut être dans utilisateurRoles ou role principal)
        const estParent = parent.role === Role.PARENT || 
            (parent.utilisateurRoles?.some(ur => ur.role?.code === Role.PARENT) ?? false);
        
        // On permet aussi aux ADMIN de créer des relations
        if (!estParent && parent.role !== Role.ADMIN && parent.role !== Role.SUPER_ADMIN) {
            throw new AppError('L\'utilisateur doit avoir le rôle PARENT', 400, 'INVALID_PARENT_ROLE');
        }

        // 2. Vérifier que l'enfant existe
        const enfant = await this.utilisateurRepo.findOne({
            where: { id: dto.enfantId },
        });

        if (!enfant) {
            throw new AppError('Élève non trouvé', 404, 'CHILD_NOT_FOUND');
        }

        // 3. Vérifier que la relation n'existe pas déjà
        const existing = await this.responsableRepo.findOne({
            where: {
                utilisateurId: dto.parentId,
                enfantId: dto.enfantId,
            },
        });

        if (existing) {
            throw new AppError('Ce parent est déjà lié à cet élève', 409, 'RELATION_ALREADY_EXISTS');
        }

        // 4. Créer la relation
        const responsable = this.responsableRepo.create({
            utilisateurId: dto.parentId,
            enfantId: dto.enfantId,
            lienParente: dto.lienParente,
            responsableLegal: dto.responsableLegal,
            peutConsulter: dto.peutConsulter,
            peutPayer: dto.peutPayer,
            email: dto.email ?? undefined,
            telephone: dto.telephone ?? undefined,
            adresse: dto.adresse ?? undefined,
        });

        await this.responsableRepo.save(responsable);

        // 5. Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'CREATE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève créée: ${dto.lienParente}`,
                nouvellesValeurs: dto,
                module: 'responsables-eleves',
            }, req);
        }

        logger.info(`Relation parent-élève créée: ${dto.lienParente} - Parent: ${dto.parentId}, Enfant: ${dto.enfantId}`);
        
        // Retourner avec les relations
        return this.responsableRepo.findOne({
            where: { id: responsable.id },
            relations: ['utilisateur', 'enfant'],
        }) as Promise<ResponsableEleve>;
    }

    /**
     * Récupérer tous les parents d'un élève
     */
    async getParentsEleve(enfantUtilisateurId: string): Promise<ResponsableEleve[]> {
        return this.responsableRepo.find({
            where: {
                enfantId: enfantUtilisateurId,
                actif: true,
            },
            relations: ['utilisateur'],
            order: {
                responsableLegal: 'DESC',
                dateAjout: 'ASC',
            },
        });
    }

    /**
     * Récupérer tous les enfants d'un parent
     */
    async getEnfantsParent(parentUtilisateurId: string): Promise<ResponsableEleve[]> {
        return this.responsableRepo.find({
            where: {
                utilisateurId: parentUtilisateurId,
                actif: true,
            },
            relations: ['enfant'],
            order: {
                dateAjout: 'ASC',
            },
        });
    }

    /**
     * Vérifier si un parent peut accéder à un élève
     */
    async peutAccederEleve(parentId: string, eleveUtilisateurId: string): Promise<boolean> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId: eleveUtilisateurId,
                actif: true,
                peutConsulter: true,
            },
        });

        return !!responsable;
    }

    /**
     * Vérifier si un parent peut payer pour un élève
     */
    async peutPayerPourEleve(parentId: string, eleveUtilisateurId: string): Promise<boolean> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId: eleveUtilisateurId,
                actif: true,
                peutPayer: true,
            },
        });

        return !!responsable;
    }

    /**
     * Modifier une relation parent-élève
     */
    async updateResponsable(
        parentId: string,
        enfantId: string,
        dto: UpdateResponsableDto,
        req?: Request
    ): Promise<ResponsableEleve> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
            },
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        const anciennesValeurs = {
            lienParente: responsable.lienParente,
            responsableLegal: responsable.responsableLegal,
            peutConsulter: responsable.peutConsulter,
            peutPayer: responsable.peutPayer,
        };

        Object.assign(responsable, dto);
        await this.responsableRepo.save(responsable);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'UPDATE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève modifiée`,
                anciennesValeurs,
                nouvellesValeurs: dto,
                module: 'responsables-eleves',
            }, req);
        }

        logger.info(`Relation parent-élève modifiée: ${responsable.id}`);

        return this.responsableRepo.findOne({
            where: { id: responsable.id },
            relations: ['utilisateur', 'enfant'],
        }) as Promise<ResponsableEleve>;
    }

    /**
     * Supprimer une relation parent-élève (soft delete)
     */
    async deleteResponsable(parentId: string, enfantId: string, req?: Request): Promise<void> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
                actif: true,
            },
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        const anciennesValeurs = {
            lienParente: responsable.lienParente,
            email: responsable.email,
            telephone: responsable.telephone,
        };

        // Soft delete
        responsable.actif = false;
        await this.responsableRepo.save(responsable);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: 'DELETE' as any,
                cible: 'ResponsableEleve',
                cibleId: responsable.id,
                description: `Relation parent-élève supprimée`,
                anciennesValeurs,
                module: 'responsables-eleves',
                severity: 'WARNING' as any,
            }, req);
        }

        logger.info(`Relation parent-élève supprimée: ${responsable.id}`);
    }

    /**
     * Récupérer les responsables pour notification (format simplifié)
     * Méthode utilitaire pour les autres services (notes, bulletins, cantine, etc.)
     */
    async getResponsablesForNotification(eleveUtilisateurId: string): Promise<Array<{
        utilisateurId: string;
        email?: string;
        telephone?: string;
        peutConsulter: boolean;
        peutPayer: boolean;
    }>> {
        const responsables = await this.responsableRepo.find({
            where: {
                enfantId: eleveUtilisateurId,
                actif: true,
            },
            select: ['utilisateurId', 'email', 'telephone', 'peutConsulter', 'peutPayer'],
        });

        return responsables.map(r => ({
            utilisateurId: r.utilisateurId,
            email: r.email,
            telephone: r.telephone,
            peutConsulter: r.peutConsulter,
            peutPayer: r.peutPayer,
        }));
    }

    /**
     * Récupérer une relation spécifique
     */
    async findOne(parentId: string, enfantId: string): Promise<ResponsableEleve> {
        const responsable = await this.responsableRepo.findOne({
            where: {
                utilisateurId: parentId,
                enfantId,
            },
            relations: ['utilisateur', 'enfant'],
        });

        if (!responsable) {
            throw new AppError('Relation parent-élève non trouvée', 404, 'RELATION_NOT_FOUND');
        }

        return responsable;
    }
}

export const parentsService = new ParentsService();
export default ParentsService;
