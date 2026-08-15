/**
 * ==================================
 * eLISAschool - Panneau d'édition de style visuel CMS v2
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Panneau complet de personnalisation visuelle :
 * typographie, arrière-plan, espacement, bordures, ombres, boutons, animations.
 * Preview live + presets visuels + application globale.
 * Empty state + box model visuel + accordion amélioré.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    Palette, Type, Square, Layers, MousePointer, Sparkles,
    ChevronDown, RotateCcw, Copy, Check, Wand2, Zap, Play, Pause,
    Droplets, Clipboard, ClipboardPaste, Search, Eye, EyeOff, ChevronRight, X,
    AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic, Underline,
    Image, Video, Link2, Hash, Minus, Maximize2, MoveHorizontal, MoveVertical,
    FileText, MapPin, Code, ListOrdered, Users, Star, Clock, Download, CreditCard,
    MessageSquare, Mail, Globe, Phone, Settings2, ListChecks,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    type SectionStyleConfig, type TypographyStyle, type BackgroundStyle,
    type SpacingStyle, type BorderStyle, type ShadowStyle, type ButtonStyle,
    type AnimationConfig, type AnimationType, type TransformStyle,
    AnimationEasing, HoverEffect,
    STYLE_PRESETS, mergeSectionStyles,
    BUTTON_VARIANTS, BUTTON_SIZES, GRADIENT_DIRECTIONS,
} from '../puck/shared-styles';

// ==================================
// Clipboard de styles (global au module)
// ==================================

let globalStyleClipboard: SectionStyleConfig | null = null;
const styleClipboardListeners = new Set<() => void>();

function notifyStyleClipboardListeners() {
    styleClipboardListeners.forEach(l => l());
}

/** Hook pour accéder au clipboard de styles global */
function useStyleClipboard() {
    const [hasClipboard, setHasClipboard] = useState(!!globalStyleClipboard);
    useEffect(() => {
        const listener = () => setHasClipboard(!!globalStyleClipboard);
        styleClipboardListeners.add(listener);
        return () => { styleClipboardListeners.delete(listener); };
    }, []);
    return {
        hasClipboard,
        copy: (config: SectionStyleConfig) => {
            globalStyleClipboard = { ...config };
            notifyStyleClipboardListeners();
        },
        paste: () => globalStyleClipboard,
        clear: () => {
            globalStyleClipboard = null;
            notifyStyleClipboardListeners();
        },
    };
}

// ==================================
// Types
// ==================================

interface StyleEditorPanelProps {
    config: SectionStyleConfig;
    onChange: (config: SectionStyleConfig) => void;
    onApplyGlobal?: (config: SectionStyleConfig) => void;
    hasSelection?: boolean;
    componentType?: string; // Type du composant sélectionné (pour quick-actions contextuels)
    sectionProps?: Record<string, any>; // Props de la section pour édition contenu
    onSectionPropsChange?: (props: Record<string, any>) => void; // Callback pour modifier les props
}

type SectionId = 'contenu' | 'typography' | 'background' | 'spacing' | 'border' | 'shadow' | 'button' | 'animations' | 'transform' | 'disposition';

// ==================================
// Valeurs par défaut
// ==================================

const DEFAULT_TYPO: TypographyStyle = {
    fontFamily: 'sans', fontWeight: 'normal', fontSize: 'base',
    lineHeight: 'relaxed', letterSpacing: 'normal', textAlign: 'left', textTransform: 'none',
};

const DEFAULT_BG: BackgroundStyle = {
    type: 'color', color: '#ffffff', overlay: false,
    overlayColor: '#000000', overlayOpacity: 0, imagePosition: 'cover',
};

const DEFAULT_SPACING: SpacingStyle = {
    paddingTop: 'clamp(2rem, 1.5rem + 2vw, 4rem)', paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
    paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)', paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
    marginTop: '0', marginBottom: '0', gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)',
};

const DEFAULT_BORDER: BorderStyle = { width: 'none', color: '#e5e7eb', style: 'solid', radius: 'none' };
const DEFAULT_SHADOW: ShadowStyle = { type: 'none' };
const DEFAULT_BUTTON: ButtonStyle = { texte: 'Cliquez ici', variant: 'primary', size: 'md', borderRadius: 'md', fullWidth: false };
const DEFAULT_ANIM: AnimationConfig = { type: 'fade-in', duration: 0.5, delay: 0, easing: 'easeOut', hover: 'none' };
const DEFAULT_TRANSFORM: TransformStyle = { opacity: 1 };

// ==================================
// Palette de couleurs rapides
// ==================================

const COLOR_SWATCHES = [
    // Neutres
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#111827',
    // Primaires
    '#2563eb', '#1d4ed8', '#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff',
    // Succès
    '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7',
    // Avertissement
    '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7',
    // Erreur
    '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2',
    // Violet/Indigo
    '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe',
    // Rose/Pink
    '#db2777', '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3',
];

// ==================================
// Presets de gradients
// ==================================

const GRADIENT_PRESETS = [
    { name: 'Océan', from: '#0369a1', to: '#2563eb', dir: 'to-br' as const },
    { name: 'Coucher', from: '#dc2626', to: '#f59e0b', dir: 'to-r' as const },
    { name: 'Forêt', from: '#166534', to: '#16a34a', dir: 'to-b' as const },
    { name: 'Nuit', from: '#1e1b4b', to: '#312e81', dir: 'to-b' as const },
    { name: 'Aurore', from: '#7c3aed', to: '#ec4899', dir: 'to-br' as const },
    { name: 'Flamme', from: '#ea580c', to: '#fbbf24', dir: 'to-r' as const },
    { name: 'Menthe', from: '#0d9488', to: '#6ee7b7', dir: 'to-br' as const },
    { name: 'Ardoise', from: '#334155', to: '#64748b', dir: 'to-b' as const },
    { name: 'Lavande', from: '#6d28d9', to: '#a78bfa', dir: 'to-r' as const },
    { name: 'Sable', from: '#92400e', to: '#d97706', dir: 'to-br' as const },
    { name: 'Glace', from: '#0ea5e9', to: '#e0f2fe', dir: 'to-b' as const },
    { name: 'Minuit', from: '#0f172a', to: '#1e293b', dir: 'to-b' as const },
];

// ==================================
// Presets visuels avec swatches
// ==================================

const PRESET_INFO = [
    { id: 'heroClassic', nom: 'Hero Classique', desc: 'Gradient bleu-violet, texte blanc', colors: ['#1e40af', '#7c3aed', '#ffffff'] },
    { id: 'contentStandard', nom: 'Contenu Standard', desc: 'Fond blanc, texte noir, aéré', colors: ['#ffffff', '#111827', '#f3f4f6'] },
    { id: 'darkElegant', nom: 'Sombre Élégant', desc: 'Fond sombre, serif, texte clair', colors: ['#111827', '#f9fafb', '#374151'] },
    { id: 'cardSoft', nom: 'Carte Douce', desc: 'Bordure fine, ombre, coins ronds', colors: ['#ffffff', '#e5e7eb', '#f9fafb'] },
] as const;

// ==================================
// Types de sections — Icônes et labels
// ==================================

const SECTION_TYPE_INFO: Record<string, { icon: string; label: string; color: string }> = {
    HeroSection: { icon: '🏔', label: 'Hero', color: 'bg-blue-100 text-blue-700' },
    HeroVideoSection: { icon: '🎬', label: 'Hero Vidéo', color: 'bg-indigo-100 text-indigo-700' },
    TexteSection: { icon: '📝', label: 'Texte', color: 'bg-gray-100 text-gray-700' },
    GalerieSection: { icon: '🖼', label: 'Galerie', color: 'bg-pink-100 text-pink-700' },
    GalerieMasonrySection: { icon: '🎨', label: 'Galerie Masonry', color: 'bg-pink-100 text-pink-700' },
    CarouselSection: { icon: '🎠', label: 'Carousel', color: 'bg-purple-100 text-purple-700' },
    VideoSection: { icon: '▶️', label: 'Vidéo', color: 'bg-red-100 text-red-700' },
    TelechargementsSection: { icon: '📥', label: 'Téléchargements', color: 'bg-orange-100 text-orange-700' },
    ActualitesSection: { icon: '📰', label: 'Actualités', color: 'bg-yellow-100 text-yellow-700' },
    HtmlCustomSection: { icon: '💻', label: 'HTML Custom', color: 'bg-slate-100 text-slate-700' },
    TemoignagesSection: { icon: '💬', label: 'Témoignages', color: 'bg-green-100 text-green-700' },
    TemoignageCarouselSection: { icon: '💬', label: 'Carousel Témoignages', color: 'bg-green-100 text-green-700' },
    EquipeSection: { icon: '👥', label: 'Équipe', color: 'bg-teal-100 text-teal-700' },
    PartenairesSection: { icon: '🤝', label: 'Partenaires', color: 'bg-emerald-100 text-emerald-700' },
    CarteInfosSection: { icon: '📋', label: 'Cartes Infos', color: 'bg-amber-100 text-amber-700' },
    ChiffresClesSection: { icon: '🔢', label: 'Chiffres Clés', color: 'bg-cyan-100 text-cyan-700' },
    CompteursAnimesSection: { icon: '📊', label: 'Compteurs Animés', color: 'bg-cyan-100 text-cyan-700' },
    CarteSection: { icon: '🃏', label: 'Carte', color: 'bg-amber-100 text-amber-700' },
    HorairesSection: { icon: '🕐', label: 'Horaires', color: 'bg-violet-100 text-violet-700' },
    FaqSection: { icon: '❓', label: 'FAQ', color: 'bg-lime-100 text-lime-700' },
    TimelineSection: { icon: '📅', label: 'Timeline', color: 'bg-sky-100 text-sky-700' },
    TabsSection: { icon: '📑', label: 'Onglets', color: 'bg-fuchsia-100 text-fuchsia-700' },
    IconeFeaturesSection: { icon: '✨', label: 'Features', color: 'bg-rose-100 text-rose-700' },
    PrixTabSection: { icon: '💰', label: 'Prix', color: 'bg-orange-100 text-orange-700' },
    FormulaireSection: { icon: '📝', label: 'Formulaire', color: 'bg-blue-100 text-blue-700' },
    AppelActionSection: { icon: '📢', label: 'Appel Action', color: 'bg-red-100 text-red-700' },
    NewsletterSection: { icon: '📧', label: 'Newsletter', color: 'bg-purple-100 text-purple-700' },
    SeparateurSection: { icon: '─', label: 'Séparateur', color: 'bg-gray-100 text-gray-500' },
};

// ==================================
// Options animations
// ==================================

const ANIMATION_TYPES: { label: string; value: AnimationType }[] = [
    { label: 'Aucune', value: 'fade-in' },
    { label: 'Fondu', value: 'fade-in' },
    { label: 'Glisser haut', value: 'slide-up' },
    { label: 'Glisser bas', value: 'slide-down' },
    { label: 'Glider gauche', value: 'slide-left' },
    { label: 'Glisser droite', value: 'slide-right' },
    { label: 'Zoom avant', value: 'zoom' },
    { label: 'Zoom arrière', value: 'zoom-out' },
    { label: 'Flip horizontal', value: 'flip-x' },
    { label: 'Flip vertical', value: 'flip-y' },
    { label: 'Rotation', value: 'rotate' },
    { label: 'Flou', value: 'blur' },
];

const EASING_OPTIONS: { label: string; value: AnimationEasing }[] = [
    { label: 'Ease Out', value: 'easeOut' },
    { label: 'Ease In', value: 'easeIn' },
    { label: 'Ease InOut', value: 'easeInOut' },
    { label: 'Linéaire', value: 'linear' },
    { label: 'Ressort', value: 'spring' },
    { label: 'Rebond', value: 'bounce' },
    { label: 'Élastique', value: 'elastic' },
];

const HOVER_OPTIONS: { label: string; value: HoverEffect }[] = [
    { label: 'Aucun', value: 'none' },
    { label: 'Élévation', value: 'lift' },
    { label: 'Lueur', value: 'glow' },
    { label: 'Scale', value: 'scale' },
    { label: 'Inclinaison', value: 'tilt' },
    { label: 'Ombre', value: 'shadow' },
    { label: 'Bordure lueur', value: 'border-glow' },
];

// ==================================
// Rich Text Toolbar — Barre de formatage texte riche
// ==================================

