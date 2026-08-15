/**
 * ==================================
 * eLISAschool - Zoom Controls professionnels
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Contrôles de zoom avancés avec :
 * - Slider fluide
 * - Presets rapides
 * - Zoom fit-to-screen
 * - Feedback visuel animé
 * - Raccourcis clavier
 */

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Minus, Plus, ChevronDown } from 'lucide-react';

// ==================================
// Types
// ==================================

export interface ZoomControlsProps {
    /** Zoom actuel (25-200) */
    zoom: number;
    /** Callback changement de zoom */
    onZoomChange: (zoom: number) => void;
    /** Callback fit to screen */
    onFitToScreen: () => void;
    /** Callback reset zoom */
    onResetZoom: () => void;
    /** Zoom minimum */
    minZoom?: number;
    /** Zoom maximum */
    maxZoom?: number;
    /** Pas de zoom */
    zoomStep?: number;
    /** Afficher le slider */
    showSlider?: boolean;
    /** Afficher les presets */
    showPresets?: boolean;
    /** Mode compact */
    compact?: boolean;
    /** Dark mode */
    dark?: boolean;
}

// ==================================
// Constants
// ==================================

const ZOOM_PRESETS = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '125%', value: 125 },
    { label: '150%', value: 150 },
    { label: '200%', value: 200 },
];

// ==================================
// Composant principal
// ==================================

export function ZoomControls({
    zoom,
    onZoomChange,
    onFitToScreen,
    onResetZoom,
    minZoom = 25,
    maxZoom = 200,
    zoomStep = 25,
    showSlider = true,
    showPresets = true,
    compact = false,
    dark = false,
}: ZoomControlsProps) {
    const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fermer le dropdown au clic extérieur
    useEffect(() => {
        if (!showPresetsDropdown) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowPresetsDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPresetsDropdown]);

    const handleZoomIn = () => {
        const newZoom = Math.min(maxZoom, zoom + zoomStep);
        onZoomChange(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(minZoom, zoom - zoomStep);
        onZoomChange(newZoom);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onZoomChange(parseInt(e.target.value));
    };

    const isCustomZoom = zoom !== 100;

    if (compact) {
        return (
            <div
                className="flex items-center gap-1 rounded-md border px-1.5 py-0.5 transition-colors"
                style={{
                    borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)',
                    backgroundColor: dark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)',
                }}
            >
                <button
                    onClick={handleZoomOut}
                    disabled={zoom <= minZoom}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="Zoom arrière"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span
                    className="min-w-[2rem] text-center text-[10px] font-mono tabular-nums"
                    style={{ color: dark ? '#94a3b8' : '#64748b' }}
                >
                    {zoom}%
                </span>
                <button
                    onClick={handleZoomIn}
                    disabled={zoom >= maxZoom}
                    className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
                    title="Zoom avant"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        );
    }

    return (
        <div
            className="flex items-center gap-1 rounded-lg border bg-white/90 px-1.5 py-1 shadow-sm backdrop-blur-sm transition-all hover:shadow-md"
            style={{
                borderColor: dark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Zoom out */}
            <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom arrière (-)"
            >
                <ZoomOut className="h-3.5 w-3.5" />
            </button>

            {/* Slider ou valeur */}
            {showSlider ? (
                <div className="flex items-center gap-1">
                    <input
                        type="range"
                        min={minZoom}
                        max={maxZoom}
                        step={zoomStep}
                        value={zoom}
                        onChange={handleSliderChange}
                        className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-500 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                        title={`Zoom: ${zoom}%`}
                    />
                    <button
                        onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                        className="flex min-w-[2.5rem] items-center justify-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-mono font-medium text-gray-700 hover:bg-gray-100 tabular-nums transition-colors"
                        title="Presets de zoom"
                    >
                        {zoom}%
                        <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                    className="flex min-w-[3rem] items-center justify-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-mono font-medium text-gray-700 hover:bg-gray-100 tabular-nums transition-colors"
                    title="Presets de zoom"
                >
                    {zoom}%
                    <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
                </button>
            )}

            {/* Zoom in */}
            <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Zoom avant (+)"
            >
                <ZoomIn className="h-3.5 w-3.5" />
            </button>

            {/* Separator */}
            <div className="mx-0.5 h-4 w-px bg-gray-200" />

            {/* Reset zoom */}
            {isCustomZoom && (
                <button
                    onClick={onResetZoom}
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Réinitialiser zoom (Ctrl+0)"
                >
                    <RotateCcw className="h-3 w-3" />
                </button>
            )}

            {/* Fit to screen */}
            <button
                onClick={onFitToScreen}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                title="Ajuster à l'écran"
            >
                <Maximize2 className="h-3 w-3" />
            </button>

            {/* Presets dropdown */}
            {showPresetsDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute bottom-full right-0 mb-2 min-w-[120px] rounded-lg border border-gray-200 bg-white p-1 shadow-xl z-50 cms-scale-enter"
                >
                    <div className="mb-1 px-2 py-1 text-[9px] font-semibold text-gray-400 uppercase">
                        Presets
                    </div>
                    {ZOOM_PRESETS.map(preset => (
                        <button
                            key={preset.value}
                            onClick={() => {
                                onZoomChange(preset.value);
                                setShowPresetsDropdown(false);
                            }}
                            className={`flex w-full items-center rounded px-2 py-1.5 text-[10px] transition-colors ${
                                zoom === preset.value
                                    ? 'bg-blue-50 font-semibold text-blue-600'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {preset.label}
                            {preset.value === 100 && (
                                <span className="ml-auto text-[8px] text-gray-400">Défaut</span>
                            )}
                        </button>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                        onClick={() => {
                            onFitToScreen();
                            setShowPresetsDropdown(false);
                        }}
                        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[10px] text-gray-600 hover:bg-gray-50"
                    >
                        <Maximize2 className="h-3 w-3" />
                        Ajuster à l'écran
                    </button>
                </div>
            )}
        </div>
    );
}

// ==================================
// Hook pour Ctrl+Wheel zoom
// ==================================

export function useCtrlWheelZoom(
    containerRef: React.RefObject<HTMLDivElement | null>,
    onZoomChange: (zoom: number) => void,
    minZoom = 25,
    maxZoom = 200
) {
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -25 : 25;
                onZoomChange((currentZoom: number) => {
                    const newZoom = Math.min(maxZoom, Math.max(minZoom, currentZoom + delta));
                    return newZoom;
                });
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        return () => el.removeEventListener('wheel', handleWheel);
    }, [containerRef, onZoomChange, minZoom, maxZoom]);
}

// ==================================
// Composant Zoom Indicator (feedback visuel)
// ==================================

export function ZoomIndicator({
    zoom,
    visible,
    deviceLabel,
}: {
    zoom: number;
    visible: boolean;
    deviceLabel?: string;
}) {
    if (!visible) return null;

    return (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200/60 bg-white/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
                <ZoomIn className="h-4 w-4 text-blue-500" />
                <span className="text-lg font-bold tabular-nums text-gray-700">{zoom}%</span>
                {deviceLabel && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600 uppercase">
                        {deviceLabel}
                    </span>
                )}
            </div>
        </div>
    );
}
