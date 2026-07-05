import { useState, useMemo } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Edit, Building2,
    CheckCircle, Wrench, AlertCircle,
    Users, MapPin, Calendar,
    Monitor, FlaskConical, BookOpen,
    Theater, Dumbbell, Music, Palette,
    Briefcase, HelpCircle, Clock,
    GraduationCap, Printer, Copy,
    MoreHorizontal,
} from 'lucide-react';
import { useSalle, useStatistiquesSalles, useModifierSalle, useSalleStats, useSalleEmploiDuTemps, useSalleClasses } from '../hooks/use-salles';
import { TypeSalle, StatutSalle } from '../types/salle.types';
import type { CreneauEmploiDuTemps, ClasseLiee } from '../types/salle.types';
import { SalleFormModal } from '../components/SalleFormModal';
import { AssignerClasseModal } from '../components/AssignerClasseModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Badge } from '@/components/ui/Badge';
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

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />;
}

function SalleDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <Skeleton className="h-10 w-48 mb-8" />
            <Skeleton className="h-40 w-full mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-80" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
            </div>
        </div>
    );
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
    const { salleId } = useParams({ from: '/_auth/salles/$salleId' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: salle, isLoading, error } = useSalle(salleId);
    const { data: globalStats } = useStatistiquesSalles();
    const { data: salleStats } = useSalleStats(salleId);
    const { data: emploiDuTemps = [] } = useSalleEmploiDuTemps(salleId);
    const { data: classesLiees = [] } = useSalleClasses(salleId);
    const modifier = useModifierSalle();
    const [formOpen, setFormOpen] = useState(false);
    const [statutMenuOpen, setStatutMenuOpen] = useState(false);
    const [duplicateFromId, setDuplicateFromId] = useState<string | null>(null);
    const [assignerClasseOpen, setAssignerClasseOpen] = useState(false);

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
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-600 mb-2">Salle non trouvée</p>
                <p className="text-gray-500 mb-6">La salle demandée n'existe pas ou a été supprimée.</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/salles' })}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                </ElisaButton>
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/salles' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux salles
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
                                            Statut
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
                                    Dupliquer
                                </ElisaButton>
                                <ElisaButton
                                    onClick={handlePrint}
                                    variant="ghost"
                                    icon={<Printer className="h-4 w-4" />}
                                    className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                                >
                                    Imprimer
                                </ElisaButton>
                                {hasPermission('config:edit') && (
                                    <ElisaButton
                                        onClick={() => setFormOpen(true)}
                                        icon={<Edit className="h-4 w-4" />}
                                        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                                    >
                                        Modifier
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
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                                        <Icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                            </motion.div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-500" />
                                Informations générales
                            </h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Type</dt>
                                    <dd className="flex items-center gap-2">
                                        <div className={`p-1 rounded-md ${typeConfig.iconBg}`}>
                                            <typeConfig.icon className="h-4 w-4 text-gray-700" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{typeConfig.label}</span>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Capacité</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{salle.capacite} places</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Localisation</dt>
                                    <dd className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        {salle.localisation || <span className="text-gray-400 italic">Non renseignée</span>}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code</dt>
                                    <dd className="text-sm font-semibold text-gray-900 font-mono">{salle.code}</dd>
                                </div>
                                {salle.description && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</dt>
                                        <dd className="text-sm text-gray-700 leading-relaxed">{salle.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </motion.div>

                        {salle.equipements && salle.equipements.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
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
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="h-5 w-5 text-emerald-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Aujourd'hui</h2>
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
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Planning d'occupation</h2>
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
                                            const hourNum = parseInt(heure.split(':')[0]);
                                            const isMidday = heure === '12:00';
                                            return (
                                                <tr key={heure} className={isMidday ? '' : 'border-t border-gray-100'}>
                                                    <td className="py-1.5 pr-2 text-[10px] text-gray-400 font-mono text-right align-top pt-2">
                                                        {heure}
                                                    </td>
                                                    {JOURS.map((jour, idx) => {
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
                                    <span>Occupé</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 rounded bg-gray-50 border border-gray-100" />
                                    <span>Libre</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-400">
                                    Capacity: {capacityPercent}% utilisée
                                </span>
                            </div>
                        </motion.div>

                        {upcomingCreneaux.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <Calendar className="h-5 w-5 text-indigo-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Prochains créneaux</h2>
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
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-amber-500" />
                                        <h2 className="text-lg font-semibold text-gray-900">Classes liées</h2>
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
                                            Assigner une classe
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
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {cl.effectifActuel}/{cl.effectifMax}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">élèves</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <GraduationCap className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                                        <p className="text-sm">Aucune classe liée</p>
                                        <p className="text-xs mt-1">Utilisez le bouton ci-dessus pour assigner une classe à cette salle.</p>
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
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                Aperçu
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Capacité</span>
                                    <span className="text-sm font-semibold text-gray-900">{salle.capacite} places</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Type</span>
                                    <span className="text-sm font-semibold text-gray-900">{typeConfig.label}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Localisation</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salle.localisation || '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Équipements</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salle.equipements?.length || 0}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Créneaux/sem</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {salleStats?.creneauxOccupes ?? '-'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Classes liées</span>
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
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                Capacité utilisée
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Occupation hebdo</span>
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
                                    {salleStats?.heuresReservees ?? 0}h réservées / {salleStats?.totalCreneauxSemaine ?? 66}h disponibles
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                Informations système
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Créée le</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(salle.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Modifiée le</p>
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
                onClose={() => setFormOpen(false)}
                salleId={salle.id}
            />
            <SalleFormModal
                open={duplicateFromId !== null}
                onClose={() => setDuplicateFromId(null)}
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