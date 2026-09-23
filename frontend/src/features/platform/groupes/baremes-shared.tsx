/**
 * ==================================
 * eLISAschool — Platform Groupes · Barèmes partagés
 * ==================================
 * Morceaux réutilisés par l'onglet Barèmes (par groupe) et la section
 * globale : éditeur de paliers, validation, simulateur, historique.
 * Source unique — aucune duplication entre les deux usages.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { FlaskConical, History, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import {
    useBaremesHistorique,
    useRestaurerBaremes,
    type PalierBareme,
} from './use-groupes-saas';
import { tauxPourPaliers } from './types';
import { formatRelative } from '@/lib/date-utils';

/** Clés barèmes reconnues dans l'historique (filtre client). */
const CLES_BAREMES = ['billing.remise_groupe.paliers', 'billing.plafond_plan', 'billing.plafond_groupe'];

export function plafondValide(v: string): boolean {
    if (v.trim() === '') return false;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= 100;
}

export function validerPaliers(paliers: PalierBareme[], t: (k: string) => string): string | null {
    if (!paliers.length) return t('groupes.baremes.erreurPaliersVide');
    const vus = new Set<number>();
    for (const p of paliers) {
        if (!Number.isInteger(p.minMembres) || p.minMembres < 2) return t('groupes.baremes.erreurPalierMin');
        if (!Number.isFinite(p.remisePct) || p.remisePct < 0 || p.remisePct > 100) {
            return t('groupes.baremes.erreurPlafond');
        }
        if (vus.has(p.minMembres)) return t('groupes.baremes.erreurPalierDoublon');
        vus.add(p.minMembres);
    }
    return null;
}

export function SourceBadge({ source }: { source: string }) {
    const { t } = useTranslation('admin');
    if (source === 'groupe') return <Badge variant="default" size="xs">{t('groupes.baremes.sourceGroupe')}</Badge>;
    if (source === 'global') return <Badge variant="secondary" size="xs">{t('groupes.baremes.sourceGlobal')}</Badge>;
    return <Badge variant="secondary" size="xs">{t('groupes.baremes.sourceDefaut')}</Badge>;
}