function RichTextToolbar({ value, onChange, fieldKey }: {
    value: string;
    onChange: (v: string) => void;
    fieldKey: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const wrapSelection = useCallback((before: string, after: string) => {
        // Pour les champs texte simples, on ajoute les balises autour de la valeur
        const newValue = value + before + after;
        onChange(newValue);
    }, [value, onChange]);

    const insertTag = useCallback((tag: string) => {
        onChange(value + tag);
    }, [value, onChange]);

    return (
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1 py-0.5">
            {/* Formatage */}
            <button
                type="button"
                onClick={() => wrapSelection('<strong>', '</strong>')}
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-gray-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                title="Gras (HTML: <strong>)"
            >
                B
            </button>
            <button
                type="button"
                onClick={() => wrapSelection('<em>', '</em>')}
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font italic text-gray-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                title="Italique (HTML: <em>)"
            >
                I
            </button>
            <button
                type="button"
                onClick={() => wrapSelection('<u>', '</u>')}
                className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium underline text-gray-600 transition-colors hover:bg-blue-100 hover:text-blue-700"
                title="Souligné (HTML: <u>)"
            >
                U
            </button>
            <div className="mx-0.5 h-3 w-px bg-gray-200" />
            {/* Alignement */}
            <button
                type="button"
                onClick={() => insertTag('<br/>')}
                className="flex h-5 w-5 items-center justify-center rounded text-[9px] text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                title="Saut de ligne (HTML: <br/>)"
            >
                ↵
            </button>
            <button
                type="button"
                onClick={() => wrapSelection('<span style="color: #2563eb">', '</span>')}
                className="flex h-5 w-5 items-center justify-center rounded text-[9px] text-blue-500 transition-colors hover:bg-blue-50"
                title="Texte coloré"
            >
                <span className="h-2 w-2 rounded-full bg-blue-500" />
            </button>
            <button
                type="button"
                onClick={() => wrapSelection('<a href="#">', '</a>')}
                className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-blue-50"
                title="Lien"
            >
                <Link2 className="h-2.5 w-2.5 text-blue-500" />
            </button>
        </div>
    );
}

// ==================================
// Composant accordéon amélioré
// ==================================

function AccordionSection({ title, icon, isOpen, onToggle, children, badge, hasContent, isModified, modificationCount, progress, onReset }: {
    title: string; icon: React.ReactNode; isOpen: boolean; onToggle: () => void;
    children: React.ReactNode; badge?: string; hasContent?: boolean; isModified?: boolean; modificationCount?: number; progress?: number; onReset?: () => void;
}) {
    return (
        <div className={`cms-section-collapsible--enhanced border-b border-gray-100 last:border-b-0 transition-colors duration-150 ${isOpen ? 'bg-blue-50/20' : 'hover:bg-gray-50/50'}`}>
            <button
                onClick={onToggle}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-all duration-150 ${isOpen ? 'bg-blue-50/30' : ''}`}
            >
                <span className={`flex h-5 w-5 items-center justify-center rounded-md transition-all duration-200 ${isOpen ? 'bg-blue-100 text-blue-600 shadow-sm shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                    {icon}
                </span>
                <span className={`flex-1 text-[11px] font-semibold transition-colors duration-150 ${isOpen ? 'text-blue-700' : 'text-gray-700'}`}>{title}</span>
                {/* Indicateur de progression */}
                {progress !== undefined && progress > 0 && (
                    <div className="flex items-center gap-1" title={`${progress}% personnalis\u00e9`}>
                        <div className="h-1 w-8 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: progress >= 80 ? '#10b981' : progress >= 50 ? '#3b82f6' : progress >= 25 ? '#f59e0b' : '#94a3b8',
                                }}
                            />
                        </div>
                        <span className="text-[8px] font-medium tabular-nums" style={{
                            color: progress >= 80 ? '#10b981' : progress >= 50 ? '#3b82f6' : progress >= 25 ? '#f59e0b' : '#94a3b8',
                        }}>
                            {progress}%
                        </span>
                    </div>
                )}
                {/* Indicateur de modification */}
                {isModified && (
                    <span className="relative flex h-2 w-2" title="Modifi\u00e9">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-40" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
                    </span>
                )}
                {modificationCount !== undefined && modificationCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[8px] font-bold text-blue-600">{modificationCount}</span>
                )}
                {hasContent === false && !isModified && (
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-400">D\u00e9faut</span>
                )}
                {badge && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">{badge}</span>
                )}
                {isOpen && isModified && onReset && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onReset(); }}
                        className="rounded p-0.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="Réinitialiser cette section"
                    >
                        <RotateCcw className="h-3 w-3" />
                    </button>
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-250 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="px-3 pb-3">{children}</div>
                </div>
            </div>
        </div>
    );
}

// ==================================
// Composants de contrôle
// ==================================

function SelectField({ label, value, options, onChange }: {
    label: string; value: string; options: readonly { label: string; value: string }[]; onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

function ColorField({ label, value, onChange, showSwatches = false, recentColors = [] }: { label: string; value?: string; onChange: (v: string) => void; showSwatches?: boolean; recentColors?: string[] }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="cms-color-field-enhanced">
                <div className="relative">
                    <input
                        type="color"
                        value={value || '#000000'}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                        className="cms-color-field-enhanced__swatch"
                        style={{ backgroundColor: value || '#000000' }}
                    />
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="cms-color-field-enhanced__hex"
                />
            </div>
            {/* Color swatches rapides */}
            {showSwatches && (
                <div className="mt-1.5">
                    <div className="grid grid-cols-10 gap-0.5">
                        {COLOR_SWATCHES.slice(0, 20).map((color, i) => (
                            <button
                                key={`${color}-${i}`}
                                onClick={() => onChange(color)}
                                className="h-4 w-4 rounded-sm border border-gray-200/50 transition-transform hover:scale-125 hover:z-10"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
            {/* Couleurs récentes */}
            {recentColors.length > 0 && (
                <div className="mt-1">
                    <div className="flex items-center gap-0.5">
                        <span className="text-[8px] text-gray-400 mr-0.5">Récentes</span>
                        {recentColors.slice(0, 6).map((color, i) => (
                            <button
                                key={`recent-${color}-${i}`}
                                onClick={() => onChange(color)}
                                className="h-3.5 w-3.5 rounded-sm border border-gray-200/50 transition-transform hover:scale-125 hover:z-10"
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
        </div>
    );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
        </div>
    );
}

function SliderField({ label, value, min, max, step, onChange, unit }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; unit?: string;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
                <span className="text-[10px] font-mono text-gray-400">{value}{unit || ''}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
            />
        </div>
    );
}

// ==================================
// Preview en miniature amélioré
// ==================================

function StylePreview({ config }: { config: SectionStyleConfig }) {
    const previewStyle = useMemo(() => {
        const css = mergeSectionStyles(config);
        return { ...css, transform: 'scale(1)', minHeight: '60px' };
    }, [config]);

    const fontWeight = config.typography?.fontWeight
        ? { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 }[config.typography.fontWeight]
        : undefined;

    const hasAnimations = config.animations?.type && config.animations.type !== 'fade-in';
    const hasTransform = config.transform && (config.transform.opacity !== undefined && config.transform.opacity < 1 || config.transform.blur || config.transform.rotate);
    const hasBorder = config.border && (config.border.width !== 'none' || config.border.radius !== 'none');
    const hasShadow = config.shadow && config.shadow.type !== 'none';

    // Compter les propriétés actives
    const activeProps = useMemo(() => {
        let count = 0;
        if (config.typography && (config.typography.color || config.typography.fontFamily !== 'sans')) count++;
        if (config.background && (config.background.type !== 'color' || config.background.color !== '#ffffff')) count++;
        if (config.border && config.border.width !== 'none') count++;
        if (config.shadow && config.shadow.type !== 'none') count++;
        if (config.button) count++;
        if (config.animations && config.animations.type !== 'fade-in') count++;
        return count;
    }, [config]);

    return (
        <div className="mx-3 mb-3 rounded-xl border border-gray-200/80 bg-gradient-to-br from-gray-50/80 to-white p-2.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Aperçu live</span>
                <div className="flex items-center gap-1">
                    {activeProps > 0 && (
                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[8px] font-medium text-gray-500">
                            {activeProps} propriét{activeProps > 1 ? 'és' : 'é'}
                        </span>
                    )}
                    {hasAnimations && (
                        <span className="flex items-center gap-0.5 rounded-full bg-purple-100 px-1.5 py-0.5 text-[8px] font-semibold text-purple-600">
                            <Zap className="h-2 w-2" /> Animé
                        </span>
                    )}
                    {hasTransform && (
                        <span className="flex items-center gap-0.5 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[8px] font-semibold text-cyan-600">
                            <Droplets className="h-2 w-2" /> Effets
                        </span>
                    )}
                </div>
            </div>
            <div
                className="rounded-lg p-4 text-center transition-all duration-300 border border-gray-100/50"
                style={previewStyle}
            >
                <p style={{ fontWeight }} className="text-sm">
                    Texte d'exemple
                </p>
                {config.button && (
                    <button className={`mt-2 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        config.button.variant === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : config.button.variant === 'secondary' ? 'bg-gray-200 text-gray-700' : config.button.variant === 'outline' ? 'border border-blue-500 text-blue-500' : 'text-blue-500'
                    }`}>
                        {config.button.texte || 'Bouton'}
                    </button>
                )}
            </div>
            {/* Résumé des propriétés actives */}
            <div className="mt-2 flex flex-wrap gap-1">
                {hasBorder && (
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[7px] font-medium text-gray-500">Bordure</span>
                )}
                {hasShadow && (
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[7px] font-medium text-gray-500">Ombre</span>
                )}
                {config.background?.type === 'gradient' && (
                    <span className="rounded bg-blue-50 px-1 py-0.5 text-[7px] font-medium text-blue-500">Dégradé</span>
                )}
                {config.background?.type === 'image' && (
                    <span className="rounded bg-pink-50 px-1 py-0.5 text-[7px] font-medium text-pink-500">Image</span>
                )}
                {config.typography?.color && config.typography.color !== '#000000' && (
                    <span className="flex items-center gap-0.5 rounded bg-gray-100 px-1 py-0.5 text-[7px] font-medium text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full border border-gray-200" style={{ backgroundColor: config.typography.color }} />
                    Couleur
                    </span>
                )}
            </div>
        </div>
    );
}

// ==================================
// Box Model visuel (espacement)
// ==================================

function BoxModelVisual({ spacing, onChange }: { spacing: SpacingStyle; onChange: (p: Partial<SpacingStyle>) => void }) {
    const [linkPadding, setLinkPadding] = useState(false);
    const [linkMargin, setLinkMargin] = useState(false);

    return (
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
                <input
                    className="cms-box-value cms-box-value--top"
                    value={spacing.marginTop || '0'}
                    onChange={e => {
                        const v = e.target.value;
                        onChange(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginTop: v });
                    }}
                    placeholder="0"
                />
                <input
                    className="cms-box-value cms-box-value--bottom"
                    value={spacing.marginBottom || '0'}
                    onChange={e => {
                        const v = e.target.value;
                        onChange(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginBottom: v });
                    }}
                    placeholder="0"
                />
                <input
                    className="cms-box-value cms-box-value--left"
                    value={spacing.marginLeft || '0'}
                    onChange={e => {
                        const v = e.target.value;
                        onChange(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginLeft: v });
                    }}
                    placeholder="0"
                />
                <input
                    className="cms-box-value cms-box-value--right"
                    value={spacing.marginRight || '0'}
                    onChange={e => {
                        const v = e.target.value;
                        onChange(linkMargin ? { marginTop: v, marginBottom: v, marginLeft: v, marginRight: v } : { marginRight: v });
                    }}
                    placeholder="0"
                />
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
                        <input
                            className="cms-box-value cms-box-value--top"
                            value={spacing.paddingTop || '0'}
                            onChange={e => {
                                const v = e.target.value;
                                onChange(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingTop: v });
                            }}
                            placeholder="0"
                        />
                        <input
                            className="cms-box-value cms-box-value--bottom"
                            value={spacing.paddingBottom || '0'}
                            onChange={e => {
                                const v = e.target.value;
                                onChange(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingBottom: v });
                            }}
                            placeholder="0"
                        />
                        <input
                            className="cms-box-value cms-box-value--left"
                            value={spacing.paddingLeft || '0'}
                            onChange={e => {
                                const v = e.target.value;
                                onChange(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingLeft: v });
                            }}
                            placeholder="0"
                        />
                        <input
                            className="cms-box-value cms-box-value--right"
                            value={spacing.paddingRight || '0'}
                            onChange={e => {
                                const v = e.target.value;
                                onChange(linkPadding ? { paddingTop: v, paddingBottom: v, paddingLeft: v, paddingRight: v } : { paddingRight: v });
                            }}
                            placeholder="0"
                        />
                        {/* Content */}
                        <div className="cms-box-layer cms-box-layer--content">
                            <span style={{ fontSize: 9, color: '#94a3b8' }}>Section</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Gap control */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, width: '100%' }}>
                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 500 }}>gap</span>
                <input
                    className="cms-box-value"
                    style={{ flex: 1, position: 'relative', transform: 'none' }}
                    value={spacing.gap || '0'}
                    onChange={e => onChange({ gap: e.target.value })}
                    placeholder="1rem"
                />
            </div>
        </div>
    );
}

