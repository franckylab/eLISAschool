import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ProgrammeChapitre } from '../entities/programme-chapitre.entity';
import { CreateProgrammeChapitreDto, UpdateProgrammeChapitreDto, QueryProgrammeChapitreDto } from '../dto/programme-chapitre.dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class ProgrammeChapitreService {
    private repo: Repository<ProgrammeChapitre>;

    constructor() {
        this.repo = AppDataSource.getRepository(ProgrammeChapitre);
    }

    async create(
        dto: CreateProgrammeChapitreDto,
        etablissementId: string,
        createurId?: string,
        req?: any
    ): Promise<ProgrammeChapitre> {
        const entity = this.repo.create({
            ...dto,
            etablissementId,
        });
        await this.repo.save(entity);

        if (createurId) {
            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.PROGRAMME_CHAPITRE_CREATE,
                cible: 'ProgrammeChapitre',
                cibleId: entity.id,
                description: `Création chapitre: ${entity.titre}`,
                nouvellesValeurs: dto,
                module: 'programmes',
            }, req);
        }

        logger.info(`Chapitre programme créé: ${entity.id} - ${entity.titre}`);
        return entity;
    }

    async findAll(query: QueryProgrammeChapitreDto, etablissementId: string) {
        const qb = this.repo.createQueryBuilder('chapitre')
            .where('chapitre.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('chapitre.programmeMatiere', 'pm')
            .leftJoinAndSelect('pm.matiereNiveau', 'matiereNiveau')
            .leftJoinAndSelect('matiereNiveau.matiere', 'matiere')
            .leftJoinAndSelect('matiereNiveau.niveau', 'niveau')
            .leftJoinAndSelect('chapitre.periode', 'periode')
            .orderBy('chapitre.ordre', 'ASC');

        if (query.programmeMatiereId) {
            qb.andWhere('chapitre.programmeMatiereId = :programmeMatiereId', { programmeMatiereId: query.programmeMatiereId });
        }
        if (query.programmeId) {
            qb.andWhere('pm.programmeId = :programmeId', { programmeId: query.programmeId });
        }
        if (query.periodeId) {
            qb.andWhere('chapitre.periodeId = :periodeId', { periodeId: query.periodeId });
        }
        if (query.statut) {
            qb.andWhere('chapitre.statut = :statut', { statut: query.statut });
        }

        const result = await paginateWithQueryBuilder(qb, query.page, query.limit);

        if (result.items.length > 0) {
            const programmeMatiereIds = [...new Set(result.items.map(c => c.programmeMatiereId).filter(Boolean))];
            const programmesParMatiere = await AppDataSource
                .createQueryBuilder()
                .select('pm.id', 'programmeMatiereId')
                .addSelect('prog.id', 'programmeId')
                .addSelect('prog.nom', 'programmeNom')
                .from('programmes_matieres', 'pm')
                .leftJoin('programmes_pedagogiques', 'prog', 'prog.id = pm."programmeId"')
                .where('pm.id IN (:...ids)', { ids: programmeMatiereIds })
                .getRawMany();

            const programmeMap = new Map<string, { programmeId: string; programmeNom: string }>();
            for (const row of programmesParMatiere) {
                programmeMap.set(row.programmeMatiereId, {
                    programmeId: row.programmeId,
                    programmeNom: row.programmeNom,
                });
            }

            result.items = result.items.map(chapitre => ({
                ...chapitre,
                programmeId: programmeMap.get(chapitre.programmeMatiereId)?.programmeId || null,
                programmeNom: programmeMap.get(chapitre.programmeMatiereId)?.programmeNom || null,
            })) as any;
        }

        return result;
    }

    async findOne(id: string, etablissementId: string): Promise<ProgrammeChapitre> {
        const entity = await this.repo.findOne({
            where: { id, etablissementId },
            relations: ['programmeMatiere', 'periode'],
        });

        if (!entity) {
            throw new AppError('Chapitre de programme non trouvé', 404, 'NOT_FOUND');
        }

        return entity;
    }

    async update(
        id: string,
        dto: UpdateProgrammeChapitreDto,
        userId: string,
        etablissementId: string,
        req?: any
    ): Promise<ProgrammeChapitre> {
        const entity = await this.findOne(id, etablissementId);

        Object.assign(entity, dto);
        await this.repo.save(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRAMME_CHAPITRE_UPDATE,
            cible: 'ProgrammeChapitre',
            cibleId: id,
            description: `Modification chapitre: ${entity.titre}`,
            nouvellesValeurs: dto,
            module: 'programmes',
        }, req);

        return entity;
    }

    async delete(id: string, userId: string, etablissementId: string, req?: any): Promise<{ success: boolean }> {
        const entity = await this.findOne(id, etablissementId);

        await this.repo.remove(entity);

        await auditService.log({
            utilisateurId: userId,
            action: AuditAction.PROGRAMME_CHAPITRE_DELETE,
            cible: 'ProgrammeChapitre',
            cibleId: id,
            description: `Suppression chapitre: ${entity.titre}`,
            module: 'programmes',
        }, req);

        return { success: true };
    }

    async getChapitresParProgrammeMatiere(
        programmeMatiereId: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<ProgrammeChapitre[]> {
        const qb = this.repo.createQueryBuilder('chapitre')
            .where('chapitre.programmeMatiereId = :programmeMatiereId', { programmeMatiereId })
            .andWhere('chapitre.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('chapitre.periode', 'periode')
            .orderBy('chapitre.ordre', 'ASC');

        if (periodeId) {
            qb.andWhere('chapitre.periodeId = :periodeId', { periodeId });
        }

        return qb.getMany();
    }

    async getChapitresParPeriode(
        etablissementId: string,
        periodeId: string
    ): Promise<ProgrammeChapitre[]> {
        return this.repo.find({
            where: { periodeId, etablissementId },
            relations: ['programmeMatiere'],
            order: { ordre: 'ASC' },
        });
    }

    async getVolumeHoraireTotal(programmeMatiereId: string): Promise<{ prevu: number; chapitreCount: number }> {
        const result = await this.repo
            .createQueryBuilder('chapitre')
            .where('chapitre.programmeMatiereId = :programmeMatiereId', { programmeMatiereId })
            .select('SUM(chapitre.dureePrevueHeures)', 'prevu')
            .addSelect('COUNT(chapitre.id)', 'chapitreCount')
            .getRawOne();

        return {
            prevu: parseFloat(result.prevu) || 0,
            chapitreCount: parseInt(result.chapitreCount) || 0,
        };
    }

    async getChapitresParMatiereNiveau(
        matiereNiveauId: string,
        etablissementId: string,
        periodeId?: string
    ): Promise<ProgrammeChapitre[]> {
        const qb = this.repo.createQueryBuilder('chapitre')
            .leftJoinAndSelect('chapitre.programmeMatiere', 'pm')
            .where('pm.matiereNiveauId = :matiereNiveauId', { matiereNiveauId })
            .andWhere('chapitre.etablissementId = :etablissementId', { etablissementId })
            .leftJoinAndSelect('chapitre.periode', 'periode')
            .orderBy('chapitre.ordre', 'ASC');

        if (periodeId) {
            qb.andWhere('chapitre.periodeId = :periodeId', { periodeId });
        }

        return qb.getMany();
    }

    async calculerProgressionReelle(
        matiereNiveauId: string,
        classeId: string,
        enseignantId: string,
        periodeId?: string
    ): Promise<{
        chapitresTotal: number;
        chapitresRealises: number;
        pourcentageReel: number;
        chapitresEnRetard: ProgrammeChapitre[];
    }> {
        const { ProgressionProgramme } = await import('@modules/personnel/entities');
        const progressionRepo = AppDataSource.getRepository(ProgressionProgramme);

        const chapitres = await this.getChapitresParMatiereNiveau(matiereNiveauId, '', periodeId);
        const chapitresTotal = chapitres.length;

        if (chapitresTotal === 0) {
            return {
                chapitresTotal: 0,
                chapitresRealises: 0,
                pourcentageReel: 0,
                chapitresEnRetard: [],
            };
        }

        const chapitreIds = chapitres.map(c => c.id);
        const progressions = await progressionRepo.find({
            where: {
                enseignantId,
                classeId,
                programmeChapitreId: In(chapitreIds),
            },
        });

        const chapitresRealises = progressions.filter(p => Number(p.pourcentageRealise) >= 100).length;
        const pourcentageReel = (chapitresRealises / chapitresTotal) * 100;

        const chapitresAvecProgression = new Set(progressions.map(p => p.programmeChapitreId));
        const chapitresEnRetard = chapitres.filter(c => !chapitresAvecProgression.has(c.id));

        return {
            chapitresTotal,
            chapitresRealises,
            pourcentageReel: Math.round(pourcentageReel * 100) / 100,
            chapitresEnRetard,
        };
    }
}

export const programmeChapitreService = new ProgrammeChapitreService();
