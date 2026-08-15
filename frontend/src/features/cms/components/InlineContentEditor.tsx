/**
 * ==================================
 * eLISAschool - Éditeur de contenu inline v2 (canvas)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Édition directe du contenu des sections dans le canvas :
 * - Textes avec formatage riche (gras, italique, couleur, alignement)
 * - Boutons (texte, style, couleur, lien)
 * - Images (URL, preview, alt text)
 * - Liens (URL, cible, texte)
 * - Couleurs (texte, fond, bordure)
 * Inspiré de Webflow/Builder.io/Figma : édition contextuelle flottante.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    Type, Image as ImageIcon, Link2, MousePointerClick, X, Check,
    AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heading3,
    Sparkles, GripVertical, Undo2, Redo2,
    Eye, Maximize2, Minimize2,
    Underline, Strikethrough,
    Palette, Pipette, Square,
    Upload, ExternalLink, Globe, Lock, LinkIcon,
    Crop, StretchHorizontal, StretchVertical,
    RefreshCw, Trash2, Clipboard, ClipboardPaste,
    Bold, Italic, Code, List, ListOrdered, Quote,
    Move, Pin, MoreHorizontal, Wand2, Layers,
    RotateCw, FlipHorizontal, FlipVertical, Sliders,
    Sun, Contrast, Droplets, Brush,
    Search, Keyboard,
    Plus, Minus, ChevronDown,
    Zap, MousePointer, Grid3x3, Minus as MinusIcon,
    CornerUpRight, Scissors,
    Timer, Copy, FileCode,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================================
// Types
// ==================================

export interface InlineContentEditorProps {
    /** Props de la section à éditer */
    sectionProps: Record<string, any>;
    /** Callback pour mettre à jour les props */
    onPropsChange: (newProps: Record<string, any>) => void;
    /** Type de section */
    sectionType: string;
    /** Position de l'éditeur (bounding rect du composant) */
    position: { top: number; left: number; width: number } | null;
    /** Zoom actuel du canvas */
    zoom: number;
    /** Scroll position du canvas */
    scrollPos: { x: number; y: number };
    /** Callback fermeture */
    onClose: () => void;
}

type EditTab = 'contenu' | 'typographie' | 'style' | 'bouton' | 'preview' | 'effets' | 'transform' | null;
type FieldType = 'texte' | 'bouton' | 'image' | 'lien' | 'nombre' | 'select';

