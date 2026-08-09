/**
 * ==================================
 * eLISAschool - Tests unitaires — IdentiteService
 * ==================================
 *
 * CRUD identité globale (source unique de vérité).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// =============================================
// Mocks
// =============================================

const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockUpdate = jest.fn();
const mockCount = jest.fn();
const mockCreateQueryBuilder = jest.fn();

const mockMembershipFind = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('identite')) {
                return {
                    findOne: mockFindOne,
                    find: mockFind,
                    create: mockCreate,
                    save: mockSave,
                    remove: mockRemove,
                    update: mockUpdate,
                    count: mockCount,
                    createQueryBuilder: mockCreateQueryBuilder,
                };
            }
            if (name.includes('utilisateur_plateforme') || name.includes('utilisateur-plateforme')) {
                return { find: jest.fn().mockResolvedValue([]) };
            }
            if (name.includes('membership')) {
                return { find: mockMembershipFind };
            }
            return {
                find: jest.fn().mockResolvedValue([]),
                findOne: jest.fn().mockResolvedValue(null),
                create: jest.fn(),
                save: jest.fn(),
            };
        }),
    },
}));

jest.mock('@common/filters/error.filter', () => ({
    AppError: class AppError extends Error {
        constructor(message: string, public statusCode: number, public code: string) {
            super(message);
            this.name = 'AppError';
        }
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Import après les mocks
import { IdentiteService } from '@modules/identite/services/identite.service';

describe('IdentiteService', () => {
    let service: IdentiteService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new IdentiteService();
    });

    // =============================================
    // findByEmail
    // =============================================
    describe('findByEmail', () => {
        it('should return an identity when email exists', async () => {
            const identite = { id: 'uuid-1', email: 'test@elisaschool.com', statut: 'ACTIF' };
            mockFindOne.mockResolvedValue(identite);

            const result = await service.findByEmail('test@elisaschool.com');

            expect(result).toEqual(identite);
            expect(mockFindOne).toHaveBeenCalledWith({ where: { email: 'test@elisaschool.com' } });
        });

        it('should return null when email does not exist', async () => {
            mockFindOne.mockResolvedValue(null);

            const result = await service.findByEmail('inconnu@elisaschool.com');

            expect(result).toBeNull();
        });
    });

    // =============================================
    // findById
    // =============================================
    describe('findById', () => {
        it('should return an identity with relations', async () => {
            const identite = {
                id: 'uuid-1',
                email: 'test@elisaschool.com',
                memberships: [{ id: 'm1', role: 'SUPER_ADMIN' }],
                utilisateurPlateforme: [{ id: 'up1' }],
            };
            mockFindOne.mockResolvedValue(identite);

            const result = await service.findById('uuid-1');

            expect(result).toEqual(identite);
            expect(mockFindOne).toHaveBeenCalledWith({
                where: { id: 'uuid-1' },
                relations: ['utilisateurPlateforme', 'memberships'],
            });
        });
    });

    // =============================================
    // create
    // =============================================
    describe('create', () => {
        it('should create an identity successfully', async () => {
            const data = { email: 'new@elisaschool.com', motDePasse: 'secure123' };
            const created = { id: 'uuid-new', ...data, statut: 'ACTIF', emailVerifie: false, mfaActive: false };

            mockFindOne.mockResolvedValue(null); // Pas de doublon
            mockCreate.mockReturnValue(created);
            mockSave.mockResolvedValue(created);

            const result = await service.create(data);

            expect(result.email).toBe('new@elisaschool.com');
            expect(mockCreate).toHaveBeenCalled();
            expect(mockSave).toHaveBeenCalled();
        });

        it('should throw if email already exists', async () => {
            mockFindOne.mockResolvedValue({ id: 'existing', email: 'exists@elisaschool.com' });

            await expect(
                service.create({ email: 'exists@elisaschool.com', motDePasse: 'test' }),
            ).rejects.toThrow('Email déjà utilisé');
        });
    });

    // =============================================
    // update
    // =============================================
    describe('update', () => {
        it('should update an existing identity', async () => {
            const existing = { id: 'uuid-1', email: 'old@elisaschool.com', statut: 'ACTIF' };
            mockFindOne
                .mockResolvedValueOnce(existing) // Trouver l'identité
                .mockResolvedValueOnce(null); // Vérifier unicité du nouveau email

            const updated = { ...existing, email: 'new@elisaschool.com' };
            mockSave.mockResolvedValue(updated);

            const result = await service.update('uuid-1', { email: 'new@elisaschool.com' });

            expect(result.email).toBe('new@elisaschool.com');
        });

        it('should throw if identity not found', async () => {
            mockFindOne.mockResolvedValue(null);

            await expect(
                service.update('uuid-inconnu', { email: 'test@test.com' }),
            ).rejects.toThrow('Identité non trouvée');
        });

        it('should throw if new email already exists', async () => {
            const existing = { id: 'uuid-1', email: 'old@elisaschool.com' };
            mockFindOne
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce({ id: 'other', email: 'taken@elisaschool.com' });

            await expect(
                service.update('uuid-1', { email: 'taken@elisaschool.com' }),
            ).rejects.toThrow('Email déjà utilisé');
        });
    });

    // =============================================
    // verifyEmail
    // =============================================
    describe('verifyEmail', () => {
        it('should set emailVerifie to true', async () => {
            const existing = { id: 'uuid-1', email: 'test@elisaschool.com', emailVerifie: false };
            mockFindOne
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce(null);

            const verified = { ...existing, emailVerifie: true };
            mockSave.mockResolvedValue(verified);

            const result = await service.verifyEmail('uuid-1');

            expect(result.emailVerifie).toBe(true);
        });
    });

    // =============================================
    // updateLastLogin
    // =============================================
    describe('updateLastLogin', () => {
        it('should call repo.update with derniereConnexion', async () => {
            await service.updateLastLogin('uuid-1');

            expect(mockUpdate).toHaveBeenCalledWith('uuid-1', expect.objectContaining({
                derniereConnexion: expect.any(Date),
            }));
        });
    });

    // =============================================
    // delete
    // =============================================
    describe('delete', () => {
        it('should delete identity when no active memberships', async () => {
            const identite = {
                id: 'uuid-1',
                email: 'test@elisaschool.com',
                memberships: [{ id: 'm1', estActif: false }],
            };
            mockFindOne.mockResolvedValue(identite);
            mockRemove.mockResolvedValue(identite);

            const result = await service.delete('uuid-1');

            expect(result.success).toBe(true);
            expect(mockRemove).toHaveBeenCalledWith(identite);
        });

        it('should throw if active memberships exist', async () => {
            const identite = {
                id: 'uuid-1',
                email: 'test@elisaschool.com',
                memberships: [{ id: 'm1', estActif: true }],
            };
            mockFindOne.mockResolvedValue(identite);

            await expect(service.delete('uuid-1')).rejects.toThrow('Impossible de supprimer');
        });

        it('should throw if identity not found', async () => {
            mockFindOne.mockResolvedValue(null);

            await expect(service.delete('uuid-inconnu')).rejects.toThrow('Identité non trouvée');
        });
    });
});
