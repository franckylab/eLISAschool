/**
 * ==================================
 * eLISAschool - Actions de Ligne pour DataTable
 * ==================================
 * Version: 1.0.1
 * Auteur: franck arlos chendjou
 *
 * Composant réutilisable pour les actions contextuelles dans les tableaux :
 * - Boutons TOUJOURS visibles (desktop et mobile)
 * - Icônes Lucide seules (32x32px) avec tooltips
 * - Max 3 actions visibles, overflow dans dropdown "•••"
 * - Filtrage RBAC automatique (fait par DataTable)
 * - Responsive mobile : bouton "•••" permanent
 * - Animation fade + slide (150ms, easeOut)
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    MoreVertical,
    type LucideIcon,
} from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';

/* ================================================================
 * TYPES
 * ================================================================ */

export type ActionVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ActionConfig {
    /** Identifiant unique de l'action */
    key: string;
    /** Icône Lucide à afficher */
    icon: LucideIcon;
    /** Label pour le tooltip et le dropdown */
    label: string;
    /** Handler au clic */
    onClick: () => void;
    /** Permission requise (filtré par DataTable) */
    permission?: string;
    /** Variante de couleur */
    variant?: ActionVariant;
    /** Action désactivée */
    disabled?: boolean;
    /** Masquer complètement l'action (ex: rôles système non éditables) */
    hidden?: boolean;
}

export interface RowActionsProps {
    /** Liste des actions à afficher */
    actions: ActionConfig[];
    /** Nombre max d'actions visibles avant overflow (défaut: 3) */
    maxVisible?: number;
    /** Classe CSS additionnelle */
    className?: string;
    /** État de visibilité (contrôlé par le parent) */
    estVisible?: boolean;
}

/* ================================================================
 * COULEURS PAR VARIANTE
 * ================================================================ */

const VARIANT_COLORS: Record<ActionVariant, { hover: string; dropdown: string }> = {
    default: {
        hover: 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]',
        dropdown: 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text-primary)]',
    },
    primary: {
        hover: 'hover:bg-[var(--color-dominant-100)] text-[var(--color-dominant-600)]',
        dropdown: 'hover:bg-[var(--color-dominant-100)] text-[var(--color-dominant-700)]',
    },
    success: {
        hover: 'hover:bg-green-100 text-green-600',
        dropdown: 'hover:bg-green-50 text-green-700',
    },
    warning: {
        hover: 'hover:bg-yellow-100 text-yellow-600',
        dropdown: 'hover:bg-yellow-50 text-yellow-700',
    },
    danger: {
        hover: 'hover:bg-red-100 text-red-600',
        dropdown: 'hover:bg-red-50 text-red-700',
    },
    info: {
        hover: 'hover:bg-blue-100 text-blue-600',
        dropdown: 'hover:bg-blue-50 text-blue-700',
    },
};

/* ================================================================
 * SOUS-COMPOSANT : Bouton d'action
 * ================================================================ */

function ActionButton({
    action,
    size = 'md',
}: {
    action: ActionConfig;
    size?: 'sm' | 'md';
}) {
    const Icon = action.icon;
    const colors = VARIANT_COLORS[action.variant || 'default'];

    const tailleIcon = size === 'sm' ? 'h-[clamp(0.875rem,0.75rem+0.3vw,1rem)] w-[clamp(0.875rem,0.75rem+0.3vw,1rem)]' : 'h-[clamp(1rem,0.85rem+0.4vw,1.25rem)] w-[clamp(1rem,0.85rem+0.4vw,1.25rem)]';
    const tailleBtn = size === 'sm' ? 'h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] w-[clamp(1.75rem,1.5rem+0.5vw,2rem)]' : 'h-[clamp(2rem,1.75rem+0.5vw,2.25rem)] w-[clamp(2rem,1.75rem+0.5vw,2.25rem)]';

    return (
        <button
            type="button"
            title={action.label}
            disabled={action.disabled}
            onClick={(e) => {
                e.stopPropagation();
                action.onClick();
            }}
            className={`inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${colors.hover} ${tailleBtn}`}
        >
            <Icon className={`shrink-0 ${tailleIcon}`} />
        </button>
    );
}

/* ================================================================
 * COMPOSANT PRINCIPAL : RowActions
 * ================================================================ */

