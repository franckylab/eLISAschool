import { z } from 'zod';

export const createBadgeSchema = z.object({
    code: z.string().min(1).max(100),
    nom: z.string().min(1).max(255),
    description: z.string().optional(),
    icone: z.string().max(500).optional(),
    pointsRequis: z.number().min(0).default(0),
    categorie: z.string().max(50).optional(),
});

export const attribuerPointsSchema = z.object({
    utilisateurId: z.string().uuid(),
    points: z.number(),
    action: z.string().max(50),
    description: z.string().optional(),
});

export const attribuerBadgeSchema = z.object({
    utilisateurId: z.string().uuid(),
    badgeId: z.string().uuid(),
});

export type CreateBadgeDto = z.infer<typeof createBadgeSchema>;
export type AttribuerPointsDto = z.infer<typeof attribuerPointsSchema>;
export type AttribuerBadgeDto = z.infer<typeof attribuerBadgeSchema>;
