/**
 * ==================================
 * eLISAschool - Tests unitaires Q5/Q2 : updateCreneau (service EDT)
 * ==================================
 * Couvre : dry-run AVANT écriture, 409 CONFLITS_CRENEAU (bloquants),
 * 409 CONFLITS_PROPAGATION (conflits de propagation sans force), mode
 * propagerForce, construction des changements propagés, absence de
 * propagation quand rien de propagable ne change.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
    softRemove: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
};

const mockPropager = jest.fn();
const mockAnnuler = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    },
}));

jest.mock('@modules/emploi-du-temps/services/conflit-detection.service', () => ({
    conflitDetectionService: { detecterConflits: jest.fn() },
}));

jest.mock('@modules/personnel/services', () => ({
    heureCoursService: {
        propagerModificationCreneau: (...args: unknown[]) => mockPropager(...args),
        annulerInstancesCreneaux: (...args: unknown[]) => mockAnnuler(...args),
    },
}));

jest.mock('@modules/matieres/services/coefficient-resolver.service', () => ({
    coefficientResolverService: {},
}));

jest.mock('@modules/salles/services/salle-availability.service', () => ({
    salleAvailabilityService: {},
}));

jest.mock('@modules/configuration/utils/config.helper', () => ({
    getParamBoolean: jest.fn(() => false),
}));

import { EmploiDuTempsService } from '../../src/modules/emploi-du-temps/services/emploi-du-temps.service';
import { conflitDetectionService } from '@modules/emploi-du-temps/services/conflit-detection.service';

const creneau = (overrides: Record<string, any> = {}) => ({
    id: 'creneau-1',
    etablissementId: 'etab-1',
    jour: 'LUNDI',
    heureDebut: '10:00',
    heureFin: '10:55',
    typeCreneau: 'COURS',
    salleId: 'salle-1',
    affectationMatiereId: 'aff-1',
    statut: 'PLANIFIE',
    notes: 'initial',
    ...overrides,
});

describe('EmploiDuTempsService.updateCreneau (Q5/Q2)', () => {
    let service: EmploiDuTempsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new EmploiDuTempsService();
        mockRepo.findOne.mockResolvedValue(creneau());
        mockRepo.save.mockImplementation((data: any) => ({ ...data }));
        mockPropager.mockResolvedValue({ instancesQuiSuivent: 0, instancesInchangees: 0, conflits: [] });
        (conflitDetectionService.detecterConflits as jest.Mock).mockResolvedValue([]);
    });

    it('conserve les notes sans propagation (aucun champ propagable)', async () => {
        const resultat = await service.updateCreneau('creneau-1', { notes: 'nouvelle note' }, 'etab-1');

        expect(resultat.creneau.notes).toBe('nouvelle note');
        expect(resultat.rapport).toBeUndefined();
        expect(mockPropager).not.toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('lève 409 CONFLITS_CRENEAU sur un conflit bloquant et n\'écrit rien', async () => {
        (conflitDetectionService.detecterConflits as jest.Mock).mockResolvedValue([
            { severite: 'BLOQUANT', message: 'La salle est occupée' },
        ]);

        await expect(
            service.updateCreneau('creneau-1', { heureDebut: '14:00' }, 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLITS_CRENEAU' });
        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(mockPropager).not.toHaveBeenCalled();
    });

    it('dry-run : 409 CONFLITS_PROPAGATION avec rapport en détails, sans écriture', async () => {
        mockPropager.mockResolvedValue({
            instancesQuiSuivent: 1,
            instancesInchangees: 0,
            conflits: [{ date: '2026-08-10', type: 'CLASSE', message: 'conflit' }],
        });

        let erreur: any;
        try {
            await service.updateCreneau('creneau-1', { heureDebut: '08:00' }, 'etab-1');
        } catch (e) {
            erreur = e;
        }

        expect(erreur.statusCode).toBe(409);
        expect(erreur.code).toBe('CONFLITS_PROPAGATION');
        expect(erreur.details.rapport.conflits).toHaveLength(1);
        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(mockPropager).toHaveBeenCalledTimes(1);
        expect(mockPropager).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'creneau-1' }),
            { heureDebut: '08:00' },
            'etab-1',
            expect.objectContaining({ dryRun: true, force: undefined }),
        );
    });

    it('propagerForce : applique quand même et exclut les instances en conflit', async () => {
        mockPropager.mockResolvedValue({
            instancesQuiSuivent: 0,
            instancesInchangees: 1,
            conflits: [{ date: '2026-08-10', type: 'CLASSE', message: 'conflit' }],
        });

        const resultat = await service.updateCreneau('creneau-1', { heureDebut: '08:00', propagerForce: true }, 'etab-1', 'user-1');

        expect(resultat.creneau.heureDebut).toBe('08:00');
        expect(resultat.rapport?.conflits).toHaveLength(1);
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
        expect(mockPropager).toHaveBeenCalledTimes(2);
        expect(mockPropager).toHaveBeenNthCalledWith(1, expect.anything(), expect.anything(), 'etab-1', expect.objectContaining({ dryRun: true, force: true }));
        expect(mockPropager).toHaveBeenNthCalledWith(2, expect.anything(), expect.anything(), 'etab-1', expect.objectContaining({ force: true, createurId: 'user-1' }));
    });

    it('sans conflits : dry-run puis propagation réelle, rapport retourné', async () => {
        mockPropager.mockResolvedValue({ instancesQuiSuivent: 2, instancesInchangees: 0, conflits: [] });

        const resultat = await service.updateCreneau(
            'creneau-1',
            { jour: 'MARDI', heureDebut: '09:00', heureFin: '09:55', salleId: 'salle-2', typeCreneau: 'TD' },
            'etab-1',
            'user-1',
        );

        expect(resultat.rapport).toEqual({ instancesQuiSuivent: 2, instancesInchangees: 0, conflits: [] });
        expect(mockPropager).toHaveBeenCalledTimes(2);
        expect(mockPropager).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({ id: 'creneau-1' }),
            { jour: 'MARDI', heureDebut: '09:00', heureFin: '09:55', salleId: 'salle-2', typeCreneau: 'TD' },
            'etab-1',
            expect.objectContaining({ dryRun: true }),
        );
        expect(mockPropager).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ id: 'creneau-1', jour: 'MARDI', heureDebut: '09:00', heureFin: '09:55' }),
            { jour: 'MARDI', heureDebut: '09:00', heureFin: '09:55', salleId: 'salle-2', typeCreneau: 'TD' },
            'etab-1',
            expect.objectContaining({ force: undefined, createurId: 'user-1' }),
        );
    });
});
