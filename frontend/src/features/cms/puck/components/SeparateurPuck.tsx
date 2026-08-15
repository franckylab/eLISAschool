import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type SeparateurProps = { style: string; hauteur: string; styleConfig?: any };

export const SeparateurPuck: ComponentConfig<SeparateurProps> = {
    fields: {
        style: { type: 'radio', options: [
            { label: 'Ligne', value: 'ligne' },
            { label: 'Espace', value: 'espace' },
        ]},
        hauteur: { type: 'text' },
    },
    defaultProps: { style: 'ligne', hauteur: '4rem' },
    render({ style, hauteur, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
                {style === 'espace' ? (
                    <div style={{ height: hauteur || '4rem' }} />
                ) : (
                    <div className="flex items-center justify-center py-4">
                        <div className="h-px w-full max-w-md" style={{ background: 'linear-gradient(to right, transparent, var(--cms-primary, #22c55e), transparent)' }} />
                    </div>
                )}
            </SectionWrapper>
        );
    },
};
