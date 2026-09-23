/**
 * ==================================
 * eLISAschool — Platform Groupes · Section Barèmes globaux
 * ==================================
 * Unique point d'édition des valeurs globales (barème + plafonds) :
 * résumé compact + modale d'édition (simulateur, confirmation d'impact,
 * historique, restauration). Les overrides par groupe vivent dans l'onglet
 * Barèmes de chaque groupe — aucune duplication.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Pencil, Percent } from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchoolLoading } from '@/components/feedback/SchoolLoading';
import {
    useBaremesGlobal,
    useGroupesSaaS,
    useSaveBaremesGlobal,
    type PalierBareme,
} from './use-groupes-saas';
import { nbMembres } from './types';
import {
    BaremesHistoriqueList,
    EditeurPaliers,
    SimulateurBaremes,
    plafondValide,
    validerPaliers,
} from './baremes-shared';

export function BaremesGlobauxSection() {
    const { t } = useTranslation('admin');
    const [modalOpen, setModalOpen] = useState(false);
    const { data: config, isLoading } = useBaremesGlobal();

    if (isLoading) {
        return (
            <div className="flex justify-center rounded-2xl border border-[var(--color-bordure)] py-4">
                <SchoolLoading variant="compact" />
            </div>
        );
    }

    if (!config) return null;

    const resumePaliers = config.paliers
        .map((p) => `${p.minMembres}+ → −${p.remisePct}%`)
        .join(' · ');

    return (
        <section
            aria-label={t('groupes.baremes.globalesSection')}
            className="flex flex-col gap-[var(--gap-sm)] rounded-2xl border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[clamp(0.875rem,1rem+0.5vw,1.25rem)] sm:flex-row sm:items-center sm:justify-between"
        >
            <div className="flex min-w-0 items-start gap-[var(--gap-sm)]">
                <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-dominante)]/10 text-[var(--color-dominante)]"
                    aria-hidden
                >
                    <Globe className="h-[var(--icon-md)] w-[var(--icon-md)]" />
                </div>
                <div className="min-w-0">
                    <h2 className="flex flex-wrap items-center gap-2 text-[clamp(0.9rem,0.85rem+0.25vw,1.05rem)] font-semibold text-[var(--color-texte)]">
                        {t('groupes.baremes.globalesSection')}
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-success)]">
                            <Percent className="h-3 w-3" aria-hidden />
                            PLAN {config.plafondPlan}% · GROUPE {config.plafondGroupe}%
                        </span>
                    </h2>
                    <p className="mt-0.5 truncate text-[clamp(0.75rem,0.72rem+0.2vw,0.85rem)] text-[var(--color-texte-secondary)]">
                        {resumePaliers}
                    </p>
                </div>
            </div>
            <ElisaButton
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(true)}
                icon={<Pencil className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                className="shrink-0"
            >
                {t('groupes.baremes.modifierGlobaux')}
            </ElisaButton>

            {modalOpen && (
                <BaremesGlobalModal open={modalOpen} onOpenChange={setModalOpen} />
            )}
        </section>
    );
}

function BaremesGlobalModal({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { t } = useTranslation('admin');
    const global = useBaremesGlobal();
    const { data: tousGroupes = [] } = useGroupesSaaS();
    const saveGlobal = useSaveBaremesGlobal();
    const [confirmSave, setConfirmSave] = useState(false);

    const [paliers, setPaliers] = useState<PalierBareme[]>([]);
    const [plafondPlan, setPlafondPlan] = useState('');
    const [plafondGroupe, setPlafondGroupe] = useState('');

    useEffect(() => {
        if (open && global.data) {
            setPaliers(global.data.paliers.map((p) => ({ ...p })));
            setPlafondPlan(String(global.data.plafondPlan));
            setPlafondGroupe(String(global.data.plafondGroupe));
        }
    }, [open, global.data]);

    const groupesConcernes = tousGroupes.filter((g) => g.actif && nbMembres(g) >= 2).length;
    const erreurPaliers = validerPaliers(paliers, t);
    const erreurPlafonds =
        !plafondValide(plafondPlan) || !plafondValide(plafondGroupe)
            ? t('groupes.baremes.erreurPlafond')
            : null;

    const handleConfirm = () => {
        if (erreurPaliers || erreurPlafonds) return;
        saveGlobal.mutate({
            paliers,
            plafondPlan: Number(plafondPlan),
            plafondGroupe: Number(plafondGroupe),
        }, { onSuccess: () => { setConfirmSave(false); onOpenChange(false); } });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={t('groupes.baremes.globalesSection')}
            description={t('groupes.baremes.globalesModalDescription')}
            size="3xl"
        >
            {global.isLoading ? (
                <div className="flex justify-center py-8"><SchoolLoading variant="compact" /></div>
            ) : (
                <div className="flex flex-col gap-[var(--gap-lg)]">
                    <div className="flex flex-col gap-[var(--gap-md)]">
                        <EditeurPaliers value={paliers} onChange={setPaliers} erreur={erreurPaliers} />
                        <div className="grid grid-cols-1 gap-[var(--gap-md)] sm:grid-cols-2">
                            <ElisaInput
                                label={t('groupes.baremes.plafondPlan')}
                                value={plafondPlan}
                                onChange={(e) => setPlafondPlan(e.target.value)}
                                error={!plafondValide(plafondPlan) ? t('groupes.baremes.erreurPlafond') : undefined}
                                inputMode="decimal"
                            />
                            <ElisaInput
                                label={t('groupes.baremes.plafondGroupe')}
                                value={plafondGroupe}
                                onChange={(e) => setPlafondGroupe(e.target.value)}
                                error={!plafondValide(plafondGroupe) ? t('groupes.baremes.erreurPlafond') : undefined}
                                inputMode="decimal"
                            />
                        </div>
                        {erreurPlafonds && (
                            <p className="text-xs text-[var(--color-danger)]" role="alert">{erreurPlafonds}</p>
                        )}
                    </div>

                    <SimulateurBaremes paliers={paliers} />

                    <BaremesHistoriqueList />

                    <p className="text-xs text-[var(--color-texte-muted)]">{t('groupes.baremes.sansRecalcul')}</p>

                    <div className="flex justify-end gap-[var(--gap-sm)]">
                        <ElisaButton variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            {t('groupes.form.annuler')}
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            onClick={() => setConfirmSave(true)}
                            disabled={!!erreurPaliers || !!erreurPlafonds}
                        >
                            {t('groupes.baremes.enregistrerGlobal')}
                        </ElisaButton>
                    </div>

                    <ConfirmationModal
                        isOpen={confirmSave}
                        title={t('groupes.baremes.confirmerGlobalTitre')}
                        message={t('groupes.baremes.confirmerGlobalMessageComplet', { count: groupesConcernes })}
                        details={t('groupes.baremes.sansRecalcul')}
                        confirmLabel={t('groupes.baremes.enregistrerGlobal')}
                        variant="warning"
                        isLoading={saveGlobal.isPending}
                        onCancel={() => setConfirmSave(false)}
                        onConfirm={handleConfirm}
                    />
                </div>
            )}
        </CustomModal>
    );
}
