/**
 * ==================================
 * eLISAschool - Providers Wrapper
 * ==================================
 * Encapsule l'application avec tous les providers nécessaires
 */

import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from '@/lib/query-client';
import { AbilityProvider } from '@/lib/casl';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <AbilityProvider>
                {children}
            </AbilityProvider>
            <Toaster
                position="top-right"
                richColors
                closeButton
                expand={false}
                toastOptions={{
                    duration: 4000,
                    classNames: {
                        toast: 'bg-[var(--color-surface)] text-[var(--color-texte)] border border-[var(--color-bordure)]',
                        title: 'font-semibold',
                        description: 'text-[var(--color-texte-secondaire)]',
                        actionButton: 'bg-[var(--color-dominante)] text-white',
                        cancelButton: 'bg-[var(--color-surface-hover)] text-[var(--color-texte)]',
                        closeButton: 'text-[var(--color-texte-secondaire)]',
                    },
                }}
            />
        </QueryClientProvider>
    );
}
