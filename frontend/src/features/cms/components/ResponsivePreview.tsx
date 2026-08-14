/**
 * ==================================
 * eLISAschool - Preview Responsive CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre d'outils de preview responsive pour l'éditeur CMS.
 * Permet de visualiser la page à différentes tailles d'écran.
 */

import { useState } from 'react';

interface DevicePreset {
    name: string;
    icon: string;
    width: number;
    height: number;
    label: string;
}

const DEVICE_PRESETS: DevicePreset[] = [
    { name: 'mobile-sm', icon: '📱', width: 320, height: 568, label: 'Petit mobile' },
    { name: 'mobile', icon: '📱', width: 375, height: 812, label: 'Mobile' },
    { name: 'tablet', icon: '📋', width: 768, height: 1024, label: 'Tablette' },
    { name: 'laptop', icon: '💻', width: 1024, height: 768, label: 'Laptop' },
    { name: 'desktop', icon: '🖥️', width: 1440, height: 900, label: 'Desktop' },
    { name: 'full', icon: '⬜', width: 0, height: 0, label: 'Pleine largeur' },
];

interface ResponsivePreviewProps {
    children: React.ReactNode;
    url?: string;
}

export function ResponsivePreview({ children, url }: ResponsivePreviewProps) {
    const [activeDevice, setActiveDevice] = useState<DevicePreset>(DEVICE_PRESETS[5]); // Pleine largeur par défaut
    const [zoom, setZoom] = useState(100);

    const isFullWidth = activeDevice.width === 0;

    return (
        <div className="flex flex-col h-full">
            {/* Barre d'outils */}
            <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
                {/* Sélecteur de device */}
                <div className="flex items-center gap-1">
                    {DEVICE_PRESETS.map((device) => (
                        <button
                            key={device.name}
                            onClick={() => setActiveDevice(device)}
                            className={`flex items-center gap-1 rounded-md px-2 py-1.5 text-xs transition-colors
                                ${activeDevice.name === device.name
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            title={`${device.label} (${device.width}×${device.height})`}
                        >
                            <span>{device.icon}</span>
                            <span className="hidden sm:inline">{device.width > 0 ? `${device.width}px` : '100%'}</span>
                        </button>
                    ))}
                </div>

                {/* Séparateur */}
                <div className="h-5 w-px bg-gray-300" />

                {/* Zoom */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setZoom(Math.max(25, zoom - 25))}
                        className="rounded px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        title="Zoom -"
                    >
                        −
                    </button>
                    <span className="min-w-[3rem] text-center text-xs text-gray-600">{zoom}%</span>
                    <button
                        onClick={() => setZoom(Math.min(200, zoom + 25))}
                        className="rounded px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        title="Zoom +"
                    >
                        +
                    </button>
                </div>

                {/* Séparateur */}
                <div className="h-5 w-px bg-gray-300" />

                {/* Info device */}
                <span className="text-xs text-gray-500">
                    {isFullWidth ? 'Pleine largeur' : `${activeDevice.width}×${activeDevice.height}`}
                </span>

                {/* URL preview */}
                {url && (
                    <>
                        <div className="h-5 w-px bg-gray-300" />
                        <span className="truncate text-xs text-gray-400 max-w-[200px]">{url}</span>
                    </>
                )}
            </div>

            {/* Zone de preview */}
            <div className="flex-1 overflow-auto bg-gray-100 p-4">
                <div
                    className="mx-auto bg-white shadow-lg transition-all duration-300"
                    style={{
                        width: isFullWidth ? '100%' : `${activeDevice.width}px`,
                        minHeight: isFullWidth ? '100%' : `${activeDevice.height}px`,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: 'top center',
                        borderRadius: activeDevice.name === 'mobile' || activeDevice.name === 'mobile-sm' ? '20px' : '8px',
                        overflow: 'hidden',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
