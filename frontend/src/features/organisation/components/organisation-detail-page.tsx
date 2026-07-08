import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, Trash2, Building2, Info,
    Layers, Briefcase, Users, Settings,
    AlertCircle, CheckCircle, XCircle, Globe,
    Mail, Phone, MapPin, Globe2,
} from 'lucide-react';
import { useOrganisation, useSupprimerOrganisation, useStatistiquesOrganisation } from '../hooks/use-organisation';
import { OrganisationFormModal } from './organisation-form-modal';
import { TabInfos } from './tab-infos';
import { TabUnites } from './tab-unites';
import { TabPostes } from './tab-postes';
import { TabHierarchie } from './tab-hierarchie';
import { TabConfiguration } from './tab-configuration';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { LoadingState } from '@/components/feedback';
import { usePermissions } from '@/hooks';

type Onglet = 'infos' | 'unites' | 'postes' | 'hierarchie' | 'configuration';

export function OrganisationDetailPage() {
    const { t } = useTranslation('organisation');
    const { id } = useParams({ from: '/_auth/organisation/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: organisation, isLoading, error } = useOrganisation(id);
    const stats = useStatistiquesOrganisation(id);
    const supprimer = useSupprimerOrganisation();

    const [ongletActif, setOngletActif] = useState<Onglet>('infos');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    if (isLoading) return <div className="p-6"><LoadingState message={t('chargementOrganisation')} /></div>;

    if (error || !organisation) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <AlertCircle className="h-16 w-16 text-gray-400" />
                <p className="text-lg text-gray-600 dark:text-gray-400">{t('organisationNonTrouvee')}</p>
                <ElisaButton variant="primary" onClick={() => navigate({ to: '/organisation' })}>
                    {t('retourListe')}
                </ElisaButton>
            </div>
        );
    }

    const onglets: { id: Onglet; label: string; icon: typeof Info }[] = [
        { id: 'infos', label: t('informations'), icon: Info },
        { id: 'unites', label: t('unites'), icon: Layers },
        { id: 'postes', label: t('postes'), icon: Briefcase },
        { id: 'hierarchie', label: t('hierarchie'), icon: Users },
        { id: 'configuration', label: t('configuration'), icon: Settings },
    ];

    const handleDelete = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/organisation' });
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <Breadcrumbs currentLabel={organisation.nom} />

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
                <div className="h-2 w-full bg-blue-500" />

                <div className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-lg shrink-0">
                                <Building2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 truncate">{organisation.nom}</h1>
                                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                                        organisation.statut === 'ACTIF'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                        {organisation.statut === 'ACTIF' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                        {organisation.statut === 'ACTIF' ? t('actif') : t('archive')}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    {organisation.code && (
                                        <div className="flex items-center gap-2">
                                            <Globe className="h-4 w-4" />
                                            <span className="font-mono">{organisation.code}</span>
                                        </div>
                                    )}
                                    {organisation.type && (
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4" />
                                            <span>{organisation.type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            {hasPermission('organisation:edit') && (
                                <>
                                    <ElisaButton variant="outline" size="sm" icon={<Edit className="h-4 w-4" />}
                                        onClick={() => setShowEditModal(true)}>
                                        {t('modifier')}
                                    </ElisaButton>
                                    <ElisaButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />}
                                        onClick={() => setShowDeleteConfirm(true)}>
                                        {t('supprimer')}
                                    </ElisaButton>
                                </>
                            )}
                            <ElisaButton variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/organisation' })}>
                                {t('retour')}
                            </ElisaButton>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard icon={Building2} label={t('titre')} value={organisation.nom} color="blue" delay={0} />
                <StatCard icon={Layers} label={t('unites')} value={stats.data?.totalUnites ?? '-'} color="indigo" delay={0.1} />
                <StatCard icon={Briefcase} label={t('postes')} value={stats.data?.totalPostes ?? '-'} color="purple" delay={0.15} />
                <StatCard icon={CheckCircle} label={t('occupation', { taux: stats.data?.tauxOccupation ?? '-' })}
                    value={`${stats.data?.postesActifs ?? '-'}/${stats.data?.totalPostes ?? '-'}`}
                    color={((stats.data?.tauxOccupation ?? 0) >= 80) ? 'green' : ((stats.data?.tauxOccupation ?? 0) >= 50) ? 'yellow' : 'red'} delay={0.2} />
                <StatCard icon={Users} label={t('postesVacants')} value={stats.data?.postesVacants ?? '-'} color="orange" delay={0.25} />
            </div>

            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex gap-6 overflow-x-auto">
                    {onglets.map((o) => {
                        const Icon = o.icon;
                        return (
                            <button key={o.id} onClick={() => setOngletActif(o.id)}
                                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                    ongletActif === o.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                                }`}>
                                <Icon className="h-4 w-4" />
                                {o.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {ongletActif === 'infos' && <TabInfos organisation={organisation} />}
            {ongletActif === 'unites' && <TabUnites organisationId={organisation.id} />}
            {ongletActif === 'postes' && <TabPostes organisationId={organisation.id} />}
            {ongletActif === 'hierarchie' && <TabHierarchie organisationId={organisation.id} />}
            {ongletActif === 'configuration' && <TabConfiguration organisationId={organisation.id} />}

            {showEditModal && (
                <OrganisationFormModal
                    open={showEditModal}
                    onOpenChange={setShowEditModal}
                    organisation={organisation}
                />
            )}

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onCancel={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title={t('supprimerOrganisation')}
                message={t('confirmerSuppressionOrg')}
                confirmLabel={t('supprimer')}
                cancelLabel={t('annuler')}
                variant="danger"
            />
        </div>
    );
}
