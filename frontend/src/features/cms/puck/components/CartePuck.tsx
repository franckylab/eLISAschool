import type { ComponentConfig } from '@puckeditor/core';

export type CarteProps = { latitude: string; longitude: string; adresse: string };

export const CartePuck: ComponentConfig<CarteProps> = {
    fields: {
        latitude: { type: 'text' },
        longitude: { type: 'text' },
        adresse: { type: 'text' },
    },
    defaultProps: { latitude: '', longitude: '', adresse: '' },
    render({ latitude, longitude, adresse }) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        return (
            <div className="overflow-hidden rounded-xl border">
                {lat && lng ? (
                    <iframe
                        title="Localisation"
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
                        className="h-64 w-full border-0"
                    />
                ) : (
                    <div className="flex h-64 items-center justify-center bg-gray-100 text-sm text-gray-400">
                        Entrez les coordonnées GPS pour afficher la carte
                    </div>
                )}
                {adresse && <div className="p-4 text-center text-sm opacity-70">{adresse}</div>}
            </div>
        );
    },
};
