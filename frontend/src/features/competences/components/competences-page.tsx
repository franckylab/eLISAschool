/**
 * ==================================
 * eLISAschool - Page Compétences Complète
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des compétences (Approche Par Compétences - APC)
 * CRUD avec modal, filtres par niveau/matière/domaine
 */

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, BookOpen, GraduationCap, Layers, Target } from 'lucide-react';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import {
    useCompetences,
    useCreerCompetence,
    useModifierCompetence,
    useSupprimerCompetence,
    type Competence,
    type CompetenceFormData,
} from '../hooks/use-competences';
import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import type { Column } from '@/components/ui/DataTable';

// Types
interface CompetenceFormData {
    code: string;
    libelle: string;
    description?: string;
    domaine: string;
    niveauId: string;
    matiereId?: string;
    ordre: number;
    actif: boolean;
}

// Domaines prédéfinis
const DOMAINES = [
    'Mathématiques',
    'Sciences',
    'Français',
    'Anglais',
    'Histoire-Géographie',
    'Éducation Civique',
    'Informatique',
    'Éducation Physique',
    'Arts',
    'Technique',
];

export function CompetencesPage() {
    const { hasPermission } = usePermissions();
    const { data: niveaux } = useTousNiveaux();
    
    const [filtres, setFiltres] = useState({ page: 1, limit: 20, recherche: '', niveauId: '', domaine: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Competence | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Competence | null>(null);

    const { data, isLoading } = useCompetences(filtres);
    const creer = useCreerCompetence();
    const modifier = useModifierCompetence();
    const supprimer = useSupprimerCompetence();

    const colonnes: Column<Competence>[] = [
        {
            key: 'code',
            header: 'Code',
            sortable: true,
            render: (c) => (
                <span className="font-mono text-sm font-semibold text-[var(--color-dominant-600)]">
                    {c.code}
                </span>
            ),
        },
        {
            key: 'libelle',
            pinned: 'left' as const,
            header: 'Libellé',
            sortable: true,
            render: (c) => (
                <div>
                    <span className="font-medium">{c.libelle}</span>
                    {c.description && (
                        <p className="text-xs text-gray-500 line-clamp-1">{c.description}</p>
                    )}
                </div>
            ),
        },
        {
            key: 'domaine',
            header: 'Domaine',
            render: (c) => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                    <Layers className="h-3 w-3" />
                    {c.domaine}
                </span>
            ),
        },
        {
            key: 'niveau',
            header: 'Niveau',
            render: (c) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-medium text-blue-700">
                        {c.niveau?.nom || c.niveauId}
                    </span>
                </span>
            ),
        },
        {
            key: 'matiere',
            header: 'Matière',
            render: (c) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    {c.matiere ? (
                        <>
                            <BookOpen className="h-3.5 w-3.5 text-orange-600" />
                            <span className="font-medium text-orange-700">{c.matiere.nom}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">Toutes matières</span>
                    )}
                </span>
            ),
        },
        {
            key: 'ordre',
            header: 'Ordre',
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-dominant-100)] px-3 py-1 text-sm font-semibold text-[var(--color-dominant-800)]">
                    {c.ordre}
                </span>
            ),
        },
        {
            key: 'actif',
            header: 'Statut',
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {c.actif ? '✓ Actif' : '✗ Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            pinned: 'right' as const,
            header: 'Actions',
            className: 'text-right',
            render: (c) => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => {/* Voir détails */}}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Voir détails"
                    >
                        <Eye className="h-4 w-4" />
                    </button>
                    {hasPermission('competences:edit') && (
                        <button
                            onClick={() => {
                                setItemToEdit(c);
                                setShowFormModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                            title="Modifier"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                    )}
                    {hasPermission('competences:delete') && (
                        <button
                            onClick={() => {
                                setItemToDelete(c);
                                setShowDeleteConfirm(true);
                            }}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const handleSave = async (formData: CompetenceFormData) => {
        try {
            if (itemToEdit) {
                await modifier.mutateAsync({ id: itemToEdit.id, ...formData });
            } else {
                await creer.mutateAsync(formData);
            }
            setShowFormModal(false);
            setItemToEdit(null);
        } catch (error) {
            console.error('Erreur sauvegarde compétence:', error);
        }
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;
        try {
            await supprimer.mutateAsync(itemToDelete.id);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Erreur suppression compétence:', error);
        }
    };

    const niveauxOptions = useMemo(() => {
        if (!niveaux) return [];
        return niveaux.map((n: any) => ({
            value: n.id,
            label: `${n.code} - ${n.nom}`,
        }));
    }, [niveaux]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <motion.div 
                className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-3xl font-bold">Compétences</h1>
                    <p className="text-sm text-gray-600">
                        {data?.meta?.totalItems || 0} compétence(s) • Approche Par Compétences (APC)
                    </p>
                </div>
                {hasPermission('competences:create') && (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setItemToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        Nouvelle compétence
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
                searchPlaceholder="Rechercher une compétence..."
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
            <CompetenceFormModal
                open={showFormModal}
                onOpenChange={(open) => {
                    if (!open) {
                        setShowFormModal(false);
                        setItemToEdit(null);
                    }
                }}
                competence={itemToEdit}
                onSave={handleSave}
                isLoading={creer.isPending || modifier.isPending}
                niveauxOptions={niveauxOptions}
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
                title="Supprimer la compétence ?"
                description={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.libelle}" ? Cette action est irréversible.`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    );
}

// Modal Formulaire Compétence
interface CompetenceFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    competence?: Competence | null;
    onSave: (data: CompetenceFormData) => void;
    isLoading?: boolean;
    niveauxOptions: Array<{ value: string; label: string }>;
}

function CompetenceFormModal({ open, onOpenChange, competence, onSave, isLoading, niveauxOptions }: CompetenceFormModalProps) {
    const [code, setCode] = useState('');
    const [libelle, setLibelle] = useState('');
    const [description, setDescription] = useState('');
    const [domaine, setDomaine] = useState('Mathématiques');
    const [niveauId, setNiveauId] = useState('');
    const [matiereId, setMatiereId] = useState('');
    const [ordre, setOrdre] = useState(1);
    const [actif, setActif] = useState(true);

    useEffect(() => {
        if (competence) {
            setCode(competence.code);
            setLibelle(competence.libelle);
            setDescription(competence.description || '');
            setDomaine(competence.domaine);
            setNiveauId(competence.niveauId);
            setMatiereId(competence.matiereId || '');
            setOrdre(competence.ordre);
            setActif(competence.actif);
        } else {
            setCode('');
            setLibelle('');
            setDescription('');
            setDomaine('Mathématiques');
            setNiveauId('');
            setMatiereId('');
            setOrdre(1);
            setActif(true);
        }
    }, [competence]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!code.trim() || !libelle.trim() || !niveauId) {
            return;
        }

        onSave({
            code: code.trim(),
            libelle: libelle.trim(),
            description: description.trim() || undefined,
            domaine,
            niveauId,
            matiereId: matiereId || undefined,
            ordre,
            actif,
        });
    };

    return (
        <CustomModal
            open={open}
            onOpenChange={onOpenChange}
            title={competence ? 'Modifier la compétence' : 'Créer une compétence'}
            description={competence ? 'Modifiez les informations de la compétence' : 'Ajoutez une nouvelle compétence pour l\'évaluation APC'}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!code.trim() || !libelle.trim() || !niveauId || isLoading}
                        icon={<Target className="h-4 w-4" />}
                    >
                        {isLoading ? 'Enregistrement...' : competence ? 'Modifier' : 'Créer'}
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
                            placeholder="Ex: COMP_MATH_01"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Domaine <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={domaine}
                            onChange={(e) => setDomaine(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        >
                            {DOMAINES.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                        Libellé <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={libelle}
                        onChange={(e) => setLibelle(e.target.value)}
                        placeholder="Ex: Résoudre une équation du second degré"
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={200}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Niveau <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={niveauId}
                            onChange={(e) => setNiveauId(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        >
                            <option value="">Sélectionner un niveau</option>
                            {niveauxOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Matière (optionnel)
                        </label>
                        <input
                            type="text"
                            value={matiereId}
                            onChange={(e) => setMatiereId(e.target.value)}
                            placeholder="ID matière ou laisser vide"
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            maxLength={50}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Laisser vide pour compétence transversale
                        </p>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description détaillée de la compétence..."
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <div className="flex items-center gap-2 pt-6">
                        <input
                            type="checkbox"
                            id="actif"
                            checked={actif}
                            onChange={(e) => setActif(e.target.checked)}
                            className="w-4 h-4 rounded border-input"
                        />
                        <label htmlFor="actif" className="text-sm font-medium text-foreground">
                            Compétence active
                        </label>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
