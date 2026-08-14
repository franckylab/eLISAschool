/**
 * ==================================
 * eLISAschool - Mode Focus Éditeur CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Mode plein écran sans distractions pour l'édition CMS.
 * Masque toolbar, sidebar, header. Raccourci Échap pour quitter.
 * Overlay opacity réglable, fond personnalisable.
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { Maximize2, Minimize2, Monitor, Moon, Sun, Eye } from 'lucide-react';

// ==================================
// Types
// ==================================

interface FocusModeProps {
    children: ReactNode;
    /** Toolbar à afficher en mode focus (minimal) */
    toolbar?: ReactNode;
}

interface FocusSettings {
    opacity: 'normal' | 'reduced' | 'high';
    fond: 'white' | 'dark' | 'sepia' | 'custom';
    couleurCustom?: string;
    masquerAide: boolean;
    largeurMax: 'etroit' | 'normal' | 'large' | 'pleine';
}

const FOCUS_SETTINGS_KEY = 'cms:focus-settings';

// ==================================
// Hook useFocusMode
// ==================================

export function useFocusMode() {
    const [isFocus, setIsFocus] = useState(false);
    const [settings, setSettings] = useState<FocusSettings>(() => {
        try {
            const stored = localStorage.getItem(FOCUS_SETTINGS_KEY);
            return stored ? JSON.parse(stored) : {
                opacity: 'normal',
                fond: 'white',
                masquerAide: false,
                largeurMax: 'normal',
            };
        } catch {
            return { opacity: 'normal', fond: 'white', masquerAide: false, largeurMax: 'normal' };
        }
    });

    const toggleFocus = useCallback(() => {
        setIsFocus(prev => !prev);
    }, []);

    const exitFocus = useCallback(() => {
        setIsFocus(false);
    }, []);

    const updateSettings = useCallback((updates: Partial<FocusSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...updates };
            localStorage.setItem(FOCUS_SETTINGS_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    // Échap pour quitter le mode focus
    useEffect(() => {
        if (!isFocus) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                exitFocus();
            }
            // F11 toggle
            if (e.key === 'F11') {
                e.preventDefault();
                toggleFocus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFocus, exitFocus, toggleFocus]);

    return { isFocus, toggleFocus, exitFocus, settings, updateSettings };
}

// ==================================
// Fond CSS par thème
// ==================================

const FOND_STYLES: Record<string, string> = {
    white: 'bg-white',
    dark: 'bg-gray-900',
    sepia: 'bg-amber-50',
    custom: '',
};

const LARGEUR_MAX: Record<string, string> = {
    etroit: 'max-w-3xl',
    normal: 'max-w-5xl',
    large: 'max-w-7xl',
    pleine: 'max-w-full',
};

// ==================================
// Composant FocusOverlay
// ==================================

export function FocusModeOverlay({
    isFocus,
    children,
    toolbar,
    settings,
    onExit,
    onToggleSettings,
    showSettings,
}: FocusModeProps & {
    isFocus: boolean;
    settings: FocusSettings;
    onExit: () => void;
    onToggleSettings: () => void;
    showSettings: boolean;
}) {
    if (!isFocus) return <>{children}</>;

    const fondClass = settings.fond === 'custom' ? '' : FOND_STYLES[settings.fond] || 'bg-white';
    const largeurClass = LARGEUR_MAX[settings.largeurMax] || 'max-w-5xl';

    return (
        <div className={`fixed inset-0 z-[100] ${fondClass} overflow-auto`} style={settings.fond === 'custom' ? { backgroundColor: settings.couleurCustom || '#ffffff' } : undefined}>
            {/* Mini-toolbar focus */}
            <div className="sticky top-0 z-50 flex items-center justify-between border-b bg-white/80 backdrop-blur-sm px-4 py-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Mode Focus</span>
                    {toolbar}
                </div>
                <div className="flex items-center gap-1.5">
                    {/* Paramètres focus */}
                    <button
                        onClick={onToggleSettings}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        title="Paramètres focus"
                    >
                        <Eye className="h-3.5 w-3.5" />
                    </button>
                    {/* Quitter */}
                    <button
                        onClick={onExit}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                        title="Quitter le mode focus (Échap)"
                    >
                        <Minimize2 className="h-3 w-3" />
                        Quitter
                    </button>
                </div>
            </div>

            {/* Panneau paramètres focus */}
            {showSettings && (
                <div className="sticky top-10 z-40 mx-auto w-fit rounded-xl border bg-white p-3 shadow-lg">
                    <div className="flex items-center gap-4">
                        {/* Fond */}
                        <div>
                            <p className="text-[9px] font-medium text-gray-500 uppercase mb-1">Fond</p>
                            <div className="flex gap-1">
                                {[
                                    { id: 'white', icon: <Sun className="h-3 w-3" />, label: 'Clair' },
                                    { id: 'dark', icon: <Moon className="h-3 w-3" />, label: 'Sombre' },
                                    { id: 'sepia', icon: <Monitor className="h-3 w-3" />, label: 'Séppia' },
                                ].map(f => (
                                    <button
                                        key={f.id}
                                        onClick={() => {/* updateSettings({ fond: f.id }) */}}
                                        className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] transition-colors ${
                                            settings.fond === f.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {f.icon}
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Largeur */}
                        <div>
                            <p className="text-[9px] font-medium text-gray-500 uppercase mb-1">Largeur</p>
                            <div className="flex gap-1">
                                {[
                                    { id: 'etroit', label: 'Étroit' },
                                    { id: 'normal', label: 'Normal' },
                                    { id: 'large', label: 'Large' },
                                    { id: 'pleine', label: 'Pleine' },
                                ].map(l => (
                                    <button
                                        key={l.id}
                                        className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
                                            settings.largeurMax === l.id ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contenu centré */}
            <div className={`mx-auto ${largeurClass} py-4`}>
                {children}
            </div>

            {/* Indicateur Échap */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[10px] text-white/80 backdrop-blur-sm">
                Appuyez sur <kbd className="mx-0.5 rounded border border-white/30 px-1 py-0.5 text-[9px] font-mono">Échap</kbd> pour quitter
            </div>
        </div>
    );
}

// ==================================
// Bouton Toggle Focus (pour la toolbar)
// ==================================

export function FocusModeButton({ isFocus, onToggle }: { isFocus: boolean; onToggle: () => void }) {
    return (
        <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                isFocus ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'hover:bg-muted'
            }`}
            title={isFocus ? 'Quitter le mode focus (Échap)' : 'Mode focus plein écran (F11)'}
        >
            {isFocus ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isFocus ? 'Focus' : 'Focus'}</span>
        </button>
    );
}
