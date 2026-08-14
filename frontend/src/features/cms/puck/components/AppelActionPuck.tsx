import type { ComponentConfig } from '@puckeditor/core';

export type AppelActionProps = {
    titre: string;
    description: string;
    icone: string;
    imageFond: string;
    boutonLabel: string;
    boutonUrl: string;
    boutonNouvelOnglet: boolean;
};

export const AppelActionPuck: ComponentConfig<AppelActionProps> = {
    fields: {
        titre: { type: 'text' },
        description: { type: 'textarea' },
        icone: { type: 'text' },
        imageFond: { type: 'text' },
        boutonLabel: { type: 'text' },
        boutonUrl: { type: 'text' },
        boutonNouvelOnglet: { type: 'radio', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    },
    defaultProps: {
        titre: 'Rejoignez-nous',
        description: '',
        icone: '',
        imageFond: '',
        boutonLabel: 'En savoir plus',
        boutonUrl: '#',
        boutonNouvelOnglet: false,
    },
    render({ titre, description, icone, imageFond, boutonLabel, boutonUrl }) {
        return (
            <div
                className="relative overflow-hidden rounded-2xl p-8 text-center text-white"
                style={{
                    background: imageFond
                        ? `linear-gradient(135deg, var(--cms-primary, #22c55e)dd, var(--cms-secondary, #3b82f6)dd), url(${imageFond}) center/cover`
                        : 'linear-gradient(135deg, var(--cms-primary, #22c55e), var(--cms-secondary, #3b82f6))',
                }}
            >
                <div className="relative z-10">
                    {icone && <span className="mb-3 inline-block text-4xl">{icone}</span>}
                    <h3 className="mb-3 text-2xl font-bold">{titre || 'Appel à action'}</h3>
                    {description && <p className="mx-auto mb-6 max-w-xl opacity-90">{description}</p>}
                    {boutonLabel && (
                        <span className="inline-flex items-center rounded-lg bg-white px-8 py-3 text-sm font-bold" style={{ color: 'var(--cms-primary, #22c55e)' }}>
                            {boutonLabel}
                        </span>
                    )}
                </div>
            </div>
        );
    },
};
