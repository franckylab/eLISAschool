/**
 * ==================================
 * eLISAschool - Tests unitaires matérialisation HeureCours (Q7)
 * ==================================
 * Couvre : materialiserInstances (flag auto, plage multi-semaines,
 * anti-doublon, conflit enseignant, affectation incomplète)
 * + materialiserSemainesCourantes (clamp année EN_COURS, tri DESC,
 * délégation respecterFlagAuto).
 */

import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

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
    conflitDetectionService: {},
}));

import { HeureCoursService } from '../../src/modules/personnel/services/heure-cours.service';

// Helpers
const isoLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const slot = (overrides: Record<string, any> = {}) => ({
    id: 'slot-1',
    jour: 'MARDI',
    heureDebut: '10:00',
    heureFin: '10:55',
    typeCreneau: 'COURS',
    salleId: null,
    statut: 'VALIDE',
    genereAutomatiquement: true,
    affectationMatiere: {
        enseignantId: 'ens-1',
        classeAnneeId: 'classe-1',
        matiereId: 'mat-1',
    },
    ...overrides,
});

const qbMock = (getManyResult: any[] = [], getCountResult = 0) => {
    const qb: Record<string, jest.Mock> = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(getManyResult),
        getCount: jest.fn().mockResolvedValue(getCountResult),
    };
    return qb as any;
};

describe('HeureCoursService.materialiserInstances', () => {
    let service: HeureCoursService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new HeureCoursService();
        mockRepo.create.mockImplementation((data: any) => ({ ...data }));
    });

    it('ignore les créneaux non-flag quand respecterFlagAuto=true', async () => {
        const qb = qbMock([]);
        mockRepo.createQueryBuilder.mockReturnValue(qb);

        await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-16',
            respecterFlagAuto: true,
        });

        expect(qb.andWhere).toHaveBeenCalledWith('e.genereAutomatiquement = true');
        expect(qb.andWhere).toHaveBeenCalledWith('e.statut = :statut', { statut: 'VALIDE' });
    });

    it('matérialise une instance par occurrence du jour dans la plage (2 semaines → 2 instances)', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([slot()]));

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-16',
        });

        expect(result).toEqual({ created: 2, skipped: 0 });
        expect(mockRepo.create).toHaveBeenCalledTimes(2);
        const created1 = mockRepo.create.mock.calls[0][0] as any;
        expect(isoLocal(created1.date)).toBe('2026-08-04');
        expect(created1).toMatchObject({
            enseignantId: 'ens-1',
            classeAnneeId: 'classe-1',
            matiereId: 'mat-1',
            creneauId: 'slot-1',
            heureDebut: '10:00',
            heureFin: '10:55',
            typeCreneau: 'COURS',
            statutEffectue: 'PLANIFIE',
            etablissementId: 'etab-1',
        });
        expect(mockRepo.save).toHaveBeenCalledTimes(2);
    });

    it('ne matérialise pas les dates hors plage (occurrence S+2 ignorée)', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([slot()]));

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-09',
        });

        expect(result).toEqual({ created: 1, skipped: 0 });
    });

    it('anti-doublon : skip quand une instance identique existe déjà', async () => {
        mockRepo.findOne.mockResolvedValue({ id: 'hc-exist' });
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([slot()]));

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-09',
        });

        expect(result).toEqual({ created: 0, skipped: 1 });
        expect(mockRepo.create).not.toHaveBeenCalled();
        expect(mockRepo.findOne).toHaveBeenCalledWith({
            where: {
                enseignantId: 'ens-1',
                date: expect.any(Date),
                heureDebut: '10:00',
                creneauId: 'slot-1',
            },
        });
    });

    it('conflit enseignant : skip le créneau quand l\'enseignant est occupé', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([slot()], 1));

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-09',
        });

        expect(result).toEqual({ created: 0, skipped: 1 });
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('skip quand l\'affectation est incomplète (classe manquante)', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.createQueryBuilder.mockReturnValue(
            qbMock([slot({ affectationMatiere: { enseignantId: 'ens-1', matiereId: 'mat-1' } })]),
        );

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-09',
        });

        expect(result).toEqual({ created: 0, skipped: 1 });
        expect(mockRepo.save).not.toHaveBeenCalled();
    });

    it('aucun créneau matérialisable → 0/0', async () => {
        mockRepo.createQueryBuilder.mockReturnValue(qbMock([]));

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-16',
        });

        expect(result).toEqual({ created: 0, skipped: 0 });
    });

    it('crée une instance par créneau présent (2 créneaux → 4 instances sur 2 semaines)', async () => {
        mockRepo.findOne.mockResolvedValue(null);
        mockRepo.createQueryBuilder.mockReturnValue(
            qbMock([slot(), slot({ id: 'slot-2', jour: 'JEUDI' })]),
        );

        const result = await service.materialiserInstances({
            etablissementId: 'etab-1',
            dateDebut: '2026-08-03',
            dateFin: '2026-08-16',
        });

        expect(result).toEqual({ created: 4, skipped: 0 });
    });
});

