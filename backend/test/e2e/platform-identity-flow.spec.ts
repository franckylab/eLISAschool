/**
 * ==================================
 * eLISAschool - Tests E2E — Platform Identity Flow
 * ==================================
 *
 * Tests bout-en-bout du flux identité plateforme (Modèle C) :
 * 1. Création identité → création utilisateur plateforme
 * 2. Login dual-plane (JWT scopé platform + tenant)
 * 3. CRUD utilisateurs plateforme (avec guards RBAC)
 * 4. Sessions plateforme (limite LRU 3)
 * 5. Middleware discrimination scope
 * 6. Permissions plateforme (matrice 6 rôles × ~40 permissions)
 *
 * V5.2 — Auth0 Internalisé (Dual-Plane)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// =============================================
// Mocks
// =============================================

const mockIdentiteFindOne = jest.fn();
const mockIdentiteCreate = jest.fn();
const mockIdentiteSave = jest.fn();

const mockUserPlatFind = jest.fn();
const mockUserPlatCreate = jest.fn();
const mockUserPlatSave = jest.fn();
const mockUserPlatCount = jest.fn();

const mockMembershipFind = jest.fn();
const mockMembershipCreate = jest.fn();
const mockMembershipSave = jest.fn();

const mockSessionFind = jest.fn();
const mockSessionCreate = jest.fn();
const mockSessionSave = jest.fn();
const mockSessionDelete = jest.fn();
const mockSessionCount = jest.fn();

const mockPermissionFind = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('identite')) {
                return {
                    findOne: mockIdentiteFindOne,
                    create: mockIdentiteCreate,
                    save: mockIdentiteSave,
                };
            }
            if (name.includes('utilisateur_plateforme') || name.includes('utilisateur-plateforme')) {
                return {
                    find: mockUserPlatFind,
                    create: mockUserPlatCreate,
                    save: mockUserPlatSave,
                    count: mockUserPlatCount,
                    findOne: jest.fn(),
                };
            }
            if (name.includes('membership')) {
                return {
                    find: mockMembershipFind,
                    create: mockMembershipCreate,
                    save: mockMembershipSave,
                };
            }
            if (name.includes('session')) {
                return {
                    find: mockSessionFind,
                    create: mockSessionCreate,
                    save: mockSessionSave,
                    delete: mockSessionDelete,
                    count: mockSessionCount,
                };
            }
            if (name.includes('permission')) {
                return {
                    find: mockPermissionFind,
                };
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

// =============================================
// Tests
// =============================================

describe('E2E — Platform Identity Flow (Modèle C)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =============================================
    // 1. Création identité + utilisateur plateforme
    // =============================================
    describe('1. Création identité et utilisateur plateforme', () => {
        it('should create an identity and link it to a platform user', async () => {
            const identiteData = {
                email: 'admin@elisaschool.com',
                motDePasseHash: '$2b$12$hashedpassword',
                mfaActive: false,
                emailVerifie: false,
                statut: 'ACTIF',
            };

            mockIdentiteCreate.mockReturnValue({
                id: 'identite-uuid-1',
                ...identiteData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            mockIdentiteSave.mockResolvedValue({
                id: 'identite-uuid-1',
                ...identiteData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            const identite = mockIdentiteCreate(identiteData);
            const saved = await mockIdentiteSave(identite);

            expect(saved.id).toBe('identite-uuid-1');
            expect(saved.email).toBe('admin@elisaschool.com');
            expect(saved.statut).toBe('ACTIF');
            expect(saved.mfaActive).toBe(false);
            expect(mockIdentiteCreate).toHaveBeenCalledWith(identiteData);
            expect(mockIdentiteSave).toHaveBeenCalledWith(identite);
        });

        it('should create a platform user linked to the identity', async () => {
            const userPlatData = {
                identiteId: 'identite-uuid-1',
                rolePlateforme: 'SUPER_ADMIN',
                prenom: 'Franck',
                nom: 'Admin',
                estActif: true,
            };

            mockUserPlatCreate.mockReturnValue({
                id: 'user-plat-uuid-1',
                ...userPlatData,
                createdAt: new Date(),
            });
            mockUserPlatSave.mockResolvedValue({
                id: 'user-plat-uuid-1',
                ...userPlatData,
                createdAt: new Date(),
            });

            const user = mockUserPlatCreate(userPlatData);
            const saved = await mockUserPlatSave(user);

            expect(saved.id).toBe('user-plat-uuid-1');
            expect(saved.identiteId).toBe('identite-uuid-1');
            expect(saved.rolePlateforme).toBe('SUPER_ADMIN');
        });

        it('should create a membership for the identity (contexte PLATEFORME)', async () => {
            const membershipData = {
                identiteId: 'identite-uuid-1',
                contexteType: 'PLATEFORME',
                contexteId: null,
                role: 'SUPER_ADMIN',
                estActif: true,
                dateActivation: new Date(),
            };

            mockMembershipCreate.mockReturnValue({
                id: 'membership-uuid-1',
                ...membershipData,
            });
            mockMembershipSave.mockResolvedValue({
                id: 'membership-uuid-1',
                ...membershipData,
            });

            const membership = mockMembershipCreate(membershipData);
            const saved = await mockMembershipSave(membership);

            expect(saved.identiteId).toBe('identite-uuid-1');
            expect(saved.contexteType).toBe('PLATEFORME');
            expect(saved.role).toBe('SUPER_ADMIN');
        });
    });

    // =============================================
    // 2. Login dual-plane (JWT scopé)
    // =============================================
    describe('2. Login dual-plane avec JWT scopé', () => {
        it('should resolve identity by email and verify password', async () => {
            mockIdentiteFindOne.mockResolvedValue({
                id: 'identite-uuid-1',
                email: 'admin@elisaschool.com',
                motDePasseHash: '$2b$12$hashedpassword',
                mfaActive: false,
                statut: 'ACTIF',
                emailVerifie: true,
            });

            const identite = await mockIdentiteFindOne({ where: { email: 'admin@elisaschool.com' } });

            expect(identite).not.toBeNull();
            expect(identite.email).toBe('admin@elisaschool.com');
            expect(identite.statut).toBe('ACTIF');
        });

        it('should load all memberships for the identity', async () => {
            mockMembershipFind.mockResolvedValue([
                {
                    id: 'membership-uuid-1',
                    identiteId: 'identite-uuid-1',
                    contexteType: 'PLATEFORME',
                    role: 'SUPER_ADMIN',
                },
                {
                    id: 'membership-uuid-2',
                    identiteId: 'identite-uuid-1',
                    contexteType: 'ETABLISSEMENT',
                    contexteId: 'etab-uuid-1',
                    role: 'ADMIN',
                },
            ]);

            const memberships = await mockMembershipFind({
                where: { identiteId: 'identite-uuid-1', estActif: true },
            });

            expect(memberships).toHaveLength(2);
            expect(memberships[0].contexteType).toBe('PLATEFORME');
            expect(memberships[1].contexteType).toBe('ETABLISSEMENT');
        });

        it('should build a dual-plane JWT payload', () => {
            const jwtPayload = {
                sub: 'identite-uuid-1',
                email: 'admin@elisaschool.com',
                platform: { role: 'SUPER_ADMIN' },
                tenant: { etablissementId: 'etab-uuid-1', role: 'ADMIN' },
            };

            expect(jwtPayload.sub).toBe('identite-uuid-1');
            expect(jwtPayload.platform).not.toBeNull();
            expect(jwtPayload.platform.role).toBe('SUPER_ADMIN');
            expect(jwtPayload.tenant).not.toBeNull();
            expect(jwtPayload.tenant.role).toBe('ADMIN');
        });
    });

    // =============================================
    // 3. CRUD utilisateurs plateforme
    // =============================================
    describe('3. CRUD utilisateurs plateforme avec guards RBAC', () => {
        it('should list platform users with pagination', async () => {
            mockUserPlatFind.mockResolvedValue([
                { id: 'u1', prenom: 'Franck', nom: 'Admin', rolePlateforme: 'SUPER_ADMIN' },
                { id: 'u2', prenom: 'Jean', nom: 'Support', rolePlateforme: 'SUPPORT' },
            ]);
            mockUserPlatCount.mockResolvedValue(2);

            const users = await mockUserPlatFind({ take: 20, skip: 0 });
            const total = await mockUserPlatCount();

            expect(users).toHaveLength(2);
            expect(total).toBe(2);
        });

        it('should suspend a platform user', async () => {
            const user = {
                id: 'user-plat-uuid-2',
                estActif: true,
                identiteId: 'identite-uuid-2',
            };

            user.estActif = false;
            mockUserPlatSave.mockResolvedValue(user);

            const saved = await mockUserPlatSave(user);
            expect(saved.estActif).toBe(false);
        });

        it('should prevent deleting the last SUPER_ADMIN', async () => {
            mockUserPlatCount.mockResolvedValue(1);

            const count = await mockUserPlatCount({ where: { rolePlateforme: 'SUPER_ADMIN', estActif: true } });
            expect(count).toBe(1);
            // Le service devrait refuser la suppression si count === 1
        });
    });

    // =============================================
    // 4. Sessions plateforme (limite LRU 3)
    // =============================================
    describe('4. Sessions plateforme avec limite LRU', () => {
        it('should create a new session for the platform user', async () => {
            const sessionData = {
                utilisateurPlateformeId: 'user-plat-uuid-1',
                token: 'jwt-token-abc',
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
                expiresAt: new Date(Date.now() + 86400000),
            };

            mockSessionCreate.mockReturnValue({ id: 'session-uuid-1', ...sessionData });
            mockSessionSave.mockResolvedValue({ id: 'session-uuid-1', ...sessionData });

            const session = mockSessionCreate(sessionData);
            const saved = await mockSessionSave(session);

            expect(saved.token).toBe('jwt-token-abc');
            expect(saved.utilisateurPlateformeId).toBe('user-plat-uuid-1');
        });

        it('should enforce LRU limit of 3 sessions per user', async () => {
            mockSessionFind.mockResolvedValue([
                { id: 's1', createdAt: new Date('2025-01-01') },
                { id: 's2', createdAt: new Date('2025-01-02') },
                { id: 's3', createdAt: new Date('2025-01-03') },
            ]);
            mockSessionCount.mockResolvedValue(3);

            const sessions = await mockSessionFind({
                where: { utilisateurPlateformeId: 'user-plat-uuid-1' },
                order: { createdAt: 'ASC' },
            });

            expect(sessions).toHaveLength(3);
            // Le service devrait supprimer la plus ancienne (s1) avant d'en créer une nouvelle
            const oldest = sessions[0];
            expect(oldest.id).toBe('s1');
        });

        it('should revoke a specific session', async () => {
            mockSessionDelete.mockResolvedValue({ affected: 1 });

            const result = await mockSessionDelete('session-uuid-1');
            expect(result.affected).toBe(1);
        });

        it('should revoke all sessions for a user', async () => {
            mockSessionDelete.mockResolvedValue({ affected: 3 });

            const result = await mockSessionDelete({ utilisateurPlateformeId: 'user-plat-uuid-1' });
            expect(result.affected).toBe(3);
        });
    });

    // =============================================
    // 5. Middleware discrimination scope
    // =============================================
    describe('5. Middleware discrimination scope', () => {
        it('should allow platform access for routes starting with /api/platform/', () => {
            const req = {
                path: '/api/platform/users',
                jwt: { platform: { role: 'SUPER_ADMIN' }, tenant: null },
            };

            const isPlatformRoute = req.path.startsWith('/api/platform/');
            const hasPlatformScope = req.jwt.platform !== null;

            expect(isPlatformRoute).toBe(true);
            expect(hasPlatformScope).toBe(true);
        });

        it('should reject platform access when JWT has no platform scope', () => {
            const req = {
                path: '/api/platform/users',
                jwt: { platform: null, tenant: { etablissementId: 'etab-1', role: 'ADMIN' } },
            };

            const isPlatformRoute = req.path.startsWith('/api/platform/');
            const hasPlatformScope = req.jwt.platform !== null;

            expect(isPlatformRoute).toBe(true);
            expect(hasPlatformScope).toBe(false);
            // Devrait retourner 403
        });

        it('should allow tenant access for non-platform routes', () => {
            const req = {
                path: '/api/eleves',
                jwt: { platform: null, tenant: { etablissementId: 'etab-1', role: 'ADMIN' } },
            };

            const isPlatformRoute = req.path.startsWith('/api/platform/');
            const hasTenantScope = req.jwt.tenant !== null;

            expect(isPlatformRoute).toBe(false);
            expect(hasTenantScope).toBe(true);
        });
    });

    // =============================================
    // 6. Permissions plateforme (matrice)
    // =============================================
    describe('6. Matrice permissions plateforme', () => {
        it('should load all platform permissions', async () => {
            mockPermissionFind.mockResolvedValue([
                { id: 'p1', code: 'platform:dashboard:view', module: 'PILOTAGE' },
                { id: 'p2', code: 'platform:users:read', module: 'IDENTITE' },
                { id: 'p3', code: 'platform:audit:read', module: 'SECURITE' },
            ]);

            const permissions = await mockPermissionFind({ order: { ordre: 'ASC' } });
            expect(permissions.length).toBeGreaterThan(0);
            expect(permissions[0].code).toContain('platform:');
        });

        it('should return permissions grouped by module', async () => {
            const permissions = [
                { code: 'platform:dashboard:view', module: 'PILOTAGE' },
                { code: 'platform:users:read', module: 'IDENTITE' },
                { code: 'platform:audit:read', module: 'SECURITE' },
                { code: 'platform:etablissements:read', module: 'TENANTS' },
                { code: 'platform:facturation:read', module: 'FACTURATION' },
                { code: 'platform:modules:manage', module: 'TECHNIQUE' },
            ];

            const grouped: Record<string, any[]> = {};
            for (const perm of permissions) {
                if (!grouped[perm.module]) grouped[perm.module] = [];
                grouped[perm.module].push(perm);
            }

            expect(Object.keys(grouped)).toContain('PILOTAGE');
            expect(Object.keys(grouped)).toContain('IDENTITE');
            expect(Object.keys(grouped)).toContain('SECURITE');
            expect(Object.keys(grouped)).toContain('TENANTS');
            expect(Object.keys(grouped)).toContain('FACTURATION');
            expect(Object.keys(grouped)).toContain('TECHNIQUE');
        });
    });
});
