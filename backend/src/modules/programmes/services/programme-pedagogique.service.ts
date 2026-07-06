import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProgrammePedagogique } from '../entities/programme-pedagogique.entity';
import { ProgrammeMatiere } from '../entities/programme-matiere.entity';
import { CreateProgrammeDto, UpdateProgrammeDto, QueryProgrammesDto, AddMatiereProgrammeDto, UpdateMatiereProgrammeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ProgrammePedagogiqueService {
    private repo: Repository<ProgrammePedagogique>;
    private matiereRepo: Repository<ProgrammeMatiere>;

    constructor() {
        this.repo = AppDataSource.getRepository(ProgrammePedagogique);
        this.matiereRepo = AppDataSource.getRepository(ProgrammeMatiere);
    }

    async create(dto: CreateProgrammeDto, etablissementId: string): Promise<ProgrammePedagogique> {
        const code = dto.code || dto.nom.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

        const existing = await this.repo.findOne({ where: { code, etablissementId } });
        if (existing) {
            throw new AppError('Un programme avec ce code existe déjà', 409, 'PROGRAMME_EXISTS');
        }

        const programme = this.repo.create({
            ...dto,
            code,
            cycleId: dto.cycleId || undefined,
            niveauId: dto.niveauId || undefined,
            etablissementId,
        });
        await this.repo.save(programme);
        logger.info(`Programme créé: ${dto.nom} (${code})`);
        return this.findOne(programme.id, etablissementId);
    }

    async findAll(query: QueryProgrammesDto = {}, etablissementId: string): Promise<PaginatedResult<ProgrammePedagogique>> {
        const { page = 1, limit = 20, search, cycleId, niveauId, type, actif, sortBy = 'nom', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('p')
            .leftJoinAndSelect('p.cycle', 'cycle')
            .leftJoinAndSelect('p.niveau', 'niveau')
            .leftJoinAndSelect('p.matieres', 'pm')
            .leftJoinAndSelect('pm.matiereNiveau', 'mn')
            .leftJoinAndSelect('mn.matiere', 'matiere')
            .where('p.etablissementId = :etablissementId', { etablissementId });

        if (search) {
            qb.andWhere('(p.nom ILIKE :search OR p.code ILIKE :search OR p.description ILIKE :search)', { search: `%${search}%` });
        }
        if (cycleId) {
            qb.andWhere('p.cycleId = :cycleId', { cycleId });
        }
        if (niveauId) {
            qb.andWhere('p.niveauId = :niveauId', { niveauId });
        }
        if (type) {
            qb.andWhere('p.type = :type', { type });
        }
        if (actif !== undefined) {
            qb.andWhere('p.actif = :actif', { actif });
        }

        const allowedSort = ['nom', 'code', 'createdAt', 'nbHeuresHebdo', 'actif', 'type'];
        const orderField = allowedSort.includes(sortBy) ? sortBy : 'nom';
        qb.orderBy(`p.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(etablissementId: string): Promise<ProgrammePedagogique[]> {
        return this.repo.find({
            where: { etablissementId },
            relations: ['cycle', 'niveau'],
            order: { nom: 'ASC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<ProgrammePedagogique> {
        const programme = await this.repo.findOne({
            where: { id, etablissementId },
            relations: [
                'cycle',
                'niveau',
                'matieres',
                'matieres.matiereNiveau',
                'matieres.matiereNiveau.matiere',
                'matieres.matiereNiveau.niveau',
            ],
            order: { matieres: { ordre: 'ASC' } },
        });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');

        const nbHeures = programme.matieres?.reduce((sum, m) => sum + (m.volumeHoraire || 0), 0) || 0;
        (programme as any).nbHeuresCalculees = nbHeures;

        return programme;
    }

    async update(id: string, dto: UpdateProgrammeDto, etablissementId: string): Promise<ProgrammePedagogique> {
        const programme = await this.repo.findOne({ where: { id, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');

        Object.assign(programme, dto);
        await this.repo.save(programme);
        return this.findOne(id, etablissementId);
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const programme = await this.repo.findOne({ where: { id, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        await this.repo.remove(programme);
        logger.info(`Programme supprimé: ${id}`);
    }

    async addMatiere(programmeId: string, dto: AddMatiereProgrammeDto, etablissementId: string): Promise<ProgrammeMatiere> {
        const programme = await this.repo.findOne({ where: { id: programmeId, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');

        const existing = await this.matiereRepo.findOne({
            where: { programmeId, matiereNiveauId: dto.matiereNiveauId },
        });
        if (existing) {
            throw new AppError('Cette matière est déjà dans le programme', 409, 'MATIERE_ALREADY_IN_PROGRAMME');
        }

        const pm = this.matiereRepo.create({
            programmeId,
            matiereNiveauId: dto.matiereNiveauId,
            coefficient: dto.coefficient,
            volumeHoraire: dto.volumeHoraire,
            obligatoire: dto.obligatoire,
            ordre: dto.ordre,
            etablissementId,
        });
        await this.matiereRepo.save(pm);

        const saved = await this.matiereRepo.findOne({
            where: { id: pm.id },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
        });
        return saved!;
    }

    async updateMatiere(id: string, dto: UpdateMatiereProgrammeDto, etablissementId: string): Promise<ProgrammeMatiere> {
        const pm = await this.matiereRepo.findOne({ where: { id } });
        if (!pm) throw new AppError('Matière non trouvée dans le programme', 404, 'NOT_FOUND');
        Object.assign(pm, dto);
        await this.matiereRepo.save(pm);

        const saved = await this.matiereRepo.findOne({
            where: { id: pm.id },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
        });
        return saved!;
    }

    async removeMatiere(id: string, etablissementId: string): Promise<void> {
        const pm = await this.matiereRepo.findOne({ where: { id } });
        if (!pm) throw new AppError('Matière non trouvée dans le programme', 404, 'NOT_FOUND');
        await this.matiereRepo.remove(pm);
    }

    async getMatieres(programmeId: string, etablissementId: string): Promise<ProgrammeMatiere[]> {
        return this.matiereRepo.find({
            where: { programmeId, etablissementId },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau', 'matiereNiveau.groupe'],
            order: { ordre: 'ASC' },
        });
    }
}

export const programmePedagogiqueService = new ProgrammePedagogiqueService();
