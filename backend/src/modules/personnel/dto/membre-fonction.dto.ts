import { z } from 'zod';

export const createMembreFonctionSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    fonctionId: z.string().uuid(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    estPrincipale: z.boolean().default(false),
    commentaire: z.string().nullable().optional(),
});

export const updateMembreFonctionSchema = z.object({
    fonctionId: z.string().uuid().optional(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    estPrincipale: z.boolean().optional(),
    commentaire: z.string().nullable().optional(),
});

export type CreateMembreFonctionDto = z.infer<typeof createMembreFonctionSchema>;
export type UpdateMembreFonctionDto = z.infer<typeof updateMembreFonctionSchema>;
