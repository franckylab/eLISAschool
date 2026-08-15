/**
 * ==================================
 * eLISAschool - Éditeur inline de section (flottant canvas) v2
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Panneau flottant qui apparaît lors de la sélection d'une section
 * dans le canvas. Permet l'édition rapide des propriétés :
 * fond, texte, contour, bordure, ombre, padding, coins arrondis,
 * animations, effets visuels, transitions, hover.
 * Inspiré de Webflow/Figma : propriétés organisées par onglets,
 * sections collapsibles, preview live, presets visuels.
 */

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
    Palette, Type, Square, X, ChevronDown, ChevronUp, Circle,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Image as ImageIcon, Sparkles, Minus, Box,
    RotateCcw, Copy, Check, Pipette, RefreshCw,
    Zap, Clock, MousePointer, Layers, Eye, SlidersHorizontal,
    Columns3, MonitorIcon, Tablet, Smartphone, Maximize2, Minimize2,
    ArrowUpDown, ArrowLeftRight, AlignCenterVertical,
    Undo2, Redo2, ClipboardPaste, Search, Filter, Code,
    ChevronLeft, ChevronRight, Info, Wand2, Clipboard,
    Grid3x3, Droplets, Move, Link2, Keyboard,
    Trash2, ArrowUp, ArrowDown, EyeOff, Lock, Unlock,
} from 'lucide-react';
import { toast } from 'sonner';
import type {
    SectionStyleConfig, TypographyStyle, BackgroundStyle,
    SpacingStyle, BorderStyle, ShadowStyle, TransformStyle,
    AnimationConfig, AnimationType, AnimationEasing, HoverEffect,
    LayoutStyle,
} from '../puck/shared-styles';

// ==================================
// Types
// ==================================

interface SectionInlineEditorProps {
    styleConfig: SectionStyleConfig;
    onChange: (config: SectionStyleConfig) => void;
    sectionType: string;
    sectionLabel?: string;
    onClose: () => void;
    onOpenFullEditor: () => void;
    /** Actions de section (optionnelles) — passées par le canvas */
    onDuplicate?: () => void;
    onDelete?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    /** Changer le type de section (optionnel) */
    onSectionTypeChange?: (newType: string) => void;
}

// ==================================
// Constantes
// ==================================

const QUICK_COLORS = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#334155', '#1e293b', '#111827', '#000000',
    '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe',
    '#16a34a', '#22c55e', '#4ade80', '#bbf7d0',
    '#d97706', '#f59e0b', '#fbbf24', '#fde68a',
    '#dc2626', '#ef4444', '#f87171', '#fca5a5',
    '#7c3aed', '#8b5cf6', '#a78bfa', '#ddd6fe',
    '#db2777', '#ec4899', '#f472b6', '#fce7f3',
    '#0d9488', '#14b8a6', '#5eead4', '#ccfbf1',
];

const GRADIENT_PRESETS = [
    { name: 'Océan', from: '#0369a1', to: '#2563eb', dir: 'to-br' },
    { name: 'Coucher', from: '#dc2626', to: '#f59e0b', dir: 'to-r' },
    { name: 'Forêt', from: '#166534', to: '#16a34a', dir: 'to-b' },
    { name: 'Nuit', from: '#1e1b4b', to: '#312e81', dir: 'to-b' },
    { name: 'Aurore', from: '#7c3aed', to: '#ec4899', dir: 'to-br' },
    { name: 'Flamme', from: '#ea580c', to: '#fbbf24', dir: 'to-r' },
    { name: 'Ardoise', from: '#334155', to: '#64748b', dir: 'to-b' },
    { name: 'Menthe', from: '#0d9488', to: '#6ee7b7', dir: 'to-br' },
];

/** Types de sections disponibles pour le quick-switch */
const SECTION_TYPES = [
    { value: 'HeroSection', label: 'Hero', icon: '🏔', category: 'structure' },
    { value: 'HeroVideoSection', label: 'Hero Vidéo', icon: '🎬', category: 'structure' },
    { value: 'TexteSection', label: 'Texte', icon: '📝', category: 'content' },
    { value: 'GalerieSection', label: 'Galerie', icon: '🖼', category: 'media' },
    { value: 'GalerieMasonrySection', label: 'Galerie Masonry', icon: '🎨', category: 'media' },
    { value: 'CarouselSection', label: 'Carrousel', icon: '🎠', category: 'media' },
    { value: 'VideoSection', label: 'Vidéo', icon: '▶️', category: 'media' },
    { value: 'TelechargementsSection', label: 'Téléchargements', icon: '📥', category: 'content' },
    { value: 'ActualitesSection', label: 'Actualités', icon: '📰', category: 'content' },
    { value: 'TemoignagesSection', label: 'Témoignages', icon: '💬', category: 'social' },
    { value: 'TemoignageCarouselSection', label: 'Témoignages Carousel', icon: '💬', category: 'social' },
    { value: 'EquipeSection', label: 'Équipe', icon: '👥', category: 'social' },
    { value: 'PartenairesSection', label: 'Partenaires', icon: '🤝', category: 'social' },
    { value: 'CarteInfosSection', label: 'Carte Infos', icon: '📋', category: 'content' },
    { value: 'CarteSection', label: 'Carte', icon: '🃏', category: 'content' },
    { value: 'ChiffresClesSection', label: 'Chiffres clés', icon: '🔢', category: 'content' },
    { value: 'CompteursAnimesSection', label: 'Compteurs animés', icon: '📊', category: 'content' },
    { value: 'HorairesSection', label: 'Horaires', icon: '🕐', category: 'content' },
    { value: 'FaqSection', label: 'FAQ', icon: '❓', category: 'content' },
    { value: 'TimelineSection', label: 'Timeline', icon: '📅', category: 'content' },
    { value: 'TabsSection', label: 'Onglets', icon: '📑', category: 'content' },
    { value: 'IconeFeaturesSection', label: 'Icônes Features', icon: '✨', category: 'content' },
    { value: 'PrixTabSection', label: 'Prix', icon: '💰', category: 'content' },
    { value: 'FormulaireSection', label: 'Formulaire', icon: '📝', category: 'interactive' },
    { value: 'AppelActionSection', label: 'Appel Action', icon: '📢', category: 'interactive' },
    { value: 'NewsletterSection', label: 'Newsletter', icon: '📧', category: 'interactive' },
    { value: 'SeparateurSection', label: 'Séparateur', icon: '─', category: 'structure' },
    { value: 'HtmlCustomSection', label: 'HTML Custom', icon: '💻', category: 'advanced' },
];

/** Raccourcis clavier disponibles */
const KEYBOARD_SHORTCUTS = [
    { keys: '← →', desc: 'Navigation onglets' },
    { keys: 'Ctrl+Z', desc: 'Annuler style' },
    { keys: 'Ctrl+Y', desc: 'Rétablir style' },
    { keys: 'Ctrl+C', desc: 'Copier style' },
    { keys: 'Ctrl+V', desc: 'Coller style' },
    { keys: 'Ctrl+Shift+R', desc: 'Réinitialiser onglet' },
    { keys: 'Échap', desc: 'Fermer éditeur' },
];

