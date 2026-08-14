/**
 * ==================================
 * eLISAschool - Puck Component: Galerie Masonry
 * ==================================
 * Galerie en disposition masonry (Pinterest-style).
 */
import type { ComponentConfig } from '@puckeditor/core';

type ImageItem = { url: string; alt?: string; span?: 'small' | 'medium' | 'large' };

type GalerieMasonryProps = {
    images: ImageItem[];
    columns: number;
    gap: string;
    borderRadius: string;
};

export const GalerieMasonryPuck: ComponentConfig<GalerieMasonryProps> = {
    fields: {
        images: {
            type: 'array',
            arrayFields: {
                url: { type: 'text', label: 'URL Image' },
                alt: { type: 'text', label: 'Texte alternatif' },
                span: { type: 'select', label: 'Taille', options: [
                    { label: 'Petite', value: 'small' },
                    { label: 'Moyenne', value: 'medium' },
                    { label: 'Grande', value: 'large' },
                ]},
            },
            defaultItemProps: { url: '', alt: '', span: 'small' },
            label: 'Images',
        },
        columns: { type: 'select', label: 'Colonnes', options: [
            { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 },
        ]},
        gap: { type: 'select', label: 'Espacement', options: [
            { label: 'Petit (4px)', value: '4px' },
            { label: 'Moyen (8px)', value: '8px' },
            { label: 'Grand (16px)', value: '16px' },
        ]},
        borderRadius: { type: 'select', label: 'Bordure', options: [
            { label: 'Aucune', value: '0' },
            { label: 'Petite', value: '8px' },
            { label: 'Moyenne', value: '12px' },
            { label: 'Grande', value: '20px' },
        ]},
    },
    defaultProps: {
        images: [
            { url: '', alt: 'Photo 1', span: 'medium' },
            { url: '', alt: 'Photo 2', span: 'small' },
            { url: '', alt: 'Photo 3', span: 'large' },
            { url: '', alt: 'Photo 4', span: 'small' },
            { url: '', alt: 'Photo 5', span: 'medium' },
            { url: '', alt: 'Photo 6', span: 'small' },
        ],
        columns: 3,
        gap: '8px',
        borderRadius: '12px',
    },
    render: ({ images, columns, gap, borderRadius }) => {
        const heightMap = { small: '200px', medium: '280px', large: '360px' };
        return (
            <div className="w-full" style={{ columnCount: columns, columnGap: gap }}>
                {images.map((img, i) => (
                    <div
                        key={i}
                        className="mb-2 overflow-hidden bg-gray-100"
                        style={{
                            height: heightMap[img.span || 'small'],
                            borderRadius,
                            breakInside: 'avoid',
                        }}
                    >
                        {img.url ? (
                            <img src={img.url} alt={img.alt || ''} className="h-full w-full object-cover transition-transform hover:scale-105" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-300">
                                <span className="text-4xl">🖼</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    },
};
