/**
 * ==================================
 * eLISAschool - Helpers de Réponses API Standardisées
 * ==================================
 * Version: 1.0.0
 * 
 * Fournit des fonctions utilitaires pour construire des réponses API
 * cohérentes sur l'ensemble de l'application.
 * 
 * Format standard :
 * {
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   meta?: { page, limit, total, totalPages }
 * }
 */

import { Response } from 'express';

/**
 * Interface pour les métadonnées de pagination
 */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/**
 * Interface pour une réponse paginée
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
 * Envoie une réponse paginée standardisée
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
 * Parse les paramètres de pagination depuis la query string
 * Valeurs par défaut : page=1, limit=20
 */
export function parsePagination(query: Record<string, any>): { page: number; limit: number; skip: number } {
    const page = Math.max(1, parseInt(query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

export default {
    sendSuccess,
    sendMessage,
    sendCreated,
    sendPaginated,
    parsePagination,
};
