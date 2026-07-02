/**
 * ==================================
 * eLISAschool - Service Usages Niveau
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Gestion CRUD des usages des niveaux de périodicité.
 * Usages système (globaux, etablissementId = null) + usages personnalisés par établissement.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { UsageNiveau } from '../entities';
import { CreateUsageNiveauDto, UpdateUsageNiveauDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class UsagesNiveauService {
    private repo: Repository<UsageNiveau>;

    constructor() {
        this.repo = AppDataSource.getRepository(UsageNiveau);
    }

    /**
     * Lister les usages disponibles pour un établissement.
     * Inclut : usages système (etablissementId = null) + usages de l'établissement.
     */
    async findAll(etablissementId: string): Promise<UsageNiveau[]> {
        return this.repo.find({
            where: [
                { etablissementId: IsNull() },
                { etablissementId },
            ],
            order: { estSysteme: 'DESC', code: 'ASC' },
        });
    }

    /**
     * Lister tous les usages (SUPER_ADMIN — vue globale).
     */
    async findAllGlobal(): Promise<UsageNiveau[]> {
        return this.repo.find({
            relations: ['etablissement'],
            order: { estSysteme: 'DESC', code: 'ASC' },
        });
    }

    /**
     * Trouver un usage par ID.
     */
    async findOne(id: string): Promise<UsageNiveau> {
        const usage = await this.repo.findOne({ where: { id } });
        if (!usage) {
            throw new AppError('Usage de niveau non trouvé', 404, 'USAGE_NOT_FOUND');
        }
        return usage;
    }

    /**
     * Trouver un usage par code (pour un établissement ou système).
     */
    async findByCode(code: string, etablissementId: string): Promise<UsageNiveau> {
        const usage = await this.repo.findOne({
            where: [
                { code, etablissementId: IsNull() },
                { code, etablissementId },
            ],
        });
        if (!usage) {
            throw new AppError(`Usage "${code}" non trouvé`, 404, 'USAGE_NOT_FOUND');
        }
        return usage;
    }

    /**
     * Créer un usage personnalisé pour un établissement.
     */
    async create(dto: CreateUsageNiveauDto, etablissementId: string): Promise<UsageNiveau> {
        // Vérifier unicité du code dans l'établissement + système
        const existing = await this.repo.findOne({
            where: [
                { code: dto.code, etablissementId: IsNull() },
                { code: dto.code, etablissementId },
            ],
        });
        if (existing) {
            throw new AppError(
                `Un usage avec le code "${dto.code}" existe déjà`,
                409,
                'USAGE_EXISTS',
            );
        }

        const usage = this.repo.create({
            ...dto,
            etablissementId,
            estSysteme: false,
        });
        await this.repo.save(usage);

        logger.info(`[UsagesNiveau] Usage créé: ${usage.code} — ${usage.label} (${usage.id})`);
        return usage;
    }

    /**
     * Mettre à jour un usage personnalisé.
     * Les usages système ne peuvent pas être modifiés.
     */
    async update(id: string, dto: UpdateUsageNiveauDto, etablissementId: string, isSuperAdmin = false): Promise<UsageNiveau> {
        const usage = await this.findOne(id);

        if (usage.estSysteme && !isSuperAdmin) {
            throw new AppError('Les usages système ne peuvent pas être modifiés', 403, 'SYSTEM_USAGE_PROTECTED');
        }

        if (!usage.estSysteme && usage.etablissementId !== etablissementId && !isSuperAdmin) {
            throw new AppError('Accès refusé à cet usage', 403, 'FORBIDDEN');
        }

        Object.assign(usage, dto);
        await this.repo.save(usage);

        logger.info(`[UsagesNiveau] Usage mis à jour: ${usage.code} (${id})`);
        return usage;
    }

    /**
     * Supprimer un usage personnalisé.
     * Les usages système ne peuvent pas être supprimés.
     */
    async delete(id: string, etablissementId: string, isSuperAdmin = false): Promise<void> {
        const usage = await this.findOne(id);

        if (usage.estSysteme) {
            throw new AppError('Les usages système ne peuvent pas être supprimés', 403, 'SYSTEM_USAGE_PROTECTED');
        }

        if (!usage.estSysteme && usage.etablissementId !== etablissementId && !isSuperAdmin) {
            throw new AppError('Accès refusé à cet usage', 403, 'FORBIDDEN');
        }

        // Vérifier si l'usage est utilisé par des niveaux
        const niveauxRepo = AppDataSource.getRepository('NiveauPeriode');
        const niveauxUtilisant = await niveauxRepo.count({
            where: { usageCode: usage.code, etablissementId: usage.etablissementId || etablissementId },
        });
        if (niveauxUtilisant > 0) {
            throw new AppError(
                `Impossible de supprimer l'usage "${usage.code}" : ${niveauxUtilisant} niveau(x) l'utilisent`,
                400,
                'USAGE_IN_USE',
            );
        }

        await this.repo.remove(usage);
        logger.info(`[UsagesNiveau] Usage supprimé: ${usage.code} (${id})`);
    }
}

export const usagesNiveauService = new UsagesNiveauService();
