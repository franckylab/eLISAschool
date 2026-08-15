/**
 * ==================================
 * eLISAschool - Barre de statut améliorée pour éditeur CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre de statut informative avec :
 * - État sauvegarde en temps réel
 * - Info section sélectionnée
 * - Dimensions canvas
 * - Raccourcis contextuels
 * - Indicateurs performance
 */

import React, { useState, useEffect } from 'react';
import {
    LayoutGrid, Layers, Eye, EyeOff, Columns3, Check, Clock, Wifi, WifiOff,
    Zap, HardDrive, Cpu, Activity, Smartphone, Tablet, MonitorIcon,
} from 'lucide-react';

// ==================================
// Types
// ==================================

export interface StatusBarProps {
    /** Nombre de sections */
    sectionCount: number;
    /** Nombre de sections masquées */
    hiddenSectionCount?: number;
    /** Section sélectionnée */
    selectedSection?: {
        type: string;
        label: string;
        id: string;
    } | null;
    /** État sauvegarde */
    saveState: 'saved' | 'saving' | 'unsaved' | 'error';
    /** Date dernière sauvegarde */
    lastSavedAt?: Date | null;
    /** Dimensions canvas */
    canvasSize?: { width: number; height: number };
    /** Zoom actuel */
    zoom: number;
    /** Device preview */
    devicePreview: 'desktop' | 'tablet' | 'mobile';
    /** Callback changement device */
    onDeviceChange: (device: 'desktop' | 'tablet' | 'mobile') => void;
    /** Connection status */
    isConnected?: boolean;
    /** Performance metrics */
    performanceMetrics?: {
        fps?: number;
        memory?: number;
        renderTime?: number;
    };
}

// ==================================
// Composant principal
// ==================================

