/**
 * ==================================
 * eLISAschool - Contextual Toolbar — Toolbar contextuelle intelligente
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre d'outils contextuelle qui apparaît au survol ou à la sélection
 * d'une section dans le canvas. Détecte le type de section et propose
 * des actions pertinentes (dupliquer, supprimer, déplacer, éditer style, etc.)
 */

import React, { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
    Copy, Trash2, ArrowUp, ArrowDown, ArrowUpFromLine, ArrowDownToLine,
    Pencil, Eye, EyeOff, Lock, Unlock, Paintbrush, Type, Palette,
    Layers, Move, MoreHorizontal, Sparkles, Scissors, Clipboard,
    Code, Maximize2, Minimize2, RotateCcw,
} from 'lucide-react';

// ==================================
// Types
// ==================================

export interface ContextToolbarAction {
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    disabled?: boolean;
    separator?: boolean;
}

export interface ContextToolbarProps {
    visible: boolean;
    position: { x: number; y: number };
    sectionType: string;
    sectionId: string;
    sectionIndex: number;
    totalSections: number;
    isSelected: boolean;
    isLocked: boolean;
    isVisible: boolean;
    // Actions
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onMoveToTop: () => void;
    onMoveToBottom: () => void;
    onToggleVisibility: () => void;
    onToggleLock: () => void;
    onEditStyle: () => void;
    onCopy: () => void;
    onPaste: () => void;
    canPaste?: boolean;
    dark?: boolean;
}

// ==================================
// Section type labels (smart detection)
// ==================================

const SECTION_TYPE_LABELS: Record<string, string> = {
    HeroSection: 'Hero',
    TexteSection: 'Texte',
    GalerieSection: 'Galerie',
    CarteInfosSection: 'Carte Infos',
    TemoignagesSection: 'Témoignages',
    ChiffresClesSection: 'Chiffres Clés',
    EquipeSection: 'Équipe',
    FormulaireSection: 'Formulaire',
    CarteSection: 'Carte',
    VideoSection: 'Vidéo',
    TelechargementsSection: 'Fichiers',
    ActualitesSection: 'Actualités',
    HorairesSection: 'Horaires',
    PartenairesSection: 'Partenaires',
    FaqSection: 'FAQ',
    AppelActionSection: 'CTA',
    SeparateurSection: 'Séparateur',
    HtmlCustomSection: 'HTML',
    NewsletterSection: 'Newsletter',
};

// ==================================
// Composant principal
// ==================================

