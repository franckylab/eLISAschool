import { z } from 'zod';

export const createClubSchema = z.object({
    nom: z.string().min(1).max(100),
    description: z.string().optional(),
    responsableId: z.string().uuid().optional(),
    budget: z.number().min(0).default(0),
    horaires: z.string().max(50).optional(),
    lieu: z.string().max(100).optional(),
    capaciteMax: z.number().int().optional(),
});

export const inscrireClubSchema = z.object({
    clubId: z.string().uuid(),
    eleveId: z.string().uuid(),
});

export const createEvenementSchema = z.object({
    titre: z.string().min(1).max(255),
    description: z.string().optional(),
    dateDebut: z.string(),
    dateFin: z.string().optional(),
    lieu: z.string().max(100).optional(),
});

export type CreateClubDto = z.infer<typeof createClubSchema>;
export type InscrireClubDto = z.infer<typeof inscrireClubSchema>;
export type CreateEvenementDto = z.infer<typeof createEvenementSchema>;
