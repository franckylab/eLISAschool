import type { ComponentConfig } from '@puckeditor/core';

export type ActualitesProps = {
    actualites: { _id: string; titre: string; date: string; image: string; resume: string; lien: string }[];
};

export const ActualitesPuck: ComponentConfig<ActualitesProps> = {
    fields: {
        actualites: {
            type: 'array',
            arrayFields: {
                titre: { type: 'text' },
                date: { type: 'text' },
                image: { type: 'text' },
                resume: { type: 'textarea' },
                lien: { type: 'text' },
            },
        },
    },
    defaultProps: { actualites: [] },
    render({ actualites }) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {actualites.length === 0 && <p className="col-span-full text-center text-sm opacity-50">Ajoutez des actualités</p>}
                {actualites.map((a, i) => (
                    <article key={i} className="overflow-hidden rounded-xl border hover:shadow-md">
                        {a.image && <img src={a.image} alt={a.titre} className="h-48 w-full object-cover" loading="lazy" />}
                        <div className="p-4 space-y-2">
                            {a.date && <time className="text-xs opacity-50">{a.date}</time>}
                            <h3 className="font-bold leading-tight">{a.titre || 'Titre'}</h3>
                            <p className="text-sm opacity-70 line-clamp-3">{a.resume}</p>
                            {a.lien && <span className="text-sm font-medium text-primary">Lire la suite →</span>}
                        </div>
                    </article>
                ))}
            </div>
        );
    },
};
