import type { ComponentConfig } from '@puckeditor/core';

export type PartenairesProps = {
    partenaires: { _id: string; nom: string; logo: string; url: string }[];
};

export const PartenairesPuck: ComponentConfig<PartenairesProps> = {
    fields: {
        partenaires: {
            type: 'array',
            arrayFields: {
                nom: { type: 'text' },
                logo: { type: 'text' },
                url: { type: 'text' },
            },
        },
    },
    defaultProps: { partenaires: [] },
    render({ partenaires }) {
        return (
            <div className="flex flex-wrap items-center justify-center gap-8">
                {partenaires.length === 0 && <p className="text-center text-sm opacity-50">Ajoutez des partenaires</p>}
                {partenaires.map((p, i) => (
                    <div key={i} className="flex items-center justify-center rounded-xl border p-4" title={p.nom}>
                        {p.logo ? (
                            <img src={p.logo} alt={p.nom} className="h-16 w-auto object-contain opacity-60 grayscale hover:opacity-100 hover:grayscale-0" />
                        ) : (
                            <span className="text-sm font-medium opacity-60">{p.nom || 'Partenaire'}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    },
};
