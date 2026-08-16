/**
 * ==================================
 * eLISAschool - Éditeur de page CMS (Puck Editor)
 * ==================================
 * Route: /_auth/cms/pages/$id
 * Éditeur visuel Puck avec drag & drop.
 * Remplace l'ancien éditeur 3 colonnes.
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { ArrowLeft, Eye, EyeOff, Save, Download, Search, LayoutGrid, Layout, Layers, Undo2, Redo2, Keyboard, Bookmark, BarChart3, Palette, Copy, ZoomIn, ZoomOut, Check, AlertCircle, Grid3X3, Maximize2, Smartphone, Tablet, MonitorIcon, List, GripVertical, Pencil, Plus, Sparkles, X, Filter, MoreHorizontal, RotateCcw, Moon, Sun, Ruler, Map, Crosshair, Move, ChevronRight, ChevronLeft, Info, Hash, Columns3, Timer, Trash2, ChevronUp, ChevronDown, CopyPlus, Lock, Unlock, ArrowUp, ArrowDown, ArrowUpFromLine, ArrowDownToLine, Paintbrush, Type, Image, MousePointer, ClipboardCopy, ClipboardPaste } from 'lucide-react';
import { toast } from 'sonner';
import { ExportImportPanel } from '@/features/cms/components/ExportImportPanel';
import { SeoPanel } from '@/features/cms/components/SeoPanel';
import { SECTION_PATTERNS, PATTERN_CATEGORIE_LABELS, insererPatternDansPuck, type SectionPattern } from '@/features/cms/lib/section-patterns';
import { SectionLibraryPanel } from '@/features/cms/components/SectionLibrary';
import { StyleEditorPanel } from '@/features/cms/components/StyleEditorPanel';
import { SectionClipboardPanel } from '@/features/cms/components/SectionClipboard';
import { VisibilityEditor, type VisibilityCondition } from '@/features/cms/components/VisibilityEditor';
import { ContentMetricsPanel } from '@/features/cms/components/ContentMetrics';
import { CommandPalette, CommandPaletteButton } from '@/features/cms/components/CommandPalette';
import { FocusModeButton, useFocusMode } from '@/features/cms/components/FocusMode';
import { SectionInlineEditor } from '@/features/cms/components/SectionInlineEditor';
import { CanvasHoverToolbar, useCanvasHoverTracker } from '@/features/cms/components/CanvasHoverToolbar';
import { InlineContentEditor } from '@/features/cms/components/InlineContentEditor';
import { LinkEditorModal } from '@/features/cms/components/LinkEditorModal';
import { GridOverlay } from '@/features/cms/components/SnapGuides';
import { ZoomControls, ZoomIndicator } from '@/features/cms/components/ZoomControls';
import { EnhancedStatusBar } from '@/features/cms/components/StatusBar';
import { CanvasMinimap } from '@/features/cms/components/CanvasMinimap';
import { QuickActionsBar } from '@/features/cms/components/QuickActionsBar';
import { SectionPreviewThumbnail } from '@/features/cms/components/SectionPreviewThumbnail';
import { ScrollbarNavigator } from '@/features/cms/components/ScrollbarNavigator';
import { ContextualToolbar } from '@/features/cms/components/ContextualToolbar';
import { PerformanceOverlay } from '@/features/cms/components/PerformanceOverlay';
import { PUCK_THEME_CSS, createPuckOverrides, CANVAS_BG_STYLE, useSelectedPuckItem, COMPONENT_LABELS } from '@/features/cms/puck/puck-theme';
import { useGlobalShortcuts, createDefaultShortcuts } from '@/features/cms/hooks/useGlobalShortcuts';
import { useAutoSave, SaveStatusIndicator } from '@/features/cms/hooks/useAutoSave';
import '@/features/cms/styles/cms-editor.css';

// ==================================
// Canvas Styles (CSS-in-JS)
// ==================================

const CANVAS_SCROLL_STYLE: React.CSSProperties = {
    overflowX: 'auto',
    overflowY: 'auto',
    isolation: 'isolate',
    scrollbarGutter: 'stable both-edges',
};

const CANVAS_PAGE_STYLE: React.CSSProperties = {
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03), 0 16px 48px rgba(0,0,0,0.05), 0 32px 80px rgba(0,0,0,0.03)',
    borderRadius: '6px',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: '1px solid rgba(0,0,0,0.015)',
    imageRendering: 'auto',
};

const CANVAS_DEVICE_FRAME_STYLE: React.CSSProperties = {
    transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease, border-radius 0.4s ease',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.02), 0 8px 24px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.03)',
    borderRadius: '28px',
    backgroundColor: '#ffffff',
    outline: '1px solid rgba(0,0,0,0.02)',
};

// Styles pour le mode sombre preview
const CANVAS_DARK_PAGE_STYLE: React.CSSProperties = {
    backgroundColor: '#0f172a',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.2), 0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
    borderRadius: '2px',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
};

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
// Composants Toolbar helpers
// ==================================

const COLOR_MAP: Record<string, { active: string; inactive: string }> = {
    emerald: { active: 'bg-emerald-50 text-emerald-700 border-emerald-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    amber: { active: 'bg-amber-50 text-amber-700 border-amber-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    green: { active: 'bg-green-50 text-green-700 border-green-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    orange: { active: 'bg-orange-50 text-orange-700 border-orange-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    blue: { active: 'bg-blue-50 text-blue-700 border-blue-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    pink: { active: 'bg-pink-50 text-pink-700 border-pink-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    cyan: { active: 'bg-cyan-50 text-cyan-700 border-cyan-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    teal: { active: 'bg-teal-50 text-teal-700 border-teal-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    purple: { active: 'bg-purple-50 text-purple-700 border-purple-200', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
    gray: { active: 'bg-gray-100 text-gray-700 border-gray-300', inactive: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' },
};

function ToolbarToggle({ active, onClick, icon, label, color, shortcut }: {
    active: boolean; onClick: () => void; icon: React.ReactNode; label: string; color: string; shortcut?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`cms-toolbar-toggle ${active ? `cms-toolbar-toggle--active cms-toolbar-toggle--${color}` : ''}`}
            title={shortcut ? `${label} (${shortcut})` : label}
        >
            <span className="cms-toolbar-toggle__icon">{icon}</span>
            <span className="cms-toolbar-toggle__label">{label}</span>
        </button>
    );
}

function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="cms-toolbar-header-group" title={label}>
            {children}
        </div>
    );
}

function ToolbarSeparator({ className }: { className?: string }) {
    return <div className={`mx-1 h-4 w-px shrink-0 bg-gray-200/60 ${className || ''}`} />;
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
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Panneau latéral actif (tabs — un seul panneau ouvert à la fois)
    type PanelId = 'library' | 'patterns' | 'seo' | 'metrics' | 'responsive' | 'style' | 'clipboard' | 'visibility' | 'export' | 'shortcuts' | 'sections' | 'history' | null;
    const [activePanel, setActivePanel] = useState<PanelId>(null);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    // Inline editor flottant dans le canvas
    const [showInlineEditor, setShowInlineEditor] = useState(false);
    // Inline content editor (édition contenu direct)
    const [showContentEditor, setShowContentEditor] = useState(false);
    const [contentEditorPosition, setContentEditorPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    // Sidebar collapsible (mode compact)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    // Panneau gauche (Puck drawer) rétractable
    const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
    // Panneau redimensionnable (drag handle)
    const [panelWidth, setPanelWidth] = useState(280);
    const [isResizingPanel, setIsResizingPanel] = useState(false);
    const panelResizeStartX = useRef(0);
    const panelResizeStartWidth = useRef(0);

    // Handlers pour le resize du panneau
    const handlePanelResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizingPanel(true);
        panelResizeStartX.current = e.clientX;
        panelResizeStartWidth.current = panelWidth;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, [panelWidth]);

    useEffect(() => {
        if (!isResizingPanel) return;
        const handleMouseMove = (e: MouseEvent) => {
            const delta = panelResizeStartX.current - e.clientX;
            const newWidth = Math.min(560, Math.max(240, panelResizeStartWidth.current + delta));
            setPanelWidth(newWidth);
        };
        const handleMouseUp = () => {
            setIsResizingPanel(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingPanel]);

    // Toggle panneau latéral (exclusif — un seul panneau ouvert à la fois)
    const togglePanel = useCallback((panel: string) => {
        setActivePanel(prev => prev === panel ? null : panel as PanelId);
    }, []);

    // Sélection Puck (via bridge externe)
    const { item: selectedPuckItem, itemId: selectedItemId } = useSelectedPuckItem();

    // Puck overrides (mémorisé — drawer rétractable)
    const puckOverrides = useMemo(() => createPuckOverrides(leftPanelCollapsed), [leftPanelCollapsed]);

    // Zoom canvas
    const [canvasZoom, setCanvasZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(true);
    const [canvasGridPattern, setCanvasGridPattern] = useState<'dots' | 'lines' | 'cross' | 'none'>('dots');
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
    const [darkModePreview, setDarkModePreview] = useState(false);
    const [showRulers, setShowRulers] = useState(false);
    const [showMinimap, setShowMinimap] = useState(true);
    const [showPerfOverlay, setShowPerfOverlay] = useState(false);
    const [canvasScrollPos, setCanvasScrollPos] = useState({ x: 0, y: 0 });
    // Link editor modal
    const [linkEditorOpen, setLinkEditorOpen] = useState(false);
    const [linkEditorValue, setLinkEditorValue] = useState('');
    const [linkEditorTarget, setLinkEditorTarget] = useState('_self');
    const [linkEditorItemId, setLinkEditorItemId] = useState<string | null>(null);
    const [canvasContentSize, setCanvasContentSize] = useState({ width: 0, height: 0 });
    const [gridSize, setGridSize] = useState(24); // Taille de la grille en px
    const [showZoomIndicator, setShowZoomIndicator] = useState(false);
    const zoomIndicatorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    
    // §764 — Canvas advanced features
    const [showScrollProgress, setShowScrollProgress] = useState(true);
    const [canvasBgPattern, setCanvasBgPattern] = useState<'dots' | 'lines' | 'cross' | 'grid' | 'none'>('dots');
    const [showMiniMap, setShowMiniMap] = useState(true);
    const [smartGuidesEnabled, setSmartGuidesEnabled] = useState(true);

    // Device preview
    type DeviceType = 'desktop' | 'tablet' | 'mobile';
    const [devicePreview, setDevicePreview] = useState<DeviceType>('desktop');
    const DEVICE_WIDTHS: Record<DeviceType, number | null> = { desktop: null, tablet: 768, mobile: 375 };

    const ZOOM_PRESETS = [25, 50, 75, 100, 125, 150, 200];

    // Focus mode
    const { isFocus, toggleFocus } = useFocusMode();

    // ==================================
    // Raccourcis clavier globaux
    // ==================================

    const defaultShortcuts = useMemo(() => createDefaultShortcuts({
        onSave: () => {
            if (puckData && page) {
                // Trigger save via existing mutation
                const sections = puckData.content.map((item, idx) => ({
                    type: (PUCK_TO_SECTION_TYPE[item.type] || item.type) as SectionType,
                    contenu: item.props,
                    ordre: idx,
                }));
                modifierPage.mutate({ id, titre: page.titre, statut: page.statut, sections });
            }
        },
        onUndo: () => { /* Puck handles undo internally */ },
        onRedo: () => { /* Puck handles redo internally */ },
        onToggleDarkMode: () => setDarkModePreview(v => !v),
        onToggleGrid: () => setShowGrid(v => !v),
        onToggleRulers: () => setShowRulers(v => !v),
        onToggleMinimap: () => setShowMinimap(v => !v),
        onZoomIn: () => setCanvasZoom(z => Math.min(200, z + 25)),
        onZoomOut: () => setCanvasZoom(z => Math.max(25, z - 25)),
        onZoomReset: () => setCanvasZoom(100),
        onToggleFocusMode: () => toggleFocus(),
        onOpenCommandPalette: () => { /* Command palette is always available */ },
        onEscape: () => {
            setContextMenu(null);
        },
    }), [puckData, page, id, modifierPage, toggleFocus]);

    useGlobalShortcuts(defaultShortcuts);

    // ==================================
    // Auto-save intelligent
    // ==================================

    const autoSaveState = useAutoSave(
        puckData,
        async (data) => {
            if (!page) return;
            const sections = data.content.map((item, idx) => ({
                type: (PUCK_TO_SECTION_TYPE[item.type] || item.type) as SectionType,
                contenu: item.props,
                ordre: idx,
            }));
            return modifierPage.mutateAsync({ id, titre: page.titre, statut: page.statut, sections });
        },
        {
            enabled: !!page,
            debounceMs: 3000,
            showToasts: true,
            maxRetries: 3,
            retryDelayMs: 1000,
        }
    );

    // Références canvas (déclarées AVANT leur usage dans les hooks ci-dessous)
    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasScrollRef = useRef<HTMLDivElement>(null);

    // Canvas hover tracking (toolbar flottante au survol)
    const hoveredComponent = useCanvasHoverTracker(canvasScrollRef);
    const [hoverToolbarEnabled, setHoverToolbarEnabled] = useState(true);

    // Toolbar responsive : groupes visibles/masqués
    const [toolbarExpanded, setToolbarExpanded] = useState(true);

    // Context menu canvas (clic-droit sur section)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string; itemType: string } | null>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Fermer le context menu au clic extérieur
    useEffect(() => {
        if (!contextMenu) return;
        const handleClick = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setContextMenu(null); };
        document.addEventListener('mousedown', handleClick);
        window.addEventListener('keydown', handleEsc);
        return () => { document.removeEventListener('mousedown', handleClick); window.removeEventListener('keydown', handleEsc); };
    }, [contextMenu]);

    // Fit to screen
    const fitToScreen = useCallback(() => {
        setCanvasZoom(100);
        setDevicePreview('desktop');
    }, []);

    // §764 — Zoom to fit (ajuste le zoom pour voir toute la page)
    const zoomToFit = useCallback(() => {
        const el = canvasScrollRef.current;
        if (!el) return;
        
        const containerWidth = el.clientWidth;
        const containerHeight = el.clientHeight;
        const pageWidth = 1200; // Largeur standard de page
        const pageHeight = Math.max(el.scrollHeight, 2000); // Hauteur estimée
        
        const scaleX = (containerWidth - 80) / pageWidth; // 80px de marge
        const scaleY = (containerHeight - 80) / pageHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Max 100%
        
        const newZoom = Math.round(scale * 100);
        setCanvasZoom(Math.max(25, Math.min(200, newZoom)));
        setDevicePreview('desktop');
        
        // Scroll to top
        el.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        toast.success(`Zoom ajusté à ${Math.max(25, Math.min(200, newZoom))}%`);
    }, []);

    // Ctrl+Wheel zoom dans le canvas

    // Track scroll position du canvas + mouse coordinates
    useEffect(() => {
        const el = canvasScrollRef.current;
        if (!el) return;
        const handleScroll = () => {
            setCanvasScrollPos({ x: el.scrollLeft, y: el.scrollTop });
            // Protection NaN : s'assurer que scrollWidth/scrollHeight sont des nombres valides
            const w = el.scrollWidth;
            const h = el.scrollHeight;
            setCanvasContentSize({
                width: Number.isFinite(w) ? w : 0,
                height: Number.isFinite(h) ? h : 0,
            });
        };
        el.addEventListener('scroll', handleScroll, { passive: true });
        return () => el.removeEventListener('scroll', handleScroll);
    }, []);

    // Mouse coordinate tracker (relative to canvas content)
    useEffect(() => {
        const el = canvasScrollRef.current;
        if (!el || !showCoordinates) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = el.getBoundingClientRect();
            setMouseCoords({
                x: Math.round((e.clientX - rect.left + el.scrollLeft) / (canvasZoom / 100)),
                y: Math.round((e.clientY - rect.top + el.scrollTop) / (canvasZoom / 100)),
            });
        };
        el.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => el.removeEventListener('mousemove', handleMouseMove);
    }, [showCoordinates, canvasZoom]);

    // Ctrl+Wheel zoom centré sur le curseur + Shift+Wheel scroll horizontal
    useEffect(() => {
        const el = canvasScrollRef.current;
        if (!el) return;
        const handleWheel = (e: WheelEvent) => {
            // Ctrl/Cmd + Wheel = zoom
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -10 : 10;
                setCanvasZoom(z => {
                    const newZoom = Math.min(200, Math.max(25, z + delta));
                    const rect = el.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const scaleChange = newZoom / z;
                    el.scrollLeft = mouseX * scaleChange - (mouseX - el.scrollLeft);
                    el.scrollTop = mouseY * scaleChange - (mouseY - el.scrollTop);
                    return newZoom;
                });
                return;
            }
            // Shift + Wheel = scroll horizontal fluide
            if (e.shiftKey) {
                e.preventDefault();
                el.scrollLeft += e.deltaY * 1.5;
            }
        };
        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, []);

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
        setActivePanel(null);
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
            setLastSavedAt(new Date());
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



    // Cleanup timeout
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current);
        };
    }, []);

    // Zoom indicator — affiche brièvement le niveau de zoom lors du changement
    useEffect(() => {
        setShowZoomIndicator(true);
        if (zoomIndicatorTimer.current) clearTimeout(zoomIndicatorTimer.current);
        zoomIndicatorTimer.current = setTimeout(() => setShowZoomIndicator(false), 1200);
    }, [canvasZoom]);

    // Écouter l'événement custom puck:edit-style (bouton éditer dans l'overlay)
    useEffect(() => {
        const styleHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.componentId) {
                // Ouvrir l'inline editor en priorité (plus rapide)
                setShowInlineEditor(true);
                setActivePanel(null);
            }
        };
        const contentHandler = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail?.componentId) {
                // Scroll vers le composant et ouvrir l'éditeur de contenu
                const el = document.querySelector(`[data-puck-component-id="${detail.componentId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const rect = el.getBoundingClientRect();
                    const scrollEl = canvasScrollRef.current;
                    const scrollRect = scrollEl?.getBoundingClientRect();
                    if (scrollRect) {
                        setContentEditorPosition({
                            top: rect.top - scrollRect.top + (scrollEl?.scrollTop || 0),
                            left: rect.left - scrollRect.left + (scrollEl?.scrollLeft || 0),
                            width: rect.width,
                        });
                    }
                    // Sélectionner puis ouvrir l'éditeur de contenu
                    (el as HTMLElement).click();
                    setTimeout(() => setShowContentEditor(true), 200);
                }
            }
        };
        window.addEventListener('puck:edit-style', styleHandler);
        window.addEventListener('puck:edit-content', contentHandler);
        return () => {
            window.removeEventListener('puck:edit-style', styleHandler);
            window.removeEventListener('puck:edit-content', contentHandler);
        };
    }, []);

    // ═══ Context menu : capture right-click sur les composants Puck ═══
    useEffect(() => {
        const canvasEl = canvasScrollRef.current;
        if (!canvasEl) return;
        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const puckComponent = target.closest('[data-puck-component-id]') as HTMLElement | null;
            if (!puckComponent) return;
            e.preventDefault();
            const itemId = puckComponent.getAttribute('data-puck-component-id') || '';
            const item = puckData.content.find(i => (i.props as any)?.id === itemId);
            const itemType = item?.type || '';
            setContextMenu({ x: e.clientX, y: e.clientY, itemId, itemType });
        };
        canvasEl.addEventListener('contextmenu', handleContextMenu);
        return () => canvasEl.removeEventListener('contextmenu', handleContextMenu);
    }, [puckData.content]);

    // ═══ Actions sur les sections (context menu + floating bar) ═══
    const duplicateSection = useCallback((itemId: string) => {
        const idx = puckData.content.findIndex(i => (i.props as any)?.id === itemId);
        if (idx === -1) return;
        const original = puckData.content[idx];
        const duplicated = {
            ...original,
            props: { ...original.props, id: undefined }, // Puck créera un nouvel ID
        };
        const newContent = [...puckData.content];
        newContent.splice(idx + 1, 0, duplicated);
        const newData = { ...puckData, content: newContent };
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData(newData);
        bumpPuckEpoch();
        setHasChanges(true);
        toast.success('Section dupliquée', { icon: '📋', duration: 2000 });
        // Animation feedback
        setTimeout(() => {
            const el = document.querySelector(`[data-puck-component-id]`);
            if (el) {
                el.classList.add('cms-action-flash');
                setTimeout(() => el.classList.remove('cms-action-flash'), 600);
            }
        }, 100);
    }, [puckData, bumpPuckEpoch]);

    const moveSectionUp = useCallback((itemId: string) => {
        const idx = puckData.content.findIndex(i => (i.props as any)?.id === itemId);
        if (idx <= 0) return;
        const newContent = [...puckData.content];
        [newContent[idx - 1], newContent[idx]] = [newContent[idx], newContent[idx - 1]];
        const newData = { ...puckData, content: newContent };
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData(newData);
        setHasChanges(true);
        // Animation feedback
        const el = document.querySelector(`[data-puck-component-id="${itemId}"]`);
        if (el) {
            el.classList.add('cms-action-slide-up');
            setTimeout(() => el.classList.remove('cms-action-slide-up'), 400);
        }
    }, [puckData]);

    const moveSectionDown = useCallback((itemId: string) => {
        const idx = puckData.content.findIndex(i => (i.props as any)?.id === itemId);
        if (idx === -1 || idx >= puckData.content.length - 1) return;
        const newContent = [...puckData.content];
        [newContent[idx], newContent[idx + 1]] = [newContent[idx + 1], newContent[idx]];
        const newData = { ...puckData, content: newContent };
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData(newData);
        setHasChanges(true);
        // Animation feedback
        const el = document.querySelector(`[data-puck-component-id="${itemId}"]`);
        if (el) {
            el.classList.add('cms-action-slide-down');
            setTimeout(() => el.classList.remove('cms-action-slide-down'), 400);
        }
    }, [puckData]);

    const deleteSection = useCallback((itemId: string) => {
        // Animation feedback avant suppression
        const el = document.querySelector(`[data-puck-component-id="${itemId}"]`);
        if (el) {
            el.classList.add('cms-action-fade-out');
            setTimeout(() => {
                const newData = { ...puckData, content: puckData.content.filter(i => (i.props as any)?.id !== itemId) };
                setUndoStack(prev => [...prev.slice(-19), puckData]);
                setRedoStack([]);
                setPuckData(newData);
                bumpPuckEpoch();
                setHasChanges(true);
                toast.success('Section supprimée', { icon: '🗑️', duration: 2000 });
            }, 300);
        } else {
            const newData = { ...puckData, content: puckData.content.filter(i => (i.props as any)?.id !== itemId) };
            setUndoStack(prev => [...prev.slice(-19), puckData]);
            setRedoStack([]);
            setPuckData(newData);
            bumpPuckEpoch();
            setHasChanges(true);
            toast.success('Section supprimée', { icon: '🗑️', duration: 2000 });
        }
    }, [puckData, bumpPuckEpoch]);

    // Keyboard shortcut Ctrl+S / Ctrl+Z / Ctrl+Y / Ctrl+Shift+P / Ctrl+K / Ctrl+G / Ctrl+M
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
                setActivePanel(p => p === 'patterns' ? null : 'patterns');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(p => !p);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
                e.preventDefault();
                setShowGrid(g => !g);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                // Cycle device preview : desktop → tablet → mobile → desktop
                setDevicePreview(d => d === 'desktop' ? 'tablet' : d === 'tablet' ? 'mobile' : 'desktop');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                setDarkModePreview(d => !d);
            } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                setCanvasZoom(100);
                setDevicePreview('desktop');
            } else if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
                // Ctrl+= / Ctrl++ : Zoom in
                e.preventDefault();
                setCanvasZoom(z => Math.min(200, z + 10));
            } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                // Ctrl+- : Zoom out
                e.preventDefault();
                setCanvasZoom(z => Math.max(25, z - 10));
            } else if (e.key === 'Escape') {
                setZoomDropdownOpen(false);
                setShowContentEditor(false);
                setShowInlineEditor(false);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                // Ctrl+B : Toggle panneau gauche (bibliothèque)
                e.preventDefault();
                setLeftPanelCollapsed(c => !c);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                // Ctrl+P : Toggle panneau droit (propriétés)
                e.preventDefault();
                setActivePanel(p => p ? null : 'style');
            } else if (e.key === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey && selectedPuckItem && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                // Touche C pour ouvrir l'éditeur de contenu (quand une section est sélectionnée)
                const el = document.querySelector(`[data-puck-component-id="${selectedItemId}"]`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    const scrollEl = canvasScrollRef.current;
                    const scrollRect = scrollEl?.getBoundingClientRect();
                    if (scrollRect) {
                        setContentEditorPosition({
                            top: rect.top - scrollRect.top + (scrollEl?.scrollTop || 0),
                            left: rect.left - scrollRect.left + (scrollEl?.scrollLeft || 0),
                            width: rect.width,
                        });
                    }
                }
                setShowContentEditor(prev => !prev);
            } else if (e.key === 's' && !e.ctrlKey && !e.metaKey && selectedPuckItem && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                // Touche S pour ouvrir l'éditeur de style inline
                setShowInlineEditor(prev => !prev);
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                // Ctrl+E : Export rapide (ouvre le panneau export/import)
                e.preventDefault();
                setActivePanel(p => p === 'export' ? null : 'export');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
                // Ctrl+H : Toggle historique des versions
                e.preventDefault();
                setActivePanel(p => p === 'history' ? null : 'history');
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'j') {
                // Ctrl+J : Toggle mode focus (masque tous les panneaux sauf canvas)
                e.preventDefault();
                setLeftPanelCollapsed(true);
                setActivePanel(null);
                setShowInlineEditor(false);
                setShowContentEditor(false);
                toast.success('Mode focus activé');
            } else if (e.key === 'Delete' && selectedPuckItem && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
                // Touche Delete : Supprimer la section sélectionnée
                e.preventDefault();
                if (selectedItemId) {
                    deleteSection(selectedItemId);
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp' && selectedPuckItem) {
                // Ctrl+↑ : Déplacer la section vers le haut
                e.preventDefault();
                if (selectedItemId) {
                    moveSectionUp(selectedItemId);
                    toast.success('Section déplacée vers le haut');
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown' && selectedPuckItem) {
                // Ctrl+↓ : Déplacer la section vers le bas
                e.preventDefault();
                if (selectedItemId) {
                    moveSectionDown(selectedItemId);
                    toast.success('Section déplacée vers le bas');
                }
            } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                // Ctrl+Shift+D : Dupliquer la section sélectionnée
                e.preventDefault();
                if (selectedItemId) {
                    duplicateSection(selectedItemId);
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSave, handleUndo, handleRedo, selectedPuckItem, selectedItemId, deleteSection, moveSectionUp, moveSectionDown, duplicateSection]);

    const moveToTop = useCallback((itemId: string) => {
        const idx = puckData.content.findIndex(i => (i.props as any)?.id === itemId);
        if (idx <= 0) return;
        const newContent = [...puckData.content];
        const [item] = newContent.splice(idx, 1);
        newContent.unshift(item);
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData({ ...puckData, content: newContent });
        setHasChanges(true);
    }, [puckData]);

    const moveToBottom = useCallback((itemId: string) => {
        const idx = puckData.content.findIndex(i => (i.props as any)?.id === itemId);
        if (idx === -1 || idx >= puckData.content.length - 1) return;
        const newContent = [...puckData.content];
        const [item] = newContent.splice(idx, 1);
        newContent.push(item);
        setUndoStack(prev => [...prev.slice(-19), puckData]);
        setRedoStack([]);
        setPuckData({ ...puckData, content: newContent });
        setHasChanges(true);
    }, [puckData]);

    // Loading
    if (isLoading) {
        return (
            <div className="cms-editor-loading">
                <div className="cms-editor-loading__spinner" />
            </div>
        );
    }

    // Page introuvable
    if (!page) {
        return (
            <div className="cms-editor-not-found">
                <div className="cms-editor-not-found__content">
                    <p className="cms-editor-not-found__text">Page introuvable</p>
                    <button onClick={() => navigate({ to: '/cms/pages' })} className="cms-editor-not-found__link">
                        Retour aux pages
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="cms-editor-container">
            {/* Styles dynamiques (dépendent de l'état — dark mode, grid size) */}
            <style>{`
                .cms-canvas-vignette {
                    box-shadow: inset 0 0 100px 30px ${darkModePreview ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.02)'};
                    pointer-events: none;
                    transition: box-shadow 0.4s ease;
                }
                .cms-grid-overlay {
                    background-size: var(--grid-size, ${gridSize}px) var(--grid-size, ${gridSize}px);
                }
            `}</style>
            {/* ═══ Toolbar primaire : Navigation + Actions ═══ */}
            <div className="cms-toolbar-primary">
                {/* Gauche : Navigation + info page */}
                <div className="cms-toolbar-primary__left">
                    <button onClick={() => navigate({ to: '/cms/pages' })} className="cms-toolbar-back-btn" title="Retour aux pages">
                        <ArrowLeft className="cms-icon--lg" />
                    </button>
                    <div className="cms-toolbar-divider" />
                    <div className="cms-toolbar-page-info">
                        <div className="cms-toolbar-page-title">
                            <h1>{page.titre}</h1>
                            <span className={`cms-page-status ${
                                page.statut === StatutPage.PUBLIE
                                    ? 'cms-page-status--published'
                                    : 'cms-page-status--draft'
                            }`}>
                                {page.statut === StatutPage.PUBLIE ? 'Publié' : 'Brouillon'}
                            </span>
                        </div>
                        <p className="cms-toolbar-page-slug">/{page.slug}</p>
                    </div>
                </div>

                {/* Centre : Undo/Redo + Sauvegarde */}
                <div className="cms-toolbar-primary__center">
                    <div className="cms-toolbar-undo-group">
                        <button onClick={handleUndo} disabled={undoStack.length === 0} className="cms-toolbar-undo-btn" title="Annuler (Ctrl+Z)">
                            <Undo2 className="cms-icon--md" />
                        </button>
                        <div className="cms-toolbar-divider" style={{ height: 16 }} />
                        <button onClick={handleRedo} disabled={redoStack.length === 0} className="cms-toolbar-undo-btn" title="Rétablir (Ctrl+Y)">
                            <Redo2 className="cms-icon--md" />
                        </button>
                    </div>

                    <button onClick={handleSave} disabled={!hasChanges || isSaving} className="cms-toolbar-action" title="Sauvegarder (Ctrl+S)">
                        {isSaving ? <div className="cms-toolbar-spinner" /> : <Save className="cms-icon--md" />}
                        <span className="hidden md:inline">{isSaving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                    </button>
                    {hasChanges && !isSaving && (
                        <span className="cms-toolbar-status cms-toolbar-status--warning">
                            <span className="cms-status-dot" />
                            Non sauvegardé
                        </span>
                    )}
                </div>

                {/* Droite : Auto-save + Preview + Publier */}
                <div className="cms-toolbar-primary__right">
                    <SaveStatusIndicator
                        status={autoSaveState.status}
                        lastSavedAt={autoSaveState.lastSavedAt}
                        timeSinceLastSave={autoSaveState.timeSinceLastSave}
                        compact={true}
                    />
                    <button onClick={handlePreview} className="cms-toolbar-action" title="Aperçu dans un nouvel onglet">
                        <Eye className="cms-icon--md" />
                        <span className="hidden md:inline">Aperçu</span>
                    </button>
                    <button onClick={handlePublier} className="cms-toolbar-publish-btn">
                        <Check className="cms-icon--md" />
                        Publier
                    </button>
                </div>
            </div>

            {/* ═══ Toolbar secondaire : Panneaux + Zoom ═══ */}
            <div className="cms-toolbar-pro cms-toolbar-secondary">
                {/* Groupe : Navigation */}
                <ToolbarGroup label="Navigation">
                    <ToolbarToggle active={activePanel === 'sections'} onClick={() => togglePanel('sections')} icon={<List className="cms-toolbar-toggle__icon" />} label="Sections" color="blue" />
                </ToolbarGroup>

                <ToolbarSeparator />

                {/* Groupe : Contenu */}
                <ToolbarGroup label="Contenu">
                    <ToolbarToggle active={activePanel === 'library'} onClick={() => togglePanel('library')} icon={<Bookmark className="cms-toolbar-toggle__icon" />} label="Bibliothèque" color="emerald" />
                    <ToolbarToggle active={activePanel === 'patterns'} onClick={() => togglePanel('patterns')} icon={<LayoutGrid className="cms-toolbar-toggle__icon" />} label="Patterns" color="amber" shortcut="Ctrl+Shift+P" />
                </ToolbarGroup>

                <ToolbarSeparator />

                {/* Groupe : Analyse — masqué sur petits écrans */}
                <div className="cms-toolbar-header-group hidden sm:flex" title="Analyse">
                    <ToolbarToggle active={activePanel === 'seo'} onClick={() => togglePanel('seo')} icon={<Search className="cms-toolbar-toggle__icon" />} label="SEO" color="green" />
                    <ToolbarToggle active={activePanel === 'metrics'} onClick={() => togglePanel('metrics')} icon={<BarChart3 className="cms-toolbar-toggle__icon" />} label="Qualité" color="orange" />
                </div>

                <ToolbarSeparator className="hidden sm:block" />

                {/* Groupe : Style */}
                <ToolbarGroup label="Style">
                    <ToolbarToggle active={activePanel === 'style'} onClick={() => togglePanel('style')} icon={<Palette className="cms-toolbar-toggle__icon" />} label="Style" color="pink" />
                    <div className="cms-toolbar-header-group hidden md:flex">
                        <ToolbarToggle active={activePanel === 'clipboard'} onClick={() => togglePanel('clipboard')} icon={<Copy className="cms-toolbar-toggle__icon" />} label="Clipboard" color="cyan" />
                        <ToolbarToggle active={activePanel === 'visibility'} onClick={() => togglePanel('visibility')} icon={<Eye className="cms-toolbar-toggle__icon" />} label="Visibilité" color="teal" />
                    </div>
                </ToolbarGroup>

                <ToolbarSeparator />

                {/* Groupe : Outils — masqué sur petits écrans */}
                <div className="cms-toolbar-header-group hidden lg:flex" title="Outils">
                    <ToolbarToggle active={activePanel === 'export'} onClick={() => togglePanel('export')} icon={<Download className="cms-toolbar-toggle__icon" />} label="JSON" color="purple" />
                    <ToolbarToggle active={activePanel === 'shortcuts'} onClick={() => togglePanel('shortcuts')} icon={<Keyboard className="cms-toolbar-toggle__icon" />} label="Raccourcis" color="gray" />
                </div>

                <ToolbarSeparator className="hidden lg:block" />

                {/* Groupe : Vue — dark mode + rulers */}
                <div className="cms-toolbar-header-group hidden md:flex" title="Vue">
                    <button
                        onClick={() => setDarkModePreview(d => !d)}
                        className={`cms-view-toggle ${darkModePreview ? 'cms-view-toggle--dark-active' : 'cms-view-toggle--dark-inactive'}`}
                        title="Aperçu mode sombre (Ctrl+M)"
                    >
                        {darkModePreview ? <Sun className="cms-view-toggle__icon" /> : <Moon className="cms-view-toggle__icon" />}
                    </button>
                    <button
                        onClick={() => setShowRulers(r => !r)}
                        className={`cms-view-toggle ${showRulers ? 'cms-view-toggle--active' : ''}`}
                        title="Afficher les règles"
                    >
                        <Ruler className="cms-view-toggle__icon" />
                    </button>
                    {/* Grid pattern selector — dots/lines/cross/none */}
                    <button
                        onClick={() => setCanvasGridPattern(p => {
                            const order: ('dots' | 'lines' | 'cross' | 'none')[] = ['dots', 'lines', 'cross', 'none'];
                            const idx = order.indexOf(p);
                            return order[(idx + 1) % order.length];
                        })}
                        className={`cms-view-toggle ${showGrid && canvasGridPattern !== 'none' ? 'cms-view-toggle--active' : ''}`}
                        title={`Motif grille : ${canvasGridPattern === 'dots' ? 'Points' : canvasGridPattern === 'lines' ? 'Lignes' : canvasGridPattern === 'cross' ? 'Croix' : 'Aucun'} (clic pour changer)`}
                    >
                        <Grid3X3 className="cms-view-toggle__icon" />
                        <span style={{ fontSize: '9px' }}>{canvasGridPattern === 'dots' ? '•' : canvasGridPattern === 'lines' ? '┃' : canvasGridPattern === 'cross' ? '╋' : '∅'}</span>
                    </button>
                    {/* Coordinate tracker toggle */}
                    <button
                        onClick={() => setShowCoordinates(c => !c)}
                        className={`cms-view-toggle hidden xl:flex ${showCoordinates ? 'cms-view-toggle--active' : ''}`}
                        style={showCoordinates ? { background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' } : undefined}
                        title="Afficher les coordonnées souris"
                    >
                        <Crosshair className="cms-view-toggle__icon" />
                    </button>
                </div>

                {/* Menu "Plus" pour les outils masqués sur mobile/tablette */}
                <div className="relative sm:hidden">
                    <button
                        onClick={() => setToolbarExpanded(!toolbarExpanded)}
                        className="cms-toolbar-grid-btn"
                    >
                        <MoreHorizontal className="cms-toolbar-grid-btn__icon" />
                    </button>
                    {toolbarExpanded && (
                        <div className="cms-dropdown-mobile">
                            <p className="cms-dropdown-mobile__section">Analyse</p>
                            <button onClick={() => { togglePanel('seo'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Search className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">SEO</span>
                            </button>
                            <button onClick={() => { togglePanel('metrics'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <BarChart3 className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">Qualité</span>
                            </button>
                            <div className="cms-dropdown-mobile__separator" />
                            <p className="cms-dropdown-mobile__section">Style & Outils</p>
                            <button onClick={() => { togglePanel('export'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Download className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">Export JSON</span>
                            </button>
                            <button onClick={() => { togglePanel('clipboard'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Copy className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">Clipboard</span>
                            </button>
                            <button onClick={() => { togglePanel('visibility'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Eye className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">Visibilité</span>
                            </button>
                            <button onClick={() => { togglePanel('shortcuts'); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Keyboard className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">Raccourcis</span>
                            </button>
                            <div className="cms-dropdown-mobile__separator" />
                            <p className="cms-dropdown-mobile__section">Vue</p>
                            <button onClick={() => { setDarkModePreview(d => !d); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                {darkModePreview ? <Sun className="cms-dropdown-mobile__item-icon" /> : <Moon className="cms-dropdown-mobile__item-icon" />}
                                <span className="cms-dropdown-mobile__item-label">{darkModePreview ? 'Mode clair' : 'Mode sombre'}</span>
                            </button>
                            <button onClick={() => { setShowRulers(r => !r); setToolbarExpanded(false); }} className="cms-dropdown-mobile__item">
                                <Ruler className="cms-dropdown-mobile__item-icon" />
                                <span className="cms-dropdown-mobile__item-label">{showRulers ? 'Masquer les règles' : 'Afficher les règles'}</span>
                            </button>
                            <div className="cms-dropdown-mobile__separator" />
                            <p className="cms-dropdown-mobile__section">Zoom</p>
                            <div className="cms-zoom-inline-controls">
                                <button onClick={() => setCanvasZoom(z => Math.max(25, z - 25))} className="cms-zoom-btn">
                                    <ZoomOut className="cms-icon--xs" />
                                </button>
                                <span className="cms-zoom-inline-value">{canvasZoom}%</span>
                                <button onClick={() => setCanvasZoom(z => Math.min(200, z + 25))} className="cms-zoom-btn">
                                    <ZoomIn className="cms-icon--xs" />
                                </button>
                                {canvasZoom !== 100 && (
                                    <button onClick={() => setCanvasZoom(100)} className="cms-zoom-btn">
                                        <RotateCcw className="cms-icon--xs" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="cms-editor-spacer" />

                {/* Zoom inline controls (visible sur md+) — compact, sans dropdown redondant */}
                <div className="cms-toolbar-group hidden md:flex">
                    <button
                        onClick={() => setCanvasZoom(z => Math.max(25, z - 25))}
                        className="cms-zoom-inline-btn"
                        title="Zoom arrière (−)"
                    >
                        <ZoomOut className="cms-zoom-inline-btn__icon" />
                    </button>
                    <button
                        onClick={() => setZoomDropdownOpen(o => !o)}
                        className="cms-toolbar-group__value"
                        title="Presets de zoom"
                    >
                        {canvasZoom}%
                    </button>
                    <button
                        onClick={() => setCanvasZoom(z => Math.min(200, z + 25))}
                        className="cms-zoom-inline-btn"
                        title="Zoom avant (+)"
                    >
                        <ZoomIn className="cms-zoom-inline-btn__icon" />
                    </button>
                    {canvasZoom !== 100 && (
                        <button
                            onClick={() => setCanvasZoom(100)}
                            className="cms-zoom-inline-btn cms-zoom-inline-btn--reset"
                            title="Réinitialiser (Ctrl+0)"
                        >
                            <RotateCcw className="cms-zoom-inline-btn__icon" />
                        </button>
                    )}
                </div>

                {/* Zoom dropdown presets */}
                {zoomDropdownOpen && (
                    <div className="relative">
                        <div className="cms-zoom-dropdown">
                            <div className="cms-zoom-dropdown__label">Presets</div>
                            {ZOOM_PRESETS.map(z => (
                                <button
                                    key={z}
                                    onClick={() => { setCanvasZoom(z); setZoomDropdownOpen(false); }}
                                    className={`cms-zoom-dropdown__preset ${canvasZoom === z ? 'cms-zoom-dropdown__preset--active' : ''}`}
                                >
                                    {z}%
                                    {z === 100 && <span style={{ fontSize: '8px', color: '#94a3b8', marginLeft: 'auto' }}>Normal</span>}
                                </button>
                            ))}
                            <div className="cms-dropdown__separator" />
                            <button
                                onClick={() => { setCanvasZoom(100); setDevicePreview('desktop'); setZoomDropdownOpen(false); }}
                                className="cms-zoom-dropdown__preset"
                            >
                                <Maximize2 style={{ width: 10, height: 10 }} /> Plein écran
                            </button>
                        </div>
                    </div>
                )}

                {/* Focus + Command Palette */}
                <FocusModeButton isFocus={isFocus} onToggle={toggleFocus} />
                <CommandPaletteButton onClick={() => setShowCommandPalette(true)} />
            </div>

            {/* ═══ Panneau latéral à onglets (redimensionnable + rétractable) ═══ */}
            {/* Toggle bouton panneau droit (visible quand fermé) */}
            {!activePanel && (
                <button
                    onClick={() => setActivePanel('style')}
                    className="cms-panel-toggle cms-panel-toggle--right"
                    title="Ouvrir le panneau (P)"
                >
                    <ChevronLeft className="cms-panel-toggle__icon" />
                </button>
            )}
            {activePanel && (
                <div
                    className={`cms-right-panel cms-panel-enter ${sidebarCollapsed ? 'cms-right-panel--collapsed' : ''}`}
                    style={{
                        width: sidebarCollapsed ? 0 : panelWidth,
                        transition: isResizingPanel ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {/* Resize handle (bord gauche du panneau) */}
                    {!sidebarCollapsed && (
                        <div
                            className={`cms-panel-resize-handle--visible absolute left-0 top-0 bottom-0 ${isResizingPanel ? 'cms-panel-resize-handle--active' : ''}`}
                            onMouseDown={handlePanelResizeStart}
                            title="Glisser pour redimensionner"
                        />
                    )}
                    {/* Header contextuel du panneau — compact */}
                    <div className="cms-right-panel__header">
                        {sidebarCollapsed ? (
                            <button onClick={() => setSidebarCollapsed(false)} className="cms-right-panel__action-btn" title="Étendre le panneau">
                                <ChevronRight className="cms-panel-collapse-icon cms-panel-collapse-icon--rotated" />
                            </button>
                        ) : (
                            <>
                                <div className="cms-panel-header-flex">
                                    {/* Icône contextuelle si composant sélectionné */}
                                    {selectedPuckItem && activePanel === 'style' ? (
                                        <>
                                            <span className={`cms-panel-header-icon ${
                                                SECTION_TYPE_COLORS[(selectedPuckItem as any).type] || 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {SECTION_TYPE_ICONS[(selectedPuckItem as any).type] || '📦'}
                                            </span>
                                            <div className="cms-panel-header-title-wrap">
                                                <h3 className="cms-right-panel__header-text truncate">
                                                    {(selectedPuckItem as any).type?.replace(/Section$/, '') || 'Section'}
                                                </h3>
                                            </div>
                                        </>
                                    ) : (
                                        <h3 className="cms-right-panel__header-text">
                                            {activePanel === 'seo' ? 'SEO' : activePanel === 'export' ? 'Export' : activePanel === 'responsive' ? 'Preview' : activePanel === 'patterns' ? 'Patterns' : activePanel === 'library' ? 'Biblio' : activePanel === 'style' ? 'Style' : activePanel === 'clipboard' ? 'Clipboard' : activePanel === 'visibility' ? 'Visibilité' : activePanel === 'metrics' ? 'Qualité' : activePanel === 'sections' ? 'Sections' : 'Raccourcis'}
                                        </h3>
                                    )}
                                </div>
                                <div className="cms-right-panel__actions">
                                    {/* Quick action : ouvrir style si composant sélectionné */}
                                    {selectedPuckItem && activePanel !== 'style' && (
                                        <button
                                            onClick={() => setActivePanel('style')}
                                            className="cms-right-panel__action-btn"
                                            title="Éditer le style"
                                        >
                                            <Palette className="cms-panel-action-icon" />
                                        </button>
                                    )}
                                    <button onClick={() => setSidebarCollapsed(true)} className="cms-right-panel__action-btn" title="Réduire le panneau">
                                        <ChevronRight className="cms-panel-action-icon" />
                                    </button>
                                    <button onClick={() => setActivePanel(null)} className="cms-right-panel__action-btn" title="Fermer (Échap)">
                                        <X className="cms-panel-action-icon" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Onglets de navigation rapide — compact */}
                    <div className="cms-right-panel__tabs">
                        {[
                            { id: 'sections', icon: <List className="cms-right-panel__tab-icon" />, label: 'Sections' },
                            { id: 'library', icon: <Bookmark className="cms-right-panel__tab-icon" />, label: 'Biblio' },
                            { id: 'patterns', icon: <LayoutGrid className="cms-right-panel__tab-icon" />, label: 'Patterns' },
                            { id: 'seo', icon: <Search className="cms-right-panel__tab-icon" />, label: 'SEO' },
                            { id: 'style', icon: <Palette className="cms-right-panel__tab-icon" />, label: 'Style' },
                            { id: 'metrics', icon: <BarChart3 className="cms-right-panel__tab-icon" />, label: 'Qualité' },
                            { id: 'export', icon: <Download className="cms-right-panel__tab-icon" />, label: 'JSON' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActivePanel(tab.id as PanelId)}
                                className={`cms-right-panel__tab ${activePanel === tab.id ? 'cms-right-panel__tab--active' : ''}`}
                                title={tab.label}
                            >
                                {tab.icon}
                                <span className="cms-right-panel__tab-label">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    {/* Contenu du panneau (scrollable) — compact */}
                    {!sidebarCollapsed && (
                    <div className="cms-right-panel__content">
                        {activePanel === 'seo' && (
                            <SeoPanel
                                data={seoData}
                                onChange={(updates) => setSeoData(prev => ({ ...prev, ...updates }))}
                                codeEtablissement={seoData.slug || page.slug}
                            />
                        )}
                        {activePanel === 'export' && (
                            <ExportImportPanel
                                pageId={id}
                                pageTitre={page.titre}
                                onImportComplete={() => {
                                    toast.info('Rechargez la page pour voir les changements');
                                }}
                            />
                        )}
                        {activePanel === 'responsive' && (
                            <div className="cms-panel-content--tight">
                                <p className="cms-panel-desc">Sélectionnez un appareil pour prévisualiser.</p>
                                <div className="cms-device-btn-group">
                                    {[
                                        { label: 'Mobile', width: 375 },
                                        { label: 'Tablette', width: 768 },
                                        { label: 'Laptop', width: 1024 },
                                        { label: 'Desktop', width: 1440 },
                                    ].map(d => (
                                        <button
                                            key={d.label}
                                            className="cms-device-btn"
                                            onClick={() => handlePreview()}
                                            title={`Aperçu ${d.label} (${d.width}px)`}
                                        >
                                            {d.label} ({d.width}px)
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {activePanel === 'patterns' && (
                            <div className="cms-panel-content cms-panel-stack">
                                <p className="cms-panel-desc">Insérez un bloc de sections pré-configuré.</p>
                                {(['accueil', 'information', 'engagement', 'medias', 'commercial', 'navigation'] as const).map(cat => {
                                    const patterns = SECTION_PATTERNS.filter(p => p.categorie === cat);
                                    if (patterns.length === 0) return null;
                                    return (
                                        <div key={cat} className="cms-panel-category">
                                            <h4 className="cms-panel-category__title">{PATTERN_CATEGORIE_LABELS[cat]}</h4>
                                            <div className="cms-panel-category__list">
                                                {patterns.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleInsererPattern(p)}
                                                        className="cms-pattern-item"
                                                    >
                                                        <span className="cms-editor-page-icon">{p.icon}</span>
                                                        <div className="cms-pattern-item__text">
                                                            <p className="cms-editor-page-name">{p.nom}</p>
                                                            <p className="cms-page-info-text">{p.sections} sections</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        {activePanel === 'library' && (
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
                        {activePanel === 'shortcuts' && (
                            <div className="cms-panel-content cms-panel-stack--tight">
                                <p className="cms-panel-desc--sm">Raccourcis clavier disponibles dans l'éditeur.</p>
                                {[
                                    ['Ctrl+S', 'Sauvegarder'],
                                    ['Ctrl+Z', 'Annuler'],
                                    ['Ctrl+Y / Ctrl+Shift+Z', 'Rétablir'],
                                    ['Ctrl+Shift+P', 'Ouvrir Patterns'],
                                    ['Ctrl+K', 'Command Palette'],
                                    ['Ctrl+G', 'Toggle grille'],
                                    ['Ctrl+D', 'Cycle device (desktop/tablet/mobile)'],
                                    ['Ctrl+M', 'Mode sombre preview'],
                                    ['Ctrl+0', 'Reset zoom + desktop'],
                                    ['F11 / Échap', 'Mode Focus'],
                                ].map(([key, desc]) => (
                                    <div key={key} className="cms-shortcut-row">
                                        <span className="cms-shortcut-row__label">{desc}</span>
                                        <kbd className="cms-kbd">{key}</kbd>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activePanel === 'style' && (
                            <StyleEditorPanel
                                config={(selectedPuckItem?.props as any)?.styleConfig || {}}
                                hasSelection={!!selectedPuckItem}
                                componentType={(selectedPuckItem as any)?.type}
                                sectionProps={selectedPuckItem?.props as Record<string, any> | undefined}
                                onSectionPropsChange={(newProps) => {
                                    if (!selectedItemId) return;
                                    const newData = {
                                        ...puckData,
                                        content: puckData.content.map(item => {
                                            if ((item.props as any)?.id === selectedItemId) {
                                                return { ...item, props: { ...item.props, ...newProps } };
                                            }
                                            return item;
                                        }),
                                    };
                                    setUndoStack(prev => [...prev.slice(-19), puckData]);
                                    setRedoStack([]);
                                    setPuckData(newData);
                                    setHasChanges(true);
                                }}
                                onChange={(styles) => {
                                    if (!selectedItemId) {
                                        toast.info('Sélectionnez une section dans le canvas pour appliquer les styles');
                                        return;
                                    }
                                    // Mettre à jour le styleConfig dans les props de la section sélectionnée
                                    const newData = {
                                        ...puckData,
                                        content: puckData.content.map(item => {
                                            if ((item.props as any)?.id === selectedItemId) {
                                                return { ...item, props: { ...item.props, styleConfig: styles } };
                                            }
                                            return item;
                                        }),
                                    };
                                    setUndoStack(prev => [...prev.slice(-19), puckData]);
                                    setRedoStack([]);
                                    setPuckData(newData);
                                    setHasChanges(true);
                                    toast.success('Styles mis à jour');
                                }}
                            />
                        )}
                        {activePanel === 'clipboard' && (
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
                        {activePanel === 'visibility' && (
                            <VisibilityEditor
                                condition={visibilityCondition}
                                onChange={setVisibilityCondition}
                            />
                        )}
                        {activePanel === 'metrics' && (
                            <ContentMetricsPanel puckData={puckData} />
                        )}
                        {activePanel === 'sections' && (
                            <SectionNavigator
                                puckData={puckData}
                                selectedItemId={selectedItemId}
                                onSelect={(id) => {
                                    // Trouver et sélectionner l'élément dans le canvas
                                    const el = document.querySelector(`[data-puck-component-id="${id}"]`);
                                    if (el && 'click' in el) (el as HTMLElement).click();
                                }}
                                onToggleVisibility={(id) => {
                                    // Toggle visibility via Puck dispatch (hide/show)
                                    toast.info(`Section ${id.substring(0, 8)} basculée`);
                                }}
                                onReorder={(fromIndex, toIndex) => {
                                    // Réordonner les sections dans le Puck data
                                    const newContent = [...puckData.content];
                                    const [moved] = newContent.splice(fromIndex, 1);
                                    newContent.splice(toIndex, 0, moved);
                                    setUndoStack(prev => [...prev.slice(-19), puckData]);
                                    setRedoStack([]);
                                    setPuckData({ ...puckData, content: newContent });
                                    setHasChanges(true);
                                    toast.success('Section réordonnée');
                                }}
                            />
                        )}
                    </div>
                    )}
                    {/* Mode collapsed : icônes verticales */}
                    {sidebarCollapsed && (
                        <div className="cms-collapsed-sidebar">
                            {[
                                { id: 'sections', icon: <List className="cms-sidebar-icon" />, label: 'Sections' },
                                { id: 'library', icon: <Bookmark className="cms-sidebar-icon" />, label: 'Biblio' },
                                { id: 'patterns', icon: <LayoutGrid className="cms-sidebar-icon" />, label: 'Patterns' },
                                { id: 'style', icon: <Palette className="cms-sidebar-icon" />, label: 'Style' },
                                { id: 'seo', icon: <Search className="cms-sidebar-icon" />, label: 'SEO' },
                                { id: 'metrics', icon: <BarChart3 className="cms-sidebar-icon" />, label: 'Qualité' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActivePanel(item.id as PanelId); setSidebarCollapsed(false); }}
                                    className={`cms-sidebar-icon-btn ${activePanel === item.id ? 'cms-sidebar-icon-btn--active' : ''}`}
                                    title={item.label}
                                >
                                    {item.icon}
                                </button>
                            ))}
                        </div>
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
                    setActivePanel(panel as PanelId);
                }}
                onToggleFocus={toggleFocus}
            />

            {/* ═══ Zone d'édition Puck ═══ */}
            {/* Toggle bouton panneau gauche (Puck drawer) */}
            <button
                onClick={() => setLeftPanelCollapsed(c => !c)}
                className={`cms-panel-toggle cms-panel-toggle--left ${!leftPanelCollapsed ? 'cms-panel-toggle--active' : ''}`}
                title={leftPanelCollapsed ? 'Ouvrir la bibliothèque (B)' : 'Fermer la bibliothèque (B)'}
            >
                {leftPanelCollapsed ? <ChevronRight className="cms-panel-toggle__icon" /> : <ChevronLeft className="cms-panel-toggle__icon" />}
            </button>
            <div
                ref={canvasRef}
                className={`relative min-h-0 flex-1 overflow-hidden cms-editing-zone cms-canvas-workspace cms-canvas-workspace-pro cms-canvas-bg-pro ${darkModePreview ? 'cms-editing-zone-dark cms-dark cms-canvas-bg-pro--dark' : ''} ${leftPanelCollapsed && !activePanel ? 'cms-canvas-workspace--expanded' : ''}`}
                style={{
                    backgroundColor: darkModePreview ? '#0c1222' : '#e4e9f0',
                    backgroundImage: darkModePreview
                        ? 'radial-gradient(circle, rgba(148,163,184,0.06) 1px, transparent 1px)'
                        : canvasGridPattern === 'dots'
                            ? 'radial-gradient(circle, rgba(100,116,139,0.08) 1px, transparent 1px)'
                            : canvasGridPattern === 'lines'
                                ? 'linear-gradient(rgba(100,116,139,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.06) 1px, transparent 1px)'
                                : canvasGridPattern === 'cross'
                                    ? 'linear-gradient(rgba(100,116,139,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.04) 1px, transparent 1px), radial-gradient(circle, rgba(100,116,139,0.08) 1px, transparent 1px)'
                                    : 'none',
                    backgroundSize: canvasGridPattern === 'dots' ? '24px 24px' : `${gridSize}px ${gridSize}px`,
                }}
            >
                {/* Grille de points professionnelle (GridOverlay) */}
                <GridOverlay visible={showGrid && !darkModePreview} gridSize={gridSize} zoom={canvasZoom} dark={darkModePreview} />
                {/* Performance Overlay — monitoring FPS */}
                <PerformanceOverlay
                    visible={showPerfOverlay}
                    sectionCount={puckData.content.length}
                    zoom={canvasZoom}
                    dark={darkModePreview}
                />
                {/* Rulers (règles pixel) */}
                {showRulers && <CanvasRulers zoom={canvasZoom} dark={darkModePreview} />}
                {/* Scroll fade indicators — bords estompés pour signaler le contenu hors-champ */}
                <div className="cms-scroll-fade-enhanced cms-scroll-fade-enhanced--left"
                    style={{ opacity: canvasScrollPos.x > 10 ? 1 : 0 }} />
                <div className="cms-scroll-fade-enhanced cms-scroll-fade-enhanced--right"
                    style={{ opacity: canvasScrollPos.x < canvasContentSize.width - 1210 ? 1 : 0 }} />
                <div className="cms-scroll-fade-enhanced cms-scroll-fade-enhanced--bottom"
                    style={{ opacity: canvasScrollPos.y < canvasContentSize.height - 500 ? 1 : 0 }} />
                <div className="cms-scroll-fade-enhanced cms-scroll-fade-enhanced--top"
                    style={{ opacity: canvasScrollPos.y > 10 ? 1 : 0 }} />
                {/* Scroll progress bars — professional gradient indicators */}
                {Number.isFinite(canvasContentSize.height) && canvasContentSize.height > 0 && (
                    <>
                        {/* Vertical scroll progress (right edge) */}
                        <div className="cms-scroll-marker cms-scroll-marker--v pointer-events-none absolute right-0.5 top-2 bottom-2 z-20 overflow-hidden transition-opacity duration-300"
                            style={{ opacity: canvasContentSize.height > 400 ? 0.8 : 0 }}>
                            <div
                                className="cms-scroll-progress-bar-v w-full rounded-full"
                                style={{
                                    height: `${Number.isFinite(canvasScrollPos.y / Math.max(1, canvasContentSize.height - 400) * 100) ? Math.min(100, Math.max(5, ((canvasScrollPos.y) / Math.max(1, canvasContentSize.height - 400)) * 100)) : 5}%`,
                                    maxHeight: '100%',
                                }}
                            />
                        </div>
                        {/* Horizontal scroll progress (bottom edge) */}
                        {Number.isFinite(canvasContentSize.width) && canvasContentSize.width > 800 && (
                            <div className="cms-scroll-marker cms-scroll-marker--h pointer-events-none absolute bottom-0.5 left-2 right-2 z-20 overflow-hidden transition-opacity duration-300"
                                style={{ opacity: 0.6 }}>
                                <div
                                    className="cms-scroll-progress-bar-h h-full rounded-full"
                                    style={{
                                        width: `${Math.min(100, Math.max(5, ((canvasScrollPos.x) / Math.max(1, canvasContentSize.width - 800)) * 100))}%`,
                                    }}
                                />
                            </div>
                        )}
                    </>
                )}
                {/* Vignette subtile pour profondeur visuelle */}
                <div className="cms-canvas-vignette pointer-events-none absolute inset-0 z-[5]" />
                {/* Center alignment guides (Figma-like) — dashed crosshair */}
                <div className="cms-canvas-guides" aria-hidden="true">
                    <div className="cms-canvas-guide--center-h" />
                    <div className="cms-canvas-guide--center-v" />
                </div>
                {/* Zoom indicator overlay (composant ZoomIndicator) */}
                <ZoomIndicator
                    zoom={canvasZoom}
                    visible={showZoomIndicator}
                    deviceLabel={devicePreview !== 'desktop' ? (devicePreview === 'mobile' ? 'Mobile' : 'Tablette') : undefined}
                />
                {lastLoadedPageId.current === page.id ? (
                    <div
                        ref={canvasScrollRef}
                        style={{ ...PUCK_THEME_CSS, ...CANVAS_SCROLL_STYLE }}
                        className={`cms-canvas-scroll-pro cms-canvas-scroll-ultra cms-canvas-zoom-smooth cms-canvas-bg-${canvasBgPattern} cms-canvas-scroll--enhanced flex h-full justify-center relative ${darkModePreview ? 'cms-canvas-scroll-ultra--dark' : ''}`}
                    >
                        {/* §772 — Canvas Performance Monitor */}
                        <div className="cms-canvas-perf-monitor" aria-hidden="true">
                            <div className="cms-canvas-perf-monitor__dot" />
                            <span className="cms-canvas-perf-monitor__text">
                                {puckData.content.length} sections · {canvasZoom}%
                            </span>
                        </div>
                        {/* §772 — Snap Guide Indicators */}
                        {selectedItemId && (
                            <>
                                <div className="cms-snap-indicator cms-snap-indicator--center-h" aria-hidden="true" />
                                <div className="cms-snap-indicator cms-snap-indicator--center-v" aria-hidden="true" />
                            </>
                        )}
                        {/* Scroll edge indicators — gradient overlays §760 */}
                        {canvasScrollPos.y > 20 && (
                            <div className="cms-canvas-scroll-edge cms-canvas-scroll-edge--top" aria-hidden="true" />
                        )}
                        {canvasScrollPos.x > 20 && (
                            <div className="cms-canvas-scroll-edge cms-canvas-scroll-edge--left" aria-hidden="true" />
                        )}
                        {/* Page wrapper — aspect page avec ombre + grid pro */}
                        <div className="cms-canvas-page-pro cms-canvas-page-pro-v2 cms-canvas-paper--pro" style={{
                            width: devicePreview === 'desktop' ? (canvasZoom === 100 ? '1200px' : undefined) : undefined,
                            maxWidth: devicePreview !== 'desktop' ? (DEVICE_WIDTHS[devicePreview] ?? undefined) : (canvasZoom === 100 ? '1200px' : undefined),
                            margin: devicePreview !== 'desktop' ? '32px auto' : '0 auto',
                            padding: devicePreview !== 'desktop' ? '32px 24px' : '32px 24px',
                            minHeight: '100%',
                            position: 'relative',
                            ...(devicePreview === 'desktop'
                                ? (darkModePreview ? CANVAS_DARK_PAGE_STYLE : CANVAS_PAGE_STYLE)
                                : CANVAS_DEVICE_FRAME_STYLE
                            ),
                        }}>
                            {/* Page shadow — depth effect */}
                            <div className="cms-canvas-page-shadow" aria-hidden="true" />
                            {/* Device label + notch */}
                            {devicePreview !== 'desktop' && (
                                <>
                                    {/* Notch mobile/tablet */}
                                    <div className="cms-device-notch" />
                                    {/* Status bar (mobile only) */}
                                    {devicePreview === 'mobile' && (
                                        <div className="cms-device-status-bar">
                                            <div className="cms-device-status-bar__camera" />
                                        </div>
                                    )}
                                    <div className={`cms-device-info-badge ${devicePreview === 'mobile' ? 'cms-device-info-badge--mobile' : 'cms-device-info-badge--tablet'}`}>
                                        <span className="cms-device-info-badge__emoji">
                                            {devicePreview === 'mobile' ? '📱' : '📲'}
                                        </span>
                                        {devicePreview === 'mobile' ? 'Mobile — 375px' : 'Tablette — 768px'}
                                    </div>
                                </>
                            )}
                            <div className="cms-canvas-zoom-wrapper" style={{
                                transform: canvasZoom !== 100 ? `scale(${canvasZoom / 100})` : undefined,
                                transformOrigin: 'top center',
                                minHeight: canvasZoom !== 100 ? `${10000 / canvasZoom * 100}%` : '100%',
                                transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                            }}>
                                {/* §775 — Smart Grid Overlay */}
                                <div className="cms-canvas-grid-overlay" aria-hidden="true" />
                                <Puck
                                    key={puckEpoch}
                                    config={puckConfig}
                                    data={puckData}
                                    onChange={handlePuckChange}
                                    onPublish={handlePublier}
                                    overrides={puckOverrides}
                                />
                            </div>
                            {/* Canvas empty state */}
                            {puckData.content.length === 0 && (
                                <div className="cms-canvas-empty-state cms-content-enter">
                                    <div className="cms-canvas-empty-state__orbs">
                                        <div className="cms-canvas-empty-state__orb cms-canvas-empty-state__orb--outer" />
                                        <div className="cms-canvas-empty-state__orb cms-canvas-empty-state__orb--inner" />
                                        <div className="cms-canvas-empty-state__icon-box">
                                            <Sparkles className="cms-canvas-empty-state__icon" />
                                        </div>
                                    </div>
                                    <h3 className="cms-canvas-empty-state__title">Commencez à construire votre page</h3>
                                    <p className="cms-canvas-empty-state__desc">
                                        Glissez-déposez des composants depuis la bibliothèque ou utilisez un pattern pré-configuré pour démarrer rapidement.
                                    </p>
                                    <div className="cms-canvas-empty-state__actions">
                                        <button onClick={() => togglePanel('library')} className="cms-canvas-empty-state__btn cms-canvas-empty-state__btn--primary">
                                            <Plus className="cms-canvas-empty-state__btn-icon" />
                                            Ouvrir la bibliothèque
                                        </button>
                                        <button onClick={() => togglePanel('patterns')} className="cms-canvas-empty-state__btn cms-canvas-empty-state__btn--secondary">
                                            <LayoutGrid className="cms-canvas-empty-state__btn-icon" />
                                            Utiliser un pattern
                                        </button>
                                    </div>
                                    <div className="cms-canvas-empty-state__shortcuts">
                                        <span className="cms-canvas-empty-state__shortcut"><kbd className="cms-kbd">Ctrl+K</kbd> Command palette</span>
                                        <span className="cms-canvas-empty-state__shortcut"><kbd className="cms-kbd">Ctrl+S</kbd> Sauvegarder</span>
                                        <span className="cms-canvas-empty-state__shortcut"><kbd className="cms-kbd">Ctrl+Z</kbd> Annuler</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Page width indicator badge */}
                        <div className="cms-page-width-badge">
                            {devicePreview === 'desktop' ? '1200px' : devicePreview === 'tablet' ? '768px' : '375px'} — {devicePreview === 'desktop' ? 'Desktop' : devicePreview === 'tablet' ? 'Tablette' : 'Mobile'}
                        </div>
                        {/* Page boundary indicators — top/bottom markers */}
                        <div className="cms-canvas-page-indicators" aria-hidden="true">
                            <div className="cms-canvas-page-indicator cms-canvas-page-indicator--top">
                                <span className="cms-canvas-page-indicator__label">↑ Début de page</span>
                            </div>
                            <div className="cms-canvas-page-indicator cms-canvas-page-indicator--bottom">
                                <span className="cms-canvas-page-indicator__label">↓ Fin de page</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="cms-loading-editor">
                        <div className="cms-loading-editor__spinner" />
                        <p className="cms-loading-editor__text">Chargement de l'éditeur...</p>
                    </div>
                )}
                {/* Indicateur de sélection flottant avec actions rapides + breadcrumb */}
                {selectedPuckItem && (
                    <div className="cms-selection-floating cms-content-enter">
                        {/* Breadcrumb de navigation */}
                        <div className="cms-selection-breadcrumb">
                            <span className="cms-selection-breadcrumb__label">Page</span>
                            <ChevronRight className="cms-selection-breadcrumb__chevron" />
                            <span className="cms-selection-breadcrumb__type">
                                <span className="cms-selection-breadcrumb__type-icon">{SECTION_TYPE_ICONS[(selectedPuckItem as any).type] || '📦'}</span>
                                {COMPONENT_LABELS?.[(selectedPuckItem as any).type] || (selectedPuckItem as any).type?.replace(/Section$/, '') || 'Section'}
                            </span>
                            <span className="cms-selection-breadcrumb__id">#{selectedItemId?.substring(0, 6) || '...'}</span>
                        </div>
                        {/* Barre d'actions principale — professionnelle */}
                        <div className="cms-section-action-bar">
                            {/* Icone type section */}
                            <span className={`cms-section-action-bar__type-icon ${SECTION_TYPE_COLORS[(selectedPuckItem as any).type] || 'bg-gray-100 text-gray-600'}`}>
                                {SECTION_TYPE_ICONS[(selectedPuckItem as any).type] || '📦'}
                            </span>
                            <span className="cms-section-action-bar__sep" />
                            {/* Groupe: Édition */}
                            <div className="cms-selection-bar__group">
                                <button
                                    onClick={() => togglePanel('style')}
                                    className="cms-quick-action-btn cms-quick-action-btn--style"
                                    title="Éditer le style (fond, texte, bordure, effets)"
                                >
                                    <Palette className="cms-quick-action-btn__icon" />
                                    <span className="cms-quick-action-btn__label">Style</span>
                                </button>
                                <button
                                    onClick={() => setShowInlineEditor(!showInlineEditor)}
                                    className={`cms-quick-action-btn ${
                                        showInlineEditor ? 'cms-quick-action-btn--inline-active' : 'cms-quick-action-btn--inline'
                                    }`}
                                    title="Édition rapide inline (presets, animations, disposition)"
                                >
                                    <Paintbrush className="cms-quick-action-btn__icon" />
                                    <span className="cms-quick-action-btn__label">Inline</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const el = document.querySelector(`[data-puck-component-id="${selectedItemId}"]`);
                                        if (el) {
                                            const rect = el.getBoundingClientRect();
                                            const scrollEl = canvasScrollRef.current;
                                            const scrollRect = scrollEl?.getBoundingClientRect();
                                            if (scrollRect) {
                                                setContentEditorPosition({
                                                    top: rect.top - scrollRect.top + (canvasScrollRef.current?.scrollTop || 0),
                                                    left: rect.left - scrollRect.left + (canvasScrollRef.current?.scrollLeft || 0),
                                                    width: rect.width,
                                                });
                                            }
                                        }
                                        setShowContentEditor(!showContentEditor);
                                    }}
                                    className={`cms-quick-action-btn ${
                                        showContentEditor ? 'cms-quick-action-btn--content-active' : 'cms-quick-action-btn--content'
                                    }`}
                                    title="Éditer le contenu (texte, boutons, images, liens)"
                                >
                                    <Type className="cms-quick-action-btn__icon" />
                                    <span className="cms-quick-action-btn__label">Contenu</span>
                                </button>
                            </div>
                            {/* Séparateur */}
                            <span className="cms-section-action-bar__sep" />
                            {/* Groupe: Actions section */}
                            {selectedItemId && (
                                <div className="cms-selection-bar__group">
                                    <button
                                        onClick={() => duplicateSection(selectedItemId)}
                                        className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--duplicate"
                                        title="Dupliquer la section (Ctrl+D)"
                                    >
                                        <CopyPlus className="cms-quick-action-btn__icon" />
                                    </button>
                                    <button
                                        onClick={() => moveSectionUp(selectedItemId)}
                                        className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--move"
                                        title="Monter la section"
                                    >
                                        <ChevronUp className="cms-quick-action-btn__icon" />
                                    </button>
                                    <button
                                        onClick={() => moveSectionDown(selectedItemId)}
                                        className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--move"
                                        title="Descendre la section"
                                    >
                                        <ChevronDown className="cms-quick-action-btn__icon" />
                                    </button>
                                    <button
                                        onClick={() => deleteSection(selectedItemId)}
                                        className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--delete"
                                        title="Supprimer la section (Suppr)"
                                    >
                                        <Trash2 className="cms-quick-action-btn__icon" />
                                    </button>
                                </div>
                            )}
                            {/* Séparateur */}
                            <span className="cms-section-action-bar__sep" />
                            {/* Groupe: Outils */}
                            <div className="cms-selection-bar__group">
                                <button
                                    onClick={() => togglePanel('visibility')}
                                    className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--visibility"
                                    title="Visibilité conditionnelle"
                                >
                                    <Eye className="cms-quick-action-btn__icon" />
                                </button>
                                <button
                                    onClick={() => togglePanel('sections')}
                                    className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--navigator"
                                    title="Navigateur de sections"
                                >
                                    <List className="cms-quick-action-btn__icon" />
                                </button>
                                {/* Copier le style de la section */}
                                <button
                                    onClick={() => {
                                        if (!selectedItemId) return;
                                        const item = puckData.content.find(i => (i.props as any)?.id === selectedItemId);
                                        const style = (item?.props as any)?.styleConfig;
                                        if (style) {
                                            navigator.clipboard.writeText(JSON.stringify(style, null, 2));
                                            toast.success('Style copié');
                                        }
                                    }}
                                    className="cms-quick-action-btn cms-quick-action-btn--icon-only"
                                    title="Copier le style (JSON)"
                                >
                                    <ClipboardCopy className="cms-quick-action-btn__icon" />
                                </button>
                                {/* Réinitialiser le style */}
                                <button
                                    onClick={() => {
                                        if (!selectedItemId) return;
                                        const newData = {
                                            ...puckData,
                                            content: puckData.content.map(item => {
                                                if ((item.props as any)?.id === selectedItemId) {
                                                    return { ...item, props: { ...item.props, styleConfig: {} } };
                                                }
                                                return item;
                                            }),
                                        };
                                        setUndoStack(prev => [...prev.slice(-19), puckData]);
                                        setRedoStack([]);
                                        setPuckData(newData);
                                        setHasChanges(true);
                                        toast.success('Style réinitialisé');
                                    }}
                                    className="cms-quick-action-btn cms-quick-action-btn--icon-only cms-quick-action-btn--danger"
                                    title="Réinitialiser le style"
                                >
                                    <RotateCcw className="cms-quick-action-btn__icon" />
                                </button>
                            </div>
                            {/* Quick style actions */}
                            <span className="cms-section-action-bar__sep" />
                            <QuickStyleActions
                                selectedItemId={selectedItemId}
                                puckData={puckData}
                                onPuckChange={(newData) => {
                                    setUndoStack(prev => [...prev.slice(-19), puckData]);
                                    setRedoStack([]);
                                    setPuckData(newData);
                                    setHasChanges(true);
                                }}
                            />
                        </div>
                    </div>
                )}
                {/* Indicateur nombre de sections */}
                {puckData.content.length > 0 && !selectedPuckItem && (
                    <div className="cms-selection-count">
                        <LayoutGrid className="cms-selection-count__icon" />
                        {puckData.content.length} section{puckData.content.length !== 1 ? 's' : ''}
                    </div>
                )}
                {/* ═══ Inline Editor flottant (style) ═══ */}
                {showInlineEditor && selectedPuckItem && (
                    <div className="cms-inline-editor-container cms-inline-glass">
                        <SectionInlineEditor
                        styleConfig={(selectedPuckItem.props as any)?.styleConfig || {}}
                        onChange={(newStyleConfig) => {
                            if (!selectedItemId) return;
                            const newData = {
                                ...puckData,
                                content: puckData.content.map(item => {
                                    if ((item.props as any)?.id === selectedItemId) {
                                        return { ...item, props: { ...item.props, styleConfig: newStyleConfig } };
                                    }
                                    return item;
                                }),
                            };
                            setUndoStack(prev => [...prev.slice(-19), puckData]);
                            setRedoStack([]);
                            setPuckData(newData);
                            setHasChanges(true);
                        }}
                        sectionType={(selectedPuckItem as any)?.type || ''}
                        sectionLabel={COMPONENT_LABELS?.[(selectedPuckItem as any)?.type] || (selectedPuckItem as any)?.type?.replace(/Section$/, '')}
                        onClose={() => setShowInlineEditor(false)}
                        onOpenFullEditor={() => {
                            setShowInlineEditor(false);
                            setActivePanel('style');
                        }}
                        onDuplicate={selectedItemId ? () => duplicateSection(selectedItemId) : undefined}
                        onDelete={selectedItemId ? () => deleteSection(selectedItemId) : undefined}
                        onMoveUp={selectedItemId ? () => moveSectionUp(selectedItemId) : undefined}
                        onMoveDown={selectedItemId ? () => moveSectionDown(selectedItemId) : undefined}
                    />
                    </div>
                )}
                {/* ═══ Inline Content Editor (édition contenu direct) ═══ */}
                {showContentEditor && selectedPuckItem && (
                    <div className="cms-content-editor-container cms-content-editor-glass">
                    <InlineContentEditor
                        sectionProps={(selectedPuckItem.props as any) || {}}
                        onPropsChange={(newProps) => {
                            if (!selectedItemId) return;
                            const newData = {
                                ...puckData,
                                content: puckData.content.map(item => {
                                    if ((item.props as any)?.id === selectedItemId) {
                                        return { ...item, props: { ...(item.props as any), ...newProps } };
                                    }
                                    return item;
                                }),
                            };
                            setUndoStack(prev => [...prev.slice(-19), puckData]);
                            setRedoStack([]);
                            setPuckData(newData);
                            bumpPuckEpoch();
                            setHasChanges(true);
                        }}
                        sectionType={(selectedPuckItem as any)?.type || ''}
                        position={contentEditorPosition}
                        zoom={canvasZoom}
                        scrollPos={canvasScrollPos}
                        onClose={() => setShowContentEditor(false)}
                    />
                    </div>
                )}
                {/* ═══ Hover Toolbar (au survol d'une section) ═══ */}
                {hoverToolbarEnabled && hoveredComponent && !selectedPuckItem && (
                    <CanvasHoverToolbar
                        position={hoveredComponent.position}
                        componentType={hoveredComponent.type}
                        label={COMPONENT_LABELS?.[hoveredComponent.type] || hoveredComponent.type?.replace(/Section$/, '')}
                        zoom={canvasZoom}
                        scrollPos={canvasScrollPos}
                        onEditStyle={() => setActivePanel('style')}
                        onEditContent={() => {
                            // Ouvrir l'éditeur de contenu inline
                            const el = document.querySelector(`[data-puck-component-id="${hoveredComponent.id}"]`);
                            if (el) {
                                const rect = el.getBoundingClientRect();
                                const scrollEl = canvasScrollRef.current;
                                const scrollRect = scrollEl?.getBoundingClientRect();
                                if (scrollRect) {
                                    setContentEditorPosition({
                                        top: rect.top - scrollRect.top + (scrollEl?.scrollTop || 0),
                                        left: rect.left - scrollRect.left + (scrollEl?.scrollLeft || 0),
                                        width: rect.width,
                                    });
                                }
                                // Sélectionner le composant d'abord
                                (el as HTMLElement).click();
                                setTimeout(() => setShowContentEditor(true), 150);
                            }
                        }}
                        onInlineEdit={() => {
                            // Sélectionner le composant puis ouvrir l'inline editor
                            const el = document.querySelector(`[data-puck-component-id="${hoveredComponent.id}"]`) as HTMLElement;
                            if (el) el.click();
                            setTimeout(() => setShowInlineEditor(true), 100);
                        }}
                        onDuplicate={() => duplicateSection(hoveredComponent.id)}
                        onDelete={() => deleteSection(hoveredComponent.id)}
                        onMoveUp={() => moveSectionUp(hoveredComponent.id)}
                        onMoveDown={() => moveSectionDown(hoveredComponent.id)}
                        onToggleVisibility={() => toast.info(`Section ${hoveredComponent.id.substring(0, 8)} basculée`)}
                    />
                )}
                {/* Minimap — vue miniature de la page */}
                {showMinimap && puckData.content.length > 0 && (
                    <CanvasMinimap
                        puckData={puckData}
                        zoom={canvasZoom}
                        scrollPos={canvasScrollPos}
                        contentSize={canvasContentSize}
                        viewportSize={{ width: 1200, height: 600 }}
                        onScrollTo={(x, y) => {
                            if (canvasScrollRef.current) {
                                canvasScrollRef.current.scrollTo({ left: x, top: y, behavior: 'smooth' });
                            }
                        }}
                        onZoomChange={(z) => setCanvasZoom(z)}
                        onZoomToFit={() => {
                            setCanvasZoom(75);
                            toast.success('Vue ajustée');
                        }}
                        selectedItemId={selectedItemId}
                        onSelectSection={(id) => {
                            const el = document.querySelector(`[data-puck-component-id="${id}"]`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        dark={darkModePreview}
                    />
                )}
                {/* Mouse coordinate tracker — bottom-left badge */}
                {showCoordinates && (
                    <div className="cms-coord-badge">
                        <Crosshair className="cms-coord-badge__icon" />
                        <span className="cms-coord-badge__value">X: {mouseCoords.x}</span>
                        <span className="cms-coord-badge__sep">|</span>
                        <span className="cms-coord-badge__value">Y: {mouseCoords.y}</span>
                        <span className="cms-coord-badge__sep">|</span>
                        <span className="cms-coord-badge__zoom">{canvasZoom}%</span>
                    </div>
                )}
                {/* Crosshair cursor guides — lignes guide suivant la souris */}
                {showCoordinates && canvasScrollRef.current && (
                    <>
                        <div className="cms-crosshair cms-crosshair-h pointer-events-none absolute z-[28] transition-opacity duration-100"
                            style={{ top: `${mouseCoords.y * (canvasZoom / 100)}px`, opacity: 0.6 }} />
                        <div className="cms-crosshair cms-crosshair-v pointer-events-none absolute z-[28] transition-opacity duration-100"
                            style={{ left: `${mouseCoords.x * (canvasZoom / 100)}px`, opacity: 0.6 }} />
                        <div className="cms-crosshair-dot pointer-events-none absolute z-[29]"
                            style={{
                                top: `${mouseCoords.y * (canvasZoom / 100)}px`,
                                left: `${mouseCoords.x * (canvasZoom / 100)}px`,
                            }} />
                    </>
                )}
                {/* ═══ Canvas Status Bar (bottom) — Compact & pro ═══ */}
                <div className={`cms-status-bar absolute bottom-0 left-0 right-0 z-10 ${darkModePreview ? 'cms-status-bar--dark' : ''}`}>
                    <div className="cms-status-bar__left" style={{ color: darkModePreview ? '#94a3b8' : '#64748b' }}>
                        <span className="cms-status-bar__section-count">
                            <LayoutGrid className="cms-status-bar__section-count-icon" />
                            {puckData.content.length} section{puckData.content.length !== 1 ? 's' : ''}
                        </span>
                        {/* Device preview pills */}
                        <div className="cms-device-pills">
                            {(['desktop', 'tablet', 'mobile'] as DeviceType[]).map(device => (
                                <button
                                    key={device}
                                    onClick={() => setDevicePreview(device)}
                                    className="cms-device-pill"
                                    data-active={devicePreview === device}
                                    style={{ color: devicePreview === device ? undefined : darkModePreview ? '#64748b' : '#94a3b8' }}
                                    title={`${device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablette (768px)' : 'Mobile (375px)'}`}
                                >
                                    {device === 'desktop' ? <MonitorIcon className="cms-device-pill__icon" /> : device === 'tablet' ? <Tablet className="cms-device-pill__icon" /> : <Smartphone className="cms-device-pill__icon" />}
                                    <span className="cms-device-pill__label">{device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablette' : 'Mobile'}</span>
                                </button>
                            ))}
                        </div>
                        {/* Selected section type badge */}
                        {selectedPuckItem && (
                            <span className="cms-status-bar__section-type-badge" style={{ background: darkModePreview ? 'rgba(124,58,237,0.2)' : undefined, color: darkModePreview ? '#c4b5fd' : undefined }}>
                                {SECTION_TYPE_ICONS[(selectedPuckItem as any).type] || '📦'}
                                {COMPONENT_LABELS?.[(selectedPuckItem as any).type] || 'Section'}
                            </span>
                        )}
                    </div>
                    <div className="cms-status-bar__spacer" />
                    <div className="cms-status-bar__center" style={{ color: darkModePreview ? '#64748b' : '#94a3b8' }}>
                        {isSaving ? (
                            <span className="cms-status-indicator cms-status-indicator--saving">
                                <span className="cms-status-indicator__dot" />
                                Sauvegarde...
                            </span>
                        ) : lastSavedAt ? (
                            <span className="cms-status-indicator cms-status-indicator--saved">
                                <span className="cms-status-indicator__dot" />
                                Sauvegardé {Math.round((Date.now() - lastSavedAt.getTime()) / 60000)} min
                            </span>
                        ) : hasChanges ? (
                            <span className="cms-status-indicator cms-status-indicator--unsaved">
                                <span className="cms-status-indicator__dot" />
                                Modifications non sauvegardées
                            </span>
                        ) : (
                            <span className="cms-status-indicator" style={{ color: '#94a3b8', background: '#f8fafc' }}>
                                <span className="cms-status-indicator__dot" />
                                Prêt
                            </span>
                        )}
                        {/* Undo stack indicator — timeline */}
                        {undoStack.length > 0 && (
                            <span className="cms-timeline">
                                <span className="cms-timeline__btn" onClick={handleUndo} title="Annuler (Ctrl+Z)">
                                    <Undo2 className="cms-undo-icon-sm" />
                                </span>
                                {Array.from({ length: Math.min(undoStack.length, 8) }).map((_, i) => (
                                    <span key={i} className={`cms-timeline__step ${i === undoStack.length - 1 ? 'cms-timeline__step--current' : 'cms-timeline__step--past'}`} />
                                ))}
                                <span className="cms-undo-counter">{undoStack.length}</span>
                            </span>
                        )}
                    </div>
                    <div className="cms-status-bar__spacer" />
                    <div className="cms-status-bar__right" style={{ color: darkModePreview ? '#94a3b8' : '#64748b' }}>
                        <button
                            onClick={() => setShowGrid(g => !g)}
                            className="cms-status-bar__grid-btn"
                            style={{ color: showGrid ? (darkModePreview ? '#93c5fd' : '#3b82f6') : darkModePreview ? '#475569' : '#cbd5e1' }}
                            title={`Grille ${showGrid ? 'activée' : 'désactivée'} (Ctrl+G)`}
                        >
                            <Grid3X3 className="cms-status-bar__grid-icon" />
                            {showGrid && <span>{gridSize}px</span>}
                        </button>
                        <button
                            onClick={() => setShowMinimap(m => !m)}
                            className="cms-status-bar__minimap-btn"
                            style={{ color: showMinimap ? (darkModePreview ? '#93c5fd' : '#3b82f6') : darkModePreview ? '#475569' : '#cbd5e1' }}
                            title={showMinimap ? 'Masquer la minimap' : 'Afficher la minimap'}
                        >
                            <Map className="cms-status-bar__minimap-icon" />
                        </button>
                        {/* Quick zoom controls — cms-zoom-pill */}
                        <div className="cms-zoom-pill">
                            <button
                                onClick={() => setCanvasZoom(z => Math.max(25, z - 10))}
                                className="cms-zoom-pill__btn"
                                title="Zoom arrière (-)"
                            >
                                −
                            </button>
                            <button
                                onClick={() => setCanvasZoom(100)}
                                className="cms-zoom-pill__value"
                                title="Reset zoom (Ctrl+0)"
                            >
                                {canvasZoom}%
                            </button>
                            <button
                                onClick={() => setCanvasZoom(z => Math.min(200, z + 10))}
                                className="cms-zoom-pill__btn"
                                title="Zoom avant (+)"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ Context Menu canvas (clic-droit sur section) ═══ */}
            {contextMenu && (
                <div
                    ref={contextMenuRef}
                    className="fixed z-[9999] cms-ctx-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <div className="cms-context-menu min-w-[200px]">
                        <div className="cms-ctx-menu__header">
                            <span className={`cms-ctx-menu__header-icon ${SECTION_TYPE_COLORS[contextMenu.itemType] || 'bg-gray-100 text-gray-600'}`}>
                                {SECTION_TYPE_ICONS[contextMenu.itemType] || '📦'}
                            </span>
                            <div className="cms-panel-header-compact">
                                <p className="cms-ctx-menu__header-title">
                                    {COMPONENT_LABELS?.[contextMenu.itemType] || contextMenu.itemType?.replace(/Section$/, '') || 'Section'}
                                </p>
                                <p className="cms-ctx-menu__header-id">#{contextMenu.itemId.substring(0, 8)}</p>
                            </div>
                        </div>
                        <div className="cms-ctx-menu__body">
                            <button onClick={() => { setShowInlineEditor(true); setActivePanel(null); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--indigo">
                                <Paintbrush className="cms-ctx-item__icon" />Édition rapide<span className="cms-ctx-item__shortcut">Inline</span>
                            </button>
                            <button onClick={() => { setActivePanel('style'); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--blue">
                                <Palette className="cms-ctx-item__icon" />Éditer le style<span className="cms-ctx-item__shortcut">S</span>
                            </button>
                            <button onClick={() => {
                                    const el = document.querySelector(`[data-puck-component-id="${contextMenu.itemId}"]`);
                                    if (el) {
                                        const rect = el.getBoundingClientRect();
                                        const scrollEl = canvasScrollRef.current;
                                        const scrollRect = scrollEl?.getBoundingClientRect();
                                        if (scrollRect) setContentEditorPosition({ top: rect.top - scrollRect.top + (scrollEl?.scrollTop || 0), left: rect.left - scrollRect.left + (scrollEl?.scrollLeft || 0), width: rect.width });
                                    }
                                    const puckEl = document.querySelector(`[data-puck-component-id="${contextMenu.itemId}"]`) as HTMLElement;
                                    if (puckEl) puckEl.click();
                                    setTimeout(() => setShowContentEditor(true), 150);
                                    setContextMenu(null);
                                }} className="cms-ctx-item cms-ctx-item--purple">
                                <Type className="cms-ctx-item__icon" />Éditer le contenu<span className="cms-ctx-item__shortcut">C</span>
                            </button>
                            <div className="cms-ctx-separator" />
                            <button onClick={() => { duplicateSection(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--emerald">
                                <CopyPlus className="cms-ctx-item__icon" />Dupliquer<span className="cms-ctx-item__shortcut">Ctrl+D</span>
                            </button>
                            <button onClick={() => { moveSectionUp(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--amber">
                                <ChevronUp className="cms-ctx-item__icon" />Monter
                            </button>
                            <button onClick={() => { moveSectionDown(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--amber">
                                <ChevronDown className="cms-ctx-item__icon" />Descendre
                            </button>
                            <div className="cms-ctx-separator" />
                            <button onClick={() => { moveToTop(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--sky">
                                <ArrowUpFromLine className="cms-ctx-item__icon" />Déplacer en haut
                            </button>
                            <button onClick={() => { moveToBottom(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--sky">
                                <ArrowDownToLine className="cms-ctx-item__icon" />Déplacer en bas
                            </button>
                            <div className="cms-ctx-separator" />
                            <button onClick={() => { deleteSection(contextMenu.itemId); setContextMenu(null); }} className="cms-ctx-item cms-ctx-item--danger">
                                <Trash2 className="cms-ctx-item__icon" />Supprimer<span className="cms-ctx-item__shortcut">Suppr</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Barre de statut ═══ */}
            <EnhancedStatusBar
                sectionCount={puckData.content.length}
                hiddenSectionCount={page.sections?.filter(s => s.visible === false).length || 0}
                selectedSection={selectedPuckItem ? {
                    type: (selectedPuckItem as any).type || '',
                    label: COMPONENT_LABELS?.[(selectedPuckItem as any).type] || (selectedPuckItem as any)?.type?.replace(/Section$/, '') || 'Section',
                    id: selectedItemId || '',
                } : null}
                saveState={isSaving ? 'saving' : hasChanges ? 'unsaved' : 'saved'}
                lastSavedAt={lastSavedAt}
                canvasSize={canvasContentSize.height > 0 ? { width: Math.round(canvasContentSize.width), height: Math.round(canvasContentSize.height) } : undefined}
                zoom={canvasZoom}
                devicePreview={devicePreview}
                onDeviceChange={(d) => setDevicePreview(d)}
                isConnected={true}
            />
            {/* ═══ Barre d'outils éditeur (toggles + zoom + device) ═══ */}
            <div className="cms-bottom-toolbar-enhanced">
                {/* Groupe: Tool Mode Selector (Figma-style) */}
                <div className="cms-toolbar-group-enhanced" title="Outil">
                    <button
                        className="cms-tool-btn-enhanced cms-tool-btn-enhanced--active"
                        data-tooltip="Sélection (V)"
                    >
                        <MousePointer />
                    </button>
                </div>

                <div className="cms-bottom-toolbar-enhanced__sep" />

                {/* Groupe: Toggles visuels */}
                <div className="cms-toolbar-group-enhanced" title="Affichage">
                    <button
                        onClick={() => setShowGrid(g => !g)}
                        className={`cms-tool-btn-enhanced ${showGrid ? 'cms-tool-btn-enhanced--active' : ''}`}
                        data-tooltip={showGrid ? `Grille ${gridSize}px (Ctrl+G)` : 'Afficher grille (Ctrl+G)'}
                        onDoubleClick={() => setGridSize(s => s === 24 ? 16 : s === 16 ? 32 : s === 32 ? 48 : 24)}
                    >
                        <Grid3X3 />
                    </button>
                    {/* §764 — Canvas background pattern selector */}
                    <div className="relative group">
                        <button
                            onClick={() => {
                                const patterns: Array<'dots' | 'lines' | 'cross' | 'grid' | 'none'> = ['dots', 'lines', 'cross', 'grid', 'none'];
                                const currentIndex = patterns.indexOf(canvasBgPattern);
                                const nextIndex = (currentIndex + 1) % patterns.length;
                                setCanvasBgPattern(patterns[nextIndex]);
                                toast.success(`Fond: ${patterns[nextIndex]}`);
                            }}
                            className="cms-tool-btn-enhanced"
                            data-tooltip={`Fond: ${canvasBgPattern}`}
                        >
                            <div className="cms-bg-pattern-icon" data-pattern={canvasBgPattern}>
                                {canvasBgPattern === 'dots' && '•••'}
                                {canvasBgPattern === 'lines' && '≡≡≡'}
                                {canvasBgPattern === 'cross' && '+++'}
                                {canvasBgPattern === 'grid' && '▦'}
                                {canvasBgPattern === 'none' && '∅'}
                            </div>
                        </button>
                    </div>
                    <button
                        onClick={() => setDarkModePreview(d => !d)}
                        className={`cms-tool-btn-enhanced ${darkModePreview ? 'cms-tool-btn-enhanced--active' : ''}`}
                        data-tooltip={darkModePreview ? 'Mode clair (Ctrl+M)' : 'Mode sombre (Ctrl+M)'}
                    >
                        {darkModePreview ? <Sun /> : <Moon />}
                    </button>
                    <button
                        onClick={() => setShowRulers(r => !r)}
                        className={`cms-tool-btn-enhanced ${showRulers ? 'cms-tool-btn-enhanced--active' : ''}`}
                        data-tooltip="Règles"
                    >
                        <Ruler />
                    </button>
                    <div className="cms-bottom-toolbar-enhanced__inline-sep" />
                    <button
                        onClick={() => setShowMinimap(m => !m)}
                        className={`cms-tool-btn-enhanced hidden sm:flex ${showMinimap ? 'cms-tool-btn-enhanced--active' : ''}`}
                        data-tooltip="Minimap"
                    >
                        <Map />
                    </button>
                    <button
                        onClick={() => setHoverToolbarEnabled(h => !h)}
                        className={`cms-tool-btn-enhanced hidden sm:flex ${hoverToolbarEnabled ? 'cms-tool-btn-enhanced--active' : ''}`}
                        data-tooltip="Toolbar survol"
                    >
                        <MousePointer />
                    </button>
                </div>

                <div className="cms-bottom-toolbar-enhanced__sep" />

                {/* Zoom slider + presets dropdown */}
                <div className="cms-toolbar-group-enhanced cms-toolbar-group-gap-sm">
                    <button onClick={() => setCanvasZoom(z => Math.max(25, z - 25))} className="cms-tool-btn-enhanced" data-tooltip="Zoom arrière (-)">
                        <ZoomOut />
                    </button>
                    <input
                        type="range" min={25} max={200} step={25} value={canvasZoom}
                        onChange={(e) => setCanvasZoom(parseInt(e.target.value))}
                        className="cms-zoom-slider-enhanced"
                        title={`Zoom: ${canvasZoom}%`}
                    />
                    <button onClick={() => setCanvasZoom(z => Math.min(200, z + 25))} className="cms-tool-btn-enhanced" data-tooltip="Zoom avant (+)">
                        <ZoomIn />
                    </button>
                    <div className="relative">
                        <button
                            onClick={() => setZoomDropdownOpen(o => !o)}
                            className="cms-zoom-pct-btn"
                            title="Presets de zoom"
                        >
                            {canvasZoom}%
                        </button>
                        {zoomDropdownOpen && (
                            <div className="cms-zoom-dropdown-pro cms-scale-enter">
                                <div className="cms-zoom-dropdown-pro__header">
                                    <span className="cms-zoom-dropdown-pro__title">Presets</span>
                                </div>
                                {[25, 50, 75, 100, 125, 150, 200].map(z => (
                                    <button
                                        key={z}
                                        onClick={() => { setCanvasZoom(z); setZoomDropdownOpen(false); }}
                                        className={`cms-zoom-dropdown-pro__preset ${canvasZoom === z ? 'cms-zoom-dropdown-pro__preset--active' : ''}`}
                                    >
                                        <span className="cms-zoom-dropdown-pro__value">{z}%</span>
                                        {z === 100 && <span className="cms-zoom-dropdown-pro__label">Normal</span>}
                                        {canvasZoom === z && <Check className="cms-zoom-dropdown-pro__check" />}
                                    </button>
                                ))}
                                <div className="cms-zoom-dropdown-pro__sep" />
                                <button onClick={() => { setCanvasZoom(100); setZoomDropdownOpen(false); }} className="cms-zoom-dropdown-pro__reset">
                                    <RotateCcw className="cms-zoom-dropdown-pro__reset-icon" />
                                    Réinitialiser
                                </button>
                            </div>
                        )}
                    </div>
                    {canvasZoom !== 100 && (
                        <button onClick={() => setCanvasZoom(100)} className="cms-tool-btn-enhanced" data-tooltip="Réinitialiser (Ctrl+0)">
                            <RotateCcw />
                        </button>
                    )}
                    {/* §764 — Zoom to fit button */}
                    <button onClick={zoomToFit} className="cms-tool-btn-enhanced" data-tooltip="Ajuster à l'écran">
                        <Maximize2 className="cms-icon--sm" />
                    </button>
                </div>

                <div className="cms-bottom-toolbar-enhanced__sep" />

                {/* Device quick switch avec labels + animated indicator */}
                <div className="cms-toolbar-group-enhanced hidden md:flex p-0.5 relative">
                    {([
                        { id: 'desktop' as const, icon: <MonitorIcon className="cms-device-icon-sm" />, label: 'Desktop', shortcut: '1' },
                        { id: 'tablet' as const, icon: <Tablet className="cms-device-icon-sm" />, label: 'Tablette', shortcut: '2' },
                        { id: 'mobile' as const, icon: <Smartphone className="cms-device-icon-sm" />, label: 'Mobile', shortcut: '3' },
                    ]).map(d => (
                        <button
                            key={d.id}
                            onClick={() => setDevicePreview(d.id)}
                            className={`cms-tool-btn-enhanced flex items-center gap-1 px-1.5 py-1 ${
                                devicePreview === d.id
                                    ? 'cms-tool-btn-enhanced--active'
                                    : ''
                            }`}
                            data-tooltip={`${d.label} (${d.shortcut})`}
                        >
                            {d.icon}
                            <span className="cms-editor-device-label">{d.label}</span>
                        </button>
                    ))}
                </div>

                {/* Spacer */}
                <div className="cms-bottom-toolbar-enhanced__spacer" />

                {/* Coordonnées scroll + info canvas (right side) */}
                <div className="cms-bottom-toolbar__info-group hidden lg:flex">
                    {(canvasScrollPos.x > 0 || canvasScrollPos.y > 0) && (
                        <span className="cms-toolbar-info-badge" title="Position scroll">
                            <Crosshair className="cms-toolbar-info-badge__icon" />
                            <span className="cms-toolbar-info-badge__value">{Math.round(canvasScrollPos.x)},{Math.round(canvasScrollPos.y)}</span>
                        </span>
                    )}
                    {canvasContentSize.height > 0 && (
                        <span className="cms-toolbar-info-badge" title="Taille du canvas">
                            <Maximize2 className="cms-toolbar-info-badge__icon" />
                            <span className="cms-toolbar-info-badge__value">{Math.round(canvasContentSize.width)}×{Math.round(canvasContentSize.height)}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* ═══ Canvas Minimap — vue d'ensemble navigable ═══ */}
            <CanvasMinimap
                puckData={puckData}
                zoom={canvasZoom}
                scrollPos={{ x: canvasScrollPos.x, y: canvasScrollPos.y }}
                contentSize={{ width: canvasContentSize.width, height: canvasContentSize.height }}
                viewportSize={{ width: 1200, height: 600 }}
                onScrollTo={(x, y) => {
                    if (canvasScrollRef.current) {
                        canvasScrollRef.current.scrollTo({ left: x, top: y, behavior: 'smooth' });
                    }
                }}
                onZoomChange={(z) => setCanvasZoom(z)}
                onZoomToFit={() => {
                    setCanvasZoom(75);
                    toast.success('Vue ajustée');
                }}
                selectedItemId={selectedItemId}
                onSelectSection={(id) => {
                    const el = document.querySelector(`[data-puck-component-id="${id}"]`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        (el as HTMLElement).click();
                    }
                }}
                dark={darkModePreview}
            />

            {/* ═══ Scrollbar Navigator — marqueurs de sections ═══ */}
            <ScrollbarNavigator
                puckData={puckData}
                scrollPos={{ x: canvasScrollPos.x, y: canvasScrollPos.y }}
                contentSize={{ width: canvasContentSize.width, height: canvasContentSize.height }}
                viewportHeight={600}
                onScrollTo={(y) => {
                    if (canvasScrollRef.current) {
                        canvasScrollRef.current.scrollTo({ top: y, behavior: 'smooth' });
                    }
                }}
                selectedItemId={selectedItemId}
                dark={darkModePreview}
            />

            {/* ═══ Quick Actions Bar — barre flottante ═══ */}
            <QuickActionsBar
                onSave={handleSave}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                showGrid={showGrid}
                onToggleGrid={() => setShowGrid(g => !g)}
                showRulers={showRulers}
                onToggleRulers={() => setShowRulers(r => !r)}
                darkMode={darkModePreview}
                onToggleDarkMode={() => setDarkModePreview(d => !d)}
                device={devicePreview}
                onDeviceChange={(d) => setDevicePreview(d)}
                zoom={canvasZoom}
                onZoomIn={() => setCanvasZoom(z => Math.min(200, z + 10))}
                onZoomOut={() => setCanvasZoom(z => Math.max(25, z - 10))}
                onZoomReset={() => setCanvasZoom(100)}
                onToggleFocus={toggleFocus}
                onZoomToFit={() => setCanvasZoom(75)}
                hasChanges={hasChanges}
            />

            {/* Link Editor Modal */}
            <LinkEditorModal
                open={linkEditorOpen}
                onClose={() => setLinkEditorOpen(false)}
                value={linkEditorValue}
                onChange={(url) => {
                    if (linkEditorItemId) {
                        const newData = {
                            ...puckData,
                            content: puckData.content.map(item => {
                                if ((item.props as any)?.id === linkEditorItemId) {
                                    return { ...item, props: { ...item.props, lien: url } };
                                }
                                return item;
                            }),
                        };
                        setUndoStack(prev => [...prev.slice(-19), puckData]);
                        setRedoStack([]);
                        setPuckData(newData);
                        bumpPuckEpoch();
                        setHasChanges(true);
                    }
                }}
                target={linkEditorTarget}
                onTargetChange={(t) => setLinkEditorTarget(t)}
            />
        </div>
    );
}

// ==================================
// Section Navigator v2 — Panneau latéral amélioré
// ==================================

const SECTION_TYPE_ICONS: Record<string, string> = {
    HeroSection: '🏔', HeroVideoSection: '🎬', TexteSection: '📝', GalerieSection: '🖼',
    GalerieMasonrySection: '🎨', CarouselSection: '🎠', VideoSection: '▶️',
    TelechargementsSection: '📥', ActualitesSection: '📰', HtmlCustomSection: '💻',
    TemoignagesSection: '💬', TemoignageCarouselSection: '💬', EquipeSection: '👥',
    PartenairesSection: '🤝', CarteInfosSection: '📋', ChiffresClesSection: '🔢',
    CompteursAnimesSection: '📊', CarteSection: '🃏', HorairesSection: '🕐',
    FaqSection: '❓', TimelineSection: '📅', TabsSection: '📑',
    IconeFeaturesSection: '✨', PrixTabSection: '💰', FormulaireSection: '📝',
    AppelActionSection: '📢', NewsletterSection: '📧', SeparateurSection: '─',
};

// Couleurs par catégorie de section
const SECTION_TYPE_COLORS: Record<string, string> = {
    HeroSection: 'bg-blue-100 text-blue-700', HeroVideoSection: 'bg-indigo-100 text-indigo-700',
    TexteSection: 'bg-gray-100 text-gray-700', GalerieSection: 'bg-pink-100 text-pink-700',
    GalerieMasonrySection: 'bg-pink-100 text-pink-700', CarouselSection: 'bg-purple-100 text-purple-700',
    VideoSection: 'bg-red-100 text-red-700', TelechargementsSection: 'bg-orange-100 text-orange-700',
    ActualitesSection: 'bg-yellow-100 text-yellow-700', HtmlCustomSection: 'bg-slate-100 text-slate-700',
    TemoignagesSection: 'bg-green-100 text-green-700', TemoignageCarouselSection: 'bg-green-100 text-green-700',
    EquipeSection: 'bg-teal-100 text-teal-700', PartenairesSection: 'bg-emerald-100 text-emerald-700',
    CarteInfosSection: 'bg-amber-100 text-amber-700', ChiffresClesSection: 'bg-cyan-100 text-cyan-700',
    CompteursAnimesSection: 'bg-cyan-100 text-cyan-700', CarteSection: 'bg-amber-100 text-amber-700',
    HorairesSection: 'bg-violet-100 text-violet-700', FaqSection: 'bg-lime-100 text-lime-700',
    TimelineSection: 'bg-sky-100 text-sky-700', TabsSection: 'bg-fuchsia-100 text-fuchsia-700',
    IconeFeaturesSection: 'bg-rose-100 text-rose-700', PrixTabSection: 'bg-orange-100 text-orange-700',
    FormulaireSection: 'bg-blue-100 text-blue-700', AppelActionSection: 'bg-red-100 text-red-700',
    NewsletterSection: 'bg-purple-100 text-purple-700', SeparateurSection: 'bg-gray-100 text-gray-500',
};

function SectionNavigator({ puckData, selectedItemId, onSelect, onToggleVisibility, onReorder }: {
    puckData: Data;
    selectedItemId: string | null;
    onSelect: (id: string) => void;
    onToggleVisibility?: (id: string) => void;
    onReorder?: (fromIndex: number, toIndex: number) => void;
}) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string | null>(null);
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);
    // Multi-select state
    const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
    const [lastClickedId, setLastClickedId] = useState<string | null>(null);

    const sections = puckData.content.map((item, index) => ({
        id: (item.props as any)?.id || `item-${index}`,
        type: item.type,
        label: (item.props as any)?.titre || (item.props as any)?.surtitre || (item.props as any)?.html?.substring(0, 30) || item.type.replace(/Section$/, ''),
        icon: SECTION_TYPE_ICONS[item.type] || '📦',
        colorClass: SECTION_TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-600',
        index,
    }));

    // Filtrage par recherche et type
    const filteredSections = sections.filter(s => {
        const matchesSearch = !searchQuery || s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !filterType || s.type === filterType;
        return matchesSearch && matchesType;
    });

    // Types uniques pour le filtre
    const uniqueTypes = [...new Set(sections.map(s => s.type))];

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
        // Style pendant le drag
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        setDragIndex(null);
        setDropIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDropIndex(index);
    };

    const handleDrop = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== toIndex && onReorder) {
            onReorder(dragIndex, toIndex);
        }
        setDragIndex(null);
        setDropIndex(null);
    };

    // Multi-select handler — Shift+Click for range, Ctrl/Cmd+Click for toggle
    const handleSectionClick = (sectionId: string, sectionIndex: number, e: React.MouseEvent) => {
        if (e.shiftKey && lastClickedId) {
            // Range selection
            const allIds = filteredSections.map(s => s.id);
            const startIdx = allIds.indexOf(lastClickedId);
            const endIdx = allIds.indexOf(sectionId);
            if (startIdx !== -1 && endIdx !== -1) {
                const min = Math.min(startIdx, endIdx);
                const max = Math.max(startIdx, endIdx);
                const rangeIds = allIds.slice(min, max + 1);
                setMultiSelectedIds(prev => new Set([...prev, ...rangeIds]));
            }
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle selection
            setMultiSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(sectionId)) {
                    next.delete(sectionId);
                } else {
                    next.add(sectionId);
                }
                return next;
            });
            setLastClickedId(sectionId);
        } else {
            // Single selection — clear multi-select
            setMultiSelectedIds(new Set());
            setLastClickedId(sectionId);
            onSelect(sectionId);
        }
    };

    // Clear multi-select on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && multiSelectedIds.size > 0) {
                setMultiSelectedIds(new Set());
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [multiSelectedIds.size]);

    if (sections.length === 0) {
        return (
            <div className="cms-section-nav__empty">
                <LayoutGrid className="cms-section-nav__empty-icon" />
                <p className="cms-section-nav__empty-title">Aucune section</p>
                <p className="cms-section-nav__empty-desc">Ajoutez des composants depuis la bibliothèque</p>
            </div>
        );
    }

    return (
        <div className="cms-section-nav">
            {/* Barre de recherche + filtre */}
            <div className="cms-section-nav__header">
                {/* Recherche */}
                <div className="cms-section-nav__search-wrap">
                    <Search className="cms-section-nav__search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une section..."
                        className="cms-section-nav__search-input"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="cms-section-nav__search-clear">
                            <X />
                        </button>
                    )}
                </div>
                {/* Filtre par type + compteur */}
                <div className="cms-section-nav__filter-row">
                    <div className="cms-section-nav__filter-group">
                        <Filter className="cms-section-nav__filter-icon" />
                        <select
                            value={filterType || ''}
                            onChange={(e) => setFilterType(e.target.value || null)}
                            className="cms-section-nav__filter-select"
                        >
                            <option value="">Tous les types</option>
                            {uniqueTypes.map(t => (
                                <option key={t} value={t}>{SECTION_TYPE_ICONS[t] || '📦'} {t.replace(/Section$/, '')}</option>
                            ))}
                        </select>
                    </div>
                    <span className="cms-section-nav__counter">
                        {multiSelectedIds.size > 0 ? (
                            <span className="cms-multi-select-badge">
                                {multiSelectedIds.size} sélectionnée{multiSelectedIds.size !== 1 ? 's' : ''}
                            </span>
                        ) : (
                            <>{filteredSections.length}/{sections.length} section{sections.length !== 1 ? 's' : ''}</>
                        )}
                    </span>
                </div>
            </div>

            {/* Liste des sections (scrollable + drag-drop) */}
            <div className="cms-section-nav__list">
                {filteredSections.length === 0 && (
                    <div className="cms-section-nav__list-empty">
                        <p className="cms-section-nav__list-empty-text">Aucun résultat pour "{searchQuery}"</p>
                    </div>
                )}
                {filteredSections.map((section) => {
                    const isSelected = selectedItemId === section.id;
                    const isDragging = dragIndex === section.index;
                    const isDropTarget = dropIndex === section.index;
                    return (
                        <button
                            key={section.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, section.index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, section.index)}
                            onDrop={(e) => handleDrop(e, section.index)}
                            onClick={(e) => handleSectionClick(section.id, section.index, e)}
                            className={`cms-section-nav__item ${isSelected ? 'cms-section-nav__item--selected' : ''} ${isDragging ? 'cms-section-nav__item--dragging' : ''} ${isDropTarget && dragIndex !== null ? 'cms-section-nav__item--drop-target' : ''} ${multiSelectedIds.has(section.id) ? 'cms-section-nav__item--multi-selected' : ''}`}
                        >
                            {/* Drag handle */}
                            <GripVertical className="cms-section-nav__item-handle" />
                            {/* Preview Thumbnail */}
                            <SectionPreviewThumbnail
                                type={section.type}
                                props={puckData.content[section.index]?.props as Record<string, any> || {}}
                                width={48}
                                height={28}
                                selected={isSelected}
                            />
                            {/* Info */}
                            <div className="cms-section-nav__item-info">
                                <p className="cms-section-nav__item-label">
                                    {section.label}
                                </p>
                                <div className="cms-section-nav__item-meta">
                                    <span className="cms-section-nav__item-meta-index">
                                        #{section.index + 1}
                                    </span>
                                    <span className="cms-section-nav__item-meta-sep">·</span>
                                    <span className="cms-section-nav__item-meta-type">
                                        {section.type.replace(/Section$/, '')}
                                    </span>
                                </div>
                            </div>
                            {/* Actions rapides */}
                            <div className="cms-section-nav__item-actions">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelect(section.id); }}
                                    className={`cms-section-nav__item-action-btn ${isSelected ? 'cms-section-nav__item-action-btn--selected' : ''}`}
                                    title="Éditer le style"
                                >
                                    <Pencil />
                                </button>
                                {onToggleVisibility && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onToggleVisibility(section.id); }}
                                        className="cms-section-nav__item-action-btn"
                                        title="Basculer visibilité"
                                    >
                                        <Eye />
                                    </button>
                                )}
                            </div>
                            {/* Indicateur sélection */}
                            {isSelected && (
                                <div className="cms-section-nav__item-dot" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer avec résumé */}
            {sections.length > 0 && (
                <div className="cms-section-nav__footer">
                    <div className="cms-section-nav__footer-row">
                        <span>{sections.length} section{sections.length !== 1 ? 's' : ''} au total</span>
                        <span>{uniqueTypes.length} type{uniqueTypes.length !== 1 ? 's' : ''} utilisé{uniqueTypes.length !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================================
// Canvas Rulers — Règles pixel améliorées (haut + gauche)
// ==================================

function CanvasRulers({ zoom, dark }: { zoom: number; dark: boolean }) {
    const rulerSize = 22;
    const tickColor = dark ? 'rgba(148,163,184,0.35)' : 'rgba(100,116,139,0.25)';
    const tickColorMajor = dark ? 'rgba(148,163,184,0.5)' : 'rgba(100,116,139,0.4)';
    const textColor = dark ? 'rgba(148,163,184,0.6)' : 'rgba(100,116,139,0.55)';
    const bgColor = dark ? 'rgba(15,23,42,0.92)' : 'rgba(248,250,252,0.92)';
    const borderColor = dark ? 'rgba(51,65,85,0.4)' : 'rgba(226,232,240,0.7)';
    const cursorColor = dark ? 'rgba(96,165,250,0.6)' : 'rgba(59,130,246,0.5)';

    // Espacement dynamique des ticks selon le zoom
    const getTickSpacing = () => {
        if (zoom >= 200) return 25;
        if (zoom >= 150) return 50;
        if (zoom >= 100) return 100;
        if (zoom >= 75) return 100;
        if (zoom >= 50) return 200;
        return 500;
    };

    const spacing = getTickSpacing();
    const maxMarks = 80;
    const [mousePos, setMousePos] = React.useState<{ x: number; y: number } | null>(null);

    // Suivi de la position de la souris pour l'indicateur sur les règles
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handler, { passive: true });
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    return (
        <>
            {/* CSS inline pour les règles */}
            <style>{`
                .cms-ruler-v2 { position: absolute; z-index: 15; pointer-events: none; backdrop-filter: blur(4px); }
                .cms-ruler-v2 svg { display: block; }
                .cms-ruler-v2-h { top: 0; left: ${rulerSize}px; right: 0; height: ${rulerSize}px; }
                .cms-ruler-v2-v { left: 0; top: ${rulerSize}px; bottom: 0; width: ${rulerSize}px; }
                .cms-ruler-v2-corner { top: 0; left: 0; width: ${rulerSize}px; height: ${rulerSize}px; z-index: 16; }
            `}</style>

            {/* Coin (intersection) */}
            <div
                className="cms-ruler-v2 cms-ruler-v2-corner"
                style={{
                    backgroundColor: bgColor,
                    borderBottom: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderRadius: '0 0 4px 0',
                }}
            >
                {/* Icône croix dans le coin */}
                <svg width={rulerSize} height={rulerSize} style={{ position: 'absolute', inset: 0 }}>
                    <line x1="6" y1={rulerSize / 2} x2={rulerSize - 6} y2={rulerSize / 2} stroke={tickColor} strokeWidth="0.5" />
                    <line x1={rulerSize / 2} y1="6" x2={rulerSize / 2} y2={rulerSize - 6} stroke={tickColor} strokeWidth="0.5" />
                </svg>
            </div>

            {/* Règle horizontale (haut) */}
            <div
                className="cms-ruler-v2 cms-ruler-v2-h"
                style={{ backgroundColor: bgColor, borderBottom: `1px solid ${borderColor}` }}
            >
                <svg width="100%" height={rulerSize}>
                    {Array.from({ length: maxMarks }, (_, i) => {
                        const x = (i * spacing * zoom) / 100;
                        const isMajor = i % 5 === 0;
                        const isMid = i % 2 === 0 && !isMajor;
                        const tickH = isMajor ? 11 : isMid ? 7 : 4;
                        return (
                            <g key={`h-${i}`}>
                                <line
                                    x1={x} y1={rulerSize - tickH} x2={x} y2={rulerSize}
                                    stroke={isMajor ? tickColorMajor : tickColor}
                                    strokeWidth={isMajor ? 1 : 0.5}
                                />
                                {isMajor && (
                                    <text
                                        x={x + 3}
                                        y={rulerSize - tickH - 2}
                                        fill={textColor}
                                        fontSize="8"
                                        fontFamily="ui-monospace, monospace"
                                        fontWeight="500"
                                    >
                                        {i * spacing}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {/* Indicateur de position souris (ligne verticale) */}
                    {mousePos && (
                        <line
                            x1={mousePos.x}
                            y1={0}
                            x2={mousePos.x}
                            y2={rulerSize}
                            stroke={cursorColor}
                            strokeWidth="1"
                            strokeDasharray="2,1"
                        />
                    )}
                </svg>
            </div>

            {/* Règle verticale (gauche) */}
            <div
                className="cms-ruler-v2 cms-ruler-v2-v"
                style={{ backgroundColor: bgColor, borderRight: `1px solid ${borderColor}` }}
            >
                <svg width={rulerSize} height="100%">
                    {Array.from({ length: maxMarks }, (_, i) => {
                        const y = (i * spacing * zoom) / 100;
                        const isMajor = i % 5 === 0;
                        const isMid = i % 2 === 0 && !isMajor;
                        const tickW = isMajor ? 11 : isMid ? 7 : 4;
                        return (
                            <g key={`v-${i}`}>
                                <line
                                    x1={rulerSize - tickW} y1={y} x2={rulerSize} y2={y}
                                    stroke={isMajor ? tickColorMajor : tickColor}
                                    strokeWidth={isMajor ? 1 : 0.5}
                                />
                                {isMajor && (
                                    <text
                                        x={rulerSize - tickW - 2}
                                        y={y + 3}
                                        fill={textColor}
                                        fontSize="8"
                                        fontFamily="ui-monospace, monospace"
                                        fontWeight="500"
                                        textAnchor="end"
                                    >
                                        {i * spacing}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                    {/* Indicateur de position souris (ligne horizontale) */}
                    {mousePos && (
                        <line
                            x1={0}
                            y1={mousePos.y}
                            x2={rulerSize}
                            y2={mousePos.y}
                            stroke={cursorColor}
                            strokeWidth="1"
                            strokeDasharray="2,1"
                        />
                    )}
                </svg>
            </div>
        </>
    );
}

// ==================================
// Quick Style Actions — Actions rapides inline dans le canvas
// ==================================

function QuickStyleActions({ selectedItemId, puckData, onPuckChange }: {
    selectedItemId: string | null;
    puckData: Data;
    onPuckChange: (data: Data) => void;
}) {
    const currentStyle = useMemo(() => {
        if (!selectedItemId) return null;
        const item = puckData.content.find(i => (i.props as any)?.id === selectedItemId);
        return (item?.props as any)?.styleConfig || null;
    }, [selectedItemId, puckData]);

    const updateStyle = useCallback((partial: Record<string, any>) => {
        if (!selectedItemId) return;
        const newData = {
            ...puckData,
            content: puckData.content.map(item => {
                if ((item.props as any)?.id === selectedItemId) {
                    const current = (item.props as any)?.styleConfig || {};
                    return { ...item, props: { ...item.props, styleConfig: { ...current, ...partial } } };
                }
                return item;
            }),
        };
        onPuckChange(newData);
    }, [selectedItemId, puckData, onPuckChange]);

    if (!currentStyle) return null;

    const bg = currentStyle.background || {};
    const typo = currentStyle.typography || {};

    return (
        <div className="cms-toolbar-group-compact">
            {/* Fond rapide */}
            <div className="cms-quick-style-group" title="Fond rapide">
                <button onClick={() => updateStyle({ background: { ...bg, type: 'color', color: '#ffffff' } })} className="cms-quick-swatch" style={{ backgroundColor: '#ffffff' }} title="Fond blanc" />
                <button onClick={() => updateStyle({ background: { ...bg, type: 'color', color: '#f8fafc' } })} className="cms-quick-swatch" style={{ backgroundColor: '#f8fafc' }} title="Fond gris clair" />
                <button onClick={() => updateStyle({ background: { ...bg, type: 'color', color: '#111827' } })} className="cms-quick-swatch" style={{ backgroundColor: '#111827' }} title="Fond sombre" />
                <button onClick={() => updateStyle({ background: { ...bg, type: 'color', color: '#2563eb' } })} className="cms-quick-swatch" style={{ backgroundColor: '#2563eb' }} title="Fond bleu" />
                <button onClick={() => updateStyle({ background: { ...bg, type: 'gradient', gradientFrom: '#1e40af', gradientTo: '#7c3aed', gradientDirection: 'to-br' } })} className="cms-quick-swatch" style={{ background: 'linear-gradient(to bottom right, #1e40af, #7c3aed)' }} title="Dégradé bleu-violet" />
                <button onClick={() => updateStyle({ background: { ...bg, type: 'gradient', gradientFrom: '#dc2626', gradientTo: '#f59e0b', gradientDirection: 'to-r' } })} className="cms-quick-swatch" style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b)' }} title="Dégradé coucher de soleil" />
            </div>
            {/* Texte rapide */}
            <div className="cms-quick-style-group" title="Texte rapide">
                <button onClick={() => updateStyle({ typography: { ...typo, color: '#ffffff' } })} className="cms-quick-text-btn" style={{ backgroundColor: '#1f2937', color: '#ffffff' }} title="Texte blanc">A</button>
                <button onClick={() => updateStyle({ typography: { ...typo, color: '#111827' } })} className="cms-quick-text-btn" style={{ backgroundColor: '#ffffff', color: '#111827' }} title="Texte noir">A</button>
                <button onClick={() => updateStyle({ typography: { ...typo, color: '#2563eb' } })} className="cms-quick-text-btn" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }} title="Texte bleu">A</button>
            </div>
        </div>
    );
}



// ==================================
// §771 — Quick Actions Context Menu
// ==================================

interface ContextMenuProps {
    x: number;
    y: number;
    sectionId: string;
    sectionType: string;
    sectionIndex: number;
    totalSections: number;
    onClose: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onEditStyle: () => void;
    onEditContent: () => void;
    onCopyStyle: () => void;
    onPasteStyle: () => void;
    onResetStyle: () => void;
    onHide: () => void;
    onLock: () => void;
}

function QuickActionsContextMenu({
    x, y, sectionType, sectionIndex, totalSections,
    onClose, onDuplicate, onDelete, onMoveUp, onMoveDown,
    onEditStyle, onEditContent, onCopyStyle, onPasteStyle,
    onResetStyle, onHide, onLock,
}: ContextMenuProps) {
    const menuRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    // Ajuster la position pour rester dans le viewport
    const adjustedStyle: React.CSSProperties = {
        position: 'fixed' as const,
        left: Math.min(x, window.innerWidth - 240),
        top: Math.min(y, window.innerHeight - 400),
        zIndex: 9999,
    };

    const label = COMPONENT_LABELS?.[sectionType] || sectionType?.replace(/Section$/, '') || 'Section';

    return (
        <div ref={menuRef} className="cms-context-menu cms-content-enter" style={adjustedStyle}>
            {/* Header */}
            <div className="cms-context-menu__header">
                <span className="cms-context-menu__header-icon">
                    {sectionType === 'HeroSection' ? '🏔' : sectionType === 'TexteSection' ? '📝' : '📦'}
                </span>
                <div className="cms-context-menu__header-info">
                    <span className="cms-context-menu__header-title">{label}</span>
                    <span className="cms-context-menu__header-subtitle">#{sectionIndex + 1} sur {totalSections}</span>
                </div>
            </div>

            {/* Section: Édition */}
            <div className="cms-context-menu__group">
                <div className="cms-context-menu__group-label">Édition</div>
                <button onClick={() => { onEditContent(); onClose(); }} className="cms-context-menu__item">
                    <Pencil className="cms-context-menu__item-icon" />
                    <span>Modifier le contenu</span>
                    <kbd className="cms-context-menu__item-kbd">E</kbd>
                </button>
                <button onClick={() => { onEditStyle(); onClose(); }} className="cms-context-menu__item">
                    <Palette className="cms-context-menu__item-icon" />
                    <span>Modifier le style</span>
                    <kbd className="cms-context-menu__item-kbd">S</kbd>
                </button>
            </div>

            {/* Section: Organisation */}
            <div className="cms-context-menu__group">
                <div className="cms-context-menu__group-label">Organisation</div>
                <button onClick={() => { onDuplicate(); onClose(); }} className="cms-context-menu__item" disabled={false}>
                    <CopyPlus className="cms-context-menu__item-icon" />
                    <span>Dupliquer</span>
                    <kbd className="cms-context-menu__item-kbd">Ctrl+D</kbd>
                </button>
                <button onClick={() => { onMoveUp(); onClose(); }} className="cms-context-menu__item" disabled={sectionIndex === 0}>
                    <ArrowUp className="cms-context-menu__item-icon" />
                    <span>Monter</span>
                    <kbd className="cms-context-menu__item-kbd">↑</kbd>
                </button>
                <button onClick={() => { onMoveDown(); onClose(); }} className="cms-context-menu__item" disabled={sectionIndex === totalSections - 1}>
                    <ArrowDown className="cms-context-menu__item-icon" />
                    <span>Descendre</span>
                    <kbd className="cms-context-menu__item-kbd">↓</kbd>
                </button>
            </div>

            {/* Section: Style */}
            <div className="cms-context-menu__group">
                <div className="cms-context-menu__group-label">Style</div>
                <button onClick={() => { onCopyStyle(); onClose(); }} className="cms-context-menu__item">
                    <ClipboardCopy className="cms-context-menu__item-icon" />
                    <span>Copier le style</span>
                </button>
                <button onClick={() => { onPasteStyle(); onClose(); }} className="cms-context-menu__item">
                    <ClipboardPaste className="cms-context-menu__item-icon" />
                    <span>Coller le style</span>
                </button>
                <button onClick={() => { onResetStyle(); onClose(); }} className="cms-context-menu__item cms-context-menu__item--danger">
                    <RotateCcw className="cms-context-menu__item-icon" />
                    <span>Réinitialiser</span>
                </button>
            </div>

            {/* Section: Visibility */}
            <div className="cms-context-menu__group">
                <div className="cms-context-menu__group-label">Visibilité</div>
                <button onClick={() => { onHide(); onClose(); }} className="cms-context-menu__item">
                    <EyeOff className="cms-context-menu__item-icon" />
                    <span>Masquer</span>
                </button>
                <button onClick={() => { onLock(); onClose(); }} className="cms-context-menu__item">
                    <Lock className="cms-context-menu__item-icon" />
                    <span>Verrouiller</span>
                </button>
            </div>

            {/* Section: Danger */}
            <div className="cms-context-menu__divider" />
            <button onClick={() => { onDelete(); onClose(); }} className="cms-context-menu__item cms-context-menu__item--danger cms-context-menu__item--full">
                <Trash2 className="cms-context-menu__item-icon" />
                <span>Supprimer la section</span>
                <kbd className="cms-context-menu__item-kbd">Suppr</kbd>
            </button>
        </div>
    );
}

// ==================================
// §776 — Phase 90: Advanced Rulers System
// ==================================

interface AdvancedRulersProps {
    canvasWidth: number;
    canvasHeight: number;
    zoom: number;
    scrollX: number;
    scrollY: number;
    markers?: Array<{ position: number; orientation: 'horizontal' | 'vertical'; label?: string }>;
}

function AdvancedRulers({ canvasWidth, canvasHeight, zoom, scrollX, scrollY, markers = [] }: AdvancedRulersProps) {
    const horizontalTicks = React.useMemo(() => {
        const ticks = [];
        const step = 50;
        const visibleWidth = canvasWidth * zoom;
        for (let i = 0; i <= visibleWidth; i += step) {
            const isMajor = i % 200 === 0;
            const isMedium = i % 100 === 0;
            ticks.push({
                position: i,
                type: isMajor ? 'major' : isMedium ? 'medium' : 'minor',
                label: isMajor ? `${Math.round(i / zoom)}` : undefined,
            });
        }
        return ticks;
    }, [canvasWidth, zoom]);

    const verticalTicks = React.useMemo(() => {
        const ticks = [];
        const step = 50;
        const visibleHeight = canvasHeight * zoom;
        for (let i = 0; i <= visibleHeight; i += step) {
            const isMajor = i % 200 === 0;
            const isMedium = i % 100 === 0;
            ticks.push({
                position: i,
                type: isMajor ? 'major' : isMedium ? 'medium' : 'minor',
                label: isMajor ? `${Math.round(i / zoom)}` : undefined,
            });
        }
        return ticks;
    }, [canvasHeight, zoom]);

    return (
        <>
            {/* Horizontal ruler */}
            <div className="cms-ruler-container cms-ruler-container--horizontal">
                <div className="cms-ruler">
                    <div className="cms-ruler__ticks">
                        {horizontalTicks.map((tick, i) => (
                            <div
                                key={`h-${i}`}
                                className={`cms-ruler__tick cms-ruler__tick--${tick.type}`}
                                style={{ left: tick.position - scrollX }}
                            />
                        ))}
                    </div>
                    <div className="cms-ruler__labels">
                        {horizontalTicks.filter(t => t.label).map((tick, i) => (
                            <span
                                key={`hl-${i}`}
                                className="cms-ruler__label"
                                style={{ left: tick.position - scrollX }}
                            >
                                {tick.label}
                            </span>
                        ))}
                    </div>
                    {markers.filter(m => m.orientation === 'horizontal').map((marker, i) => (
                        <div
                            key={`hm-${i}`}
                            className="cms-ruler__marker"
                            style={{ left: marker.position * zoom - scrollX }}
                        >
                            {marker.label && <span className="cms-ruler__marker-label">{marker.label}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Vertical ruler */}
            <div className="cms-ruler-container cms-ruler-container--vertical">
                <div className="cms-ruler cms-ruler--vertical">
                    <div className="cms-ruler__ticks">
                        {verticalTicks.map((tick, i) => (
                            <div
                                key={`v-${i}`}
                                className={`cms-ruler__tick cms-ruler__tick--${tick.type}`}
                                style={{ top: tick.position - scrollY }}
                            />
                        ))}
                    </div>
                    <div className="cms-ruler__labels">
                        {verticalTicks.filter(t => t.label).map((tick, i) => (
                            <span
                                key={`vl-${i}`}
                                className="cms-ruler__label"
                                style={{ top: tick.position - scrollY }}
                            >
                                {tick.label}
                            </span>
                        ))}
                    </div>
                    {markers.filter(m => m.orientation === 'vertical').map((marker, i) => (
                        <div
                            key={`vm-${i}`}
                            className="cms-ruler__marker"
                            style={{ top: marker.position * zoom - scrollY }}
                        >
                            {marker.label && <span className="cms-ruler__marker-label">{marker.label}</span>}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

// ==================================
// §777 — Phase 91: Mini-map Navigation
// ==================================

interface MiniMapProps {
    sections: Array<{ id: string; type: string; height: number }>;
    canvasHeight: number;
    viewportHeight: number;
    scrollTop: number;
    zoom: number;
    onNavigate: (scrollTop: number) => void;
    visible?: boolean;
}

function MiniMap({ sections, canvasHeight, viewportHeight, scrollTop, zoom, onNavigate, visible = true }: MiniMapProps) {
    const minimapRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const scale = 120 / canvasHeight;
    const viewportHeightScaled = viewportHeight * scale;
    const scrollTopScaled = scrollTop * scale;

    const handleClick = (e: React.MouseEvent) => {
        if (!minimapRef.current || isDragging) return;
        const rect = minimapRef.current.getBoundingClientRect();
        const clickY = e.clientY - rect.top;
        const targetScroll = (clickY / scale) - (viewportHeight / 2);
        onNavigate(Math.max(0, Math.min(targetScroll, canvasHeight - viewportHeight)));
    };

    if (!visible) return null;

    return (
        <div
            ref={minimapRef}
            className="cms-minimap"
            onClick={handleClick}
        >
            <div className="cms-minimap__canvas">
                {sections.map((section, i) => {
                    let top = 0;
                    for (let j = 0; j < i; j++) {
                        top += sections[j].height + 16;
                    }
                    return (
                        <div
                            key={section.id}
                            className="cms-minimap__section"
                            style={{
                                top: top * scale,
                                left: 8,
                                right: 8,
                                height: Math.max(4, section.height * scale),
                            }}
                            title={`${section.type} (${section.height}px)`}
                        />
                    );
                })}
                <div
                    className="cms-minimap__viewport"
                    style={{
                        top: scrollTopScaled,
                        left: 4,
                        right: 4,
                        height: viewportHeightScaled,
                    }}
                >
                    <div className="cms-minimap__viewport-handle cms-minimap__viewport-handle--nw" />
                    <div className="cms-minimap__viewport-handle cms-minimap__viewport-handle--ne" />
                    <div className="cms-minimap__viewport-handle cms-minimap__viewport-handle--sw" />
                    <div className="cms-minimap__viewport-handle cms-minimap__viewport-handle--se" />
                </div>
            </div>
            <div className="cms-minimap__zoom-indicator">{Math.round(zoom * 100)}%</div>
        </div>
    );
}

// ==================================
// §778 — Phase 92: Button Style Gallery
// ==================================

interface ButtonStyleGalleryProps {
    selectedStyle?: string;
    onSelect: (style: string) => void;
}

function ButtonStyleGallery({ selectedStyle, onSelect }: ButtonStyleGalleryProps) {
    const buttonStyles = [
        { id: 'primary', label: 'Primaire', bg: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', radius: '8px' },
        { id: 'secondary', label: 'Secondaire', bg: 'linear-gradient(135deg, #64748b, #475569)', color: 'white', radius: '8px' },
        { id: 'success', label: 'Succès', bg: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', radius: '8px' },
        { id: 'danger', label: 'Danger', bg: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', radius: '8px' },
        { id: 'warning', label: 'Attention', bg: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', radius: '8px' },
        { id: 'outline', label: 'Contour', bg: 'transparent', color: '#3b82f6', radius: '8px', border: '2px solid #3b82f6' },
        { id: 'ghost', label: 'Fantôme', bg: 'transparent', color: '#3b82f6', radius: '8px' },
        { id: 'rounded', label: 'Arrondi', bg: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: 'white', radius: '999px' },
    ];

    return (
        <div className="cms-button-gallery">
            {buttonStyles.map(style => (
                <button
                    key={style.id}
                    className={`cms-button-gallery__item ${selectedStyle === style.id ? 'cms-button-gallery__item--selected' : ''}`}
                    onClick={() => onSelect(style.id)}
                >
                    <div
                        className="cms-button-gallery__preview"
                        style={{
                            background: style.bg,
                            color: style.color,
                            borderRadius: style.radius,
                            border: style.border || 'none',
                        }}
                    >
                        Bouton
                    </div>
                    <span className="cms-button-gallery__label">{style.label}</span>
                    <div className="cms-button-gallery__check">
                        <Check className="cms-icon--xs" />
                    </div>
                </button>
            ))}
        </div>
    );
}

// ==================================
// §781 — Phase 95: Section Clone Panel
// ==================================

interface SectionClonePanelProps {
    sections: Array<{ id: string; type: string; title: string; pageId: string; pageTitle: string }>;
    onClone: (sectionId: string) => void;
    onClose: () => void;
    visible: boolean;
}

function SectionClonePanel({ sections, onClone, onClose, visible }: SectionClonePanelProps) {
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredSections = React.useMemo(() => {
        if (!searchQuery) return sections;
        const query = searchQuery.toLowerCase();
        return sections.filter(s =>
            s.title.toLowerCase().includes(query) ||
            s.type.toLowerCase().includes(query) ||
            s.pageTitle.toLowerCase().includes(query)
        );
    }, [sections, searchQuery]);

    if (!visible) return null;

    return (
        <div className="cms-clone-panel">
            <div className="cms-clone-panel__header">
                <div className="cms-clone-panel__title">
                    <Copy className="cms-icon--sm" />
                    Cloner une section
                </div>
                <button className="cms-clone-panel__close" onClick={onClose}>
                    <X className="cms-icon--xs" />
                </button>
            </div>
            <div className="cms-clone-panel__search">
                <input
                    type="text"
                    className="cms-clone-panel__search-input"
                    placeholder="Rechercher une section..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="cms-clone-panel__list">
                {filteredSections.length === 0 ? (
                    <div className="cms-clone-panel__empty">
                        <Search className="cms-clone-panel__empty-icon" />
                        <div className="cms-clone-panel__empty-title">Aucune section trouvée</div>
                        <div className="cms-clone-panel__empty-text">Essayez avec d'autres termes de recherche</div>
                    </div>
                ) : (
                    filteredSections.map(section => (
                        <button
                            key={section.id}
                            className="cms-clone-panel__item"
                            onClick={() => onClone(section.id)}
                        >
                            <div className="cms-clone-panel__item-icon">
                                <Layout className="cms-icon--sm" />
                            </div>
                            <div className="cms-clone-panel__item-content">
                                <div className="cms-clone-panel__item-title">{section.title}</div>
                                <div className="cms-clone-panel__item-meta">
                                    <span>{section.type}</span>
                                    <span>•</span>
                                    <span>{section.pageTitle}</span>
                                </div>
                            </div>
                            <span className="cms-clone-panel__item-badge">Cloner</span>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
