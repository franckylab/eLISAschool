// Barrel exports - Lib utilities
export { cn } from './cn';
export { apiClient } from './api-client';
export { secureLogout, handleLogout, isLogoutInProgress } from './secure-logout';
export { queryClient } from './query-client';
export {
    formatDate,
    formatDateTime,
    formatRelative,
    formatDateInput,
    isDatePast,
    getDateRange,
} from './date-utils';
export {
    formatMontant,
    nombreFormate,
    formatPourcentage,
    formatFileSize,
    tronquer,
    formatTelephone,
    getInitiales,
} from './format-utils';
export {
    hexToHsl,
    hslToHex,
    genererSecondaire,
    genererAccent,
    getContrastColor,
    appliquerThemeCSS,
    COULEURS_DOMINANTES,
} from './theme-utils';
export {
    paletteCreneau,
    hexToRgb,
    luminanceRelative,
    ratioContraste,
    melangeCouleur,
    estCouleurClaire,
    useModeTheme,
    type PaletteCreneau,
} from './palette-creneau';
