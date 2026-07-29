/**
 * eLISAschool - Module Personnel/RH
 * Service pour la gestion des bulletins de paie
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { BulletinPaie, StatutBulletinPaie } from '../entities/bulletin-paie.entity';
import { ElementSalaire } from '../entities/element-salaire.entity';
import { ContratPersonnel } from '@modules/personnel/entities';
import { CreateBulletinPaieDto, UpdateBulletinPaieDto, QueryBulletinPaieDto } from '../dto/bulletin-paie.dto';
import { CreateElementSalaireDto, UpdateElementSalaireDto } from '../dto/paie-etendue.dto';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { calculPaieService } from './calcul-paie.service';
import { Request } from 'express';

export class BulletinPaieService {
    private repo: Repository<BulletinPaie>;
    private elementRepo: Repository<ElementSalaire>;
    private contratRepo: Repository<ContratPersonnel>;

    constructor() {
        this.repo = AppDataSource.getRepository(BulletinPaie);
        this.elementRepo = AppDataSource.getRepository(ElementSalaire);
        this.contratRepo = AppDataSource.getRepository(ContratPersonnel);
    }

    // ─── ÉLÉMENTS DE SALAIRE ───

    async getElements(bulletinId: string, etablissementId: string): Promise<ElementSalaire[]> {
        await this.findOne(bulletinId, etablissementId);
        return this.elementRepo.find({
            where: { bulletinPaieId: bulletinId },
            order: { ordreAffichage: 'ASC' },
        });
    }

    async addElement(bulletinId: string, dto: CreateElementSalaireDto, etablissementId: string, userId?: string, req?: Request): Promise<ElementSalaire> {
        await this.findOne(bulletinId, etablissementId);
        const element = new ElementSalaire();
        Object.assign(element, dto, { bulletinPaieId: bulletinId, etablissementId });
        await this.elementRepo.save(element);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.ELEMENT_SALAIRE_CREATE,
                cible: 'ElementSalaire',
                cibleId: element.id,
                description: `Ajout élément salaire ${dto.libelle} au bulletin ${bulletinId}`,
                nouvellesValeurs: dto,
                module: 'personnel',
                etablissementId,
                parentCible: 'BulletinPaie',
                parentCibleId: bulletinId,
            }, req);
        }
        return element;
    }

    async updateElement(bulletinId: string, elementId: string, dto: UpdateElementSalaireDto, etablissementId: string, userId?: string, req?: Request): Promise<ElementSalaire> {
        const element = await this.elementRepo.findOne({ where: { id: elementId, bulletinPaieId: bulletinId } });
        if (!element) throw new AppError('Élément de salaire non trouvé', 404, 'NOT_FOUND');

        const oldValues = { ...element };
        Object.assign(element, dto);
        await this.elementRepo.save(element);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.ELEMENT_SALAIRE_UPDATE,
                cible: 'ElementSalaire',
                cibleId: elementId,
                description: `Modification élément salaire ${element.libelle}`,
                anciennesValeurs: oldValues,
                nouvellesValeurs: dto,
                module: 'personnel',
                etablissementId,
                parentCible: 'BulletinPaie',
                parentCibleId: bulletinId,
            }, req);
        }
        return element;
    }

    async deleteElement(bulletinId: string, elementId: string, etablissementId: string, userId?: string, req?: Request): Promise<void> {
        const element = await this.elementRepo.findOne({ where: { id: elementId, bulletinPaieId: bulletinId } });
        if (!element) throw new AppError('Élément de salaire non trouvé', 404, 'NOT_FOUND');
        await this.elementRepo.remove(element);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.ELEMENT_SALAIRE_DELETE,
                cible: 'ElementSalaire',
                cibleId: elementId,
                description: `Suppression élément salaire ${element.libelle} du bulletin ${bulletinId}`,
                module: 'personnel',
                etablissementId,
                parentCible: 'BulletinPaie',
                parentCibleId: bulletinId,
            }, req);
        }
    }

    async create(dto: CreateBulletinPaieDto, etablissementId: string, createurId?: string, req?: Request) {
        // Vérifier si validation requise
        const requireValidation = await getParamBoolean('personnel.paie.require_validation', { defaultValue: true });

        // Le contrat fournit le salaire de base (vérification tenant incluse)
        const contrat = await this.contratRepo.findOne({
            where: { id: dto.contratId, etablissementId },
        });
        if (!contrat) {
            throw new AppError('Contrat non trouvé pour cet établissement', 404, 'NOT_FOUND');
        }
        if (contrat.membrePersonnelId !== dto.membrePersonnelId) {
            throw new AppError('Le contrat ne correspond pas au membre du personnel', 400, 'CONTRAT_MEMBRE_MISMATCH');
        }

        // Unicité : un bulletin par membre/mois/année
        const existant = await this.repo.findOne({
            where: { membrePersonnelId: dto.membrePersonnelId, mois: dto.mois, annee: dto.annee, etablissementId },
        });
        if (existant) {
            throw new AppError(`Un bulletin existe déjà pour ${dto.mois}/${dto.annee}`, 409, 'BULLETIN_EXISTS');
        }

        const salaireBase = Number(contrat.salaireBase) || 0;
        const salaireNet = this.calculerSalaireNet({ ...dto, salaireBase });

        const entity = this.repo.create({
            ...dto,
            salaireBase,
            salaireNet,
            heuresEffectuees: 0,
            montantHeuresSup: 0,
            statut: requireValidation ? StatutBulletinPaie.EN_ATTENTE_VALIDATION : StatutBulletinPaie.GENERE,
            etablissementId,
        });
        await this.repo.save(entity);

        // Créer workflow si nécessaire
        if (requireValidation && createurId) {
            try {
                await validationWorkflowService.createWorkflow({
                    module: 'personnel',
                    entiteId: entity.id,
                    entiteType: 'BulletinPaie',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);
                
                logger.info(`[Paie] Workflow créé pour bulletin: ${entity.id}`);
            } catch (error) {
                logger.warn(`[Paie] Échec création workflow bulletin (non bloquant)`, error);
            }
        }

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.BULLETIN_PAI_CREATE,
                cible: 'BulletinPaie',
                cibleId: entity.id,
                description: `Création bulletin paie ${entity.id} - Statut: ${entity.statut}`,
                nouvellesValeurs: dto,
                module: 'personnel',
                etablissementId,
                parentCible: 'MembrePersonnel',
                parentCibleId: dto.membrePersonnelId,
            }, req);
        }

        logger.info(`Bulletin de paie créé: ${entity.id} - Statut: ${entity.statut}`);
        return entity;
    }

    async findAll(query: QueryBulletinPaieDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('bulletin')
            .where('bulletin.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('bulletin.membrePersonnel', 'membrePersonnel')
            .leftJoinAndSelect('membrePersonnel.utilisateur', 'u')
            .orderBy('bulletin.annee', 'DESC')
            .addOrderBy('bulletin.mois', 'DESC');

        // Filtres
        if (query.membrePersonnelId) {
            qb.andWhere('bulletin.membrePersonnelId = :membreId', { membreId: query.membrePersonnelId });
        }
        if (query.mois) {
            qb.andWhere('bulletin.mois = :mois', { mois: query.mois });
        }
        if (query.annee) {
            qb.andWhere('bulletin.annee = :annee', { annee: query.annee });
        }
        if (query.statut) {
            qb.andWhere('bulletin.statut = :statut', { statut: query.statut });
        }

        return paginateWithQueryBuilder(qb, query.page, query.limit);
    }

    async findOne(id: string, etablissementId: string) {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['membrePersonnel'],
        });

        if (!entity) {
            throw new AppError('Bulletin de paie non trouvé', 404, 'NOT_FOUND');
        }

        return entity;
    }

    async update(id: string, dto: UpdateBulletinPaieDto, userId: string, etablissementId: string, req?: Request) {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);

        // Recalculer le salaire net si primes ou deductions modifiés
        if (dto.primes !== undefined || dto.deductions !== undefined) {
            entity.salaireNet = this.calculerSalaireNet({
                ...entity,
                ...dto,
            });
        }

        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.BULLETIN_PAI_UPDATE,
            cible: 'BulletinPaie',
            cibleId: id,
            description: `Modification bulletin paie ${id}`,
            nouvellesValeurs: dto,
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel',
            parentCibleId: entity.membrePersonnelId,
        }, req);

        return entity;
    }

    async delete(id: string, userId: string, etablissementId: string, req?: Request) {
        const entity = await this.findOne(id, etablissementId);

        // Un bulletin validé ou payé ne peut pas être supprimé : on l'annule (traçabilité)
        if (entity.statut === StatutBulletinPaie.VALIDE || entity.statut === StatutBulletinPaie.PAYE) {
            if (entity.statut === StatutBulletinPaie.PAYE) {
                throw new AppError('Un bulletin payé ne peut être ni supprimé ni annulé', 400, 'BULLETIN_PAYE');
            }
            entity.statut = StatutBulletinPaie.ANNULE;
            await this.repo.save(entity);

            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.BULLETIN_PAI_UPDATE,
                cible: 'BulletinPaie',
                cibleId: id,
                description: `Annulation bulletin paie ${id} (validé, suppression interdite)`,
                module: 'personnel',
                etablissementId,
                parentCible: 'MembrePersonnel',
                parentCibleId: entity.membrePersonnelId,
            }, req);

            return { success: true, annule: true };
        }

        await this.repo.softRemove(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.BULLETIN_PAI_DELETE,
            cible: 'BulletinPaie',
            cibleId: id,
            description: `Suppression (soft) bulletin paie ${id}`,
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel',
            parentCibleId: entity.membrePersonnelId,
        }, req);

        return { success: true };
    }

    async genererBulletin(
        membreId: string,
        mois: number,
        annee: number,
        etablissementId: string,
        userId: string,
        req?: Request
    ) {
        // Délègue le calcul à CalculPaieService (évite la duplication)
        const bulletin = await calculPaieService.calculerBulletin(
            membreId, mois, annee, etablissementId,
            { userId, req, checkConflict: 'THROW' }
        );

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.BULLETIN_PAI_GENERER,
            cible: 'BulletinPaie',
            cibleId: bulletin.id,
            description: `Génération bulletin paie ${bulletin.id} pour ${mois}/${annee}`,
            nouvellesValeurs: { mois, annee, membreId },
            module: 'personnel',
            etablissementId,
            parentCible: 'MembrePersonnel',
            parentCibleId: membreId,
            metadata: {
                entiteLabel: `Bulletin ${mois}/${annee}`,
                relations: { personnel: { id: membreId } },
            },
        }, req);

        logger.info(`Bulletin généré: ${bulletin.id} pour ${membreId} - ${mois}/${annee}`);
        return bulletin;
    }

    async getTotalPaiesMensuelles(mois: number, annee: number, etablissementId: string) {
        const result = await this.repo
            .createQueryBuilder('bulletin')
            .where('bulletin.etablissementId = :etablissementId', { etablissementId })
            .andWhere('bulletin.mois = :mois', { mois })
            .andWhere('bulletin.annee = :annee', { annee })
            .select([
                'COUNT(bulletin.id) as nombreBulletins',
                'SUM(bulletin.salaireBase) as totalSalairesBase',
                'SUM(bulletin.montantHeuresSup) as totalHeuresSup',
                'SUM(bulletin.primes) as totalPrimes',
                'SUM(bulletin.deductions) as totalDeductions',
                'SUM(bulletin.salaireNet) as totalSalairesNets',
            ])
            .getRawOne();

        return {
            nombreBulletins: parseInt(result.nombreBulletins) || 0,
            totalSalairesBase: parseFloat(result.totalSalairesBase) || 0,
            totalHeuresSup: parseFloat(result.totalHeuresSup) || 0,
            totalPrimes: parseFloat(result.totalPrimes) || 0,
            totalDeductions: parseFloat(result.totalDeductions) || 0,
            totalSalairesNets: parseFloat(result.totalSalairesNets) || 0,
        };
    }

    private calculerSalaireNet(dto: { salaireBase?: number; montantHeuresSup?: number; primes?: number; deductions?: number }): number {
        const salaireBase = Number(dto.salaireBase) || 0;
        const montantHeuresSup = Number(dto.montantHeuresSup) || 0;
        const primes = Number(dto.primes) || 0;
        const deductions = Number(dto.deductions) || 0;

        return +(salaireBase + montantHeuresSup + primes - deductions).toFixed(2);
    }
}

export const bulletinPaieService = new BulletinPaieService();
