/**
 * ==================================
 * eLISAschool - Tests E2E — Multi-Tenant Module Isolation
 * ==================================
 *
 * Scénarios de sécurité multi-tenant :
 * 1. Établissement A ne voit pas les modules de l'établissement B
 * 2. Suppléments spécifiques à un établissement
 * 3. Overrides ParametreSysteme isolés
 * 4. Cross-tenant attack prevention
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCatalogueFind = jest.fn();
const mockCatalogueFindOne = jest.fn();
const mockAbonnementFindOne = jest.fn();
const mockAbonnementModuleFind = jest.fn();
const mockModulesGroupeFind = jest.fn();
const mockGroupeLienFindOne = jest.fn();

const mockRedisGetJSON = jest.fn();
const mockRedisSetJSON = jest.fn();
const mockRedisDel = jest.fn();
const mockRedisDelByPattern = jest.fn();
const mockRedisPublish = jest.fn();
const mockRedisSubscribe = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('ModuleCatalogue')) {
                return { find: mockCatalogueFind, findOne: mockCatalogueFindOne };
            }
            if (name.includes('AbonnementClient')) {
                return { findOne: mockAbonnementFindOne };
            }
            if (name.includes('AbonnementModule')) {
                return { find: mockAbonnementModuleFind };
            }
            if (name.includes('ModuleOptionnel')) {
                return { find: jest.fn() };
            }
            if (name.includes('ModulesGroupe')) {
                return { find: mockModulesGroupeFind };
            }
            if (name.includes('GroupeEtablissementLien')) {
                return { findOne: mockGroupeLienFindOne };
            }
            return { find: jest.fn(), findOne: jest.fn(), save: jest.fn() };
        }),
    },
}));

jest.mock('@common/services/redis.service', () => ({
    redisService: {
        getJSON: mockRedisGetJSON,
        setJSON: mockRedisSetJSON,
        del: mockRedisDel,
        delByPattern: mockRedisDelByPattern,
        publish: mockRedisPublish,
        subscribe: mockRedisSubscribe,
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@modules/groupes-etablissements/entities', () => ({
    GroupeEtablissementLien: { name: 'GroupeEtablissementLien' },
}));

import { ModuleResolutionService } from '../../src/modules/billing/services/module-resolution.service';

function mockModule(overrides: any = {}) {
    return {
        id: 'uuid-' + (overrides.code || 'x'),
        code: overrides.code || 'test',
        nom: overrides.nom || 'Test',
        categorie: overrides.categorie || 'ADDON',
        icone: 'Box',
        prixMensuel: 0,
        prixAnnuel: 0,
        estFacturable: overrides.estFacturable || false,
        estSouscriptible: false,
        actifParDefaut: overrides.actifParDefaut ?? false,
        planMinimal: null,
        dependencies: overrides.dependencies || [],
        ordre: 0,
        estActif: true,
        ...overrides,
    };
}

describe('E2E — Multi-Tenant Module Isolation', () => {
    let service: ModuleResolutionService;

    const ETAB_A = 'etab-aaaa-1111';
    const ETAB_B = 'etab-bbbb-2222';
    const ETAB_C = 'etab-cccc-3333';

    const catalogue = [
        mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
        mockModule({ code: 'notes', actifParDefaut: true, categorie: 'CRITIQUE' }),
        mockModule({ code: 'transport', actifParDefaut: false, categorie: 'PREMIUM', estFacturable: true }),
        mockModule({ code: 'cantine', actifParDefaut: false, categorie: 'ADDON', estFacturable: true }),
        mockModule({ code: 'gamification', actifParDefaut: false, categorie: 'PREMIUM', estFacturable: true }),
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockRedisGetJSON.mockResolvedValue(null);
        mockRedisSetJSON.mockResolvedValue(undefined);
        mockRedisDel.mockResolvedValue(1);
        mockRedisDelByPattern.mockResolvedValue(1);
        mockRedisPublish.mockResolvedValue(undefined);
        mockGroupeLienFindOne.mockResolvedValue(null);
        mockModulesGroupeFind.mockResolvedValue([]);
        mockCatalogueFind.mockResolvedValue(catalogue);

        service = new ModuleResolutionService();
    });

    // =============================================
    // 1. Isolation des plans
    // =============================================
    describe('Isolation des plans d\'abonnement', () => {

        it('Etab A a un plan Premium, Etab B a un plan Starter — modules différents', async () => {
            // Etab A : plan Premium avec transport + gamification
            mockAbonnementFindOne.mockResolvedValueOnce({
                statut: 'ACTIF',
                plan: { modulesInclus: ['transport', 'gamification'] },
            });
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const resultA = await service.getResolvedModules(ETAB_A);

            // Etab B : plan Starter sans modules premium
            jest.clearAllMocks();
            mockRedisGetJSON.mockResolvedValue(null);
            mockRedisSetJSON.mockResolvedValue(undefined);
            mockRedisPublish.mockResolvedValue(undefined);
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockModulesGroupeFind.mockResolvedValue([]);
            mockCatalogueFind.mockResolvedValue(catalogue);
            mockAbonnementFindOne.mockResolvedValueOnce({
                statut: 'ACTIF',
                plan: { modulesInclus: [] }, // Starter — aucun module premium
            });
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const resultB = await service.getResolvedModules(ETAB_B);

            // Vérifier : A a transport actif, B ne l'a pas
            expect(resultA.find(m => m.code === 'transport')?.actif).toBe(true);
            expect(resultB.find(m => m.code === 'transport')?.actif).toBe(false);

            // Vérifier : A a gamification actif, B ne l'a pas
            expect(resultA.find(m => m.code === 'gamification')?.actif).toBe(true);
            expect(resultB.find(m => m.code === 'gamification')?.actif).toBe(false);

            // Les deux ont auth et notes (CRITIQUE)
            expect(resultA.find(m => m.code === 'auth')?.actif).toBe(true);
            expect(resultB.find(m => m.code === 'auth')?.actif).toBe(true);
        });
    });

    // =============================================
    // 2. Isolation des suppléments
    // =============================================
    describe('Isolation des suppléments (AbonnementModule)', () => {

        it('Etab A a souscrit cantine, Etab B ne l\'a pas', async () => {
            // Etab A : supplément cantine
            mockAbonnementFindOne.mockResolvedValueOnce(null);
            mockAbonnementModuleFind.mockResolvedValueOnce([
                { actif: true, moduleOptionnel: { code: 'cantine' } },
            ]);

            const resultA = await service.getResolvedModules(ETAB_A);

            // Etab B : aucun supplément
            jest.clearAllMocks();
            mockRedisGetJSON.mockResolvedValue(null);
            mockRedisSetJSON.mockResolvedValue(undefined);
            mockRedisPublish.mockResolvedValue(undefined);
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockModulesGroupeFind.mockResolvedValue([]);
            mockCatalogueFind.mockResolvedValue(catalogue);
            mockAbonnementFindOne.mockResolvedValueOnce(null);
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const resultB = await service.getResolvedModules(ETAB_B);

            expect(resultA.find(m => m.code === 'cantine')?.actif).toBe(true);
            expect(resultB.find(m => m.code === 'cantine')?.actif).toBe(false);
        });
    });

    // =============================================
    // 3. Cross-tenant cache isolation
    // =============================================
    describe('Isolation du cache par établissement', () => {

        it('le cache Redis utilise des clés distinctes par établissement', async () => {
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            // Résoudre pour Etab A
            await service.getResolvedModules(ETAB_A);

            // Vérifier que la clé Redis est spécifique à A
            expect(mockRedisSetJSON).toHaveBeenCalledWith(
                `modules:resolved:${ETAB_A}`,
                expect.any(Array),
                60,
            );

            // Résoudre pour Etab B
            await service.getResolvedModules(ETAB_B);

            // Vérifier que la clé Redis est spécifique à B
            expect(mockRedisSetJSON).toHaveBeenCalledWith(
                `modules:resolved:${ETAB_B}`,
                expect.any(Array),
                60,
            );
        });

        it('invalider le cache de A ne touche pas B', async () => {
            await service.invalidate(ETAB_A);

            expect(mockRedisDel).toHaveBeenCalledWith(`modules:resolved:${ETAB_A}`);
            // Ne doit PAS avoir invalidé B
            expect(mockRedisDel).not.toHaveBeenCalledWith(`modules:resolved:${ETAB_B}`);
        });
    });

    // =============================================
    // 4. Abonnement expiré
    // =============================================
    describe('Abonnement expiré — modules premium désactivés', () => {

        it('un abonnement EXPIRE ne doit pas activer les modules du plan', async () => {
            mockAbonnementFindOne.mockResolvedValueOnce({
                statut: 'EXPIRE', // Abonnement expiré
                plan: { modulesInclus: ['transport', 'gamification'] },
            });
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const result = await service.getResolvedModules(ETAB_A);

            // Les modules premium ne doivent PAS être actifs
            expect(result.find(m => m.code === 'transport')?.actif).toBe(false);
            expect(result.find(m => m.code === 'gamification')?.actif).toBe(false);

            // Les modules CRITIQUE restent actifs
            expect(result.find(m => m.code === 'auth')?.actif).toBe(true);
        });
    });

    // =============================================
    // 5. Établissement sans abonnement
    // =============================================
    describe('Établissement sans abonnement', () => {

        it('sans abonnement, seuls les modules CRITIQUE sont actifs', async () => {
            mockAbonnementFindOne.mockResolvedValueOnce(null);
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const result = await service.getResolvedModules(ETAB_C);

            const actifs = result.filter(m => m.actif);
            const inactifs = result.filter(m => !m.actif);

            // Seuls les CRITIQUE sont actifs
            for (const m of actifs) {
                expect(m.categorie).toBe('CRITIQUE');
            }

            // PREMIUM et ADDON sont inactifs
            for (const m of inactifs) {
                expect(['PREMIUM', 'ADDON']).toContain(m.categorie);
            }
        });
    });

    // =============================================
    // 6. Invalidation globale (plateforme)
    // =============================================
    describe('Invalidation globale plateforme', () => {

        it('invalidate() sans etablissementId doit tout nettoyer', async () => {
            await service.invalidate();

            // Redis pattern delete
            expect(mockRedisDelByPattern).toHaveBeenCalledWith('modules:resolved:*');

            // Pub/sub global
            expect(mockRedisPublish).toHaveBeenCalledWith(
                'modules:invalidate',
                { etablissementId: undefined },
            );
        });
    });
});
