/**
 * ==================================
 * eLISAschool - Barre d'actions rapides flottantes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre d'actions rapides contextuelles pour l'éditeur CMS.
 * Apparaît en bas du canvas avec les actions les plus utilisées.
 * Inspiré de Figma bottom toolbar / Webflow quick actions.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
    Save, Undo2, Redo2, Eye, EyeOff, Grid3X3, Palette,
    Smartphone, Tablet, Monitor, Moon, Sun, Ruler,
    Maximize2, Minimize2, Scissors, Copy, Trash2,
    ChevronLeft, ChevronRight, Sparkles, Layers,
    ZoomIn, ZoomOut, Crosshair as FocusIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================
// Types
// ==================================

interface QuickActionsBarProps {
    /** Sauvegarder */
    onSave: () => void;
    /** Undo */
    onUndo: () => void;
    /** Redo */
    onRedo: () => void;
    /** Undo disponible ? */
    canUndo: boolean;
    /** Redo disponible ? */
    canRedo: boolean;
    /** Toggle grille */
    showGrid: boolean;
    onToggleGrid: () => void;
    /** Toggle règles */
    showRulers: boolean;
    onToggleRulers: () => void;
    /** Mode sombre preview */
    darkMode: boolean;
    onToggleDarkMode: () => void;
    /** Device preview */
    device: 'desktop' | 'tablet' | 'mobile';
    onDeviceChange: (d: 'desktop' | 'tablet' | 'mobile') => void;
    /** Zoom */
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onZoomReset: () => void;
    /** Focus mode */
    onToggleFocus: () => void;
    /** Zoom to fit */
    onZoomToFit: () => void;
    /** A des modifications ? */
    hasChanges: boolean;
}

// ==================================
// Composant principal
// ==================================

