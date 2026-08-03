/**
 * ==================================
 * eLISAschool - Tests unitaires cron EDT : matérialisation automatique
 * ==================================
 * Couvre : materialiserSiNecessaire (défauts, config inactive, garde
 * journalière, déclenchement par horaire) + initEmploiDuTempsCronJobs
 * (planification node-cron, tolérance aux erreurs par établissement).
 *
 * NB : le fuseau machine est WAT (UTC+1) = Africa/Douala → les dates
 * factices (setSystemTime) correspondent à l'heure de Douala sans décalage.
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
};

const mockMaterialiser = jest.fn();
const mockSchedule = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    },
}));

jest.mock('node-cron', () => ({
    __esModule: true,
    default: { schedule: (...args: unknown[]) => mockSchedule(...args) },
}));

jest.mock('@modules/personnel/services', () => ({
    heureCoursService: {
        materialiserSemainesCourantes: (...args: unknown[]) => mockMaterialiser(...args),
    },
}));

// Barrel mocké : court-circuite la cascade d'entités (cycle creneau-horaire →
// affectation-matiere → personnel → heure-cours → TypeCreneau). Seul JourSemaine
// est utilisé en runtime par cron-jobs.
jest.mock('@modules/emploi-du-temps/entities', () => ({
    JourSemaine: {
        LUNDI: 'LUNDI',
        MARDI: 'MARDI',
        MERCREDI: 'MERCREDI',
        JEUDI: 'JEUDI',
        VENDREDI: 'VENDREDI',
        SAMEDI: 'SAMEDI',
    },
}));

import { materialiserSiNecessaire, initEmploiDuTempsCronJobs, DEFAULT_MATERIALISATION_AUTO } from '../../src/modules/emploi-du-temps/cron-jobs';

/** Samedi 2026-08-08 21:00 WAT (local) — correspond à SAMEDI 21:00 par défaut */
const SAMEDI_21H = new Date('2026-08-08T21:00:00');

describe('materialiserSiNecessaire (cron EDT)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(SAMEDI_21H);
        mockRepo.save.mockImplementation((data: any) => ({ ...data }));
        mockRepo.create.mockImplementation((data: any) => ({ ...data }));
        mockMaterialiser.mockResolvedValue({ created: 5, skipped: 2 });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('crée une préférence par défaut puis matérialise au samedi 21:00', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await materialiserSiNecessaire('etab-1');

        expect(mockRepo.create).toHaveBeenCalledWith({ etablissementId: 'etab-1' });
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ etablissementId: 'etab-1' }));
        expect(mockMaterialiser).toHaveBeenCalledWith({ etablissementId: 'etab-1' });
    });

    it('ne matérialise pas si la config est inactive', async () => {
        mockRepo.findOne.mockResolvedValue({ materialisationAuto: { actif: false, horaires: [{ jour: 'SAMEDI', heure: '21:00' }] } });

        await materialiserSiNecessaire('etab-1');

        expect(mockMaterialiser).not.toHaveBeenCalled();
    });

    it('ne matérialise pas si l\'horaire courant ne correspond à aucune config', async () => {
        mockRepo.findOne.mockResolvedValue({ materialisationAuto: { actif: true, horaires: [{ jour: 'MERCREDI', heure: '21:00' }] } });

        await materialiserSiNecessaire('etab-1');

        expect(mockMaterialiser).not.toHaveBeenCalled();
    });

    it('matérialise une seule fois par jour (garde journalière)', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await materialiserSiNecessaire('etab-garde');
        await materialiserSiNecessaire('etab-garde');

        expect(mockMaterialiser).toHaveBeenCalledTimes(1);
        expect(mockMaterialiser).toHaveBeenCalledWith({ etablissementId: 'etab-garde' });
    });

    it('matérialise chaque établissement indépendamment (garde par établissement)', async () => {
        mockRepo.findOne.mockResolvedValue(null);

        await materialiserSiNecessaire('etab-indep-1');
        await materialiserSiNecessaire('etab-indep-2');

        expect(mockMaterialiser).toHaveBeenCalledTimes(2);
        expect(mockMaterialiser).toHaveBeenNthCalledWith(1, { etablissementId: 'etab-indep-1' });
        expect(mockMaterialiser).toHaveBeenNthCalledWith(2, { etablissementId: 'etab-indep-2' });
    });

    it('DEFAULT_MATERIALISATION_AUTO = samedi 21:00 + mercredi 21:00', () => {
        expect(DEFAULT_MATERIALISATION_AUTO).toEqual({
            actif: true,
            horaires: [
                { jour: 'SAMEDI', heure: '21:00' },
                { jour: 'MERCREDI', heure: '21:00' },
            ],
        });
    });
});

describe('initEmploiDuTempsCronJobs', () => {
    it('planifie un cron toutes les minutes sur Africa/Douala', () => {
        initEmploiDuTempsCronJobs();

        expect(mockSchedule).toHaveBeenCalledTimes(1);
        expect(mockSchedule).toHaveBeenCalledWith(
            '* * * * *',
            expect.any(Function),
            { timezone: 'Africa/Douala' },
        );
    });

    it('traite chaque établissement et tolère les erreurs individuelles', async () => {
        jest.clearAllMocks();
        jest.useFakeTimers().setSystemTime(SAMEDI_21H);
        mockRepo.findOne.mockResolvedValue(null);

        const etablissements = [{ id: 'etab-err' }, { id: 'etab-ok' }];
        mockRepo.find.mockResolvedValue(etablissements);
        mockMaterialiser
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce({ created: 2, skipped: 0 });

        initEmploiDuTempsCronJobs();
        const handler = mockSchedule.mock.calls[0][1] as () => Promise<void>;
        await handler();

        expect(mockMaterialiser).toHaveBeenCalledTimes(2);
        expect(mockMaterialiser).toHaveBeenLastCalledWith({ etablissementId: 'etab-ok' });
        jest.useRealTimers();
    });
});
