/**
 * ==================================
 * eLISAschool - Service EchelonStructurel
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Service de gestion des échelons structurels (fusion NiveauOrganisation + UsageUnite).
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { EchelonStructurel } from '../entities';
import {
    CreateEchelonStructurelDto,
    UpdateEchelonStructurelDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';
import { auditService, AuditAction } from '@modules/auth';

class EchelonStructurelService {
    private repo: Repository<EchelonStructurel>;

    constructor() {
        this.repo = AppDataSource.getRepository(EchelonStructurel);
    }

    async create(dto: CreateEchelonStructurelDto, utilisateurId?: string): Promise<EchelonStructurel> {
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.ECHELON_STRUCTUREL_CREATE,
            cible: 'EchelonStructurel',
            cibleId: saved.id,
            description: `Création de l'échelon structurel ${saved.label} (${saved.code})`,
            nouvellesValeurs: { label: dto.label, code: dto.code, niveau: dto.niveau },
            module: 'organisation',
            metadata: { entiteLabel: saved.label, entiteRef: saved.code },
        });
        return saved;
    }

    async findAll(etablissementId?: string): Promise<EchelonStructurel[]> {
        const qb = this.repo.createQueryBuilder('e');
        if (etablissementId) {
            qb.where('(e.etablissementId = :eid OR e.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(e.etablissementId IS NULL OR e.estSysteme = TRUE)');
        }
        return qb.orderBy('e.niveau', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('e');
        if (etablissementId) {
            qb.where('(e.etablissementId = :eid OR e.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(e.etablissementId IS NULL OR e.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(e.label ILIKE :search OR e.code ILIKE :search OR e.description ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('e.niveau = :niveau', { niveau });
        }
        qb.orderBy('e.niveau', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string, etablissementId?: string): Promise<EchelonStructurel> {
        const qb = this.repo.createQueryBuilder('e').where('e.id = :id', { id });
        if (etablissementId) {
            // Visible si tenant OU global/système (nomenclatures partagées)
            qb.andWhere('(e.etablissementId = :eid OR e.etablissementId IS NULL OR e.estSysteme = TRUE)', { eid: etablissementId });
        }
        const entity = await qb.getOne();
        if (!entity) throw new AppError('Échelon structurel non trouvé', 404, 'ECHELON_STRUCTUREL_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateEchelonStructurelDto, etablissementId?: string, utilisateurId?: string): Promise<EchelonStructurel> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'modifier');
        const anciennesValeurs: Record<string, unknown> = {};
        const nouvellesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (entity as unknown as Record<string, unknown>)[key];
            nouvellesValeurs[key] = (dto as Record<string, unknown>)[key];
        }
        Object.assign(entity, dto);
        const saved = await this.repo.save(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.ECHELON_STRUCTUREL_UPDATE,
            cible: 'EchelonStructurel',
            cibleId: saved.id,
            description: `Modification de l'échelon structurel ${saved.label} (${saved.code})`,
            anciennesValeurs,
            nouvellesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: saved.label, entiteRef: saved.code },
        });
        return saved;
    }

    async delete(id: string, etablissementId?: string, utilisateurId?: string): Promise<void> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'supprimer');
        const anciennesValeurs = { label: entity.label, code: entity.code, niveau: entity.niveau };
        await this.repo.remove(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.ECHELON_STRUCTUREL_DELETE,
            cible: 'EchelonStructurel',
            cibleId: id,
            description: `Suppression de l'échelon structurel ${anciennesValeurs.label} (${anciennesValeurs.code})`,
            anciennesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: anciennesValeurs.label, entiteRef: anciennesValeurs.code },
        });
    }
}

export const echelonStructurelService = new EchelonStructurelService();
