import { describe, it, expect, beforeEach, jest } from '@jest/globals';

jest.mock('@database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => ({
      query: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
      })),
      count: jest.fn(),
      remove: jest.fn(),
    })),
  },
}));

import { FonctionsService } from '../../src/modules/fonctions/services/fonctions.service';

describe('FonctionsService — détection de cycles arborescence', () => {
  let service: FonctionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FonctionsService();
  });

  it('devrait détecter un cycle via CTE récursif et lancer CYCLE_DETECTED', async () => {
    const repo = (service as any).repo;

    repo.findOne
      .mockResolvedValueOnce({ id: 'func-1', parentId: null, etablissementId: 'etab-1', niveau: 0, chemin: 'func-1', nom: 'Test', code: 'T1', actif: true, ordre: 1 })
      .mockResolvedValueOnce({ id: 'parent-2', parentId: null, etablissementId: 'etab-1', niveau: 2, nom: 'Parent', code: 'P2', actif: true, ordre: 1 });
    repo.query.mockResolvedValue([{ cnt: 1 }]);

    await expect(service.update('func-1', { parentId: 'parent-2' } as any, 'etab-1'))
      .rejects.toThrow('le parent choisi est un descendant');
  });

  it('devrait autoriser un parent valide (pas de cycle)', async () => {
    const repo = (service as any).repo;

    repo.findOne
      .mockResolvedValueOnce({ id: 'func-1', parentId: null, etablissementId: 'etab-1', niveau: 0, chemin: 'func-1', nom: 'Test', code: 'T1', actif: true, ordre: 1 })
      .mockResolvedValueOnce({ id: 'parent-2', parentId: null, etablissementId: 'etab-1', niveau: 2, nom: 'Parent', code: 'P2', actif: true, ordre: 1 });
    repo.query.mockResolvedValue([{ cnt: 0 }]);
    repo.save.mockImplementation((f: any) => Promise.resolve({ ...f, parentId: 'parent-2' }));

    const result = await service.update('func-1', { parentId: 'parent-2' } as any, 'etab-1');
    expect(result.parentId).toBe('parent-2');
  });

  it('devrait rejeter un self-parent', async () => {
    const repo = (service as any).repo;

    repo.findOne.mockResolvedValue({ id: 'func-1', parentId: null, etablissementId: 'etab-1', niveau: 0, chemin: 'func-1', nom: 'Test', code: 'T1', actif: true, ordre: 1 });

    await expect(service.update('func-1', { parentId: 'func-1' } as any, 'etab-1'))
      .rejects.toThrow('ne peut pas être son propre parent');
  });

  it('devrait réinitialiser niveau et chemin quand parentId est null', async () => {
    const repo = (service as any).repo;

    repo.findOne.mockResolvedValue({ id: 'func-1', parentId: 'old-parent', etablissementId: 'etab-1', niveau: 3, chemin: 'old-parent/func-1', nom: 'Test', code: 'T1', actif: true, ordre: 1 });
    repo.save.mockImplementation((f: any) => Promise.resolve(f));

    await service.update('func-1', { parentId: null } as any, 'etab-1');
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ niveau: 0, parentId: null })
    );
  });
});
