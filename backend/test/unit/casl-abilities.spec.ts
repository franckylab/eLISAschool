/**
 * ==================================
 * eLISAschool - Tests unitaires CASL Abilities
 * ==================================
 * 
 * Teste les définitions CASL par rôle :
 * - SUPER_ADMIN : manage all
 * - ADMIN : manage scoped, pas plateforme
 * - DIRECTEUR : comme ADMIN sans delete Etablissement/Personnel
 * - ENSEIGNANT : read Note scoped matiere
 * - PARENT : read Note/Bulletin scoped eleve
 * - ELEVE : read own data
 * - COMPTABLE : read Finances scoped
 * 
 * Phase 1 — Refonte SaaS v5
 */

import { describe, it, expect } from '@jest/globals';
import { defineAbility, type AbilityContext } from '../../../shared/src/casl/abilities';

// ─── Helpers ───

function makeCtx(overrides: Partial<AbilityContext>): AbilityContext {
    return {
        id: 'user-1',
        role: 'ADMIN',
        etablissementId: 'etab-1',
        ...overrides,
    };
}

describe('CASL Ability Definitions', () => {

    // =============================================
    // SUPER_ADMIN
    // =============================================
    describe('SUPER_ADMIN', () => {
        const ability = defineAbility(makeCtx({ role: 'SUPER_ADMIN' }));

        it('peut tout gérer', () => {
            expect(ability.can('manage', 'all')).toBe(true);
        });

        it('peut gérer les établissements', () => {
            expect(ability.can('manage', 'Etablissement')).toBe(true);
        });

        it('peut gérer la configuration', () => {
            expect(ability.can('manage', 'Configuration')).toBe(true);
        });

        it('peut gérer le monitoring', () => {
            expect(ability.can('manage', 'Monitoring')).toBe(true);
        });

        it('peut gérer les modules', () => {
            expect(ability.can('toggle', 'Module')).toBe(true);
        });
    });

    // =============================================
    // ADMIN
    // =============================================
    describe('ADMIN', () => {
        const ability = defineAbility(makeCtx({ role: 'ADMIN', etablissementId: 'etab-1' }));

        it('peut gérer les élèves', () => {
            expect(ability.can('manage', 'Eleve')).toBe(true);
        });

        it('peut gérer les finances', () => {
            expect(ability.can('manage', 'Finances')).toBe(true);
        });

        it('peut gérer les utilisateurs', () => {
            expect(ability.can('manage', 'Utilisateur')).toBe(true);
        });

        it('peut lire la configuration', () => {
            expect(ability.can('read', 'Configuration')).toBe(true);
        });

        it('NE peut PAS supprimer la configuration (plateforme)', () => {
            expect(ability.cannot('delete', 'Configuration')).toBe(true);
        });

        it('NE peut PAS toggler les modules (plateforme)', () => {
            expect(ability.cannot('toggle', 'Module')).toBe(true);
        });

        it('NE peut PAS gérer les groupes établissements (cross-tenant)', () => {
            expect(ability.cannot('manage', 'GroupeEtablissement')).toBe(true);
        });

        it('NE peut PAS gérer le monitoring (infrastructure)', () => {
            expect(ability.cannot('manage', 'Monitoring')).toBe(true);
        });

        it('peut lire les audits', () => {
            expect(ability.can('read', 'Audit')).toBe(true);
        });
    });

    // =============================================
    // DIRECTEUR
    // =============================================
    describe('DIRECTEUR', () => {
        const ability = defineAbility(makeCtx({ role: 'DIRECTEUR', etablissementId: 'etab-1' }));

        it('peut gérer les élèves', () => {
            expect(ability.can('manage', 'Eleve')).toBe(true);
        });

        it('NE peut PAS supprimer un établissement', () => {
            expect(ability.cannot('delete', 'Etablissement')).toBe(true);
        });

        it('NE peut PAS supprimer du personnel', () => {
            expect(ability.cannot('delete', 'Personnel')).toBe(true);
        });

        it('NE peut PAS gérer les rôles', () => {
            expect(ability.cannot('manage', 'Role')).toBe(true);
        });

        it('NE peut PAS gérer les permissions', () => {
            expect(ability.cannot('manage', 'Permission')).toBe(true);
        });

        it('peut gérer les classes', () => {
            expect(ability.can('manage', 'Classe')).toBe(true);
        });
    });

    // =============================================
    // ENSEIGNANT
    // =============================================
    describe('ENSEIGNANT', () => {
        const ability = defineAbility(makeCtx({
            role: 'ENSEIGNANT',
            etablissementId: 'etab-1',
            ownMatiereIds: ['mat-1', 'mat-2'],
        }));

        it('peut lire les élèves', () => {
            expect(ability.can('read', 'Eleve')).toBe(true);
        });

        it('peut lire les notes', () => {
            expect(ability.can('read', 'Note')).toBe(true);
        });

        it('NE peut PAS supprimer les élèves', () => {
            expect(ability.cannot('delete', 'Eleve')).toBe(true);
        });

        it('NE peut PAS gérer les finances', () => {
            expect(ability.cannot('manage', 'Finances')).toBe(true);
        });

        it('NE peut PAS gérer la configuration', () => {
            expect(ability.cannot('manage', 'Configuration')).toBe(true);
        });
    });

    // =============================================
    // PARENT
    // =============================================
    describe('PARENT', () => {
        const ability = defineAbility(makeCtx({
            role: 'PARENT',
            etablissementId: 'etab-1',
            ownEleveIds: ['eleve-1'],
        }));

        it('peut lire les notes de ses enfants', () => {
            expect(ability.can('read', 'Note')).toBe(true);
        });

        it('peut lire les bulletins', () => {
            expect(ability.can('read', 'Bulletin')).toBe(true);
        });

        it('NE peut PAS créer des notes', () => {
            expect(ability.cannot('create', 'Note')).toBe(true);
        });

        it('NE peut PAS gérer les finances', () => {
            expect(ability.cannot('manage', 'Finances')).toBe(true);
        });

        it('NE peut PAS gérer le personnel', () => {
            expect(ability.cannot('manage', 'Personnel')).toBe(true);
        });
    });

    // =============================================
    // ELEVE
    // =============================================
    describe('ELEVE', () => {
        const ability = defineAbility(makeCtx({ role: 'ELEVE', etablissementId: 'etab-1' }));

        it('peut lire ses propres notes', () => {
            expect(ability.can('read', 'Note')).toBe(true);
        });

        it('peut lire ses bulletins', () => {
            expect(ability.can('read', 'Bulletin')).toBe(true);
        });

        it('NE peut PAS créer des notes', () => {
            expect(ability.cannot('create', 'Note')).toBe(true);
        });

        it('NE peut PAS gérer quoi que ce soit', () => {
            expect(ability.cannot('manage', 'Eleve')).toBe(true);
            expect(ability.cannot('manage', 'Finances')).toBe(true);
            expect(ability.cannot('manage', 'Personnel')).toBe(true);
        });
    });

    // =============================================
    // COMPTABLE
    // =============================================
    describe('COMPTABLE', () => {
        const ability = defineAbility(makeCtx({ role: 'COMPTABLE', etablissementId: 'etab-1' }));

        it('peut lire les finances', () => {
            expect(ability.can('read', 'Finances')).toBe(true);
        });

        it('peut gérer les paiements', () => {
            expect(ability.can('manage', 'Paiement')).toBe(true);
        });

        it('NE peut PAS gérer les élèves', () => {
            expect(ability.cannot('manage', 'Eleve')).toBe(true);
        });

        it('NE peut PAS gérer le personnel', () => {
            expect(ability.cannot('manage', 'Personnel')).toBe(true);
        });
    });

    // =============================================
    // Rôle inconnu (default)
    // =============================================
    describe('Rôle inconnu (PERSONNEL)', () => {
        const ability = defineAbility(makeCtx({ role: 'PERSONNEL', etablissementId: 'etab-1' }));

        it('a des permissions minimales', () => {
            expect(ability.cannot('manage', 'all')).toBe(true);
        });

        it('peut lire les données de base', () => {
            // Le rôle par défaut a au minimum read sur certaines choses
            expect(ability.can('read', 'Eleve')).toBe(true);
        });
    });
});
