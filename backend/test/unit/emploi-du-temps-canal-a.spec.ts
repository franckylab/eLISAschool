/**
 * ==================================
 * eLISAschool - Tests unitaires Canal A (Q7) : validation créneaux → matérialisation
 * ==================================
 * Couvre : validerCreneau (flag true → matérialise, flag false → non, statut
 * invalide → 400) + validerCreneauxClasse (idsAuto seulement, filtre classe).
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

const mockMaterialiserSemainesCourantes = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn(() => mockRepo),
    },
}));

jest.mock('@modules/personnel/services', () => ({
    heureCoursService: {
        materialiserSemainesCourantes: (...args: unknown[]) => mockMaterialiserSemainesCourantes(...args),
    },
}));

jest.mock('@modules/emploi-du-temps/services/conflit-detection.service', () => ({
    conflitDetectionService: {},
}));

jest.mock('@modules/matieres/services/coefficient-resolver.service', () => ({
    coefficientResolverService: {},
}));

jest.mock('@modules/salles/services/salle-availability.service', () => ({
    salleAvailabilityService: {},
}));

jest.mock('@modules/auth/services/audit.service', () => ({
    auditService: { log: jest.fn() },
}));

jest.mock('@modules/configuration/services/configuration.service', () => ({
    configurationService: {},
}));

import { EmploiDuTempsService } from '../../src/modules/emploi-du-temps/services/emploi-du-temps.service';

const matSem = mockMaterialiserSemainesCourantes;

const creneau = (overrides: Record<string, any> = {}) => ({
    id: 'creneau-1',
    etablissementId: 'etab-1',
    statut: 'PLANIFIE',
    genereAutomatiquement: true,
    affectationMatiere: { classeAnneeId: 'classe-1' },
    ...overrides,
});

describe('EmploiDuTempsService.validerCreneau (Canal A)', () => {
    let service: EmploiDuTempsService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new EmploiDuTempsService();
        mockRepo.save.mockImplementation((data: any) => ({ ...data }));
        matSem.mockResolvedValue({ created: 2, skipped: 0 });
    });

    it('valide un créneau PLANIFIE flag=true et matérialise ses instances', async () => {
        mockRepo.findOne.mockResolvedValue(creneau());

        const resultat = await service.validerCreneau('creneau-1', 'etab-1');

        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'creneau-1', statut: 'VALIDE' }),
        );
        expect(matSem).toHaveBeenCalledWith({
            etablissementId: 'etab-1',
            creneauIds: ['creneau-1'],
        });
        expect(resultat.id).toBe('creneau-1');
    });

    it('valide un créneau flag=false SANS matérialiser', async () => {
        mockRepo.findOne.mockResolvedValue(creneau({ genereAutomatiquement: false }));

        const resultat = await service.validerCreneau('creneau-1', 'etab-1');

        expect(mockRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'creneau-1', statut: 'VALIDE' }),
        );
        expect(matSem).not.toHaveBeenCalled();
        expect(resultat.id).toBe('creneau-1');
    });

    it('rejette un créneau déjà validé (400 STATUT_INVALIDE)', async () => {
        mockRepo.findOne.mockResolvedValue(creneau({ statut: 'VALIDE' }));

        await expect(service.validerCreneau('creneau-1', 'etab-1')).rejects.toMatchObject({
            statusCode: 400,
            code: 'STATUT_INVALIDE',
        });
        expect(mockRepo.save).not.toHaveBeenCalled();
        expect(matSem).not.toHaveBeenCalled();
    });
});

describe('EmploiDuTempsService.validerCreneauxClasse (Canal A)', () => {
    let service: EmploiDuTempsService;

    const updateQb = () => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 2 }),
    });

    beforeEach(() => {
        jest.clearAllMocks();
        service = new EmploiDuTempsService();
        matSem.mockResolvedValue({ created: 1, skipped: 0 });
    });

    it('valide les créneaux de la classe et matérialise uniquement les flag-auto', async () => {
        const qb = updateQb();
        mockRepo.createQueryBuilder.mockReturnValue(qb);
        mockRepo.find.mockResolvedValue([
            creneau({ id: 'c-flag', affectationMatiere: { classeAnneeId: 'classe-1' } }),
            creneau({ id: 'c-manuel', genereAutomatiquement: false, affectationMatiere: { classeAnneeId: 'classe-1' } }),
            creneau({ id: 'c-autre-classe', affectationMatiere: { classeAnneeId: 'classe-2' } }),
        ]);

        const resultat = await service.validerCreneauxClasse('classe-1', 'etab-1');

        expect(resultat).toEqual({ valide: 2, total: 2 });
        expect(qb.execute).toHaveBeenCalledTimes(1);
        expect(qb.whereInIds).toHaveBeenCalledWith(['c-flag', 'c-manuel']);
        expect(matSem).toHaveBeenCalledWith({
            etablissementId: 'etab-1',
            creneauIds: ['c-flag'],
            classeAnneeId: 'classe-1',
        });
    });

    it('retourne 0/0 sans rien faire quand aucun créneau de la classe', async () => {
        mockRepo.find.mockResolvedValue([
            creneau({ id: 'c-autre', affectationMatiere: { classeAnneeId: 'classe-2' } }),
        ]);

        const resultat = await service.validerCreneauxClasse('classe-1', 'etab-1');

        expect(resultat).toEqual({ valide: 0, total: 0 });
        expect(mockRepo.createQueryBuilder).not.toHaveBeenCalled();
        expect(matSem).not.toHaveBeenCalled();
    });
});
