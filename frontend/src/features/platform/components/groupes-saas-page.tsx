/**
 * ==================================
 * eLISAschool — Page Groupes SaaS (Control Plane)
 * ==================================
 * v2.0 — Restructurée : PageHeader gradient, stats, recherche + filtre,
 * grille de cartes, modals extraits (form / configure / suppression).
 * Logique métier dans features/platform/groupes (types + hooks + tabs).
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Network, Plus, RefreshCw, SearchX } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { SearchInput } from '@/components/ui/SearchInput';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    BaremesGlobauxSection,
    GroupeCard,
    GroupeConfigureModal,
    GroupeFormModal,
    GroupeStats,
    useBaremesGlobal,
    useCreateGroupeSaaS,
    useDeleteGroupeSaaS,
    useGroupesSaaS,
    useUpdateGroupeSaaS,
    type GroupeFormValues,
    type GroupeSaaS,
} from '@/features/platform/groupes';

type FiltreStatut = 'tous' | 'actifs' | 'inactifs';

export default function GroupesSaaSPage() {
    const { t } = useTranslation('admin');
    const [recherche, setRecherche] = useState('');
    const [filtre, setFiltre] = useState<FiltreStatut>('tous');
    const [formOpen, setFormOpen] = useState(false);
    const [groupeEnEdition, setGroupeEnEdition] = useState<GroupeSaaS | null>(null);
    const [groupeEnConfig, setGroupeEnConfig] = useState<GroupeSaaS | null>(null);
    const [groupeASupprimer, setGroupeASupprimer] = useState<GroupeSaaS | null>(null);

    const actifParam = filtre === 'tous' ? undefined : filtre === 'actifs';
    const groupesQuery = useGroupesSaaS(actifParam);
    // Paliers globaux pour les badges dégressivité (exact si pas d'override groupe)
    const { data: baremesGlobal } = useBaremesGlobal();
    const paliersGlobaux = baremesGlobal?.paliers;
    const createMutation = useCreateGroupeSaaS();
    const updateMutation = useUpdateGroupeSaaS();
    const deleteMutation = useDeleteGroupeSaaS();

    const groupes = useMemo(() => groupesQuery.data ?? [], [groupesQuery.data]);

    const groupesFiltres = useMemo(() => {
        const q = recherche.trim().toLowerCase();
        if (!q) return groupes;
        return groupes.filter(
            (g) =>
                g.nom.toLowerCase().includes(q) ||
                g.code.toLowerCase().includes(q) ||
                (g.description ?? '').toLowerCase().includes(q),
        );
    }, [groupes, recherche]);

    const ouvrirCreation = () => {
        setGroupeEnEdition(null);
        setFormOpen(true);
    };

    const ouvrirEdition = (groupe: GroupeSaaS) => {
        setGroupeEnEdition(groupe);
        setFormOpen(true);
    };

    const soumettreForm = (values: GroupeFormValues) => {
        if (groupeEnEdition) {
            updateMutation.mutate(
                { id: groupeEnEdition.id, values },
                { onSuccess: () => setFormOpen(false) },
            );
        } else {
            createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
        }
    };

    if (groupesQuery.isLoading) {
        return <PageSkeleton showStats showTable />;
    }

    if (groupesQuery.isError) {
        return (
            <div className="flex flex-col gap-[var(--gap-lg)]">
                <PageHeader
                    title={t('groupes.titre')}
                    subtitle={t('groupes.description')}
                    icon={Network}
                    variant="gradient"
                    tone="dominant"
                />
                <ErrorMessage
                    title={t('groupes.erreurChargement')}
                    message={t('groupes.erreurChargementDetail')}
                    onRetry={() => groupesQuery.refetch()}
                    retryLabel={t('groupes.reessayer')}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[var(--gap-lg)]">
            <PageHeader
                title={t('groupes.titre')}
                subtitle={t('groupes.description')}
                icon={Network}
                variant="gradient"
                tone="dominant"
                metadata={[
                    { label: t('groupes.meta.groupes'), value: String(groupes.length) },
                    {
                        label: t('groupes.meta.membres'),
                        value: String(groupes.reduce((s, g) => s + (g.etablissements?.length ?? 0), 0)),
                    },
                ]}
                actions={
                    <>
                        <ElisaButton
                            variant="ghost"
                            size="sm"
                            onClick={() => groupesQuery.refetch()}
                            icon={<RefreshCw className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            aria-label={t('groupes.actualiser')}
                        >
                            <span className="hidden sm:inline">{t('groupes.actualiser')}</span>
                        </ElisaButton>
                        <ElisaButton
                            variant="primary"
                            size="sm"
                            onClick={ouvrirCreation}
                            icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        >
                            {t('groupes.creer')}
                        </ElisaButton>
                    </>
                }
            />

            <GroupeStats groupes={groupes} paliers={paliersGlobaux} />

            {/* Barèmes & plafonds globaux — unique point d'édition globale */}
            <BaremesGlobauxSection />

            {/* Toolbar recherche + filtre */}
            <div className="flex flex-col gap-[var(--gap-sm)] sm:flex-row sm:items-center">
                <div className="flex-1">
                    <SearchInput
                        value={recherche}
                        onChange={setRecherche}
                        placeholder={t('groupes.rechercherPlaceholder')}
                        debounceMs={250}
                        ariaLabel={t('groupes.rechercherPlaceholder')}
                    />
                </div>
                <div className="w-full sm:w-[clamp(10rem,15vw,14rem)]">
                    <ElisaSelect
                        options={[
                            { value: 'tous', label: t('groupes.filtres.tous') },
                            { value: 'actifs', label: t('groupes.filtres.actifs') },
                            { value: 'inactifs', label: t('groupes.filtres.inactifs') },
                        ]}
                        value={filtre}
                        onValueChange={(v) => setFiltre(v as FiltreStatut)}
                        aria-label={t('groupes.filtres.statut')}
                        compact
                    />
                </div>
            </div>

            {/* Liste */}
            {!groupesFiltres.length ? (
                <div className="flex flex-col items-center gap-[var(--gap-sm)] rounded-2xl border border-dashed border-[var(--color-bordure)] bg-[var(--color-surface)] px-6 py-12 text-center">
                    {recherche ? (
                        <>
                            <SearchX
                                className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]"
                                aria-hidden
                            />
                            <p className="text-[clamp(0.85rem,0.8rem+0.25vw,1rem)] font-medium text-[var(--color-texte)]">
                                {t('groupes.aucunResultat')}
                            </p>
                            <p className="max-w-md text-sm text-[var(--color-texte-secondaire)]">
                                {t('groupes.aucunResultatDetail')}
                            </p>
                            <ElisaButton variant="outline" size="sm" onClick={() => setRecherche('')}>
                                {t('groupes.effacerRecherche')}
                            </ElisaButton>
                        </>
                    ) : (
                        <>
                            <Network
                                className="h-[var(--icon-lg)] w-[var(--icon-lg)] text-[var(--color-texte-muted)]"
                                aria-hidden
                            />
                            <p className="text-[clamp(0.85rem,0.8rem+0.25vw,1rem)] font-medium text-[var(--color-texte)]">
                                {t('groupes.vide')}
                            </p>
                            <p className="max-w-md text-sm text-[var(--color-texte-secondaire)]">
                                {t('groupes.videDescription')}
                            </p>
                            <ElisaButton
                                variant="primary"
                                size="sm"
                                onClick={ouvrirCreation}
                                icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                            >
                                {t('groupes.creer')}
                            </ElisaButton>
                        </>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-[var(--gap-md)] lg:grid-cols-2 xl:grid-cols-3">
                    {groupesFiltres.map((groupe, i) => (
                        <GroupeCard
                            key={groupe.id}
                            groupe={groupe}
                            paliers={paliersGlobaux}
                            index={i}
                            onConfigure={() => setGroupeEnConfig(groupe)}
                            onEdit={() => ouvrirEdition(groupe)}
                            onDelete={() => setGroupeASupprimer(groupe)}
                        />
                    ))}
                </div>
            )}

            {/* Modal création / édition */}
            <GroupeFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                groupe={groupeEnEdition}
                onSubmit={soumettreForm}
                isSubmitting={createMutation.isPending || updateMutation.isPending}
            />

            {/* Modal configuration */}
            {groupeEnConfig && (
                <GroupeConfigureModal
                    open={!!groupeEnConfig}
                    onOpenChange={(open) => {
                        if (!open) setGroupeEnConfig(null);
                    }}
                    groupe={groupeEnConfig}
                />
            )}

            {/* Confirmation suppression (soft delete) */}
            <ConfirmationModal
                isOpen={!!groupeASupprimer}
                title={t('groupes.supprimer.titre')}
                message={t('groupes.supprimer.message', { nom: groupeASupprimer?.nom ?? '' })}
                details={t('groupes.supprimer.details')}
                confirmLabel={t('groupes.supprimer.confirmer')}
                variant="danger"
                isLoading={deleteMutation.isPending}
                onCancel={() => setGroupeASupprimer(null)}
                onConfirm={() => {
                    if (!groupeASupprimer) return;
                    deleteMutation.mutate(groupeASupprimer.id, {
                        onSettled: () => setGroupeASupprimer(null),
                    });
                }}
            />
        </div>
    );
}
