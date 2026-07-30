/**
 * ==================================
 * eLISAschool - DTO Filtres Audit
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Validation des paramètres de filtrage des logs d'audit
 */

import { z } from 'zod';
import { AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';

/**
 * Coercition booléenne stricte depuis query string ('true'/'false')
 */
const booleanQuery = z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return val;
}, z.boolean().optional());

/**
 * Action(s) : accepte une action unique, un tableau, ou une liste CSV en query string
 */
const actionsQuery = z.preprocess((val) => {
    if (typeof val === 'string' && val.includes(',')) {
        return val.split(',').map((v) => v.trim()).filter(Boolean);
    }
    return val;
}, z.union([z.nativeEnum(AuditAction), z.array(z.nativeEnum(AuditAction)).max(50)]).optional());

/**
 * Schéma de validation pour les filtres d'audit
 */
export const auditFiltersSchema = z.object({
    utilisateurId: z.string().uuid().optional(),
    utilisateurSearch: z.string().max(255).optional(),
    action: actionsQuery,
    module: z.string().max(100).optional(),
    cible: z.string().max(100).optional(),
    cibleId: z.string().uuid().optional(),
    severity: z.nativeEnum(AuditSeverity).optional(),
    estEchec: booleanQuery,
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    search: z.string().max(255).optional(),
    scope: z.enum(['entite', 'avec-liees']).optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
});

export type AuditFiltersDto = z.infer<typeof auditFiltersSchema>;

/**
 * Schéma pour l'export
 */
export const auditExportSchema = z.object({
    format: z.enum(['csv', 'json']).default('csv'),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    module: z.string().max(100).optional(),
    severity: z.nativeEnum(AuditSeverity).optional(),
    utilisateurId: z.string().uuid().optional(),
    action: actionsQuery,
    estEchec: booleanQuery,
    search: z.string().max(255).optional(),
});

export type AuditExportDto = z.infer<typeof auditExportSchema>;
