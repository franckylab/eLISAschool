import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Edit, Building2,
    CheckCircle, Wrench, AlertCircle,
    Users, MapPin, Calendar,
    Monitor, FlaskConical, BookOpen,
    Theater, Dumbbell, Music, Palette,
    Briefcase, HelpCircle, Clock,
    GraduationCap, Printer, Copy,
    MoreHorizontal, AlertTriangle,
} from 'lucide-react';
import { useSalle, useStatistiquesSalles, useModifierSalle, useSalleStats, useSalleEmploiDuTemps, useSalleClasses } from '../hooks/use-salles';
import { TypeSalle, StatutSalle } from '../types/salle.types';
import type { CreneauEmploiDuTemps } from '../types/salle.types';
import { SalleFormModal } from '../components/SalleFormModal';
import { AssignerClasseModal } from '../components/AssignerClasseModal';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { usePermissions } from '@/hooks';
import { toast } from 'sonner';

const TYPE_SALLE_CONFIG: Record<TypeSalle, { icon: React.ElementType; label: string; gradient: string; iconBg: string }> = {
    [TypeSalle.CLASSIQUE]: { icon: Building2, label: 'Classique', gradient: 'from-blue-50 to-blue-100', iconBg: 'bg-blue-100' },
    [TypeSalle.LABORATOIRE]: { icon: FlaskConical, label: 'Laboratoire', gradient: 'from-green-50 to-green-100', iconBg: 'bg-green-100' },
    [TypeSalle.INFORMATIQUE]: { icon: Monitor, label: 'Informatique', gradient: 'from-cyan-50 to-cyan-100', iconBg: 'bg-cyan-100' },
    [TypeSalle.AMPHITHEATRE]: { icon: Theater, label: 'Amphithéâtre', gradient: 'from-purple-50 to-purple-100', iconBg: 'bg-purple-100' },
    [TypeSalle.SPORT]: { icon: Dumbbell, label: 'Sport', gradient: 'from-orange-50 to-orange-100', iconBg: 'bg-orange-100' },
    [TypeSalle.MUSIQUE]: { icon: Music, label: 'Musique', gradient: 'from-pink-50 to-pink-100', iconBg: 'bg-pink-100' },
    [TypeSalle.ARTS]: { icon: Palette, label: 'Arts', gradient: 'from-yellow-50 to-yellow-100', iconBg: 'bg-yellow-100' },
    [TypeSalle.BIBLIOTHEQUE]: { icon: BookOpen, label: 'Bibliothèque', gradient: 'from-indigo-50 to-indigo-100', iconBg: 'bg-indigo-100' },
    [TypeSalle.ADMINISTRATION]: { icon: Briefcase, label: 'Administration', gradient: 'from-gray-50 to-gray-100', iconBg: 'bg-gray-100' },
    [TypeSalle.AUTRE]: { icon: HelpCircle, label: 'Autre', gradient: 'from-slate-50 to-slate-100', iconBg: 'bg-slate-100' },
};

