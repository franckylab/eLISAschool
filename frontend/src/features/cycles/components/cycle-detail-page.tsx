import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Edit, BookOpen, Award,
    CheckCircle, XCircle, AlertCircle,
    Layers, Clock, Hash, Calendar, ChevronRight,
} from 'lucide-react';
import { useCycle, useModifierCycle } from '../hooks/use-cycles';
import { useNiveauxByCycle } from '@/features/niveaux';
import { useFilieresByCycle } from '@/features/filieres';
import { CycleFormModal } from './cycle-form-modal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';

function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />;
}

export function CycleDetailPage() {
    const { id } = useParams({ from: '/_auth/cycles/$id' });
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: cycle, isLoading, error } = useCycle(id);
    const { data: niveaux } = useNiveauxByCycle(id);
    const { data: filieres } = useFilieresByCycle(id);
    const modifier = useModifierCycle();
    const [formOpen, setFormOpen] = useState(false);

    if (isLoading) {
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

    if (error || !cycle) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-xl font-semibold text-red-600 mb-2">Cycle non trouvé</p>
                <p className="text-gray-500 mb-6">Le cycle demandé n'existe pas ou a été supprimé.</p>
                <ElisaButton variant="outline" onClick={() => navigate({ to: '/cycles' })}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                </ElisaButton>
            </div>
        );
    }

    const stats = [
        {
            icon: Layers,
            label: 'Niveaux',
            value: niveaux?.length ?? 0,
            color: 'bg-purple-50 text-purple-600',
            iconBg: 'bg-purple-100',
        },
        {
            icon: Award,
            label: 'Filières',
            value: filieres?.length ?? 0,
            color: 'bg-indigo-50 text-indigo-600',
            iconBg: 'bg-indigo-100',
        },
        {
            icon: Clock,
            label: 'Durée',
            value: `${cycle.dureeAnnees || 0} an${(cycle.dureeAnnees || 0) > 1 ? 's' : ''}`,
            color: 'bg-blue-50 text-blue-600',
            iconBg: 'bg-blue-100',
        },
        {
            icon: Hash,
            label: 'Ordre',
            value: `n° ${cycle.ordre}`,
            color: 'bg-amber-50 text-amber-600',
            iconBg: 'bg-amber-100',
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <ElisaButton
                    variant="ghost"
                    onClick={() => navigate({ to: '/cycles' })}
                    icon={<ArrowLeft className="h-4 w-4" />}
                    className="mb-6"
                >
                    Retour aux cycles
                </ElisaButton>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                        <BookOpen className="w-full h-full" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                <BookOpen className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{cycle.nom}</h1>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-sm text-purple-200">{cycle.code}</span>
                                    <span className="text-purple-300">•</span>
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium ${
                                        cycle.actif ? 'bg-green-400/20 text-green-200' : 'bg-red-400/20 text-red-200'
                                    }`}>
                                        {cycle.actif
                                            ? <><CheckCircle className="h-3.5 w-3.5" /> Actif</>
                                            : <><XCircle className="h-3.5 w-3.5" /> Inactif</>
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                        {hasPermission('cycles:edit') && (
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {stats.map((stat) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${stat.iconBg}`}>
                                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
                        </motion.div>
                    ))}
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
                                <BookOpen className="h-5 w-5 text-purple-500" />
                                Informations générales
                            </h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Code</dt>
                                    <dd className="text-sm font-semibold text-gray-900 font-mono">{cycle.code}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Ordre</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{cycle.ordre}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Durée</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{cycle.dureeAnnees || '-'} an{(cycle.dureeAnnees || 0) > 1 ? 's' : ''}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Diplôme sanctionnant</dt>
                                    <dd className="text-sm font-semibold text-gray-900">
                                        {cycle.diplomeSanctionnant ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 font-semibold">
                                                <Award className="h-4 w-4" />
                                                {cycle.diplomeSanctionnant}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 italic">Aucun</span>
                                        )}
                                    </dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Statut</dt>
                                    <dd>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                            cycle.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {cycle.actif ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {cycle.actif ? 'Actif' : 'Inactif'}
                                        </span>
                                    </dd>
                                </div>
                                {cycle.description && (
                                    <div className="sm:col-span-2">
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</dt>
                                        <dd className="text-sm text-gray-700 leading-relaxed">{cycle.description}</dd>
                                    </div>
                                )}
                            </dl>
                        </motion.div>

                        {niveaux && niveaux.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Layers className="h-5 w-5 text-purple-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Niveaux du cycle</h2>
                                    <span className="text-sm text-gray-400">({niveaux.length})</span>
                                </div>
                                <div className="space-y-0">
                                    {niveaux.map((n, index) => (
                                        <div
                                            key={n.id}
                                            className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
                                                index < niveaux.length - 1 ? 'border-b border-gray-100' : ''
                                            }`}
                                            onClick={() => navigate({ to: '/niveaux/$id', params: { id: n.id } })}
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                                    {n.ordre}
                                                </div>
                                                {index < niveaux.length - 1 && (
                                                    <div className="w-0.5 h-full min-h-[1.5rem] bg-purple-100" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{n.nom}</span>
                                                    {n.code && (
                                                        <span className="font-mono text-xs text-gray-400">{n.code}</span>
                                                    )}
                                                    {n.estClasseExamen && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                                                            Classe d'examen
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500">
                                                        {n.sousSysteme === 'FRANCOPHONE' ? 'Francophone' : n.sousSysteme === 'ANGLOPHONE' ? 'Anglophone' : n.sousSysteme}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {filieres && filieres.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <Award className="h-5 w-5 text-indigo-500" />
                                    <h2 className="text-lg font-semibold text-gray-900">Filières du cycle</h2>
                                    <span className="text-sm text-gray-400">({filieres.length})</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {filieres.map((f) => (
                                        <div
                                            key={f.id}
                                            onClick={() => navigate({ to: '/filieres/$id', params: { id: f.id } })}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer group"
                                        >
                                            <div className="p-2.5 rounded-xl bg-indigo-50">
                                                <Award className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900">{f.nom}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="font-mono text-xs text-gray-400">{f.code}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        {f.sousSysteme === 'FRANCOPHONE' ? 'Francophone' : 'Anglophone'}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className={`rounded-xl shadow-sm border p-6 ${
                                cycle.actif ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                {cycle.actif
                                    ? <CheckCircle className="h-6 w-6 text-green-600" />
                                    : <XCircle className="h-6 w-6 text-red-600" />
                                }
                                <span className={`font-semibold text-lg ${cycle.actif ? 'text-green-800' : 'text-red-800'}`}>
                                    {cycle.actif ? 'Actif' : 'Inactif'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600">
                                {cycle.actif
                                    ? 'Ce cycle est actuellement actif et utilisable dans toute l\'application.'
                                    : 'Ce cycle est actuellement inactif et masqué dans l\'application.'}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Layers className="h-4 w-4 text-gray-400" />
                                Aperçu
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Niveaux</span>
                                    <span className="text-sm font-semibold text-gray-900">{niveaux?.length ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Filières</span>
                                    <span className="text-sm font-semibold text-gray-900">{filieres?.length ?? 0}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Durée</span>
                                    <span className="text-sm font-semibold text-gray-900">{cycle.dureeAnnees || 0} an(s)</span>
                                </div>
                                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">Ordre</span>
                                    <span className="text-sm font-semibold text-gray-900">{cycle.ordre}</span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                Informations système
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 text-xs">Créé le</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(cycle.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs">Modifié le</p>
                                    <p className="font-medium text-gray-900">{formatDateTime(cycle.updatedAt)}</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

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
