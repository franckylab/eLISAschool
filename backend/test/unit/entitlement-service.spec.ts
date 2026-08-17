/**
 * ==================================
 * eLISAschool - Tests unitaires EntitlementService v3
 * ==================================
 *
 * Teste la cascade 4 questions (Refonte v3, migration 213) :
 * - Q1. Module critique (estCritique=true) → bypass total
 * - Q2. Abonnement ACTIF/ESSAI ? → sinon AUCUN_PLAN
 * - Q3. Inclus par le plan (entitlements.modules) → accessible
 * - Q4. Override groupe/supplément → accessible
 * - Sinon → PLAN_INSUFFICIENT / MODULE_DESACTIVE
 *
 * Mocks : catalogue avec estCritique + categorie GRATUIT|PAYANT.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCatalogueFindOne = jest.fn();
const mockCatalogueFind = jest.fn();
const mockAbonnementFindOne = jest.fn();
const mockAbonnementFind = jest.fn();
const mockAbonnementModuleFind = jest.fn();
const mockModulesGroupeFind = jest.fn();
const mockGroupeLienFindOne = jest.fn();
const mockStrategieFind = jest.fn();

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
                return { findOne: mockAbonnementFindOne, find: mockAbonnementFind };
            }
            if (name.includes('AbonnementModule') || name === 'AbonnementModule') {
                return { find: mockAbonnementModuleFind };
            }
            if (name.includes('ModulesGroupe') || name === 'ModulesGroupe') {
                return { find: mockModulesGroupeFind };
            }
            if (name.includes('GroupeEtablissementLien') || name.includes('groupe_etablissement')) {
                return { findOne: mockGroupeLienFindOne };
            }
            if (name.includes('StrategieExpiration')) {
                return { find: mockStrategieFind };
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
            categorie: 'PAYANT',
            estCritique: false,
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
                entitlements: { modules: ['eleves', 'notes'] },
            },
            ...overrides,
        };
    }

    // =============================================
    // CRITIQUE — Bypass total
    // =============================================
    describe('Module CRITIQUE — Bypass total', () => {
        it('devrait toujours retourner accessible=true pour les modules critiques (code)', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'auth', estCritique: true, categorie: 'GRATUIT' }),
            );

            const result = await service.check('etab-1', 'auth');

            expect(result.accessible).toBe(true);
            expect(result.raison).toBe('CRITIQUE');
            expect(result.source).toBe('critique');
        });

        it('devrait bypasser pour utilisateurs, configuration, notifications', async () => {
            for (const code of ['utilisateurs', 'configuration', 'notifications']) {
                mockCatalogueFindOne.mockResolvedValue(
                    mockCatalogueModule({ code, estCritique: true, categorie: 'GRATUIT' }),
                );
                const result = await service.check('etab-1', code);
                expect(result.accessible).toBe(true);
                expect(result.source).toBe('critique');
            }
        });

        it('devrait bypasser même sans abonnement pour les modules critiques (estCritique)', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'monitoring', categorie: 'GRATUIT', estCritique: true }),
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
        it('devrait retourner accessible=true si module dans plan.entitlements.modules', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule({ code: 'eleves' }));
            mockAbonnementFind.mockResolvedValue([mockAbonnement()]);

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
    describe('Pas d\'abonnement — v3 : aucun accès sans plan', () => {
        it('devrait retourner AUCUN_PLAN même si actifParDefaut (faille fermée v3)', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'cms', actifParDefaut: true }),
            );
            mockAbonnementFind.mockResolvedValue([]);

            const result = await service.check('etab-1', 'cms');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('AUCUN_PLAN');
            expect(result.source).toBe('catalogue');
        });

        it('devrait retourner AUCUN_PLAN si pas d\'abonnement', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'cantine', actifParDefaut: false }),
            );
            mockAbonnementFind.mockResolvedValue([]);

            const result = await service.check('etab-1', 'cantine');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('AUCUN_PLAN');
        });
    });

    // =============================================
    // Abonnement EXPIRE / SUSPENDU
    // =============================================
    describe('Abonnement EXPIRE — dégradation (v3)', () => {
        it('devrait retourner DEGRADATION_ARCHIVE si EXPIRE sans dateExpirationReelle', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule());
            mockAbonnementFind.mockResolvedValue([
                mockAbonnement({ statut: 'EXPIRE' }),
            ]);
            mockStrategieFind.mockResolvedValue([]);

            const result = await service.check('etab-1', 'test-module');

            expect(result.accessible).toBe(false);
            expect(result.raison).toBe('DEGRADATION_ARCHIVE');
        });

        it('devrait retourner ABONNEMENT_SUSPENDU', async () => {
            mockCatalogueFindOne.mockResolvedValue(mockCatalogueModule());
            mockAbonnementFind.mockResolvedValue([
                mockAbonnement({ statut: 'SUSPENDU' }),
            ]);

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
            mockAbonnementFind.mockResolvedValue([mockAbonnement()]);
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
            mockAbonnementFind.mockResolvedValue([mockAbonnement()]);
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
            mockAbonnementFind.mockResolvedValue([mockAbonnement()]);
            mockGroupeLienFindOne.mockResolvedValue(null);
            mockAbonnementModuleFind.mockResolvedValue([
                { module: { code: 'clubs' }, actif: true },
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
            mockAbonnementFind.mockResolvedValue([
                mockAbonnement({ plan: { slug: 'starter', nom: 'Starter', entitlements: { modules: [] } } }),
            ]);
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
        it('devrait retourner true pour module critique', async () => {
            mockCatalogueFindOne.mockResolvedValue(
                mockCatalogueModule({ code: 'auth', estCritique: true, categorie: 'GRATUIT' }),
            );
            const result = await service.isAccessible('etab-1', 'auth');
            expect(result).toBe(true);
        });
    });

    // =============================================
    // getStatutAbonnement
    // =============================================
    describe('getStatutAbonnement', () => {
        it('devrait retourner AUCUN si pas d\'abonnement', async () => {
            mockAbonnementFind.mockResolvedValue([]);

            const result = await service.getStatutAbonnement('etab-1');

            expect(result.actif).toBe(false);
            expect(result.statut).toBe('AUCUN');
        });

        it('devrait retourner les infos si abonnement actif', async () => {
            mockAbonnementFind.mockResolvedValue([
                mockAbonnement({ statut: 'ACTIF' }),
            ]);

            const result = await service.getStatutAbonnement('etab-1');

            expect(result.actif).toBe(true);
            expect(result.statut).toBe('ACTIF');
            expect(result.planSlug).toBe('starter');
        });
    });
});
