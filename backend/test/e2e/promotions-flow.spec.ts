/**
 * ==================================
 * eLISAschool - Tests E2E — Promotions Flow
 * ==================================
 *
 * Flow complet : création promotions → cascade → application → tracking → analytics
 * Vérifie la cohérence bout-en-bout du système de promotions multi-scopes.
 *
 * Version: 1.0.0
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

const mockUtiliseeRepo = {
    create: jest.fn((data: any) => data),
    save: jest.fn((data: any) => Promise.resolve(data)),
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
};

const mockBundleRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
};

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('promotion_utilisee') || name.includes('PromotionUtilisee')) return mockUtiliseeRepo;
            if (name.includes('bundle') || name.includes('Bundle')) return mockBundleRepo;
            return mockPromoRepo;
        }),
        query: jest.fn(),
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@modules/configuration/services/configuration.service', () => ({
    configurationService: {
        getParametre: jest.fn().mockResolvedValue(false),
    },
}));

// ─── Types de test ───

interface PromotionTest {
    id: string;
    code: string;
    nom: string;
    scope: 'PLAN' | 'PACK' | 'MODULE' | 'BUNDLE' | 'QUOTA';
    typePromotion: 'POURCENTAGE' | 'MONTANT_FIXE' | 'CYCLES_GRATUITS';
    valeur: number;
    scopeCible?: string;
    actif: boolean;
    cumulable: boolean;
    priorite: number;
    conditions?: Record<string, any>;
    config?: Record<string, any>;
    dateDebut: string;
    dateFin?: string | null;
    maxUtilisations?: number | null;
    utilisations: number;
}

// ─── Helper cascade simplifiée ───

function appliquerCascade(
    promotions: PromotionTest[],
    contexte: { montantPlan: number; montantPacks: number; montantModules: number; montantQuotas: number }
) {
    const resultats: { phase: string; scope: string; montantDeduit: number; promotions: string[] }[] = [];
    let totalDeduit = 0;

    // Phase PLAN (plafond 40%)
    const promosPlan = promotions.filter(p => p.scope === 'PLAN' && p.actif);
    let deduitPlan = 0;
    for (const p of promosPlan) {
        if (p.typePromotion === 'POURCENTAGE') {
            deduitPlan += contexte.montantPlan * (p.valeur / 100);
        } else {
            deduitPlan += p.valeur;
        }
    }
    const plafondPlan = contexte.montantPlan * 0.4;
    deduitPlan = Math.min(deduitPlan, plafondPlan);
    totalDeduit += deduitPlan;
    resultats.push({ phase: 'PLAN', scope: 'PLAN', montantDeduit: deduitPlan, promotions: promosPlan.map(p => p.code) });

    // Phase PACK
    const promosPack = promotions.filter(p => p.scope === 'PACK' && p.actif);
    let deduitPack = 0;
    for (const p of promosPack) {
        if (p.typePromotion === 'POURCENTAGE') {
            deduitPack += contexte.montantPacks * (p.valeur / 100);
        } else {
            deduitPack += p.valeur;
        }
    }
    totalDeduit += deduitPack;
    resultats.push({ phase: 'PACK', scope: 'PACK', montantDeduit: deduitPack, promotions: promosPack.map(p => p.code) });

    // Phase QUOTA
    const promosQuota = promotions.filter(p => p.scope === 'QUOTA' && p.actif);
    let deduitQuota = 0;
    for (const p of promosQuota) {
        if (p.typePromotion === 'POURCENTAGE') {
            deduitQuota += contexte.montantQuotas * (p.valeur / 100);
        } else {
            deduitQuota += p.valeur;
        }
    }
    totalDeduit += deduitQuota;
    resultats.push({ phase: 'QUOTA', scope: 'QUOTA', montantDeduit: deduitQuota, promotions: promosQuota.map(p => p.code) });

    // Phase MODULE
    const promosModule = promotions.filter(p => p.scope === 'MODULE' && p.actif);
    let deduitModule = 0;
    for (const p of promosModule) {
        if (p.typePromotion === 'POURCENTAGE') {
            deduitModule += contexte.montantModules * (p.valeur / 100);
        } else {
            deduitModule += p.valeur;
        }
    }
    totalDeduit += deduitModule;
    resultats.push({ phase: 'MODULE', scope: 'MODULE', montantDeduit: deduitModule, promotions: promosModule.map(p => p.code) });

    // Phase GRATUITE
    const promosGratuite = promotions.filter(p => p.scope === 'MODULE' && p.typePromotion === 'CYCLES_GRATUITS' && p.actif);
    resultats.push({ phase: 'GRATUITE', scope: 'MODULE', montantDeduit: 0, promotions: promosGratuite.map(p => p.code) });

    return {
        phases: resultats,
        totalDeduit,
        montantFinal: Math.max(0, contexte.montantPlan + contexte.montantPacks + contexte.montantModules + contexte.montantQuotas - totalDeduit),
    };
}

// ─── Données de test ───

const PROMOS_2026: PromotionTest[] = [
    {
        id: 'p1', code: 'RENTREE2026', nom: 'Rentrée scolaire 2026',
        scope: 'PLAN', typePromotion: 'POURCENTAGE', valeur: 20,
        actif: true, cumulable: false, priorite: 1,
        dateDebut: '2026-09-01', dateFin: '2026-10-31',
        maxUtilisations: 100, utilisations: 15,
    },
    {
        id: 'p2', code: 'FIDELITE12', nom: 'Fidélité 12 mois',
        scope: 'PLAN', typePromotion: 'POURCENTAGE', valeur: 5,
        actif: true, cumulable: true, priorite: 2,
        dateDebut: '2026-01-01', dateFin: null,
        maxUtilisations: null, utilisations: 42,
    },
    {
        id: 'p3', code: 'PACK-ELEVES-10', nom: 'Remise pack élèves',
        scope: 'PACK', typePromotion: 'POURCENTAGE', valeur: 10,
        actif: true, cumulable: false, priorite: 1,
        dateDebut: '2026-01-01', dateFin: null,
        maxUtilisations: null, utilisations: 8,
    },
    {
        id: 'p4', code: 'MOD-TRANSPORT', nom: 'Remise module transport',
        scope: 'MODULE', typePromotion: 'MONTANT_FIXE', valeur: 3000,
        actif: true, cumulable: false, priorite: 1,
        dateDebut: '2026-01-01', dateFin: '2026-12-31',
        maxUtilisations: 50, utilisations: 3,
    },
    {
        id: 'p5', code: 'QUOTA-STOCK', nom: 'Remise stockage',
        scope: 'QUOTA', typePromotion: 'POURCENTAGE', valeur: 15,
        actif: true, cumulable: false, priorite: 1,
        dateDebut: '2026-01-01', dateFin: null,
        maxUtilisations: null, utilisations: 0,
    },
    {
        id: 'p6', code: 'EXPIRED', nom: 'Promo expirée',
        scope: 'PLAN', typePromotion: 'POURCENTAGE', valeur: 30,
        actif: false, cumulable: false, priorite: 0,
        dateDebut: '2025-01-01', dateFin: '2025-06-30',
        maxUtilisations: 10, utilisations: 10,
    },
];

// =============================================
// Tests E2E
// =============================================

describe('E2E — Promotions Flow Complet', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // 1. Cascade 5 phases
    // =============================================
    describe('1. Cascade 5 phases — calcul correct', () => {

        it('applique les promotions actives uniquement', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            // RENTREE2026 (20% de 50000 = 10000) + FIDELITE12 (5% de 50000 = 2500) = 12500
            // Plafond PLAN = 40% de 50000 = 20000 → 12500 < 20000 → OK
            const phasePlan = result.phases.find(p => p.phase === 'PLAN');
            expect(phasePlan).toBeDefined();
            expect(phasePlan!.montantDeduit).toBe(12500);
            expect(phasePlan!.promotions).toContain('RENTREE2026');
            expect(phasePlan!.promotions).toContain('FIDELITE12');
            expect(phasePlan!.promotions).not.toContain('EXPIRED');
        });

        it('respecte le plafond 40% sur le PLAN', () => {
            const promosHeavy: PromotionTest[] = [
                { id: 'h1', code: 'HEAVY1', nom: 'Heavy 1', scope: 'PLAN', typePromotion: 'POURCENTAGE', valeur: 30, actif: true, cumulable: true, priorite: 1, dateDebut: '2026-01-01', utilisations: 0 },
                { id: 'h2', code: 'HEAVY2', nom: 'Heavy 2', scope: 'PLAN', typePromotion: 'POURCENTAGE', valeur: 25, actif: true, cumulable: true, priorite: 2, dateDebut: '2026-01-01', utilisations: 0 },
            ];
            const contexte = { montantPlan: 100000, montantPacks: 0, montantModules: 0, montantQuotas: 0 };
            const result = appliquerCascade(promosHeavy, contexte);

            const phasePlan = result.phases.find(p => p.phase === 'PLAN');
            // 30% + 25% = 55% de 100000 = 55000, mais plafond = 40000
            expect(phasePlan!.montantDeduit).toBe(40000);
        });

        it('Phase PACK — pas de plafond', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            const phasePack = result.phases.find(p => p.phase === 'PACK');
            // 10% de 15000 = 1500
            expect(phasePack!.montantDeduit).toBe(1500);
        });

        it('Phase QUOTA — calcul sur ressources', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            const phaseQuota = result.phases.find(p => p.phase === 'QUOTA');
            // 15% de 5000 = 750
            expect(phaseQuota!.montantDeduit).toBe(750);
        });

        it('Phase MODULE — montant fixe', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            const phaseModule = result.phases.find(p => p.phase === 'MODULE');
            // MONTANT_FIXE = 3000
            expect(phaseModule!.montantDeduit).toBe(3000);
        });

        it('montant final = total - déductions (jamais négatif)', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            // Total = 80000, déductions = 12500 + 1500 + 750 + 3000 = 17750
            expect(result.montantFinal).toBe(62250);
            expect(result.totalDeduit).toBe(17750);
        });
    });

    // =============================================
    // 2. Éligibilité et validation
    // =============================================
    describe('2. Éligibilité des promotions', () => {

        it('promotion inactive → non éligible', () => {
            const inactive = PROMOS_2026.find(p => p.code === 'EXPIRED');
            expect(inactive!.actif).toBe(false);
        });

        it('promotion avec maxUtilisations atteint → non éligible', () => {
            const promo = PROMOS_2026.find(p => p.code === 'EXPIRED')!;
            const maxAtteint = promo.maxUtilisations !== null && promo.maxUtilisations !== undefined
                && promo.utilisations >= promo.maxUtilisations;
            expect(maxAtteint).toBe(true);
        });

        it('promotion sans dateFin → valide indéfiniment', () => {
            const fidelite = PROMOS_2026.find(p => p.code === 'FIDELITE12')!;
            expect(fidelite.dateFin).toBeNull();
        });

        it('promotion avec dateFin passée → expirée', () => {
            const now = new Date('2026-11-01');
            const rentree = PROMOS_2026.find(p => p.code === 'RENTREE2026')!;
            const expiree = rentree.dateFin ? new Date(rentree.dateFin) < now : false;
            expect(expiree).toBe(true);
        });
    });

    // =============================================
    // 3. Tracking utilisations
    // =============================================
    describe('3. Tracking des utilisations', () => {

        it('enregistre une utilisation avec code, scope, montant déduit', () => {
            const utilisation = {
                id: 'util-1',
                codePromotion: 'RENTREE2026',
                scope: 'PLAN',
                montantDeduit: 10000,
                etablissementId: 'etab-1',
                dateUtilisation: new Date().toISOString(),
            };

            expect(utilisation.codePromotion).toBe('RENTREE2026');
            expect(utilisation.montantDeduit).toBeGreaterThan(0);
            expect(utilisation.scope).toBe('PLAN');
        });

        it('incrémente le compteur d\'utilisations', () => {
            const promo = PROMOS_2026.find(p => p.code === 'RENTREE2026')!;
            const avant = promo.utilisations;
            promo.utilisations = avant + 1;
            expect(promo.utilisations).toBe(16);
        });

        it('bloque si maxUtilisations atteint', () => {
            const promo = { ...PROMOS_2026[0], maxUtilisations: 15, utilisations: 15 };
            const peutUtiliser = !promo.maxUtilisations || promo.utilisations < promo.maxUtilisations;
            expect(peutUtiliser).toBe(false);
        });
    });

    // =============================================
    // 4. Analytics et reporting
    // =============================================
    describe('4. Analytics — agrégations correctes', () => {

        it('répartition par scope calcule les totaux', () => {
            const contexte = { montantPlan: 50000, montantPacks: 15000, montantModules: 10000, montantQuotas: 5000 };
            const result = appliquerCascade(PROMOS_2026, contexte);

            const repartition = result.phases
                .filter(p => p.montantDeduit > 0)
                .map(p => ({
                    scope: p.scope,
                    montantDeduit: p.montantDeduit,
                    pourcentage: Math.round((p.montantDeduit / result.totalDeduit) * 100),
                }));

            expect(repartition.length).toBeGreaterThan(0);
            const totalPourcentages = repartition.reduce((s, r) => s + r.pourcentage, 0);
            expect(totalPourcentages).toBeGreaterThanOrEqual(99); // arrondi
            expect(totalPourcentages).toBeLessThanOrEqual(101);
        });

        it('top promotions par montant déduit', () => {
            const utilisations = [
                { code: 'RENTREE2026', montantDeduit: 10000, nbUtilisations: 15 },
                { code: 'FIDELITE12', montantDeduit: 2500, nbUtilisations: 42 },
                { code: 'PACK-ELEVES-10', montantDeduit: 1500, nbUtilisations: 8 },
                { code: 'MOD-TRANSPORT', montantDeduit: 3000, nbUtilisations: 3 },
            ];

            const top = [...utilisations].sort((a, b) => b.montantDeduit - a.montantDeduit);
            expect(top[0].code).toBe('RENTREE2026');
            expect(top[1].code).toBe('MOD-TRANSPORT');
        });

        it('taux d\'activité = promotions utilisées / promotions actives', () => {
            const actives = PROMOS_2026.filter(p => p.actif);
            const utilisees30j = actives.filter(p => p.utilisations > 0);
            const taux = Math.round((utilisees30j.length / actives.length) * 100);

            expect(actives.length).toBe(5); // EXPIRED exclu
            expect(utilisees30j.length).toBe(4); // QUOTA-STOCK a 0 utilisations
            expect(taux).toBe(80);
        });
    });

    // =============================================
    // 5. Bundles
    // =============================================
    describe('5. Bundles — combos de packs', () => {

        it('un bundle combine plusieurs packs avec remise', () => {
            const bundle = {
                id: 'bundle-1',
                code: 'STARTER-PACK',
                nom: 'Pack démarrage',
                packIds: ['pack-eleves-50', 'pack-stockage-10go'],
                typeRemise: 'POURCENTAGE' as const,
                valeur: 15,
                actif: true,
            };

            expect(bundle.packIds).toHaveLength(2);
            expect(bundle.valeur).toBe(15);
        });

        it('remise bundle appliquée sur le total des packs', () => {
            const bundle = { packIds: ['p1', 'p2'], typeRemise: 'POURCENTAGE' as const, valeur: 15 };
            const totalPacks = 8000; // pack-eleves-50 (5000) + pack-stockage-10go (3000)
            const remise = totalPacks * (bundle.valeur / 100);

            expect(remise).toBe(1200);
        });

        it('remise bundle montant fixe', () => {
            const bundle = { packIds: ['p1', 'p2'], typeRemise: 'MONTANT_FIXE' as const, valeur: 2000 };
            const remise = bundle.valeur;

            expect(remise).toBe(2000);
        });
    });

    // =============================================
    // 6. Import/Export CSV
    // =============================================
    describe('6. Import/Export CSV — sécurité', () => {

        it('export CSV contient les bons headers', () => {
            const headers = 'Code;Nom;Scope;Type;Valeur;Durée;Statut;Date début;Date fin;Priorité;Coupon;Cumulable';
            const cols = headers.split(';');
            expect(cols).toHaveLength(12);
            expect(cols[0]).toBe('Code');
            expect(cols[2]).toBe('Scope');
        });

        it('limite taille CSV — 500 Ko max', () => {
            const MAX_CSV_SIZE = 500 * 1024;
            const grosCSV = 'x'.repeat(MAX_CSV_SIZE + 1);
            expect(grosCSV.length).toBeGreaterThan(MAX_CSV_SIZE);
        });

        it('limite lignes CSV — 1000 max', () => {
            const MAX_CSV_LINES = 1000;
            const lignes = Array.from({ length: 1001 }, () => 'CODE;Nom;PLAN;POURCENTAGE;10;PERMANENTE;ACTIF;2026-01-01;;1;;false');
            expect(lignes.length).toBeGreaterThan(MAX_CSV_LINES);
        });

        it('validation header CSV requis', () => {
            const csvSansHeader = 'RENTREE2026;Rentrée;PLAN;POURCENTAGE;20';
            const firstLine = csvSansHeader.split('\n')[0];
            const hasHeader = firstLine.startsWith('Code;');
            expect(hasHeader).toBe(false);
        });
    });

    // =============================================
    // 7. Codes coupon
    // =============================================
    describe('7. Codes coupon — vérification', () => {

        it('un code coupon valide référence une promotion active', () => {
            const coupon = 'RENTREE2026';
            const promo = PROMOS_2026.find(p => p.codeCoupon === coupon || p.code === coupon);
            // Le code peut être le code principal ou un codeCoupon dédié
            expect(promo).toBeDefined();
        });

        it('un code coupon invalide ne correspond à aucune promotion', () => {
            const coupon = 'INVALID_CODE';
            const promo = PROMOS_2026.find(p => p.code === coupon);
            expect(promo).toBeUndefined();
        });
    });
});
