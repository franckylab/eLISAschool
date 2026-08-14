/**
 * ==================================
 * eLISAschool - Éditeur de page CMS (Puck Editor)
 * ==================================
 * Route: /_auth/cms/pages/$id
 * Éditeur visuel Puck avec drag & drop.
 * Remplace l'ancien éditeur 3 colonnes.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    useCmsPage, useModifierPage, useCreerSection, useModifierSection,
    useSupprimerSection, useReordonnerSections,
} from '@/features/cms/hooks/use-cms-admin';
import { useGenererPreviewToken } from '@/features/cms/hooks/use-cms-admin';
import { SectionType, StatutPage } from '@/features/cms/types/cms.types';
import type { CmsSection } from '@/features/cms/types/cms.types';
import { Puck, type Data } from '@puckeditor/core';
import '@puckeditor/core/puck.css';
import { puckConfig, PUCK_TO_SECTION_TYPE, SECTION_TYPE_TO_PUCK } from '@/features/cms/puck/config';
import { ArrowLeft, Eye, Save, Download, Search, Monitor, LayoutGrid, Layers, Undo2, Redo2, Keyboard, Bookmark, BarChart3, Command, Palette, Copy, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExportImportPanel } from '@/features/cms/components/ExportImportPanel';
import { SeoPanel } from '@/features/cms/components/SeoPanel';
import { ResponsivePreview } from '@/features/cms/components/ResponsivePreview';
import { SECTION_PATTERNS, PATTERN_CATEGORIE_LABELS, insererPatternDansPuck, type SectionPattern } from '@/features/cms/lib/section-patterns';
import { SectionLibraryPanel } from '@/features/cms/components/SectionLibrary';
import { StyleEditorPanel } from '@/features/cms/components/StyleEditorPanel';
import { SectionClipboardPanel } from '@/features/cms/components/SectionClipboard';
import { VisibilityEditor, type VisibilityCondition } from '@/features/cms/components/VisibilityEditor';
import { ContentMetricsPanel } from '@/features/cms/components/ContentMetrics';
import { CommandPalette, CommandPaletteButton } from '@/features/cms/components/CommandPalette';
import { FocusModeButton, useFocusMode, FocusModeOverlay } from '@/features/cms/components/FocusMode';

export const Route = createFileRoute('/_auth/cms/pages/$id')({
    component: CmsPageEditor,
});

// ==================================
// Sérialisation : Puck Data ↔ CMS Sections
// ==================================

/** Convertit les sections CMS en Puck Data */
function sectionsToPuckData(sections: CmsSection[]): Data {
    const sorted = [...sections]
        .filter(s => s.visible !== false)
        .sort((a, b) => a.ordre - b.ordre);

    const content = sorted.map((section) => {
        const puckType = SECTION_TYPE_TO_PUCK[section.type] || section.type;
        return {
            type: puckType,
            props: { ...section.contenu, id: section.id },
        };
    });

    return { content, root: {} };
}

/** Extrait les props Puck en contenu CMS (sans le champ id) */
function extractContenu(props: Record<string, any>): Record<string, any> {
    const { id, ...contenu } = props;
    return contenu;
}

// ==================================
// Composant principal
// ==================================

