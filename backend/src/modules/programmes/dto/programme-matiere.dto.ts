import { z } from 'zod';

export const addMatiereProgrammeSchema = z.object({
    matiereNiveauId: z.string().uuid('ID matière-niveau invalide'),
    coefficient: z.number().positive().optional(),
    obligatoire: z.boolean().default(true),
    ordre: z.number().int().min(0).default(0),
});

export const updateMatiereProgrammeSchema = addMatiereProgrammeSchema.partial().omit({ matiereNiveauId: true });

export const bulkAddMatieresProgrammeSchema = z.object({
    matiereNiveauIds: z.array(z.string().uuid()).min(1, 'Au moins une matière requise'),
});

export const bulkReorderMatieresSchema = z.object({
    items: z.array(z.object({
        id: z.string().uuid(),
        ordre: z.number().int().min(0),
    })).min(1),
});

export const queryProgrammeMatieresSchema = z.object({
    programmeId: z.string().uuid().optional(),
    matiereNiveauId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

export type AddMatiereProgrammeDto = z.infer<typeof addMatiereProgrammeSchema>;
export type UpdateMatiereProgrammeDto = z.infer<typeof updateMatiereProgrammeSchema>;
export type BulkAddMatieresProgrammeDto = z.infer<typeof bulkAddMatieresProgrammeSchema>;
export type BulkReorderMatieresDto = z.infer<typeof bulkReorderMatieresSchema>;
export type QueryProgrammeMatieresDto = z.infer<typeof queryProgrammeMatieresSchema>;
