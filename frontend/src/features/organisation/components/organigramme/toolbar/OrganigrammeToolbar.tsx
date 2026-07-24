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

    const btnClass = "flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]";
    const btnStyle = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' };

    return (
        <div
            role="toolbar"
            aria-label={t('organigramme.toolbar', 'Outils organigramme')}
            className="flex items-center rounded-xl border backdrop-blur-sm"
            style={{
                gap: 'var(--gap-xxs, 0.25rem)',
                padding: 'clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem) clamp(0.5rem, 0.4rem + 0.3vw, 0.75rem)',
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-bordure)',
            }}
        >
            {/* Recherche */}
            {showSearch ? (
                <div className="flex items-center" style={{ gap: 'var(--gap-xxs, 0.25rem)', marginRight: 'var(--space-xs)' }}>
                    <Search className="text-[var(--color-text-muted)]" style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder={t('organigramme.rechercher', 'Rechercher...')}
                        className="flex-1 min-w-[120px] max-w-[200px] text-sm bg-transparent border-none outline-none placeholder:text-[var(--color-text-muted)]"
                        style={{ fontSize: 'clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem)' }}
                        autoFocus
                    />
                    {searchQuery && (
                        <button onClick={handleClearSearch} className={btnClass} style={btnStyle} title={t('organigramme.effacer', 'Effacer')}>
                            <X style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                        </button>
                    )}
                </div>
            ) : (
                <button onClick={() => setShowSearch(true)} className={btnClass} style={btnStyle} title={t('organigramme.rechercher', 'Rechercher')}>
                    <Search style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                </button>
            )}

            <div className="mx-0.5" style={{ width: '1px', height: 'var(--icon-md)', backgroundColor: 'var(--color-bordure)' }} />

            {/* Zoom */}
            <button onClick={() => dispatchToolbarCommand('zoom-out')} className={btnClass} style={btnStyle} title={t('organigramme.zoomOut', 'Zoom arrière')}>
                <ZoomOut style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
            </button>
            <button onClick={() => dispatchToolbarCommand('zoom-in')} className={btnClass} style={btnStyle} title={t('organigramme.zoomIn', 'Zoom avant')}>
                <ZoomIn style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
            </button>
            <button onClick={() => dispatchToolbarCommand('fit-view')} className={btnClass} style={btnStyle} title={t('organigramme.fitView', 'Ajuster')}>
                <Maximize2 style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
            </button>

            <div className="mx-0.5" style={{ width: '1px', height: 'var(--icon-md)', backgroundColor: 'var(--color-bordure)' }} />

            {/* Expand/Collapse */}
            <button onClick={() => dispatchToolbarCommand('expand-all')} className={btnClass} style={btnStyle} title={t('organigramme.toutDeplier', 'Tout déplier')}>
                {direction === 'TB' ? <ChevronDown style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} /> : <ChevronRight style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />}
            </button>
            <button onClick={() => dispatchToolbarCommand('collapse-all')} className={btnClass} style={btnStyle} title={t('organigramme.toutReplier', 'Tout replier')}>
                {direction === 'TB' ? <ChevronUp style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} /> : <ChevronLeft style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />}
            </button>

            <div className="mx-0.5" style={{ width: '1px', height: 'var(--icon-md)', backgroundColor: 'var(--color-bordure)' }} />

            {/* Plein écran */}
            <button onClick={handleToggleFullscreen} className={btnClass} style={btnStyle} title={isFullscreen ? t('organigramme.quitterPleinEcran', 'Quitter le plein écran') : t('organigramme.pleinEcran', 'Plein écran')}>
                {isFullscreen ? <Minimize2 style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} /> : <Maximize2 style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />}
            </button>

            {/* Export */}
            <button onClick={handleExport} className={btnClass} style={btnStyle} title={t('organigramme.exporter', 'Exporter PNG')}>
                <Download style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
            </button>

            {/* Mode édition */}
            {canEdit && onToggleEditMode && (
                <>
                    <div className="mx-0.5" style={{ width: '1px', height: 'var(--icon-md)', backgroundColor: 'var(--color-bordure)' }} />
                    <button
                        onClick={onToggleEditMode}
                        className={`flex items-center rounded-lg text-xs font-medium transition-colors ${
                            isEditMode
                                ? 'bg-[var(--color-dominant-600)] text-white'
                                : 'hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]'
                        }`}
                        style={{
                            gap: 'var(--gap-xxs, 0.25rem)',
                            padding: 'clamp(0.25rem, 0.2rem + 0.15vw, 0.375rem) clamp(0.375rem, 0.3rem + 0.2vw, 0.625rem)',
                            height: 'var(--icon-xl)',
                        }}
                        title={isEditMode ? t('organigramme.quitterModification', 'Quitter le mode édition') : t('organigramme.modeModification', 'Mode édition')}
                    >
                        <Pencil style={{ width: 'var(--icon-xs)', height: 'var(--icon-xs)' }} />
                        {!isEditMode && <span className="hidden sm:inline">{t('organigramme.modifier', 'Modifier')}</span>}
                    </button>
                </>
            )}
        </div>
    );
}