// ==================================
// Quick-actions contextuels par type de composant
// ==================================

const QUICK_ACTIONS: Record<string, { label: string; icon: string; action: string }[]> = {
    HeroSection: [
        { label: 'Centrer le texte', icon: '↔', action: 'centerText' },
        { label: 'Fond dégradé', icon: '🌈', action: 'gradientBg' },
        { label: 'Texte blanc', icon: '⬜', action: 'whiteText' },
    ],
    TexteSection: [
        { label: 'Justifier', icon: '⇔', action: 'justifyText' },
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
        { label: 'Serif', icon: '🅣', action: 'serifFont' },
    ],
    AppelActionSection: [
        { label: 'Fond contrasté', icon: '🎨', action: 'contrastBg' },
        { label: 'Centrer', icon: '↔', action: 'centerText' },
        { label: 'Bouton arrondi', icon: '⬛', action: 'roundButton' },
    ],
    GalerieSection: [
        { label: 'Fond sombre', icon: '🌑', action: 'darkBg' },
        { label: 'Ombre douce', icon: '💫', action: 'softShadow' },
        { label: 'Coins arrondis', icon: '⬜', action: 'roundCorners' },
    ],
    GalerieMasonrySection: [
        { label: 'Fond sombre', icon: '🌑', action: 'darkBg' },
        { label: 'Ombre douce', icon: '💫', action: 'softShadow' },
    ],
    FaqSection: [
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
        { label: 'Bordure fine', icon: '▢', action: 'thinBorder' },
    ],
    TemoignagesSection: [
        { label: 'Fond doux', icon: '☁', action: 'softBg' },
        { label: 'Ombre carte', icon: '💫', action: 'cardShadow' },
    ],
    TemoignageCarouselSection: [
        { label: 'Fond doux', icon: '☁', action: 'softBg' },
        { label: 'Ombre carte', icon: '💫', action: 'cardShadow' },
    ],
    EquipeSection: [
        { label: 'Centrer', icon: '↔', action: 'centerText' },
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
    ],
    PrixTabSection: [
        { label: 'Fond dégradé', icon: '🌈', action: 'gradientBg' },
        { label: 'Ombre carte', icon: '💫', action: 'cardShadow' },
    ],
    CarouselSection: [
        { label: 'Fond sombre', icon: '🌑', action: 'darkBg' },
        { label: 'Texte blanc', icon: '⬜', action: 'whiteText' },
    ],
    TimelineSection: [
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
        { label: 'Bordure gauche', icon: '▏', action: 'leftBorder' },
    ],
    CompteursAnimesSection: [
        { label: 'Fond primaire', icon: '🎨', action: 'primaryBg' },
        { label: 'Texte blanc', icon: '⬜', action: 'whiteText' },
    ],
    IconeFeaturesSection: [
        { label: 'Centrer', icon: '↔', action: 'centerText' },
        { label: 'Fond blanc', icon: '☀', action: 'lightBg' },
    ],
    FormulaireSection: [
        { label: 'Fond doux', icon: '☁', action: 'softBg' },
        { label: 'Bordure fine', icon: '▢', action: 'thinBorder' },
        { label: 'Centrer', icon: '↔', action: 'centerText' },
    ],
    NewsletterSection: [
        { label: 'Fond dégradé', icon: '🌈', action: 'gradientBg' },
        { label: 'Texte blanc', icon: '⬜', action: 'whiteText' },
        { label: 'Centrer', icon: '↔', action: 'centerText' },
    ],
    SeparateurSection: [
        { label: 'Fond contrasté', icon: '🎨', action: 'contrastBg' },
        { label: 'Bordure fine', icon: '▢', action: 'thinBorder' },
    ],
    CarteSection: [
        { label: 'Ombre carte', icon: '💫', action: 'cardShadow' },
        { label: 'Coins arrondis', icon: '⬜', action: 'roundCorners' },
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
    ],
    HorairesSection: [
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
        { label: 'Bordure fine', icon: '▢', action: 'thinBorder' },
    ],
    ActualitesSection: [
        { label: 'Fond blanc', icon: '☀', action: 'lightBg' },
        { label: 'Ombre douce', icon: '💫', action: 'softShadow' },
        { label: 'Centrer', icon: '↔', action: 'centerText' },
    ],
    TelechargementsSection: [
        { label: 'Fond clair', icon: '☀', action: 'lightBg' },
        { label: 'Ombre douce', icon: '💫', action: 'softShadow' },
    ],
    PartenairesSection: [
        { label: 'Fond blanc', icon: '☀', action: 'lightBg' },
        { label: 'Centrer', icon: '↔', action: 'centerText' },
        { label: 'Ombre douce', icon: '💫', action: 'softShadow' },
    ],
};

// ==================================
// Empty state
// ==================================

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 p-5 shadow-sm border border-blue-100/50">
                <MousePointer className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="mb-1.5 text-sm font-bold text-gray-700">Aucune section sélectionnée</h3>
            <p className="text-[11px] text-gray-400 max-w-[240px] leading-relaxed">
                Cliquez sur une section dans le canvas pour modifier son style, ses couleurs, son arrière-plan et ses animations.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-[260px]">
                {[
                    { icon: <Palette className="h-3 w-3" />, label: 'Couleurs', desc: 'Texte & fonds' },
                    { icon: <Layers className="h-3 w-3" />, label: 'Arrière-plan', desc: 'Dégradés & images' },
                    { icon: <Square className="h-3 w-3" />, label: 'Bordures', desc: 'Coins & contours' },
                    { icon: <Zap className="h-3 w-3" />, label: 'Animations', desc: 'Effets & transitions' },
                ].map(item => (
                    <div key={item.label} className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-2.5 py-2 text-left">
                        <span className="mt-0.5 text-gray-400">{item.icon}</span>
                        <div>
                            <p className="text-[10px] font-semibold text-gray-600">{item.label}</p>
                            <p className="text-[8px] text-gray-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==================================
// Animation Preview avec playback controls
// ==================================

function AnimationPreview({ anim }: { anim: AnimationConfig }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [animKey, setAnimKey] = useState(0);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const playAnimation = useCallback(() => {
        setIsPlaying(true);
        setAnimKey(k => k + 1);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsPlaying(false);
        }, ((anim.duration || 0.5) + (anim.delay || 0)) * 1000 + 500);
    }, [anim]);

    const getAnimationCSS = useCallback((): React.CSSProperties => {
        if (!isPlaying) return {};
        const duration = anim.duration || 0.5;
        const delay = anim.delay || 0;
        const easingMap: Record<string, string> = {
            easeOut: 'ease-out', easeIn: 'ease-in', easeInOut: 'ease-in-out',
            linear: 'linear', spring: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            elastic: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
        };
        const timing = easingMap[anim.easing || 'easeOut'] || 'ease-out';

        const animationMap: Record<string, string> = {
            'fade-in': 'animFadeIn',
            'slide-up': 'animSlideUp',
            'slide-down': 'animSlideDown',
            'slide-left': 'animSlideLeft',
            'slide-right': 'animSlideRight',
            'zoom': 'animZoomIn',
            'zoom-out': 'animZoomOut',
            'flip-x': 'animFlipX',
            'flip-y': 'animFlipY',
            'rotate': 'animRotate',
            'blur': 'animBlur',
        };

        return {
            animation: `${animationMap[anim.type || 'fade-in'] || 'animFadeIn'} ${duration}s ${timing} ${delay}s both`,
        };
    }, [isPlaying, anim]);

    return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
            <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-gray-500 uppercase">Preview animation</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={playAnimation}
                        disabled={isPlaying}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                            isPlaying
                                ? 'bg-blue-100 text-blue-500'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                    >
                        {isPlaying ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                        {isPlaying ? 'En cours...' : 'Jouer'}
                    </button>
                </div>
            </div>
            {/* Zone de preview */}
            <div className="flex h-16 items-center justify-center overflow-hidden rounded-md bg-white">
                <div
                    key={animKey}
                    className="rounded-md bg-blue-500 px-4 py-2 text-xs font-medium text-white"
                    style={getAnimationCSS()}
                >
                    Élément exemple
                </div>
            </div>
            {/* CSS keyframes inline (injectés dans le document) */}
            <style>{`
                @keyframes animFadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes animSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes animSlideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes animSlideLeft { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes animSlideRight { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes animZoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
                @keyframes animZoomOut { from { opacity: 0; transform: scale(1.2); } to { opacity: 1; transform: scale(1); } }
                @keyframes animFlipX { from { opacity: 0; transform: perspective(400px) rotateX(90deg); } to { opacity: 1; transform: perspective(400px) rotateX(0); } }
                @keyframes animFlipY { from { opacity: 0; transform: perspective(400px) rotateY(90deg); } to { opacity: 1; transform: perspective(400px) rotateY(0); } }
                @keyframes animRotate { from { opacity: 0; transform: rotate(-180deg); } to { opacity: 1; transform: rotate(0); } }
                @keyframes animBlur { from { opacity: 0; filter: blur(10px); } to { opacity: 1; filter: blur(0); } }
            `}</style>
        </div>
    );
}

// ==================================
// Mapping des champs éditables par type de section
// ==================================

interface ContentFieldDef {
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'url' | 'code' | 'array' | 'number';
    placeholder?: string;
    icon?: React.ReactNode;
    arrayLabelKey?: string; // Clé pour le label d'affichage dans les arrays
}

const CONTENT_FIELDS_BY_TYPE: Record<string, ContentFieldDef[]> = {
    HeroSection: [
        { key: 'titre', label: 'Titre principal', type: 'text', placeholder: 'Bienvenue...' },
        { key: 'surtitre', label: 'Sous-titre', type: 'text', placeholder: 'Sous-titre du hero' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description du hero...' },
        { key: 'imageUrl', label: 'Image de fond', type: 'url', placeholder: 'https://...' },
        { key: 'boutonLabel', label: 'Texte du bouton', type: 'text', placeholder: 'En savoir plus' },
        { key: 'boutonLien', label: 'Lien du bouton', type: 'url', placeholder: '/page ou https://...' },
    ],
    HeroVideoSection: [
        { key: 'titre', label: 'Titre principal', type: 'text', placeholder: 'Bienvenue...' },
        { key: 'surtitre', label: 'Sous-titre', type: 'text', placeholder: 'Sous-titre du hero' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'videoUrl', label: 'URL vidéo', type: 'url', placeholder: 'https://youtube.com/...' },
        { key: 'boutonLabel', label: 'Texte du bouton', type: 'text', placeholder: 'En savoir plus' },
        { key: 'boutonLien', label: 'Lien du bouton', type: 'url', placeholder: '/page' },
    ],
    TexteSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Titre de la section' },
        { key: 'surtitre', label: 'Sous-titre', type: 'text', placeholder: 'Sous-titre...' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Texte principal...' },
        { key: 'html', label: 'Contenu HTML', type: 'code', placeholder: '<p>HTML personnalisé</p>' },
    ],
    VideoSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Titre de la vidéo' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'youtubeId', label: 'ID YouTube', type: 'text', placeholder: 'dQw4w9WgXcQ' },
        { key: 'videoUrl', label: 'URL vidéo', type: 'url', placeholder: 'https://...' },
        { key: 'poster', label: 'Image poster', type: 'url', placeholder: 'https://...' },
    ],
    GalerieSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Galerie photos' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'images', label: 'Images', type: 'array', arrayLabelKey: 'alt' },
    ],
    GalerieMasonrySection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Galerie masonry' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'images', label: 'Images', type: 'array', arrayLabelKey: 'alt' },
    ],
    CarouselSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Carousel' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'slides', label: 'Slides', type: 'array', arrayLabelKey: 'titre' },
    ],
    FaqSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Questions fréquentes' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'faqs', label: 'Questions/Réponses', type: 'array', arrayLabelKey: 'question' },
    ],
    TemoignagesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Témoignages' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'temoignages', label: 'Témoignages', type: 'array', arrayLabelKey: 'nom' },
    ],
    TemoignageCarouselSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Témoignages' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'temoignages', label: 'Témoignages', type: 'array', arrayLabelKey: 'nom' },
    ],
    EquipeSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Notre équipe' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'membres', label: 'Membres', type: 'array', arrayLabelKey: 'nom' },
    ],
    PartenairesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Nos partenaires' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'partenaires', label: 'Partenaires', type: 'array', arrayLabelKey: 'nom' },
    ],
    TimelineSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Notre histoire' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'items', label: 'Étapes', type: 'array', arrayLabelKey: 'titre' },
    ],
    TabsSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Onglets' },
        { key: 'tabs', label: 'Onglets', type: 'array', arrayLabelKey: 'label' },
    ],
    IconeFeaturesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Nos services' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'features', label: 'Caractéristiques', type: 'array', arrayLabelKey: 'titre' },
    ],
    CompteursAnimesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Nos chiffres' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'items', label: 'Compteurs', type: 'array', arrayLabelKey: 'label' },
    ],
    ChiffresClesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Chiffres clés' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'chiffres', label: 'Chiffres', type: 'array', arrayLabelKey: 'label' },
    ],
    CarteInfosSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Infos pratiques' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'cartes', label: 'Cartes', type: 'array', arrayLabelKey: 'titre' },
    ],
    PrixTabSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Nos formules' },
        { key: 'sousTitre', label: 'Sous-titre', type: 'text', placeholder: 'Choisissez votre formule' },
        { key: 'plans', label: 'Plans tarifaires', type: 'array', arrayLabelKey: 'nom' },
    ],
    TelechargementsSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Téléchargements' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'fichiers', label: 'Fichiers', type: 'array', arrayLabelKey: 'titre' },
    ],
    ActualitesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Actualités' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'actualites', label: 'Actualités', type: 'array', arrayLabelKey: 'titre' },
    ],
    HorairesSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Horaires' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description...' },
        { key: 'horaires', label: 'Horaires', type: 'array', arrayLabelKey: 'jour' },
    ],
    CarteSection: [
        { key: 'adresse', label: 'Adresse', type: 'textarea', placeholder: '123 rue principale, Ville' },
        { key: 'latitude', label: 'Latitude', type: 'number', placeholder: '4.0511' },
        { key: 'longitude', label: 'Longitude', type: 'number', placeholder: '9.7644' },
    ],
    HtmlCustomSection: [
        { key: 'html', label: 'Code HTML', type: 'code', placeholder: '<div>HTML personnalisé</div>' },
    ],
    FormulaireSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Contactez-nous' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Description du formulaire...' },
    ],
    AppelActionSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Rejoignez-nous' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Texte d\'appel à l\'action...' },
        { key: 'boutonLabel', label: 'Texte du bouton', type: 'text', placeholder: 'Commencer' },
        { key: 'boutonLien', label: 'Lien du bouton', type: 'url', placeholder: '/contact' },
    ],
    NewsletterSection: [
        { key: 'titre', label: 'Titre', type: 'text', placeholder: 'Restez informé' },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Inscrivez-vous...' },
    ],
};

