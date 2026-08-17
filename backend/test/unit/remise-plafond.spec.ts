/**
 * ==================================
 * eLISAschool - Tests unitaires RemiseService v3.1
 * ==================================
 *
 * Teste le moteur de remises corrigé :
 * - Plafond global 40% sur le cumul des remises
 * - Filtrage conditionnel volume (conditionElevesMin)
 * - Filtrage conditionnel fidélité (conditionAncienneteMois)
 * - Non-application si conditions non remplies
 * - Écrêtage au plafond quand le cumul dépasse 40%
 *
 * Phase 1.5 — Refonte Billing v3.1
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// ─── Mocks ───

const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn((data: any) => Promise.resolve(data)),
  remove: jest.fn(),
  update: jest.fn(),
  increment: jest.fn(),
};

jest.mock('@database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepo),
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

import { RemiseService, ContexteApplicationRemise } from '../../src/modules/billing/services/remise.service';
import { TypeRemise, CibleRemise, DureeApplicationRemise } from '../../src/modules/billing/entities/remise-abonnement.entity';

// ─── Helpers ───

function createRemise(overrides: Partial<any> = {}): any {
  return {
    id: 'remise-' + Math.random().toString(36).slice(2, 8),
    code: 'TEST',
    nom: 'Test remise',
    typeRemise: TypeRemise.POURCENTAGE,
    valeur: 10,
    dureeApplication: DureeApplicationRemise.PERMANENTE,
    cible: CibleRemise.GLOBAL,
    cumulable: true,
    priorite: 0,
    actif: true,
    utilisations: 0,
    maxUtilisations: null,
    conditionElevesMin: null,
    conditionAncienneteMois: null,
    dateDebut: new Date('2024-01-01'),
    dateFin: null,
    ...overrides,
  };
}

describe('RemiseService v3.1 — Moteur d\'application', () => {
  let service: RemiseService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RemiseService();
  });

  // =============================================
  // TESTS PLAFOND 40%
  // =============================================

  describe('Plafond global 40%', () => {
    it('ne doit pas dépasser 40% de déduction même avec cumul > 40%', async () => {
      // 3 remises cumulables : 15% + 15% + 15% = 45% → plafonné à 40%
      const remises = [
        createRemise({ code: 'R1', valeur: 15, priorite: 30, cumulable: true }),
        createRemise({ code: 'R2', valeur: 15, priorite: 20, cumulable: true }),
        createRemise({ code: 'R3', valeur: 15, priorite: 10, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const resultat = await service.appliquer(10000, {});

      // Plafond = 40% de 10000 = 4000
      expect(resultat.montantFinal).toBe(6000);
      const totalDeduit = resultat.montantAvantRemise - resultat.montantFinal;
      expect(totalDeduit).toBeLessThanOrEqual(4000);
    });

    it('doit appliquer le cumul complet si < 40%', async () => {
      // 2 remises cumulables : 10% + 15% = 25% < 40%
      const remises = [
        createRemise({ code: 'R1', valeur: 10, priorite: 20, cumulable: true }),
        createRemise({ code: 'R2', valeur: 15, priorite: 10, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const resultat = await service.appliquer(10000, {});

      // 25% de 10000 = 2500, montant final = 7500
      expect(resultat.montantFinal).toBe(7500);
    });

    it('doit écrêter la dernière remise si le cumul dépasse 40%', async () => {
      // 2 remises : 25% + 25% = 50% → plafonné à 40%
      // La 2ème remise doit être écrêtée à 15%
      const remises = [
        createRemise({ code: 'R1', valeur: 25, priorite: 20, cumulable: true }),
        createRemise({ code: 'R2', valeur: 25, priorite: 10, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const resultat = await service.appliquer(10000, {});

      // Plafond = 4000, R1 déduit 2500, R2 écrêté à 1500
      expect(resultat.montantFinal).toBe(6000);
      expect(resultat.remisesAppliquees).toHaveLength(2);
      expect(resultat.remisesAppliquees[0].montantDeduit).toBe(2500);
      expect(resultat.remisesAppliquees[1].montantDeduit).toBe(1500);
    });

    it('une remise non cumulable exclusive ne doit pas être plafonnée si < 40%', async () => {
      const remises = [
        createRemise({ code: 'R1', valeur: 30, priorite: 100, cumulable: false }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const resultat = await service.appliquer(10000, {});

      // 30% < 40%, pas de plafonnement
      expect(resultat.montantFinal).toBe(7000);
    });
  });

  // =============================================
  // TESTS FILTRAGE VOLUME
  // =============================================

  describe('Filtrage conditionnel — Volume (conditionElevesMin)', () => {
    it('VOL-500 doit s\'appliquer si nombreEleves >= 500', async () => {
      const remises = [
        createRemise({ code: 'VOL-500', valeur: 10, conditionElevesMin: 500, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const ctx: ContexteApplicationRemise = { nombreEleves: 600 };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(1);
      expect(resultat.remisesAppliquees[0].code).toBe('VOL-500');
    });

    it('VOL-500 ne doit PAS s\'appliquer si nombreEleves < 500', async () => {
      const remises = [
        createRemise({ code: 'VOL-500', valeur: 10, conditionElevesMin: 500, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const ctx: ContexteApplicationRemise = { nombreEleves: 300 };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(0);
      expect(resultat.montantFinal).toBe(10000);
    });

    it('VOL-1000 ne doit PAS s\'appliquer si nombreEleves = 500 (seuil 1000)', async () => {
      const remises = [
        createRemise({ code: 'VOL-1000', valeur: 20, conditionElevesMin: 1000, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const ctx: ContexteApplicationRemise = { nombreEleves: 500 };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(0);
    });

    it('ni VOL-500 ni VOL-1000 si nombreEleves non fourni dans le contexte', async () => {
      const remises = [
        createRemise({ code: 'VOL-500', valeur: 10, conditionElevesMin: 500, cumulable: true }),
        createRemise({ code: 'VOL-1000', valeur: 20, conditionElevesMin: 1000, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      // Pas de nombreEleves dans le contexte
      const resultat = await service.appliquer(10000, {});

      expect(resultat.remisesAppliquees).toHaveLength(0);
    });
  });

  // =============================================
  // TESTS FILTRAGE FIDÉLITÉ
  // =============================================

  describe('Filtrage conditionnel — Fidélité (conditionAncienneteMois)', () => {
    it('FID-12M doit s\'appliquer si ancienneté >= 12 mois', async () => {
      const remises = [
        createRemise({ code: 'FID-12M', valeur: 5, conditionAncienneteMois: 12, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 14); // 14 mois d'ancienneté

      const ctx: ContexteApplicationRemise = { dateDebutAbonnement: dateDebut };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(1);
      expect(resultat.remisesAppliquees[0].code).toBe('FID-12M');
    });

    it('FID-12M ne doit PAS s\'appliquer si ancienneté < 12 mois', async () => {
      const remises = [
        createRemise({ code: 'FID-12M', valeur: 5, conditionAncienneteMois: 12, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 6); // 6 mois d'ancienneté

      const ctx: ContexteApplicationRemise = { dateDebutAbonnement: dateDebut };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(0);
      expect(resultat.montantFinal).toBe(10000);
    });

    it('FID-24M ne doit PAS s\'appliquer si ancienneté = 12 mois', async () => {
      const remises = [
        createRemise({ code: 'FID-24M', valeur: 10, conditionAncienneteMois: 24, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 12); // 12 mois

      const ctx: ContexteApplicationRemise = { dateDebutAbonnement: dateDebut };
      const resultat = await service.appliquer(10000, ctx);

      expect(resultat.remisesAppliquees).toHaveLength(0);
    });

    it('FID-12M ne doit PAS s\'appliquer si dateDebutAbonnement absente du contexte', async () => {
      const remises = [
        createRemise({ code: 'FID-12M', valeur: 5, conditionAncienneteMois: 12, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      // Pas de dateDebutAbonnement
      const resultat = await service.appliquer(10000, {});

      expect(resultat.remisesAppliquees).toHaveLength(0);
    });
  });

  // =============================================
  // TESTS CUMUL MIXTE AVEC PLAFOND
  // =============================================

  describe('Cumul mixte volume + fidélité avec plafond', () => {
    it('cumul VOL-500 + FID-12M = 15% (sous le plafond)', async () => {
      const remises = [
        createRemise({ code: 'VOL-500', valeur: 10, conditionElevesMin: 500, priorite: 10, cumulable: true }),
        createRemise({ code: 'FID-12M', valeur: 5, conditionAncienneteMois: 12, priorite: 30, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 14);

      const ctx: ContexteApplicationRemise = { nombreEleves: 600, dateDebutAbonnement: dateDebut };
      const resultat = await service.appliquer(10000, ctx);

      // 10% + 5% = 15% → 1500 déduit, final = 8500
      expect(resultat.remisesAppliquees).toHaveLength(2);
      expect(resultat.montantFinal).toBe(8500);
    });

    it('cumul VOL-1000 + FID-24M + cycle = 40% (exactement au plafond)', async () => {
      const remises = [
        createRemise({ code: 'VOL-1000', valeur: 20, conditionElevesMin: 1000, priorite: 20, cumulable: true }),
        createRemise({ code: 'FID-24M', valeur: 10, conditionAncienneteMois: 24, priorite: 40, cumulable: true }),
        createRemise({ code: 'CYCLE-ANNUEL', valeur: 10, cible: CibleRemise.CYCLE, cibleCycle: 'ANNUEL', priorite: 5, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 26);

      const ctx: ContexteApplicationRemise = {
        nombreEleves: 1200,
        dateDebutAbonnement: dateDebut,
        cycleCode: 'ANNUEL',
      };
      const resultat = await service.appliquer(10000, ctx);

      // 20% + 10% + 10% = 40% → exactement au plafond
      expect(resultat.montantFinal).toBe(6000);
      expect(resultat.remisesAppliquees).toHaveLength(3);
    });

    it('cumul massif écrêté au plafond 40%', async () => {
      const remises = [
        createRemise({ code: 'VOL-1000', valeur: 20, conditionElevesMin: 1000, priorite: 20, cumulable: true }),
        createRemise({ code: 'FID-24M', valeur: 10, conditionAncienneteMois: 24, priorite: 40, cumulable: true }),
        createRemise({ code: 'CYCLE-ANNUEL', valeur: 10, cible: CibleRemise.CYCLE, cibleCycle: 'ANNUEL', priorite: 5, cumulable: true }),
        createRemise({ code: 'PROMO', valeur: 15, priorite: 100, cumulable: true }),
      ];
      mockRepo.find.mockResolvedValue(remises);

      const dateDebut = new Date();
      dateDebut.setMonth(dateDebut.getMonth() - 26);

      const ctx: ContexteApplicationRemise = {
        nombreEleves: 1200,
        dateDebutAbonnement: dateDebut,
        cycleCode: 'ANNUEL',
      };
      const resultat = await service.appliquer(10000, ctx);

      // Total brut = 55% mais plafonné à 40%
      expect(resultat.montantFinal).toBe(6000);
      const totalDeduit = resultat.montantAvantRemise - resultat.montantFinal;
      expect(totalDeduit).toBeLessThanOrEqual(4000);
    });
  });
});
