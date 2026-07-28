/**
 * ==================================
 * eLISAschool - StatutBadge Component
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Badge de statut générique — élimine les duplications
 * STATUT_BADGES / STATUT_CLASSES / STATUT_STYLES / COULEURS_STATUT
 * dans les modules notes, bulletins, personnel, contrats, paie,
 * élèves, organisation, matières, salles, établissement, périodes.
 */

import { type ReactNode } from 'react';
import { Badge, type BadgeProps } from './Badge';

type SemanticVariant = 'success' | 'warning' | 'danger' | 'secondary' | 'default';

export type StatutMapping<T extends string = string> = Record<T, SemanticVariant>;

/**
 * Mappe des statuts courants vers leur variant sémantique.
 * Les modules peuvent fournir leur propre mapping via la prop `mapping`.
 */
export const STATUT_SEMANTIQUE: StatutMapping<string> = {
    ACTIF: 'success',
    ACTIVE: 'success',
    VALIDEE: 'success',
    PUBLIEE: 'default',
    VALIDE: 'success',
    PAYE: 'default',
    DISPONIBLE: 'success',
    OUVERTE: 'success',
    DIPLOME: 'default',
    RENEGOCIE: 'default',
    CONGE: 'default',

    BROUILLON: 'warning',
    EN_ATTENTE_VALIDATION: 'warning',
    EN_ATTENTE_CLOTURE: 'warning',
    EN_ATTENTE_DESACTIVATION: 'warning',
    PLANIFIEE: 'warning',
    EN_MAINTENANCE: 'warning',
    GENERE: 'warning',

    INACTIF: 'secondary',
    EXPIRE: 'secondary',
    HISTORIQUE: 'secondary',
    ABANDON: 'secondary',
    ANNULE: 'secondary',

    EXCLU: 'danger',
    ROMPU: 'danger',
    DEMISSION: 'danger',
    INDISPONIBLE: 'danger',
    INACTIVE: 'danger',
    REJETEE: 'danger',
};

function resoudreVariant(
    statut: string,
    mapping?: StatutMapping<string>,
): SemanticVariant {
    if (mapping && statut in mapping) return mapping[statut];
    if (statut in STATUT_SEMANTIQUE) return STATUT_SEMANTIQUE[statut];
    return 'secondary';
}

interface StatutBadgeProps {
    statut: string;
    label?: string;
    mapping?: StatutMapping<string>;
    icon?: ReactNode;
    dot?: boolean;
    size?: BadgeProps['size'];
    className?: string;
}

function StatutBadge({
    statut,
    label,
    mapping,
    icon,
    dot,
    size = 'sm',
    className,
}: StatutBadgeProps) {
    const variant = resoudreVariant(statut, mapping);

    return (
        <Badge variant={variant} size={size} icon={icon} dot={dot} className={className}>
            {label || statut}
        </Badge>
    );
}

export { StatutBadge, resoudreVariant };
