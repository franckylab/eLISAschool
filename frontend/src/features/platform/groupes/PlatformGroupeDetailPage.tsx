/**
 * ==================================
 * eLISAschool - Platform Groupe Detail Page
 * ==================================
 * v2.0 — Header consolidé (zéro redondance), actions unifiées,
 * navigation précédent/suivant, responsive + dark mode.
 *
 * Règles de non-duplication :
 * - Code / Membres / Dégressivité affichés UNE fois (metadata PageHeader).
 * - Statut affiché UNE fois (status PageHeader).
 * - Description en sous-titre (repli sur le code).
 */

import { useCallback, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Users, Package, BadgePercent, BarChart3,
    SlidersHorizontal, Edit, Trash2, ArrowLeft, RefreshCw, Network,
    CheckCircle2, XCircle, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar, TabsContent } from '@/components/ui';
import type { Tab } from '@/components/ui';
import { BreadcrumbLabelProvider } from '@/components/navigation/breadcrumb-context';
import { useConfirmation } from '@/components/ui/ConfirmationModal';
import { GroupeFormModal } from './GroupeFormModal';
import { MembresTab } from './tabs/MembresTab';
import { ModulesTab } from './tabs/ModulesTab';
import { PromotionsTab } from './tabs/PromotionsTab';
import { ConsolidatedViewTab } from './tabs/ConsolidatedViewTab';
import { BaremesTab } from './tabs/BaremesTab';
import { useGroupeSaaS, useGroupesSaaS, useUpdateGroupeSaaS, useDeleteGroupeSaaS, useBaremesGlobal } from './use-groupes-saas';
import { DEFAUT_PALIERS_GROUPE, nbMembres, tauxPourPaliers } from './types';
import type { GroupeSaaS } from './types';
import { toast } from 'sonner';

type Onglet = 'membres' | 'modules' | 'promotions' | 'consolidee' | 'baremes';

