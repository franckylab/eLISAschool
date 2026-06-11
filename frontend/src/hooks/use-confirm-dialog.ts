/**
 * ==================================
 * eLISAschool - Hook de Confirmation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Hook pour gérer les dialogues de confirmation
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
    titre: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    cancelLabel?: string;
}

interface ConfirmState {
    isOpen: boolean;
    titre: string;
    message: string;
    type: 'danger' | 'warning' | 'info';
    confirmLabel: string;
    cancelLabel: string;
    onConfirm: (() => void) | null;
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        isOpen: false,
        titre: '',
        message: '',
        type: 'info',
        confirmLabel: 'Confirmer',
        cancelLabel: 'Annuler',
        onConfirm: null,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setState({
                isOpen: true,
                titre: options.titre,
                message: options.message,
                type: options.type || 'info',
                confirmLabel: options.confirmLabel || 'Confirmer',
                cancelLabel: options.cancelLabel || 'Annuler',
                onConfirm: () => {
                    resolve(true);
                    setState((prev) => ({ ...prev, isOpen: false }));
                },
            });

            // Si l'utilisateur ferme sans confirmer
            const handleClose = () => {
                resolve(false);
                setState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
            };

            // Stocker la fonction de fermeture pour le modal
            (state as any).onClose = handleClose;
        });
    }, []);

    const handleClose = useCallback(() => {
        setState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    const handleConfirm = useCallback(() => {
        if (state.onConfirm) {
            state.onConfirm();
        }
        setState((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
    }, [state.onConfirm]);

    return {
        confirm,
        isOpen: state.isOpen,
        titre: state.titre,
        message: state.message,
        type: state.type,
        confirmLabel: state.confirmLabel,
        cancelLabel: state.cancelLabel,
        onClose: handleClose,
        onConfirm: handleConfirm,
    };
}
