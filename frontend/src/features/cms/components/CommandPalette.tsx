/**
 * ==================================
 * eLISAschool - Command Palette CMS (Cmd+K)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Palette de commandes rapide pour l'éditeur CMS.
 * Recherche fuzzy, raccourcis clavier, actions contextuelles.
 * Navigation clavier (flèches + Entrée).
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Command, Layers, Palette, Eye, Save, Undo2, Redo2, Download, Upload, Monitor, FileText, Keyboard, Type, Image, Video, LayoutGrid, Plus, Trash2, Copy, Settings } from 'lucide-react';
import type { Data } from '@puckeditor/core';

// ==================================
// Types
// ==================================

interface CommandItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    category: 'action' | 'insertion' | 'navigation' | 'style' | 'outil';
    shortcut?: string;
    action: () => void;
    keywords?: string[];
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    puckData: Data;
    onPuckChange: (data: Data) => void;
    onSauvegarder: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onTogglePanel: (panel: string) => void;
    onToggleFocus: () => void;
}

// ==================================
// Recherche fuzzy simple
// ==================================

function fuzzyMatch(query: string, text: string): number {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return 100;

    let score = 0;
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
        if (t[ti] === q[qi]) {
            score += 10;
            qi++;
        }
    }
    return qi === q.length ? score : 0;
}

// ==================================
// Composant principal
// ==================================

export function CommandPalette({
    isOpen,
    onClose,
    puckData,
    onPuckChange,
    onSauvegarder,
    onUndo,
    onRedo,
    onTogglePanel,
    onToggleFocus,
}: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Commands disponibles
    const commands = useMemo((): CommandItem[] => [
        // Actions principales
        { id: 'save', label: 'Sauvegarder la page', icon: <Save className="h-4 w-4" />, category: 'action', shortcut: 'Ctrl+S', action: onSauvegarder, keywords: ['enregistrer', 'save'] },
        { id: 'undo', label: 'Annuler', icon: <Undo2 className="h-4 w-4" />, category: 'action', shortcut: 'Ctrl+Z', action: onUndo, keywords: ['annuler', 'undo'] },
        { id: 'redo', label: 'Rétablir', icon: <Redo2 className="h-4 w-4" />, category: 'action', shortcut: 'Ctrl+Y', action: onRedo, keywords: ['retablir', 'redo'] },
        { id: 'focus', label: 'Mode focus', icon: <Command className="h-4 w-4" />, category: 'action', shortcut: 'F11', action: onToggleFocus, keywords: ['focus', 'plein', 'ecran'] },

        // Panneaux
        { id: 'seo', label: 'Panneau SEO', icon: <Search className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('seo'), keywords: ['seo', 'referencement', 'meta'] },
        { id: 'export', label: 'Export / Import JSON', icon: <Download className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('export'), keywords: ['export', 'import', 'json'] },
        { id: 'responsive', label: 'Preview responsive', icon: <Monitor className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('responsive'), keywords: ['responsive', 'mobile', 'preview'] },
        { id: 'patterns', label: 'Blocs de sections', icon: <LayoutGrid className="h-4 w-4" />, category: 'navigation', shortcut: 'Ctrl+Shift+P', action: () => onTogglePanel('patterns'), keywords: ['patterns', 'blocs', 'sections', 'template'] },
        { id: 'library', label: 'Bibliothèque de sections', icon: <Layers className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('library'), keywords: ['bibliotheque', 'library', 'sections'] },
        { id: 'style', label: 'Éditeur de style', icon: <Palette className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('style'), keywords: ['style', 'apparence', 'couleur', 'theme'] },
        { id: 'clipboard', label: 'Presse-papier sections', icon: <Copy className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('clipboard'), keywords: ['clipboard', 'presse-papier', 'copier', 'coller'] },
        { id: 'metrics', label: 'Métriques de contenu', icon: <FileText className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('metrics'), keywords: ['metriques', 'compteur', 'mots', 'qualite'] },
        { id: 'visibility', label: 'Conditions d\'affichage', icon: <Eye className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('visibility'), keywords: ['visibilite', 'conditions', 'affichage', 'responsive'] },
        { id: 'shortcuts', label: 'Raccourcis clavier', icon: <Keyboard className="h-4 w-4" />, category: 'navigation', action: () => onTogglePanel('shortcuts'), keywords: ['raccourcis', 'shortcuts', 'clavier'] },

        // Insertion rapide (types Puck courants)
        { id: 'insert-hero', label: 'Insérer Hero Section', icon: <Image className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'HeroSection'), keywords: ['hero', 'banniere', 'accueil'] },
        { id: 'insert-text', label: 'Insérer Bloc Texte', icon: <Type className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'TexteSection'), keywords: ['texte', 'paragraph', 'contenu'] },
        { id: 'insert-gallery', label: 'Insérer Galerie', icon: <Image className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'GalerieSection'), keywords: ['galerie', 'images', 'photos'] },
        { id: 'insert-video', label: 'Insérer Vidéo', icon: <Video className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'VideoSection'), keywords: ['video', 'youtube', 'media'] },
        { id: 'insert-faq', label: 'Insérer FAQ', icon: <FileText className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'FaqSection'), keywords: ['faq', 'questions', 'reponses'] },
        { id: 'insert-cta', label: 'Insérer Appel à l\'action', icon: <Plus className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'AppelActionSection'), keywords: ['cta', 'appel', 'action', 'bouton'] },
        { id: 'insert-timeline', label: 'Insérer Timeline', icon: <Layers className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'TimelineSection'), keywords: ['timeline', 'chronologie', 'etapes'] },
        { id: 'insert-carousel', label: 'Insérer Carousel', icon: <Layers className="h-4 w-4" />, category: 'insertion', action: () => insererSectionRapide(puckData, onPuckChange, 'CarouselSection'), keywords: ['carousel', 'slider', 'diaporama'] },

        // Outils
        { id: 'delete-all', label: 'Supprimer toutes les sections', icon: <Trash2 className="h-4 w-4" />, category: 'outil', action: () => onPuckChange({ content: [], root: {} }), keywords: ['supprimer', 'tout', 'effacer', 'clear'] },
        { id: 'duplicate-all', label: 'Dupliquer la page', icon: <Copy className="h-4 w-4" />, category: 'outil', action: () => { navigator.clipboard.writeText(JSON.stringify(puckData)); }, keywords: ['dupliquer', 'copier', 'page'] },
    ], [puckData, onPuckChange, onSauvegarder, onUndo, onRedo, onTogglePanel, onToggleFocus]);

    // Filtrage + tri par score
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return commands;
        return commands
            .map(cmd => ({
                cmd,
                score: Math.max(
                    fuzzyMatch(query, cmd.label),
                    ...(cmd.keywords || []).map(k => fuzzyMatch(query, k)),
                    ...(cmd.description ? [fuzzyMatch(query, cmd.description)] : []),
                ),
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.cmd);
    }, [commands, query]);

    // Regrouper par catégorie
    const groupedCommands = useMemo(() => {
        const groups: Record<string, CommandItem[]> = {};
        for (const cmd of filteredCommands) {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        }
        return groups;
    }, [filteredCommands]);

    const flatCommands = useMemo(() => filteredCommands, [filteredCommands]);

    // Navigation clavier
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, flatCommands.length - 1));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (flatCommands[selectedIndex]) {
                        flatCommands[selectedIndex].action();
                        onClose();
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatCommands, selectedIndex, onClose]);

    // Focus input à l'ouverture
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Scroll to selected
    useEffect(() => {
        if (listRef.current) {
            const selected = listRef.current.querySelector('[data-selected="true"]');
            selected?.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    // Ouvrir avec Cmd+K / Ctrl+K
    useEffect(() => {
        const handleGlobalKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (!isOpen) {
                    // Le parent gère l'ouverture
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKey);
        return () => window.removeEventListener('keydown', handleGlobalKey);
    }, [isOpen]);

    if (!isOpen) return null;

    const CATEGORY_LABELS: Record<string, string> = {
        action: 'Actions',
        insertion: 'Insertion rapide',
        navigation: 'Panneaux',
        style: 'Style',
        outil: 'Outils',
    };

    let globalIndex = 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Palette */}
            <div
                className="relative w-full max-w-lg rounded-xl border bg-white shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Input */}
                <div className="flex items-center gap-2 border-b px-4 py-3">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                        placeholder="Rechercher une commande..."
                        className="flex-1 text-sm outline-none placeholder:text-gray-400"
                    />
                    <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">Échap</kbd>
                </div>

                {/* Résultats */}
                <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
                    {flatCommands.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-gray-400">
                            <Search className="mb-2 h-8 w-8" />
                            <p className="text-sm">Aucune commande trouvée</p>
                            <p className="text-xs">Essayez un autre terme</p>
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, items]) => (
                            <div key={category} className="mb-2">
                                <p className="mb-1 px-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                    {CATEGORY_LABELS[category] || category}
                                </p>
                                {items.map(cmd => {
                                    const idx = globalIndex++;
                                    return (
                                        <button
                                            key={cmd.id}
                                            data-selected={idx === selectedIndex}
                                            onClick={() => { cmd.action(); onClose(); }}
                                            onMouseEnter={() => setSelectedIndex(idx)}
                                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                                                idx === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="text-gray-400">{cmd.icon}</span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{cmd.label}</p>
                                                {cmd.description && <p className="text-[10px] text-gray-400 truncate">{cmd.description}</p>}
                                            </div>
                                            {cmd.shortcut && (
                                                <kbd className="rounded border bg-gray-100 px-1.5 py-0.5 text-[9px] font-mono text-gray-500">
                                                    {cmd.shortcut}
                                                </kbd>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t px-4 py-2 text-[10px] text-gray-400">
                    <span>↑↓ Naviguer</span>
                    <span>↵ Sélectionner</span>
                    <span>Échap Fermer</span>
                    <span>{flatCommands.length} commandes</span>
                </div>
            </div>
        </div>
    );
}

// ==================================
// Helper — Insertion rapide d'une section
// ==================================

function insererSectionRapide(puckData: Data, onPuckChange: (data: Data) => void, type: string) {
    const defaultProps: Record<string, any> = { id: undefined };

    switch (type) {
        case 'HeroSection':
            defaultProps.titre = 'Nouveau titre';
            defaultProps.sousTitre = 'Sous-titre descriptif';
            defaultProps.ctaTexte = 'En savoir plus';
            break;
        case 'TexteSection':
            defaultProps.titre = 'Section texte';
            defaultProps.texte = 'Votre contenu ici...';
            break;
        case 'GalerieSection':
            defaultProps.titre = 'Galerie photos';
            defaultProps.images = [];
            break;
        case 'VideoSection':
            defaultProps.titre = 'Vidéo';
            defaultProps.videoUrl = '';
            break;
        case 'FaqSection':
            defaultProps.titre = 'Questions fréquentes';
            defaultProps.items = [{ question: 'Question 1', reponse: 'Réponse 1' }];
            break;
        case 'AppelActionSection':
            defaultProps.titre = 'Appelez à l\'action';
            defaultProps.ctaTexte = 'Commencer';
            break;
        case 'TimelineSection':
            defaultProps.titre = 'Notre histoire';
            defaultProps.items = [{ titre: 'Étape 1', description: 'Description' }];
            break;
        case 'CarouselSection':
            defaultProps.titre = 'Carousel';
            defaultProps.slides = [];
            break;
    }

    const newContent = [...puckData.content, { type, props: defaultProps }];
    onPuckChange({ ...puckData, content: newContent });
}

// ==================================
// Bouton toolbar pour ouvrir la palette
// ==================================

export function CommandPaletteButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-muted transition-colors"
            title="Commandes rapides (Ctrl+K)"
        >
            <Command className="h-3.5 w-3.5" />
            <kbd className="hidden rounded border bg-gray-100 px-1 py-0.5 text-[9px] font-mono sm:inline">⌘K</kbd>
        </button>
    );
}
