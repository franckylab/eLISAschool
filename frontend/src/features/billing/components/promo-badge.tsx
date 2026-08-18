/**
 * ==================================
 * eLISAschool - Composant PromoBadge
 * ==================================
 *
 * Badge visuel pour afficher une promotion (scope + valeur).
 * Utilisable dans les listes, cartes, tableaux.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Percent, Banknote, Gift, AlertTriangle } from 'lucide-react';
import {
    ScopePromotion,
    TypePromotion,
    SCOPE_LABELS,
    SCOPE_COLORS,
    formaterValeurPromotion,
} from '@/features/billing/types/promotion.types';

interface PromoBadgeProps {
    scope: ScopePromotion;
    type: TypePromotion;
    valeur: number;
    /** Afficher le scope (ex: "Plan −30%") */
    showScope?: boolean;
    /** Taille compacte */
    compact?: boolean;
    /** Classe CSS additionnelle */
    className?: string;
}

const TYPE_ICONS = {
    [TypePromotion.POURCENTAGE]: Percent,
    [TypePromotion.MONTANT_FIXE]: Banknote,
    [TypePromotion.GRATUITE]: Gift,
} as const;

export const PromoBadge = memo(function PromoBadge({
    scope,
    type,
    valeur,
    showScope = true,
    compact = false,
    className = '',
}: PromoBadgeProps) {
    const Icon = TYPE_ICONS[type];
    const scopeColor = SCOPE_COLORS[scope];
    const label = showScope ? `${SCOPE_LABELS[scope]} ${formaterValeurPromotion(type, valeur)}` : formaterValeurPromotion(type, valeur);

    return (
        <span
            className={`
                inline-flex items-center gap-1 rounded-full border
                ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}
                font-medium ${scopeColor} ${className}
            `.trim()}
            title={`${SCOPE_LABELS[scope]} — ${formaterValeurPromotion(type, valeur)}`}
        >
            <Icon className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            {label}
        </span>
    );
});

/**
 * Badge d'état (actif/inactif/expiré)
 */
export const StatutBadge = memo(function StatutBadge({
    actif,
    dateFin,
    compact = false,
}: {
    actif: boolean;
    dateFin?: string | null;
    compact?: boolean;
}) {
    const { t } = useTranslation('promotions');
    const estExpire = dateFin ? new Date(dateFin) < new Date() : false;
    const estExpireBientot = !estExpire && actif && dateFin
        ? (new Date(dateFin).getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000
        : false;

    if (estExpire) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-red-500/15 text-red-400 border-red-500/20 ${compact ? 'text-[10px] px-1.5' : ''}`}>
                <Tag className="h-3 w-3" />
                {t('etats.expire')}
            </span>
        );
    }

    if (estExpireBientot) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-amber-500/15 text-amber-400 border-amber-500/20 ${compact ? 'text-[10px] px-1.5' : ''}`}>
                <AlertTriangle className="h-3 w-3" />
                {t('etats.expireBientot')}
            </span>
        );
    }

    if (!actif) {
        return (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-zinc-500/15 text-zinc-400 border-zinc-500/20 ${compact ? 'text-[10px] px-1.5' : ''}`}>
                <Tag className="h-3 w-3" />
                {t('etats.inactif')}
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-green-500/15 text-green-400 border-green-500/20 ${compact ? 'text-[10px] px-1.5' : ''}`}>
            <Tag className="h-3 w-3" />
            {t('etats.actif')}
        </span>
    );
});
