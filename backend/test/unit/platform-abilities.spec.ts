/**
 * ==================================
 * eLISAschool - Tests unitaires CASL Platform Abilities
 * ==================================
 *
 * Vérifie les capacités CASL pour les 6 rôles plateforme.
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { describe, it, expect } from 'vitest';
import { definePlatformAbility } from '@shared/casl/platform-abilities';
import { RolePlateforme } from '@shared/enums/platform-roles.enum';

describe('Platform CASL Abilities', () => {
    describe('SUPER_ADMIN', () => {
        it('should manage all', () => {
            const ability = definePlatformAbility(RolePlateforme.SUPER_ADMIN);
            expect(ability.can('manage', 'all')).toBe(true);
            expect(ability.can('read', 'PlatformUser')).toBe(true);
            expect(ability.can('delete', 'Etablissement')).toBe(true);
        });
    });

    describe('ADMIN_PLATEFORME', () => {
        it('should manage most resources but not approve critical actions', () => {
            const ability = definePlatformAbility(RolePlateforme.ADMIN_PLATEFORME);
            expect(ability.can('manage', 'PlatformUser')).toBe(true);
            expect(ability.can('manage', 'Etablissement')).toBe(true);
            expect(ability.can('manage', 'Facture')).toBe(true);
            expect(ability.can('read', 'AuditLog')).toBe(true);
            expect(ability.can('read', 'Monitoring')).toBe(true);
            // Cannot approve critical actions
            expect(ability.can('approve', 'ActionCritique')).toBe(false);
        });
    });

    describe('SUPPORT', () => {
        it('should have read-only access', () => {
            const ability = definePlatformAbility(RolePlateforme.SUPPORT);
            expect(ability.can('read', 'Etablissement')).toBe(true);
            expect(ability.can('read', 'PlatformUser')).toBe(true);
            expect(ability.can('read', 'Monitoring')).toBe(true);
            expect(ability.can('read', 'AuditLog')).toBe(true);
            // No write on roles
            expect(ability.can('manage', 'PlatformRole')).toBe(false);
            expect(ability.can('create', 'all')).toBe(false);
        });
    });

    describe('BILLING_MANAGER', () => {
        it('should manage billing but not users', () => {
            const ability = definePlatformAbility(RolePlateforme.BILLING_MANAGER);
            expect(ability.can('manage', 'Facture')).toBe(true);
            expect(ability.can('manage', 'Plan')).toBe(true);
            expect(ability.can('manage', 'Abonnement')).toBe(true);
            expect(ability.can('read', 'Etablissement')).toBe(true);
            // No access to users
            expect(ability.can('manage', 'PlatformUser')).toBe(false);
        });
    });

    describe('ANALYST', () => {
        it('should have read + export access', () => {
            const ability = definePlatformAbility(RolePlateforme.ANALYST);
            expect(ability.can('read', 'all')).toBe(true);
            expect(ability.can('export', 'all')).toBe(true);
            // No write
            expect(ability.can('manage', 'Etablissement')).toBe(false);
            expect(ability.can('create', 'all')).toBe(false);
        });
    });

    describe('AUDITOR', () => {
        it('should read audit/monitoring but not modify resources', () => {
            const ability = definePlatformAbility(RolePlateforme.AUDITOR);
            expect(ability.can('read', 'AuditLog')).toBe(true);
            expect(ability.can('read', 'Monitoring')).toBe(true);
            expect(ability.can('read', 'Etablissement')).toBe(true);
            expect(ability.can('export', 'AuditLog')).toBe(true);
            // No write on establishments
            expect(ability.can('manage', 'Etablissement')).toBe(false);
            expect(ability.can('create', 'all')).toBe(false);
        });
    });

    describe('null role', () => {
        it('should have no abilities', () => {
            const ability = definePlatformAbility(null);
            expect(ability.can('read', 'all')).toBe(false);
            expect(ability.can('manage', 'all')).toBe(false);
        });
    });
});
