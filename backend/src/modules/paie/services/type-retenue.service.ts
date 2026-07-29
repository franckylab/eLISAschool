import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeRetenue } from '../entities/type-retenue.entity';
import { CreateTypeRetenueDto, UpdateTypeRetenueDto } from '../dto/paie-etendue.dto';
import { AppError } from '@common/filters/error.filter';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';
import { Request } from 'express';

export class TypeRetenueService {
    private repo: Repository<TypeRetenue>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypeRetenue);
    }

    async create(dto: CreateTypeRetenueDto, etablissementId: string, userId?: string, req?: Request): Promise<TypeRetenue> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId } });
        if (existing) throw new AppError('Un type de retenue avec ce code existe déjà', 409, 'RETENUE_EXISTS');

        const entity = new TypeRetenue();
        Object.assign(entity, dto, { etablissementId });
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.RETENUE_CREATE, cible: 'TypeRetenue', cibleId: entity.id, description: `Création type retenue ${dto.code}`, nouvellesValeurs: dto, module: 'personnel', etablissementId }, req);
        }
        return entity;
    }

    async findAll(etablissementId: string): Promise<TypeRetenue[]> {
        return this.repo.find({ where: { etablissementId }, order: { code: 'ASC' } });
    }

    async findOne(id: string, etablissementId: string): Promise<TypeRetenue> {
        const entity = await this.repo.findOne({ where: { id, etablissementId } });
        if (!entity) throw new AppError('Type de retenue non trouvé', 404, 'NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTypeRetenueDto, etablissementId: string, userId?: string, req?: Request): Promise<TypeRetenue> {
        const entity = await this.findOne(id, etablissementId);
        const oldValues = { ...entity };
        Object.assign(entity, dto);
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.RETENUE_UPDATE, cible: 'TypeRetenue', cibleId: id, description: `Mise à jour type retenue ${entity.code}`, anciennesValeurs: oldValues, nouvellesValeurs: dto, module: 'personnel', etablissementId }, req);
        }
        return entity;
    }

    async delete(id: string, etablissementId: string, userId?: string, req?: Request): Promise<void> {
        const entity = await this.findOne(id, etablissementId);
        await this.repo.remove(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.RETENUE_DELETE, cible: 'TypeRetenue', cibleId: id, description: `Suppression type retenue ${entity.code}`, module: 'personnel', etablissementId }, req);
        }
    }
}

export const typeRetenueService = new TypeRetenueService();