/** Effets visuels rapides (combinent texte + fond + ombre) */
const VISUAL_EFFECTS = [
    { id: 'none', label: 'Aucun', icon: '⊘', config: {} },
    { id: 'glass', label: 'Glass', icon: '◐', config: { bgColor: 'rgba(255,255,255,0.15)', textColor: '#ffffff', boxShadow: 'lg', borderWidth: '1', borderColor: 'rgba(255,255,255,0.2)' } },
    { id: 'neumorph', label: 'Neumorph', icon: '◑', config: { bgColor: '#e0e5ec', textColor: '#4a5568', boxShadow: 'md', borderRadius: '16' } },
    { id: 'elevated', label: 'Élévé', icon: '◫', config: { bgColor: '#ffffff', textColor: '#1a202c', boxShadow: 'xl', borderRadius: '12' } },
    { id: 'dark', label: 'Sombre', icon: '◗', config: { bgColor: '#1a202c', textColor: '#e2e8f0', boxShadow: 'lg' } },
    { id: 'gradient', label: 'Dégradé', icon: '◧', config: { bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textColor: '#ffffff', boxShadow: 'md' } },
    { id: 'warm', label: 'Chaleureux', icon: '◉', config: { bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', textColor: '#ffffff' } },
    { id: 'nature', label: 'Nature', icon: '◍', config: { bgColor: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', textColor: '#ffffff' } },
    { id: 'outline', label: 'Contour', icon: '◻', config: { bgColor: '#f9fafb', textColor: '#1e40af', borderWidth: '2', borderColor: '#3b82f6', borderRadius: '12' } },
    { id: 'neon-content', label: 'Néon', icon: '◈', config: { bgColor: '#0f172a', textColor: '#22d3ee', boxShadow: 'glow', borderWidth: '1', borderColor: '#22d3ee' } },
    { id: 'soft-card-content', label: 'Carte', icon: '◫', config: { bgColor: '#ffffff', textColor: '#1a202c', boxShadow: 'lg', borderRadius: '12', borderWidth: '1', borderColor: '#e5e7eb' } },
    { id: 'minimal-content', label: 'Épuré', icon: '◽', config: { bgColor: '#ffffff', textColor: '#374151', borderWidth: '1', borderColor: '#d1d5db', borderRadius: '8' } },
    // Nouveaux effets v3 — inspirés de Webflow/Framer
    { id: 'frost', label: 'Givre', icon: '❄', config: { bgColor: 'rgba(255,255,255,0.08)', textColor: '#e0f2fe', boxShadow: 'lg', borderWidth: '1', borderColor: 'rgba(186,230,253,0.2)', backdropFilter: 'blur(12px)' } },
    { id: 'sunset-gradient', label: 'Coucher', icon: '◐', config: { bgColor: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #8b5cf6 100%)', textColor: '#ffffff', boxShadow: 'xl', borderRadius: '16' } },
    { id: 'ocean-gradient', label: 'Océan', icon: '◑', config: { bgColor: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%)', textColor: '#ffffff', boxShadow: 'lg', borderRadius: '12' } },
    { id: 'forest-gradient', label: 'Forêt', icon: '◍', config: { bgColor: 'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)', textColor: '#ffffff', boxShadow: 'lg', borderRadius: '12' } },
    { id: 'midnight', label: 'Minuit', icon: '◗', config: { bgColor: '#0f172a', textColor: '#cbd5e1', boxShadow: 'inner', borderRadius: '8', borderWidth: '1', borderColor: 'rgba(51,65,85,0.5)' } },
    { id: 'soft-elevated', label: 'Doux', icon: '◫', config: { bgColor: '#fafafa', textColor: '#18181b', boxShadow: 'md', borderRadius: '16', borderWidth: '1', borderColor: '#f4f4f5' } },
    { id: 'bold-outline', label: 'Audacieux', icon: '◻', config: { bgColor: '#ffffff', textColor: '#0f172a', borderWidth: '3', borderColor: '#0f172a', borderRadius: '4' } },
    { id: 'glow-blue', label: 'Lueur', icon: '◈', config: { bgColor: '#1e293b', textColor: '#60a5fa', boxShadow: 'glow', borderWidth: '1', borderColor: 'rgba(96,165,250,0.3)', borderRadius: '12' } },
];

/** Cibles de lien */
const LINK_TARGETS = [
    { value: '_self', label: 'Même fenêtre', icon: '🔗', desc: 'Ouvre dans l\'onglet actuel' },
    { value: '_blank', label: 'Nouvelle fenêtre', icon: '🌐', desc: 'Ouvre dans un nouvel onglet' },
];

/** Protocoles URL */
const URL_PROTOCOLS = [
    { value: 'https://', label: 'HTTPS' },
    { value: 'http://', label: 'HTTP' },
    { value: 'mailto:', label: 'Email' },
    { value: 'tel:', label: 'Téléphone' },
    { value: '/', label: 'Relatif' },
];

/** Ratios d'aspect pour images */
const IMAGE_ASPECT_RATIOS = [
    { value: 'auto', label: 'Auto', icon: <Crop className="cms-field-icon" /> },
    { value: '16/9', label: '16:9', icon: <StretchHorizontal className="cms-field-icon" /> },
    { value: '4/3', label: '4:3', icon: <StretchHorizontal className="cms-field-icon" /> },
    { value: '1/1', label: '1:1', icon: <Square className="cms-field-icon" /> },
    { value: '3/4', label: '3:4', icon: <StretchVertical className="cms-field-icon" /> },
    { value: '9/16', label: '9:16', icon: <StretchVertical className="cms-field-icon" /> },
];

/** Validation d'URL */
function isValidUrl(str: string): boolean {
    if (!str || str.length < 3) return false;
    try {
        if (str.startsWith('/') || str.startsWith('mailto:') || str.startsWith('tel:')) return true;
        new URL(str);
        return true;
    } catch { return false; }
}

/** Extraire le domaine d'une URL */
function getUrlDomain(url: string): string {
    try {
        if (url.startsWith('mailto:')) return `Email: ${url.replace('mailto:', '')}`;
        if (url.startsWith('tel:')) return `Tél: ${url.replace('tel:', '')}`;
        if (url.startsWith('/')) return url;
        const u = new URL(url);
        return u.hostname + (u.pathname !== '/' ? u.pathname : '');
    } catch { return url; }
}

interface EditableField {
    key: string;
    label: string;
    icon: React.ReactNode;
    type: FieldType;
    placeholder?: string;
    multiline?: boolean;
    options?: { value: string; label: string }[];
    group: 'texte' | 'media' | 'action';
}

// Couleurs prédéfinies (palette CMS)
const TEXT_COLORS = [
    { label: 'Noir', value: '#111827' },
    { label: 'Gris foncé', value: '#374151' },
    { label: 'Gris', value: '#6b7280' },
    { label: 'Blanc', value: '#ffffff' },
    { label: 'Bleu', value: '#2563eb' },
    { label: 'Bleu foncé', value: '#1e40af' },
    { label: 'Vert', value: '#16a34a' },
    { label: 'Vert foncé', value: '#15803d' },
    { label: 'Rouge', value: '#dc2626' },
    { label: 'Orange', value: '#ea580c' },
    { label: 'Jaune', value: '#ca8a04' },
    { label: 'Violet', value: '#7c3aed' },
    { label: 'Rose', value: '#db2777' },
    { label: 'Cyan', value: '#0891b2' },
    { label: 'Indigo', value: '#4f46e5' },
    { label: 'Ambre', value: '#d97706' },
];

const BG_COLORS = [
    { label: 'Transparent', value: 'transparent' },
    { label: 'Blanc', value: '#ffffff' },
    { label: 'Gris clair', value: '#f9fafb' },
    { label: 'Gris', value: '#f3f4f6' },
    { label: 'Sombre', value: '#111827' },
    { label: 'Bleu', value: '#2563eb' },
    { label: 'Bleu foncé', value: '#1e3a5f' },
    { label: 'Bleu clair', value: '#eff6ff' },
    { label: 'Vert', value: '#16a34a' },
    { label: 'Vert clair', value: '#f0fdf4' },
    { label: 'Rouge', value: '#dc2626' },
    { label: 'Rouge clair', value: '#fef2f2' },
    { label: 'Violet', value: '#7c3aed' },
    { label: 'Violet clair', value: '#f5f3ff' },
    { label: 'Orange', value: '#ea580c' },
    { label: 'Dégradé bleu', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: 'Dégradé sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { label: 'Dégradé océan', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
];

const BUTTON_STYLES = [
    { label: 'Primaire', value: 'primary', preview: 'bg-blue-600 text-white rounded-md' },
    { label: 'Secondaire', value: 'secondary', preview: 'bg-gray-100 text-gray-800 rounded-md' },
    { label: 'Outline', value: 'outline', preview: 'border-2 border-blue-600 text-blue-600 rounded-md' },
    { label: 'Ghost', value: 'ghost', preview: 'text-blue-600 underline rounded-md' },
    { label: 'Pill', value: 'pill', preview: 'bg-blue-600 text-white rounded-full' },
    { label: 'Shadow', value: 'shadow', preview: 'bg-blue-600 text-white rounded-md shadow-lg' },
];

const BUTTON_RADIUS_OPTIONS = [
    { value: 'none', label: '0', css: '0' },
    { value: 'sm', label: '4', css: '4px' },
    { value: 'md', label: '8', css: '8px' },
    { value: 'lg', label: '12', css: '12px' },
    { value: 'xl', label: '16', css: '16px' },
    { value: 'full', label: '∞', css: '9999px' },
];

const BUTTON_SIZE_OPTIONS = [
    { value: 'sm', label: 'S', desc: 'Petit' },
    { value: 'md', label: 'M', desc: 'Moyen' },
    { value: 'lg', label: 'L', desc: 'Grand' },
    { value: 'xl', label: 'XL', desc: 'XL' },
];

const SHADOW_PRESETS = [
    { type: 'none', label: 'Aucune', css: 'none' },
    { type: 'sm', label: 'Subtile', css: '0 1px 2px rgba(0,0,0,0.05)' },
    { type: 'md', label: 'Moyenne', css: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)' },
    { type: 'lg', label: 'Large', css: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)' },
    { type: 'xl', label: 'XL', css: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)' },
    { type: 'glow', label: 'Lueur', css: '0 0 20px rgba(59,130,246,0.3)' },
];

// Presets typographiques
const TYPO_PRESETS = [
    { id: 'hero', label: 'Hero', description: 'Titre principal', fontFamily: 'sans', fontWeight: 'bold', fontSize: '4xl', lineHeight: 'tight', letterSpacing: 'tight' },
    { id: 'title', label: 'Titre', description: 'Titre de section', fontFamily: 'sans', fontWeight: 'semibold', fontSize: '2xl', lineHeight: 'tight', letterSpacing: 'tight' },
    { id: 'subtitle', label: 'Sous-titre', description: 'Sous-titre', fontFamily: 'sans', fontWeight: 'medium', fontSize: 'lg', lineHeight: 'normal', letterSpacing: 'normal' },
    { id: 'body', label: 'Corps', description: 'Texte courant', fontFamily: 'sans', fontWeight: 'normal', fontSize: 'base', lineHeight: 'relaxed', letterSpacing: 'normal' },
    { id: 'caption', label: 'Légende', description: 'Texte petit', fontFamily: 'sans', fontWeight: 'normal', fontSize: 'sm', lineHeight: 'normal', letterSpacing: 'wide' },
    { id: 'label', label: 'Label', description: 'Étiquette', fontFamily: 'sans', fontWeight: 'semibold', fontSize: 'xs', lineHeight: 'normal', letterSpacing: 'wide' },
];

const FONT_SIZE_OPTIONS = [
    { value: 'xs', label: 'XS' },
    { value: 'sm', label: 'SM' },
    { value: 'base', label: 'Base' },
    { value: 'lg', label: 'LG' },
    { value: 'xl', label: 'XL' },
    { value: '2xl', label: '2XL' },
    { value: '3xl', label: '3XL' },
    { value: '4xl', label: '4XL' },
    { value: '5xl', label: '5XL' },
];

const FONT_WEIGHT_OPTIONS = [
    { value: 'normal', label: 'Regular', cssWeight: 400 },
    { value: 'medium', label: 'Medium', cssWeight: 500 },
    { value: 'semibold', label: 'Semi', cssWeight: 600 },
    { value: 'bold', label: 'Bold', cssWeight: 700 },
    { value: 'extrabold', label: 'Extra', cssWeight: 800 },
];

const FONT_FAMILY_OPTIONS = [
    { value: 'sans', label: 'Sans-serif', cssFamily: 'system-ui, sans-serif' },
    { value: 'serif', label: 'Serif', cssFamily: 'Georgia, serif' },
    { value: 'mono', label: 'Mono', cssFamily: 'Menlo, monospace' },
    { value: 'display', label: 'Display', cssFamily: 'system-ui, sans-serif' },
];

const LINE_HEIGHT_OPTIONS = [
    { value: 'tight', label: 'Serré (1.25)' },
    { value: 'normal', label: 'Normal (1.5)' },
    { value: 'relaxed', label: 'Aéré (1.75)' },
    { value: 'loose', label: 'Large (2.0)' },
];

const LETTER_SPACING_OPTIONS = [
    { value: 'tighter', label: 'Très serré' },
    { value: 'tight', label: 'Serré' },
    { value: 'normal', label: 'Normal' },
    { value: 'wide', label: 'Large' },
    { value: 'wider', label: 'Très large' },
];

/** Directions de dégradé avec angles CSS */
const GRADIENT_DIRECTIONS = [
    { label: '↑', angle: '0deg', css: 'to-t' },
    { label: '↗', angle: '45deg', css: 'to-tr' },
    { label: '→', angle: '90deg', css: 'to-r' },
    { label: '↘', angle: '135deg', css: 'to-br' },
    { label: '↓', angle: '180deg', css: 'to-b' },
    { label: '↙', angle: '225deg', css: 'to-bl' },
    { label: '←', angle: '270deg', css: 'to-l' },
    { label: '↖', angle: '315deg', css: 'to-tl' },
];

/** Keyframes CSS pour les previews d'animation */
const ANIMATION_KEYFRAMES = `
@keyframes cmsPrevFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes cmsPrevSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cmsPrevSlideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cmsPrevSlideLeft { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes cmsPrevSlideRight { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes cmsPrevScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes cmsPrevBounce { 0% { transform: scale(0.8); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
@keyframes cmsPrevRotate { from { transform: rotate(-10deg) scale(0.9); opacity: 0; } to { transform: rotate(0) scale(1); opacity: 1; } }
@keyframes cmsPrevFlip { from { transform: perspective(400px) rotateY(90deg); opacity: 0; } to { transform: perspective(400px) rotateY(0); opacity: 1; } }
@keyframes cmsPrevBlur { from { filter: blur(6px); opacity: 0; } to { filter: blur(0); opacity: 1; } }
@keyframes cmsPrevElastic { 0% { transform: scale(0); } 60% { transform: scale(1.1); } 100% { transform: scale(1); } }
`;

// ==================================
// Composant principal
// ==================================

export function InlineContentEditor({
    sectionProps,
    onPropsChange,
    sectionType,
    position,
    zoom,
    scrollPos,
    onClose,
}: InlineContentEditorProps) {
    const [activeTab, setActiveTab] = useState<EditTab>('contenu');
    const [expandedField, setExpandedField] = useState<string | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<Record<string, any>[]>([sectionProps]);
    const [historyIndex, setHistoryIndex] = useState(0);
    // Couleurs récentes (persistées par session)
    const [recentColors, setRecentColors] = useState<string[]>([]);
    // Search filter for tabs
    const [searchFilter, setSearchFilter] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    // Paste style panel
    const [showPasteStyle, setShowPasteStyle] = useState(false);
    const [pasteStyleText, setPasteStyleText] = useState('');
    // Snippets panel
    const [showSnippets, setShowSnippets] = useState(false);
    const [isCompact, setIsCompact] = useState(false);
    const trackColor = useCallback((color: string) => {
        if (!color || color === 'transparent' || color.startsWith('linear-gradient')) return;
        setRecentColors(prev => {
            const filtered = prev.filter(c => c !== color);
            return [color, ...filtered].slice(0, 8);
        });
    }, []);
    // Preview device (multi-device preview)
    const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
    // Panel resize
    const [panelWidth, setPanelWidth] = useState(320);
    const isResizing = useRef(false);
    const handleResizeStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        const startX = e.clientX;
        const startWidth = panelWidth;
        const handleMouseMove = (ev: MouseEvent) => {
            if (!isResizing.current) return;
            const delta = ev.clientX - startX;
            setPanelWidth(Math.max(260, Math.min(480, startWidth + delta)));
        };
        const handleMouseUp = () => {
            isResizing.current = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [panelWidth]);

    // Déterminer les champs éditables selon le type de section
    const editableFields = useMemo<EditableField[]>(() => {
        const fields: EditableField[] = [];

        // === GROUPE TEXTE ===
        if (sectionProps.titre !== undefined) {
            fields.push({ key: 'titre', label: 'Titre', icon: <Heading1 className="cms-field-icon" />, type: 'texte', multiline: false, group: 'texte' });
        }
        if (sectionProps.surtitre !== undefined) {
            fields.push({ key: 'surtitre', label: 'Sur-titre', icon: <Heading2 className="cms-field-icon" />, type: 'texte', multiline: false, group: 'texte' });
        }
        if (sectionProps.soustitre !== undefined) {
            fields.push({ key: 'soustitre', label: 'Sous-titre', icon: <Heading3 className="cms-field-icon" />, type: 'texte', multiline: false, group: 'texte' });
        }
        if (sectionProps.description !== undefined) {
            fields.push({ key: 'description', label: 'Description', icon: <Type className="cms-field-icon" />, type: 'texte', multiline: true, group: 'texte' });
        }
        if (sectionProps.contenu !== undefined) {
            fields.push({ key: 'contenu', label: 'Contenu', icon: <Type className="cms-field-icon" />, type: 'texte', multiline: true, group: 'texte' });
        }
        if (sectionProps.texte !== undefined) {
            fields.push({ key: 'texte', label: 'Texte', icon: <Type className="cms-field-icon" />, type: 'texte', multiline: true, group: 'texte' });
        }

        // === GROUPE MEDIA ===
        if (sectionProps.imageUrl !== undefined || sectionProps.image !== undefined) {
            fields.push({ key: 'imageUrl', label: 'Image', icon: <ImageIcon className="cms-field-icon" />, type: 'image', group: 'media' });
        }
        if (sectionProps.imageAlt !== undefined || sectionProps.alt !== undefined) {
            fields.push({ key: 'imageAlt', label: 'Texte alt', icon: <Eye className="cms-field-icon" />, type: 'texte', group: 'media' });
        }

        // === GROUPE ACTION ===
        const boutonKey = sectionProps.boutonTexte !== undefined ? 'boutonTexte' : sectionProps.boutonLabel !== undefined ? 'boutonLabel' : '';
        if (boutonKey) {
            fields.push({ key: boutonKey, label: 'Texte bouton', icon: <MousePointerClick className="cms-field-icon" />, type: 'bouton', group: 'action' });
        }
        const lienKey = sectionProps.boutonLien !== undefined ? 'boutonLien' : sectionProps.lien !== undefined ? 'lien' : '';
        if (lienKey) {
            fields.push({ key: lienKey, label: 'Lien bouton', icon: <Link2 className="cms-field-icon" />, type: 'lien', group: 'action' });
        }

        return fields;
    }, [sectionProps]);

    const textFields = editableFields.filter(f => f.group === 'texte');
    const mediaFields = editableFields.filter(f => f.group === 'media');
    const actionFields = editableFields.filter(f => f.group === 'action');
    const hasStyleFields = sectionProps.styleConfig !== undefined || textFields.length > 0;
    const hasButtonFields = actionFields.some(f => f.type === 'bouton');

    // Tab definitions with search keywords
    const allTabs = useMemo(() => [
        { id: 'contenu' as EditTab, label: 'Contenu', icon: <Type className="cms-field-icon" />, count: editableFields.length, keywords: ['texte', 'titre', 'image', 'bouton', 'lien', 'contenu', 'champ', 'media', 'action'] },
        { id: 'typographie' as EditTab, label: 'Typo', icon: <Heading1 className="cms-field-icon" />, keywords: ['police', 'font', 'taille', 'poids', 'famille', 'interligne', 'espacement', 'décoration', 'presets'] },
        ...(hasStyleFields ? [{ id: 'style' as EditTab, label: 'Style', icon: <Palette className="cms-field-icon" />, keywords: ['couleur', 'fond', 'bordure', 'ombre', 'alignement', 'padding', 'espacement', 'background', 'border', 'shadow'] }] : []),
        ...(hasButtonFields ? [{ id: 'bouton' as EditTab, label: 'Bouton', icon: <MousePointerClick className="cms-field-icon" />, keywords: ['bouton', 'clic', 'action', 'variant', 'taille', 'couleur', 'rayon', 'border'] }] : []),
        { id: 'effets' as EditTab, label: 'Effets', icon: <Wand2 className="cms-field-icon" />, keywords: ['effet', 'animation', 'opacité', 'flou', 'hover', 'glass', 'neumorph', 'filtre', 'visuel'] },
        { id: 'transform' as EditTab, label: 'Transf.', icon: <RotateCw className="cms-field-icon" />, keywords: ['transform', 'rotation', 'scale', 'skew', 'flip', 'miroir', 'filtre', 'brightness', 'contraste', 'saturation'] },
        { id: 'preview' as EditTab, label: 'Aperçu', icon: <Eye className="cms-field-icon" />, keywords: ['preview', 'aperçu', 'device', 'mobile', 'desktop', 'tablette', 'propriétés'] },
    ], [editableFields.length, hasStyleFields, hasButtonFields]);

    // Filter tabs by search
    const filteredTabs = useMemo(() => {
        if (!searchFilter.trim()) return allTabs;
        const q = searchFilter.toLowerCase();
        return allTabs.filter(tab =>
            tab.label.toLowerCase().includes(q) ||
            tab.keywords.some(kw => kw.includes(q))
        );
    }, [allTabs, searchFilter]);

    // Push to history on change
    const pushHistory = useCallback((newProps: Record<string, any>) => {
        setHistory(prev => [...prev.slice(0, historyIndex + 1), newProps].slice(-30));
        setHistoryIndex(prev => Math.min(prev + 1, 29));
    }, [historyIndex]);

    // Update a field value
    const updateField = useCallback((key: string, value: any) => {
        const newProps = { ...sectionProps };
        if (key === 'imageUrl' || key === 'image') {
            if (newProps.imageUrl !== undefined) newProps.imageUrl = value;
            if (newProps.image !== undefined) newProps.image = value;
        } else if (key === 'imageAlt') {
            if (newProps.imageAlt !== undefined) newProps.imageAlt = value;
            if (newProps.alt !== undefined) newProps.alt = value;
        } else {
            newProps[key] = value;
        }
        // Tracker les couleurs utilisées
        if (['textColor', 'bgColor', 'borderColor', 'boutonBgColor', 'boutonTextColor'].includes(key)) {
            trackColor(value);
        }
        pushHistory(newProps);
        onPropsChange(newProps);
    }, [sectionProps, onPropsChange, pushHistory, trackColor]);

    // Undo/Redo
    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const prev = history[historyIndex - 1];
            setHistoryIndex(i => i - 1);
            onPropsChange(prev);
        }
    }, [history, historyIndex, onPropsChange]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const next = history[historyIndex + 1];
            setHistoryIndex(i => i + 1);
            onPropsChange(next);
        }
    }, [history, historyIndex, onPropsChange]);

    // Fermer au clic extérieur
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    // Raccourcis clavier
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                handleRedo();
            }
            // Ctrl+F = toggle search in tabs
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                // Only if editor is focused
                if (editorRef.current?.contains(document.activeElement)) {
                    e.preventDefault();
                    setShowSearch(s => !s);
                }
            }
            // Escape = close search or close editor
            if (e.key === 'Escape') {
                if (showSearch) {
                    setShowSearch(false);
                    setSearchFilter('');
                } else {
                    onClose();
                }
            }
            // Arrow keys for tab navigation (when not in input)
            if (!e.ctrlKey && !e.metaKey && !e.altKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    const currentTabs = filteredTabs;
                    const currentIdx = currentTabs.findIndex(t => t.id === activeTab);
                    if (currentIdx >= 0) {
                        e.preventDefault();
                        const nextIdx = e.key === 'ArrowRight'
                            ? (currentIdx + 1) % currentTabs.length
                            : (currentIdx - 1 + currentTabs.length) % currentTabs.length;
                        setActiveTab(currentTabs[nextIdx].id);
                    }
                }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndo, handleRedo, onClose, showSearch, activeTab, filteredTabs]);

    // Paste style from JSON
    const handlePasteStyle = useCallback(() => {
        try {
            const parsed = JSON.parse(pasteStyleText);
            const newProps = { ...sectionProps };
            // Map style config keys to section props
            Object.entries(parsed).forEach(([key, val]) => {
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                    newProps[key] = val;
                }
            });
            pushHistory(newProps);
            onPropsChange(newProps);
            setShowPasteStyle(false);
            setPasteStyleText('');
            toast.success('Style collé avec succès');
        } catch {
            toast.error('JSON invalide. Vérifiez le format.');
        }
    }, [pasteStyleText, sectionProps, onPropsChange, pushHistory]);

    // Handle paste from clipboard
    const handlePasteFromClipboard = useCallback(async () => {
        try {
            const text = await navigator.clipboard.readText();
            setPasteStyleText(text);
            toast.success('Contenu collé depuis le presse-papier');
        } catch {
            toast.error('Impossible de lire le presse-papier');
        }
    }, []);

    // Calculer la position de l'éditeur
    const editorStyle = useMemo((): React.CSSProperties => {
        if (!position) return { display: 'none' };
        const scale = zoom / 100;
        const top = position.top + 8;
        const left = position.left + position.width * scale + 12;
        // Si déborde à droite, placer à gauche de la section
        const maxLeft = window.innerWidth - panelWidth - 20;
        return {
            position: 'absolute',
            top: Math.max(8, top),
            left: Math.max(8, left > maxLeft ? position.left - panelWidth - 12 : left),
            width: panelWidth,
            zIndex: 40,
        };
    }, [position, zoom, panelWidth]);

    if (!position || editableFields.length === 0) return null;

    // Compteur de champs remplis (progress)
    const filledFieldsCount = editableFields.filter(f => {
        const val = getFieldValue(sectionProps, f.key);
        return val && val.trim().length > 0;
    }).length;
    const progressPercent = editableFields.length > 0 ? Math.round((filledFieldsCount / editableFields.length) * 100) : 0;

    // Classe responsive selon la largeur du panneau
    const panelSizeClass = panelWidth < 280 ? 'cms-panel-compact' : panelWidth < 360 ? 'cms-panel-medium' : 'cms-panel-full';

    return (
        <div
            ref={editorRef}
            className={`cms-content-enter pointer-events-auto absolute z-40 ${panelSizeClass}`}
            style={editorStyle}
        >
            <div className={`cms-floating-panel cms-floating-panel--ultra cms-floating-panel--animate cms-floating-panel--overflow-hidden ${isCompact ? 'cms-floating-panel--compact' : ''}`} style={{ width: '100%' }}>
                {/* Resize handle (bord gauche) */}
                <div
                    onMouseDown={handleResizeStart}
                    className="cms-resize-handle cms-resize-handle--left"
                    title="Redimensionner"
                />
                {/* ═══ Header ═══ */}
                <div className="cms-section-header-compact">
                    <Sparkles className="cms-section-header-compact__icon" />
                    <span className="cms-section-header-compact__title">Édition contenu</span>
                    <span className="cms-section-header-compact__badge">
                        {sectionType.replace(/Section$/, '')}
                    </span>
                    {/* Progress indicator — §751 enhanced */}
                    <div className="cms-content-progress" title={`${filledFieldsCount}/${editableFields.length} champs remplis`}>
                        <div className="cms-content-progress__bar">
                            <div className="cms-content-progress__fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <span className="cms-content-progress__label">{progressPercent}%</span>
                    </div>
                    <div className="cms-flex-spacer" />
                    {/* Search toggle */}
                    <button
                        onClick={() => { setShowSearch(s => !s); if (showSearch) setSearchFilter(''); }}
                        className={`cms-icon-btn-sm ${showSearch ? 'cms-icon-btn-sm--active' : ''}`}
                        title="Rechercher (Ctrl+F)"
                    >
                        <Search className="cms-icon--sm" />
                    </button>
                    {/* Paste style toggle */}
                    <button
                        onClick={() => setShowPasteStyle(s => !s)}
                        className={`cms-icon-btn-sm ${showPasteStyle ? 'cms-icon-btn-sm--paste' : ''}`}
                        title="Coller style JSON"
                    >
                        <ClipboardPaste className="cms-icon--sm" />
                    </button>
                    {/* Snippets toggle */}
                    <button
                        onClick={() => setShowSnippets(s => !s)}
                        className={`cms-icon-btn-sm ${showSnippets ? 'cms-icon-btn-sm--active' : ''}`}
                        title="Blocs rapides"
                    >
                        <Grid3x3 className="cms-icon--sm" />
                    </button>
                    {/* Compact mode toggle */}
                    <button
                        onClick={() => setIsCompact(c => !c)}
                        className={`cms-icon-btn-sm ${isCompact ? 'cms-icon-btn-sm--compact' : ''}`}
                        title={isCompact ? 'Mode normal' : 'Mode compact'}
                    >
                        <Minimize2 className="cms-icon--sm" />
                    </button>
                    <div className="cms-header-separator" />
                    <button
                        onClick={() => setIsCollapsed(c => !c)}
                        className="cms-icon-btn-sm"
                        title={isCollapsed ? 'Déplier' : 'Replier'}
                    >
                        {isCollapsed ? <Maximize2 className="cms-icon--sm" /> : <Minimize2 className="cms-icon--sm" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="cms-panel-close"
                        title="Fermer (Échap)"
                    >
                        <X className="cms-icon--sm" />
                    </button>
                </div>

                {!isCollapsed && (
                    <>
                        {/* ═══ Search bar (Ctrl+F) ═══ */}
                        {showSearch && (
                            <div className="cms-inline-search-bar">
                                <Search className="cms-inline-search-bar__icon" />
                                <input
                                    type="text"
                                    value={searchFilter}
                                    onChange={(e) => setSearchFilter(e.target.value)}
                                    className="cms-inline-search-bar__input"
                                    placeholder="Filtrer les onglets..."
                                    autoFocus
                                />
                                {searchFilter && (
                                    <span className="cms-inline-search-bar__count">{filteredTabs.length}/{allTabs.length}</span>
                                )}
                                <button
                                    onClick={() => { setShowSearch(false); setSearchFilter(''); }}
                                    className="cms-inline-search-bar__close"
                                >
                                    <X className="cms-icon--sm" />
                                </button>
                            </div>
                        )}
                        {/* ═══ Tabs ═══ */}
                        <div className="cms-tab-bar-pro relative">
                            {filteredTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); }}
                                    className={`cms-tab-pro ${activeTab === tab.id ? 'cms-tab-pro--active' : ''}`}
                                    title={tab.label}
                                >
                                    {tab.icon}
                                    <span className="hidden [@media(min-width:260px)]:inline">{tab.label}</span>
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span className={`cms-tab-badge ${activeTab === tab.id ? 'cms-tab-badge--active' : ''}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                    {/* Animated underline indicator */}
                                    {activeTab === tab.id && (
                                        <div className="cms-tab-indicator" />
                                    )}
                                </button>
                            ))}
                            {filteredTabs.length === 0 && (
                                <div className="cms-tab-bar-pro__empty">
                                    <div className="cms-tab-bar-pro__empty-text">Aucun onglet trouvé</div>
                                </div>
                            )}
                        </div>

                        {/* ═══ Paste Style Panel ═══ */}
                        {showPasteStyle && (
                            <div className="cms-paste-panel">
                                <div className="cms-paste-panel__header">
                                    <span className="cms-paste-panel__title">
                                        <ClipboardPaste className="cms-icon--sm" /> Coller style (JSON)
                                    </span>
                                    <button onClick={() => { setShowPasteStyle(false); setPasteStyleText(''); }} className="cms-paste-panel__close">
                                        <X className="cms-icon--sm" />
                                    </button>
                                </div>
                                <textarea
                                    value={pasteStyleText}
                                    onChange={(e) => setPasteStyleText(e.target.value)}
                                    className="cms-paste-panel__textarea"
                                    rows={3}
                                    placeholder='{"bgColor": "#ffffff", "textColor": "#111827", "borderRadius": "12"}'
                                />
                                <div className="cms-action-row">
                                    <button
                                        onClick={handlePasteStyle}
                                        disabled={!pasteStyleText.trim()}
                                        className="cms-inline-btn--apply"
                                    >
                                        Appliquer
                                    </button>
                                    <button
                                        onClick={handlePasteFromClipboard}
                                        className="cms-inline-btn cms-inline-btn--primary"
                                    >
                                        <ClipboardPaste className="cms-icon--sm" /> Coller
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ═══ Snippets Panel — Blocs rapides §736 ═══ */}
                        {showSnippets && (
                            <div className="cms-snippets-panel cms-scale-enter">
                                <div className="cms-snippets-panel__header">
                                    <span className="cms-snippets-panel__title">
                                        <Grid3x3 className="cms-snippets-panel__title-icon" />
                                        Blocs rapides
                                    </span>
                                    <button onClick={() => setShowSnippets(false)} className="cms-panel-close" title="Fermer">
                                        <X className="cms-icon--sm" />
                                    </button>
                                </div>
                                <div className="cms-snippets-grid">
                                    {[
                                        { id: 'separator', label: 'Séparateur', icon: <MinusIcon className="cms-snippet-card__icon" />, action: () => { updateField('contenu', (sectionProps.contenu || '') + '\n\n---\n\n'); toast.success('Séparateur ajouté'); } },
                                        { id: 'spacer', label: 'Espace', icon: <StretchVertical className="cms-snippet-card__icon" />, action: () => { updateField('contenu', (sectionProps.contenu || '') + '\n\n<br/>\n\n'); toast.success('Espace ajouté'); } },
                                        { id: 'badge', label: 'Badge', icon: <Square className="cms-snippet-card__icon" />, action: () => { updateField('surtitre', 'Nouveau'); toast.success('Badge ajouté'); } },
                                        { id: 'quote', label: 'Citation', icon: <Quote className="cms-snippet-card__icon" />, action: () => { updateField('description', (sectionProps.description || '') + '\n\n« Citation inspirante »'); toast.success('Citation ajoutée'); } },
                                        { id: 'list', label: 'Liste', icon: <List className="cms-snippet-card__icon" />, action: () => { updateField('contenu', (sectionProps.contenu || '') + '\n\n• Élément 1\n• Élément 2\n• Élément 3'); toast.success('Liste ajoutée'); } },
                                        { id: 'cta', label: 'CTA', icon: <MousePointerClick className="cms-snippet-card__icon" />, action: () => { onPropsChange({ ...sectionProps, boutonTexte: sectionProps.boutonTexte || 'En savoir plus', boutonLien: sectionProps.boutonLien || '#' }); toast.success('CTA ajouté'); } },
                                    ].map(snippet => (
                                        <button
                                            key={snippet.id}
                                            onClick={snippet.action}
                                            className="cms-snippet-card"
                                        >
                                            {snippet.icon}
                                            <span className="cms-snippet-card__label">{snippet.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ═══ Tab Content — Enhanced scroll + visibility §750 ═══ */}
                        <div
                            className="cms-editor-panel-scroll cms-canvas-scroll--enhanced"
                            style={{
                                maxHeight: 'min(540px, 68vh)',
                            }}
                        >
                            {/* ═══ Quick Format Bar (always visible in contenu tab) ═══ */}
                            {activeTab === 'contenu' && textFields.length > 0 && (
                                <div className="cms-quick-actions cms-quick-actions--sticky">
                                    <span className="cms-format-label">Formatage</span>
                                    <div className="cms-format-sep" />
                                    {/* Quick font size */}
                                    <div className="cms-btn-group">
                                        {['sm', 'base', 'lg', 'xl', '2xl'].map(size => (
                                            <button
                                                key={size}
                                                onClick={() => updateField('fontSize', size)}
                                                className={`cms-format-size-btn ${(sectionProps.fontSize || 'base') === size ? 'cms-format-size-btn--active' : ''}`}
                                            >
                                                {size === 'sm' ? 'S' : size === 'base' ? 'M' : size === 'lg' ? 'L' : size === 'xl' ? 'XL' : '2X'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="cms-format-sep" />
                                    {/* Quick alignment */}
                                    <div className="cms-btn-group">
                                        <button onClick={() => updateField('textAlign', 'left')} className={`cms-format-icon-btn ${(sectionProps.textAlign || 'left') === 'left' ? 'cms-format-icon-btn--active' : ''}`} title="Aligner à gauche">
                                            <AlignLeft className="cms-format-icon" />
                                        </button>
                                        <button onClick={() => updateField('textAlign', 'center')} className={`cms-format-icon-btn ${(sectionProps.textAlign || 'left') === 'center' ? 'cms-format-icon-btn--active' : ''}`} title="Centrer">
                                            <AlignCenter className="cms-format-icon" />
                                        </button>
                                        <button onClick={() => updateField('textAlign', 'right')} className={`cms-format-icon-btn ${(sectionProps.textAlign || 'left') === 'right' ? 'cms-format-icon-btn--active' : ''}`} title="Aligner à droite">
                                            <AlignRight className="cms-format-icon" />
                                        </button>
                                    </div>
                                    <div className="cms-format-sep" />
                                    {/* Quick weight */}
                                    <button
                                        onClick={() => {
                                            const weights = ['normal', 'medium', 'semibold', 'bold'];
                                            const current = sectionProps.fontWeight || 'normal';
                                            const idx = weights.indexOf(current);
                                            updateField('fontWeight', weights[(idx + 1) % weights.length]);
                                        }}
                                        className="cms-format-btn"
                                        title={`Poids: ${sectionProps.fontWeight || 'normal'} (cliquer pour changer)`}
                                    >
                                        B
                                    </button>
                                    <div className="cms-format-sep" />
                                    {/* Quick text decoration */}
                                    <button
                                        onClick={() => updateField('textDecoration', sectionProps.textDecoration === 'underline' ? 'none' : 'underline')}
                                        className={`cms-format-icon-btn ${sectionProps.textDecoration === 'underline' ? 'cms-format-icon-btn--active' : ''}`}
                                        title="Souligné"
                                    >
                                        <Underline className="cms-format-icon" />
                                    </button>
                                    {/* Quick text transform */}
                                    <button
                                        onClick={() => {
                                            const transforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
                                            const current = sectionProps.textTransform || 'none';
                                            const idx = transforms.indexOf(current);
                                            updateField('textTransform', transforms[(idx + 1) % transforms.length]);
                                        }}
                                        className="cms-format-btn cms-format-btn--medium"
                                        title={`Transform: ${sectionProps.textTransform || 'none'}`}
                                    >
                                        Aa
                                    </button>
                                    {/* Quick text color */}
                                    <div
                                        className="cms-color-dot cursor-pointer transition-transform hover:scale-110"
                                        style={{ backgroundColor: sectionProps.textColor || '#111827' }}
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'color';
                                            input.value = (sectionProps.textColor || '#111827').startsWith('#') ? sectionProps.textColor || '#111827' : '#111827';
                                            input.onchange = (e) => updateField('textColor', (e.target as HTMLInputElement).value);
                                            input.click();
                                        }}
                                        title="Couleur du texte"
                                    />
                                </div>
                            )}
                            {/* Tab content with fade-in animation */}
                            <div key={activeTab || 'none'} className="cms-tab-content-enter">
                            {activeTab === 'contenu' && (
                                <div className="cms-tab-content--spaced">
                                    {/* Groupe Texte */}
                                    {textFields.length > 0 && (
                                        <FieldGroup label="Textes" icon={<Type className="cms-field-group__icon" />} color="blue">
                                            {/* §770 — Text Style Presets */}
                                            <div className="cms-text-style-presets" style={{ padding: '0 8px 8px', borderBottom: '1px solid rgba(0,0,0,0.04)', marginBottom: 8 }}>
                                                <span style={{ fontSize: '0.5625rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Styles rapides</span>
                                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                    {[
                                                        { id: 'h1', label: 'H1', fontSize: '1.5rem', fontWeight: 700 },
                                                        { id: 'h2', label: 'H2', fontSize: '1.25rem', fontWeight: 700 },
                                                        { id: 'h3', label: 'H3', fontSize: '1.125rem', fontWeight: 600 },
                                                        { id: 'h4', label: 'H4', fontSize: '1rem', fontWeight: 600 },
                                                        { id: 'body', label: '¶', fontSize: '0.875rem', fontWeight: 400 },
                                                        { id: 'caption', label: 'ⓘ', fontSize: '0.75rem', fontWeight: 400 },
                                                        { id: 'small', label: 'Aₛ', fontSize: '0.625rem', fontWeight: 400 },
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.id}
                                                            onClick={() => {
                                                                updateField('fontSize', preset.fontSize);
                                                                updateField('fontWeight', String(preset.fontWeight));
                                                                toast.success(`Style ${preset.label} appliqué`);
                                                            }}
                                                            className="cms-text-style-preset"
                                                            title={`Style ${preset.label}`}
                                                            style={{ fontSize: preset.fontSize, fontWeight: preset.fontWeight }}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            {textFields.map(field => (
                                                <InlineEditableField
                                                    key={field.key}
                                                    field={field}
                                                    value={getFieldValue(sectionProps, field.key)}
                                                    onChange={(v) => updateField(field.key, v)}
                                                    isExpanded={expandedField === field.key}
                                                    onToggle={() => setExpandedField(expandedField === field.key ? null : field.key)}
                                                />
                                            ))}
                                            {/* §760 — Inline text color swatches */}
                                            <div className="cms-inline-color-swatch-row" title="Couleur du texte">
                                                <span style={{ fontSize: '0.5rem', color: '#94a3b8', fontWeight: 500, marginRight: 2 }}>Couleur:</span>
                                                {TEXT_COLORS.slice(0, 8).map(c => (
                                                    <button
                                                        key={c.value}
                                                        className={`cms-inline-color-swatch ${(sectionProps.textColor || '#111827') === c.value ? 'cms-inline-color-swatch--active' : ''}`}
                                                        style={{ backgroundColor: c.value }}
                                                        onClick={() => updateField('textColor', c.value)}
                                                        title={c.label}
                                                    />
                                                ))}
                                                {/* Custom color via native picker */}
                                                <button
                                                    className="cms-inline-color-swatch"
                                                    style={{
                                                        background: `conic-gradient(red, yellow, lime, aqua, blue, magenta, red)`,
                                                    }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = (sectionProps.textColor || '#111827').startsWith('#') ? sectionProps.textColor || '#111827' : '#111827';
                                                        input.onchange = (e) => updateField('textColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                    title="Couleur personnalisée"
                                                />
                                            </div>
                                        </FieldGroup>
                                    )}

                                    {/* Groupe Media */}
                                    {mediaFields.length > 0 && (
                                        <FieldGroup label="Médias" icon={<ImageIcon className="cms-field-group__icon" />} color="pink">
                                            {mediaFields.map(field => (
                                                <InlineEditableField
                                                    key={field.key}
                                                    field={field}
                                                    value={getFieldValue(sectionProps, field.key)}
                                                    onChange={(v) => updateField(field.key, v)}
                                                    isExpanded={expandedField === field.key}
                                                    onToggle={() => setExpandedField(expandedField === field.key ? null : field.key)}
                                                />
                                            ))}
                                        </FieldGroup>
                                    )}

                                    {/* Groupe Action */}
                                    {actionFields.length > 0 && (
                                        <FieldGroup label="Actions" icon={<MousePointerClick className="cms-field-group__icon" />} color="green">
                                            {actionFields.map(field => (
                                                <InlineEditableField
                                                    key={field.key}
                                                    field={field}
                                                    value={getFieldValue(sectionProps, field.key)}
                                                    onChange={(v) => updateField(field.key, v)}
                                                    isExpanded={expandedField === field.key}
                                                    onToggle={() => setExpandedField(expandedField === field.key ? null : field.key)}
                                                />
                                            ))}
                                            {/* Button style selector with live preview */}
                                            {actionFields.some(f => f.type === 'bouton') && (
                                                <ButtonStyleSelector
                                                    value={sectionProps.boutonStyle || sectionProps.style || 'primary'}
                                                    onChange={(v) => updateField('boutonStyle', v)}
                                                    buttonText={sectionProps.boutonTexte || sectionProps.boutonLabel}
                                                    buttonBgColor={sectionProps.boutonBgColor}
                                                    buttonTextColor={sectionProps.boutonTextColor}
                                                    onBgColorChange={(v) => updateField('boutonBgColor', v)}
                                                    onTextColorChange={(v) => updateField('boutonTextColor', v)}
                                                />
                                            )}
                                        </FieldGroup>
                                    )}
                                </div>
                            )}

                            {/* ═══ TAB: TYPOGRAPHIE ═══ */}
                            {activeTab === 'typographie' && (
                                <div className="cms-tab-content--dense">
                                    {/* Presets typographiques — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--purple cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sparkles className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Presets</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-compact-grid">
                                            {TYPO_PRESETS.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => {
                                                        updateField('fontFamily', preset.fontFamily);
                                                        updateField('fontWeight', preset.fontWeight);
                                                        updateField('fontSize', preset.fontSize);
                                                        updateField('lineHeight', preset.lineHeight);
                                                        updateField('letterSpacing', preset.letterSpacing);
                                                    }}
                                                    className={`rounded-lg border px-2 py-1.5 text-left transition-all ${
                                                        (sectionProps.fontFamily === preset.fontFamily && sectionProps.fontSize === preset.fontSize)
                                                            ? 'border-purple-300 bg-purple-50 ring-1 ring-purple-200'
                                                            : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <span className="cms-preset-card__label">{preset.label}</span>
                                                    <span className="cms-preset-card__desc">{preset.description}</span>
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* §773 — Typography Scale harmonique */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Type className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Échelle typographique</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-typography-scale">
                                                {[
                                                    { id: 'xs', label: 'XS', size: '0.625rem', weight: 400, preview: 'Texte très petit' },
                                                    { id: 'sm', label: 'SM', size: '0.75rem', weight: 400, preview: 'Texte petit' },
                                                    { id: 'base', label: 'Base', size: '0.875rem', weight: 400, preview: 'Texte normal' },
                                                    { id: 'lg', label: 'LG', size: '1rem', weight: 500, preview: 'Texte large' },
                                                    { id: 'xl', label: 'XL', size: '1.125rem', weight: 600, preview: 'Titre petit' },
                                                    { id: '2xl', label: '2XL', size: '1.25rem', weight: 700, preview: 'Titre moyen' },
                                                    { id: '3xl', label: '3XL', size: '1.5rem', weight: 700, preview: 'Titre large' },
                                                    { id: '4xl', label: '4XL', size: '1.875rem', weight: 800, preview: 'Titre XL' },
                                                ].map(scale => (
                                                    <button
                                                        key={scale.id}
                                                        onClick={() => {
                                                            updateField('fontSize', scale.size);
                                                            updateField('fontWeight', String(scale.weight));
                                                            toast.success(`Échelle ${scale.label} appliquée`);
                                                        }}
                                                        className={`cms-typography-scale__item ${(sectionProps.fontSize || '0.875rem') === scale.size ? 'cms-typography-scale__item--active' : ''}`}
                                                    >
                                                        <div className="cms-typography-scale__item-header">
                                                            <span className="cms-typography-scale__item-label">{scale.label}</span>
                                                            <span className="cms-typography-scale__item-size">{scale.size}</span>
                                                        </div>
                                                        <div
                                                            className="cms-typography-scale__item-preview"
                                                            style={{ fontSize: scale.size, fontWeight: scale.weight }}
                                                        >
                                                            {scale.preview}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* §773 — Spacing System cohérent */}
                                    <div className="cms-prop-group cms-prop-group--emerald cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sliders className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Système d'espacement</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-spacing-system">
                                                <div className="cms-spacing-system__row">
                                                    <span className="cms-spacing-system__label">Padding</span>
                                                    <div className="cms-spacing-system__options">
                                                        {['0', '4px', '8px', '12px', '16px', '24px', '32px', '48px'].map(val => (
                                                            <button
                                                                key={val}
                                                                onClick={() => {
                                                                    updateField('paddingTop', val);
                                                                    updateField('paddingBottom', val);
                                                                    updateField('paddingLeft', val);
                                                                    updateField('paddingRight', val);
                                                                }}
                                                                className={`cms-spacing-system__btn ${(sectionProps.paddingTop || '16px') === val ? 'cms-spacing-system__btn--active' : ''}`}
                                                                title={val}
                                                            >
                                                                <div
                                                                    className="cms-spacing-system__btn-visual"
                                                                    style={{
                                                                        padding: val === '0' ? '0' : `${parseInt(val) / 4}px`,
                                                                    }}
                                                                >
                                                                    <div className="cms-spacing-system__btn-inner" />
                                                                </div>
                                                                <span className="cms-spacing-system__btn-label">{val === '0' ? '0' : `${parseInt(val)}px`}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Taille de police — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--blue cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Type className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Taille</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-flex-wrap-group">
                                            {FONT_SIZE_OPTIONS.map(size => (
                                                <button
                                                    key={size.value}
                                                    onClick={() => updateField('fontSize', size.value)}
                                                    className={`cms-inline-border-btn ${
                                                        (sectionProps.fontSize || 'base') === size.value
                                                            ? 'cms-inline-border-btn--active'
                                                            : 'cms-inline-border-btn--inactive'
                                                    }`}
                                                >
                                                    {size.label}
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Poids de la police — cms-font-weight */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Heading1 className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Poids</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-font-weight">
                                            {FONT_WEIGHT_OPTIONS.map(w => (
                                                <button
                                                    key={w.value}
                                                    onClick={() => updateField('fontWeight', w.value)}
                                                    className={`cms-font-weight__option ${(sectionProps.fontWeight || 'normal') === w.value ? 'cms-font-weight__option--active' : ''}`}
                                                >
                                                    <span className="cms-font-weight__preview" style={{ fontWeight: w.cssWeight }}>A</span>
                                                    <span className="cms-font-weight__label">{w.label}</span>
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Famille de police — cms-font-selector */}
                                    <div className="cms-prop-group cms-prop-group--emerald cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Heading2 className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Famille</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-font-selector">
                                            {FONT_FAMILY_OPTIONS.map(f => (
                                                <button
                                                    key={f.value}
                                                    onClick={() => updateField('fontFamily', f.value)}
                                                    className={`cms-font-option ${(sectionProps.fontFamily || 'sans') === f.value ? 'cms-font-option--active' : ''}`}
                                                >
                                                    <div className="cms-font-option__preview" style={{ fontFamily: f.cssFamily }}>Aa</div>
                                                    <span className="cms-font-option__name">{f.label}</span>
                                                    <div className="cms-font-option__check">
                                                        {(sectionProps.fontFamily || 'sans') === f.value && <Check className="cms-font-check__icon" />}
                                                    </div>
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hauteur de ligne + Espacement lettres — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--amber cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sliders className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Interligne & Espacement</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-field-pair">
                                                <div>
                                                    <span className="cms-prop-row__label" style={{ minWidth: 'auto', marginBottom: 4 }}>Interligne</span>
                                            <div className="cms-chip-group" style={{ flexDirection: 'column' }}>
                                                {LINE_HEIGHT_OPTIONS.map(lh => (
                                                    <button
                                                        key={lh.value}
                                                        onClick={() => updateField('lineHeight', lh.value)}
                                                        className={`cms-chip ${(sectionProps.lineHeight || 'normal') === lh.value ? 'cms-chip--active cms-chip--purple' : ''}`}
                                                    >
                                                        {lh.label}
                                                    </button>
                                                ))}
                                            </div>
                                                </div>
                                                <div>
                                                    <span className="cms-prop-row__label" style={{ minWidth: 'auto', marginBottom: 4 }}>Espacement</span>
                                            <div className="cms-chip-group" style={{ flexDirection: 'column' }}>
                                                {LETTER_SPACING_OPTIONS.map(ls => (
                                                    <button
                                                        key={ls.value}
                                                        onClick={() => updateField('letterSpacing', ls.value)}
                                                        className={`cms-chip ${(sectionProps.letterSpacing || 'normal') === ls.value ? 'cms-chip--active cms-chip--purple' : ''}`}
                                                    >
                                                        {ls.label}
                                                    </button>
                                                ))}
                                            </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Décoration texte — cms-typo-decorations + cms-text-transform */}
                                    <div className="cms-prop-group cms-prop-group--rose cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Underline className="cms-field-group__icon" /></span>
                                            <span className="cms-prop-group__title">Décoration</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-typo-decorations">
                                                <button
                                                    onClick={() => updateField('textDecoration', sectionProps.textDecoration === 'underline' ? 'none' : 'underline')}
                                                    className={`cms-typo-decoration ${sectionProps.textDecoration === 'underline' ? 'cms-typo-decoration--active' : ''}`}
                                                    title="Souligné"
                                                >
                                                    <Underline className="cms-typo-decoration__icon" />
                                                </button>
                                                <button
                                                    onClick={() => updateField('textDecoration', sectionProps.textDecoration === 'line-through' ? 'none' : 'line-through')}
                                                    className={`cms-typo-decoration ${sectionProps.textDecoration === 'line-through' ? 'cms-typo-decoration--active' : ''}`}
                                                    title="Barré"
                                                >
                                                    <Strikethrough className="cms-typo-decoration__icon" />
                                                </button>
                                                <button
                                                    onClick={() => updateField('fontStyle', sectionProps.fontStyle === 'italic' ? 'normal' : 'italic')}
                                                    className={`cms-typo-decoration ${sectionProps.fontStyle === 'italic' ? 'cms-typo-decoration--active' : ''}`}
                                                    title="Italique"
                                                >
                                                    <span className="cms-typo-italic-label" style={{ fontFamily: 'serif' }}>I</span>
                                                </button>
                                            </div>
                                            {/* Text Transform */}
                                            <div className="cms-text-transform mt-2">
                                                {([
                                                    { value: 'none' as const, preview: 'AaBb', label: 'Normal' },
                                                    { value: 'uppercase' as const, preview: 'AABB', label: 'Maj' },
                                                    { value: 'lowercase' as const, preview: 'aabb', label: 'Min' },
                                                    { value: 'capitalize' as const, preview: 'Aa Bb', label: 'Cap' },
                                                ]).map(({ value, preview, label }) => (
                                                    <button
                                                        key={value}
                                                        onClick={() => updateField('textTransform', value)}
                                                        className={`cms-text-transform__option ${(sectionProps.textTransform || 'none') === value ? 'cms-text-transform__option--active' : ''}`}
                                                    >
                                                        <div className="cms-text-transform__preview" style={{ textTransform: value === 'none' ? 'none' : value }}>{preview}</div>
                                                        <span className="cms-text-transform__label">{label}</span>
                                                    </button>
))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'style' && (
                                <div className="cms-tab-content--spaced cms-tab-content-enter">
                                    {/* ═══ Visual Box Model Diagram — style Figma ═══ */}
                                    <div className="cms-box-model">
                                        <div className="cms-box-model__header">
                                            <span className="cms-box-model__title">
                                                <Sliders className="cms-box-model__title-icon" /> Box Model
                                            </span>
                                            <span className="cms-box-model__values">
                                                {sectionProps.borderRadius || 0}px · {sectionProps.borderWidth || 0}px
                                            </span>
                                        </div>
                                        {/* Visual box model — concentric rectangles */}
                                        <div className="cms-box-model__canvas">
                                            <div className="cms-box-model__diagram">
                                                {/* Margin layer */}
                                                <div className="cms-box-model__layer cms-box-model__layer--margin">
                                                    <span className="cms-box-model__label cms-box-model__label--margin">margin</span>
                                                </div>
                                                {/* Border layer */}
                                                <div className="cms-box-model__layer--border" style={{
                                                    borderColor: sectionProps.borderWidth ? (sectionProps.borderColor || '#3b82f6') : '#e2e8f0',
                                                    borderStyle: (sectionProps.borderWidth && parseInt(sectionProps.borderWidth) > 0) ? 'solid' : 'dashed',
                                                    background: 'transparent',
                                                }}>
                                                    <span className="cms-box-model__label--border">border</span>
                                                </div>
                                                {/* Padding layer */}
                                                <div className="cms-box-model__layer--padding" style={{
                                                    padding: `${Math.min((sectionProps.paddingY || 0) / 8, 8)}px ${Math.min((sectionProps.paddingX || 0) / 8, 8)}px`,
                                                }}>
                                                    <span className="cms-box-model__label--padding">padding</span>
                                                </div>
                                                {/* Content layer */}
                                                <div className="cms-box-model__layer--content" style={{
                                                    inset: 30,
                                                    background: sectionProps.bgColor && sectionProps.bgColor !== 'transparent' ? sectionProps.bgColor : '#eff6ff',
                                                    borderRadius: `${Math.min(parseInt(sectionProps.borderRadius || '0'), 20)}px`,
                                                }}>
                                                    <span className="cms-box-model__label--content" style={{ color: sectionProps.textColor || '#3b82f6' }}>contenu</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Couleurs texte */}
                                    <ColorPickerField
                                        label="Couleur du texte"
                                        colors={TEXT_COLORS}
                                        value={sectionProps.textColor || sectionProps.couleurTexte || '#111827'}
                                        onChange={(v) => updateField('textColor', v)}
                                        recentColors={recentColors}
                                    />
                                    {/* Couleur fond */}
                                    <ColorPickerField
                                        label="Fond de section"
                                        colors={BG_COLORS}
                                        value={sectionProps.bgColor || sectionProps.couleurFond || 'transparent'}
                                        onChange={(v) => updateField('bgColor', v)}
                                        isGradient
                                        recentColors={recentColors}
                                    />
                                    {/* Gradient Builder — visible si fond est un dégradé ou toujours accessible */}
                                    <GradientBuilder
                                        value={sectionProps.bgColor || ''}
                                        onChange={(v) => updateField('bgColor', v)}
                                    />
                                    {/* Alignement texte — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--blue cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><AlignCenter /></span>
                                            <span className="cms-prop-group__title">Alignement</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-typo-align" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                                            {([
                                                { value: 'left', label: 'Gauche', Icon: AlignLeft },
                                                { value: 'center', label: 'Centre', Icon: AlignCenter },
                                                { value: 'right', label: 'Droite', Icon: AlignRight },
                                            ] as const).map(({ value, label, Icon }) => (
                                                <button
                                                    key={value}
                                                    onClick={() => updateField('textAlign', value)}
                                                    className={`cms-typo-align__option ${(sectionProps.textAlign || 'left') === value ? 'cms-typo-align__option--active' : ''}`}
                                                >
                                                    <Icon className="cms-typo-align__icon" />
                                                    <span className="cms-typo-align__label">{label}</span>
                                                </button>
                                            ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Espacement — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--green cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><StretchHorizontal /></span>
                                            <span className="cms-prop-group__title">Espacement</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-spacing-presets-header">
                                                <span className="cms-spacing-presets-label">Presets</span>
                                            <div className="cms-chip-group" style={{ flexWrap: 'nowrap' }}>
                                                {[
                                                    { label: 'Compact', x: 8, y: 8 },
                                                    { label: 'Normal', x: 16, y: 16 },
                                                    { label: 'Aéré', x: 24, y: 24 },
                                                    { label: 'Large', x: 32, y: 32 },
                                                ].map(preset => (
                                                    <button
                                                        key={preset.label}
                                                        onClick={() => { updateField('paddingX', preset.x); updateField('paddingY', preset.y); }}
                                                        className={`cms-chip cms-chip--sm ${(sectionProps.paddingX || 0) === preset.x && (sectionProps.paddingY || 0) === preset.y
                                                            ? 'cms-chip--active' : ''}`}
                                                        title={preset.label}
                                                    >
                                                        {preset.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        </div>
                                        <div className="cms-field-pair">
                                            <NumberInput
                                                label="↕ Vertical"
                                                value={sectionProps.paddingY || 0}
                                                onChange={(v) => updateField('paddingY', v)}
                                                suffix="px"
                                                min={0}
                                                max={200}
                                                step={8}
                                            />
                                            <NumberInput
                                                label="↔ Horizontal"
                                                value={sectionProps.paddingX || 0}
                                                onChange={(v) => updateField('paddingX', v)}
                                                suffix="px"
                                                min={0}
                                                max={200}
                                                step={8}
                                            />
                                        </div>

                                        {/* ═══ Visual Spacing Editor §113 — contrôle individuel par côté ═══ */}
                                        <div className="cms-spacing-visual-editor">
                                            <div className="cms-spacing-visual-editor__header">
                                                <span className="cms-spacing-visual-editor__title">
                                                    <Grid3x3 className="cms-icon--xs" /> Contrôle individuel
                                                </span>
                                                <button
                                                    className="cms-spacing-visual-editor__unlink"
                                                    onClick={() => {
                                                        const v = sectionProps.paddingY || 16;
                                                        const h = sectionProps.paddingX || 16;
                                                        updateField('paddingTop', v);
                                                        updateField('paddingRight', h);
                                                        updateField('paddingBottom', v);
                                                        updateField('paddingLeft', h);
                                                    }}
                                                >
                                                    <RefreshCw className="cms-icon--xs" /> Sync
                                                </button>
                                            </div>
                                            {/* Padding box model visual */}
                                            <div className="cms-spacing-visual-editor__diagram">
                                                <div className="cms-spacing-visual-editor__outer">
                                                    <span className="cms-spacing-visual-editor__side cms-spacing-visual-editor__side--top"
                                                        onClick={() => {
                                                            const v = (sectionProps.paddingTop ?? sectionProps.paddingY ?? 16) + 4;
                                                            updateField('paddingTop', v);
                                                        }}
                                                    >{(sectionProps.paddingTop ?? sectionProps.paddingY ?? 16)}</span>
                                                    <div className="cms-spacing-visual-editor__middle-row">
                                                        <span className="cms-spacing-visual-editor__side cms-spacing-visual-editor__side--left"
                                                            onClick={() => {
                                                                const v = (sectionProps.paddingLeft ?? sectionProps.paddingX ?? 16) + 4;
                                                                updateField('paddingLeft', v);
                                                            }}
                                                        >{(sectionProps.paddingLeft ?? sectionProps.paddingX ?? 16)}</span>
                                                        <div className="cms-spacing-visual-editor__content">
                                                            <span className="cms-spacing-visual-editor__content-label">Padding</span>
                                                        </div>
                                                        <span className="cms-spacing-visual-editor__side cms-spacing-visual-editor__side--right"
                                                            onClick={() => {
                                                                const v = (sectionProps.paddingRight ?? sectionProps.paddingX ?? 16) + 4;
                                                                updateField('paddingRight', v);
                                                            }}
                                                        >{(sectionProps.paddingRight ?? sectionProps.paddingX ?? 16)}</span>
                                                    </div>
                                                    <span className="cms-spacing-visual-editor__side cms-spacing-visual-editor__side--bottom"
                                                        onClick={() => {
                                                            const v = (sectionProps.paddingBottom ?? sectionProps.paddingY ?? 16) + 4;
                                                            updateField('paddingBottom', v);
                                                        }}
                                                    >{(sectionProps.paddingBottom ?? sectionProps.paddingY ?? 16)}</span>
                                                </div>
                                            </div>
                                            {/* Individual sliders */}
                                            <div className="cms-spacing-visual-editor__sliders">
                                                {[
                                                    { key: 'paddingTop', label: '↑ Haut', color: '#3b82f6', icon: '↑' },
                                                    { key: 'paddingRight', label: '→ Droite', color: '#8b5cf6', icon: '→' },
                                                    { key: 'paddingBottom', label: '↓ Bas', color: '#ec4899', icon: '↓' },
                                                    { key: 'paddingLeft', label: '← Gauche', color: '#f59e0b', icon: '←' },
                                                ].map(ctrl => (
                                                    <div className="cms-spacing-visual-editor__slider-row" key={ctrl.key}>
                                                        <span className="cms-spacing-visual-editor__slider-icon" style={{ color: ctrl.color }}>{ctrl.icon}</span>
                                                        <span className="cms-spacing-visual-editor__slider-label">{ctrl.label}</span>
                                                        <input
                                                            type="range" min={0} max={120} step={4}
                                                            value={sectionProps[ctrl.key] ?? sectionProps.paddingY ?? 16}
                                                            onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                            className="cms-range-pro-slider"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span className="cms-spacing-visual-editor__slider-value">{sectionProps[ctrl.key] ?? sectionProps.paddingY ?? 16}px</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Gap control */}
                                            <div className="cms-spacing-visual-editor__gap">
                                                <span className="cms-spacing-visual-editor__gap-label">Gap (espace entre éléments)</span>
                                                <div className="cms-spacing-visual-editor__gap-row">
                                                    <input
                                                        type="range" min={0} max={80} step={4}
                                                        value={sectionProps.gap || 16}
                                                        onChange={(e) => updateField('gap', parseInt(e.target.value))}
                                                        className="cms-range-pro-slider"
                                                        style={{ flex: 1 }}
                                                    />
                                                    <span className="cms-spacing-visual-editor__gap-value">{sectionProps.gap || 16}px</span>
                                                </div>
                                            </div>
                                            {/* Margin control */}
                                            <div className="cms-spacing-visual-editor__margin">
                                                <span className="cms-spacing-visual-editor__margin-label">Margin extérieur</span>
                                                <div className="cms-spacing-visual-editor__margin-row">
                                                    {[
                                                        { key: 'marginTop', label: '↑' },
                                                        { key: 'marginRight', label: '→' },
                                                        { key: 'marginBottom', label: '↓' },
                                                        { key: 'marginLeft', label: '←' },
                                                    ].map(ctrl => (
                                                        <div className="cms-spacing-visual-editor__margin-item" key={ctrl.key}>
                                                            <span className="cms-spacing-visual-editor__margin-item-label">{ctrl.label}</span>
                                                            <input
                                                                type="range" min={0} max={120} step={4}
                                                                value={sectionProps[ctrl.key] ?? 0}
                                                                onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                                className="cms-range-pro-slider"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <span className="cms-spacing-visual-editor__margin-item-value">{sectionProps[ctrl.key] ?? 0}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bordure section — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Square /></span>
                                            <span className="cms-prop-group__title">Bordure</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* Width selector */}
                                            <div className="cms-btn-group--mb">
                                            <div className="cms-chip-group" style={{ flexWrap: 'nowrap' }}>
                                            {['0', '1', '2', '4'].map(w => (
                                                <button
                                                    key={w}
                                                    onClick={() => updateField('borderWidth', w)}
                                                    className={`cms-chip cms-chip--sm flex-col gap-0.5 ${(sectionProps.borderWidth || '0') === w
                                                        ? 'cms-chip--active cms-chip--purple' : ''}`}
                                                >
                                                    <div className="cms-border-width-bar" style={{
                                                        height: w === '0' ? 0 : w === '1' ? 1 : w === '2' ? 2 : 4,
                                                    }} />
                                                    {w}px
                                                </button>
                                            ))}
                                        </div>
                                        </div>
                                        {/* Color + preview — cms-color-input */}
                                        <div className="cms-color-input-row">
                                            <div className="cms-color-input flex-1">
                                                <div
                                                    className="cms-color-input__swatch"
                                                    style={{ backgroundColor: sectionProps.borderColor || '#e5e7eb' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = sectionProps.borderColor || '#e5e7eb';
                                                        input.onchange = (e) => updateField('borderColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={sectionProps.borderColor || '#e5e7eb'}
                                                    onChange={(e) => updateField('borderColor', e.target.value)}
                                                    className="cms-color-input__hex"
                                                />
                                            </div>
                                            {/* Live border preview */}
                                            <div
                                                className="cms-border-live-preview"
                                                style={{
                                                    border: (sectionProps.borderWidth && sectionProps.borderWidth !== '0')
                                                        ? `${sectionProps.borderWidth}px solid ${sectionProps.borderColor || '#e5e7eb'}`
                                                        : '1px dashed #d1d5db',
                                                    borderRadius: `${Math.min(parseInt(sectionProps.borderRadius || '0'), 12)}px`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                    </div>
                                    {/* Rayon des coins — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--purple cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><RefreshCw /></span>
                                            <span className="cms-prop-group__title">Rayon des coins</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-action-row--no-margin">
                                            {[
                                                { value: '0', label: '0', px: '0px' },
                                                { value: '4', label: '4', px: '4px' },
                                                { value: '8', label: '8', px: '8px' },
                                                { value: '12', label: '12', px: '12px' },
                                                { value: '16', label: '16', px: '16px' },
                                                { value: '24', label: '24', px: '24px' },
                                                { value: '9999', label: '∞', px: '9999px' },
                                            ].map(r => (
                                                <button
                                                    key={r.value}
                                                    onClick={() => updateField('borderRadius', r.value)}
                                                    className={`cms-radius-btn ${(sectionProps.borderRadius || '0') === r.value ? 'cms-radius-btn--active' : ''}`}
                                                >
                                                    <div
                                                        className="cms-radius-btn__shape"
                                                        style={{ borderRadius: r.px }}
                                                    />
                                                    <span className="cms-radius-btn__label">{r.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </div>
                                    {/* Ombre section — Advanced Shadow Editor (§721) */}
                                    <div className="cms-prop-group cms-prop-group--amber cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Layers /></span>
                                            <span className="cms-prop-group__title">Ombre</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* Shadow presets grid */}
                                            <div className="cms-shadow-grid">
                                            {SHADOW_PRESETS.map(s => (
                                                <button
                                                    key={s.type}
                                                    onClick={() => updateField('boxShadow', s.type)}
                                                    className={`cms-shadow-card ${(sectionProps.boxShadow || 'none') === s.type ? 'cms-shadow-card--active' : ''}`}
                                                >
                                                    <div className="cms-shadow-card__preview" style={{ boxShadow: s.css }} />
                                                    <span className="cms-shadow-card__label">{s.label}</span>
                                                </button>
                                            ))}
                                            </div>
                                            {/* Advanced Shadow Editor — custom controls */}
                                            <div className="cms-shadow-editor" style={{ marginTop: 8 }}>
                                                <div
                                                    className="cms-shadow-editor__preview"
                                                    style={{
                                                        boxShadow: `${sectionProps.customShadowX || 0}px ${sectionProps.customShadowY || 4}px ${sectionProps.customShadowBlur || 12}px ${sectionProps.customShadowSpread || 0}px ${sectionProps.customShadowColor || 'rgba(0,0,0,0.1)'}`,
                                                    }}
                                                />
                                                <div className="cms-shadow-editor__controls">
                                                    {[
                                                        { label: 'X', key: 'customShadowX', min: -50, max: 50, def: '0' },
                                                        { label: 'Y', key: 'customShadowY', min: -50, max: 50, def: '4' },
                                                        { label: 'Flou', key: 'customShadowBlur', min: 0, max: 100, def: '12' },
                                                        { label: 'Spread', key: 'customShadowSpread', min: -50, max: 50, def: '0' },
                                                    ].map(ctrl => (
                                                        <div className="cms-shadow-editor__row" key={ctrl.key}>
                                                            <span className="cms-shadow-editor__label">{ctrl.label}</span>
                                                            <input
                                                                type="range" min={ctrl.min} max={ctrl.max} step={1}
                                                                value={parseInt(sectionProps[ctrl.key] || ctrl.def)}
                                                                onChange={(e) => updateField(ctrl.key, e.target.value)}
                                                                className="cms-shadow-editor__slider"
                                                                style={{ '--shadow-pct': `${((parseInt(sectionProps[ctrl.key] || ctrl.def) - ctrl.min) / (ctrl.max - ctrl.min)) * 100}%` } as React.CSSProperties}
                                                            />
                                                            <span className="cms-shadow-editor__value">{sectionProps[ctrl.key] || ctrl.def}px</span>
                                                        </div>
                                                    ))}
                                                    <div className="cms-shadow-editor__color-row">
                                                        <span className="cms-shadow-editor__label">Couleur</span>
                                                        <div
                                                            className="cms-shadow-editor__color-swatch"
                                                            style={{ backgroundColor: sectionProps.customShadowColor || '#000000' }}
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'color';
                                                                input.value = (sectionProps.customShadowColor || '#000000').startsWith('#') ? sectionProps.customShadowColor || '#000000' : '#000000';
                                                                input.onchange = (e) => updateField('customShadowColor', (e.target as HTMLInputElement).value);
                                                                input.click();
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={sectionProps.customShadowColor || '#000000'}
                                                            onChange={(e) => updateField('customShadowColor', e.target.value)}
                                                            className="cms-field-input-enhanced"
                                                            style={{ flex: 1, fontSize: 10, fontFamily: 'monospace' }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Color Harmony Generator §106 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--pink cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Palette /></span>
                                            <span className="cms-prop-group__title">Harmonies de couleurs</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-color-harmony">
                                                <div className="cms-color-harmony__header">
                                                    <span className="cms-color-harmony__title">
                                                        <Sparkles className="cms-icon--xs" /> Générateur de palettes
                                                    </span>
                                                </div>
                                                <div className="cms-color-harmony__base">
                                                    <input
                                                        type="color"
                                                        className="cms-color-harmony__base-input"
                                                        value={sectionProps.bgColor || '#3b82f6'}
                                                        onChange={(e) => updateField('bgColor', e.target.value)}
                                                    />
                                                    <span className="cms-color-harmony__base-label">Couleur de base</span>
                                                </div>
                                                <div className="cms-color-harmony__schemes">
                                                    {[
                                                        { name: 'Complémentaire', colors: ['#3b82f6', '#f59e0b'] },
                                                        { name: 'Triadique', colors: ['#3b82f6', '#ec4899', '#10b981'] },
                                                        { name: 'Analogues', colors: ['#3b82f6', '#6366f1', '#8b5cf6'] },
                                                        { name: 'Split-Complémentaire', colors: ['#3b82f6', '#f59e0b', '#ef4444'] },
                                                    ].map((scheme, i) => (
                                                        <div className="cms-color-harmony__scheme" key={i}>
                                                            <span className="cms-color-harmony__scheme-label">{scheme.name}</span>
                                                            <div className="cms-color-harmony__swatches">
                                                                {scheme.colors.map((color, j) => (
                                                                    <button
                                                                        key={j}
                                                                        className="cms-color-harmony__swatch"
                                                                        style={{ backgroundColor: color }}
                                                                        data-color={color}
                                                                        onClick={() => {
                                                                            updateField('bgColor', color);
                                                                            toast.success(`Couleur ${color} appliquée`);
                                                                        }}
                                                                        title={color}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Text Gradient Editor §107 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--violet cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Brush /></span>
                                            <span className="cms-prop-group__title">Dégradé de texte</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-text-gradient-editor">
                                                <div
                                                    className="cms-text-gradient-editor__preview"
                                                    style={{
                                                        background: `linear-gradient(${sectionProps.textGradientAngle || 135}deg, ${sectionProps.textGradientColor1 || '#3b82f6'}, ${sectionProps.textGradientColor2 || '#8b5cf6'})`,
                                                        WebkitBackgroundClip: 'text',
                                                        WebkitTextFillColor: 'transparent',
                                                        backgroundClip: 'text',
                                                    }}
                                                >
                                                    Texte avec dégradé
                                                </div>
                                                <div className="cms-text-gradient-editor__controls">
                                                    <div className="cms-text-gradient-editor__row">
                                                        <span className="cms-text-gradient-editor__label">Angle</span>
                                                        <input
                                                            type="range" min={0} max={360} step={15}
                                                            value={sectionProps.textGradientAngle || 135}
                                                            onChange={(e) => updateField('textGradientAngle', parseInt(e.target.value))}
                                                            className="cms-range-pro-slider"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span className="cms-text-gradient-editor__value">{sectionProps.textGradientAngle || 135}°</span>
                                                    </div>
                                                    <div className="cms-text-gradient-editor__row">
                                                        <span className="cms-text-gradient-editor__label">Couleurs</span>
                                                        <div className="cms-text-gradient-editor__colors">
                                                            <input
                                                                type="color"
                                                                className="cms-text-gradient-editor__color"
                                                                value={sectionProps.textGradientColor1 || '#3b82f6'}
                                                                onChange={(e) => updateField('textGradientColor1', e.target.value)}
                                                            />
                                                            <input
                                                                type="color"
                                                                className="cms-text-gradient-editor__color"
                                                                value={sectionProps.textGradientColor2 || '#8b5cf6'}
                                                                onChange={(e) => updateField('textGradientColor2', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="cms-text-gradient-editor__presets">
                                                    {[
                                                        { label: 'Océan', c1: '#3b82f6', c2: '#06b6d4', angle: 135 },
                                                        { label: 'Coucher', c1: '#f59e0b', c2: '#ef4444', angle: 135 },
                                                        { label: 'Forêt', c1: '#10b981', c2: '#3b82f6', angle: 135 },
                                                        { label: 'Nuit', c1: '#6366f1', c2: '#ec4899', angle: 135 },
                                                    ].map((preset, i) => (
                                                        <button
                                                            key={i}
                                                            className="cms-text-gradient-preset"
                                                            style={{
                                                                background: `linear-gradient(${preset.angle}deg, ${preset.c1}, ${preset.c2})`,
                                                                WebkitBackgroundClip: 'text',
                                                                WebkitTextFillColor: 'transparent',
                                                                backgroundClip: 'text',
                                                            }}
                                                            onClick={() => {
                                                                updateField('textGradientColor1', preset.c1);
                                                                updateField('textGradientColor2', preset.c2);
                                                                updateField('textGradientAngle', preset.angle);
                                                                toast.success(`Dégradé "${preset.label}" appliqué`);
                                                            }}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Background Pattern Editor §109 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--teal cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Grid3x3 /></span>
                                            <span className="cms-prop-group__title">Motifs de fond</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-bg-pattern-editor">
                                                <div className="cms-bg-pattern-grid">
                                                    {[
                                                        { id: 'none', label: 'Aucun', bg: 'white' },
                                                        { id: 'dots', label: 'Points', bg: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', size: '20px 20px' },
                                                        { id: 'grid', label: 'Grille', bg: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', size: '20px 20px' },
                                                        { id: 'diagonal', label: 'Diagonales', bg: 'repeating-linear-gradient(45deg, #cbd5e1, #cbd5e1 1px, transparent 1px, transparent 10px)', size: '10px 10px' },
                                                        { id: 'zigzag', label: 'Zigzag', bg: 'linear-gradient(135deg, #cbd5e1 25%, transparent 25%), linear-gradient(225deg, #cbd5e1 25%, transparent 25%)', size: '10px 10px' },
                                                        { id: 'waves', label: 'Vagues', bg: 'radial-gradient(ellipse at 50% 0%, #cbd5e1 50%, transparent 50%)', size: '20px 10px' },
                                                        { id: 'cross', label: 'Croix', bg: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%)', size: '10px 10px' },
                                                        { id: 'stripes', label: 'Rayures', bg: 'repeating-linear-gradient(90deg, #cbd5e1, #cbd5e1 1px, transparent 1px, transparent 10px)', size: '10px 10px' },
                                                    ].map((pattern, i) => (
                                                        <button
                                                            key={i}
                                                            className={`cms-bg-pattern-btn ${(sectionProps.bgPattern || 'none') === pattern.id ? 'cms-bg-pattern-btn--active' : ''}`}
                                                            onClick={() => {
                                                                updateField('bgPattern', pattern.id);
                                                                if (pattern.id !== 'none') {
                                                                    updateField('bgImage', pattern.bg);
                                                                    updateField('bgSize', pattern.size);
                                                                } else {
                                                                    updateField('bgImage', '');
                                                                }
                                                                toast.success(`Motif "${pattern.label}" appliqué`);
                                                            }}
                                                        >
                                                            <div
                                                                className="cms-bg-pattern-btn__preview"
                                                                style={{
                                                                    background: pattern.id === 'none' ? 'white' : pattern.bg,
                                                                    backgroundSize: pattern.size || 'auto',
                                                                }}
                                                            />
                                                            <span className="cms-bg-pattern-btn__label">{pattern.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Filter Effects Editor §110 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Contrast /></span>
                                            <span className="cms-prop-group__title">Filtres CSS</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-filter-editor">
                                                <div
                                                    className="cms-filter-editor__preview"
                                                    style={{
                                                        filter: `
                                                            brightness(${(sectionProps.filterBrightness ?? 100) / 100})
                                                            contrast(${(sectionProps.filterContrast ?? 100) / 100})
                                                            saturate(${(sectionProps.filterSaturate ?? 100) / 100})
                                                            hue-rotate(${sectionProps.filterHue || 0}deg)
                                                            blur(${sectionProps.filterBlur || 0}px)
                                                        `.replace(/\s+/g, ' ').trim(),
                                                    }}
                                                >
                                                    Aperçu filtres
                                                </div>
                                                <div className="cms-filter-editor__controls">
                                                    {[
                                                        { key: 'filterBrightness', label: 'Luminosité', min: 0, max: 200, def: 100, unit: '%' },
                                                        { key: 'filterContrast', label: 'Contraste', min: 0, max: 200, def: 100, unit: '%' },
                                                        { key: 'filterSaturate', label: 'Saturation', min: 0, max: 300, def: 100, unit: '%' },
                                                        { key: 'filterHue', label: 'Teinte', min: 0, max: 360, def: 0, unit: '°' },
                                                        { key: 'filterBlur', label: 'Flou', min: 0, max: 20, def: 0, unit: 'px' },
                                                    ].map(ctrl => (
                                                        <div className="cms-filter-editor__row" key={ctrl.key}>
                                                            <span className="cms-filter-editor__label">{ctrl.label}</span>
                                                            <input
                                                                type="range" min={ctrl.min} max={ctrl.max} step={ctrl.key === 'filterBlur' ? 1 : 5}
                                                                value={sectionProps[ctrl.key] ?? ctrl.def}
                                                                onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                                className="cms-range-pro-slider"
                                                                style={{ flex: 1 }}
                                                            />
                                                            <span className="cms-filter-editor__value">{sectionProps[ctrl.key] ?? ctrl.def}{ctrl.unit}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="cms-filter-presets">
                                                    {[
                                                        { label: 'Normal', bright: 100, contrast: 100, saturate: 100, hue: 0, blur: 0 },
                                                        { label: 'Vivid', bright: 110, contrast: 120, saturate: 150, hue: 0, blur: 0 },
                                                        { label: 'Doux', bright: 105, contrast: 90, saturate: 80, hue: 0, blur: 0 },
                                                        { label: 'Vintage', bright: 110, contrast: 85, saturate: 70, hue: 15, blur: 0 },
                                                        { label: 'N&B', bright: 100, contrast: 120, saturate: 0, hue: 0, blur: 0 },
                                                        { label: 'Flou', bright: 100, contrast: 100, saturate: 100, hue: 0, blur: 4 },
                                                    ].map((preset, i) => (
                                                        <button
                                                            key={i}
                                                            className="cms-filter-preset-btn"
                                                            onClick={() => {
                                                                updateField('filterBrightness', preset.bright);
                                                                updateField('filterContrast', preset.contrast);
                                                                updateField('filterSaturate', preset.saturate);
                                                                updateField('filterHue', preset.hue);
                                                                updateField('filterBlur', preset.blur);
                                                                toast.success(`Filtre "${preset.label}" appliqué`);
                                                            }}
                                                        >
                                                            {preset.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB: BOUTON ═══ */}
                            {activeTab === 'bouton' && (
                                <div className="cms-tab-content--spaced cms-tab-content-enter">
                                    {/* Live button preview — rendu CSS réel */}
                                    <div className="cms-button-live-preview">
                                        <button style={{
                                            background: sectionProps.boutonBgColor || '#2563eb',
                                            color: sectionProps.boutonTextColor || '#ffffff',
                                            borderRadius: ({
                                                'none': '0px', 'sm': '4px', 'md': '8px', 'lg': '12px', 'xl': '16px', 'full': '9999px',
                                            } as Record<string, string>)[sectionProps.boutonBorderRadius || 'md'] || '8px',
                                            padding: ({
                                                'xs': '4px 8px', 'sm': '6px 12px', 'md': '8px 16px', 'lg': '12px 24px', 'xl': '16px 32px',
                                            } as Record<string, string>)[sectionProps.boutonSize || 'md'] || '8px 16px',
                                            fontSize: ({
                                                'xs': '10px', 'sm': '12px', 'md': '14px', 'lg': '16px', 'xl': '18px',
                                            } as Record<string, string>)[sectionProps.boutonSize || 'md'] || '14px',
                                            fontWeight: 600,
                                            border: sectionProps.boutonBorderWidth && sectionProps.boutonBorderWidth !== '0'
                                                ? `${sectionProps.boutonBorderWidth}px solid ${sectionProps.boutonBorderColor || (sectionProps.boutonVariant === 'outline' ? (sectionProps.boutonBgColor || '#2563eb') : 'transparent')}`
                                                : (sectionProps.boutonVariant === 'outline' ? `2px solid ${sectionProps.boutonBgColor || '#2563eb'}` : 'none'),
                                            boxShadow: sectionProps.boutonVariant === 'elevated' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
                                            width: sectionProps.boutonFullWidth ? '100%' : undefined,
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                            letterSpacing: '0.01em',
                                        }}>
                                            {sectionProps.boutonTexte || sectionProps.boutonLabel || 'Cliquez ici'}
                                        </button>
                                    </div>

                                    {/* Button style presets — grille visuelle */}
                                    <div className="cms-button-presets-container">
                                        <div className="cms-button-presets-label">
                                            <Sparkles className="cms-icon--xs" /> Presets de style
                                        </div>
                                        <div className="cms-button-presets-grid-v2">
                                            {[
                                                { label: 'Primaire', bg: '#2563eb', color: '#ffffff', radius: '6px', shadow: 'none' },
                                                { label: 'Secondaire', bg: '#f1f5f9', color: '#334155', radius: '6px', shadow: 'none' },
                                                { label: 'Outline', bg: 'transparent', color: '#2563eb', radius: '6px', shadow: 'none', border: '2px solid #2563eb' },
                                                { label: 'Pill', bg: '#2563eb', color: '#ffffff', radius: '9999px', shadow: 'none' },
                                                { label: 'Shadow', bg: '#2563eb', color: '#ffffff', radius: '8px', shadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
                                                { label: 'Ghost', bg: 'transparent', color: '#2563eb', radius: '6px', shadow: 'none', border: 'none', underline: true },
                                                { label: 'Dark', bg: '#0f172a', color: '#e2e8f0', radius: '8px', shadow: 'none' },
                                                { label: 'Success', bg: '#16a34a', color: '#ffffff', radius: '6px', shadow: 'none' },
                                                { label: 'Gradient', bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#ffffff', radius: '8px', shadow: '0 4px 6px rgba(0,0,0,0.1)' },
                                            ].map((preset, i) => (
                                                <button
                                                    key={i}
                                                    className="cms-button-preset-v2"
                                                    onClick={() => {
                                                        updateField('boutonBgColor', preset.bg);
                                                        updateField('boutonTextColor', preset.color);
                                                        updateField('boutonBorderRadius', preset.radius === '9999px' ? 'full' : preset.radius === '8px' ? 'lg' : preset.radius === '6px' ? 'md' : 'md');
                                                        if (preset.border) {
                                                            updateField('boutonBorderWidth', '2');
                                                            updateField('boutonBorderColor', preset.bg === 'transparent' ? '#2563eb' : preset.bg);
                                                        }
                                                    }}
                                                    title={preset.label}
                                                >
                                                    <span
                                                        className="cms-button-preset-v2__preview"
                                                        style={{
                                                            background: preset.bg,
                                                            color: preset.color,
                                                            borderRadius: preset.radius,
                                                            boxShadow: preset.shadow,
                                                            border: preset.border || 'none',
                                                            textDecoration: preset.underline ? 'underline' : 'none',
                                                        }}
                                                    >
                                                        Btn
                                                    </span>
                                                    <span className="cms-button-preset-v2__label">{preset.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Variant — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--purple cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><MousePointerClick /></span>
                                            <span className="cms-prop-group__title">Variant</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-btn-variant-grid">
                                                {BUTTON_STYLES.map(style => (
                                                    <button
                                                        key={style.value}
                                                        onClick={() => updateField('boutonVariant', style.value)}
                                                        className={`cms-btn-variant-btn ${(sectionProps.boutonVariant || 'primary') === style.value ? 'cms-btn-variant-btn--active' : ''} ${style.preview}`}
                                                        title={style.label}
                                                    >
                                                        Aa
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Taille — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--blue cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Maximize2 /></span>
                                            <span className="cms-prop-group__title">Taille</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-btn-size-grid">
                                                {BUTTON_SIZE_OPTIONS.map(size => (
                                                    <button
                                                        key={size.value}
                                                        onClick={() => updateField('boutonSize', size.value)}
                                                        className={`cms-btn-size-btn ${(sectionProps.boutonSize || 'md') === size.value ? 'cms-btn-size-btn--active' : ''}`}
                                                    >
                                                        <span className="cms-btn-size-btn__label">{size.label}</span>
                                                        <span className="cms-btn-size-btn__desc">{size.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Couleur fond — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--rose cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Palette /></span>
                                            <span className="cms-prop-group__title">Couleur fond</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-color-input">
                                                <div
                                                    className="cms-color-input__swatch"
                                                    style={{ backgroundColor: sectionProps.boutonBgColor || '#2563eb' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = sectionProps.boutonBgColor || '#2563eb';
                                                        input.onchange = (e) => updateField('boutonBgColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={sectionProps.boutonBgColor || '#2563eb'}
                                                    onChange={(e) => updateField('boutonBgColor', e.target.value)}
                                                    className="cms-color-input__hex"
                                                    placeholder="#000000"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = sectionProps.boutonBgColor || '#2563eb';
                                                        input.onchange = (e) => updateField('boutonBgColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                    className="cms-color-input__eyedropper"
                                                    title="Sélecteur de couleur"
                                                >
                                                    <Pipette className="cms-icon--sm" />
                                                </button>
                                            </div>
                                            <div className="cms-color-swatches">
                                                {['#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#111827', '#ffffff', '#0d9488'].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => updateField('boutonBgColor', c)}
                                                        className={`cms-color-swatch ${(sectionProps.boutonBgColor || '#2563eb') === c ? 'cms-color-swatch--active' : ''}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                            {/* §771 — Gradient Editor Advanced */}
                                            <div className="cms-gradient-editor-advanced" style={{ marginTop: 12 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                                    <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#475569' }}>Dégradé avancé</span>
                                                    <button
                                                        onClick={() => {
                                                            const gradient = `linear-gradient(${sectionProps.gradientAngle || 135}deg, ${sectionProps.gradientColor1 || '#2563eb'} 0%, ${sectionProps.gradientColor2 || '#7c3aed'} 100%)`;
                                                            updateField('boutonBgColor', gradient);
                                                            toast.success('Dégradé appliqué');
                                                        }}
                                                        className="cms-gradient-apply-btn"
                                                        title="Appliquer le dégradé"
                                                    >
                                                        <Sparkles className="cms-icon--xs" />
                                                        Appliquer
                                                    </button>
                                                </div>
                                                {/* Gradient preview */}
                                                <div
                                                    className="cms-gradient-preview-advanced"
                                                    style={{
                                                        background: `linear-gradient(${sectionProps.gradientAngle || 135}deg, ${sectionProps.gradientColor1 || '#2563eb'} 0%, ${sectionProps.gradientColor2 || '#7c3aed'} 100%)`,
                                                    }}
                                                />
                                                {/* Angle control */}
                                                <div className="cms-gradient-row">
                                                    <span className="cms-gradient-label">Angle</span>
                                                    <input
                                                        type="range"
                                                        min={0}
                                                        max={360}
                                                        step={15}
                                                        value={sectionProps.gradientAngle || 135}
                                                        onChange={(e) => updateField('gradientAngle', e.target.value)}
                                                        className="cms-range-pro-slider"
                                                    />
                                                    <span className="cms-gradient-value">{sectionProps.gradientAngle || 135}°</span>
                                                </div>
                                                {/* Color stops */}
                                                <div className="cms-gradient-row">
                                                    <span className="cms-gradient-label">Début</span>
                                                    <div className="cms-gradient-color-input">
                                                        <input
                                                            type="color"
                                                            value={sectionProps.gradientColor1 || '#2563eb'}
                                                            onChange={(e) => updateField('gradientColor1', e.target.value)}
                                                            className="cms-gradient-color-picker"
                                                        />
                                                        <span className="cms-gradient-color-hex">{sectionProps.gradientColor1 || '#2563eb'}</span>
                                                    </div>
                                                </div>
                                                <div className="cms-gradient-row">
                                                    <span className="cms-gradient-label">Fin</span>
                                                    <div className="cms-gradient-color-input">
                                                        <input
                                                            type="color"
                                                            value={sectionProps.gradientColor2 || '#7c3aed'}
                                                            onChange={(e) => updateField('gradientColor2', e.target.value)}
                                                            className="cms-gradient-color-picker"
                                                        />
                                                        <span className="cms-gradient-color-hex">{sectionProps.gradientColor2 || '#7c3aed'}</span>
                                                    </div>
                                                </div>
                                                {/* Gradient presets */}
                                                <div className="cms-gradient-presets-grid">
                                                    {[
                                                        { name: 'Océan', from: '#0ea5e9', to: '#2563eb', angle: 135 },
                                                        { name: 'Coucher', from: '#f97316', to: '#ec4899', angle: 135 },
                                                        { name: 'Forêt', from: '#059669', to: '#34d399', angle: 135 },
                                                        { name: 'Nuit', from: '#1e1b4b', to: '#312e81', angle: 180 },
                                                        { name: 'Flamme', from: '#ea580c', to: '#fbbf24', angle: 90 },
                                                        { name: 'Aurore', from: '#7c3aed', to: '#ec4899', angle: 135 },
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.name}
                                                            onClick={() => {
                                                                updateField('gradientColor1', preset.from);
                                                                updateField('gradientColor2', preset.to);
                                                                updateField('gradientAngle', preset.angle);
                                                                toast.success(`Dégradé ${preset.name}`);
                                                            }}
                                                            className="cms-gradient-preset-btn"
                                                            style={{
                                                                background: `linear-gradient(${preset.angle}deg, ${preset.from} 0%, ${preset.to} 100%)`,
                                                            }}
                                                            title={preset.name}
                                                        >
                                                            <span className="cms-gradient-preset-label">{preset.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Couleur texte — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Type /></span>
                                            <span className="cms-prop-group__title">Couleur texte</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-color-input">
                                                <div
                                                    className="cms-color-input__swatch"
                                                    style={{ backgroundColor: sectionProps.boutonTextColor || '#ffffff' }}
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = sectionProps.boutonTextColor || '#ffffff';
                                                        input.onchange = (e) => updateField('boutonTextColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                />
                                                <input
                                                    type="text"
                                                    value={sectionProps.boutonTextColor || '#ffffff'}
                                                    onChange={(e) => updateField('boutonTextColor', e.target.value)}
                                                    className="cms-color-input__hex"
                                                    placeholder="#ffffff"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const input = document.createElement('input');
                                                        input.type = 'color';
                                                        input.value = sectionProps.boutonTextColor || '#ffffff';
                                                        input.onchange = (e) => updateField('boutonTextColor', (e.target as HTMLInputElement).value);
                                                        input.click();
                                                    }}
                                                    className="cms-color-input__eyedropper"
                                                    title="Sélecteur de couleur"
                                                >
                                                    <Pipette className="cms-icon--sm" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rayon des coins — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--amber cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><RefreshCw /></span>
                                            <span className="cms-prop-group__title">Rayon des coins</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-action-row--no-margin">
                                                {BUTTON_RADIUS_OPTIONS.map(r => (
                                                    <button
                                                        key={r.value}
                                                        onClick={() => updateField('boutonBorderRadius', r.value)}
                                                        className={`cms-hover-lift flex flex-1 flex-col items-center gap-0.5 rounded-md border py-1.5 transition-all ${
                                                            (sectionProps.boutonBorderRadius || 'md') === r.value
                                                                ? 'border-amber-300 bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                                                                : 'border-gray-100 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div
                                                            className="cms-inline-border-preview"
                                                            style={{ borderRadius: r.css }}
                                                        />
                                                        <span className="cms-inline-range-label">{r.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bordure — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--emerald cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Square /></span>
                                            <span className="cms-prop-group__title">Bordure</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-field-pair">
                                                <div>
                                                    <label className="cms-inline-field-label">Épaisseur</label>
                                                    <div className="cms-btn-group">
                                                        {['0', '1', '2'].map(w => (
                                                            <button
                                                                key={w}
                                                                onClick={() => updateField('boutonBorderWidth', w)}
                                                                className={`cms-inline-border-btn ${
                                                                    (sectionProps.boutonBorderWidth || '0') === w
                                                                        ? 'cms-inline-border-btn--active'
                                                                        : 'cms-inline-border-btn--inactive'
                                                                }`}
                                                            >
                                                                {w}px
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="cms-inline-field-label">Couleur</label>
                                                    <div className="cms-color-input">
                                                        <div
                                                            className="cms-color-input__swatch"
                                                            style={{ backgroundColor: sectionProps.boutonBorderColor || '#2563eb' }}
                                                            onClick={() => {
                                                                const input = document.createElement('input');
                                                                input.type = 'color';
                                                                input.value = sectionProps.boutonBorderColor || '#2563eb';
                                                                input.onchange = (e) => updateField('boutonBorderColor', (e.target as HTMLInputElement).value);
                                                                input.click();
                                                            }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={sectionProps.boutonBorderColor || '#2563eb'}
                                                            onChange={(e) => updateField('boutonBorderColor', e.target.value)}
                                                            className="cms-color-input__hex"
                                                            placeholder="#2563eb"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ombre — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--gray cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Layers /></span>
                                            <span className="cms-prop-group__title">Ombre</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-shadow-grid">
                                                {SHADOW_PRESETS.slice(0, 6).map(s => (
                                                    <button
                                                        key={s.type}
                                                        onClick={() => updateField('boutonShadow', s.type)}
                                                        className={`cms-shadow-card ${(sectionProps.boutonShadow || 'none') === s.type ? 'cms-shadow-card--active' : ''}`}
                                                    >
                                                        <div className="cms-shadow-card__preview" style={{ boxShadow: s.css }} />
                                                        <span className="cms-shadow-card__label">{s.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Aperçu bouton */}
                                    <div className="cms-live-preview">
                                        <div className="cms-live-preview__header">
                                            <span className="cms-inline-preview-header">
                                                <Eye /> Aperçu
                                            </span>
                                        </div>
                                        <div className="cms-editor-flex-center">
                                            <button
                                                className="cms-inline-preview-btn"
                                                style={{
                                                    backgroundColor: sectionProps.boutonBgColor || '#2563eb',
                                                    color: sectionProps.boutonTextColor || '#ffffff',
                                                    borderRadius: BUTTON_RADIUS_OPTIONS.find(r => r.value === (sectionProps.boutonBorderRadius || 'md'))?.css || '8px',
                                                    border: (sectionProps.boutonBorderWidth || '0') !== '0'
                                                        ? `${sectionProps.boutonBorderWidth}px solid ${sectionProps.boutonBorderColor || '#2563eb'}`
                                                        : 'none',
                                                    boxShadow: SHADOW_PRESETS.find(s => s.type === (sectionProps.boutonShadow || 'none'))?.css || 'none',
                                                }}
                                            >
                                                {sectionProps.boutonTexte || sectionProps.boutonLabel || 'Bouton exemple'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* ═══ Lien du bouton — éditeur dédié ═══ */}
                                    <div className="cms-prop-group cms-prop-group--blue cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Link2 /></span>
                                            <span className="cms-prop-group__title">Lien</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* URL input avec validation */}
                                            <div className="cms-link-editor__field">
                                                <div className="cms-inline-link-field">
                                                    <Globe />
                                                    <input
                                                        type="text"
                                                        value={sectionProps.boutonLien || sectionProps.lien || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const lienKey = sectionProps.boutonLien !== undefined ? 'boutonLien' : 'lien';
                                                            updateField(lienKey, val);
                                                        }}
                                                        className="cms-link-editor__input"
                                                        placeholder="https://exemple.com ou /page"
                                                    />
                                                </div>
                                                {sectionProps.boutonLien && !isValidUrl(sectionProps.boutonLien) && (
                                                    <span className="cms-link-editor__error">URL invalide — ajoutez https:// ou utilisez /page</span>
                                                )}
                                            </div>
                                            {/* Target selector */}
                                            <div className="cms-link-editor__targets">
                                                {LINK_TARGETS.map(t => (
                                                    <button
                                                        key={t.value}
                                                        onClick={() => {
                                                            const targetKey = sectionProps.boutonTarget !== undefined ? 'boutonTarget' : 'lienTarget';
                                                            updateField(targetKey, t.value);
                                                        }}
                                                        className={`cms-link-editor__target-btn ${(sectionProps.boutonTarget || sectionProps.lienTarget || '_self') === t.value ? 'cms-link-editor__target-btn--active' : ''}`}
                                                        title={t.desc}
                                                    >
                                                        {t.icon} {t.label}
                                                    </button>
                                                ))}
                                            </div>
                                            {/* Quick link protocols */}
                                            <div className="cms-action-chips">
                                                {URL_PROTOCOLS.map(p => (
                                                    <button
                                                        key={p.value}
                                                        className="cms-action-chip"
                                                        onClick={() => {
                                                            const lienKey = sectionProps.boutonLien !== undefined ? 'boutonLien' : 'lien';
                                                            const current = sectionProps[lienKey] || '';
                                                            if (!current.startsWith(p.value)) {
                                                                updateField(lienKey, p.value + current);
                                                            }
                                                        }}
                                                    >
                                                        {p.label}
                                                    </button>
                                                ))}
                                                <button
                                                    className="cms-action-chip"
                                                    onClick={() => {
                                                        const lienKey = sectionProps.boutonLien !== undefined ? 'boutonLien' : 'lien';
                                                        updateField(lienKey, '');
                                                        toast.success('Lien supprimé');
                                                    }}
                                                >
                                                    ✕ Retirer
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Presets rapides bouton */}
                                    <div className="cms-action-chips">
                                        {[
                                            { label: 'Primaire', bg: '#2563eb', text: '#ffffff', radius: 'md', shadow: 'sm' },
                                            { label: 'Succès', bg: '#16a34a', text: '#ffffff', radius: 'md', shadow: 'sm' },
                                            { label: 'Danger', bg: '#dc2626', text: '#ffffff', radius: 'md', shadow: 'sm' },
                                            { label: 'Avertissement', bg: '#ea580c', text: '#ffffff', radius: 'md', shadow: 'sm' },
                                            { label: 'Fantôme', bg: 'transparent', text: '#2563eb', radius: 'md', shadow: 'none', borderW: '1', borderC: '#2563eb' },
                                            { label: 'Arrondi', bg: '#7c3aed', text: '#ffffff', radius: 'full', shadow: 'md' },
                                        ].map(preset => (
                                            <button
                                                key={preset.label}
                                                className="cms-action-chip"
                                                onClick={() => {
                                                    updateField('boutonBgColor', preset.bg);
                                                    updateField('boutonTextColor', preset.text);
                                                    updateField('boutonBorderRadius', preset.radius);
                                                    updateField('boutonShadow', preset.shadow);
                                                    if (preset.borderW) updateField('boutonBorderWidth', preset.borderW);
                                                    if (preset.borderC) updateField('boutonBorderColor', preset.borderC);
                                                    toast.success(`Style "${preset.label}" appliqué`);
                                                }}
                                            >
                                                <span
                                                    className="cms-action-chip__icon rounded-sm"
                                                    style={{ backgroundColor: preset.bg === 'transparent' ? 'transparent' : preset.bg, border: preset.bg === 'transparent' ? '1px solid #2563eb' : 'none' }}
                                                />
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB: EFFETS VISUELS — Enhanced with live preview ═══ */}
                            {activeTab === 'effets' && (
                                <div className="cms-tab-content--spaced cms-tab-content-enter">
                                    {/* Live preview strip — shows current effect applied */}
                                    <div className="cms-live-preview">
                                        <div className="cms-live-preview__header">
                                            <span className="cms-inline-preview-header">
                                                <Eye /> Aperçu live
                                            </span>
                                            <span className="cms-inline-effect-label" style={{ color: '#9ca3af', fontFamily: 'ui-monospace, monospace' }}>
                                                {VISUAL_EFFECTS.find(e => 
                                                    e.config.bgColor === sectionProps.bgColor && 
                                                    e.config.textColor === sectionProps.textColor
                                                )?.label || 'Custom'}
                                            </span>
                                        </div>
                                        <div
                                            className="cms-inline-preview-body"
                                            style={{
                                                background: sectionProps.bgColor || '#ffffff',
                                                color: sectionProps.textColor || '#111827',
                                                borderRadius: `${sectionProps.borderRadius || 0}px`,
                                                border: sectionProps.borderWidth ? `${sectionProps.borderWidth}px solid ${sectionProps.borderColor || '#e5e7eb'}` : '1px solid rgba(0,0,0,0.05)',
                                                boxShadow: sectionProps.boxShadow === 'lg' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : sectionProps.boxShadow === 'md' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : sectionProps.boxShadow === 'xl' ? '0 20px 25px -5px rgba(0,0,0,0.1)' : sectionProps.boxShadow === 'glow' ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
                                            }}
                                        >
                                            <div className="cms-inline-preview-body__content">
                                                <div className="cms-inline-preview-card__title">{sectionProps.titre || 'Titre exemple'}</div>
                                                <div className="cms-inline-preview-card__desc">{sectionProps.description || 'Description texte...'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Presets d'effets visuels — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--purple cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Wand2 /></span>
                                            <span className="cms-prop-group__title">Effets rapides</span>
                                            <span className="cms-inline-preset-badge">{VISUAL_EFFECTS.length} presets</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                        <div className="cms-inline-effect-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                                            {VISUAL_EFFECTS.map(effect => {
                                                const isActive = effect.config.bgColor === sectionProps.bgColor && effect.config.textColor === sectionProps.textColor;
                                                return (
                                                    <button
                                                        key={effect.id}
                                                        onClick={() => {
                                                            Object.entries(effect.config).forEach(([key, val]) => updateField(key, val));
                                                            if (effect.id !== 'none') toast.success(`Effet "${effect.label}" appliqu\u00e9`);
                                                        }}
                                                        className={`cms-effect-card-enhanced ${isActive ? 'cms-effect-card-enhanced--active' : ''}`}
                                                        title={effect.label}
                                                    >
                                                        {/* Live preview swatch */}
                                                        <div
                                                            className="cms-effect-card-enhanced__preview"
                                                            style={{
                                                                background: effect.config.bgColor || '#ffffff',
                                                                boxShadow: effect.config.boxShadow === 'lg' ? '0 4px 8px rgba(0,0,0,0.1)' : effect.config.boxShadow === 'md' ? '0 2px 4px rgba(0,0,0,0.08)' : effect.config.boxShadow === 'xl' ? '0 8px 16px rgba(0,0,0,0.12)' : effect.config.boxShadow === 'glow' ? '0 0 12px rgba(59,130,246,0.3)' : 'none',
                                                                borderRadius: effect.config.borderRadius ? `${effect.config.borderRadius}px` : '4px',
                                                                border: effect.config.borderWidth ? `${effect.config.borderWidth}px solid ${effect.config.borderColor || '#e5e7eb'}` : '1px solid rgba(0,0,0,0.04)',
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                                                <span style={{ color: effect.config.textColor || '#666', fontSize: '10px', fontWeight: 600 }}>Aa</span>
                                                            </div>
                                                        </div>
                                                        <span className="cms-effect-card-enhanced__label">{effect.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    </div>

                                    {/* Animations CSS — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--indigo cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sparkles /></span>
                                            <span className="cms-prop-group__title">Animation d'entr\u00e9e</span>
                                            <span className="cms-inline-effect-hint">Survolez</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                        {/* Keyframes injectés dans le DOM */}
                                        <style dangerouslySetInnerHTML={{ __html: ANIMATION_KEYFRAMES }} />
                                        <div className="cms-inline-anim-grid">
                                            {[
                                                { id: 'none', label: 'Aucune', css: '', icon: '\u2298' },
                                                { id: 'fade', label: 'Fondu', css: 'cmsPrevFade 0.6s ease', icon: '\u25d0' },
                                                { id: 'slide-up', label: '\u2191 Slide', css: 'cmsPrevSlideUp 0.5s ease', icon: '\u2191' },
                                                { id: 'slide-down', label: '\u2193 Slide', css: 'cmsPrevSlideDown 0.5s ease', icon: '\u2193' },
                                                { id: 'slide-left', label: '\u2190 Slide', css: 'cmsPrevSlideLeft 0.5s ease', icon: '\u2190' },
                                                { id: 'scale', label: 'Zoom', css: 'cmsPrevScale 0.4s ease', icon: '\u2922' },
                                                { id: 'bounce', label: 'Rebond', css: 'cmsPrevBounce 0.6s ease', icon: '\u25cb' },
                                                { id: 'rotate', label: 'Rotation', css: 'cmsPrevRotate 0.5s ease', icon: '\u21bb' },
                                                { id: 'flip', label: 'Flip', css: 'cmsPrevFlip 0.6s ease', icon: '\u21c4' },
                                                { id: 'blur', label: 'Flou', css: 'cmsPrevBlur 0.5s ease', icon: '\u25c9' },
                                                { id: 'elastic', label: '\u00c9lastique', css: 'cmsPrevElastic 0.6s ease', icon: '\u25c8' },
                                            ].map(anim => (
                                                <button
                                                    key={anim.id}
                                                    onClick={() => updateField('animation', anim.id)}
                                                    className={`cms-inline-anim-btn ${(sectionProps.animation || 'none') === anim.id ? 'cms-inline-anim-btn--active' : ''}`}
                                                    title={anim.label}
                                                >
                                                    {/* Preview box — plays animation on hover */}
                                                    <div
                                                        className="cms-inline-anim-btn__preview"
                                                        onMouseEnter={(e) => {
                                                            if (anim.css) {
                                                                (e.currentTarget.firstElementChild as HTMLElement).style.animation = 'none';
                                                                requestAnimationFrame(() => {
                                                                    (e.currentTarget.firstElementChild as HTMLElement).style.animation = anim.css;
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <span className="cms-inline-anim-btn__icon">{anim.icon}</span>
                                                    </div>
                                                    <span className="cms-inline-anim-btn__label">{anim.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </div>

                                    {/* ═══ Animation Timeline Control §114 — durée, delay, easing, iteration ═══ */}
                                    <div className="cms-prop-group cms-prop-group--teal cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Timer className="cms-icon--sm" /></span>
                                            <span className="cms-prop-group__title">Timeline animation</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateField('animDuration', 0.6);
                                                    updateField('animDelay', 0);
                                                    updateField('animEasing', 'ease');
                                                    updateField('animIteration', '1');
                                                    updateField('animDirection', 'normal');
                                                    updateField('animFillMode', 'forwards');
                                                }}
                                                className="cms-icon-text cms-icon-text--sm cms-icon-text--right"
                                            >
                                                <RefreshCw className="cms-icon--xs" /> Reset
                                            </button>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-anim-timeline">
                                                {/* Timeline visual bar */}
                                                <div className="cms-anim-timeline__bar">
                                                    <div
                                                        className="cms-anim-timeline__progress"
                                                        style={{ width: `${Math.min(((sectionProps.animDuration || 0.6) / 3) * 100, 100)}%` }}
                                                    />
                                                    <div
                                                        className="cms-anim-timeline__delay-marker"
                                                        style={{ left: `${Math.min(((sectionProps.animDelay || 0) / 3) * 100, 95)}%` }}
                                                    />
                                                </div>
                                                {/* Duration + Delay */}
                                                <div className="cms-anim-timeline__row">
                                                    <div className="cms-anim-timeline__field">
                                                        <label className="cms-anim-timeline__label">Durée</label>
                                                        <input
                                                            type="range" min={0.1} max={3} step={0.1}
                                                            value={sectionProps.animDuration || 0.6}
                                                            onChange={(e) => updateField('animDuration', parseFloat(e.target.value))}
                                                            className="cms-range-pro-slider"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span className="cms-anim-timeline__value">{sectionProps.animDuration || 0.6}s</span>
                                                    </div>
                                                    <div className="cms-anim-timeline__field">
                                                        <label className="cms-anim-timeline__label">Délai</label>
                                                        <input
                                                            type="range" min={0} max={3} step={0.1}
                                                            value={sectionProps.animDelay || 0}
                                                            onChange={(e) => updateField('animDelay', parseFloat(e.target.value))}
                                                            className="cms-range-pro-slider"
                                                            style={{ flex: 1 }}
                                                        />
                                                        <span className="cms-anim-timeline__value">{sectionProps.animDelay || 0}s</span>
                                                    </div>
                                                </div>
                                                {/* Easing curve selector */}
                                                <div className="cms-anim-timeline__easing">
                                                    <label className="cms-anim-timeline__sublabel">Courbe d'accélération</label>
                                                    <div className="cms-anim-timeline__easing-grid">
                                                        {[
                                                            { id: 'linear', label: 'Linéaire', curve: 'linear' },
                                                            { id: 'ease', label: 'Ease', curve: 'ease' },
                                                            { id: 'ease-in', label: 'Ease In', curve: 'cubic-bezier(0.4, 0, 1, 1)' },
                                                            { id: 'ease-out', label: 'Ease Out', curve: 'cubic-bezier(0, 0, 0.2, 1)' },
                                                            { id: 'ease-in-out', label: 'In-Out', curve: 'cubic-bezier(0.4, 0, 0.2, 1)' },
                                                            { id: 'bounce', label: 'Rebond', curve: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
                                                            { id: 'elastic', label: 'Élastique', curve: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
                                                            { id: 'snap', label: 'Snap', curve: 'cubic-bezier(0, 1, 0.5, 1)' },
                                                        ].map(easing => (
                                                            <button
                                                                key={easing.id}
                                                                className={`cms-anim-easing-btn ${(sectionProps.animEasing || 'ease') === easing.id ? 'cms-anim-easing-btn--active' : ''}`}
                                                                onClick={() => updateField('animEasing', easing.id)}
                                                                title={easing.label}
                                                            >
                                                                {/* Mini curve visualization */}
                                                                <svg className="cms-anim-easing-btn__curve" viewBox="0 0 24 24" fill="none">
                                                                    <path
                                                                        d={easing.id === 'linear' ? 'M2 22 L22 2'
                                                                            : easing.id === 'ease' ? 'M2 22 C10 22 6 2 22 2'
                                                                            : easing.id === 'ease-in' ? 'M2 22 C14 22 20 10 22 2'
                                                                            : easing.id === 'ease-out' ? 'M2 22 C4 14 10 2 22 2'
                                                                            : easing.id === 'ease-in-out' ? 'M2 22 C10 22 14 2 22 2'
                                                                            : easing.id === 'bounce' ? 'M2 22 C8 30 16 -4 22 2'
                                                                            : easing.id === 'elastic' ? 'M2 22 C6 28 10 -6 22 2'
                                                                            : 'M2 22 C2 2 22 2 22 2'
                                                                        }
                                                                        stroke="currentColor"
                                                                        strokeWidth="2"
                                                                    />
                                                                </svg>
                                                                <span className="cms-anim-easing-btn__label">{easing.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {/* Iteration + Direction + Fill */}
                                                <div className="cms-anim-timeline__options">
                                                    <div className="cms-anim-timeline__select-group">
                                                        <label className="cms-anim-timeline__sublabel">Itérations</label>
                                                        <select
                                                            value={sectionProps.animIteration || '1'}
                                                            onChange={(e) => updateField('animIteration', e.target.value)}
                                                            className="cms-anim-timeline__select"
                                                        >
                                                            <option value="1">1x</option>
                                                            <option value="2">2x</option>
                                                            <option value="3">3x</option>
                                                            <option value="infinite">∞ Infini</option>
                                                        </select>
                                                    </div>
                                                    <div className="cms-anim-timeline__select-group">
                                                        <label className="cms-anim-timeline__sublabel">Direction</label>
                                                        <select
                                                            value={sectionProps.animDirection || 'normal'}
                                                            onChange={(e) => updateField('animDirection', e.target.value)}
                                                            className="cms-anim-timeline__select"
                                                        >
                                                            <option value="normal">Normal</option>
                                                            <option value="reverse">Reverse</option>
                                                            <option value="alternate">Alternate</option>
                                                            <option value="alternate-reverse">Alt-Reverse</option>
                                                        </select>
                                                    </div>
                                                    <div className="cms-anim-timeline__select-group">
                                                        <label className="cms-anim-timeline__sublabel">Fill</label>
                                                        <select
                                                            value={sectionProps.animFillMode || 'forwards'}
                                                            onChange={(e) => updateField('animFillMode', e.target.value)}
                                                            className="cms-anim-timeline__select"
                                                        >
                                                            <option value="none">None</option>
                                                            <option value="forwards">Forwards</option>
                                                            <option value="backwards">Backwards</option>
                                                            <option value="both">Both</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                {/* CSS output */}
                                                <div className="cms-anim-timeline__css-output">
                                                    <span className="cms-anim-timeline__css-label">animation:</span>
                                                    <code className="cms-anim-timeline__css-code">
                                                        {sectionProps.animation || 'fade'} {(sectionProps.animDuration || 0.6)}s {sectionProps.animEasing || 'ease'} {(sectionProps.animDelay || 0)}s {sectionProps.animIteration || '1'} {sectionProps.animDirection || 'normal'} {sectionProps.animFillMode || 'forwards'}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Effet au survol — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--rose cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><MousePointer /></span>
                                            <span className="cms-prop-group__title">Effet au survol</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-inline-hover-grid">
                                            {[
                                                { id: 'none', label: 'Aucun' },
                                                { id: 'lift', label: 'Élévation' },
                                                { id: 'scale', label: 'Agrandir' },
                                                { id: 'glow', label: 'Lueur' },
                                                { id: 'shadow', label: 'Ombre+' },
                                                { id: 'border', label: 'Bordure' },
                                            ].map(hover => (
                                                <button
                                                    key={hover.id}
                                                    onClick={() => updateField('hoverEffect', hover.id)}
                                                    className={`cms-inline-hover-btn ${(sectionProps.hoverEffect || 'none') === hover.id ? 'cms-inline-hover-btn--active' : ''}`}
                                                >
                                                    {hover.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    </div>

                                    {/* Opacité + Flou — Advanced opacity control §730 */}
                                    <div className="cms-prop-group cms-prop-group--amber cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sliders /></span>
                                            <span className="cms-prop-group__title">Opacité & Flou</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* Opacity control — checkerboard preview §730 */}
                                            <div className="cms-opacity-control" style={{ marginBottom: 6 }}>
                                                <div className="cms-opacity-control__preview">
                                                    <div className="cms-opacity-control__preview-fill" style={{ backgroundColor: sectionProps.bgColor || '#3b82f6', opacity: (sectionProps.opacity || 100) / 100 }} />
                                                </div>
                                                <input
                                                    type="range" min={20} max={100} step={5}
                                                    value={sectionProps.opacity || 100}
                                                    onChange={(e) => updateField('opacity', parseInt(e.target.value))}
                                                    className="cms-opacity-control__slider"
                                                />
                                                <span className="cms-opacity-control__value">{sectionProps.opacity || 100}%</span>
                                            </div>
                                            {/* Blur control */}
                                            <div className="cms-opacity-control">
                                                <div className="cms-opacity-control__preview">
                                                    <div className="cms-opacity-control__preview-fill" style={{ backgroundColor: '#8b5cf6', filter: `blur(${sectionProps.blur || 0}px)` }} />
                                                </div>
                                                <input
                                                    type="range" min={0} max={20} step={1}
                                                    value={sectionProps.blur || 0}
                                                    onChange={(e) => updateField('blur', parseInt(e.target.value))}
                                                    className="cms-opacity-control__slider"
                                                />
                                                <span className="cms-opacity-control__value">{sectionProps.blur || 0}px</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Backdrop Filter (Glassmorphism) — Advanced editor §723 ═══ */}
                                    <div className="cms-backdrop-group">
                                        <div className="cms-backdrop-group__header">
                                            <span className="cms-backdrop-group__title">
                                                <Droplets className="cms-icon--sm text-violet-500" /> Backdrop (Glass)
                                            </span>
                                            <button
                                                onClick={() => {
                                                    updateField('backdropBlur', 0);
                                                    updateField('backdropBrightness', 100);
                                                    updateField('backdropSaturate', 100);
                                                }}
                                                className="cms-icon-text cms-icon-text--xs"
                                            >
                                                <RefreshCw className="cms-icon--xs" /> Reset
                                            </button>
                                        </div>
                                        {/* Advanced Backdrop Editor — preview + sliders §723 */}
                                        <div className="cms-backdrop-editor" style={{ marginTop: 6 }}>
                                            {/* Live glassmorphism preview */}
                                            <div className="cms-backdrop-editor__preview">
                                                <div
                                                    className="cms-backdrop-editor__preview-overlay"
                                                    style={{
                                                        backdropFilter: `blur(${sectionProps.backdropBlur || 0}px) brightness(${(sectionProps.backdropBrightness ?? 100) / 100}) saturate(${(sectionProps.backdropSaturate ?? 100) / 100})`,
                                                        WebkitBackdropFilter: `blur(${sectionProps.backdropBlur || 0}px) brightness(${(sectionProps.backdropBrightness ?? 100) / 100}) saturate(${(sectionProps.backdropSaturate ?? 100) / 100})`,
                                                    }}
                                                >
                                                    {(sectionProps.backdropBlur || 0) > 0 ? 'Glass' : 'Aucun'}
                                                </div>
                                            </div>
                                            {/* Sliders with icons */}
                                            <div className="cms-backdrop-editor__sliders">
                                                {[
                                                    { key: 'backdropBlur', label: 'Flou', icon: <Droplets className="cms-icon--xs" />, min: 0, max: 40, def: 0, unit: 'px', color: '#8b5cf6' },
                                                    { key: 'backdropBrightness', label: 'Lum.', icon: <Sun className="cms-icon--xs" />, min: 50, max: 200, def: 100, unit: '%', color: '#f59e0b' },
                                                    { key: 'backdropSaturate', label: 'Sat.', icon: <Palette className="cms-icon--xs" />, min: 0, max: 300, def: 100, unit: '%', color: '#ec4899' },
                                                ].map(ctrl => {
                                                    const val = sectionProps[ctrl.key] ?? ctrl.def;
                                                    const pct = ((val - ctrl.min) / (ctrl.max - ctrl.min)) * 100;
                                                    return (
                                                        <div className="cms-backdrop-editor__row" key={ctrl.key}>
                                                            <span className="cms-backdrop-editor__icon" style={{ color: ctrl.color }}>{ctrl.icon}</span>
                                                            <input
                                                                type="range" min={ctrl.min} max={ctrl.max} step={ctrl.key === 'backdropBlur' ? 1 : 5}
                                                                value={val}
                                                                onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                                className="cms-backdrop-editor__slider"
                                                                style={{ '--backdrop-pct': `${pct}%` } as React.CSSProperties}
                                                            />
                                                            <span className="cms-backdrop-editor__value">{val}{ctrl.unit}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        {/* Presets */}
                                        <div className="cms-backdrop-presets">
                                            {[
                                                { id: 'none', label: 'Aucun', blur: 0, bright: 100, sat: 100 },
                                                { id: 'glass', label: 'Glass', blur: 12, bright: 110, sat: 120 },
                                                { id: 'frosted', label: 'Givré', blur: 20, bright: 100, sat: 80 },
                                                { id: 'light', label: 'Clair', blur: 6, bright: 120, sat: 100 },
                                                { id: 'dark', label: 'Sombre', blur: 8, bright: 70, sat: 90 },
                                                { id: 'vivid', label: 'Vif', blur: 4, bright: 110, sat: 160 },
                                            ].map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => {
                                                        updateField('backdropBlur', preset.blur);
                                                        updateField('backdropBrightness', preset.bright);
                                                        updateField('backdropSaturate', preset.sat);
                                                    }}
                                                    className={`cms-backdrop-preset ${(sectionProps.backdropBlur || 0) === preset.blur && (sectionProps.backdropBrightness ?? 100) === preset.bright ? 'cms-backdrop-preset--active' : ''}`}
                                                >
                                                    <div
                                                        className="cms-backdrop-preset__swatch"
                                                        style={{
                                                            backdropFilter: `blur(${preset.blur}px) brightness(${preset.bright / 100})`,
                                                            WebkitBackdropFilter: `blur(${preset.blur}px) brightness(${preset.bright / 100})`,
                                                            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))',
                                                        }}
                                                    />
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ═══ Blend Mode — cms-blend-group ═══ */}
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
                                                    onClick={() => updateField('blendMode', blend.id)}
                                                    className={`cms-blend-btn ${(sectionProps.blendMode || 'normal') === blend.id ? 'cms-blend-btn--active' : ''}`}
                                                >
                                                    <div className="cms-blend-btn__preview" style={{ mixBlendMode: blend.id as any }} />
                                                    {blend.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* ═══ Shadow Editor avancé — multi-couches §1001 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--slate cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Layers /></span>
                                            <span className="cms-prop-group__title">Ombres avancées</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* Shadow preview */}
                                            <div className="cms-shadow-editor-preview">
                                                <div
                                                    className="cms-shadow-editor-preview__box"
                                                    style={{
                                                        boxShadow: [
                                                            sectionProps.shadow1X !== undefined ? `${sectionProps.shadow1X || 0}px ${sectionProps.shadow1Y || 0}px ${sectionProps.shadow1Blur || 0}px ${sectionProps.shadow1Spread || 0}px ${sectionProps.shadow1Color || 'rgba(0,0,0,0.1)'}` : '',
                                                            sectionProps.shadow2X !== undefined ? `${sectionProps.shadow2X || 0}px ${sectionProps.shadow2Y || 0}px ${sectionProps.shadow2Blur || 0}px ${sectionProps.shadow2Spread || 0}px ${sectionProps.shadow2Color || 'rgba(0,0,0,0.05)'}` : '',
                                                        ].filter(Boolean).join(', ') || '0 4px 6px -1px rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    Preview
                                                </div>
                                            </div>
                                            {/* Shadow layer 1 */}
                                            <div className="cms-shadow-editor-layer">
                                                <div className="cms-shadow-editor-layer__header">
                                                    <span className="cms-shadow-editor-layer__title">Ombre 1</span>
                                                    <button
                                                        onClick={() => {
                                                            updateField('shadow1X', 0);
                                                            updateField('shadow1Y', 4);
                                                            updateField('shadow1Blur', 6);
                                                            updateField('shadow1Spread', -1);
                                                            updateField('shadow1Color', 'rgba(0,0,0,0.1)');
                                                        }}
                                                        className="cms-icon-text cms-icon-text--xs"
                                                    >
                                                        <RefreshCw className="cms-icon--xs" /> Reset
                                                    </button>
                                                </div>
                                                <div className="cms-shadow-editor-controls">
                                                    {[
                                                        { key: 'shadow1X', label: 'X', min: -50, max: 50, def: 0 },
                                                        { key: 'shadow1Y', label: 'Y', min: -50, max: 50, def: 4 },
                                                        { key: 'shadow1Blur', label: 'Blur', min: 0, max: 100, def: 6 },
                                                        { key: 'shadow1Spread', label: 'Spread', min: -50, max: 50, def: -1 },
                                                    ].map(ctrl => (
                                                        <div className="cms-shadow-editor-control" key={ctrl.key}>
                                                            <label className="cms-shadow-editor-control__label">{ctrl.label}</label>
                                                            <input
                                                                type="range" min={ctrl.min} max={ctrl.max} step={1}
                                                                value={sectionProps[ctrl.key] ?? ctrl.def}
                                                                onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                                className="cms-range-pro-slider"
                                                            />
                                                            <span className="cms-shadow-editor-control__value">{sectionProps[ctrl.key] ?? ctrl.def}px</span>
                                                        </div>
                                                    ))}
                                                    <div className="cms-shadow-editor-control">
                                                        <label className="cms-shadow-editor-control__label">Couleur</label>
                                                        <input
                                                            type="color"
                                                            value={sectionProps.shadow1Color || '#000000'}
                                                            onChange={(e) => updateField('shadow1Color', e.target.value)}
                                                            className="cms-shadow-editor-color"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            {/* Shadow presets */}
                                            <div className="cms-shadow-presets">
                                                {[
                                                    { label: 'Subtile', x: 0, y: 1, blur: 3, spread: 0, color: 'rgba(0,0,0,0.08)' },
                                                    { label: 'Douce', x: 0, y: 4, blur: 6, spread: -1, color: 'rgba(0,0,0,0.1)' },
                                                    { label: 'Élevée', x: 0, y: 10, blur: 15, spread: -3, color: 'rgba(0,0,0,0.1)' },
                                                    { label: 'Flottante', x: 0, y: 20, blur: 25, spread: -5, color: 'rgba(0,0,0,0.1)' },
                                                    { label: 'Glow', x: 0, y: 0, blur: 20, spread: 0, color: 'rgba(59,130,246,0.3)' },
                                                    { label: 'Inset', x: 0, y: 2, blur: 4, spread: 0, color: 'rgba(0,0,0,0.06)' },
                                                ].map((preset, i) => (
                                                    <button
                                                        key={i}
                                                        className="cms-shadow-preset-btn"
                                                        onClick={() => {
                                                            updateField('shadow1X', preset.x);
                                                            updateField('shadow1Y', preset.y);
                                                            updateField('shadow1Blur', preset.blur);
                                                            updateField('shadow1Spread', preset.spread);
                                                            updateField('shadow1Color', preset.color);
                                                            toast.success(`Ombre "${preset.label}" appliquée`);
                                                        }}
                                                    >
                                                        <div
                                                            className="cms-shadow-preset-btn__preview"
                                                            style={{ boxShadow: `${preset.x}px ${preset.y}px ${preset.blur}px ${preset.spread}px ${preset.color}` }}
                                                        />
                                                        <span className="cms-shadow-preset-btn__label">{preset.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Border Radius par coin — contrôle individuel §1002 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--cyan cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><CornerUpRight /></span>
                                            <span className="cms-prop-group__title">Border Radius (coins)</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            {/* Visual radius editor — 4 coins */}
                                            <div className="cms-radius-visual-editor">
                                                <div
                                                    className="cms-radius-visual-editor__preview"
                                                    style={{
                                                        borderTopLeftRadius: sectionProps.radiusTL || 0,
                                                        borderTopRightRadius: sectionProps.radiusTR || 0,
                                                        borderBottomRightRadius: sectionProps.radiusBR || 0,
                                                        borderBottomLeftRadius: sectionProps.radiusBL || 0,
                                                    }}
                                                >
                                                    <span className="cms-radius-visual-editor__label">Preview</span>
                                                </div>
                                            </div>
                                            {/* Per-corner sliders */}
                                            <div className="cms-radius-corners-grid">
                                                {[
                                                    { key: 'radiusTL', label: '↖ HG', color: '#3b82f6' },
                                                    { key: 'radiusTR', label: '↗ HD', color: '#8b5cf6' },
                                                    { key: 'radiusBR', label: '↘ BD', color: '#ec4899' },
                                                    { key: 'radiusBL', label: '↙ BG', color: '#f59e0b' },
                                                ].map(ctrl => (
                                                    <div className="cms-radius-corner" key={ctrl.key}>
                                                        <label className="cms-radius-corner__label" style={{ color: ctrl.color }}>{ctrl.label}</label>
                                                        <input
                                                            type="range" min={0} max={50} step={1}
                                                            value={sectionProps[ctrl.key] || 0}
                                                            onChange={(e) => updateField(ctrl.key, parseInt(e.target.value))}
                                                            className="cms-range-pro-slider"
                                                        />
                                                        <span className="cms-radius-corner__value">{sectionProps[ctrl.key] || 0}px</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Radius presets */}
                                            <div className="cms-radius-presets">
                                                {[
                                                    { label: 'Carré', tl: 0, tr: 0, br: 0, bl: 0 },
                                                    { label: 'Léger', tl: 4, tr: 4, br: 4, bl: 4 },
                                                    { label: 'Moyen', tl: 8, tr: 8, br: 8, bl: 8 },
                                                    { label: 'Large', tl: 16, tr: 16, br: 16, bl: 16 },
                                                    { label: 'Pill', tl: 9999, tr: 9999, br: 9999, bl: 9999 },
                                                    { label: 'Blob', tl: 30, tr: 10, br: 30, bl: 10 },
                                                    { label: 'Ticket', tl: 0, tr: 12, br: 0, bl: 12 },
                                                    { label: 'Badge', tl: 12, tr: 0, br: 12, bl: 0 },
                                                ].map((preset, i) => (
                                                    <button
                                                        key={i}
                                                        className="cms-radius-preset-btn"
                                                        onClick={() => {
                                                            updateField('radiusTL', preset.tl);
                                                            updateField('radiusTR', preset.tr);
                                                            updateField('radiusBR', preset.br);
                                                            updateField('radiusBL', preset.bl);
                                                            toast.success(`Radius "${preset.label}" appliqué`);
                                                        }}
                                                    >
                                                        <div
                                                            className="cms-radius-preset-btn__preview"
                                                            style={{
                                                                borderTopLeftRadius: preset.tl,
                                                                borderTopRightRadius: preset.tr,
                                                                borderBottomRightRadius: preset.br,
                                                                borderBottomLeftRadius: preset.bl,
                                                            }}
                                                        />
                                                        <span className="cms-radius-preset-btn__label">{preset.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* ═══ Clip-path — Formes géométriques §1003 ═══ */}
                                    <div className="cms-prop-group cms-prop-group--orange cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Scissors /></span>
                                            <span className="cms-prop-group__title">Clip-path (forme)</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-clip-path-grid">
                                                {[
                                                    { id: 'none', label: 'Aucun', clip: 'none', preview: 'rect' },
                                                    { id: 'circle', label: 'Cercle', clip: 'circle(50% at 50% 50%)', preview: 'circle' },
                                                    { id: 'ellipse', label: 'Ellipse', clip: 'ellipse(50% 40% at 50% 50%)', preview: 'ellipse' },
                                                    { id: 'triangle', label: 'Triangle', clip: 'polygon(50% 0%, 0% 100%, 100% 100%)', preview: 'triangle' },
                                                    { id: 'diamond', label: 'Losange', clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', preview: 'diamond' },
                                                    { id: 'pentagon', label: 'Pentagone', clip: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)', preview: 'pentagon' },
                                                    { id: 'hexagon', label: 'Hexagone', clip: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', preview: 'hexagon' },
                                                    { id: 'star', label: 'Étoile', clip: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', preview: 'star' },
                                                    { id: 'arrow-right', label: 'Flèche →', clip: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%)', preview: 'arrow' },
                                                    { id: 'chevron', label: 'Chevron', clip: 'polygon(0% 0%, 75% 0%, 100% 50%, 75% 100%, 0% 100%, 25% 50%, 0% 50%)', preview: 'chevron' },
                                                    { id: 'message', label: 'Message', clip: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)', preview: 'message' },
                                                    { id: 'bevel', label: 'Biseau', clip: 'polygon(20px 0%, calc(100% - 20px) 0%, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0% calc(100% - 20px), 0% 20px)', preview: 'bevel' },
                                                ].map(shape => (
                                                    <button
                                                        key={shape.id}
                                                        className={`cms-clip-path-btn ${(sectionProps.clipPath || 'none') === shape.id ? 'cms-clip-path-btn--active' : ''}`}
                                                        onClick={() => {
                                                            updateField('clipPath', shape.id === 'none' ? '' : shape.clip);
                                                            if (shape.id !== 'none') toast.success(`Forme "${shape.label}" appliquée`);
                                                        }}
                                                        title={shape.label}
                                                    >
                                                        <div className="cms-clip-path-btn__preview">
                                                            <div
                                                                className="cms-clip-path-btn__shape"
                                                                style={{ clipPath: shape.clip === 'none' ? 'none' : shape.clip }}
                                                            />
                                                        </div>
                                                        <span className="cms-clip-path-btn__label">{shape.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB: TRANSFORM CSS — Enhanced with grid preview ═══ */}
                            {activeTab === 'transform' && (
                                <div className="cms-tab-content--spaced cms-tab-content-enter">
                                    {/* Transformations — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--emerald cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><RotateCw /></span>
                                            <span className="cms-prop-group__title">Transformations</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateField('cssRotate', 0);
                                                    updateField('cssScaleX', 1);
                                                    updateField('cssScaleY', 1);
                                                    updateField('cssSkewX', 0);
                                                    updateField('cssSkewY', 0);
                                                }}
                                                className="cms-icon-text cms-icon-text--sm cms-icon-text--right"
                                            >
                                                <RefreshCw className="cms-icon--xs" /> Reset
                                            </button>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                        {/* Quick transform actions */}
                                        <div className="cms-transform-actions-grid">
                                            <button
                                                onClick={() => updateField('cssScaleX', -(sectionProps.cssScaleX ?? 1))}
                                                className="cms-transform-action-btn"
                                                title="Miroir horizontal"
                                            >
                                                <FlipHorizontal className="cms-transform-action-btn__icon" />
                                                Flip H
                                            </button>
                                            <button
                                                onClick={() => updateField('cssScaleY', -(sectionProps.cssScaleY ?? 1))}
                                                className="cms-transform-action-btn"
                                                title="Miroir vertical"
                                            >
                                                <FlipVertical className="cms-transform-action-btn__icon" />
                                                Flip V
                                            </button>
                                            <button
                                                onClick={() => updateField('cssRotate', (sectionProps.cssRotate || 0) + 90)}
                                                className="cms-transform-action-btn"
                                                title="Rotation +90°"
                                            >
                                                <RotateCw className="cms-transform-action-btn__icon" />
                                                +90°
                                            </button>
                                            <button
                                                onClick={() => updateField('cssRotate', (sectionProps.cssRotate || 0) - 90)}
                                                className="cms-transform-action-btn cms-transform-action-btn--danger"
                                                title="Rotation -90°"
                                            >
                                                <RotateCw className="cms-transform-action-btn__icon" style={{ transform: 'scaleX(-1)' }} />
                                                -90°
                                            </button>
                                        </div>
                                        {/* Sliders + cadran visuel */}
                                        <div className="cms-inline-space-stack">
                                            {/* Rotation avec cadran visuel */}
                                            <div className="cms-inline-rotation-row">
                                                <RotationDial
                                                    value={sectionProps.cssRotate || 0}
                                                    onChange={(v) => updateField('cssRotate', v)}
                                                />
                                                <div className="cms-inline-rotation-row__sliders">
                                                    <div className="cms-inline-opacity-row">
                                                        <span className="cms-inline-field-label" style={{ width: '3rem' }}>Rotation</span>
                                                        <RangeProSlider
                                                            value={sectionProps.cssRotate || 0}
                                                            onChange={(v) => updateField('cssRotate', v)}
                                                            min={-180} max={180} step={1} unit="°"
                                                            color="#10b981"
                                                        />
                                                        <span className="cms-inline-opacity-value">{sectionProps.cssRotate || 0}°</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="cms-field-pair">
                                                <div className="cms-transform-slider-row">
                                                    <span className="cms-transform-slider-row__label">Scale X</span>
                                                    <RangeProSlider
                                                        value={sectionProps.cssScaleX ?? 1}
                                                        onChange={(v) => updateField('cssScaleX', v)}
                                                        min={0.1} max={3} step={0.05} unit="x"
                                                        color="#3b82f6"
                                                    />
                                                    <span className="cms-inline-opacity-value">{(sectionProps.cssScaleX ?? 1).toFixed(2)}</span>
                                                </div>
                                                <div className="cms-transform-slider-row">
                                                    <span className="cms-transform-slider-row__label">Scale Y</span>
                                                    <RangeProSlider
                                                        value={sectionProps.cssScaleY ?? 1}
                                                        onChange={(v) => updateField('cssScaleY', v)}
                                                        min={0.1} max={3} step={0.05} unit="x"
                                                        color="#8b5cf6"
                                                    />
                                                    <span className="cms-inline-opacity-value">{(sectionProps.cssScaleY ?? 1).toFixed(2)}</span>
                                                </div>
                                            </div>
                                            <div className="cms-field-pair">
                                                <div className="cms-transform-slider-row">
                                                    <span className="cms-transform-slider-row__label">Skew X</span>
                                                    <RangeProSlider
                                                        value={sectionProps.cssSkewX || 0}
                                                        onChange={(v) => updateField('cssSkewX', v)}
                                                        min={-45} max={45} step={1} unit="°"
                                                        color="#f59e0b"
                                                    />
                                                    <span className="cms-inline-opacity-value">{sectionProps.cssSkewX || 0}°</span>
                                                </div>
                                                <div className="cms-transform-slider-row">
                                                    <span className="cms-transform-slider-row__label">Skew Y</span>
                                                    <RangeProSlider
                                                        value={sectionProps.cssSkewY || 0}
                                                        onChange={(v) => updateField('cssSkewY', v)}
                                                        min={-45} max={45} step={1} unit="°"
                                                        color="#ec4899"
                                                    />
                                                    <span className="cms-inline-opacity-value">{sectionProps.cssSkewY || 0}°</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Filtres CSS — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--amber cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Sliders /></span>
                                            <span className="cms-prop-group__title">Filtres CSS</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateField('cssBrightness', 100);
                                                    updateField('cssContrast', 100);
                                                    updateField('cssSaturate', 100);
                                                    updateField('cssGrayscale', 0);
                                                    updateField('cssSepia', 0);
                                                    updateField('cssHueRotate', 0);
                                                }}
                                                className="cms-icon-text cms-icon-text--sm cms-icon-text--right"
                                            >
                                                <RefreshCw className="cms-icon--xs" /> Reset
                                            </button>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                        {/* Filtres presets */}
                                        <div className="cms-filter-presets-grid">
                                            {[
                                                { label: 'Normal', filters: { brightness: 100, contrast: 100, saturate: 100, grayscale: 0, sepia: 0, hueRotate: 0 } },
                                                { label: 'N&B', filters: { grayscale: 100, brightness: 100, contrast: 110 } },
                                                { label: 'Sépia', filters: { sepia: 80, brightness: 100, saturate: 80 } },
                                                { label: 'Vif', filters: { saturate: 150, contrast: 120, brightness: 105 } },
                                                { label: 'Drama', filters: { contrast: 150, saturate: 130, brightness: 90 } },
                                                { label: 'Doux', filters: { brightness: 110, contrast: 90, saturate: 80 } },
                                                { label: 'Vintage', filters: { sepia: 40, contrast: 110, saturate: 80, brightness: 95 } },
                                                { label: 'Froid', filters: { hueRotate: 180, saturate: 80, brightness: 100 } },
                                            ].map(preset => (
                                                <button
                                                    key={preset.label}
                                                    onClick={() => Object.entries(preset.filters).forEach(([k, v]) => updateField(`css${k.charAt(0).toUpperCase() + k.slice(1)}`, v))}
                                                    className="cms-filter-preset-btn"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                        {/* Sliders filtres — RangeProSlider §726 */}
                                        <div className="cms-inline-space-stack">
                                            {[
                                                { key: 'cssBrightness', label: 'Luminosit\u00e9', icon: <Sun className="cms-icon--xs" />, min: 0, max: 200, step: 5, unit: '%', defaultVal: 100, color: '#f59e0b' },
                                                { key: 'cssContrast', label: 'Contraste', icon: <Contrast className="cms-icon--xs" />, min: 0, max: 200, step: 5, unit: '%', defaultVal: 100, color: '#6366f1' },
                                                { key: 'cssSaturate', label: 'Saturation', icon: <Droplets className="cms-icon--xs" />, min: 0, max: 200, step: 5, unit: '%', defaultVal: 100, color: '#ec4899' },
                                                { key: 'cssGrayscale', label: 'N&B', icon: <Brush className="cms-icon--xs" />, min: 0, max: 100, step: 5, unit: '%', defaultVal: 0, color: '#64748b' },
                                                { key: 'cssSepia', label: 'S\u00e9pia', icon: <Brush className="cms-icon--xs" />, min: 0, max: 100, step: 5, unit: '%', defaultVal: 0, color: '#92400e' },
                                                { key: 'cssHueRotate', label: 'Teinte', icon: <Palette className="cms-icon--xs" />, min: 0, max: 360, step: 5, unit: '\u00b0', defaultVal: 0, color: '#8b5cf6' },
                                            ].map(filter => (
                                                <div key={filter.key} className="cms-inline-opacity-row">
                                                    <span className="text-gray-400">{filter.icon}</span>
                                                    <span className="cms-inline-field-label" style={{ width: '3.5rem' }}>{filter.label}</span>
                                                    <RangeProSlider
                                                        value={sectionProps[filter.key] ?? filter.defaultVal}
                                                        onChange={(v) => updateField(filter.key, v)}
                                                        min={filter.min} max={filter.max} step={filter.step} unit={filter.unit}
                                                        color={filter.color}
                                                    />
                                                    <span className="cms-inline-opacity-value">{sectionProps[filter.key] ?? filter.defaultVal}{filter.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Transform preview — Grid background + crosshair */}
                                    <div className="cms-transform-preview">
                                        <div className="cms-transform-preview__header">
                                            <span className="cms-transform-preview__title">
                                                <Eye className="cms-icon--sm text-emerald-500" /> Aperçu transform
                                            </span>
                                            <span className="cms-transform-preview__status">
                                                {(sectionProps.cssRotate || 0) !== 0 || (sectionProps.cssScaleX ?? 1) !== 1 || (sectionProps.cssSkewX || 0) !== 0 ? 'Modifié' : 'Normal'}
                                            </span>
                                        </div>
                                        {/* Grid background preview area */}
                                        <div
                                            className="cms-transform-preview__grid"
                                        >
                                            {/* Crosshair guides */}
                                            <div className="cms-transform-crosshair--v" />
                                            <div className="cms-transform-crosshair--h" />
                                            <div
                                                className="cms-transform-preview__element"
                                                style={{
                                                    transform: `rotate(${sectionProps.cssRotate || 0}deg) scale(${sectionProps.cssScaleX ?? 1}, ${sectionProps.cssScaleY ?? 1}) skew(${sectionProps.cssSkewX || 0}deg, ${sectionProps.cssSkewY || 0}deg)`,
                                                    filter: `brightness(${(sectionProps.cssBrightness ?? 100) / 100}) contrast(${(sectionProps.cssContrast ?? 100) / 100}) saturate(${(sectionProps.cssSaturate ?? 100) / 100}) grayscale(${(sectionProps.cssGrayscale ?? 0) / 100}) sepia(${(sectionProps.cssSepia ?? 0) / 100}) hue-rotate(${sectionProps.cssHueRotate || 0}deg)`,
                                                }}
                                            >
                                                Élément exemple
                                            </div>
                                        </div>
                                        {/* CSS output — dark terminal style */}
                                        <div className="cms-terminal-output">
                                            <div className="cms-terminal-dots">
                                                <div className="cms-terminal-dot cms-terminal-dot--red" />
                                                <div className="cms-terminal-dot cms-terminal-dot--yellow" />
                                                <div className="cms-terminal-dot cms-terminal-dot--green" />
                                                <span className="cms-terminal-filename">transform.css</span>
                                            </div>
                                            <span className="text-gray-500">transform:</span> rotate({sectionProps.cssRotate || 0}deg) scale({(sectionProps.cssScaleX ?? 1).toFixed(1)}, {(sectionProps.cssScaleY ?? 1).toFixed(1)})
                                            {(sectionProps.cssSkewX || sectionProps.cssSkewY) && <span> skew({sectionProps.cssSkewX || 0}deg, {sectionProps.cssSkewY || 0}deg)</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ TAB: APERÇU LIVE ═══ */}
                            {activeTab === 'preview' && (
                                <div className="cms-tab-content--spaced cms-tab-content-enter">
                                    {/* Device selector */}
                                    <div className="cms-flex-editor__direction">
                                        {[
                                            { id: 'desktop' as const, icon: '🖥', label: 'Desktop', width: '100%' },
                                            { id: 'tablet' as const, icon: '📲', label: 'Tablette', width: '768px' },
                                            { id: 'mobile' as const, icon: '📱', label: 'Mobile', width: '375px' },
                                        ].map(device => (
                                            <button
                                                key={device.id}
                                                onClick={() => setPreviewDevice(device.id)}
                                                className={`cms-flex-editor__dir-btn cms-preview-device-btn ${
                                                    previewDevice === device.id
                                                        ? 'cms-flex-editor__dir-btn--active'
                                                        : ''
                                                }`}
                                            >
                                                <span className="text-xs">{device.icon}</span>
                                                <span className="hidden [@media(min-width:240px)]:inline">{device.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {/* Preview miniature de la section */}
                                    <div className="cms-inline-preview-card">
                                        <div className="cms-inline-preview-card__header">
                                            <span className="cms-transform-preview__title">
                                                <Eye className="cms-icon--sm" /> Aperçu live
                                            </span>
                                            <div className="cms-inline-opacity-row">
                                                <span className="cms-transform-preview__status">{previewDevice === 'desktop' ? '1200px' : previewDevice === 'tablet' ? '768px' : '375px'}</span>
                                                <span className="cms-inline-effect-label">{sectionType}</span>
                                            </div>
                                        </div>
                                        {/* Mini preview container with device frame */}
                                        <div className={`cms-preview-device-frame ${previewDevice !== 'desktop' ? 'cms-preview-device-frame--padding' : ''}`}>
                                            <div
                                                className="cms-preview-device-content"
                                                style={{
                                                    width: '100%',
                                                    maxWidth: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '360px' : '180px',
                                                    borderRadius: previewDevice !== 'desktop' ? '8px' : '0',
                                                    overflow: 'hidden',
                                                    boxShadow: previewDevice !== 'desktop' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                                }}
                                            >
                                            {/* Simulated section preview */}
                                            <div
                                                className="cms-mini-preview__body"
                                                style={{
                                                    background: sectionProps.bgColor || sectionProps.couleurFond || '#ffffff',
                                                    color: sectionProps.textColor || sectionProps.couleurTexte || '#111827',
                                                    textAlign: (sectionProps.textAlign || 'left') as any,
                                                    padding: `${sectionProps.paddingY || 16}px ${sectionProps.paddingX || 16}px`,
                                                    borderColor: sectionProps.borderColor || '#e5e7eb',
                                                    borderWidth: sectionProps.borderWidth ? `${sectionProps.borderWidth}px` : '0',
                                                    borderStyle: 'solid',
                                                    borderRadius: sectionProps.borderRadius ? `${sectionProps.borderRadius}px` : '0',
                                                }}
                                            >
                                                {sectionProps.surtitre && (
                                                    <div className="cms-mini-preview__surtitre">
                                                        {sectionProps.surtitre}
                                                    </div>
                                                )}
                                                {sectionProps.titre && (
                                                    <div className="cms-mini-preview__title"
                                                        style={{
                                                            fontSize: sectionProps.fontSize ? `${getPreviewFontSize(sectionProps.fontSize)}px` : '14px',
                                                            fontWeight: getFontWeightCSS(sectionProps.fontWeight),
                                                            fontFamily: getFontFamilyCSS(sectionProps.fontFamily),
                                                            textDecoration: sectionProps.textDecoration || 'none',
                                                            textTransform: sectionProps.textTransform || 'none',
                                                        }}
                                                    >
                                                        {sectionProps.titre}
                                                    </div>
                                                )}
                                                {sectionProps.soustitre && (
                                                    <div className="cms-mini-label" style={{ opacity: 0.7 }}>{sectionProps.soustitre}</div>
                                                )}
                                                {(sectionProps.description || sectionProps.contenu || sectionProps.texte) && (
                                                    <div className="cms-mini-preview__desc">
                                                        {sectionProps.description || sectionProps.contenu || sectionProps.texte}
                                                    </div>
                                                )}
                                                {/* Image preview */}
                                                {(sectionProps.imageUrl || sectionProps.image) && (
                                                    <div className="cms-mini-preview__image-wrapper">
                                                        <img
                                                            src={sectionProps.imageUrl || sectionProps.image}
                                                            alt={sectionProps.imageAlt || sectionProps.alt || ''}
                                                            className="cms-mini-preview__image"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                                                        />
                                                    </div>
                                                )}
                                                {/* Button preview */}
                                                {(sectionProps.boutonTexte || sectionProps.boutonLabel) && (
                                                    <div className="cms-mini-preview__btn-wrapper">
                                                        <span
                                                            className="cms-mini-preview__btn"
                                                            style={{
                                                                backgroundColor: sectionProps.boutonBgColor || '#2563eb',
                                                                color: sectionProps.boutonTextColor || '#ffffff',
                                                                borderRadius: BUTTON_RADIUS_OPTIONS.find(r => r.value === (sectionProps.boutonBorderRadius || 'md'))?.css || '8px',
                                                                padding: '3px 10px',
                                                                border: (sectionProps.boutonBorderWidth || '0') !== '0'
                                                                    ? `${sectionProps.boutonBorderWidth}px solid ${sectionProps.boutonBorderColor || '#2563eb'}`
                                                                    : 'none',
                                                                boxShadow: SHADOW_PRESETS.find(s => s.type === (sectionProps.boutonShadow || 'none'))?.css || 'none',
                                                            }}
                                                        >
                                                            {sectionProps.boutonTexte || sectionProps.boutonLabel}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            </div>
                                        </div>
                                        </div>

                                    {/* Résumé des propriétés — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--blue cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><List /></span>
                                            <span className="cms-prop-group__title">Propriétés actives</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-compact-grid">
                                            {sectionProps.bgColor && (
                                                <PropBadge label="Fond" value={sectionProps.bgColor} type="color" />
                                            )}
                                            {sectionProps.textColor && (
                                                <PropBadge label="Texte" value={sectionProps.textColor} type="color" />
                                            )}
                                            {sectionProps.fontFamily && (
                                                <PropBadge label="Police" value={sectionProps.fontFamily} />
                                            )}
                                            {sectionProps.fontSize && (
                                                <PropBadge label="Taille" value={sectionProps.fontSize} />
                                            )}
                                            {sectionProps.textAlign && (
                                                <PropBadge label="Align." value={sectionProps.textAlign} />
                                            )}
                                            {sectionProps.borderWidth && sectionProps.borderWidth !== '0' && (
                                                <PropBadge label="Bordure" value={`${sectionProps.borderWidth}px`} />
                                            )}
                                            {sectionProps.boxShadow && sectionProps.boxShadow !== 'none' && (
                                                <PropBadge label="Ombre" value={sectionProps.boxShadow} />
                                            )}
                                            {(sectionProps.boutonTexte || sectionProps.boutonLabel) && (
                                                <PropBadge label="Bouton" value={sectionProps.boutonTexte || sectionProps.boutonLabel || ''} />
                                            )}
                                            {(sectionProps.imageUrl || sectionProps.image) && (
                                                <PropBadge label="Image" value="✓" />
                                            )}
                                            {(sectionProps.boutonLien || sectionProps.lien) && (
                                                <PropBadge label="Lien" value={getUrlDomain(sectionProps.boutonLien || sectionProps.lien || '')} />
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions rapides — cms-prop-group */}
                                    <div className="cms-prop-group cms-prop-group--gray cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><Zap /></span>
                                            <span className="cms-prop-group__title">Actions</span>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-flex-wrap-group">
                                            <button
                                                onClick={() => {
                                                    const text = [
                                                        sectionProps.titre,
                                                        sectionProps.description || sectionProps.contenu || sectionProps.texte,
                                                        sectionProps.boutonTexte || sectionProps.boutonLabel,
                                                    ].filter(Boolean).join(' ');
                                                    navigator.clipboard.writeText(text);
                                                    toast.success('Contenu copié');
                                                }}
                                                className="cms-inline-btn"
                                            >
                                                <Clipboard className="cms-icon--xs" /> Copier texte
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('contenu');
                                                }}
                                                className="cms-inline-btn"
                                            >
                                                <Type className="cms-icon--xs" /> Éditer contenu
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('style');
                                                }}
                                                className="cms-inline-btn"
                                            >
                                                <Palette className="cms-icon--xs" /> Styles
                                            </button>
                                        </div>
                                        </div>
                                    </div>

                                    {/* ═══ CSS Output Panel §117 — code généré en temps réel ═══ */}
                                    <div className="cms-prop-group cms-prop-group--slate cms-prop-group--open">
                                        <button className="cms-prop-group__header" onClick={() => {}}>
                                            <span className="cms-prop-group__icon"><FileCode className="cms-icon--sm" /></span>
                                            <span className="cms-prop-group__title">Code CSS généré</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const css = [
                                                        sectionProps.bgColor ? `background: ${sectionProps.bgColor};` : '',
                                                        sectionProps.textColor ? `color: ${sectionProps.textColor};` : '',
                                                        sectionProps.paddingY ? `padding: ${sectionProps.paddingTop || sectionProps.paddingY}px ${sectionProps.paddingRight || sectionProps.paddingX}px;` : '',
                                                        sectionProps.borderWidth && sectionProps.borderWidth !== '0' ? `border: ${sectionProps.borderWidth}px solid ${sectionProps.borderColor || '#e5e7eb'};` : '',
                                                        sectionProps.borderRadius ? `border-radius: ${sectionProps.radiusTL || sectionProps.borderRadius}px ${sectionProps.radiusTR || sectionProps.borderRadius}px ${sectionProps.radiusBR || sectionProps.borderRadius}px ${sectionProps.radiusBL || sectionProps.borderRadius}px;` : '',
                                                        sectionProps.boxShadow && sectionProps.boxShadow !== 'none' ? `box-shadow: ${SHADOW_PRESETS.find(s => s.type === sectionProps.boxShadow)?.css || 'none'};` : '',
                                                        sectionProps.opacity && sectionProps.opacity !== 100 ? `opacity: ${(sectionProps.opacity || 100) / 100};` : '',
                                                        sectionProps.cssRotate ? `transform: rotate(${sectionProps.cssRotate}deg) scale(${sectionProps.cssScaleX ?? 1}, ${sectionProps.cssScaleY ?? 1});` : '',
                                                        sectionProps.animation && sectionProps.animation !== 'none' ? `animation: ${sectionProps.animation} ${sectionProps.animDuration || 0.6}s ${sectionProps.animEasing || 'ease'} ${sectionProps.animDelay || 0}s ${sectionProps.animIteration || '1'} ${sectionProps.animDirection || 'normal'} ${sectionProps.animFillMode || 'forwards'};` : '',
                                                        sectionProps.gap ? `gap: ${sectionProps.gap}px;` : '',
                                                        sectionProps.marginTop ? `margin-top: ${sectionProps.marginTop}px;` : '',
                                                        sectionProps.marginBottom ? `margin-bottom: ${sectionProps.marginBottom}px;` : '',
                                                    ].filter(Boolean).join('\n  ');
                                                    navigator.clipboard.writeText(`.section {\n  ${css}\n}`);
                                                    toast.success('CSS copié dans le presse-papier');
                                                }}
                                                className="cms-icon-text cms-icon-text--sm cms-icon-text--right"
                                            >
                                                <Copy className="cms-icon--xs" /> Copier
                                            </button>
                                            <ChevronDown className="cms-prop-group__chevron" />
                                        </button>
                                        <div className="cms-prop-group__body">
                                            <div className="cms-css-output">
                                                <div className="cms-css-output__header">
                                                    <span className="cms-css-output__dot cms-css-output__dot--red" />
                                                    <span className="cms-css-output__dot cms-css-output__dot--yellow" />
                                                    <span className="cms-css-output__dot cms-css-output__dot--green" />
                                                    <span className="cms-css-output__filename">styles.css</span>
                                                </div>
                                                <pre className="cms-css-output__code">
                                                    <code>{`.section {\n`}
                                                        {sectionProps.bgColor && <span className="cms-css-prop">  background: <span className="cms-css-value">{sectionProps.bgColor}</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.textColor && <span className="cms-css-prop">  color: <span className="cms-css-value">{sectionProps.textColor}</span>;</span>}
                                                        {'\n'}
                                                        {(sectionProps.paddingTop || sectionProps.paddingY) && <span className="cms-css-prop">  padding: <span className="cms-css-value">{sectionProps.paddingTop || sectionProps.paddingY}px {sectionProps.paddingRight || sectionProps.paddingX}px {sectionProps.paddingBottom || sectionProps.paddingY}px {sectionProps.paddingLeft || sectionProps.paddingX}px</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.borderWidth && sectionProps.borderWidth !== '0' && <span className="cms-css-prop">  border: <span className="cms-css-value">{sectionProps.borderWidth}px solid {sectionProps.borderColor || '#e5e7eb'}</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.borderRadius && <span className="cms-css-prop">  border-radius: <span className="cms-css-value">{sectionProps.radiusTL || sectionProps.borderRadius}px {sectionProps.radiusTR || sectionProps.borderRadius}px {sectionProps.radiusBR || sectionProps.borderRadius}px {sectionProps.radiusBL || sectionProps.borderRadius}px</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.boxShadow && sectionProps.boxShadow !== 'none' && <span className="cms-css-prop">  box-shadow: <span className="cms-css-value">{SHADOW_PRESETS.find(s => s.type === sectionProps.boxShadow)?.css || 'none'}</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.opacity && sectionProps.opacity !== 100 && <span className="cms-css-prop">  opacity: <span className="cms-css-value">{(sectionProps.opacity || 100) / 100}</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.cssRotate && <span className="cms-css-prop">  transform: <span className="cms-css-value">rotate({sectionProps.cssRotate}deg) scale({sectionProps.cssScaleX ?? 1}, {sectionProps.cssScaleY ?? 1}) skew({sectionProps.cssSkewX || 0}deg, {sectionProps.cssSkewY || 0}deg)</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.animation && sectionProps.animation !== 'none' && <span className="cms-css-prop">  animation: <span className="cms-css-value">{sectionProps.animation} {sectionProps.animDuration || 0.6}s {sectionProps.animEasing || 'ease'}</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.gap && <span className="cms-css-prop">  gap: <span className="cms-css-value">{sectionProps.gap}px</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.marginTop && <span className="cms-css-prop">  margin-top: <span className="cms-css-value">{sectionProps.marginTop}px</span>;</span>}
                                                        {'\n'}
                                                        {sectionProps.marginBottom && <span className="cms-css-prop">  margin-bottom: <span className="cms-css-value">{sectionProps.marginBottom}px</span>;</span>}
                                                        {'\n'}{`}`}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        </div>

                        {/* ═══ Footer — Professional with CSS summary + shortcuts ═══ */}
                        <div className="cms-editor-toolbar-wrapper">
                            {/* CSS Output summary — shows active properties */}
                            {activeTab && activeTab !== 'preview' && (
                                <div className="cms-editor-toolbar">
                                    <span className="cms-editor-toolbar__label">Actif:</span>
                                    {sectionProps.textColor && <span className="cms-style-pill">color: {sectionProps.textColor}</span>}
                                    {sectionProps.bgColor && sectionProps.bgColor !== 'transparent' && <span className="cms-style-pill">bg: {sectionProps.bgColor.length > 20 ? sectionProps.bgColor.substring(0, 20) + '...' : sectionProps.bgColor}</span>}
                                    {sectionProps.borderRadius && <span className="cms-style-pill">radius: {sectionProps.borderRadius}px</span>}
                                    {sectionProps.borderWidth && <span className="cms-style-pill">border: {sectionProps.borderWidth}px</span>}
                                    {sectionProps.fontSize && <span className="cms-style-pill">font: {sectionProps.fontSize}</span>}
                                    {sectionProps.fontWeight && sectionProps.fontWeight !== 'normal' && <span className="cms-style-pill">weight: {sectionProps.fontWeight}</span>}
                                    {sectionProps.boxShadow && sectionProps.boxShadow !== 'none' && <span className="cms-style-pill">shadow: {sectionProps.boxShadow}</span>}
                                    {sectionProps.textAlign && <span className="cms-style-pill">align: {sectionProps.textAlign}</span>}
                                </div>
                            )}
                            {/* Shortcuts + Stats bar */}
                            <div className="cms-editor-footer">
                                {/* Left: Stats */}
                                <div className="cms-editor-footer__left">
                                    <span className="cms-live-chip">
                                        <span className="cms-live-chip__dot" style={{ backgroundColor: '#a78bfa' }} />
                                        {filledFieldsCount}/{editableFields.length} champs
                                    </span>
                                </div>
                                {/* Right: Actions */}
                                <div className="cms-editor-footer__right">
                                    <button
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0}
                                        className="cms-editor-footer__btn cms-editor-footer__btn--ghost"
                                        title="Annuler (Ctrl+Z)"
                                    >
                                        <Undo2 className="cms-icon--xs" />
                                    </button>
                                    <button
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                        className="cms-editor-footer__btn cms-editor-footer__btn--ghost"
                                        title="Rétablir (Ctrl+Y)"
                                    >
                                        <Redo2 className="cms-icon--xs" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('Réinitialiser tous les styles ?')) {
                                                onPropsChange({});
                                                toast.success('Styles réinitialisés');
                                            }
                                        }}
                                        className="cms-editor-footer__btn cms-editor-footer__btn--danger"
                                        title="Réinitialiser"
                                    >
                                        <Trash2 className="cms-icon--xs" />
                                    </button>
                                    <div className="cms-kbd-hint--inline">
                                        <kbd className="cms-kbd-hint__key">←→</kbd>
                                        <span>onglets</span>
                                        <span className="mx-0.5">·</span>
                                        <kbd className="cms-kbd-hint__key">Esc</kbd>
                                        <span>fermer</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ==================================
// Field Group
// ==================================

function FieldGroup({ label, icon, color, children, defaultOpen = true }: {
    label: string;
    icon: React.ReactNode;
    color: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    const childCount = React.Children.count(children);

    return (
        <div className={`cms-field-group cms-field-group--${color} ${isOpen ? 'cms-field-group--open' : ''}`}>
            <button
                className="cms-field-group__header"
                onClick={() => setIsOpen(o => !o)}
            >
                <span className="cms-field-group__icon">{icon}</span>
                <span className="cms-field-group__title">{label}</span>
                <span className="cms-field-group__count">{childCount}</span>
                <ChevronDown className={`cms-icon--sm text-gray-400 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
            </button>
            {isOpen && (
                <div className="cms-field-group__body">
                    {children}
                </div>
            )}
        </div>
    );
}

// ==================================
// Inline Editable Field
// ==================================

function InlineEditableField({
    field,
    value,
    onChange,
    isExpanded,
    onToggle,
}: {
    field: EditableField;
    value: string;
    onChange: (value: string) => void;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const [localValue, setLocalValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
    const [isDragOverImage, setIsDragOverImage] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [linkTarget, setLinkTarget] = useState('_self');

    useEffect(() => { setLocalValue(value); }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current instanceof HTMLInputElement) inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (localValue !== value) {
            onChange(localValue);
            toast.success(`${field.label} mis à jour`);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setLocalValue(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') handleCancel();
    };

    // Preview image pour les champs image
    const imageUrl = field.type === 'image' ? localValue : '';
    const isLinkField = field.type === 'lien';
    const isImageField = field.type === 'image';
    const linkValid = isLinkField ? isValidUrl(localValue) : false;

    // Drag & drop pour images
    const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    
    const handleImageDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOverImage(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageUploadProgress(0);
            const reader = new FileReader();
            
            // Progress simulation ( FileReader ne supporte pas onprogress nativement pour readAsDataURL)
            const progressInterval = setInterval(() => {
                setImageUploadProgress(prev => {
                    if (prev === null || prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 100);
            
            reader.onload = (ev) => {
                clearInterval(progressInterval);
                setImageUploadProgress(100);
                const dataUrl = ev.target?.result as string;
                
                // Get image dimensions
                const img = new Image();
                img.onload = () => {
                    setImageDimensions({ width: img.width, height: img.height });
                };
                img.src = dataUrl;
                
                setLocalValue(dataUrl);
                onChange(dataUrl);
                toast.success(`Image chargée (${file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)}KB` : `${(file.size / (1024 * 1024)).toFixed(1)}MB`})`);
                
                setTimeout(() => {
                    setImageUploadProgress(null);
                }, 500);
            };
            reader.onerror = () => {
                clearInterval(progressInterval);
                setImageUploadProgress(null);
                toast.error('Erreur lors du chargement de l\'image');
            };
            reader.readAsDataURL(file);
        }
    }, [onChange]);

    return (
        <div className={`cms-inline-field group ${isEditing ? 'cms-inline-field--editing' : ''}`}>
            <div className="cms-inline-field__header">
                {/* Icon */}
                <span className={`cms-inline-field__icon ${isEditing ? 'cms-inline-field__icon--editing' : 'cms-inline-field__icon--idle'}`}>
                    {field.icon}
                </span>

                {/* Label */}
                <span className="cms-inline-field__label">{field.label}</span>

                {/* Input ou preview */}
                <div className="cms-inline-flex-min">
                    {isEditing ? (
                        field.multiline ? (
                            <textarea
                                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                                value={localValue}
                                onChange={(e) => setLocalValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onBlur={handleSave}
                                className="cms-inline-field__input resize-none"
                                rows={3}
                                placeholder={`Entrer ${field.label.toLowerCase()}...`}
                            />
                        ) : (
                            <div className="cms-content-editor__field">
                                <div className="relative">
                                    {/* Link protocol quick-select */}
                                    {isLinkField && (
                                        <div className="cms-inline-field__protocol">
                                            {URL_PROTOCOLS.map(p => (
                                                <button
                                                    key={p.value}
                                                    onClick={() => {
                                                        const newVal = localValue && !localValue.startsWith('/') && !localValue.startsWith('mailto:') && !localValue.startsWith('tel:') && !localValue.startsWith('http')
                                                            ? p.value + localValue
                                                            : p.value;
                                                        setLocalValue(newVal);
                                                    }}
                                                    className={`cms-inline-field__protocol-btn ${
                                                        localValue.startsWith(p.value)
                                                            ? 'cms-inline-field__protocol-btn--active'
                                                            : 'cms-inline-field__protocol-btn--idle'
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <input
                                        ref={inputRef as React.RefObject<HTMLInputElement>}
                                        type={field.type === 'lien' ? 'url' : field.type === 'nombre' ? 'number' : 'text'}
                                        value={localValue}
                                        onChange={(e) => setLocalValue(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={handleSave}
                                        className={`cms-inline-field__input ${
                                            isLinkField
                                                ? linkValid
                                                    ? 'cms-inline-field__input--link-valid'
                                                    : localValue.length > 0
                                                        ? 'cms-inline-field__input--link-invalid'
                                                        : ''
                                                : ''
                                        }`}
                                        placeholder={field.placeholder || `Entrer ${field.label.toLowerCase()}...`}
                                    />
                                    {/* Link validation indicator */}
                                    {isLinkField && localValue.length > 0 && (
                                        <span className={`cms-link-valid-indicator ${linkValid ? 'cms-link-valid-indicator--valid' : 'cms-link-valid-indicator--invalid'}`}>
                                            {linkValid ? '✓' : '✗'}
                                        </span>
                                    )}
                                </div>
                                {/* Link domain preview */}
                                {isLinkField && localValue.length > 0 && linkValid && (
                                    <div className="cms-link-preview">
                                        <Globe className="cms-link-preview__icon" />
                                        <span className="cms-link-preview__domain">{getUrlDomain(localValue)}</span>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <button
                            onClick={() => { setIsEditing(true); onToggle(); }}
                            className="cms-inline-field__preview"
                            title={localValue || `Cliquer pour éditer`}
                        >
                            {localValue ? (
                                isImageField ? (
                                    <span className="cms-inline-link-row">
                                        <span className="cms-inline-thumb">
                                            <img src={localValue} alt="" className="cms-inline-thumb__img" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        </span>
                                        <span className="truncate">{localValue.length > 30 ? localValue.substring(0, 30) + '...' : localValue}</span>
                                    </span>
                                ) : isLinkField ? (
                                    <span className="cms-inline-link-row">
                                        <LinkIcon className="cms-inline-link-icon" />
                                        <span className="truncate text-blue-500">{getUrlDomain(localValue)}</span>
                                    </span>
                                ) : localValue
                            ) : (
                                <span className="italic text-gray-300">Cliquer pour éditer...</span>
                            )}
                        </button>
                    )}
                </div>

                {/* Actions inline */}
                {isEditing && (
                    <div className="cms-icon-text shrink-0">
                        {isImageField && localValue && (
                            <button
                                onClick={() => { setLocalValue(''); onChange(''); setIsEditing(false); }}
                                className="cms-inline-action-btn cms-inline-action-btn--danger"
                                title="Supprimer l'image"
                            >
                                <Trash2 className="cms-icon--xs" />
                            </button>
                        )}
                        <button onClick={handleSave} className="cms-inline-action-btn cms-inline-action-btn--success" title="Valider (Entrée)">
                            <Check className="cms-icon--xs" />
                        </button>
                        <button onClick={handleCancel} className="cms-inline-action-btn cms-inline-action-btn--cancel" title="Annuler">
                            <X className="cms-icon--xs" />
                        </button>
                    </div>
                )}
            </div>

            {/* Character count for text fields */}
            {field.type === 'texte' && localValue && localValue.length > 0 && (
                <div className="cms-char-counter mx-2 mb-1" style={{ opacity: isEditing ? 1 : 0.6 }}>
                    <span>{localValue.length} car.</span>
                    <div className="cms-char-counter__bar">
                        <div
                            className="cms-char-counter__fill"
                            style={{
                                width: `${Math.min(100, (localValue.length / 500) * 100)}%`,
                                background: localValue.length > 400 ? '#ef4444' : localValue.length > 200 ? '#f59e0b' : '#10b981',
                            }}
                        />
                    </div>
                    <span>{Math.ceil(localValue.length / 5)} mots</span>
                </div>
            )}

            {/* Preview image amélioré avec drag & drop */}
            {isImageField && (
                <div
                    className={`cms-inline-field__dropzone mx-2 mb-1.5 ${
                        isDragOverImage ? 'cms-inline-field__dropzone--active' : ''
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOverImage(true); }}
                    onDragLeave={() => setIsDragOverImage(false)}
                    onDrop={handleImageDrop}
                >
                    {/* §765 — Upload progress indicator */}
                    {imageUploadProgress !== null && (
                        <div className="cms-image-upload-progress">
                            <div className="cms-image-upload-progress__bar" style={{ width: `${imageUploadProgress}%` }} />
                            <span className="cms-image-upload-progress__label">{imageUploadProgress}%</span>
                        </div>
                    )}
                    
                    {localValue ? (
                        <div className="relative group/img">
                            <img
                                src={localValue}
                                alt="Preview"
                                className="cms-mini-preview__image-large"
                                onLoad={(e) => {
                                    setImageLoading(false);
                                    const img = e.target as HTMLImageElement;
                                    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                                }}
                                onError={(e) => {
                                    setImageLoading(false);
                                    setImageError(true);
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60" fill="%23f3f4f6"><rect width="200" height="60"/><text x="50%" y="50%" text-anchor="middle" fill="%239ca3af" font-size="11">Image invalide</text></svg>';
                                }}
                            />
                            {/* Image overlay with actions */}
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center gap-1 opacity-0 group-hover/img:opacity-100">
                                <button
                                    onClick={() => { setIsEditing(true); onToggle(); }}
                                    className="cms-inline-image-overlay-btn"
                                >
                                    Changer
                                </button>
                                <button
                                    onClick={() => { setLocalValue(''); onChange(''); }}
                                    className="cms-inline-image-overlay-btn--danger"
                                >
                                    Supprimer
                                </button>
                            </div>
                            {/* Image dimensions badge */}
                            <div className="cms-inline-image-badge">
                                {localValue.startsWith('data:') ? 'Base64' : 'URL'}
                                {imageDimensions && (
                                    <span className="cms-inline-image-badge__dimensions">
                                        {imageDimensions.width}×{imageDimensions.height}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Drop zone quand pas d'image */
                        <div className="cms-inline-dropzone">
                            <Upload className="cms-inline-dropzone__icon" />
                            <span className="cms-inline-dropzone__label">Glisser une image ici</span>
                            <span className="cms-inline-dropzone__hint">ou cliquer pour éditer l'URL</span>
                        </div>
                    )}
                </div>
            )}

            {/* Link target selector (quand editing un lien) */}
            {isLinkField && isEditing && (
                <div className="mx-2 mb-1.5 rounded-md border border-gray-100 bg-gray-50/50 p-1.5">
                    <span className="cms-inline-field-label">Cible du lien</span>
                    <div className="cms-action-row--no-margin">
                        {LINK_TARGETS.map(t => (
                            <button
                                key={t.value}
                                onClick={() => {
                                    onChange(localValue);
                                    toast.success(`Cible: ${t.label}`);
                                }}
                                className={`cms-link-target-btn ${
                                    linkTarget === t.value
                                        ? 'cms-link-target-btn--active'
                                        : ''
                                }`}
                            >
                                <span>{t.icon}</span>
                                <span>{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* §770 — Link Preview avec favicon */}
            {isLinkField && localValue && isValidUrl(localValue) && (
                <div className="cms-link-preview mx-2 mb-1.5">
                    <div className="cms-link-preview__icon">
                        <img 
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(getUrlDomain(localValue))}&sz=32`}
                            alt="Favicon"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="%2394a3b8"><rect width="16" height="16" rx="2"/><path d="M4 4h8v8H4z" fill="%23fff"/></svg>';
                            }}
                        />
                    </div>
                    <div className="cms-link-preview__content">
                        <div className="cms-link-preview__domain">{getUrlDomain(localValue)}</div>
                        <div className="cms-link-preview__type">
                            {localValue.startsWith('mailto:') ? '📧 Email' : 
                             localValue.startsWith('tel:') ? '📞 Téléphone' :
                             localValue.startsWith('/') ? '🔗 Interne' : '🌐 Externe'}
                        </div>
                    </div>
                    <a 
                        href={localValue} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="cms-link-preview__open"
                        title="Ouvrir dans un nouvel onglet"
                    >
                        <ExternalLink className="cms-icon--xs" />
                    </a>
                </div>
            )}
        </div>
    );
}

// ==================================
// Gradient Builder — Éditeur visuel de dégradé
// ==================================

function GradientBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const [from, setFrom] = useState('#667eea');
    const [to, setTo] = useState('#764ba2');
    const [dir, setDir] = useState('135deg');
    const [gradType, setGradType] = useState<'linear' | 'radial' | 'conic'>('linear');

    const applyGradient = useCallback((f: string, t: string, d: string, type: 'linear' | 'radial' | 'conic') => {
        if (type === 'linear') onChange(`linear-gradient(${d}, ${f} 0%, ${t} 100%)`);
        else if (type === 'radial') onChange(`radial-gradient(circle at center, ${f} 0%, ${t} 100%)`);
        else onChange(`conic-gradient(from ${d}, ${f} 0%, ${t} 100%)`);
    }, [onChange]);

    const isCurrentGradient = value.includes('-gradient');

    return (
        <div className="cms-gradient-builder">
            <div className="cms-gradient-builder__header">
                <span className="cms-gradient-builder__title">
                    <Palette className="cms-icon--sm text-indigo-500" /> Dégradé
                </span>
                {isCurrentGradient && (
                    <span className="cms-gradient-builder__status">Actif</span>
                )}
            </div>
            {/* Gradient type selector — §115 */}
            <div className="cms-gradient-type-row">
                {[
                    { id: 'linear' as const, label: 'Linéaire', icon: '→' },
                    { id: 'radial' as const, label: 'Radial', icon: '◉' },
                    { id: 'conic' as const, label: 'Conique', icon: '◔' },
                ].map(t => (
                    <button
                        key={t.id}
                        className={`cms-gradient-type-btn ${gradType === t.id ? 'cms-gradient-type-btn--active' : ''}`}
                        onClick={() => { setGradType(t.id); applyGradient(from, to, dir, t.id); }}
                    >
                        <span className="cms-gradient-type-btn__icon">{t.icon}</span>
                        <span className="cms-gradient-type-btn__label">{t.label}</span>
                    </button>
                ))}
            </div>
            {/* Preview */}
            <div
                className="cms-gradient-preview"
                style={{ background: isCurrentGradient ? value : `linear-gradient(135deg, ${from}, ${to})` }}
            />
            {/* Angle dial — §115 visual angle control */}
            {gradType !== 'radial' && (
                <div className="cms-gradient-angle-dial">
                    <span className="cms-gradient-angle-dial__label">Angle</span>
                    <div className="cms-gradient-angle-dial__control">
                        <input
                            type="range" min={0} max={360} step={15}
                            value={parseInt(dir) || 135}
                            onChange={(e) => { const d = `${e.target.value}deg`; setDir(d); applyGradient(from, to, d, gradType); }}
                            className="cms-range-pro-slider"
                            style={{ flex: 1 }}
                        />
                        <span className="cms-gradient-angle-dial__value">{dir}</span>
                    </div>
                    {/* Compass rose */}
                    <div className="cms-gradient-compass">
                        {[
                            { angle: '0deg', label: '↑', pos: 'top' },
                            { angle: '90deg', label: '→', pos: 'right' },
                            { angle: '180deg', label: '↓', pos: 'bottom' },
                            { angle: '270deg', label: '←', pos: 'left' },
                            { angle: '45deg', label: '↗', pos: 'tr' },
                            { angle: '135deg', label: '↘', pos: 'br' },
                            { angle: '225deg', label: '↙', pos: 'bl' },
                            { angle: '315deg', label: '↖', pos: 'tl' },
                        ].map(d => (
                            <button
                                key={d.angle}
                                className={`cms-gradient-compass__point ${dir === d.angle ? 'cms-gradient-compass__point--active' : ''}`}
                                onClick={() => { setDir(d.angle); applyGradient(from, to, d.angle, gradType); }}
                                title={d.angle}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            {/* Direction selector — compass grid */}
            <div className="mb-2">
                <span className="cms-gradient-direction-label">Direction</span>
                <div className="cms-compact-grid--8">
                    {GRADIENT_DIRECTIONS.map(d => (
                        <button
                            key={d.angle}
                            onClick={() => { setDir(d.angle); applyGradient(from, to, d.angle); }}
                            className={`flex items-center justify-center rounded-md py-1 text-[10px] transition-all ${
                                dir === d.angle
                                    ? 'bg-indigo-100 text-indigo-600 ring-1 ring-indigo-300'
                                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                            title={`${d.angle} (${d.css})`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* Color stops */}
            <div className="cms-gradient-stops">
                <div className="cms-gradient-stop">
                    <div
                        className="cms-gradient-swatch"
                        style={{ backgroundColor: from }}
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'color'; input.value = from;
                            input.onchange = (e) => { setFrom((e.target as HTMLInputElement).value); applyGradient((e.target as HTMLInputElement).value, to, dir); };
                            input.click();
                        }}
                    />
                    <span className="cms-gradient-stop__label">Début</span>
                </div>
                <div className="cms-gradient-divider" />
                <div className="cms-gradient-stop cms-gradient-stop--end">
                    <span className="cms-gradient-stop__label">Fin</span>
                    <div
                        className="cms-gradient-swatch"
                        style={{ backgroundColor: to }}
                        onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'color'; input.value = to;
                            input.onchange = (e) => { setTo((e.target as HTMLInputElement).value); applyGradient(from, (e.target as HTMLInputElement).value, dir); };
                            input.click();
                        }}
                    />
                </div>
            </div>
            {/* Quick gradient presets */}
            <div className="cms-action-row--wrap">
                {[
                    { f: '#667eea', t: '#764ba2', d: '135deg' },
                    { f: '#f093fb', t: '#f5576c', d: '135deg' },
                    { f: '#4facfe', t: '#00f2fe', d: '90deg' },
                    { f: '#43e97b', t: '#38f9d7', d: '90deg' },
                    { f: '#fa709a', t: '#fee140', d: '90deg' },
                    { f: '#a18cd1', t: '#fbc2eb', d: '135deg' },
                    { f: '#fccb90', t: '#d57eeb', d: '135deg' },
                    { f: '#0f172a', t: '#1e293b', d: '180deg' },
                ].map((p, i) => (
                    <button
                        key={i}
                        className="h-4 w-6 rounded-sm border border-gray-200 transition-all hover:scale-110 hover:ring-1 hover:ring-indigo-300"
                        style={{ background: `linear-gradient(${p.d}, ${p.f}, ${p.t})` }}
                        onClick={() => { setFrom(p.f); setTo(p.t); setDir(p.d); onChange(`linear-gradient(${p.d}, ${p.f} 0%, ${p.t} 100%)`); }}
                    />
                ))}
            </div>
        </div>
    );
}

// ==================================
// RangeProSlider — Slider amélioré avec tooltip + gradient track §726
// ==================================

function RangeProSlider({ value, onChange, min, max, step = 1, unit = '', color = '#3b82f6', label }: {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    color?: string;
    label?: string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="cms-range-pro">
            <input
                type="range" min={min} max={max} step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="cms-range-pro__input"
                style={{ '--range-percent': `${pct}%`, '--range-color': color } as React.CSSProperties}
            />
            <div className="cms-range-pro__tooltip" style={{ left: `${pct}%` }}>{label ? `${label}: ` : ''}{value}{unit}</div>
        </div>
    );
}

// ==================================
// Rotation Dial — Cadran visuel de rotation
// ==================================

function RotationDial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const dialRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handlePointerEvent = useCallback((e: React.MouseEvent | MouseEvent) => {
        if (!dialRef.current) return;
        const rect = dialRef.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
        const normalized = ((angle % 360) + 360) % 360;
        onChange(Math.round(normalized > 180 ? normalized - 360 : normalized));
    }, [onChange]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        handlePointerEvent(e);
        const handleMove = (ev: MouseEvent) => { if (isDragging.current) handlePointerEvent(ev); };
        const handleUp = () => {
            isDragging.current = false;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
    }, [handlePointerEvent]);

    return (
        <div className="cms-rotation-dial">
            <div
                ref={dialRef}
                className="cms-rotation-dial__disc"
                onMouseDown={handleMouseDown}
                title="Cliquer-glisser pour rotation"
            >
                {/* Markers */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                    <div
                        key={deg}
                        className="cms-rotation-dial__marker"
                        style={{
                            top: `${50 - 42 * Math.cos(deg * Math.PI / 180)}%`,
                            left: `${50 + 42 * Math.sin(deg * Math.PI / 180)}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {deg === 0 ? '0' : deg === 90 ? '90' : deg === 180 ? '180' : deg === 270 ? '270' : '·'}
                    </div>
                ))}
                {/* Center dot */}
                <div className="cms-rotation-dial__center" />
                {/* Needle */}
                <div
                    className="cms-rotation-dial__needle"
                    style={{
                        transform: `translate(-50%, -100%) rotate(${value}deg)`,
                    }}
                />
                {/* Tip indicator */}
                <div
                    className="cms-rotation-dial__tip"
                    style={{
                        top: `${50 - 38 * Math.cos((value - 90) * Math.PI / 180)}%`,
                        left: `${50 + 38 * Math.sin((value - 90) * Math.PI / 180)}%`,
                    }}
                />
            </div>
            <div className="cms-rotation-dial__value-row">
                <span className="cms-rotation-dial__value">{value}°</span>
                <button
                    onClick={() => onChange(0)}
                    className="cms-rotation-dial__reset"
                    title="R\u00e9initialiser"
                >
                    <RefreshCw className="cms-rotation-dial__reset-icon" />
                </button>
            </div>
        </div>
    );
}

// ==================================
// Color Picker Field
// ==================================

import { ColorHarmonyPicker } from './ColorHarmonyPicker';

function ColorPickerField({ label, colors, value, onChange, isGradient, recentColors }: {
    label: string;
    colors: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
    isGradient?: boolean;
    recentColors?: string[];
}) {
    const [showAll, setShowAll] = useState(false);
    const [showHarmony, setShowHarmony] = useState(false);
    const displayColors = showAll ? colors : colors.slice(0, 8);

    const openNativePicker = () => {
        const input = document.createElement('input');
        input.type = 'color';
        input.value = value.startsWith('#') ? value : '#000000';
        input.onchange = (e) => onChange((e.target as HTMLInputElement).value);
        input.click();
    };

    return (
        <div className="cms-color-picker-card">
            <div className="cms-color-picker-card__header">
                <span className="cms-color-picker-card__label">{label}</span>
                <div className="cms-color-picker-card__actions">
                    {/* Current value preview + native picker */}
                    <div
                        className="cms-color-picker-card__preview"
                        style={{
                            background: value.startsWith('linear-gradient') ? value : value,
                            backgroundColor: value.startsWith('linear-gradient') ? undefined : value,
                        }}
                        onClick={openNativePicker}
                        title="Ouvrir le sélecteur de couleur"
                    />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="cms-color-picker-card__input"
                        placeholder="#000000"
                    />
                    <button
                        onClick={openNativePicker}
                        className="cms-color-picker-card__pipette-btn"
                        title="Sélecteur natif"
                    >
                        <Pipette className="cms-icon--sm" />
                    </button>
                </div>
            </div>
            {/* Couleurs récentes (si disponibles) */}
            {recentColors && recentColors.length > 0 && (
                <div className="mb-1.5">
                    <span className="cms-color-picker-card__recent-label">Récentes</span>
                    <div className="cms-flex-wrap-group">
                        {recentColors.map(color => (
                            <button
                                key={`recent-${color}`}
                                onClick={() => onChange(color)}
                                className={`cms-swatch cms-swatch--sm rounded-sm border transition-all hover:scale-110 ${
                                    value === color ? 'ring-2 ring-purple-400 ring-offset-1' : 'border-gray-200'
                                }`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
            {/* ═══ Harmony Picker Toggle ═══ */}
            <button
                onClick={() => setShowHarmony(!showHarmony)}
                className="cms-color-picker-card__harmony-toggle"
            >
                <Sparkles className="cms-icon--xs" />
                {showHarmony ? 'Masquer harmonies' : 'Harmonies de couleur'}
            </button>
            {showHarmony && (
                <ColorHarmonyPicker
                    value={value.startsWith('#') ? value : '#000000'}
                    onChange={(c) => { onChange(c); trackColor(c); }}
                    label={label}
                    recentColors={recentColors}
                    compact
                />
            )}
            <div className="cms-flex-wrap-group">
                {displayColors.map(color => (
                    <button
                        key={color.value}
                        onClick={() => { onChange(color.value); trackColor(color.value); }}
                        className={`cms-swatch cms-swatch--md rounded-sm border transition-all ${
                            value === color.value ? 'ring-2 ring-purple-400 ring-offset-1' : 'border-gray-200'
                        }`}
                        style={{
                            background: color.value.startsWith('linear-gradient') ? color.value : color.value,
                            backgroundColor: color.value.startsWith('linear-gradient') ? undefined : color.value,
                        }}
                        title={color.label}
                    />
                ))}
                {colors.length > 8 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="cms-color-picker-card__show-more"
                    >
                        {showAll ? '−' : `+${colors.length - 8}`}
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================================
// Button Style Selector
// ==================================

function ButtonStyleSelector({ value, onChange, buttonText, buttonBgColor, buttonTextColor, onBgColorChange, onTextColorChange }: {
    value: string;
    onChange: (v: string) => void;
    buttonText?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    onBgColorChange?: (v: string) => void;
    onTextColorChange?: (v: string) => void;
}) {
    const previewText = buttonText || 'Bouton';
    return (
        <div className="cms-btn-style-card">
            <span className="cms-btn-style-card__label">Style du bouton</span>
            {/* Live preview */}
            <div className="cms-btn-style-preview">
                <button
                    className={`cms-btn-style-preview__sample ${
                        value === 'primary' ? 'bg-blue-600 text-white rounded-md'
                        : value === 'secondary' ? 'bg-gray-100 text-gray-800 rounded-md border border-gray-200'
                        : value === 'outline' ? 'border-2 border-blue-600 text-blue-600 rounded-md bg-transparent'
                        : value === 'ghost' ? 'text-blue-600 underline rounded-md bg-transparent'
                        : value === 'pill' ? 'bg-blue-600 text-white rounded-full'
                        : value === 'shadow' ? 'bg-blue-600 text-white rounded-md shadow-lg'
                        : 'bg-blue-600 text-white rounded-md'
                    }`}
                    style={{
                        backgroundColor: buttonBgColor && value === 'primary' ? buttonBgColor : undefined,
                        color: buttonTextColor && value === 'primary' ? buttonTextColor : undefined,
                    }}
                    type="button"
                    disabled
                >
                    {previewText.length > 12 ? previewText.substring(0, 12) + '...' : previewText}
                </button>
                <span className="cms-btn-style-preview__label">{BUTTON_STYLES.find(s => s.value === value)?.label || value}</span>
            </div>
            <div className="cms-btn-variant-grid">
                {BUTTON_STYLES.map(style => (
                    <button
                        key={style.value}
                        onClick={() => onChange(style.value)}
                        className={`cms-btn-variant-btn ${value === style.value ? 'cms-btn-variant-btn--active' : ''} ${style.preview}`}
                        title={style.label}
                    >
                        Aa
                    </button>
                ))}
            </div>
            {/* Quick button colors */}
            {onBgColorChange && (
                <div className="cms-btn-color-quick">
                    <span className="cms-btn-color-quick__label">Couleur</span>
                    <div className="cms-btn-color-quick__swatches">
                        {['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#db2777', '#0d9488', '#111827'].map(color => (
                            <button
                                key={color}
                                className={`cms-btn-color-swatch ${buttonBgColor === color ? 'cms-btn-color-swatch--active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => onBgColorChange(color)}
                                title={color}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================================
// Number Input — Stepper control style Figma
// ==================================

function NumberInput({ label, value, onChange, suffix, min, max, step }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    min?: number;
    max?: number;
    step?: number;
}) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(String(value));
    const inputRef = React.useRef<HTMLInputElement>(null);
    const stepVal = step || 1;
    const minVal = min ?? 0;
    const maxVal = max ?? 999;

    React.useEffect(() => { setEditValue(String(value)); }, [value]);

    const clamp = (v: number) => Math.min(maxVal, Math.max(minVal, v));
    const increment = () => onChange(clamp(value + stepVal));
    const decrement = () => onChange(clamp(value - stepVal));

    const commitEdit = () => {
        const parsed = parseInt(editValue);
        if (!isNaN(parsed)) onChange(clamp(parsed));
        else setEditValue(String(value));
        setIsEditing(false);
    };

    return (
        <div>
            <label className="cms-number-input__label">{label}</label>
            <div className="cms-number-input__row">
                {/* Slider */}
                <input
                    type="range"
                    min={minVal}
                    max={maxVal}
                    step={stepVal}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="cms-range flex-1 h-1 cursor-pointer appearance-none rounded-full"
                />
                {/* Stepper control */}
                <div className="flex items-center rounded-md border border-gray-200 bg-white overflow-hidden transition-colors focus-within:border-purple-300 focus-within:ring-1 focus-within:ring-purple-200">
                    <button
                        onClick={decrement}
                        className="flex h-5 w-4 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:bg-gray-200"
                        title={`Moins (-${stepVal})`}
                    >
                        <Minus className="h-2 w-2" />
                    </button>
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') commitEdit();
                                if (e.key === 'Escape') { setEditValue(String(value)); setIsEditing(false); }
                            }}
                            className="cms-number-input__edit"
                            autoFocus
                        />
                    ) : (
                        <button
                            onClick={() => { setIsEditing(true); setTimeout(() => inputRef.current?.select(), 0); }}
                            className="cms-number-input__display"
                            title="Cliquer pour modifier"
                        >
                            {value}{suffix}
                        </button>
                    )}
                    <button
                        onClick={increment}
                        className="flex h-5 w-4 items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:bg-gray-200"
                        title={`Plus (+${stepVal})`}
                    >
                        <Plus className="h-2 w-2" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ==================================
// Helpers
// ==================================

function getFieldValue(props: Record<string, any>, key: string): string {
    if (key === 'imageAlt') return props.imageAlt || props.alt || '';
    if (key === 'imageUrl') return props.imageUrl || props.image || '';
    return props[key] || '';
}

/** Convertit la taille de police CMS en pixels pour le preview */
function getPreviewFontSize(size: string): number {
    const map: Record<string, number> = {
        'xs': 10, 'sm': 11, 'base': 12, 'lg': 13, 'xl': 14,
        '2xl': 16, '3xl': 18, '4xl': 22, '5xl': 26,
    };
    return map[size] || 12;
}

/** Convertit le poids de police CMS en CSS */
function getFontWeightCSS(weight?: string): number {
    const map: Record<string, number> = {
        'normal': 400, 'medium': 500, 'semibold': 600, 'bold': 700, 'extrabold': 800,
    };
    return map[weight || 'normal'] || 400;
}

/** Convertit la famille de police CMS en CSS */
function getFontFamilyCSS(family?: string): string {
    const map: Record<string, string> = {
        'sans': 'system-ui, sans-serif',
        'serif': 'Georgia, serif',
        'mono': 'Menlo, monospace',
        'display': 'system-ui, sans-serif',
    };
    return map[family || 'sans'] || 'system-ui, sans-serif';
}

// ==================================
// Prop Badge (preview tab)
// ==================================

function PropBadge({ label, value, type }: {
    label: string;
    value: string;
    type?: 'color' | 'text';
}) {
    return (
        <div className={`cms-prop-indicator ${type === 'color' ? 'cms-prop-indicator--color' : ''}`}>
            {type === 'color' ? (
                <div
                    className="cms-prop-indicator__swatch"
                    style={{ backgroundColor: value.startsWith('linear-gradient') ? undefined : value }}
                />
            ) : (
                <span style={{ fontSize: '8px', color: '#9ca3af', flexShrink: 0 }}>{label}</span>
            )}
            <span style={{ fontSize: '8px', color: '#4b5563', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value.startsWith('linear-gradient') ? 'Dégradé' : value}
            </span>
        </div>
    );
}
