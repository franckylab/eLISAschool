import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type TemoignagesProps = {
    temoignages: { _id: string; texte: string; nom: string; fonction: string; avatar: string }[];
    styleConfig?: any;
};

export const TemoignagesPuck: ComponentConfig<TemoignagesProps> = {
    fields: {
        temoignages: {
            type: 'array',
            arrayFields: {
                texte: { type: 'textarea', contentEditable: true },
                nom: { type: 'text', contentEditable: true },
                fonction: { type: 'text', contentEditable: true },
                avatar: { type: 'text' },
            },
        },
    },
    defaultProps: { temoignages: [] },
    render({ temoignages, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {temoignages.map((t, i) => (
                    <blockquote key={i} className="rounded-xl border-l-4 bg-gray-50 p-6 dark:bg-gray-800/50" style={{ borderLeftColor: 'var(--cms-primary, #22c55e)' }}>
                        <p className="mb-4 italic opacity-80">&laquo; {t.texte} &raquo;</p>
                        <footer className="flex items-center gap-3">
                            {t.avatar && <img src={t.avatar} alt={t.nom} className="h-10 w-10 rounded-full object-cover" />}
                            <div>
                                <cite className="text-sm font-semibold not-italic">{t.nom}</cite>
                                {t.fonction && <p className="text-xs opacity-60">{t.fonction}</p>}
                            </div>
                        </footer>
                    </blockquote>
                ))}
            </div>
            </SectionWrapper>
        );
    },
};