export function RowActions({
    actions,
    maxVisible = 3,
    className,
    estVisible: estVisibleProp,
}: RowActionsProps) {
    const estMobile = useMediaQuery('(max-width: 767px)');
    const [estVisibleLocal, setEstVisibleLocal] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Utiliser estVisibleProp si fourni (contrôlé par parent), sinon état local
    const estVisible = estVisibleProp !== undefined ? estVisibleProp : estVisibleLocal;

    // Filtrer les actions masquées
    const actionsFiltrees = actions.filter(a => !a.hidden);

    // Séparer actions visibles et overflow
    const actionsVisibles = actionsFiltrees.slice(0, maxVisible);
    const actionsOverflow = actionsFiltrees.slice(maxVisible);

    // Animation d'apparition
    const variants = {
        hidden: { opacity: 0, x: 8 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.15, ease: 'easeOut' } },
        exit: { opacity: 0, x: 8, transition: { duration: 0.1 } },
    };

    // Sur mobile, toujours afficher le bouton "•••"
    if (estMobile) {
        return (
            <div className={`inline-flex items-center ${className || ''}`}>
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button
                            type="button"
                            title="Actions"
                            className="inline-flex h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] w-[clamp(1.75rem,1.5rem+0.5vw,2rem)] items-center justify-center rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] transition-colors"
                        >
                            <MoreVertical className="h-[clamp(0.875rem,0.75rem+0.3vw,1rem)] w-[clamp(0.875rem,0.75rem+0.3vw,1rem)]" />
                        </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                        <DropdownMenu.Content
                            align="end"
                            sideOffset={4}
                            className="z-50 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg"
                        >
                            {actions.map((action) => {
                                const Icon = action.icon;
                                const colors = VARIANT_COLORS[action.variant || 'default'];

                                return (
                                    <DropdownMenu.Item
                                        key={action.key}
                                        disabled={action.disabled}
                                        onSelect={() => action.onClick()}
                                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${colors.dropdown}`}
                                    >
                                        <Icon className="h-4 w-4 shrink-0" />
                                        <span>{action.label}</span>
                                    </DropdownMenu.Item>
                                );
                            })}
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>
        );
    }

    // Desktop : boutons au survol uniquement
    return (
        <div
            ref={containerRef}
            className={`relative inline-flex items-center ${className || ''}`}
            {...(estVisibleProp === undefined && {
                onMouseEnter: () => setEstVisibleLocal(true),
                onMouseLeave: () => setEstVisibleLocal(false),
            })}
            tabIndex={0}
            role="group"
            aria-label="Actions"
        >
            {/* Placeholder quand pas survol — garde la colonne visible */}
            {!estVisible && (
                <span className="text-[var(--color-text-muted)] text-sm select-none">⋯</span>
            )}

            <AnimatePresence>
                {estVisible && (
                    <motion.div
                        className="inline-flex items-center gap-[clamp(0.25rem,0.2rem+0.1vw,0.375rem)]"
                        variants={variants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Actions visibles */}
                        {actionsVisibles.map((action) => (
                            <ActionButton key={action.key} action={action} />
                        ))}

                        {/* Dropdown overflow */}
                        {actionsOverflow.length > 0 && (
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        type="button"
                                        title="Plus d'actions"
                                        className="inline-flex h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] w-[clamp(1.75rem,1.5rem+0.5vw,2rem)] items-center justify-center rounded-lg hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] transition-colors"
                                    >
                                        <MoreVertical className="h-[clamp(0.875rem,0.75rem+0.3vw,1rem)] w-[clamp(0.875rem,0.75rem+0.3vw,1rem)]" />
                                    </button>
                                </DropdownMenu.Trigger>

                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                        align="end"
                                        sideOffset={4}
                                        className="z-50 min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-lg"
                                    >
                                        {actionsOverflow.map((action) => {
                                            const Icon = action.icon;
                                            const colors = VARIANT_COLORS[action.variant || 'default'];

                                            return (
                                                <DropdownMenu.Item
                                                    key={action.key}
                                                    disabled={action.disabled}
                                                    onSelect={() => action.onClick()}
                                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${colors.dropdown}`}
                                                >
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    <span>{action.label}</span>
                                                </DropdownMenu.Item>
                                            );
                                        })}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
