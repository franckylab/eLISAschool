import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Gauge, Edit, BookOpen, Info, Calendar, Link2 } from 'lucide-react';
import { useNiveau, useModifierNiveau } from '../hooks/use-niveaux';
import { NiveauFormModal } from './niveau-form-modal';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { InfoField } from '@/components/ui/InfoField';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import { StatCard } from '@/components/ui/StatCard';
import { CardSection } from '@/components/ui/Card';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { useTabState } from '@/hooks/useTabState';
import type { Tab } from '@/components/ui/Tabs';

const SOUS_SYSTEME_LABELS: Record<string, string> = {
    FRANCOPHONE: 'Francophone',
    ANGLOPHONE: 'Anglophone',
    BICULTUREL: 'Biculturel',
};

export function NiveauDetailPage() {
    const { t } = useTranslation('niveaux');
    const { id } = useParams({ from: '/_auth/niveaux/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: niveau, isLoading, error, refetch } = useNiveau(id);
    const modifier = useModifierNiveau();
    const [formOpen, setFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useTabState<'informations' | 'examen'>('informations');

    const tabs: Tab[] = [
        { id: 'informations', label: t('informations'), description: t('tabInformationsDesc'), icon: Info },
        { id: 'examen', label: t('tabExamenNational'), description: t('tabExamenNationalDesc'), icon: BookOpen },
    ];

    if (isLoading) {
        return (
            <div className="p-6">
                <PageSkeleton showStats={false} showTable={false} />
            </div>
        );
    }

    if (error || !niveau) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('niveauNonTrouve')}
                    message={error?.message || t('niveauNonTrouve')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
                <div className="mt-4">
                    <ElisaButton variant="outline" onClick={() => navigate({ to: '/niveaux' })}>
                        {t('retourListe')}
                    </ElisaButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                showBreadcrumbs
                title={niveau.nom}
                subtitle={niveau.code}
                icon={Gauge}
                onBack={() => navigate({ to: '/niveaux' })}
                status={{
                    label: niveau.actif ? t('actif') : t('inactif'),
                    variant: niveau.actif ? 'success' : 'danger',
                }}
                actions={hasPermission('niveaux:edit') ? (
                    <ElisaButton
                        onClick={() => setFormOpen(true)}
                        icon={<Edit className="h-4 w-4" />}
                        variant="primary"
                    >
                        {t('modifier')}
                    </ElisaButton>
                ) : undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    label={t('sousSysteme')}
                    value={SOUS_SYSTEME_LABELS[niveau.sousSysteme] || niveau.sousSysteme}
                    icon={Gauge}
                    tone="info"
                    delay={0.05}
                />
                <StatCard
                    label={t('cycle')}
                    value={niveau.cycle?.nom || '-'}
                    icon={BookOpen}
                    tone="purple"
                    delay={0.1}
                />
                <StatCard
                    label={t('classeExamen')}
                    value={niveau.estClasseExamen ? t('oui') : t('non')}
                    icon={Link2}
                    tone={niveau.estClasseExamen ? 'warning' : 'muted'}
                    delay={0.15}
                />
            </div>

            <TabsBar
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'informations' | 'examen')}
                variant="underline"
                showHeader
            />

            <TabsContent activeTab={activeTab}>
                {activeTab === 'informations' && (
                    <CardSection
                        icon={<Info className="h-5 w-5" />}
                        title={t('informations')}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InfoField
                                label={t('code')}
                                value={<span className="font-mono">{niveau.code || '-'}</span>}
                            />
                            <InfoField
                                label={t('ordre')}
                                value={niveau.ordre}
                            />
                            <InfoField
                                label={t('sousSysteme')}
                                value={SOUS_SYSTEME_LABELS[niveau.sousSysteme] || niveau.sousSysteme}
                            />
                            <InfoField
                                label={t('classeExamen')}
                                value={niveau.estClasseExamen ? t('oui') : t('non')}
                            />
                            <InfoField
                                label={t('cycle')}
                                value={niveau.cycle ? (
                                    <button
                                        onClick={() => navigate({ to: '/cycles/$id', params: { id: niveau.cycle!.id } })}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {niveau.cycle.nom}
                                    </button>
                                ) : '-'}
                            />
                            <InfoField
                                label={t('statut')}
                                value={
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${niveau.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {niveau.actif ? t('actif') : t('inactif')}
                                    </span>
                                }
                            />
                        </div>
                    </CardSection>
                )}

                {activeTab === 'examen' && (
                    <CardSection
                        icon={<BookOpen className="h-5 w-5" />}
                        title={t('examenNationalLie')}
                    >
                        {niveau.examenNational ? (
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <BookOpen className="h-5 w-5 text-orange-600" />
                                </div>
                                <div>
                                    <button
                                        onClick={() => navigate({ to: '/examens-nationaux/$id', params: { id: niveau.examenNational!.id } })}
                                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {niveau.examenNational.nom}
                                    </button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{niveau.examenNational.code}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('aucun')}</p>
                        )}
                    </CardSection>
                )}
            </TabsContent>

            <CardSection
                icon={<Calendar className="h-5 w-5" />}
                title={t('informations')}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoField
                        label={t('creeLe')}
                        value={new Date(niveau.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    />
                    <InfoField
                        label={t('modifieLe')}
                        value={new Date(niveau.updatedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                        })}
                    />
                </div>
            </CardSection>

            {formOpen && (
                <NiveauFormModal
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    niveau={niveau}
                    onSave={async (formData) => {
                        await modifier.mutateAsync({ id: niveau.id, ...formData });
                        setFormOpen(false);
                    }}
                    isLoading={modifier.isPending}
                />
            )}
        </div>
    );
}