// Icônes par type de champ array
const ARRAY_ICONS: Record<string, React.ReactNode> = {
    images: <Image className="h-3 w-3" />,
    faqs: <MessageSquare className="h-3 w-3" />,
    temoignages: <Star className="h-3 w-3" />,
    membres: <Users className="h-3 w-3" />,
    partenaires: <Globe className="h-3 w-3" />,
    slides: <Layers className="h-3 w-3" />,
    items: <ListOrdered className="h-3 w-3" />,
    features: <Sparkles className="h-3 w-3" />,
    chiffres: <CreditCard className="h-3 w-3" />,
    cartes: <FileText className="h-3 w-3" />,
    plans: <CreditCard className="h-3 w-3" />,
    fichiers: <Download className="h-3 w-3" />,
    actualites: <FileText className="h-3 w-3" />,
    horaires: <Clock className="h-3 w-3" />,
    tabs: <ListChecks className="h-3 w-3" />,
};

// ==================================
// Array Fields Editor — Expansion + édition inline des éléments
// ==================================

function ArrayFieldsEditor({ arrayFields, sectionProps, onUpdateField }: {
    arrayFields: ContentFieldDef[];
    sectionProps: Record<string, any>;
    onUpdateField: (key: string, value: any) => void;
}) {
    const [expandedArrays, setExpandedArrays] = useState<Set<string>>(new Set());

    const toggleArray = useCallback((key: string) => {
        setExpandedArrays(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    }, []);

    const updateArrayItem = useCallback((arrayKey: string, index: number, fieldKey: string, value: string) => {
        const arr = [...(sectionProps[arrayKey] || [])];
        if (arr[index]) {
            arr[index] = { ...arr[index], [fieldKey]: value };
            onUpdateField(arrayKey, arr);
        }
    }, [sectionProps, onUpdateField]);

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <ListChecks className="h-3 w-3 text-gray-400" />
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Éléments</span>
            </div>
            {arrayFields.map(field => {
                const arr = sectionProps[field.key];
                const count = Array.isArray(arr) ? arr.length : 0;
                const icon = ARRAY_ICONS[field.key] || <ListChecks className="h-3 w-3" />;
                const labelKey = field.arrayLabelKey;
                const isExpanded = expandedArrays.has(field.key);

                return (
                    <div key={field.key} className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                        {/* Header expandable */}
                        <button
                            onClick={() => toggleArray(field.key)}
                            className="flex w-full items-center gap-2 px-2.5 py-2 transition-colors hover:bg-gray-100"
                        >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white border border-gray-200 text-gray-500">
                                {icon}
                            </span>
                            <div className="min-w-0 flex-1 text-left">
                                <p className="text-[11px] font-medium text-gray-700 truncate">{field.label}</p>
                                <p className="text-[9px] text-gray-400">
                                    {count} élément{count !== 1 ? 's' : ''}
                                    {count > 0 && labelKey && arr[0]?.[labelKey] && (
                                        <span className="ml-1">· "{arr[0][labelKey]}"{count > 1 ? ` +${count - 1}` : ''}</span>
                                    )}
                                </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                                {count}
                            </span>
                            <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded list */}
                        {isExpanded && count > 0 && (
                            <div className="border-t border-gray-200 bg-white">
                                <div className="max-h-48 overflow-y-auto cms-panel-scroll">
                                    {arr.map((item: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-1.5 border-b border-gray-100 last:border-b-0 px-2 py-1.5">
                                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[8px] font-bold text-gray-400 bg-gray-100">
                                                {idx + 1}
                                            </span>
                                            {labelKey && item[labelKey] !== undefined ? (
                                                <input
                                                    type="text"
                                                    value={item[labelKey] || ''}
                                                    onChange={(e) => updateArrayItem(field.key, idx, labelKey, e.target.value)}
                                                    className="flex-1 min-w-0 rounded border border-gray-200 px-1.5 py-0.5 text-[10px] text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-0.5 focus:ring-blue-400 transition-colors"
                                                    placeholder={`${labelKey}...`}
                                                />
                                            ) : (
                                                <span className="flex-1 min-w-0 text-[10px] text-gray-500 truncate">
                                                    {typeof item === 'string' ? item : `Élément ${idx + 1}`}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
                                    <p className="text-[8px] text-gray-400 text-center">
                                        Édition rapide — {labelKey || 'champ principal'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ==================================
// Content Editor contextuel par type de section
// ==================================

function ContentEditor({ componentType, sectionProps, onSectionPropsChange }: {
    componentType?: string;
    sectionProps?: Record<string, any>;
    onSectionPropsChange?: (props: Record<string, any>) => void;
}) {
    if (!sectionProps || !onSectionPropsChange) {
        return (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
                <Settings2 className="h-5 w-5 text-gray-300" />
                <p className="text-[10px] text-gray-400">Sélectionnez une section pour éditer son contenu</p>
            </div>
        );
    }

    const fields = componentType ? CONTENT_FIELDS_BY_TYPE[componentType] : undefined;

    // Fallback : détecter les champs éditables depuis les props
    const detectedFields: ContentFieldDef[] = fields || (() => {
        const result: ContentFieldDef[] = [];
        for (const [key, value] of Object.entries(sectionProps)) {
            if (key === 'id' || key === 'styleConfig' || key === 'visible') continue;
            if (Array.isArray(value)) {
                result.push({ key, label: key, type: 'array' });
            } else if (typeof value === 'string') {
                if (key.toLowerCase().includes('url') || key.toLowerCase().includes('lien') || key.toLowerCase().includes('link')) {
                    result.push({ key, label: key, type: 'url' });
                } else if (key === 'html' || key === 'code' || key === 'contenu') {
                    result.push({ key, label: key, type: 'code' });
                } else if (value.length > 100 || key === 'description' || key === 'texte') {
                    result.push({ key, label: key, type: 'textarea' });
                } else {
                    result.push({ key, label: key, type: 'text' });
                }
            } else if (typeof value === 'number') {
                result.push({ key, label: key, type: 'number' });
            }
        }
        return result;
    })();

    if (detectedFields.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
                <FileText className="h-5 w-5 text-gray-300" />
                <p className="text-[10px] text-gray-400">Aucun champ de contenu éditable pour cette section.</p>
                <p className="text-[9px] text-gray-300">Modifiez le contenu directement dans le canvas.</p>
            </div>
        );
    }

    const updateField = (key: string, value: any) => {
        onSectionPropsChange({ ...sectionProps, [key]: value });
    };

    // Séparer les champs scalaires des arrays
    const scalarFields = detectedFields.filter(f => f.type !== 'array');
    const arrayFields = detectedFields.filter(f => f.type === 'array');

    return (
        <div className="space-y-3">
            {/* Champs scalaires */}
            {scalarFields.length > 0 && (
                <div className="space-y-2">
                    {scalarFields.map(field => {
                        const value = sectionProps[field.key];
                        if (value === undefined && field.type !== 'text') return null;

                        return (
                            <div key={field.key} className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                    {field.label}
                                </label>

                                {field.type === 'text' && (
                                    <input
                                        type="text"
                                        value={value || ''}
                                        onChange={(e) => updateField(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                    />
                                )}

                                {field.type === 'textarea' && (
                                    <div className="space-y-1">
                                        <RichTextToolbar
                                            value={value || ''}
                                            onChange={(v) => updateField(field.key, v)}
                                            fieldKey={field.key}
                                        />
                                        <textarea
                                            value={value || ''}
                                            onChange={(e) => updateField(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={3}
                                            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none transition-colors"
                                        />
                                    </div>
                                )}

                                {field.type === 'url' && (
                                    <div className="relative">
                                        <Link2 className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={value || ''}
                                            onChange={(e) => updateField(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full rounded-md border border-gray-200 py-1.5 pl-7 pr-2 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                        />
                                    </div>
                                )}

                                {field.type === 'number' && (
                                    <input
                                        type="number"
                                        value={value ?? ''}
                                        onChange={(e) => updateField(field.key, e.target.value ? parseFloat(e.target.value) : '')}
                                        placeholder={field.placeholder}
                                        step="any"
                                        className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                                    />
                                )}

                                {field.type === 'code' && (
                                    <div className="relative">
                                        <Code className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                                        <textarea
                                            value={value || ''}
                                            onChange={(e) => updateField(field.key, e.target.value)}
                                            placeholder={field.placeholder}
                                            rows={4}
                                            className="w-full rounded-md border border-gray-200 bg-gray-900 py-1.5 pl-7 pr-2 text-xs font-mono text-green-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none transition-colors"
                                            spellCheck={false}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Champs array (compteurs d'items + expansion) */}
            {arrayFields.length > 0 && (
                <ArrayFieldsEditor
                    arrayFields={arrayFields}
                    sectionProps={sectionProps}
                    onUpdateField={updateField}
                />
            )}
        </div>
    );
}

// ==================================
// Composant principal
// ==================================

export function StyleEditorPanel({ config: rawConfig, onChange, onApplyGlobal, hasSelection = true, componentType, sectionProps, onSectionPropsChange }: StyleEditorPanelProps) {
    const config = rawConfig || {} as SectionStyleConfig;
    const [openSections, setOpenSections] = useState<Set<SectionId>>(new Set(['contenu', 'typography', 'background']));
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
    const [sectionFilter, setSectionFilter] = useState('');
    const styleClipboard = useStyleClipboard();
    const [styleCopied, setStyleCopied] = useState(false);
    const [allExpanded, setAllExpanded] = useState(false);
    const [recentColors, setRecentColors] = useState<string[]>([]);

    // Ajouter une couleur aux récentes
    const addRecentColor = useCallback((color: string) => {
        if (!color || recentColors.includes(color)) return;
        setRecentColors(prev => [color, ...prev.slice(0, 7)]);
    }, [recentColors]);

    // Quick-actions contextuels pour le type de composant sélectionné
    const quickActions = componentType ? QUICK_ACTIONS[componentType] : undefined;

    // Appliquer un quick-action
    const applyQuickAction = useCallback((action: string) => {
        switch (action) {
            case 'centerText':
                onChange({ ...config, typography: { ...config.typography || DEFAULT_TYPO, textAlign: 'center' } });
                break;
            case 'justifyText':
                onChange({ ...config, typography: { ...config.typography || DEFAULT_TYPO, textAlign: 'justify' } });
                break;
            case 'gradientBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'gradient', gradientFrom: '#1e40af', gradientTo: '#7c3aed', gradientDirection: 'to-br' } });
                break;
            case 'whiteText':
                onChange({ ...config, typography: { ...config.typography || DEFAULT_TYPO, color: '#ffffff' } });
                break;
            case 'lightBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'color', color: '#f9fafb' } });
                break;
            case 'darkBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'color', color: '#111827' } });
                break;
            case 'contrastBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'gradient', gradientFrom: '#0f172a', gradientTo: '#1e293b', gradientDirection: 'to-b' } });
                break;
            case 'softBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'color', color: '#f1f5f9' } });
                break;
            case 'primaryBg':
                onChange({ ...config, background: { ...config.background || DEFAULT_BG, type: 'color', color: '#2563eb' } });
                break;
            case 'softShadow':
                onChange({ ...config, shadow: { type: 'md' } });
                break;
            case 'cardShadow':
                onChange({ ...config, shadow: { type: 'lg', color: 'rgba(0,0,0,0.1)' } });
                break;
            case 'roundCorners':
                onChange({ ...config, border: { ...config.border || DEFAULT_BORDER, radius: 'xl' } });
                break;
            case 'thinBorder':
                onChange({ ...config, border: { width: 'thin', color: '#e5e7eb', style: 'solid', radius: 'lg' } });
                break;
            case 'leftBorder':
                onChange({ ...config, border: { width: 'medium', color: '#3b82f6', style: 'solid', radius: 'none' } });
                break;
            case 'roundButton':
                onChange({ ...config, button: { ...config.button || DEFAULT_BUTTON, borderRadius: 'full' } });
                break;
            case 'serifFont':
                onChange({ ...config, typography: { ...config.typography || DEFAULT_TYPO, fontFamily: 'serif' } });
                break;
            case 'resetFilters':
                onChange({ ...config, transform: { ...config.transform || DEFAULT_TRANSFORM, blur: undefined, brightness: 1, contrast: 1, saturate: 1, hueRotate: undefined, grayscale: undefined, sepia: undefined, invert: undefined } });
                break;
        }
        toast.success('Style appliqué');
    }, [config, onChange]);

    const toggleSection = useCallback((section: SectionId) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section); else next.add(section);
            return next;
        });
    }, []);

    // Update helpers
    const updateTypo = useCallback((partial: Partial<TypographyStyle>) => {
        onChange({ ...config, typography: { ...config.typography || DEFAULT_TYPO, ...partial } });
    }, [config, onChange]);

    const updateBg = useCallback((partial: Partial<BackgroundStyle>) => {
        onChange({ ...config, background: { ...config.background || DEFAULT_BG, ...partial } });
    }, [config, onChange]);

    const updateSpacing = useCallback((partial: Partial<SpacingStyle>) => {
        onChange({ ...config, spacing: { ...config.spacing || DEFAULT_SPACING, ...partial } });
    }, [config, onChange]);

    const updateBorder = useCallback((partial: Partial<BorderStyle>) => {
        onChange({ ...config, border: { ...config.border || DEFAULT_BORDER, ...partial } });
    }, [config, onChange]);

    const updateShadow = useCallback((partial: Partial<ShadowStyle>) => {
        onChange({ ...config, shadow: { ...config.shadow || DEFAULT_SHADOW, ...partial } });
    }, [config, onChange]);

    const updateButton = useCallback((partial: Partial<ButtonStyle>) => {
        onChange({ ...config, button: { ...config.button || DEFAULT_BUTTON, ...partial } });
    }, [config, onChange]);

    const updateAnim = useCallback((partial: Partial<AnimationConfig>) => {
        onChange({ ...config, animations: { ...config.animations || DEFAULT_ANIM, ...partial } });
    }, [config, onChange]);

    const updateTransform = useCallback((partial: Partial<TransformStyle>) => {
        onChange({ ...config, transform: { ...config.transform || DEFAULT_TRANSFORM, ...partial } });
    }, [config, onChange]);

    // Preset
    const appliquerPreset = useCallback((presetId: string) => {
        const preset = STYLE_PRESETS[presetId as keyof typeof STYLE_PRESETS];
        if (preset) onChange({ ...config, ...preset });
    }, [config, onChange]);

    // Reset
    const reinitialiser = useCallback(() => {
        onChange({
            typography: DEFAULT_TYPO, background: DEFAULT_BG, spacing: DEFAULT_SPACING,
            border: DEFAULT_BORDER, shadow: DEFAULT_SHADOW, button: config.button,
            animations: DEFAULT_ANIM, transform: DEFAULT_TRANSFORM,
        });
    }, [config, onChange]);

    // Copy CSS
    const copierCSS = useCallback(() => {
        const css = mergeSectionStyles(config);
        const cssText = Object.entries(css).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join('\n');
        navigator.clipboard.writeText(cssText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [config]);

    // Copy/Paste styles entre sections
    const copyStyleToClipboard = useCallback(() => {
        styleClipboard.copy(config);
        setStyleCopied(true);
        setTimeout(() => setStyleCopied(false), 2000);
        toast.success('Style copi\u00e9 dans le presse-papiers');
    }, [config, styleClipboard]);

    const pasteStyleFromClipboard = useCallback(() => {
        const pasted = styleClipboard.paste();
        if (pasted) {
            onChange(pasted);
            toast.success('Style coll\u00e9 depuis le presse-papiers');
        } else {
            toast.info('Aucun style dans le presse-papiers');
        }
    }, [styleClipboard, onChange]);

    const typo = config.typography || DEFAULT_TYPO;
    const bg = config.background || DEFAULT_BG;
    const spacing = config.spacing || DEFAULT_SPACING;
    const border = config.border || DEFAULT_BORDER;
    const shadow = config.shadow || DEFAULT_SHADOW;
    const button = config.button || DEFAULT_BUTTON;
    const anim = config.animations || DEFAULT_ANIM;
    const transform = config.transform || DEFAULT_TRANSFORM;

    // Calcul des modifications par section (non-défaut)
    const typoModified = useMemo(() => {
        const t = config.typography;
        if (!t) return false;
        return t.fontFamily !== DEFAULT_TYPO.fontFamily || t.fontWeight !== DEFAULT_TYPO.fontWeight || t.fontSize !== DEFAULT_TYPO.fontSize || t.lineHeight !== DEFAULT_TYPO.lineHeight || t.letterSpacing !== DEFAULT_TYPO.letterSpacing || t.textAlign !== DEFAULT_TYPO.textAlign || t.textTransform !== DEFAULT_TYPO.textTransform || !!t.color;
    }, [config.typography]);

    const bgModified = useMemo(() => {
        const b = config.background;
        if (!b) return false;
        return b.type !== 'color' || b.color !== '#ffffff';
    }, [config.background]);

    const spacingModified = useMemo(() => {
        const s = config.spacing;
        if (!s) return false;
        return s.paddingTop !== DEFAULT_SPACING.paddingTop || s.paddingBottom !== DEFAULT_SPACING.paddingBottom || s.paddingLeft !== DEFAULT_SPACING.paddingLeft || s.paddingRight !== DEFAULT_SPACING.paddingRight || s.marginTop !== DEFAULT_SPACING.marginTop || s.marginBottom !== DEFAULT_SPACING.marginBottom;
    }, [config.spacing]);

    const borderModified = useMemo(() => {
        const b = config.border;
        if (!b) return false;
        return b.width !== 'none' || b.radius !== 'none' || b.color !== DEFAULT_BORDER.color;
    }, [config.border]);

    const shadowModified = useMemo(() => config.shadow?.type !== 'none' && !!config.shadow?.type, [config.shadow]);

    const buttonModified = useMemo(() => {
        const b = config.button;
        if (!b) return false;
        return b.texte !== DEFAULT_BUTTON.texte || b.variant !== DEFAULT_BUTTON.variant || b.size !== DEFAULT_BUTTON.size || b.borderRadius !== DEFAULT_BUTTON.borderRadius || b.fullWidth !== DEFAULT_BUTTON.fullWidth;
    }, [config.button]);

    const animModified = useMemo(() => {
        const a = config.animations;
        if (!a) return false;
        return a.type !== DEFAULT_ANIM.type || a.hover !== DEFAULT_ANIM.hover || a.duration !== DEFAULT_ANIM.duration || a.easing !== DEFAULT_ANIM.easing;
    }, [config.animations]);

    const transformModified = useMemo(() => {
        const t = config.transform;
        if (!t) return false;
        return (t.opacity !== undefined && t.opacity < 1) || !!t.blur || !!t.rotate || !!t.brightness || !!t.contrast;
    }, [config.transform]);

    const dispositionModified = useMemo(() => {
        const t = config.transform;
        if (!t) return false;
        return !!t.overflow || !!t.position || t.display !== undefined;
    }, [config.transform]);

    // Compteur total de sections modifiées
    const totalModified = useMemo(() => {
        let count = 0;
        if (typoModified) count++;
        if (bgModified) count++;
        if (spacingModified) count++;
        if (borderModified) count++;
        if (shadowModified) count++;
        if (buttonModified) count++;
        if (animModified) count++;
        if (transformModified) count++;
        if (dispositionModified) count++;
        return count;
    }, [typoModified, bgModified, spacingModified, borderModified, shadowModified, buttonModified, animModified, transformModified, dispositionModified]);

    // Calcul de progression par section (pourcentage de propriétés personnalisées)
    const typoProgress = useMemo(() => {
        const t = config.typography;
        if (!t) return 0;
        let changed = 0;
        const total = 8; // fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textAlign, textTransform, color
        if (t.fontFamily !== DEFAULT_TYPO.fontFamily) changed++;
        if (t.fontWeight !== DEFAULT_TYPO.fontWeight) changed++;
        if (t.fontSize !== DEFAULT_TYPO.fontSize) changed++;
        if (t.lineHeight !== DEFAULT_TYPO.lineHeight) changed++;
        if (t.letterSpacing !== DEFAULT_TYPO.letterSpacing) changed++;
        if (t.textAlign !== DEFAULT_TYPO.textAlign) changed++;
        if (t.textTransform !== DEFAULT_TYPO.textTransform) changed++;
        if (t.color) changed++;
        return Math.round((changed / total) * 100);
    }, [config.typography]);

    const bgProgress = useMemo(() => {
        const b = config.background;
        if (!b) return 0;
        let changed = 0;
        const total = 4; // type, color/gradient, overlay, imagePosition
        if (b.type !== 'color') changed++;
        if (b.type === 'gradient' && (b.gradientFrom || b.gradientTo)) changed++;
        if (b.type === 'color' && b.color !== '#ffffff') changed++;
        if (b.overlay) changed++;
        if (b.type === 'image' && b.imageUrl) changed++;
        return Math.min(100, Math.round((changed / total) * 100));
    }, [config.background]);

    const borderProgress = useMemo(() => {
        const b = config.border;
        if (!b) return 0;
        let changed = 0;
        const total = 4; // width, color, style, radius
        if (b.width !== 'none') changed++;
        if (b.color && b.color !== DEFAULT_BORDER.color) changed++;
        if (b.style !== 'solid') changed++;
        if (b.radius !== 'none') changed++;
        return Math.round((changed / total) * 100);
    }, [config.border]);

    const shadowProgress = useMemo(() => {
        if (!config.shadow) return 0;
        if (config.shadow.type === 'none') return 0;
        let changed = 0;
        const total = 2; // type, color
        changed++; // type is not 'none'
        if (config.shadow.color) changed++;
        return Math.round((changed / total) * 100);
    }, [config.shadow]);

    const animProgress = useMemo(() => {
        const a = config.animations;
        if (!a) return 0;
        let changed = 0;
        const total = 7; // type, duration, delay, easing, hover, stagger, parallax
        if (a.type !== DEFAULT_ANIM.type) changed++;
        if (a.duration !== DEFAULT_ANIM.duration) changed++;
        if (a.delay !== DEFAULT_ANIM.delay) changed++;
        if (a.easing !== DEFAULT_ANIM.easing) changed++;
        if (a.hover && a.hover !== 'none') changed++;
        if (a.stagger) changed++;
        if (a.parallax) changed++;
        return Math.round((changed / total) * 100);
    }, [config.animations]);

    const transformProgress = useMemo(() => {
        const t = config.transform;
        if (!t) return 0;
        let changed = 0;
        const total = 8; // opacity, blur, brightness, contrast, saturate, hueRotate, rotate, scaleX/Y
        if (t.opacity !== undefined && t.opacity < 1) changed++;
        if (t.blur) changed++;
        if (t.brightness && t.brightness !== 1) changed++;
        if (t.contrast && t.contrast !== 1) changed++;
        if (t.saturate && t.saturate !== 1) changed++;
        if (t.hueRotate) changed++;
        if (t.rotate) changed++;
        if ((t.scaleX && t.scaleX !== 1) || (t.scaleY && t.scaleY !== 1)) changed++;
        return Math.round((changed / total) * 100);
    }, [config.transform]);

    // Progression globale (moyenne de toutes les sections)
    const globalProgress = useMemo(() => {
        const progresses = [typoProgress, bgProgress, borderProgress, shadowProgress, animProgress, transformProgress];
        const nonZero = progresses.filter(p => p > 0);
        if (nonZero.length === 0) return 0;
        return Math.round(nonZero.reduce((a, b) => a + b, 0) / progresses.length);
    }, [typoProgress, bgProgress, borderProgress, shadowProgress, animProgress, transformProgress]);

    // Empty state
    if (!hasSelection) return <EmptyState />;

    // Sections de l'accordéon avec filtrage et indicateurs de modification
    const ALL_SECTIONS: { id: SectionId; title: string; icon: React.ReactNode; badge?: string; hasContent: boolean; isModified?: boolean }[] = [
        { id: 'contenu', title: 'Contenu', icon: <Type className="h-3.5 w-3.5" />, hasContent: !!sectionProps, badge: sectionProps?.titre ? '✓' : undefined, isModified: !!sectionProps?.titre },
        { id: 'typography', title: 'Typographie', icon: <Type className="h-3.5 w-3.5" />, hasContent: !!config.typography, badge: typo.color ? 'Couleur' : undefined, isModified: typoModified },
        { id: 'background', title: 'Arrière-plan', icon: <Layers className="h-3.5 w-3.5" />, hasContent: bg.type !== 'color' || bg.color !== '#ffffff', badge: bg.type === 'gradient' ? 'Dégradé' : bg.type === 'image' ? 'Image' : undefined, isModified: bgModified },
        { id: 'spacing', title: 'Espacement', icon: <Square className="h-3.5 w-3.5" />, hasContent: !!config.spacing, isModified: spacingModified },
        { id: 'border', title: 'Bordure', icon: <Square className="h-3.5 w-3.5" />, hasContent: border.width !== 'none' || border.radius !== 'none', isModified: borderModified },
        { id: 'shadow', title: 'Ombre', icon: <MousePointer className="h-3.5 w-3.5" />, hasContent: shadow.type !== 'none', isModified: shadowModified },
        { id: 'button', title: 'Bouton', icon: <Palette className="h-3.5 w-3.5" />, hasContent: !!config.button, isModified: buttonModified },
        { id: 'animations', title: 'Animations', icon: <Zap className="h-3.5 w-3.5" />, hasContent: anim.type !== 'fade-in' || anim.hover !== 'none', badge: anim.type !== 'fade-in' ? 'Actif' : undefined, isModified: animModified },
        { id: 'transform', title: 'Transform & Effets', icon: <MousePointer className="h-3.5 w-3.5" />, hasContent: (transform.opacity !== undefined && transform.opacity < 1) || !!transform.blur || !!transform.rotate, isModified: transformModified },
        { id: 'disposition', title: 'Disposition', icon: <Layers className="h-3.5 w-3.5" />, hasContent: !!transform.overflow || !!transform.position, isModified: dispositionModified },
    ];

    const filteredSections = sectionFilter
        ? ALL_SECTIONS.filter(s => s.title.toLowerCase().includes(sectionFilter.toLowerCase()))
        : ALL_SECTIONS;

    return (
        <div className="cms-panel-slide-in space-y-0">
            {/* Header avec actions + info contexte */}
            <div className="flex flex-col gap-0">
                {/* Ligne 1: Info section type + titre */}
                <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-1.5">
                    {/* Icône + label du type de section */}
                    {componentType && SECTION_TYPE_INFO[componentType] ? (
                        <>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs ${SECTION_TYPE_INFO[componentType].color}`}>
                                {SECTION_TYPE_INFO[componentType].icon}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-gray-800 truncate">{SECTION_TYPE_INFO[componentType].label}</p>
                                <p className="text-[9px] text-gray-400">Personnalisation visuelle</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                                <Sparkles className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-gray-800">Éditeur de style</p>
                                <p className="text-[9px] text-gray-400">Personnalisation visuelle</p>
                            </div>
                        </>
                    )}
                    {/* Compteur modifications + progression globale */}
                    {totalModified > 0 && (
                        <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {totalModified} modif.
                        </span>
                    )}
                </div>
                {/* Barre de progression globale */}
                {globalProgress > 0 && (
                    <div className="px-3 pb-1.5">
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${globalProgress}%`,
                                        background: globalProgress >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : globalProgress >= 50 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                                    }}
                                />
                            </div>
                            <span className="text-[9px] font-bold tabular-nums" style={{
                                color: globalProgress >= 80 ? '#10b981' : globalProgress >= 50 ? '#3b82f6' : '#f59e0b',
                            }}>
                                {globalProgress}%
                            </span>
                        </div>
                    </div>
                )}
                {/* Ligne 2: Barre d'outils */}
                <div className="flex items-center gap-0.5 border-b border-gray-100 px-2 pb-1.5">
                    {/* Copy/Paste styles */}
                    <button
                        onClick={copyStyleToClipboard}
                        className={`rounded-md p-1.5 transition-all duration-150 ${styleCopied ? 'text-green-500 bg-green-50 shadow-sm shadow-green-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                        title="Copier le style"
                    >
                        {styleCopied ? <Check className="h-3 w-3" /> : <Clipboard className="h-3 w-3" />}
                    </button>
                    <button
                        onClick={pasteStyleFromClipboard}
                        className={`rounded-md p-1.5 transition-all duration-150 ${styleClipboard.hasClipboard ? 'text-blue-500 bg-blue-50 hover:bg-blue-100' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-400'}`}
                        title={styleClipboard.hasClipboard ? 'Coller le style' : 'Aucun style copié'}
                        disabled={!styleClipboard.hasClipboard}
                    >
                        <ClipboardPaste className="h-3 w-3" />
                    </button>
                    <div className="mx-0.5 h-4 w-px bg-gray-200" />
                    {/* Tabs Visual/Code */}
                    <div className="flex rounded-md border border-gray-200 bg-gray-50">
                        <button
                            onClick={() => setActiveTab('visual')}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-l-md transition-all duration-150 ${activeTab === 'visual' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                            Visuel
                        </button>
                        <button
                            onClick={() => setActiveTab('code')}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-r-md transition-all duration-150 ${activeTab === 'code' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}
                        >
                            CSS
                        </button>
                    </div>
                    <div className="mx-0.5 h-4 w-px bg-gray-200" />
                    <button onClick={copierCSS} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Copier le CSS">
                        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                    <button
                        onClick={() => {
                            if (allExpanded) {
                                setOpenSections(new Set(['typography', 'background']));
                                setAllExpanded(false);
                            } else {
                                setOpenSections(new Set(['contenu', 'typography', 'background', 'spacing', 'border', 'shadow', 'button', 'animations', 'transform', 'disposition']));
                                setAllExpanded(true);
                            }
                        }}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title={allExpanded ? 'Tout fermer' : 'Tout ouvrir'}
                    >
                        {allExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                    <button onClick={reinitialiser} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Réinitialiser tout">
                        <RotateCcw className="h-3 w-3" />
                    </button>
                </div>
            </div>

            {/* Preview live */}
            <StylePreview config={config} />

            {/* Mode Code → afficher CSS brut */}
            {activeTab === 'code' && (
                <div className="border-b border-gray-100 px-3 pb-3">
                    <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-[10px] leading-relaxed text-green-400 font-mono">
                        {Object.entries(mergeSectionStyles(config))
                            .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`)
                            .join('\n')}
                    </pre>
                </div>
            )}

            {/* Presets rapides avec swatches */}
            {activeTab === 'visual' && (
                <div className="border-b border-gray-100 px-3 pb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Presets rapides</p>
                        <Wand2 className="h-3 w-3 text-purple-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        {PRESET_INFO.map(p => (
                            <button
                                key={p.id}
                                onClick={() => appliquerPreset(p.id)}
                                className="group rounded-lg border border-gray-200 p-2 text-left transition-all hover:border-blue-300 hover:bg-blue-50 hover:shadow-sm"
                            >
                                <div className="mb-1 flex items-center gap-1">
                                    {p.colors.map((c, i) => (
                                        <div key={i} className="h-3 w-3 rounded-full border border-gray-200" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <p className="text-[10px] font-semibold text-gray-700 group-hover:text-blue-700">{p.nom}</p>
                                <p className="text-[9px] text-gray-400 truncate">{p.desc}</p>
                            </button>
                        ))}
                    </div>
                    {onApplyGlobal && (
                        <button
                            onClick={() => onApplyGlobal(config)}
                            className="mt-2 w-full rounded-lg border border-purple-200 bg-purple-50 px-2 py-1.5 text-[10px] font-medium text-purple-700 transition-colors hover:bg-purple-100"
                        >
                            Appliquer à toutes les sections
                        </button>
                    )}
                </div>
            )}

            {/* Quick-actions contextuels par type de composant */}
            {activeTab === 'visual' && quickActions && quickActions.length > 0 && (
                <div className="border-b border-gray-100 px-3 pb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                            Actions rapides — {componentType?.replace(/Section$/, '') || 'Section'}
                        </p>
                        <Zap className="h-3 w-3 text-amber-400" />
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {quickActions.map(qa => (
                            <button
                                key={qa.action}
                                onClick={() => applyQuickAction(qa.action)}
                                className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-sm"
                            >
                                <span>{qa.icon}</span>
                                <span>{qa.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Sections accordéon */}
            {activeTab === 'visual' && (
                <div>
                    {/* Barre de recherche de sections */}
                    <div className="px-3 py-2 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={sectionFilter}
                                onChange={(e) => setSectionFilter(e.target.value)}
                                placeholder="Filtrer les sections..."
                                className="w-full rounded-md border border-gray-200 bg-gray-50 py-1.5 pl-7 pr-7 text-[11px] text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            />
                            {sectionFilter && (
                                <button onClick={() => setSectionFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                        {sectionFilter && (
                            <p className="mt-1 text-[9px] text-gray-400">{filteredSections.length} section{filteredSections.length !== 1 ? 's' : ''} trouvée{filteredSections.length !== 1 ? 's' : ''}</p>
                        )}
                    </div>

                    {/* Contenu — Édition contextuelle des props de la section */}
                    {filteredSections.some(s => s.id === 'contenu') && (
                    <>
                    <AccordionSection title="Contenu" icon={<Type className="h-3.5 w-3.5" />} isOpen={openSections.has('contenu')} onToggle={() => toggleSection('contenu')} hasContent={!!sectionProps} badge={sectionProps?.titre ? '✓' : undefined} isModified={!!sectionProps?.titre}>
                        <ContentEditor
                            componentType={componentType}
                            sectionProps={sectionProps}
                            onSectionPropsChange={onSectionPropsChange}
                        />
                    </AccordionSection>
                    <div className="cms-section-divider" />
                    </>
                    )}

                    {/* Typographie */}
                    {filteredSections.some(s => s.id === 'typography') && (
                    <AccordionSection title="Typographie" icon={<Type className="h-3.5 w-3.5" />} isOpen={openSections.has('typography')} onToggle={() => toggleSection('typography')} hasContent={!!config.typography} badge={typo.color ? 'Couleur' : undefined} isModified={typoModified} progress={typoProgress} onReset={() => updateTypo(DEFAULT_TYPO)}>
                        <div className="space-y-2">
                            <SelectField label="Police" value={typo.fontFamily} options={[
                                { label: 'Sans-serif', value: 'sans' }, { label: 'Serif', value: 'serif' },
                                { label: 'Mono', value: 'mono' }, { label: 'Display', value: 'display' },
                            ]} onChange={(v) => updateTypo({ fontFamily: v as TypographyStyle['fontFamily'] })} />
                            <SelectField label="Poids" value={typo.fontWeight} options={[
                                { label: 'Normal', value: 'normal' }, { label: 'Medium', value: 'medium' },
                                { label: 'Semi-bold', value: 'semibold' }, { label: 'Bold', value: 'bold' }, { label: 'Extra-bold', value: 'extrabold' },
                            ]} onChange={(v) => updateTypo({ fontWeight: v as TypographyStyle['fontWeight'] })} />
                            <SelectField label="Taille" value={typo.fontSize} options={[
                                { label: 'XS', value: 'xs' }, { label: 'SM', value: 'sm' }, { label: 'Base', value: 'base' }, { label: 'LG', value: 'lg' },
                                { label: 'XL', value: 'xl' }, { label: '2XL', value: '2xl' }, { label: '3XL', value: '3xl' }, { label: '4XL', value: '4xl' }, { label: '5XL', value: '5xl' },
                            ]} onChange={(v) => updateTypo({ fontSize: v as TypographyStyle['fontSize'] })} />
                            <SelectField label="Interligne" value={typo.lineHeight} options={[
                                { label: 'Serré', value: 'tight' }, { label: 'Normal', value: 'normal' },
                                { label: 'Aéré', value: 'relaxed' }, { label: 'Large', value: 'loose' },
                            ]} onChange={(v) => updateTypo({ lineHeight: v as TypographyStyle['lineHeight'] })} />
                            <SelectField label="Espacement lettres" value={typo.letterSpacing} options={[
                                { label: 'Très serré', value: 'tighter' }, { label: 'Serré', value: 'tight' }, { label: 'Normal', value: 'normal' },
                                { label: 'Large', value: 'wide' }, { label: 'Très large', value: 'wider' },
                            ]} onChange={(v) => updateTypo({ letterSpacing: v as TypographyStyle['letterSpacing'] })} />
                            {/* Alignement visuel (boutons) */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Alignement</label>
                                <div className="flex gap-1">
                                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                                        <button
                                            key={align}
                                            onClick={() => updateTypo({ textAlign: align })}
                                            className={`flex-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors ${
                                                typo.textAlign === align
                                                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {align === 'left' ? '⬅' : align === 'center' ? '↔' : align === 'right' ? '➡' : '⇔'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <SelectField label="Transformation" value={typo.textTransform} options={[
                                { label: 'Aucune', value: 'none' }, { label: 'MAJUSCULES', value: 'uppercase' },
                                { label: 'minuscules', value: 'lowercase' }, { label: 'Capitalize', value: 'capitalize' },
                            ]} onChange={(v) => updateTypo({ textTransform: v as TypographyStyle['textTransform'] })} />
                            <ColorField label="Couleur texte" value={typo.color} onChange={(v) => { addRecentColor(v); updateTypo({ color: v }); }} showSwatches recentColors={recentColors} />
                            {/* Live text preview */}
                            <div className="cms-live-text-preview" style={{ color: typo.color || '#111827' }}>
                                <div style={{
                                    fontFamily: typo.fontFamily === 'serif' ? 'Georgia, serif' : typo.fontFamily === 'mono' ? 'ui-monospace, monospace' : 'system-ui, sans-serif',
                                    fontWeight: typo.fontWeight === 'bold' ? 700 : typo.fontWeight === 'semibold' ? 600 : typo.fontWeight === 'medium' ? 500 : typo.fontWeight === 'extrabold' ? 800 : 400,
                                    fontSize: typo.fontSize === 'xs' ? '10px' : typo.fontSize === 'sm' ? '12px' : typo.fontSize === 'lg' ? '16px' : typo.fontSize === 'xl' ? '18px' : typo.fontSize === '2xl' ? '22px' : typo.fontSize === '3xl' ? '28px' : typo.fontSize === '4xl' ? '34px' : typo.fontSize === '5xl' ? '42px' : '14px',
                                    lineHeight: typo.lineHeight === 'tight' ? 1.25 : typo.lineHeight === 'relaxed' ? 1.625 : typo.lineHeight === 'loose' ? 2 : 1.5,
                                    letterSpacing: typo.letterSpacing === 'tighter' ? '-0.05em' : typo.letterSpacing === 'tight' ? '-0.025em' : typo.letterSpacing === 'wide' ? '0.025em' : typo.letterSpacing === 'wider' ? '0.05em' : '0',
                                    textAlign: (typo.textAlign || 'left') as any,
                                    textTransform: typo.textTransform === 'uppercase' ? 'uppercase' : typo.textTransform === 'lowercase' ? 'lowercase' : typo.textTransform === 'capitalize' ? 'capitalize' : 'none',
                                }}>
                                    Aperçu du texte
                                </div>
                            </div>
                        </div>
                    </AccordionSection>
                    )}

                    {/* Arrière-plan */}
                    {filteredSections.some(s => s.id === 'background') && (
                    <AccordionSection title="Arrière-plan" icon={<Layers className="h-3.5 w-3.5" />} isOpen={openSections.has('background')} onToggle={() => toggleSection('background')} hasContent={bg.type !== 'color' || bg.color !== '#ffffff'} badge={bg.type === 'gradient' ? 'Dégradé' : bg.type === 'image' ? 'Image' : undefined} isModified={bgModified} progress={bgProgress} onReset={() => updateBg(DEFAULT_BG)}>
                        <div className="space-y-2">
                            {/* Type selector visuel */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</label>
                                <div className="flex gap-1">
                                    {(['color', 'gradient', 'image'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => updateBg({ type: t })}
                                            className={`flex-1 rounded-md border py-1.5 text-[10px] font-medium transition-colors ${
                                                bg.type === t ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            {t === 'color' ? '🎨' : t === 'gradient' ? '🌈' : '🖼'} {t === 'color' ? 'Couleur' : t === 'gradient' ? 'Dégradé' : 'Image'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {bg.type === 'color' && <ColorField label="Couleur" value={bg.color} onChange={(v) => { addRecentColor(v); updateBg({ color: v }); }} showSwatches recentColors={recentColors} />}

                            {bg.type === 'gradient' && (
                                <>
                                    {/* Presets de gradients */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Presets</label>
                                        <div className="grid grid-cols-4 gap-1">
                                            {GRADIENT_PRESETS.map(g => (
                                                <button
                                                    key={g.name}
                                                    onClick={() => updateBg({ gradientFrom: g.from, gradientTo: g.to, gradientDirection: g.dir })}
                                                    className="group relative h-7 rounded-md border border-gray-200/50 overflow-hidden transition-all hover:scale-105 hover:shadow-md"
                                                    style={{ background: `linear-gradient(${g.dir}, ${g.from}, ${g.to})` }}
                                                    title={g.name}
                                                >
                                                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm">
                                                        {g.name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <ColorField label="De" value={bg.gradientFrom} onChange={(v) => updateBg({ gradientFrom: v })} showSwatches />
                                    <ColorField label="À" value={bg.gradientTo} onChange={(v) => updateBg({ gradientTo: v })} showSwatches />
                                    <SelectField label="Direction" value={bg.gradientDirection || 'to-br'} options={GRADIENT_DIRECTIONS} onChange={(v) => updateBg({ gradientDirection: v as BackgroundStyle['gradientDirection'] })} />
                                    {/* Preview gradient */}
                                    <div className="h-8 w-full rounded-lg border border-gray-200 shadow-inner" style={{
                                        background: `linear-gradient(${bg.gradientDirection || 'to-br'}, ${bg.gradientFrom || '#1e40af'}, ${bg.gradientTo || '#7c3aed'})`,
                                    }} />
                                </>
                            )}

                            {bg.type === 'image' && (
                                <>
                                    <TextField label="URL image" value={bg.imageUrl || ''} onChange={(v) => updateBg({ imageUrl: v })} placeholder="https://..." />
                                    <SelectField label="Position" value={bg.imagePosition} options={[
                                        { label: 'Couvrir', value: 'cover' }, { label: 'Contenir', value: 'contain' },
                                        { label: 'Centrer', value: 'center' }, { label: 'Répéter', value: 'repeat' },
                                    ]} onChange={(v) => updateBg({ imagePosition: v as BackgroundStyle['imagePosition'] })} />
                                </>
                            )}

                            <ToggleField label="Overlay" checked={bg.overlay} onChange={(v) => updateBg({ overlay: v })} />
                            {bg.overlay && (
                                <>
                                    <ColorField label="Couleur overlay" value={bg.overlayColor} onChange={(v) => updateBg({ overlayColor: v })} />
                                    <SliderField label="Opacité" value={bg.overlayOpacity} min={0} max={1} step={0.05} onChange={(v) => updateBg({ overlayOpacity: v })} unit="%" />
                                </>
                            )}
                        </div>
                    </AccordionSection>
                    )}

                    {/* Espacement — Box Model visuel */}
                    {filteredSections.some(s => s.id === 'spacing') && (
                    <AccordionSection title="Espacement" icon={<Square className="h-3.5 w-3.5" />} isOpen={openSections.has('spacing')} onToggle={() => toggleSection('spacing')} hasContent={!!config.spacing} isModified={spacingModified} onReset={() => updateSpacing(DEFAULT_SPACING)}>
                        <BoxModelVisual spacing={spacing} onChange={updateSpacing} />
                    </AccordionSection>
                    )}

                    {/* Bordure */}
                    {filteredSections.some(s => s.id === 'border') && (
                    <AccordionSection title="Bordure" icon={<Square className="h-3.5 w-3.5" />} isOpen={openSections.has('border')} onToggle={() => toggleSection('border')} hasContent={border.width !== 'none' || border.radius !== 'none'} isModified={borderModified} progress={borderProgress} onReset={() => updateBorder(DEFAULT_BORDER)}>
                        <div className="space-y-2">
                            <SelectField label="Épaisseur" value={border.width} options={[
                                { label: 'Aucune', value: 'none' }, { label: 'Fine (1px)', value: 'thin' },
                                { label: 'Moyenne (2px)', value: 'medium' }, { label: 'Épaisse (4px)', value: 'thick' },
                            ]} onChange={(v) => updateBorder({ width: v as BorderStyle['width'] })} />
                            {border.width !== 'none' && (
                                <>
                                    <ColorField label="Couleur" value={border.color} onChange={(v) => { addRecentColor(v); updateBorder({ color: v }); }} showSwatches recentColors={recentColors} />
                                    <SelectField label="Style" value={border.style} options={[
                                        { label: 'Continue', value: 'solid' }, { label: 'Tirets', value: 'dashed' },
                                        { label: 'Points', value: 'dotted' }, { label: 'Double', value: 'double' },
                                    ]} onChange={(v) => updateBorder({ style: v as BorderStyle['style'] })} />
                                </>
                            )}
                            <SelectField label="Rayon coins" value={border.radius} options={[
                                { label: 'Aucun', value: 'none' }, { label: 'SM (4px)', value: 'sm' }, { label: 'MD (6px)', value: 'md' },
                                { label: 'LG (8px)', value: 'lg' }, { label: 'XL (12px)', value: 'xl' }, { label: '2XL (16px)', value: '2xl' }, { label: 'Plein', value: 'full' },
                            ]} onChange={(v) => updateBorder({ radius: v as BorderStyle['radius'] })} />
                            {/* Preview bordure */}
                            <div className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <div
                                    className="h-6 w-20 rounded-lg bg-white"
                                    style={{
                                        border: border.width !== 'none' ? `${border.width === 'thin' ? '1px' : border.width === 'medium' ? '2px' : '4px'} ${border.style} ${border.color || '#e5e7eb'}` : undefined,
                                        borderRadius: border.radius === 'full' ? '9999px' : border.radius === 'none' ? undefined : border.radius === 'sm' ? '4px' : border.radius === 'md' ? '6px' : border.radius === 'lg' ? '8px' : border.radius === 'xl' ? '12px' : '16px',
                                    }}
                                />
                            </div>
                        </div>
                    </AccordionSection>
                    )}

                    {/* Ombre */}
                    {filteredSections.some(s => s.id === 'shadow') && (
                    <AccordionSection title="Ombre" icon={<MousePointer className="h-3.5 w-3.5" />} isOpen={openSections.has('shadow')} onToggle={() => toggleSection('shadow')} hasContent={shadow.type !== 'none'} isModified={shadowModified} progress={shadowProgress} onReset={() => updateShadow(DEFAULT_SHADOW)}>
                        <div className="space-y-2">
                            {/* Shadow presets visuels */}
                            <div className="grid grid-cols-4 gap-1.5">
                                {(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'inner', 'glow'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => updateShadow({ type })}
                                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                                            shadow.type === type ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div
                                            className="h-5 w-8 rounded bg-white"
                                            style={{
                                                boxShadow: type === 'none' ? 'none' : type === 'sm' ? '0 1px 2px rgba(0,0,0,0.05)' : type === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : type === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : type === 'xl' ? '0 20px 25px -5px rgba(0,0,0,0.1)' : type === '2xl' ? '0 25px 50px -12px rgba(0,0,0,0.25)' : type === 'inner' ? 'inset 0 2px 4px rgba(0,0,0,0.06)' : '0 0 20px rgba(59,130,246,0.3)',
                                            }}
                                        />
                                        <span className="text-[8px] text-gray-500">{type}</span>
                                    </button>
                                ))}
                            </div>
                            {shadow.type !== 'none' && (
                                <ColorField label="Couleur ombre" value={shadow.color} onChange={(v) => { addRecentColor(v); updateShadow({ color: v }); }} recentColors={recentColors} />
                            )}
                        </div>
                    </AccordionSection>
                    )}

                    {/* Bouton */}
                    {filteredSections.some(s => s.id === 'button') && (
                    <AccordionSection title="Bouton" icon={<Palette className="h-3.5 w-3.5" />} isOpen={openSections.has('button')} onToggle={() => toggleSection('button')} hasContent={!!config.button} isModified={buttonModified} onReset={() => updateButton(DEFAULT_BUTTON)}>
                        <div className="space-y-2">
                            <TextField label="Texte" value={button.texte} onChange={(v) => updateButton({ texte: v })} placeholder="Cliquez ici" />
                            <TextField label="Lien" value={button.lien || ''} onChange={(v) => updateButton({ lien: v })} placeholder="/page ou https://..." />
                            <SelectField label="Variant" value={button.variant} options={BUTTON_VARIANTS} onChange={(v) => updateButton({ variant: v as ButtonStyle['variant'] })} />
                            <SelectField label="Taille" value={button.size} options={BUTTON_SIZES} onChange={(v) => updateButton({ size: v as ButtonStyle['size'] })} />
                            <SelectField label="Rayon coins" value={button.borderRadius} options={[
                                { label: 'Aucun', value: 'none' }, { label: 'SM', value: 'sm' }, { label: 'MD', value: 'md' },
                                { label: 'LG', value: 'lg' }, { label: 'Plein', value: 'full' },
                            ]} onChange={(v) => updateButton({ borderRadius: v as ButtonStyle['borderRadius'] })} />
                            <ToggleField label="Pleine largeur" checked={button.fullWidth} onChange={(v) => updateButton({ fullWidth: v })} />
                            {/* Preview bouton amélioré — rendu CSS réel */}
                            <div className="cms-button-style-preview">
                                <button
                                    className="cms-button-style-preview__sample"
                                    style={{
                                        background: button.variant === 'primary' ? '#3b82f6' : button.variant === 'secondary' ? '#f1f5f9' : 'transparent',
                                        color: button.variant === 'primary' ? '#ffffff' : button.variant === 'secondary' ? '#475569' : '#3b82f6',
                                        border: button.variant === 'outline' ? '1.5px solid #3b82f6' : 'none',
                                        borderRadius: button.borderRadius === 'full' ? '9999px' : button.borderRadius === 'lg' ? '8px' : button.borderRadius === 'md' ? '6px' : button.borderRadius === 'sm' ? '4px' : '6px',
                                        padding: button.size === 'sm' ? '4px 10px' : button.size === 'lg' ? '10px 24px' : button.size === 'xl' ? '12px 32px' : '6px 16px',
                                        fontSize: button.size === 'sm' ? '10px' : button.size === 'lg' ? '13px' : button.size === 'xl' ? '14px' : '11px',
                                        width: button.fullWidth ? '100%' : undefined,
                                        fontWeight: 500,
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    {button.texte || 'Bouton'}
                                </button>
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                                    {(['primary', 'secondary', 'outline', 'ghost'] as const).map(v => (
                                        <span
                                            key={v}
                                            className="text-[8px] px-1.5 py-0.5 rounded"
                                            style={{
                                                background: button.variant === v ? 'rgba(59,130,246,0.1)' : 'rgba(241,245,249,0.8)',
                                                color: button.variant === v ? '#3b82f6' : '#94a3b8',
                                                fontWeight: button.variant === v ? 600 : 400,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionSection>
                    )}

                    {/* Animations */}
                    {filteredSections.some(s => s.id === 'animations') && (
                    <AccordionSection title="Animations" icon={<Zap className="h-3.5 w-3.5" />} isOpen={openSections.has('animations')} onToggle={() => toggleSection('animations')} hasContent={anim.type !== 'fade-in' || anim.hover !== 'none'} badge={anim.type !== 'fade-in' ? 'Actif' : undefined} isModified={animModified} progress={animProgress} onReset={() => updateAnim(DEFAULT_ANIM)}>
                        <div className="space-y-2">
                            {/* Preview animation avec playback controls */}
                            <AnimationPreview anim={anim} />
                            <SelectField label="Type d'entrée" value={anim.type || 'fade-in'} options={ANIMATION_TYPES} onChange={(v) => updateAnim({ type: v as AnimationType })} />
                            <SliderField label="Durée" value={anim.duration || 0.5} min={0.1} max={3} step={0.1} onChange={(v) => updateAnim({ duration: v })} unit="s" />
                            <SliderField label="Délai" value={anim.delay || 0} min={0} max={2} step={0.1} onChange={(v) => updateAnim({ delay: v })} unit="s" />
                            <SelectField label="Easing" value={anim.easing || 'easeOut'} options={EASING_OPTIONS} onChange={(v) => updateAnim({ easing: v as AnimationEasing })} />
                            <SelectField label="Effet survol" value={anim.hover || 'none'} options={HOVER_OPTIONS} onChange={(v) => updateAnim({ hover: v as HoverEffect })} />
                            <ToggleField label="Stagger (décalage enfants)" checked={anim.stagger || false} onChange={(v) => updateAnim({ stagger: v })} />
                            <ToggleField label="Parallax" checked={anim.parallax || false} onChange={(v) => updateAnim({ parallax: v })} />
                        </div>
                    </AccordionSection>
                    )}

                    {/* Transform & Effets */}
                    {filteredSections.some(s => s.id === 'transform') && (
                    <AccordionSection title="Transform & Effets" icon={<MousePointer className="h-3.5 w-3.5" />} isOpen={openSections.has('transform')} onToggle={() => toggleSection('transform')} hasContent={(transform.opacity !== undefined && transform.opacity < 1) || !!transform.blur || !!transform.rotate} badge={transform.opacity !== undefined && transform.opacity < 1 ? `${Math.round(transform.opacity * 100)}%` : undefined} isModified={transformModified} progress={transformProgress} onReset={() => updateTransform(DEFAULT_TRANSFORM)}>
                        <div className="space-y-2">
                            {/* Opacité */}
                            <SliderField label="Opacité" value={transform.opacity ?? 1} min={0} max={1} step={0.05} onChange={(v) => updateTransform({ opacity: v })} />
                            {/* Filtres CSS */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                                <div className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase">Filtres CSS</div>
                                <div className="space-y-1.5">
                                    <SliderField label="Flou" value={transform.blur || 0} min={0} max={20} step={1} onChange={(v) => updateTransform({ blur: v })} unit="px" />
                                    <SliderField label="Luminosité" value={transform.brightness ?? 1} min={0} max={2} step={0.05} onChange={(v) => updateTransform({ brightness: v })} />
                                    <SliderField label="Contraste" value={transform.contrast ?? 1} min={0} max={2} step={0.05} onChange={(v) => updateTransform({ contrast: v })} />
                                    <SliderField label="Saturation" value={transform.saturate ?? 1} min={0} max={2} step={0.05} onChange={(v) => updateTransform({ saturate: v })} />
                                    <SliderField label="Rotation teinte" value={transform.hueRotate || 0} min={0} max={360} step={5} onChange={(v) => updateTransform({ hueRotate: v })} unit="°" />
                                </div>
                                {/* Presets filtres rapides */}
                                <div className="mt-2 grid grid-cols-4 gap-1">
                                    {[
                                        { label: 'Normal', filters: {} },
                                        { label: 'N&B', filters: { grayscale: 1, saturate: undefined } },
                                        { label: 'Sépia', filters: { sepia: 0.8, saturate: undefined } },
                                        { label: 'Inversé', filters: { invert: 1 } },
                                        { label: 'Vif', filters: { saturate: 1.5, contrast: 1.2 } },
                                        { label: 'Doux', filters: { blur: 1, brightness: 1.1 } },
                                        { label: 'Drama', filters: { contrast: 1.5, saturate: 1.3, brightness: 0.9 } },
                                        { label: 'Vintage', filters: { sepia: 0.4, contrast: 1.1, saturate: 0.8 } },
                                    ].map(preset => (
                                        <button
                                            key={preset.label}
                                            onClick={() => {
                                                // Merge les filtres preset avec les valeurs existantes (ne remplace pas rotate/scale/opacity)
                                                const currentTransform = config.transform || DEFAULT_TRANSFORM;
                                                updateTransform({
                                                    ...currentTransform,
                                                    blur: undefined, brightness: 1, contrast: 1, saturate: 1,
                                                    hueRotate: undefined, grayscale: undefined, sepia: undefined, invert: undefined,
                                                    ...preset.filters,
                                                });
                                            }}
                                            className="rounded border border-gray-200 px-1 py-1 text-[9px] font-medium text-gray-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Transform */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                                <div className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase">Transformation</div>
                                <div className="space-y-1.5">
                                    <SliderField label="Rotation" value={transform.rotate || 0} min={-180} max={180} step={1} onChange={(v) => updateTransform({ rotate: v })} unit="°" />
                                    <SliderField label="Échelle X" value={transform.scaleX ?? 1} min={0.5} max={2} step={0.05} onChange={(v) => updateTransform({ scaleX: v })} />
                                    <SliderField label="Échelle Y" value={transform.scaleY ?? 1} min={0.5} max={2} step={0.05} onChange={(v) => updateTransform({ scaleY: v })} />
                                </div>
                            </div>
                        </div>
                    </AccordionSection>
                    )}

                    {/* Disposition — Layout & Positionnement */}
                    {filteredSections.some(s => s.id === 'disposition') && (
                    <AccordionSection title="Disposition" icon={<Layers className="h-3.5 w-3.5" />} isOpen={openSections.has('disposition')} onToggle={() => toggleSection('disposition')} hasContent={!!transform.overflow || !!transform.position} isModified={dispositionModified}>
                        <div className="space-y-2">
                            {/* Display mode */}
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                                <div className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase">Mode d'affichage</div>
                                <div className="grid grid-cols-3 gap-1">
                                    {[
                                        { label: 'Block', value: 'block', icon: '▬' },
                                        { label: 'Flex', value: 'flex', icon: '↔' },
                                        { label: 'Grid', value: 'grid', icon: '⊞' },
                                        { label: 'Inline', value: 'inline', icon: '▭' },
                                        { label: 'None', value: 'none', icon: '◌' },
                                        { label: 'Contents', value: 'contents', icon: '◫' },
                                    ].map(mode => (
                                        <button
                                            key={mode.value}
                                            className={`flex flex-col items-center gap-0.5 rounded-md border p-1.5 text-[9px] font-medium transition-colors ${
                                                transform.display === mode.value
                                                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                            onClick={() => updateTransform({ display: mode.value as TransformStyle['display'] })}
                                        >
                                            <span className="text-xs">{mode.icon}</span>
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Overflow */}
                            <SelectField label="Overflow" value={transform.overflow || 'visible'} options={[
                                { label: 'Visible', value: 'visible' }, { label: 'Caché', value: 'hidden' },
                                { label: 'Scroll', value: 'scroll' }, { label: 'Auto', value: 'auto' },
                            ]} onChange={(v) => updateTransform({ overflow: v as TransformStyle['overflow'] })} />
                            {/* Position */}
                            <SelectField label="Position" value={transform.position || 'static'} options={[
                                { label: 'Static', value: 'static' }, { label: 'Relative', value: 'relative' },
                                { label: 'Sticky', value: 'sticky' },
                            ]} onChange={(v) => updateTransform({ position: v as TransformStyle['position'] })} />
                            {/* Z-Index */}
                            <SliderField label="Z-Index" value={transform.zIndex ?? 0} min={-100} max={100} step={1} onChange={(v) => updateTransform({ zIndex: v })} />
                            {/* Curseur */}
                            <SelectField label="Curseur" value={transform.cursor || 'auto'} options={[
                                { label: 'Auto', value: 'auto' }, { label: 'Pointer', value: 'pointer' },
                                { label: 'Default', value: 'default' }, { label: 'Not-allowed', value: 'not-allowed' },
                            ]} onChange={(v) => updateTransform({ cursor: v as TransformStyle['cursor'] })} />
                            {/* Mix Blend Mode */}
                            <SelectField label="Mix Blend" value={transform.mixBlendMode || 'normal'} options={[
                                { label: 'Normal', value: 'normal' }, { label: 'Multiply', value: 'multiply' },
                                { label: 'Screen', value: 'screen' }, { label: 'Overlay', value: 'overlay' },
                            ]} onChange={(v) => updateTransform({ mixBlendMode: v as TransformStyle['mixBlendMode'] })} />
                            {/* Preview disposition */}
                            <div className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                                <div className="flex items-center gap-2 text-[9px] text-gray-400">
                                    <span className="rounded bg-white px-1.5 py-0.5 border border-gray-200 font-mono">
                                        pos: {transform.position || 'static'}
                                    </span>
                                    <span className="rounded bg-white px-1.5 py-0.5 border border-gray-200 font-mono">
                                        overflow: {transform.overflow || 'visible'}
                                    </span>
                                    <span className="rounded bg-white px-1.5 py-0.5 border border-gray-200 font-mono">
                                        z: {transform.zIndex ?? 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </AccordionSection>
                    )}
                </div>
            )}
        </div>
    );
}
