/**
 * ==================================
 * eLISAschool - Thème Puck Editor
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Personnalisation complète de l'éditeur Puck v0.23 :
 * - CSS custom properties (thème eLISAschool)
 * - Custom field types (boolean → toggle)
 * - UI overrides (header, drawer, fields)
 * - Canvas background pattern
 * - Selection bridge (external store pour partager la sélection Puck)
 */

import React, { useSyncExternalStore, useCallback, useEffect, useState, useMemo } from 'react';
import type { Overrides, ComponentData } from '@puckeditor/core';
import { createUsePuck, registerOverlayPortal } from '@puckeditor/core';
import { Copy, Trash2, ArrowUp, ArrowDown, GripVertical, Layers, Pencil, Eye, Settings2, EyeOff } from 'lucide-react';

export const usePuck = createUsePuck();

// Ré-export pour utilisation dans les composants
export { registerOverlayPortal };

// ==================================
// Labels de composants (pour l'overlay)
// ==================================

export const COMPONENT_LABELS: Record<string, string> = {
    HeroSection: 'Hero',
    HeroVideoSection: 'Hero Vidéo',
    TexteSection: 'Texte',
    GalerieSection: 'Galerie',
    GalerieMasonrySection: 'Galerie Masonry',
    CarouselSection: 'Carousel',
    VideoSection: 'Vidéo',
    TelechargementsSection: 'Téléchargements',
    ActualitesSection: 'Actualités',
    HtmlCustomSection: 'HTML Custom',
    TemoignagesSection: 'Témoignages',
    TemoignageCarouselSection: 'Témoignages Carousel',
    EquipeSection: 'Équipe',
    PartenairesSection: 'Partenaires',
    CarteInfosSection: 'Carte Infos',
    ChiffresClesSection: 'Chiffres Clés',
    CompteursAnimesSection: 'Compteurs Animés',
    CarteSection: 'Carte',
    HorairesSection: 'Horaires',
    FaqSection: 'FAQ',
    TimelineSection: 'Timeline',
    TabsSection: 'Onglets',
    IconeFeaturesSection: 'Icones Features',
    PrixTabSection: 'Tableau Prix',
    FormulaireSection: 'Formulaire',
    AppelActionSection: 'Appel Action',
    NewsletterSection: 'Newsletter',
    SeparateurSection: 'Séparateur',
};

// ==================================
// External Store : Actions Puck globales
// ==================================

/**
 * Store externe pour les actions Puck (dupliquer, supprimer, déplacer).
 * Alimenté par PuckActionBridge depuis le contexte Puck.
 */
type PuckActions = {
    dispatch: ((action: any) => void) | null;
    data: ComponentData[] | null;
};

let globalPuckActions: PuckActions = { dispatch: null, data: null };
const puckActionsListeners = new Set<() => void>();

function notifyPuckActionsListeners() {
    puckActionsListeners.forEach(l => l());
}

function setGlobalPuckActions(actions: Partial<PuckActions>) {
    globalPuckActions = { ...globalPuckActions, ...actions };
    notifyPuckActionsListeners();
}

/**
 * Hook pour accéder aux actions Puck depuis l'extérieur du contexte.
 */
export function usePuckActions(): PuckActions {
    return useSyncExternalStore(
        (cb: () => void) => {
            puckActionsListeners.add(cb);
            return () => puckActionsListeners.delete(cb);
        },
        () => globalPuckActions,
        () => ({ dispatch: null, data: null }),
    );
}

/**
 * Bridge qui capture le dispatch Puck et les données pour les rendre
 * accessibles aux composants hors contexte Puck (overlay actions).
 */
function PuckActionBridge() {
    const dispatch = usePuck((s) => s.dispatch);
    const data = usePuck((s) => s.data);

    useEffect(() => {
        setGlobalPuckActions({ dispatch, data: data?.content || null });
    }, [dispatch, data]);

    return null;
}

// ==================================
// Helpers d'actions sur les sections
// ==================================

function findItemIndex(data: ComponentData[] | null, componentId: string): number {
    if (!data) return -1;
    return data.findIndex(item => (item.props as any)?.id === componentId);
}

function handleDuplicate(componentId: string) {
    const { dispatch, data } = globalPuckActions;
    if (!dispatch || !data) return;
    const idx = data.findIndex(item => (item.props as any)?.id === componentId);
    if (idx === -1) return;
    const original = data[idx];
    const copy = {
        ...original,
        props: { ...original.props, id: `new-${Date.now()}` },
    };
    const newContent = [...data];
    newContent.splice(idx + 1, 0, copy);
    dispatch({ type: 'setData', data: { content: newContent, root: {} } });
}

