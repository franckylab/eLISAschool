import { z } from 'zod';

export const createPosteSchema = z.object({
    intitulé: z.string().min(2).max(100),
    description: z.string().optional(),
    code: z.string().min(2).max(50),
    typePersonnelId: z.string().uuid().optional(),
    niveauResponsabilite: z.enum([
        'DIRECTION_GENERALE', 'DIRECTION_ADJOINTE', 'RESPONSABLE',
        'COORDINATEUR', 'SUPERVISEUR', 'EXECUTANT', 'STAGIAIRE',
    ]).default('EXECUTANT'),
    fonctionId: z.string().uuid().optional(),
    uniteOrganisationnelleId: z.string().uuid(),
    occupantId: z.string().uuid().optional(),
    occupantNom: z.string().max(200).optional(),
    nombrePostes: z.number().int().min(1).default(1),
    modeRemunerationDefaut: z.string().max(30).optional(),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({
    code: true,
});

export const queryPostesSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    typePersonnelId: z.string().uuid().optional(),
    statut: z.enum(['ACTIF', 'VACANT', 'SUPPRIME', 'EN_ATTENTE']).optional(),
    fonctionId: z.string().uuid().optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    vacant: z.coerce.boolean().optional(),
    sortBy: z.string().default('createdAt'),
    sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
});

export type CreatePosteDto = z.infer<typeof createPosteSchema>;
export type UpdatePosteDto = z.infer<typeof updatePosteSchema>;
export type QueryPostesDto = z.infer<typeof queryPostesSchema>;
