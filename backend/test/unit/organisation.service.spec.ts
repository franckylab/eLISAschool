import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      query: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      })),
    })),
  },
}));

jest.mock('@common/services/redis.service', () => ({
  redisService: {
    isAvailable: jest.fn().mockRejectedValue('No Redis'),
    getJSON: jest.fn(),
    setJSON: jest.fn(),
    del: jest.fn(),
  },
}));

import { OrganisationService } from '../../src/modules/organisation/services/organisation.service';

const buildUnite = (overrides = {}) => ({
  id: 'unit-1',
  nom: 'Direction',
  code: 'DIR',
  description: 'Direction générale',
  type: 'SERVICE',
  etablissementId: 'etab-1',
  parentId: null,
  ordre: 1,
  actif: true,
  statut: 'ACTIF',
  responsableNom: null,
  responsableId: null,
  localisation: null,
  telephone: null,
  email: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('OrganisationService — détection de cycles dans unités', () => {
  let service: OrganisationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrganisationService();
  });

  it('devrait détecter un cycle via CTE récursif et lancer CYCLE_DETECTED', async () => {
    const repo = (service as any).uniteRepo;
    const existing = buildUnite({ id: 'unit-1', parentId: null });
    const parent = buildUnite({ id: 'parent-2', nom: 'Parent', code: 'PRT' });

    repo.findOne
      .mockResolvedValueOnce(existing)   // findUniteById('unit-1')
      .mockResolvedValueOnce(parent);    // vérification parent
    repo.query.mockResolvedValue([{ cnt: 1 }]); // CTE détecte cycle

    await expect(service.updateUnite('unit-1', { parentId: 'parent-2' } as any))
      .rejects.toThrow('le parent choisi est un descendant');
  });

  it('devrait autoriser un parent valide (pas de cycle)', async () => {
    const repo = (service as any).uniteRepo;
    const existing = buildUnite({ id: 'unit-1', parentId: null });
    const parent = buildUnite({ id: 'parent-2', nom: 'Parent', code: 'PRT' });

    repo.findOne
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(parent);
    repo.query.mockResolvedValue([{ cnt: 0 }]); // pas de cycle
    repo.save.mockImplementation((u: any) => Promise.resolve({ ...u, parentId: 'parent-2' }));

    const result = await service.updateUnite('unit-1', { parentId: 'parent-2' } as any);
    expect(result.parentId).toBe('parent-2');
  });

  it('devrait rejeter un self-parent', async () => {
    const repo = (service as any).uniteRepo;
    repo.findOne.mockResolvedValue(buildUnite({ id: 'unit-1' }));

    await expect(service.updateUnite('unit-1', { parentId: 'unit-1' } as any))
      .rejects.toThrow('ne peut pas être son propre parent');
  });

  it('devrait passer en root quand parentId est null dans update', async () => {
    const repo = (service as any).uniteRepo;
    repo.findOne.mockResolvedValue(buildUnite({ id: 'unit-1', parentId: 'old-parent' }));
    repo.save.mockImplementation((u: any) => Promise.resolve(u));

    await service.updateUnite('unit-1', { parentId: null } as any);
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ parentId: null })
    );
  });
});