export function EditeurPaliers({
    value,
    onChange,
    erreur,
}: {
    value: PalierBareme[];
    onChange: (v: PalierBareme[]) => void;
    erreur: string | null;
}) {
    const { t } = useTranslation('admin');
    const tries = [...value].sort((a, b) => a.minMembres - b.minMembres);

    return (
        <div className="flex flex-col gap-[var(--space-xs)]">
            {tries.map((p, i) => (
                <div key={`${p.minMembres}-${i}`} className="flex items-center gap-[var(--gap-sm)]">
                    <div className="flex-1">
                        <ElisaInput
                            label={i === 0 ? t('groupes.baremes.colonneMin') : undefined}
                            value={String(p.minMembres)}
                            onChange={(e) => {
                                const next = [...value];
                                const idx = value.indexOf(p);
                                next[idx] = { ...p, minMembres: Number(e.target.value) };
                                onChange(next);
                            }}
                            inputMode="numeric"
                            aria-label={t('groupes.baremes.colonneMin')}
                        />
                    </div>
                    <div className="flex-1">
                        <ElisaInput
                            label={i === 0 ? t('groupes.baremes.colonneRemise') : undefined}
                            value={String(p.remisePct)}
                            onChange={(e) => {
                                const next = [...value];
                                const idx = value.indexOf(p);
                                next[idx] = { ...p, remisePct: Number(e.target.value) };
                                onChange(next);
                            }}
                            inputMode="decimal"
                            aria-label={t('groupes.baremes.colonneRemise')}
                        />
                    </div>
                    <ElisaButton
                        variant="ghost"
                        size="xs"
                        onClick={() => onChange(value.filter((_, j) => j !== value.indexOf(p)))}
                        disabled={value.length <= 1}
                        icon={<Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                        aria-label={t('groupes.baremes.supprimerPalier')}
                        className="mt-auto"
                    />
                </div>
            ))}
            {erreur && (
                <p className="text-xs text-[var(--color-danger)]" role="alert">{erreur}</p>
            )}
            <div>
                <ElisaButton
                    variant="outline"
                    size="xs"
                    onClick={() => {
                        const maxMin = tries.length ? Math.max(...tries.map((p) => p.minMembres)) : 1;
                        onChange([...value, { minMembres: maxMin + 1, remisePct: 0 }]);
                    }}
                    icon={<Plus className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                >
                    {t('groupes.baremes.ajouterPalier')}
                </ElisaButton>
            </div>
        </div>
    );
}

export function SimulateurBaremes({ paliers }: { paliers: PalierBareme[] }) {
    const { t } = useTranslation('admin');
    const [simulationMembres, setSimulationMembres] = useState('6');

    const tauxSimule = useMemo(() => {
        const n = Number(simulationMembres);
        if (!Number.isFinite(n) || n < 0) return null;
        return tauxPourPaliers(paliers, Math.floor(n));
    }, [paliers, simulationMembres]);

    return (
        <section aria-label={t('groupes.baremes.simulateur')}>
            <SectionSeparator title={t('groupes.baremes.simulateur')} icon={<FlaskConical className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />} />
            <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row sm:items-end">
                <div className="w-full sm:max-w-[12rem]">
                    <ElisaInput
                        label={t('groupes.baremes.simulateurMembres')}
                        value={simulationMembres}
                        onChange={(e) => setSimulationMembres(e.target.value)}
                        inputMode="numeric"
                    />
                </div>
                <AnimatePresence mode="wait">
                    <motion.p
                        key={tauxSimule ?? 'vide'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-[var(--color-texte-secondaire)]"
                        aria-live="polite"
                    >
                        {tauxSimule === null
                            ? t('groupes.baremes.simulateurInvalide')
                            : t('groupes.baremes.simulateurResultat', { taux: tauxSimule })}
                    </motion.p>
                </AnimatePresence>
            </div>
        </section>
    );
}

export function BaremesHistoriqueList({ groupeId }: { groupeId?: string | null }) {
    const { t } = useTranslation('admin');
    const historique = useBaremesHistorique(groupeId ?? null);
    const restaurer = useRestaurerBaremes();
    const [restaurerId, setRestaurerId] = useState<string | null>(null);

    const items = useMemo(
        () => (historique.data?.items ?? []).filter((h) =>
            CLES_BAREMES.some((cle) => (h.cibleNom ?? '').startsWith(cle)),
        ),
        [historique.data],
    );

    return (
        <section aria-label={t('groupes.baremes.historique')}>
            <SectionSeparator title={t('groupes.baremes.historique')} icon={<History className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />} />
            {historique.isLoading ? (
                <div className="flex justify-center py-6"><SchoolLoading variant="compact" /></div>
            ) : !items.length ? (
                <p className="rounded-xl border border-dashed border-[var(--color-bordure)] py-6 text-center text-sm text-[var(--color-texte-secondaire)]">
                    {t('groupes.baremes.historiqueVide')}
                </p>
            ) : (
                <ul className="flex flex-col gap-[var(--space-xs)]">
                    {items.map((h) => (
                        <li
                            key={h.id}
                            className="flex items-center justify-between gap-[var(--gap-sm)] rounded-xl border border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]"
                        >
                            <span className="min-w-0">
                                <span className="block truncate text-sm text-[var(--color-texte)]">
                                    {h.description || h.cibleNom}
                                </span>
                                <span className="block text-xs text-[var(--color-texte-muted)]">
                                    {formatRelative(h.createdAt)} · {h.action}
                                </span>
                            </span>
                            {h.restaurable && (
                                <ElisaButton
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setRestaurerId(h.id)}
                                    icon={<RotateCcw className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                    aria-label={t('groupes.baremes.restaurer', { nom: h.description || h.cibleNom || '' })}
                                >
                                    <span className="hidden sm:inline">{t('groupes.baremes.restaurer')}</span>
                                </ElisaButton>
                            )}
                        </li>
                    ))}
                </ul>
            )}
            <ConfirmationModal
                isOpen={!!restaurerId}
                title={t('groupes.baremes.confirmerRestaurerTitre')}
                message={t('groupes.baremes.confirmerRestaurerMessage')}
                details={t('groupes.baremes.sansRecalcul')}
                confirmLabel={t('groupes.baremes.restaurer')}
                variant="warning"
                isLoading={restaurer.isPending}
                onCancel={() => setRestaurerId(null)}
                onConfirm={() => {
                    if (!restaurerId) return;
                    restaurer.mutate(restaurerId, { onSettled: () => setRestaurerId(null) });
                }}
            />
        </section>
    );
}
