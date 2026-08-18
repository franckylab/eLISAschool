/**
 * ==================================
 * eLISAschool - Tests unitaires PromotionService
 * ==================================
 *
 * Teste le moteur de promotions en cascade 5 phases :
 *   Phase 1 — PLAN   : remise sur base + élèves sup. (plafond 40%)
 *   Phase 2 — PACK   : remise sur packs quota (pas de plafond)
 *   Phase 2.5 — QUOTA : remise sur ressource quota (paliers volume)
 *   Phase 3 — MODULE : remise sur modules sup. (pas de plafond)
 *   Phase 4 — GRATUITE : modules offerts N mois (0 F)
 *
 * Couvre aussi : validation éligibilité, paliers volume, auto-promotions,
 * duplication, bundles.
 *
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockPromoRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn((data: any) => Promise.resolve(data)),
    remove: jest.fn(),
    count: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
        getRawOne: jest.fn().mockResolvedValue({}),
        getMany: jest.fn().mockResolvedValue([]),
    })),
};

const mockBundleRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((data: any) => data),
    save: jest.fn((data: any) => Promise.resolve(data)),
    remove: jest.fn(),
    increment: jest.fn(),
};

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.entityName || String(entity);
            if (name.includes('PromotionUtilisee') || name.includes('promotion_utilisee')) {
                return {
                    find: jest.fn().mockResolvedValue([]),
                    findAndCount: jest.fn().mockResolvedValue([[], 0]),
                    create: jest.fn((data: any) => data),
                    save: jest.fn().mockResolvedValue([]),
                    createQueryBuilder: jest.fn(() => ({
                        select: jest.fn().mockReturnThis(),
                        addSelect: jest.fn().mockReturnThis(),
                        where: jest.fn().mockReturnThis(),
                        andWhere: jest.fn().mockReturnThis(),
                        groupBy: jest.fn().mockReturnThis(),
                        addGroupBy: jest.fn().mockReturnThis(),
                        orderBy: jest.fn().mockReturnThis(),
                        limit: jest.fn().mockReturnThis(),
                        setParameter: jest.fn().mockReturnThis(),
                        getRawMany: jest.fn().mockResolvedValue([]),
                        getRawOne: jest.fn().mockResolvedValue({}),
                    })),
                };
            }
            if (name.includes('Bundle')) return mockBundleRepo;
            return mockPromoRepo;
        }),
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Import après mocks
import {
    PromotionService,
    ContextePromotion,
} from '../../src/modules/billing/services/promotion.service';
import {
    TypePromotion,
    ScopePromotion,
    DureeApplicationPromotion,
    TypeAutoPromotion,
    Promotion,
} from '../../src/modules/billing/entities/promotion.entity';

// ─── Helpers ───

function creerPromotion(overrides: Partial<Promotion> = {}): Promotion {
    return {
        id: 'promo-1',
        code: 'TEST-30',
        nom: 'Test 30%',
        typePromotion: TypePromotion.POURCENTAGE,
        scope: ScopePromotion.PLAN,
        valeur: 30,
        dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE,
        cumulable: false,
        priorite: 0,
        actif: true,
        utilisations: 0,
        dateDebut: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    } as Promotion;
}

// ─── Import des enums depuis l'entité (pas le service) ───
// Les enums sont réexportés par le service depuis l'entité

describe('PromotionService', () => {
    let service: PromotionService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new PromotionService();
    });

    // =============================================
    // VALIDATION ÉLIGIBILITÉ
    // =============================================

    describe('estValide()', () => {
        it('refuse une promotion inactive', () => {
            const promo = creerPromotion({ actif: false });
            expect(service.estValide(promo, {})).toBe(false);
        });

        it('accepte une promotion active sans conditions', () => {
            const promo = creerPromotion({
                actif: true,
                dateDebut: new Date('2025-01-01'),
                dateFin: undefined,
            });
            expect(service.estValide(promo, {})).toBe(true);
        });

        it('refuse si dateDebut dans le futur', () => {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 1);
            const promo = creerPromotion({ dateDebut: future });
            expect(service.estValide(promo, {})).toBe(false);
        });

        it('refuse si dateFin dans le passé', () => {
            const promo = creerPromotion({ dateFin: new Date('2020-01-01') });
            expect(service.estValide(promo, {})).toBe(false);
        });

        it('refuse si maxUtilisations atteint', () => {
            const promo = creerPromotion({ maxUtilisations: 5, utilisations: 5 });
            expect(service.estValide(promo, {})).toBe(false);
        });

        it('accepte si maxUtilisations non atteint', () => {
            const promo = creerPromotion({ maxUtilisations: 5, utilisations: 3 });
            expect(service.estValide(promo, {})).toBe(true);
        });

        it('vérifie le nombre minimum d\'élèves', () => {
            const promo = creerPromotion({ conditions: { nombreElevesMin: 100 } });
            expect(service.estValide(promo, { nombreEleves: 50 })).toBe(false);
            expect(service.estValide(promo, { nombreEleves: 150 })).toBe(true);
        });

        it('vérifie l\'ancienneté minimum en mois', () => {
            const promo = creerPromotion({ conditions: { ancienneteMois: 12 } });
            const dateRecente = new Date();
            dateRecente.setMonth(dateRecente.getMonth() - 6); // 6 mois
            const dateAncienne = new Date();
            dateAncienne.setMonth(dateAncienne.getMonth() - 18); // 18 mois

            expect(service.estValide(promo, { dateDebutAbonnement: dateRecente })).toBe(false);
            expect(service.estValide(promo, { dateDebutAbonnement: dateAncienne })).toBe(true);
        });

        it('vérifie les plans requis', () => {
            const promo = creerPromotion({ conditions: { plansRequis: ['plan-1'] } });
            expect(service.estValide(promo, { planId: 'plan-2' })).toBe(false);
            expect(service.estValide(promo, { planId: 'plan-1' })).toBe(true);
        });

        it('vérifie les packs requis (cross-sell)', () => {
            const promo = creerPromotion({
                scope: ScopePromotion.PACK,
                conditions: { packsRequis: ['pack-1', 'pack-2'] },
            });
            expect(service.estValide(promo, { packsSouscritsIds: ['pack-1'] })).toBe(false);
            expect(service.estValide(promo, { packsSouscritsIds: ['pack-1', 'pack-2'] })).toBe(true);
        });

        it('vérifie la cibleId pour scope PLAN', () => {
            const promo = creerPromotion({ scope: ScopePromotion.PLAN, cibleId: 'plan-specific' });
            expect(service.estValide(promo, { planId: 'plan-other' })).toBe(false);
            expect(service.estValide(promo, { planId: 'plan-specific' })).toBe(true);
        });

        it('vérifie la cibleRessource pour scope PACK', () => {
            const promo = creerPromotion({
                scope: ScopePromotion.PACK,
                cibleRessource: 'stockageGo',
            });
            const ctx = {
                packsSouscritsIds: ['pack-1'],
                packRessources: { 'pack-1': 'eleves' },
            };
            expect(service.estValide(promo, ctx)).toBe(false);

            const ctxMatch = {
                packsSouscritsIds: ['pack-1'],
                packRessources: { 'pack-1': 'stockageGo' },
            };
            expect(service.estValide(promo, ctxMatch)).toBe(true);
        });

        it('gère la durée PREMIERE_FACTURE (cycle > 0 → refus)', () => {
            const promo = creerPromotion({ dureeApplication: DureeApplicationPromotion.PREMIERE_FACTURE });
            expect(service.estValide(promo, { numeroCycle: 1 })).toBe(false);
            expect(service.estValide(promo, { numeroCycle: 0 })).toBe(true);
        });

        it('gère la durée N_CYCLES', () => {
            const promo = creerPromotion({
                dureeApplication: DureeApplicationPromotion.N_CYCLES,
                conditions: { nbCycles: 3 },
            });
            expect(service.estValide(promo, { numeroCycle: 2 })).toBe(true);
            expect(service.estValide(promo, { numeroCycle: 3 })).toBe(false);
        });

        it('refuse les promotions programmées non encore activées', () => {
            const future = new Date();
            future.setFullYear(future.getFullYear() + 1);
            const promo = creerPromotion({ estProgrammee: true, dateProgrammation: future });
            expect(service.estValide(promo, {})).toBe(false);
        });
    });

    // =============================================
    // AUTO-PROMOTIONS
    // =============================================

    describe('estValide() — auto-promotions', () => {
        it('NOUVEAU_CLIENT : nécessite estPremierAbonnement=true', () => {
            const promo = creerPromotion({
                config: { typeAutomatique: TypeAutoPromotion.NOUVEAU_CLIENT },
            });
            expect(service.estValide(promo, { estPremierAbonnement: false })).toBe(false);
            expect(service.estValide(promo, { estPremierAbonnement: true })).toBe(true);
        });

        it('FIDELITE : nécessite ancienneté minimum', () => {
            const promo = creerPromotion({
                config: {
                    typeAutomatique: TypeAutoPromotion.FIDELITE,
                    declencheur: { moisAnciennete: 6 },
                },
            });
            const dateRecente = new Date();
            dateRecente.setMonth(dateRecente.getMonth() - 3);
            const dateAncienne = new Date();
            dateAncienne.setMonth(dateAncienne.getMonth() - 12);

            expect(service.estValide(promo, { dateDebutAbonnement: dateRecente })).toBe(false);
            expect(service.estValide(promo, { dateDebutAbonnement: dateAncienne })).toBe(true);
        });

        it('UPGRADE : nécessite un plan précédent différent', () => {
            const promo = creerPromotion({
                config: { typeAutomatique: TypeAutoPromotion.UPGRADE },
            });
            expect(service.estValide(promo, { planId: 'plan-1' })).toBe(false);
            expect(service.estValide(promo, { planId: 'plan-2', planPrecedentId: 'plan-1' })).toBe(true);
        });

        it('CROSS_SELL : nécessite au moins 1 pack ou module souscrit', () => {
            const promo = creerPromotion({
                config: { typeAutomatique: TypeAutoPromotion.CROSS_SELL },
            });
            expect(service.estValide(promo, {})).toBe(false);
            expect(service.estValide(promo, { packsSouscritsIds: ['pack-1'] })).toBe(true);
            expect(service.estValide(promo, { modulesSouscritsIds: ['mod-1'] })).toBe(true);
        });

        it('FREE_TRIAL : vérifie la durée d\'essai', () => {
            const promo = creerPromotion({
                config: {
                    typeAutomatique: TypeAutoPromotion.FREE_TRIAL,
                    declencheur: { dureeMois: 3 },
                },
            });
            const dateRecente = new Date();
            dateRecente.setMonth(dateRecente.getMonth() - 1); // 1 mois < 3
            const dateAncienne = new Date();
            dateAncienne.setMonth(dateAncienne.getMonth() - 6); // 6 mois > 3

            expect(service.estValide(promo, { dateDebutAbonnement: dateRecente })).toBe(true);
            expect(service.estValide(promo, { dateDebutAbonnement: dateAncienne })).toBe(false);
        });
    });

    // =============================================
    // CASCADE 5 PHASES
    // =============================================

    describe('appliquerCascade()', () => {
        beforeEach(() => {
            mockPromoRepo.find.mockResolvedValue([]);
            mockBundleRepo.find.mockResolvedValue([]);
        });

        it('Phase 1 PLAN : applique le plafond 40%', async () => {
            const promo50 = creerPromotion({
                scope: ScopePromotion.PLAN,
                typePromotion: TypePromotion.POURCENTAGE,
                valeur: 50, // 50% > plafond 40%
                cumulable: false,
            });
            mockPromoRepo.find.mockResolvedValue([promo50]);

            const resultat = await service.appliquerCascade(10000, 0, 0, {});

            // 50% de 10000 = 5000, mais plafond 40% = 4000
            expect(resultat.plan.montantApres).toBe(6000);
            expect(resultat.plan.promotions).toHaveLength(1);
            expect(resultat.plan.promotions[0].montantDeduit).toBe(4000);
        });

        it('Phase 1 PLAN : cumul de promotions dans le plafond', async () => {
            const promo20 = creerPromotion({
                id: 'p1', code: 'P20', scope: ScopePromotion.PLAN,
                typePromotion: TypePromotion.POURCENTAGE, valeur: 20, cumulable: true,
            });
            const promo25 = creerPromotion({
                id: 'p2', code: 'P25', scope: ScopePromotion.PLAN,
                typePromotion: TypePromotion.POURCENTAGE, valeur: 25, cumulable: true, priorite: 1,
            });
            mockPromoRepo.find.mockResolvedValue([promo20, promo25]);

            const resultat = await service.appliquerCascade(10000, 0, 0, {});

            // 25% = 2500 (priorité haute), puis 20% = 2000 → total 4500 > plafond 4000
            // Donc écrêté à 4000
            expect(resultat.plan.montantApres).toBe(6000);
            expect(resultat.plan.montantApres + resultat.plan.promotions.reduce((s, p) => s + p.montantDeduit, 0)).toBe(10000);
        });

        it('Phase 2 PACK : pas de plafond', async () => {
            const promoPack = creerPromotion({
                scope: ScopePromotion.PACK,
                typePromotion: TypePromotion.POURCENTAGE,
                valeur: 50,
                cumulable: false,
            });
            mockPromoRepo.find.mockResolvedValue([promoPack]);

            const resultat = await service.appliquerCascade(0, 5000, 0, {});

            // 50% de 5000 = 2500, pas de plafond
            expect(resultat.packs.montantApres).toBe(2500);
        });

        it('Phase 3 MODULE : pas de plafond', async () => {
            const promoModule = creerPromotion({
                scope: ScopePromotion.MODULE,
                typePromotion: TypePromotion.MONTANT_FIXE,
                valeur: 2000,
                cumulable: false,
            });
            mockPromoRepo.find.mockResolvedValue([promoModule]);

            const resultat = await service.appliquerCascade(0, 0, 5000, {});

            // Montant fixe 2000 sur 5000
            expect(resultat.modules.montantApres).toBe(3000);
        });

        it('Phase 4 GRATUITE : modules à 0 F', async () => {
            const gratuite = creerPromotion({
                scope: ScopePromotion.MODULE,
                typePromotion: TypePromotion.GRATUITE,
                valeur: 100,
                conditions: { dureeGratuiteMois: 3 },
                dureeApplication: DureeApplicationPromotion.N_MOIS_GRATUIT,
            });
            mockPromoRepo.find.mockResolvedValue([gratuite]);

            const dateDebut = new Date();
            dateDebut.setMonth(dateDebut.getMonth() - 1); // 1 mois d'ancienneté < 3

            const resultat = await service.appliquerCascade(0, 0, 5000, { dateDebutAbonnement: dateDebut });

            expect(resultat.gratuités).toHaveLength(1);
            expect(resultat.gratuités[0].moisGratuite).toBe(3);
            expect(resultat.gratuités[0].montantDeduit).toBe(0); // Gratuité = 0 F, pas une déduction
        });

        it('GRATUITE expirée : plus de N mois → ignorée', async () => {
            const gratuite = creerPromotion({
                scope: ScopePromotion.MODULE,
                typePromotion: TypePromotion.GRATUITE,
                conditions: { dureeGratuiteMois: 3 },
                dureeApplication: DureeApplicationPromotion.N_MOIS_GRATUIT,
            });
            mockPromoRepo.find.mockResolvedValue([gratuite]);

            const dateDebut = new Date();
            dateDebut.setMonth(dateDebut.getMonth() - 6); // 6 mois > 3

            const resultat = await service.appliquerCascade(0, 0, 5000, { dateDebutAbonnement: dateDebut });

            expect(resultat.gratuités).toHaveLength(0);
        });

        it('montantFinal = somme des 4 composantes', async () => {
            mockPromoRepo.find.mockResolvedValue([]);

            const resultat = await service.appliquerCascade(10000, 5000, 3000, {});

            expect(resultat.montantFinal).toBe(18000);
            expect(resultat.montantAvantPromotions).toBe(18000);
        });

        it('codeCoupon : seules les promos matching sont appliquées', async () => {
            const promoAuto = creerPromotion({
                id: 'auto', code: 'AUTO', scope: ScopePromotion.PLAN,
                typePromotion: TypePromotion.POURCENTAGE, valeur: 10,
                codeCoupon: null, // auto
            });
            const promoCoupon = creerPromotion({
                id: 'coupon', code: 'COUPON', scope: ScopePromotion.PLAN,
                typePromotion: TypePromotion.POURCENTAGE, valeur: 20,
                codeCoupon: 'SUPERPROMO', cumulable: true,
            });
            mockPromoRepo.find.mockResolvedValue([promoAuto, promoCoupon]);

            // Sans coupon → seule la promo auto s'applique
            const sansCoupon = await service.appliquerCascade(10000, 0, 0, {});
            expect(sansCoupon.plan.promotions).toHaveLength(1);
            expect(sansCoupon.plan.promotions[0].code).toBe('AUTO');

            // Avec coupon → les deux s'appliquent
            const avecCoupon = await service.appliquerCascade(10000, 0, 0, { codeCoupon: 'SUPERPROMO' });
            expect(avecCoupon.plan.promotions.length).toBeGreaterThanOrEqual(1);
        });
    });

    // =============================================
    // PALIERS DE VOLUME
    // =============================================

    describe('calculerDeduction — paliers volume', () => {
        it('applique le palier correspondant au volume', async () => {
            const promo = creerPromotion({
                scope: ScopePromotion.PACK,
                typePromotion: TypePromotion.POURCENTAGE,
                valeur: 10, // valeur par défaut (non utilisée si paliers)
                config: {
                    paliersVolume: [
                        { min: 0, max: 50, valeur: 5 },     // 0-50 → 5%
                        { min: 51, max: 200, valeur: 10 },   // 51-200 → 10%
                        { min: 201, max: null, valeur: 20 }, // 201+ → 20%
                    ],
                },
            });
            mockPromoRepo.find.mockResolvedValue([promo]);
            mockBundleRepo.find.mockResolvedValue([]);

            // 100 élèves → palier 2 (10%)
            const resultat = await service.appliquerCascade(0, 10000, 0, {
                quantiteRessource: 100,
            });

            // 10% de 10000 = 1000
            expect(resultat.packs.promotions[0].montantDeduit).toBe(1000);
        });

        it('aucun palier atteint → pas de déduction', async () => {
            const promo = creerPromotion({
                scope: ScopePromotion.PACK,
                typePromotion: TypePromotion.POURCENTAGE,
                config: {
                    paliersVolume: [
                        { min: 500, max: null, valeur: 30 }, // 500+ → 30%
                    ],
                },
            });
            mockPromoRepo.find.mockResolvedValue([promo]);
            mockBundleRepo.find.mockResolvedValue([]);

            // 100 élèves → pas dans le palier (min=500)
            const resultat = await service.appliquerCascade(0, 10000, 0, {
                quantiteRessource: 100,
            });

            expect(resultat.packs.promotions).toHaveLength(0);
        });
    });

    // =============================================
    // BUNDLES
    // =============================================

    describe('estBundleValide()', () => {
        it('refuse un bundle inactif', () => {
            const bundle = { actif: false, packIds: ['p1', 'p2'] } as any;
            expect(service.estBundleValide(bundle, {})).toBe(false);
        });

        it('refuse si tous les packs du bundle ne sont pas souscrits', () => {
            const bundle = {
                actif: true, packIds: ['p1', 'p2', 'p3'],
                dateDebut: new Date('2025-01-01'), dateFin: undefined,
                maxUtilisations: null, utilisations: 0,
            } as any;
            expect(service.estBundleValide(bundle, { packsSouscritsIds: ['p1', 'p2'] })).toBe(false);
            expect(service.estBundleValide(bundle, { packsSouscritsIds: ['p1', 'p2', 'p3'] })).toBe(true);
        });

        it('vérifie le code coupon du bundle', () => {
            const bundle = {
                actif: true, packIds: ['p1', 'p2'],
                codeCoupon: 'BUNDLE2025',
                dateDebut: new Date('2025-01-01'), dateFin: undefined,
                maxUtilisations: null, utilisations: 0,
            } as any;
            expect(service.estBundleValide(bundle, { packsSouscritsIds: ['p1', 'p2'] })).toBe(false);
            expect(service.estBundleValide(bundle, { packsSouscritsIds: ['p1', 'p2'], codeCoupon: 'BUNDLE2025' })).toBe(true);
        });

        it('refuse si maxUtilisations atteint', () => {
            const bundle = {
                actif: true, packIds: ['p1', 'p2'],
                maxUtilisations: 10, utilisations: 10,
                dateDebut: new Date('2025-01-01'), dateFin: undefined,
            } as any;
            expect(service.estBundleValide(bundle, { packsSouscritsIds: ['p1', 'p2'] })).toBe(false);
        });
    });

    // =============================================
    // RÉSUMÉ CASCADE
    // =============================================

    describe('appliquerCascade() — structure résultat', () => {
        beforeEach(() => {
            mockPromoRepo.find.mockResolvedValue([]);
            mockBundleRepo.find.mockResolvedValue([]);
        });

        it('retourne la structure complète avec toutes les phases', async () => {
            const resultat = await service.appliquerCascade(10000, 5000, 3000, {});

            expect(resultat).toHaveProperty('montantFinal');
            expect(resultat).toHaveProperty('montantAvantPromotions');
            expect(resultat).toHaveProperty('plan');
            expect(resultat).toHaveProperty('packs');
            expect(resultat).toHaveProperty('quota');
            expect(resultat).toHaveProperty('modules');
            expect(resultat).toHaveProperty('gratuités');
            expect(resultat).toHaveProperty('toutesPromotions');

            expect(resultat.plan).toHaveProperty('montantAvant');
            expect(resultat.plan).toHaveProperty('montantApres');
            expect(resultat.plan).toHaveProperty('promotions');
        });

        it('toutesPromotions est l\'aplati de toutes les phases', async () => {
            const resultat = await service.appliquerCascade(10000, 5000, 3000, {});

            const totalFromPhases = [
                ...resultat.plan.promotions,
                ...resultat.packs.promotions,
                ...resultat.quota.promotions,
                ...resultat.modules.promotions,
                ...resultat.gratuités,
            ];
            expect(resultat.toutesPromotions).toEqual(totalFromPhases);
        });
    });
});