function handleDelete(componentId: string) {
    const { dispatch, data } = globalPuckActions;
    if (!dispatch || !data) return;
    const newContent = data.filter(item => (item.props as any)?.id !== componentId);
    dispatch({ type: 'setData', data: { content: newContent, root: {} } });
}

function handleMove(componentId: string, direction: 'up' | 'down') {
    const { dispatch, data } = globalPuckActions;
    if (!dispatch || !data) return;
    const idx = data.findIndex(item => (item.props as any)?.id === componentId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= data.length) return;
    const newContent = [...data];
    [newContent[idx], newContent[targetIdx]] = [newContent[targetIdx], newContent[idx]];
    dispatch({ type: 'setData', data: { content: newContent, root: {} } });
}

// ==================================
// Component Overlay Custom
// ==================================

/**
 * Overlay personnalisé pour les composants Puck.
 * Affiche : label du type, badge index, et barre d'actions rapides au survol/sélection.
 */
function CustomComponentOverlay({ children, hover, isSelected, componentId, componentType }: {
    children: React.ReactNode;
    hover: boolean;
    isSelected: boolean;
    componentId: string;
    componentType: string;
}) {
    const label = COMPONENT_LABELS[componentType] || componentType.replace(/Section$/, '');
    const { data } = usePuckActions();
    const index = useMemo(() => findItemIndex(data, componentId), [data, componentId]);

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                outline: isSelected
                    ? '2px solid #2563eb'
                    : hover
                        ? '1.5px solid #93c5fd'
                        : 'none',
                outlineOffset: '-1px',
                borderRadius: '6px',
                transition: 'outline-color 150ms ease, box-shadow 150ms ease',
                boxShadow: isSelected
                    ? '0 0 0 3px rgba(37, 99, 235, 0.12), 0 2px 8px rgba(37, 99, 235, 0.08)'
                    : hover
                        ? '0 0 0 2px rgba(147, 197, 253, 0.15)'
                        : 'none',
            }}
        >
            {children}

            {/* Label du composant (visible au hover/sélection) */}
            {(hover || isSelected) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-1px',
                        left: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        backgroundColor: isSelected ? '#2563eb' : '#60a5fa',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: 600,
                        fontFamily: 'inherit',
                        lineHeight: '16px',
                        borderRadius: '5px 0 5px 0',
                        zIndex: 10,
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.01em',
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    <Layers style={{ width: '10px', height: '10px' }} />
                    {label}
                    {index >= 0 && (
                        <span style={{ opacity: 0.7, fontSize: '9px' }}>#{index + 1}</span>
                    )}
                </div>
            )}

            {/* Barre d'actions rapides (visible au hover/sélection) */}
            {(hover || isSelected) && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-1px',
                        right: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1px',
                        padding: '3px 4px',
                        backgroundColor: isSelected ? '#2563eb' : '#60a5fa',
                        borderRadius: '0 5px 0 5px',
                        zIndex: 10,
                        backdropFilter: 'blur(4px)',
                    }}
                >
                    {/* Drag handle visuel */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 2px',
                            cursor: 'grab',
                            opacity: 0.7,
                        }}
                    >
                        <GripVertical style={{ width: '11px', height: '11px', color: '#fff' }} />
                    </div>

                    {/* Monter */}
                    <OverlayActionButton
                        title="Monter"
                        onClick={(e) => { e.stopPropagation(); handleMove(componentId, 'up'); }}
                    >
                        <ArrowUp style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>

                    {/* Descendre */}
                    <OverlayActionButton
                        title="Descendre"
                        onClick={(e) => { e.stopPropagation(); handleMove(componentId, 'down'); }}
                    >
                        <ArrowDown style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>

                    {/* Éditer le style */}
                    <OverlayActionButton
                        title="Éditer le style"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('puck:edit-style', { detail: { componentId } }));
                        }}
                    >
                        <Pencil style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>

                    {/* Éditer le contenu (ouvre le panneau de champs Puck) */}
                    <OverlayActionButton
                        title="Éditer le contenu"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.dispatchEvent(new CustomEvent('puck:edit-content', { detail: { componentId } }));
                        }}
                    >
                        <Settings2 style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>

                    {/* Dupliquer */}
                    <OverlayActionButton
                        title="Dupliquer"
                        onClick={(e) => { e.stopPropagation(); handleDuplicate(componentId); }}
                    >
                        <Copy style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>

                    {/* Supprimer */}
                    <OverlayActionButton
                        title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); handleDelete(componentId); }}
                        danger
                    >
                        <Trash2 style={{ width: '11px', height: '11px' }} />
                    </OverlayActionButton>
                </div>
            )}
        </div>
    );
}

