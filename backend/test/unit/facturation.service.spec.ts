/**
 * ==================================
 * eLISAschool - Tests unitaires FacturationService
 * ==================================
 * 
 * Teste les calculs de facturation :
 * - TVA OHADA (19.25% en centièmes)
 * - Calcul montant mensuel (base + tranches + options)
 * - Numérotation séquentielle factures
 * - Prorata temporis
 * 
 * Phase P6.1 — Refonte SaaS v4
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

jest.mock('@database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      query: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: any) => data),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        getOne: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      })),
      count: jest.fn(),
      remove: jest.fn(),
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

import { FacturationService } from '../../src/modules/billing/services/facturation.service';

describe('FacturationService', () => {
  let service: FacturationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FacturationService();
  });

  // =============================================
  // TESTS TVA OHADA
  // =============================================

  describe('calculerTVA — TVA 19.25% en centièmes', () => {
    it('devrait calculer 19.25% sur 10000 XAF = 1925 XAF', () => {
      const tva = (service as any).calculerTVA(10000);
      expect(tva).toBe(1925);
    });

    it('devrait calculer 0 TVA sur un montant de 0', () => {
      const tva = (service as any).calculerTVA(0);
      expect(tva).toBe(0);
    });

    it('devrait arrondir correctement pour un montant impair', () => {
      // 1001 * 1925 / 10000 = 192.6925 → arrondi à 193
      const tva = (service as any).calculerTVA(1001);
      expect(tva).toBe(193);
    });

    it('devrait calculer la TVA sur 50000 XAF = 9625 XAF', () => {
      const tva = (service as any).calculerTVA(50000);
      expect(tva).toBe(9625);
    });

    it('devrait retourner un entier (pas de décimales)', () => {
      const tva = (service as any).calculerTVA(3333);
      expect(Number.isInteger(tva)).toBe(true);
    });
  });

  // =============================================
  // TESTS CALCUL MENSUEL
  // =============================================

  describe('calculerMontantMensuel', () => {
    const mockPlan = {
      id: 'plan-1',
      nom: 'Standard',
      prixBase: 15000,
      maxEleves: 100,
      tranches: [
        {
          id: 'tranche-1',
          minEleves: 100,
          maxEleves: 200,
          montantSupplementaire: 5000,
          label: '101-200 élèves',
          actif: true,
        },
        {
          id: 'tranche-2',
          minEleves: 200,
          maxEleves: 500,
          montantSupplementaire: 10000,
          label: '201-500 élèves',
          actif: true,
        },
        {
          id: 'tranche-3',
          minEleves: 500,
          maxEleves: null,
          montantSupplementaire: 20000,
          label: '500+ élèves',
          actif: true,
        },
      ],
    };

    it('devrait retourner le prix de base si nombre élèves <= maxEleves', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(mockPlan);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([]);

      const result = await service.calculerMontantMensuel('plan-1', 80);

      expect(result.montantBase).toBe(15000);
      expect(result.montantTranches).toBe(0);
      expect(result.montantOptions).toBe(0);
      expect(result.montantHT).toBe(15000);
      expect(result.montantTotal).toBe(15000 + (service as any).calculerTVA(15000));
    });

    it('devrait appliquer une tranche si élèves > maxEleves du plan', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(mockPlan);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([]);

      // 150 élèves → tranche 1 (101-200) applicable
      const result = await service.calculerMontantMensuel('plan-1', 150);

      expect(result.montantBase).toBe(15000);
      expect(result.montantTranches).toBe(5000);
      expect(result.montantHT).toBe(20000);
    });

    it('devrait appliquer plusieurs tranches cumulées', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(mockPlan);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([]);

      // 250 élèves → tranche 1 (5000) + tranche 2 (10000)
      const result = await service.calculerMontantMensuel('plan-1', 250);

      expect(result.montantBase).toBe(15000);
      expect(result.montantTranches).toBe(15000); // 5000 + 10000
      expect(result.montantHT).toBe(30000);
    });

    it('devrait lancer une erreur si le plan est introuvable', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(null);

      await expect(service.calculerMontantMensuel('plan-inexistant', 50))
        .rejects.toThrow('introuvable');
    });

    it('devrait ignorer les tranches inactives', async () => {
      const planRepo = (service as any).planRepo;
      const planWithInactive = {
        ...mockPlan,
        tranches: [
          { ...mockPlan.tranches[0], actif: false }, // inactive
          mockPlan.tranches[1],
          mockPlan.tranches[2],
        ],
      };
      planRepo.findOne.mockResolvedValue(planWithInactive);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([]);

      // 250 élèves → tranche 1 inactive, seule tranche 2 s'applique
      const result = await service.calculerMontantMensuel('plan-1', 250);

      expect(result.montantTranches).toBe(10000); // Seulement tranche 2
    });

    it('devrait inclure les modules optionnels dans le calcul', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(mockPlan);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([
        {
          actif: true,
          moduleOptionnelId: 'opt-1',
          moduleOptionnel: { nom: 'Cantine', prixMensuel: 3000, actif: true },
        },
        {
          actif: true,
          moduleOptionnelId: 'opt-2',
          moduleOptionnel: { nom: 'Transport', prixMensuel: 5000, actif: true },
        },
      ]);

      const result = await service.calculerMontantMensuel('plan-1', 50, 'abo-1');

      expect(result.montantOptions).toBe(8000); // 3000 + 5000
      expect(result.montantHT).toBe(23000); // 15000 + 0 + 8000
    });

    it('devrait retourner les bonnes lignes de facture', async () => {
      const planRepo = (service as any).planRepo;
      planRepo.findOne.mockResolvedValue(mockPlan);

      const abonnementModuleRepo = (service as any).abonnementModuleRepo;
      abonnementModuleRepo.find.mockResolvedValue([]);

      const result = await service.calculerMontantMensuel('plan-1', 150);

      // Base + 1 tranche = 2 lignes
      expect(result.lignes).toHaveLength(2);
      expect(result.lignes[0].type).toBe('BASE');
      expect(result.lignes[0].total).toBe(15000);
      expect(result.lignes[1].type).toBe('TRANCHE');
      expect(result.lignes[1].total).toBe(5000);
    });
  });

  // =============================================
  // TESTS NUMÉROTATION FACTURE
  // =============================================

  describe('genererNumeroFacture', () => {
    it('devrait générer un numéro au format FAC-YYYY-000001', async () => {
      const factureRepo = (service as any).factureRepo;
      factureRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null), // Pas de facture précédente
      });

      const numero = await (service as any).genererNumeroFacture();
      const year = new Date().getFullYear();

      expect(numero).toBe(`FAC-${year}-000001`);
    });

    it('devrait incrémenter le numéro séquentiel', async () => {
      const factureRepo = (service as any).factureRepo;
      factureRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          numero: 'FAC-2025-000042',
        }),
      });

      const numero = await (service as any).genererNumeroFacture();
      expect(numero).toBe('FAC-2025-000043');
    });
  });

  // =============================================
  // TESTS CRÉATION AVOIR
  // =============================================

  describe('creerAvoir', () => {
    it('devrait refuser de créer un avoir sur une facture annulée', async () => {
      const factureRepo = (service as any).factureRepo;
      factureRepo.findOne.mockResolvedValue({
        id: 'fac-1',
        numero: 'FAC-2025-000001',
        statut: 'ANNULEE',
        etablissementId: 'etab-1',
        tauxTVA: 1925,
      });

      await expect(service.creerAvoir('fac-1', 5000, 'Remboursement'))
        .rejects.toThrow('Impossible de créer un avoir sur une facture annulée');
    });

    it('devrait calculer correctement la TVA sur un avoir', async () => {
      const factureRepo = (service as any).factureRepo;
      factureRepo.findOne.mockResolvedValue({
        id: 'fac-1',
        numero: 'FAC-2025-000001',
        statut: 'PAYEE',
        etablissementId: 'etab-1',
        tauxTVA: 1925,
      });

      const creditNoteRepo = (service as any).creditNoteRepo;
      creditNoteRepo.create.mockImplementation((data: any) => data);
      creditNoteRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'av-1', ...data }));
      creditNoteRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const result = await service.creerAvoir('fac-1', 10000, 'Remboursement trop-perçu');

      // TVA sur 10000 = 1925
      expect(result.montantHT).toBe(10000);
      expect(result.montantTVA).toBe(1925);
      expect(result.montantTTC).toBe(11925);
    });
  });
});
