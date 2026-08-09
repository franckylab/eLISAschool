/**
 * ==================================
 * eLISAschool - Tests unitaires Feature Flags
 * ==================================
 * 
 * Teste la résolution en cascade des feature flags :
 * 1. Override tenant → priorité maximale
 * 2. Flags du plan d'abonnement
 * 3. Défaut: false
 * 
 * Teste aussi le cache en mémoire (TTL 5 min).
 * 
 * Phase 3.3 — Refonte SaaS v5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockFlagFindOne = jest.fn();
const mockAbonnementFindOne = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name === 'FeatureFlagTenant' || name.includes('feature_flag')) {
                return { findOne: mockFlagFindOne };
            }
            if (name === 'AbonnementClient' || name.includes('abonnement')) {
                return { findOne: mockAbonnementFindOne };
            }
            if (name === 'PlanAbonnement' || name.includes('plan')) {
                return { findOne: jest.fn() };
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

import { FeatureFlagService } from '../../src/modules/billing/services/feature-flags.service';

describe('FeatureFlagService — Cascade', () => {
    let service: FeatureFlagService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Recréer le service à chaque test pour vider le cache
        service = new FeatureFlagService();
    });

    // =============================================
    // Priorité 1 : Override tenant
    // =============================================
    describe('Override tenant (priorité 1)', () => {

        it('retourne la valeur de l\'override tenant si existant', async () => {
            mockFlagFindOne.mockResolvedValue({
                flagName: 'module_transport',
                etablissementId: 'etab-1',
                enabled: true,
            });

            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(true);
            // Ne doit pas vérifier le plan
            expect(mockAbonnementFindOne).not.toHaveBeenCalled();
        });

        it('override tenant peut désactiver un flag du plan', async () => {
            mockFlagFindOne.mockResolvedValue({
                flagName: 'module_transport',
                etablissementId: 'etab-1',
                enabled: false,
            });

            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(false);
        });
    });

    // =============================================
    // Priorité 2 : Flags du plan
    // =============================================
    describe('Flags du plan (priorité 2)', () => {

        it('retourne la valeur du flag du plan si pas d\'override', async () => {
            mockFlagFindOne.mockResolvedValue(null);
            mockAbonnementFindOne.mockResolvedValue({
                plan: {
                    featureFlags: { module_transport: true, module_cantine: false },
                    modulesInclus: [],
                },
            });

            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(true);
        });

        it('retourne false si le flag du plan est false', async () => {
            mockFlagFindOne.mockResolvedValue(null);
            mockAbonnementFindOne.mockResolvedValue({
                plan: {
                    featureFlags: { module_cantine: false },
                    modulesInclus: [],
                },
            });

            const result = await service.isEnabled('module_cantine', 'etab-1');

            expect(result).toBe(false);
        });
    });

    // =============================================
    // Priorité 3 : Défaut false
    // =============================================
    describe('Défaut false (priorité 3)', () => {

        it('retourne false si aucun flag trouvé', async () => {
            mockFlagFindOne.mockResolvedValue(null);
            mockAbonnementFindOne.mockResolvedValue(null);

            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(false);
        });

        it('retourne false si le plan n\'a pas de featureFlags', async () => {
            mockFlagFindOne.mockResolvedValue(null);
            mockAbonnementFindOne.mockResolvedValue({
                plan: { featureFlags: null, modulesInclus: [] },
            });

            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(false);
        });
    });

    // =============================================
    // Cache en mémoire
    // =============================================
    describe('Cache mémoire (TTL 5 min)', () => {

        it('met en cache le résultat après le premier appel', async () => {
            mockFlagFindOne.mockResolvedValue({
                flagName: 'module_transport',
                enabled: true,
            });

            // Premier appel
            await service.isEnabled('module_transport', 'etab-1');
            // Deuxième appel — doit utiliser le cache
            const result = await service.isEnabled('module_transport', 'etab-1');

            expect(result).toBe(true);
            // findOne ne doit être appelé qu'une seule fois
            expect(mockFlagFindOne).toHaveBeenCalledTimes(1);
        });
    });
});
