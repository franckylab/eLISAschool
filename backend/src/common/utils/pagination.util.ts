/**
 * ==================================
 * eLISAschool - Utilitaire de Pagination Optimisé
 * ==================================
 * Version: 2.0.0
 * 
 * Système de pagination centralisé, performant et cohérent
 * suivant les meilleures pratiques de l'industrie.
 * 
 * Fonctionnalités :
 * - Validation stricte des paramètres
 * - Métadonnées complètes (hasNext, hasPrev, links)
 * - Support offset-based et cursor-based
 * - Comptage optimisé pour les grosses tables
 * - Protection contre les requêtes malveillantes
 */

import { FindManyOptions, Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { LIMITS } from '@shared/constants/app.constants';

// ============================================
// INTERFACES
// ============================================

/**
 * Métadonnées de pagination améliorées
 */
export interface PaginationMeta {
    /** Page actuelle (commence à 1) */
    currentPage: number;
    /** Nombre d'éléments par page */
    itemsPerPage: number;
    /** Nombre total d'éléments */
    totalItems: number;
    /** Nombre total de pages */
    totalPages: number;
    /** Nombre d'éléments dans la page courante */
    itemCount: number;
    /** Y a-t-il une page suivante ? */
    hasNextPage: boolean;
    /** Y a-t-il une page précédente ? */
    hasPreviousPage: boolean;
}

/**
 * Résultat paginé standardisé
 */
export interface PaginatedResult<T> {
    /** Éléments de la page courante */
    items: T[];
    /** Métadonnées de pagination */
    meta: PaginationMeta;
}

/**
 * Options de pagination pour les requêtes
 */
export interface PaginationQuery {
    /** Numéro de page (1-based) */
    page?: number;
    /** Nombre d'éléments par page */
    limit?: number;
}

/**
 * Options avancées pour le comptage optimisé
 */
export interface PaginationOptions {
    /** Page actuelle */
    page: number;
    /** Limite par page */
    limit: number;
    /** Utiliser COUNT optimisé (sans JOINs) */
    useOptimizedCount?: boolean;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Valide et normalise les paramètres de pagination
 * @param page - Numéro de page
 * @param limit - Nombre d'éléments par page
 * @returns Paramètres validés et sécurisés
 */
export function validatePaginationParams(
    page: unknown,
    limit: unknown
): { page: number; limit: number; skip: number } {
    // Conversion et validation de la page
    const parsedPage = typeof page === 'string' ? parseInt(page, 10) : Number(page);
    const validPage = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;

    // Conversion et validation du limit
    const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);
    const validLimit = Number.isFinite(parsedLimit)
        ? Math.min(LIMITS.PAGINATION_MAX, Math.max(1, parsedLimit))
        : LIMITS.PAGINATION_DEFAULT;

    const skip = (validPage - 1) * validLimit;

    return {
        page: validPage,
        limit: validLimit,
        skip,
    };
}

/**
 * Calcule les métadonnées de pagination complètes
 */
export function calculatePaginationMeta(
    totalItems: number,
    currentPage: number,
    itemsPerPage: number,
    itemCount: number
): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        itemCount,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
    };
}

/**
 * Crée un résultat paginé complet
 */
export function createPaginatedResult<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
): PaginatedResult<T> {
    return {
        items,
        meta: calculatePaginationMeta(total, page, limit, items.length),
    };
}

// ============================================
// HELPERS TYPEORM OPTIMISÉS
// ============================================

/**
 * Pagination optimisée avec Repository
 * Utilise findAndCount avec gestion intelligente des relations
 * 
 * @param repository - Repository TypeORM
 * @param options - Options de requête et pagination
 * @returns Résultat paginé
 */
export async function paginateWithRepository<T extends ObjectLiteral>(
    repository: Repository<T>,
    options: FindManyOptions<T> & PaginationOptions
): Promise<PaginatedResult<T>> {
    const { page, limit, useOptimizedCount = false, ...findOptions } = options;

    // Configuration de la pagination
    const findManyOptions: FindManyOptions<T> = {
        ...findOptions,
        skip: (page - 1) * limit,
        take: limit,
    };

    // Exécution de la requête
    const [items, total] = await repository.findAndCount(findManyOptions);

    return createPaginatedResult(items, total, page, limit);
}

