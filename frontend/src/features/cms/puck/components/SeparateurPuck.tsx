import type { ComponentConfig } from '@puckeditor/core';

export type SeparateurProps = { style: string; hauteur: string };

export const SeparateurPuck: ComponentConfig<SeparateurProps> = {
    fields: {
        style: { type: 'radio', options: [
            { label: 'Ligne', value: 'ligne' },
            { label: 'Espace', value: 'espace' },
        ]},
        hauteur: { type: 'text' },
    },
    defaultProps: { style: 'ligne', hauteur: '4rem' },
    render({ style, hauteur }) {
        if (style === 'espace') {
            return <div style={{ height: hauteur || '4rem' }} />;
        }
        return (
            <div className="flex items-center justify-center py-4">
                <div className="h-px w-full max-w-md" style={{ background: 'linear-gradient(to right, transparent, var(--cms-primary, #22c55e), transparent)' }} />
            </div>
        );
    },
};
