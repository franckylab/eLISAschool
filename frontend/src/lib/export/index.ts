/**
 * ==================================
 * eLISAschool - Utilitaires d'export partagés
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Barrel pour les utilitaires d'export réutilisables par tout module
 * (organigramme, emploi du temps, bulletins, etc.).
 */

export { resolveCssVar, resolveColor, clearResolverCache, normaliserCouleurHex } from './css-var-resolver';
export { attendreStabilisationDom } from './dom-stabilisation';
export { telecharger, genererNomFichier, tailleDataUrlOctets, formaterTaille } from './telecharger';
export {
    PAGE_FORMATS_MM,
    calculerGrilleTuiles,
    chargerImage,
    decouperTuile,
    type GrilleTuiles,
    type OrientationPage,
} from './tuiles';