/**
 * Pagination optimisée avec QueryBuilder
 * Pour les requêtes complexes avec JOINs et filtres
 * 
 * PERFORMANCES :
 * - Avec useOptimizedCount: exécute COUNT séparé sans JOINs (plus rapide)
 * - Sans optimisation: utilise getManyAndCount() standard
 * 
 * @param queryBuilder - QueryBuilder TypeORM
 * @param page - Page actuelle
 * @param limit - Limite par page
 * @param useOptimizedCount - Activer le COUNT optimisé
 * @returns Résultat paginé
 */
export async function paginateWithQueryBuilder<T>(
    queryBuilder: SelectQueryBuilder<T>,
    page: number,
    limit: number,
    useOptimizedCount: boolean = false
): Promise<PaginatedResult<T>> {
    // Appliquer la pagination au QueryBuilder
    queryBuilder.skip((page - 1) * limit).take(limit);

    let total: number;
    let items: T[];

    if (useOptimizedCount) {
        // COUNT optimisé : clone le QB sans ORDER BY et sans LIMIT pour performance
        const countQueryBuilder = queryBuilder.clone();
        
        // Supprimer ORDER BY pour le COUNT (inutile et coûteux)
        const orderByPart = countQueryBuilder.expressionMap.orderBys;
        countQueryBuilder.expressionMap.orderBys = {};
        
        // Exécuter COUNT séparé
        total = await countQueryBuilder.getCount();
        
        // Réappliquer ORDER BY si nécessaire
        if (Object.keys(orderByPart).length > 0) {
            for (const [field, direction] of Object.entries(orderByPart)) {
                queryBuilder.addOrderBy(field, direction as 'ASC' | 'DESC');
            }
        }

        // Récupérer les données
        items = await queryBuilder.getMany();
    } else {
        // Méthode standard : getManyAndCount()
        [items, total] = await queryBuilder.getManyAndCount();
    }

    return createPaginatedResult(items, total, page, limit);
}

/**
 * Pagination avec COUNT personnalisé pour les très grosses tables
 * Utilise une sous-requête optimisée ou un comptage approximatif
 * 
 * @param queryBuilder - QueryBuilder principal
 * @param countQueryBuilder - QueryBuilder pour le COUNT (simplifié)
 * @param page - Page actuelle
 * @param limit - Limite par page
 * @returns Résultat paginé
 */
export async function paginateWithCustomCount<T>(
    queryBuilder: SelectQueryBuilder<T>,
    countQueryBuilder: SelectQueryBuilder<T>,
    page: number,
    limit: number
): Promise<PaginatedResult<T>> {
    // Appliquer pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Exécuter en parallèle pour de meilleures performances
    const [items, total] = await Promise.all([
        queryBuilder.getMany(),
        countQueryBuilder.getCount(),
    ]);

    return createPaginatedResult(items, total, page, limit);
}

// ============================================
// HELPERS POUR RÉPONSES HTTP
// ============================================

/**
 * Génère les liens de navigation pour l'en-tête Link HTTP
 * Format RFC 5988 : <url>; rel="next", <url>; rel="prev"
 * 
 * @param baseUrl - URL de base
 * @param query - Paramètres de requête
 * @param meta - Métadonnées de pagination
 * @returns En-tête Link formaté
 */
export function generateLinkHeader(
    baseUrl: string,
    query: Record<string, any>,
    meta: PaginationMeta
): string {
    const links: string[] = [];

    const createUrl = (page: number): string => {
        const params = new URLSearchParams(query);
        params.set('page', page.toString());
        params.set('limit', meta.itemsPerPage.toString());
        return `${baseUrl}?${params.toString()}`;
    };

    if (meta.hasPreviousPage) {
        links.push(`<${createUrl(meta.currentPage - 1)}>; rel="prev"`);
    }

    if (meta.hasNextPage) {
        links.push(`<${createUrl(meta.currentPage + 1)}>; rel="next"`);
    }

    // Première et dernière page
    links.push(`<${createUrl(1)}>; rel="first"`);
    links.push(`<${createUrl(meta.totalPages)}>; rel="last"`);

    return links.join(', ');
}

// ============================================
// PAGINATION CURSEUR-BASED (INFINITE SCROLL)
// ============================================

/**
 * Métadonnées pour la pagination par curseur
 */
