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
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Eye, GitBranch } from 'lucide-react';
import { useToutesFilieres } from '@/features/filieres/hooks/use-filieres';
import {
    useSpecialites,
    useCreerSpecialite,
    useModifierSpecialite,
    useSupprimerSpecialite,
    type Specialite,
} from '../hooks/use-specialites';
import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { SectionSeparator } from '@/components/ui/SectionSeparator';
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
    const { t } = useTranslation('specialites');
    const { hasPermission } = usePermissions();
    const { data: filieres } = useToutesFilieres();
    
    const [filtres, setFiltres] = useState({ page: 1, limit: 20, recherche: '', filiereId: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Specialite | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Specialite | null>(null);

    const { data, isLoading, isError, error, refetch } = useSpecialites(filtres);
    const creer = useCreerSpecialite();
    const modifier = useModifierSpecialite();
    const supprimer = useSupprimerSpecialite();

    const colonnes: Column<Specialite>[] = [
        {
            key: 'code',
            header: t('code'),
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
            header: t('nom'),
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
            header: t('filiere'),
            render: (s) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    <GitBranch className="h-3.5 w-3.5 text-purple-600" />
                    <span className="font-medium text-purple-700">
                        {s.filiere?.nom || s.filiereId}
                    </span>
                </span>
            ),
        },
        {
            key: 'ordre',
            header: t('ordre'),
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
            header: t('statut'),
            sortable: true,
            className: 'text-center',
            render: (s) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    s.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {s.actif ? `✓ ${t('actif')}` : `✗ ${t('inactif')}`}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('actions'),
            className: 'text-right',
            renderActions: (s) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('voirDetails'),
                    onClick: () => navigate({ to: '/specialites/$id', params: { id: s.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('modifier'),
                    onClick: () => {
                        setItemToEdit(s);
                        setShowFormModal(true);
                    },
                    permission: 'specialites:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('supprimer'),
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

    if (isLoading && !data) {
        return <PageSkeleton showHeader showTable />;
    }

    if (isError) {
        return (
            <div className="p-6">
                <ErrorMessage
                    message={error instanceof Error ? error.message : t('chargement')}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                variant="gradient"
                icon={GitBranch}
                title={t('titre')}
                subtitle={t('infoSpecialites', { count: data?.meta?.totalItems || 0 })}
                actions={hasPermission('specialites:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setItemToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        {t('nouvelleSpecialite')}
                    </ElisaButton>
                ) : undefined}
            />

            <DataTable
                tableId="specialites"
                data={data?.items || []}
                columns={colonnes}
                isLoading={isLoading}
                enableReordering
                enablePinning
                enableColumnVisibility
                searchPlaceholder={t('rechercher')}
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
                title={t('supprimerTitre')}
                description={t('supprimerMessage', { nom: itemToDelete?.nom })}
                confirmText={t('supprimer')}
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

const FORM_INIT: SpecialiteFormData & { description: string } = {
    nom: '',
    code: '',
    description: '',
    filiereId: '',
    ordre: 1,
    actif: true,
};

function SpecialiteFormModal({ open, onOpenChange, specialite, onSave, isLoading, filieresOptions }: SpecialiteFormModalProps) {
    const { t: tSpecialite } = useTranslation('specialites');
    const [formData, setFormData] = useState(FORM_INIT);
    const [erreurs, setErreurs] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && specialite) {
            setFormData({
                nom: specialite.nom || '',
                code: specialite.code || '',
                description: specialite.description || '',
                filiereId: specialite.filiereId || '',
                ordre: specialite.ordre ?? 1,
                actif: specialite.actif ?? true,
            });
        } else if (!open) {
            setFormData(FORM_INIT);
            setErreurs({});
        }
    }, [specialite, open]);

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(formData) !== JSON.stringify(FORM_INIT),
        [formData],
    );

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (erreurs[field]) {
            setErreurs(prev => { const next = { ...prev }; delete next[field]; return next; });
        }
    };

    const valider = (): boolean => {
        const nouvelles: Record<string, string> = {};
        if (!formData.nom.trim()) nouvelles.nom = 'Le nom est requis';
        if (!formData.code.trim()) nouvelles.code = 'Le code est requis';
        if (!formData.filiereId) nouvelles.filiereId = 'La filière est requise';
        setErreurs(nouvelles);
        return Object.keys(nouvelles).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!valider()) return;
        onSave({
            nom: formData.nom.trim(),
            code: formData.code.trim(),
            description: formData.description.trim() || undefined,
            filiereId: formData.filiereId,
            ordre: formData.ordre,
            actif: formData.actif,
        });
    };

    const handleClose = () => {
        if (hasUnsavedChanges) return;
        onOpenChange(false);
    };

    const titre = specialite ? tSpecialite('modifierTitre') : tSpecialite('creerTitre');
    const description = specialite ? tSpecialite('modifierDescription') : tSpecialite('creerDescription');

    return (
        <CustomModal
            open={open}
            onOpenChange={(v) => {
                if (!v && hasUnsavedChanges) return;
                onOpenChange(v);
            }}
            title={titre}
            description={description}
            size="lg"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={handleClose}>
                        {tSpecialite('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        icon={<GitBranch className="h-4 w-4" />}
                    >
                        {specialite ? tSpecialite('modifier') : tSpecialite('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {tSpecialite('informations')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    {tSpecialite('code')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                                    placeholder={tSpecialite('codePlaceholder')}
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                    required
                                    maxLength={50}
                                    autoFocus
                                />
                                {erreurs.code && <p className="text-xs text-red-500 mt-1">{erreurs.code}</p>}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-foreground mb-2 block">
                                    {tSpecialite('ordre')}
                                </label>
                                <input
                                    type="number"
                                    value={formData.ordre}
                                    onChange={(e) => handleChange('ordre', parseInt(e.target.value) || 1)}
                                    placeholder="1"
                                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                    min={1}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                {tSpecialite('nom')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nom}
                                onChange={(e) => handleChange('nom', e.target.value)}
                                placeholder={tSpecialite('nomPlaceholder')}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                required
                                maxLength={100}
                            />
                            {erreurs.nom && <p className="text-xs text-red-500 mt-1">{erreurs.nom}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {tSpecialite('filiere')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                {tSpecialite('filiere')} <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.filiereId}
                                onChange={(e) => handleChange('filiereId', e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                                required
                            >
                                <option value="">{tSpecialite('filierePlaceholder')}</option>
                                {filieresOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {erreurs.filiereId && <p className="text-xs text-red-500 mt-1">{erreurs.filiereId}</p>}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-[var(--color-texte)] flex items-center gap-2">
                        <GitBranch className="h-5 w-5 text-[var(--color-texte-secondaire)]" />
                        {tSpecialite('description')}
                    </h3>
                    <SectionSeparator />
                    <div className="mt-4 space-y-4">
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder={tSpecialite('descriptionPlaceholder')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                            rows={3}
                            maxLength={500}
                        />
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="actif"
                                checked={formData.actif}
                                onChange={(e) => handleChange('actif', e.target.checked)}
                                className="w-4 h-4 rounded border-input"
                            />
                            <label htmlFor="actif" className="text-sm font-medium text-foreground">
                                {tSpecialite('specialiteActive')}
                            </label>
                        </div>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
