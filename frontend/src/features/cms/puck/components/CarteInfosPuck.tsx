import type { ComponentConfig } from '@puckeditor/core';

export type CarteInfosProps = {
    cartes: { _id: string; icone: string; titre: string; description: string }[];
};

export const CarteInfosPuck: ComponentConfig<CarteInfosProps> = {
    fields: {
        cartes: {
            type: 'array',
            arrayFields: {
                icone: { type: 'text' },
                titre: { type: 'text' },
                description: { type: 'textarea' },
            },
        },
    },
    defaultProps: { cartes: [] },
    render({ cartes }) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cartes.map((c, i) => (
                    <div key={i} className="rounded-xl border p-6">
                        {c.icone && (
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-2xl">
                                {c.icone}
                            </div>
                        )}
                        <h3 className="mb-2 text-lg font-bold">{c.titre || 'Titre'}</h3>
                        <p className="text-sm opacity-70">{c.description}</p>
                    </div>
                ))}
            </div>
        );
    },
};
