/**
 * ==================================
 * eLISAschool - Tests unitaires TrancheConfig
 * ==================================
 * 
 * Teste la résolution en cascade des tranches de pricing :
 * 1. TrancheSupplement (établissement) → priorité 1
 * 2. TrancheEleves (plan) → priorité 2
 * 3. Fallback système
 * 
 * Teste aussi le calcul de supplément et les overrides.
 * 
 * Phase 3.1 — Refonte SaaS v5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockTrancheSuppFind = jest.fn();
const mockTrancheFind = jest.fn();
const mockAbonnementFindOne = jest.fn();
const mockTrancheSuppSave = jest.fn();
const mockTrancheSuppDelete = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name === 'TrancheSupplement' || name.includes('tranche_supplement')) {
                return {
                    find: mockTrancheSuppFind,
                    findOne: jest.fn(),
                    save: mockTrancheSuppSave,
                    delete: mockTrancheSuppDelete,
                };
            }
            if (name === 'TrancheEleves' || name.includes('tranche_eleves')) {
                return { find: mockTrancheFind };
            }
            if (name === 'AbonnementClient' || name.includes('abonnement')) {
                return { findOne: mockAbonnementFindOne };
            }
            return {
                findOne: jest.fn(),
                find: jest.fn(),
                save: jest.fn(),
            };
        }),
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

import { TrancheConfigService } from '../../src/modules/billing/services/tranche-config.service';

describe('TrancheConfigService — Cascade', () => {
    let service: TrancheConfigService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new TrancheConfigService();
    });

    // =============================================
    // getResolvedTranches
    // =============================================
    describe('getResolvedTranches', () => {

        it('retourne vide si pas d\'abonnement actif', async () => {
            mockAbonnementFindOne.mockResolvedValue(null);

            const result = await service.getResolvedTranches('etab-1');

            expect(result).toEqual([]);
        });

        it('retourne les tranches plan si pas d\'override établissement', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1', nom: 'Standard' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, label: 'Base', actif: true },
                { id: 't2', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, label: '101-500', actif: true },
                { id: 't3', ordre: 2, minEleves: 501, maxEleves: null, montantSupplementaire: 10000, label: '501+', actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([]);

            const result = await service.getResolvedTranches('etab-1');

            expect(result).toHaveLength(3);
            expect(result[0].source).toBe('plan');
            expect(result[1].source).toBe('plan');
            expect(result[2].source).toBe('plan');
        });

        it('override établissement remplace la tranche plan correspondante', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1', nom: 'Standard' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, label: 'Base', actif: true },
                { id: 't2', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, label: '101-500', actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([
                {
                    id: 'ts1', ordre: 1, minEleves: 101, maxEleves: 500,
                    montantSupplementaire: 3000, label: 'Custom 101-500',
                    actif: true, trancheOriginaleId: 't2',
                },
            ]);

            const result = await service.getResolvedTranches('etab-1');

            // L'override remplace t2, t1 reste du plan
            expect(result).toHaveLength(2);
            const planTranche = result.find(r => r.source === 'plan');
            const etabTranche = result.find(r => r.source === 'etablissement');
            expect(planTranche).toBeDefined();
            expect(planTranche!.id).toBe('t1');
            expect(etabTranche).toBeDefined();
            expect(etabTranche!.montantSupplementaire).toBe(3000);
        });

        it('les tranches sont triées par ordre', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't2', ordre: 2, minEleves: 501, maxEleves: null, montantSupplementaire: 10000, actif: true },
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, actif: true },
                { id: 't3', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([]);

            const result = await service.getResolvedTranches('etab-1');

            expect(result[0].ordre).toBe(0);
            expect(result[1].ordre).toBe(1);
            expect(result[2].ordre).toBe(2);
        });
    });

    // =============================================
    // calculateSupplement
    // =============================================
    describe('calculateSupplement', () => {

        it('calcule le supplément pour 200 élèves', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, actif: true },
                { id: 't2', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, actif: true },
                { id: 't3', ordre: 2, minEleves: 501, maxEleves: null, montantSupplementaire: 10000, actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([]);

            const result = await service.calculateSupplement('etab-1', 200);

            // 200 élèves → tranche t2 (101-500) → 5000
            expect(result.totalSupplement).toBe(5000);
            expect(result.tranches.length).toBeGreaterThan(0);
        });

        it('retourne 0 pour un nombre dans la tranche de base', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, actif: true },
                { id: 't2', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([]);

            const result = await service.calculateSupplement('etab-1', 50);

            expect(result.totalSupplement).toBe(0);
        });

        it('utilise les overrides établissement pour le calcul', async () => {
            mockAbonnementFindOne.mockResolvedValue({
                plan: { id: 'plan-1' },
            });
            mockTrancheFind.mockResolvedValue([
                { id: 't1', ordre: 0, minEleves: 0, maxEleves: 100, montantSupplementaire: 0, actif: true },
                { id: 't2', ordre: 1, minEleves: 101, maxEleves: 500, montantSupplementaire: 5000, actif: true },
            ]);
            mockTrancheSuppFind.mockResolvedValue([
                {
                    id: 'ts1', ordre: 1, minEleves: 101, maxEleves: 500,
                    montantSupplementaire: 3000, actif: true, trancheOriginaleId: 't2',
                },
            ]);

            const result = await service.calculateSupplement('etab-1', 200);

            // Override: 3000 au lieu de 5000
            expect(result.totalSupplement).toBe(3000);
        });
    });
});
