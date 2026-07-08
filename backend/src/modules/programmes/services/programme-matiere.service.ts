import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProgrammeMatiere } from '../entities/programme-matiere.entity';
import { ProgrammePedagogique } from '../entities/programme-pedagogique.entity';
import { MatiereNiveau } from '@modules/matieres/entities';
import {
    AddMatiereProgrammeDto, UpdateMatiereProgrammeDto,
    BulkAddMatieresProgrammeDto, BulkReorderMatieresDto,
} from '../dto/programme-matiere.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ProgrammeMatiereService {
    private repo: Repository<ProgrammeMatiere>;
    private programmeRepo: Repository<ProgrammePedagogique>;
    private matiereNiveauRepo: Repository<MatiereNiveau>;

    constructor() {
        this.repo = AppDataSource.getRepository(ProgrammeMatiere);
        this.programmeRepo = AppDataSource.getRepository(ProgrammePedagogique);
        this.matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
    }

    async findByProgramme(programmeId: string, etablissementId: string): Promise<ProgrammeMatiere[]> {
        return this.repo.find({
            where: { programmeId, etablissementId },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau', 'matiereNiveau.groupe', 'matiereNiveau.filiere'],
            order: { ordre: 'ASC' },
        });
    }

    async findOne(id: string, etablissementId: string): Promise<ProgrammeMatiere> {
        const pm = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
        });
        if (!pm) throw new AppError('Matière non trouvée dans le programme', 404, 'NOT_FOUND');
        return pm;
    }

    async add(programmeId: string, dto: AddMatiereProgrammeDto, etablissementId: string): Promise<ProgrammeMatiere> {
        const programme = await this.programmeRepo.findOne({ where: { id: programmeId, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'PROGRAMME_NOT_FOUND');

        const matiereNiveau = await this.matiereNiveauRepo.findOne({ where: { id: dto.matiereNiveauId } });
        if (!matiereNiveau) throw new AppError('Matière-niveau non trouvée', 404, 'MATIERE_NIVEAU_NOT_FOUND');

        // Vérifier l'unicité GLOBALE de matiereNiveauId (disjoint : une matière par programme)
        const globalExisting = await this.repo.findOne({
            where: { matiereNiveauId: dto.matiereNiveauId },
        });
        if (globalExisting) {
            throw new AppError(
                'Cette matière-niveau est déjà rattachée à un autre programme. Chaque matière-niveau ne peut appartenir qu\'à un seul programme.',
                409,
                'MATIERE_NIVEAU_ALREADY_IN_ANOTHER_PROGRAMME'
            );
        }

        const pm = this.repo.create({
            programmeId,
            matiereNiveauId: dto.matiereNiveauId,
            coefficient: dto.coefficient,
            volumeHoraire: dto.volumeHoraire,
            obligatoire: dto.obligatoire,
            ordre: dto.ordre ?? (await this.repo.count({ where: { programmeId } })),
            etablissementId,
        });
        await this.repo.save(pm);

        const saved = await this.repo.findOne({
            where: { id: pm.id },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
        });
        logger.info(`Matière ajoutée au programme ${programmeId}: ${dto.matiereNiveauId}`);
        return saved!;
    }

    async bulkAdd(programmeId: string, dto: BulkAddMatieresProgrammeDto, etablissementId: string): Promise<ProgrammeMatiere[]> {
        const programme = await this.programmeRepo.findOne({ where: { id: programmeId, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'PROGRAMME_NOT_FOUND');

        const existing = await this.repo.find({ where: { programmeId } });
        const existingIds = new Set(existing.map(e => e.matiereNiveauId));

        // Vérifier unicité globale : les matiereNiveauIds ne doivent être dans aucun autre programme
        const globalExisting = await this.repo.createQueryBuilder('pm')
            .where('pm.matiereNiveauId IN (:...ids)', { ids: dto.matiereNiveauIds })
            .andWhere('pm.programmeId != :programmeId', { programmeId })
            .getMany();
        if (globalExisting.length > 0) {
            throw new AppError(
                `Certaines matières sont déjà dans un autre programme (${globalExisting.length} conflit(s)).`,
                409,
                'MATIERE_NIVEAU_ALREADY_IN_ANOTHER_PROGRAMME'
            );
        }

        const currentOrdre = existing.length;

        const results: ProgrammeMatiere[] = [];
        let ordre = currentOrdre;

        for (const matiereNiveauId of dto.matiereNiveauIds) {
            if (existingIds.has(matiereNiveauId)) continue;

            const matiereNiveau = await this.matiereNiveauRepo.findOne({ where: { id: matiereNiveauId } });
            if (!matiereNiveau) continue;

            const pm = this.repo.create({
                programmeId,
                matiereNiveauId,
                etablissementId,
                ordre,
            });
            await this.repo.save(pm);

            const saved = await this.repo.findOne({
                where: { id: pm.id },
                relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
            });
            if (saved) results.push(saved);
            ordre++;
        }

        logger.info(`${results.length} matière(s) ajoutée(s) au programme ${programmeId}`);
        return results;
    }

    async update(id: string, dto: UpdateMatiereProgrammeDto, etablissementId: string): Promise<ProgrammeMatiere> {
        const pm = await this.findOne(id, etablissementId);
        Object.assign(pm, dto);
        await this.repo.save(pm);

        const saved = await this.repo.findOne({
            where: { id: pm.id },
            relations: ['matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
        });
        return saved!;
    }

    async remove(id: string, etablissementId: string): Promise<void> {
        const pm = await this.findOne(id, etablissementId);
        await this.repo.remove(pm);
        logger.info(`Matière retirée du programme: ${id}`);
    }

    async bulkReorder(programmeId: string, dto: BulkReorderMatieresDto, etablissementId: string): Promise<ProgrammeMatiere[]> {
        const programme = await this.programmeRepo.findOne({ where: { id: programmeId, etablissementId } });
        if (!programme) throw new AppError('Programme non trouvé', 404, 'PROGRAMME_NOT_FOUND');

        for (const item of dto.items) {
            await this.repo.update({ id: item.id, programmeId }, { ordre: item.ordre });
        }

        return this.findByProgramme(programmeId, etablissementId);
    }

    async findByMatiereNiveau(matiereNiveauId: string): Promise<(ProgrammeMatiere & { programme: ProgrammePedagogique })[]> {
        const items = await this.repo.find({
            where: { matiereNiveauId },
            relations: ['programme', 'matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau'],
            order: { programme: { nom: 'ASC' } },
        });
        return items as any;
    }

    async findByMatiere(matiereId: string, etablissementId: string): Promise<(ProgrammeMatiere & { programme: ProgrammePedagogique })[]> {
        const items = await this.repo.find({
            where: { etablissementId, matiereNiveau: { matiereId } },
            relations: ['programme', 'matiereNiveau', 'matiereNiveau.matiere', 'matiereNiveau.niveau', 'matiereNiveau.groupe'],
            order: { programme: { nom: 'ASC' }, ordre: 'ASC' },
        });
        return items as any;
    }

    async findAll(query: { programmeId?: string; matiereNiveauId?: string; page?: number; limit?: number }, etablissementId: string): Promise<PaginatedResult<ProgrammeMatiere>> {
        const { page = 1, limit = 50 } = query;
        const qb = this.repo.createQueryBuilder('pm')
            .leftJoinAndSelect('pm.matiereNiveau', 'mn')
            .leftJoinAndSelect('mn.matiere', 'matiere')
            .leftJoinAndSelect('mn.niveau', 'niveau')
            .leftJoinAndSelect('mn.groupe', 'groupe')
            .where('pm.etablissementId = :etablissementId', { etablissementId });

        if (query.programmeId) {
            qb.andWhere('pm.programmeId = :programmeId', { programmeId: query.programmeId });
        }
        if (query.matiereNiveauId) {
            qb.andWhere('pm.matiereNiveauId = :matiereNiveauId', { matiereNiveauId: query.matiereNiveauId });
        }

        qb.orderBy('pm.ordre', 'ASC');
        return paginateWithQueryBuilder(qb, page, limit);
    }
}

export const programmeMatiereService = new ProgrammeMatiereService();
