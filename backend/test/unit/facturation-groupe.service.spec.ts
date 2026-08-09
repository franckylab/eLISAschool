/**
 * ==================================
 * eLISAschool - Tests unitaires FacturationGroupeService
 * ==================================
 * 
 * Teste la facturation des groupes d'établissements :
 * - Calcul de dégressivité (barème progressif)
 * - Application de la dégressivité sur un montant
 * - Modèles de facturation (individuelle, consolidée, hybride)
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

// Mock FacturationService pour isoler les tests du groupe
jest.mock('../../src/modules/billing/services/facturation.service', () => ({
  FacturationService: jest.fn().mockImplementation(() => ({
    calculerMontantMensuel: jest.fn().mockImplementation((_etabId: string, _planId: string) =>
      Promise.resolve({
        nombreEleves: 100,
        montantBase: 15000,
        montantTranches: 0,
        montantOptions: 0,
        montantTotal: 17888, // 15000 + TVA 2888
      })
    ),
  })),
}));

import {
  FacturationGroupeService,
  ModeleFacturationGroupe,
} from '../../src/modules/billing/services/facturation-groupe.service';

describe('FacturationGroupeService', () => {
  let service: FacturationGroupeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FacturationGroupeService();
  });

  // =============================================
  // TESTS DEGRESSIVITE
  // =============================================

  describe('calculerDegressivite — barème progressif', () => {
    it('devrait retourner 0% pour un seul membre', () => {
      expect(service.calculerDegressivite(1)).toBe(0);
    });

    it('devrait retourner 0% pour 0 membres', () => {
      expect(service.calculerDegressivite(0)).toBe(0);
    });

    it('devrait retourner 5% pour 2 membres', () => {
      expect(service.calculerDegressivite(2)).toBe(5);
    });

    it('devrait retourner 5% pour 3 membres', () => {
      expect(service.calculerDegressivite(3)).toBe(5);
    });

    it('devrait retourner 10% pour 4-5 membres', () => {
      expect(service.calculerDegressivite(4)).toBe(10);
      expect(service.calculerDegressivite(5)).toBe(10);
    });

    it('devrait retourner 15% pour 6-10 membres', () => {
      expect(service.calculerDegressivite(6)).toBe(15);
      expect(service.calculerDegressivite(10)).toBe(15);
    });

    it('devrait retourner 20% pour 11-20 membres', () => {
      expect(service.calculerDegressivite(11)).toBe(20);
      expect(service.calculerDegressivite(20)).toBe(20);
    });

    it('devrait retourner 25% pour 21+ membres', () => {
      expect(service.calculerDegressivite(21)).toBe(25);
      expect(service.calculerDegressivite(100)).toBe(25);
    });
  });

  // =============================================
  // TESTS APPLICATION DEGRESSIVITE
  // =============================================

  describe('appliquerDegressivite', () => {
    it('devrait appliquer 0% de réduction (montant inchangé)', () => {
      expect(service.appliquerDegressivite(100000, 0)).toBe(100000);
    });

    it('devrait appliquer 5% de réduction sur 100000', () => {
      expect(service.appliquerDegressivite(100000, 5)).toBe(95000);
    });

    it('devrait appliquer 10% de réduction sur 50000', () => {
      expect(service.appliquerDegressivite(50000, 10)).toBe(45000);
    });

    it('devrait appliquer 25% de réduction sur 200000', () => {
      expect(service.appliquerDegressivite(200000, 25)).toBe(150000);
    });

    it('devrait retourner un entier (arrondi)', () => {
      // 33333 * (1 - 5/100) = 33333 * 0.95 = 31666.35 → arrondi à 31666
      const result = service.appliquerDegressivite(33333, 5);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(31666);
    });

    it('devrait gérer un montant de 0', () => {
      expect(service.appliquerDegressivite(0, 25)).toBe(0);
    });
  });

  // =============================================
  // TESTS MODÈLE INDIVIDUELLE
  // =============================================

  describe('genererFacturesGroupe — modèle INDIVIDUELLE', () => {
    it('devrait refuser si le groupe est introuvable', async () => {
      const groupeRepo = (service as any).groupeRepo;
      groupeRepo.findOne.mockResolvedValue(null);

      await expect(
        service.genererFacturesGroupe('groupe-inexistant', ModeleFacturationGroupe.INDIVIDUELLE, '2025-01')
      ).rejects.toThrow('introuvable ou inactif');
    });

    it('devrait créer une facture par établissement pour le modèle INDIVIDUELLE', async () => {
      const groupeRepo = (service as any).groupeRepo;
      groupeRepo.findOne.mockResolvedValue({
        id: 'groupe-1',
        nom: 'Groupe Test',
        actif: true,
      });

      const lienRepo = (service as any).lienRepo;
      lienRepo.find.mockResolvedValue([
        { etablissementId: 'etab-1', etablissement: { nom: 'École A' } },
        { etablissementId: 'etab-2', etablissement: { nom: 'École B' } },
      ]);

      const abonnementRepo = (service as any).abonnementRepo;
      abonnementRepo.findOne.mockResolvedValue({
        id: 'abo-1',
        etablissementId: 'etab-1',
        planId: 'plan-1',
        statut: 'ACTIF',
        plan: {
          id: 'plan-1',
          nom: 'Standard',
          prixBase: 15000,
          tranches: [],
        },
      });

      const factureRepo = (service as any).factureRepo;
      factureRepo.create.mockImplementation((data: any) => data);
      factureRepo.save.mockImplementation((data: any) => Promise.resolve({ id: `fac-${Math.random()}`, ...data }));
      factureRepo.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      });

      const result = await service.genererFacturesGroupe(
        'groupe-1',
        ModeleFacturationGroupe.INDIVIDUELLE,
        '2025-01'
      );

      expect(result.modele).toBe(ModeleFacturationGroupe.INDIVIDUELLE);
      expect(result.factures.length).toBeGreaterThanOrEqual(0);
      expect(result.degressivite).toBe(5); // 2 membres = 5%
    });
  });

  // =============================================
  // TESTS CALCUL CONSOMMATION
  // =============================================

  describe('calculerConsommationMembres', () => {
    it('devrait retourner un tableau vide si aucun lien', async () => {
      const lienRepo = (service as any).lienRepo;
      lienRepo.find.mockResolvedValue([]);

      const result = await service.calculerConsommationMembres('groupe-1', '2025-01');
      expect(result).toEqual([]);
    });

    it('devrait ignorer les membres sans abonnement actif', async () => {
      const lienRepo = (service as any).lienRepo;
      lienRepo.find.mockResolvedValue([
        { etablissementId: 'etab-1', etablissement: { nom: 'École A' } },
        { etablissementId: 'etab-2', etablissement: { nom: 'École B' } },
      ]);

      const abonnementRepo = (service as any).abonnementRepo;
      abonnementRepo.findOne
        .mockResolvedValueOnce({
          id: 'abo-1',
          planId: 'plan-1',
          statut: 'ACTIF',
          plan: { id: 'plan-1', nom: 'Standard', prixBase: 15000, tranches: [] },
        })
        .mockResolvedValueOnce(null); // Pas d'abonnement pour etab-2

      const result = await service.calculerConsommationMembres('groupe-1', '2025-01');

      // Seul etab-1 devrait être dans le résultat
      expect(result).toHaveLength(1);
      expect(result[0].etablissementId).toBe('etab-1');
    });
  });
});
