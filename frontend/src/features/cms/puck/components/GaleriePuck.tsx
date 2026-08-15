import type { ComponentConfig } from '@puckeditor/core';
import { SectionWrapper } from '../section-wrapper';

export type GalerieProps = {
    images: { _id: string; url: string; alt: string; legend: string }[];
    styleConfig?: any;
};

export const GaleriePuck: ComponentConfig<GalerieProps> = {
    fields: {
        images: {
            type: 'array',
            arrayFields: {
                url: { type: 'text' },
                alt: { type: 'text' },
                legend: { type: 'text' },
            },
        },
    },
    defaultProps: { images: [] },
    render({ images, styleConfig }) {
        return (
            <SectionWrapper styleConfig={styleConfig}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {images.length === 0 && (
                        <p className="col-span-full text-center text-sm opacity-50">Ajoutez des images à la galerie</p>
                    )}
                    {images.map((img, i) => (
                        <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                            {img.url ? (
                                <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs text-gray-400">Image {i + 1}</div>
                            )}
                            {img.legend && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                    <p className="text-sm text-white">{img.legend}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </SectionWrapper>
        );
    },
};
