import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ModeRemunerationEntity } from '../entities';
import { CreateModeRemunerationDto, UpdateModeRemunerationDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { assertNotSystem } from '@common/utils/system-guard.util';

class ModeRemunerationService {
    private repo: Repository<ModeRemunerationEntity>;

    constructor() {
        this.repo = AppDataSource.getRepository(ModeRemunerationEntity);
    }

    async create(dto: CreateModeRemunerationDto): Promise<ModeRemunerationEntity> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? undefined } });
        if (existing) throw new AppError('Ce code de mode de rémunération existe déjà', 409, 'MODE_REMUNERATION_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<ModeRemunerationEntity[]> {
        const qb = this.repo.createQueryBuilder('m');
        if (etablissementId) {
            qb.where('(m.etablissementId = :eid OR m.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(m.etablissementId IS NULL OR m.estSysteme = TRUE)');
        }
        return qb.orderBy('m.label', 'ASC').getMany();
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('m');
        if (etablissementId) {
            qb.where('(m.etablissementId = :eid OR m.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(m.etablissementId IS NULL OR m.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(m.label ILIKE :search OR m.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('m.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string, etablissementId?: string): Promise<ModeRemunerationEntity> {
        const where: FindOptionsWhere<ModeRemunerationEntity> = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const entity = await this.repo.findOne({ where });
        if (!entity) throw new AppError('Mode de rémunération non trouvé', 404, 'MODE_REMUNERATION_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateModeRemunerationDto, etablissementId?: string): Promise<ModeRemunerationEntity> {
        const entity = await this.findById(id, etablissementId);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const entity = await this.findById(id, etablissementId);
        assertNotSystem(entity, 'supprimer');
        await this.repo.remove(entity);
    }
}

export const modeRemunerationService = new ModeRemunerationService();
