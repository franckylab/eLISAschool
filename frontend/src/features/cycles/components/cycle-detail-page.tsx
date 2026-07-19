import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import {
    Edit, IterationCcw, Award, Layers, Clock, Hash, Calendar,
    Info,
} from 'lucide-react';
import { useCycle, useModifierCycle } from '../hooks/use-cycles';
import { useNiveauxByCycle } from '@/features/niveaux';
import { useFilieresByCycle } from '@/features/filieres';
import { CycleFormModal } from './cycle-form-modal';
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

const TABS: Tab[] = [
    { id: 'informations', label: 'Informations', icon: Info },
    { id: 'niveaux', label: 'Niveaux', icon: Layers },
    { id: 'filieres', label: 'Filières', icon: Award },
];

export function CycleDetailPage() {
    const { t } = useTranslation('cycles');
    const { id } = useParams({ from: '/_auth/cycles/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: cycle, isLoading, error, refetch } = useCycle(id);
    const { data: niveaux } = useNiveauxByCycle(id);
    const { data: filieres } = useFilieresByCycle(id);
    const modifier = useModifierCycle();
    const [formOpen, setFormOpen] = useState(false);
    const [activeTab, setActiveTab] = useTabState<'informations' | 'niveaux' | 'filieres'>('informations');

    if (isLoading) {
        return (
            <div className="p-6">
                <PageSkeleton showStats showTable={false} />
            </div>
        );
    }

    if (error || !cycle) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('cycleNonTrouve')}
                    message={t('messageCycleNonTrouve')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer')}
                />
                <div className="mt-4">
                    <ElisaButton variant="outline" onClick={() => navigate({ to: '/cycles' })}>
                        {t('retourListe')}
                    </ElisaButton>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={cycle.nom}
                subtitle={cycle.code}
                icon={IterationCcw}
                variant="gradient"
                tone="purple"
                onBack={() => navigate({ to: '/cycles' })}
                status={{
                    label: cycle.actif ? t('actif') : t('inactif'),
                    variant: cycle.actif ? 'success' : 'danger',
                }}
                actions={hasPermission('cycles:edit') ? (
                    <ElisaButton
                        onClick={() => setFormOpen(true)}
                        icon={<Edit className="h-4 w-4" />}
                        variant="primary"
                    >
                        {t('modifier')}
                    </ElisaButton>
                ) : undefined}
            />

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard label={t('niveaux')} value={niveaux?.length ?? 0} icon={Layers} tone="purple" />
                <StatCard label={t('filieres')} value={filieres?.length ?? 0} icon={Award} tone="accent" />
                <StatCard label={t('duree')} value={`${cycle.dureeAnnees || 0} an${(cycle.dureeAnnees || 0) > 1 ? 's' : ''}`} icon={Clock} tone="info" />
                <StatCard label={t('ordre')} value={`n° ${cycle.ordre}`} icon={Hash} tone="warning" />
            </div>

            <TabsBar
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'informations' | 'niveaux' | 'filieres')}
                variant="pills"
            />

            <TabsContent activeTab={activeTab}>
                {activeTab === 'informations' && (
                    <CardSection icon={<Info className="h-5 w-5" />} title={t('informationsGenerales')}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InfoField label={t('code')} value={<span className="font-mono">{cycle.code}</span>} />
                            <InfoField label={t('ordre')} value={cycle.ordre} />
                            <InfoField label={t('dureeAnnees')} value={`${cycle.dureeAnnees || 0} an${(cycle.dureeAnnees || 0) > 1 ? 's' : ''}`} />
                            <InfoField
                                label={t('diplome')}
                                value={cycle.diplomeSanctionnant ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-semibold">
                                        <Award className="h-4 w-4" />
                                        {cycle.diplomeSanctionnant}
                                    </span>
                                ) : t('aucun')}
                            />
                            <InfoField
                                label={t('statut')}
                                value={
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cycle.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {cycle.actif ? t('actif') : t('inactif')}
                                    </span>
                                }
                            />
                        </div>
                        {cycle.description && (
                            <div className="mt-4">
                                <InfoField label={t('description')} value={cycle.description} />
                            </div>
                        )}
                    </CardSection>
                )}

                {activeTab === 'niveaux' && niveaux && niveaux.length > 0 && (
                    <CardSection icon={<Layers className="h-5 w-5" />} title={`${t('niveauxDuCycle')} (${niveaux.length})`}>
                        <div className="space-y-0">
                            {niveaux.map((n, index) => (
                                <div
                                    key={n.id}
                                    className={`flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group ${index < niveaux.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                                    onClick={() => navigate({ to: '/niveaux/$id', params: { id: n.id } })}
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">{n.ordre}</div>
                                        {index < niveaux.length - 1 && <div className="w-0.5 h-full min-h-[1.5rem] bg-purple-100" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{n.nom}</span>
                                            {n.code && <span className="font-mono text-xs text-gray-400">{n.code}</span>}
                                            {n.estClasseExamen && (
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Classe d'examen</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardSection>
                )}

                {activeTab === 'filieres' && filieres && filieres.length > 0 && (
                    <CardSection icon={<Award className="h-5 w-5" />} title={`${t('filieresDuCycle')} (${filieres.length})`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filieres.map((f) => (
                                <div
                                    key={f.id}
                                    onClick={() => navigate({ to: '/filieres/$id', params: { id: f.id } })}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                                >
                                    <div className="p-2.5 rounded-xl bg-indigo-50"><Award className="h-5 w-5 text-indigo-600" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium">{f.nom}</p>
                                        <p className="font-mono text-xs text-gray-400">{f.code}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardSection>
                )}
            </TabsContent>

            <CardSection icon={<Calendar className="h-5 w-5" />} title={t('informations')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoField
                        label={t('creeLe')}
                        value={new Date(cycle.createdAt).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    />
                    <InfoField
                        label={t('modifieLe')}
                        value={new Date(cycle.updatedAt).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    />
                </div>
            </CardSection>

            <CycleFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                cycle={cycle}
                onSave={async (data) => {
                    await modifier.mutateAsync({ id: cycle.id, ...data });
                    setFormOpen(false);
                }}
                isLoading={modifier.isPending}
            />
        </div>
    );
}
