/**
 * ==================================
 * eLISAschool - Composant PackageCard
 * ==================================
 *
 * Carte visuelle pour afficher un package de packs.
 * Affiche packs inclus, remise, statut, utilisations.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { memo } from 'react';
import { Package, Calendar, Hash, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import type { PackagePromotion } from '@/features/billing/types/promotion.types';
import { StatutBadge } from './promo-badge';

interface PackageCardProps {
    pkg: PackagePromotion;
    onEdit?: (pkg: PackagePromotion) => void;
    onDelete?: (pkg: PackagePromotion) => void;
    onToggle?: (pkg: PackagePromotion) => void;
    /** Noms des packs (pour affichage lisible) */
    packNames?: Record<string, string>;
}

export const PackageCard = memo(function PackageCard({
    pkg,
    onEdit,
    onDelete,
    onToggle,
    packNames = {},
}: PackageCardProps) {
    const estExpire = pkg.dateFin ? new Date(pkg.dateFin) < new Date() : false;

    return (
        <div className="group relative rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-4 sm:p-5 transition-all hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                        <Package className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-[var(--color-texte)]">
                            {pkg.nom}
                        </h3>
                        <p className="truncate text-xs font-mono text-[var(--color-texte-muted)]">
                            {pkg.code}
                        </p>
                    </div>
                </div>
                <StatutBadge actif={pkg.actif} dateFin={pkg.dateFin} compact />
            </div>

            {/* Description */}
            {pkg.description && (
                <p className="mt-3 text-xs text-[var(--color-texte-secondaire)] line-clamp-2">
                    {pkg.description}
                </p>
            )}

            {/* Remise */}
            <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-bold text-amber-400">
                    {pkg.typeRemise === 'POURCENTAGE' ? `−${pkg.valeur}%` : `−${pkg.valeur.toLocaleString('fr-FR')} F`}
                </span>
                <span className="text-xs text-[var(--color-texte-muted)]">
                    sur le package
                </span>
            </div>

            {/* Packs inclus */}
            <div className="mt-3">
                <p className="text-xs font-medium text-[var(--color-texte-secondaire)] mb-1.5">
                    Packs inclus ({pkg.packIds.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {pkg.packIds.map((id) => {
                        const nom = packNames[id];
                        return (
                            <span
                                key={id}
                                className={`inline-flex items-center rounded-md border border-[var(--color-bordure)] px-2 py-0.5 text-[10px] ${nom ? 'bg-amber-500/8 text-amber-400' : 'bg-[var(--color-surface-hover)] font-mono text-[var(--color-texte-secondaire)]'}`}
                                title={nom ? `${nom} (${id.slice(0, 8)}…)` : id}
                            >
                                {nom || `${id.slice(0, 8)}…`}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-texte-muted)]">
                <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {pkg.utilisations}{pkg.maxUtilisations ? ` / ${pkg.maxUtilisations}` : ''}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(pkg.dateDebut).toLocaleDateString('fr-FR')}
                    {pkg.dateFin && !estExpire && ` → ${new Date(pkg.dateFin).toLocaleDateString('fr-FR')}`}
                </span>
            </div>

            {/* Actions (hover) */}
            <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {onToggle && (
                    <button
                        onClick={() => onToggle(pkg)}
                        className={`rounded-lg p-1.5 transition-colors ${pkg.actif ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-500/10'}`}
                        title={pkg.actif ? 'Désactiver' : 'Activer'}
                    >
                        {pkg.actif ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                )}
                {onEdit && (
                    <button
                        onClick={() => onEdit(pkg)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                        title="Modifier"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(pkg)}
                        className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Supprimer"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
});
