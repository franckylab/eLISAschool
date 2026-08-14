/**
 * CarteSection — Lazy-loaded
 * Carte OpenStreetMap avec iframe.
 */
import type { EtablissementPublic } from '../../types/cms.types';

export function CarteSection({ contenu, etablissement }: { contenu: Record<string, any>; etablissement?: EtablissementPublic }) {
    const lat = contenu.latitude || etablissement?.latitude;
    const lng = contenu.longitude || etablissement?.longitude;

    if (!lat || !lng) {
        return <p className="text-center text-sm opacity-50">Coordonnées non disponibles</p>;
    }

    return (
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: 'var(--cms-primary)' + '20' }}>
            <iframe
                title="Localisation"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`}
                className="h-80 w-full border-0"
                loading="lazy"
            />
            {contenu.adresse && (
                <div className="p-4 text-center text-sm opacity-70">
                    {contenu.adresse}
                </div>
            )}
        </div>
    );
}

export default CarteSection;
