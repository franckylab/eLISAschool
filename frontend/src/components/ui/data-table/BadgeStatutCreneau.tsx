/**
 * ==================================
 * eLISAschool - BadgeStatutCreneau
 * ==================================
 * Badge de statut unifié pour les modules EDT, Heures de cours et Remplacements.
 * Couvre tous les états : PLANIFIE, EFFECTUE, ANNULE, REMPLACE,
 * EN_ATTENTE, VALIDEE, REJETEE, EXECUTEE.
 * Version: 1.0.0
 */

import { Badge } from '@/components/ui/Badge';

interface BadgeStatutCreneauProps {
    statut: string;
    label: string;
    size?: 'xs' | 'sm';
}

const STATUT_VARIANT_MAP: Record<string, 'default' | 'success' | 'danger' | 'warning' | 'outline'> = {
    // Heures de cours
    PLANIFIE: 'outline',
    EFFECTUE: 'success',
    ANNULE: 'danger',
    REMPLACE: 'warning',
    // Remplacements
    EN_ATTENTE: 'warning',
    VALIDEE: 'success',
    REJETEE: 'danger',
    EXECUTEE: 'success',
};

function BadgeStatutCreneau({ statut, label, size = 'sm' }: BadgeStatutCreneauProps) {
    const variant = STATUT_VARIANT_MAP[statut] ?? 'outline';
    return <Badge variant={variant} size={size}>{label}</Badge>;
}

export { BadgeStatutCreneau, STATUT_VARIANT_MAP };
