/**
 * ==================================
 * eLISAschool - Tests Utilitaires de Pagination
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    validatePaginationParams,
    calculatePaginationMeta,
    createPaginatedResult,
} from '../src/common/utils/pagination.util';

describe('validatePaginationParams', () => {
    it('devrait utiliser les valeurs par défaut si non fournies', () => {
        const result = validatePaginationParams(undefined, undefined);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.skip).toBe(0);
    });

    it('devrait convertir les strings en nombres', () => {
        const result = validatePaginationParams('5', '50');
        expect(result.page).toBe(5);
        expect(result.limit).toBe(50);
        expect(result.skip).toBe(200);
    });

    it('devrait forcer page minimum à 1', () => {
        const result = validatePaginationParams(-5, 20);
        expect(result.page).toBe(1);
    });

    it('devrait forcer limit minimum à 1', () => {
        const result = validatePaginationParams(1, -10);
        expect(result.limit).toBe(1);
    });

    it('devrait limiter limit au maximum (100)', () => {
        const result = validatePaginationParams(1, 500);
        expect(result.limit).toBe(100);
    });

    it('devrait gérer les valeurs invalides', () => {
        const result = validatePaginationParams('abc', 'xyz');
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
    });
});

describe('calculatePaginationMeta', () => {
    it('devrait calculer correctement les métadonnées', () => {
        const meta = calculatePaginationMeta(100, 1, 20, 20);
        expect(meta.totalItems).toBe(100);
        expect(meta.totalPages).toBe(5);
        expect(meta.currentPage).toBe(1);
        expect(meta.itemsPerPage).toBe(20);
        expect(meta.itemCount).toBe(20);
        expect(meta.hasNextPage).toBe(true);
        expect(meta.hasPreviousPage).toBe(false);
    });

    it('devrait gérer la dernière page', () => {
        const meta = calculatePaginationMeta(100, 5, 20, 20);
        expect(meta.hasNextPage).toBe(false);
        expect(meta.hasPreviousPage).toBe(true);
    });

    it('devrait gérer une liste vide', () => {
        const meta = calculatePaginationMeta(0, 1, 20, 0);
        expect(meta.totalPages).toBe(0);
        expect(meta.hasNextPage).toBe(false);
        expect(meta.hasPreviousPage).toBe(false);
    });
});

describe('createPaginatedResult', () => {
    it('devrait créer un résultat paginé complet', () => {
        const items = [{ id: 1 }, { id: 2 }];
        const result = createPaginatedResult(items, 100, 1, 20);

        expect(result.items).toHaveLength(2);
        expect(result.meta.totalItems).toBe(100);
        expect(result.meta.currentPage).toBe(1);
        expect(result.meta.hasNextPage).toBe(true);
    });
});
