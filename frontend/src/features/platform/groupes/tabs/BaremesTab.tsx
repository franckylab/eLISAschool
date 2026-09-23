/**
 * ==================================
 * eLISAschool — Platform Groupes · Onglet Barèmes
 * ==================================
 * Barème dégressivité + plafond GROUPE effectifs pour ce groupe,
 * override par groupe, simulateur, historique. Les valeurs globales
 * s'éditent dans la section Barèmes de la page (lecture seule ici).
 * Jamais de recalcul rétroactif.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SlidersHorizontal,
    Save,
    RotateCcw,
    Building2,
} from 'lucide-react';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
import {
    useBaremesGroupe,
    useResetBaremesGroupe,
    useSaveBaremesGroupe,
    type BaremesConfig,
    type PalierBareme,
} from '../use-groupes-saas';
import { type GroupeSaaS } from '../types';
import {
    BaremesHistoriqueList,
    EditeurPaliers,
    SimulateurBaremes,
    SourceBadge,
    plafondValide,
    validerPaliers,
} from '../baremes-shared';

interface BaremesTabProps {
    groupe: GroupeSaaS;
}

export function BaremesTab({ groupe }: BaremesTabProps) {
    const { t } = useTranslation('admin');
    const effectifs = useBaremesGroupe(groupe.id);
    const resetGroupe = useResetBaremesGroupe();
    const saveGroupe = useSaveBaremesGroupe();

    // ─── Édition override groupe ───
    const [overrideActif, setOverrideActif] = useState(false);
    const [paliersLocaux, setPaliersLocaux] = useState<PalierBareme[]>([]);
    const [plafondLocal, setPlafondLocal] = useState('');
    const [confirmReset, setConfirmReset] = useState(false);

    const config: BaremesConfig | undefined = effectifs.data;
    const aOverride = config !== undefined && (config.sourcePaliers === 'groupe' || config.sourcePlafondGroupe === 'groupe');

    useEffect(() => {
        if (config && !overrideActif) {
            setPaliersLocaux(config.paliers.map((p) => ({ ...p })));
            setPlafondLocal(config.sourcePlafondGroupe === 'groupe' ? String(config.plafondGroupe) : '');
        }
    }, [config, overrideActif, groupe.id]);

    if (effectifs.isLoading) {
        return (
            <div className="flex justify-center py-8">
                <SchoolLoading variant="compact" />
            </div>
        );
    }

    if (effectifs.isError) {
        return (
            <ErrorMessage
                title={t('groupes.baremes.erreurChargement')}
                message={t('groupes.baremes.erreurChargementDetail')}
                onRetry={() => effectifs.refetch()}
                retryLabel={t('groupes.reessayer')}
            />
        );
    }

    if (!config) return null;

    const erreurPaliers = validerPaliers(paliersLocaux, t);
    const erreurPlafondLocal = plafondLocal.trim() !== '' && !plafondValide(plafondLocal)
        ? t('groupes.baremes.erreurPlafond')
        : null;

    const handleSaveGroupe = () => {
        if (erreurPaliers || erreurPlafondLocal) return;
        saveGroupe.mutate({
            groupeId: groupe.id,
            values: {
                paliers: paliersLocaux,
                ...(plafondLocal.trim() !== '' ? { plafondGroupe: Number(plafondLocal) } : {}),
            },
        }, { onSuccess: () => setOverrideActif(false) });
    };

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            {/* ─── 1. Valeurs effectives ─── */}
            <section aria-label={t('groupes.baremes.effectives')}>
                <SectionSeparator title={t('groupes.baremes.effectives')} icon={<SlidersHorizontal className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />} />
                <div className="grid grid-cols-1 gap-[var(--gap-sm)] sm:grid-cols-3">
                    <div className="rounded-xl border border-[var(--color-bordure)] p-[var(--space-md)]">
                        <p className="flex items-center justify-between text-xs text-[var(--color-texte-muted)]">
                            {t('groupes.baremes.paliers')}
                            <SourceBadge source={config.sourcePaliers} />
                        </p>
                        <ul className="mt-2 space-y-1 text-sm">
                            {config.paliers.map((p) => (
                                <li key={p.minMembres} className="flex justify-between tabular-nums">
                                    <span className="text-[var(--color-texte-secondaire)]">
                                        ≥ {p.minMembres} {t('groupes.membres')}
                                    </span>
                                    <strong className="text-[var(--color-texte)]">−{p.remisePct}%</strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border border-[var(--color-bordure)] p-[var(--space-md)]">
                        <p className="flex items-center justify-between text-xs text-[var(--color-texte-muted)]">
                            {t('groupes.baremes.plafondPlan')}
                            <SourceBadge source={config.sourcePlafondPlan} />
                        </p>
                        <p className="mt-2 text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-bold text-[var(--color-texte)] tabular-nums">
                            {config.plafondPlan}%
                        </p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-bordure)] p-[var(--space-md)]">
                        <p className="flex items-center justify-between text-xs text-[var(--color-texte-muted)]">
                            {t('groupes.baremes.plafondGroupe')}
                            <SourceBadge source={config.sourcePlafondGroupe} />
                        </p>
                        <p className="mt-2 text-[clamp(1.25rem,1rem+1vw,1.75rem)] font-bold text-[var(--color-texte)] tabular-nums">
                            {config.plafondGroupe}%
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── 2. Simulateur ─── */}
            <SimulateurBaremes paliers={config.paliers} />

            {/* ─── 3. Override du groupe ─── */}
            <section aria-label={t('groupes.baremes.override')}>
                <SectionSeparator
                    title={t('groupes.baremes.override')}
                    icon={<Building2 className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    action={
                        aOverride && !overrideActif ? (
                            <ElisaButton
                                variant="outline"
                                size="xs"
                                onClick={() => setConfirmReset(true)}
                                icon={<RotateCcw className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                            >
                                {t('groupes.baremes.heriter')}
                            </ElisaButton>
                        ) : undefined
                    }
                />
                {!overrideActif ? (
                    <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row sm:items-center sm:justify-between rounded-xl border border-dashed border-[var(--color-bordure)] px-[var(--space-md)] py-[var(--space-sm)]">
                        <p className="text-sm text-[var(--color-texte-secondaire)]">
                            {aOverride
                                ? t('groupes.baremes.overrideActif')
                                : t('groupes.baremes.overrideInactif')}
                        </p>
                        <ElisaButton variant="outline" size="sm" onClick={() => setOverrideActif(true)}>
                            {aOverride ? t('groupes.baremes.modifierOverride') : t('groupes.baremes.personnaliser')}
                        </ElisaButton>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[var(--gap-md)]">
                        <EditeurPaliers value={paliersLocaux} onChange={setPaliersLocaux} erreur={erreurPaliers} />
                        <div className="w-full sm:max-w-[16rem]">
                            <ElisaInput
                                label={t('groupes.baremes.plafondGroupeOverride')}
                                value={plafondLocal}
                                onChange={(e) => setPlafondLocal(e.target.value)}
                                placeholder={t('groupes.baremes.plafondGroupePlaceholder', { valeur: config.plafondGroupe })}
                                hint={t('groupes.baremes.plafondGroupeAide')}
                                error={erreurPlafondLocal ?? undefined}
                                inputMode="decimal"
                            />
                        </div>
                        <div className="flex flex-wrap gap-[var(--gap-sm)]">
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                onClick={handleSaveGroupe}
                                disabled={!!erreurPaliers || !!erreurPlafondLocal}
                                isLoading={saveGroupe.isPending}
                                icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            >
                                {t('groupes.baremes.enregistrer')}
                            </ElisaButton>
                            <ElisaButton variant="ghost" size="sm" onClick={() => setOverrideActif(false)}>
                                {t('groupes.form.annuler')}
                            </ElisaButton>
                        </div>
                        <p className="text-xs text-[var(--color-texte-muted)]">{t('groupes.baremes.sansRecalcul')}</p>
                    </div>
                )}
            </section>

            {/* ─── 4. Valeurs globales (lecture seule — édition dans la section Barèmes) ─── */}
            <section aria-label={t('groupes.baremes.globales')}>
                <SectionSeparator title={t('groupes.baremes.globales')} />
                <p className="rounded-xl border border-[var(--color-bordure)]/60 bg-[var(--color-surface-hover)]/40 px-[var(--space-md)] py-[var(--space-sm)] text-sm text-[var(--color-texte-secondaire)]">
                    {t('groupes.baremes.globalesLectureSeule')}
                </p>
            </section>

            {/* ─── 5. Historique ─── */}
            <BaremesHistoriqueList groupeId={groupe.id} />

            {/* Confirmation reset override */}
            <ConfirmationModal
                isOpen={confirmReset}
                title={t('groupes.baremes.confirmerResetTitre')}
                message={t('groupes.baremes.confirmerResetMessage', { nom: groupe.nom })}
                confirmLabel={t('groupes.baremes.heriter')}
                variant="warning"
                isLoading={resetGroupe.isPending}
                onCancel={() => setConfirmReset(false)}
                onConfirm={() => resetGroupe.mutate(groupe.id, { onSettled: () => setConfirmReset(false) })}
            />
        </div>
    );
}
