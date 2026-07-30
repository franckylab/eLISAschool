/**
 * ==================================
 * eLISAschool - Page Détail Poste
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Détail routé : PageHeader gradient + TabsBar (Infos / Occupants / Position).
 */

import { useState } from 'react';
import { useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { Edit, Trash2, Briefcase, Building2, Target, ListChecks, ChevronRight, UserRound, Info, Users, Network, History } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar, TabsContent, type Tab } from '@/components/ui';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { usePoste, usePosteOccupants, useSupprimerPoste } from '../hooks/use-postes';
import type { AffectationPoste } from '@/features/personnel/types/affectation.types';
import { PosteFormModal } from './poste-form-modal';
import { AuditTimeline } from '@/components/ui/AuditTimeline';
import { PosteCapaciteIndicator } from './PosteCapaciteIndicator';
import { STATUT_POSTE_OPTIONS } from '../types/poste.zod';

export function PosteDetailPage() {
    const { t } = useTranslation('organisation');
    const { id } = useParams({ from: '/_auth/organisation/postes/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: poste, isLoading, error, refetch } = usePoste(id);
    const { data: occupants } = usePosteOccupants(id);
    const supprimer = useSupprimerPoste();

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const search = useSearch({ from: '/_auth/organisation/postes/$id' }) as { tab?: string };
    const tab = search?.tab || 'infos';
    const setTab = (nouveau: string) => navigate({ to: '/organisation/postes/$id', params: { id }, search: { tab: nouveau } as never });

    if (isLoading) return <PageSkeleton showHeader />;
    if (error || !poste) {
        return (
            <div className="flex flex-col items-center justify-center" style={{ gap: 'var(--gap-md)', padding: 'var(--space-xl)' }}>
                <ErrorMessage title={t('erreurChargement')} message={t('erreurChargement')} onRetry={() => refetch()} retryLabel={t('reessayer')} />
            </div>
        );
    }

    const statutOption = STATUT_POSTE_OPTIONS.find((o) => o.value === poste.statut);
    const statutLabel = statutOption ? t(statutOption.labelKey) : poste.statut;
    const typeNom = poste.fonction?.categorie ? t(`categorie_${poste.fonction.categorie}`, poste.fonction.categorie) : '—';
    const niveauLabel = poste.niveauResponsabilite?.label || '—';
    const occupantsList = occupants || [];

    const onglets: Tab[] = [
        { id: 'infos', label: t('detailInfos'), icon: Info },
        { id: 'occupants', label: t('occupants'), icon: Users },
        { id: 'position', label: t('positionHierarchique'), icon: Network },
        ...((hasPermission('audit:organisation:view') || hasPermission('audit:view'))
            ? [{ id: 'historique', label: t('historique'), icon: History }]
            : []),
    ];

    return (
        <div className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={poste.intitule}
                onBack={() => navigate({ to: '/organisation/postes' })}
                actions={
                    <div className="flex gap-2">
                        {hasPermission('organisation:postes:write') && (
                            <ElisaButton variant="primary" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setShowEditModal(true)}>{t('modifier')}</ElisaButton>
                        )}
                        {hasPermission('organisation:postes:delete') && (
                            <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => setShowDeleteConfirm(true)}>{t('supprimer')}</ElisaButton>
                        )}
                    </div>
                }
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white leading-tight">{poste.intitule}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 font-mono">{poste.code}</span>
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">{statutLabel}</span>
                            {poste.fonction?.categorie && <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">{t(`categorie_${poste.fonction.categorie}`, poste.fonction.categorie)}</span>}
                        </div>
                    </div>
                </div>
            </PageHeader>

            <TabsBar tabs={onglets} activeTab={tab} onTabChange={setTab} variant="underline" showHeader />

            <TabsContent activeTab={tab}>
                {tab === 'infos' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="p-6">
                                <h2 className="text-lg font-semibold text-foreground mb-4">{t('informations')}</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">{t('code')}</span><p className="font-medium text-foreground font-mono">{poste.code}</p></div>
                                    <div><span className="text-muted-foreground">{t('type')}</span><p className="font-medium text-foreground flex items-center gap-2"><UserRound className="h-4 w-4" />{typeNom}</p></div>
                                    <div><span className="text-muted-foreground">{t('niveauResponsabilite')}</span><p className="font-medium text-foreground">{niveauLabel}</p></div>
                                    <div><span className="text-muted-foreground">{t('nombrePostes')}</span><div className="font-medium text-foreground mt-1"><PosteCapaciteIndicator occupantsCount={poste.occupantsCount} nombrePostes={poste.nombrePostes} size="md" /></div></div>
                                    {poste.description && (<div className="col-span-2"><span className="text-muted-foreground">{t('description')}</span><p className="font-medium text-foreground">{poste.description}</p></div>)}
                                </div>
                            </Card>

                            {poste.missions && poste.missions.length > 0 && (
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4"><ListChecks className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">{t('missions')}</h2></div>
                                    <ul className="space-y-2">
                                        {poste.missions.map((m, i) => (<li key={i} className="flex items-start gap-2 text-sm text-foreground"><ChevronRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />{m}</li>))}
                                    </ul>
                                </Card>
                            )}

                            {poste.competencesRequises && poste.competencesRequises.length > 0 && (
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">{t('competencesRequises')}</h2></div>
                                    <div className="flex flex-wrap gap-2">
                                        {poste.competencesRequises.map((c, i) => (<span key={i} className="px-3 py-1 bg-primary/5 text-primary rounded-full text-sm">{c}</span>))}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-4">
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-3"><Building2 className="h-5 w-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">{t('unites')}</h3></div>
                                {poste.uniteOrganisationnelle ? (
                                    <button className="text-left" onClick={() => poste.uniteOrganisationnelleId && navigate({ to: '/organisation/unites/$id', params: { id: poste.uniteOrganisationnelleId } })}>
                                        <p className="font-medium text-foreground hover:text-primary">{poste.uniteOrganisationnelle.nom}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{poste.uniteOrganisationnelle.code}</p>
                                    </button>
                                ) : <p className="text-sm text-muted-foreground">—</p>}
                            </Card>
                            {poste.fonction && (
                                <Card className="p-6">
                                    <div className="flex items-center gap-2 mb-3"><Briefcase className="h-5 w-5 text-muted-foreground" /><h3 className="font-semibold text-foreground">{t('fonction')}</h3></div>
                                    <p className="font-medium text-foreground">{poste.fonction.nom}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{poste.fonction.code}</p>
                                </Card>
                            )}
                        </div>
                    </div>
                )}

                {tab === 'occupants' && (
                    <Card className="p-4">
                        {occupantsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('aucunOccupant')}</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {occupantsList.map((a: AffectationPoste) => (
                                    <li key={a.id} className="flex items-center gap-3 py-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]"><UserRound className="h-4 w-4 text-[var(--color-dominant-600)]" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">{a.membrePersonnel ? `${a.membrePersonnel.utilisateur?.profil?.prenom ?? ''} ${a.membrePersonnel.utilisateur?.profil?.nom ?? ''}`.trim() : (a.membrePersonnelId || '—')}</p>
                                            {a.membrePersonnel?.matricule && <p className="text-xs text-muted-foreground font-mono">{a.membrePersonnel.matricule}</p>}
                                        </div>
                                        {a.statut && <Badge variant="default" size="sm">{a.statut}</Badge>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                )}

                {tab === 'position' && (
                    <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t('unites')} :</span><span className="font-medium text-foreground">{poste.uniteOrganisationnelle?.nom || '—'}</span></div>
                        <div className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t('fonction')} :</span><span className="font-medium text-foreground">{poste.fonction?.nom || '—'}</span></div>
                        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">{t('capacite')} :</span><PosteCapaciteIndicator occupantsCount={poste.occupantsCount} nombrePostes={poste.nombrePostes} size="sm" /></div>
                    </Card>
                )}
                {tab === 'historique' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('historique')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AuditTimeline cible="Poste" cibleId={id} module="organisation" />
                        </CardContent>
                    </Card>
                )}
            </TabsContent>

            <PosteFormModal open={showEditModal} onOpenChange={setShowEditModal} poste={poste} />
            <ConfirmDialog
                open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}
                title={t('supprimerPoste')} description={t('confirmerSuppressionPoste')}
                confirmText={t('supprimer')} variant="danger"
                onConfirm={async () => { await supprimer.mutateAsync(poste.id); navigate({ to: '/organisation/postes' }); }}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
