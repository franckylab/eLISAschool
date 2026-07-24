import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Building2, FolderTree, Briefcase, MapPin, User, Info, Edit, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent, type Tab } from '@/components/ui';
import { Card } from '@/components/ui/Card';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useUnite, useSupprimerUnite } from '../hooks/use-unites';
import { usePermissions } from '@/hooks/use-permissions';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { UniteFormModal } from './organigramme/modals/UniteFormModal';
import type { UniteOrganisationnelle } from '../types/organisation.types';
import type { Poste } from '@/features/postes/types/poste.types';

interface UniteDetail extends UniteOrganisationnelle {
    enfants?: UniteOrganisationnelle[];
    postes?: Poste[];
    description?: string;
}

export function UniteDetailPage() {
    const { id } = useParams({ from: '/_auth/organisation/unites/$id' });
    const navigate = useNavigate();
    const { t } = useTranslation('organisation');
    const { data: unite, isLoading, error, refetch } = useUnite(id);
    const { hasPermission } = usePermissions();
    const supprimerUnite = useSupprimerUnite();
    const [tab, setTab] = useState('infos');
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    if (isLoading) return <PageSkeleton showHeader />;
    if (error || !unite) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('erreurChargement')}
                    message={t('erreurChargement')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
            </div>
        );
    }

    const detail = unite as UniteDetail;
    const enfants = detail.enfants || [];
    const postes = detail.postes || [];
    const peutEditer = hasPermission('organisation:unites:write');
    const peutSupprimer = hasPermission('organisation:unites:delete');

    const handleDelete = async () => {
        await supprimerUnite.mutateAsync(id);
        navigate({ to: '/organisation/unites' });
    };

    const onglets: Tab[] = [
        { id: 'infos', label: t('detailInfos'), icon: Info },
        { id: 'sous-unites', label: t('sousUnites'), icon: FolderTree },
        { id: 'postes', label: t('postesRattaches'), icon: Briefcase },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={unite.nom}
                onBack={() => navigate({ to: '/organisation/unites' })}
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Building2 className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <h1 className="text-2xl font-bold text-white leading-tight">{unite.nom}</h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 font-mono">{unite.code}</span>
                                    {unite.echelonStructurel?.label && (
                                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">{unite.echelonStructurel.label}</span>
                                    )}
                                    <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                                        {unite.actif !== false ? t('actif') : t('inactif')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {peutEditer && (
                                    <ElisaButton variant="secondary" size="sm" onClick={() => setEditModalOpen(true)}>
                                        <Edit className="h-4 w-4 mr-1" /> {t('modifier')}
                                    </ElisaButton>
                                )}
                                {peutSupprimer && (
                                    <ElisaButton variant="danger" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
                                        <Trash2 className="h-4 w-4 mr-1" /> {t('supprimer')}
                                    </ElisaButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageHeader>

            <TabsBar tabs={onglets} activeTab={tab} onTabChange={setTab} variant="underline" showHeader />

            <TabsContent activeTab={tab}>
                {tab === 'infos' && (
                    <Card className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><dt className="text-sm text-muted-foreground">{t('code')}</dt><dd className="font-mono font-medium text-foreground">{unite.code}</dd></div>
                            <div><dt className="text-sm text-muted-foreground">{t('type')}</dt><dd className="text-foreground">{unite.echelonStructurel?.label || '—'}</dd></div>
                            <div><dt className="text-sm text-muted-foreground">{t('parent')}</dt><dd className="text-foreground">{unite.parent?.nom || '—'}</dd></div>
                            <div><dt className="text-sm text-muted-foreground">{t('responsable')}</dt><dd className="text-foreground inline-flex items-center gap-1">{unite.responsableNom ? <><User className="h-4 w-4" />{unite.responsableNom}</> : '—'}</dd></div>
                            <div><dt className="text-sm text-muted-foreground">{t('localisation')}</dt><dd className="text-foreground inline-flex items-center gap-1">{unite.localisation ? <><MapPin className="h-4 w-4" />{unite.localisation}</> : '—'}</dd></div>
                            {unite.description && (
                                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">{t('descriptionSection')}</dt><dd className="text-foreground">{unite.description}</dd></div>
                            )}
                        </dl>
                    </Card>
                )}
                {tab === 'sous-unites' && (
                    <Card className="p-4">
                        {enfants.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('aucuneSousUnite')}</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {enfants.map((e: UniteOrganisationnelle) => (
                                    <li key={e.id} className="flex items-center gap-3 py-2.5">
                                        <FolderTree className="h-4 w-4 text-[var(--color-dominant-600)] shrink-0" />
                                        <button className="text-sm font-medium text-foreground hover:text-primary" onClick={() => navigate({ to: '/organisation/unites/$id', params: { id: e.id } })}>{e.nom}</button>
                                        <span className="text-xs text-muted-foreground font-mono">{e.code}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                )}
                {tab === 'postes' && (
                    <Card className="p-4">
                        {postes.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('aucunPosteTrouve')}</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {postes.map((p: Poste) => (
                                    <li key={p.id} className="flex items-center gap-3 py-2.5">
                                        <Briefcase className="h-4 w-4 text-[var(--color-dominant-600)] shrink-0" />
                                        <button className="text-sm font-medium text-foreground hover:text-primary" onClick={() => navigate({ to: '/organisation/postes/$id', params: { id: p.id } })}>{p.intitule}</button>
                                        <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                )}
            </TabsContent>

            <UniteFormModal
                open={editModalOpen}
                onOpenChange={(v: boolean) => { if (!v) setEditModalOpen(false); }}
                mode="edit"
                unite={unite}
                onSuccess={() => { setEditModalOpen(false); refetch(); }}
            />

            <ConfirmationModal
                isOpen={deleteConfirmOpen}
                title={t('confirmerSuppression')}
                message={`${t('confirmerSuppressionUnite')}`}
                onConfirm={handleDelete}
                onCancel={() => setDeleteConfirmOpen(false)}
                confirmLabel={t('supprimer')}
                variant="danger"
            />
        </div>
    );
}
