/**
 * ==================================
 * eLISAschool - Tests unitaires Module Access Middleware v4
 * ==================================
 *
 * Teste le middleware requireModuleAccess (Refonte SaaS migration 200) :
 * - SUPER_ADMIN → accès total (bypass)
 * - Sans etablissementId → laisser passer
 * - Module accessible via entitlementService → next()
 * - Module refusé (ABONNEMENT_INACTIF) → 402 ABONNEMENT_REQUIS
 * - Module refusé (PLAN_INSUFFICIENT) → 403 PLAN_INSUFFICIENT
 * - Module refusé (OVERRIDE_DESACTIVE) → 403 MODULE_OVERRIDE
 * - Module refusé (autre) → 403 MODULE_INACTIVE
 * - moduleInfo enrichi dans req
 *
 * Refonte SaaS — Unification Modules (migration 200)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockCheck = jest.fn();
const mockLogAccessDenied = jest.fn();

jest.mock('@modules/billing/services/entitlement.service', () => ({
    entitlementService: {
        check: mockCheck,
    },
}));

jest.mock('@modules/auth', () => ({
    auditService: {
        logAccessDenied: mockLogAccessDenied,
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

import { requireModuleAccess } from '../../src/common/middlewares/module-access.middleware';

// Helper pour créer une requête mock
function mockReq(overrides: any = {}) {
    return {
        utilisateur: {
            id: 'user-1',
            role: overrides.role || 'ADMIN',
            etablissementId: overrides.etablissementId || 'etab-1',
        },
        etablissementId: overrides.etablissementId || 'etab-1',
        ...overrides,
    };
}

function mockRes() {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe('Middleware requireModuleAccess v4 (entitlementService)', () => {
    let next: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        next = jest.fn();
    });

    // =============================================
    // SUPER_ADMIN — Accès total
    // =============================================
    describe('SUPER_ADMIN — Accès total', () => {
        it('devrait laisser passer SUPER_ADMIN sans vérification', async () => {
            const req = mockReq({ role: 'SUPER_ADMIN' });
            const res = mockRes();
            const middleware = requireModuleAccess('transport');

            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(mockCheck).not.toHaveBeenCalled();
        });
    });

    // =============================================
    // Sans etablissementId
    // =============================================
    describe('Sans etablissementId', () => {
        it('devrait laisser passer si pas d\'établissement', async () => {
            const req = mockReq({ etablissementId: null });
            req.utilisateur.etablissementId = null;
            const res = mockRes();
            const middleware = requireModuleAccess('transport');

            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
            expect(mockCheck).not.toHaveBeenCalled();
        });
    });

    // =============================================
    // Module accessible → next()
    // =============================================
    describe('Module accessible → next()', () => {
        it('devrait laisser passer si entitlement accessible (source: plan)', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: true,
                visible: true,
                raison: 'OK',
                source: 'plan',
                planActuel: 'starter',
            });

            const middleware = requireModuleAccess('eleves');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
            expect((req as any).moduleInfo).toEqual({
                nom: 'eleves',
                source: 'plan',
                raison: 'OK',
                planActuel: 'starter',
            });
        });

        it('devrait laisser passer si module CRITIQUE (bypass)', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: true,
                visible: true,
                raison: 'CRITIQUE',
                source: 'critique',
            });

            const middleware = requireModuleAccess('auth');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });

    // =============================================
    // ABONNEMENT_INACTIF → 402
    // =============================================
    describe('ABONNEMENT_INACTIF → 402 ABONNEMENT_REQUIS', () => {
        it('devrait rejeter avec 402 si abonnement inactif', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_INACTIF',
                message: 'Un abonnement actif est requis',
                source: 'catalogue',
            });

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 402,
                    errorCode: 'ABONNEMENT_REQUIS',
                }),
            );
            expect(mockLogAccessDenied).toHaveBeenCalled();
        });

        it('devrait rejeter avec 402 si abonnement expiré', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: false,
                visible: true,
                raison: 'ABONNEMENT_EXPIRE',
                message: 'Votre abonnement a expiré.',
                source: 'catalogue',
            });

            const middleware = requireModuleAccess('eleves');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 402,
                    errorCode: 'ABONNEMENT_REQUIS',
                }),
            );
        });
    });

    // =============================================
    // PLAN_INSUFFICIENT → 403
    // =============================================
    describe('PLAN_INSUFFICIENT → 403 PLAN_INSUFFICIENT', () => {
        it('devrait rejeter avec 403 si plan insuffisant', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: false,
                visible: true,
                raison: 'PLAN_INSUFFICIENT',
                message: 'Plan "pro" requis. Plan actuel : "starter"',
                source: 'catalogue',
                planMinimalRequis: 'pro',
                planActuel: 'starter',
            });

            const middleware = requireModuleAccess('orientation');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    errorCode: 'PLAN_INSUFFICIENT',
                }),
            );
        });
    });

    // =============================================
    // OVERRIDE_DESACTIVE → 403 MODULE_OVERRIDE
    // =============================================
    describe('OVERRIDE_DESACTIVE → 403 MODULE_OVERRIDE', () => {
        it('devrait rejeter avec 403 si module désactivé au niveau groupe', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: false,
                visible: true,
                raison: 'OVERRIDE_DESACTIVE',
                message: 'Module désactivé au niveau du groupe',
                source: 'groupe',
            });

            const middleware = requireModuleAccess('messagerie');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    errorCode: 'MODULE_OVERRIDE',
                }),
            );
        });
    });

    // =============================================
    // Autres raisons → 403 MODULE_INACTIVE
    // =============================================
    describe('Autre raison → 403 MODULE_INACTIVE', () => {
        it('devrait rejeter avec 403 MODULE_INACTIVE pour MODULE_DESACTIVE', async () => {
            const req = mockReq();
            const res = mockRes();
            mockCheck.mockResolvedValue({
                accessible: false,
                visible: false,
                raison: 'MODULE_DESACTIVE',
                message: 'Module non trouvé ou désactivé',
                source: 'catalogue',
            });

            const middleware = requireModuleAccess('unknown-module');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    errorCode: 'MODULE_INACTIVE',
                }),
            );
        });
    });
});
