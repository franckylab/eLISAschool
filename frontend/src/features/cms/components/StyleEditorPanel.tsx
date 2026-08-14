/**
 * ==================================
 * eLISAschool - Panneau d'édition de style visuel CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Panneau complet de personnalisation visuelle :
 * typographie, arrière-plan, espacement, bordures, ombres, boutons.
 * Preview live + presets + application globale.
 */

import { useState, useCallback, useMemo } from 'react';
import {
    Palette, Type, Square, Layers, MousePointer, Sparkles,
    ChevronDown, ChevronRight, RotateCcw, Copy, Check,
} from 'lucide-react';
import {
    type SectionStyleConfig, type TypographyStyle, type BackgroundStyle,
    type SpacingStyle, type BorderStyle, type ShadowStyle, type ButtonStyle,
    STYLE_PRESETS, typographyToCSS, backgroundToCSS, spacingToCSS, borderToCSS, shadowToCSS,
    mergeSectionStyles,
    BUTTON_VARIANTS, BUTTON_SIZES, GRADIENT_DIRECTIONS,
} from '../puck/shared-styles';

// ==================================
// Types
// ==================================

interface StyleEditorPanelProps {
    config: SectionStyleConfig;
    onChange: (config: SectionStyleConfig) => void;
    onApplyGlobal?: (config: SectionStyleConfig) => void;
}

type Section = 'typography' | 'background' | 'spacing' | 'border' | 'shadow' | 'button';

// ==================================
// Valeurs par défaut
// ==================================

const DEFAULT_TYPO: TypographyStyle = {
    fontFamily: 'sans',
    fontWeight: 'normal',
    fontSize: 'base',
    lineHeight: 'relaxed',
    letterSpacing: 'normal',
    textAlign: 'left',
    textTransform: 'none',
};

const DEFAULT_BG: BackgroundStyle = {
    type: 'color',
    color: '#ffffff',
    overlay: false,
    overlayColor: '#000000',
    overlayOpacity: 0,
    imagePosition: 'cover',
};

const DEFAULT_SPACING: SpacingStyle = {
    paddingTop: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
    paddingBottom: 'clamp(2rem, 1.5rem + 2vw, 4rem)',
    paddingLeft: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
    paddingRight: 'clamp(1rem, 0.5rem + 2vw, 2rem)',
    marginTop: '0',
    marginBottom: '0',
    gap: 'clamp(0.5rem, 0.4rem + 0.3vw, 1rem)',
};

const DEFAULT_BORDER: BorderStyle = {
    width: 'none',
    color: '#e5e7eb',
    style: 'solid',
    radius: 'none',
};

const DEFAULT_SHADOW: ShadowStyle = {
    type: 'none',
};

const DEFAULT_BUTTON: ButtonStyle = {
    texte: 'Cliquez ici',
    variant: 'primary',
    size: 'md',
    borderRadius: 'md',
    fullWidth: false,
};

// ==================================
// Presets visuels (noms + descriptions)
// ==================================

const PRESET_INFO = [
    { id: 'heroClassic', nom: 'Hero Classique', desc: 'Gradient bleu-violet, texte blanc centré' },
    { id: 'contentStandard', nom: 'Contenu Standard', desc: 'Fond blanc, texte noir, spacing aéré' },
    { id: 'darkElegant', nom: 'Sombre Élégant', desc: 'Fond sombre, serif, texte clair' },
    { id: 'cardSoft', nom: 'Carte Douce', desc: 'Bordure fine, ombre portée, coins arrondis' },
] as const;

// ==================================
// Composant accordéon
// ==================================

function AccordionSection({
    title, icon, isOpen, onToggle, children,
}: {
    title: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
            >
                <span className="text-gray-400">{icon}</span>
                <span className="flex-1 text-xs font-semibold text-gray-700">{title}</span>
                {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                }
            </button>
            {isOpen && <div className="px-3 pb-3">{children}</div>}
        </div>
    );
}

// ==================================
// Composants de contrôle
// ==================================

