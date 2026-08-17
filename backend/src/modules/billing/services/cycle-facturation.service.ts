/**
 * ==================================
 * eLISAschool - CycleFacturationService (Refonte v3)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * CRUD des cycles de facturation configurables (ex-enum dur).
 * Un cycle définit une durée (mois) et une remise associée.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { CycleFacturationConfig } from '../entities/cycle-facturation-config.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class CycleFacturationService {
    private repo: Repository<CycleFacturationConfig>;

    constructor() {
        this.repo = AppDataSource.getRepository(CycleFacturationConfig);
    }

    async create(dto: Partial<CycleFacturationConfig>): Promise<CycleFacturationConfig> {
        if (!dto.code || !dto.nom) {
            throw new AppError('Le code et le nom du cycle sont obligatoires', 400, 'VALIDATION_ERROR');
        }
        const existant = await this.repo.findOne({ where: { code: dto.code } });
        if (existant) {
            throw new AppError(`Un cycle avec le code "${dto.code}" existe déjà`, 409, 'CYCLE_EXISTS');
        }
        const cycle = this.repo.create(dto);
        const saved = await this.repo.save(cycle);
        logger.info(`[Cycles] Cycle créé : ${saved.code} (${saved.dureeMois} mois)`);
        return saved;
    }

    async findAll(actifsSeulement = false): Promise<CycleFacturationConfig[]> {
        return this.repo.find({
            where: actifsSeulement ? { actif: true } : {},
            order: { ordre: 'ASC' },
        });
    }

    async findByCode(code: string): Promise<CycleFacturationConfig | null> {
        return this.repo.findOne({ where: { code } });
    }

    async findOne(id: string): Promise<CycleFacturationConfig> {
        const cycle = await this.repo.findOne({ where: { id } });
        if (!cycle) throw new AppError('Cycle introuvable', 404, 'NOT_FOUND');
        return cycle;
    }

    async update(id: string, dto: Partial<CycleFacturationConfig>): Promise<CycleFacturationConfig> {
        const cycle = await this.findOne(id);
        Object.assign(cycle, dto);
        return this.repo.save(cycle);
    }

    async delete(id: string): Promise<void> {
        const cycle = await this.findOne(id);
        // Protection : les cycles standards ne sont pas supprimables
        if (['MENSUEL', 'ANNUEL'].includes(cycle.code)) {
            throw new AppError('Les cycles MENSUEL et ANNUEL ne sont pas supprimables', 409, 'CYCLE_PROTEGE');
        }
        await this.repo.remove(cycle);
        logger.info(`[Cycles] Cycle supprimé : ${cycle.code}`);
    }

    /** Durée du cycle en jours (approx. 30 jours/mois) */
    dureeJours(cycle: CycleFacturationConfig): number {
        return cycle.dureeMois * 30;
    }
}

export const cycleFacturationService = new CycleFacturationService();
export default CycleFacturationService;
