/**
 * ==================================
 * eLISAschool - Tests unitaires — MembershipService
 * ==================================
 *
 * Gestion des memberships (pivot identité × contexte).
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// =============================================
// Mocks
// =============================================

const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockCreate = jest.fn();
const mockSave = jest.fn();

const mockIdentiteFindOne = jest.fn();
const mockPermissionFind = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('membership')) {
                return {
                    find: mockFind,
                    findOne: mockFindOne,
                    create: mockCreate,
                    save: mockSave,
                };
            }
            if (name.includes('identite')) {
                return { findOne: mockIdentiteFindOne };
            }
            if (name.includes('permission')) {
                return { find: mockPermissionFind };
            }
            if (name.includes('utilisateur_plateforme') || name.includes('utilisateur-plateforme')) {
                return { find: jest.fn().mockResolvedValue([]) };
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

import { MembershipService } from '@modules/identite/services/membership.service';

describe('MembershipService', () => {
    let service: MembershipService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new MembershipService();
    });

    // =============================================
    // findByIdentite
    // =============================================
    describe('findByIdentite', () => {
        it('should return all memberships for an identity', async () => {
            const memberships = [
                { id: 'm1', identiteId: 'id-1', contexteType: 'PLATEFORME', role: 'SUPER_ADMIN' },
                { id: 'm2', identiteId: 'id-1', contexteType: 'ETABLISSEMENT', contexteId: 'etab-1', role: 'ADMIN' },
            ];
            mockFind.mockResolvedValue(memberships);

            const result = await service.findByIdentite('id-1');

            expect(result).toHaveLength(2);
            expect(result[0].contexteType).toBe('PLATEFORME');
            expect(result[1].contexteType).toBe('ETABLISSEMENT');
        });

        it('should return empty array for identity with no memberships', async () => {
            mockFind.mockResolvedValue([]);

            const result = await service.findByIdentite('id-no-memberships');

            expect(result).toEqual([]);
        });
    });

    // =============================================
    // findByContexte
    // =============================================
    describe('findByContexte', () => {
        it('should return all members of a contexte (PLATEFORME)', async () => {
            const members = [
                { id: 'm1', contexteType: 'PLATEFORME', role: 'SUPER_ADMIN' },
                { id: 'm2', contexteType: 'PLATEFORME', role: 'SUPPORT' },
            ];
            mockFind.mockResolvedValue(members);

            const result = await service.findByContexte('PLATEFORME' as any);

            expect(result).toHaveLength(2);
        });

        it('should return members of a specific etablissement', async () => {
            const members = [
                { id: 'm1', contexteType: 'ETABLISSEMENT', contexteId: 'etab-1', role: 'ADMIN' },
            ];
            mockFind.mockResolvedValue(members);

            const result = await service.findByContexte('ETABLISSEMENT' as any, 'etab-1');

            expect(result).toHaveLength(1);
            expect(result[0].contexteId).toBe('etab-1');
        });
    });

    // =============================================
    // assignRole
    // =============================================
    describe('assignRole', () => {
        it('should create a new membership if none exists', async () => {
            mockIdentiteFindOne.mockResolvedValue({ id: 'id-1', email: 'test@test.com' });
            mockFindOne.mockResolvedValue(null); // Pas de membership existant

            const created = {
                id: 'm-new',
                identiteId: 'id-1',
                contexteType: 'PLATEFORME',
                role: 'SUPPORT',
                estActif: true,
            };
            mockCreate.mockReturnValue(created);
            mockSave.mockResolvedValue(created);

            const result = await service.assignRole('id-1', 'PLATEFORME' as any, null, 'SUPPORT');

            expect(result.role).toBe('SUPPORT');
            expect(result.estActif).toBe(true);
            expect(mockCreate).toHaveBeenCalled();
        });

        it('should update existing membership (upsert)', async () => {
            mockIdentiteFindOne.mockResolvedValue({ id: 'id-1', email: 'test@test.com' });

            const existing = {
                id: 'm-existing',
                identiteId: 'id-1',
                contexteType: 'PLATEFORME',
                role: 'SUPPORT',
                estActif: true,
            };
            mockFindOne.mockResolvedValue(existing);

            const updated = { ...existing, role: 'ADMIN_PLATEFORME' };
            mockSave.mockResolvedValue(updated);

            const result = await service.assignRole('id-1', 'PLATEFORME' as any, null, 'ADMIN_PLATEFORME');

            expect(result.role).toBe('ADMIN_PLATEFORME');
        });

        it('should throw if identity not found', async () => {
            mockIdentiteFindOne.mockResolvedValue(null);

            await expect(
                service.assignRole('id-inconnu', 'PLATEFORME' as any, null, 'SUPPORT'),
            ).rejects.toThrow('Identité non trouvée');
        });
    });

    // =============================================
    // revokeMembership
    // =============================================
    describe('revokeMembership', () => {
        it('should set estActif to false', async () => {
            const membership = { id: 'm1', estActif: true, role: 'SUPPORT' };
            mockFindOne.mockResolvedValue(membership);
            mockSave.mockResolvedValue({ ...membership, estActif: false });

            const result = await service.revokeMembership('m1');

            expect(result.success).toBe(true);
            expect(mockSave).toHaveBeenCalledWith(expect.objectContaining({ estActif: false }));
        });

        it('should throw if membership not found', async () => {
            mockFindOne.mockResolvedValue(null);

            await expect(service.revokeMembership('m-inconnu')).rejects.toThrow('Membership non trouvé');
        });
    });

    // =============================================
    // resolvePermissions
    // =============================================
    describe('resolvePermissions', () => {
        it('should return custom permissions from membership', async () => {
            const membership = {
                id: 'm1',
                role: 'SUPPORT',
                permissionsCustom: {
                    'platform:dashboard:view': true,
                    'platform:users:read': true,
                    'platform:audit:export': false,
                },
            };

            const result = await service.resolvePermissions(membership as any);

            expect(result).toContain('platform:dashboard:view');
            expect(result).toContain('platform:users:read');
            expect(result).not.toContain('platform:audit:export');
        });

        it('should return empty array when no custom permissions', async () => {
            const membership = { id: 'm1', role: 'SUPPORT', permissionsCustom: null };

            const result = await service.resolvePermissions(membership as any);

            expect(result).toEqual([]);
        });
    });

    // =============================================
    // findPlatformMembers
    // =============================================
    describe('findPlatformMembers', () => {
        it('should return active platform memberships', async () => {
            const members = [
                { id: 'm1', contexteType: 'PLATEFORME', role: 'SUPER_ADMIN', estActif: true },
                { id: 'm2', contexteType: 'PLATEFORME', role: 'SUPPORT', estActif: true },
            ];
            mockFind.mockResolvedValue(members);

            const result = await service.findPlatformMembers();

            expect(result).toHaveLength(2);
            expect(result.every((m: any) => m.contexteType === 'PLATEFORME')).toBe(true);
        });
    });

    // =============================================
    // findEtablissementMembers
    // =============================================
    describe('findEtablissementMembers', () => {
        it('should return active members for a specific etablissement', async () => {
            const members = [
                { id: 'm1', contexteType: 'ETABLISSEMENT', contexteId: 'etab-1', role: 'ADMIN', estActif: true },
            ];
            mockFind.mockResolvedValue(members);

            const result = await service.findEtablissementMembers('etab-1');

            expect(result).toHaveLength(1);
            expect(result[0].contexteId).toBe('etab-1');
        });
    });

    // =============================================
    // Multi-membership scenarios
    // =============================================
    describe('Multi-membership scenarios', () => {
        it('should handle identity with both platform and tenant memberships', async () => {
            const memberships = [
                { id: 'm1', identiteId: 'id-1', contexteType: 'PLATEFORME', role: 'ADMIN_PLATEFORME' },
                { id: 'm2', identiteId: 'id-1', contexteType: 'ETABLISSEMENT', contexteId: 'etab-1', role: 'ADMIN' },
                { id: 'm3', identiteId: 'id-1', contexteType: 'ETABLISSEMENT', contexteId: 'etab-2', role: 'DIRECTEUR' },
            ];
            mockFind.mockResolvedValue(memberships);

            const result = await service.findByIdentite('id-1');

            expect(result).toHaveLength(3);
            const platform = result.filter(m => m.contexteType === 'PLATEFORME');
            const etablissements = result.filter(m => m.contexteType === 'ETABLISSEMENT');
            expect(platform).toHaveLength(1);
            expect(etablissements).toHaveLength(2);
        });
    });
});
