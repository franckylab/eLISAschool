import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, Users, MapPin, BarChart3, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { useSalles, useSupprimerSalle, useStatistiquesSalles } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, FiltresSalles, Salle } from '../types/salle.types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SalleFormModal } from '../components/SalleFormModal';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { usePermissions } from '@/hooks';
import { toast } from 'sonner';
import type { Column } from '@/components/ui/DataTable';

const TYPE_SALLE_LABELS: Record<TypeSalle, string> = {
    [TypeSalle.CLASSIQUE]: 'Classique',
    [TypeSalle.LABORATOIRE]: 'Laboratoire',
    [TypeSalle.INFORMATIQUE]: 'Informatique',
    [TypeSalle.AMPHITHEATRE]: 'Amphithéâtre',
    [TypeSalle.SPORT]: 'Sport',
    [TypeSalle.MUSIQUE]: 'Musique',
    [TypeSalle.ARTS]: 'Arts',
    [TypeSalle.BIBLIOTHEQUE]: 'Bibliothèque',
    [TypeSalle.ADMINISTRATION]: 'Administration',
    [TypeSalle.AUTRE]: 'Autre',
};

const STATUT_SALLE_LABELS: Record<StatutSalle, string> = {
    [StatutSalle.DISPONIBLE]: 'Disponible',
    [StatutSalle.EN_MAINTENANCE]: 'En maintenance',
    [StatutSalle.INDISPONIBLE]: 'Indisponible',
};

const getTypeLabel = (type: TypeSalle): string => TYPE_SALLE_LABELS[type] || type;
const getStatutLabel = (statut: StatutSalle): string => STATUT_SALLE_LABELS[statut] || statut;

function Skeleton({ className }: { className?: string }) {
    return <div className={`animate-pulse bg-gray-200 rounded ${className || ''}`} />;
}

