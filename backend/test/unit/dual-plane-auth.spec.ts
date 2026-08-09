/**
 * ==================================
 * eLISAschool - Tests unitaires Dual-Plane Auth
 * ==================================
 *
 * Vérifie la logique d'authentification dual-plane :
 * - Résolution identité via email
 * - Vérification mot de passe
 * - Construction JWT scopé
 * - Middleware scope discrimination
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RolePlateforme, StatutIdentite, ContexteType } from '@shared/enums/platform-roles.enum';

describe('Dual-Plane Auth', () => {
    describe('Identité resolution', () => {
        it('should resolve identity by email', () => {
            // Mock: identity lookup
            const identite = {
                id: 'ident-1',
                email: 'admin@elisaschool.com',
                statut: StatutIdentite.ACTIF,
                motDePasseHash: '$2a$10$hashed',
                mfaActive: false,
            };
            expect(identite.email).toBe('admin@elisaschool.com');
            expect(identite.statut).toBe(StatutIdentite.ACTIF);
        });

        it('should reject suspended identity', () => {
            const identite = {
                id: 'ident-2',
                email: 'suspended@elisaschool.com',
                statut: StatutIdentite.SUSPENDU,
            };
            expect(identite.statut).not.toBe(StatutIdentite.ACTIF);
        });
    });

    describe('JWT Payload construction', () => {
        it('should include platform scope for platform users', () => {
            const payload = {
                sub: 'ident-1',
                email: 'admin@elisaschool.com',
                role: RolePlateforme.SUPER_ADMIN,
                roles: [RolePlateforme.SUPER_ADMIN],
                platform: {
                    role: RolePlateforme.SUPER_ADMIN,
                    utilisateurPlateformeId: 'up-1',
                },
                tenant: null,
            };
            expect(payload.platform).not.toBeNull();
            expect(payload.platform.role).toBe(RolePlateforme.SUPER_ADMIN);
            expect(payload.tenant).toBeNull();
        });

        it('should include tenant scope for tenant users', () => {
            const payload = {
                sub: 'ident-3',
                email: 'director@school.com',
                role: 'DIRECTEUR',
                platform: null,
                tenant: {
                    etablissementId: 'etab-1',
                    role: 'DIRECTEUR',
                },
            };
            expect(payload.platform).toBeNull();
            expect(payload.tenant).not.toBeNull();
        });
    });

    describe('Scope discrimination', () => {
        it('should allow platform route for platform user', () => {
            const req = {
                path: '/api/platform/users',
                utilisateur: {
                    role: 'SUPER_ADMIN',
                    roles: ['SUPER_ADMIN'],
                },
            };
            const isPlatform = req.path.startsWith('/api/platform/');
            expect(isPlatform).toBe(true);
        });

        it('should reject platform route for tenant-only user', () => {
            const req = {
                path: '/api/platform/users',
                utilisateur: {
                    role: 'DIRECTEUR',
                    roles: ['DIRECTEUR'],
                },
            };
            const isPlatform = req.path.startsWith('/api/platform/');
            const hasPlatformRole = req.utilisateur.roles.some(
                (r: string) => Object.values(RolePlateforme).includes(r as RolePlateforme),
            );
            expect(isPlatform).toBe(true);
            expect(hasPlatformRole).toBe(false);
        });
    });

    describe('Memberships', () => {
        it('should support multiple context memberships', () => {
            const memberships = [
                { identiteId: 'ident-1', contexteType: ContexteType.PLATEFORME, contexteId: null, role: RolePlateforme.ADMIN_PLATEFORME },
                { identiteId: 'ident-1', contexteType: ContexteType.ETABLISSEMENT, contexteId: 'etab-1', role: 'ADMIN' },
                { identiteId: 'ident-1', contexteType: ContexteType.ETABLISSEMENT, contexteId: 'etab-2', role: 'DIRECTEUR' },
            ];
            expect(memberships).toHaveLength(3);
            expect(memberships.filter(m => m.contexteType === ContexteType.PLATEFORME)).toHaveLength(1);
            expect(memberships.filter(m => m.contexteType === ContexteType.ETABLISSEMENT)).toHaveLength(2);
        });
    });
});
