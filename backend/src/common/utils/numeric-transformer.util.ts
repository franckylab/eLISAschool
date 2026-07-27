/**
 * ==================================
 * eLISAschool - Transformer numérique TypeORM
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { ValueTransformer } from 'typeorm';

// Le driver pg retourne les colonnes decimal/numeric en string : ce transformer
// garantit des number côté application (et null préservé).
export class ColumnNumericTransformer implements ValueTransformer {
    to(value?: number | null): number | null | undefined {
        return value;
    }

    from(value?: string | null): number | null {
        if (value === null || value === undefined) {
            return null;
        }
        return parseFloat(value);
    }
}

export const numericTransformer = new ColumnNumericTransformer();
