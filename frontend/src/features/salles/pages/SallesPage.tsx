import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, Building2, Users, MapPin, BarChart3 } from 'lucide-react';
import { useSalles, useSupprimerSalle, useStatistiquesSalles } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, FiltresSalles, Salle } from '../types/salle.types';
import { CustomModal } from '@/components/modals/CustomModal';
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

export function SallesPage() {
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
                const colorMap = {
                    [StatutSalle.DISPONIBLE]: 'bg-green-100 text-green-800',
                    [StatutSalle.EN_MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
                    [StatutSalle.INDISPONIBLE]: 'bg-red-100 text-red-800',
                };
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[displayStatut]}`}>
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
                    onClick: () => { window.location.href = `/salles/${s.id}`; },
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

    const StatCards = useMemo(() => {
        if (statsLoading || !stats) return null;
        const cards = [
            { icon: <Building2 className="h-6 w-6 text-blue-600" />, label: 'Total salles', value: stats.total, color: 'bg-blue-50' },
            { icon: <Users className="h-6 w-6 text-green-600" />, label: 'Disponibles', value: stats.disponibles, color: 'bg-green-50' },
            { icon: <MapPin className="h-6 w-6 text-orange-600" />, label: 'Capacité totale', value: stats.capaciteTotale?.toLocaleString() || 0, color: 'bg-orange-50' },
            { icon: <BarChart3 className="h-6 w-6 text-purple-600" />, label: 'Taux occupation', value: `${stats.total > 0 ? Math.round(((stats.total - stats.disponibles) / stats.total) * 100) : 0}%`, color: 'bg-purple-50' },
        ];
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card) => (
                    <div key={card.label} className={`${card.color} rounded-xl p-4 shadow-sm border border-gray-200`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">{card.icon}</div>
                            <div>
                                <p className="text-sm text-gray-600">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }, [stats, statsLoading]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Salles</h1>
                    <p className="text-sm text-gray-500 mt-1">{pagination?.total || 0} salle(s)</p>
                </div>
                {hasPermission('config:edit') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => { setSalleToEdit(null); setShowFormModal(true); }}
                    >
                        Nouvelle salle
                    </ElisaButton>
                )}
            </motion.div>

            {StatCards}

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
                pagination={pagination ? { page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages, hasNext: pagination.hasNext, hasPrev: pagination.hasPrev } : undefined}
                onPageChange={(page) => setFiltres((prev) => ({ ...prev, page }))}
                onLimitChange={(limit) => setFiltres((prev) => ({ ...prev, limit, page: 1 }))}
            />

            {showFormModal && (
                <CustomModal
                    open={showFormModal}
                    onOpenChange={(open) => {
                        if (!open) { setShowFormModal(false); setSalleToEdit(null); }
                    }}
                    title={salleToEdit ? 'Modifier la salle' : 'Nouvelle salle'}
                    description={salleToEdit ? 'Modifiez les informations de la salle' : 'Créez une nouvelle salle'}
                    size="2xl"
                >
                    <SalleFormModal
                        open={showFormModal}
                        onClose={() => { setShowFormModal(false); setSalleToEdit(null); }}
                        salleId={salleToEdit?.id}
                    />
                </CustomModal>
            )}

            <ConfirmationModal
                isOpen={!!salleToDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer la salle "${salleToDelete?.nom}" ? Cette action est irréversible.`}
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                onCancel={() => setSalleToDelete(null)}
            />
        </div>
    );
}