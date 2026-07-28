import React from 'react';

export type MarkerId = 'arrowHierarchie' | 'arrowDirect' | 'arrowFonctionnel';

const MARKER_IDS = {
    hierarchie: 'arrowHierarchie' as MarkerId,
    direct: 'arrowDirect' as MarkerId,
    fonctionnel: 'arrowFonctionnel' as MarkerId,
};

export function getMarkerId(type: 'hierarchie' | 'direct' | 'fonctionnel'): string {
    return MARKER_IDS[type];
}

export function getMarkerUrl(type: 'hierarchie' | 'direct' | 'fonctionnel'): string {
    return `url(#${getMarkerId(type)})`;
}

const MARKER_SIZE = 10;

export function MarkerDefs() {
    const base: React.CSSProperties = { position: 'absolute', width: 0, height: 0, overflow: 'hidden' };

    return (
        <svg style={base} aria-hidden="true">
            <defs>
                <marker
                    id={getMarkerId('hierarchie')}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth={MARKER_SIZE}
                    markerHeight={MARKER_SIZE}
                    markerUnits="userSpaceOnUse"
                    orient="auto"
                >
                    <path d="M 0 1 L 8 5 L 0 9 Z" fill="currentColor" />
                </marker>
                <marker
                    id={getMarkerId('direct')}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth={MARKER_SIZE}
                    markerHeight={MARKER_SIZE}
                    markerUnits="userSpaceOnUse"
                    orient="auto"
                >
                    <path d="M 0 1 L 8 5 L 0 9 Z" fill="currentColor" />
                </marker>
                <marker
                    id={getMarkerId('fonctionnel')}
                    viewBox="0 0 10 10"
                    refX="8"
                    refY="5"
                    markerWidth={MARKER_SIZE}
                    markerHeight={MARKER_SIZE}
                    markerUnits="userSpaceOnUse"
                    orient="auto"
                >
                    <path d="M 0 1 L 8 5 L 0 9 Z" fill="currentColor" />
                </marker>
            </defs>
        </svg>
    );
}
