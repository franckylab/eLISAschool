/**
 * ==================================
 * eLISAschool - Module Salles
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export { SallesPage } from './pages/SallesPage';
export { SallesStatistiquesPage } from './pages/SallesStatistiquesPage';
export { SalleFormModal } from './components/SalleFormModal';
export { SalleSelect } from './components/SalleSelect';
export { useSalles, useSalle, useSallesDisponibles, useStatistiquesSalles, useCreerSalle, useModifierSalle, useSupprimerSalle } from './hooks/use-salles';
export type { Salle, TypeSalle, StatutSalle, CreerSalleDto, ModifierSalleDto, FiltresSalles, StatistiquesSalles } from './types/salle.types';
