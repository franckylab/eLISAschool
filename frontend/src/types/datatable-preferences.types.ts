/**
 * ==================================
 * eLISAschool - Types Préférences DataTable
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Types pour la persistance des configurations DataTable
 */

/**
 * Structure complète des préférences DataTable
 */
export interface DataTablePreferences {
    /** Ordre des colonnes */
    columnOrder: string[];
    
    /** Largeurs des colonnes (key: column key, value: width in px) */
    columnWidths: Record<string, number>;
    
    /** Colonnes épinglées */
    pinnedColumns: {
        left: string[];
        right: string[];
    };
    
    /** Colonnes masquées */
    hiddenColumns: string[];
    
    /** Tri actif (multi-colonnes) */
    sortBy: Array<{
        key: string;
        order: 'ASC' | 'DESC';
    }>;
    
    /** Taille de page */
    pageSize: number;
    
    /** Métadonnées */
    lastSaved: string; // ISO timestamp
    version: number;   // Pour migration future
}

/**
 * État partiel pour mise à jour incrémentale
 */
export type DataTablePreferencesPartial = Partial<DataTablePreferences>;

/**
 * Clé de préférence générée à partir du tableId
 */
export function getPreferenceKey(tableId: string): string {
    return `datatable.config.${tableId}`;
}

/**
 * Valeurs par défaut pour une nouvelle configuration
 */
export const DEFAULT_DATATABLE_PREFERENCES: DataTablePreferences = {
    columnOrder: [],
    columnWidths: {},
    pinnedColumns: {
        left: [],
        right: [],
    },
    hiddenColumns: [],
    sortBy: [],
    pageSize: 20,
    lastSaved: new Date().toISOString(),
    version: 1,
};

/**
 * Validation basique pour s'assurer que les données sont cohérentes
 */
export function validatePreferences(data: unknown): DataTablePreferences | null {
    if (!data || typeof data !== 'object') return null;
    
    const obj = data as Record<string, unknown>;
    
    // Vérifier les propriétés requises
    if (!Array.isArray(obj.columnOrder)) return null;
    if (!obj.columnWidths || typeof obj.columnWidths !== 'object') return null;
    if (!obj.pinnedColumns || typeof obj.pinnedColumns !== 'object') return null;
    if (!Array.isArray(obj.hiddenColumns)) return null;
    if (!Array.isArray(obj.sortBy)) return null;
    if (typeof obj.pageSize !== 'number') return null;
    
    return {
        columnOrder: obj.columnOrder as string[],
        columnWidths: obj.columnWidths as Record<string, number>,
        pinnedColumns: obj.pinnedColumns as { left: string[]; right: string[] },
        hiddenColumns: obj.hiddenColumns as string[],
        sortBy: obj.sortBy as Array<{ key: string; order: 'ASC' | 'DESC' }>,
        pageSize: obj.pageSize as number,
        lastSaved: typeof obj.lastSaved === 'string' ? obj.lastSaved : new Date().toISOString(),
        version: typeof obj.version === 'number' ? obj.version : 1,
    };
}
