/**
 * ==================================
 * eLISAschool - Service Filières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Support multi-tenant avec etablissementId
 * - Toutes les requêtes sont filtrées par établissement
 * - Isolation totale des données entre établissements
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { SousSysteme } from '@modules/etablissement/entities';
import { Filiere } from '../entities';
import { CreateFiliereDto, UpdateFiliereDto, QueryFilieresDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { auditService, AuditAction } from '@modules/auth';

export class FilieresService {
    private repo: Repository<Filiere>;

    constructor() {
        this.repo = AppDataSource.getRepository(Filiere);
    }

    async create(dto: CreateFiliereDto, etablissementId: string, utilisateurId?: string): Promise<Filiere> {
        // Vérifier unicité du code pour un cycle ET établissement donnés
        const existing = await this.repo.findOne({ 
            where: { code: dto.code, cycleId: dto.cycleId, etablissementId } 
        });
        if (existing) {
            throw new AppError('Une filière avec ce code existe déjà pour ce cycle dans cet établissement', 409, 'FILIERE_EXISTS');
        }

        const filiere = this.repo.create({
            ...dto,
            sousSysteme: dto.sousSysteme as SousSysteme,
            etablissementId,
        });
        await this.repo.save(filiere);
        logger.info(`Filière créée: ${dto.nom} (${dto.code}) pour établissement ${etablissementId}`);
        await auditService.log({
            utilisateurId,
            action: AuditAction.FILIERE_CREATE,
            cible: 'Filiere',
            cibleId: filiere.id,
            description: `Création de la filière ${filiere.nom} (${filiere.code})`,
            nouvellesValeurs: { ...dto },
            module: 'filieres',
            metadata: { entiteLabel: filiere.nom, entiteRef: filiere.code },
        });
        return filiere;
    }

    async findAll(query: QueryFilieresDto = {}, etablissementId: string): Promise<PaginatedResult<Filiere>> {
        const { page = 1, limit = 20, search, cycleId, sousSysteme, actif, sortBy = 'nom', sortOrder = 'ASC' } = query;

        const qb = this.repo.createQueryBuilder('filiere')
            .leftJoinAndSelect('filiere.cycle', 'cycle')
            .where('filiere.etablissementId = :etablissementId', { etablissementId });

        if (search) {
            qb.andWhere('(filiere.nom ILIKE :search OR filiere.code ILIKE :search)', { search: `%${search}%` });
        }

        if (cycleId) {
            qb.andWhere('filiere.cycleId = :cycleId', { cycleId });
        }

        if (sousSysteme) {
            qb.andWhere('filiere.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (actif !== undefined) {
            qb.andWhere('filiere.actif = :actif', { actif });
        }

        const allowedSortFields = ['nom', 'code', 'ordre', 'createdAt', 'actif'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'nom';
        qb.orderBy(`filiere.${orderField}`, sortOrder === 'DESC' ? 'DESC' : 'ASC');

        return paginateWithQueryBuilder(qb, page, limit);
    }

    async findAllSimple(cycleId: string | undefined, etablissementId: string): Promise<Filiere[]> {
        const where: FindOptionsWhere<Filiere> = { etablissementId };
        if (cycleId) {
            where.cycleId = cycleId;
        }
        return this.repo.find({ where, order: { nom: 'ASC' }, relations: ['cycle'] });
    }

    async findOne(id: string, etablissementId: string): Promise<Filiere> {
        const filiere = await this.repo.findOne({ 
            where: { id, etablissementId },
            relations: ['cycle']
        });
        if (!filiere) {
            throw new AppError('Filière non trouvée', 404, 'NOT_FOUND');
        }
        return filiere;
    }

    async update(id: string, dto: UpdateFiliereDto, etablissementId: string, utilisateurId?: string): Promise<Filiere> {
        const filiere = await this.findOne(id, etablissementId);

        // Vérifier unicité du code si modifié
        if (dto.code && dto.code !== filiere.code) {
            const cycleId = dto.cycleId || filiere.cycleId;
            const existing = await this.repo.findOne({ 
                where: { code: dto.code, cycleId, etablissementId } 
            });
            if (existing) {
                throw new AppError('Une filière avec ce code existe déjà pour ce cycle', 409, 'FILIERE_EXISTS');
            }
        }

        const anciennesValeurs: Record<string, unknown> = {};
        for (const key of Object.keys(dto)) {
            anciennesValeurs[key] = (filiere as unknown as Record<string, unknown>)[key];
        }
        Object.assign(filiere, dto);
        await this.repo.save(filiere);
        logger.info(`Filière modifiée: ${filiere.nom}`);
        await auditService.log({
            utilisateurId,
            action: AuditAction.FILIERE_UPDATE,
            cible: 'Filiere',
            cibleId: filiere.id,
            description: `Modification de la filière ${filiere.nom} (${filiere.code})`,
            anciennesValeurs,
            nouvellesValeurs: { ...dto },
            module: 'filieres',
            metadata: { entiteLabel: filiere.nom, entiteRef: filiere.code },
        });
        return filiere;
    }

    async delete(id: string, etablissementId: string, utilisateurId?: string): Promise<void> {
        const filiere = await this.findOne(id, etablissementId);
        const nom = filiere.nom;
        const code = filiere.code;
        await this.repo.remove(filiere);
        logger.info(`Filière supprimée: ${nom}`);
        await auditService.log({
            utilisateurId,
            action: AuditAction.FILIERE_DELETE,
            cible: 'Filiere',
            cibleId: id,
            description: `Suppression de la filière ${nom} (${code})`,
            anciennesValeurs: { nom, code },
            module: 'filieres',
            metadata: { entiteLabel: nom, entiteRef: code },
        });
    }
}

export const filieresService = new FilieresService();