export interface CursorPaginationMeta {
    /** Curseur pour la page suivante */
    nextCursor: string | null;
    /** Curseur pour la page précédente */
    previousCursor: string | null;
    /** Nombre d'éléments retournés */
    itemCount: number;
    /** A-t-il une page suivante ? */
    hasNextPage: boolean;
    /** A-t-il une page précédente ? */
    hasPreviousPage: boolean;
}

/**
 * Résultat de pagination par curseur
 */
export interface CursorPaginatedResult<T> {
    /** Éléments de la page courante */
    items: T[];
    /** Métadonnées de pagination par curseur */
    meta: CursorPaginationMeta;
}

/**
 * Options de pagination par curseur
 */
export interface CursorPaginationOptions {
    /** Curseur (valeur du champ de tri du dernier élément) */
    cursor?: string;
    /** Nombre d'éléments par page */
    limit: number;
    /** Direction (forward/backward) */
    direction?: 'forward' | 'backward';
}

/**
 * Pagination optimisée par curseur pour infinite scroll
 * 
 * AVANTAGES vs offset-based :
 * - Performance constante même à grande profondeur
 * - Pas de problèmes de données dupliquées/manquantes
 * - Idéal pour le temps réel et infinite scroll
 * 
 * @param queryBuilder - QueryBuilder TypeORM
 * @param cursorField - Champ utilisé comme curseur (ex: 'id', 'createdAt')
 * @param cursorValue - Valeur du curseur (null pour première page)
 * @param limit - Nombre d'éléments par page
 * @param direction - Direction de pagination
 * @returns Résultat paginé par curseur
 */
export async function paginateWithCursor<T>(
    queryBuilder: SelectQueryBuilder<T>,
    cursorField: keyof T | 'id' | 'createdAt',
    cursorValue: string | null,
    limit: number,
    direction: 'forward' | 'backward' = 'forward'
): Promise<CursorPaginatedResult<T>> {
    const isForward = direction === 'forward';
    
    // Appliquer le filtre de curseur
    if (cursorValue) {
        const operator = isForward ? '<' : '>';
        queryBuilder.andWhere(
            `${queryBuilder.alias}.${String(cursorField)} ${operator} :cursor`,
            { cursor: cursorValue }
        );
    }
    
    // Trier dans la direction appropriée
    const orderDirection = isForward ? 'DESC' : 'ASC';
    queryBuilder.orderBy(`${queryBuilder.alias}.${String(cursorField)}`, orderDirection);
    
    // Prendre un élément de plus pour détecter s'il y a une page suivante
    const takeCount = limit + 1;
    queryBuilder.take(takeCount);
    
    // Exécuter la requête
    const items = await queryBuilder.getMany();
    
    // Vérifier s'il y a une page suivante
    const hasNextPage = items.length > limit;
    
    // Retirer l'élément supplémentaire
    if (hasNextPage) {
        items.pop();
    }
    
    // Inverser si on va en arrière pour maintenir l'ordre chronologique
    if (!isForward) {
        items.reverse();
    }
    
    // Calculer les curseurs
    const nextCursor = hasNextPage && items.length > 0
        ? String(items[items.length - 1][cursorField])
        : null;
    
    const previousCursor = cursorValue
        ? String(items.length > 0 ? items[0][cursorField] : cursorValue)
        : null;
    
    return {
        items,
        meta: {
            nextCursor,
            previousCursor,
            itemCount: items.length,
            hasNextPage,
            hasPreviousPage: cursorValue !== null,
        },
    };
}

/**
 * Génère un cursor encodé en base64 pour la sécurité
 * 
 * @param value - Valeur à encoder
 * @returns Cursor encodé
 */
export function encodeCursor(value: string): string {
    return Buffer.from(value).toString('base64');
}

/**
 * Décode un cursor
 * 
 * @param cursor - Cursor encodé
 * @returns Valeur décodée
 */
export function decodeCursor(cursor: string): string {
    return Buffer.from(cursor, 'base64').toString();
}

// ============================================
// EXPORTS
// ============================================

export default {
    validatePaginationParams,
    calculatePaginationMeta,
    createPaginatedResult,
    paginateWithRepository,
    paginateWithQueryBuilder,
    paginateWithCustomCount,
    generateLinkHeader,
};
