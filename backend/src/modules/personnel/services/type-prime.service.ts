import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypePrime } from '../entities/type-prime.entity';
import { CreateTypePrimeDto, UpdateTypePrimeDto } from '../dto/paie-etendue.dto';
import { AppError } from '@common/filters/error.filter';
import { auditService } from '@modules/auth/services/audit.service';

export class TypePrimeService {
    private repo: Repository<TypePrime>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypePrime);
    }

    async create(dto: CreateTypePrimeDto, etablissementId: string, userId?: string, req?: any): Promise<TypePrime> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId } });
        if (existing) throw new AppError('Un type de prime avec ce code existe déjà', 409, 'PRIME_EXISTS');

        const entity = new TypePrime();
        Object.assign(entity, dto, { etablissementId });
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: 'PRIME_CREATE' as any, cible: 'TypePrime', cibleId: entity.id, description: `Création type prime ${dto.code}`, nouvellesValeurs: dto, module: 'personnel' }, req);
        }
        return entity;
    }

    async findAll(etablissementId: string): Promise<TypePrime[]> {
        return this.repo.find({ where: { etablissementId }, order: { code: 'ASC' } });
    }

    async findOne(id: string, etablissementId: string): Promise<TypePrime> {
        const entity = await this.repo.findOne({ where: { id, etablissementId } });
        if (!entity) throw new AppError('Type de prime non trouvé', 404, 'NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTypePrimeDto, etablissementId: string, userId?: string, req?: any): Promise<TypePrime> {
        const entity = await this.findOne(id, etablissementId);
        const oldValues = { ...entity };
        Object.assign(entity, dto);
        await this.repo.save(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: 'PRIME_UPDATE' as any, cible: 'TypePrime', cibleId: id, description: `Mise à jour type prime ${entity.code}`, anciennesValeurs: oldValues, nouvellesValeurs: dto, module: 'personnel' }, req);
        }
        return entity;
    }

    async delete(id: string, etablissementId: string, userId?: string, req?: any): Promise<void> {
        const entity = await this.findOne(id, etablissementId);
        await this.repo.remove(entity);

        if (userId) {
            await auditService.log({ utilisateurId: userId, action: 'PRIME_DELETE' as any, cible: 'TypePrime', cibleId: id, description: `Suppression type prime ${entity.code}`, module: 'personnel' }, req);
        }
    }
}

export const typePrimeService = new TypePrimeService();
