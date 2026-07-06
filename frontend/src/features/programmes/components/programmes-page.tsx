/**
 * ==================================
 * eLISAschool - Page Programmes Pédagogiques
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, BookOpen, Clock, Layers, ArrowUpRight } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import type { Column } from '@/components/ui/DataTable';
import type { ProgrammePedagogique } from '../types/programme.types';
import {
    useProgrammes,
    useCreerProgramme,
    useModifierProgramme,
    useSupprimerProgramme,
} from '../hooks/use-programmes';
import { ProgrammeFormModal } from './programme-form-modal';

export function ProgrammesPage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [recherche, setRecherche] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [programmeToEdit, setProgrammeToEdit] = useState<ProgrammePedagogique | null>(null);
    const [programmeToDelete, setProgrammeToDelete] = useState<ProgrammePedagogique | null>(null);

    const { hasPermission } = usePermissions();
    const { data, isLoading } = useProgrammes({
        page,
        limit,
        recherche: recherche || undefined,
    });

    const creer = useCreerProgramme();
    const modifier = useModifierProgramme();
    const supprimer = useSupprimerProgramme();

    const programmes = data?.items || data?.data || [];
    const total = data?.meta?.totalItems || 0;
    const totalPages = data?.meta?.totalPages || 1;

    const colonnes: Column<ProgrammePedagogique>[] = [
        {
            key: 'nom',
            header: 'Programme',
            sortable: true,
            render: (p) => (
                <div>
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-[var(--color-dominante)]" />
                        <span className="font-semibold">{p.nom}</span>
                    </div>
                    {p.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'code',
            header: 'Code',
            render: (p) => (
                <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    {p.code}
                </code>
            ),
        },
        {
            key: 'cycle',
            header: 'Cycle',
            render: (p) => (
                <div className="flex items-center gap-1">
                    <Layers className="h-3 w-3 text-gray-500" />
                    <span className="text-sm">{p.cycle?.nom || p.cycleNom || '-'}</span>
                </div>
            ),
        },
        {
            key: 'nbMatieres',
            header: 'Matières',
            render: (p) => (
                <span className="text-sm font-mono">{p.matieres?.length || p.nbMatieres || 0}</span>
            ),
        },
        {
            key: 'nbHeuresHebdo',
            header: 'Heures/sem.',
            render: (p) => (
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">
                        {p.nbHeuresCalculees || p.nbHeuresHebdo || 0}h
                    </span>
                </div>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            render: (p) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        p.actif
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {p.actif ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (p) => [
                {
                    key: 'voir',
                    icon: ArrowUpRight,
                    label: 'Détails',
                    onClick: () => navigate({ to: `/programmes/${p.id}` }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {
                        setProgrammeToEdit(p);
                        setShowFormModal(true);
                    },
                    permission: 'programmes:config:write',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setProgrammeToDelete(p),
                    permission: 'programmes:config:write',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleDelete = async () => {
        if (!programmeToDelete) return;

        try {
            await supprimer.mutateAsync(programmeToDelete.id);
            setProgrammeToDelete(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-texte)]">
                            Programmes Pédagogiques
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Gérez les programmes pédagogiques par cycle et niveau
                        </p>
                    </div>
                    {hasPermission('programmes:config:write') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setProgrammeToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau programme
                        </ElisaButton>
                    )}
                </div>
            </motion.div>

            {/* Filtres */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white rounded-lg p-4 border border-gray-200"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-foreground mb-2 block">Rechercher</label>
                        <input
                            type="text"
                            placeholder="Nom, code..."
                            value={recherche}
                            onChange={(e) => setRecherche(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Programmes</p>
                            <p className="text-2xl font-bold text-[var(--color-dominante)] mt-1">
                                {total}
                            </p>
                        </div>
                        <BookOpen className="h-8 w-8 text-[var(--color-dominante)]/20" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Actifs</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {programmes.filter((p) => p.actif).length}
                            </p>
                        </div>
                        <Layers className="h-8 w-8 text-green-600/20" />
                    </div>
                </motion.div>
            </div>

            {/* Tableau */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
            >
                <DataTable
                    columns={colonnes}
                    data={programmes}
                    isLoading={isLoading}
                    pagination={{
                        page,
                        limit,
                        total,
                        totalPages,
                        onPageChange: setPage,
                    }}
                    onRowClick={(p) => navigate({ to: `/programmes/${p.id}` })}
                    emptyMessage="Aucun programme pédagogique trouvé"
                />
            </motion.div>

            {/* Modal Formulaire */}
            <ProgrammeFormModal
                open={showFormModal}
                programme={programmeToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setProgrammeToEdit(null);
                }}
                onSubmit={async (dto) => {
                    if (programmeToEdit) {
                        await modifier.mutateAsync({ id: programmeToEdit.id, ...dto });
                    } else {
                        await creer.mutateAsync(dto);
                    }
                }}
            />

            {/* Dialog Confirmation Suppression */}
            <ConfirmDialog
                open={!!programmeToDelete}
                onOpenChange={(open) => { if (!open) setProgrammeToDelete(null); }}
                onConfirm={handleDelete}
                title="Supprimer le programme"
                description={`Êtes-vous sûr de vouloir supprimer "${programmeToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
