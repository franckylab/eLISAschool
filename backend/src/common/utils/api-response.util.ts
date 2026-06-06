/**
 * ==================================
 * eLISAschool - Helpers de Réponses API Standardisées
 * ==================================
 * Version: 2.0.0
 * 
 * Fournit des fonctions utilitaires pour construire des réponses API
 * cohérentes sur l'ensemble de l'application.
 * 
 * Format standard :
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   meta?: {
 *     currentPage, itemsPerPage, totalItems, totalPages,
 *     itemCount, hasNextPage, hasPreviousPage
 *   }
 * }
 */

import { Response } from 'express';
import { PaginationMeta, PaginatedResult } from './pagination.util';

/**
 * Interface pour les métadonnées de pagination (compatibilité descendante)
 * @deprecated Utiliser PaginationMeta de pagination.util.ts
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Interface pour une réponse paginée (compatibilité descendante)
 * @deprecated Utiliser PaginatedResult de pagination.util.ts
 */
export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    meta: PaginationMeta;
}

/**
 * Interface pour une réponse simple
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

/**
 * Envoie une réponse de succès avec des données
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({
        success: true,
        data,
    });
}

/**
 * Envoie une réponse de succès avec un message
 */
export function sendMessage(res: Response, message: string, statusCode: number = 200): void {
    res.status(statusCode).json({
        success: true,
        message,
    });
}

/**
 * Envoie une réponse de succès avec données + message
 */
export function sendCreated<T>(res: Response, data: T, message?: string): void {
    res.status(201).json({
        success: true,
        data,
        ...(message && { message }),
    });
}

/**
 * Envoie une réponse de succès standardisée (alias pour sendSuccess avec message)
 */
export function successResponse<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    res.status(statusCode).json({
        success: true,
        data,
        ...(message && { message }),
    });
}

/**
 * Envoie une réponse paginée standardisée (ancienne version)
 * @deprecated Utiliser sendPaginatedV2
 */
export function sendPaginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number
): void {
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
        success: true,
        data: items,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    });
}

/**
 * Envoie une réponse paginée standardisée v2 (recommandée)
 * Utilise le nouveau système de métadonnées complet
 * 
 * @param res - Response Express
 * @param result - Résultat paginé ( PaginatedResult<T> )
 * @param statusCode - Code HTTP (défaut: 200)
 */
export function sendPaginatedV2<T>(
    res: Response,
    result: PaginatedResult<T>,
    statusCode: number = 200
): void {
    res.status(statusCode).json({
        success: true,
        data: result.items,
        meta: result.meta,
    });
}

/**
 * Envoie une réponse paginée avec en-tête Link HTTP
 * Pour la navigation RFC 5988
 * 
 * @param res - Response Express
 * @param result - Résultat paginé
 * @param baseUrl - URL de base pour les liens
 * @param query - Paramètres de requête
 */
export function sendPaginatedWithLinks<T>(
    res: Response,
    result: PaginatedResult<T>,
    baseUrl: string,
    query: Record<string, any>
): void {
    // Import dynamique pour éviter les dépendances circulaires
    import('./pagination.util').then(({ generateLinkHeader }) => {
        const linkHeader = generateLinkHeader(baseUrl, query, result.meta);
        res.setHeader('Link', linkHeader);
    });

    res.status(200).json({
        success: true,
        data: result.items,
        meta: result.meta,
    });
}

/**
 * Parse les paramètres de pagination depuis la query string (ancienne version)
 * @deprecated Utiliser validatePaginationParams de pagination.util.ts
 * Valeurs par défaut : page=1, limit=20
 */
export function parsePagination(query: Record<string, any>): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * Parse et valide les paramètres de pagination (nouvelle version)
 * Utilise la fonction centralisée de pagination.util.ts
 */
export function parsePaginationV2(query: Record<string, any>): { page: number; limit: number; skip: number } {
    const { validatePaginationParams } = require('./pagination.util');
    return validatePaginationParams(query.page, query.limit);
}

export default {
    sendSuccess,
    sendMessage,
    sendCreated,
    successResponse,
    sendPaginated,
    sendPaginatedV2,
    sendPaginatedWithLinks,
    parsePagination,
    parsePaginationV2,
};
