/**
 * ==================================
 * eLISAschool - Tests unitaires ModuleResolutionService
 * ==================================
 *
 * Teste la cascade de résolution des modules :
 * 1. Catalogue (actifParDefaut) → base
 * 2. Plan (modulesInclus) → activation
 * 3. Supplément (AbonnementModule) → activation
 * 4. Cache Redis (TTL 60s) avec fallback in-memory
 * 5. Isolation multi-tenant
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCatalogueFind = jest.fn();
const mockCatalogueFindOne = jest.fn();
const mockAbonnementFindOne = jest.fn();
const mockAbonnementModuleFind = jest.fn();
const mockModuleOptionnelFind = jest.fn();
const mockModulesGroupeFind = jest.fn();
const mockGroupeLienFindOne = jest.fn();
const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
};

// Mock Redis
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
            if (name === 'ModuleCatalogue' || name.includes('module_catalogue')) {
                return {
                    find: mockCatalogueFind,
                    findOne: mockCatalogueFindOne,
                    createQueryBuilder: jest.fn(() => mockQueryBuilder),
                };
            }
            if (name === 'AbonnementClient' || name.includes('abonnement_client')) {
                return { findOne: mockAbonnementFindOne };
            }
            if (name === 'AbonnementModule' || name.includes('abonnement_module')) {
                return { find: mockAbonnementModuleFind };
            }
            if (name === 'ModuleOptionnel' || name.includes('module_optionnel')) {
                return { find: mockModuleOptionnelFind };
            }
            if (name === 'ModulesGroupe' || name.includes('modules_groupe')) {
                return { find: mockModulesGroupeFind };
            }
            if (name === 'GroupeEtablissementLien' || name.includes('groupe_etablissement')) {
                return { findOne: mockGroupeLienFindOne };
            }
            return {
                find: jest.fn(),
                findOne: jest.fn(),
                save: jest.fn(),
            };
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
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('@modules/groupes-etablissements/entities', () => ({
    GroupeEtablissementLien: { name: 'GroupeEtablissementLien' },
}));

import { ModuleResolutionService } from '../../src/modules/billing/services/module-resolution.service';

// Helper pour créer un ModuleCatalogue mock
function mockModule(overrides: Partial<any> = {}) {
    return {
        id: 'uuid-' + (overrides.code || 'x'),
        code: overrides.code || 'test-module',
        nom: overrides.nom || 'Test Module',
        categorie: overrides.categorie || 'ADDON',
        icone: overrides.icone || 'Box',
        prixMensuel: overrides.prixMensuel || 0,
        prixAnnuel: overrides.prixAnnuel || 0,
        estFacturable: overrides.estFacturable || false,
        estSouscriptible: overrides.estSouscriptible || false,
        actifParDefaut: overrides.actifParDefaut ?? false,
        planMinimal: overrides.planMinimal || null,
        dependencies: overrides.dependencies || [],
        ordre: overrides.ordre || 0,
        estActif: overrides.estActif ?? true,
        ...overrides,
    };
}

describe('ModuleResolutionService — Cascade de résolution', () => {
    let service: ModuleResolutionService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Redis disponible par défaut
        mockRedisGetJSON.mockResolvedValue(null);
        mockRedisSetJSON.mockResolvedValue(undefined);
        mockRedisDel.mockResolvedValue(1);
        mockRedisDelByPattern.mockResolvedValue(1);
        mockRedisPublish.mockResolvedValue(undefined);
        // Pas de groupe par défaut
        mockGroupeLienFindOne.mockResolvedValue(null);
        mockModulesGroupeFind.mockResolvedValue([]);

        service = new ModuleResolutionService();
    });

    // =============================================
    // 1. Catalogue (actifParDefaut)
    // =============================================
    describe('Cascade — Catalogue (actifParDefaut)', () => {

        it('devrait activer les modules avec actifParDefaut=true', async () => {
            const modules = [
                mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'transport', actifParDefaut: false, categorie: 'ADDON' }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.getResolvedModules('etab-1');

            const authModule = result.find(m => m.code === 'auth');
            const transportModule = result.find(m => m.code === 'transport');

            expect(authModule?.actif).toBe(true);
            expect(authModule?.source).toBe('catalogue');
            expect(transportModule?.actif).toBe(false);
        });

        it('devrait retourner tous les modules du catalogue', async () => {
            const modules = [
                mockModule({ code: 'auth' }),
                mockModule({ code: 'notes' }),
                mockModule({ code: 'transport' }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.getResolvedModules('etab-1');

            expect(result).toHaveLength(3);
        });
    });

    // =============================================
    // 2. Plan (modulesInclus)
    // =============================================
    describe('Cascade — Plan (modulesInclus)', () => {

        it('devrait activer les modules inclus dans le plan', async () => {
            const modules = [
                mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'gamification', actifParDefaut: false, categorie: 'PREMIUM' }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue({
                statut: 'ACTIF',
                plan: { modulesInclus: ['gamification'] },
            });
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.getResolvedModules('etab-1');

            const gamification = result.find(m => m.code === 'gamification');
            expect(gamification?.actif).toBe(true);
            expect(gamification?.source).toBe('plan');
        });

        it('ne devrait pas activer si abonnement non ACTIF', async () => {
            const modules = [
                mockModule({ code: 'gamification', actifParDefaut: false, categorie: 'PREMIUM' }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue({
                statut: 'EXPIRE',
                plan: { modulesInclus: ['gamification'] },
            });
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.getResolvedModules('etab-1');

            const gamification = result.find(m => m.code === 'gamification');
            expect(gamification?.actif).toBe(false);
        });
    });

    // =============================================
    // 3. Supplément (AbonnementModule)
    // =============================================
    describe('Cascade — Supplément (AbonnementModule)', () => {

        it('devrait activer les modules souscrits en supplément', async () => {
            const modules = [
                mockModule({ code: 'cantine', actifParDefaut: false, categorie: 'ADDON' }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([
                {
                    actif: true,
                    moduleOptionnel: { code: 'cantine' },
                },
            ]);

            const result = await service.getResolvedModules('etab-1');

            const cantine = result.find(m => m.code === 'cantine');
            expect(cantine?.actif).toBe(true);
            expect(cantine?.source).toBe('supplement');
        });
    });

    // =============================================
    // 4. Cache Redis
    // =============================================
    describe('Cache Redis (TTL 60s)', () => {

        it('devrait utiliser le cache Redis si disponible', async () => {
            const cachedModules = [
                { code: 'auth', actif: true, source: 'catalogue' },
            ];
            mockRedisGetJSON.mockResolvedValue(cachedModules);

            const result = await service.getResolvedModules('etab-1');

            expect(result).toEqual(cachedModules);
            // Ne doit pas requêter la DB
            expect(mockCatalogueFind).not.toHaveBeenCalled();
        });

        it('devrait stocker en Redis après calcul', async () => {
            const modules = [mockModule({ code: 'auth', actifParDefaut: true })];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);
            mockRedisGetJSON.mockResolvedValue(null);

            await service.getResolvedModules('etab-1');

            expect(mockRedisSetJSON).toHaveBeenCalledWith(
                'modules:resolved:etab-1',
                expect.any(Array),
                60, // TTL 60s
            );
        });

        it('devrait fallback en in-memory si Redis échoue', async () => {
            mockRedisGetJSON.mockRejectedValue(new Error('Redis down'));
            const modules = [mockModule({ code: 'auth', actifParDefaut: true })];
            mockCatalogueFind.mockResolvedValue(modules);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.getResolvedModules('etab-1');

            expect(result).toHaveLength(1);
            // Redis marqué comme indisponible
            // Le prochain appel utilisera le cache in-memory
        });
    });

    // =============================================
    // 5. Invalidation
    // =============================================
    describe('Invalidation cache', () => {

        it('devrait invalider le cache pour un établissement spécifique', async () => {
            await service.invalidate('etab-1');

            expect(mockRedisDel).toHaveBeenCalledWith('modules:resolved:etab-1');
            expect(mockRedisPublish).toHaveBeenCalledWith(
                'modules:invalidate',
                { etablissementId: 'etab-1' },
            );
        });

        it('devrait invalider tout le cache si pas d\'etablissementId', async () => {
            await service.invalidate();

            expect(mockRedisDelByPattern).toHaveBeenCalledWith('modules:resolved:*');
            expect(mockRedisPublish).toHaveBeenCalledWith(
                'modules:invalidate',
                { etablissementId: undefined },
            );
        });
    });

    // =============================================
    // 6. isModuleFacturable
    // =============================================
    describe('isModuleFacturable', () => {

        it('devrait retourner true pour un module facturable', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockModule({ code: 'transport', estFacturable: true, estActif: true }),
            );

            const result = await service.isModuleFacturable('transport');

            expect(result).toBe(true);
        });

        it('devrait retourner false pour un module non facturable', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockModule({ code: 'auth', estFacturable: false, estActif: true }),
            );

            const result = await service.isModuleFacturable('auth');

            expect(result).toBe(false);
        });

        it('devrait retourner false si module inexistant', async () => {
            mockCatalogueFindOne.mockResolvedValue(null);

            const result = await service.isModuleFacturable('inexistant');

            expect(result).toBe(false);
        });
    });

    // =============================================
    // 7. Isolation multi-tenant
    // =============================================
    describe('Isolation multi-tenant', () => {

        it('les modules résolus doivent être spécifiques à l\'établissement', async () => {
            const modules = [
                mockModule({ code: 'auth', actifParDefaut: true }),
                mockModule({ code: 'transport', actifParDefaut: false }),
            ];
            mockCatalogueFind.mockResolvedValue(modules);

            // Etab A : a un abonnement avec transport
            mockAbonnementFindOne.mockResolvedValueOnce({
                statut: 'ACTIF',
                plan: { modulesInclus: ['transport'] },
            });
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const resultA = await service.getResolvedModules('etab-A');

            // Reset mocks pour etab B
            jest.clearAllMocks();
            mockCatalogueFind.mockResolvedValue(modules);
            mockRedisGetJSON.mockResolvedValue(null);
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockModulesGroupeFind.mockResolvedValue([]);

            // Etab B : pas d'abonnement
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const resultB = await service.getResolvedModules('etab-B');

            const transportA = resultA.find(m => m.code === 'transport');
            const transportB = resultB.find(m => m.code === 'transport');

            expect(transportA?.actif).toBe(true); // activé par le plan
            expect(transportB?.actif).toBe(false); // pas d'activation
        });
    });
});
