// Barrel exports - Hooks
export { useLanguage } from './use-language';
export { useConfirm } from './use-confirm';
export { usePaginatedQuery } from './use-pagination';
export { useConfirm as useConfirmDialog } from './use-confirm-dialog';
export { usePermissions } from './use-permissions';
export { 
    useModulePermissions,
    useCanAccess,
    useCanViewWidget,
    useCanViewTab,
    useCanAccessField,
    useCanBulkAction,
    useCanGenerateReport,
} from './use-permissions-advanced';
export {
    useCanViewSensitiveTab,
    useCanEditSensitiveTab,
    useCanExportSensitiveTab,
    useVisibleTabs,
} from './use-sensitive-tabs';
export {
    useCanViewDashboardWidget,
    useVisibleDashboardWidgets,
    useDashboardWidgetCategories,
    useCanPinDashboardWidget,
    useDashboardWidgetConfig,
} from './use-dashboard-widgets';
export { useKeyboardShortcuts } from './use-keyboard-shortcuts';
export { useModalWindow } from './use-modal-window';
export type { ModalWindowState, UseModalWindowOptions, UseModalWindowResult } from './use-modal-window';

// NOUVEAU v3.0 - Sélection d'établissement
export { useEtablissementSelection } from './use-etablissement-selection';

// Gestion de session et expiration
export { useSessionExpired } from './use-session-expired';

// Ultra-responsivité (100px → 2560px)
export { useMediaQuery } from './use-media-query';
export { useBreakpoint } from './use-breakpoint';
export type { BreakpointName, BreakpointResult } from './use-breakpoint';
