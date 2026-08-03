/**
 * ==================================
 * eLISAschool - Tests unitaires Q6-C : mise à jour d'une instance HeureCours
 * avec propagation inverse vers le créneau hebdo (mettreAJourCreneau)
 * ==================================
 * Couvre : update() — gardes REMPLACE, conflit instance, applicabilité du
 * mode inverse, 404 CRENEAU_NOT_FOUND, 400 JOUR_INVALIDE, 409 CONFLITS_CRENEAU,
 * exclusion de l'instance courante de la propagation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    createQueryBuilder: jest.fn(),
    query: jest.fn(),
    count: jest.fn(),
};

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    },
}));

jest.mock('@modules/auth/services/audit.service', () => ({
    auditService: { log: jest.fn() },
}));

jest.mock('@modules/personnel/services/personnel.service', () => ({
    personnelService: {},
}));

jest.mock('@modules/emploi-du-temps/services/conflit-detection.service', () => ({
    conflitDetectionService: { detecterConflits: jest.fn() },
}));

jest.mock('@modules/emploi-du-temps/services/conflit-commun.service', () => {
    const { verifierOverlapHoraire } = jest.requireActual('@modules/emploi-du-temps/services/conflit-commun.service');
    return { verifierOverlapHoraire };
});

import { HeureCoursService } from '../../src/modules/personnel/services/heure-cours.service';
import { conflitDetectionService } from '@modules/emploi-du-temps/services/conflit-detection.service';
import { StatutEffectue } from '../../src/modules/personnel/entities';

const heureCours = (overrides: Record<string, any> = {}) => ({
    id: 'hc-1',
    enseignantId: 'ens-1',
    classeAnneeId: 'classe-1',
    matiereId: 'mat-1',
    salleId: 'salle-1',
    date: new Date('2026-08-03T00:00:00'),
    heureDebut: '10:00',
    heureFin: '10:55',
    statutEffectue: StatutEffectue.PLANIFIE,
    creneauId: 'creneau-1',
    etablissementId: 'etab-1',
    ...overrides,
});

const qbMock = (getManyResult: any[] = []) => {
    const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(getManyResult),
    };
    return qb as any;
};

describe('HeureCoursService.update (Q6-C : instance → créneau)', () => {
    let service: HeureCoursService;
    let propagerSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new HeureCoursService();
        propagerSpy = jest
            .spyOn(service as any, 'propagerModificationCreneau')
            .mockResolvedValue({ instancesQuiSuivent: 1, instancesInchangees: 0, conflits: [] });
        mockRepo.save.mockImplementation((data: any) => ({ ...data }));
        (conflitDetectionService.detecterConflits as jest.Mock).mockResolvedValue([]);
    });

    it('sans mettreAJourCreneau, ne touche pas au créneau ni aux autres instances', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours());
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        const resultat = await service.update('hc-1', { statutEffectue: StatutEffectue.EFFECTUE }, 'user-1', 'etab-1');

        expect(resultat.heureCours.statutEffectue).toBe(StatutEffectue.EFFECTUE);
        expect(resultat.rapport).toBeUndefined();
        expect(propagerSpy).not.toHaveBeenCalled();
        expect(mockRepo.save).toHaveBeenCalledTimes(1);
    });

    it('met à jour le créneau hebdo et propage en excluant l\'instance courante', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours());
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        const resultat = await service.update(
            'hc-1',
            { statutEffectue: StatutEffectue.EFFECTUE, mettreAJourCreneau: true },
            'user-1',
            'etab-1',
        );

        expect(mockRepo.findOne).toHaveBeenCalledWith(
            expect.objectContaining({ where: { id: 'creneau-1', etablissementId: 'etab-1' } }),
        );
        expect(propagerSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                jour: 'LUNDI',
                heureDebut: '10:00',
                heureFin: '10:55',
            }),
            expect.objectContaining({ jour: 'LUNDI', heureDebut: '10:00', heureFin: '10:55' }),
            'etab-1',
            expect.objectContaining({
                force: true,
                createurId: 'user-1',
                excludeInstanceIds: ['hc-1'],
            }),
        );
        expect(resultat.rapport).toEqual({ instancesQuiSuivent: 1, instancesInchangees: 0, conflits: [] });
    });

    it('sans créneau source, n\'appelle pas la propagation (rapport absent)', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours({ creneauId: null }));
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        const resultat = await service.update(
            'hc-1',
            { statutEffectue: StatutEffectue.EFFECTUE, mettreAJourCreneau: true },
            'user-1',
            'etab-1',
        );

        expect(resultat.rapport).toBeUndefined();
        expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
        expect(propagerSpy).not.toHaveBeenCalled();
    });

    it('lève 404 CRENEAU_NOT_FOUND quand le créneau source n\'existe pas', async () => {
        mockRepo.findOne.mockResolvedValueOnce(heureCours()).mockResolvedValueOnce(null);
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        await expect(
            service.update('hc-1', { statutEffectue: StatutEffectue.EFFECTUE, mettreAJourCreneau: true }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 404, code: 'CRENEAU_NOT_FOUND' });
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('lève 400 JOUR_INVALIDE quand la date cible est un dimanche', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours({ date: new Date('2026-08-02T00:00:00') }));
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        await expect(
            service.update('hc-1', { statutEffectue: StatutEffectue.EFFECTUE, mettreAJourCreneau: true }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 400, code: 'JOUR_INVALIDE' });
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('lève 409 CONFLITS_CRENEAU sur un conflit bloquant hebdo et n\'écrit rien', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours());
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));
        (conflitDetectionService.detecterConflits as jest.Mock).mockResolvedValue([
            { severite: 'BLOQUANT', message: 'La classe a déjà cours' },
        ]);

        await expect(
            service.update('hc-1', { statutEffectue: StatutEffectue.EFFECTUE, mettreAJourCreneau: true }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLITS_CRENEAU' });
        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(propagerSpy).not.toHaveBeenCalled();
    });

    it('garde REMPLACE : exige un remplaçant (400 REMPLACANT_REQUIS)', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours());
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        await expect(
            service.update('hc-1', { statutEffectue: StatutEffectue.REMPLACE }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 400, code: 'REMPLACANT_REQUIS' });
    });

    it('garde REMPLACE : rejette un remplaçant inexistant ou inactif (400 REMPLACANT_INVALIDE)', async () => {
        mockRepo.findOne
            .mockResolvedValueOnce(heureCours())
            .mockResolvedValueOnce(null);
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        await expect(
            service.update('hc-1', { statutEffectue: StatutEffectue.REMPLACE, remplacantId: 'remp-1' }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 400, code: 'REMPLACANT_INVALIDE' });
    });

    it('lève 409 CRENEAU_CONFLIT sur un chevauchement au niveau instance', async () => {
        mockRepo.findOne.mockResolvedValue(heureCours());
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([
            {
                id: 'hc-2',
                enseignantId: 'ens-1',
                classeAnneeId: 'classe-1',
                salleId: 'salle-1',
                heureDebut: '10:00',
                heureFin: '10:55',
                affectationMatiere: { coEnseignantIds: [] },
            },
        ]));

        await expect(
            service.update('hc-1', { heureDebut: '10:30', heureFin: '11:25' }, 'user-1', 'etab-1'),
        ).rejects.toMatchObject({ statusCode: 409, code: 'CRENEAU_CONFLIT' });
        expect(mockRepo.save).not.toHaveBeenCalled();
    });
});
