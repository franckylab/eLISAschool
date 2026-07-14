import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Building2, Edit, Trash2, Info,
    Layers, Briefcase, GitBranch, Users, Settings,
    CheckCircle, XCircle,
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
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { LoadingState } from '@/components/feedback';
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

    const onglets: { id: Onglet; label: string; icon: typeof Info }[] = [
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
                            <ElisaButton variant="outline" size="sm" icon={<SlidersHorizontal className="h-4 w-4" />}
                                onClick={() => navigate({ to: '/organisation/nomenclatures' })}>
                                Nomenclatures
                            </ElisaButton>
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
                        </div>
                    </div>
                </div>
            </motion.div>

            <CardGrid columns={{ default: 1, md: 5 }}>
                <StatCard icon={Building2} label={t('titre')} value={organisation.nom} color="blue" />
                <StatCard icon={Layers} label={t('unites')} value={stats.data?.totalUnites ?? '-'} color="purple" />
                <StatCard icon={Briefcase} label={t('postes')} value={stats.data?.totalPostes ?? '-'} color="purple" />
                <StatCard icon={CheckCircle} label={t('occupation', { taux: stats.data?.tauxOccupation ?? '-' })}
                    value={`${stats.data?.postesActifs ?? '-'}/${stats.data?.totalPostes ?? '-'}`}
                    color={((stats.data?.tauxOccupation ?? 0) >= 80) ? 'green' : ((stats.data?.tauxOccupation ?? 0) >= 50) ? 'yellow' : 'red'} />
                <StatCard icon={Users} label={t('postesVacants')} value={stats.data?.postesVacants ?? '-'} color="orange" />
            </CardGrid>

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
            {ongletActif === 'fonctions' && <TabFonctions organisationId={organisation.id} />}
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

export function OrganisationPage() {
    const { t } = useTranslation('organisation');
    const { data: organisation, isLoading } = useOrganisationMine();

    if (isLoading) {
        return <div className="p-6"><LoadingState message={t('chargementOrganisation')} /></div>;
    }

    if (!organisation) {
        return <CreateOrganisation onCreated={() => window.location.reload()} />;
    }

    return <OrganisationDetail organisation={organisation} />;
}
