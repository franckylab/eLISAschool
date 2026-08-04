/**
 * ==================================
 * eLISAschool - Actions de Ligne pour DataTable
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Composant réutilisable pour les actions contextuelles dans les tableaux :
 * - Bouton d'actions (⋮) TOUJOURS visible et persistant (desktop et mobile)
 * - Dropdown Radix UI avec persistance (ne se ferme pas immédiatement)
 * - Toutes les actions dans le dropdown (pas de séparation visible/overflow)
 * - Filtrage RBAC automatique (fait par DataTable)
 * - Responsive mobile : même comportement que desktop
 * - Animation fade + zoom à l'ouverture (150ms)
 * - Z-index élevé (z-60) pour persister au-dessus de tous les éléments
 */

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    MoreVertical,
    type LucideIcon,
} from 'lucide-react';

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
    /** Classe CSS additionnelle */
    className?: string;
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
        hover: 'hover:bg-green-100 text-green-600 dark:hover:bg-green-900/30 dark:text-green-400',
        dropdown: 'hover:bg-green-50 text-green-700 dark:hover:bg-green-900/30 dark:text-green-400',
    },
    warning: {
        hover: 'hover:bg-yellow-100 text-yellow-600 dark:hover:bg-yellow-900/30 dark:text-yellow-400',
        dropdown: 'hover:bg-yellow-50 text-yellow-700 dark:hover:bg-yellow-900/30 dark:text-yellow-400',
    },
    danger: {
        hover: 'hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30 dark:text-red-400',
        dropdown: 'hover:bg-red-50 text-red-700 dark:hover:bg-red-900/30 dark:text-red-400',
    },
    info: {
        hover: 'hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400',
        dropdown: 'hover:bg-blue-50 text-blue-700 dark:hover:bg-blue-900/30 dark:text-blue-400',
    },
};

/* ================================================================
 * COMPOSANT PRINCIPAL : RowActions
 * ================================================================ */

export function RowActions({
    actions,
    className,
}: RowActionsProps) {
    const { t } = useTranslation('common');
    const containerRef = useRef<HTMLDivElement>(null);

    // Filtrer les actions masquées
    const actionsFiltrees = actions.filter(a => !a.hidden);

    // Mobile et Desktop : même comportement - bouton toujours visible avec dropdown persistant
    return (
        <div
            ref={containerRef}
            className={`relative inline-flex items-center ${className || ''}`}
            tabIndex={0}
            role="group"
            aria-label={t('a11y.actions')}
        >
            {/* Bouton d'actions toujours visible */}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                    <button
                        type="button"
                        title={t('a11y.actions')}
                        className="inline-flex h-[clamp(1.75rem,1.5rem+0.5vw,2rem)] w-[clamp(1.75rem,1.5rem+0.5vw,2rem)] items-center justify-center rounded-lg transition-all duration-200 hover:bg-[var(--color-surface-alt)] hover:shadow-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] active:scale-95"
                    >
                        <MoreVertical className="h-[clamp(0.875rem,0.75rem+0.3vw,1rem)] w-[clamp(0.875rem,0.75rem+0.3vw,1rem)]" />
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        align="end"
                        sideOffset={4}
                        collisionPadding={8}
                        className="z-[1100] min-w-[180px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150"
                    >
                        {actionsFiltrees.map((action) => {
                            const Icon = action.icon;
                            const colors = VARIANT_COLORS[action.variant ?? 'default'] ?? VARIANT_COLORS.default;

                            return (
                                <DropdownMenu.Item
                                    key={action.key}
                                    disabled={action.disabled}
                                    onSelect={(_event) => {
                                        // Laisser le dropdown se fermer naturellement (ne pas preventDefault)
                                        // Retarder l'exécution d'une frame pour éviter tout conflit
                                        // d'événements pointer entre le dropdown et le modal
                                        requestAnimationFrame(() => {
                                            action.onClick();
                                        });
                                    }}
                                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus:bg-[var(--color-surface-alt)] ${colors.dropdown}`}
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
