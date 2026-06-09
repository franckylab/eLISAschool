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
 * Schéma de validation pour les filtres d'audit
 */
export const auditFiltersSchema = z.object({
    utilisateurId: z.string().uuid().optional(),
    action: z.nativeEnum(AuditAction).optional(),
    module: z.string().max(100).optional(),
    cible: z.string().max(100).optional(),
    cibleId: z.string().uuid().optional(),
    severity: z.nativeEnum(AuditSeverity).optional(),
    estEchec: z.boolean().optional(),
    dateDebut: z.string().datetime().optional(),
    dateFin: z.string().datetime().optional(),
    search: z.string().max(255).optional(),
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
});

export type AuditExportDto = z.infer<typeof auditExportSchema>;
