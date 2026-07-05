/**
 * ==================================
 * eLISAschool - Page Diplômes Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, GraduationCap, Calendar, Hash, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { DiplomeEleve } from '../types/diplome-eleve.types';
import {
    useDiplomesEleves,
    useCreerDiplomeEleve,
    useModifierDiplomeEleve,
    useSupprimerDiplomeEleve,
} from '../hooks/use-diplomes-eleves';
import { DiplomeEleveFormModal } from './diplome-eleve-form-modal';

export function DiplomesElevesPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreExamenId, setFiltreExamenId] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [diplomeToEdit, setDiplomeToEdit] = useState<DiplomeEleve | null>(null);
    const [diplomeToDelete, setDiplomeToDelete] = useState<DiplomeEleve | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useDiplomesEleves({
        page,
        limit,
        recherche: recherche || undefined,
        examenNationalId: filtreExamenId,
    });

    const creer = useCreerDiplomeEleve();
    const modifier = useModifierDiplomeEleve();
    const supprimer = useSupprimerDiplomeEleve();

    const diplomes = data?.items || [];
    const meta = data?.meta;
    const total = meta?.totalItems || 0;
    const totalPages = meta?.totalPages || 1;
    const currentPage = meta?.currentPage || page;

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const colonnes: Column<DiplomeEleve>[] = [
        {
            key: 'eleveId',
            header: 'Élève',
            render: (diplome: DiplomeEleve, _index: number) => (
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{diplome.eleve?.nom || diplome.eleveId?.substring(0, 8) || '—'}</span>
                </div>
            ),
        },
        {
            key: 'examenNationalId',
            header: 'Examen',
            render: (diplome: DiplomeEleve, _index: number) => (
                <span className="text-sm">{diplome.examenNational?.nom || diplome.examenNationalId?.substring(0, 8) || '—'}</span>
            ),
        },
        {
            key: 'numeroDiplome',
            header: 'N° Diplôme',
            render: (diplome: DiplomeEleve, _index: number) => (
                <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{diplome.numeroDiplome || '-'}</span>
                </div>
            ),
        },
        {
            key: 'dateObtention',
            header: 'Date d\'obtention',
            render: (diplome: DiplomeEleve, _index: number) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{diplome.dateObtention ? formatDate(diplome.dateObtention) : '-'}</span>
                </div>
            ),
        },
        {
            key: 'mention',
            header: 'Mention',
            render: (diplome: DiplomeEleve, _index: number) => (
                diplome.mention ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        diplome.mention.includes('Très')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : diplome.mention.includes('Bien')
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                        {diplome.mention}
                    </span>
                ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (diplome: DiplomeEleve, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    diplome.resultat === 'ADMIS'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {diplome.resultat === 'ADMIS' ? 'Validé' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (d) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => navigate({ to: '/diplomes-eleves/$id', params: { id: d.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => { setDiplomeToEdit(d); setShowFormModal(true); },
                    permission: 'diplomes-eleves:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setDiplomeToDelete(d),
                    permission: 'diplomes-eleves:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setDiplomeToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (diplomeToEdit) {
            await modifier.mutateAsync({ id: diplomeToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setShowFormModal(false);
        setDiplomeToEdit(null);
    };

    const handleDelete = async () => {
        if (diplomeToDelete) {
            await supprimer.mutateAsync(diplomeToDelete.id);
            setDiplomeToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Diplômes Élèves</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des diplômes obtenus par les élèves
                    </p>
                </div>
                {hasPermission('diplomes-eleves:create') && (
                    <ElisaButton
                        variant="primary"
                        onClick={handleCreate}
                        icon={<Plus className="h-4 w-4" />}
                    >
                        Enregistrer un diplôme
                    </ElisaButton>
                )}
            </motion.div>

            {/* Filtres */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Rechercher</label>
                    <input
                        type="text"
                        placeholder="Nom élève, N° diplôme..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Examen</label>
                    <select
                        value={filtreExamenId || ''}
                        onChange={(e) => setFiltreExamenId(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    >
                        <option value="">Tous les examens</option>
                        {/* TODO: Ajouter hook useExamensNationaux pour dropdown */}
                    </select>
                </div>
            </motion.div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <DataTable
                    columns={colonnes}
                    data={diplomes}
                    isLoading={isLoading}
                    pagination={meta ? {
                        page: currentPage,
                        limit: meta.itemsPerPage,
                        total,
                        totalPages,
                        hasNext: currentPage < totalPages,
                        hasPrev: currentPage > 1,
                        onPageChange: setPage,
                    } : undefined}
                    emptyMessage="Aucun diplôme enregistré" tableId={''}                />
            </motion.div>

            {/* Modal Formulaire */}
            <DiplomeEleveFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setDiplomeToEdit(null);
                    }
                }}
                diplome={diplomeToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            {/* Modal Confirmation Suppression */}
            <ConfirmDialog
                open={!!diplomeToDelete}
                onOpenChange={(open) => { if (!open) setDiplomeToDelete(null); }}
                title="Supprimer le diplôme"
                description="Êtes-vous sûr de vouloir supprimer ce diplôme ?"
                confirmText="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