export function SallesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const [filtres, setFiltres] = useState<FiltresSalles>({
        page: 1,
        limit: 20,
        search: '',
    });
    const [showFormModal, setShowFormModal] = useState(false);
    const [salleToEdit, setSalleToEdit] = useState<Salle | null>(null);
    const [salleToDelete, setSalleToDelete] = useState<Salle | null>(null);

    const { data, isLoading } = useSalles(filtres);
    const { data: stats, isLoading: statsLoading } = useStatistiquesSalles();
    const supprimer = useSupprimerSalle();

    const salles = data?.data || [];
    const pagination = data?.pagination;

    const handleDelete = async () => {
        if (!salleToDelete) return;
        try {
            await supprimer.mutateAsync(salleToDelete.id);
            toast.success('Salle supprimée avec succès');
            setSalleToDelete(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la suppression');
        }
    };

    const colonnes: Column<Salle>[] = [
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Salle',
            sortable: true,
            render: (s) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{s.nom}</div>
                        {s.code && <div className="text-xs text-gray-500 font-mono">{s.code}</div>}
                    </div>
                </div>
            ),
        },
        {
            key: 'typeSalle',
            header: 'Type',
            render: (s) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                    {getTypeLabel(s.typeSalle)}
                </span>
            ),
        },
        {
            key: 'capacite',
            header: 'Capacité',
            sortable: true,
            render: (s) => (
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">{s.capacite} places</span>
                </div>
            ),
        },
        {
            key: 'localisation',
            header: 'Localisation',
            className: 'hidden lg:table-cell',
            render: (s) => s.localisation ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{s.localisation}</span>
                </div>
            ) : <span className="text-gray-400 text-sm">-</span>,
        },
        {
            key: 'statut',
            header: 'Statut',
            render: (s) => {
                const displayStatut = !s.disponible ? StatutSalle.INDISPONIBLE : s.statut;
                const icon = displayStatut === StatutSalle.DISPONIBLE ? CheckCircle
                    : displayStatut === StatutSalle.EN_MAINTENANCE ? Wrench : AlertCircle;
                const colorMap = {
                    [StatutSalle.DISPONIBLE]: 'bg-green-100 text-green-800',
                    [StatutSalle.EN_MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
                    [StatutSalle.INDISPONIBLE]: 'bg-red-100 text-red-800',
                };
                const Icon = icon;
                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[displayStatut]}`}>
                        <Icon className="h-3.5 w-3.5" />
                        {getStatutLabel(displayStatut)}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (s) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => navigate({ to: '/salles/$salleId', params: { salleId: s.id } }),
                    variant: 'info' as const,
                },
                ...(hasPermission('config:edit') ? [
                    {
                        key: 'modifier',
                        icon: Edit,
                        label: 'Modifier',
                        onClick: () => { setSalleToEdit(s); setShowFormModal(true); },
                    },
                    {
                        key: 'supprimer',
                        icon: Trash2,
                        label: 'Supprimer',
                        onClick: () => setSalleToDelete(s),
                        variant: 'danger' as const,
                    },
                ] : []),
            ],
        },
    ];

    const statCards = [
        { icon: Building2, label: 'Total salles', value: stats?.total ?? 0, color: 'text-blue-600', iconBg: 'bg-blue-100' },
        { icon: CheckCircle, label: 'Disponibles', value: stats?.disponibles ?? 0, color: 'text-green-600', iconBg: 'bg-green-100' },
        { icon: Users, label: 'Capacité totale', value: stats?.capaciteTotale?.toLocaleString() ?? 0, color: 'text-orange-600', iconBg: 'bg-orange-100' },
        { icon: BarChart3, label: 'Taux occupation', value: stats && stats.total > 0 ? `${Math.round(((stats.total - stats.disponibles) / stats.total) * 100)}%` : '0%', color: 'text-purple-600', iconBg: 'bg-purple-100' },
    ];

    if (isLoading && salles.length === 0) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Skeleton className="h-10 w-56 mb-8" />
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                        <Building2 className="w-full h-full" />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-5">
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                <Building2 className="h-10 w-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">Gestion des Salles</h1>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-emerald-200">{pagination?.total || 0} salle(s)</span>
                                    <span className="text-emerald-300">•</span>
                                    <span className="text-sm text-emerald-200">{stats?.capaciteTotale || 0} places au total</span>
                                </div>
                            </div>
                        </div>
                        {hasPermission('config:edit') && (
                            <ElisaButton
                                onClick={() => { setSalleToEdit(null); setShowFormModal(true); }}
                                icon={<Plus className="h-4 w-4" />}
                                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                            >
                                Nouvelle salle
                            </ElisaButton>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {statCards.map((card) => (
                        <motion.div
                            key={card.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                                    <card.icon className={`h-5 w-5 ${card.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                        </motion.div>
                    ))}
                </div>

                <DataTable
                    data={salles}
                    columns={colonnes}
                    isLoading={isLoading}
                    tableId="salles"
                    enableReordering
                    enablePinning
                    enableColumnVisibility
                    searchable
                    searchPlaceholder="Rechercher par nom, code ou localisation..."
                    onSearchChange={(search) => setFiltres((prev) => ({ ...prev, search, page: 1 }))}
                    disableClientSearch
                    pagination={pagination ? {
                        page: pagination.page,
                        limit: pagination.limit,
                        total: pagination.total,
                        totalPages: pagination.totalPages,
                        hasNext: pagination.hasNext,
                        hasPrev: pagination.hasPrev,
                    } : undefined}
                    onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                    onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
                />

                <SalleFormModal
                    open={showFormModal}
                    onClose={() => { setShowFormModal(false); setSalleToEdit(null); }}
                    salleId={salleToEdit?.id}
                />

                <ConfirmationModal
                    isOpen={!!salleToDelete}
                    title="Confirmer la suppression"
                    message={`Êtes-vous sûr de vouloir supprimer la salle "${salleToDelete?.nom}" ? Cette action est irréversible.`}
                    confirmLabel="Supprimer"
                    variant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setSalleToDelete(null)}
                />
            </motion.div>
        </div>
    );
}
