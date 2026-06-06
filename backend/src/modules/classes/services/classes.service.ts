/**
 * ==================================
 * eLISAschool - Service Classes
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Classe, AffectationEleve } from '../entities';
import { CreateClasseDto, UpdateClasseDto, AffecterEleveDto, QueryClassesDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ClassesService {
    private classeRepo: Repository<Classe>;
    private affectationRepo: Repository<AffectationEleve>;

    constructor() {
        this.classeRepo = AppDataSource.getRepository(Classe);
        this.affectationRepo = AppDataSource.getRepository(AffectationEleve);
    }

    async create(dto: CreateClasseDto, etablissementId?: string): Promise<Classe> {
        const anneeId = dto.anneeScolaireId || (await anneesScolairesService.findActive())?.id;
        if (!anneeId) throw new AppError('Aucune année scolaire active', 400, 'NO_ACTIVE_YEAR');

        const classe = this.classeRepo.create({
            ...dto,
            anneeScolaireId: anneeId,
            etablissementId,
        });
        await this.classeRepo.save(classe);
        logger.info(`Classe créée: ${dto.nom}`);
        return classe;
    }

    /**
     * Rechercher toutes les classes avec pagination et filtres
     */
    async findAll(query: QueryClassesDto, etablissementId?: string): Promise<PaginatedResult<Classe>> {
        const { page, limit, search, niveauId, anneeScolaireId, actif } = query;

        const qb = this.classeRepo
            .createQueryBuilder('c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('c.professeurPrincipal', 'pp')
            .leftJoinAndSelect('c.anneeScolaire', 'a')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('c.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (niveauId) {
            qb.andWhere('c.niveauId = :niveauId', { niveauId });
        }

        if (anneeScolaireId) {
            qb.andWhere('c.anneeScolaireId = :anneeScolaireId', { anneeScolaireId });
        }

        if (actif !== undefined) {
            qb.andWhere('c.actif = :actif', { actif });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(c.nom ILIKE :search OR c.code ILIKE :search OR c.sallePrincipale ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'nom', 'code', 'effectifActuel'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'nom';
        qb.orderBy(`c.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string, etablissementId?: string): Promise<Classe> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const classe = await this.classeRepo.findOne({
            where,
            relations: ['niveau', 'professeurPrincipal', 'anneeScolaire'],
        });
        if (!classe) throw new AppError('Classe non trouvée', 404, 'NOT_FOUND');
        return classe;
    }

    async update(id: string, dto: UpdateClasseDto, etablissementId?: string): Promise<Classe> {
        const classe = await this.findOne(id, etablissementId);
        Object.assign(classe, dto);
        await this.classeRepo.save(classe);
        logger.info(`[${etablissementId}] Classe modifiée: ${classe.nom}`);
        return classe;
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const classe = await this.findOne(id, etablissementId);
        // Vérifier s'il y a des élèves
        const count = await this.affectationRepo.count({ where: { classeId: id, actif: true } });
        if (count > 0) throw new AppError('La classe contient des élèves actifs', 400, 'CLASS_NOT_EMPTY');

        await this.classeRepo.remove(classe);
        logger.info(`[${etablissementId}] Classe supprimée: ${id}`);
    }

    // ==== AFFECTATIONS ====

    async affecterEleve(dto: AffecterEleveDto, etablissementId?: string): Promise<AffectationEleve> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const classe = await this.findOne(dto.classeId, etablissementId);

            // Vérifier si déjà affecté cette année
            const existing = await this.affectationRepo.findOne({
                where: {
                    eleveId: dto.eleveId,
                    anneeScolaireId: classe.anneeScolaireId,
                    actif: true
                }
            });

            if (existing) {
                // Si déjà dans cette classe, erreur ou ignore
                if (existing.classeId === dto.classeId) {
                    await queryRunner.commitTransaction();
                    return existing;
                }
                // Sinon, on pourrait désactiver l'ancienne et créer la nouvelle (changement de classe)
                // Pour l'instant on bloque
                throw new AppError('Élève déjà affecté à une classe pour cette année', 409, 'ALREADY_ASSIGNED');
            }

            const affectation = this.affectationRepo.create({
                eleveId: dto.eleveId,
                classeId: dto.classeId,
                anneeScolaireId: classe.anneeScolaireId,
                dateAffectation: dto.dateAffectation ? new Date(dto.dateAffectation) : new Date(),
                etablissementId,
            });

            await queryRunner.manager.save(affectation);

            // Mettre à jour effectif
            await queryRunner.manager.increment(Classe, { id: dto.classeId }, 'effectifActuel', 1);

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] Élève ${dto.eleveId} affecté à la classe ${classe.nom}`);
            return affectation;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`[${etablissementId}] Erreur affectation élève: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

export const classesService = new ClassesService();