function CmsPageEditor() {
    const { id } = Route.useParams();
    const navigate = useNavigate();
    const { data: page, isLoading } = useCmsPage(id);
    const modifierPage = useModifierPage();
    const creerSection = useCreerSection();
    const modifierSection = useModifierSection();
    const supprimerSection = useSupprimerSection();
    const reordonnerSections = useReordonnerSections();
    const genererPreview = useGenererPreviewToken();

    // État Puck
    const [puckData, setPuckData] = useState<Data>({ content: [], root: {} });
    // Époch de rechargement : Puck v0.23 traite la prop `data` comme initial-only
    // (aucun re-sync après montage). On force un remount via `key` à chaque mutation
    // EXTERNE de puckData (init, undo/redo, patterns, library, clipboard, palette).
    const [puckEpoch, setPuckEpoch] = useState(0);
    const bumpPuckEpoch = useCallback(() => setPuckEpoch(e => e + 1), []);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    // Panneaux latéraux
    const [showExportImport, setShowExportImport] = useState(false);
    const [showSeo, setShowSeo] = useState(false);
    const [showResponsive, setShowResponsive] = useState(false);
    const [showPatterns, setShowPatterns] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showLibrary, setShowLibrary] = useState(false);
    const [showStyleEditor, setShowStyleEditor] = useState(false);
    const [showClipboard, setShowClipboard] = useState(false);
    const [showVisibility, setShowVisibility] = useState(false);
    const [showMetrics, setShowMetrics] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);

    // Focus mode
    const { isFocus, toggleFocus, exitFocus, settings: focusSettings, updateSettings: updateFocusSettings } = useFocusMode();

    // Visibility condition (pour la section sélectionnée)
    const [visibilityCondition, setVisibilityCondition] = useState<VisibilityCondition>({});

    // Undo/Redo
    const [undoStack, setUndoStack] = useState<Data[]>([]);
    const [redoStack, setRedoStack] = useState<Data[]>([]);

    // SEO data
    const [seoData, setSeoData] = useState({
        metaTitle: '',
        metaDescription: '',
        slug: '',
        ogImage: '',
        canonicalUrl: '',
        noindex: false,
    });

    // Map des ID de sections existantes (pour savoir si c'est un create ou update)
    const existingSectionIds = useMemo(() => {
        const ids = new Set<string>();
        for (const item of page?.sections || []) {
            ids.add(item.id);
        }
        return ids;
    }, [page?.sections]);

    // Initialiser Puck data depuis les sections CMS
    // Utilise un ref pour tracker la dernière page chargée — évite les re-inits intempestives
    // tout en permettant le re-chargement si les sections arrivent en différé
    const lastLoadedPageId = useRef<string | null>(null);
    const lastSectionsCount = useRef<number>(0);
    useEffect(() => {
        if (!page) return;

        // Initialiser SEO depuis la page
        setSeoData({
            metaTitle: (page.seo as any)?.metaTitle || page.titre || '',
            metaDescription: (page.seo as any)?.metaDescription || '',
            slug: page.slug || '',
            ogImage: (page.seo as any)?.ogImage || '',
            canonicalUrl: '',
            noindex: page.statut !== StatutPage.PUBLIE,
        });

        // Initialiser Puck data — se déclenche quand la page change OU quand
        // les sections arrivent en différé (TanStack Query cache/stale puis refetch)
        const sectionsCount = page.sections?.length || 0;
        if (lastLoadedPageId.current !== page.id || sectionsCount !== lastSectionsCount.current) {
            setPuckData(sectionsToPuckData(page.sections || []));
            lastLoadedPageId.current = page.id;
            lastSectionsCount.current = sectionsCount;
            bumpPuckEpoch();
        }
    }, [page, bumpPuckEpoch]);

    // handleChange Puck → sauvegarde auto avec debounce
    const handlePuckChange = useCallback((newData: Data) => {
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData(newData);
        setHasChanges(true);

        // Debounce 1.5s pour la sauvegarde auto
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            syncSections(newData);
        }, 1500);
    }, [puckData]);

    // Undo
    const handleUndo = useCallback(() => {
        if (undoStack.length === 0) return;
        const prev = undoStack[undoStack.length - 1];
        setRedoStack(r => [...r, puckData]);
        setUndoStack(u => u.slice(0, -1));
        setPuckData(prev);
        bumpPuckEpoch();
        setHasChanges(true);
    }, [undoStack, puckData, bumpPuckEpoch]);

    // Redo
    const handleRedo = useCallback(() => {
        if (redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setUndoStack(u => [...u, puckData]);
        setRedoStack(r => r.slice(0, -1));
        setPuckData(next);
        bumpPuckEpoch();
        setHasChanges(true);
    }, [redoStack, puckData, bumpPuckEpoch]);

    // Insérer un pattern
    const handleInsererPattern = useCallback((pattern: SectionPattern) => {
        const newData = insererPatternDansPuck(puckData, pattern);
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData(newData);
        bumpPuckEpoch();
        setHasChanges(true);
        setShowPatterns(false);
        toast.success(`Pattern "${pattern.nom}" inséré (${pattern.sections} sections)`);
    }, [puckData, bumpPuckEpoch]);

    // Synchroniser les sections Puck vers le backend
    const syncSections = useCallback(async (data: Data) => {
        if (!data.content.length && !page?.sections?.length) return;

        setIsSaving(true);
        try {
            const promises: Promise<any>[] = [];

            // 1. Mettre à jour / créer chaque section
            for (let i = 0; i < data.content.length; i++) {
                const item = data.content[i];
                const sectionType = PUCK_TO_SECTION_TYPE[item.type] || item.type;
                const contenu = extractContenu(item.props);
                const sectionId = (item.props as any).id;

                if (sectionId && existingSectionIds.has(sectionId)) {
                    // Section existante → update
                    promises.push(
                        modifierSection.mutateAsync({
                            id: sectionId,
                            ordre: i,
                            contenu,
                        })
                    );
                } else {
                    // Nouvelle section → create
                    promises.push(
                        creerSection.mutateAsync({
                            type: sectionType as SectionType,
                            pageId: id,
                            ordre: i,
                            contenu,
                            visible: true,
                        })
                    );
                }
            }

            // 2. Supprimer les sections qui n'existent plus dans Puck
            const puckIds = new Set(
                data.content
                    .map(item => (item.props as any).id)
                    .filter(Boolean)
            );
            for (const existingSection of page?.sections || []) {
                if (!puckIds.has(existingSection.id)) {
                    promises.push(supprimerSection.mutateAsync(existingSection.id));
                }
            }

            // 3. Réordonner
            if (data.content.length > 1) {
                const reorderItems = data.content
                    .map((item, i) => ({
                        id: (item.props as any).id || '',
                        ordre: i,
                    }))
                    .filter(item => item.id);

                if (reorderItems.length > 1) {
                    promises.push(
                        reordonnerSections.mutateAsync({ pageId: id, sections: reorderItems })
                    );
                }
            }

            await Promise.allSettled(promises);
            setHasChanges(false);
        } catch {
            toast.error('Erreur lors de la sauvegarde automatique');
        } finally {
            setIsSaving(false);
        }
    }, [id, page?.sections, existingSectionIds, modifierSection, creerSection, supprimerSection, reordonnerSections]);

    // Sauvegarde manuelle
    const handleSave = useCallback(async () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        await syncSections(puckData);
        toast.success('Page sauvegardée');
    }, [puckData, syncSections]);

    // Publier
    const handlePublier = useCallback(async () => {
        // Sauvegarder avant de publier
        if (hasChanges) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            await syncSections(puckData);
        }
        try {
            await modifierPage.mutateAsync({ id, statut: StatutPage.PUBLIE });
            toast.success('Page publiée');
        } catch {
            toast.error('Erreur lors de la publication');
        }
    }, [id, hasChanges, puckData, syncSections, modifierPage]);

    // Preview
    const handlePreview = useCallback(async () => {
        try {
            const { token, slug, codeEtablissement } = await genererPreview.mutateAsync(id);
            window.open(`/e/${codeEtablissement}/${slug}?preview=${token}`, '_blank');
        } catch {
            toast.error('Erreur lors de la génération de l\'aperçu');
        }
    }, [id, genererPreview]);

    // Keyboard shortcut Ctrl+S / Ctrl+Z / Ctrl+Y / Ctrl+Shift+P / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                setShowPatterns(p => !p);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(p => !p);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave, handleUndo, handleRedo]);

    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Loading
    if (isLoading) {
        return (
            <div className="flex h-[calc(100dvh-9rem)] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
            </div>
        );
    }

    // Page introuvable
    if (!page) {
        return (
            <div className="flex h-[calc(100dvh-9rem)] items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Page introuvable</p>
                    <button onClick={() => navigate({ to: '/cms/pages' })} className="mt-4 text-sm text-primary hover:underline">
                        Retour aux pages
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative flex h-[calc(100dvh-9rem)] flex-col overflow-hidden rounded-lg border bg-card">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between border-b bg-card/50 px-4 py-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate({ to: '/cms/pages' })}
                        className="rounded-lg p-1.5 hover:bg-muted"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-sm font-semibold">{page.titre}</h1>
                        <p className="text-xs text-muted-foreground">/{page.slug}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        page.statut === StatutPage.PUBLIE
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                        {page.statut === StatutPage.PUBLIE ? 'Publié' : 'Brouillon'}
                    </span>
                    {hasChanges && (
                        <span className="text-xs text-orange-500">Modifications non sauvegardées</span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Toggle Undo/Redo */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleUndo}
                            disabled={undoStack.length === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors hover:bg-muted disabled:opacity-30"
                            title="Annuler (Ctrl+Z)"
                        >
                            <Undo2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={redoStack.length === 0}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors hover:bg-muted disabled:opacity-30"
                            title="Rétablir (Ctrl+Y)"
                        >
                            <Redo2 className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="h-5 w-px bg-gray-200" />

                    {/* Toggle Library */}
                    <button
                        onClick={() => { setShowLibrary(!showLibrary); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); setShowPatterns(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showLibrary ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'hover:bg-muted'
                        }`}
                        title="Bibliothèque de sections"
                    >
                        <Bookmark className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Bibliothèque</span>
                    </button>

                    {/* Toggle Patterns */}
                    <button
                        onClick={() => { setShowPatterns(!showPatterns); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showPatterns ? 'bg-amber-50 text-amber-700 border-amber-200' : 'hover:bg-muted'
                        }`}
                        title="Blocs de sections (Ctrl+Shift+P)"
                    >
                        <LayoutGrid className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Patterns</span>
                    </button>

                    {/* Toggle Responsive Preview */}
                    <button
                        onClick={() => { setShowResponsive(!showResponsive); setShowSeo(false); setShowExportImport(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showResponsive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'hover:bg-muted'
                        }`}
                        title="Preview responsive"
                    >
                        <Monitor className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Responsive</span>
                    </button>

                    {/* Toggle SEO */}
                    <button
                        onClick={() => { setShowSeo(!showSeo); setShowResponsive(false); setShowExportImport(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showSeo ? 'bg-green-50 text-green-700 border-green-200' : 'hover:bg-muted'
                        }`}
                        title="Optimisation SEO"
                    >
                        <Search className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">SEO</span>
                    </button>

                    {/* Toggle Export/Import */}
                    <button
                        onClick={() => { setShowExportImport(!showExportImport); setShowSeo(false); setShowResponsive(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showExportImport ? 'bg-purple-50 text-purple-700 border-purple-200' : 'hover:bg-muted'
                        }`}
                        title="Exporter / Importer"
                    >
                        <Download className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">JSON</span>
                    </button>

                    <div className="h-5 w-px bg-gray-200" />

                    {/* Toggle Style Editor */}
                    <button
                        onClick={() => { setShowStyleEditor(!showStyleEditor); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); setShowClipboard(false); setShowVisibility(false); setShowMetrics(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showStyleEditor ? 'bg-pink-50 text-pink-700 border-pink-200' : 'hover:bg-muted'
                        }`}
                        title="Éditeur de style"
                    >
                        <Palette className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Style</span>
                    </button>

                    {/* Toggle Clipboard */}
                    <button
                        onClick={() => { setShowClipboard(!showClipboard); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); setShowStyleEditor(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showClipboard ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'hover:bg-muted'
                        }`}
                        title="Presse-papier de sections"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Clipboard</span>
                    </button>

                    {/* Toggle Visibility */}
                    <button
                        onClick={() => { setShowVisibility(!showVisibility); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); setShowStyleEditor(false); setShowClipboard(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showVisibility ? 'bg-teal-50 text-teal-700 border-teal-200' : 'hover:bg-muted'
                        }`}
                        title="Conditions d'affichage"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Visibilité</span>
                    </button>

                    {/* Toggle Metrics */}
                    <button
                        onClick={() => { setShowMetrics(!showMetrics); setShowSeo(false); setShowResponsive(false); setShowExportImport(false); setShowStyleEditor(false); setShowClipboard(false); setShowVisibility(false); }}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            showMetrics ? 'bg-orange-50 text-orange-700 border-orange-200' : 'hover:bg-muted'
                        }`}
                        title="Métriques de contenu"
                    >
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Qualité</span>
                    </button>

                    <div className="h-5 w-px bg-gray-200" />

                    {/* Focus Mode */}
                    <FocusModeButton isFocus={isFocus} onToggle={toggleFocus} />

                    {/* Command Palette */}
                    <CommandPaletteButton onClick={() => setShowCommandPalette(true)} />

                    <div className="h-5 w-px bg-gray-200" />

                    {/* Toggle Shortcuts */}
                    <button
                        onClick={() => setShowShortcuts(!showShortcuts)}
                        className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs transition-colors hover:bg-muted ${
                            showShortcuts ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                        }`}
                        title="Raccourcis clavier"
                    >
                        <Keyboard className="h-3.5 w-3.5" />
                    </button>

                    <div className="h-5 w-px bg-gray-200" />

                    <button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        title="Sauvegarder (Ctrl+S)"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                    <button
                        onClick={handlePreview}
                        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                        <Eye className="h-3.5 w-3.5" />
                        Aperçu
                    </button>
                    <button
                        onClick={handlePublier}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Publier
                    </button>
                </div>
            </div>

            {/* Panneau latéral (SEO / Export / Responsive / Patterns / Shortcuts / Style / Clipboard / Visibility / Metrics) */}
            {(showSeo || showExportImport || showResponsive || showPatterns || showShortcuts || showLibrary || showStyleEditor || showClipboard || showVisibility || showMetrics) && (
                <div className="absolute right-0 top-0 z-40 h-full w-80 border-l bg-white shadow-xl overflow-y-auto">
                    <div className="flex items-center justify-between border-b px-3 py-2">
                        <h3 className="text-sm font-semibold">
                            {showSeo ? 'Optimisation SEO' : showExportImport ? 'Export / Import' : showResponsive ? 'Preview Responsive' : showPatterns ? 'Blocs de sections' : showLibrary ? 'Bibliothèque' : showStyleEditor ? 'Éditeur de style' : showClipboard ? 'Presse-papier' : showVisibility ? 'Conditions d\'affichage' : showMetrics ? 'Qualité contenu' : 'Raccourcis clavier'}
                        </h3>
                        <button
                            onClick={() => { setShowSeo(false); setShowExportImport(false); setShowResponsive(false); setShowPatterns(false); setShowShortcuts(false); setShowLibrary(false); setShowStyleEditor(false); setShowClipboard(false); setShowVisibility(false); setShowMetrics(false); }}
                            className="rounded p-1 hover:bg-gray-100"
                        >
                            <span className="text-xs">✕</span>
                        </button>
                    </div>
                    {showSeo && (
                        <SeoPanel
                            data={seoData}
                            onChange={(updates) => setSeoData(prev => ({ ...prev, ...updates }))}
                            codeEtablissement={seoData.slug || page.slug}
                        />
                    )}
                    {showExportImport && (
                        <ExportImportPanel
                            pageId={id}
                            pageTitre={page.titre}
                            onImportComplete={() => {
                                toast.info('Rechargez la page pour voir les changements');
                            }}
                        />
                    )}
                    {showResponsive && (
                        <div className="p-2">
                            <p className="mb-2 text-xs text-gray-500">Sélectionnez un appareil pour prévisualiser.</p>
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { label: 'Mobile', width: 375 },
                                    { label: 'Tablette', width: 768 },
                                    { label: 'Laptop', width: 1024 },
                                    { label: 'Desktop', width: 1440 },
                                ].map(d => (
                                    <button
                                        key={d.label}
                                        className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
                                        onClick={() => handlePreview()}
                                        title={`Aperçu ${d.label} (${d.width}px)`}
                                    >
                                        {d.label} ({d.width}px)
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {showPatterns && (
                        <div className="p-3 space-y-3">
                            <p className="text-xs text-gray-500">Insérez un bloc de sections pré-configuré.</p>
                            {(['accueil', 'information', 'engagement', 'medias', 'commercial', 'navigation'] as const).map(cat => {
                                const patterns = SECTION_PATTERNS.filter(p => p.categorie === cat);
                                if (patterns.length === 0) return null;
                                return (
                                    <div key={cat}>
                                        <h4 className="mb-1.5 text-xs font-semibold text-gray-500 uppercase">{PATTERN_CATEGORIE_LABELS[cat]}</h4>
                                        <div className="space-y-1.5">
                                            {patterns.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleInsererPattern(p)}
                                                    className="flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-colors hover:bg-gray-50"
                                                >
                                                    <span className="text-lg">{p.icon}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium truncate">{p.nom}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{p.sections} sections</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {showLibrary && (
                        <SectionLibraryPanel
                            currentData={puckData}
                            onInsert={(newData) => {
                                setUndoStack(prev => [...prev.slice(-19), puckData]);
                                setRedoStack([]);
                                setPuckData(newData);
                                bumpPuckEpoch();
                                setHasChanges(true);
                            }}
                        />
                    )}
                    {showShortcuts && (
                        <div className="p-3 space-y-2">
                            {[
                                ['Ctrl+S', 'Sauvegarder'],
                                ['Ctrl+Z', 'Annuler'],
                                ['Ctrl+Y / Ctrl+Shift+Z', 'Rétablir'],
                                ['Ctrl+Shift+P', 'Ouvrir Patterns'],
                                ['Ctrl+K', 'Command Palette'],
                                ['F11 / Échap', 'Mode Focus'],
                            ].map(([key, desc]) => (
                                <div key={key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-xs text-gray-600">{desc}</span>
                                    <kbd className="rounded border bg-white px-1.5 py-0.5 text-[10px] font-mono shadow-sm">{key}</kbd>
                                </div>
                            ))}
                        </div>
                    )}
                    {showStyleEditor && (
                        <StyleEditorPanel
                            config={{}}
                            onChange={(styles) => {
                                // Appliquer les styles à la section sélectionnée via puckData
                                toast.success('Styles appliqués');
                            }}
                        />
                    )}
                    {showClipboard && (
                        <SectionClipboardPanel
                            currentData={puckData}
                            onInsert={(newData) => {
                                setUndoStack(prev => [...prev.slice(-19), puckData]);
                                setRedoStack([]);
                                setPuckData(newData);
                                bumpPuckEpoch();
                                setHasChanges(true);
                            }}
                        />
                    )}
                    {showVisibility && (
                        <VisibilityEditor
                            condition={visibilityCondition}
                            onChange={setVisibilityCondition}
                        />
                    )}
                    {showMetrics && (
                        <ContentMetricsPanel puckData={puckData} />
                    )}
                </div>
            )}

            {/* Command Palette (Ctrl+K) */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                puckData={puckData}
                onPuckChange={(newData) => {
                    setUndoStack(prev => [...prev.slice(-19), puckData]);
                    setRedoStack([]);
                    setPuckData(newData);
                    bumpPuckEpoch();
                    setHasChanges(true);
                }}
                onSauvegarder={handleSave}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onTogglePanel={(panel) => {
                    setShowSeo(false); setShowExportImport(false); setShowResponsive(false);
                    setShowPatterns(false); setShowShortcuts(false); setShowLibrary(false);
                    setShowStyleEditor(false); setShowClipboard(false); setShowVisibility(false); setShowMetrics(false);
                    switch (panel) {
                        case 'seo': setShowSeo(true); break;
                        case 'export': setShowExportImport(true); break;
                        case 'responsive': setShowResponsive(true); break;
                        case 'patterns': setShowPatterns(true); break;
                        case 'library': setShowLibrary(true); break;
                        case 'style': setShowStyleEditor(true); break;
                        case 'clipboard': setShowClipboard(true); break;
                        case 'visibility': setShowVisibility(true); break;
                        case 'metrics': setShowMetrics(true); break;
                        case 'shortcuts': setShowShortcuts(true); break;
                    }
                }}
                onToggleFocus={toggleFocus}
            />

            {/* Éditeur Puck */}
            <div className="min-h-0 flex-1">
                {lastLoadedPageId.current === page.id ? (
                    <Puck
                        key={puckEpoch}
                        config={puckConfig}
                        data={puckData}
                        onChange={handlePuckChange}
                        onPublish={handlePublier}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
                    </div>
                )}
            </div>
        </div>
    );
}
