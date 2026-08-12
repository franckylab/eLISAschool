/**
 * ==================================
 * eLISAschool - ParameterGroup
 * ==================================
 * Groupe visuel de paramètres avec icône, titre, description.
 * Utilisé pour organiser les paramètres par sous-section thématique.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface ParameterGroupProps {
    /** Icône de la section */
    icon: LucideIcon;
    /** Titre de la section */
    titre: string;
    /** Description de la section */
    description?: string;
    /** Contenu (ParameterField, div, etc.) */
    children: ReactNode;
    /** Badge optionnel (ex: nombre de paramètres) */
    badge?: string | number;
    /** État réduit (replié) */
    defaultCollapsed?: boolean;
}

export function ParameterGroup({
    icon: Icon,
    titre,
    description,
    children,
    badge,
    defaultCollapsed = false,
}: ParameterGroupProps) {
    return (
        <motion.div
            className="rounded-xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(0.75rem,0.6rem+0.5vw,1.5rem)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
        >
            {/* En-tête de section */}
            <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg bg-[var(--color-dominant-100)] p-2 dark:bg-[var(--color-dominant-900)]/30">
                    <Icon className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-dominant-600)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                            {titre}
                        </h3>
                        {badge !== undefined && (
                            <span className="rounded-full bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-secondary)]">
                                {badge}
                            </span>
                        )}
                    </div>
                    {description && (
                        <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Contenu — grille responsive */}
            <div className="grid gap-4 sm:grid-cols-2">
                {children}
            </div>
        </motion.div>
    );
}
