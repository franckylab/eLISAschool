/**
 * ==================================
 * eLISAschool - Puck Component: Témoignage Carousel
 * ==================================
 * Carrousel de témoignages avec rotation automatique.
 */
import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

type Temoignage = { nom: string; fonction: string; contenu: string; note: number; avatar?: string };

type TemoignageCarouselProps = {
    temoignages: Temoignage[];
    autoplay: boolean;
    showNavigation: boolean;
    styleConfig?: any;
};

export const TemoignageCarouselPuck: ComponentConfig<TemoignageCarouselProps> = {
    fields: {
        temoignages: {
            type: 'array',
            arrayFields: {
                nom: { type: 'text', label: 'Nom' },
                fonction: { type: 'text', label: 'Fonction' },
                contenu: { type: 'text', label: 'Témoignage' },
                note: { type: 'number', label: 'Note (1-5)', min: 1, max: 5 },
                avatar: { type: 'text', label: 'URL avatar' },
            },
            defaultItemProps: { nom: '', fonction: '', contenu: '', note: 5, avatar: '' },
            label: 'Témoignages',
        },
        autoplay: { type: 'radio', label: 'Auto', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        showNavigation: { type: 'radio', label: 'Navigation', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
    },
    defaultProps: {
        temoignages: [
            { nom: 'Marie K.', fonction: 'Parent d\'élève', contenu: 'Un établissement exceptionnel avec un corps enseignant dévoué.', note: 5 },
            { nom: 'Jean P.', fonction: 'Ancien élève', contenu: 'La formation m\'a permis de réussir mes études supérieures.', note: 5 },
        ],
        autoplay: true,
        showNavigation: true,
    },
    render: ({ temoignages, showNavigation, styleConfig }) => {
        const t = temoignages[0]; // Preview — premier témoignage
        if (!t) return <div className="p-8 text-center text-gray-400">Aucun témoignage</div>;
        return (
            <SectionWrapper styleConfig={styleConfig}>
            <div className="mx-auto max-w-2xl text-center py-8">
                <div className="text-4xl text-blue-200 mb-4">"</div>
                <p className="text-lg italic text-gray-700">{t.contenu}</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                    {t.avatar ? (
                        <img src={t.avatar} alt={t.nom} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                            {t.nom.charAt(0)}
                        </div>
                    )}
                    <div className="text-left">
                        <div className="font-semibold text-gray-900">{t.nom}</div>
                        <div className="text-sm text-gray-500">{t.fonction}</div>
                    </div>
                </div>
                {t.note > 0 && (
                    <div className="mt-2 text-yellow-400">
                        {'★'.repeat(t.note)}{'☆'.repeat(5 - t.note)}
                    </div>
                )}
                {showNavigation && temoignages.length > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        {temoignages.map((_, i) => (
                            <span key={i} className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                        ))}
                    </div>
                )}
            </div>
            </SectionWrapper>
        );
    },
};
