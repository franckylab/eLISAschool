/**
 * ==================================
 * eLISAschool - Color Harmony Picker
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Sélecteur de couleur avancé avec modes d'harmonie :
 * - Complémentaire, Analogue, Triadique, Tetradique, Split-complémentaire
 * - Roue chromatique interactive
 * - Palette de l'établissement (brand colors)
 * - Couleurs récentes
 * - Extraction depuis image (future)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Palette, Pipette, Sparkles, RotateCw, Check, X, ChevronDown } from 'lucide-react';

// ==================================
// Types
// ==================================

type HarmonyMode = 'free' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'split';

interface ColorHarmonyPickerProps {
    /** Couleur actuelle */
    value: string;
    /** Callback changement */
    onChange: (color: string) => void;
    /** Label */
    label?: string;
    /** Couleurs récentes */
    recentColors?: string[];
    /** Couleurs de marque */
    brandColors?: { label: string; value: string }[];
    /** Mode compact */
    compact?: boolean;
}

// ==================================
// Helpers — Conversion couleurs
// ==================================

function hexToHsl(hex: string): { h: number; s: number; l: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function getHarmonyColors(hex: string, mode: HarmonyMode): string[] {
    const { h, s, l } = hexToHsl(hex);
    switch (mode) {
        case 'complementary':
            return [hex, hslToHex((h + 180) % 360, s, l)];
        case 'analogous':
            return [
                hslToHex((h - 30 + 360) % 360, s, l),
                hex,
                hslToHex((h + 30) % 360, s, l),
            ];
        case 'triadic':
            return [hex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
        case 'tetradic':
            return [hex, hslToHex((h + 90) % 360, s, l), hslToHex((h + 180) % 360, s, l), hslToHex((h + 270) % 360, s, l)];
        case 'split':
            return [hex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
        default:
            return [hex];
    }
}

// ==================================
// Constantes
// ==================================

const HARMONY_MODES: { id: HarmonyMode; label: string; icon: string; desc: string }[] = [
    { id: 'free', label: 'Libre', icon: '●', desc: 'Couleur unique' },
    { id: 'complementary', label: 'Complémentaire', icon: '◑', desc: 'Opposée sur la roue' },
    { id: 'analogous', label: 'Analogue', icon: '◐', desc: 'Voisines sur la roue' },
    { id: 'triadic', label: 'Triadique', icon: '△', desc: 'Triangle équilatéral' },
    { id: 'tetradic', label: 'Tetradique', icon: '◇', desc: 'Rectangle sur la roue' },
    { id: 'split', label: 'Split', icon: '◈', desc: 'Complémentaire divisée' },
];

const BRAND_COLORS_DEFAULT = [
    { label: 'Primaire', value: '#28a745' },
    { label: 'Secondaire', value: '#ffc107' },
    { label: 'Accent', value: '#007bff' },
    { label: 'Succès', value: '#16a34a' },
    { label: 'Attention', value: '#f59e0b' },
    { label: 'Danger', value: '#dc2626' },
    { label: 'Info', value: '#0ea5e9' },
    { label: 'Neutre', value: '#6b7280' },
];

// Couleurs de la roue chromatique (12 teintes)
const COLOR_WHEEL_HUES = Array.from({ length: 24 }, (_, i) => i * 15);

// ==================================
// Composant principal
// ==================================

export function ColorHarmonyPicker({
    value,
    onChange,
    label,
    recentColors = [],
    brandColors = BRAND_COLORS_DEFAULT,
    compact = false,
}: ColorHarmonyPickerProps) {
    const [harmonyMode, setHarmonyMode] = useState<HarmonyMode>('free');
    const [showHarmonyPanel, setShowHarmonyPanel] = useState(false);
    const [hexInput, setHexInput] = useState(value);
    const [activeSection, setActiveSection] = useState<'wheel' | 'brand' | 'recent' | 'harmony'>('wheel');

    // Sync hex input avec value
    useEffect(() => {
        setHexInput(value);
    }, [value]);

    // HSL de la couleur actuelle
    const hsl = useMemo(() => hexToHsl(value.startsWith('#') ? value : '#000000'), [value]);

    // Couleurs d'harmonie
    const harmonyColors = useMemo(() => getHarmonyColors(value, harmonyMode), [value, harmonyMode]);

    // Appliquer couleur depuis hex input
    const applyHex = useCallback((hex: string) => {
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
            onChange(hex);
        }
    }, [onChange]);

    // Changer hue depuis la roue
    const handleWheelClick = useCallback((hue: number) => {
        const newColor = hslToHex(hue, hsl.s || 70, hsl.l || 50);
        onChange(newColor);
    }, [onChange, hsl]);

    // Changer saturation
    const handleSaturationChange = useCallback((s: number) => {
        onChange(hslToHex(hsl.h, s, hsl.l));
    }, [onChange, hsl]);

    // Changer luminosité
    const handleLightnessChange = useCallback((l: number) => {
        onChange(hslToHex(hsl.h, hsl.s, l));
    }, [onChange, hsl]);

    if (compact) {
        return (
            <div className="cms-color-harmony-compact">
                <div
                    className="cms-color-harmony-compact__swatch"
                    style={{ backgroundColor: value }}
                    onClick={() => setShowHarmonyPanel(!showHarmonyPanel)}
                    title={`${label || 'Couleur'}: ${value}`}
                />
                {showHarmonyPanel && (
                    <div className="cms-color-harmony-popup">
                        <ColorHarmonyPanel
                            value={value}
                            onChange={onChange}
                            harmonyMode={harmonyMode}
                            setHarmonyMode={setHarmonyMode}
                            harmonyColors={harmonyColors}
                            recentColors={recentColors}
                            brandColors={brandColors}
                            hexInput={hexInput}
                            setHexInput={setHexInput}
                            applyHex={applyHex}
                            hsl={hsl}
                            handleWheelClick={handleWheelClick}
                            handleSaturationChange={handleSaturationChange}
                            handleLightnessChange={handleLightnessChange}
                            onClose={() => setShowHarmonyPanel(false)}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="cms-color-harmony">
            {label && (
                <div className="cms-color-harmony__label">
                    <Palette className="cms-color-harmony__label-icon" />
                    {label}
                </div>
            )}

            <ColorHarmonyPanel
                value={value}
                onChange={onChange}
                harmonyMode={harmonyMode}
                setHarmonyMode={setHarmonyMode}
                harmonyColors={harmonyColors}
                recentColors={recentColors}
                brandColors={brandColors}
                hexInput={hexInput}
                setHexInput={setHexInput}
                applyHex={applyHex}
                hsl={hsl}
                handleWheelClick={handleWheelClick}
                handleSaturationChange={handleSaturationChange}
                handleLightnessChange={handleLightnessChange}
                onClose={() => {}}
            />
        </div>
    );
}

// ==================================
// Panel interne (réutilisable)
// ==================================

function ColorHarmonyPanel({
    value, onChange, harmonyMode, setHarmonyMode, harmonyColors,
    recentColors, brandColors, hexInput, setHexInput, applyHex,
    hsl, handleWheelClick, handleSaturationChange, handleLightnessChange,
    onClose,
}: {
    value: string;
    onChange: (c: string) => void;
    harmonyMode: HarmonyMode;
    setHarmonyMode: (m: HarmonyMode) => void;
    harmonyColors: string[];
    recentColors: string[];
    brandColors: { label: string; value: string }[];
    hexInput: string;
    setHexInput: (v: string) => void;
    applyHex: (v: string) => void;
    hsl: { h: number; s: number; l: number };
    handleWheelClick: (hue: number) => void;
    handleSaturationChange: (s: number) => void;
    handleLightnessChange: (l: number) => void;
    onClose: () => void;
}) {
    return (
        <div className="cms-chp">
            {/* Hue wheel */}
            <div className="cms-chp__wheel-section">
                <div className="cms-chp__wheel">
                    {COLOR_WHEEL_HUES.map(hue => (
                        <div
                            key={hue}
                            className={`cms-chp__wheel-segment ${Math.abs(hsl.h - hue) < 8 ? 'cms-chp__wheel-segment--active' : ''}`}
                            style={{
                                backgroundColor: `hsl(${hue}, 70%, 50%)`,
                                transform: `rotate(${hue}deg)`,
                            }}
                            onClick={() => handleWheelClick(hue)}
                        />
                    ))}
                    {/* Center — current color */}
                    <div
                        className="cms-chp__wheel-center"
                        style={{ backgroundColor: value }}
                    />
                </div>
            </div>

            {/* Saturation + Lightness sliders */}
            <div className="cms-chp__sliders">
                <div className="cms-chp__slider-row">
                    <label className="cms-chp__slider-label">S</label>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={hsl.s}
                        onChange={(e) => handleSaturationChange(parseInt(e.target.value))}
                        className="cms-chp__slider cms-chp__slider--saturation"
                        style={{
                            background: `linear-gradient(90deg, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`,
                        }}
                    />
                    <span className="cms-chp__slider-value">{hsl.s}%</span>
                </div>
                <div className="cms-chp__slider-row">
                    <label className="cms-chp__slider-label">L</label>
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={hsl.l}
                        onChange={(e) => handleLightnessChange(parseInt(e.target.value))}
                        className="cms-chp__slider cms-chp__slider--lightness"
                        style={{
                            background: `linear-gradient(90deg, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`,
                        }}
                    />
                    <span className="cms-chp__slider-value">{hsl.l}%</span>
                </div>
            </div>

            {/* Hex input */}
            <div className="cms-chp__hex-row">
                <span className="cms-chp__hex-label">#</span>
                <input
                    type="text"
                    value={hexInput.replace('#', '')}
                    onChange={(e) => setHexInput(`#${e.target.value}`)}
                    onBlur={() => applyHex(hexInput)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyHex(hexInput); }}
                    className="cms-chp__hex-input"
                    maxLength={7}
                    placeholder="000000"
                />
                <div
                    className="cms-chp__hex-preview"
                    style={{ backgroundColor: value }}
                />
            </div>

            {/* Harmony mode selector */}
            <div className="cms-chp__harmony">
                <button
                    onClick={() => setHarmonyMode(harmonyMode === 'free' ? 'complementary' : 'free')}
                    className="cms-chp__harmony-toggle"
                >
                    <Sparkles className="cms-chp__harmony-icon" />
                    Harmonies
                </button>
                <div className="cms-chp__harmony-modes">
                    {HARMONY_MODES.filter(m => m.id !== 'free').map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setHarmonyMode(harmonyMode === mode.id ? 'free' : mode.id)}
                            className={`cms-chp__harmony-btn ${harmonyMode === mode.id ? 'cms-chp__harmony-btn--active' : ''}`}
                            title={mode.desc}
                        >
                            <span className="cms-chp__harmony-btn-icon">{mode.icon}</span>
                            <span className="cms-chp__harmony-btn-label">{mode.label}</span>
                        </button>
                    ))}
                </div>
                {/* Harmony colors preview */}
                {harmonyMode !== 'free' && (
                    <div className="cms-chp__harmony-colors">
                        {harmonyColors.map((c, i) => (
                            <div
                                key={i}
                                className="cms-chp__harmony-swatch"
                                style={{ backgroundColor: c }}
                                onClick={() => onChange(c)}
                                title={c}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Brand colors */}
            {brandColors.length > 0 && (
                <div className="cms-chp__section">
                    <span className="cms-chp__section-title">Marque</span>
                    <div className="cms-chp__swatches">
                        {brandColors.map((c, i) => (
                            <button
                                key={i}
                                className={`cms-chp__swatch ${value === c.value ? 'cms-chp__swatch--active' : ''}`}
                                style={{ backgroundColor: c.value }}
                                onClick={() => onChange(c.value)}
                                title={`${c.label}: ${c.value}`}
                            >
                                {value === c.value && <Check className="cms-chp__swatch-check" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent colors */}
            {recentColors.length > 0 && (
                <div className="cms-chp__section">
                    <span className="cms-chp__section-title">Récentes</span>
                    <div className="cms-chp__swatches">
                        {recentColors.map((c, i) => (
                            <button
                                key={i}
                                className={`cms-chp__swatch ${value === c ? 'cms-chp__swatch--active' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => onChange(c)}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
