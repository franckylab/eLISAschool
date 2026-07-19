import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Building2, Edit, Trash2, Info,
    Layers, Briefcase, GitBranch, Users, Settings,
    CheckCircle,
    SlidersHorizontal, ArrowRight,
} from 'lucide-react';
import { useOrganisationMine, useCreerOrganisation, useSupprimerOrganisation, useStatistiquesOrganisation } from '../hooks/use-organisation';
import { OrganisationFormModal } from './organisation-form-modal';
import { TabInfos } from './tab-infos';
import { TabUnites } from './tab-unites';
import { TabPostes } from './tab-postes';
import { TabFonctions } from './tab-fonctions';
import { TabHierarchie } from './tab-hierarchie';
import { TabConfiguration } from './tab-configuration';
import { PageHeader } from '@/components/layout/PageHeader';
import { TabsBar, TabsContent } from '@/components/ui/Tabs';
import type { Tab } from '@/components/ui/Tabs';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { usePermissions, useDocumentTitle } from '@/hooks';
import type { Organisation, CreerOrganisationDto } from '../types/organisation.types';
type Onglet = 'infos' | 'unites' | 'postes' | 'fonctions' | 'hierarchie' | 'configuration';

function CreateOrganisation({ onCreated }: { onCreated: () => void }) {
    const { t } = useTranslation('organisation');
    const creer = useCreerOrganisation();
    const [nom, setNom] = useState('');
    const [type, setType] = useState('ETABLISSEMENT_SCOLAIRE');
    const [code, setCode] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        creer.mutate({ nom, type, code: code || undefined } as CreerOrganisationDto, { onSuccess: () => onCreated() });
    };

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-lg"
            >
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
                    <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('titre')}</h1>
                                <p className="text-sm text-gray-500">{t('gererOrganisations')}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('nom')} <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={t('nom')} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('type')}
                                </label>
                                <select value={type} onChange={(e) => setType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    {Object.entries(t('typeOrganisationLabel', { returnObjects: true }) as Record<string, string>)
                                        .map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    {t('code')}
                                </label>
                                <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                    placeholder="EX: LYC-001" />
                            </div>

                            <div className="pt-4">
                                <ElisaButton type="submit" variant="primary" className="w-full" size="lg"
                                    icon={<ArrowRight className="h-5 w-5" />} disabled={!nom || creer.isPending}>
                                    {creer.isPending ? t('chargement') : t('creerOrganisation')}
                                </ElisaButton>
                            </div>
                        </form>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function OrganisationDetail({ organisation }: { organisation: Organisation }) {
    const { t } = useTranslation('organisation');
    const navigate = useNavigate();
    const search = useSearch({ from: '/_auth/organisation/' });
    const { hasPermission } = usePermissions();
    useDocumentTitle(`eLISAschool | ${organisation.nom}`);
    const stats = useStatistiquesOrganisation(organisation.id);
    const supprimer = useSupprimerOrganisation();

    const ongletActif = (search as any)?.tab || 'infos' as Onglet;
    const setOngletActif = (tab: Onglet) => navigate({ to: '/organisation', search: { tab } as any });

    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const onglets: Tab[] = [
        { id: 'infos', label: t('informations'), icon: Info },
        { id: 'unites', label: t('unites'), icon: Layers },
        { id: 'postes', label: t('postes'), icon: Briefcase },
        { id: 'fonctions', label: t('fonctions'), icon: GitBranch },
        { id: 'hierarchie', label: t('hierarchie'), icon: Users },
        { id: 'configuration', label: t('configuration'), icon: Settings },
    ];

    const handleDelete = async () => {
        await supprimer.mutateAsync(organisation.id);
        setShowDeleteConfirm(false);
        window.location.reload();
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={organisation.nom}
                subtitle={`${organisation.code ? `${organisation.code} · ` : ''}${organisation.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || ''}`}
                icon={Building2}
                variant="gradient"
                status={organisation.statut === 'ACTIF' ? { label: t('actif'), variant: 'success' } : { label: t('archive'), variant: 'info' }}
                actions={
                    <div className="flex flex-col gap-2">
                        <ElisaButton variant="outline" size="sm" leftIcon={<SlidersHorizontal className="h-4 w-4" />}
                            onClick={() => navigate({ to: '/organisation/nomenclatures' })}>
                            Nomenclatures
                        </ElisaButton>
                        {hasPermission('organisation:edit') && (
                            <>
                                <ElisaButton variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}
                                    onClick={() => setShowEditModal(true)}>
                                    {t('modifier')}
                                </ElisaButton>
                                <ElisaButton variant="danger" size="sm" leftIcon={<Trash2 className="h-4 w-4" />}
                                    onClick={() => setShowDeleteConfirm(true)}>
                                    {t('supprimer')}
                                </ElisaButton>
                            </>
                        )}
                    </div>
                }
            />

            <CardGrid>
                <StatCard icon={Building2} label={t('titre')} value={organisation.nom} color="blue" />
                <StatCard icon={Layers} label={t('unites')} value={stats.data?.totalUnites ?? '-'} color="purple" />
                <StatCard icon={Briefcase} label={t('postes')} value={stats.data?.totalPostes ?? '-'} color="purple" />
                <StatCard icon={CheckCircle} label={t('occupation', { taux: stats.data?.tauxOccupation ?? '-' })}
                    value={`${stats.data?.postesActifs ?? '-'}/${stats.data?.totalPostes ?? '-'}`}
                    color={((stats.data?.tauxOccupation ?? 0) >= 80) ? 'green' : ((stats.data?.tauxOccupation ?? 0) >= 50) ? 'yellow' : 'red'} />
                <StatCard icon={Users} label={t('postesVacants')} value={stats.data?.postesVacants ?? '-'} color="orange" />
            </CardGrid>

            <TabsBar
                tabs={onglets}
                activeTab={ongletActif}
                onTabChange={(tabId) => setOngletActif(tabId as Onglet)}
                variant="underline"
            />

            <TabsContent activeTab={ongletActif}>
                {ongletActif === 'infos' && <TabInfos organisation={organisation} />}
                {ongletActif === 'unites' && <TabUnites organisationId={organisation.id} />}
                {ongletActif === 'postes' && <TabPostes organisationId={organisation.id} />}
                {ongletActif === 'fonctions' && <TabFonctions organisationId={organisation.id} />}
                {ongletActif === 'hierarchie' && <TabHierarchie organisationId={organisation.id} />}
                {ongletActif === 'configuration' && <TabConfiguration organisationId={organisation.id} />}
            </TabsContent>

            {showEditModal && (
                <OrganisationFormModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    organisation={organisation}
                />
            )}

            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false); }}
                onConfirm={handleDelete}
                title={t('supprimerOrganisation')}
                description={t('confirmerSuppressionOrg')}
                confirmText={t('supprimer')}
                variant="danger"
            />
        </div>
    );
}

export function OrganisationPage() {
    const { data: organisation, isLoading, isError, error, refetch } = useOrganisationMine();

    if (isLoading && !organisation) {
        return <PageSkeleton />;
    }

    if (isError) {
        return <ErrorMessage message={(error as Error)?.message} onRetry={refetch} />;
    }

    if (!organisation) {
        return <CreateOrganisation onCreated={() => window.location.reload()} />;
    }

    return <OrganisationDetail organisation={organisation} />;
}
