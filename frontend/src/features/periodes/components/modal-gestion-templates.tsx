/**
 * ==================================
 * eLISAschool - Modal Gestion Templates & Labels Périodes
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Interface de gestion des templates de hiérarchie (CRUD)
 * et personnalisation des libellés des types de périodes.
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Edit, Trash2, FileJson,
    ChevronDown, ChevronRight, Save, X, AlertCircle, Sparkles,
} from 'lucide-react';
import { CustomModal } from '@/components/modals/CustomModal';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import {
    useTemplatesPeriode,
    useCreerTemplatePeriode,
    useModifierTemplatePeriode,
    useSupprimerTemplatePeriode,
    useTemplatesParDefaut,
} from '../hooks/use-periodes';
import type {
    TemplatePeriodeEntity,
    NoeudTemplatePeriode,
} from '../types/periode.types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function ModalGestionTemplates({ isOpen, onClose }: Props) {
    return (
        <CustomModal
            open={isOpen}
            onOpenChange={(v) => { if (!v) onClose(); }}
            title="Gestion des templates de périodes"
            description="Gérer les modèles de hiérarchie de périodes"
            size="3xl"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                {/* Contenu */}
                <SectionTemplates />
            </div>
        </CustomModal>
    );
}

// ================================================================
// SECTION TEMPLATES
// ================================================================

