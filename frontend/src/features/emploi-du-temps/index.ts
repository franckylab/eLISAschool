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
export { EDTStandalonePage } from './components/edt-page';
export { EDTPreferencesPage } from './components/edt-preferences';
export { EDTTemplatesPage } from './components/edt-templates';
export { HeuresCoursPage } from './components/heures-cours-page';
export { RemplacementsPage } from './components/remplacements-page';
export { RemplacementStepperModal } from './components/remplacement-stepper-modal';
export { HeuresCoursExportModal } from './components/heures-cours-export-modal';

// Composants
export { EDTCalendar } from './components/edt-calendar';
export { EDTGenerationModal } from './components/edt-generation-modal';
export { EDTCreneauModal } from './components/edt-creneau-modal';
export { EDTMonthView } from './components/edt-month-view';
export { EDTDayView } from './components/edt-day-view';
export { EDTListeView } from './components/edt-liste';
export { EDTDatePickerModal } from './components/edt-datepicker-modal';
export { EDTLegend } from './components/edt-legend';
export { TemplateWizardModal } from './components/template-wizard-modal';

// Hooks
export * from './hooks/use-emploi-du-temps';
export * from './hooks/use-jours-feries';
