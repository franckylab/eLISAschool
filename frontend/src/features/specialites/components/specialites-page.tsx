/**
 * ==================================
 * eLISAschool - Page Spécialités Complète
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des spécialités par filière technique
 * CRUD avec modal, filtres par filière, et affichage enrichi
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, BookOpen, Hash } from 'lucide-react';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import {
    useSpecialites,
    useCreerSpecialite,
    useModifierSpecialite,
    useSupprimerSpecialite,
    type Specialite,
    type SpecialiteFormData,
} from '../hooks/use-specialites';
import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';

// Types
interface SpecialiteFormData {
    nom: string;
    code: string;
    description?: string;
    filiereId: string;
    ordre: number;
    actif: boolean;
}

export function SpecialitesPage() {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const { data: filieres } = useToutesFilieres();
    
    const [filtres, setFiltres] = useState({ page: 1, limit: 20, recherche: '', filiereId: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Specialite | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Specialite | null>(null);

    const { data, isLoading } = useSpecialites(filtres);
    const creer = useCreerSpecialite();
    const modifier = useModifierSpecialite();
    const supprimer = useSupprimerSpecialite();

    const colonnes: Column<Specialite>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (s) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">
                    {s.code}
                </span>
            ),
        },
        {
            key: 'nom',
            pinned: 'left' as const,
            header: 'Nom',
            sortable: true,
            render: (s) => (
                <div>
                    <span className="font-medium">{s.nom}</span>
                    {s.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{s.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'filiere',
            header: 'Filière',
            render: (s) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    <BookOpen className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-medium text-purple-700">
                        {s.filiere?.nom || s.filiereId}
                    </span>
                </span>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            sortable: true,
            className: 'text-center',
            render: (s) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">
                    {s.ordre}
                </span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (s) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {s.actif ? '✓ Actif' : '✗ Inactif'}
                </span>
            ),
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
                    onClick: () => navigate({ to: '/specialites/$id', params: { id: s.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: 'Modifier',
                    onClick: () => {
                        setItemToEdit(s);
                        setShowFormModal(true);
                    },
                    permission: 'specialites:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: 'Supprimer',
                    onClick: () => {
                        setItemToDelete(s);
                        setShowDeleteConfirm(true);
                    },
                    permission: 'specialites:delete',
                    variant: 'danger' as const,
                },
            ],
        },
    ];

    const handleSave = async (formData: SpecialiteFormData) => {
        try {
            if (itemToEdit) {
                await modifier.mutateAsync({ id: itemToEdit.id, ...formData });
            } else {
                await creer.mutateAsync(formData);
            }
            setShowFormModal(false);
            setItemToEdit(null);
        } catch (error) {
            console.error('Erreur sauvegarde spécialité:', error);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await supprimer.mutateAsync(itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Erreur suppression spécialité:', error);
        }
    };

    const filieresOptions = useMemo(() => {
        if (!filieres) return [];
        return filieres.map((f: any) => ({
            value: f.id,
            label: `${f.code} - ${f.nom}`,
        }));
    }, [filieres]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div 
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">Spécialités</h1>
                    <p className="text-sm text-gray-600">
                        {data?.meta?.totalItems || 0} spécialité(s) • Options par filière technique
                    </p>
                </div>
                {hasPermission('specialites:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setItemToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouvelle spécialité
                    </ElisaButton>
                )}
            </motion.div>

            <DataTable
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder="Rechercher une spécialité..."
                onSearchChange={(recherche) =>
                    setFiltres({ ...filtres, recherche, page: 1 })
                }
                disableClientSearch
                pagination={data?.meta ? {
                    page: data.meta.currentPage,
                    limit: data.meta.itemsPerPage,
                    total: data.meta.totalItems,
                    totalPages: data.meta.totalPages,
                    hasNext: data.meta.currentPage < data.meta.totalPages,
                    hasPrev: data.meta.currentPage > 1,
                } : undefined}
                onPageChange={(page) => setFiltres({ ...filtres, page })}
                onLimitChange={(limit) => setFiltres({ ...filtres, limit, page: 1 })}
            />

            {/* Modal Formulaire */}
            <SpecialiteFormModal
                open={showFormModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowFormModal(false);
                        setItemToEdit(null);
                    }
                }}
                specialite={itemToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
                filieresOptions={filieresOptions}
            />

            {/* Modal Confirmation Suppression */}
            <ConfirmDialog
                open={showDeleteConfirm}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowDeleteConfirm(false);
                        setItemToDelete(null);
                    }
                }}
                onConfirm={handleDelete}
                title="Supprimer la spécialité ?"
                description={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.nom}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    );
}

// Modal Formulaire Spécialité
interface SpecialiteFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    specialite?: Specialite | null;
    onSave: (data: SpecialiteFormData) => void;
    isLoading?: boolean;
    filieresOptions: Array<{ value: string; label: string }>;
}

function SpecialiteFormModal({ open, onOpenChange, specialite, onSave, isLoading, filieresOptions }: SpecialiteFormModalProps) {
    const [nom, setNom] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [filiereId, setFiliereId] = useState('');
    const [ordre, setOrdre] = useState(1);
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (specialite) {
            setNom(specialite.nom);
            setCode(specialite.code);
            setDescription(specialite.description || '');
            setFiliereId(specialite.filiereId);
            setOrdre(specialite.ordre);
            setActif(specialite.actif);
        } else {
            setNom('');
            setCode('');
            setDescription('');
            setFiliereId('');
            setOrdre(1);
            setActif(true);
        }
    }, [specialite]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!nom.trim() || !code.trim() || !filiereId) {
            return;
        }

        onSave({
            nom: nom.trim(),
            code: code.trim(),
            description: description.trim() || undefined,
            filiereId,
            ordre,
            actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={specialite ? 'Modifier la spécialité' : 'Créer une spécialité'}
            description={specialite ? 'Modifiez les informations de la spécialité' : 'Ajoutez une nouvelle spécialité pour une filière technique'}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!nom.trim() || !code.trim() || !filiereId || isLoading}
                        icon={<BookOpen className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : specialite ? 'Modifier' : 'Créer'}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="Ex: MA, EI, GC"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Ordre
                        </label>
                        <input
                            type="number"
                            value={ordre}
                            onChange={(e) => setOrdre(parseInt(e.target.value) || 1)}
                            placeholder="1"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            min={1}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex: Maintenance Automobile, Électrotechnique Industrielle"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={100}
                    />
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Filière <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={filiereId}
                        onChange={(e) => setFiliereId(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                    >
                        <option value="">Sélectionner une filière</option>
                        {filieresOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                        <Hash className="h-3 w-3 inline mr-1" />
                        Les spécialités sont associées aux filières techniques (F1-F4, G1-G2, H, I, K, L)
                    </p>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description de la spécialité..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="actif"
                        checked={actif}
                        onChange={(e) => setActif(e.target.checked)}
                        className="w-4 h-4 rounded border-input"
                    />
                    <label htmlFor="actif" className="text-sm font-medium text-foreground">
                        Spécialité active
                    </label>
                </div>
            </form>
        </CustomModal>
    );
}
