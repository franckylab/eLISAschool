/**
 * ==================================
 * eLISAschool - Puck Component: Carousel
 * ==================================
 * Carrousel d'images/contenu avec navigation et autoplay.
 */

import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

type CarouselProps = {
    slides: Array<{
        imageUrl?: string;
        titre?: string;
        description?: string;
        lien?: string;
    }>;
    autoplay: boolean;
    interval: number;
    showDots: boolean;
    showArrows: boolean;
    hauteur: string;
    styleConfig?: any;
};

export const CarouselPuck: ComponentConfig<CarouselProps> = {
    fields: {
        slides: {
            type: 'array',
            arrayFields: {
                imageUrl: { type: 'text', label: 'URL Image' },
                titre: { type: 'text', label: 'Titre', contentEditable: true },
                description: { type: 'text', label: 'Description', contentEditable: true },
                lien: { type: 'text', label: 'Lien (optionnel)' },
            },
            defaultItemProps: { imageUrl: '', titre: '', description: '', lien: '' },
            label: 'Slides',
        },
        autoplay: { type: 'radio', label: 'Lecture auto', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        interval: { type: 'number', label: 'Intervalle (ms)', min: 2000, max: 10000, step: 500 },
        showDots: { type: 'radio', label: 'Points', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        showArrows: { type: 'radio', label: 'Flèches', options: [{ label: 'Oui', value: true }, { label: 'Non', value: false }] },
        hauteur: { type: 'select', label: 'Hauteur', options: [
            { label: 'Petite (300px)', value: '300px' },
            { label: 'Moyenne (450px)', value: '450px' },
            { label: 'Grande (600px)', value: '600px' },
            { label: 'Plein écran', value: '100vh' },
        ]},
    },
    defaultProps: {
        slides: [
            { imageUrl: '', titre: 'Slide 1', description: 'Description du slide 1' },
            { imageUrl: '', titre: 'Slide 2', description: 'Description du slide 2' },
            { imageUrl: '', titre: 'Slide 3', description: 'Description du slide 3' },
        ],
        autoplay: true,
        interval: 5000,
        showDots: true,
        showArrows: true,
        hauteur: '450px',
    },
    render: ({ slides, autoplay, interval, showDots, showArrows, hauteur, styleConfig }) => (
        <SectionWrapper styleConfig={styleConfig}>
        <div className="relative w-full overflow-hidden rounded-lg" style={{ height: hauteur }}>
            {slides.length === 0 ? (
                <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400">
                    Aucun slide configuré
                </div>
            ) : (
                <div className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth">
                    {slides.map((slide, i) => (
                        <div key={i} className="relative min-w-full snap-center">
                            {slide.imageUrl ? (
                                <img src={slide.imageUrl} alt={slide.titre || ''} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                    <span className="text-gray-400">Image {i + 1}</span>
                                </div>
                            )}
                            {(slide.titre || slide.description) && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                                    {slide.titre && <h3 className="text-xl font-bold">{slide.titre}</h3>}
                                    {slide.description && <p className="mt-1 text-sm opacity-90">{slide.description}</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
            {showArrows && slides.length > 1 && (
                <>
                    <button className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white" aria-label="Précédent">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow hover:bg-white" aria-label="Suivant">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </>
            )}
            {showDots && slides.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                    {slides.map((_, i) => (
                        <span key={i} className="h-2 w-2 rounded-full bg-white/60" />
                    ))}
                </div>
            )}
        </div>
        </SectionWrapper>
    ),
};