const STATUT_STYLES: Record<StatutSalle, { icon: React.ElementType; label: string; color: string; bg: string }> = {
    [StatutSalle.DISPONIBLE]: { icon: CheckCircle, label: 'Disponible', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    [StatutSalle.EN_MAINTENANCE]: { icon: Wrench, label: 'En maintenance', color: 'text-amber-600', bg: 'bg-amber-50' },
    [StatutSalle.INDISPONIBLE]: { icon: AlertCircle, label: 'Indisponible', color: 'text-red-600', bg: 'bg-red-50' },
};

const JOURS = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const JOURS_COURTS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
const CRENEAUX = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

const STATUT_HERO_COLORS: Record<StatutSalle, string> = {
    [StatutSalle.DISPONIBLE]: 'from-emerald-600 via-emerald-700 to-teal-800',
    [StatutSalle.EN_MAINTENANCE]: 'from-amber-600 via-amber-700 to-orange-800',
    [StatutSalle.INDISPONIBLE]: 'from-red-600 via-red-700 to-rose-800',
};

const TYPE_CRENEAU_COLORS: Record<string, string> = {
    COURS: 'bg-blue-100 text-blue-700 border-blue-200',
    TD: 'bg-green-100 text-green-700 border-green-200',
    TP: 'bg-purple-100 text-purple-700 border-purple-200',
    ETUDE: 'bg-amber-100 text-amber-700 border-amber-200',
    RECREATION: 'bg-pink-100 text-pink-700 border-pink-200',
};

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function getTodayDay(): string {
    const dayMap = ['DIMANCHE', 'LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
    return dayMap[new Date().getDay()];
}

function getHourFromTime(t: string): number {
    return parseInt(t.split(':')[0], 10);
}

function SalleDetailSkeleton() {
    return <PageSkeleton showStats showTable />;
}

function buildCreneauMap(creneaux: CreneauEmploiDuTemps[]): Record<string, Record<string, CreneauEmploiDuTemps[]>> {
    const map: Record<string, Record<string, CreneauEmploiDuTemps[]>> = {};
    for (const c of creneaux) {
        if (!map[c.jour]) map[c.jour] = {};
        if (!map[c.jour][c.heureDebut]) map[c.jour][c.heureDebut] = [];
        map[c.jour][c.heureDebut].push(c);
    }
    return map;
}

export function SalleDetailPage() {
    const { t } = useTranslation('salles');
    const { salleId } = useParams({ from: '/_auth/salles/$salleId' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: salle, isLoading, error, refetch } = useSalle(salleId);
    const { data: globalStats } = useStatistiquesSalles();
    const { data: salleStats } = useSalleStats(salleId);
    const { data: emploiDuTemps = [] } = useSalleEmploiDuTemps(salleId);
    const { data: classesLiees = [] } = useSalleClasses(salleId);
    const modifier = useModifierSalle();
    const [formOpen, setFormOpen] = useState(false);
    const [statutMenuOpen, setStatutMenuOpen] = useState(false);
    const [duplicateFromId, setDuplicateFromId] = useState<string | null>(null);
    const [assignerClasseOpen, setAssignerClasseOpen] = useState(false);
    const [showDepassementWarning, setShowDepassementWarning] = useState(true);
    const [showTotalWarning, setShowTotalWarning] = useState(true);

    const creneauMap = useMemo(() => buildCreneauMap(emploiDuTemps), [emploiDuTemps]);

    const today = getTodayDay();
    const todayCreneaux = useMemo(
        () => emploiDuTemps.filter(c => c.jour === today).sort((a, b) => a.heureDebut.localeCompare(b.heureDebut)),
        [emploiDuTemps, today]
    );

    const upcomingCreneaux = useMemo(
        () => emploiDuTemps
            .filter(c => {
                const dayIdx = JOURS.indexOf(c.jour);
                const todayIdx = JOURS.indexOf(today);
                if (dayIdx < todayIdx) return false;
                if (dayIdx === todayIdx) {
                    const h = getHourFromTime(c.heureDebut);
                    const now = new Date().getHours();
                    return h > now;
                }
                return true;
            })
            .sort((a, b) => {
                const da = JOURS.indexOf(a.jour);
                const db = JOURS.indexOf(b.jour);
                if (da !== db) return da - db;
                return a.heureDebut.localeCompare(b.heureDebut);
            })
            .slice(0, 5),
        [emploiDuTemps, today]
    );

    const handleStatutChange = async (newStatut: StatutSalle) => {
        try {
            await modifier.mutateAsync({ id: salleId, dto: { statut: newStatut } });
            toast.success(`Statut changé en ${STATUT_STYLES[newStatut].label}`);
            setStatutMenuOpen(false);
        } catch {
            toast.error('Erreur lors du changement de statut');
        }
    };

    const handleDuplicate = () => {
        setDuplicateFromId(salle!.id);
    };

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) return <SalleDetailSkeleton />;

    if (error || !salle) {
        return (
            <div className="p-6">
                <ErrorMessage
                    title={t('salleNonTrouvee')}
                    message={t('salleNonTrouveeDesc')}
                    onRetry={() => refetch()}
                    retryLabel={t('reessayer', { ns: 'common' })}
                />
            </div>
        );
    }

    const salleStatut = !salle.disponible ? StatutSalle.INDISPONIBLE : salle.statut;
    const statutInfo = STATUT_STYLES[salleStatut] || STATUT_STYLES[StatutSalle.INDISPONIBLE];
    const typeConfig = TYPE_SALLE_CONFIG[salle.typeSalle] || TYPE_SALLE_CONFIG[TypeSalle.AUTRE];
    const heroGradient = STATUT_HERO_COLORS[salleStatut] || STATUT_HERO_COLORS[StatutSalle.DISPONIBLE];
    const StatutIcon = statutInfo.icon;

    const occupancyRate = salleStats?.tauxOccupation ?? (
        globalStats && globalStats.total > 0
            ? Math.round(((globalStats.total - globalStats.disponibles) / globalStats.total) * 100)
            : 0
    );

    const heroStats = [
        {
            icon: Users, label: 'Capacité', value: `${salle.capacite} places`,
            color: 'text-blue-600', iconBg: 'bg-blue-100',
        },
        {
            icon: typeConfig.icon, label: 'Type', value: typeConfig.label,
            color: 'text-indigo-600', iconBg: 'bg-indigo-100',
        },
        {
            icon: MapPin, label: 'Localisation',
            value: salle.localisation || 'Non renseignée',
            color: 'text-emerald-600', iconBg: 'bg-emerald-100',
        },
        {
            icon: Calendar, label: 'Taux occupation',
            value: `${occupancyRate}%`,
            color: 'text-purple-600', iconBg: 'bg-purple-100',
        },
    ];

    const capacityPercent = salleStats
        ? Math.min(100, Math.round((salleStats.heuresReservees / salleStats.totalCreneauxSemaine) * 100))
        : 0;

    const totalEffectifActuel = classesLiees.reduce((sum, cl) => sum + (cl.effectifActuel || 0), 0);
    const totalEffectifMax = classesLiees.reduce((sum, cl) => sum + (cl.effectifMax || 0), 0);
    const effectifRatioMax = totalEffectifMax > 0 ? (totalEffectifActuel / totalEffectifMax) * 100 : 0;
    const effectifRatioCapacite = salle.capacite > 0 ? (totalEffectifActuel / salle.capacite) * 100 : 0;

    const classesDepassantCapacite = classesLiees.filter((cl) => cl.effectifMax > salle.capacite);
    const nbClassesDepassantes = classesDepassantCapacite.length;

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <PageHeader showBreadcrumbs breadcrumbLabel={salle.nom} />
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/salles' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    {t('retourAuxSalles')}
                </ElisaButton>

                <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${heroGradient} p-8 mb-8`}>
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                        <Building2 className="w-full h-full" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Building2 className="h-10 w-10 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-1">{salle.nom}</h1>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="font-mono text-sm text-white/70">{salle.code}</span>
                                        <span className="text-white/50">•</span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                                            <StatutIcon className="h-3.5 w-3.5" />
                                            {statutInfo.label}
                                        </span>
                                        {salleStats && (
                                            <>
                                                <span className="text-white/50">•</span>
                                                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-white/15 text-white/90">
                                                    <GraduationCap className="h-3.5 w-3.5" />
                                                    {salleStats.classesLiees} classe{salleStats.classesLiees !== 1 ? 's' : ''}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasPermission('config:edit') && (
                                    <div className="relative">
                                        <ElisaButton
                                            onClick={() => setStatutMenuOpen(!statutMenuOpen)}
                                            variant="ghost"
                                            icon={<MoreHorizontal className="h-4 w-4" />}
                                            className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                        >
                                                    {t('statut')}
                                                </ElisaButton>
                                        <AnimatePresence>
                                            {statutMenuOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -8 }}
                                                    className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                                                >
                                                    {Object.values(StatutSalle).map((st) => {
                                                        const stInfo = STATUT_STYLES[st];
                                                        const StIcon = stInfo.icon;
                                                        const isActive = st === salleStatut;
                                                        return (
                                                            <button
                                                                key={st}
                                                                onClick={() => handleStatutChange(st)}
                                                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                                                    isActive
                                                                        ? 'bg-gray-50 text-gray-900 font-medium'
                                                                        : 'text-gray-600 hover:bg-gray-50'
                                                                }`}
                                                            >
                                                                <StIcon className={`h-4 w-4 ${stInfo.color}`} />
                                                                {stInfo.label}
                                                                {isActive && <CheckCircle className="h-3.5 w-3.5 text-emerald-500 ml-auto" />}
                                                            </button>
                                                        );
                                                    })}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                <ElisaButton
                                    onClick={handleDuplicate}
                                    variant="ghost"
                                    icon={<Copy className="h-4 w-4" />}
                                    className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                >
                                    {t('dupliquer')}
                                </ElisaButton>
                                <ElisaButton
                                    onClick={handlePrint}
                                    variant="ghost"
                                    icon={<Printer className="h-4 w-4" />}
                                    className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                >
                                    {t('imprimer')}
                                </ElisaButton>
                                {hasPermission('config:edit') && (
                                    <ElisaButton
                                        onClick={() => setFormOpen(true)}
                                        icon={<Edit className="h-4 w-4" />}
                                        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                    >
                                        {t('modifier')}
                                    </ElisaButton>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {heroStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-[var(--color-texte)]">{stat.value}</p>
                                <p className="text-sm text-[var(--color-texte-secondaire)] mt-0.5">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                {salleStats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6 mb-8"
                    >
                        <h2 className="text-lg font-semibold text-[var(--color-texte)] mb-5 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-purple-500" />
                            {t('tauxOccupationTitre')}
                            {totalEffectifMax > salle.capacite && (
                                <Badge variant="warning" size="xs" icon={<AlertTriangle className="h-3 w-3" />} title="La somme des effectifs max dépasse la capacité de la salle">
                                    Capacité
                                </Badge>
                            )}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{t('creneauxOccupes')}</span>
                                    <span className="font-medium text-gray-900">
                                        {salleStats.creneauxOccupes} / {salleStats.totalCreneauxSemaine}
                                    </span>
                                </div>
                                <div className="overflow-hidden h-3 rounded bg-blue-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((salleStats.creneauxOccupes / salleStats.totalCreneauxSemaine) * 100, 100)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className="h-full bg-blue-500 rounded"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('desCreneauxUtilises', { percent: Math.min((salleStats.creneauxOccupes / salleStats.totalCreneauxSemaine) * 100, 100).toFixed(1) })}
                                </p>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{t('heuresReserveesSemaine')}</span>
                                    <span className="font-medium text-gray-900">
                                        {salleStats.heuresReservees}h / {salleStats.totalCreneauxSemaine}h
                                    </span>
                                </div>
                                <div className="overflow-hidden h-3 rounded bg-purple-100">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${capacityPercent}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded ${capacityPercent > 80 ? 'bg-red-500' : 'bg-purple-500'}`}
                                    />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('deCapaciteHoraireUtilisee', { percent: capacityPercent })}
                                </p>
                            </div>
                        </div>

                        {classesLiees.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                    {t('effectifs')} ({totalEffectifActuel} {t('eleves')})
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{t('effectifCapaciteMaxClasses')}</span>
                                            <span className="font-medium text-gray-900">
                                                {totalEffectifActuel} / {totalEffectifMax}
                                            </span>
                                        </div>
                                        <div className="overflow-hidden h-3 rounded bg-blue-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(effectifRatioMax, 100)}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className="h-full bg-blue-500 rounded"
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('deCapaciteMaxUtilisee', { percent: effectifRatioMax.toFixed(1) })}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{t('effectifCapaciteSalle')}</span>
                                            <span className="font-medium text-gray-900">
                                                {totalEffectifActuel} / {salle.capacite}
                                            </span>
                                        </div>
                                        <div className="overflow-hidden h-3 rounded bg-emerald-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.min(effectifRatioCapacite, 100)}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className={`h-full rounded ${totalEffectifActuel > salle.capacite ? 'bg-red-500' : 'bg-emerald-500'}`}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {t('deCapacitePhysiqueUtilisee', { percent: effectifRatioCapacite.toFixed(1) })}
                                        </p>
                                    </div>
                                </div>

                                {showDepassementWarning && nbClassesDepassantes > 0 && (
                                    <ErrorMessage
                                        variant="warning"
                                        title={t('incoherenceDetectee')}
                                        message={t('incoherenceMessage', { count: nbClassesDepassantes, capacite: salle.capacite })}
                                        dismissible
                                        onDismiss={() => setShowDepassementWarning(false)}
                                        autoDismissMs={30000}
                                    />
                                )}
                                {showTotalWarning && totalEffectifMax > salle.capacite && (
                                    <ErrorMessage
                                        variant="warning"
                                        title={t('depassementCapaciteTotale')}
                                        message={t('depassementMessage', { total: totalEffectifMax, capacite: salle.capacite })}
                                        dismissible
                                        onDismiss={() => setShowTotalWarning(false)}
                                        autoDismissMs={30000}
                                    />
                                )}
                            </div>
                        )}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-[var(--color-dominant-500)]" />
                                    {t('informationsGenerales')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider mb-1">{t('type')}</dt>
                                        <dd className="flex items-center gap-2">
                                            <div className={`p-1 rounded-md ${typeConfig.iconBg}`}>
                                                <typeConfig.icon className="h-4 w-4 text-[var(--color-texte)]" />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--color-texte)]">{typeConfig.label}</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider mb-1">{t('capacite')}</dt>
                                        <dd className="text-sm font-semibold text-[var(--color-texte)]">{t('nPlaces', { count: salle.capacite })}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider mb-1">{t('localisation')}</dt>
                                        <dd className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-texte)]">
                                            <MapPin className="h-4 w-4 text-[var(--color-texte-muted)]" />
                                            {salle.localisation || <span className="italic text-[var(--color-texte-muted)]">{t('nonRenseignee')}</span>}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider mb-1">{t('code')}</dt>
                                        <dd className="text-sm font-semibold text-[var(--color-texte)] font-mono">{salle.code}</dd>
                                    </div>
                                    {salle.description && (
                                        <div className="sm:col-span-2">
                                            <dt className="text-xs font-medium text-[var(--color-texte-muted)] uppercase tracking-wider mb-1">{t('description')}</dt>
                                            <dd className="text-sm text-[var(--color-texte-secondaire)] leading-relaxed">{salle.description}</dd>
                                        </div>
                                    )}
                                </dl>
                            </CardContent>
                        </Card>

                        {salle.equipements && salle.equipements.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                            >
                                <div className="flex items-center gap-2 mb-5">
                                    <Monitor className="h-5 w-5 text-gray-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Équipements</h2>
                                    <span className="text-sm text-gray-400">({salle.equipements.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {salle.equipements.map((equip, index) => {
                                        const colors = [
                                            'bg-blue-50 text-blue-700 border-blue-200',
                                            'bg-green-50 text-green-700 border-green-200',
                                            'bg-purple-50 text-purple-700 border-purple-200',
                                            'bg-amber-50 text-amber-700 border-amber-200',
                                            'bg-pink-50 text-pink-700 border-pink-200',
                                            'bg-cyan-50 text-cyan-700 border-cyan-200',
                                            'bg-indigo-50 text-indigo-700 border-indigo-200',
                                            'bg-orange-50 text-orange-700 border-orange-200',
                                        ];
                                        const color = colors[index % colors.length];
                                        return (
                                            <span
                                                key={equip}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${color}`}
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                                {equip}
                                            </span>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {todayCreneaux.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="h-5 w-5 text-emerald-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">{t('aujourdhui')}</h2>
                                    <Badge variant="outline" className="text-xs">
                                        {todayCreneaux.length} créneau{todayCreneaux.length !== 1 ? 'x' : ''}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    {todayCreneaux.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                                        >
                                            <div className="text-center min-w-[64px]">
                                                <p className="text-xs font-mono font-bold text-gray-700">{c.heureDebut}</p>
                                                <p className="text-[10px] font-mono text-gray-400">{c.heureFin}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {c.matiere?.nom || 'Cours'}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : ''}
                                                    {c.classeAnnee?.classe ? ` • ${c.classeAnnee.classe.nom}` : ''}
                                                </p>
                                            </div>
                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${TYPE_CRENEAU_COLORS[c.typeCreneau || 'COURS'] || TYPE_CRENEAU_COLORS['COURS']}`}>
                                                {c.typeCreneau || 'COURS'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">{t('planningOccupation')}</h2>
                                    <Badge variant="outline" className="text-xs">
                                        {emploiDuTemps.length} créneau{emploiDuTemps.length !== 1 ? 'x' : ''}
                                    </Badge>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px] border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="p-2 text-left text-xs font-medium text-gray-500 w-14" />
                                            {JOURS_COURTS.map((jour, idx) => (
                                                <th key={idx} className="p-2 text-center text-xs font-medium text-gray-500">
                                                    {jour}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {CRENEAUX.map((heure) => {
                                            const isMidday = heure === '12:00';
                                            return (
                                                <tr key={heure} className={isMidday ? '' : 'border-t border-gray-100'}>
                                                    <td className="py-1.5 pr-2 text-[10px] text-gray-400 font-mono text-right align-top pt-2">
                                                        {heure}
                                                    </td>
                                                    {JOURS.map((jour, _idx) => {
                                                        const slotsAtTime = creneauMap[jour]?.[heure];
                                                        const isOccupied = slotsAtTime && slotsAtTime.length > 0;
                                                        const creneau = isOccupied ? slotsAtTime![0] : undefined;
                                                        const matiereColor = creneau?.matiere?.couleur;
                                                        return (
                                                            <td key={`${jour}-${heure}`} className="p-0.5">
                                                                <div
                                                                    className={`h-7 rounded border transition-all cursor-pointer relative group ${
                                                                        isOccupied
                                                                            ? matiereColor
                                                                                ? ''
                                                                                : 'bg-blue-100 border-blue-200 hover:bg-blue-200'
                                                                            : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                                                                    }`}
                                                                    style={isOccupied && matiereColor ? {
                                                                        backgroundColor: `${matiereColor}20`,
                                                                        borderColor: `${matiereColor}40`,
                                                                    } : undefined}
                                                                >
                                                                    {isOccupied && (
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                                                                            <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                                                                {creneau?.matiere?.nom || 'Cours'}
                                                                                {creneau?.classeAnnee?.classe ? ` - ${creneau.classeAnnee.classe.nom}` : ''}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200" />
                                    <span>{t('occupe')}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                                    <span>{t('libre')}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400">
                                    {t('capacityUtilisee', { percent: capacityPercent })}
                                </span>
                            </div>
                        </motion.div>

                        {upcomingCreneaux.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="h-5 w-5 text-indigo-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">{t('prochainsCreneaux')}</h2>
                                </div>
                                <div className="space-y-2">
                                    {upcomingCreneaux.map((c) => {
                                        const dayLabel = JOURS_COURTS[JOURS.indexOf(c.jour)];
                                        return (
                                            <div
                                                key={c.id}
                                                className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="text-center min-w-[48px]">
                                                    <p className="text-xs font-bold text-gray-600">{dayLabel}</p>
                                                    <p className="text-xs font-mono text-gray-500">{c.heureDebut}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {c.matiere?.nom || 'Cours'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {c.classeAnnee?.classe?.nom || ''}
                                                        {c.enseignant ? ` - ${c.enseignant.prenom} ${c.enseignant.nom}` : ''}
                                                    </p>
                                                </div>
                                                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                                    TYPE_CRENEAU_COLORS[c.typeCreneau || 'COURS'] || TYPE_CRENEAU_COLORS['COURS']
                                                }`}>
                                                    {c.typeCreneau || 'COURS'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {(
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35 }}
                                className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                            >
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-amber-500" />
                                        <h2 className="text-lg font-semibold text-gray-900">{t('classesLiees')}</h2>
                                        {totalEffectifMax > salle.capacite && (
                                            <Badge variant="warning" size="xs" icon={<AlertTriangle className="h-3 w-3" />} title="La somme des effectifs max dépasse la capacité de la salle">
                                                Capacité
                                            </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                            {classesLiees.length}
                                        </Badge>
                                    </div>
                                    {hasPermission('classes:edit') && (
                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            icon={<GraduationCap className="h-4 w-4" />}
                                            onClick={() => setAssignerClasseOpen(true)}
                                        >
                                            {t('assignerClasse')}
                                        </ElisaButton>
                                    )}
                                </div>
                                {classesLiees.length > 0 ? (
                                    <div className="space-y-3">
                                        {classesLiees.map((cl) => (
                                            <div
                                                key={cl.id}
                                                className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all cursor-pointer"
                                                onClick={() => navigate({ to: `/classes/${cl.classeId}` })}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-amber-50">
                                                        <GraduationCap className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {cl.classe?.nom || 'Classe'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {cl.anneeScolaire?.libelle || ''}
                                                            {cl.professeurPrincipal
                                                                ? ` • ${cl.professeurPrincipal.prenom} ${cl.professeurPrincipal.nom}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-semibold ${cl.effectifMax > salle.capacite ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {cl.effectifActuel}/{cl.effectifMax}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">{t('eleves')}</p>
                                                    {cl.effectifMax > salle.capacite ? (
                                                        <p className="flex items-center justify-end gap-1 text-[10px] text-amber-600 mt-0.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {t('depasseCapaciteSalle', { capacite: salle.capacite })}
                                                        </p>
                                                    ) : (
                                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                                            {t('maxCapaciteSalle', { max: cl.effectifMax, capacite: salle.capacite })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm">{t('aucuneClasseLiee')}</p>
                                        <p className="text-xs mt-1">{t('assignerClasseDesc')}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                {t('apercu')}
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('capacite')}</span>
                                    <span className="text-sm font-semibold text-gray-900">{salle.capacite} places</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('type')}</span>
                                    <span className="text-sm font-semibold text-gray-900">{typeConfig.label}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('localisation')}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salle.localisation || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('equipements')}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salle.equipements?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('creneauxSem')}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salleStats?.creneauxOccupes ?? '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">{t('classesLiees')}</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salleStats?.classesLiees ?? '-'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {t('capaciteUtilisee')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{t('occupationHebdo')}</span>
                                    <span className="font-semibold text-gray-900">{capacityPercent}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${capacityPercent}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                            capacityPercent > 80
                                                ? 'bg-red-500'
                                                : capacityPercent > 50
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                        }`}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {t('hReserveesHDisponibles', { heures: salleStats?.heuresReservees ?? 0, total: salleStats?.totalCreneauxSemaine ?? 66 })}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-[var(--color-card)] rounded-xl shadow-sm border border-[var(--color-bordure)] p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                {t('informationsSysteme')}
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">{t('creeeLe')}</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(salle.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">{t('modifieeLe')}</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(salle.updatedAt)}</p>
                                </div>
                                {salle.id && (
                                    <div>
                                        <p className="text-gray-500 text-xs">ID</p>
                                        <p className="font-medium text-gray-900 text-[10px] font-mono break-all">{salle.id}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            <SalleFormModal
                open={formOpen}
                onOpenChange={(v) => { if (!v) setFormOpen(false); }}
                salleId={salle.id}
            />
            <SalleFormModal
                open={duplicateFromId !== null}
                onOpenChange={(v) => { if (!v) setDuplicateFromId(null); }}
                duplicateFromId={duplicateFromId || undefined}
            />
            {assignerClasseOpen && (
                <AssignerClasseModal
                    salleId={salle.id}
                    salleNom={salle.nom}
                    onClose={() => setAssignerClasseOpen(false)}
                />
            )}
        </div>
    );
}