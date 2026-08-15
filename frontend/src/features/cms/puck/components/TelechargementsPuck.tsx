import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type TelechargementsProps = {
    fichiers: { _id: string; nom: string; url: string; description: string; taille: string }[];
    styleConfig?: any;
};

export const TelechargementsPuck: ComponentConfig<TelechargementsProps> = {
    fields: {
        fichiers: {
            type: 'array',
            arrayFields: {
                nom: { type: 'text' },
                url: { type: 'text' },
                description: { type: 'text' },
                taille: { type: 'text' },
            },
        },
    },
    defaultProps: { fichiers: [] },
    render({ fichiers, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="space-y-3">
                {fichiers.length === 0 && <p className="text-center text-sm opacity-50">Ajoutez des fichiers à télécharger</p>}
                {fichiers.map((f, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">📄</div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{f.nom || 'Fichier'}</p>
                            {f.description && <p className="truncate text-xs opacity-50">{f.description}</p>}
                        </div>
                        {f.taille && <span className="shrink-0 text-xs opacity-40">{f.taille}</span>}
                    </div>
                ))}
            </div>
            </SectionWrapper>
        );
    },
};