describe('HeureCoursService.materialiserSemainesCourantes', () => {
    let service: HeureCoursService;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-08-03T10:00:00Z'));
        service = new HeureCoursService();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('ignore proprement quand la plage est hors année scolaire', async () => {
        const spy = jest.spyOn(service, 'materialiserInstances');
        mockRepo.findOne.mockResolvedValue({
            dateDebut: '2025-09-01',
            dateFin: '2026-07-31',
        });

        const result = await service.materialiserSemainesCourantes({ etablissementId: 'etab-1' });

        expect(result).toEqual({ created: 0, skipped: 0 });
        expect(spy).not.toHaveBeenCalled();
    });

    it('délègue à materialiserInstances avec respecterFlagAuto:true et plage S→S+1', async () => {
        const spy = jest.spyOn(service, 'materialiserInstances').mockResolvedValue({ created: 2, skipped: 0 });
        mockRepo.findOne.mockResolvedValue({
            dateDebut: '2025-09-01',
            dateFin: '2026-08-31',
        });

        const result = await service.materialiserSemainesCourantes({ etablissementId: 'etab-1' });

        expect(result).toEqual({ created: 2, skipped: 0 });
        expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
                etablissementId: 'etab-1',
                respecterFlagAuto: true,
                dateDebut: expect.any(Date),
                dateFin: expect.any(Date),
            }),
        );
        const { dateDebut, dateFin } = spy.mock.calls[0][0] as any;
        expect(isoLocal(dateDebut)).toBe('2026-08-03');
        expect(isoLocal(dateFin)).toBe('2026-08-16');
    });

    it('clamp la fin de plage aux bornes de l\'année', async () => {
        const spy = jest.spyOn(service, 'materialiserInstances').mockResolvedValue({ created: 1, skipped: 0 });
        mockRepo.findOne.mockResolvedValue({
            dateDebut: '2025-09-01',
            dateFin: '2026-08-10',
        });

        await service.materialiserSemainesCourantes({ etablissementId: 'etab-1' });

        const { dateFin } = spy.mock.calls[0][0] as any;
        expect(isoLocal(dateFin)).toBe('2026-08-10');
    });

    it('cherche l\'année EN_COURS avec tri dateDebut DESC (garde doublons)', async () => {
        const spy = jest.spyOn(service, 'materialiserInstances').mockResolvedValue({ created: 0, skipped: 0 });
        mockRepo.findOne.mockResolvedValue({
            dateDebut: '2025-09-01',
            dateFin: '2026-08-31',
        });

        await service.materialiserSemainesCourantes({ etablissementId: 'etab-1' });

        expect(mockRepo.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: [
                    { etablissementId: 'etab-1', enCours: true },
                    { etablissementId: 'etab-1', statut: 'EN_COURS' },
                ],
                order: { dateDebut: 'DESC' },
            }),
        );
        expect(spy).toHaveBeenCalled();
    });
});
