/**
 * ==================================
 * eLISAschool - Types d'API
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

/**
 * Réponse API standardisée
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    timestamp: string;
}

/**
 * Résultat paginé
 */
export interface PaginatedResult<T> {
    items: T[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

/**
 * Options de pagination
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * Erreur API
 */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
}

/**
 * Réponse d'erreur API
 */
export interface ApiErrorResponse {
    success: false;
    error: ApiError;
    timestamp: string;
    path: string;
}

export default {
    // Types exportés pour compatibilité
};