/** Bouton d'action dans l'overlay */
function OverlayActionButton({ children, onClick, title, danger }: {
    children: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    title: string;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                borderRadius: '3px',
                border: 'none',
                backgroundColor: 'transparent',
                color: danger ? '#fecaca' : '#ffffff',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 100ms ease',
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = danger
                    ? 'rgba(220, 38, 38, 0.4)'
                    : 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            }}
        >
            {children}
        </button>
    );
}

// ==================================
// External Store : Sélection Puck
// ==================================

/**
 * Store externe (module-level) pour partager la sélection Puck
 * avec des composants en dehors du contexte Puck (StyleEditorPanel, etc.)
 */
type SelectionListener = () => void;

let currentSelectedItem: ComponentData | null = null;
let currentItemId: string | null = null;
const selectionListeners = new Set<SelectionListener>();

function notifySelectionListeners() {
    selectionListeners.forEach(l => l());
}

/**
 * Hook pour lire la sélection Puck actuelle depuis n'importe quel composant.
 * Utilise useSyncExternalStore pour une synchronisation optimale avec React 19.
 */
export function useSelectedPuckItem(): { item: ComponentData | null; itemId: string | null } {
    const item = useSyncExternalStore(
        (cb: SelectionListener) => {
            selectionListeners.add(cb);
            return () => selectionListeners.delete(cb);
        },
        () => currentSelectedItem,
        () => null,
    );
    const itemId = useSyncExternalStore(
        (cb: SelectionListener) => {
            selectionListeners.add(cb);
            return () => selectionListeners.delete(cb);
        },
        () => currentItemId,
        () => null,
    );
    return { item, itemId };
}

/**
 * Met à jour le store de sélection (appelé depuis le bridge Puck).
 */
function setSelection(item: ComponentData | null, itemId: string | null) {
    if (currentSelectedItem !== item || currentItemId !== itemId) {
        currentSelectedItem = item;
        currentItemId = itemId;
        notifySelectionListeners();
    }
}

// ==================================
// Bridge : Puck → External Store
// ==================================

/**
 * Composant bridge qui utilise usePuck() (disponible uniquement dans le contexte Puck)
 * pour synchroniser la sélection avec le store externe.
 * Rendu via overrides.fields pour accéder à l'itemSelector.
 */
function PuckSelectionBridge({ children }: { children: React.ReactNode }) {
    const selectedItem = usePuck((s) => s.selectedItem);
    const itemSelector = usePuck((s) => s.appState.ui.itemSelector);

    useEffect(() => {
        if (selectedItem) {
            const id = (selectedItem.props as any)?.id || null;
            setSelection(selectedItem, id);
        } else {
            setSelection(null, null);
        }
    }, [selectedItem, itemSelector]);

    return <>{children}</>;
}

// ==================================
// Thème CSS — Variables personnalisées
// ==================================

/**
 * Variables CSS Puck alignées sur le thème eLISAschool.
 * Appliquées via le style inline du conteneur wrapper.
 */
export const PUCK_THEME_CSS: React.CSSProperties = {
    // Couleurs interactives → teinte primaire eLISAschool
    '--puck-color-interactive': 'var(--color-primary, #2563eb)',
    '--puck-color-interactive-hover': 'var(--color-primary-hover, #1d4ed8)',
    '--puck-color-interactive-active': 'var(--color-primary-active, #1e40af)',
    '--puck-color-interactive-subtle': 'var(--color-primary-50, #eff6ff)',
    '--puck-color-interactive-soft': 'var(--color-primary-50, #f8fafc)',
    '--puck-color-interactive-soft-hover': 'var(--color-primary-100, #eff6ff)',
    '--puck-color-focus-ring': 'var(--color-primary, #2563eb)',

    // Surfaces → neutres cohérents
    '--puck-color-surface': '#ffffff',
    '--puck-color-surface-muted': '#f8fafc',
    '--puck-color-surface-subtle': '#f1f5f9',

    // Bordures → discrètes
    '--puck-color-border': '#e2e8f0',
    '--puck-color-border-muted': '#f1f5f9',

    // Rayon → arrondi modéré
    '--puck-radius-m': '6px',
    '--puck-radius-l': '10px',

    // Typographie → héritée de l'application
    '--puck-font-family': 'inherit',

    // Motion → transitions fluides
    '--puck-duration-fast': '80ms',
    '--puck-duration-medium': '180ms',
} as React.CSSProperties;

