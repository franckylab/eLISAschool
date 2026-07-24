/**
 * ==================================
 * eLISAschool - Barrel Hooks Organisation
 * ==================================
 * Point d'entrée unique pour tous les hooks du module organisation.
 */

// Unités
export {
    useUnites, useUnite, useCreerUnite, useModifierUnite, useSupprimerUnite, useArborescence,
    useGetImpactUnite, useCreerUniteAvecPostes, useReordonnerUnite,
} from './use-unites';

// Hiérarchie + Organigramme + Stats + Validation
export {
    useHierarchies, useSuperieurs, useSubordonnes,
    useCreerHierarchie, useModifierHierarchie, useSupprimerHierarchie,
    useOrganigramme, useStatistiquesOrganisation, useValiderArborescence,
} from './use-hierarchies';

// Postes (wrappers avec invalidation cache organigramme)
export { useCreerPoste, useModifierPoste, useSupprimerPoste } from './use-postes';

// Échelons structurels
export {
    useEchelonsStructurels, useCreerEchelonStructurel,
    useModifierEchelonStructurel, useSupprimerEchelonStructurel,
} from './use-echelons-structurels';

// Niveaux de responsabilité
export {
    useNiveauxResponsabilite, useCreerNiveauResponsabilite,
    useModifierNiveauResponsabilite, useSupprimerNiveauResponsabilite,
} from './use-niveaux-responsabilite';

// Modes de rémunération
export {
    useModesRemuneration, useCreerModeRemuneration,
    useModifierModeRemuneration, useSupprimerModeRemuneration,
} from './use-modes-remuneration';

// Templates + Génération
export {
    useTemplatesOrganisation, useCreerTemplateOrganisation,
    useModifierTemplateOrganisation, useSupprimerTemplateOrganisation,
    useGenererOrganisation,
} from './use-templates';

// Utilitaires
export * from './use-handle-error';
