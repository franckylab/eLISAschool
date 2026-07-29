/**
 * ==================================
 * eLISAschool - Service NiveauResponsabilite
 * ==================================
 * Éclaté depuis nomenclature.service.ts
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NiveauResponsabilite } from '../entities';
import { CreateNiveauResponsabiliteDto, UpdateNiveauResponsabiliteDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';
import { auditService, AuditAction } from '@modules/auth';

class NiveauResponsabiliteService {
    private repo: Repository<NiveauResponsabilite>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauResponsabilite);
    }

    async create(dto: CreateNiveauResponsabiliteDto, utilisateurId?: string): Promise<NiveauResponsabilite> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de niveau existe déjà', 409, 'NIVEAU_RESP_CODE_EXISTS');
        const entity = this.repo.create(dto);
        const saved = await this.repo.save(entity);
        await auditService.log({
            utilisateurId,
            action: AuditAction.NIVEAU_RESPONSABILITE_CREATE,
            cible: 'NiveauResponsabilite',
            cibleId: saved.id,
            description: `Création du niveau de responsabilité ${saved.label} (${saved.code})`,
            nouvellesValeurs: { label: dto.label, code: dto.code, niveau: dto.niveau },
            module: 'organisation',
            metadata: { entiteLabel: saved.label, entiteRef: saved.code },
        });
        return saved;
    }

    async findAll(etablissementId?: string): Promise<NiveauResponsabilite[]> {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        return qb.orderBy('n.niveau', 'DESC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(n.label ILIKE :search OR n.code ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('n.niveau = :niveau', { niveau });
        }
        qb.orderBy('n.niveau', 'DESC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string, etablissementId?: string): Promise<NiveauResponsabilite> {
        const qb = this.repo.createQueryBuilder('n').where('n.id = :id', { id });
        if (etablissementId) {
            // Visible si tenant OU global/système (nomenclatures partagées)
            qb.andWhere('(n.etablissementId = :eid OR n.etablissementId IS NULL OR n.estSysteme = TRUE)', { eid: etablissementId });
        }
        const entity = await qb.getOne();
        if (!entity) throw new AppError('Niveau de responsabilité non trouvé', 404, 'NIVEAU_RESP_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateNiveauResponsabiliteDto, etablissementId?: string, utilisateurId?: string): Promise<NiveauResponsabilite> {
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
            action: AuditAction.NIVEAU_RESPONSABILITE_UPDATE,
            cible: 'NiveauResponsabilite',
            cibleId: saved.id,
            description: `Modification du niveau de responsabilité ${saved.label} (${saved.code})`,
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
            action: AuditAction.NIVEAU_RESPONSABILITE_DELETE,
            cible: 'NiveauResponsabilite',
            cibleId: id,
            description: `Suppression du niveau de responsabilité ${anciennesValeurs.label} (${anciennesValeurs.code})`,
            anciennesValeurs,
            module: 'organisation',
            metadata: { entiteLabel: anciennesValeurs.label, entiteRef: anciennesValeurs.code },
        });
    }
}

export const niveauResponsabiliteService = new NiveauResponsabiliteService();
