/**
 * ==================================
 * eLISAschool - Module Organisation — Barrel
 * ==================================
 * Point d'entrée unique : types, hooks, composants.
 */

// Types
export * from './types/organisation.types';

// Hooks (via barrel unitaire)
export * from './hooks';

// Composants
export { UnitesPage } from './components/unites-page';
export { UniteDetailPage } from './components/unite-detail-page';
export { ModelesPage } from './components/modeles-page';
export { GenerationWizard } from './components/generation-wizard';
export { OrgViewToggle } from './components/org-view-toggle';
export { NomenclaturesPage } from './components/nomenclatures-page';
export { NomenclatureCrudPage } from './components/nomenclature-crud-page';
export { EchelonsStructurelsPage } from './components/echelons-structurels-page';
export { NiveauxResponsabilitePage } from './components/niveaux-responsabilite-page';
export { ModesRemunerationPage } from './components/modes-remuneration-page';
