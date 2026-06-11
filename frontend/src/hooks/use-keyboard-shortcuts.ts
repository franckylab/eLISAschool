/**
 * ==================================
 * eLISAschool - Hook de Raccourcis Clavier
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour gérer les raccourcis clavier globaux
 */

import { useEffect, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    action: () => void;
    enabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const shortcutsRef = useRef(shortcuts);

    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const shortcut of shortcutsRef.current) {
                if (shortcut.enabled === false) continue;

                const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const matchesCtrl = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
                const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;
                const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;

                if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
}
