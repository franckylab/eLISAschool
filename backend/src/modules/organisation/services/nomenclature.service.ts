import { Repository, Like } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    NiveauOrganisation,
    UsageUnite,
    CategoriePoste,
    NiveauResponsabilite,
    TemplateOrganisation,
} from '../entities';
import {
    CreateNiveauOrganisationDto,
    UpdateNiveauOrganisationDto,
    CreateUsageUniteDto,
    UpdateUsageUniteDto,
    CreateCategoriePosteDto,
    UpdateCategoriePosteDto,
    CreateNiveauResponsabiliteDto,
    UpdateNiveauResponsabiliteDto,
    CreateTemplateOrganisationDto,
    UpdateTemplateOrganisationDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';

class NiveauOrganisationService {
    private repo: Repository<NiveauOrganisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauOrganisation);
    }

    async create(dto: CreateNiveauOrganisationDto): Promise<NiveauOrganisation> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<NiveauOrganisation[]> {
        const where: any = {};
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }
        return this.repo.find({ where, order: { niveau: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, niveau?: number) {
        const qb = this.repo.createQueryBuilder('n');
        if (etablissementId) {
            qb.where('(n.etablissementId = :eid OR n.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(n.etablissementId IS NULL OR n.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(n.label ILIKE :search OR n.description ILIKE :search)', { search: `%${search}%` });
        }
        if (niveau !== undefined) {
            qb.andWhere('n.niveau = :niveau', { niveau });
        }
        qb.orderBy('n.niveau', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<NiveauOrganisation> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Niveau d\'organisation non trouvé', 404, 'NIVEAU_ORG_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateNiveauOrganisationDto): Promise<NiveauOrganisation> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        if (entity.estSysteme) {
            throw new AppError('Impossible de supprimer un niveau système', 400, 'SYSTEM_ENTITY');
        }
        await this.repo.remove(entity);
    }
}

class UsageUniteService {
    private repo: Repository<UsageUnite>;

    constructor() {
        this.repo = AppDataSource.getRepository(UsageUnite);
    }

    async create(dto: CreateUsageUniteDto): Promise<UsageUnite> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? null } });
        if (existing) throw new AppError('Ce code d\'usage existe déjà', 409, 'USAGE_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<UsageUnite[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { label: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('u');
        if (etablissementId) {
            qb.where('(u.etablissementId = :eid OR u.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(u.etablissementId IS NULL OR u.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(u.label ILIKE :search OR u.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('u.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<UsageUnite> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Usage d\'unité non trouvé', 404, 'USAGE_UNITE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateUsageUniteDto): Promise<UsageUnite> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        if (entity.estSysteme) throw new AppError('Impossible de supprimer un usage système', 400, 'SYSTEM_ENTITY');
        await this.repo.remove(entity);
    }
}

class CategoriePosteService {
    private repo: Repository<CategoriePoste>;

    constructor() {
        this.repo = AppDataSource.getRepository(CategoriePoste);
    }

    async create(dto: CreateCategoriePosteDto): Promise<CategoriePoste> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? null } });
        if (existing) throw new AppError('Ce code de catégorie existe déjà', 409, 'CATEGORIE_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<CategoriePoste[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { label: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string) {
        const qb = this.repo.createQueryBuilder('c');
        if (etablissementId) {
            qb.where('(c.etablissementId = :eid OR c.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(c.etablissementId IS NULL OR c.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(c.label ILIKE :search OR c.code ILIKE :search)', { search: `%${search}%` });
        }
        qb.orderBy('c.label', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<CategoriePoste> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Catégorie de poste non trouvée', 404, 'CATEGORIE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateCategoriePosteDto): Promise<CategoriePoste> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        if (entity.estSysteme) throw new AppError('Impossible de supprimer une catégorie système', 400, 'SYSTEM_ENTITY');
        await this.repo.remove(entity);
    }
}

class NiveauResponsabiliteService {
    private repo: Repository<NiveauResponsabilite>;

    constructor() {
        this.repo = AppDataSource.getRepository(NiveauResponsabilite);
    }

    async create(dto: CreateNiveauResponsabiliteDto): Promise<NiveauResponsabilite> {
        const existing = await this.repo.findOne({ where: { code: dto.code, etablissementId: dto.etablissementId ?? null } });
        if (existing) throw new AppError('Ce code de niveau existe déjà', 409, 'NIVEAU_RESP_CODE_EXISTS');
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<NiveauResponsabilite[]> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { niveau: 'DESC' } });
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

    async findById(id: string): Promise<NiveauResponsabilite> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Niveau de responsabilité non trouvé', 404, 'NIVEAU_RESP_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateNiveauResponsabiliteDto): Promise<NiveauResponsabilite> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        if (entity.estSysteme) throw new AppError('Impossible de supprimer un niveau système', 400, 'SYSTEM_ENTITY');
        await this.repo.remove(entity);
    }
}

class TemplateOrganisationService {
    private repo: Repository<TemplateOrganisation>;

    constructor() {
        this.repo = AppDataSource.getRepository(TemplateOrganisation);
    }

    async create(dto: CreateTemplateOrganisationDto): Promise<TemplateOrganisation> {
        const entity = this.repo.create(dto);
        return this.repo.save(entity);
    }

    async findAll(etablissementId?: string): Promise<TemplateOrganisation[]> {
        const where: any = { actif: true };
        if (etablissementId) where.etablissementId = etablissementId;
        return this.repo.find({ where, order: { nom: 'ASC' } });
    }

    async findAllPaginated(page: number, limit: number, etablissementId?: string, search?: string, actif?: boolean) {
        const qb = this.repo.createQueryBuilder('t');
        if (etablissementId) {
            qb.where('(t.etablissementId = :eid OR t.estSysteme = TRUE)', { eid: etablissementId });
        } else {
            qb.where('(t.etablissementId IS NULL OR t.estSysteme = TRUE)');
        }
        if (search) {
            qb.andWhere('(t.nom ILIKE :search OR t.description ILIKE :search)', { search: `%${search}%` });
        }
        if (actif !== undefined) {
            qb.andWhere('t.actif = :actif', { actif });
        }
        qb.orderBy('t.nom', 'ASC').skip((page - 1) * limit).take(limit);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findById(id: string): Promise<TemplateOrganisation> {
        const entity = await this.repo.findOne({ where: { id } });
        if (!entity) throw new AppError('Template d\'organisation non trouvé', 404, 'TEMPLATE_NOT_FOUND');
        return entity;
    }

    async update(id: string, dto: UpdateTemplateOrganisationDto): Promise<TemplateOrganisation> {
        const entity = await this.findById(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        const entity = await this.findById(id);
        if (entity.estSysteme) throw new AppError('Impossible de supprimer un template système', 400, 'SYSTEM_ENTITY');
        await this.repo.remove(entity);
    }
}

export const niveauOrganisationService = new NiveauOrganisationService();
export const usageUniteService = new UsageUniteService();
export const categoriePosteService = new CategoriePosteService();
export const niveauResponsabiliteService = new NiveauResponsabiliteService();
export const templateOrganisationService = new TemplateOrganisationService();
