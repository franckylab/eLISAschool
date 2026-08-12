/**
 * ==================================
 * eLISAschool - Platform Configuration Module
 * ==================================
 * Barrel export pour les composants et hooks de configuration plateforme.
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

// Composants
export { ParameterField, humanizeCle } from './components/ParameterField';
export { ParameterGroup } from './components/ParameterGroup';
export { SaveBar } from './components/SaveBar';
export { ParameterSearchBar } from './components/ParameterSearchBar';
export { ParameterDiffView } from './components/ParameterDiffView';
export { BulkActionsBar } from './components/BulkActionsBar';
export { MFAConfirmModal } from './components/MFAConfirmModal';
export { ExportConfigButton } from './components/ExportConfigButton';

// Hooks
export { useParametresPlatforme, parseValeur, serializeValeur } from './hooks/useParametresPlatforme';

// Config
export { CRITICAL_PARAM_KEYS, isParametreCritique, hasCriticalChanges } from './config-critical-keys';
