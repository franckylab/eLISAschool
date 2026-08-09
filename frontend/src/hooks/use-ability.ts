/**
 * ==================================
 * eLISAschool - Hook useAbility
 * ==================================
 * 
 * Hook d'accès aux permissions CASL.
 * Ré-exporte depuis lib/casl pour cohérence avec les autres hooks.
 * 
 * Phase P3.1 — Refonte SaaS v4
 * 
 * Usage:
 * const ability = useAbility();
 * if (ability.can('manage', 'PlanAbonnement')) { ... }
 */

import { useAbility as useCaslAbility } from '@/lib/casl';
import type { AppAbility } from '@shared/casl/abilities';

export function useAbility(): AppAbility {
    return useCaslAbility();
}