export function QuickActionsBar({
    onSave, onUndo, onRedo, canUndo, canRedo,
    showGrid, onToggleGrid,
    showRulers, onToggleRulers,
    darkMode, onToggleDarkMode,
    device, onDeviceChange,
    zoom, onZoomIn, onZoomOut, onZoomReset,
    onToggleFocus, onZoomToFit,
    hasChanges,
}: QuickActionsBarProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [showDevicePicker, setShowDevicePicker] = useState(false);

    // Device icon
    const deviceIcon = useMemo(() => {
        switch (device) {
            case 'mobile': return <Smartphone className="cms-qa__icon" />;
            case 'tablet': return <Tablet className="cms-qa__icon" />;
            default: return <Monitor className="cms-qa__icon" />;
        }
    }, [device]);

    // Device label
    const deviceLabel = useMemo(() => {
        switch (device) {
            case 'mobile': return 'Mobile';
            case 'tablet': return 'Tablette';
            default: return 'Desktop';
        }
    }, [device]);

    if (!isExpanded) {
        return (
            <div className="cms-qa-bar cms-qa-bar--collapsed">
                <button
                    onClick={() => setIsExpanded(true)}
                    className="cms-qa-bar__expand-btn"
                    title="Afficher les actions rapides"
                >
                    <ChevronLeft className="cms-qa__icon" />
                </button>
            </div>
        );
    }

    return (
        <div className="cms-qa-bar">
            {/* Collapse button */}
            <button
                onClick={() => setIsExpanded(false)}
                className="cms-qa-bar__collapse-btn"
                title="Réduire"
            >
                <ChevronRight className="cms-qa__icon" />
            </button>

            {/* ═══ Groupe: Historique ═══ */}
            <div className="cms-qa-group">
                <span className="cms-qa-group__label">Historique</span>
                <div className="cms-qa-group__actions">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="cms-qa-btn"
                        title="Annuler (Ctrl+Z)"
                    >
                        <Undo2 className="cms-qa__icon" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="cms-qa-btn"
                        title="Rétablir (Ctrl+Y)"
                    >
                        <Redo2 className="cms-qa__icon" />
                    </button>
                </div>
            </div>

            {/* Separator */}
            <div className="cms-qa-sep" />

            {/* ═══ Groupe: Vue ═══ */}
            <div className="cms-qa-group">
                <span className="cms-qa-group__label">Vue</span>
                <div className="cms-qa-group__actions">
                    {/* Device picker */}
                    <div className="cms-qa-device-picker">
                        <button
                            onClick={() => setShowDevicePicker(!showDevicePicker)}
                            className="cms-qa-btn cms-qa-btn--active"
                            title={`Appareil: ${deviceLabel}`}
                        >
                            {deviceIcon}
                        </button>
                        {showDevicePicker && (
                            <div className="cms-qa-device-menu">
                                {[
                                    { id: 'desktop' as const, icon: <Monitor className="cms-qa__icon" />, label: 'Desktop' },
                                    { id: 'tablet' as const, icon: <Tablet className="cms-qa__icon" />, label: 'Tablette' },
                                    { id: 'mobile' as const, icon: <Smartphone className="cms-qa__icon" />, label: 'Mobile' },
                                ].map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => { onDeviceChange(d.id); setShowDevicePicker(false); }}
                                        className={`cms-qa-device-option ${device === d.id ? 'cms-qa-device-option--active' : ''}`}
                                    >
                                        {d.icon}
                                        <span>{d.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Zoom controls */}
                    <button onClick={onZoomOut} className="cms-qa-btn" title="Zoom -">
                        <ZoomOut className="cms-qa__icon" />
                    </button>
                    <button
                        onClick={onZoomReset}
                        className="cms-qa-btn cms-qa-zoom-label"
                        title="Reset zoom (100%)"
                    >
                        {zoom}%
                    </button>
                    <button onClick={onZoomIn} className="cms-qa-btn" title="Zoom +">
                        <ZoomIn className="cms-qa__icon" />
                    </button>
                    <button onClick={onZoomToFit} className="cms-qa-btn" title="Ajuster à la vue">
                        <Maximize2 className="cms-qa__icon" />
                    </button>
                </div>
            </div>

            {/* Separator */}
            <div className="cms-qa-sep" />

            {/* ═══ Groupe: Outils ═══ */}
            <div className="cms-qa-group">
                <span className="cms-qa-group__label">Outils</span>
                <div className="cms-qa-group__actions">
                    <button
                        onClick={onToggleGrid}
                        className={`cms-qa-btn ${showGrid ? 'cms-qa-btn--active' : ''}`}
                        title="Grille (G)"
                    >
                        <Grid3X3 className="cms-qa__icon" />
                    </button>
                    <button
                        onClick={onToggleRulers}
                        className={`cms-qa-btn ${showRulers ? 'cms-qa-btn--active' : ''}`}
                        title="Règles (R)"
                    >
                        <Ruler className="cms-qa__icon" />
                    </button>
                    <button
                        onClick={onToggleDarkMode}
                        className={`cms-qa-btn ${darkMode ? 'cms-qa-btn--active' : ''}`}
                        title="Mode sombre preview"
                    >
                        {darkMode ? <Sun className="cms-qa__icon" /> : <Moon className="cms-qa__icon" />}
                    </button>
                    <button
                        onClick={onToggleFocus}
                        className="cms-qa-btn"
                        title="Mode focus (F)"
                    >
                        <FocusIcon className="cms-qa__icon" />
                    </button>
                </div>
            </div>

            {/* Separator */}
            <div className="cms-qa-sep" />

            {/* ═══ Sauvegarder ═══ */}
            <button
                onClick={onSave}
                className={`cms-qa-save-btn ${hasChanges ? 'cms-qa-save-btn--dirty' : ''}`}
                title="Sauvegarder (Ctrl+S)"
            >
                <Save className="cms-qa__icon" />
                <span className="cms-qa-save-label">
                    {hasChanges ? 'Sauvegarder' : 'Sauvé'}
                </span>
                {hasChanges && <span className="cms-qa-save-dot" />}
            </button>
        </div>
    );
}
