import { z } from 'zod';

export const createFonctionSchema = z.object({
    nom: z.string().min(2).max(150),
    code: z.string().min(1).max(50),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    ordre: z.number().int().min(0).default(1),
    primesDefaut: z.record(z.any()).nullable().optional(),
    majorationDefaut: z.number().min(0).max(100).nullable().optional(),
    actif: z.boolean().default(true),
});

export const updateFonctionSchema = createFonctionSchema.partial();

export const queryFonctionsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
    search: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('ordre').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export type CreateFonctionDto = z.infer<typeof createFonctionSchema>;
export type UpdateFonctionDto = z.infer<typeof updateFonctionSchema>;
export type QueryFonctionsDto = z.infer<typeof queryFonctionsSchema>;
