/**
 * ==================================
 * eLISAschool - Frontend CASL Setup
 * ==================================
 * Hook useAbility + composant <Can> pour le contrôle d'accès UI.
 * Utilise les mêmes rules que le backend (shared/casl/abilities).
 * 
 * Phase 2.4 — Refonte SaaS
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { defineAbility, type AppAbility, type Action, type Subject, type AbilityContext } from '@shared/casl/abilities';

// =============================================
// Context CASL
// =============================================

const AbilityContext = createContext<AppAbility | null>(null);

/**
 * Provider CASL — crée l'ability instance depuis le contexte utilisateur.
 * À placer haut dans l'arbre de composants (après l'authentification).
 */
export function AbilityProvider({ children }: { children: ReactNode }) {
    const utilisateur = useAuthStore((s) => s.utilisateur);

    const ability = useMemo<AppAbility | null>(() => {
        if (!utilisateur) return null;

        const ctx: AbilityContext = {
            id: utilisateur.id,
            role: utilisateur.role,
            etablissementId: utilisateur.etablissementActif ?? undefined,
            permissions: utilisateur.permissions || [],
            etablissements: (utilisateur as any).etablissements || [],
        };

        return defineAbility(ctx);
    }, [utilisateur]);

    if (!ability) return null;

    return (
        <AbilityContext.Provider value={ability}>
            {children}
        </AbilityContext.Provider>
    );
}

/**
 * Hook pour accéder à l'ability CASL courante.
 * 
 * @example
 * const ability = useAbility();
 * if (ability.can('read', 'Eleve')) { ... }
 */
export function useAbility(): AppAbility {
    const ability = useContext(AbilityContext);
    if (!ability) {
        throw new Error('useAbility doit être utilisé dans un <AbilityProvider>');
    }
    return ability;
}

/**
 * Hook pour vérifier une capacité spécifique.
 * 
 * @example
 * const canReadEleves = useCan('read', 'Eleve');
 */
export function useCan(action: Action, subject: Subject): boolean {
    const ability = useAbility();
    return ability.can(action, subject);
}

// =============================================
// Composant <Can> — rendu conditionnel
// =============================================

interface CanProps {
    I: Action;
    a: Subject;
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Composant de rendu conditionnel basé sur les permissions CASL.
 * 
 * @example
 * <Can I="create" a="Eleve">
 *     <Button>Créer un élève</Button>
 * </Can>
 * 
 * @example Avec fallback
 * <Can I="delete" a="Note" fallback={<span>Lecture seule</span>}>
 *     <Button>Supprimer</Button>
 * </Can>
 */
export function Can({ I, a, children, fallback }: CanProps) {
    const ability = useAbility();
    
    if (ability.can(I, a)) {
        return <>{children}</>;
    }
    
    return fallback ? <>{fallback}</> : null;
}

/**
 * Composant inverse — affiche si l'action N'EST PAS autorisée.
 */
export function Cannot({ I, a, children }: { I: Action; a: Subject; children: ReactNode }) {
    const ability = useAbility();
    
    if (!ability.can(I, a)) {
        return <>{children}</>;
    }
    
    return null;
}

export default { AbilityProvider, useAbility, useCan, Can, Cannot };
