import { Repository, IsNull, Not, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Fonction } from '../entities';
import { CreateFonctionDto, UpdateFonctionDto, QueryFonctionsDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class FonctionsService {
    private repo: Repository<Fonction>;

    constructor() {
        this.repo = AppDataSource.getRepository(Fonction);
    }

    async create(dto: CreateFonctionDto, etablissementId: string): Promise<Fonction> {
        const existing = await this.repo.findOne({
            where: { code: dto.code, etablissementId },
        });
        if (existing) {
            throw new AppError('Une fonction avec ce code existe déjà dans cet établissement', 409, 'FONCTION_EXISTS');
        }

        let niveau = 0;
        let chemin = '';

        if (dto.parentId) {
            const parent = await this.findOne(dto.parentId, etablissementId);
            niveau = parent.niveau + 1;
        }

        const fonction = this.repo.create({
            ...dto,
            niveau,
            etablissementId,
        });
        await this.repo.save(fonction);

        fonction.chemin = dto.parentId ? `${chemin}${fonction.id}` : fonction.id;
        await this.repo.save(fonction);

        logger.info(`Fonction créée: ${dto.nom} (${dto.code}) pour établissement ${etablissementId}`);
        return fonction;
    }

    async findAll(query: QueryFonctionsDto = {}, etablissementId: string): Promise<PaginatedResult<Fonction>> {
        const { page = 1, limit = 20, search, parentId, actif, sortBy = 'ordre', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('fonction')
            .leftJoinAndSelect('fonction.parent', 'parent')
            .leftJoinAndSelect('fonction.enfants', 'enfants')
            .where('fonction.etablissementId = :etablissementId', { etablissementId });

        if (search) {
            qb.andWhere('(fonction.nom ILIKE :search OR fonction.code ILIKE :search)', { search: `%${search}%` });
        }

        if (parentId !== undefined) {
            if (parentId === null) {
                qb.andWhere('fonction.parentId IS NULL');
            } else {
                qb.andWhere('fonction.parentId = :parentId', { parentId });
            }
        }

        if (actif !== undefined) {
            qb.andWhere('fonction.actif = :actif', { actif });
        }

        const allowedSortFields = ['nom', 'code', 'ordre', 'niveau', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'ordre';
        qb.orderBy(`fonction.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findArbre(etablissementId: string): Promise<Fonction[]> {
        const all = await this.repo.find({
            where: { etablissementId },
            relations: ['parent'],
            order: { ordre: 'ASC', nom: 'ASC' },
        });

        const map = new Map<string, Fonction & { enfants: Fonction[] }>();
        const racines: (Fonction & { enfants: Fonction[] })[] = [];

        for (const f of all) {
            map.set(f.id, { ...f, enfants: [] });
        }

        for (const f of all) {
            const node = map.get(f.id)!;
            if (f.parentId && map.has(f.parentId)) {
                map.get(f.parentId)!.enfants.push(node);
            } else {
                racines.push(node);
            }
        }

        return racines;
    }

    async findAllSimple(etablissementId: string): Promise<Fonction[]> {
        return this.repo.find({
            where: { etablissementId, actif: true },
            order: { ordre: 'ASC', nom: 'ASC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<Fonction> {
        const fonction = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['parent', 'enfants'],
        });
        if (!fonction) {
            throw new AppError('Fonction non trouvée', 404, 'NOT_FOUND');
        }
        return fonction;
    }

    async update(id: string, dto: UpdateFonctionDto, etablissementId: string): Promise<Fonction> {
        const fonction = await this.findOne(id, etablissementId);

        if (dto.code && dto.code !== fonction.code) {
            const existing = await this.repo.findOne({
                where: { code: dto.code, etablissementId },
            });
            if (existing && existing.id !== id) {
                throw new AppError('Une fonction avec ce code existe déjà', 409, 'FONCTION_EXISTS');
            }
        }

        if (dto.parentId !== undefined && dto.parentId !== fonction.parentId) {
            if (dto.parentId === null) {
                fonction.niveau = 0;
                fonction.chemin = fonction.id;
            } else {
                if (dto.parentId === id) {
                    throw new AppError('Une fonction ne peut pas être son propre parent', 400, 'SELF_PARENT');
                }
                const parent = await this.findOne(dto.parentId, etablissementId);
                if (parent.chemin && parent.chemin.includes(id)) {
                    throw new AppError('Circulaire: le parent est déjà un descendant', 400, 'CIRCULAR_PARENT');
                }
                fonction.niveau = parent.niveau + 1;
            }
        }

        Object.assign(fonction, dto);

        if (!fonction.chemin) {
            fonction.chemin = fonction.id;
        }

        await this.repo.save(fonction);
        logger.info(`Fonction modifiée: ${fonction.nom}`);
        return fonction;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const fonction = await this.findOne(id, etablissementId);

        const enfants = await this.repo.count({ where: { parentId: id } });
        if (enfants > 0) {
            throw new AppError('Impossible de supprimer: cette fonction a des sous-fonctions', 400, 'HAS_CHILDREN');
        }

        await this.repo.remove(fonction);
        logger.info(`Fonction supprimée: ${fonction.nom}`);
    }
}

export const fonctionsService = new FonctionsService();
