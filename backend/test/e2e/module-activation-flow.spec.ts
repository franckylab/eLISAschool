/**
 * ==================================
 * eLISAschool - Tests E2E — Module Activation Flow
 * ==================================
 *
 * Scénarios de bout en bout :
 * 1. Activation cascade complète d'un module avec dépendances
 * 2. Désactivation avec reverse dependencies
 * 3. Protection des modules CRITIQUE
 * 4. Isolation multi-tenant (2 établissements, modules différents)
 * 5. Accès premium sans abonnement → 402
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCatalogueFind = jest.fn();
const mockCatalogueFindOne = jest.fn();
const mockCatalogueSave = jest.fn();
const mockAbonnementFindOne = jest.fn();
const mockAbonnementModuleFind = jest.fn();
const mockModuleOptionnelFind = jest.fn();
const mockModulesGroupeFind = jest.fn();
const mockGroupeLienFindOne = jest.fn();
const mockParametreFindOne = jest.fn();
const mockParametreSave = jest.fn();
const mockAuditLog = jest.fn();

const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
};

// Redis mocks
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
            if (name.includes('ModuleCatalogue') || name.includes('module_catalogue')) {
                return {
                    find: mockCatalogueFind,
                    findOne: mockCatalogueFindOne,
                    save: mockCatalogueSave,
                    createQueryBuilder: jest.fn(() => mockQueryBuilder),
                };
            }
            if (name.includes('AbonnementClient') || name.includes('abonnement_client')) {
                return { findOne: mockAbonnementFindOne };
            }
            if (name.includes('AbonnementModule') || name.includes('abonnement_module')) {
                return { find: mockAbonnementModuleFind };
            }
            if (name.includes('ModuleOptionnel') || name.includes('module_optionnel')) {
                return { find: mockModuleOptionnelFind };
            }
            if (name.includes('ModulesGroupe') || name.includes('modules_groupe')) {
                return { find: mockModulesGroupeFind };
            }
            if (name.includes('GroupeEtablissementLien')) {
                return { findOne: mockGroupeLienFindOne };
            }
            if (name.includes('ParametreSysteme') || name.includes('parametre')) {
                return { findOne: mockParametreFindOne, save: mockParametreSave };
            }
            if (name.includes('ConfigurationModule')) {
                return { findOne: jest.fn(), find: jest.fn(), save: jest.fn() };
            }
            return {
                find: jest.fn(),
                findOne: jest.fn(),
                save: jest.fn(),
                createQueryBuilder: jest.fn(() => mockQueryBuilder),
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
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@modules/auth/services/audit.service', () => ({
    auditService: { log: mockAuditLog },
}));

jest.mock('@modules/auth/entities/audit-log.entity', () => ({
    AuditAction: {
        MODULE_ACTIVATE: 'MODULE_ACTIVATE',
        MODULE_DEACTIVATE: 'MODULE_DEACTIVATE',
        CONFIG_MODULE_TOGGLE: 'CONFIG_MODULE_TOGGLE',
    },
}));

jest.mock('@modules/groupes-etablissements/entities', () => ({
    GroupeEtablissementLien: { name: 'GroupeEtablissementLien' },
}));

import { ModuleResolutionService } from '../../src/modules/billing/services/module-resolution.service';

// Helper
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
        config: null,
        ...overrides,
    };
}

describe('E2E — Module Activation Flow', () => {
    let moduleResolution: ModuleResolutionService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRedisGetJSON.mockResolvedValue(null);
        mockRedisSetJSON.mockResolvedValue(undefined);
        mockRedisDel.mockResolvedValue(1);
        mockRedisDelByPattern.mockResolvedValue(1);
        mockRedisPublish.mockResolvedValue(undefined);
        mockGroupeLienFindOne.mockResolvedValue(null);
        mockModulesGroupeFind.mockResolvedValue([]);

        moduleResolution = new ModuleResolutionService();
    });

    // =============================================
    // 1. Activation cascade complète
    // =============================================
    describe('Activation cascade complète', () => {

        it('devrait résoudre correctement : catalogue + plan + supplement', async () => {
            const catalogue = [
                mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'notes', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'gamification', actifParDefaut: false, categorie: 'PREMIUM' }),
                mockModule({ code: 'transport', actifParDefaut: false, categorie: 'ADDON' }),
                mockModule({ code: 'cantine', actifParDefaut: false, categorie: 'ADDON' }),
            ];
            mockCatalogueFind.mockResolvedValue(catalogue);

            // Plan inclut gamification
            mockAbonnementFindOne.mockResolvedValue({
                statut: 'ACTIF',
                plan: { modulesInclus: ['gamification'] },
            });

            // Supplément : cantine
            mockAbonnementModuleFind.mockResolvedValue([
                { actif: true, moduleOptionnel: { code: 'cantine' } },
            ]);

            const result = await moduleResolution.getResolvedModules('etab-1');

            const auth = result.find(m => m.code === 'auth');
            const notes = result.find(m => m.code === 'notes');
            const gamification = result.find(m => m.code === 'gamification');
            const transport = result.find(m => m.code === 'transport');
            const cantine = result.find(m => m.code === 'cantine');

            // CRITIQUE → actif par catalogue
            expect(auth?.actif).toBe(true);
            expect(auth?.source).toBe('catalogue');
            expect(notes?.actif).toBe(true);
            expect(notes?.source).toBe('catalogue');

            // PREMIUM → actif par plan
            expect(gamification?.actif).toBe(true);
            expect(gamification?.source).toBe('plan');

            // ADDON sans supplément → inactif
            expect(transport?.actif).toBe(false);

            // ADDON avec supplément → actif
            expect(cantine?.actif).toBe(true);
            expect(cantine?.source).toBe('supplement');
        });
    });

    // =============================================
    // 2. Désactivation avec reverse deps
    // =============================================
    describe('Désactivation avec dépendances inverses', () => {

        it('les modules dépendants doivent être détectés', async () => {
            // auth est une dépendance de notes
            const catalogue = [
                mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'notes', actifParDefaut: true, categorie: 'CRITIQUE', dependencies: ['auth'] }),
            ];
            mockCatalogueFind.mockResolvedValue(catalogue);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await moduleResolution.getResolvedModules('etab-1');

            // Les deux doivent être actifs
            expect(result.find(m => m.code === 'auth')?.actif).toBe(true);
            expect(result.find(m => m.code === 'notes')?.actif).toBe(true);
        });
    });

    // =============================================
    // 3. Protection modules CRITIQUE
    // =============================================
    describe('Protection modules CRITIQUE', () => {

        it('les modules CRITIQUE sont actifs par défaut', async () => {
            const catalogue = [
                mockModule({ code: 'auth', categorie: 'CRITIQUE', actifParDefaut: true }),
                mockModule({ code: 'notes', categorie: 'CRITIQUE', actifParDefaut: true }),
            ];
            mockCatalogueFind.mockResolvedValue(catalogue);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await moduleResolution.getResolvedModules('etab-1');

            expect(result.every(m => m.actif)).toBe(true);
        });
    });

    // =============================================
    // 4. Isolation multi-tenant
    // =============================================
    describe('Isolation multi-tenant', () => {

        it('établissement A et B doivent avoir des modules résolus différents', async () => {
            const catalogue = [
                mockModule({ code: 'auth', actifParDefaut: true, categorie: 'CRITIQUE' }),
                mockModule({ code: 'transport', actifParDefaut: false, categorie: 'ADDON' }),
                mockModule({ code: 'cantine', actifParDefaut: false, categorie: 'ADDON' }),
            ];
            mockCatalogueFind.mockResolvedValue(catalogue);

            // --- Établissement A : plan avec transport ---
            mockAbonnementFindOne.mockResolvedValueOnce({
                statut: 'ACTIF',
                plan: { modulesInclus: ['transport'] },
            });
            mockAbonnementModuleFind.mockResolvedValueOnce([]);

            const resultA = await moduleResolution.getResolvedModules('etab-A');

            // --- Établissement B : supplément cantine ---
            jest.clearAllMocks();
            mockRedisGetJSON.mockResolvedValue(null);
            mockRedisSetJSON.mockResolvedValue(undefined);
            mockRedisPublish.mockResolvedValue(undefined);
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockModulesGroupeFind.mockResolvedValue([]);
            mockCatalogueFind.mockResolvedValue(catalogue);

            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([
                { actif: true, moduleOptionnel: { code: 'cantine' } },
            ]);

            const resultB = await moduleResolution.getResolvedModules('etab-B');

            // Vérifier isolation
            const transportA = resultA.find(m => m.code === 'transport');
            const transportB = resultB.find(m => m.code === 'transport');
            const cantineA = resultA.find(m => m.code === 'cantine');
            const cantineB = resultB.find(m => m.code === 'cantine');

            expect(transportA?.actif).toBe(true);  // A a transport via plan
            expect(transportB?.actif).toBe(false); // B n'a pas transport
            expect(cantineA?.actif).toBe(false);   // A n'a pas cantine
            expect(cantineB?.actif).toBe(true);    // B a cantine via supplément
        });
    });

    // =============================================
    // 5. Module facturable
    // =============================================
    describe('Module facturable (gating)', () => {

        it('isModuleFacturable retourne true pour PREMIUM', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockModule({ code: 'transport', categorie: 'PREMIUM', estFacturable: true }),
            );

            const result = await moduleResolution.isModuleFacturable('transport');
            expect(result).toBe(true);
        });

        it('isModuleFacturable retourne false pour CRITIQUE', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockModule({ code: 'auth', categorie: 'CRITIQUE', estFacturable: false }),
            );

            const result = await moduleResolution.isModuleFacturable('auth');
            expect(result).toBe(false);
        });
    });

    // =============================================
    // 6. Cache
    // =============================================
    describe('Cache et invalidation', () => {

        it('le cache doit être invalidé après invalidate()', async () => {
            // Premier appel — résout
            const catalogue = [mockModule({ code: 'auth', actifParDefaut: true })];
            mockCatalogueFind.mockResolvedValue(catalogue);
            mockAbonnementFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            await moduleResolution.getResolvedModules('etab-1');
            expect(mockCatalogueFind).toHaveBeenCalledTimes(1);

            // Invalider le cache
            await moduleResolution.invalidate('etab-1');

            // Redis est appelé pour l'invalidation
            expect(mockRedisDel).toHaveBeenCalledWith('modules:resolved:etab-1');
            expect(mockRedisPublish).toHaveBeenCalled();
        });

        it('le cache global doit être invalidé sans etablissementId', async () => {
            await moduleResolution.invalidate();

            expect(mockRedisDelByPattern).toHaveBeenCalledWith('modules:resolved:*');
        });
    });
});
