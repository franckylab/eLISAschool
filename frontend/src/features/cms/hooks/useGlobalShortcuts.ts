/**
 * ==================================
 * eLISAschool - Hook de raccourcis clavier global pour éditeur CMS
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Système centralisé de raccourcis clavier pour l'éditeur CMS.
 * Inspiré de Figma, Webflow, et VS Code.
 * Gère les conflits, les contextes, et les priorités.
 */

import { useEffect, useCallback, useRef } from 'react';

// ==================================
// Types
// ==================================

export interface KeyboardShortcut {
    id: string;
    key: string; // Ex: 'ctrl+s', 'ctrl+shift+z', 'delete', 'escape'
    label: string;
    description?: string;
    category: 'fichier' | 'edition' | 'navigation' | 'affichage' | 'sections' | 'outils';
    action: () => void;
    enabled?: boolean; // Dynamiquement activé/désactivé
    priority?: number; // Priorité en cas de conflit (défaut: 0)
    context?: 'global' | 'canvas' | 'panel' | 'modal'; // Contexte d'activation
    preventDefault?: boolean;
}

export interface ShortcutGroup {
    category: string;
    label: string;
    shortcuts: KeyboardShortcut[];
}

// ==================================
// Hook principal
// ==================================

export function useGlobalShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
    const shortcutsRef = useRef(shortcuts);
    const enabledRef = useRef(enabled);

    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabledRef.current) return;

        // Ignorer si on est dans un input/textarea (sauf pour les raccourcis globaux)
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        // Construire la combinaison de touches
        const keys: string[] = [];
        if (e.ctrlKey || e.metaKey) keys.push('ctrl');
        if (e.shiftKey) keys.push('shift');
        if (e.altKey) keys.push('alt');
        if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
            keys.push(e.key.toLowerCase());
        }
        
        const combination = keys.join('+');

        // Trouver le raccourci correspondant
        const matchingShortcuts = shortcutsRef.current
            .filter(s => {
                if (s.enabled === false) return false;
                const shortcutKeys = s.key.toLowerCase().split('+').map(k => k.trim());
                const matches = shortcutKeys.every(k => keys.includes(k)) && 
                               shortcutKeys.length === keys.length;
                return matches;
            })
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        if (matchingShortcuts.length > 0) {
            const shortcut = matchingShortcuts[0];
            
            // Vérifier le contexte
            if (shortcut.context === 'canvas' && isInput) return;
            if (shortcut.context === 'panel' && !isInput) return;
            
            // Exécuter l'action
            if (shortcut.preventDefault !== false) {
                e.preventDefault();
                e.stopPropagation();
            }
            shortcut.action();
        }
    }, []);

    useEffect(() => {
        if (!enabled) return;
        
        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [enabled, handleKeyDown]);

    // Fonction pour obtenir tous les raccourcis groupés par catégorie
    const getGroupedShortcuts = useCallback((): ShortcutGroup[] => {
        const groups: Record<string, KeyboardShortcut[]> = {};
        
        shortcuts.forEach(s => {
            if (!groups[s.category]) {
                groups[s.category] = [];
            }
            groups[s.category].push(s);
        });

        const categoryLabels: Record<string, string> = {
            fichier: 'Fichier',
            edition: 'Édition',
            navigation: 'Navigation',
            affichage: 'Affichage',
            sections: 'Sections',
            outils: 'Outils',
        };

        return Object.entries(groups).map(([category, shortcuts]) => ({
            category,
            label: categoryLabels[category] || category,
            shortcuts,
        }));
    }, [shortcuts]);

    return {
        getGroupedShortcuts,
    };
}

// ==================================
// Raccourcis par défaut pour l'éditeur CMS
// ==================================

