/**
 * ==================================
 * eLISAschool - Tests unitaires BaremeGroupeService
 * ==================================
 *
 * Résolution sans doublon des barèmes configurables :
 * override groupe → global → défaut codé, jamais de crash.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockConfigurationService = {
    getParametre: jest.fn(),
    getParametreGroupe: jest.fn(),
    setParametre: jest.fn(),
    setParametreGroupe: jest.fn(),
    resetParametreGroupe: jest.fn(),
};

jest.mock('@modules/configuration/services/configuration.service', () => ({
    configurationService: mockConfigurationService,
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import {
    baremeGroupeService,
    BaremeGroupeService,
    DEFAUT_PALIERS_GROUPE,
    DEFAUT_PLAFOND_POURCENT,
} from '../../src/modules/billing/services/bareme-groupe.service';

describe('BaremeGroupeService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('tauxPour()', () => {
        it('retourne 0 sous le premier palier', () => {
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 1)).toBe(0);
        });

        it('applique le dernier palier atteint (barème par défaut)', () => {
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 2)).toBe(5);
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 5)).toBe(10);
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 10)).toBe(15);
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 20)).toBe(20);
            expect(BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, 100)).toBe(25);
        });

        it('supporte un barème custom désordonné', () => {
            const paliers = [
                { minMembres: 10, remisePct: 12 },
                { minMembres: 3, remisePct: 7 },
            ];
            expect(BaremeGroupeService.tauxPour(paliers, 5)).toBe(7);
            expect(BaremeGroupeService.tauxPour(paliers, 10)).toBe(12);
        });
    });

    describe('getPaliersEffectifs()', () => {
        it('priorise l\'override groupe quand il est valide', async () => {
            const override = [{ minMembres: 2, remisePct: 8 }];
            mockConfigurationService.getParametreGroupe.mockResolvedValue(override);

            const res = await baremeGroupeService.getPaliersEffectifs('groupe-1');

            expect(res).toEqual({ paliers: override, source: 'groupe' });
        });

        it('retombe sur le global si l\'override est invalide', async () => {
            mockConfigurationService.getParametreGroupe.mockResolvedValue([{ minMembres: 1, remisePct: 500 }]);
            const global = [{ minMembres: 2, remisePct: 5 }];
            mockConfigurationService.getParametre.mockResolvedValue(global);

            const res = await baremeGroupeService.getPaliersEffectifs('groupe-1');

            expect(res).toEqual({ paliers: global, source: 'global' });
        });

        it('retombe sur le défaut codé si tout est absent', async () => {
            mockConfigurationService.getParametreGroupe.mockResolvedValue(null);
            mockConfigurationService.getParametre.mockResolvedValue(null);

            const res = await baremeGroupeService.getPaliersEffectifs('groupe-1');

            expect(res).toEqual({ paliers: DEFAUT_PALIERS_GROUPE, source: 'defaut' });
        });

        it('ne crashe jamais si la lecture échoue', async () => {
            mockConfigurationService.getParametreGroupe.mockRejectedValue(new Error('DB down'));
            mockConfigurationService.getParametre.mockRejectedValue(new Error('DB down'));

            const res = await baremeGroupeService.getPaliersEffectifs('groupe-1');

            expect(res.source).toBe('defaut');
        });
    });

    describe('getPlafondPlan() / getPlafondGroupe()', () => {
        it('lit le plafond PLAN global', async () => {
            mockConfigurationService.getParametre.mockResolvedValue(30);

            const res = await baremeGroupeService.getPlafondPlan();

            expect(res).toEqual({ valeur: 30, source: 'global' });
        });

        it('retombe sur 40 si le plafond est hors bornes', async () => {
            mockConfigurationService.getParametre.mockResolvedValue(150);

            const res = await baremeGroupeService.getPlafondPlan();

            expect(res).toEqual({ valeur: DEFAUT_PLAFOND_POURCENT, source: 'defaut' });
        });

        it('priorise l\'override groupe pour le plafond GROUPE', async () => {
            mockConfigurationService.getParametreGroupe.mockResolvedValue(25);

            const res = await baremeGroupeService.getPlafondGroupe('groupe-1');

            expect(res).toEqual({ valeur: 25, source: 'groupe' });
        });
    });

    describe('getTauxDegressivite()', () => {
        it('combine override groupe et barème partagé', async () => {
            mockConfigurationService.getParametreGroupe.mockResolvedValue([
                { minMembres: 2, remisePct: 8 },
                { minMembres: 5, remisePct: 18 },
            ]);

            const res = await baremeGroupeService.getTauxDegressivite('groupe-1', 6);

            expect(res).toEqual({ taux: 18, source: 'groupe' });
        });
    });
});
