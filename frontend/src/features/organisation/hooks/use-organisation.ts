/**
 * use-organisation.ts — Barrell re-exports
 *
 * Les hooks ont été éclatés en fichiers unitaires :
 * - use-unites.ts      → Unités organisationnelles
 * - use-hierarchies.ts  → Hiérarchie, organigramme, statistiques, validation
 * - use-niveaux-organisation.ts
 * - use-usages-unite.ts
 * - use-categories-poste.ts
 * - use-niveaux-responsabilite.ts
 * - use-templates.ts
 * - use-postes.ts
 */

// Unités
export {
    useUnites, useUnite, useCreerUnite, useModifierUnite, useSupprimerUnite, useArborescence,
} from './use-unites';

// Hiérarchie + Organigramme + Stats + Validation
export {
    useHierarchies, useSuperieurs, useSubordonnes,
    useCreerHierarchie, useModifierHierarchie, useSupprimerHierarchie,
    useOrganigramme, useStatistiquesOrganisation, useValiderArborescence,
} from './use-hierarchies';

// Postes
export { useModifierPoste } from './use-postes';
