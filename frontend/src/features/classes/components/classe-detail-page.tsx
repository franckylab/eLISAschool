import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, Users, BookOpen, MapPin,
    Edit, Trash2, UserPlus, TrendingUp, Award, Power,
    Calendar, CheckCircle, XCircle, AlertCircle,
    GraduationCap, School,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CardGrid } from '@/components/ui/CardGrid';
import { StatCard } from '@/components/ui/StatCard';
import { useClasse, useSupprimerClasse, useAffecterEleve, useElevesClasse, useToggleActifClasse } from '../hooks/use-classes';
import { useEleves } from '@/features/eleves/hooks/use-eleves';
import { ClasseFormModal } from './classe-form-modal';
import { ChangerSalleModal } from './changer-salle-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { Eleve } from '@/features/eleves/types/eleve.types';

type OngletActif = 'informations' | 'eleves' | 'statistiques';

const creneauKey: Record<string, string> = {
    MATIN: 'matin',
    APRES_MIDI: 'apresMidi',
    JOURNEE_COMPLETE: 'journeeComplete',
};

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className || ''}`} />;
}

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export function ClasseDetailPage() {
    const { t } = useTranslation('classes');
    const { id } = useParams({ from: '/_auth/classes/$id' });
    const navigate = useNavigate();
    const estMobile = useMediaQuery('(max-width: 767px)');

    const [ongletActif, setOngletActif] = useState<OngletActif>('informations');
    const [modalEditionOpen, setModalEditionOpen] = useState(false);
    const [modalAffectationOpen, setModalAffectationOpen] = useState(false);
    const [modalChangerSalleOpen, setModalChangerSalleOpen] = useState(false);
    const [classeToDelete, setClasseToDelete] = useState(false);
    const [classeToToggle, setClasseToToggle] = useState(false);
    const [pageEleves, setPageEleves] = useState(1);
    const [rechercheEleves, setRechercheEleves] = useState('');

    const { data: classe, isLoading: loadingClasse, error: erreurClasse } = useClasse(id);
    const supprimer = useSupprimerClasse();
    const toggleActif = useToggleActifClasse();

    const { data: elevesClasseData, isLoading: loadingEleves } = useElevesClasse(id, pageEleves, 20, rechercheEleves || undefined);
    const eleves = (elevesClasseData?.eleves?.items || []) as Eleve[];
    const statsEleves = elevesClasseData?.stats;
    const paginationEleves = elevesClasseData?.eleves?.meta;

    const statsSexe = useMemo(() => {
        if (statsEleves) return statsEleves;
        return { garcons: 0, filles: 0, total: 0, pourcentageGarcons: 0, pourcentageFilles: 0 };
    }, [statsEleves]);

    const tauxOccupation = useMemo(() => {
        if (!classe?.effectifMax) return null;
        const effectif = statsEleves?.total ?? classe.effectifActuel ?? 0;
        return {
            pourcentage: (effectif / classe.effectifMax) * 100,
            effectif,
            capacite: classe.effectifMax,
        };
    }, [classe, statsEleves]);

    const colonnesEleves: Column<Eleve>[] = [
        {
            key: 'matricule',
            header: t('colonnes.matricule'),
            render: (e) => <span className="font-mono text-sm">{e.matricule}</span>,
        },
        {
            key: 'nomComplet',
            header: t('colonnes.nomComplet'),
            render: (e) => (
                <div>
                    <p className="font-medium">{e.prenom} {e.nom}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-200">
                        {e.sexe === 'M' ? t('sexe.masculin') : t('sexe.feminin')}
                    </p>
                </div>
            ),
        },
        {
            key: 'dateNaissance',
            header: t('colonnes.dateNaissance'),
            render: (e) => new Date(e.dateNaissance).toLocaleDateString('fr-FR'),
        },
        {
            key: 'statut',
            header: t('colonnes.statut'),
            render: (e) => (
                <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                    e.statut === 'ACTIF'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                }`}>
                    {e.statut === 'ACTIF' ? t('statut.actif') : t('statut.inactif')}
                </span>
            ),
        },
    ];

    const onglets = [
        { id: 'informations' as const, label: t('onglets.informations'), icon: BookOpen },
        { id: 'eleves' as const, label: `${t('onglets.eleves')} (${statsEleves?.total ?? 0})`, icon: Users },
        { id: 'statistiques' as const, label: t('onglets.statistiques'), icon: TrendingUp },
    ];

    const handleSuppression = async () => {
        await supprimer.mutateAsync(id);
        navigate({ to: '/classes' });
        setClasseToDelete(false);
    };

    const handleToggleActif = async () => {
        if (classe) {
            await toggleActif.mutateAsync({ id: classe.id, actif: !classe.actif });
            setClasseToToggle(false);
        }
    };

    if (loadingClasse) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Skeleton className="h-10 w-48 mb-8" />
                <Skeleton className="h-40 w-full mb-8" />
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-48" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-32" />
                        <Skeleton className="h-32" />
                    </div>
                </div>
            </div>
        );
    }

    if (erreurClasse || !classe) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-600 mb-2">
                    {t('erreurs.classeNonTrouvee')}
                </p>
                <p className="text-gray-500 dark:text-gray-200 mb-6">
                    {t('erreurs.classeNonTrouveeMessage') || "La classe demandée n'existe pas ou a été supprimée."}
                </p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/classes' })}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t('boutons.retour')}
                </ElisaButton>
            </div>
        );
    }

    const niveauNom = classe.niveau?.nom || '-';
    const cycleNom = classe.niveau?.cycle?.nom;
    const salleNom = classe.salle?.nom || classe.sallePrincipaleId || t('info.nonAssignee');
    const principalNom = classe.professeurPrincipal
        ? `${classe.professeurPrincipal.prenom} ${classe.professeurPrincipal.nom}`
        : t('info.nonAssigne');
    const effectifActuel = classe.effectifActuel || 0;
    const effectifMax = classe.effectifMax || null;

    const typeColors: Record<string, { text: string; bg: string }> = {
        NORMALE: { text: 'text-blue-700', bg: 'bg-blue-50' },
        BILINGUE: { text: 'text-purple-700', bg: 'bg-purple-50' },
        RENFORCEE: { text: 'text-orange-700', bg: 'bg-orange-50' },
        INTERNATIONALE: { text: 'text-indigo-700', bg: 'bg-indigo-50' },
    };
    const tc = typeColors[classe.typeClasse] || { text: 'text-gray-700 dark:text-gray-400', bg: 'bg-gray-50' };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <PageHeader
                    variant="gradient"
                    icon={GraduationCap}
                    onBack={() => navigate({ to: '/classes' })}
                    breadcrumbLabel={classe.nom}
                    actions={
                        <div className="flex gap-2">
                            <ElisaButton
                                onClick={() => setClasseToToggle(true)}
                                icon={<Power className="h-4 w-4" />}
                            >
                                {classe.actif ? t('actions.desactiver') : t('actions.activer')}
                            </ElisaButton>
                            <ElisaButton
                                onClick={() => setModalEditionOpen(true)}
                                icon={<Edit className="h-4 w-4" />}
                            >
                                {t('boutons.modifier')}
                            </ElisaButton>
                            <ElisaButton
                                variant="danger"
                                onClick={() => setClasseToDelete(true)}
                                icon={<Trash2 className="h-4 w-4" />}
                            >
                                {t('boutons.supprimer')}
                            </ElisaButton>
                        </div>
                    }
                >
                    <div className="flex items-center gap-[clamp(0.75rem,3vw,1.25rem)]">
                        <div className="h-[clamp(2.5rem,8vw,3.5rem)] w-[clamp(2.5rem,8vw,3.5rem)] rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[clamp(0.875rem,3vw,1.25rem)] font-bold text-white shrink-0">
                            {classe.nom.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-[var(--text-3xl)] font-bold text-white leading-tight">{classe.nom}</h1>
                            <div className="flex items-center gap-[clamp(0.375rem,1.5vw,0.5rem)] flex-wrap mt-1">
                                <span className="font-mono text-[var(--text-sm)] text-dominant-200">{classe.code}</span>
                                <span className="text-dominant-200/50">•</span>
                                <span className="text-[var(--text-sm)] text-dominant-200">{niveauNom}</span>
                                {cycleNom && (
                                    <>
                                        <span className="text-dominant-200/50">•</span>
                                        <span className="text-[var(--text-sm)] text-dominant-200">{cycleNom}</span>
                                    </>
                                )}
                                <span className="text-dominant-200/50">•</span>
                                <span className={`inline-flex items-center gap-[clamp(0.25rem,0.75vw,0.375rem)] px-[clamp(0.5rem,1.5vw,0.75rem)] py-[clamp(0.125rem,0.3vw,0.125rem)] rounded-full text-[var(--text-xs)] font-medium ${
                                    classe.actif ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
                                }`}>
                                    {classe.actif
                                        ? <><CheckCircle className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" /> {t('statut.actif')}</>
                                        : <><XCircle className="h-[clamp(0.75rem,2vw,0.875rem)] w-[clamp(0.75rem,2vw,0.875rem)]" /> {t('statut.inactif')}</>
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </PageHeader>

                <CardGrid columns={{ default: 1, sm: 2, lg: 4 }} className="mb-8">
                    <StatCard
                        icon={Users}
                        label={t('stats.effectif')}
                        value={`${statsEleves?.total ?? effectifActuel} / ${effectifMax || '∞'}`}
                        tone="dominant"
                    />
                    <StatCard icon={MapPin} label={t('stats.salle')} value={salleNom} tone="success" />
                    <StatCard icon={Award} label={t('stats.principal')} value={principalNom} tone="purple" />
                    <StatCard
                        icon={School}
                        label={t('stats.type')}
                        value={t(`types.${classe.typeClasse.toLowerCase()}`) || classe.typeClasse}
                        tone="info"
                    />
                </CardGrid>

                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                    <nav className="flex gap-6">
                        {onglets.map((onglet) => {
                            const Icon = onglet.icon;
                            return (
                                <button
                                    key={onglet.id}
                                    onClick={() => setOngletActif(onglet.id)}
                                    className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                                        ongletActif === onglet.id
                                            ? 'border-dominant-600 text-dominant-600'
                                            : 'border-transparent text-gray-500 dark:text-gray-200 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {onglet.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <motion.div
                    key={ongletActif}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {ongletActif === 'informations' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-5 flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-blue-500" />
                                        {t('info.titreGeneral')}
                                    </h2>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.nomClasse')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{classe.nom}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.code')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200 font-mono">{classe.code}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.niveau')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{niveauNom}</dd>
                                        </div>
                                        {cycleNom && (
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.cycle')}</dt>
                                                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{cycleNom}</dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.typeClasse')}</dt>
                                            <dd>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>
                                                    <GraduationCap className="h-3.5 w-3.5" />
                                                    {t(`types.${classe.typeClasse.toLowerCase()}`) || classe.typeClasse}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.creneau')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">
                                                {t(`creneaux.${creneauKey[classe.creneauHoraire] || 'matin'}`)}
                                            </dd>
                                        </div>
                                    </dl>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-5 flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-green-500" />
                                        {t('info.titreConfig')}
                                    </h2>
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.effectifMax')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{effectifMax || t('info.illimite')}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.sallePrincipale')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{salleNom}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.statut')}</dt>
                                            <dd>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                                    classe.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {classe.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                                    {classe.actif ? t('statut.actif') : t('statut.inactif')}
                                                </span>
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.anneeScolaire')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{classe.anneeScolaire?.libelle || '-'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-1">{t('info.filiere')}</dt>
                                            <dd className="text-sm font-semibold text-gray-900 dark:text-gray-200">{classe.filiere?.nom || '-'}</dd>
                                        </div>
                                    </dl>
                                    {classe.description && (
                                        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
                                            <dt className="text-xs font-medium text-gray-500 dark:text-gray-200 uppercase tracking-wider mb-2">{t('info.description')}</dt>
                                            <dd className="text-sm text-gray-700 dark:text-gray-400 leading-relaxed">{classe.description}</dd>
                                        </div>
                                    )}
                                </motion.div>

                                {/* EDT preview plié */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-indigo-500" />
                                        Emploi du temps
                                    </h4>
                                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 text-center">
                                        <Calendar className="h-8 w-8 mx-auto text-indigo-400 mb-2" />
                                        <p className="text-sm font-medium text-indigo-700 mb-1">
                                            Visualisation de l'emploi du temps
                                        </p>
                                        <p className="text-xs text-indigo-500">
                                            L'affichage détaillé de l'emploi du temps sera disponible dans une prochaine version.
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            <div className="space-y-6">
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className={`rounded-xl shadow-sm border p-6 ${
                                        classe.actif ? 'bg-green-50 border-green-200' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        {classe.actif
                                            ? <CheckCircle className="h-6 w-6 text-green-600" />
                                            : <XCircle className="h-6 w-6 text-gray-400 dark:text-gray-100" />
                                        }
                                        <span className={`font-semibold text-lg ${classe.actif ? 'text-green-800' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {classe.actif ? t('statut.actif') : t('statut.inactif')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        {classe.actif
                                            ? t('statut.actifDescription') || 'Cette classe est actuellement active et utilisable.'
                                            : t('statut.inactifDescription') || 'Cette classe est actuellement inactive.'}
                                    </p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <Users className="h-4 w-4 text-gray-400 dark:text-gray-100" />
                                        {t('stats.effectif')}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{t('sexe.garcons')}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{statsSexe.garcons}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{t('sexe.filles')}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{statsSexe.filles}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                            <span className="text-sm text-gray-600 dark:text-gray-300">{t('stats.total')}</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-200">{statsSexe.total}</span>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.35 }}
                                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                                >
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-100" />
                                        {t('info.systeme') || 'Informations système'}
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-200 text-xs">{t('info.creeLe') || 'Créé le'}</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-200">{formatDateTime(classe.createdAt)}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500 dark:text-gray-200 text-xs">{t('info.modifieLe') || 'Modifié le'}</p>
                                            <p className="font-medium text-gray-900 dark:text-gray-200">{formatDateTime(classe.updatedAt)}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </div>
                    )}

                    {ongletActif === 'eleves' && (
                        <div>
                            <div className={`flex ${estMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-4`}>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200">
                                    {t('eleves.inscrits')} ({statsEleves?.total ?? 0})
                                </h3>
                                <div className={`flex ${estMobile ? 'flex-col gap-2' : 'items-center gap-3'}`}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder={t('eleves.rechercher')}
                                            value={rechercheEleves}
                                            onChange={(e) => { setRechercheEleves(e.target.value); setPageEleves(1); }}
                                            className="pl-3 pr-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                            style={{ width: 'clamp(120px, 30vw, 200px)' }}
                                        />
                                    </div>
                                    <ElisaButton
                                        variant="primary"
                                        size="sm"
                                        icon={<UserPlus className="h-4 w-4" />}
                                        onClick={() => setModalAffectationOpen(true)}
                                    >
                                        {t('eleves.inscrireEleve')}
                                    </ElisaButton>
                                </div>
                            </div>
                            {loadingEleves ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                    <Skeleton className="h-10 w-full mb-4" />
                                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full mb-2" />)}
                                </div>
                            ) : eleves.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-400 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-200">{t('eleves.aucunEleve')}</p>
                                </div>
                            ) : (
                                <DataTable
                                    tableId="classe-eleves"
                                    data={eleves}
                                    columns={colonnesEleves}
                                    pagination={paginationEleves ? {
                                        page: paginationEleves.currentPage,
                                        limit: paginationEleves.itemsPerPage,
                                        total: paginationEleves.totalItems,
                                        totalPages: paginationEleves.totalPages,
                                        hasNext: paginationEleves.hasNext,
                                        hasPrev: paginationEleves.hasPrev,
                                        onPageChange: setPageEleves,
                                    } : undefined}
                                    enableReordering
                                    enablePinning
                                    enableColumnVisibility
                                />
                            )}
                        </div>
                    )}

                    {ongletActif === 'statistiques' && (
                        <div className={`grid ${estMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-6`}>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">{t('stats.tauxOccupation')}</h3>
                                {tauxOccupation ? (
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600 dark:text-gray-300">Effectif / Capacité max</span>
                                                <span className="font-medium text-gray-900 dark:text-gray-200">
                                                    {tauxOccupation.effectif} / {tauxOccupation.capacite}
                                                </span>
                                            </div>
                                            <div className="overflow-hidden h-3 rounded bg-blue-100">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(tauxOccupation.pourcentage, 100)}%` }}
                                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                                    className="h-full bg-blue-500 rounded"
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-200">
                                                {tauxOccupation.pourcentage.toFixed(1)}% {t('stats.rempli')}
                                            </p>
                                        </div>
                                        {classe.salle?.capacite && (
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-300">Effectif / Capacité salle</span>
                                                    <span className="font-medium text-gray-900 dark:text-gray-200">
                                                        {tauxOccupation.effectif} / {classe.salle.capacite}
                                                    </span>
                                                </div>
                                                <div className="overflow-hidden h-3 rounded bg-emerald-100">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min((tauxOccupation.effectif / classe.salle.capacite) * 100, 100)}%` }}
                                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                                        className={`h-full rounded ${tauxOccupation.effectif > classe.salle.capacite ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-200">
                                                    {Math.min((tauxOccupation.effectif / classe.salle.capacite) * 100, 100).toFixed(1)}% utilisé
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 dark:text-gray-100">{t('stats.pasDeLimite')}</p>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-200 mb-4">{t('stats.repartitionSexe')}</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-1 text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{t('sexe.garcons')}</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-200">{statsSexe.garcons}</span>
                                        </div>
                                        <div className="overflow-hidden h-2 rounded bg-blue-100">
                                            <div
                                                style={{ width: `${statsSexe.pourcentageGarcons}%` }}
                                                className="h-full bg-blue-500 transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1 text-sm">
                                            <span className="text-gray-600 dark:text-gray-300">{t('sexe.filles')}</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-200">{statsSexe.filles}</span>
                                        </div>
                                        <div className="overflow-hidden h-2 rounded bg-pink-100">
                                            <div
                                                style={{ width: `${statsSexe.pourcentageFilles}%` }}
                                                className="h-full bg-pink-500 transition-all duration-500"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-gray-100 pt-2">{t('stats.totalEleves')}: {statsSexe.total}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>

                {modalChangerSalleOpen && (
                    <ChangerSalleModal
                        classe={classe}
                        onClose={() => setModalChangerSalleOpen(false)}
                    />
                )}

                {modalEditionOpen && (
                    <ClasseFormModal
                        mode="edition"
                        classe={classe}
                        onSuccess={() => setModalEditionOpen(false)}
                        onCancel={() => setModalEditionOpen(false)}
                    />
                )}

                <ConfirmationModal
                    isOpen={classeToDelete}
                    title={t('confirmations.supprimerTitre')}
                    message={t('confirmations.supprimerMessage', { nom: classe.nom })}
                    details={t('confirmations.supprimerDetails')}
                    variant="danger"
                    onConfirm={handleSuppression}
                    onCancel={() => setClasseToDelete(false)}
                    isLoading={supprimer.isPending}
                />

                <ConfirmationModal
                    isOpen={classeToToggle}
                    title={classe.actif ? t('confirmations.desactiverTitre') : t('confirmations.activerTitre')}
                    message={classe.actif
                        ? t('confirmations.desactiverMessage', { nom: classe.nom })
                        : t('confirmations.activerMessage', { nom: classe.nom })
                    }
                    variant={classe.actif ? 'warning' : 'info'}
                    onConfirm={handleToggleActif}
                    onCancel={() => setClasseToToggle(false)}
                    isLoading={toggleActif.isPending}
                />

                {modalAffectationOpen && (
                    <ModalAffectationEleve
                        classeId={id}
                        onClose={() => setModalAffectationOpen(false)}
                    />
                )}
            </motion.div>
        </div>
    );
}

interface ModalAffectationEleveProps {
    classeId: string;
    onClose: () => void;
}

function ModalAffectationEleve({ classeId, onClose }: ModalAffectationEleveProps) {
    const { t } = useTranslation('classes');
    const affecterEleve = useAffecterEleve();
    const [eleveId, setEleveId] = useState('');
    const [dateAffectation, setDateAffectation] = useState(new Date().toISOString().split('T')[0]);
    const [motif, setMotif] = useState('');
    const [commentaire, setCommentaire] = useState('');

    const { data: tousElevesData } = useEleves({ page: 1, limit: 100 });
    const { data: elevesAffectesData } = useElevesClasse(classeId, 1, 500);

    const elevesDejaAffectes = new Set(
        (elevesAffectesData?.eleves?.items || []).map((e: any) => e.id)
    );
    const elevesDisponibles = (tousElevesData?.items || []).filter(
        (e: Eleve) => !elevesDejaAffectes.has(e.id)
    );

    const optionsEleves = elevesDisponibles.map((e: Eleve) => ({
        value: e.id,
        label: `${e.prenom} ${e.nom} (${e.matricule})`,
    }));

    const optionsMotifs = [
        { value: '', label: t('affectation.motifs.aucun') },
        { value: 'INSCRIPTION', label: t('affectation.motifs.inscription') },
        { value: 'CHANGEMENT_CLASSE', label: t('affectation.motifs.changementClasse') },
        { value: 'PASSAGE_NIVEAU', label: t('affectation.motifs.passageNiveau') },
        { value: 'TRANSFERE', label: t('affectation.motifs.transfere') },
        { value: 'REDOUBLEMENT', label: t('affectation.motifs.redoublement') },
    ];

    const handleSubmit = async () => {
        if (!eleveId) return;
        try {
            await affecterEleve.mutateAsync({
                eleveId,
                classeId,
                dateAffectation,
                motifChangement: motif || undefined,
                commentaire: commentaire || undefined,
            });
            onClose();
        } catch {
            // Handled by the hook
        }
    };

    return (
        <CustomModal
            open={true}
            onOpenChange={(open) => { if (!open) onClose(); }}
            title={t('affectation.titre')}
            description={t('affectation.description')}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={onClose}>
                        {t('boutons.annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        isLoading={affecterEleve.isPending}
                        onClick={handleSubmit}
                        disabled={!eleveId}
                    >
                        {t('affectation.affecter')}
                    </ElisaButton>
                </>
            }
        >
            <div className="space-y-4">
                <ElisaSelect
                    label={t('affectation.eleve')}
                    value={eleveId}
                    onValueChange={setEleveId}
                    options={optionsEleves}
                    placeholder={t('affectation.selectionnerEleve')}
                    required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                            {t('affectation.date')}
                        </label>
                        <input
                            type="date"
                            value={dateAffectation}
                            onChange={(e) => setDateAffectation(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        />
                    </div>
                    <ElisaSelect
                        label={t('affectation.motif')}
                        value={motif}
                        onValueChange={setMotif}
                        options={optionsMotifs}
                        placeholder={t('affectation.selectionnerMotif')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1">
                        {t('affectation.commentaire')}
                    </label>
                    <textarea
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder={t('affectation.commentairePlaceholder')}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    />
                </div>
            </div>
        </CustomModal>
    );
}
