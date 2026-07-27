/**
 * ==================================
 * eLISAschool - Toolbar Organigramme
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Barre d'outils : recherche, zoom, fit, expand/collapse, plein écran,
 * export, légende des liens, relations, mode édition.
 * Communique avec les vues React Flow via événements custom.
 * Légende avec animation, click-outside et Escape pour fermer.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    Search, ZoomIn, ZoomOut, Maximize, Maximize2, Minimize2,
    ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
    Download, X, Pencil, Link2, Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { ExportDialog } from '../modals/ExportDialog';

export type ToolbarCommand = 'zoom-in' | 'zoom-out' | 'fit-view' | 'expand-all' | 'collapse-all' | 'search' | 'fullscreen-toggle';

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
    showRelations?: boolean;
    onToggleRelations?: () => void;
}

const sep = (key: string) => (
    <div key={key} className="mx-0.5 shrink-0" style={{ width: '1px', height: 'var(--icon-md)', backgroundColor: 'var(--color-bordure)' }} />
);

export function OrganigrammeToolbar({
    direction,
    containerId,
    nomEtablissement,
    isEditMode,
    onToggleEditMode,
    canEdit = true,
    showRelations,
    onToggleRelations,
}: OrganigrammeToolbarProps) {
    const { t } = useTranslation('organisation');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showLegend, setShowLegend] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const legendRef = useRef<HTMLDivElement>(null);
    const legendBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    useEffect(() => {
        if (!showLegend) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                legendRef.current && !legendRef.current.contains(e.target as Node) &&
                legendBtnRef.current && !legendBtnRef.current.contains(e.target as Node)
            ) {
                setShowLegend(false);
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setShowLegend(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [showLegend]);

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

    const btnClass = "flex items-center justify-center rounded-lg transition-colors hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]";
    const btnStyle = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' };
    const iconStyle = { width: 'var(--icon-xs)', height: 'var(--icon-xs)' } as const;

    const toggleBtnClass = (active: boolean) =>
        `flex items-center justify-center rounded-lg transition-colors ${
            active
                ? 'bg-[var(--color-dominant-600)] text-white'
                : 'hover:bg-[var(--color-dominant-50)] text-[var(--color-text-muted)] hover:text-[var(--color-dominant-600)]'
        }`;

    return (
        <>
        <div
            role="toolbar"
            aria-label={t('organigramme.toolbar', 'Outils organigramme')}
            className="flex items-center rounded-xl border backdrop-blur-sm flex-wrap"
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
                    <Search className="text-[var(--color-text-muted)] shrink-0" style={iconStyle} />
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
                            <X style={iconStyle} />
                        </button>
                    )}
                </div>
            ) : (
                <button onClick={() => setShowSearch(true)} className={btnClass} style={btnStyle} title={t('organigramme.rechercher', 'Rechercher')}>
                    <Search style={iconStyle} />
                </button>
            )}

            {sep('s1')}

            {/* Zoom */}
            <button onClick={() => dispatchToolbarCommand('zoom-out')} className={btnClass} style={btnStyle} title={t('organigramme.zoomOut', 'Zoom arrière')}>
                <ZoomOut style={iconStyle} />
            </button>
            <button onClick={() => dispatchToolbarCommand('zoom-in')} className={btnClass} style={btnStyle} title={t('organigramme.zoomIn', 'Zoom avant')}>
                <ZoomIn style={iconStyle} />
            </button>
            <button onClick={() => dispatchToolbarCommand('fit-view')} className={btnClass} style={btnStyle} title={t('organigramme.fitView', 'Ajuster')}>
                <Maximize style={iconStyle} />
            </button>

            {sep('s2')}

            {/* Expand/Collapse */}
            <button onClick={() => dispatchToolbarCommand('expand-all')} className={btnClass} style={btnStyle} title={t('organigramme.toutDeplier', 'Tout déplier')}>
                {direction === 'TB' ? <ChevronDown style={iconStyle} /> : <ChevronRight style={iconStyle} />}
            </button>
            <button onClick={() => dispatchToolbarCommand('collapse-all')} className={btnClass} style={btnStyle} title={t('organigramme.toutReplier', 'Tout replier')}>
                {direction === 'TB' ? <ChevronUp style={iconStyle} /> : <ChevronLeft style={iconStyle} />}
            </button>

            {sep('s3')}

            {/* Plein écran + Export */}
            <button onClick={handleToggleFullscreen} className={btnClass} style={btnStyle} title={isFullscreen ? t('organigramme.quitterPleinEcran', 'Quitter le plein écran') : t('organigramme.pleinEcran', 'Plein écran')}>
                {isFullscreen ? <Minimize2 style={iconStyle} /> : <Maximize2 style={iconStyle} />}
            </button>
            <button onClick={() => setExportDialogOpen(true)} className={btnClass} style={btnStyle} title={t('organigramme.exporter', 'Exporter')}>
                <Download style={iconStyle} />
            </button>

            {sep('s4')}

            {/* Légende liens */}
            <div className="relative">
                <button
                    ref={legendBtnRef}
                    onClick={() => setShowLegend(prev => !prev)}
                    aria-pressed={showLegend}
                    className={toggleBtnClass(showLegend)}
                    style={btnStyle}
                    title={t('organigramme.legendes.titre', 'Légende des liens')}
                >
                    <Info style={iconStyle} />
                </button>
                <AnimatePresence>
                    {showLegend && (
                        <motion.div
                            ref={legendRef}
                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-1.5 rounded-xl border shadow-xl"
                            style={{
                                backgroundColor: 'var(--color-surface)',
                                borderColor: 'var(--color-bordure)',
                                padding: 'clamp(0.625rem, 0.5rem + 0.3vw, 0.875rem)',
                                zIndex: 50,
                                minWidth: '220px',
                            }}
                        >
                            <p
                                className="font-semibold"
                                style={{ fontSize: 'clamp(0.75rem, 0.65rem + 0.3vw, 0.8125rem)', color: 'var(--color-text)', marginBottom: 'var(--gap-sm, 0.5rem)' }}
                            >
                                {t('organigramme.legendes.titre', 'Légende des liens')}
                            </p>
                            <div className="flex flex-col" style={{ gap: 'var(--gap-xs, 0.375rem)' }}>
                                <div className="flex items-center" style={{ gap: 'var(--gap-sm, 0.5rem)' }}>
                                    <svg width="36" height="10" viewBox="0 0 36 10">
                                        <line x1="0" y1="5" x2="36" y2="5"
                                            stroke="var(--color-dominant-500)" strokeWidth="2.5" />
                                    </svg>
                                    <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                                        {t('organigramme.legendes.hierarchie', 'Lien hiérarchique')}
                                    </span>
                                </div>
                                <div className="flex items-center" style={{ gap: 'var(--gap-sm, 0.5rem)' }}>
                                    <svg width="36" height="10" viewBox="0 0 36 10">
                                        <line x1="0" y1="5" x2="36" y2="5"
                                            stroke="var(--color-secondary-500)" strokeWidth="2" strokeDasharray="10 5" />
                                    </svg>
                                    <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                                        {t('organigramme.legendes.relationDirect', 'Relation directe')}
                                    </span>
                                </div>
                                <div className="flex items-center" style={{ gap: 'var(--gap-sm, 0.5rem)' }}>
                                    <svg width="36" height="10" viewBox="0 0 36 10">
                                        <line x1="0" y1="5" x2="36" y2="5"
                                            stroke="var(--color-accent-600)" strokeWidth="2" strokeDasharray="4 5" />
                                    </svg>
                                    <span style={{ fontSize: 'clamp(0.6875rem, 0.6rem + 0.25vw, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                                        {t('organigramme.legendes.relationFonctionnelle', 'Relation fonctionnelle')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Toggle overlay relations */}
            {onToggleRelations && (
                <button
                    onClick={onToggleRelations}
                    aria-pressed={!!showRelations}
                    className={toggleBtnClass(!!showRelations)}
                    style={btnStyle}
                    title={showRelations ? t('organigramme.masquerRelations', 'Masquer les relations') : t('organigramme.afficherRelations', 'Afficher les relations')}
                >
                    <Link2 style={iconStyle} />
                </button>
            )}

            {/* Mode édition */}
            {canEdit && onToggleEditMode && (
                <>
                    {sep('s5')}
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
                        <Pencil style={iconStyle} />
                        {!isEditMode && <span className="hidden sm:inline">{t('organigramme.modifier', 'Modifier')}</span>}
                    </button>
                </>
            )}
        </div>

        <ExportDialog
            open={exportDialogOpen}
            onOpenChange={setExportDialogOpen}
            containerId={containerId}
            nomEtablissement={nomEtablissement || 'organigramme'}
        />
        </>
    );
}
