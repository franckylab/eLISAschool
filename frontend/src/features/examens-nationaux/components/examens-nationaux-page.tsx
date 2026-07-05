/**
 * ==================================
 * eLISAschool - Page Examens Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, FileText, GraduationCap, Eye, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { ExamenNational } from '../types/examen-national.types';
import {
    useExamensNationaux,
    useCreerExamenNational,
    useModifierExamenNational,
    useSupprimerExamenNational,
} from '../hooks/use-examens-nationaux';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import { ExamenNationalFormModal } from './examen-national-form-modal';

export function ExamensNationauxPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [filtreSousSysteme, setFiltreSousSysteme] = useState<string>();
    const [showFormModal, setShowFormModal] = useState(false);
    const [examenToEdit, setExamenToEdit] = useState<ExamenNational | null>(null);
    const [examenToDelete, setExamenToDelete] = useState<ExamenNational | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useExamensNationaux({
        page,
        limit,
        recherche: recherche || undefined,
        sousSysteme: filtreSousSysteme,
    });

    const { data: niveaux } = useTousNiveaux();
    const creer = useCreerExamenNational();
    const modifier = useModifierExamenNational();
    const supprimer = useSupprimerExamenNational();

    const examens = data?.items || [];
    const meta = data?.meta;
    const total = meta?.totalItems || 0;
    const totalPages = meta?.totalPages || 1;
    const currentPage = meta?.currentPage || page;

    const getNomNiveau = (niveauId: string) => {
        return niveaux?.find(n => n.id === niveauId)?.nom || '-';
    };

    const colonnes: Column<ExamenNational>[] = [
        {
            key: 'code',
            header: 'Code',
            render: (examen: ExamenNational, _index: number) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">{examen.code}</span>
                </div>
            ),
        },
        {
            key: 'nom',
            header: 'Nom',
            render: (examen: ExamenNational, _index: number) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{examen.nom}</span>
                </div>
            ),
        },
        {
            key: 'niveauId',
            header: 'Niveau',
            render: (examen: ExamenNational, _index: number) => (
                <span className="text-sm">{getNomNiveau(examen.niveauId)}</span>
            ),
        },
        {
            key: 'diplomeDelivre',
            header: 'Diplôme',
            render: (examen: ExamenNational, _index: number) => (
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{examen.diplomeDelivre || '-'}</span>
                </div>
            ),
        },
        {
            key: 'sousSysteme',
            header: 'Sous-système',
            render: (examen: ExamenNational, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.sousSysteme === 'FRANCOPHONE'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                    {examen.sousSysteme === 'FRANCOPHONE' ? 'Francophone' : 'Anglophone'}
                </span>
            ),
        },
        {
            key: 'estObligatoire',
            header: 'Obligatoire',
            render: (examen: ExamenNational, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.estObligatoire
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                    {examen.estObligatoire ? 'Oui' : 'Non'}
                </span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (examen: ExamenNational, _index: number) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    examen.actif
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                    {examen.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (e) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: 'Voir détails',
                    onClick: () => navigate({ to: '/examens-nationaux/$id', params: { id: e.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => { setExamenToEdit(e); setShowFormModal(true); },
                    permission: 'examens-nationaux:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setExamenToDelete(e),
                    permission: 'examens-nationaux:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleCreate = () => {
        setExamenToEdit(null);
        setShowFormModal(true);
    };

    const handleSave = async (data: any) => {
        if (examenToEdit) {
            await modifier.mutateAsync({ id: examenToEdit.id, ...data });
        } else {
            await creer.mutateAsync(data);
        }
        setShowFormModal(false);
        setExamenToEdit(null);
    };

    const handleDelete = async () => {
        if (examenToDelete) {
            await supprimer.mutateAsync(examenToDelete.id);
            setExamenToDelete(null);
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
                    <h1 className="text-3xl font-bold text-foreground">Examens Nationaux</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des examens officiels (CEP, BEPC, Probatoire, BACCALAURÉAT, GCE)
                    </p>
                </div>
                {hasPermission('examens-nationaux:create') && (
                    <ElisaButton
                        variant="primary"
                        onClick={handleCreate}
                        icon={<Plus className="h-4 w-4" />}
                    >
                        Créer un examen
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
                        placeholder="Nom, code..."
                        value={recherche}
                        onChange={(e) => setRecherche(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Sous-système</label>
                    <select
                        value={filtreSousSysteme || ''}
                        onChange={(e) => setFiltreSousSysteme(e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                    >
                        <option value="">Tous</option>
                        <option value="FRANCOPHONE">Francophone</option>
                        <option value="ANGLOPHONE">Anglophone</option>
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
                    data={examens}
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
                    emptyMessage="Aucun examen national trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <ExamenNationalFormModal
                open={showFormModal}
                onOpenChange={(v) => {
                    if (!v) {
                        setShowFormModal(false);
                        setExamenToEdit(null);
                    }
                }}
                examen={examenToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
            />

            {/* Modal Confirmation Suppression */}
            <ConfirmDialog
                open={!!examenToDelete}
                onOpenChange={(open) => { if (!open) setExamenToDelete(null); }}
                title="Supprimer l'examen national"
                description={`Êtes-vous sûr de vouloir supprimer l'examen "${examenToDelete?.nom}" ?`}
                confirmText="Supprimer"
                variant="danger"
                onConfirm={handleDelete}
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
