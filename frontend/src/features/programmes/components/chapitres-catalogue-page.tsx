import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { BookOpen, Plus, Edit, Trash2, Clock } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { usePermissions } from '@/hooks';
import { useTousMatieresNiveaux } from '@/features/matieres';
import { ProgrammeChapitre } from '../types/programme.types';
import { useTousChapitres, useCreerChapitre, useModifierChapitre, useSupprimerChapitre } from '../hooks/use-programmes';
import { ChapitreFormModal } from './chapitre-form-modal';
import type { Column } from '@/components/ui/DataTable';

export function ChapitresCataloguePage() {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [filtreMatiereNiveau, setFiltreMatiereNiveau] = useState('');
    const [filtreStatut, setFiltreStatut] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [chapitreToEdit, setChapitreToEdit] = useState<ProgrammeChapitre | null>(null);
    const [chapitreToDelete, setChapitreToDelete] = useState<ProgrammeChapitre | null>(null);

    const { hasPermission } = usePermissions();
    const { data: chapitresData, isLoading } = useTousChapitres({
        page,
        limit,
        matiereNiveauId: filtreMatiereNiveau || undefined,
        statut: filtreStatut || undefined,
    });
    const { data: matieresNiveaux } = useTousMatieresNiveaux();

    const creer = useCreerChapitre();
    const modifier = useModifierChapitre();
    const supprimer = useSupprimerChapitre();

    const chapitres = chapitresData?.data || [];
    const total = chapitresData?.pagination?.totalItems || 0;
    const totalPages = chapitresData?.pagination?.totalPages || 1;

    const handleSubmit = async (dto: {
        titre: string;
        description?: string;
        objectifsPedagogiques?: string;
        ordre?: number;
        dureePrevueHeures?: number;
    }) => {
        if (chapitreToEdit) {
            await modifier.mutateAsync({ id: chapitreToEdit.id, ...dto });
        } else {
            await creer.mutateAsync({
                ...dto,
                matiereNiveauId: chapitreToEdit?.matiereNiveauId || '',
            });
        }
        setShowFormModal(false);
        setChapitreToEdit(null);
    };

    const handleDelete = async () => {
        if (!chapitreToDelete) return;
        await supprimer.mutateAsync(chapitreToDelete.id);
        setChapitreToDelete(null);
    };

    const colonnes: Column<ProgrammeChapitre>[] = [
        {
            key: 'titre',
            header: 'Chapitre',
            sortable: true,
            render: (c) => (
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--color-dominante)]" />
                    <span className="font-medium">{c.titre}</span>
                </div>
            ),
        },
        {
            key: 'matiereNiveau',
            header: 'Matière / Niveau',
            render: (c) => (
                <div className="text-sm">
                    <span className="font-medium">
                        {c.matiereNiveau?.matiere?.nom || '-'}
                    </span>
                    <span className="text-gray-500 mx-1">·</span>
                    <span className="text-gray-500">
                        {c.matiereNiveau?.niveau?.nom || '-'}
                    </span>
                </div>
            ),
        },
        {
            key: 'programmeNom',
            header: 'Programme',
            render: (c) => {
                const progId = (c as any).programmeId;
                const progNom = (c as any).programmeNom;
                return progId ? (
                    <button
                        onClick={() => navigate({ to: `/programmes/${progId}` })}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        {progNom}
                    </button>
                ) : (
                    <span className="text-sm text-gray-400">-</span>
                );
            },
        },
        {
            key: 'ordre',
            header: 'Ordre',
            render: (c) => (
                <span className="text-sm font-mono">{c.ordre}</span>
            ),
        },
        {
            key: 'dureePrevueHeures',
            header: 'Durée',
            render: (c) => (
                <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span>{c.dureePrevueHeures ?? '-'}h</span>
                </div>
            ),
        },
        {
            key: 'statut',
            header: 'Statut',
            render: (c) => (
                <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.statut === 'ACTIF'
                            ? 'bg-green-100 text-green-800'
                            : c.statut === 'EN_ATTENTE_VALIDATION'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                    }`}
                >
                    {c.statut === 'ACTIF' ? 'Actif' : c.statut === 'EN_ATTENTE_VALIDATION' ? 'En attente' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {
                        setChapitreToEdit(c);
                        setShowFormModal(true);
                    },
                    permission: 'programmes:config:write',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => setChapitreToDelete(c),
                    permission: 'programmes:config:write',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--color-texte)]">
                            Catalogue des Chapitres
                        </h1>
                        <p className="text-sm text-[var(--color-texte-secondaire)] mt-1">
                            Vue d&apos;ensemble de tous les chapitres pédagogiques
                        </p>
                    </div>
                    {hasPermission('programmes:config:write') && (
                        <ElisaButton
                            variant="primary"
                            size="md"
                            onClick={() => {
                                setChapitreToEdit(null);
                                setShowFormModal(true);
                            }}
                            leftIcon={<Plus className="h-4 w-4" />}
                        >
                            Nouveau chapitre
                        </ElisaButton>
                    )}
                </div>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="text-sm font-medium text-foreground mb-2 block">Matière / Niveau</label>
                        <select
                            value={filtreMatiereNiveau}
                            onChange={(e) => { setFiltreMatiereNiveau(e.target.value); setPage(1); }}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">Toutes les matières</option>
                            {matieresNiveaux?.map((mn: any) => (
                                <option key={mn.id} value={mn.id}>
                                    {mn.matiere?.nom || '?'} - {mn.niveau?.nom || '?'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-48">
                        <label className="text-sm font-medium text-foreground mb-2 block">Statut</label>
                        <select
                            value={filtreStatut}
                            onChange={(e) => { setFiltreStatut(e.target.value); setPage(1); }}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        >
                            <option value="">Tous</option>
                            <option value="ACTIF">Actif</option>
                            <option value="EN_ATTENTE_VALIDATION">En attente</option>
                            <option value="INACTIF">Inactif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tableau */}
            <DataTable
                columns={colonnes}
                data={chapitres}
                isLoading={isLoading}
                pagination={{
                    page,
                    limit,
                    total,
                    totalPages,
                    onPageChange: setPage,
                }}
                emptyMessage="Aucun chapitre trouvé"
            />

            {/* Modal Chapitre */}
            <ChapitreFormModal
                open={showFormModal}
                chapitre={chapitreToEdit}
                onClose={() => {
                    setShowFormModal(false);
                    setChapitreToEdit(null);
                }}
                onSubmit={handleSubmit}
                isLoading={creer.isPending || modifier.isPending}
            />

            {/* Confirmation Suppression */}
            <ConfirmDialog
                open={!!chapitreToDelete}
                onOpenChange={(open) => { if (!open) setChapitreToDelete(null); }}
                onConfirm={handleDelete}
                title="Supprimer le chapitre"
                description={`Êtes-vous sûr de vouloir supprimer "${chapitreToDelete?.titre}" ?`}
                confirmText="Supprimer"
                variant="danger"
                isLoading={supprimer.isPending}
            />
        </div>
    );
}
