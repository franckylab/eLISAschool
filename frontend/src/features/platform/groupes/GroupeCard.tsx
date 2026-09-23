/**
 * ==================================
 * eLISAschool — Platform Groupes · Carte
 * ==================================
 * Carte sobre : identité, statut, compteurs, actions.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Building2, Settings, Pencil, Trash2, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import type { GroupeSaaS } from './types';
import { DEFAUT_PALIERS_GROUPE, initiales, nbMembres, tauxPourPaliers } from './types';

interface GroupeCardProps {
    groupe: GroupeSaaS;
    /** Paliers effectifs globaux (badge exact si pas d'override groupe). */
    paliers?: Array<{ minMembres: number; remisePct: number }>;
    onConfigure: () => void;
    onEdit: () => void;
    onDelete: () => void;
    index?: number;
}

export const GroupeCard = memo(function GroupeCard({
    groupe,
    paliers,
    onConfigure,
    onEdit,
    onDelete,
    index = 0,
}: GroupeCardProps) {
    const { t } = useTranslation('admin');
    const membres = nbMembres(groupe);
    const degressivite = groupe.actif
        ? tauxPourPaliers(paliers ?? DEFAUT_PALIERS_GROUPE, membres)
        : 0;

    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.25 }}
            className="group flex flex-col rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(0.875rem,1rem+0.5vw,1.25rem)] transition-shadow hover:shadow-md"
            aria-label={groupe.nom}
        >
            {/* En-tête */}
            <div className="flex items-start justify-between gap-[var(--gap-sm)]">
                <div className="flex min-w-0 items-center gap-[var(--gap-sm)]">
                    <div
                        className="flex h-[clamp(2.25rem,2rem+1vw,2.75rem)] w-[clamp(2.25rem,2rem+1vw,2.75rem)] shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]"
                        aria-hidden
                    >
                        <span className="text-[clamp(0.8rem,0.7rem+0.3vw,0.95rem)] font-bold">
                            {initiales(groupe.nom)}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="truncate text-[clamp(0.9rem,0.85rem+0.25vw,1.05rem)] font-semibold text-[var(--color-texte)]">
                            {groupe.nom}
                        </h3>
                        <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <code className="rounded-md border border-[var(--color-bordure)] bg-[var(--color-surface-hover)] px-1.5 py-0.5 font-mono text-[clamp(0.65rem,0.6rem+0.2vw,0.75rem)] font-semibold text-[var(--color-texte-secondaire)]">
                                {groupe.code}
                            </code>
                            <Badge variant={groupe.actif ? 'success' : 'secondary'} size="xs">
                                {groupe.actif ? t('groupes.statut.actif') : t('groupes.statut.inactif')}
                            </Badge>
                        </p>
                    </div>
                </div>
            </div>

            {/* Description */}
            {groupe.description ? (
                <p className="mt-[var(--space-sm)] line-clamp-2 text-[clamp(0.78rem,0.75rem+0.2vw,0.875rem)] text-[var(--color-texte-secondaire)]">
                    {groupe.description}
                </p>
            ) : (
                <p className="mt-[var(--space-sm)] text-[clamp(0.78rem,0.75rem+0.2vw,0.875rem)] italic text-[var(--color-texte-muted)]">
                    {t('groupes.sansDescription')}
                </p>
            )}

            {/* Compteurs */}
            <div className="mt-[var(--space-md)] flex items-center gap-[var(--gap-md)] border-t border-[var(--color-bordure)]/60 pt-[var(--space-sm)] text-[clamp(0.75rem,0.72rem+0.2vw,0.85rem)] text-[var(--color-texte-secondaire)]">
                <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" aria-hidden />
                    <strong className="font-semibold text-[var(--color-texte)] tabular-nums">{membres}</strong>
                    {t('groupes.membres')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Percent className="h-[var(--icon-sm)] w-[var(--icon-sm)]" aria-hidden />
                    {degressivite > 0 ? (
                        <Badge variant="success" size="xs">
                            −{degressivite}% {t('groupes.degressivite')}
                        </Badge>
                    ) : (
                        <span className="text-[var(--color-texte-muted)]">{t('groupes.sansRemise')}</span>
                    )}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-[var(--space-sm)] flex items-center gap-[var(--gap-xs)]">
                <ElisaButton
                    variant="primary"
                    size="sm"
                    onClick={onConfigure}
                    icon={<Settings className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    aria-label={t('groupes.actions.configurer', { nom: groupe.nom })}
                >
                    {t('groupes.actions.configurer')}
                </ElisaButton>
                <ElisaButton
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    icon={<Pencil className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    aria-label={t('groupes.actions.modifier', { nom: groupe.nom })}
                >
                    <span className="hidden sm:inline">{t('groupes.actions.modifier')}</span>
                </ElisaButton>
                <ElisaButton
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    icon={<Trash2 className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-danger)]" />}
                    aria-label={t('groupes.actions.supprimer', { nom: groupe.nom })}
                >
                    <span className="hidden sm:inline">{t('groupes.actions.supprimer')}</span>
                </ElisaButton>
            </div>
        </motion.article>
    );
});