export function ContextualToolbar({
    visible,
    position,
    sectionType,
    sectionId,
    sectionIndex,
    totalSections,
    isSelected,
    isLocked,
    isVisible,
    onEdit,
    onDuplicate,
    onDelete,
    onMoveUp,
    onMoveDown,
    onMoveToTop,
    onMoveToBottom,
    onToggleVisibility,
    onToggleLock,
    onEditStyle,
    onCopy,
    onPaste,
    canPaste = false,
    dark = false,
}: ContextToolbarProps) {
    const toolbarRef = useRef<HTMLDivElement>(null);
    const [showMore, setShowMore] = useState(false);

    // Smart position — éviter le débordement
    const adjustedPosition = useMemo(() => {
        if (!toolbarRef.current) return position;
        const rect = toolbarRef.current.getBoundingClientRect();
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        let x = position.x;
        let y = position.y;

        // Debordement droite
        if (x + rect.width > viewportW - 16) {
            x = viewportW - rect.width - 16;
        }
        // Debordement gauche
        if (x < 16) x = 16;
        // Debordement bas
        if (y + rect.height > viewportH - 16) {
            y = position.y - rect.height - 12;
        }
        // Debordement haut
        if (y < 16) y = 16;

        return { x, y };
    }, [position]);

    // Fermer le menu "more" au clic extérieur
    useEffect(() => {
        if (!showMore) return;
        const handler = (e: MouseEvent) => {
            if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
                setShowMore(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMore]);

    // Actions principales (toujours visibles)
    const primaryActions = useMemo<ContextToolbarAction[]>(() => [
        { id: 'edit', icon: <Pencil className="cms-icon--xs" />, label: 'Éditer', onClick: onEdit },
        { id: 'style', icon: <Paintbrush className="cms-icon--xs" />, label: 'Style', onClick: onEditStyle },
        { id: 'sep1', icon: null, label: '', onClick: () => {}, separator: true },
        { id: 'up', icon: <ArrowUp className="cms-icon--xs" />, label: 'Monter', onClick: onMoveUp, disabled: sectionIndex === 0 },
        { id: 'down', icon: <ArrowDown className="cms-icon--xs" />, label: 'Descendre', onClick: onMoveDown, disabled: sectionIndex === totalSections - 1 },
        { id: 'sep2', icon: null, label: '', onClick: () => {}, separator: true },
        { id: 'duplicate', icon: <Copy className="cms-icon--xs" />, label: 'Dupliquer', onClick: onDuplicate },
        { id: 'copy', icon: <Clipboard className="cms-icon--xs" />, label: 'Copier', onClick: onCopy },
        ...(canPaste ? [{ id: 'paste', icon: <Clipboard className="cms-icon--xs" />, label: 'Coller', onClick: onPaste }] : []),
        { id: 'sep3', icon: null, label: '', onClick: () => {}, separator: true },
        { id: 'visibility', icon: isVisible ? <Eye className="cms-icon--xs" /> : <EyeOff className="cms-icon--xs" />, label: isVisible ? 'Masquer' : 'Afficher', onClick: onToggleVisibility },
        { id: 'lock', icon: isLocked ? <Lock className="cms-icon--xs" /> : <Unlock className="cms-icon--xs" />, label: isLocked ? 'Déverrouiller' : 'Verrouiller', onClick: onToggleLock, active: isLocked },
    ], [onEdit, onEditStyle, onMoveUp, onMoveDown, onDuplicate, onCopy, onPaste, onToggleVisibility, onToggleLock, sectionIndex, totalSections, isVisible, isLocked, canPaste]);

    // Actions secondaires (menu "more")
    const secondaryActions = useMemo<ContextToolbarAction[]>(() => [
        { id: 'top', icon: <ArrowUpFromLine className="cms-icon--xs" />, label: 'Déplacer en haut', onClick: onMoveToTop, disabled: sectionIndex === 0 },
        { id: 'bottom', icon: <ArrowDownToLine className="cms-icon--xs" />, label: 'Déplacer en bas', onClick: onMoveToBottom, disabled: sectionIndex === totalSections - 1 },
        { id: 'delete', icon: <Trash2 className="cms-icon--xs" />, label: 'Supprimer', onClick: onDelete, danger: true },
    ], [onMoveToTop, onMoveToBottom, onDelete, sectionIndex, totalSections]);

    const typeLabel = SECTION_TYPE_LABELS[sectionType] || sectionType.replace(/Section$/, '');

    if (!visible) return null;

    return (
        <div
            ref={toolbarRef}
            className={`cms-context-toolbar ${dark ? 'cms-context-toolbar--dark' : ''}`}
            style={{
                left: `${adjustedPosition.x}px`,
                top: `${adjustedPosition.y}px`,
            }}
            role="toolbar"
            aria-label={`Outils pour ${typeLabel}`}
        >
            {/* Badge type de section */}
            <span className="cms-context-toolbar__label">
                {typeLabel}
            </span>
            <span className="cms-context-toolbar__badge">
                #{sectionIndex + 1}
            </span>

            <div className="cms-context-toolbar__sep" />

            {/* Actions principales */}
            <div className="cms-context-toolbar__group">
                {primaryActions.map(action => {
                    if (action.separator) {
                        return <div key={action.id} className="cms-context-toolbar__sep" />;
                    }
                    return (
                        <button
                            key={action.id}
                            className={`cms-context-toolbar__btn ${action.active ? 'cms-context-toolbar__btn--active' : ''} ${action.danger ? 'cms-context-toolbar__btn--danger' : ''}`}
                            onClick={action.onClick}
                            disabled={action.disabled}
                            title={action.label}
                            aria-label={action.label}
                        >
                            {action.icon}
                        </button>
                    );
                })}
            </div>

            {/* Menu "More" */}
            <div className="cms-context-toolbar__sep" />
            <div style={{ position: 'relative' }}>
                <button
                    className={`cms-context-toolbar__btn ${showMore ? 'cms-context-toolbar__btn--active' : ''}`}
                    onClick={() => setShowMore(!showMore)}
                    title="Plus d'actions"
                    aria-label="Plus d'actions"
                    aria-expanded={showMore}
                >
                    <MoreHorizontal className="cms-icon--xs" />
                </button>

                {/* Dropdown menu */}
                {showMore && (
                    <div
                        className="cms-context-toolbar__dropdown"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '4px',
                            background: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                            border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                            borderRadius: '6px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            padding: '4px',
                            minWidth: '160px',
                            zIndex: 100,
                            backdropFilter: 'blur(12px)',
                        }}
                    >
                        {secondaryActions.map(action => (
                            <button
                                key={action.id}
                                className={`cms-context-toolbar__dropdown-item ${action.danger ? 'cms-context-toolbar__dropdown-item--danger' : ''}`}
                                onClick={() => { action.onClick(); setShowMore(false); }}
                                disabled={action.disabled}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    width: '100%',
                                    padding: '6px 8px',
                                    border: 'none',
                                    background: 'transparent',
                                    borderRadius: '4px',
                                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: action.danger
                                        ? 'rgba(239, 64, 64, 0.8)'
                                        : action.disabled
                                            ? dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                                            : dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                    textAlign: 'left',
                                    opacity: action.disabled ? 0.5 : 1,
                                }}
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==================================
// Hook — useCanvasToolbarPosition
// Calcule la position de la toolbar basée sur la section sélectionnée
// ==================================

export function useCanvasToolbarPosition(
    selectedItemId: string | null,
    canvasScrollRef: React.RefObject<HTMLDivElement | null>,
    canvasZoom: number,
) {
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!selectedItemId || !canvasScrollRef.current) {
            setVisible(false);
            return;
        }

        const el = document.querySelector(`[data-puck-component-id="${selectedItemId}"]`);
        if (!el) {
            setVisible(false);
            return;
        }

        const rect = el.getBoundingClientRect();
        const scale = canvasZoom / 100;

        setPosition({
            x: rect.left + (rect.width / 2),
            y: rect.top - 8,
        });
        setVisible(true);
    }, [selectedItemId, canvasScrollRef, canvasZoom]);

    return { position, visible };
}

export default ContextualToolbar;
