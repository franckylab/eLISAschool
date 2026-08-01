import { FondAnime } from './fond-anime';

/**
 * Fond principal du layout authentifié.
 * Rendu actif : fond animé Text Wave (voir fond-anime.tsx — réglages via constantes exportées).
 * Le système SVG statique (fond-principal-*.svg) est conservé mais désactivé.
 */
export function FondPrincipalBackground() {
    return <FondAnime />;
}
