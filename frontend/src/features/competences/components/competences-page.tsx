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
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Eye, BookOpen, GraduationCap, Layers, Brain } from 'lucide-react';
import { useTousNiveaux } from '@/features/niveaux/hooks/use-tous-niveaux';
import {
    useCompetences,
    useCreerCompetence,
    useModifierCompetence,
    useSupprimerCompetence,
    type Competence,
} from '../hooks/use-competences';
import { usePermissions } from '@/hooks';
import { DataTable } from '@/components/ui/DataTable';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { PageHeader } from '@/components/layout/PageHeader';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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
    const navigate = useNavigate();
    const { t } = useTranslation('competences');
    const { hasPermission } = usePermissions();
    const { data: niveaux } = useTousNiveaux();
    
    const [filtres, setFiltres] = useState({ page: 1, limit: 20, recherche: '', niveauId: '', domaine: '' });
    const [showFormModal, setShowFormModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Competence | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Competence | null>(null);

    const { data, isLoading, isError, error, refetch } = useCompetences(filtres);
    const creer = useCreerCompetence();
    const modifier = useModifierCompetence();
    const supprimer = useSupprimerCompetence();

    const colonnes: Column<Competence>[] = [
        {
            key: 'code',
            header: t('code'),
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
            header: t('libelle'),
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
            header: t('domaine'),
            render: (c) => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800">
                    <Layers className="h-3 w-3" />
                    {c.domaine}
                </span>
            ),
        },
        {
            key: 'niveau',
            header: t('niveau'),
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
            header: t('matiere'),
            render: (c) => (
                <span className="inline-flex items-center gap-1.5 text-sm">
                    {c.matiere ? (
                        <>
                            <BookOpen className="h-3.5 w-3.5 text-orange-600" />
                            <span className="font-medium text-orange-700">{c.matiere.nom}</span>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">{t('toutesMatieres')}</span>
                    )}
                </span>
            ),
        },
        {
            key: 'ordre',
            header: t('ordre'),
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
            header: t('statut'),
            sortable: true,
            className: 'text-center',
            render: (c) => (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                    c.actif ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                    {c.actif ? `✓ ${t('actif')}` : `✗ ${t('inactif')}`}
                </span>
            ),
        },
        {
            key: 'actions',
            header: t('colonnes.actions', 'Actions'),
            className: 'text-right',
            renderActions: (c) => [
                {
                    key: 'voir',
                    icon: Eye,
                    label: t('actions.voir', 'Voir détails'),
                    onClick: () => navigate({ to: '/competences/$id', params: { id: c.id } }),
                    variant: 'info' as const,
                },
                {
                    key: 'modifier',
                    icon: Edit,
                    label: t('actions.modifier', 'Modifier'),
                    onClick: () => {
                        setItemToEdit(c);
                        setShowFormModal(true);
                    },
                    permission: 'competences:edit',
                },
                {
                    key: 'supprimer',
                    icon: Trash2,
                    label: t('actions.supprimer', 'Supprimer'),
                    onClick: () => {
                        setItemToDelete(c);
                        setShowDeleteConfirm(true);
                    },
                    permission: 'competences:delete',
                    variant: 'danger' as const,
                },
            ],
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
                icon={Brain}
                title={t('titre')}
                subtitle={t('sousTitre', { count: data?.meta?.totalItems || 0 })}
                actions={hasPermission('competences:create') ? (
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="h-4 w-4" />}
                        onClick={() => {
                            setItemToEdit(null);
                            setShowFormModal(true);
                        }}
                    >
                        {t('nouvelleCompetence')}
                    </ElisaButton>
                ) : undefined}
            />

            <DataTable
                tableId="competences"
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
                title={t('supprimerTitre')}
                description={t('supprimerMessage', { libelle: itemToDelete?.libelle })}
                confirmText={t('supprimerConfirm')}
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
    const { t: tComp } = useTranslation('competences');
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
            title={competence ? tComp('modifierTitre') : tComp('creerTitre')}
            description={competence ? tComp('modifierDescription') : tComp('creerDescription')}
            size="xl"
            footer={
                <>
                    <ElisaButton variant="outline" onClick={() => onOpenChange(false)}>
                        {tComp('annuler')}
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!code.trim() || !libelle.trim() || !niveauId || isLoading}
                        leftIcon={<Brain className="h-4 w-4" />}
                    >
                        {isLoading ? tComp('enregistrement') : competence ? tComp('modifier') : tComp('creer')}
                    </ElisaButton>
                </>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {tComp('code')} <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder={tComp('exempleCode')}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                            maxLength={50}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {tComp('domaine')} <span className="text-red-500">*</span>
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
                        {tComp('libelle')} <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={libelle}
                        onChange={(e) => setLibelle(e.target.value)}
                        placeholder={tComp('exempleLibelle')}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                        required
                        maxLength={200}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {tComp('niveau')} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={niveauId}
                            onChange={(e) => setNiveauId(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                            required
                        >
                            <option value="">{tComp('selectionnerNiveau')}</option>
                            {niveauxOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {tComp('matiereOptionnelle')}
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
                            {tComp('laisserVide')}
                        </p>
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">{tComp('description')}</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={tComp('descriptionDetaillee')}
                        className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm resize-none"
                        rows={2}
                        maxLength={500}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            {tComp('ordre')}
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
                            {tComp('competenceActive')}
                        </label>
                    </div>
                </div>
            </form>
        </CustomModal>
    );
}
