/**
 * ==================================
 * eLISAschool - Personnalisation de thème CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Interface de personnalisation du thème : couleurs, typographie,
 * preview live. Utilisé dans _auth.cms.themes.tsx.
 */

import { useState, useEffect, useMemo } from 'react';
import type { CmsTheme } from '../types/cms.types';
import { Check, Eye, RotateCcw, Palette, Sparkles } from 'lucide-react';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { THEME_PRESETS, CATEGORIE_LABELS, CATEGORIE_COLORS, type ThemePreset } from '../lib/theme-presets';

interface CmsThemeCustomizerProps {
    theme: Partial<CmsTheme>;
    onChange: (updates: Partial<CmsTheme>) => void;
    onReset?: () => void;
}

const COULEURS_PRESETS = [
    { nom: 'Vert', primaire: '#28a745', secondaire: '#20c997', accent: '#ffc107' },
    { nom: 'Bleu', primaire: '#007bff', secondaire: '#6f42c1', accent: '#fd7e14' },
    { nom: 'Rouge', primaire: '#dc3545', secondaire: '#e83e8c', accent: '#ffc107' },
    { nom: 'Violet', primaire: '#6f42c1', secondaire: '#007bff', accent: '#20c997' },
    { nom: 'Orange', primaire: '#fd7e14', secondaire: '#ffc107', accent: '#007bff' },
    { nom: 'Marron', primaire: '#795548', secondaire: '#a1887f', accent: '#ffc107' },
    { nom: 'Rose', primaire: '#e91e63', secondaire: '#9c27b0', accent: '#00bcd4' },
    { nom: 'Turquoise', primaire: '#00bcd4', secondaire: '#009688', accent: '#ff5722' },
];

const POLICES_TITRE = [
    { value: "'Inter', sans-serif", label: 'Inter' },
    { value: "'Poppins', sans-serif", label: 'Poppins' },
    { value: "'Montserrat', sans-serif", label: 'Montserrat' },
    { value: "'Playfair Display', serif", label: 'Playfair Display' },
    { value: "'Roboto', sans-serif", label: 'Roboto' },
    { value: "'Open Sans', sans-serif", label: 'Open Sans' },
];

const POLICES_CORPS = [
    { value: "'Inter', sans-serif", label: 'Inter' },
    { value: "'Roboto', sans-serif", label: 'Roboto' },
    { value: "'Open Sans', sans-serif", label: 'Open Sans' },
    { value: "'Lato', sans-serif", label: 'Lato' },
    { value: "'Source Sans Pro', sans-serif", label: 'Source Sans Pro' },
];

