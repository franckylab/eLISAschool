/**
 * GalerieSection — Lazy-loaded
 * Grille d'images avec lightbox.
 */
import { useState, useEffect, useCallback } from 'react';

export function GalerieSection({ contenu }: { contenu: Record<string, any> }) {
    const images: any[] = contenu.images || [];
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const navigate = useCallback((dir: number) => {
        setLightboxIndex(prev => prev !== null ? (prev + dir + images.length) % images.length : null);
    }, [images.length]);

    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxIndex(null);
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex, navigate]);

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {images.map((img: any, i: number) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl"
                    >
                        <img
                            src={img.url}
                            alt={img.alt || `Image ${i + 1}`}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                        />
                        {img.legend && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                                <p className="text-sm text-white">{img.legend}</p>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {lightboxIndex !== null && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                    onClick={() => setLightboxIndex(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxIndex(null)}
                        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                    >
                        ✕
                    </button>
                    {images.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                            >
                                ‹
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); navigate(1); }}
                                className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                            >
                                ›
                            </button>
                        </>
                    )}
                    <img
                        src={images[lightboxIndex]?.url}
                        alt={images[lightboxIndex]?.alt || ''}
                        className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

export default GalerieSection;
