/**
 * ==================================
 * eLISAschool - Hook useConfirm
 * ==================================
 * Hook pour afficher un dialogue de confirmation
 */

import { useState, useCallback } from 'react';

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
}

const defaultState: ConfirmState = {
    isOpen: false,
    title: '',
    description: undefined,
    confirmText: undefined,
    cancelText: undefined,
    variant: 'warning',
    resolve: null,
};

let globalState = defaultState;
let globalSetState: ((state: ConfirmState) => void) | null = null;

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>(defaultState);
    globalSetState = setState;

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            const newState: ConfirmState = {
                ...options,
                isOpen: true,
                resolve,
            };
            globalState = newState;
            globalSetState?.(newState);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        globalState.resolve?.(true);
        globalSetState?.({ ...defaultState });
    }, []);

    const handleCancel = useCallback(() => {
        globalState.resolve?.(false);
        globalSetState?.({ ...defaultState });
    }, []);

    return {
        confirmState: state,
        confirm,
        handleConfirm,
        handleCancel,
        setConfirmState: setState,
    };
}
