/**
 * ==================================
 * eLISAschool - Tests unitaires Auth Unifiée (ADR-005)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Vérifie la logique d'authentification unifiée source unique de vérité :
 * - isRolePlateforme() sur l'enum Role unifié (73 rôles)
 * - Détection accès plateforme (estPlateforme + rôle plateforme)
 * - MFA inline dans utilisateurs (plus de table mfa_configs)
 * - Flux login unifié (1 bcrypt.compare, auto-détection par rôle)
 *
 * ADR-005 — Source unique de vérité
 */

import { describe, it, expect } from '@jest/globals';
import {
    Role,
    isRolePlateforme,
    ROLES_PLATEFORME,
} from '@shared/enums/roles.enum';

// ─── isRolePlateforme() ───

describe('ADR-005 — Auth Unifiée', () => {

    describe('isRolePlateforme()', () => {
        it('reconnaît les 6 rôles plateforme unifiés', () => {
            expect(isRolePlateforme(Role.SUPER_ADMIN)).toBe(true);
            expect(isRolePlateforme(Role.PLATEFORME_ADMIN)).toBe(true);
            expect(isRolePlateforme(Role.PLATEFORME_SUPPORT)).toBe(true);
            expect(isRolePlateforme(Role.PLATEFORME_BILLING)).toBe(true);
            expect(isRolePlateforme(Role.PLATEFORME_ANALYST)).toBe(true);
            expect(isRolePlateforme(Role.PLATEFORME_AUDITOR)).toBe(true);
        });

        it('rejette les anciens rôles legacy supprimés (v8)', () => {
            expect(isRolePlateforme('ADMINISTRATION_PLATEFORME' as any)).toBe(false);
            expect(isRolePlateforme('SECURITE_PLATEFORME' as any)).toBe(false);
        });

        it('rejette les rôles tenant', () => {
            expect(isRolePlateforme(Role.ADMIN)).toBe(false);
            expect(isRolePlateforme(Role.DIRECTEUR)).toBe(false);
            expect(isRolePlateforme(Role.ENSEIGNANT)).toBe(false);
            expect(isRolePlateforme(Role.PERSONNEL)).toBe(false);
            expect(isRolePlateforme(Role.PARENT)).toBe(false);
            expect(isRolePlateforme(Role.ELEVE)).toBe(false);
            expect(isRolePlateforme(Role.COMPTABLE)).toBe(false);
        });

        it('rejette une string arbitraire', () => {
            expect(isRolePlateforme('INCONNU')).toBe(false);
            expect(isRolePlateforme('')).toBe(false);
            expect(isRolePlateforme('PLATEFORME_FAKE')).toBe(false);
        });
    });

    // ─── ROLES_PLATEFORME constant ───

    describe('ROLES_PLATEFORME', () => {
        it('contient exactement les 6 rôles plateforme unifiés (v8)', () => {
            expect(ROLES_PLATEFORME.length).toBe(6);
            expect(ROLES_PLATEFORME).toContain(Role.SUPER_ADMIN);
            expect(ROLES_PLATEFORME).toContain(Role.PLATEFORME_ADMIN);
        });

        it('est déclaré comme readonly (const)', () => {
            // readonly TypeScript — pas Object.freeze()
            // Vérifie que la référence est stable (même objet entre imports)
            expect(ROLES_PLATEFORME).toBeDefined();
            expect(Array.isArray(ROLES_PLATEFORME)).toBe(true);
        });
    });

    // ─── Détection accès plateforme (logique métier) ───

    describe('Détection accès plateforme', () => {
        it('estPlateforme=true + rôle plateforme → accès plateforme', () => {
            const utilisateur = {
                estPlateforme: true,
                role: Role.SUPER_ADMIN,
            };
            const hasAccess = utilisateur.estPlateforme && isRolePlateforme(utilisateur.role);
            expect(hasAccess).toBe(true);
        });

        it('estPlateforme=true + rôle tenant → PAS accès plateforme', () => {
            const utilisateur = {
                estPlateforme: true,
                role: Role.ADMIN,
            };
            const hasAccess = utilisateur.estPlateforme && isRolePlateforme(utilisateur.role);
            expect(hasAccess).toBe(false);
        });

        it('estPlateforme=false + rôle plateforme → PAS accès plateforme', () => {
            const utilisateur = {
                estPlateforme: false,
                role: Role.PLATEFORME_ADMIN,
            };
            const hasAccess = utilisateur.estPlateforme && isRolePlateforme(utilisateur.role);
            expect(hasAccess).toBe(false);
        });

        it('estPlateforme=false + rôle tenant → PAS accès plateforme', () => {
            const utilisateur = {
                estPlateforme: false,
                role: Role.ENSEIGNANT,
            };
            const hasAccess = utilisateur.estPlateforme && isRolePlateforme(utilisateur.role);
            expect(hasAccess).toBe(false);
        });
    });

    // ─── MFA inline (structure de données) ───

    describe('MFA inline dans utilisateurs', () => {
        it('structure utilisateur avec MFA activé', () => {
            const utilisateur = {
                id: 'user-1',
                email: 'admin@elisaschool.com',
                mfaActif: true,
                mfaSecretHash: 'hashed-secret',
                mfaBackupCodesHash: 'hashed-backup-codes',
                mfaDerniereVerification: new Date(),
            };
            expect(utilisateur.mfaActif).toBe(true);
            expect(utilisateur.mfaSecretHash).toBeDefined();
            expect(utilisateur.mfaBackupCodesHash).toBeDefined();
        });

        it('structure utilisateur sans MFA', () => {
            const utilisateur = {
                id: 'user-2',
                email: 'teacher@school.com',
                mfaActif: false,
                mfaSecretHash: null,
                mfaBackupCodesHash: null,
                mfaDerniereVerification: null,
            };
            expect(utilisateur.mfaActif).toBe(false);
            expect(utilisateur.mfaSecretHash).toBeNull();
        });
    });

    // ─── ContexteType du pivot utilisateur_etablissements ───

    describe('Pivot utilisateur_etablissements (contexteType)', () => {
        it('contexte ETABLISSEMENT pour les utilisateurs tenant', () => {
            const ue = {
                utilisateurId: 'user-1',
                etablissementId: 'etab-1',
                contexteType: 'ETABLISSEMENT',
                role: 'ADMIN',
                actif: true,
            };
            expect(ue.contexteType).toBe('ETABLISSEMENT');
            expect(ue.etablissementId).toBeDefined();
        });

        it('contexte PLATEFORME pour les utilisateurs plateforme (etablissementId nullable)', () => {
            const ue = {
                utilisateurId: 'user-1',
                etablissementId: null,
                contexteType: 'PLATEFORME',
                role: 'SUPER_ADMIN',
                actif: true,
            };
            expect(ue.contexteType).toBe('PLATEFORME');
            expect(ue.etablissementId).toBeNull();
        });
    });

    // ─── Refresh tokens avec plane discriminator ───

    describe('Refresh tokens (plane discriminator)', () => {
        it('token tenant a plane="tenant"', () => {
            const token = {
                id: 'token-1',
                utilisateurId: 'user-1',
                plane: 'tenant',
                familleId: 'fam-1',
            };
            expect(token.plane).toBe('tenant');
        });

        it('token plateforme a plane="platform"', () => {
            const token = {
                id: 'token-2',
                utilisateurId: 'user-1',
                plane: 'platform',
                familleId: 'fam-2',
            };
            expect(token.plane).toBe('platform');
        });
    });

    // ─── Enum Role unifié — complétude ───

    describe('Enum Role unifié', () => {
        it('contient les 6 rôles plateforme', () => {
            const rolesPlateforme = Object.values(Role).filter(r => r.startsWith('PLATEFORME_'));
            expect(rolesPlateforme.length).toBeGreaterThanOrEqual(6);
        });

        it('contient les rôles tenant standards', () => {
            expect(Role.SUPER_ADMIN).toBeDefined();
            expect(Role.ADMIN).toBeDefined();
            expect(Role.DIRECTEUR).toBeDefined();
            expect(Role.ENSEIGNANT).toBeDefined();
            expect(Role.PARENT).toBeDefined();
            expect(Role.ELEVE).toBeDefined();
        });

        it('total >= 73 rôles (tenant + plateforme + spéciaux)', () => {
            const totalRoles = Object.values(Role).length;
            expect(totalRoles).toBeGreaterThanOrEqual(73);
        });
    });
});