export function PlatformGroupeDetailPage() {
    const { id } = useParams({ from: '/platform/groupes/$id' });
    const navigate = useNavigate();
    const search = useSearch({ from: '/platform/groupes/$id' });
    const { t } = useTranslation('admin');
    const confirm = useConfirmation();

    const ongletActif = ((search as unknown as { tab?: string })?.tab as Onglet) || 'membres';
    const setOngletActif = useCallback((tab: Onglet) => {
        navigate({ to: '/platform/groupes/$id', params: { id }, search: { tab } as never });
    }, [navigate, id]);

    const { data: groupe, isLoading, isError, refetch, error } = useGroupeSaaS(id);
    const { data: baremesGlobal } = useBaremesGlobal();
    const paliersGlobaux = baremesGlobal?.paliers ?? DEFAUT_PALIERS_GROUPE;
    const update = useUpdateGroupeSaaS();
    const remove = useDeleteGroupeSaaS();
    const [modalEditOpen, setModalEditOpen] = useState(false);

    // Navigation précédent/suivant (liste cachée 30s — même pattern que le détail établissement)
    const { data: tousGroupesData } = useGroupesSaaS({ limit: 1000 });
    const tousGroupes: GroupeSaaS[] = Array.isArray(tousGroupesData)
        ? tousGroupesData
        : (tousGroupesData?.items ?? []);
    const { prevId, nextId } = useMemo(() => {
        if (!tousGroupes.length) return { prevId: null as string | null, nextId: null as string | null };
        const idx = tousGroupes.findIndex((g) => g.id === id);
        if (idx < 0) return { prevId: null as string | null, nextId: null as string | null };
        return {
            prevId: idx > 0 ? tousGroupes[idx - 1].id : null,
            nextId: idx < tousGroupes.length - 1 ? tousGroupes[idx + 1].id : null,
        };
    }, [tousGroupes, id]);

    const onglets: Tab[] = useMemo(() => [
        { id: 'membres', label: t('groupes.tabs.membres', 'Membres'), icon: Users, description: t('groupes.tabsDesc.membres', 'Établissements rattachés au groupe') },
        { id: 'modules', label: t('groupes.tabs.modules', 'Modules'), icon: Package, description: t('groupes.tabsDesc.modules', 'Overrides de modules appliqués aux membres') },
        { id: 'promotions', label: t('groupes.tabs.promotions', 'Promotions'), icon: BadgePercent, description: t('groupes.tabsDesc.promotions', 'Promotions GROUPE assignées au groupe') },
        { id: 'consolidee', label: t('groupes.tabs.vueConsolidee', 'Vue consolidée'), icon: BarChart3, description: t('groupes.tabsDesc.consolidee', 'Synthèse financière en lecture seule') },
        { id: 'baremes', label: t('groupes.tabs.baremes', 'Barèmes'), icon: SlidersHorizontal, description: t('groupes.tabsDesc.baremes', 'Paliers dégressifs et plafonds effectifs') },
    ], [t]);

    const membres = groupe ? nbMembres(groupe) : 0;
    const remise = groupe?.actif ? tauxPourPaliers(paliersGlobaux, membres) : 0;

    const handleToggleActif = useCallback(() => {
        if (!groupe) return;
        const nextActif = !groupe.actif;
        confirm.ask({
            title: nextActif ? t('groupes.activerTitre', 'Réactiver ce groupe') : t('groupes.desactiverTitre', 'Désactiver ce groupe'),
            message: groupe.nom,
            details: nextActif ? t('groupes.activerDetails', 'Le groupe pourra à nouveau accueillir des membres.') : t('groupes.desactiverDetails', 'Le groupe libèrera ses membres.'),
            variant: nextActif ? 'info' : 'danger',
            onConfirm: async () => {
                await update.mutateAsync({ id: groupe.id, values: { nom: groupe.nom, code: groupe.code, description: groupe.description, actif: nextActif } });
                toast.success(nextActif ? t('groupes.toast.reactive', 'Groupe réactivé') : t('groupes.toast.desactive', 'Groupe désactivé'));
            },
        });
    }, [groupe, confirm, update, t]);

    const handleDelete = useCallback(() => {
        if (!groupe) return;
        confirm.ask({
            title: t('groupes.supprimer.titre', 'Désactiver ce groupe ?'),
            message: groupe.nom,
            details: t('groupes.supprimer.details', 'Suppression logique : les overrides modules sont conservés.'),
            variant: 'danger',
            onConfirm: async () => {
                await remove.mutateAsync(groupe.id);
                toast.success(t('groupes.toast.supprime', 'Groupe désactivé'));
                navigate({ to: '/platform/groupes' });
            },
        });
    }, [groupe, confirm, remove, navigate, t]);

    if (isLoading) {
        return <PageSkeleton showStats showTable />;
    }

    if (isError || !groupe) {
        return (
            <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
                <button onClick={() => navigate({ to: '/platform/groupes' })} className="inline-flex items-center gap-1.5 text-sm text-[var(--color-texte-muted)] hover:text-[var(--color-texte)]">
                    <ArrowLeft className="h-4 w-4" /> {t('common.actions.retour', 'Retour')}
                </button>
                <ErrorMessage title={t('groupes.erreurChargement', 'Chargement impossible')} message={(error as Error)?.message ?? t('groupes.erreurChargementDetail', 'Erreur')} onRetry={() => refetch()} retryLabel={t('groupes.reessayer', 'Réessayer')} />
            </div>
        );
    }

    return (
        <BreadcrumbLabelProvider value={groupe.nom}>
            <div className="p-[var(--space-lg)] space-y-[var(--space-lg)]">
                {/* Header consolidé — chaque info UNE seule fois */}
                <PageHeader
                    title={groupe.nom}
                    subtitle={groupe.description || groupe.code}
                    icon={Network}
                    variant="gradient"
                    tone="dominant"
                    metadata={[
                        { label: t('groupes.colonnes.membres', 'Membres'), value: String(membres) },
                        {
                            label: t('groupes.colonnes.remise', 'Remise'),
                            value: remise > 0 ? `−${remise}%` : t('groupes.sansRemise', 'Sans remise'),
                        },
                    ]}
                    status={{ label: groupe.actif ? t('groupes.statut.actif', 'Actif') : t('groupes.statut.inactif', 'Inactif'), variant: groupe.actif ? 'success' : 'warning' }}
                    actions={
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate({ to: '/platform/groupes' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white/10 text-white hover:bg-white/20 text-sm">
                                <ArrowLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('common.actions.retour', 'Retour')}</span>
                            </button>
                            <button onClick={() => refetch()} className="p-2 rounded-lg border bg-white/10 text-white hover:bg-white/20" aria-label={t('common.actions.rafraichir', 'Rafraîchir')} title={t('common.actions.rafraichir', 'Rafraîchir')}>
                                <RefreshCw className="h-4 w-4" />
                            </button>
                            <button onClick={handleToggleActif} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-white/10 text-white hover:bg-white/20 text-sm">
                                {groupe.actif ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                <span className="hidden sm:inline">{groupe.actif ? t('groupes.desactiver', 'Désactiver') : t('groupes.activer', 'Activer')}</span>
                            </button>
                            <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[var(--color-danger)] text-sm font-medium hover:opacity-90">
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">{t('groupes.actions.supprimer', 'Désactiver')}</span>
                            </button>
                        </div>
                    }
                />

                {/* Barre d'actions secondaires : édition + navigation */}
                <div className="flex flex-wrap items-center gap-[var(--gap-sm)]">
                    <button
                        onClick={() => setModalEditOpen(true)}
                        className="inline-flex items-center gap-[var(--gap-xs)] rounded-lg border px-[clamp(0.5rem,0.4rem+0.3vw,0.875rem)] py-[clamp(0.375rem,0.3rem+0.2vw,0.625rem)] text-sm font-medium transition-colors hover:bg-[var(--color-surface-alt)]"
                        style={{ borderColor: 'var(--color-bordure)', color: 'var(--color-texte)' }}
                    >
                        <Edit className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                        {t('common.actions.modifier', 'Modifier')}
                    </button>
                    <div className="ml-auto flex items-center gap-[var(--gap-xxs)]">
                        <button
                            onClick={() => prevId && navigate({ to: '/platform/groupes/$id', params: { id: prevId }, search: { tab: ongletActif } as never })}
                            disabled={!prevId}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)', color: 'var(--color-texte-muted)' }}
                            title={t('groupes.precedent', 'Groupe précédent')}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">{t('groupes.precedent', 'Précédent')}</span>
                        </button>
                        <button
                            onClick={() => nextId && navigate({ to: '/platform/groupes/$id', params: { id: nextId }, search: { tab: ongletActif } as never })}
                            disabled={!nextId}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium transition-colors disabled:opacity-30"
                            style={{ borderColor: 'var(--color-bordure)', backgroundColor: 'var(--color-surface)', color: 'var(--color-texte-muted)' }}
                            title={t('groupes.suivant', 'Groupe suivant')}
                        >
                            <span className="hidden md:inline">{t('groupes.suivant', 'Suivant')}</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Onglets */}
                <TabsBar tabs={onglets} activeTab={ongletActif} onTabChange={(id) => setOngletActif(id as Onglet)} variant="underline" showHeader />

                <TabsContent activeTab={ongletActif}>
                    {ongletActif === 'membres' && <MembresTab groupe={groupe} />}
                    {ongletActif === 'modules' && <ModulesTab groupe={groupe} />}
                    {ongletActif === 'promotions' && <PromotionsTab groupe={groupe} />}
                    {ongletActif === 'consolidee' && <ConsolidatedViewTab groupe={{ id: groupe.id, nom: groupe.nom, code: groupe.code }} />}
                    {ongletActif === 'baremes' && <BaremesTab groupe={groupe} />}
                </TabsContent>

                <GroupeFormModal open={modalEditOpen} onOpenChange={setModalEditOpen} groupe={groupe} onSubmit={(values) => update.mutate({ id: groupe.id, values }, { onSuccess: () => setModalEditOpen(false) })} isSubmitting={update.isPending} />
                {confirm.ConfirmationModal}
            </div>
        </BreadcrumbLabelProvider>
    );
}

export default PlatformGroupeDetailPage;
