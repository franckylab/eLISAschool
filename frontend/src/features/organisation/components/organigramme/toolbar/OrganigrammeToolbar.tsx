/**
 * ==================================
 * eLISAschool - Toolbar Organigramme
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre d'outils : recherche, zoom, fit, expand/collapse, plein écran, export PNG.
 * Communique avec les vues React Flow via événements custom.
 * Gère l'état plein écran via Fullscreen API.
 */

import { useState, useCallback, useEffect } from 'react';
import {
    Search, ZoomIn, ZoomOut, Maximize2, Minimize2,
    ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
    Download, X, Pencil,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { exporterOrganigrammePNG } from '../utils/export';

/** Type des commandes envoyées via événement custom */
export type ToolbarCommand = 'zoom-in' | 'zoom-out' | 'fit-view' | 'expand-all' | 'collapse-all' | 'search' | 'fullscreen-toggle';

/** Dispatch une commande toolbar vers les vues React Flow */
export function dispatchToolbarCommand(command: ToolbarCommand, detail?: Record<string, unknown>) {
    window.dispatchEvent(new CustomEvent('organigramme:toolbar-command', {
        detail: { command, ...detail },
    }));
}

interface OrganigrammeToolbarProps {
    direction: 'TB' | 'LR';
    containerId: string;
    nomEtablissement?: string;
    isEditMode?: boolean;
    onToggleEditMode?: () => void;
    canEdit?: boolean;
}

export function OrganigrammeToolbar({
    direction,
    containerId,
    nomEtablissement,
    isEditMode,
    onToggleEditMode,
    canEdit = true,
}: OrganigrammeToolbarProps) {
    const { t } = useTranslation('organisation');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Synchroniser l'état plein écran avec le Fullscreen API
    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);
        dispatchToolbarCommand('search', { query: val });
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
        dispatchToolbarCommand('search', { query: '' });
    }, []);

    const handleToggleFullscreen = useCallback(() => {
        const el = document.getElementById(containerId);
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }, [containerId]);

    const handleExport = useCallback(() => {
        exporterOrganigrammePNG(containerId, nomEtablissement || 'organigramme');
    }, [containerId, nomEtablissement]);

    const btnClass = "flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]";

    return (
        <div
            role="toolbar"
            aria-label={t('organigramme.toolbar', 'Outils organigramme')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border backdrop-blur-sm"
            style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-bordure)',
            }}
        >
            {/* Recherche */}
            {showSearch ? (
                <div className="flex items-center gap-1 mr-2">
                    <Search className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder={t('organigramme.rechercher', 'Rechercher...')}
                        className="flex-1 min-w-[120px] max-w-[200px] text-sm bg-transparent border-none outline-none placeholder:text-[var(--color-text-muted)]"
                        autoFocus
                    />
                    {searchQuery && (
                        <button onClick={handleClearSearch} className={btnClass} title={t('organigramme.effacer', 'Effacer')}>
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            ) : (
                <button onClick={() => setShowSearch(true)} className={btnClass} title={t('organigramme.rechercher', 'Rechercher')}>
                    <Search className="w-4 h-4" />
                </button>
            )}

            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-bordure)' }} />

            {/* Zoom */}
            <button onClick={() => dispatchToolbarCommand('zoom-out')} className={btnClass} title={t('organigramme.zoomOut', 'Zoom arrière')}>
                <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={() => dispatchToolbarCommand('zoom-in')} className={btnClass} title={t('organigramme.zoomIn', 'Zoom avant')}>
                <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => dispatchToolbarCommand('fit-view')} className={btnClass} title={t('organigramme.fitView', 'Ajuster')}>
                <Maximize2 className="w-4 h-4" />
            </button>

            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-bordure)' }} />

            {/* Expand/Collapse */}
            <button onClick={() => dispatchToolbarCommand('expand-all')} className={btnClass} title={t('organigramme.toutDeplier', 'Tout déplier')}>
                {direction === 'TB' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <button onClick={() => dispatchToolbarCommand('collapse-all')} className={btnClass} title={t('organigramme.toutReplier', 'Tout replier')}>
                {direction === 'TB' ? <ChevronUp className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-bordure)' }} />

            {/* Plein écran */}
            <button onClick={handleToggleFullscreen} className={btnClass} title={isFullscreen ? t('organigramme.quitterPleinEcran', 'Quitter le plein écran') : t('organigramme.pleinEcran', 'Plein écran')}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Export */}
            <button onClick={handleExport} className={btnClass} title={t('organigramme.exporter', 'Exporter PNG')}>
                <Download className="w-4 h-4" />
            </button>

            {/* Mode édition */}
            {canEdit && onToggleEditMode && (
                <>
                    <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-bordure)' }} />
                    <button
                        onClick={onToggleEditMode}
                        className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-xs font-medium transition-colors ${
                            isEditMode
                                ? 'bg-[var(--color-dominant-600)] text-white'
                                : 'hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]'
                        }`}
                        title={isEditMode ? t('organigramme.quitterModification', 'Quitter le mode édition') : t('organigramme.modeModification', 'Mode édition')}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        {!isEditMode && <span className="hidden sm:inline">{t('organigramme.modifier', 'Modifier')}</span>}
                    </button>
                </>
            )}
        </div>
    );
}
