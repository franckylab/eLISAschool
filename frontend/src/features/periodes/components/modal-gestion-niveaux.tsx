/**
 * ==================================
 * eLISAschool - Modal Gestion Niveaux & Usages de Périodicité
 * ==================================
 * Version: 5.0.0
 * Auteur: franck arlos chendjou
 *
 * Interface de gestion :
 * - Niveaux de périodicité (CRUD + réordonnancement)
 * - Usages de niveau (CRUD — système + personnalisés)
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Edit, Trash2, GripVertical, Save, X, AlertCircle,
    Layers, Tag, Shield,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { TextLabel } from '@/components/ui';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    useNiveauxPeriode,
    useCreerNiveauPeriode,
    useModifierNiveauPeriode,
    useSupprimerNiveauPeriode,
    useUsagesNiveau,
    useCreerUsageNiveau,
    useModifierUsageNiveau,
    useSupprimerUsageNiveau,
} from '../hooks/use-periodes';
import type { NiveauPeriode, UsageNiveau } from '../types/periode.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

type Onglet = 'niveaux' | 'usages';

export function ModalGestionNiveaux({ isOpen, onClose }: Props) {
    const [onglet, setOnglet] = useState<Onglet>('niveaux');

    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title="Configuration des périodes"
            description="Gérer les niveaux de périodicité et les usages"
            size="3xl"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* Onglets */}
                <div className="flex gap-[var(--gap-sm)] border-b border-[var(--color-bordure)] pb-[var(--space-sm)]">
                    <button
                        className={`flex items-center gap-1.5 rounded-t-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${
                            onglet === 'niveaux'
                                ? 'border-b-2 border-[var(--color-dominant-600)] text-[var(--color-dominant-600)]'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        onClick={() => setOnglet('niveaux')}
                    >
                        <Layers className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        Niveaux
                    </button>
                    <button
                        className={`flex items-center gap-1.5 rounded-t-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${
                            onglet === 'usages'
                                ? 'border-b-2 border-[var(--color-dominant-600)] text-[var(--color-dominant-600)]'
                                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        onClick={() => setOnglet('usages')}
                    >
                        <Tag className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        Usages
                    </button>
                </div>

                {/* Contenu */}
                <AnimatePresence mode="wait">
                    {onglet === 'niveaux' ? (
                        <motion.div key="niveaux" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionNiveaux />
                        </motion.div>
                    ) : (
                        <motion.div key="usages" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <SectionUsages />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </CustomModal>
    );
}

// ================================================================
// SECTION NIVEAUX — CRUD
// ================================================================

function SectionNiveaux() {
    const { data: niveaux = [], isLoading } = useNiveauxPeriode();
    const creer = useCreerNiveauPeriode();
    const modifier = useModifierNiveauPeriode();
    const supprimer = useSupprimerNiveauPeriode();

    const [showForm, setShowForm] = useState(false);
    const [niveauToEdit, setNiveauToEdit] = useState<NiveauPeriode | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<NiveauPeriode | null>(null);

    // Formulaire
    const [formNiveau, setFormNiveau] = useState(0);
    const [formLabel, setFormLabel] = useState('');
    const [formUsageCode, setFormUsageCode] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const openCreer = useCallback(() => {
        setNiveauToEdit(null);
        setFormNiveau(niveaux.length > 0 ? Math.max(...niveaux.map(n => n.niveau)) + 1 : 0);
        setFormLabel('');
        setFormUsageCode('');
        setFormDescription('');
        setShowForm(true);
    }, [niveaux]);

    const openModifier = useCallback((n: NiveauPeriode) => {
        setNiveauToEdit(n);
        setFormNiveau(n.niveau);
        setFormLabel(n.label);
        setFormUsageCode(n.usageCode);
        setFormDescription(n.description || '');
        setShowForm(true);
    }, []);

    const handleSauvegarder = useCallback(async () => {
        if (!formLabel.trim()) return;
        if (niveauToEdit) {
            await modifier.mutateAsync({
                id: niveauToEdit.id,
                label: formLabel.trim(),
                usageCode: formUsageCode.trim(),
                description: formDescription.trim() || undefined,
            });
        } else {
            await creer.mutateAsync({
                niveau: formNiveau,
                label: formLabel.trim(),
                usageCode: formUsageCode.trim(),
                description: formDescription.trim() || undefined,
            });
        }
        setShowForm(false);
    }, [niveauToEdit, formNiveau, formLabel, formUsageCode, formDescription, creer, modifier]);

    const handleSupprimer = useCallback(async () => {
        if (!confirmDelete) return;
        await supprimer.mutateAsync(confirmDelete.id);
        setConfirmDelete(null);
    }, [confirmDelete, supprimer]);

    if (isLoading) {
        return <div className="py-8 text-center text-[var(--color-text-tertiary)]">Chargement...</div>;
    }

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {niveaux.length} niveau(x) configuré(s)
                </p>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    onClick={openCreer}
                >
                    Nouveau niveau
                </ElisaButton>
            </div>

            {/* Formulaire */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt,#f8f9fa)] p-[var(--space-md)]"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                {niveauToEdit ? 'Modifier le niveau' : 'Nouveau niveau'}
                            </h4>
                            <button onClick={() => setShowForm(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                                <X className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--gap-sm)] sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Niveau hiérarchique</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={formNiveau}
                                    onChange={(e) => setFormNiveau(parseInt(e.target.value) || 0)}
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Libellé *</label>
                                <input
                                    type="text"
                                    value={formLabel}
                                    onChange={(e) => setFormLabel(e.target.value)}
                                    placeholder="ex: Évaluation, Trimestre..."
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Code usage *</label>
                                <input
                                    type="text"
                                    value={formUsageCode}
                                    onChange={(e) => setFormUsageCode(e.target.value.toUpperCase())}
                                    placeholder="ex: NOTES, BULLETIN..."
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Description</label>
                                <input
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Description optionnelle"
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-[var(--gap-sm)]">
                            <ElisaButton variant="ghost" size="xs" onClick={() => setShowForm(false)}>
                                Annuler
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="xs"
                                icon={<Save className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={handleSauvegarder}
                            >
                                {niveauToEdit ? 'Mettre à jour' : 'Créer'}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Liste */}
            {niveaux.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-[var(--color-text-tertiary)]">
                    <Layers className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
                    <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                        Aucun niveau configuré. Créez votre premier niveau de périodicité.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-[var(--gap-xs)]">
                    {[...niveaux].sort((a, b) => a.niveau - b.niveau).map((niveau) => (
                        <div
                            key={niveau.id}
                            className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-sm)]"
                        >
                            <GripVertical className="h-[var(--icon-sm)] w-[var(--icon-sm)] text-[var(--color-text-tertiary)]" />
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-dominant-100,#e8f5e9)] text-xs font-bold text-[var(--color-dominant-700,#2e7d32)]">
                                {niveau.niveau}
                            </div>
                            <div className="flex-1 min-w-0">
                                <TextLabel size="md" weight="semibold">{niveau.label}</TextLabel>
                                <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                                    Usage: {niveau.usageCode}
                                    {niveau.description ? ` — ${niveau.description}` : ''}
                                </p>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openModifier(niveau)}
                                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-dominant-50,#f0fdf4)] hover:text-[var(--color-dominant-600)]"
                                    title="Modifier"
                                >
                                    <Edit className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                </button>
                                <button
                                    onClick={() => setConfirmDelete(niveau)}
                                    className="rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirmation suppression */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                title="Supprimer ce niveau ?"
                message={`Le niveau "${confirmDelete?.label}" (niv. ${confirmDelete?.niveau}) sera supprimé. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}

// ================================================================
// SECTION USAGES — CRUD
// ================================================================

function SectionUsages() {
    const { data: usages = [], isLoading } = useUsagesNiveau();
    const creer = useCreerUsageNiveau();
    const modifier = useModifierUsageNiveau();
    const supprimer = useSupprimerUsageNiveau();

    const [showForm, setShowForm] = useState(false);
    const [usageToEdit, setUsageToEdit] = useState<UsageNiveau | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<UsageNiveau | null>(null);

    // Formulaire
    const [formCode, setFormCode] = useState('');
    const [formLabel, setFormLabel] = useState('');
    const [formDescription, setFormDescription] = useState('');

    const openCreer = useCallback(() => {
        setUsageToEdit(null);
        setFormCode('');
        setFormLabel('');
        setFormDescription('');
        setShowForm(true);
    }, []);

    const openModifier = useCallback((u: UsageNiveau) => {
        setUsageToEdit(u);
        setFormCode(u.code);
        setFormLabel(u.label);
        setFormDescription(u.description || '');
        setShowForm(true);
    }, []);

    const handleSauvegarder = useCallback(async () => {
        if (!formCode.trim() || !formLabel.trim()) return;
        if (usageToEdit) {
            await modifier.mutateAsync({
                id: usageToEdit.id,
                label: formLabel.trim(),
                description: formDescription.trim() || undefined,
            });
        } else {
            await creer.mutateAsync({
                code: formCode.trim().toUpperCase(),
                label: formLabel.trim(),
                description: formDescription.trim() || undefined,
            });
        }
        setShowForm(false);
    }, [usageToEdit, formCode, formLabel, formDescription, creer, modifier]);

    const handleSupprimer = useCallback(async () => {
        if (!confirmDelete) return;
        await supprimer.mutateAsync(confirmDelete.id);
        setConfirmDelete(null);
    }, [confirmDelete, supprimer]);

    if (isLoading) {
        return <div className="py-8 text-center text-[var(--color-text-tertiary)]">Chargement...</div>;
    }

    // Séparer usages système et personnalisés
    const usagesSysteme = usages.filter(u => u.estSysteme);
    const usagesPerso = usages.filter(u => !u.estSysteme);

    return (
        <div className="flex flex-col gap-[var(--gap-md)]">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {usages.length} usage(s) — {usagesSysteme.length} système, {usagesPerso.length} personnalisé(s)
                </p>
                <ElisaButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                    onClick={openCreer}
                >
                    Nouvel usage
                </ElisaButton>
            </div>

            {/* Formulaire */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-[var(--radius-lg)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt,#f8f9fa)] p-[var(--space-md)]"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-medium" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                {usageToEdit ? 'Modifier l\'usage' : 'Nouvel usage'}
                            </h4>
                            <button onClick={() => setShowForm(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
                                <X className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-[var(--gap-sm)] sm:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Code *</label>
                                <input
                                    type="text"
                                    value={formCode}
                                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                                    placeholder="ex: CUSTOM_1"
                                    disabled={!!usageToEdit}
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm disabled:opacity-50"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Libellé *</label>
                                <input
                                    type="text"
                                    value={formLabel}
                                    onChange={(e) => setFormLabel(e.target.value)}
                                    placeholder="ex: Saisie des notes"
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                    required
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="mb-1 block text-xs font-medium text-[var(--color-text-secondary)]">Description</label>
                                <input
                                    type="text"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Description optionnelle"
                                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] px-2 py-1.5 text-sm"
                                    style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                                />
                            </div>
                        </div>
                        <div className="mt-3 flex justify-end gap-[var(--gap-sm)]">
                            <ElisaButton variant="ghost" size="xs" onClick={() => setShowForm(false)}>
                                Annuler
                            </ElisaButton>
                            <ElisaButton
                                variant="primary"
                                size="xs"
                                icon={<Save className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />}
                                onClick={handleSauvegarder}
                            >
                                {usageToEdit ? 'Mettre à jour' : 'Créer'}
                            </ElisaButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Usages système */}
            {usagesSysteme.length > 0 && (
                <div>
                    <h5 className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase text-[var(--color-text-tertiary)]">
                        <Shield className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                        Système (non modifiables)
                    </h5>
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        {usagesSysteme.map((usage) => (
                            <div
                                key={usage.id}
                                className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface-alt,#f8f9fa)] p-[var(--space-sm)]"
                            >
                                <div className="flex h-7 items-center rounded-[var(--radius-sm)] bg-[var(--color-dominant-100,#e8f5e9)] px-2 text-xs font-bold text-[var(--color-dominant-700,#2e7d32)]">
                                    {usage.code}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{usage.label}</p>
                                    {usage.description && (
                                        <p className="truncate text-xs text-[var(--color-text-tertiary)]">{usage.description}</p>
                                    )}
                                </div>
                                <Shield className="h-[var(--icon-xs)] w-[var(--icon-xs)] text-[var(--color-text-tertiary)]" title="Usage système" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Usages personnalisés */}
            {usagesPerso.length > 0 && (
                <div>
                    <h5 className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-tertiary)]">
                        Personnalisés
                    </h5>
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        {usagesPerso.map((usage) => (
                            <div
                                key={usage.id}
                                className="flex items-center gap-[var(--gap-sm)] rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-sm)]"
                            >
                                <div className="flex h-7 items-center rounded-[var(--radius-sm)] bg-[var(--color-accent-100,#eff6ff)] px-2 text-xs font-bold text-[var(--color-accent-700,#1565c0)]">
                                    {usage.code}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{usage.label}</p>
                                    {usage.description && (
                                        <p className="truncate text-xs text-[var(--color-text-tertiary)]">{usage.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openModifier(usage)}
                                        className="rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-dominant-50,#f0fdf4)] hover:text-[var(--color-dominant-600)]"
                                        title="Modifier"
                                    >
                                        <Edit className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                    </button>
                                    <button
                                        onClick={() => setConfirmDelete(usage)}
                                        className="rounded-[var(--radius-sm)] p-1 text-[var(--color-text-tertiary)] hover:bg-red-50 hover:text-red-500"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="h-[var(--icon-xs)] w-[var(--icon-xs)]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Vide */}
            {usages.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-8 text-[var(--color-text-tertiary)]">
                    <Tag className="h-[var(--icon-lg)] w-[var(--icon-lg)]" />
                    <p style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                        Aucun usage configuré. Créez votre premier usage.
                    </p>
                </div>
            )}

            {/* Confirmation suppression */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                title="Supprimer cet usage ?"
                message={`L'usage "${confirmDelete?.label}" (${confirmDelete?.code}) sera supprimé. Cette action est irréversible.`}
                confirmLabel="Supprimer"
                variant="danger"
                onConfirm={handleSupprimer}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
}
