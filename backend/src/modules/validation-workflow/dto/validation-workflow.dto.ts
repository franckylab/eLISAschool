/**
 * ==================================
 * eLISAschool - DTOs Validation Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { z } from 'zod';
import { StatutWorkflow, DecisionValidation } from '../entities';
import { paginationSchema } from '@common/dto/pagination.dto';

/**
 * Création d'un nouveau workflow de validation
 */
export const createWorkflowSchema = z.object({
    module: z.string().min(2).max(50),
    entiteId: z.string().uuid(),
    entiteType: z.string().min(2).max(100),
    niveauxRequis: z.number().int().min(1).max(10).optional().default(2),
    configRoles: z.record(z.string()).optional(),
    commentaire: z.string().max(1000).optional(),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Traitement d'une validation (approbation/rejet à un niveau)
 */
export const traiterValidationSchema = z.object({
    decision: z.nativeEnum(DecisionValidation),
    commentaire: z.string().max(1000).optional(),
});

/**
 * Configuration des rôles pour un module
 */
export const configRolesSchema = z.object({
    module: z.string().min(2).max(50),
    configRoles: z.record(z.string(), z.string()),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Requête pour lister les workflows
 */
export const queryWorkflowsSchema = paginationSchema.extend({
    module: z.string().optional(),
    statut: z.nativeEnum(StatutWorkflow).optional(),
    entiteId: z.string().uuid().optional(),
    entiteType: z.string().optional(),
    niveauActuel: z.number().int().optional(),
});

export type CreateWorkflowDto = z.infer<typeof createWorkflowSchema>;
export type TraiterValidationDto = z.infer<typeof traiterValidationSchema>;
export type ConfigRolesDto = z.infer<typeof configRolesSchema>;
export type QueryWorkflowsDto = z.infer<typeof queryWorkflowsSchema>;