export function CmsThemeCustomizer({ theme, onChange, onReset }: CmsThemeCustomizerProps) {
    const [couleurs, setCouleurs] = useState(theme.couleurs || {
        primaire: '#28a745',
        secondaire: '#20c997',
        accent: '#ffc107',
        fond: '#ffffff',
        texte: '#1a1a2e',
        texteClair: '#6c757d',
    });

    const [typographie, setTypographie] = useState(theme.typographie || {
        titre: "'Inter', sans-serif",
        corps: "'Inter', sans-serif",
    });

    const [categorieFiltre, setCategorieFiltre] = useState<ThemePreset['categorie'] | 'tous'>('tous');
    const [themeActif, setThemeActif] = useState<string | null>(null);

    // Sync avec le parent
    useEffect(() => {
        onChange({ couleurs, typographie });
    }, [couleurs, typographie]);

    // Preview styles
    const previewStyles = useMemo(() => ({
        '--preview-primary': couleurs.primaire,
        '--preview-secondary': couleurs.secondaire,
        '--preview-accent': couleurs.accent,
        '--preview-bg': couleurs.fond,
        '--preview-text': couleurs.texte,
        '--preview-text-light': couleurs.texteClair,
        '--preview-font-title': typographie.titre,
        '--preview-font-body': typographie.corps,
    } as Record<string, string>), [couleurs, typographie]);

    const appliquerPreset = (preset: typeof COULEURS_PRESETS[0]) => {
        setCouleurs(prev => ({
            ...prev,
            primaire: preset.primaire,
            secondaire: preset.secondaire,
            accent: preset.accent,
        }));
        setThemeActif(null);
    };

    /** Applique un thème complet (one-click) */
    const appliquerThemePreset = (preset: ThemePreset) => {
        setCouleurs({ ...preset.theme.couleurs });
        setTypographie({ ...preset.theme.typographie });
        setThemeActif(preset.id);
    };

    const themesFiltres = categorieFiltre === 'tous'
        ? THEME_PRESETS
        : THEME_PRESETS.filter(t => t.categorie === categorieFiltre);

    const categories = Object.entries(CATEGORIE_LABELS) as [ThemePreset['categorie'], string][];

    return (
        <div className="space-y-6">
            {/* ─── Thèmes prédéfinis one-click ─────────────────────── */}
            <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Thèmes prédéfinis
                </label>
                {/* Filtre catégories */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                    <button
                        onClick={() => setCategorieFiltre('tous')}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                            categorieFiltre === 'tous'
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                    >
                        Tous
                    </button>
                    {categories.map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setCategorieFiltre(key)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                categorieFiltre === key
                                    ? 'text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                            style={categorieFiltre === key ? { backgroundColor: CATEGORIE_COLORS[key] } : undefined}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {/* Grille de thèmes */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {themesFiltres.map(preset => (
                        <button
                            key={preset.id}
                            onClick={() => appliquerThemePreset(preset)}
                            className={`group relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all hover:scale-[1.02] ${
                                themeActif === preset.id
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-transparent bg-gray-50 hover:border-gray-200 hover:shadow-sm dark:bg-gray-800/50 dark:hover:border-gray-700'
                            }`}
                            title={preset.description}
                        >
                            {/* Preview miniature du thème */}
                            <div
                                className="h-10 w-full rounded-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${preset.theme.couleurs.primaire}, ${preset.theme.couleurs.secondaire})`,
                                }}
                            >
                                <div className="flex h-full items-center justify-center text-lg">
                                    {preset.thumbnail}
                                </div>
                            </div>
                            <span className="text-[10px] font-medium leading-tight text-center">
                                {preset.nom}
                            </span>
                            {/* Badge actif */}
                            {themeActif === preset.id && (
                                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white">
                                    <Check className="h-2.5 w-2.5" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Presets de couleurs rapides ─────────────────────── */}
            <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Palette className="h-4 w-4" />
                    Presets de couleurs
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {COULEURS_PRESETS.map(preset => (
                        <button
                            key={preset.nom}
                            onClick={() => appliquerPreset(preset)}
                            className="flex flex-col items-center gap-1 rounded-lg border p-2 transition-all hover:border-primary"
                            title={preset.nom}
                        >
                            <div className="flex gap-0.5">
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.primaire }} />
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.secondaire }} />
                                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: preset.accent }} />
                            </div>
                            <span className="text-[10px] opacity-60">{preset.nom}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Couleurs individuelles ──────────────────────────── */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Couleurs personnalisées</label>
                <div className="grid grid-cols-2 gap-3">
                    <ColorField
                        label="Primaire"
                        value={couleurs.primaire}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, primaire: v }))}
                    />
                    <ColorField
                        label="Secondaire"
                        value={couleurs.secondaire}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, secondaire: v }))}
                    />
                    <ColorField
                        label="Accent"
                        value={couleurs.accent}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, accent: v }))}
                    />
                    <ColorField
                        label="Fond"
                        value={couleurs.fond}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, fond: v }))}
                    />
                    <ColorField
                        label="Texte"
                        value={couleurs.texte}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, texte: v }))}
                    />
                    <ColorField
                        label="Texte clair"
                        value={couleurs.texteClair}
                        onChange={(v) => setCouleurs(prev => ({ ...prev, texteClair: v }))}
                    />
                </div>
            </div>

            {/* ─── Typographie ─────────────────────────────────────── */}
            <div>
                <label className="mb-2 block text-sm font-semibold">Typographie</label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="mb-1 block text-xs opacity-60">Titres</label>
                        <select
                            value={typographie.titre}
                            onChange={(e) => setTypographie(prev => ({ ...prev, titre: e.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {POLICES_TITRE.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="mb-1 block text-xs opacity-60">Corps de texte</label>
                        <select
                            value={typographie.corps}
                            onChange={(e) => setTypographie(prev => ({ ...prev, corps: e.target.value }))}
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                        >
                            {POLICES_CORPS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ─── Reset ──────────────────────────────────────────── */}
            {onReset && (
                <button
                    onClick={onReset}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <RotateCcw className="h-3 w-3" />
                    Réinitialiser les valeurs par défaut
                </button>
            )}

            {/* ─── Preview live ───────────────────────────────────── */}
            <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Eye className="h-4 w-4" />
                    Aperçu
                </label>
                <div
                    className="overflow-hidden rounded-xl border"
                    style={{ ...previewStyles, backgroundColor: couleurs.fond, color: couleurs.texte, fontFamily: typographie.corps }}
                >
                    {/* Mini hero */}
                    <div
                        className="p-6 text-center text-white"
                        style={{ background: `linear-gradient(135deg, ${couleurs.primaire}, ${couleurs.secondaire})` }}
                    >
                        <h3 style={{ fontFamily: typographie.titre, fontSize: '1.25rem', fontWeight: 700 }}>
                            Titre d'exemple
                        </h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
                            Sous-titre de démonstration
                        </p>
                        <button
                            className="mt-3 rounded-lg px-4 py-1.5 text-xs font-semibold"
                            style={{ backgroundColor: couleurs.accent, color: couleurs.texte }}
                        >
                            Bouton CTA
                        </button>
                    </div>
                    {/* Mini contenu */}
                    <div className="p-4 space-y-2">
                        <p style={{ fontSize: '0.8rem', color: couleurs.texte }}>
                            Corps de texte avec la police sélectionnée. Lorem ipsum dolor sit amet.
                        </p>
                        <div className="flex gap-3">
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${couleurs.primaire}20`, color: couleurs.primaire }}>
                                Badge
                            </span>
                            <span style={{ fontSize: '0.75rem', color: couleurs.texteClair }}>Texte secondaire</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================================
// Sous-composant champ couleur
// ==================================
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <ColorPicker
            label={label}
            value={value}
            onChange={onChange}
            compactColors={['#22c55e', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#000000', '#ffffff']}
        />
    );
}
