/**
 * ==================================
 * eLISAschool - RequireAbility Guard
 * ==================================
 * 
 * Composant guard pour protéger les routes/composants
 * selon les permissions CASL de l'utilisateur.
 * 
 * Phase P3.1 — Refonte SaaS v4
 * 
 * Usage:
 * <RequireAbility action="manage" subject="PlanAbonnement">
 *     <PlanFormModal />
 * </RequireAbility>
 */

import { type ReactNode } from 'react';
import { useAbility } from '@/lib/casl';
import type { Action, Subject } from '@shared/casl/abilities';
import { ShieldX } from 'lucide-react';

interface RequireAbilityProps {
    action: Action;
    subject: Subject;
    children: ReactNode;
    fallback?: ReactNode;
}

export function RequireAbility({ action, subject, children, fallback }: RequireAbilityProps) {
    const ability = useAbility();

    if (ability.cannot(action, subject)) {
        if (fallback) return <>{fallback}</>;
        return (
            <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-muted)]">
                <ShieldX className="w-10 h-10 mb-3 text-[var(--color-danger-400)]" />
                <p className="text-sm font-medium">Accès non autorisé</p>
                <p className="text-xs mt-1">
                    Vous n'avez pas les permissions pour accéder à cette section.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}

export default RequireAbility;
