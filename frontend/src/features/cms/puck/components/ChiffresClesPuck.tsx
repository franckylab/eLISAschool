import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type ChiffresClesProps = {
    chiffres: { _id: string; valeur: string; label: string; description: string }[];
    styleConfig?: any;
};

export const ChiffresClesPuck: ComponentConfig<ChiffresClesProps> = {
    fields: {
        chiffres: {
            type: 'array',
            arrayFields: {
                valeur: { type: 'text', contentEditable: true },
                label: { type: 'text', contentEditable: true },
                description: { type: 'text' },
            },
        },
    },
    defaultProps: { chiffres: [] },
    render({ chiffres, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {chiffres.map((c, i) => (
                    <div key={i} className="text-center space-y-2">
                        <div className="text-4xl font-black" style={{ color: 'var(--cms-primary, #22c55e)' }}>{c.valeur || '0'}</div>
                        <div className="text-sm font-medium opacity-70">{c.label}</div>
                        {c.description && <div className="text-xs opacity-50">{c.description}</div>}
                    </div>
                ))}
            </div>
            </SectionWrapper>
        );
    },
};
