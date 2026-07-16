/**
 * ==================================
 * eLISAschool - DTOs pour la création de rôle
 * ==================================
 */

import { z } from 'zod';

/**
 * Schéma de création de rôle
 */
export const createRoleSchema = z.object({
    code: z.string()
        .min(2, 'Le code doit avoir au moins 2 caractères')
        .max(50, 'Le code ne peut pas dépasser 50 caractères')
        .regex(/^[A-Z_]+$/, 'Le code doit être en majuscules avec underscores uniquement'),
    libelle: z.string()
        .min(2, 'Le libellé doit avoir au moins 2 caractères')
        .max(100, 'Le libellé ne peut pas dépasser 100 caractères'),
    description: z.string().optional(),
    parentId: z.string().uuid('ID du rôle parent invalide').optional().nullable(),
    permissionIds: z.array(z.string().uuid()).optional().default([]),
    etablissementId: z.string().uuid().optional().nullable(),
});

/**
 * Schéma d'assignation de permissions à un rôle
 */
export const assignPermissionsToRoleSchema = z.object({
    permissionIds: z.array(z.string().uuid()),
});

/**
 * Schéma d'assignation d'un rôle à un utilisateur
 */
export const assignRoleToUserSchema = z.object({
    roleId: z.string().uuid('ID du rôle invalide'),
    estPrincipal: z.boolean().optional().default(false),
    motif: z.string().optional(),
});

/**
 * Schéma d'assignation d'une permission à un utilisateur
 */
export const assignPermissionToUserSchema = z.object({
    permissionId: z.string().uuid('ID de la permission invalide'),
    type: z.enum(['GRANTED', 'DENIED'], {
        errorMap: () => ({ message: 'Le type doit être GRANTED ou DENIED' }),
    }),
    motif: z.string().optional(),
});

/**
 * Schéma de batch permissions pour un utilisateur
 * Chaque entrée peut être GRANTED, DENIED, ou null pour retrait
 */
export const batchPermissionsSchema = z.object({
    permissions: z.array(z.object({
        permissionId: z.string().uuid('ID de la permission invalide'),
        type: z.enum(['GRANTED', 'DENIED']).nullable(),
    })).min(1, 'Au moins une permission est requise'),
});

/**
 * Schéma de batch permissions pour un rôle
 * addedPermissionIds : permissions à ajouter
 * removedPermissionIds : permissions à retirer
 */
export const batchRolePermissionsSchema = z.object({
    addedPermissionIds: z.array(z.string().uuid()),
    removedPermissionIds: z.array(z.string().uuid()),
});

// Types inférés
export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type AssignPermissionsToRoleDto = z.infer<typeof assignPermissionsToRoleSchema>;
export type AssignRoleToUserDto = z.infer<typeof assignRoleToUserSchema>;
export type AssignPermissionToUserDto = z.infer<typeof assignPermissionToUserSchema>;
export type BatchPermissionsDto = z.infer<typeof batchPermissionsSchema>;
export type BatchRolePermissionsDto = z.infer<typeof batchRolePermissionsSchema>;

export default {
    createRoleSchema,
    assignPermissionsToRoleSchema,
    assignRoleToUserSchema,
    assignPermissionToUserSchema,
    batchPermissionsSchema,
    batchRolePermissionsSchema,
};
