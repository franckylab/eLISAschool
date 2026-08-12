/**
 * ==================================
 * eLISAschool - Tests unitaires Module Access Middleware
 * ==================================
 *
 * Teste le middleware requireModuleAccess :
 * - SUPER_ADMIN → accès total
 * - Module inactif → 403 MODULE_INACTIVE
 * - Module facturable sans abonnement → 402 SUBSCRIPTION_REQUIRED
 * - Module premium non souscrit → 403 MODULE_PREMIUM_REQUIS
 * - Module gratuit actif → accès autorisé
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockIsModuleActive = jest.fn();
const mockIsModuleFacturable = jest.fn();
const mockIsModuleSouscrit = jest.fn();
const mockLogAccessDenied = jest.fn();
const mockAbonnementFindOne = jest.fn();

jest.mock('@modules/configuration/services/configuration.service', () => ({
    configurationService: {
        isModuleActive: mockIsModuleActive,
    },
}));

jest.mock('@modules/billing/services/module-resolution.service', () => ({
    moduleResolutionService: {
        isModuleFacturable: mockIsModuleFacturable,
        isModuleSouscrit: mockIsModuleSouscrit,
    },
}));

jest.mock('@modules/auth', () => ({
    auditService: {
        logAccessDenied: mockLogAccessDenied,
    },
}));

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => ({
            findOne: mockAbonnementFindOne,
        })),
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

describe('Middleware requireModuleAccess', () => {
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
            expect(mockIsModuleActive).not.toHaveBeenCalled();
        });
    });

    // =============================================
    // Module inactif → 403
    // =============================================
    describe('Module inactif → 403 MODULE_INACTIVE', () => {

        it('devrait rejeter si le module est inactif', async () => {
            const req = mockReq();
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(false);

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    errorCode: 'MODULE_INACTIVE',
                }),
            );
            expect(mockLogAccessDenied).toHaveBeenCalled();
        });
    });

    // =============================================
    // Module facturable sans abonnement → 402
    // =============================================
    describe('Module facturable sans abonnement → 402', () => {

        it('devrait rejeter si module facturable et pas d\'abonnement', async () => {
            const req = mockReq();
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(true);
            mockIsModuleFacturable.mockResolvedValue(true);
            mockAbonnementFindOne.mockResolvedValue(null);

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 402,
                    errorCode: 'SUBSCRIPTION_REQUIRED',
                }),
            );
        });
    });

    // =============================================
    // Module premium non souscrit → 403
    // =============================================
    describe('Module premium non souscrit → 403', () => {

        it('devrait rejeter si abonnement actif mais module non souscrit', async () => {
            const req = mockReq();
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(true);
            mockIsModuleFacturable.mockResolvedValue(true);
            mockAbonnementFindOne.mockResolvedValue({
                plan: { nom: 'Standard', modulesInclus: ['auth', 'notes'] },
            });
            mockIsModuleSouscrit.mockResolvedValue(false);

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 403,
                    errorCode: 'MODULE_PREMIUM_REQUIS',
                }),
            );
        });
    });

    // =============================================
    // Module gratuit actif → accès autorisé
    // =============================================
    describe('Module gratuit actif → accès autorisé', () => {

        it('devrait laisser passer si module actif et non facturable', async () => {
            const req = mockReq();
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(true);
            mockIsModuleFacturable.mockResolvedValue(false);

            const middleware = requireModuleAccess('auth');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
        });
    });

    // =============================================
    // Module premium souscrit → accès autorisé
    // =============================================
    describe('Module premium souscrit → accès autorisé', () => {

        it('devrait laisser passer si module premium et souscrit', async () => {
            const req = mockReq();
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(true);
            mockIsModuleFacturable.mockResolvedValue(true);
            mockAbonnementFindOne.mockResolvedValue({
                plan: { nom: 'Premium', modulesInclus: ['transport'] },
            });
            mockIsModuleSouscrit.mockResolvedValue(true);

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            expect(next).toHaveBeenCalledWith();
            // Vérifier que moduleInfo est ajouté
            expect((req as any).moduleInfo).toEqual({
                nom: 'transport',
                isPremium: true,
            });
        });
    });

    // =============================================
    // Sans etablissementId
    // =============================================
    describe('Sans etablissementId', () => {

        it('devrait rejeter si pas d\'établissement et module facturable', async () => {
            const req = mockReq({ etablissementId: null });
            req.utilisateur.etablissementId = null;
            const res = mockRes();
            mockIsModuleActive.mockResolvedValue(true);
            mockIsModuleFacturable.mockResolvedValue(true);
            mockAbonnementFindOne.mockResolvedValue(null);

            const middleware = requireModuleAccess('transport');
            await middleware(req as any, res, next);

            // Pas d'abonnement possible sans etablissementId
            expect(next).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 402,
                }),
            );
        });
    });
});
