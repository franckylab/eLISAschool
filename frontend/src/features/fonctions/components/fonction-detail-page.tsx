/**
 * ==================================
 * eLISAschool - Page Détail Fonction
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Détail routé : PageHeader gradient + TabsBar (Infos / Sous-fonctions / Membres).
 */

import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Edit, Briefcase, CheckCircle, XCircle, Info, Workflow, Users, UserRound } from 'lucide-react';
import { useFonction, useModifierFonction, useFonctionMembres } from '../hooks/use-fonctions';
import { FonctionFormModal } from './fonction-form-modal';
import { FonctionArbre } from './fonction-arbre';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { TabsBar, TabsContent, type Tab } from '@/components/ui';
import { usePermissions } from '@/hooks';

export function FonctionDetailPage() {
    const { t } = useTranslation('organisation');
    const { id } = useParams({ from: '/_auth/organisation/fonctions/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: fonction, isLoading, error, refetch } = useFonction(id);
    const { data: membres } = useFonctionMembres(id);
    const [formOpen, setFormOpen] = useState(false);
    const [tab, setTab] = useState('infos');
    const modifier = useModifierFonction();

    const handleSave = async (data: any) => {
        await modifier.mutateAsync({ id: fonction!.id, dto: data });
        setFormOpen(false);
    };

    if (isLoading) return <PageSkeleton showHeader />;
    if (error || !fonction) {
        return (
            <div className="p-6">
                <ErrorMessage title={t('erreurChargement')} message={t('erreurChargement')} onRetry={() => refetch()} retryLabel={t('reessayer')} />
            </div>
        );
    }

    const enfants = fonction.enfants || [];
    const membresList = membres || [];

    const onglets: Tab[] = [
        { id: 'infos', label: t('detailInfos'), icon: Info },
        { id: 'sous-fonctions', label: t('sousFonctions'), icon: Workflow },
        { id: 'membres', label: t('membres'), icon: Users },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                breadcrumbLabel={fonction.nom}
                onBack={() => navigate({ to: '/organisation/fonctions' })}
                actions={hasPermission('organisation:fonctions:write') ? (
                    <ElisaButton variant="primary" size="sm" icon={<Edit className="h-4 w-4" />} onClick={() => setFormOpen(true)}>{t('modifier')}</ElisaButton>
                ) : undefined}
            >
                <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                        <Briefcase className="h-7 w-7 text-white" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white leading-tight">{fonction.nom}</h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 font-mono">{fonction.code}</span>
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">{t('niveau')} {fonction.niveau}</span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90">
                                {fonction.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                {fonction.actif ? t('actif') : t('inactif')}
                            </span>
                        </div>
                    </div>
                </div>
            </PageHeader>

            <TabsBar tabs={onglets} activeTab={tab} onTabChange={setTab} variant="underline" showHeader />

            <TabsContent activeTab={tab}>
                {tab === 'infos' && (
                    <Card className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div><dt className="text-sm text-muted-foreground">{t('code')}</dt><dd className="font-mono font-medium text-foreground">{fonction.code}</dd></div>
                            <div><dt className="text-sm text-muted-foreground">{t('niveau')}</dt><dd className="text-foreground">{fonction.niveau}</dd></div>
                            <div>
                                <dt className="text-sm text-muted-foreground">{t('parent')}</dt>
                                <dd>
                                    {fonction.parent ? (
                                        <button onClick={() => navigate({ to: '/organisation/fonctions/$id', params: { id: fonction.parent!.id } })} className="text-sm font-medium text-primary hover:underline">{fonction.parent.nom}</button>
                                    ) : <span className="text-sm text-muted-foreground italic">{t('racine')}</span>}
                                </dd>
                            </div>
                            {fonction.majorationDefaut != null && (
                                <div><dt className="text-sm text-muted-foreground">{t('majorationDefaut')}</dt><dd className="text-foreground">{fonction.majorationDefaut}%</dd></div>
                            )}
                            {fonction.description && (
                                <div className="sm:col-span-2"><dt className="text-sm text-muted-foreground">{t('descriptionSection')}</dt><dd className="text-foreground">{fonction.description}</dd></div>
                            )}
                        </dl>
                    </Card>
                )}

                {tab === 'sous-fonctions' && (
                    <Card className="p-4">
                        {enfants.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('aucuneSousFonction')}</p>
                        ) : (
                            <FonctionArbre
                                fonctions={enfants.map((e) => ({ ...e, enfants: [] }))}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                onView={(f) => navigate({ to: '/organisation/fonctions/$id', params: { id: f.id } })}
                                compact
                            />
                        )}
                    </Card>
                )}

                {tab === 'membres' && (
                    <Card className="p-4">
                        {membresList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">{t('aucunMembre')}</p>
                        ) : (
                            <ul className="divide-y divide-border">
                                {membresList.map((m: any) => (
                                    <li key={m.id} className="flex items-center gap-3 py-2.5">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-dominant-100)]"><UserRound className="h-4 w-4 text-[var(--color-dominant-600)]" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-foreground truncate">{m.membrePersonnel ? `${m.membrePersonnel.prenom ?? ''} ${m.membrePersonnel.nom ?? ''}`.trim() : (m.membrePersonnelId || '—')}</p>
                                            {m.membrePersonnel?.matricule && <p className="text-xs text-muted-foreground font-mono">{m.membrePersonnel.matricule}</p>}
                                        </div>
                                        {m.estPrincipale && <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">{t('principale')}</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                )}
            </TabsContent>

            {formOpen && (
                <FonctionFormModal
                    open={formOpen}
                    onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                    fonction={fonction}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}
