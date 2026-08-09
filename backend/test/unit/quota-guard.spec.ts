/**
 * ==================================
 * eLISAschool - Tests unitaires QuotaGuard
 * ==================================
 * 
 * Teste le middleware de vérification des quotas :
 * - Vérification avant création (requireQuota)
 * - Alerte à 80%, 90%, 100%
 * - Blocage à 100% si bloquer=true
 * - Cas sans quota défini (pas de limite)
 * - Cas limite=0 (illimité)
 * 
 * Phase 4 — Refonte SaaS v5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockFindOne = jest.fn();
const mockSave = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            if (entity?.name === 'QuotaUtilisation') {
                return { findOne: mockFindOne, save: mockSave };
            }
            if (entity?.name === 'AbonnementClient') {
                return { findOne: jest.fn() };
            }
            return {
                findOne: jest.fn(),
                save: jest.fn(),
                find: jest.fn(),
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

jest.mock('@modules/notifications/services/notification-orchestrator.service', () => ({
    NotificationOrchestratorService: jest.fn().mockImplementation(() => ({
        envoyerNotification: jest.fn(),
    })),
}));

import { QuotaService } from '../../src/modules/billing/services/quota.service';

describe('QuotaService', () => {
    let service: QuotaService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new QuotaService();
    });

    // =============================================
    // verifierQuota
    // =============================================
    describe('verifierQuota', () => {

        it('autorise si aucun quota défini (pas de limite)', async () => {
            mockFindOne.mockResolvedValue(null);

            const result = await service.verifierQuota('etab-1', 'eleves', 1);

            expect(result.autorise).toBe(true);
            expect(result.utilisation).toBe(0);
            expect(result.limite).toBe(0);
        });

        it('autorise si limite = 0 (illimité)', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 500,
                limiteMax: 0,
                bloquer: true,
            });

            const result = await service.verifierQuota('etab-1', 'eleves', 1);

            expect(result.autorise).toBe(true);
            expect(result.utilisation).toBe(500);
            expect(result.limite).toBe(0);
        });

        it('autorise si utilisation + consommation <= limite', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 49,
                limiteMax: 50,
                bloquer: true,
            });

            const result = await service.verifierQuota('etab-1', 'eleves', 1);

            expect(result.autorise).toBe(true);
            expect(result.pourcentage).toBe(100);
        });

        it('refuse si utilisation + consommation > limite et bloquer=true', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 50,
                limiteMax: 50,
                bloquer: true,
            });

            const result = await service.verifierQuota('etab-1', 'eleves', 1);

            expect(result.autorise).toBe(false);
            expect(result.utilisation).toBe(50);
            expect(result.limite).toBe(50);
            expect(result.pourcentage).toBe(102);
        });

        it('autorise même si quota dépassé mais bloquer=false', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 50,
                limiteMax: 50,
                bloquer: false,
            });

            const result = await service.verifierQuota('etab-1', 'eleves', 5);

            expect(result.autorise).toBe(true);
        });

        it('calcule le pourcentage correctement', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 40,
                limiteMax: 200,
                bloquer: true,
            });

            const result = await service.verifierQuota('etab-1', 'eleves', 10);

            // (40 + 10) / 200 * 100 = 25%
            expect(result.pourcentage).toBe(25);
        });
    });

    // =============================================
    // requireQuota middleware
    // =============================================
    describe('requireQuota (middleware)', () => {

        it('passe au suivant si quota OK', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 10,
                limiteMax: 100,
                bloquer: true,
            });

            const middleware = service.requireQuota('eleves', 1);
            const req = { etablissementId: 'etab-1' } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn();

            await middleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('lance une erreur 429 si quota dépassé', async () => {
            mockFindOne.mockResolvedValue({
                utilisationActuelle: 100,
                limiteMax: 100,
                bloquer: true,
            });

            const middleware = service.requireQuota('eleves', 1);
            const req = { etablissementId: 'etab-1' } as any;
            const res = {} as any;
            const next = jest.fn();

            await middleware(req, res, next);

            // Devrait appeler next avec une erreur
            expect(next).toHaveBeenCalled();
            const error = next.mock.calls[0][0];
            expect(error).toBeDefined();
            expect(error.statusCode || error.status).toBe(429);
        });
    });
});
