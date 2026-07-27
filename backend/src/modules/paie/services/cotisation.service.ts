import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Cotisation } from '../entities/cotisation.entity';
import { CreateCotisationDto, UpdateCotisationDto } from '../dto/paie-etendue.dto';
import { AppError } from '@common/filters/error.filter';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class CotisationService {
    private repo: Repository<Cotisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(Cotisation);
    }

    async create(dto: CreateCotisationDto, etablissementId: string, userId?: string, req?: any): Promise<Cotisation> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId } });
        if (existing) throw new AppError('Une cotisation avec ce code existe déjà', 409, 'COTISATION_EXISTS');

        const entity = new Cotisation();
        Object.assign(entity, dto, { etablissementId });
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.COTISATION_CREATE, cible: 'Cotisation', cibleId: entity.id, description: `Création cotisation ${dto.code}`, nouvellesValeurs: dto, module: 'personnel' }, req);
        }
        return entity;
    }

    async findAll(etablissementId: string): Promise<Cotisation[]> {
        return this.repo.find({ where: { etablissementId }, order: { code: 'ASC' } });
    }

    async findOne(id: string, etablissementId: string): Promise<Cotisation> {
        const entity = await this.repo.findOne({ where: { id, etablissementId } });
        if (!entity) throw new AppError('Cotisation non trouvée', 404, 'NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateCotisationDto, etablissementId: string, userId?: string, req?: any): Promise<Cotisation> {
        const entity = await this.findOne(id, etablissementId);
        const oldValues = { ...entity };
        Object.assign(entity, dto);
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.COTISATION_UPDATE, cible: 'Cotisation', cibleId: id, description: `Mise à jour cotisation ${entity.code}`, anciennesValeurs: oldValues, nouvellesValeurs: dto, module: 'personnel' }, req);
        }
        return entity;
    }

    async delete(id: string, etablissementId: string, userId?: string, req?: any): Promise<void> {
        const entity = await this.findOne(id, etablissementId);
        await this.repo.remove(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: AuditAction.COTISATION_DELETE, cible: 'Cotisation', cibleId: id, description: `Suppression cotisation ${entity.code}`, module: 'personnel' }, req);
        }
    }
}

export const cotisationService = new CotisationService();