const SHADOW_PRESETS = [
    { type: 'none', label: 'Aucune', css: 'none' },
    { type: 'sm', label: 'Subtile', css: '0 1px 2px rgba(0,0,0,0.05)' },
    { type: 'md', label: 'Moyenne', css: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
    { type: 'lg', label: 'Large', css: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' },
    { type: 'xl', label: 'XL', css: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' },
    { type: 'inner', label: 'Interne', css: 'inset 0 2px 4px rgba(0,0,0,0.06)' },
    { type: 'glow', label: 'Lueur', css: '0 0 20px rgba(59,130,246,0.3)' },
];

const RADIUS_OPTIONS = [
    { value: 'none', label: '0', px: '0px' },
    { value: 'sm', label: '4', px: '4px' },
    { value: 'md', label: '8', px: '8px' },
    { value: 'lg', label: '12', px: '12px' },
    { value: 'xl', label: '16', px: '16px' },
    { value: '2xl', label: '24', px: '24px' },
    { value: 'full', label: '∞', px: '9999px' },
];

const BORDER_WIDTHS = [
    { value: 'none', label: '—' },
    { value: 'thin', label: '1px' },
    { value: 'medium', label: '2px' },
    { value: 'thick', label: '4px' },
];

const PADDING_PRESETS = [
    { label: 'Compact', top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' },
    { label: 'Normal', top: '2rem', bottom: '2rem', left: '1rem', right: '1rem' },
    { label: 'Aéré', top: '3rem', bottom: '3rem', left: '1.5rem', right: '1.5rem' },
    { label: 'Large', top: '4rem', bottom: '4rem', left: '2rem', right: '2rem' },
    { label: 'XL', top: '6rem', bottom: '6rem', left: '2rem', right: '2rem' },
];

type TabId = 'fond' | 'texte' | 'bordure' | 'espace' | 'effet' | 'animation' | 'disposition' | 'responsive' | 'presets';

// ==================================
// CSS Preview Generator (pour le footer)
// ==================================

function generateCSSPreview(config: SectionStyleConfig): string {
    const lines: string[] = [];
    const bg = config.background;
    if (bg) {
        if (bg.type === 'gradient' && bg.gradientFrom && bg.gradientTo) {
            const dir = bg.gradientDirection === 'to-br' ? '135deg' : bg.gradientDirection === 'to-r' ? '90deg' : bg.gradientDirection === 'to-b' ? '180deg' : '0deg';
            lines.push(`background: linear-gradient(${dir}, ${bg.gradientFrom}, ${bg.gradientTo});`);
        } else if (bg.colorFrom) {
            lines.push(`background: ${bg.colorFrom};`);
        }
    }
    const typo = config.typography;
    if (typo) {
        if (typo.color) lines.push(`color: ${typo.color};`);
        if (typo.fontFamily) lines.push(`font-family: ${typo.fontFamily === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif'};`);
        if (typo.textAlign) lines.push(`text-align: ${typo.textAlign};`);
    }
    const border = config.border;
    if (border) {
        if (border.width && border.width !== 'none' && border.color) {
            const w = border.width === 'thin' ? '1px' : border.width === 'medium' ? '2px' : '4px';
            lines.push(`border: ${w} ${border.style || 'solid'} ${border.color};`);
        }
        if (border.radius && border.radius !== 'none') {
            const r = border.radius === 'full' ? '9999px' : RADIUS_OPTIONS.find(o => o.value === border.radius)?.px || '0';
            lines.push(`border-radius: ${r};`);
        }
    }
    const shadow = config.shadow;
    if (shadow && shadow.type && shadow.type !== 'none') {
        if (shadow.type === 'custom') {
            const inset = shadow.customInset ? 'inset ' : '';
            const x = shadow.customX ?? 0;
            const y = shadow.customY ?? 4;
            const blur = shadow.customBlur ?? 8;
            const spread = shadow.customSpread ?? 0;
            const color = shadow.color || 'rgba(0,0,0,0.1)';
            lines.push(`box-shadow: ${inset}${x}px ${y}px ${blur}px ${spread}px ${color};`);
        } else {
            const preset = SHADOW_PRESETS.find(s => s.type === shadow.type);
            if (preset) lines.push(`box-shadow: ${preset.css};`);
        }
    }
    const spacing = config.spacing;
    if (spacing) {
        if (spacing.paddingTop) lines.push(`padding: ${spacing.paddingTop} ${spacing.paddingRight || spacing.paddingTop} ${spacing.paddingBottom || spacing.paddingTop} ${spacing.paddingLeft || spacing.paddingRight || spacing.paddingTop};`);
    }
    return lines.join('\n') || '/* Aucun style */';
}

// ==================================
// Style Presets — Thèmes prédéfinis applicables en 1 clic
// ==================================

interface StylePreset {
    id: string;
    label: string;
    icon: string;
    preview: string; // CSS background for the preview swatch
    config: Partial<SectionStyleConfig>;
}

const STYLE_PRESETS: StylePreset[] = [
    {
        id: 'hero-classic',
        label: 'Hero Classique',
        icon: '🏔',
        preview: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        config: {
            background: { type: 'gradient', gradientFrom: '#1e40af', gradientTo: '#3b82f6', gradientDirection: 'to-br' },
            typography: { color: '#ffffff', fontFamily: 'sans', textAlign: 'center' },
            spacing: { paddingTop: '4rem', paddingBottom: '4rem', paddingLeft: '2rem', paddingRight: '2rem', marginTop: '0', marginBottom: '0', gap: '1rem' },
        },
    },
    {
        id: 'content-light',
        label: 'Contenu Clair',
        icon: '📄',
        preview: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        config: {
            background: { type: 'color', color: '#f8fafc' },
            typography: { color: '#1e293b', fontFamily: 'sans', textAlign: 'left' },
            spacing: { paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', marginTop: '0', marginBottom: '0', gap: '0.75rem' },
            border: { radius: 'lg' },
        },
    },
    {
        id: 'dark-elegant',
        label: 'Dark Élégant',
        icon: '🌙',
        preview: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        config: {
            background: { type: 'gradient', gradientFrom: '#0f172a', gradientTo: '#1e293b', gradientDirection: 'to-b' },
            typography: { color: '#e2e8f0', fontFamily: 'serif', textAlign: 'center' },
            spacing: { paddingTop: '4rem', paddingBottom: '4rem', paddingLeft: '2rem', paddingRight: '2rem', marginTop: '0', marginBottom: '0', gap: '1rem' },
            shadow: { type: 'lg', color: 'rgba(0,0,0,0.3)' },
        },
    },
    {
        id: 'card-soft',
        label: 'Card Soft',
        icon: '🃏',
        preview: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        config: {
            background: { type: 'color', color: '#ffffff' },
            typography: { color: '#334155', fontFamily: 'sans', textAlign: 'left' },
            spacing: { paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', marginTop: '0', marginBottom: '0', gap: '0.5rem' },
            border: { radius: 'xl', width: 'thin', color: '#e2e8f0' },
            shadow: { type: 'md', color: 'rgba(0,0,0,0.06)' },
        },
    },
    {
        id: 'gradient-vibrant',
        label: 'Dégradé Vif',
        icon: '🌈',
        preview: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
        config: {
            background: { type: 'gradient', gradientFrom: '#7c3aed', gradientTo: '#ec4899', gradientDirection: 'to-br' },
            typography: { color: '#ffffff', fontFamily: 'sans', textAlign: 'center' },
            spacing: { paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem', marginTop: '0', marginBottom: '0', gap: '1rem' },
        },
    },
    {
        id: 'nature-zen',
        label: 'Nature Zen',
        icon: '🌿',
        preview: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
        config: {
            background: { type: 'gradient', gradientFrom: '#065f46', gradientTo: '#10b981', gradientDirection: 'to-br' },
            typography: { color: '#ecfdf5', fontFamily: 'sans', textAlign: 'center' },
            spacing: { paddingTop: '4rem', paddingBottom: '4rem', paddingLeft: '2rem', paddingRight: '2rem', marginTop: '0', marginBottom: '0', gap: '1rem' },
        },
    },
    {
        id: 'warm-sunset',
        label: 'Coucher de soleil',
        icon: '🌅',
        preview: 'linear-gradient(135deg, #dc2626 0%, #f59e0b 100%)',
        config: {
            background: { type: 'gradient', gradientFrom: '#dc2626', gradientTo: '#f59e0b', gradientDirection: 'to-r' },
            typography: { color: '#ffffff', fontFamily: 'sans', textAlign: 'center' },
            spacing: { paddingTop: '3rem', paddingBottom: '3rem', paddingLeft: '2rem', paddingRight: '2rem', marginTop: '0', marginBottom: '0', gap: '1rem' },
        },
    },
    {
        id: 'minimal-border',
        label: 'Minimal Bordé',
        icon: '⬜',
        preview: 'linear-gradient(135deg, #ffffff 0%, #ffffff 100%)',
        config: {
            background: { type: 'color', color: '#ffffff' },
            typography: { color: '#111827', fontFamily: 'sans', textAlign: 'left' },
            spacing: { paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', marginTop: '0', marginBottom: '0', gap: '0.5rem' },
            border: { radius: 'md', width: 'thin', color: '#e5e7eb' },
        },
    },
];

// ==================================
// Animation presets (visuels)
// ==================================

const ANIMATION_PRESETS: { type: AnimationType; label: string; icon: string }[] = [
    { type: 'none', label: 'Aucune', icon: '⊘' },
    { type: 'fade-in', label: 'Fondu', icon: '◐' },
    { type: 'slide-up', label: '↑ Glisser', icon: '↑' },
    { type: 'slide-down', label: '↓ Glisser', icon: '↓' },
    { type: 'slide-left', label: '← Glisser', icon: '←' },
    { type: 'slide-right', label: '→ Glisser', icon: '→' },
    { type: 'zoom', label: 'Zoom +', icon: '⊕' },
    { type: 'zoom-out', label: 'Zoom -', icon: '⊖' },
    { type: 'scale-up', label: 'Scale', icon: '⤢' },
    { type: 'flip-x', label: 'Flip X', icon: '↔' },
    { type: 'flip-y', label: 'Flip Y', icon: '↕' },
    { type: 'rotate', label: 'Rotation', icon: '↻' },
    { type: 'blur', label: 'Flou', icon: '◎' },
    { type: 'bounce', label: 'Rebond', icon: '⤴' },
    { type: 'elastic', label: 'Élastique', icon: '⤻' },
];

const EASING_PRESETS: { value: AnimationEasing; label: string; curve: string }[] = [
    { value: 'easeOut', label: 'Sortie douce', curve: 'cubic-bezier(0,0,0.2,1)' },
    { value: 'easeIn', label: 'Entrée douce', curve: 'cubic-bezier(0.4,0,1,1)' },
    { value: 'easeInOut', label: 'Doux', curve: 'cubic-bezier(0.4,0,0.2,1)' },
    { value: 'linear', label: 'Linéaire', curve: 'linear' },
    { value: 'spring', label: 'Ressort', curve: 'cubic-bezier(0.34,1.56,0.64,1)' },
    { value: 'bounce', label: 'Rebond', curve: 'cubic-bezier(0.68,-0.55,0.27,1.55)' },
    { value: 'elastic', label: 'Élastique', curve: 'cubic-bezier(0.68,-0.6,0.32,1.6)' },
];

const HOVER_PRESETS: { value: HoverEffect; label: string; icon: string }[] = [
    { value: 'none', label: 'Aucun', icon: '⊘' },
    { value: 'lift', label: 'Élévation', icon: '⬆' },
    { value: 'glow', label: 'Lueur', icon: '✦' },
    { value: 'scale', label: 'Agrandir', icon: '⤢' },
    { value: 'tilt', label: 'Incliner', icon: '◇' },
    { value: 'shadow', label: 'Ombre', icon: '◧' },
    { value: 'border-glow', label: 'Bordure', icon: '▣' },
];

// ==================================
// Composant ColorPicker compact — V3 enhanced with recent colors §727
// ==================================

function CompactColorPicker({ value, onChange, colors = QUICK_COLORS }: {
    value?: string; onChange: (v: string) => void; colors?: string[];
}) {
    const [expanded, setExpanded] = useState(false);
    const [customMode, setCustomMode] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([]);
    const [hexInput, setHexInput] = useState(value || '');

    // Sync hex input with value prop
    useEffect(() => { setHexInput(value || ''); }, [value]);

    // Track recent colors
    const trackColor = useCallback((color: string) => {
        if (!color || color === value) return;
        setRecentColors(prev => {
            const filtered = prev.filter(c => c !== color);
            return [color, ...filtered].slice(0, 8);
        });
    }, [value]);

    // Validate and apply hex color
    const commitHex = useCallback((hex: string) => {
        const cleaned = hex.replace('#', '').trim();
        if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
            const full = '#' + cleaned.split('').map(c => c + c).join('');
            onChange(full);
            trackColor(full);
        } else if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
            onChange('#' + cleaned);
            trackColor('#' + cleaned);
        }
    }, [onChange, trackColor]);

    const handleColorSelect = useCallback((color: string) => {
        onChange(color);
        trackColor(color);
    }, [onChange, trackColor]);

    return (
        <div className="cms-compact-color-picker">
            <div className="cms-compact-color-picker__row">
                <div
                    className="cms-compact-color-picker__swatch"
                    style={{ backgroundColor: value || '#ffffff' }}
                    onClick={() => setExpanded(!expanded)}
                    title={value || 'Aucune couleur'}
                />
                <input
                    type="text"
                    value={hexInput}
                    onChange={(e) => setHexInput(e.target.value)}
                    onBlur={() => commitHex(hexInput)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitHex(hexInput); }}
                    placeholder="#000000"
                    className="cms-hex-input cms-hex-input--flex"
                    maxLength={7}
                />
                <button
                    onClick={() => setExpanded(!expanded)}
                    className={`shrink-0 rounded p-1 transition-colors cms-compact-color-picker__chevron-btn ${expanded ? 'cms-compact-color-picker__chevron-btn--active' : 'cms-compact-color-picker__chevron-btn--inactive'}`}
                >
                    {expanded ? <ChevronUp className="cms-icon--sm" /> : <ChevronDown className="cms-icon--sm" />}
                </button>
            </div>
            {expanded && (
                <div className="cms-compact-color-picker__expand cms-content-enter">
                    {/* Grille de couleurs — cms-color-grid */}
                    <div className="cms-color-grid">
                        {colors.map((color, i) => (
                            <button
                                key={`${color}-${i}`}
                                onClick={() => handleColorSelect(color)}
                                className={`cms-color-grid__swatch ${value === color ? 'cms-color-grid__swatch--active' : ''}`}
                                style={{ backgroundColor: color }}
                                data-color={color}
                                title={color}
                            />
                        ))}
                    </div>
                    {/* Recent colors row — §727 */}
                    {recentColors.length > 0 && (
                        <div className="cms-color-picker-v3__recent">
                            <span className="cms-color-picker-v3__recent-label">Récent</span>
                            {recentColors.map((color, i) => (
                                <button
                                    key={`recent-${i}`}
                                    onClick={() => handleColorSelect(color)}
                                    className="cms-color-picker-v3__recent-swatch"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                    )}
                    <button
                        onClick={() => setCustomMode(!customMode)}
                        className="cms-compact-color-picker__custom-btn"
                    >
                        <Pipette className="cms-icon--xs" />
                        {customMode ? 'Masquer' : 'Couleur personnalisée'}
                    </button>
                    {customMode && (
                        <input
                            type="color"
                            value={value || '#000000'}
                            onChange={(e) => handleColorSelect(e.target.value)}
                            className="cms-compact-color-picker__native"
                        />
                    )}
                </div>
            )}
        </div>
    );
}

// ==================================
// Composant SectionCollapsible (sections repliables)
// ==================================

function SectionCollapsible({ title, icon, children, defaultOpen = true, accentColor = 'blue' }: {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    accentColor?: string;
}) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className={`cms-prop-group cms-prop-group--${accentColor} ${open ? 'cms-prop-group--open' : ''}`}>
            <button
                className="cms-prop-group__header"
                onClick={() => setOpen(!open)}
            >
                {icon && <span className="cms-prop-group__icon">{icon}</span>}
                <span className="cms-prop-group__title">{title}</span>
                <ChevronDown className="cms-prop-group__chevron" />
            </button>
            {open && (
                <div className="cms-collapsible-body">
                    {children}
                </div>
            )}
        </div>
    );
}

// ==================================
// Composant SliderField — Enhanced with gradient track + tooltip §726
// ==================================

function SliderField({ label, value, onChange, min, max, step = 1, unit = '', accentColor = 'blue' }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    accentColor?: string;
}) {
    const colorMap: Record<string, string> = { blue: '#3b82f6', purple: '#8b5cf6', amber: '#f59e0b', emerald: '#10b981', rose: '#f43f5e', indigo: '#6366f1' };
    const color = colorMap[accentColor] || '#3b82f6';
    const pct = ((value - min) / (max - min)) * 100;
    const tooltipLeft = `${pct}%`;

    return (
        <div className="cms-slider-field">
            <div className="cms-slider-field__header">
                <span className="cms-field-sublabel cms-field-sublabel--normal">{label}</span>
                <span className="cms-slider-field__value">{value}{unit}</span>
            </div>
            <div className="cms-range-pro">
                <input
                    type="range" min={min} max={max} step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="cms-range-pro__input"
                    style={{ '--range-percent': `${pct}%`, '--range-color': color } as React.CSSProperties}
                />
                <div className="cms-range-pro__tooltip" style={{ left: tooltipLeft }}>{value}{unit}</div>
            </div>
        </div>
    );
}

// ==================================
// Composant principal
// ==================================

export function SectionInlineEditor({
    styleConfig, onChange, sectionType, sectionLabel, onClose, onOpenFullEditor,
    onDuplicate, onDelete, onMoveUp, onMoveDown, onSectionTypeChange,
}: SectionInlineEditorProps) {
    const [activeTab, setActiveTab] = useState<TabId>('fond');
    const [copied, setCopied] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [panelWidth, setPanelWidth] = useState(288);
    const [showCSSPreview, setShowCSSPreview] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const [showPasteStyle, setShowPasteStyle] = useState(false);
    const [pasteStyleText, setPasteStyleText] = useState('');
    const [animKey, setAnimKey] = useState(0);
    const [showQuickPalette, setShowQuickPalette] = useState(false);
    const [linkPadding, setLinkPadding] = useState(false);
    const [linkMargin, setLinkMargin] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const [showTypeSwitcher, setShowTypeSwitcher] = useState(false);
    const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // ═══ Style History (Undo/Redo) ═══
    const [styleHistory, setStyleHistory] = useState<SectionStyleConfig[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const lastCommittedStyle = useRef<SectionStyleConfig | null>(null);

    // Commit style change to history (debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (lastCommittedStyle.current && JSON.stringify(lastCommittedStyle.current) !== JSON.stringify(styleConfig)) {
                setStyleHistory(prev => {
                    const newHistory = prev.slice(0, historyIndex + 1);
                    newHistory.push(lastCommittedStyle.current!);
                    return newHistory.slice(-30); // Max 30 steps
                });
                setHistoryIndex(prev => Math.min(prev + 1, 29));
                lastCommittedStyle.current = styleConfig;
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [styleConfig, historyIndex]);

    // Initialize last committed style
    useEffect(() => {
        if (!lastCommittedStyle.current) {
            lastCommittedStyle.current = styleConfig;
        }
    }, []);

    const handleUndoStyle = useCallback(() => {
        if (historyIndex > 0) {
            const prevStyle = styleHistory[historyIndex - 1];
            if (prevStyle) {
                onChange(prevStyle);
                setHistoryIndex(prev => prev - 1);
            }
        }
    }, [historyIndex, styleHistory, onChange]);

    const handleRedoStyle = useCallback(() => {
        if (historyIndex < styleHistory.length - 1) {
            const nextStyle = styleHistory[historyIndex + 1];
            if (nextStyle) {
                onChange(nextStyle);
                setHistoryIndex(prev => prev + 1);
            }
        }
    }, [historyIndex, styleHistory, onChange]);

    // ═══ Active properties counter ═══
    const activePropertiesCount = useMemo(() => {
        let count = 0;
        if (bg.type !== 'color' || bg.color !== '#ffffff') count++;
        if (typo.fontWeight !== 'normal' || typo.fontFamily !== 'sans' || typo.textAlign !== 'left') count++;
        if (border.width && border.width !== 'none') count++;
        if (shadow.type && shadow.type !== 'none') count++;
        if (animations.type && animations.type !== 'none') count++;
        if (transform.rotate || transform.scaleX !== 1 || transform.scaleY !== 1) count++;
        if (spacing.paddingTop && spacing.paddingTop !== '0') count++;
        return count;
    }, [bg, typo, border, shadow, animations, transform, spacing]);

    // ═══ Keyboard shortcuts ═══
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); handleUndoStyle(); }
                if (e.key === 'y') { e.preventDefault(); handleRedoStyle(); }
            }
            // Arrow keys for tab navigation (when not in input)
            if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const currentIdx = filteredTabs.findIndex(t => t.id === activeTab);
                    if (currentIdx >= 0) {
                        e.preventDefault();
                        const nextIdx = e.key === 'ArrowRight'
                            ? (currentIdx + 1) % filteredTabs.length
                            : (currentIdx - 1 + filteredTabs.length) % filteredTabs.length;
                        setActiveTab(filteredTabs[nextIdx].id);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndoStyle, handleRedoStyle, activeTab, filteredTabs]);

    // ═══ Paste style from JSON ═══
    const handlePasteStyle = useCallback(() => {
        try {
            const parsed = JSON.parse(pasteStyleText);
            onChange({ ...styleConfig, ...parsed });
            setShowPasteStyle(false);
            setPasteStyleText('');
            toast.success('Style collé avec succès');
        } catch {
            toast.error('JSON invalide. Vérifiez le format.');
        }
    }, [pasteStyleText, styleConfig, onChange]);

    // Resize handler
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = panelWidth;
        const handleMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            setPanelWidth(Math.max(240, Math.min(420, startWidth + (startX - ev.clientX))));
        };
        const handleUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [panelWidth]);

    // Valeurs courantes
    const bg = (styleConfig.background || {}) as BackgroundStyle;
    const typo = (styleConfig.typography || {}) as TypographyStyle;
    const border = (styleConfig.border || {}) as BorderStyle;
    const shadow = (styleConfig.shadow || {}) as ShadowStyle;
    const spacing = (styleConfig.spacing || {}) as SpacingStyle;
    const transform = (styleConfig.transform || {}) as TransformStyle;
    const animations = (styleConfig.animations || {}) as AnimationConfig;

    // Update helpers
    const updateBg = useCallback((partial: Partial<BackgroundStyle>) => {
        onChange({ ...styleConfig, background: { ...bg, ...partial } });
    }, [styleConfig, bg, onChange]);

    const updateTypo = useCallback((partial: Partial<TypographyStyle>) => {
        onChange({ ...styleConfig, typography: { ...typo, ...partial } });
    }, [styleConfig, typo, onChange]);

    const updateBorder = useCallback((partial: Partial<BorderStyle>) => {
        onChange({ ...styleConfig, border: { ...border, ...partial } });
    }, [styleConfig, border, onChange]);

    const updateShadow = useCallback((partial: Partial<ShadowStyle>) => {
        onChange({ ...styleConfig, shadow: { ...shadow, ...partial } });
    }, [styleConfig, shadow, onChange]);

    const updateSpacing = useCallback((partial: Partial<SpacingStyle>) => {
        onChange({ ...styleConfig, spacing: { ...spacing, ...partial } });
    }, [styleConfig, spacing, onChange]);

    const updateTransform = useCallback((partial: Partial<TransformStyle>) => {
        onChange({ ...styleConfig, transform: { ...transform, ...partial } });
    }, [styleConfig, transform, onChange]);

    const updateAnimations = useCallback((partial: Partial<AnimationConfig>) => {
        onChange({ ...styleConfig, animations: { ...animations, ...partial } });
    }, [styleConfig, animations, onChange]);

    const updateLayout = useCallback((partial: Partial<LayoutStyle>) => {
        onChange({ ...styleConfig, layout: { ...(styleConfig.layout || {}), ...partial } });
    }, [styleConfig, onChange]);

    // Copy current style config
    const handleCopyStyle = useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify(styleConfig, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }, [styleConfig]);

    // Reset all
    const handleReset = useCallback(() => {
        onChange({
            typography: { fontFamily: 'sans', fontWeight: 'normal', fontSize: 'base', lineHeight: 'relaxed', letterSpacing: 'normal', textAlign: 'left', textTransform: 'none' },
            background: { type: 'color', color: '#ffffff', overlay: false, overlayColor: '#000000', overlayOpacity: 0, imagePosition: 'cover' },
            spacing: { paddingTop: 'clamp(2rem, 1.5rem + 2vw, 4rem)', paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)', paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)', paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)', marginTop: '0', marginBottom: '0', gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)' },
            border: { width: 'none', color: '#e5e7eb', style: 'solid', radius: 'none' },
            shadow: { type: 'none' },
            animations: { type: 'none', duration: 0.5, delay: 0, easing: 'easeOut', hover: 'none' },
            layout: { display: 'block', visibleDesktop: true, visibleTablet: true, visibleMobile: true, contentWidth: 'full' },
        });
    }, [onChange]);

    // ═══ Section actions handlers ═══
    const handleDuplicate = useCallback(() => {
        if (onDuplicate) { onDuplicate(); toast.success('Section dupliquée'); }
    }, [onDuplicate]);

    const handleDelete = useCallback(() => {
        if (onDelete) { onDelete(); toast.success('Section supprimée'); }
    }, [onDelete]);

    const handleMoveUp = useCallback(() => {
        if (onMoveUp) { onMoveUp(); }
    }, [onMoveUp]);

    const handleMoveDown = useCallback(() => {
        if (onMoveDown) { onMoveDown(); }
    }, [onMoveDown]);

    const handleToggleHidden = useCallback(() => {
        setIsHidden(h => !h);
        toast.success(isHidden ? 'Section visible' : 'Section masquée');
    }, [isHidden]);

    const handleToggleLock = useCallback(() => {
        setIsLocked(l => !l);
        toast.success(isLocked ? 'Section déverrouillée' : 'Section verrouillée');
    }, [isLocked]);

    const hasSectionActions = onDuplicate || onDelete || onMoveUp || onMoveDown;

    // ═══ Tab property counters — count modified properties per tab ═══
    const tabCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        // Presets: 0 (always default)
        counts['presets'] = 0;
        // Fond: type !== color, color !== #fff, gradient, image
        const bgDef = { type: 'color', color: '#ffffff' };
        if (bg.type !== bgDef.type || (bg.color && bg.color !== bgDef.color) || bg.type === 'gradient' || bg.type === 'image') counts['fond'] = 1;
        else counts['fond'] = 0;
        // Texte: fontWeight, fontFamily, textAlign, textTransform
        const typoDef = { fontWeight: 'normal', fontFamily: 'sans', textAlign: 'left', textTransform: 'none' };
        let typoCount = 0;
        if (typo.fontWeight !== typoDef.fontWeight) typoCount++;
        if (typo.fontFamily !== typoDef.fontFamily) typoCount++;
        if (typo.textAlign !== typoDef.textAlign) typoCount++;
        if (typo.textTransform !== typoDef.textTransform) typoCount++;
        counts['texte'] = typoCount;
        // Bordure: width, color, style, radius, outline
        let borderCount = 0;
        if (border.width && border.width !== 'none') borderCount++;
        if (border.color && border.color !== '#e5e7eb') borderCount++;
        if (border.style && border.style !== 'solid') borderCount++;
        if (border.radius && border.radius !== 'none') borderCount++;
        if ((border as any).outlineStyle) borderCount++;
        counts['bordure'] = borderCount;
        // Espace: padding, margin, gap
        let spacingCount = 0;
        if (spacing.paddingTop && spacing.paddingTop !== '0') spacingCount++;
        if (spacing.paddingBottom && spacing.paddingBottom !== '0') spacingCount++;
        if (spacing.marginTop && spacing.marginTop !== '0') spacingCount++;
        counts['espace'] = spacingCount;
        // Layout: display, contentWidth, visibility
        let layoutCount = 0;
        if (layout.display && layout.display !== 'block') layoutCount++;
        if (layout.contentWidth && layout.contentWidth !== 'full') layoutCount++;
        if (layout.visibleDesktop === false || layout.visibleTablet === false || layout.visibleMobile === false) layoutCount++;
        counts['disposition'] = layoutCount;
        // Effets: shadow, transform, opacity, hover, blend
        let effetCount = 0;
        if (shadow.type && shadow.type !== 'none') effetCount++;
        if (transform.rotate || transform.scaleX !== 1 || transform.scaleY !== 1) effetCount++;
        if ((transform as any).opacity !== undefined && (transform as any).opacity !== 1) effetCount++;
        if (animations.hover && animations.hover !== 'none') effetCount++;
        counts['effet'] = effetCount;
        // Animation: type, duration, delay, easing
        let animCount = 0;
        if (animations.type && animations.type !== 'none') animCount++;
        if (animations.duration && animations.duration !== 0.5) animCount++;
        if (animations.delay && animations.delay !== 0) animCount++;
        if (animations.easing && animations.easing !== 'easeOut') animCount++;
        counts['animation'] = animCount;
        // Responsive: visibility toggles
        let respCount = 0;
        if (layout.visibleDesktop === false) respCount++;
        if (layout.visibleTablet === false) respCount++;
        if (layout.visibleMobile === false) respCount++;
        counts['responsive'] = respCount;
        return counts;
    }, [bg, typo, border, spacing, layout, shadow, transform, animations]);

    // ═══ Reset active tab properties ═══
    const handleResetTab = useCallback(() => {
        switch (activeTab) {
            case 'fond': updateBg({ type: 'color', color: '#ffffff', overlay: false, overlayColor: '#000000', overlayOpacity: 0, imagePosition: 'cover' }); break;
            case 'texte': updateTypo({ fontFamily: 'sans', fontWeight: 'normal', fontSize: 'base', lineHeight: 'relaxed', letterSpacing: 'normal', textAlign: 'left', textTransform: 'none' }); break;
            case 'bordure': updateBorder({ width: 'none', color: '#e5e7eb', style: 'solid', radius: 'none' }); break;
            case 'espace': updateSpacing({ paddingTop: 'clamp(2rem, 1.5rem + 2vw, 4rem)', paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)', paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)', paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)', marginTop: '0', marginBottom: '0', gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)' }); break;
            case 'disposition': updateLayout({ display: 'block', visibleDesktop: true, visibleTablet: true, visibleMobile: true, contentWidth: 'full' }); break;
            case 'effet': updateShadow({ type: 'none' }); updateTransform({ rotate: 0, scaleX: 1, scaleY: 1 }); break;
            case 'animation': updateAnimations({ type: 'none', duration: 0.5, delay: 0, easing: 'easeOut', hover: 'none' }); break;
            case 'responsive': updateLayout({ visibleDesktop: true, visibleTablet: true, visibleMobile: true }); break;
            default: break;
        }
        toast.success(`Onglet "${TABS.find(t => t.id === activeTab)?.label}" réinitialisé`);
    }, [activeTab, updateBg, updateTypo, updateBorder, updateSpacing, updateLayout, updateShadow, updateTransform, updateAnimations]);

    const layout = (styleConfig.layout || {}) as LayoutStyle;

    // ═══ SMART TABS — Onglets contextuels selon le type de section ═══
    // Chaque type de section a ses onglets pertinents (meilleures pratiques UX)
    const SECTION_TAB_MAP: Record<string, TabId[]> = useMemo(() => ({
        // Hero: tous les onglets (section principale)
        HeroSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'disposition', 'effet', 'animation', 'responsive'],
        HeroVideoSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'disposition', 'effet', 'animation', 'responsive'],
        // Texte: focus sur typographie et fond
        TexteSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        // Galeries: focus sur fond, bordure, effets
        GalerieSection: ['presets', 'fond', 'bordure', 'espace', 'effet', 'responsive'],
        GalerieMasonrySection: ['presets', 'fond', 'bordure', 'espace', 'effet', 'responsive'],
        // Carousel: fond, effets, animation
        CarouselSection: ['presets', 'fond', 'bordure', 'espace', 'effet', 'animation', 'responsive'],
        // Video: fond, bordure, effets
        VideoSection: ['presets', 'fond', 'bordure', 'espace', 'effet'],
        // Téléchargements: fond, texte, bordure
        TelechargementsSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        // Actualités: fond, texte, bordure, espace
        ActualitesSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'responsive'],
        // HTML Custom: minimal (fond, bordure, espace)
        HtmlCustomSection: ['fond', 'bordure', 'espace'],
        // Témoignages: fond, texte, bordure
        TemoignagesSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        TemoignageCarouselSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'animation'],
        // Équipe: fond, texte, bordure
        EquipeSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        // Partenaires: fond, bordure, espace
        PartenairesSection: ['presets', 'fond', 'bordure', 'espace'],
        // Cartes: fond, texte, bordure, espace, effets
        CarteInfosSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        CarteSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        // Chiffres clés: fond, texte, effets, animation
        ChiffresClesSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet', 'animation'],
        CompteursAnimesSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet', 'animation'],
        // Horaires: fond, texte, bordure
        HorairesSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        // FAQ: fond, texte, bordure, espace
        FaqSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        // Timeline: fond, texte, bordure, animation
        TimelineSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'animation'],
        // Tabs: fond, texte, bordure
        TabsSection: ['presets', 'fond', 'texte', 'bordure', 'espace'],
        // Icones Features: fond, texte, effets
        IconeFeaturesSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        // Prix: fond, texte, bordure, effets
        PrixTabSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        // Formulaire: fond, texte, bordure, espace, effets
        FormulaireSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet'],
        // Appel Action / Newsletter: fond, texte, bordure, animation
        AppelActionSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet', 'animation'],
        NewsletterSection: ['presets', 'fond', 'texte', 'bordure', 'espace', 'effet', 'animation'],
        // Séparateur: minimal (fond, espace)
        SeparateurSection: ['fond', 'espace'],
    }), []);

    // Filtrer les onglets selon le type de section
    const allTabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
        { id: 'presets', icon: <Sparkles className="cms-tab-icon" />, label: 'Thèmes' },
        { id: 'fond', icon: <ImageIcon className="cms-tab-icon" />, label: 'Fond' },
        { id: 'texte', icon: <Type className="cms-tab-icon" />, label: 'Texte' },
        { id: 'bordure', icon: <Square className="cms-tab-icon" />, label: 'Bordure' },
        { id: 'espace', icon: <Minus className="cms-tab-icon" />, label: 'Espace' },
        { id: 'disposition', icon: <Columns3 className="cms-tab-icon" />, label: 'Layout' },
        { id: 'effet', icon: <Sparkles className="cms-tab-icon" />, label: 'Effets' },
        { id: 'animation', icon: <Clock className="cms-tab-icon" />, label: 'Anim' },
        { id: 'responsive', icon: <MonitorIcon className="cms-tab-icon" />, label: 'Device' },
    ];

    // Onglets filtrés selon le type de section (smart tabs)
    const allowedTabIds = SECTION_TAB_MAP[sectionType] || allTabs.map(t => t.id);
    const TABS = allTabs.filter(t => allowedTabIds.includes(t.id));

    // Filtrer les onglets par recherche (searchFilter)
    const filteredTabs = useMemo(() => {
        if (!searchFilter.trim()) return TABS;
        const q = searchFilter.toLowerCase();
        return TABS.filter(t => t.label.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
    }, [TABS, searchFilter]);

    // Si l'onglet actif n'est plus dans les onglets filtrés, revenir au premier
    useEffect(() => {
        if (filteredTabs.length > 0 && !filteredTabs.find(t => t.id === activeTab)) {
            setActiveTab(filteredTabs[0].id);
        }
    }, [filteredTabs, activeTab]);

    // Appliquer un preset de style
    const applyPreset = useCallback((preset: StylePreset) => {
        const merged: SectionStyleConfig = {
            ...styleConfig,
            ...preset.config,
            background: { ...styleConfig.background, ...preset.config.background },
            typography: { ...styleConfig.typography, ...preset.config.typography },
            spacing: { ...styleConfig.spacing, ...preset.config.spacing },
            border: { ...styleConfig.border, ...preset.config.border },
            shadow: { ...styleConfig.shadow, ...preset.config.shadow },
        };
        onChange(merged);
        toast.success(`Thème "${preset.label}" appliqué`);
    }, [styleConfig, onChange]);

    // Classe responsive selon la largeur du panneau
    const panelSizeClass = panelWidth < 280 ? 'cms-panel-compact' : panelWidth < 360 ? 'cms-panel-medium' : 'cms-panel-full';

    return (
        <div
            ref={panelRef}
            className={`cms-floating-panel cms-floating-panel--ultra cms-floating-panel--slide-right cms-content-enter absolute right-3 top-14 z-30 overflow-hidden ${panelSizeClass} ${isCompact ? 'cms-floating-panel--compact' : ''}`}
            style={{ width: panelWidth, maxHeight: 'calc(100% - 120px)' }}
        >
            {/* Resize handle (left edge) */}
            <div
                onMouseDown={handleResizeStart}
                className="cms-resize-handle cms-resize-handle--left"
                title="Redimensionner"
            />
            {/* ─── Header avec live preview + Quick Actions ─── compact */}
            <div className="cms-right-panel__header">
                {/* Live preview swatch */}
                <div
                    className="cms-section-editor__live-swatch"
                    style={{
                        background: bg.type === 'gradient'
                            ? `linear-gradient(${bg.gradientDirection || 'to-b'}, ${bg.gradientFrom || '#ccc'}, ${bg.gradientTo || '#999'})`
                            : bg.type === 'image'
                                ? `url(${bg.imageUrl || ''}) center/cover`
                                : (bg.color || '#ffffff'),
                        boxShadow: shadow.type === 'none' ? 'inset 0 0 0 1px rgba(0,0,0,0.04)' : undefined,
                        borderRadius: border.radius === 'full' ? '9999px' : border.radius === 'xl' ? '8px' : border.radius === 'lg' ? '6px' : border.radius === 'md' ? '4px' : '3px',
                    }}
                    title="Aperçu du style actuel"
                />
                <div className="cms-section-editor__info-row">
                    <span className="cms-right-panel__header-text truncate">
                        {sectionLabel || sectionType.replace(/Section$/, '')}
                    </span>
                    {/* Smart type badge — cliquable pour changer le type */}
                    <button
                        className={`cms-section-type-badge cms-section-type-badge--clickable ${
                            sectionType.includes('Hero') ? 'cms-section-type-badge--hero' :
                            sectionType.includes('Texte') || sectionType.includes('Faq') || sectionType.includes('Timeline') ? 'cms-section-type-badge--content' :
                            sectionType.includes('Galerie') || sectionType.includes('Video') || sectionType.includes('Carousel') ? 'cms-section-type-badge--media' :
                            sectionType.includes('Formulaire') || sectionType.includes('Appel') || sectionType.includes('Newsletter') ? 'cms-section-type-badge--interactive' :
                            'cms-section-type-badge--minimal'
                        }`}
                        onClick={() => setShowTypeSwitcher(v => !v)}
                        title={`Type: ${sectionType} — Cliquer pour changer`}
                        type="button"
                    >
                        {sectionType.replace(/Section$/, '').substring(0, 6)}
                        <ChevronDown className="cms-section-type-badge__chevron" />
                    </button>
                    {/* Active properties badge */}
                    {activePropertiesCount > 0 && (
                        <span className="cms-active-count">
                            {activePropertiesCount}
                        </span>
                    )}
                </div>
                <div className="cms-right-panel__actions">
                    {/* Quick palette toggle */}
                    <button
                        onClick={() => setShowQuickPalette(v => !v)}
                        className={`cms-right-panel__action-btn ${showQuickPalette ? 'text-blue-500' : ''}`}
                        title="Palette rapide"
                    >
                        <Palette className="cms-icon--sm" />
                    </button>
                    {/* Compact mode toggle */}
                    <button
                        onClick={() => setIsCompact(c => !c)}
                        className={`cms-right-panel__action-btn ${isCompact ? 'text-purple-500' : ''}`}
                        title={isCompact ? 'Mode normal' : 'Mode compact'}
                    >
                        <Minimize2 className="cms-icon--sm" />
                    </button>
                    {/* Keyboard shortcuts help */}
                    <button
                        onClick={() => setShowShortcutsHelp(v => !v)}
                        className={`cms-right-panel__action-btn ${showShortcutsHelp ? 'text-amber-500' : ''}`}
                        title="Raccourcis clavier"
                    >
                        <Keyboard className="cms-icon--sm" />
                    </button>
                    <button onClick={() => setIsCollapsed(c => !c)} className="cms-right-panel__action-btn" title={isCollapsed ? 'Déplier' : 'Replier'}>
                        {isCollapsed ? <ChevronDown className="cms-icon--sm" /> : <ChevronUp className="cms-icon--sm" />}
                    </button>
                    <button onClick={onClose} className="cms-panel-close" title="Fermer">
                        <X className="cms-icon--sm" />
                    </button>
                </div>
            </div>

            {/* ─── Progress bar (global customization progress) ─── */}
            <div className="cms-inline-header-progress" title={`${activePropertiesCount} propriétés modifiées`}>
                <div className="cms-inline-header-progress__bar">
                    <div
                        className="cms-inline-header-progress__fill"
                        style={{
                            width: `${Math.min(100, activePropertiesCount * 14)}%`,
                            background: activePropertiesCount >= 6
                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                : activePropertiesCount >= 3
                                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                    : activePropertiesCount > 0
                                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                        : 'transparent',
                        }}
                    />
                </div>
                {activePropertiesCount > 0 && (
                    <span className="cms-inline-header-progress__value" style={{
                        color: activePropertiesCount >= 6 ? '#10b981' : activePropertiesCount >= 3 ? '#3b82f6' : '#f59e0b',
                    }}>
                        {activePropertiesCount}/7
                    </span>
                )}
            </div>

            {/* ─── Visual Style Summary — Résumé visuel compact ─── */}
            <div className="cms-style-summary-bar" title="Résumé du style actuel">
                {/* Background indicator */}
                <div className="cms-style-summary-item" title={`Fond: ${bg.type === 'gradient' ? 'Dégradé' : bg.type === 'image' ? 'Image' : bg.color || '#fff'}`}>
                    <div
                        className="cms-style-summary-swatch"
                        style={{
                            background: bg.type === 'gradient'
                                ? `linear-gradient(135deg, ${bg.gradientFrom || '#ccc'}, ${bg.gradientTo || '#999'})`
                                : bg.type === 'image' ? `url(${bg.imageUrl || ''}) center/cover` : (bg.color || '#ffffff'),
                        }}
                    />
                    <span className="cms-style-summary-label">Fond</span>
                </div>
                {/* Text color indicator */}
                <div className="cms-style-summary-item" title={`Texte: ${typo.color || '#111'}`}>
                    <div className="cms-style-summary-swatch" style={{ backgroundColor: typo.color || '#111827' }} />
                    <span className="cms-style-summary-label">Texte</span>
                </div>
                {/* Border indicator */}
                <div className="cms-style-summary-item" title={`Bordure: ${border.width || 0}px ${border.style || 'solid'} ${border.color || 'transparent'}`}>
                    <div
                        className="cms-style-summary-swatch cms-style-summary-swatch--border"
                        style={{
                            borderColor: border.color || '#e5e7eb',
                            borderWidth: Math.min(3, parseInt(border.width || '0') / 4 + 1) + 'px',
                            borderStyle: border.style || 'solid',
                            borderRadius: border.radius === 'full' ? '9999px' : border.radius === 'xl' ? '6px' : border.radius === 'lg' ? '4px' : border.radius === 'md' ? '3px' : '2px',
                        }}
                    />
                    <span className="cms-style-summary-label">Bord</span>
                </div>
                {/* Shadow indicator */}
                <div className="cms-style-summary-item" title={`Ombre: ${shadow.type || 'none'}`}>
                    <div
                        className="cms-style-summary-swatch"
                        style={{
                            boxShadow: shadow.type === 'none' ? 'none'
                                : shadow.type === 'sm' ? '0 1px 2px rgba(0,0,0,0.1)'
                                : shadow.type === 'md' ? '0 4px 6px rgba(0,0,0,0.1)'
                                : shadow.type === 'lg' ? '0 10px 15px rgba(0,0,0,0.1)'
                                : shadow.type === 'xl' ? '0 20px 25px rgba(0,0,0,0.15)'
                                : '0 25px 50px rgba(0,0,0,0.25)',
                            backgroundColor: '#f8fafc',
                        }}
                    />
                    <span className="cms-style-summary-label">Ombre</span>
                </div>
                {/* Spacing indicator */}
                <div className="cms-style-summary-item" title={`Padding: ${spacing.paddingY || 0}px ${spacing.paddingX || 0}px`}>
                    <div className="cms-style-summary-swatch cms-style-summary-swatch--spacing">
                        <div className="cms-style-summary-spacing-inner" />
                    </div>
                    <span className="cms-style-summary-label">Espace</span>
                </div>
            </div>

            {/* ─── Section Type Switcher — Dropdown §760 ─── */}
            {showTypeSwitcher && (
                <div className="cms-type-switcher cms-scale-enter">
                    <div className="cms-type-switcher__header">
                        <span className="cms-type-switcher__title">Changer le type</span>
                        <button onClick={() => setShowTypeSwitcher(false)} className="cms-panel-close" title="Fermer">
                            <X className="cms-icon--xs" />
                        </button>
                    </div>
                    <div className="cms-type-switcher__search">
                        <Search className="cms-type-switcher__search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher un type..."
                            className="cms-type-switcher__search-input"
                            autoFocus
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                        />
                    </div>
                    <div className="cms-type-switcher__list">
                        {SECTION_TYPES
                            .filter(t => !searchFilter || t.label.toLowerCase().includes(searchFilter.toLowerCase()) || t.value.toLowerCase().includes(searchFilter.toLowerCase()))
                            .map(type => (
                            <button
                                key={type.value}
                                className={`cms-type-switcher__item ${type.value === sectionType ? 'cms-type-switcher__item--active' : ''}`}
                                onClick={() => {
                                    if (type.value !== sectionType && onSectionTypeChange) {
                                        onSectionTypeChange(type.value);
                                        toast.success(`Type changé en "${type.label}"`);
                                    }
                                    setShowTypeSwitcher(false);
                                    setSearchFilter('');
                                }}
                                disabled={type.value === sectionType}
                            >
                                <span className="cms-type-switcher__item-icon">{type.icon}</span>
                                <span className="cms-type-switcher__item-label">{type.label}</span>
                                <span className="cms-type-switcher__item-category">{type.category}</span>
                                {type.value === sectionType && <Check className="cms-type-switcher__item-check" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Keyboard Shortcuts Help — Overlay §760 ─── */}
            {showShortcutsHelp && (
                <div className="cms-shortcuts-help cms-scale-enter">
                    <div className="cms-shortcuts-help__header">
                        <Keyboard className="cms-shortcuts-help__icon" />
                        <span className="cms-shortcuts-help__title">Raccourcis clavier</span>
                        <button onClick={() => setShowShortcutsHelp(false)} className="cms-panel-close" title="Fermer">
                            <X className="cms-icon--xs" />
                        </button>
                    </div>
                    <div className="cms-shortcuts-help__list">
                        {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                            <div key={i} className="cms-shortcuts-help__item">
                                <kbd className="cms-shortcuts-help__keys">{shortcut.keys}</kbd>
                                <span className="cms-shortcuts-help__desc">{shortcut.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── Quick Actions Bar — Section operations §735 ─── */}
            {hasSectionActions && (
                <div className="cms-quick-actions-bar">
                    <div className="cms-quick-actions-bar__group">
                        <button
                            onClick={handleMoveUp}
                            disabled={!onMoveUp}
                            className="cms-quick-action-btn"
                            title="Déplacer vers le haut"
                        >
                            <ArrowUp className="cms-quick-action-btn__icon" />
                        </button>
                        <button
                            onClick={handleMoveDown}
                            disabled={!onMoveDown}
                            className="cms-quick-action-btn"
                            title="Déplacer vers le bas"
                        >
                            <ArrowDown className="cms-quick-action-btn__icon" />
                        </button>
                    </div>
                    <div className="cms-quick-actions-bar__sep" />
                    <div className="cms-quick-actions-bar__group">
                        <button
                            onClick={handleDuplicate}
                            disabled={!onDuplicate}
                            className="cms-quick-action-btn cms-quick-action-btn--blue"
                            title="Dupliquer la section"
                        >
                            <Copy className="cms-quick-action-btn__icon" />
                        </button>
                        <button
                            onClick={handleToggleHidden}
                            className={`cms-quick-action-btn ${isHidden ? 'cms-quick-action-btn--amber' : ''}`}
                            title={isHidden ? 'Rendre visible' : 'Masquer la section'}
                        >
                            {isHidden ? <EyeOff className="cms-quick-action-btn__icon" /> : <Eye className="cms-quick-action-btn__icon" />}
                        </button>
                        <button
                            onClick={handleToggleLock}
                            className={`cms-quick-action-btn ${isLocked ? 'cms-quick-action-btn--red' : ''}`}
                            title={isLocked ? 'Déverrouiller' : 'Verrouiller'}
                        >
                            {isLocked ? <Lock className="cms-quick-action-btn__icon" /> : <Unlock className="cms-quick-action-btn__icon" />}
                        </button>
                    </div>
                    {onDelete && (
                        <>
                            <div className="cms-quick-actions-bar__sep" />
                            <button
                                onClick={handleDelete}
                                className="cms-quick-action-btn cms-quick-action-btn--danger"
                                title="Supprimer la section"
                            >
                                <Trash2 className="cms-quick-action-btn__icon" />
                            </button>
                        </>
                    )}
                    {/* Status indicators */}
                    {(isHidden || isLocked) && (
                        <div className="cms-quick-actions-bar__status">
                            {isHidden && <span className="cms-status-dot cms-status-dot--amber" title="Masquée" />}
                            {isLocked && <span className="cms-status-dot cms-status-dot--red" title="Verrouillée" />}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Quick color palette (toggleable) ─── */}
            {showQuickPalette && (
                <div className="cms-quick-palette cms-tab-content-enter" style={{ margin: '4px 8px' }}>
                    {QUICK_COLORS.slice(0, 20).map((color, i) => (
                        <button
                            key={`${color}-${i}`}
                            className={`cms-quick-palette__swatch ${bg.color === color ? 'cms-quick-palette__swatch--active' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => updateBg({ type: 'color', color })}
                            title={color}
                        />
                    ))}
                </div>
            )}

            {/* ─── Tabs avec recherche + CSS preview ─── */}
            {!isCollapsed && (
                <>
                    {/* Search filter bar */}
                    <div className="cms-inline-search-bar">
                        <Search className="cms-inline-search-bar__icon" />
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Filtrer les onglets..."
                            className="cms-inline-search-bar__input"
                        />
                        {searchFilter && (
                            <button onClick={() => setSearchFilter('')} className="cms-inline-search-bar__close">
                                <X className="cms-icon--xs" />
                            </button>
                        )}
                        <button
                            onClick={() => setShowCSSPreview(v => !v)}
                            className={`cms-css-toggle ${showCSSPreview ? 'cms-css-toggle--active' : ''}`}
                            title="Aperçu CSS live"
                        >
                            <Code className="cms-css-toggle__icon" />
                        </button>
                        {/* Reset active tab — §739 */}
                        {(tabCounts[activeTab] ?? 0) > 0 && (
                            <button
                                onClick={handleResetTab}
                                className="cms-tab-reset-btn"
                                title={`Réinitialiser l'onglet "${TABS.find(t => t.id === activeTab)?.label}"`}
                            >
                                <RefreshCw className="cms-icon--xs" />
                            </button>
                        )}
                    </div>
                    {/* Tab bar with filtered tabs — Smart tabs §749 */}
                    <div className="cms-tab-bar-pro cms-tab-bar-pro--smart relative overflow-x-auto">
                        {filteredTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`cms-tab-pro ${activeTab === tab.id ? 'cms-tab-pro--active' : ''}`}
                                title={tab.label}
                            >
                                {tab.icon}
                                <span className="hidden min-[280px]:inline">{tab.label}</span>
                                {/* Tab property count badge — §739 */}
                                {(tabCounts[tab.id] ?? 0) > 0 && (
                                    <span className="cms-tab-count-badge" title={`${tabCounts[tab.id]} propriété${tabCounts[tab.id]! > 1 ? 's' : ''} modifiée${tabCounts[tab.id]! > 1 ? 's' : ''}`}>
                                        {tabCounts[tab.id]}
                                    </span>
                                )}
                                {activeTab === tab.id && (
                                    <div className="cms-tab-pro__indicator" />
                                )}
                            </button>
                        ))}
                        {filteredTabs.length === 0 && (
                            <div className="cms-tab-bar-pro__empty">
                                <span className="cms-tab-bar-pro__empty-text">Aucun onglet trouvé</span>
                            </div>
                        )}
                        {/* Smart tab count indicator */}
                        {filteredTabs.length > 0 && filteredTabs.length < TABS.length && (
                            <span className="cms-tab-count-indicator" title={`${filteredTabs.length}/${TABS.length} onglets visibles`}>
                                {filteredTabs.length}/{TABS.length}
                            </span>
                        )}
                    </div>

                    {/* CSS Preview panel (toggleable) */}
                    {showCSSPreview && (
                        <div className="cms-css-preview-panel cms-scale-enter">
                            <div className="cms-css-preview-panel__header">
                                <span className="cms-css-preview-panel__title">CSS Preview</span>
                                <button
                                    onClick={() => {
                                        const css = generateCSSPreview(styleConfig);
                                        navigator.clipboard.writeText(css);
                                        toast.success('CSS copi\u00e9');
                                    }}
                                    className="cms-css-preview-panel__copy-btn"
                                >
                                    <Copy className="cms-css-preview__icon" />
                                    Copier
                                </button>
                            </div>
                            <pre className="cms-css-preview-panel__code">
                                {generateCSSPreview(styleConfig)}
                            </pre>
                        </div>
                    )}

                    {/* Paste Style panel (JSON) */}
                    {showPasteStyle && (
                        <div className="cms-paste-style-panel cms-scale-enter">
                            <div className="cms-paste-style-panel__header">
                                <span className="cms-paste-style-panel__title">Coller un style (JSON)</span>
                                <button onClick={() => { setShowPasteStyle(false); setPasteStyleText(''); }} className="cms-paste-style-panel__close">
                                    <X className="cms-icon--sm" />
                                </button>
                            </div>
                            <textarea
                                value={pasteStyleText}
                                onChange={(e) => setPasteStyleText(e.target.value)}
                                placeholder='{"background": {"type": "color", "color": "#fff"}, ...}'
                                className="cms-paste-style-panel__textarea"
                                rows={3}
                            />
                            <div className="cms-paste-style-panel__actions">
                                <button
                                    onClick={handlePasteStyle}
                                    disabled={!pasteStyleText.trim()}
                                    className="cms-paste-style-panel__apply-btn"
                                >
                                    <ClipboardPaste className="cms-paste-panel__icon" />
                                    Appliquer
                                </button>
                                <button
                                    onClick={() => { navigator.clipboard.readText().then(t => setPasteStyleText(t)).catch(() => toast.error('Acc\u00e8s presse-papier refus\u00e9')); }}
                                    className="cms-paste-style-panel__paste-btn"
                                >
                                    <Clipboard className="cms-paste-panel__icon" />
                                    Coller
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── Content — Enhanced scroll + visibility §750 ─── */}
                    <div
                        key={activeTab}
                        className="cms-inline-panel-scroll cms-canvas-scroll--enhanced overflow-y-auto overflow-x-hidden cms-tab-content-enter"
                        style={{
                            maxHeight: 'min(540px, 68vh)',
                        }}
                    >
                {/* ═══ TAB: PRESETS (Thèmes prédéfinis) ═══ */}
                {activeTab === 'presets' && (
                    <div className="cms-section-tab-content cms-tab-content-enter">
                        <div className="cms-presets-tab-header">
                            <Sparkles className="cms-presets-tab-header__icon" />
                            <span className="cms-presets-tab-header__title">Thèmes prédéfinis</span>
                            <span className="cms-presets-tab-header__hint">Appliquer en 1 clic</span>
                        </div>
                        {/* Grille de presets — large preview cards */}
                        <div className="cms-preset-grid">
                            {STYLE_PRESETS.map((preset, idx) => (
                                <button
                                    key={preset.id}
                                    onClick={() => applyPreset(preset)}
                                    className="cms-preset-tile cms-hover-lift"
                                    style={{ animationDelay: `${idx * 30}ms` }}
                                >
                                    {/* Preview swatch */}
                                    <div
                                        className="cms-preset-tile__preview"
                                        style={{ background: preset.preview }}
                                    >
                                        {/* Overlay on hover */}
                                        <div className="cms-preset-card__overlay">
                                            <span className="cms-preset-card__overlay-text">Appliquer</span>
                                        </div>
                                    </div>
                                    {/* Label + icon */}
                                    <div className="cms-preset-tile__label">
                                        <span className="cms-preset-card__emoji">{preset.icon}</span>
                                        <span className="truncate">{preset.label}</span>
                                        <ChevronRight className="cms-preset-card__chevron" />
                                    </div>
                                </button>
                            ))}
                        </div>
                        {/* Info */}
                        <div className="cms-preset-info-box">
                            <p className="cms-preset-info-box__text">
                                <strong>Astuce :</strong> Les thèmes appliquent un ensemble cohérent de styles (fond, texte, espacement, bordure). Vous pouvez ensuite ajuster chaque propriété dans les autres onglets.
                            </p>
                        </div>
                    </div>
                )}

                {/* ═══ TAB: FOND ═══ */}
                {activeTab === 'fond' && (
                    <div className="cms-section-tab-content--tight cms-tab-content-enter">
                        {/* Type de fond — segmented control */}
                        <SectionCollapsible title="Source du fond" icon={<ImageIcon className="cms-section-collapsible__icon" />} accentColor="blue">
                            <div className="cms-segmented">
                                {(['color', 'gradient', 'image'] as const).map(t => (
                                    <button
                                        key={t}
                                        onClick={() => updateBg({ type: t })}
                                        className={`cms-segmented__btn ${(bg.type || 'color') === t ? 'cms-segmented__btn--active' : ''}`}
                                    >
                                        {t === 'color' ? '🎨' : t === 'gradient' ? '🌈' : '🖼'} {t === 'color' ? 'Couleur' : t === 'gradient' ? 'Dégradé' : 'Image'}
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Fond couleur */}
                        {(bg.type || 'color') === 'color' && (
                            <SectionCollapsible title="Couleur" icon={<Palette className="cms-section-collapsible__icon" />} accentColor="blue">
                                <CompactColorPicker
                                    value={bg.color}
                                    onChange={(v) => updateBg({ type: 'color', color: v })}
                                />
                            </SectionCollapsible>
                        )}

                        {/* Fond dégradé */}
                        {bg.type === 'gradient' && (
                            <SectionCollapsible title="Dégradé" icon={<Sparkles className="cms-section-collapsible__icon" />} accentColor="purple">
                            <div className="cms-prop-group__body">
                                {/* Preview live du dégradé — grand */}
                                <div
                                    className="cms-gradient-preview"
                                    style={{ background: `linear-gradient(${bg.gradientDirection === 'to-br' ? '135deg' : bg.gradientDirection === 'to-r' ? '90deg' : bg.gradientDirection === 'to-tr' ? '45deg' : '180deg'}, ${bg.gradientFrom || '#1e40af'}, ${bg.gradientTo || '#7c3aed'})` }}
                                >
                                    <span className="cms-gradient-preview__label">{bg.gradientFrom} → {bg.gradientTo}</span>
                                </div>
                                {/* Presets visuels — 4 colonnes */}
                                <div className="cms-gradient-grid">
                                    {GRADIENT_PRESETS.map(g => (
                                        <button
                                            key={g.name}
                                            onClick={() => updateBg({ gradientFrom: g.from, gradientTo: g.to, gradientDirection: g.dir })}
                                            className={`cms-gradient-grid__swatch ${
                                                bg.gradientFrom === g.from && bg.gradientTo === g.to
                                                    ? 'cms-gradient-grid__swatch--active'
                                                    : ''
                                            }`}
                                            style={{ background: `linear-gradient(${g.dir === 'to-br' ? '135deg' : g.dir === 'to-r' ? '90deg' : '180deg'}, ${g.from}, ${g.to})` }}
                                            title={g.name}
                                        >
                                            <span className="cms-gradient-grid__label">{g.name}</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Color stops */}
                                <div className="cms-field-pair">
                                    <div className="cms-field-tight">
                                        <label className="cms-field-sublabel">De</label>
                                        <CompactColorPicker value={bg.gradientFrom || '#1e40af'} onChange={(v) => updateBg({ gradientFrom: v })} />
                                    </div>
                                    <div className="cms-field-tight">
                                        <label className="cms-field-sublabel">À</label>
                                        <CompactColorPicker value={bg.gradientTo || '#7c3aed'} onChange={(v) => updateBg({ gradientTo: v })} />
                                    </div>
                                </div>
                                {/* Direction — boussole 8 directions */}
                                <div className="cms-compass-wrap">
                                    <span className="cms-compass-label">Direction</span>
                                    <div className="cms-compass-grid">
                                        {[
                                            { dir: 'to-t', label: '↑', angle: '0deg' },
                                            { dir: 'to-tr', label: '↗', angle: '45deg' },
                                            { dir: 'to-r', label: '→', angle: '90deg' },
                                            { dir: 'to-br', label: '↘', angle: '135deg' },
                                            { dir: 'to-b', label: '↓', angle: '180deg' },
                                            { dir: 'to-bl', label: '↙', angle: '225deg' },
                                            { dir: 'to-l', label: '←', angle: '270deg' },
                                            { dir: 'to-tl', label: '↖', angle: '315deg' },
                                        ].map(d => (
                                            <button
                                                key={d.dir}
                                                onClick={() => updateBg({ gradientDirection: d.dir })}
                                                className={`cms-compass-btn ${(bg.gradientDirection || 'to-br') === d.dir ? 'cms-compass-btn--active' : ''}`}
                                                title={`${d.label} (${d.angle})`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            </SectionCollapsible>
                        )}

                        {/* Fond image */}
                        {bg.type === 'image' && (
                            <SectionCollapsible title="Image de fond" icon={<ImageIcon className="cms-section-collapsible__icon" />} accentColor="emerald">
                            <div className="cms-section-tab-content--spaced">
                                {/* URL image avec preview */}
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">URL image</label>
                                    <input
                                        type="text"
                                        value={bg.imageUrl || ''}
                                        onChange={(e) => updateBg({ imageUrl: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="cms-image-url-field"
                                    />
                                </div>
                                {/* Preview de l'image */}
                                {bg.imageUrl && (
                                    <div className="cms-image-preview-wrap">
                                        <img src={bg.imageUrl} alt="Preview" className="cms-image-preview-wrap__img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        <span className="cms-image-preview-wrap__badge">{bg.imagePosition}</span>
                                    </div>
                                )}
                                {/* Taille de l'image */}
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">Taille</label>
                                    <div className="cms-image-opt-group">
                                        {(['cover', 'contain', 'center'] as const).map(pos => (
                                            <button
                                                key={pos}
                                                onClick={() => updateBg({ imagePosition: pos })}
                                                className={`cms-image-opt-btn ${(bg.imagePosition || 'cover') === pos ? 'cms-image-opt-btn--active' : ''}`}
                                            >
                                                {pos === 'cover' ? 'Couvrir' : pos === 'contain' ? 'Contenir' : 'Centrer'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Attachment (scroll/fixed/local) */}
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">Attachement</label>
                                    <div className="cms-image-opt-group">
                                        {([
                                            { value: 'scroll' as const, label: 'Scroll', desc: 'Normal' },
                                            { value: 'fixed' as const, label: 'Fixe', desc: 'Parallax' },
                                            { value: 'local' as const, label: 'Local', desc: 'Avec scroll' },
                                        ]).map(att => (
                                            <button
                                                key={att.value}
                                                onClick={() => updateBg({ imageAttachment: att.value })}
                                                className={`cms-image-opt-btn ${(bg.imageAttachment || 'scroll') === att.value ? 'cms-image-opt-btn--active' : ''}`}
                                                title={att.desc}
                                            >
                                                {att.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Repeat */}
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">Répétition</label>
                                    <div className="cms-image-opt-group">
                                        {([
                                            { value: 'no-repeat' as const, label: 'Aucune' },
                                            { value: 'repeat' as const, label: 'Les deux' },
                                            { value: 'repeat-x' as const, label: 'Horizontal' },
                                            { value: 'repeat-y' as const, label: 'Vertical' },
                                        ]).map(rep => (
                                            <button
                                                key={rep.value}
                                                onClick={() => updateBg({ imageRepeat: rep.value })}
                                                className={`cms-image-opt-btn ${(bg.imageRepeat || 'no-repeat') === rep.value ? 'cms-image-opt-btn--active' : ''}`}
                                            >
                                                {rep.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            </SectionCollapsible>
                        )}

                        {/* Overlay toggle */}
                        <SectionCollapsible title="Overlay" icon={<Eye className="cms-section-collapsible__icon" />} accentColor="indigo" defaultOpen={!!bg.overlay}>
                        <div className="cms-overlay-toggle-row">
                            <span className="cms-field-sublabel">Overlay</span>
                            <button
                                onClick={() => updateBg({ overlay: !bg.overlay })}
                                className={`cms-overlay-switch ${bg.overlay ? 'cms-overlay-switch--on' : 'cms-overlay-switch--off'}`}
                            >
                                <span className={`cms-overlay-switch__thumb ${bg.overlay ? 'cms-overlay-switch__thumb--on' : 'cms-overlay-switch__thumb--off'}`} />
                            </button>
                        </div>
                        {bg.overlay && (
                            <div className="cms-overlay-fields">
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">Couleur overlay</label>
                                    <CompactColorPicker value={bg.overlayColor || '#000000'} onChange={(v) => updateBg({ overlayColor: v })} colors={['#000000', '#1e293b', '#0f172a', '#312e81', '#1e1b4b', '#172554', '#14532d', '#78350f', '#7f1d1d', '#4a044e']} />
                                </div>
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel">Opacité overlay</label>
                                    <input
                                        type="range"
                                        min={0} max={1} step={0.05}
                                        value={bg.overlayOpacity ?? 0.5}
                                        onChange={(e) => updateBg({ overlayOpacity: parseFloat(e.target.value) })}
                                        className="cms-overlay-range"
                                    />
                                    <div className="cms-overlay-pct">{Math.round((bg.overlayOpacity ?? 0.5) * 100)}%</div>
                                </div>
                            </div>
                        )}
                        </SectionCollapsible>

                        {/* Patterns CSS — motifs d'arrière-plan */}
                        <SectionCollapsible title="Motifs" icon={<Grid3x3 className="cms-section-collapsible__icon" />} accentColor="slate" defaultOpen={false}>
                            <div className="cms-bg-patterns">
                                {([
                                    { id: 'none', label: 'Aucun', css: '' },
                                    { id: 'dots', label: 'Points', css: 'radial-gradient(circle, rgba(148,163,184,0.3) 1px, transparent 1px)', size: '6px 6px' },
                                    { id: 'grid', label: 'Grille', css: 'linear-gradient(rgba(148,163,184,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.3) 1px, transparent 1px)', size: '8px 8px' },
                                    { id: 'diagonal', label: 'Diagonales', css: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(148,163,184,0.2) 3px, rgba(148,163,184,0.2) 4px)', size: '' },
                                    { id: 'hlines', label: 'Lignes', css: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(148,163,184,0.2) 3px, rgba(148,163,184,0.2) 4px)', size: '' },
                                    { id: 'cross', label: 'Croisillon', css: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(148,163,184,0.15) 4px, rgba(148,163,184,0.15) 5px), repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(148,163,184,0.15) 4px, rgba(148,163,184,0.15) 5px)', size: '' },
                                ] as const).map(p => (
                                    <button
                                        key={p.id}
                                        className={`cms-bg-pattern ${(bg as any).pattern === p.id ? 'cms-bg-pattern--active' : ''}`}
                                        onClick={() => updateBg({ ...(bg as any), pattern: p.id === 'none' ? undefined : p.id } as any)}
                                        title={p.label}
                                    >
                                        <div
                                            className="cms-bg-pattern__preview"
                                            style={p.css ? { backgroundImage: p.css, backgroundSize: p.size || undefined } : {}}
                                        />
                                        <span className="cms-bg-pattern__label">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Contraste texte/fond — WCAG */}
                        {typo.color && (bg.type === 'color' || !bg.type) && bg.color && (
                            <div className="cms-contrast-box">
                                <span className="cms-contrast-box__label">Contraste</span>
                                <ContrastChecker fgColor={typo.color} bgColor={bg.color || '#ffffff'} />
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: TEXTE ═══ */}
                {activeTab === 'texte' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        <SectionCollapsible title="Couleur du texte" icon={<Type className="cms-section-collapsible__icon" />} accentColor="blue">
                            <CompactColorPicker value={typo.color} onChange={(v) => updateTypo({ color: v })} />
                        </SectionCollapsible>

                        {/* Alignement */}
                        <SectionCollapsible title="Alignement" icon={<AlignLeft className="cms-section-collapsible__icon" />} accentColor="purple">
                            <div className="cms-typo-align">
                                {([
                                    { value: 'left', icon: <AlignLeft className="cms-typo-align__icon" /> },
                                    { value: 'center', icon: <AlignCenter className="cms-typo-align__icon" /> },
                                    { value: 'right', icon: <AlignRight className="cms-typo-align__icon" /> },
                                    { value: 'justify', icon: <AlignJustify className="cms-typo-align__icon" /> },
                                ] as const).map(({ value, icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => updateTypo({ textAlign: value })}
                                        className={`cms-typo-align__option ${(typo.textAlign || 'left') === value ? 'cms-typo-align__option--active' : ''}`}
                                    >
                                        <span className="cms-typo-align__icon">{icon}</span>
                                        <span className="cms-typo-align__label">
                                            {value === 'left' ? 'Gauche' : value === 'center' ? 'Centre' : value === 'right' ? 'Droite' : 'Justifier'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Police */}
                        <SectionCollapsible title="Police" icon={<Type className="cms-section-collapsible__icon" />} accentColor="emerald">
                            <div className="cms-font-selector">
                                {(['sans', 'serif', 'mono', 'display'] as const).map(font => (
                                    <button
                                        key={font}
                                        onClick={() => updateTypo({ fontFamily: font })}
                                        className={`cms-font-option ${(typo.fontFamily || 'sans') === font ? 'cms-font-option--active' : ''}`}
                                    >
                                        <div
                                            className="cms-font-option__preview"
                                            style={{ fontFamily: font === 'serif' ? 'Georgia' : font === 'mono' ? 'monospace' : font === 'display' ? 'Impact' : 'inherit' }}
                                        >
                                            Aa
                                        </div>
                                        <span className="cms-font-option__name">
                                            {font === 'sans' ? 'Sans' : font === 'serif' ? 'Serif' : font === 'mono' ? 'Mono' : 'Display'}
                                        </span>
                                        <div className="cms-font-option__check">
                                            {(typo.fontFamily || 'sans') === font && <Check className="cms-font-option__check-icon" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Poids */}
                        <SectionCollapsible title="Poids" icon={<Type className="cms-section-collapsible__icon" />} accentColor="amber">
                            <div className="cms-font-weight">
                                {(['normal', 'medium', 'semibold', 'bold', 'extrabold'] as const).map(weight => (
                                    <button
                                        key={weight}
                                        onClick={() => updateTypo({ fontWeight: weight })}
                                        className={`cms-font-weight__option ${(typo.fontWeight || 'normal') === weight ? 'cms-font-weight__option--active' : ''}`}
                                    >
                                        <span
                                            className="cms-font-weight__preview"
                                            style={{ fontWeight: weight === 'normal' ? 400 : weight === 'medium' ? 500 : weight === 'semibold' ? 600 : weight === 'bold' ? 700 : 800 }}
                                        >
                                            A
                                        </span>
                                        <span className="cms-font-weight__label">
                                            {weight === 'normal' ? 'N' : weight === 'medium' ? 'M' : weight === 'semibold' ? 'SB' : weight === 'bold' ? 'B' : 'EB'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Taille — visual size selector with preview */}
                        <SectionCollapsible title="Taille" icon={<Type className="cms-section-collapsible__icon" />} accentColor="rose">
                            <div className="cms-font-size-control">
                                <div className="cms-font-size-grid">
                                    {(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const).map(size => {
                                        const pxMap: Record<string, string> = { xs: '10', sm: '12', base: '14', lg: '16', xl: '18', '2xl': '20', '3xl': '24', '4xl': '32', '5xl': '40' };
                                        return (
                                            <button
                                                key={size}
                                                onClick={() => updateTypo({ fontSize: size })}
                                                className={`cms-font-size-btn ${(typo.fontSize || 'base') === size ? 'cms-font-size-btn--active' : ''}`}
                                            >
                                                <span className="cms-font-size-btn__label">{size.toUpperCase()}</span>
                                                <span className="cms-font-size-btn__px">{pxMap[size]}px</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Preview visuel de la taille */}
                                <div className="cms-font-size-preview">
                                    <div
                                        className="cms-font-size-preview__text"
                                        style={{
                                            fontSize: (typo.fontSize || 'base') === 'xs' ? '10px' : (typo.fontSize || 'base') === 'sm' ? '12px' : (typo.fontSize || 'base') === 'lg' ? '16px' : (typo.fontSize || 'base') === 'xl' ? '18px' : (typo.fontSize || 'base') === '2xl' ? '20px' : (typo.fontSize || 'base') === '3xl' ? '24px' : (typo.fontSize || 'base') === '4xl' ? '32px' : (typo.fontSize || 'base') === '5xl' ? '40px' : '14px',
                                            fontFamily: typo.fontFamily === 'serif' ? 'Georgia' : typo.fontFamily === 'mono' ? 'monospace' : typo.fontFamily === 'display' ? 'Impact' : 'inherit',
                                            fontWeight: typo.fontWeight === 'normal' ? 400 : typo.fontWeight === 'medium' ? 500 : typo.fontWeight === 'semibold' ? 600 : typo.fontWeight === 'bold' ? 700 : 800,
                                        }}
                                    >
                                        Aperçu du texte
                                    </div>
                                    <div className="cms-font-size-preview__value">
                                        {(typo.fontSize || 'base').toUpperCase()} · {(typo.fontWeight || 'normal')}
                                    </div>
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Espacement — line height & letter spacing */}
                        <SectionCollapsible title="Espacement" icon={<ArrowUpDown className="cms-section-collapsible__icon" />} accentColor="teal">
                            <div className="cms-typo-spacing">
                                <div className="cms-typo-spacing__row">
                                    <span className="cms-typo-spacing__label">Interligne</span>
                                    <div className="cms-typo-spacing__control">
                                        <div className="cms-typo-preset-group">
                                            {([
                                                { value: 'tight' as const, label: 'Serré' },
                                                { value: 'normal' as const, label: 'Normal' },
                                                { value: 'relaxed' as const, label: 'Aéré' },
                                                { value: 'loose' as const, label: 'Large' },
                                            ]).map(lh => (
                                                <button
                                                    key={lh.value}
                                                    onClick={() => updateTypo({ lineHeight: lh.value })}
                                                    className={`cms-typo-preset-btn ${(typo.lineHeight || 'normal') === lh.value ? 'cms-typo-preset-btn--active' : ''}`}
                                                >
                                                    {lh.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="cms-typo-spacing__row">
                                    <span className="cms-typo-spacing__label">Lettres</span>
                                    <div className="cms-typo-spacing__control">
                                        <div className="cms-typo-preset-group">
                                            {([
                                                { value: 'tighter' as const, label: '−−' },
                                                { value: 'tight' as const, label: '−' },
                                                { value: 'normal' as const, label: '0' },
                                                { value: 'wide' as const, label: '+' },
                                                { value: 'wider' as const, label: '++' },
                                            ]).map(ls => (
                                                <button
                                                    key={ls.value}
                                                    onClick={() => updateTypo({ letterSpacing: ls.value })}
                                                    className={`cms-typo-preset-btn ${(typo.letterSpacing || 'normal') === ls.value ? 'cms-typo-preset-btn--active' : ''}`}
                                                >
                                                    {ls.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Transformation — visual case selector */}
                        <SectionCollapsible title="Transformation" icon={<Type className="cms-section-collapsible__icon" />} accentColor="indigo" defaultOpen={false}>
                            <div className="cms-text-transform">
                                {([
                                    { value: 'none' as const, preview: 'AaBb', label: 'Aucune' },
                                    { value: 'uppercase' as const, preview: 'AABB', label: 'Majuscules' },
                                    { value: 'lowercase' as const, preview: 'aabb', label: 'Minuscules' },
                                    { value: 'capitalize' as const, preview: 'Aa Bb', label: 'Capitale' },
                                ]).map(({ value, preview, label }) => (
                                    <button
                                        key={value}
                                        onClick={() => updateTypo({ textTransform: value })}
                                        className={`cms-text-transform__option ${(typo.textTransform || 'none') === value ? 'cms-text-transform__option--active' : ''}`}
                                    >
                                        <div className="cms-text-transform__preview" style={{
                                            textTransform: value === 'none' ? 'none' : value,
                                        }}>
                                            {preview}
                                        </div>
                                        <span className="cms-text-transform__label">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Résumé typographie — aperçu global */}
                        <div className="cms-typo-summary">
                            <div
                                className="cms-typo-summary__preview"
                                style={{
                                    color: typo.color || '#1e293b',
                                    fontFamily: typo.fontFamily === 'serif' ? 'Georgia' : typo.fontFamily === 'mono' ? 'monospace' : typo.fontFamily === 'display' ? 'Impact' : 'inherit',
                                    fontWeight: typo.fontWeight === 'normal' ? 400 : typo.fontWeight === 'medium' ? 500 : typo.fontWeight === 'semibold' ? 600 : typo.fontWeight === 'bold' ? 700 : 800,
                                    textAlign: (typo.textAlign || 'left') as any,
                                    textTransform: (typo.textTransform || 'none') as any,
                                }}
                            >
                                <div className="cms-typo-summary__text" style={{ fontSize: '18px', lineHeight: 1.3 }}>
                                    Le renard brun saute par-dessus le chien paresseux.
                                </div>
                            </div>
                            <div className="cms-typo-summary__meta">
                                <div className="cms-typo-summary__item">
                                    <span className="cms-typo-summary__label">Police</span>
                                    <span className="cms-typo-summary__value">{typo.fontFamily || 'sans'}</span>
                                </div>
                                <div className="cms-typo-summary__item">
                                    <span className="cms-typo-summary__label">Taille</span>
                                    <span className="cms-typo-summary__value">{(typo.fontSize || 'base').toUpperCase()}</span>
                                </div>
                                <div className="cms-typo-summary__item">
                                    <span className="cms-typo-summary__label">Poids</span>
                                    <span className="cms-typo-summary__value">{typo.fontWeight || 'normal'}</span>
                                </div>
                                <div className="cms-typo-summary__item">
                                    <span className="cms-typo-summary__label">Interligne</span>
                                    <span className="cms-typo-summary__value">{typo.lineHeight || 'normal'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions rapides typographie */}
                        <div className="cms-typo-actions">
                            <button
                                onClick={() => {
                                    updateTypo({ fontFamily: 'sans', fontWeight: 'normal', fontSize: 'base', lineHeight: 'normal', letterSpacing: 'normal', textTransform: 'none', textAlign: 'left' });
                                    toast.success('Typographie réinitialisée');
                                }}
                                className="cms-typo-action cms-typo-action--danger"
                            >
                                <RotateCcw className="cms-typo-action__icon" />
                                Réinitialiser
                            </button>
                            <button
                                onClick={() => {
                                    updateTypo({ fontWeight: 'bold', fontSize: '2xl', lineHeight: 'tight' });
                                    toast.success('Style titre appliqué');
                                }}
                                className="cms-typo-action"
                            >
                                <Type className="cms-typo-action__icon" />
                                Titre
                            </button>
                            <button
                                onClick={() => {
                                    updateTypo({ fontWeight: 'normal', fontSize: 'sm', lineHeight: 'relaxed' });
                                    toast.success('Style paragraphe appliqué');
                                }}
                                className="cms-typo-action cms-typo-action--primary"
                            >
                                <AlignLeft className="cms-typo-action__icon" />
                                Paragraphe
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ TAB: BORDURE ═══ */}
                {activeTab === 'bordure' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        {/* Épaisseur */}
                        <SectionCollapsible title="Épaisseur" icon={<Square className="cms-section-collapsible__icon" />} accentColor="emerald">
                            <div className="cms-border-width-group">
                                {BORDER_WIDTHS.map(w => (
                                    <button
                                        key={w.value}
                                        onClick={() => updateBorder({ width: w.value })}
                                        className={`cms-border-width-btn ${(border.width || 'none') === w.value ? 'cms-border-width-btn--active' : ''}`}
                                    >
                                        {w.label}
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {border.width && border.width !== 'none' && (
                            <>
                                {/* Couleur bordure */}
                                <SectionCollapsible title="Couleur" icon={<Palette className="cms-section-collapsible__icon" />} accentColor="blue">
                                    <CompactColorPicker value={border.color || '#e5e7eb'} onChange={(v) => updateBorder({ color: v })} />
                                </SectionCollapsible>
                                {/* Style — cms-border-style-grid */}
                                <SectionCollapsible title="Style" icon={<SlidersHorizontal className="cms-section-collapsible__icon" />} accentColor="purple">
                                    <div className="cms-border-style-grid">
                                        {([
                                            { value: 'solid', label: 'Continue' },
                                            { value: 'dashed', label: 'Tirets' },
                                            { value: 'dotted', label: 'Points' },
                                            { value: 'double', label: 'Double' },
                                        ] as const).map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => updateBorder({ style: s.value })}
                                                className={`cms-border-style-btn cms-border-style-btn--${s.value} ${(border.style || 'solid') === s.value ? 'cms-border-style-btn--active' : ''}`}
                                            >
                                                <div className="cms-border-style-btn__line" />
                                                <span className="cms-border-style-btn__label">{s.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </SectionCollapsible>
                            </>
                        )}

                        {/* Rayon des coins */}
                        <SectionCollapsible title="Rayon des coins" icon={<Circle className="cms-section-collapsible__icon" />} accentColor="amber">
                            <div className="cms-radius-group">
                                {RADIUS_OPTIONS.map(r => (
                                    <button
                                        key={r.value}
                                        onClick={() => updateBorder({ radius: r.value })}
                                        className={`cms-radius-btn ${(border.radius || 'none') === r.value ? 'cms-radius-btn--active' : ''}`}
                                    >
                                        <div
                                            className="cms-radius-btn__shape"
                                            style={{ borderRadius: r.px }}
                                        />
                                        <span className="cms-radius-btn__label">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Preview bordure */}
                        <div className="cms-border-preview">
                            <div
                                className="cms-border-preview__sample"
                                style={{
                                    border: border.width && border.width !== 'none'
                                        ? `${border.width === 'thin' ? '1px' : border.width === 'medium' ? '2px' : '4px'} ${border.style || 'solid'} ${border.color || '#e5e7eb'}`
                                        : undefined,
                                    borderRadius: (border.radius || 'none') === 'full' ? '9999px' : (border.radius || 'none') === 'none' ? undefined : RADIUS_OPTIONS.find(r => r.value === border.radius)?.px,
                                }}
                            />
                        </div>

                        {/* Ombres presets */}
                        <SectionCollapsible title="Ombre" icon={<Layers className="cms-section-collapsible__icon" />} accentColor="indigo">
                            <div className="cms-shadow-grid">
                                {SHADOW_PRESETS.map(s => (
                                    <button
                                        key={s.type}
                                        onClick={() => updateShadow({ type: s.type })}
                                        className={`cms-shadow-card ${(shadow.type || 'none') === s.type ? 'cms-shadow-card--active' : ''}`}
                                    >
                                        <div
                                            className="cms-shadow-card__preview"
                                            style={{ boxShadow: s.css }}
                                        />
                                        <span className="cms-shadow-card__label">{s.label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Ombre personnalisée */}
                            <div className="cms-panel-divider" />
                            <button
                                onClick={() => updateShadow({ type: shadow.type === 'custom' ? 'none' : 'custom', customX: shadow.customX ?? 0, customY: shadow.customY ?? 4, customBlur: shadow.customBlur ?? 8, customSpread: shadow.customSpread ?? 0, color: shadow.color || 'rgba(0,0,0,0.1)' })}
                                className={`cms-field-sublabel cms-field-sublabel--normal w-full text-left mb-1 cursor-pointer hover:text-indigo-600 transition-colors ${shadow.type === 'custom' ? 'text-indigo-600' : ''}`}
                            >
                                {shadow.type === 'custom' ? '▼' : '▶'} Ombre personnalisée
                            </button>
                            {shadow.type === 'custom' && (
                                <div className="cms-shadow-editor" style={{ marginTop: 6 }}>
                                    {/* Live shadow preview */}
                                    <div
                                        className="cms-shadow-editor__preview"
                                        style={{
                                            boxShadow: `${shadow.customInset ? 'inset ' : ''}${shadow.customX ?? 0}px ${shadow.customY ?? 4}px ${shadow.customBlur ?? 8}px ${shadow.customSpread ?? 0}px ${shadow.color || 'rgba(0,0,0,0.1)'}`,
                                        }}
                                    />
                                    {/* Shadow sliders — X, Y, Blur, Spread */}
                                    <div className="cms-shadow-editor__controls">
                                        {[
                                            { label: 'X', key: 'customX', min: -50, max: 50, def: 0 },
                                            { label: 'Y', key: 'customY', min: -50, max: 50, def: 4 },
                                            { label: 'Flou', key: 'customBlur', min: 0, max: 100, def: 8 },
                                            { label: 'Étal.', key: 'customSpread', min: -50, max: 50, def: 0 },
                                        ].map(ctrl => {
                                            const val = (shadow as Record<string, any>)[ctrl.key] ?? ctrl.def;
                                            const pct = ((val - ctrl.min) / (ctrl.max - ctrl.min)) * 100;
                                            return (
                                                <div className="cms-shadow-editor__row" key={ctrl.key}>
                                                    <span className="cms-shadow-editor__label">{ctrl.label}</span>
                                                    <input
                                                        type="range" min={ctrl.min} max={ctrl.max} step={1}
                                                        value={val}
                                                        onChange={e => updateShadow({ [ctrl.key]: Number(e.target.value) })}
                                                        className="cms-shadow-editor__slider"
                                                        style={{ '--shadow-pct': `${pct}%` } as React.CSSProperties}
                                                    />
                                                    <span className="cms-shadow-editor__value">{val}px</span>
                                                </div>
                                            );
                                        })}
                                        {/* Shadow color */}
                                        <div className="cms-shadow-editor__color-row">
                                            <span className="cms-shadow-editor__label">Couleur</span>
                                            <div
                                                className="cms-shadow-editor__color-swatch"
                                                style={{ backgroundColor: shadow.color || 'rgba(0,0,0,0.1)' }}
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'color';
                                                    input.value = shadow.color || '#000000';
                                                    input.onchange = (e) => updateShadow({ color: (e.target as HTMLInputElement).value });
                                                    input.click();
                                                }}
                                            />
                                            <span style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{shadow.color || 'rgba(0,0,0,0.1)'}</span>
                                        </div>
                                    </div>
                                    {/* Inset toggle */}
                                    <div className="cms-toggle-row" style={{ marginTop: 6 }}>
                                        <span className="cms-toggle-row__label">Intérieure (inset)</span>
                                        <button
                                            onClick={() => updateShadow({ customInset: !shadow.customInset })}
                                            className={`cms-toggle ${shadow.customInset ? 'cms-toggle--checked' : ''}`}
                                        >
                                            <span className="cms-toggle__thumb" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </SectionCollapsible>

                        {/* Outline/Contour avancé — §722 */}
                        <SectionCollapsible title="Contour extérieur (outline)" icon={<Square className="cms-section-collapsible__icon" />} accentColor="purple" defaultOpen={false}>
                            <div className="cms-outline-editor">
                                {/* Outline style selector */}
                                <div className="cms-outline-editor__row">
                                    {([
                                        { value: 'none', label: 'Aucun', borderStyle: 'none' },
                                        { value: 'solid', label: 'Plein', borderStyle: 'solid' },
                                        { value: 'dashed', label: 'Tirets', borderStyle: 'dashed' },
                                        { value: 'dotted', label: 'Points', borderStyle: 'dotted' },
                                    ] as const).map(s => (
                                        <button
                                            key={s.value}
                                            onClick={() => updateBorder({ outlineStyle: s.value === 'none' ? undefined : s.value } as any)}
                                            className={`cms-outline-style-btn ${(border as any).outlineStyle === s.value || (s.value === 'none' && !(border as any).outlineStyle) ? 'cms-outline-style-btn--active' : ''}`}
                                        >
                                            <div
                                                className="cms-outline-style-btn__preview"
                                                style={{ borderStyle: s.borderStyle === 'none' ? 'none' : s.borderStyle }}
                                            />
                                            <span className="cms-outline-style-btn__label">{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                                {/* Outline width + offset */}
                                {(border as any).outlineStyle && (border as any).outlineStyle !== 'none' && (
                                    <>
                                        <SliderField
                                            label="Épaisseur"
                                            value={(border as any).outlineWidth ?? 2}
                                            onChange={(v) => updateBorder({ outlineWidth: v } as any)}
                                            min={1} max={8} step={1} unit="px"
                                            accentColor="purple"
                                        />
                                        <div className="cms-outline-offset">
                                            <span className="cms-outline-offset__label">Offset</span>
                                            <input
                                                type="range" min={-20} max={20} step={1}
                                                value={(border as any).outlineOffset ?? 0}
                                                onChange={(e) => updateBorder({ outlineOffset: parseInt(e.target.value) } as any)}
                                                className="cms-outline-offset__input"
                                            />
                                            <span style={{ fontSize: 10, color: '#8b5cf6', fontWeight: 600, fontFamily: 'monospace', minWidth: 28, textAlign: 'right' }}>{(border as any).outlineOffset ?? 0}px</span>
                                        </div>
                                        {/* Outline color */}
                                        <div style={{ marginTop: 6 }}>
                                            <CompactColorPicker value={(border as any).outlineColor || '#3b82f6'} onChange={(v) => updateBorder({ outlineColor: v } as any)} />
                                        </div>
                                    </>
                                )}
                                {/* Outline preview */}
                                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
                                    <div
                                        style={{
                                            width: 48, height: 32, borderRadius: 6,
                                            background: '#f1f5f9',
                                            outline: (border as any).outlineStyle ? `${(border as any).outlineWidth ?? 2}px ${(border as any).outlineStyle || 'solid'} ${(border as any).outlineColor || '#3b82f6'}` : 'none',
                                            outlineOffset: `${(border as any).outlineOffset ?? 0}px`,
                                            transition: 'all 0.2s ease',
                                        }}
                                    />
                                </div>
                            </div>
                        </SectionCollapsible>
                    </div>
                )}

                {/* ═══ TAB: ESPACE ═══ */}
                {activeTab === 'espace' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        {/* Presets de padding */}
                        <SectionCollapsible title="Presets rapides" icon={<Zap className="cms-section-collapsible__icon" />} accentColor="amber">
                            <div className="cms-padding-presets-wrap">
                                {PADDING_PRESETS.map(p => (
                                    <button
                                        key={p.label}
                                        onClick={() => updateSpacing({ paddingTop: p.top, paddingBottom: p.bottom, paddingLeft: p.left, paddingRight: p.right })}
                                        className="cms-padding-pill"
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Box model interactif — Figma/Webflow-like */}
                        <SectionCollapsible title="Modèle de boîte" icon={<Box className="cms-section-collapsible__icon" />} accentColor="blue">
                            <div className="cms-box-model-interactive">
                                {/* Margin layer */}
                                <div className="cms-box-layer cms-box-layer--margin">
                                    <span className="cms-box-layer__label">margin</span>
                                    <button
                                        className={`cms-box-link-toggle ${linkMargin ? 'cms-box-link-toggle--active' : ''}`}
                                        onClick={() => setLinkMargin(v => !v)}
                                        title={linkMargin ? 'Marges liées' : 'Marges indépendantes'}
                                    >
                                        <Link2 style={{ width: 10, height: 10 }} />
                                    </button>
                                    <input className="cms-box-value cms-box-value--top" value={spacing.marginTop || '0'} onChange={e => {
                                        const v = e.target.value;
                                        updateSpacing(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginTop: v });
                                    }} placeholder="0" />
                                    <input className="cms-box-value cms-box-value--bottom" value={spacing.marginBottom || '0'} onChange={e => {
                                        const v = e.target.value;
                                        updateSpacing(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginBottom: v });
                                    }} placeholder="0" />
                                    <input className="cms-box-value cms-box-value--left" value={spacing.marginLeft || '0'} onChange={e => {
                                        const v = e.target.value;
                                        updateSpacing(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginLeft: v });
                                    }} placeholder="0" />
                                    <input className="cms-box-value cms-box-value--right" value={spacing.marginRight || '0'} onChange={e => {
                                        const v = e.target.value;
                                        updateSpacing(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginRight: v });
                                    }} placeholder="0" />

                                    {/* Border layer */}
                                    <div className="cms-box-layer cms-box-layer--border">
                                        <span className="cms-box-layer__label">border</span>

                                        {/* Padding layer */}
                                        <div className="cms-box-layer cms-box-layer--padding">
                                            <span className="cms-box-layer__label">padding</span>
                                            <button
                                                className={`cms-box-link-toggle ${linkPadding ? 'cms-box-link-toggle--active' : ''}`}
                                                onClick={() => setLinkPadding(v => !v)}
                                                title={linkPadding ? 'Paddings liés' : 'Paddings indépendants'}
                                            >
                                                <Link2 style={{ width: 10, height: 10 }} />
                                            </button>
                                            <input className="cms-box-value cms-box-value--top" value={spacing.paddingTop || '2rem'} onChange={e => {
                                                const v = e.target.value;
                                                updateSpacing(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingTop: v });
                                            }} placeholder="2rem" />
                                            <input className="cms-box-value cms-box-value--bottom" value={spacing.paddingBottom || '2rem'} onChange={e => {
                                                const v = e.target.value;
                                                updateSpacing(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingBottom: v });
                                            }} placeholder="2rem" />
                                            <input className="cms-box-value cms-box-value--left" value={spacing.paddingLeft || '1rem'} onChange={e => {
                                                const v = e.target.value;
                                                updateSpacing(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingLeft: v });
                                            }} placeholder="1rem" />
                                            <input className="cms-box-value cms-box-value--right" value={spacing.paddingRight || '1rem'} onChange={e => {
                                                const v = e.target.value;
                                                updateSpacing(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingRight: v });
                                            }} placeholder="1rem" />

                                            {/* Content */}
                                            <div className="cms-box-layer cms-box-layer--content">
                                                <span className="cms-box-layer__label">contenu</span>
                                                <span style={{ fontSize: 9, color: '#94a3b8' }}>Section</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Gap control */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, width: '100%' }}>
                                    <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>gap</span>
                                    <input
                                        type="text"
                                        value={spacing.gap || '1rem'}
                                        onChange={(e) => updateSpacing({ gap: e.target.value })}
                                        placeholder="1rem"
                                        className="cms-box-value"
                                        style={{ flex: 1, position: 'relative', transform: 'none' }}
                                    />
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Résumé espacement */}
                        <div className="cms-effect-summary">
                            <div className="cms-effect-summary__header">
                                <span className="cms-effect-summary__title">Résumé espacement</span>
                            </div>
                            <div className="cms-effect-summary__grid">
                                <div className="cms-effect-summary__item">
                                    <ArrowUpDown className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Padding V</div>
                                        <div className="cms-effect-summary__value">{spacing.paddingTop || '2rem'}</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <ArrowLeftRight className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Padding H</div>
                                        <div className="cms-effect-summary__value">{spacing.paddingLeft || '1rem'}</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <Maximize2 className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Margin V</div>
                                        <div className="cms-effect-summary__value">{spacing.marginTop || '0'}</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <Move className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Gap</div>
                                        <div className="cms-effect-summary__value">{spacing.gap || '1rem'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ TAB: EFFETS (amélioré) ═══ */}
                {activeTab === 'effet' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        <SectionCollapsible title="Presets visuels" icon={<Sparkles className="cms-section-collapsible__icon" />} accentColor="violet" defaultOpen={true}>
                            <div className="cms-effect-grid">
                                {[
                                    { id: 'glass', label: 'Glass', desc: 'Glassmorphism', preview: 'rgba(255,255,255,0.15)', config: { background: { type: 'solid' as const, colorFrom: 'rgba(255,255,255,0.15)' }, border: { width: 'thin' as const, color: 'rgba(255,255,255,0.2)', style: 'solid' as const, radius: 'xl' as const }, shadow: { type: 'lg' as const }, transform: { opacity: 0.85, mixBlendMode: 'normal' as const } } },
                                    { id: 'neumorph', label: 'Neumorph', desc: 'Soft UI', preview: '#e0e5ec', config: { background: { type: 'solid' as const, colorFrom: '#e0e5ec' }, border: { width: 'none' as const, radius: 'lg' as const }, shadow: { type: 'lg' as const, color: 'rgba(0,0,0,0.15)' } } },
                                    { id: 'elevated', label: 'Elevated', desc: 'Carte élevée', preview: '#ffffff', config: { background: { type: 'solid' as const, colorFrom: '#ffffff' }, border: { width: 'none' as const, radius: 'lg' as const }, shadow: { type: 'xl' as const } } },
                                    { id: 'frosted', label: 'Frosted', desc: 'Givre flou', preview: 'rgba(255,255,255,0.6)', config: { background: { type: 'solid' as const, colorFrom: 'rgba(255,255,255,0.6)' }, border: { width: 'thin' as const, color: 'rgba(255,255,255,0.3)', style: 'solid' as const, radius: 'xl' as const }, shadow: { type: 'sm' as const }, transform: { opacity: 0.9, blur: 8 } } },
                                    { id: 'dramatic', label: 'Dramatic', desc: 'Contraste fort', preview: 'linear-gradient(135deg, #0f172a, #1e293b)', config: { background: { type: 'gradient' as const, gradientFrom: '#0f172a', gradientTo: '#1e293b', gradientDirection: 'to-br' as const }, border: { width: 'thin' as const, color: 'rgba(255,255,255,0.1)', style: 'solid' as const, radius: 'lg' as const }, shadow: { type: '2xl' as const }, transform: { contrast: 1.3, brightness: 0.95 } } },
                                    { id: 'soft-glow', label: 'Soft Glow', desc: 'Lueur douce', preview: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', config: { background: { type: 'gradient' as const, gradientFrom: '#eff6ff', gradientTo: '#f5f3ff', gradientDirection: 'to-br' as const }, border: { width: 'thin' as const, color: 'rgba(99,102,241,0.15)', style: 'solid' as const, radius: 'xl' as const }, shadow: { type: 'glow' as const, color: 'rgba(99,102,241,0.2)' } } },
                                    { id: 'outline-modern', label: 'Outline', desc: 'Contour moderne', preview: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', config: { background: { type: 'solid' as const, colorFrom: '#f8fafc' }, border: { width: 'medium' as const, color: '#3b82f6', style: 'solid' as const, radius: 'xl' as const }, shadow: { type: 'none' as const } } },
                                    { id: 'gradient-border', label: 'Grad Border', desc: 'Bordure dégradée', preview: 'linear-gradient(135deg, #667eea, #764ba2)', config: { background: { type: 'solid' as const, colorFrom: '#ffffff' }, border: { width: 'medium' as const, color: '#7c3aed', style: 'solid' as const, radius: 'lg' as const }, shadow: { type: 'md' as const, color: 'rgba(124,58,237,0.15)' } } },
                                    { id: 'neon', label: 'Néon', desc: 'Fluorescent', preview: 'linear-gradient(135deg, #0f172a, #1e1b4b)', config: { background: { type: 'gradient' as const, gradientFrom: '#0f172a', gradientTo: '#1e1b4b', gradientDirection: 'to-b' as const }, border: { width: 'thin' as const, color: '#22d3ee', style: 'solid' as const, radius: 'lg' as const }, shadow: { type: 'glow' as const, color: 'rgba(34,211,238,0.4)' }, transform: { brightness: 1.05 } } },
                                    { id: 'soft-card', label: 'Soft Card', desc: 'Carte douce', preview: 'linear-gradient(180deg, #ffffff, #fafafa)', config: { background: { type: 'solid' as const, colorFrom: '#ffffff' }, border: { width: 'thin' as const, color: 'rgba(0,0,0,0.06)', style: 'solid' as const, radius: 'xl' as const }, shadow: { type: 'lg' as const }, spacing: { paddingTop: '1.5rem', paddingBottom: '1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' } } },
                                    { id: 'warm-sand', label: 'Warm Sand', desc: 'Chaleur sable', preview: 'linear-gradient(135deg, #fef3c7, #fde68a)', config: { background: { type: 'gradient' as const, gradientFrom: '#fef3c7', gradientTo: '#fde68a', gradientDirection: 'to-br' as const }, typography: { color: '#78350f' }, border: { width: 'thin' as const, color: 'rgba(120,53,15,0.1)', style: 'solid' as const, radius: 'lg' as const }, shadow: { type: 'sm' as const } } },
                                    { id: 'ocean-deep', label: 'Océan', desc: 'Profondeur marine', preview: 'linear-gradient(135deg, #0369a1, #0ea5e9)', config: { background: { type: 'gradient' as const, gradientFrom: '#0369a1', gradientTo: '#0ea5e9', gradientDirection: 'to-br' as const }, typography: { color: '#ffffff' }, border: { width: 'none' as const, radius: 'xl' as const }, shadow: { type: 'lg' as const, color: 'rgba(3,105,161,0.3)' } } },
                                    { id: 'minimal-clean', label: 'Minimal', desc: 'Épuré clean', preview: '#ffffff', config: { background: { type: 'solid' as const, colorFrom: '#ffffff' }, border: { width: 'thin' as const, color: '#e5e7eb', style: 'solid' as const, radius: 'md' as const }, shadow: { type: 'none' as const }, spacing: { paddingTop: '2rem', paddingBottom: '2rem', paddingLeft: '1rem', paddingRight: '1rem' } } },
                                ].map(preset => (
                                    <button
                                        key={preset.id}
                                        onClick={() => {
                                            const merged: SectionStyleConfig = {
                                                ...styleConfig,
                                                ...preset.config,
                                                background: { ...styleConfig.background, ...preset.config.background },
                                                border: { ...styleConfig.border, ...preset.config.border },
                                                shadow: { ...styleConfig.shadow, ...preset.config.shadow },
                                                transform: { ...styleConfig.transform, ...preset.config.transform },
                                            };
                                            onChange(merged);
                                            toast.success(`Effet "${preset.label}" appliqué`);
                                        }}
                                        className={`cms-effect-card ${(styleConfig.background?.colorFrom === preset.config.background?.colorFrom && styleConfig.background?.type === preset.config.background?.type) ? 'cms-effect-card--active' : ''}`}
                                    >
                                        <span className="cms-effect-card__badge">Actif</span>
                                        <div className="cms-effect-card__swatch" style={{ background: preset.preview }} />
                                        <span className="cms-effect-card__name">{preset.label}</span>
                                        <span className="cms-effect-card__desc">{preset.desc}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Opacité + Blend Mode */}
                        <SectionCollapsible title="Opacité & Compositing" icon={<Eye className="cms-section-collapsible__icon" />} accentColor="blue">
                            <SliderField
                                label="Opacité"
                                value={Math.round((transform.opacity ?? 1) * 100)}
                                onChange={(v) => updateTransform({ opacity: v / 100 })}
                                min={0} max={100} step={5} unit="%"
                            />
                            <div className="cms-field-tight">
                                <span className="cms-field-sublabel cms-field-sublabel--normal">Mode de fusion</span>
                                <div className="cms-blend-mode-grid">
                                    {(['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => updateTransform({ mixBlendMode: mode })}
                                            className={`cms-blend-mode-btn ${(transform.mixBlendMode || 'normal') === mode ? 'cms-blend-mode-btn--active' : ''}`}
                                        >
                                            {mode === 'normal' ? 'Normal' : mode === 'multiply' ? 'Multipl.' : mode === 'screen' ? 'Écran' : mode === 'overlay' ? 'Superp.' : mode === 'darken' ? 'Assombrir' : 'Éclaircir'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Filtres rapides (presets) */}
                        <SectionCollapsible title="Filtres presets" icon={<Sparkles className="cms-section-collapsible__icon" />} accentColor="purple" defaultOpen={false}>
                            <div className="cms-filter-presets-grid">
                                {[
                                    { label: 'Normal', filters: {} },
                                    { label: 'N&B', filters: { grayscale: 1 } },
                                    { label: 'Sépia', filters: { sepia: 0.8 } },
                                    { label: 'Inversé', filters: { invert: 1 } },
                                    { label: 'Vif', filters: { saturate: 1.5, contrast: 1.2 } },
                                    { label: 'Doux', filters: { blur: 1, brightness: 1.1 } },
                                    { label: 'Drama', filters: { contrast: 1.5, saturate: 1.3, brightness: 0.9 } },
                                    { label: 'Vintage', filters: { sepia: 0.4, contrast: 1.1, saturate: 0.8 } },
                                ].map(preset => (
                                    <button
                                        key={preset.label}
                                        onClick={() => updateTransform(preset.filters as Partial<TransformStyle>)}
                                        className="cms-filter-preset-btn"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Ajustements détaillés */}
                        <SectionCollapsible title="Ajustements" icon={<SlidersHorizontal className="cms-section-collapsible__icon" />} accentColor="amber">
                            {[
                                { key: 'blur' as const, label: 'Flou', min: 0, max: 20, step: 1, unit: 'px' },
                                { key: 'brightness' as const, label: 'Luminosité', min: 0, max: 2, step: 0.05, unit: '' },
                                { key: 'contrast' as const, label: 'Contraste', min: 0, max: 2, step: 0.05, unit: '' },
                                { key: 'saturate' as const, label: 'Saturation', min: 0, max: 2, step: 0.05, unit: '' },
                                { key: 'hueRotate' as const, label: 'Teinte', min: 0, max: 360, step: 5, unit: '°' },
                            ].map(filter => {
                                const val = (transform as Record<string, any>)[filter.key] ?? (filter.key === 'blur' ? 0 : filter.key === 'hueRotate' ? 0 : 1);
                                return (
                                    <SliderField
                                        key={filter.key}
                                        label={filter.label}
                                        value={val}
                                        onChange={(v) => updateTransform({ [filter.key]: v } as Partial<TransformStyle>)}
                                        min={filter.min} max={filter.max} step={filter.step} unit={filter.unit}
                                        accentColor="amber"
                                    />
                                );
                            })}
                            <button
                                onClick={() => updateTransform({ blur: 0, brightness: 1, contrast: 1, saturate: 1, hueRotate: 0, grayscale: 0, sepia: 0, invert: 0 })}
                                className="cms-reset-filters-btn"
                            >
                                <RotateCcw className="cms-icon--xs" />
                                Réinitialiser les filtres
                            </button>
                        </SectionCollapsible>

                        {/* Backdrop Filter (Glassmorphism) */}
                        <SectionCollapsible title="Backdrop Filter" icon={<Eye className="cms-section-collapsible__icon" />} accentColor="purple" defaultOpen={false}>
                            <div className="cms-overlay-fields">
                                <p className="cms-backdrop-desc">Effet glassmorphism — flou et filtres appliqués au fond derrière la section.</p>
                                <SliderField
                                    label="Flou arrière-plan"
                                    value={transform.backdropBlur ?? 0}
                                    onChange={(v) => updateTransform({ backdropBlur: v })}
                                    min={0} max={30} step={1} unit="px"
                                    accentColor="purple"
                                />
                                <SliderField
                                    label="Luminosité arrière-plan"
                                    value={transform.backdropBrightness ?? 1}
                                    onChange={(v) => updateTransform({ backdropBrightness: v })}
                                    min={0} max={2} step={0.05} unit=""
                                    accentColor="purple"
                                />
                                <SliderField
                                    label="Saturation arrière-plan"
                                    value={transform.backdropSaturate ?? 1}
                                    onChange={(v) => updateTransform({ backdropSaturate: v })}
                                    min={0} max={2} step={0.05} unit=""
                                    accentColor="purple"
                                />
                                {/* Presets glassmorphism */}
                                <div className="cms-field-tight">
                                    <span className="cms-field-sublabel cms-field-sublabel--normal">Presets glass</span>
                                    <div className="cms-glass-presets-grid">
                                        {[
                                            { label: 'Frost', blur: 12, brightness: 1.2, saturate: 1.3 },
                                            { label: 'Verre', blur: 20, brightness: 1, saturate: 1.5 },
                                            { label: 'Brume', blur: 8, brightness: 1.1, saturate: 0.8 },
                                            { label: 'Glace', blur: 16, brightness: 1.3, saturate: 0.6 },
                                            { label: 'Crystal', blur: 4, brightness: 1, saturate: 1.8 },
                                            { label: 'Reset', blur: 0, brightness: 1, saturate: 1 },
                                        ].map(preset => (
                                            <button
                                                key={preset.label}
                                                onClick={() => updateTransform({ backdropBlur: preset.blur, backdropBrightness: preset.brightness, backdropSaturate: preset.saturate })}
                                                className={`cms-glass-preset-btn ${preset.label === 'Reset' ? 'cms-glass-preset-btn--danger' : ''}`}
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Preview glass effect */}
                                <div className="relative h-10 rounded-lg overflow-hidden">
                                    <div className="cms-glass-preview__bg" />
                                    <div
                                        className="absolute inset-2 rounded-md border border-white/30"
                                        style={{
                                            backdropFilter: `blur(${transform.backdropBlur ?? 0}px) brightness(${transform.backdropBrightness ?? 1}) saturate(${transform.backdropSaturate ?? 1})`,
                                            backgroundColor: 'rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <span className="cms-glass-preview-label">Preview</span>
                                    </div>
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Transform */}
                        <SectionCollapsible title="Transformation" icon={<Layers className="cms-section-collapsible__icon" />} accentColor="emerald" defaultOpen={false}>
                            {/* Quick transform actions */}
                            <div className="cms-transform-actions-grid">
                                <button
                                    onClick={() => updateTransform({ scaleX: -(transform.scaleX ?? 1) })}
                                    className="cms-transform-action-btn"
                                    title="Miroir horizontal"
                                >
                                    <span className="text-xs">↔</span>
                                    Flip H
                                </button>
                                <button
                                    onClick={() => updateTransform({ scaleY: -(transform.scaleY ?? 1) })}
                                    className="cms-transform-action-btn"
                                    title="Miroir vertical"
                                >
                                    <span className="text-xs">↕</span>
                                    Flip V
                                </button>
                                <button
                                    onClick={() => updateTransform({ rotate: (transform.rotate || 0) + 90 })}
                                    className="cms-transform-action-btn"
                                    title="Rotation +90°"
                                >
                                    <span className="text-xs">↻</span>
                                    +90°
                                </button>
                                <button
                                    onClick={() => updateTransform({ rotate: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 })}
                                    className="cms-transform-action-btn cms-transform-action-btn--danger"
                                    title="Réinitialiser"
                                >
                                    <RotateCcw className="cms-icon--xs" />
                                    Reset
                                </button>
                            </div>
                            <SliderField
                                label="Rotation"
                                value={transform.rotate || 0}
                                onChange={(v) => updateTransform({ rotate: v })}
                                min={-180} max={180} step={1} unit="°"
                                accentColor="emerald"
                            />
                            <div className="cms-field-pair">
                                <SliderField
                                    label="Scale X"
                                    value={transform.scaleX ?? 1}
                                    onChange={(v) => updateTransform({ scaleX: v })}
                                    min={0.5} max={2} step={0.05} unit="x"
                                    accentColor="emerald"
                                />
                                <SliderField
                                    label="Scale Y"
                                    value={transform.scaleY ?? 1}
                                    onChange={(v) => updateTransform({ scaleY: v })}
                                    min={0.5} max={2} step={0.05} unit="x"
                                    accentColor="emerald"
                                />
                            </div>
                            <div className="cms-field-pair">
                                <SliderField
                                    label="Skew X"
                                    value={transform.skewX ?? 0}
                                    onChange={(v) => updateTransform({ skewX: v })}
                                    min={-45} max={45} step={1} unit="°"
                                    accentColor="emerald"
                                />
                                <SliderField
                                    label="Skew Y"
                                    value={transform.skewY ?? 0}
                                    onChange={(v) => updateTransform({ skewY: v })}
                                    min={-45} max={45} step={1} unit="°"
                                    accentColor="emerald"
                                />
                            </div>
                            {/* Translate X/Y */}
                            <div className="cms-field-pair">
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel cms-field-sublabel--normal">Translate X</label>
                                    <input
                                        type="text"
                                        value={transform.translateX || ''}
                                        onChange={(e) => updateTransform({ translateX: e.target.value || undefined })}
                                        placeholder="0px"
                                        className="cms-image-url-field"
                                    />
                                </div>
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel cms-field-sublabel--normal">Translate Y</label>
                                    <input
                                        type="text"
                                        value={transform.translateY || ''}
                                        onChange={(e) => updateTransform({ translateY: e.target.value || undefined })}
                                        placeholder="0px"
                                        className="cms-image-url-field"
                                    />
                                </div>
                            </div>
                            {/* Transform origin */}
                            <div className="cms-field-tight">
                                <span className="cms-field-sublabel cms-field-sublabel--normal">Origine transformation</span>
                                <div className="cms-transform-origin-grid">
                                    {[
                                        { value: 'top-left', label: '↖' },
                                        { value: 'top-center', label: '↑' },
                                        { value: 'top-right', label: '↗' },
                                        { value: 'center-left', label: '←' },
                                        { value: 'center', label: '●' },
                                        { value: 'center-right', label: '→' },
                                        { value: 'bottom-left', label: '↙' },
                                        { value: 'bottom-center', label: '↓' },
                                        { value: 'bottom-right', label: '↘' },
                                    ].map(origin => (
                                        <button
                                            key={origin.value}
                                            onClick={() => updateTransform({ transformOrigin: origin.value })}
                                            className={`cms-transform-origin-dot ${(transform.transformOrigin || 'center') === origin.value ? 'cms-transform-origin-dot--active' : ''}`}
                                            title={origin.value}
                                        >
                                            <div className="cms-transform-origin-dot__circle" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="cms-field-tight">
                                <span className="cms-overflow-label">Overflow</span>
                                <div className="cms-overflow-group">
                                    {(['visible', 'hidden', 'scroll', 'auto'] as const).map(overflow => (
                                        <button
                                            key={overflow}
                                            onClick={() => updateTransform({ overflow })}
                                            className={`cms-overflow-btn ${(transform.overflow || 'visible') === overflow ? 'cms-overflow-btn--active' : ''}`}
                                        >
                                            {overflow}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* ═══ Mode de fusion — cms-blend-group ═══ */}
                        <div className="cms-blend-group">
                            <span className="cms-blend-group__label">Mode de fusion</span>
                            <div className="cms-blend-grid">
                                {[
                                    { id: 'normal', label: 'Normal' },
                                    { id: 'multiply', label: 'Multipl.' },
                                    { id: 'screen', label: 'Écran' },
                                    { id: 'overlay', label: 'Superpos.' },
                                    { id: 'darken', label: 'Assombrir' },
                                    { id: 'lighten', label: 'Éclaircir' },
                                    { id: 'color-dodge', label: 'Dodge' },
                                    { id: 'color-burn', label: 'Burn' },
                                ].map(blend => (
                                    <button
                                        key={blend.id}
                                        onClick={() => updateTransform({ mixBlendMode: blend.id as any })}
                                        className={`cms-blend-btn ${(transform.mixBlendMode || 'normal') === blend.id ? 'cms-blend-btn--active' : ''}`}
                                    >
                                        <div className="cms-blend-btn__preview" style={{ mixBlendMode: blend.id as any }} />
                                        {blend.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ═══ Résumé des effets actifs ═══ */}
                        <div className="cms-effect-summary">
                            <div className="cms-effect-summary__header">
                                <span className="cms-effect-summary__title">Résumé effets</span>
                                <span className="cms-effect-summary__count">
                                    {[
                                        shadow.type && shadow.type !== 'none',
                                        transform.opacity !== undefined && transform.opacity !== 1,
                                        transform.blur !== undefined && transform.blur !== 0,
                                        transform.backdropBlur !== undefined && transform.backdropBlur !== 0,
                                        transform.mixBlendMode && transform.mixBlendMode !== 'normal',
                                        transform.rotate !== undefined && transform.rotate !== 0,
                                    ].filter(Boolean).length}
                                </span>
                            </div>
                            <div className="cms-effect-summary__grid">
                                <div className="cms-effect-summary__item">
                                    <Layers className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Ombre</div>
                                        <div className="cms-effect-summary__value">{shadow.type || 'none'}</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <Eye className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Opacité</div>
                                        <div className="cms-effect-summary__value">{Math.round((transform.opacity ?? 1) * 100)}%</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <Sparkles className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Flou</div>
                                        <div className="cms-effect-summary__value">{transform.blur ?? 0}px</div>
                                    </div>
                                </div>
                                <div className="cms-effect-summary__item">
                                    <Droplets className="cms-effect-summary__icon" />
                                    <div>
                                        <div className="cms-effect-summary__label">Backdrop</div>
                                        <div className="cms-effect-summary__value">{transform.backdropBlur ?? 0}px</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ TAB: ANIMATION — Enhanced with replay + visual timeline ═══ */}
                {activeTab === 'animation' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        {/* Type d'animation */}
                        <SectionCollapsible title="Animation d'entr\u00e9e" icon={<Zap className="cms-section-collapsible__icon" />} accentColor="purple">
                            <div className="cms-anim-presets-grid">
                                {ANIMATION_PRESETS.map(preset => (
                                    <button
                                        key={preset.type}
                                        onClick={() => updateAnimations({ type: preset.type })}
                                        className={`cms-anim-preset-btn ${(animations.type || 'none') === preset.type ? 'cms-anim-preset-btn--active' : ''}`}
                                        title={preset.label}
                                    >
                                        <span className="cms-anim-preset-btn__icon">{preset.icon}</span>
                                        <span className="cms-anim-preset-btn__label">{preset.label.split(' ')[0]}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Preview de l'animation avec replay */}
                            {(animations.type && animations.type !== 'none') && (
                                <div className="cms-anim-preview-container">
                                    <div className="cms-anim-preview-header">
                                        <span className="cms-anim-preview-title">
                                            <Eye /> Aperçu
                                        </span>
                                        <div className="cms-section-inline-row">
                                            <span className="cms-anim-type-badge">{animations.type}</span>
                                            <button
                                                key={animKey}
                                                onClick={() => setAnimKey(k => k + 1)}
                                                className="cms-anim-replay-btn"
                                                title="Rejouer l'animation"
                                            >
                                                <RefreshCw /> Replay
                                            </button>
                                        </div>
                                    </div>
                                    {/* Animation preview area with grid */}
                                    <div className="cms-anim-preview-area">
                                        <div className="cms-anim-preview-area__line" />
                                        <div
                                            key={animKey}
                                            className="cms-anim-preview-box cms-animate-preview"
                                            style={{
                                                animationDuration: `${animations.duration ?? 0.5}s`,
                                                animationDelay: `${animations.delay ?? 0}s`,
                                                animationTimingFunction: animations.easing === 'easeIn' ? 'ease-in' : animations.easing === 'easeInOut' ? 'ease-in-out' : animations.easing === 'linear' ? 'linear' : 'ease-out',
                                            }}
                                        />
                                    </div>
                                    {/* Mini timeline v2 */}
                                    <div className="cms-anim-timeline-v2 mt-1.5">
                                        <div className="cms-anim-timeline-v2__header">
                                            <span className="cms-anim-timeline-v2__title">
                                                <Clock className="cms-section-icon--sm" /> Timeline
                                            </span>
                                            <div className="cms-anim-timeline-v2__controls">
                                                <button
                                                    onClick={() => setAnimKey(k => k + 1)}
                                                    className="cms-anim-timeline-v2__btn"
                                                    title="Rejouer"
                                                >
                                                    <RefreshCw className="cms-section-icon--sm" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="cms-anim-timeline-v2__track">
                                            <div
                                                className="cms-anim-timeline-v2__bar"
                                                style={{
                                                    width: `${Math.min(((animations.duration ?? 0.5) / 3) * 100, 100)}%`,
                                                }}
                                            />
                                            <div
                                                className="cms-anim-timeline-v2__playhead"
                                                style={{
                                                    left: `${Math.min(((animations.delay ?? 0) / 2) * 100, 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="cms-anim-timeline-v2__labels">
                                            <span className="cms-anim-timeline-v2__label">0s</span>
                                            <span className="cms-anim-timeline-v2__label">{(animations.duration ?? 0.5).toFixed(1)}s</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </SectionCollapsible>

                        {/* Timing */}
                        <SectionCollapsible title="Timing" icon={<Clock className="cms-section-collapsible__icon" />} accentColor="blue">
                            <SliderField
                                label="Durée"
                                value={animations.duration ?? 0.5}
                                onChange={(v) => updateAnimations({ duration: v })}
                                min={0.1} max={3} step={0.1} unit="s"
                            />
                            <SliderField
                                label="Délai"
                                value={animations.delay ?? 0}
                                onChange={(v) => updateAnimations({ delay: v })}
                                min={0} max={2} step={0.1} unit="s"
                                accentColor="blue"
                            />
                            {/* Courbe d'animation */}
                            <div className="cms-curve-wrap">
                                <span className="cms-curve-label">Courbe</span>
                                <div className="cms-easing-grid">
                                    {EASING_PRESETS.map(easing => (
                                        <button
                                            key={easing.value}
                                            onClick={() => updateAnimations({ easing: easing.value })}
                                            className={`cms-easing-btn ${(animations.easing || 'easeOut') === easing.value ? 'cms-easing-btn--active' : ''}`}
                                        >
                                            {/* Mini courbe visuelle */}
                                            <svg width="20" height="12" viewBox="0 0 20 12" className="cms-easing-btn__curve text-current">
                                                <path
                                                    d="M0,12 C5,12 10,0 20,0"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    style={{ opacity: (animations.easing || 'easeOut') === easing.value ? 1 : 0.4 }}
                                                />
                                            </svg>
                                            <span className="cms-easing-btn__label">{easing.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Stagger toggle */}
                            <div className="cms-toggle-row">
                                <span className="cms-toggle-row__label">Stagger (décalage enfants)</span>
                                <button
                                    onClick={() => updateAnimations({ stagger: !animations.stagger })}
                                    className={`cms-toggle ${animations.stagger ? 'cms-toggle--checked' : ''}`}
                                >
                                    <span className="cms-toggle__thumb" />
                                </button>
                            </div>
                        </SectionCollapsible>

                        {/* Effet de survol — avec preview interactif */}
                        <SectionCollapsible title="Effet de survol" icon={<MousePointer className="cms-section-collapsible__icon" />} accentColor="rose" defaultOpen={false}>
                            <div className="cms-hover-presets-grid">
                                {HOVER_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        onClick={() => updateAnimations({ hover: preset.value })}
                                        className={`cms-hover-preset-btn ${(animations.hover || 'none') === preset.value ? 'cms-hover-preset-btn--active' : ''}`}
                                    >
                                        <span className="cms-hover-preset-btn__icon">{preset.icon}</span>
                                        <span className="cms-hover-preset-btn__label">{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                            {/* Hover preview area */}
                            {(animations.hover && animations.hover !== 'none') && (
                                <div className="cms-hover-preview-container">
                                    <span className="cms-hover-preview-title">
                                        <MousePointer /> Survolez la boîte
                                    </span>
                                    <div className="cms-hover-preview-area">
                                        <div
                                            className={`cms-hover-preview-box ${
                                                animations.hover === 'lift' ? 'cms-hover-preview-box--lift'
                                                : animations.hover === 'glow' ? 'cms-hover-preview-box--glow'
                                                : animations.hover === 'scale' ? 'cms-hover-preview-box--scale'
                                                : animations.hover === 'tilt' ? 'cms-hover-preview-box--tilt'
                                                : animations.hover === 'shadow' ? 'cms-hover-preview-box--shadow'
                                                : animations.hover === 'border-glow' ? 'cms-hover-preview-box--border-glow'
                                                : ''
                                            }`}
                                        />
                                    </div>
                                    <div className="cms-hover-effect-label">Effet: {animations.hover}</div>
                                </div>
                            )}
                        </SectionCollapsible>

                        {/* Parallax toggle */}
                        <div className="cms-toggle-row">
                            <div className="cms-section-inline-row--md">
                                <Layers className="cms-section-collapsible__icon text-indigo-500" />
                                <span className="cms-toggle-row__label">Parallax scrolling</span>
                            </div>
                            <button
                                onClick={() => updateAnimations({ parallax: !animations.parallax })}
                                className={`cms-toggle ${animations.parallax ? 'cms-toggle--checked' : ''}`}
                            >
                                <span className="cms-toggle__thumb" />
                            </button>
                        </div>

                        {/* Résumé animation */}
                        {animations.type && animations.type !== 'none' && (
                            <div className="cms-anim-summary">
                                <div className="cms-anim-summary__header">
                                    <span className="cms-anim-summary__title">Résumé animation</span>
                                </div>
                                <div className="cms-anim-summary__grid">
                                    <div className="cms-anim-summary__item">Type: <strong>{animations.type}</strong></div>
                                    <div className="cms-anim-summary__item">Durée: <strong>{animations.duration ?? 0.5}s</strong></div>
                                    <div className="cms-anim-summary__item">Courbe: <strong>{animations.easing || 'easeOut'}</strong></div>
                                    <div className="cms-anim-summary__item">Délai: <strong>{animations.delay ?? 0}s</strong></div>
                                    <div className="cms-anim-summary__item">Survol: <strong>{animations.hover || 'none'}</strong></div>
                                    <div className="cms-anim-summary__item">Parallax: <strong>{animations.parallax ? 'Oui' : 'Non'}</strong></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ TAB: DISPOSITION (Layout) — Enhanced with visual preview ═══ */}
                {activeTab === 'disposition' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        {/* Display type */}
                        <SectionCollapsible title="Mode d'affichage" icon={<Columns3 className="cms-section-collapsible__icon" />} accentColor="blue">
                            <div className="cms-layout-display-grid">
                                {([
                                    { value: 'block', label: 'Block', icon: '▬' },
                                    { value: 'flex', label: 'Flex', icon: '↔' },
                                    { value: 'grid', label: 'Grid', icon: '⊞' },
                                    { value: 'inline-flex', label: 'Inline', icon: '▭' },
                                ] as const).map(({ value, label, icon }) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayout({ display: value })}
                                        className={`cms-layout-display-btn ${(layout.display || 'block') === value ? 'cms-layout-display-btn--active' : ''}`}
                                    >
                                        <span className="cms-layout-display-btn__icon">{icon}</span>
                                        <span className="cms-layout-display-btn__label">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Flex direction + wrap */}
                        {(layout.display === 'flex' || layout.display === 'inline-flex') && (
                            <>
                                <SectionCollapsible title="Direction" icon={<ArrowUpDown className="cms-section-collapsible__icon" />} accentColor="purple">
                                    <div className="cms-flex-dir-grid">
                                        {([
                                            { value: 'row', label: 'Ligne', icon: '→' },
                                            { value: 'column', label: 'Colonne', icon: '↓' },
                                            { value: 'row-reverse', label: 'Inv.', icon: '←' },
                                            { value: 'column-reverse', label: 'Inv.', icon: '↑' },
                                        ] as const).map(({ value, label, icon }) => (
                                            <button
                                                key={value}
                                                onClick={() => updateLayout({ flexDirection: value })}
                                                className={`cms-flex-dir-btn ${(layout.flexDirection || 'row') === value ? 'cms-flex-dir-btn--active' : ''}`}
                                            >
                                                <span className="cms-flex-dir-btn__icon">{icon}</span>
                                                <span className="cms-flex-dir-btn__label">{label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {/* Wrap toggle */}
                                    <div className="cms-toggle-row mt-1.5">
                                        <span className="cms-toggle-row__label">Retour à la ligne</span>
                                        <button
                                            onClick={() => updateLayout({ flexWrap: layout.flexWrap === 'wrap' ? 'nowrap' : 'wrap' })}
                                            className={`cms-toggle ${layout.flexWrap === 'wrap' ? 'cms-toggle--checked' : ''}`}
                                        >
                                            <span className="cms-toggle__thumb" />
                                        </button>
                                    </div>
                                </SectionCollapsible>

                                {/* Align items */}
                                <SectionCollapsible title="Alignement" icon={<AlignCenterVertical className="cms-section-collapsible__icon" />} accentColor="emerald">
                                    <div className="cms-layout-field-stack">
                                        <span className="cms-field-sublabel cms-field-sublabel--normal">Aligner (axe croisé)</span>
                                        <div className="cms-align-grid cms-align-grid--cross">
                                            {([
                                                { value: 'start', icon: '⬆', label: 'Début' },
                                                { value: 'center', icon: '↕', label: 'Centre' },
                                                { value: 'end', icon: '⬇', label: 'Fin' },
                                                { value: 'stretch', icon: '⇕', label: 'Étirer' },
                                                { value: 'baseline', icon: 'A', label: 'Base' },
                                            ] as const).map(({ value, icon, label }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => updateLayout({ alignItems: value })}
                                                    className={`cms-align-btn ${(layout.alignItems || 'stretch') === value ? 'cms-align-btn--active' : ''}`}
                                                    title={label}
                                                >
                                                    <span className="cms-align-btn__icon">{icon}</span>
                                                    <span className="cms-align-btn__label">{label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="cms-layout-field-stack cms-layout-field-stack--mt">
                                        <span className="cms-field-sublabel cms-field-sublabel--normal">Justifier (axe principal)</span>
                                        <div className="cms-align-grid cms-align-grid--main">
                                            {([
                                                { value: 'start', icon: '⫷' },
                                                { value: 'center', icon: '⫿' },
                                                { value: 'end', icon: '⫸' },
                                                { value: 'between', icon: '⇔' },
                                                { value: 'around', icon: '↔' },
                                                { value: 'evenly', icon: '⬌' },
                                            ] as const).map(({ value, icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => updateLayout({ justifyContent: value })}
                                                    className={`cms-align-btn ${(layout.justifyContent || 'start') === value ? 'cms-align-btn--active' : ''}`}
                                                    title={value}
                                                >
                                                    <span className="cms-align-btn__icon">{icon}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </SectionCollapsible>
                            </>
                        )}

                        {/* Gap controls */}
                        <SectionCollapsible title="Espacement interne" icon={<ArrowLeftRight className="cms-section-collapsible__icon" />} accentColor="amber">
                            <div className="cms-layout-field-stack">
                                <div className="cms-field-tight">
                                    <label className="cms-field-sublabel cms-field-sublabel--normal">Gap global</label>
                                    <input
                                        type="text"
                                        value={layout.gap || '1rem'}
                                        onChange={(e) => updateLayout({ gap: e.target.value })}
                                        placeholder="1rem"
                                        className="cms-layout-gap-input"
                                    />
                                </div>
                                <div className="cms-field-pair">
                                    <div className="cms-field-tight">
                                        <label className="cms-field-sublabel cms-field-sublabel--normal">Gap rangées</label>
                                        <input
                                            type="text"
                                            value={layout.rowGap || ''}
                                            onChange={(e) => updateLayout({ rowGap: e.target.value })}
                                            placeholder="auto"
                                            className="cms-layout-gap-input"
                                        />
                                    </div>
                                    <div className="cms-field-tight">
                                        <label className="cms-field-sublabel cms-field-sublabel--normal">Gap colonnes</label>
                                        <input
                                            type="text"
                                            value={layout.columnGap || ''}
                                            onChange={(e) => updateLayout({ columnGap: e.target.value })}
                                            placeholder="auto"
                                            className="cms-layout-gap-input"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Content width */}
                        <SectionCollapsible title="Largeur contenu" icon={<Maximize2 className="cms-section-collapsible__icon" />} accentColor="blue" defaultOpen={false}>
                            <div className="cms-content-width-grid">
                                {([
                                    { value: 'narrow', label: 'Étroit', px: '640px' },
                                    { value: 'normal', label: 'Normal', px: '960px' },
                                    { value: 'wide', label: 'Large', px: '1200px' },
                                    { value: 'full', label: 'Plein', px: '100%' },
                                ] as const).map(({ value, label, px }) => (
                                    <button
                                        key={value}
                                        onClick={() => updateLayout({ contentWidth: value })}
                                        className={`cms-content-width-btn ${(layout.contentWidth || 'full') === value ? 'cms-content-width-btn--active' : ''}`}
                                    >
                                        <div className="cms-content-width-btn__bar" style={{ width: value === 'narrow' ? '40%' : value === 'normal' ? '60%' : value === 'wide' ? '80%' : '100%' }} />
                                        <span className="cms-content-width-btn__label">{label}</span>
                                        <span className="cms-content-width-btn__px">{px}</span>
                                    </button>
                                ))}
                            </div>
                        </SectionCollapsible>

                        {/* Visual flex preview */}
                        {(layout.display === 'flex' || layout.display === 'inline-flex') && (
                            <div className="cms-layout-preview">
                                <div className="cms-layout-preview__label">Aperçu disposition</div>
                                <div
                                    className="cms-layout-preview__box"
                                    style={{
                                        flexDirection: layout.flexDirection === 'column' || layout.flexDirection === 'column-reverse' ? 'column' : 'row',
                                        flexWrap: layout.flexWrap,
                                        alignItems: layout.alignItems === 'start' ? 'flex-start' : layout.alignItems === 'end' ? 'flex-end' : layout.alignItems || 'stretch',
                                        justifyContent: layout.justifyContent === 'between' ? 'space-between' : layout.justifyContent === 'around' ? 'space-around' : layout.justifyContent === 'evenly' ? 'space-evenly' : layout.justifyContent || 'flex-start',
                                        gap: layout.gap || '4px',
                                    }}
                                >
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="cms-layout-preview__item">
                                            {i}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ TRANSFORMATION ═══ */}
                        <SectionCollapsible title="Transformation" icon={<RotateCcw className="cms-section-collapsible__icon" />} accentColor="violet" defaultOpen={false}>
                            {/* Quick transform actions */}
                            <div className="cms-transform-actions-grid">
                                <button
                                    onClick={() => updateTransform({ scaleX: -(transform.scaleX ?? 1) })}
                                    className="cms-transform-action-btn"
                                    title="Miroir horizontal"
                                >
                                    <span className="text-xs">↔</span>
                                    Flip H
                                </button>
                                <button
                                    onClick={() => updateTransform({ scaleY: -(transform.scaleY ?? 1) })}
                                    className="cms-transform-action-btn"
                                    title="Miroir vertical"
                                >
                                    <span className="text-xs">↕</span>
                                    Flip V
                                </button>
                                <button
                                    onClick={() => updateTransform({ rotate: (transform.rotate || 0) + 90 })}
                                    className="cms-transform-action-btn"
                                    title="Rotation +90°"
                                >
                                    <span className="text-xs">↻</span>
                                    +90°
                                </button>
                                <button
                                    onClick={() => updateTransform({ rotate: 0, scaleX: 1, scaleY: 1, skewX: 0, skewY: 0 })}
                                    className="cms-transform-action-btn cms-transform-action-btn--danger"
                                    title="Réinitialiser"
                                >
                                    <RotateCcw className="cms-section-collapsible__icon" />
                                    Reset
                                </button>
                            </div>
                            {/* Rotation + Scale */}
                            <SliderField
                                label="Rotation"
                                value={transform.rotate ?? 0}
                                onChange={(v) => updateTransform({ rotate: v })}
                                min={-180} max={180} step={5} unit="°"
                            />
                            <div className="cms-field-pair">
                                <SliderField
                                    label="Scale X"
                                    value={transform.scaleX ?? 1}
                                    onChange={(v) => updateTransform({ scaleX: v })}
                                    min={0} max={2} step={0.05} unit="x"
                                />
                                <SliderField
                                    label="Scale Y"
                                    value={transform.scaleY ?? 1}
                                    onChange={(v) => updateTransform({ scaleY: v })}
                                    min={0} max={2} step={0.05} unit="x"
                                />
                            </div>
                            {/* Skew X/Y */}
                            <div className="cms-field-pair">
                                <SliderField
                                    label="Skew X"
                                    value={transform.skewX ?? 0}
                                    onChange={(v) => updateTransform({ skewX: v })}
                                    min={-45} max={45} step={1} unit="°"
                                />
                                <SliderField
                                    label="Skew Y"
                                    value={transform.skewY ?? 0}
                                    onChange={(v) => updateTransform({ skewY: v })}
                                    min={-45} max={45} step={1} unit="°"
                                />
                            </div>
                            {/* Transform origin (9 points) */}
                            <div className="cms-origin-wrap">
                                <span className="cms-origin-label">Origine transformation</span>
                                <div className="cms-origin-grid">
                                    {[
                                        { value: 'top-left', label: '↖' }, { value: 'top-center', label: '↑' }, { value: 'top-right', label: '↗' },
                                        { value: 'center-left', label: '←' }, { value: 'center', label: '●' }, { value: 'center-right', label: '→' },
                                        { value: 'bottom-left', label: '↙' }, { value: 'bottom-center', label: '↓' }, { value: 'bottom-right', label: '↘' },
                                    ].map(origin => (
                                        <button
                                            key={origin.value}
                                            onClick={() => updateTransform({ transformOrigin: origin.value })}
                                            className={`cms-origin-btn ${(transform.transformOrigin || 'center') === origin.value ? 'cms-origin-btn--active' : ''}`}
                                            title={origin.value}
                                        >
                                            <div className="cms-origin-btn__dot" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </SectionCollapsible>
                    </div>
                )}

                {/* ═══ TAB: RESPONSIVE (Device visibility) ═══ */}
                {activeTab === 'responsive' && (
                    <div className="cms-tab-content--padded cms-tab-content-enter">
                        {/* Device visibility toggles */}
                        <SectionCollapsible title="Visibilité par appareil" icon={<MonitorIcon className="cms-section-collapsible__icon" />} accentColor="blue">
                            <div className="cms-device-selector space-y-1.5">
                                {([
                                    { key: 'visibleDesktop' as const, icon: <MonitorIcon className="cms-section-icon--md" />, label: 'Desktop', sublabel: '≥ 1024px' },
                                    { key: 'visibleTablet' as const, icon: <Tablet className="cms-section-icon--md" />, label: 'Tablette', sublabel: '768–1023px' },
                                    { key: 'visibleMobile' as const, icon: <Smartphone className="cms-section-icon--md" />, label: 'Mobile', sublabel: '< 768px' },
                                ]).map(({ key, icon, label, sublabel }) => (
                                    <div key={key} className="cms-toggle-row">
                                        <div className="cms-device-row">
                                            <span className="cms-device-row__icon">{icon}</span>
                                            <div>
                                                <span className="cms-device-row__label">{label}</span>
                                                <span className="cms-device-row__sublabel">{sublabel}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => updateLayout({ [key]: !(layout[key] ?? true) })}
                                            className={`cms-toggle ${(layout[key] ?? true) ? 'cms-toggle--checked' : ''}`}
                                        >
                                            <span className="cms-toggle__thumb" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {/* Résumé visibilité */}
                            <div className="cms-responsive-summary">
                                <div className="cms-responsive-summary__text">
                                    Visible sur : {[
                                        (layout.visibleDesktop ?? true) && 'Desktop',
                                        (layout.visibleTablet ?? true) && 'Tablette',
                                        (layout.visibleMobile ?? true) && 'Mobile',
                                    ].filter(Boolean).join(', ') || 'Aucun'}
                                </div>
                            </div>
                        </SectionCollapsible>

                        {/* Quick presets */}
                        <SectionCollapsible title="Presets rapides" icon={<Sparkles className="cms-section-collapsible__icon" />} accentColor="purple" defaultOpen={false}>
                            <div className="cms-responsive-presets">
                                <button
                                    onClick={() => updateLayout({ visibleDesktop: true, visibleTablet: true, visibleMobile: true })}
                                    className="cms-responsive-preset-btn"
                                >
                                    <Maximize2 className="cms-responsive-preset-btn__icon" />
                                    Visible partout
                                </button>
                                <button
                                    onClick={() => updateLayout({ visibleDesktop: true, visibleTablet: true, visibleMobile: false })}
                                    className="cms-responsive-preset-btn"
                                >
                                    <MonitorIcon className="cms-responsive-preset-btn__icon" />
                                    Desktop + Tablette uniquement
                                </button>
                                <button
                                    onClick={() => updateLayout({ visibleDesktop: false, visibleTablet: false, visibleMobile: true })}
                                    className="cms-responsive-preset-btn"
                                >
                                    <Smartphone className="cms-responsive-preset-btn__icon" />
                                    Mobile uniquement
                                </button>
                                <button
                                    onClick={() => updateLayout({ visibleDesktop: false, visibleTablet: true, visibleMobile: true })}
                                    className="cms-responsive-preset-btn"
                                >
                                    <Tablet className="cms-responsive-preset-btn__icon" />
                                    Tablette + Mobile
                                </button>
                            </div>
                        </SectionCollapsible>
                    </div>
                )}
                    </div>
                </>
            )}

            {/* ─── Footer — Professional toolbar ─── */}
            <div className="cms-editor-toolbar" style={{ flexDirection: 'column', gap: '4px', padding: '6px 10px' }}>
                {/* Row 1: Style summary pills */}
                <div className="cms-footer-row">
                    {/* Background swatch */}
                    <div
                        className="cms-live-swatch cms-live-swatch--sm"
                        style={{
                            background: bg.type === 'gradient'
                                ? `linear-gradient(${bg.gradientDirection || 'to-b'}, ${bg.gradientFrom || '#ccc'}, ${bg.gradientTo || '#999'})`
                                : (bg.color || '#ffffff'),
                        }}
                        title={`Fond: ${bg.type === 'gradient' ? 'Dégradé' : bg.type === 'image' ? 'Image' : bg.color || '#fff'}`}
                    />
                    {/* Typography pill */}
                    <span className="cms-style-pill" title={`Police: ${typo.fontFamily || 'sans'}, Poids: ${typo.fontWeight || 'normal'}`}>
                        {typo.fontFamily === 'serif' ? 'Sf' : typo.fontFamily === 'mono' ? 'Mn' : 'Sn'}·{typo.fontWeight === 'bold' ? 'B' : typo.fontWeight === 'semibold' ? 'SB' : typo.fontWeight === 'medium' ? 'M' : 'R'}
                    </span>
                    {/* Border pill */}
                    {border.width && border.width !== 'none' && (
                        <span className="cms-style-pill" title={`Bordure: ${border.width} ${border.style} ${border.color}`}>
                            ▭{border.width === 'thin' ? '1' : border.width === 'medium' ? '2' : '4'}
                        </span>
                    )}
                    {/* Shadow pill */}
                    {shadow.type && shadow.type !== 'none' && (
                        <span className="cms-style-pill cms-style-pill--active" title={`Ombre: ${shadow.type}`}>
                            ◐{shadow.type}
                        </span>
                    )}
                    {/* Animation pill */}
                    {animations.type && animations.type !== 'none' && (
                        <span className="cms-style-pill cms-style-pill--active" title={`Animation: ${animations.type}`}>
                            ▶{animations.type}
                        </span>
                    )}
                    <div className="cms-section-inline-spacer" />
                    <span className="cms-active-count" style={{ fontSize: '7px' }}>
                        {[bg.type !== 'color' || bg.color !== '#ffffff', typo.fontWeight !== 'normal' || typo.fontFamily !== 'sans', border.width !== 'none', shadow.type !== 'none', animations.type !== 'none'].filter(Boolean).length} modif.
                    </span>
                </div>
                {/* Row 2: CSS preview + copy */}
                <div className="cms-footer-row">
                    <button
                        onClick={() => {
                            const css = generateCSSPreview(styleConfig);
                            navigator.clipboard.writeText(css);
                            toast.success('CSS copié');
                        }}
                        className="cms-editor-toolbar__btn cms-editor-toolbar__btn--primary"
                        title="Copier le CSS"
                    >
                        <Copy className="cms-section-icon--sm" />
                        CSS
                    </button>
                    <div className="cms-footer-css-preview"
                        title={generateCSSPreview(styleConfig)}
                    >
                        {generateCSSPreview(styleConfig).split('\n')[0]}
                    </div>
                </div>
                {/* Row 3: Action buttons + shortcuts */}
                <div className="cms-footer-row">
                    <div className="cms-editor-toolbar__group">
                        <button
                            onClick={handleUndoStyle}
                            disabled={historyIndex <= 0}
                            className="cms-editor-toolbar__btn disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Annuler style (Ctrl+Z)"
                        >
                            <Undo2 className="cms-section-icon--sm" />
                        </button>
                        <button
                            onClick={handleRedoStyle}
                            disabled={historyIndex >= styleHistory.length - 1}
                            className="cms-editor-toolbar__btn disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Rétablir style (Ctrl+Y)"
                        >
                            <Redo2 className="cms-section-icon--sm" />
                        </button>
                        <button
                            onClick={() => setShowPasteStyle(v => !v)}
                            className={`cms-editor-toolbar__btn ${showPasteStyle ? 'cms-editor-toolbar__btn--active' : ''}`}
                            title="Coller un style (JSON)"
                        >
                            <ClipboardPaste className="cms-section-icon--sm" />
                        </button>
                        <button
                            onClick={handleCopyStyle}
                            className={`cms-editor-toolbar__btn ${copied ? 'cms-editor-toolbar__btn--active' : ''}`}
                            title="Copier le style (JSON)"
                        >
                            {copied ? <Check className="cms-section-icon--sm" /> : <Copy className="cms-section-icon--sm" />}
                        </button>
                        <button
                            onClick={handleReset}
                            className="cms-editor-toolbar__btn cms-editor-toolbar__btn--danger"
                            title="Réinitialiser"
                        >
                            <RotateCcw className="cms-section-icon--sm" />
                        </button>
                    </div>
                    <div className="cms-editor-toolbar__spacer" />
                    {/* Keyboard hints */}
                    <div className="cms-kbd-hint--footer">
                        <kbd className="cms-kbd-hint__key">Ctrl</kbd>
                        <kbd className="cms-kbd-hint__key">Z</kbd>
                        <span>annuler</span>
                        <span className="mx-0.5">·</span>
                        <kbd className="cms-kbd-hint__key">Esc</kbd>
                        <span>fermer</span>
                    </div>
                    <button
                        onClick={onOpenFullEditor}
                        className="cms-editor-toolbar__btn cms-editor-toolbar__btn--primary"
                        title="Ouvrir l'éditeur complet"
                    >
                        <Sparkles className="cms-section-icon--sm" />
                        Complet
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================================
// ContrastChecker — WCAG contrast ratio
// ==================================

/** Calcule le rapport de contraste WCAG entre deux couleurs hex */
function ContrastChecker({ fgColor, bgColor }: { fgColor: string; bgColor: string }) {
    const ratio = useMemo(() => computeContrastRatio(fgColor, bgColor), [fgColor, bgColor]);
    const level = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA-large' : 'Fail';
    const variant = level === 'Fail' ? 'fail' : level === 'AA-large' ? 'warn' : 'pass';

    return (
        <span className={`cms-contrast-badge cms-contrast-badge--${variant}`}>
            <span className="cms-contrast-badge__ratio">{ratio.toFixed(1)}:1</span>
            <span>{level}</span>
        </span>
    );
}

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function luminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function computeContrastRatio(fg: string, bg: string): number {
    try {
        const [r1, g1, b1] = hexToRgb(fg);
        const [r2, g2, b2] = hexToRgb(bg);
        const l1 = luminance(r1, g1, b1);
        const l2 = luminance(r2, g2, b2);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
    } catch {
        return 0;
    }
}
