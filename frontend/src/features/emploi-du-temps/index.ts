/**
 * ==================================
 * eLISAschool - Barrel Export Emploi du Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 */

// Types
export * from './types/edt.types';

// Pages
export { EmploiDuTempsListe } from './components/edt-liste';
export { EDTPreferencesPage } from './components/edt-preferences';
export { EDTTemplatesPage } from './components/edt-templates';
export { EDTStandalonePage } from './components/edt-page';

// Composants
export { EDTCalendar } from './components/edt-calendar';
export { EDTGenerationModal } from './components/edt-generation-modal';
export { EDTCreneauModal } from './components/edt-creneau-modal';
export { EDTHeureCoursModal } from './components/edt-heure-cours-modal';

// Hooks
export * from './hooks/use-emploi-du-temps';
