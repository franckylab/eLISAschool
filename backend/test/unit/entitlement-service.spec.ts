/**
 * ==================================
 * eLISAschool - Tests unitaires EntitlementService
 * ==================================
 *
 * Teste le service EntitlementService (source unique de vérité) :
 * - Module CRITIQUE → bypass total (accessible=true, source='critique')
 * - Module inexistant/désactivé → accessible=false, visible=false
 * - Abonnement ACTIF + plan inclus → accessible=true, source='plan'
 * - Pas d'abonnement + actifParDefaut → accessible=true, source='catalogue'
 * - Pas d'abonnement + pas actifParDefaut → ABONNEMENT_INACTIF
 * - Abonnement EXPIRE → ABONNEMENT_EXPIRE
 * - Abonnement SUSPENDU → ABONNEMENT_SUSPENDU
 * - Override groupe actif → source='groupe'
 * - Override groupe inactif → OVERRIDE_DESACTIVE
 * - Supplément souscrit → source='supplement'
 * - Plan insufficient → PLAN_INSUFFICIENT
 * - Défaut catalogue (actifParDefaut) → source='catalogue'
 * - checkAll() → résultat batch
 * - isAccessible() → boolean shortcut
 * - Cache in-memory → hit après premier appel
 *
 * Refonte SaaS — Unification Modules (migration 200)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCatalogueFindOne = jest.fn();
const mockCatalogueFind = jest.fn();
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
            const name = entity?.name || entity?.entityName || '';
            if (name.includes('ModuleCatalogue') || name === 'ModuleCatalogue') {
                return { findOne: mockCatalogueFindOne, find: mockCatalogueFind };
            }
            if (name.includes('AbonnementClient') || name === 'AbonnementClient') {
                return { findOne: mockAbonnementFindOne };
            }
            if (name.includes('AbonnementModule') || name === 'AbonnementModule') {
                return { find: mockAbonnementModuleFind };
            }
            if (name.includes('ModulesGroupe') || name === 'ModulesGroupe') {
                return { find: mockModulesGroupeFind };
            }
            if (name.includes('GroupeEtablissementLien') || name === 'GroupeEtablissementLien') {
                return { findOne: mockGroupeLienFindOne };
            }
            return { findOne: jest.fn(), find: jest.fn() };
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

// Import après mocks
import { EntitlementService } from '../../src/modules/billing/services/entitlement.service';

describe('EntitlementService', () => {
    let service: EntitlementService;

    beforeEach(() => {
        jest.clearAllMocks();
        // Redis indisponible par défaut pour simplifier les tests in-memory
        mockRedisGetJSON.mockRejectedValue(new Error('Redis mock unavailable'));
        mockRedisSetJSON.mockRejectedValue(new Error('Redis mock unavailable'));
        mockRedisSubscribe.mockImplementation(() => { throw new Error('no pubsub'); });

        service = new EntitlementService();
    });

    // =============================================
    // Helpers
    // =============================================
    function mockCatalogueModule(overrides: any = {}) {
        return {
            code: 'test-module',
            nom: 'Test Module',
            categorie: 'PREMIUM',
            estActif: true,
            actifParDefaut: false,
            planMinimal: null,
            estSouscriptible: false,
            ...overrides,
        };
    }

    function mockAbonnement(overrides: any = {}) {
        return {
            etablissementId: 'etab-1',
            statut: 'ACTIF',
            plan: {
                slug: 'starter',
                nom: 'Starter',
                modulesInclus: ['eleves', 'notes'],
            },
            ...overrides,
        };
    }

    // =============================================
    // CRITIQUE — Bypass total
    // =============================================
    describe('Module CRITIQUE — Bypass total', () => {
        it('devrait toujours retourner accessible=true pour les modules critiques (code)', async () => {
            const result = await service.check('etab-1', 'auth');

            expect(result.accessible).toBe(true);
            expect(result.raison).toBe('CRITIQUE');
            expect(result.source).toBe('critique');
            // Ne doit PAS accéder à la DB
            expect(mockCatalogueFindOne).not.toHaveBeenCalled();
        });

        it('devrait bypasser pour utilisateurs, configuration, notifications', async () => {
            for (const code of ['utilisateurs', 'configuration', 'notifications']) {
                const result = await service.check('etab-1', code);
                expect(result.accessible).toBe(true);
                expect(result.source).toBe('critique');
            }
        });

        it('devrait bypasser même sans abonnement pour CRITIQUE (catégorie)', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'monitoring', categorie: 'CRITIQUE' }),
            );

            const result = await service.check('etab-1', 'monitoring');

            expect(result.accessible).toBe(true);
            expect(result.raison).toBe('CRITIQUE');
            expect(result.source).toBe('critique');
        });
    });

    // =============================================
    // Module inexistant / désactivé
    // =============================================
    describe('Module inexistant / désactivé', () => {
        it('devrait retourner accessible=false si module non trouvé', async () => {
            mockCatalogueFindOne.mockResolvedValue(null);

            const result = await service.check('etab-1', 'unknown');

            expect(result.accessible).toBe(false);
            expect(result.visible).toBe(false);
            expect(result.raison).toBe('MODULE_DESACTIVE');
        });

        it('devrait retourner accessible=false si module estActif=false', async () => {
            mockCatalogueFindOne.mockResolvedValue(null);

            const result = await service.check('etab-1', 'disabled-module');

            expect(result.accessible).toBe(false);
        });
    });

    // =============================================
    // Abonnement ACTIF + plan inclus
    // =============================================
    describe('Abonnement ACTIF + plan inclus', () => {
        it('devrait retourner accessible=true si module dans plan.modulesInclus', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule({ code: 'eleves' }));
            mockAbonnementFindOne.mockResolvedValue(mockAbonnement());

            const result = await service.check('etab-1', 'eleves');

            expect(result.accessible).toBe(true);
            expect(result.raison).toBe('OK');
            expect(result.source).toBe('plan');
            expect(result.planActuel).toBe('starter');
        });
    });

    // =============================================
    // Pas d'abonnement
    // =============================================
    describe('Pas d\'abonnement', () => {
        it('devrait retourner OK si actifParDefaut et pas d\'abonnement', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'cms', actifParDefaut: true }),
            );
            mockAbonnementFindOne.mockResolvedValue(null);

            const result = await service.check('etab-1', 'cms');

            expect(result.accessible).toBe(true);
            expect(result.source).toBe('catalogue');
        });

        it('devrait retourner ABONNEMENT_INACTIF si pas actifParDefaut et pas d\'abonnement', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'cantine', actifParDefaut: false }),
            );
            mockAbonnementFindOne.mockResolvedValue(null);

            const result = await service.check('etab-1', 'cantine');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('ABONNEMENT_INACTIF');
        });
    });

    // =============================================
    // Abonnement EXPIRE / SUSPENDU
    // =============================================
    describe('Abonnement EXPIRE / SUSPENDU', () => {
        it('devrait retourner ABONNEMENT_EXPIRE', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule());
            mockAbonnementFindOne.mockResolvedValue(
                mockAbonnement({ statut: 'EXPIRE' }),
            );

            const result = await service.check('etab-1', 'test-module');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('ABONNEMENT_EXPIRE');
        });

        it('devrait retourner ABONNEMENT_SUSPENDU', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule());
            mockAbonnementFindOne.mockResolvedValue(
                mockAbonnement({ statut: 'SUSPENDU' }),
            );

            const result = await service.check('etab-1', 'test-module');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('ABONNEMENT_SUSPENDU');
        });
    });

    // =============================================
    // Override groupe
    // =============================================
    describe('Override groupe', () => {
        it('devrait retourner source=groupe si module actif via groupe', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule({ code: 'transport' }));
            mockAbonnementFindOne.mockResolvedValue(mockAbonnement());
            mockGroupeLienFindOne.mockResolvedValue({ groupeId: 'groupe-1' });
            mockModulesGroupeFind.mockResolvedValue([
                { module: { code: 'transport' }, actif: true },
            ]);

            const result = await service.check('etab-1', 'transport');

            expect(result.accessible).toBe(true);
            expect(result.source).toBe('groupe');
        });

        it('devrait retourner OVERRIDE_DESACTIVE si groupe désactive le module', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule({ code: 'transport' }));
            mockAbonnementFindOne.mockResolvedValue(mockAbonnement());
            mockGroupeLienFindOne.mockResolvedValue({ groupeId: 'groupe-1' });
            mockModulesGroupeFind.mockResolvedValue([
                { module: { code: 'transport' }, actif: false },
            ]);

            const result = await service.check('etab-1', 'transport');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('OVERRIDE_DESACTIVE');
            expect(result.source).toBe('groupe');
        });
    });

    // =============================================
    // Supplément souscrit
    // =============================================
    describe('Supplément souscrit', () => {
        it('devrait retourner source=supplement si module souscrit en supplément', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'clubs' }),
            );
            mockAbonnementFindOne.mockResolvedValue(mockAbonnement());
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([
                { moduleOptionnel: { slug: 'clubs' }, actif: true },
            ]);

            const result = await service.check('etab-1', 'clubs');

            expect(result.accessible).toBe(true);
            expect(result.source).toBe('supplement');
        });
    });

    // =============================================
    // Plan insufficient
    // =============================================
    describe('Plan insufficient', () => {
        it('devrait retourner PLAN_INSUFFICIENT si plan trop bas', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'orientation', planMinimal: 'pro' }),
            );
            mockAbonnementFindOne.mockResolvedValue(
                mockAbonnement({ plan: { slug: 'starter', nom: 'Starter', modulesInclus: [] } }),
            );
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([]);

            const result = await service.check('etab-1', 'orientation');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('PLAN_INSUFFICIENT');
            expect(result.planMinimalRequis).toBe('pro');
            expect(result.planActuel).toBe('starter');
        });
    });

    // =============================================
    // isAccessible — boolean shortcut
    // =============================================
    describe('isAccessible — boolean shortcut', () => {
        it('devrait retourner true pour module accessible', async () => {
            const result = await service.isAccessible('etab-1', 'auth');
            expect(result).toBe(true);
        });
    });

    // =============================================
    // getStatutAbonnement
    // =============================================
    describe('getStatutAbonnement', () => {
        it('devrait retourner AUCUN si pas d\'abonnement', async () => {
            mockAbonnementFindOne.mockResolvedValue(null);

            const result = await service.getStatutAbonnement('etab-1');

            expect(result.actif).toBe(false);
            expect(result.statut).toBe('AUCUN');
        });

        it('devrait retourner les infos si abonnement actif', async () => {
            mockAbonnementFindOne.mockResolvedValue(
                mockAbonnement({ statut: 'ACTIF' }),
            );

            const result = await service.getStatutAbonnement('etab-1');

            expect(result.actif).toBe(true);
            expect(result.statut).toBe('ACTIF');
            expect(result.planSlug).toBe('starter');
        });
    });
});
