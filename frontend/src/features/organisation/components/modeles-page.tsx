/**
 * ==================================
 * eLISAschool - Page Modèles & Génération
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Galerie de modèles d'organisation avec filtres par facettes (v5.1)
 * + builder visuel par nœuds + wizard de génération 3 étapes (CustomModal).
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Play, Trash2, Edit, Sparkles, Building2, Briefcase,
    ChevronRight, ChevronDown, X, Copy, AlertCircle, Filter, RotateCcw,
    GraduationCap, Globe, Layers, Shield,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ElisaButton } from '@/components/ui/ElisaButton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { CustomModal } from '@/components/modals/CustomModal';
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
import { PageSkeleton } from '@/components/ui/Skeleton';
import { usePermissions, useDocumentTitle } from '@/hooks';
import {
    useTemplatesOrganisation, useCreerTemplateOrganisation,
    useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
    useCombinaisonsTemplates, useClonerTemplateOrganisation,
} from '../hooks/use-templates';
import { GenerationWizard } from './generation-wizard';
import type {
    TemplateOrganisation, TemplateStructure, TemplateFiltres,
} from '../types/organisation.types';

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

// ─── Badge de facette ───
function FacetBadge({ label, active, count, onClick }: {
    label: string; active: boolean; count?: number; onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={[
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                active
                    ? 'border-[var(--color-dominant-500)] bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]'
                    : 'border-[var(--color-bordure)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-dominant-300)] hover:text-[var(--color-text-primary)]',
            ].join(' ')}
            style={{ fontSize: 'clamp(0.65rem, 0.6rem + 0.2vw, 0.75rem)' }}
        >
            {label}
            {count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${active ? 'bg-[var(--color-dominant-200)] text-[var(--color-dominant-800)]' : 'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]'}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ─── Panneau de filtres par facettes ───
function FacetFilters({ filtres, combinaisons, onChange, onReset }: {
    filtres: TemplateFiltres;
    combinaisons: { natures: string[]; systemes: string[]; langues: string[]; niveaux: string[]; complexites: string[]; compteurs: Record<string, number> };
    onChange: (f: TemplateFiltres) => void;
    onReset: () => void;
}) {
    const { t } = useTranslation('organisation');
    const [expanded, setExpanded] = useState(true);

    const hasActiveFilters = filtres.nature || filtres.systeme || filtres.langue || filtres.niveau || filtres.complexite;

    const toggle = (key: keyof TemplateFiltres, value: string) => {
        onChange({ ...filtres, [key]: filtres[key] === value ? undefined : value });
    };

    return (
        <div className="rounded-lg border border-[var(--color-bordure)] bg-[var(--color-surface)]">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors rounded-t-lg"
            >
                <span className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-[var(--color-dominant-600)]" />
                    {t('filtres', 'Filtres')}
                    {hasActiveFilters && (
                        <Badge variant="default" size="xs" className="ml-1">!</Badge>
                    )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-3 px-4 pb-4">
                            {/* Nature juridique */}
                            {combinaisons.natures.length > 0 && (
                                <div>
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                        <Shield className="h-3 w-3" />
                                        {t('natureJuridique', 'Nature juridique')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {combinaisons.natures.map((n) => (
                                            <FacetBadge key={n} label={t(`natures.${n}`, n)} active={filtres.nature === n} onClick={() => toggle('nature', n)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Système éducatif */}
                            {combinaisons.systemes.length > 0 && (
                                <div>
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                        <GraduationCap className="h-3 w-3" />
                                        {t('systemeEducatif', 'Système éducatif')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {combinaisons.systemes.map((s) => (
                                            <FacetBadge key={s} label={t(`systemes.${s}`, s)} active={filtres.systeme === s} onClick={() => toggle('systeme', s)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Langue */}
                            {combinaisons.langues.length > 0 && (
                                <div>
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                        <Globe className="h-3 w-3" />
                                        {t('langueEnseignement', 'Langue')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {combinaisons.langues.map((l) => (
                                            <FacetBadge key={l} label={t(`langues.${l}`, l)} active={filtres.langue === l} onClick={() => toggle('langue', l)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Niveau */}
                            {combinaisons.niveaux.length > 0 && (
                                <div>
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                        <Layers className="h-3 w-3" />
                                        {t('niveauEnseignement', 'Niveau')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {combinaisons.niveaux.map((n) => (
                                            <FacetBadge key={n} label={t(`niveaux.${n}`, n)} active={filtres.niveau === n} onClick={() => toggle('niveau', n)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Complexité */}
                            {combinaisons.complexites.length > 0 && (
                                <div>
                                    <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)]">
                                        {t('complexite', 'Complexité')}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {combinaisons.complexites.map((c) => (
                                            <FacetBadge key={c} label={t(`complexites.${c}`, c)} active={filtres.complexite === c} onClick={() => toggle('complexite', c)} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Reset */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={onReset}
                                    className="flex items-center gap-1 text-xs text-[var(--color-dominant-600)] hover:underline"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                    {t('reinitialiserFiltres', 'Réinitialiser les filtres')}
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Badge de catégorie sur la carte ───
function TemplateBadges({ tpl }: { tpl: TemplateOrganisation }) {
    const { t } = useTranslation('organisation');
    return (
        <div className="flex flex-wrap gap-1">
            {tpl.nature && (
                <Badge variant="secondary" size="xs" className="bg-[var(--color-dominant-50)] text-[var(--color-dominant-700)] dark:bg-[var(--color-dominant-900)]/30 dark:text-[var(--color-dominant-300)]">
                    {t(`natures.${tpl.nature}`, tpl.nature)}
                </Badge>
            )}
            {tpl.systeme && (
                <Badge variant="secondary" size="xs">
                    {t(`systemes.${tpl.systeme}`, tpl.systeme)}
                </Badge>
            )}
            {tpl.langue && (
                <Badge variant="secondary" size="xs" className="bg-[var(--color-info-50)] text-[var(--color-info-700)] dark:bg-[var(--color-info-900)]/30 dark:text-[var(--color-info-300)]">
                    {t(`langues.${tpl.langue}`, tpl.langue)}
                </Badge>
            )}
            {tpl.complexite === 'AVANCE' && (
                <Badge variant="warning" size="xs">
                    {t('complexites.AVANCE', 'Avancé')}
                </Badge>
            )}
            {tpl.estSysteme && (
                <Badge variant="secondary" size="xs">
                    {t('systeme', 'Système')}
                </Badge>
            )}
        </div>
    );
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
    const { t } = useTranslation('organisation');
    if (!noeud) return null;
    return (
        <div className="text-xs" style={{ paddingLeft: depth ? '0.75rem' : 0 }}>
            <div className="flex items-center gap-1 text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground">{noeud.nom || '—'}</span>
                {noeud.count > 1 && <span>×{noeud.count}</span>}
                {noeud.postes && noeud.postes.length > 0 && <span className="text-[var(--color-dominant-600)]">· {noeud.postes.length} {t('postes')}</span>}
            </div>
            {(noeud.enfants || []).slice(0, 4).map((e, i) => <StructurePreview key={i} noeud={e} depth={depth + 1} />)}
        </div>
    );
}

export function ModelesPage() {
    const { t } = useTranslation('organisation');
    const { hasPermission } = usePermissions();
    useDocumentTitle(`eLISAschool | ${t('modeles')}`);

    // Filtres
    const [filtres, setFiltres] = useState<TemplateFiltres>({});
    const [search, setSearch] = useState('');

    // Hooks data
    const filtresAvecSearch = useMemo(() => ({
        ...filtres,
        search: search || undefined,
    }), [filtres, search]);

    const { data: templates, isLoading, isError, refetch } = useTemplatesOrganisation(filtresAvecSearch);
    const { data: combinaisons } = useCombinaisonsTemplates();
    const creer = useCreerTemplateOrganisation();
    const modifier = useModifierTemplateOrganisation();
    const supprimer = useSupprimerTemplateOrganisation();
    const cloner = useClonerTemplateOrganisation();

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
        setStructure((tpl.structure as unknown as NoeudTemplate) || noeudVide()); setBuilderOpen(true);
    };
    const openWizard = (templateId?: string) => { setWizardTemplateId(templateId); setWizardOpen(true); };
    const handleSave = async () => {
        if (nom.trim().length < 2) return;
        const payload = { nom: nom.trim(), description: description || undefined, structure: structure as unknown as TemplateStructure };
        try {
            if (editing && editing.id) await modifier.mutateAsync({ id: editing.id, ...payload });
            else await creer.mutateAsync(payload);
            setBuilderOpen(false);
        } catch {
            // erreur déjà notifiée par le hook
        }
    };

    const handleClone = async (tpl: TemplateOrganisation) => {
        try {
            await cloner.mutateAsync({ id: tpl.id });
        } catch {
            // erreur déjà notifiée
        }
    };

    const resetFiltres = () => {
        setFiltres({});
        setSearch('');
    };

    // Compter les résultats par catégorie
    const compteurs = combinaisons?.compteurs ?? {};
    const totalVisible = (templates || []).length;

    if (isLoading && !templates) return <PageSkeleton showTable />;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-12">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium text-foreground">{t('erreurChargement')}</p>
                <ElisaButton variant="outline" onClick={() => refetch()}>
                    {t('reessayer')}
                </ElisaButton>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ gap: 'var(--gap-lg)', padding: 'var(--space-lg)' }}>
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

            {/* Barre de recherche + résultats */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <SearchInput
                    value={search}
                    onChange={setSearch}
                    placeholder={t('rechercherTemplate', 'Rechercher un modèle...')}
                    debounceMs={300}
                />
                <span className="text-xs text-[var(--color-text-muted)]">
                    {totalVisible} {t('template(s)', 'modèle(s)')}
                    {(filtres.nature || filtres.systeme || filtres.langue || filtres.niveau || filtres.complexite) && (
                        <span className="ml-1 text-[var(--color-dominant-600)]">({t('filtreActif', 'filtré')})</span>
                    )}
                </span>
            </div>

            {/* Filtres par facettes */}
            {combinaisons && (
                <FacetFilters
                    filtres={filtres}
                    combinaisons={combinaisons}
                    onChange={setFiltres}
                    onReset={resetFiltres}
                />
            )}

            {/* Grille de templates */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                style={{ gap: 'clamp(0.75rem, 1vw + 0.5rem, 1.25rem)' }}
            >
                {(templates || []).length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-10">{t('aucunTemplate')}</p>
                )}
                {(templates || []).map((tpl) => (
                    <Card key={tpl.id} className="p-4 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate" style={{ fontSize: 'clamp(0.8rem, 0.75rem + 0.2vw, 0.95rem)' }}>
                                        {tpl.nom}
                                    </p>
                                    {tpl.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Badges de catégorisation */}
                        <TemplateBadges tpl={tpl} />

                        {/* Aperçu structure */}
                        <div className="rounded-md border border-border bg-surface-alt/40 p-2 max-h-28 overflow-auto">
                            <StructurePreview noeud={tpl.structure as unknown as NoeudTemplate} />
                        </div>

                        {/* Compteur catégorie */}
                        {tpl.categorie && compteurs[tpl.categorie] && (
                            <p className="text-[10px] text-[var(--color-text-muted)]">
                                {compteurs[tpl.categorie]} {t('dansCategorie', 'dans cette catégorie')}
                            </p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border">
                            {canGenerate && (
                                <ElisaButton variant="ghost" size="xs" icon={<Play className="h-3.5 w-3.5" />} onClick={() => openWizard(tpl.id)}>
                                    {t('generer')}
                                </ElisaButton>
                            )}
                            {canWrite && (
                                <button
                                    onClick={() => handleClone(tpl)}
                                    className="p-1.5 rounded text-muted-foreground hover:bg-accent hover:text-[var(--color-dominant-600)]"
                                    title={t('cloner', 'Cloner')}
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
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
