import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TypeUniteOrganisationnelle } from '../entities';
import { CreateTypeUniteOrganisationnelleDto, UpdateTypeUniteOrganisationnelleDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class TypeUniteOrganisationnelleService {
    private repo: Repository<TypeUniteOrganisationnelle>;

    constructor() {
        this.repo = AppDataSource.getRepository(TypeUniteOrganisationnelle);
    }

    async create(dto: CreateTypeUniteOrganisationnelleDto): Promise<TypeUniteOrganisationnelle> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de type d\'unité existe déjà', 409, 'TYPE_UNITE_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<TypeUniteOrganisationnelle[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { label: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(t.label ILIKE :search OR t.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('t.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<TypeUniteOrganisationnelle> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Type d\'unité non trouvé', 404, 'TYPE_UNITE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTypeUniteOrganisationnelleDto): Promise<TypeUniteOrganisationnelle> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        assertNotSystem(entity, 'supprimer');
        await this.repo.remove(entity);
    }
}

export const typeUniteOrganisationnelleService = new TypeUniteOrganisationnelleService();