function SelectField({ label, value, options, onChange }: {
    label: string;
    value: string;
    options: readonly { label: string; value: string }[];
    onChange: (v: string) => void;
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

function ColorField({ label, value, onChange }: {
    label: string;
    value?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value || '#000000'}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-7 w-7 cursor-pointer rounded border border-gray-200"
                />
                <input
                    type="text"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-mono text-gray-700 focus:border-blue-400 focus:outline-none"
                />
            </div>
        </div>
    );
}

function TextField({ label, value, onChange, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
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

function ToggleField({ label, checked, onChange }: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
                <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'left-[18px]' : 'left-0.5'}`}
                />
            </button>
        </div>
    );
}

// ==================================
// Preview en miniature
// ==================================

function StylePreview({ config }: { config: SectionStyleConfig }) {
    const previewStyle = useMemo(() => mergeSectionStyles(config), [config]);

    return (
        <div className="mx-3 mb-3 rounded-lg border border-gray-200 p-1">
            <div className="mb-1 text-[9px] font-medium text-gray-400 uppercase">Aperçu</div>
            <div
                className="rounded-md p-4 text-center transition-all duration-300"
                style={previewStyle}
            >
                <p style={{ fontWeight: config.typography?.fontWeight ? { normal: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 }[config.typography.fontWeight] : undefined }}>
                    Texte d'exemple
                </p>
                {config.button && (
                    <button className="mt-2 rounded-md bg-blue-500 px-3 py-1 text-xs text-white">
                        {config.button.texte || 'Bouton'}
                    </button>
                )}
            </div>
        </div>
    );
}

// ==================================
// Composant principal
// ==================================

export function StyleEditorPanel({ config: rawConfig, onChange, onApplyGlobal }: StyleEditorPanelProps) {
    const config = rawConfig || {} as SectionStyleConfig;
    const [openSections, setOpenSections] = useState<Set<Section>>(new Set(['typography']));
    const [copied, setCopied] = useState(false);

    const toggleSection = useCallback((section: Section) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
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

    // Appliquer un preset
    const appliquerPreset = useCallback((presetId: string) => {
        const preset = STYLE_PRESETS[presetId as keyof typeof STYLE_PRESETS];
        if (preset) {
            onChange({ ...config, ...preset });
        }
    }, [config, onChange]);

    // Réinitialiser
    const reinitialiser = useCallback(() => {
        onChange({
            typography: DEFAULT_TYPO,
            background: DEFAULT_BG,
            spacing: DEFAULT_SPACING,
            border: DEFAULT_BORDER,
            shadow: DEFAULT_SHADOW,
            button: config.button,
        });
    }, [config, onChange]);

    // Copier le CSS
    const copierCSS = useCallback(() => {
        const css = mergeSectionStyles(config);
        const cssText = Object.entries(css).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v};`).join('\n');
        navigator.clipboard.writeText(cssText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [config]);

    const typo = config.typography || DEFAULT_TYPO;
    const bg = config.background || DEFAULT_BG;
    const spacing = config.spacing || DEFAULT_SPACING;
    const border = config.border || DEFAULT_BORDER;
    const shadow = config.shadow || DEFAULT_SHADOW;
    const button = config.button || DEFAULT_BUTTON;

    return (
        <div className="space-y-0">
            {/* Header avec actions */}
            <div className="flex items-center gap-1 border-b border-gray-100 px-3 py-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                <span className="flex-1 text-[10px] font-semibold text-gray-500 uppercase">Éditeur de style</span>
                <button onClick={copierCSS} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Copier le CSS">
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </button>
                <button onClick={reinitialiser} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Réinitialiser">
                    <RotateCcw className="h-3 w-3" />
                </button>
            </div>

            {/* Preview */}
            <StylePreview config={config} />

            {/* Presets rapides */}
            <div className="border-b border-gray-100 px-3 pb-3">
                <p className="mb-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Presets rapides</p>
                <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_INFO.map(p => (
                        <button
                            key={p.id}
                            onClick={() => appliquerPreset(p.id)}
                            className="rounded-lg border border-gray-200 p-2 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
                        >
                            <p className="text-[10px] font-semibold text-gray-700">{p.nom}</p>
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

            {/* Accordéon sections */}
            <div>
                {/* Typographie */}
                <AccordionSection
                    title="Typographie"
                    icon={<Type className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('typography')}
                    onToggle={() => toggleSection('typography')}
                >
                    <div className="space-y-2">
                        <SelectField label="Police" value={typo.fontFamily} options={[
                            { label: 'Sans-serif', value: 'sans' },
                            { label: 'Serif', value: 'serif' },
                            { label: 'Mono', value: 'mono' },
                            { label: 'Display', value: 'display' },
                        ]} onChange={(v) => updateTypo({ fontFamily: v as TypographyStyle['fontFamily'] })} />
                        <SelectField label="Poids" value={typo.fontWeight} options={[
                            { label: 'Normal', value: 'normal' },
                            { label: 'Medium', value: 'medium' },
                            { label: 'Semi-bold', value: 'semibold' },
                            { label: 'Bold', value: 'bold' },
                            { label: 'Extra-bold', value: 'extrabold' },
                        ]} onChange={(v) => updateTypo({ fontWeight: v as TypographyStyle['fontWeight'] })} />
                        <SelectField label="Taille" value={typo.fontSize} options={[
                            { label: 'XS', value: 'xs' }, { label: 'SM', value: 'sm' },
                            { label: 'Base', value: 'base' }, { label: 'LG', value: 'lg' },
                            { label: 'XL', value: 'xl' }, { label: '2XL', value: '2xl' },
                            { label: '3XL', value: '3xl' }, { label: '4XL', value: '4xl' },
                            { label: '5XL', value: '5xl' },
                        ]} onChange={(v) => updateTypo({ fontSize: v as TypographyStyle['fontSize'] })} />
                        <SelectField label="Interligne" value={typo.lineHeight} options={[
                            { label: 'Serré', value: 'tight' }, { label: 'Normal', value: 'normal' },
                            { label: 'Aéré', value: 'relaxed' }, { label: 'Large', value: 'loose' },
                        ]} onChange={(v) => updateTypo({ lineHeight: v as TypographyStyle['lineHeight'] })} />
                        <SelectField label="Espacement lettres" value={typo.letterSpacing} options={[
                            { label: 'Très serré', value: 'tighter' }, { label: 'Serré', value: 'tight' },
                            { label: 'Normal', value: 'normal' }, { label: 'Large', value: 'wide' },
                            { label: 'Très large', value: 'wider' },
                        ]} onChange={(v) => updateTypo({ letterSpacing: v as TypographyStyle['letterSpacing'] })} />
                        <SelectField label="Alignement" value={typo.textAlign} options={[
                            { label: 'Gauche', value: 'left' }, { label: 'Centre', value: 'center' },
                            { label: 'Droite', value: 'right' }, { label: 'Justifié', value: 'justify' },
                        ]} onChange={(v) => updateTypo({ textAlign: v as TypographyStyle['textAlign'] })} />
                        <SelectField label="Transformation" value={typo.textTransform} options={[
                            { label: 'Aucune', value: 'none' }, { label: 'MAJUSCULES', value: 'uppercase' },
                            { label: 'minuscules', value: 'lowercase' }, { label: 'Capitalize', value: 'capitalize' },
                        ]} onChange={(v) => updateTypo({ textTransform: v as TypographyStyle['textTransform'] })} />
                        <ColorField label="Couleur texte" value={typo.color} onChange={(v) => updateTypo({ color: v })} />
                    </div>
                </AccordionSection>

                {/* Arrière-plan */}
                <AccordionSection
                    title="Arrière-plan"
                    icon={<Layers className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('background')}
                    onToggle={() => toggleSection('background')}
                >
                    <div className="space-y-2">
                        <SelectField label="Type" value={bg.type} options={[
                            { label: 'Couleur', value: 'color' },
                            { label: 'Dégradé', value: 'gradient' },
                            { label: 'Image', value: 'image' },
                        ]} onChange={(v) => updateBg({ type: v as BackgroundStyle['type'] })} />

                        {bg.type === 'color' && (
                            <ColorField label="Couleur" value={bg.color} onChange={(v) => updateBg({ color: v })} />
                        )}

                        {bg.type === 'gradient' && (
                            <>
                                <ColorField label="De" value={bg.gradientFrom} onChange={(v) => updateBg({ gradientFrom: v })} />
                                <ColorField label="À" value={bg.gradientTo} onChange={(v) => updateBg({ gradientTo: v })} />
                                <SelectField label="Direction" value={bg.gradientDirection || 'to-br'} options={GRADIENT_DIRECTIONS} onChange={(v) => updateBg({ gradientDirection: v as BackgroundStyle['gradientDirection'] })} />
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
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-500 uppercase">Opacité: {Math.round(bg.overlayOpacity * 100)}%</label>
                                    <input
                                        type="range" min="0" max="1" step="0.05"
                                        value={bg.overlayOpacity}
                                        onChange={(e) => updateBg({ overlayOpacity: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </AccordionSection>

                {/* Espacement */}
                <AccordionSection
                    title="Espacement"
                    icon={<Square className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('spacing')}
                    onToggle={() => toggleSection('spacing')}
                >
                    <div className="space-y-2">
                        <TextField label="Padding haut" value={spacing.paddingTop} onChange={(v) => updateSpacing({ paddingTop: v })} placeholder="2rem" />
                        <TextField label="Padding bas" value={spacing.paddingBottom} onChange={(v) => updateSpacing({ paddingBottom: v })} placeholder="2rem" />
                        <TextField label="Padding gauche" value={spacing.paddingLeft} onChange={(v) => updateSpacing({ paddingLeft: v })} placeholder="1rem" />
                        <TextField label="Padding droit" value={spacing.paddingRight} onChange={(v) => updateSpacing({ paddingRight: v })} placeholder="1rem" />
                        <TextField label="Margin haut" value={spacing.marginTop} onChange={(v) => updateSpacing({ marginTop: v })} placeholder="0" />
                        <TextField label="Margin bas" value={spacing.marginBottom} onChange={(v) => updateSpacing({ marginBottom: v })} placeholder="0" />
                        <TextField label="Gap" value={spacing.gap} onChange={(v) => updateSpacing({ gap: v })} placeholder="1rem" />
                    </div>
                </AccordionSection>

                {/* Bordure */}
                <AccordionSection
                    title="Bordure"
                    icon={<Square className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('border')}
                    onToggle={() => toggleSection('border')}
                >
                    <div className="space-y-2">
                        <SelectField label="Épaisseur" value={border.width} options={[
                            { label: 'Aucune', value: 'none' }, { label: 'Fine (1px)', value: 'thin' },
                            { label: 'Moyenne (2px)', value: 'medium' }, { label: 'Épaisse (4px)', value: 'thick' },
                        ]} onChange={(v) => updateBorder({ width: v as BorderStyle['width'] })} />
                        {border.width !== 'none' && (
                            <>
                                <ColorField label="Couleur" value={border.color} onChange={(v) => updateBorder({ color: v })} />
                                <SelectField label="Style" value={border.style} options={[
                                    { label: 'Continue', value: 'solid' }, { label: 'Tirets', value: 'dashed' },
                                    { label: 'Points', value: 'dotted' }, { label: 'Double', value: 'double' },
                                ]} onChange={(v) => updateBorder({ style: v as BorderStyle['style'] })} />
                            </>
                        )}
                        <SelectField label="Rayon coins" value={border.radius} options={[
                            { label: 'Aucun', value: 'none' }, { label: 'SM (4px)', value: 'sm' },
                            { label: 'MD (6px)', value: 'md' }, { label: 'LG (8px)', value: 'lg' },
                            { label: 'XL (12px)', value: 'xl' }, { label: '2XL (16px)', value: '2xl' },
                            { label: 'Plein', value: 'full' },
                        ]} onChange={(v) => updateBorder({ radius: v as BorderStyle['radius'] })} />
                    </div>
                </AccordionSection>

                {/* Ombre */}
                <AccordionSection
                    title="Ombre"
                    icon={<MousePointer className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('shadow')}
                    onToggle={() => toggleSection('shadow')}
                >
                    <div className="space-y-2">
                        <SelectField label="Type" value={shadow.type} options={[
                            { label: 'Aucune', value: 'none' },
                            { label: 'Petite', value: 'sm' },
                            { label: 'Moyenne', value: 'md' },
                            { label: 'Grande', value: 'lg' },
                            { label: 'XL', value: 'xl' },
                            { label: '2XL', value: '2xl' },
                            { label: 'Intérieure', value: 'inner' },
                            { label: 'Lueur', value: 'glow' },
                        ]} onChange={(v) => updateShadow({ type: v as ShadowStyle['type'] })} />
                    </div>
                </AccordionSection>

                {/* Bouton */}
                <AccordionSection
                    title="Bouton"
                    icon={<Palette className="h-3.5 w-3.5" />}
                    isOpen={openSections.has('button')}
                    onToggle={() => toggleSection('button')}
                >
                    <div className="space-y-2">
                        <TextField label="Texte" value={button.texte} onChange={(v) => updateButton({ texte: v })} placeholder="Cliquez ici" />
                        <TextField label="Lien" value={button.lien || ''} onChange={(v) => updateButton({ lien: v })} placeholder="/page ou https://..." />
                        <SelectField label="Variant" value={button.variant} options={BUTTON_VARIANTS} onChange={(v) => updateButton({ variant: v as ButtonStyle['variant'] })} />
                        <SelectField label="Taille" value={button.size} options={BUTTON_SIZES} onChange={(v) => updateButton({ size: v as ButtonStyle['size'] })} />
                        <SelectField label="Rayon coins" value={button.borderRadius} options={[
                            { label: 'Aucun', value: 'none' }, { label: 'SM', value: 'sm' },
                            { label: 'MD', value: 'md' }, { label: 'LG', value: 'lg' },
                            { label: 'Plein', value: 'full' },
                        ]} onChange={(v) => updateButton({ borderRadius: v as ButtonStyle['borderRadius'] })} />
                        <ToggleField label="Pleine largeur" checked={button.fullWidth} onChange={(v) => updateButton({ fullWidth: v })} />
                    </div>
                </AccordionSection>
            </div>
        </div>
    );
}
