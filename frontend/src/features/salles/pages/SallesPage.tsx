/**
 * ==================================
 * eLISAschool - Page Liste des Salles
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-15
 * 
 * Page principale de gestion des salles avec:
 * - Tableau optimisé avec pagination serveur
 * - Filtres avancés (type, statut, recherche)
 * - Statistiques en temps réel
 * - Actions CRUD complètes
 * - Optimisations performance (memo, lazy loading)
 * - Accessibilité et UX professionnelle
 */

import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { useSalles, useSupprimerSalle, useStatistiquesSalles } from '../hooks/use-salles';
import { TypeSalle, StatutSalle, FiltresSalles, Salle } from '../types/salle.types';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SalleFormModal } from '../components/SalleFormModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ElisaInput } from '@/components/ui/ElisaInput';
import { ElisaSelect } from '@/components/ui/ElisaSelect';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    Eye,
    Building2,
    Users,
    MapPin,
    BarChart3,
    Loader2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================
// Constantes et utilitaires
// ==================================

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

// ==================================
// Composant principal
// ==================================

export function SallesPage() {
    const navigate = useNavigate();

    // State des filtres
    const [filtres, setFiltres] = useState<FiltresSalles>({
        page: 1,
        limit: 20,
        search: '',
    });

    // State des modals
    const [formOpen, setFormOpen] = useState(false);
    const [editSalleId, setEditSalleId] = useState<string | null>(null);
    const [deleteSalleId, setDeleteSalleId] = useState<string | null>(null);

    // Hooks TanStack Query
    const { data, isLoading, error, refetch } = useSalles(filtres);
    const { data: stats, isLoading: statsLoading } = useStatistiquesSalles();
    const supprimerMutation = useSupprimerSalle();

    // Données paginées
    const salles = data?.data || [];
    const pagination = data?.pagination;

    // ==================================
    // Handlers mémorisés (optimisation)
    // ==================================

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setFiltres((prev) => ({ ...prev, search: e.target.value, page: 1 }));
    }, []);

    const handleTypeChange = useCallback((value: string) => {
        setFiltres((prev) => ({
            ...prev,
            typeSalle: value === 'all' ? undefined : (value as TypeSalle),
            page: 1,
        }));
    }, []);

    const handleStatutChange = useCallback((value: string) => {
        setFiltres((prev) => ({
            ...prev,
            statut: value === 'all' ? undefined : (value as StatutSalle),
            page: 1,
        }));
    }, []);

    const handleEdit = useCallback((salleId: string) => {
        setEditSalleId(salleId);
        setFormOpen(true);
    }, []);

    const handleView = useCallback((salleId: string) => {
        navigate({ to: '/salles/$salleId', params: { salleId } });
    }, [navigate]);

    const handleDeleteRequest = useCallback((salleId: string) => {
        setDeleteSalleId(salleId);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!deleteSalleId) return;

        try {
            await supprimerMutation.mutateAsync(deleteSalleId);
            toast.success('Salle supprimée avec succès');
        } catch (error: any) {
            toast.error(error?.response?.data?.error?.message || 'Erreur lors de la suppression');
        } finally {
            setDeleteSalleId(null);
        }
    }, [deleteSalleId, supprimerMutation]);

    const handleRefresh = useCallback(() => {
        refetch();
        toast.info('Actualisation en cours...');
    }, [refetch]);

    // ==================================
    // Rendu des cartes statistiques
    // ==================================

    const StatCards = useMemo(() => {
        if (statsLoading || !stats) return null;

        const cards = [
            {
                icon: <Building2 className="h-6 w-6 text-blue-600" />,
                label: 'Total salles',
                value: stats.total,
                color: 'bg-blue-50',
            },
            {
                icon: <Users className="h-6 w-6 text-green-600" />,
                label: 'Disponibles',
                value: stats.disponibles,
                color: 'bg-green-50',
            },
            {
                icon: <MapPin className="h-6 w-6 text-orange-600" />,
                label: 'Capacité totale',
                value: stats.capaciteTotale?.toLocaleString() || 0,
                color: 'bg-orange-50',
            },
            {
                icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
                label: 'Taux occupation',
                value: `${stats.total > 0 ? Math.round(((stats.total - stats.disponibles) / stats.total) * 100) : 0}%`,
                color: 'bg-purple-50',
            },
        ];

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`${card.color} rounded-xl p-4 shadow-sm border border-gray-200`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                {card.icon}
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">{card.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    }, [stats, statsLoading]);

    // ==================================
    // Rendu des badges de statut
    // ==================================

    const StatutBadge = useCallback(({ statut, disponible }: { statut: StatutSalle; disponible: boolean }) => {
        const colorMap = {
            [StatutSalle.DISPONIBLE]: 'bg-green-100 text-green-800',
            [StatutSalle.EN_MAINTENANCE]: 'bg-yellow-100 text-yellow-800',
            [StatutSalle.INDISPONIBLE]: 'bg-red-100 text-red-800',
        };

        const displayStatut = !disponible ? StatutSalle.INDISPONIBLE : statut;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[displayStatut]}`}>
                {getStatutLabel(displayStatut)}
            </span>
        );
    }, []);

    // ==================================
    // Rendu principal
    // ==================================

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header avec titre et actions */}
            <motion.div
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestion des Salles</h1>
                    <p className="text-gray-500 mt-1">
                        Gérez les espaces physiques de votre établissement
                    </p>
                </div>
                <div className="flex gap-2">
                    <ElisaButton
                        variant="outline"
                        onClick={handleRefresh}
                        icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
                        disabled={isLoading}
                    >
                        Actualiser
                    </ElisaButton>
                    <ElisaButton
                        onClick={() => {
                            setEditSalleId(null);
                            setFormOpen(true);
                        }}
                        icon={<Plus className="h-4 w-4" />}
                        variant="primary"
                    >
                        Nouvelle salle
                    </ElisaButton>
                </div>
            </motion.div>

            {/* Cartes statistiques */}
            {StatCards}

            {/* Zone de filtres */}
            <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recherche */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <ElisaInput
                            placeholder="Rechercher par nom, code ou localisation..."
                            value={filtres.search || ''}
                            onChange={handleSearchChange}
                            className="pl-10"
                        />
                    </div>

                    {/* Filtre par type */}
                    <ElisaSelect
                        value={filtres.typeSalle || 'all'}
                        onValueChange={handleTypeChange}
                        placeholder="Type de salle"
                        options={[
                            { value: 'all', label: 'Tous les types' },
                            ...Object.values(TypeSalle).map((type) => ({
                                value: type,
                                label: getTypeLabel(type),
                            })),
                        ]}
                    />

                    {/* Filtre par statut */}
                    <ElisaSelect
                        value={filtres.statut || 'all'}
                        onValueChange={handleStatutChange}
                        placeholder="Statut"
                        options={[
                            { value: 'all', label: 'Tous les statuts' },
                            ...Object.values(StatutSalle).map((statut) => ({
                                value: statut,
                                label: getStatutLabel(statut),
                            })),
                        ]}
                    />
                </div>
            </motion.div>

            {/* Tableau des salles */}
            <motion.div
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                {/* État de chargement */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                        <p className="text-gray-500">Chargement des salles...</p>
                    </div>
                )}

                {/* État d'erreur */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
                        <p className="text-red-600 mb-4">Erreur lors du chargement</p>
                        <ElisaButton
                            variant="outline"
                            onClick={() => refetch()}
                            icon={<RefreshCw className="h-4 w-4" />}
                        >
                            Réessayer
                        </ElisaButton>
                    </div>
                )}

                {/* État vide */}
                {!isLoading && !error && salles.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg mb-2">Aucune salle trouvée</p>
                        <p className="text-gray-400 text-sm mb-4">
                            {filtres.search || filtres.typeSalle || filtres.statut
                                ? 'Essayez de modifier vos filtres'
                                : 'Commencez par créer votre première salle'}
                        </p>
                        {!filtres.search && !filtres.typeSalle && !filtres.statut && (
                            <ElisaButton
                                onClick={() => {
                                    setEditSalleId(null);
                                    setFormOpen(true);
                                }}
                                icon={<Plus className="h-4 w-4" />}
                                variant="primary"
                            >
                                Créer une salle
                            </ElisaButton>
                        )}
                    </div>
                )}

                {/* Tableau */}
                {!isLoading && !error && salles.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Salle
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Capacité
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                            Localisation
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <AnimatePresence mode="popLayout">
                                        {salles.map((salle: Salle, index: number) => (
                                            <motion.tr
                                                key={salle.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Nom et code */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 rounded-lg">
                                                            <Building2 className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900">
                                                                {salle.nom}
                                                            </div>
                                                            {salle.code && (
                                                                <div className="text-xs text-gray-500 font-mono">
                                                                    {salle.code}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Type */}
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                        {getTypeLabel(salle.typeSalle)}
                                                    </span>
                                                </td>

                                                {/* Capacité */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm text-gray-700 font-medium">
                                                            {salle.capacite} places
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Localisation (caché sur mobile) */}
                                                <td className="px-6 py-4 hidden lg:table-cell">
                                                    {salle.localisation ? (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <MapPin className="h-4 w-4 text-gray-400" />
                                                            <span>{salle.localisation}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>

                                                {/* Statut */}
                                                <td className="px-6 py-4">
                                                    <StatutBadge
                                                        statut={salle.statut}
                                                        disponible={salle.disponible}
                                                    />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <ElisaButton
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleView(salle.id)}
                                                            icon={<Eye className="h-4 w-4" />}
                                                        >
                                                            Voir
                                                        </ElisaButton>
                                                        <ElisaButton
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(salle.id)}
                                                            icon={<Edit className="h-4 w-4" />}
                                                        >
                                                            Modifier
                                                        </ElisaButton>
                                                        <ElisaButton
                                                            variant="danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteRequest(salle.id)}
                                                            icon={<Trash2 className="h-4 w-4" />}
                                                        >
                                                            Supprimer
                                                        </ElisaButton>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600">
                                        Page {pagination.page} sur {pagination.totalPages} 
                                        {' '}(
                                        {pagination.total.toLocaleString()} résultat
                                        {pagination.total > 1 ? 's' : ''})
                                    </p>
                                    <div className="flex gap-2">
                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            disabled={!pagination.hasPrev}
                                            onClick={() =>
                                                setFiltres((prev) => ({
                                                    ...prev,
                                                    page: (prev.page || 1) - 1,
                                                }))
                                            }
                                        >
                                            Précédent
                                        </ElisaButton>
                                        <ElisaButton
                                            variant="outline"
                                            size="sm"
                                            disabled={!pagination.hasNext}
                                            onClick={() =>
                                                setFiltres((prev) => ({
                                                    ...prev,
                                                    page: (prev.page || 1) + 1,
                                                }))
                                            }
                                        >
                                            Suivant
                                        </ElisaButton>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </motion.div>

            {/* Modal de création/édition */}
            <CustomModal
                open={formOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setFormOpen(false);
                        setEditSalleId(null);
                    }
                }}
                title={editSalleId ? 'Modifier la salle' : 'Nouvelle salle'}
                description={editSalleId ? 'Modifiez les informations de la salle' : 'Créez une nouvelle salle'}
                size="2xl"
            >
                <SalleFormModal
                    open={formOpen}
                    onClose={() => {
                        setFormOpen(false);
                        setEditSalleId(null);
                    }}
                    salleId={editSalleId || undefined}
                />
            </CustomModal>

            {/* Modal de confirmation de suppression */}
            <ConfirmationModal
                isOpen={!!deleteSalleId}
                title="Confirmer la suppression"
                message="Êtes-vous sûr de vouloir supprimer cette salle ? Cette action est irréversible."
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteSalleId(null)}
            />
        </div>
    );
}
