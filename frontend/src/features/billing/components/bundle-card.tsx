/**
 * ==================================
 * eLISAschool - Composant BundleCard
 * ==================================
 *
 * Carte visuelle pour afficher un bundle de packs.
 * Affiche packs inclus, remise, statut, utilisations.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { memo } from 'react';
import { Package, Calendar, Hash, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import type { BundlePromotion } from '@/features/billing/types/promotion.types';
import { StatutBadge } from './promo-badge';

interface BundleCardProps {
    bundle: BundlePromotion;
    onEdit?: (bundle: BundlePromotion) => void;
    onDelete?: (bundle: BundlePromotion) => void;
    onToggle?: (bundle: BundlePromotion) => void;
    /** Noms des packs (pour affichage lisible) */
    packNames?: Record<string, string>;
}

export const BundleCard = memo(function BundleCard({
    bundle,
    onEdit,
    onDelete,
    onToggle,
    packNames = {},
}: BundleCardProps) {
    const estExpire = bundle.dateFin ? new Date(bundle.dateFin) < new Date() : false;

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
                            {bundle.nom}
                        </h3>
                        <p className="truncate text-xs font-mono text-[var(--color-texte-muted)]">
                            {bundle.code}
                        </p>
                    </div>
                </div>
                <StatutBadge actif={bundle.actif} dateFin={bundle.dateFin} compact />
            </div>

            {/* Description */}
            {bundle.description && (
                <p className="mt-3 text-xs text-[var(--color-texte-secondaire)] line-clamp-2">
                    {bundle.description}
                </p>
            )}

            {/* Remise */}
            <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-lg bg-amber-500/10 px-2.5 py-1 text-sm font-bold text-amber-400">
                    {bundle.typeRemise === 'POURCENTAGE' ? `−${bundle.valeur}%` : `−${bundle.valeur.toLocaleString('fr-FR')} F`}
                </span>
                <span className="text-xs text-[var(--color-texte-muted)]">
                    sur le bundle
                </span>
            </div>

            {/* Packs inclus */}
            <div className="mt-3">
                <p className="text-xs font-medium text-[var(--color-texte-secondaire)] mb-1.5">
                    Packs inclus ({bundle.packIds.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {bundle.packIds.map((id) => (
                        <span
                            key={id}
                            className="inline-flex items-center rounded-md border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-texte-secondaire)]"
                            title={id}
                        >
                            {packNames[id] || `${id.slice(0, 8)}…`}
                        </span>
                    ))}
                </div>
            </div>

            {/* Meta */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--color-texte-muted)]">
                <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {bundle.utilisations}{bundle.maxUtilisations ? ` / ${bundle.maxUtilisations}` : ''}
                </span>
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(bundle.dateDebut).toLocaleDateString('fr-FR')}
                    {bundle.dateFin && !estExpire && ` → ${new Date(bundle.dateFin).toLocaleDateString('fr-FR')}`}
                </span>
            </div>

            {/* Actions (hover) */}
            <div className="mt-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {onToggle && (
                    <button
                        onClick={() => onToggle(bundle)}
                        className={`rounded-lg p-1.5 transition-colors ${bundle.actif ? 'text-green-400 hover:bg-green-500/10' : 'text-zinc-500 hover:bg-zinc-500/10'}`}
                        title={bundle.actif ? 'Désactiver' : 'Activer'}
                    >
                        {bundle.actif ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </button>
                )}
                {onEdit && (
                    <button
                        onClick={() => onEdit(bundle)}
                        className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                        title="Modifier"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={() => onDelete(bundle)}
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
