/**
 * ==================================
 * eLISAschool - Page Modèles & Génération
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Galerie de modèles d'organisation + builder visuel par nœuds
 * + wizard de génération 3 étapes (CustomModal). Séparée des nomenclatures.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Plus, Play, Trash2, Edit, Sparkles, Building2, Briefcase, ChevronRight, X, Copy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { usePermissions, useDocumentTitle } from '@/hooks';
import {
    useTemplatesOrganisation, useCreerTemplateOrganisation,
    useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
} from '../hooks/use-templates';
import { GenerationWizard } from './generation-wizard';
import type { TemplateOrganisation } from '../types/organisation.types';

interface NoeudTemplate {
    niveau: number;
    echelonCode: string;
    nom: string;
    count: number;
    postes?: { ref: string; intitule: string; niveauResponsabiliteId?: string; nombrePostes: number }[];
    enfants?: NoeudTemplate[];
}

function noeudVide(niveau = 0): NoeudTemplate {
    return { niveau, echelonCode: 'SERVICE', nom: '', count: 1, postes: [], enfants: [] };
}

// ─── Éditeur récursif de nœud (builder visuel) ───
function NodeEditor({ noeud, onChange, onRemove, depth = 0 }: {
    noeud: NoeudTemplate;
    onChange: (n: NoeudTemplate) => void;
    onRemove?: () => void;
    depth?: number;
}) {
    const { t } = useTranslation('organisation');
    const set = (patch: Partial<NoeudTemplate>) => onChange({ ...noeud, ...patch });

    return (
        <div className="rounded-lg border border-border bg-surface-alt/40" style={{ marginLeft: depth ? 'clamp(0.5rem,2vw,1.5rem)' : 0 }}>
            <div className="flex flex-wrap items-center gap-2 p-3">
                <Building2 className="h-4 w-4 text-[var(--color-dominant-600)] shrink-0" />
                <input value={noeud.nom} onChange={(e) => set({ nom: e.target.value })} placeholder={t('nomUnite')}
                    className="flex-1 min-w-[8rem] px-2 py-1 text-sm border border-border rounded bg-background text-foreground" />
                <input value={noeud.echelonCode} onChange={(e) => set({ echelonCode: e.target.value })} placeholder={t('echelonCode', 'Code échelon')}
                    className="w-28 px-2 py-1 text-xs border border-border rounded bg-background text-foreground" />
                <label className="flex items-center gap-1 text-xs text-muted-foreground">×
                    <input type="number" min={1} value={noeud.count} onChange={(e) => set({ count: parseInt(e.target.value) || 1 })}
                        className="w-14 px-2 py-1 text-xs border border-border rounded bg-background text-foreground" />
                </label>
                <button type="button" onClick={() => set({ postes: [...(noeud.postes || []), { ref: `P${(noeud.postes?.length || 0) + 1}`, intitule: '', nombrePostes: 1 }] })}
                    className="p-1.5 rounded text-[var(--color-dominant-600)] hover:bg-[var(--color-dominant-50)] dark:hover:bg-[var(--color-dominant-900)]/20" title={t('ajouterPoste')}>
                    <Briefcase className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => set({ enfants: [...(noeud.enfants || []), noeudVide(depth + 1)] })}
                    className="p-1.5 rounded text-primary hover:bg-primary/10" title={t('ajouterSousUnite')}>
                    <Plus className="h-3.5 w-3.5" />
                </button>
                {onRemove && (
                    <button type="button" onClick={onRemove} className="p-1.5 rounded text-destructive hover:bg-destructive/10" title={t('supprimer')}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            {(noeud.postes && noeud.postes.length > 0) && (
                <div className="px-3 pb-2 space-y-1">
                    {noeud.postes.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 pl-6">
                            <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                            <input value={p.intitule} onChange={(e) => { const postes = [...(noeud.postes || [])]; postes[i] = { ...p, intitule: e.target.value }; set({ postes }); }}
                                placeholder={t('intitulePoste')} className="flex-1 px-2 py-0.5 text-xs border border-border rounded bg-background text-foreground" />
                            <input type="number" min={1} value={p.nombrePostes} onChange={(e) => { const postes = [...(noeud.postes || [])]; postes[i] = { ...p, nombrePostes: parseInt(e.target.value) || 1 }; set({ postes }); }}
                                className="w-14 px-2 py-0.5 text-xs border border-border rounded bg-background text-foreground" />
                            <button type="button" onClick={() => { const postes = [...(noeud.postes || [])]; postes.splice(i, 1); set({ postes }); }} className="p-1 text-destructive hover:text-destructive/80"><X className="h-3 w-3" /></button>
                        </div>
                    ))}
                </div>
            )}
            {(noeud.enfants && noeud.enfants.length > 0) && (
                <div className="px-3 pb-3 space-y-2">
                    {noeud.enfants.map((enfant, i) => (
                        <NodeEditor key={i} noeud={enfant} depth={depth + 1}
                            onChange={(n) => { const enfants = [...(noeud.enfants || [])]; enfants[i] = n; set({ enfants }); }}
                            onRemove={() => { const enfants = [...(noeud.enfants || [])]; enfants.splice(i, 1); set({ enfants }); }} />
                    ))}
                </div>
            )}
        </div>
    );
}

function StructurePreview({ noeud, depth = 0 }: { noeud: NoeudTemplate; depth?: number }) {
    if (!noeud) return null;
    return (
        <div className="text-xs" style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
            <div className="flex items-center gap-1 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{noeud.nom || '—'}</span>
                {noeud.count > 1 && <span>×{noeud.count}</span>}
                {noeud.postes && noeud.postes.length > 0 && <span className="text-[var(--color-dominant-600)]">· {noeud.postes.length} poste(s)</span>}
            </div>
            {(noeud.enfants || []).slice(0, 4).map((e, i) => <StructurePreview key={i} noeud={e} depth={depth + 1} />)}
        </div>
    );
}

export function ModelesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    useDocumentTitle(`eLISAschool | ${t('modeles')}`);

    const { data: templates, isLoading } = useTemplatesOrganisation();
    const creer = useCreerTemplateOrganisation();
    const modifier = useModifierTemplateOrganisation();
    const supprimer = useSupprimerTemplateOrganisation();

    const canWrite = hasPermission('organisation:templates:write');
    const canGenerate = hasPermission('organisation:generation:execute');

    // Builder
    const [builderOpen, setBuilderOpen] = useState(false);
    const [editing, setEditing] = useState<TemplateOrganisation | null>(null);
    const [nom, setNom] = useState('');
    const [description, setDescription] = useState('');
    const [structure, setStructure] = useState<NoeudTemplate>(noeudVide());
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Wizard de génération
    const [wizardOpen, setWizardOpen] = useState(false);
    const [wizardTemplateId, setWizardTemplateId] = useState<string | undefined>(undefined);

    const openCreate = () => { setEditing(null); setNom(''); setDescription(''); setStructure(noeudVide()); setBuilderOpen(true); };
    const openEdit = (tpl: TemplateOrganisation) => {
        setEditing(tpl); setNom(tpl.nom); setDescription(tpl.description || '');
        setStructure((tpl.structure as any) || noeudVide()); setBuilderOpen(true);
    };
    const openWizard = (templateId?: string) => { setWizardTemplateId(templateId); setWizardOpen(true); };
    const handleSave = async () => {
        if (nom.trim().length < 2) return;
        const payload = { nom: nom.trim(), description: description || undefined, structure: structure as any };
        try {
            // editing.id vide = duplication d'un modèle système → création (POST), pas PATCH
            if (editing && editing.id) await modifier.mutateAsync({ id: editing.id, ...payload });
            else await creer.mutateAsync(payload);
            setBuilderOpen(false);
        } catch {
            // erreur déjà notifiée par le hook (toast) ; on garde le modal ouvert
        }
    };

    if (isLoading && !templates) return <PageSkeleton showTable />;

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title={t('modeles')}
                subtitle={t('modelesGenerationSubtitle')}
                icon={FileText}
                variant="gradient"
                actions={
                    <div className="flex items-center gap-2">
                        {canGenerate && (
                            <ElisaButton variant="outline" size="sm" icon={<Sparkles className="h-4 w-4" />} onClick={() => openWizard(undefined)}>
                                {t('generationPersonnalisee')}
                            </ElisaButton>
                        )}
                        {canWrite && (
                            <ElisaButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                                {t('nouveauTemplate')}
                            </ElisaButton>
                        )}
                    </div>
                }
            />

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(templates || []).length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-10">{t('aucunTemplate')}</p>
                )}
                {(templates || []).map((tpl) => (
                    <Card key={tpl.id} className="p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0"><FileText className="h-4 w-4" /></div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{tpl.nom}</p>
                                    {tpl.description && <p className="text-xs text-muted-foreground truncate">{tpl.description}</p>}
                                </div>
                            </div>
                            {tpl.estSysteme && <Badge variant="secondary" size="sm">⚙ {t('systeme')}</Badge>}
                        </div>
                        <div className="rounded-md border border-border bg-surface-alt/40 p-2 max-h-28 overflow-auto">
                            <StructurePreview noeud={tpl.structure as any} />
                        </div>
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                            {canGenerate && (
                                <ElisaButton variant="ghost" size="xs" icon={<Play className="h-3.5 w-3.5" />} onClick={() => openWizard(tpl.id)}>
                                    {t('generer')}
                                </ElisaButton>
                            )}
                            {canWrite && !tpl.estSysteme && (
                                <>
                                    <button onClick={() => openEdit(tpl)} className="p-1.5 rounded text-primary hover:bg-primary/10"><Edit className="h-4 w-4" /></button>
                                    <button onClick={() => setDeleteId(tpl.id)} className="p-1.5 rounded text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                                </>
                            )}
                            {canWrite && tpl.estSysteme && (
                                <button onClick={() => openEdit({ ...tpl, id: '', estSysteme: false, nom: `${tpl.nom} (copie)` } as TemplateOrganisation)}
                                    className="p-1.5 rounded text-muted-foreground hover:bg-accent" title={t('dupliquer')}><Copy className="h-4 w-4" /></button>
                            )}
                        </div>
                    </Card>
                ))}
            </motion.div>

            {/* Builder visuel */}
            <CustomModal
                open={builderOpen}
                onOpenChange={(v) => { if (!v) setBuilderOpen(false); }}
                title={editing ? t('modifierTemplate') : t('nouveauTemplate')}
                size="3xl"
                footer={
                    <>
                        <ElisaButton variant="outline" size="sm" onClick={() => setBuilderOpen(false)}>{t('annuler')}</ElisaButton>
                        <ElisaButton variant="primary" size="sm" onClick={handleSave} disabled={nom.trim().length < 2 || creer.isPending || modifier.isPending}>
                            {t('enregistrer')}
                        </ElisaButton>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">{t('nomTemplate')} *</label>
                            <input value={nom} onChange={(e) => setNom(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-foreground">{t('description')}</label>
                            <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 text-sm border border-border rounded bg-background text-foreground" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">{t('structureTemplate')}</label>
                        <NodeEditor noeud={structure} onChange={setStructure} />
                    </div>
                </div>
            </CustomModal>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => { if (!open) setDeleteId(null); }}
                onConfirm={async () => { if (deleteId) { await supprimer.mutateAsync(deleteId); setDeleteId(null); } }}
                title={t('supprimer')}
                description={t('supprimerTemplate')}
                confirmText={t('supprimer')}
                variant="danger"
            />

            <GenerationWizard
                open={wizardOpen}
                onOpenChange={setWizardOpen}
                templates={templates || []}
                presetTemplateId={wizardTemplateId}
            />
        </div>
    );
}
