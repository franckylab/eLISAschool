/**
 * ==================================
 * eLISAschool - StrategieExpirationService (Refonte v3)
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * CRUD des stratégies d'expiration (phases configurables de dégradation
 * gracieuse). La résolution de phase est portée par EntitlementService
 * (resoudrePhaseExpiration) pour bénéficier du cache.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { StrategieExpiration, ComportementPhase } from '../entities/strategie-expiration.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { entitlementService } from './entitlement.service';

const COMPORTEMENTS_VALIDES = Object.values(ComportementPhase) as string[];

export class StrategieExpirationService {
    private repo: Repository<StrategieExpiration>;

    constructor() {
        this.repo = AppDataSource.getRepository(StrategieExpiration);
    }

    async create(dto: Partial<StrategieExpiration>): Promise<StrategieExpiration> {
        if (!dto.code || !dto.nom) {
            throw new AppError('Le code et le nom de la stratégie sont obligatoires', 400, 'VALIDATION_ERROR');
        }
        this.validerPhases(dto.phases || []);
        const existante = await this.repo.findOne({ where: { code: dto.code } });
        if (existante) {
            throw new AppError(`Une stratégie avec le code "${dto.code}" existe déjà`, 409, 'STRATEGIE_EXISTS');
        }
        const strategie = this.repo.create(dto);
        const saved = await this.repo.save(strategie);
        void entitlementService.invalidate();
        logger.info(`[Expiration] Stratégie créée : ${saved.code} (${saved.phases?.length ?? 0} phases)`);
        return saved;
    }

    async findAll(): Promise<StrategieExpiration[]> {
        return this.repo.find({ order: { estDefaut: 'DESC', createdAt: 'ASC' } });
    }

    async findOne(id: string): Promise<StrategieExpiration> {
        const strategie = await this.repo.findOne({ where: { id } });
        if (!strategie) throw new AppError('Stratégie introuvable', 404, 'NOT_FOUND');
        return strategie;
    }

    async findByCode(code: string): Promise<StrategieExpiration | null> {
        return this.repo.findOne({ where: { code } });
    }

    async update(id: string, dto: Partial<StrategieExpiration>): Promise<StrategieExpiration> {
        const strategie = await this.findOne(id);
        if (dto.phases) this.validerPhases(dto.phases);

        // Une seule stratégie par défaut
        if (dto.estDefaut === true) {
            await this.repo.update({ estDefaut: true }, { estDefaut: false });
        }

        Object.assign(strategie, dto);
        const saved = await this.repo.save(strategie);
        void entitlementService.invalidate();
        return saved;
    }

    async delete(id: string): Promise<void> {
        const strategie = await this.findOne(id);
        if (strategie.estDefaut) {
            throw new AppError('La stratégie par défaut ne peut pas être supprimée', 409, 'STRATEGIE_DEFAUT');
        }
        await this.repo.remove(strategie);
        void entitlementService.invalidate();
        logger.info(`[Expiration] Stratégie supprimée : ${strategie.code}`);
    }

    /** Validation structurelle des phases */
    private validerPhases(phases: StrategieExpiration['phases']): void {
        if (!Array.isArray(phases) || phases.length === 0) {
            throw new AppError('Une stratégie doit contenir au moins une phase', 400, 'VALIDATION_ERROR');
        }
        for (const phase of phases) {
            if (!phase.nom || !COMPORTEMENTS_VALIDES.includes(phase.comportement)) {
                throw new AppError(`Phase invalide : comportement "${phase.comportement}" non reconnu`, 400, 'VALIDATION_ERROR');
            }
            if (phase.jours !== null && (phase.jours === undefined || phase.jours < 0)) {
                throw new AppError(`Phase "${phase.nom}" : jours doit être positif ou null (illimité)`, 400, 'VALIDATION_ERROR');
            }
        }
        // Seule la dernière phase peut être illimitée
        const illimitees = phases.filter((p) => p.jours === null);
        if (illimitees.length > 1 || (illimitees.length === 1 && phases[phases.length - 1].jours !== null)) {
            throw new AppError('Seule la dernière phase peut avoir une durée illimitée (jours: null)', 400, 'VALIDATION_ERROR');
        }
    }
}

export const strategieExpirationService = new StrategieExpirationService();
export default StrategieExpirationService;
