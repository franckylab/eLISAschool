import { z } from 'zod';

export const createMaterielSchema = z.object({
    nom: z.string().min(1).max(255),
    reference: z.string().max(100).optional(),
    numeroSerie: z.string().max(100).optional(),
    categorie: z.enum(['LIVRE', 'BUREAU', 'ORDINATEUR', 'SPORTIF', 'AUDIOVISUEL', 'AUTRE']),
    etat: z.enum(['NEUF', 'BON', 'USAGE', 'ABIME', 'HS']).default('BON'),
    quantite: z.number().int().min(1).default(1),
    localisation: z.string().max(100).optional(),
    valeur: z.number().optional(),
    dateAcquisition: z.string().optional(),
    notes: z.string().optional(),
});

export const pretMaterielSchema = z.object({
    materielId: z.string().uuid(),
    emprunteurId: z.string().uuid(),
    quantite: z.number().int().min(1).default(1),
    dateRetourPrevue: z.string().optional(),
    notes: z.string().optional(),
});

export const retourMaterielSchema = z.object({
    notes: z.string().optional(),
});

export type CreateMaterielDto = z.infer<typeof createMaterielSchema>;
export type PretMaterielDto = z.infer<typeof pretMaterielSchema>;
export type RetourMaterielDto = z.infer<typeof retourMaterielSchema>;