export function EnhancedStatusBar({
    sectionCount,
    hiddenSectionCount = 0,
    selectedSection,
    saveState,
    lastSavedAt,
    canvasSize,
    zoom,
    devicePreview,
    onDeviceChange,
    isConnected = true,
    performanceMetrics,
}: StatusBarProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getSaveStateInfo = () => {
        switch (saveState) {
            case 'saving':
                return {
                    icon: <div className="h-2 w-2 animate-spin rounded-full border border-blue-300 border-t-blue-500" />,
                    text: 'Sauvegarde...',
                    color: 'text-blue-500',
                };
            case 'saved':
                return {
                    icon: <Check className="h-2.5 w-2.5" />,
                    text: lastSavedAt
                        ? `Sauvegardé à ${lastSavedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                        : 'À jour',
                    color: 'text-emerald-500',
                };
            case 'unsaved':
                return {
                    icon: <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />,
                    text: 'Modifications non sauvegardées',
                    color: 'text-amber-500',
                };
            case 'error':
                return {
                    icon: <WifiOff className="h-2.5 w-2.5" />,
                    text: 'Erreur de sauvegarde',
                    color: 'text-red-500',
                };
        }
    };

    const saveInfo = getSaveStateInfo();

    return (
        <div className="flex items-center justify-between border-t bg-white/95 backdrop-blur-sm px-3 py-1.5 text-[10px]">
            {/* Gauche : Sections + sélection + dimensions */}
            <div className="flex items-center gap-3 text-gray-500">
                {/* Sections */}
                <div className="flex items-center gap-1" title="Nombre de sections">
                    <LayoutGrid className="h-3 w-3" />
                    <span className="font-medium">{sectionCount}</span>
                    <span className="hidden sm:inline">section{sectionCount !== 1 ? 's' : ''}</span>
                </div>

                {/* Sections masquées */}
                {hiddenSectionCount > 0 && (
                    <div className="flex items-center gap-1 text-orange-500" title="Sections masquées">
                        <EyeOff className="h-3 w-3" />
                        <span>{hiddenSectionCount}</span>
                    </div>
                )}

                {/* Section sélectionnée */}
                {selectedSection && (
                    <>
                        <div className="h-3 w-px bg-gray-200" />
                        <div className="flex items-center gap-1 text-blue-600" title={selectedSection.label}>
                            <Layers className="h-3 w-3" />
                            <span className="font-medium truncate max-w-[120px]">{selectedSection.label}</span>
                        </div>
                    </>
                )}

                {/* Dimensions canvas */}
                {canvasSize && (
                    <div className="hidden lg:flex items-center gap-1" title="Dimensions du contenu">
                        <Columns3 className="h-3 w-3" />
                        <span className="font-mono text-[9px]">
                            {Math.round(canvasSize.width)}×{Math.round(canvasSize.height)}
                        </span>
                    </div>
                )}
            </div>

            {/* Centre : État sauvegarde + connection */}
            <div className="flex items-center gap-3">
                {/* Save state */}
                <div className={`flex items-center gap-1.5 ${saveInfo.color}`}>
                    {saveInfo.icon}
                    <span className="hidden sm:inline">{saveInfo.text}</span>
                </div>

                {/* Connection status */}
                <div
                    className={`flex items-center gap-1 ${isConnected ? 'text-emerald-500' : 'text-red-500'}`}
                    title={isConnected ? 'Connecté' : 'Déconnecté'}
                >
                    {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                </div>

                {/* Performance (optionnel) */}
                {performanceMetrics && performanceMetrics.fps && (
                    <div className="hidden xl:flex items-center gap-1 text-gray-400" title="Performance">
                        <Activity className="h-3 w-3" />
                        <span className="font-mono text-[9px]">{performanceMetrics.fps} FPS</span>
                    </div>
                )}
            </div>

            {/* Droite : Device preview + zoom + time */}
            <div className="flex items-center gap-2">
                {/* Device preview */}
                <div className="flex items-center gap-0.5 rounded border border-gray-200 bg-white p-0.5">
                    {([
                        { type: 'mobile' as const, icon: <Smartphone className="h-3 w-3" />, label: 'Mobile' },
                        { type: 'tablet' as const, icon: <Tablet className="h-3 w-3" />, label: 'Tablette' },
                        { type: 'desktop' as const, icon: <MonitorIcon className="h-3 w-3" />, label: 'Desktop' },
                    ]).map(d => (
                        <button
                            key={d.type}
                            onClick={() => onDeviceChange(d.type)}
                            className={`flex h-5 items-center gap-1 rounded px-1.5 text-[9px] font-medium transition-colors ${
                                devicePreview === d.type
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                            title={`${d.label} (Ctrl+D)`}
                        >
                            {d.icon}
                            <span className="hidden xl:inline">{d.label}</span>
                        </button>
                    ))}
                </div>

                {/* Zoom */}
                <div className="flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-0.5">
                    <span className="font-mono text-[9px] text-gray-600 tabular-nums">{zoom}%</span>
                </div>

                {/* Time */}
                <div className="hidden md:flex items-center gap-1 text-gray-400" title="Heure actuelle">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono text-[9px]">
                        {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                {/* Details toggle */}
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className={`rounded p-1 transition-colors ${
                        showDetails ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    }`}
                    title="Afficher plus de détails"
                >
                    <Activity className="h-3 w-3" />
                </button>
            </div>

            {/* Details panel (optionnel) */}
            {showDetails && (
                <div className="absolute bottom-full right-0 mb-2 min-w-[200px] rounded-lg border border-gray-200 bg-white p-3 shadow-xl text-[10px] cms-scale-enter">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Sections totales</span>
                            <span className="font-medium">{sectionCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Sections visibles</span>
                            <span className="font-medium">{sectionCount - hiddenSectionCount}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Zoom</span>
                            <span className="font-medium">{zoom}%</span>
                        </div>
                        {canvasSize && (
                            <>
                                <div className="border-t border-gray-100 my-1" />
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Largeur</span>
                                    <span className="font-mono">{Math.round(canvasSize.width)}px</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">Hauteur</span>
                                    <span className="font-mono">{Math.round(canvasSize.height)}px</span>
                                </div>
                            </>
                        )}
                        {performanceMetrics && (
                            <>
                                <div className="border-t border-gray-100 my-1" />
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-500">FPS</span>
                                    <span className="font-mono">{performanceMetrics.fps || '-'}</span>
                                </div>
                                {performanceMetrics.memory && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-500">Mémoire</span>
                                        <span className="font-mono">{performanceMetrics.memory} MB</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
