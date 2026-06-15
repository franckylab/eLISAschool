/**
 * ==================================
 * eLISAschool - API Client Alias
 * ==================================
 * Fichier alias pour compatibilité avec les imports "@/lib/api"
 */

export { apiClient } from './api-client';
export { secureLogout, handleLogout, isLogoutInProgress } from './secure-logout';
export type { ApiResponse, PaginatedResult, PaginationOptions } from '@shared/types/api.types';
