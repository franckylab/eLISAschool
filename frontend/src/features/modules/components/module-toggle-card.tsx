/**
 * ==================================
 * eLISAschool - ModuleToggleCard
 * ==================================
 * Refonte SaaS v9 — Composant réutilisable
 *
 * Carte de module avec toggle ON/OFF pour la marketplace.
 * - Modules critiques : toggle désactivé (toujours ON)
 * - Modules du plan : toggle activable/désactivable
 * - Modules supplément : toggle + badge "Supplément"
 * - Bouton "Configurer" → modal config rapide
 *
 * Dark mode, responsive, CSS vars.
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
    Shield,
    Star,
    Puzzle,
    Settings,
    Lock,
    Loader2,
    CheckCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// =============================================
// TYPES
// =============================================

export interface ModuleToggleCardProps {
    code: string;
    nom: string;
    icone?: string;
    categorie: string;
    source: string;
    actif: boolean;
    /** Le module peut-il être désactivé ? (critique = non) */
    desactivable: boolean;
    /** Message de raison si non accessible */
    raisonBlocage?: string;
    /** Callback après toggle réussi */
    onToggleSuccess?: (code: string, actif: boolean) => void;
    /** Callback pour ouvrir la config */
    onConfigure?: (code: string) => void;
    className?: string;
}

// =============================================
// HELPERS
// =============================================

const categorieIcon = (cat: string) => {
    switch (cat) {
        case 'BASE': return Shield;
        case 'PREMIUM': return Star;
        default: return Puzzle;
    }
};

const categorieColor = (cat: string) => {
    switch (cat) {
        case 'BASE':
            return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
        case 'PREMIUM':
            return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
        default:
            return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
    }
};

const sourceLabel = (source: string) => {
    switch (source) {
        case 'base': return 'Base';
        case 'plan': return 'Inclus plan';
        case 'groupe': return 'Groupe';
        case 'supplement': return 'Supplément';
        case 'catalogue': return 'Par défaut';
        case 'essai': return 'Essai';
        case 'override': return 'Override';
        default: return source;
    }
};

// =============================================
// COMPONENT
// =============================================

export function ModuleToggleCard({
    code,
    nom,
    icone,
    categorie,
    source,
    actif,
    desactivable,
    raisonBlocage,
    onToggleSuccess,
    onConfigure,
    className,
}: ModuleToggleCardProps) {
    const queryClient = useQueryClient();
    const [isOn, setIsOn] = useState(actif);
    const Icon = categorieIcon(categorie);
    const colors = categorieColor(categorie);

    const toggleMutation = useMutation({
        mutationFn: (nouvelEtat: boolean) =>
            apiClient.put<{ code: string; actif: boolean; message: string }>(
                `/api/billing/marketplace/${code}/toggle`,
                { actif: nouvelEtat },
            ),
        onSuccess: (res) => {
            const nouvelEtat = res.data?.actif ?? !isOn;
            setIsOn(nouvelEtat);
            toast.success(nouvelEtat ? `"${nom}" activé` : `"${nom}" désactivé`);
            // Invalider les queries marketplace
            queryClient.invalidateQueries({ queryKey: ['marketplace-mes-modules'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-addons'] });
            onToggleSuccess?.(code, nouvelEtat);
        },
        onError: (err: any) => {
            const message = err?.message || 'Erreur lors du changement';
            toast.error(message);
            // Revert le state visuel
            setIsOn(actif);
        },
    });

    const handleToggle = () => {
        if (!desactivable && isOn) return; // Critique, ne peut pas désactiver
        const nouvelEtat = !isOn;
        setIsOn(nouvelEtat); // Optimistic
        toggleMutation.mutate(nouvelEtat);
    };

    const isPending = toggleMutation.isPending;
    const isBase = categorie === 'BASE' || source === 'base';

    return (
        <div
            className={cn(
                'group relative rounded-xl border bg-[var(--color-surface)] p-4 transition-all',
                isOn
                    ? `${colors.border} hover:shadow-md`
                    : 'border-[var(--color-border)] hover:border-[var(--color-border)]/80',
                className,
            )}
        >
            {/* Header : Icône + Nom + Toggle */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icône */}
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0', colors.bg)}>
                        {icone ? (
                            <span className="text-lg">{icone}</span>
                        ) : (
                            <Icon size={20} className={colors.text} />
                        )}
                    </div>

                    {/* Nom + source */}
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                            {nom}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn(
                                'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
                                colors.bg, colors.text,
                            )}>
                                {sourceLabel(source)}
                            </span>
                            {isBase && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500">
                                    <Lock size={8} />
                                    Base
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toggle switch */}
                <button
                    onClick={handleToggle}
                    disabled={isPending || (isBase && isOn)}
                    className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-dominant-500)]/30',
                        isOn ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700',
                        (isPending || (isBase && isOn)) && 'opacity-50 cursor-not-allowed',
                    )}
                    title={!desactivable && isOn ? 'Module de base — toujours actif' : undefined}
                >
                    {isPending ? (
                        <Loader2 size={12} className="animate-spin text-white mx-auto" />
                    ) : (
                        <span
                            className={cn(
                                'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                                isOn ? 'translate-x-6' : 'translate-x-1',
                            )}
                        />
                    )}
                </button>
            </div>

            {/* Footer : statut + bouton configurer */}
            <div className="mt-3 flex items-center justify-between">
                {/* Statut */}
                <div className="flex items-center gap-1.5">
                    {isOn ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle size={10} />
                            Actif
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                            <XCircle size={10} />
                            Inactif
                        </span>
                    )}
                </div>

                {/* Bouton configurer */}
                {onConfigure && isOn && (
                    <button
                        onClick={() => onConfigure(code)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] transition-colors"
                    >
                        <Settings size={12} />
                        Configurer
                    </button>
                )}
            </div>

            {/* Message de blocage si non accessible */}
            {raisonBlocage && !actif && (
                <p className="mt-2 text-[10px] text-[var(--color-text-muted)] italic line-clamp-2">
                    {raisonBlocage}
                </p>
            )}
        </div>
    );
}

export default ModuleToggleCard;