export function createDefaultShortcuts(handlers: {
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onDuplicate?: () => void;
    onDelete?: () => void;
    onCopy?: () => void;
    onPaste?: () => void;
    onTogglePreview?: () => void;
    onToggleDarkMode?: () => void;
    onToggleGrid?: () => void;
    onToggleRulers?: () => void;
    onToggleMinimap?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onZoomReset?: () => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    onOpenCommandPalette?: () => void;
    onToggleFocusMode?: () => void;
    onSelectAll?: () => void;
    onEscape?: () => void;
}): KeyboardShortcut[] {
    return [
        // Fichier
        { id: 'save', key: 'ctrl+s', label: 'Sauvegarder', category: 'fichier', action: handlers.onSave, description: 'Enregistrer la page' },
        { id: 'save-as', key: 'ctrl+shift+s', label: 'Sauvegarder sous', category: 'fichier', action: () => {}, description: 'Copier comme template', enabled: false },
        
        // Édition
        { id: 'undo', key: 'ctrl+z', label: 'Annuler', category: 'edition', action: handlers.onUndo, description: 'Annuler la dernière action' },
        { id: 'redo', key: 'ctrl+shift+z', label: 'Rétablir', category: 'edition', action: handlers.onRedo, description: 'Rétablir l\'action annulée', priority: 1 },
        { id: 'redo-alt', key: 'ctrl+y', label: 'Rétablir (alt)', category: 'edition', action: handlers.onRedo, description: 'Rétablir (raccourci alternatif)', priority: 0 },
        { id: 'duplicate', key: 'ctrl+d', label: 'Dupliquer', category: 'edition', action: handlers.onDuplicate || (() => {}), description: 'Dupliquer la section sélectionnée', enabled: !!handlers.onDuplicate },
        { id: 'delete', key: 'delete', label: 'Supprimer', category: 'edition', action: handlers.onDelete || (() => {}), description: 'Supprimer la section sélectionnée', context: 'canvas', enabled: !!handlers.onDelete },
        { id: 'copy', key: 'ctrl+c', label: 'Copier', category: 'edition', action: handlers.onCopy || (() => {}), description: 'Copier la section', enabled: !!handlers.onCopy },
        { id: 'paste', key: 'ctrl+v', label: 'Coller', category: 'edition', action: handlers.onPaste || (() => {}), description: 'Coller la section copiée', enabled: !!handlers.onPaste },
        { id: 'select-all', key: 'ctrl+a', label: 'Tout sélectionner', category: 'edition', action: handlers.onSelectAll || (() => {}), description: 'Sélectionner toutes les sections', context: 'canvas', enabled: !!handlers.onSelectAll },
        
        // Navigation
        { id: 'command-palette', key: 'ctrl+k', label: 'Palette de commandes', category: 'navigation', action: handlers.onOpenCommandPalette || (() => {}), description: 'Ouvrir la palette de commandes' },
        { id: 'escape', key: 'escape', label: 'Fermer/Désélectionner', category: 'navigation', action: handlers.onEscape || (() => {}), description: 'Fermer le modal ou désélectionner', priority: -1 },
        
        // Affichage
        { id: 'toggle-preview', key: 'ctrl+p', label: 'Aperçu', category: 'affichage', action: handlers.onTogglePreview || (() => {}), description: 'Ouvrir l\'aperçu', enabled: !!handlers.onTogglePreview },
        { id: 'toggle-dark-mode', key: 'ctrl+shift+d', label: 'Mode sombre', category: 'affichage', action: handlers.onToggleDarkMode || (() => {}), description: 'Basculer le mode sombre preview', enabled: !!handlers.onToggleDarkMode },
        { id: 'toggle-grid', key: 'ctrl+shift+g', label: 'Grille', category: 'affichage', action: handlers.onToggleGrid || (() => {}), description: 'Afficher/masquer la grille', enabled: !!handlers.onToggleGrid },
        { id: 'toggle-rulers', key: 'ctrl+r', label: 'Règles', category: 'affichage', action: handlers.onToggleRulers || (() => {}), description: 'Afficher/masquer les règles', enabled: !!handlers.onToggleRulers },
        { id: 'toggle-minimap', key: 'ctrl+m', label: 'Minimap', category: 'affichage', action: handlers.onToggleMinimap || (() => {}), description: 'Afficher/masquer la minimap', enabled: !!handlers.onToggleMinimap },
        { id: 'zoom-in', key: 'ctrl++', label: 'Zoom +', category: 'affichage', action: handlers.onZoomIn || (() => {}), description: 'Agrandir le zoom', enabled: !!handlers.onZoomIn },
        { id: 'zoom-out', key: 'ctrl+-', label: 'Zoom -', category: 'affichage', action: handlers.onZoomOut || (() => {}), description: 'Réduire le zoom', enabled: !!handlers.onZoomOut },
        { id: 'zoom-reset', key: 'ctrl+0', label: 'Zoom 100%', category: 'affichage', action: handlers.onZoomReset || (() => {}), description: 'Réinitialiser le zoom', enabled: !!handlers.onZoomReset },
        { id: 'focus-mode', key: 'f11', label: 'Mode focus', category: 'affichage', action: handlers.onToggleFocusMode || (() => {}), description: 'Basculer le mode plein écran' },
        
        // Sections
        { id: 'move-up', key: 'ctrl+arrowup', label: 'Déplacer vers le haut', category: 'sections', action: handlers.onMoveUp || (() => {}), description: 'Déplacer la section vers le haut', context: 'canvas', enabled: !!handlers.onMoveUp },
        { id: 'move-down', key: 'ctrl+arrowdown', label: 'Déplacer vers le bas', category: 'sections', action: handlers.onMoveDown || (() => {}), description: 'Déplacer la section vers le bas', context: 'canvas', enabled: !!handlers.onMoveDown },
    ];
}

// ==================================
// Hook pour afficher les raccourcis dans l'UI
// ==================================

export function useShortcutDisplay(key: string): string {
    // Convertit 'ctrl+s' en 'Ctrl+S' pour l'affichage
    return key
        .split('+')
        .map(k => {
            if (k === 'ctrl') return 'Ctrl';
            if (k === 'shift') return 'Shift';
            if (k === 'alt') return 'Alt';
            if (k === 'arrowup') return '↑';
            if (k === 'arrowdown') return '↓';
            if (k === 'arrowleft') return '←';
            if (k === 'arrowright') return '→';
            return k.charAt(0).toUpperCase() + k.slice(1);
        })
        .join(' + ');
}