// ==================================
// Custom Field Type : Boolean Toggle
// ==================================

/**
 * Composant Toggle pour les champs boolean Puck.
 * Remplace le type `boolean` inexistant dans Puck v0.23.
 */
function BooleanToggle({ name, onChange, value }: { name: string; onChange: (val: boolean) => void; value: boolean }) {
    return (
        <label
            className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:border-gray-300"
            style={{ fontSize: '13px' }}
        >
            <span className="font-medium capitalize text-gray-700">
                {name.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <button
                type="button"
                role="switch"
                aria-checked={!!value}
                onClick={() => onChange(!value)}
                className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors"
                style={{
                    backgroundColor: value ? 'var(--puck-color-interactive, #2563eb)' : '#d1d5db',
                }}
            >
                <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform"
                    style={{
                        transform: value ? 'translateX(18px)' : 'translateX(3px)',
                    }}
                />
            </button>
        </label>
    );
}

// ==================================
// UI Overrides Puck
// ==================================

/**
 * Overrides Puck pour personnaliser l'interface de l'éditeur.
 * - fieldTypes.boolean : toggle switch custom
 * - header : masqué (on utilise notre propre toolbar)
 * - fields : bridge de sélection pour partager l'état avec l'extérieur
 * - drawer : rétractable via leftPanelCollapsed
 */
export function createPuckOverrides(leftPanelCollapsed: boolean = false): Overrides {
    return {
        // Enregistrer le custom field type boolean
        fieldTypes: {
            boolean: BooleanToggle as any,
        },
        // Masquer le header Puck par défaut (on utilise notre toolbar externe)
        header: () => null,
        // Drawer rétractable : wrapper avec classe collapsible
        drawer: ({ children }) => {
            return (
                <div className={`cms-drawer ${leftPanelCollapsed ? 'cms-drawer--collapsed' : ''}`}>
                    {children}
                </div>
            );
        },
        // Bridge de sélection : wrapper les fields pour tracker la sélection
        fields: ({ children }) => {
            return (
                <>
                    <PuckSelectionBridge />
                    <PuckActionBridge />
                    {children}
                </>
            );
        },
        // Overlay personnalisé : outlines colorés + label + actions rapides
        componentOverlay: ({ children, hover, isSelected, componentId, componentType }) => {
            return (
                <CustomComponentOverlay
                    hover={hover}
                    isSelected={isSelected}
                    componentId={componentId}
                    componentType={componentType}
                >
                    {children}
                </CustomComponentOverlay>
            );
        },
    };
}

// ==================================
// Canvas Background Pattern
// ==================================

/**
 * CSS pour le background du canvas Puck.
 * Grille de points subtils pour guider le positionnement.
 */
export const CANVAS_BG_STYLE: React.CSSProperties = {
    backgroundImage: `radial-gradient(circle, #e2e8f0 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
    backgroundColor: '#f8fafc',
};

// ==================================
// Hook : Style Config de la section sélectionnée
// ==================================

/**
 * Hook qui extrait le styleConfig de la section Puck sélectionnée
 * et fournit un onChange pour le mettre à jour via dispatch Puck.
 *
 * Utilise le bridge de sélection + dispatch Puck pour synchroniser
 * les styles dans les props de la section.
 */
export function useSelectedStyleConfig() {
    const { item, itemId } = useSelectedPuckItem();
    const [localDispatch, setLocalDispatch] = useState<((action: any) => void) | null>(null);

    // Accéder au dispatch Puck via usePuck (uniquement dans le contexte)
    // On utilise un composant bridge pour capturer le dispatch
    const styleConfig = (item?.props as any)?.styleConfig || null;

    return {
        itemId,
        styleConfig,
        selectedItem: item,
        hasSelection: !!item,
    };
}

/**
 * Composant qui capture le dispatch Puck et le rend disponible via callback.
 * À placer à l'intérieur du Puck provider.
 */
export function PuckDispatchCapture({ onDispatch }: { onDispatch: (dispatch: (action: any) => void) => void }) {
    const dispatch = usePuck((s) => s.dispatch);

    useEffect(() => {
        if (dispatch) onDispatch(dispatch);
    }, [dispatch, onDispatch]);

    return null;
}
