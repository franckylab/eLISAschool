import { useState } from 'react';
import { ImageIcon, AlertCircle, Eye } from 'lucide-react';
import type { Fond } from '@/features/apparence/types';

interface FondImageProps {
    fond: Fond;
    className?: string;
    mode?: 'background' | 'img';
    objectFit?: 'cover' | 'contain';
    showPreviewOverlay?: boolean;
    onPreview?: (fond: Fond) => void;
    aspectRatio?: string;
    opacity?: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000';
const BACKEND_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

function getImageUrl(fond: Fond): string {
    if (fond.cheminFichier.startsWith('http')) return fond.cheminFichier;
    const chemin = fond.cheminFichier.startsWith('/')
        ? fond.cheminFichier
        : `/${fond.cheminFichier}`;
    const version = fond.updatedAt ? Date.parse(fond.updatedAt) : Date.now();
    return `${BACKEND_ORIGIN}${chemin}?v=${version}`;
}

export function FondImage({
    fond,
    className = '',
    mode = 'background',
    objectFit = 'cover',
    showPreviewOverlay = false,
    onPreview,
    aspectRatio,
    opacity,
}: FondImageProps) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(false);
    const url = getImageUrl(fond);

    const baseClasses = `relative overflow-hidden rounded-lg ${className}`;
    const filterStyle = { filter: 'var(--fond-filter, none)' };

    if (mode === 'background') {
        return (
            <div
                className={baseClasses}
                style={{
                    backgroundImage: `url('${url}')`,
                    backgroundSize: objectFit === 'cover' ? 'cover' : 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    opacity: opacity ?? 'var(--fond-opacity, 0.3)',
                    ...filterStyle,
                    aspectRatio,
                    willChange: 'opacity, filter',
                }}
                role="img"
                aria-label={fond.nom}
            >
                {showPreviewOverlay && onPreview && (
                    <button
                        onClick={() => onPreview(fond)}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group"
                        aria-label={`Aperçu de ${fond.nom}`}
                    >
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={baseClasses} style={{ aspectRatio }}>
            {!loaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center text-text-secondary animate-pulse">
                    <ImageIcon className="h-8 w-8" />
                </div>
            )}
            {error ? (
                <div className="absolute inset-0 flex items-center justify-center text-text-muted">
                    <AlertCircle className="h-6 w-6" />
                </div>
            ) : null}
            <img
                src={url}
                alt={fond.nom}
                className={`w-full h-full ${loaded ? 'opacity-100' : 'opacity-0'}`}
                style={{
                    objectFit,
                    filter: 'var(--fond-filter, none)',
                    willChange: 'filter',
                }}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
            />
            {showPreviewOverlay && onPreview && (
                <button
                    onClick={() => onPreview(fond)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors group"
                    aria-label={`Aperçu de ${fond.nom}`}
                >
                    <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </button>
            )}
        </div>
    );
}