function SectionTemplates() {
    const { data: templates = [], isLoading } = useTemplatesPeriode();
    const { data: modeles = [] } = useTemplatesParDefaut();
    const supprimer = useSupprimerTemplatePeriode();

    const [showForm, setShowForm] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<TemplatePeriodeEntity | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<TemplatePeriodeEntity | null>(null);
    const [showModeles, setShowModeles] = useState(false);

    const handleCreer = useCallback(() => {
        setTemplateToEdit(null);
        setShowForm(true);
    }, []);

    const handleCreerDepuisModele = useCallback((modele: { nom: string; description: string; structure: NoeudTemplatePeriode }) => {
        setTemplateToEdit({
            id: '',
            nom: modele.nom,
            description: modele.description,
            structure: modele.structure,
            estSysteme: false,
            actif: true,
            etablissementId: null,
            createdAt: '',
            updatedAt: '',
        } as TemplatePeriodeEntity);
        setShowForm(true);
        setShowModeles(false);
    }, []);

    const handleModifier = useCallback((tpl: TemplatePeriodeEntity) => {
        setTemplateToEdit(tpl);
        setShowForm(true);
    }, []);

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
            <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--color-text-secondary)]">
                    {templates.length} template(s) disponible(s)
                </p>
                <div className="flex items-center gap-[var(--gap-sm)]">
                    <ElisaButton
                        variant="outline"
                        size="sm"
                        icon={<Sparkles className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={() => setShowModeles(!showModeles)}
                    >
                        Depuis un modèle
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Plus className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={handleCreer}
                    >
                        Nouveau template
                    </ElisaButton>
                </div>
            </div>

            {/* Liste des modèles prédéfinis (dépliable) */}
            {showModeles && modeles.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-[var(--radius-lg)] border border-[var(--color-dominant-200)] bg-[var(--color-surface-alt)] p-[var(--space-md)]"
                >
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-[var(--space-sm)]">
                        Modèles prédéfinis
                    </h4>
                    <div className="flex flex-col gap-[var(--gap-xs)]">
                        {modeles.map((modele, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleCreerDepuisModele(modele)}
                                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] p-[var(--space-sm)] hover:border-[var(--color-dominant-400)] transition-colors text-left"
                            >
                                <div>
                                    <div className="text-sm font-medium text-[var(--color-text-primary)]">{modele.nom}</div>
                                    <div className="text-xs text-[var(--color-text-tertiary)]">{modele.description}</div>
                                </div>
                                <Plus className="h-4 w-4 text-[var(--color-dominant-600)] shrink-0" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Liste des templates */}
            <div className="flex flex-col gap-[var(--gap-sm)]">
                {templates.map((tpl) => (
                    <div
                        key={tpl.id}
                        className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-bordure)] p-[var(--space-md)]"
                    >
                        <div className="flex items-center gap-[var(--gap-sm)] min-w-0">
                            <FileJson className="h-[var(--icon-md)] w-[var(--icon-md)] text-[var(--color-dominant-600)] shrink-0" />
                            <div className="min-w-0">
                                <div className="flex items-center gap-[var(--gap-xs)]">
                                    <span className="font-medium text-[var(--color-text-primary)] truncate" style={{ fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}>
                                        {tpl.nom}
                                    </span>
                                    {tpl.estSysteme && (
                                        <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 font-medium">
                                            Système
                                        </span>
                                    )}
                                    {!tpl.actif && (
                                        <span className="shrink-0 rounded-full bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 font-medium">
                                            Inactif
                                        </span>
                                    )}
                                </div>
                                {tpl.description && (
                                    <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                                        {tpl.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-[var(--gap-xxs)] shrink-0">
                            <button
                                onClick={() => handleModifier(tpl)}
                                className="p-1.5 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)] transition-colors"
                                title="Modifier"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                            {!tpl.estSysteme && (
                                <button
                                    onClick={() => setConfirmDelete(tpl)}
                                    className="p-1.5 rounded hover:bg-red-50 text-[var(--color-text-muted)] hover:text-red-600 transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Formulaire création/édition */}
            {showForm && (
                <FormTemplate
                    template={templateToEdit}
                    onClose={() => setShowForm(false)}
                    onSaved={() => setShowForm(false)}
                />
            )}

            {/* Confirmation suppression */}
            {confirmDelete && (
                <ConfirmationModal
                    isOpen={!!confirmDelete}
                    title="Supprimer le template"
                    message={`Supprimer le template "${confirmDelete.nom}" ? Cette action est irréversible.`}
                    variant="danger"
                    confirmLabel="Supprimer"
                    onConfirm={handleSupprimer}
                    onCancel={() => setConfirmDelete(null)}
                    isLoading={supprimer.isPending}
                />
            )}
        </div>
    );
}

// ================================================================
// FORMULAIRE TEMPLATE
// ================================================================

interface FormTemplateProps {
    template: TemplatePeriodeEntity | null;
    onClose: () => void;
    onSaved: () => void;
}

function FormTemplate({ template, onClose, onSaved }: FormTemplateProps) {
    const creer = useCreerTemplatePeriode();
    const modifier = useModifierTemplatePeriode();

    const [nom, setNom] = useState(template?.nom || '');
    const [description, setDescription] = useState(template?.description || '');
    const [structure, setStructure] = useState<NoeudTemplatePeriode>(
        template?.structure || {
            niveau: 3,
            usageCode: 'ANNEE',
            count: 1,
            nom: 'Année',
            enfants: [
                {
                    niveau: 1,
                    usageCode: 'BULLETIN',
                    count: 3,
                    nom: 'Trimestre',
                    enfants: [
                        { niveau: 0, usageCode: 'NOTES', count: 2, nom: 'Séquence' },
                    ],
                },
            ],
        }
    );
    const [erreur, setErreur] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!nom.trim()) {
            setErreur('Le nom est requis');
            return;
        }
        try {
            // Si template.id existe (modification), sinon création (y compris depuis modèle)
            if (template?.id) {
                await modifier.mutateAsync({ id: template.id, nom, description, structure });
            } else {
                await creer.mutateAsync({ nom, description, structure });
            }
            onSaved();
        } catch (err: any) {
            setErreur(err?.message || 'Erreur lors de la sauvegarde');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-[var(--radius-lg)] border border-[var(--color-dominant-200)] bg-[var(--color-surface-alt)] p-[var(--space-md)]"
        >
            <div className="flex flex-col gap-[var(--gap-md)]">
                <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-[var(--color-text-primary)]" style={{ fontSize: 'clamp(0.875rem, 0.8rem + 0.3vw, 1rem)' }}>
                        {template?.id ? 'Modifier le template' : template ? 'Nouveau depuis modèle' : 'Nouveau template'}
                    </h4>
                    <button onClick={onClose} className="p-1 rounded hover:bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {erreur && (
                    <div className="flex items-center gap-[var(--gap-xs)] text-sm text-red-600 bg-red-50 rounded-[var(--radius-md)] p-[var(--space-sm)]">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {erreur}
                    </div>
                )}

                {/* Nom */}
                <div className="flex flex-col gap-[var(--gap-xxs)]">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Nom</label>
                    <input
                        type="text"
                        value={nom}
                        onChange={(e) => setNom(e.target.value)}
                        placeholder="Ex: 3 trimestres + 2 séquences"
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                        style={{ padding: 'var(--space-sm)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-[var(--gap-xxs)]">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Année divisée en 3 trimestres, chacun en 2 séquences"
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                        style={{ padding: 'var(--space-sm)', fontSize: 'clamp(0.8125rem, 0.75rem + 0.2vw, 0.9375rem)' }}
                    />
                </div>

                {/* Structure JSON */}
                <div className="flex flex-col gap-[var(--gap-xxs)]">
                    <label className="text-xs font-medium text-[var(--color-text-secondary)]">
                        Structure hiérarchique (JSON)
                    </label>
                    <textarea
                        value={JSON.stringify(structure, null, 2)}
                        onChange={(e) => {
                            try {
                                setStructure(JSON.parse(e.target.value));
                                setErreur(null);
                            } catch {
                                setErreur('JSON invalide');
                            }
                        }}
                        rows={10}
                        className="rounded-[var(--radius-md)] border border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-primary)] font-mono text-xs"
                        style={{ padding: 'var(--space-sm)' }}
                    />
                    <p className="text-[10px] text-[var(--color-text-tertiary)]">
                        Format : {'{ "niveau": 3, "usageCode": "ANNEE", "count": 1, "nom": "Année", "enfants": [...] }'}
                    </p>
                </div>

                {/* Aperçu récursif */}
                <ApercuStructure noeud={structure} />

                {/* Actions */}
                <div className="flex items-center justify-end gap-[var(--gap-sm)]">
                    <ElisaButton variant="outline" size="sm" onClick={onClose}>
                        Annuler
                    </ElisaButton>
                    <ElisaButton
                        variant="primary"
                        size="sm"
                        icon={<Save className="h-[var(--icon-sm)] w-[var(--icon-sm)]" />}
                        onClick={handleSubmit}
                        chargement={creer.isPending || modifier.isPending}
                    >
                        {template ? 'Mettre à jour' : 'Créer'}
                    </ElisaButton>
                </div>
            </div>
        </motion.div>
    );
}

// ================================================================
// APERÇU STRUCTURE
// ================================================================

function ApercuStructure({ noeud, profondeur = 0 }: { noeud: NoeudTemplatePeriode; profondeur?: number }) {
    const [expanded, setExpanded] = useState(true);
    const aEnfants = noeud.enfants && noeud.enfants.length > 0;

    return (
        <div style={{ paddingLeft: profondeur > 0 ? '1rem' : 0 }}>
            <div className="flex items-center gap-[var(--gap-xs)] py-0.5">
                {aEnfants ? (
                    <button onClick={() => setExpanded(!expanded)} className="p-0.5 rounded hover:bg-[var(--color-surface-alt)]">
                        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>
                ) : (
                    <span className="w-3" />
                )}
                <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-medium text-[var(--color-dominant-600)]">{noeud.count}×</span>
                    {' '}{noeud.nom} (niv. {noeud.niveau} — {noeud.usageCode})
                </span>
            </div>
            {aEnfants && expanded && (
                <div className="border-l border-[var(--color-bordure)] ml-1.5">
                    {noeud.enfants!.map((enfant, i) => (
                        <ApercuStructure key={i} noeud={enfant} profondeur={profondeur + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}

