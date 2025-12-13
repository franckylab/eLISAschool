/**
 * ==================================
 * eLISAschool - DTOs Personnel
 * ==================================
 */

import { z } from 'zod';

export const createTypePersonnelSchema = z.object({
    code: z.string().min(2).max(50),
    nom: z.string().min(2).max(100),
    permissionsDefaut: z.array(z.string()).optional(),
});

export const createPersonnelSchema = z.object({
    utilisateurId: z.string().uuid(),
    typePersonnelId: z.string().uuid().optional(),
    matricule: z.string().min(2).max(50),
    dateEmbauche: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    statut: z.enum(['ACTIF', 'INACTIF', 'CONGE']).default('ACTIF'),
    specialites: z.array(z.string()).optional(),
    diplomes: z.string().optional(),
});

export const updatePersonnelSchema = createPersonnelSchema.partial().omit({ utilisateurId: true });

export type CreateTypePersonnelDto = z.infer<typeof createTypePersonnelSchema>;
export type CreatePersonnelDto = z.infer<typeof createPersonnelSchema>;
export type UpdatePersonnelDto = z.infer<typeof updatePersonnelSchema>;
