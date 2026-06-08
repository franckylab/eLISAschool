import { z } from 'zod';

export const createCarteSchema = z.object({
    utilisateurId: z.string().uuid(),
    type: z.enum(['SCOLAIRE', 'ACCES', 'CANTINE', 'TRANSPORT', 'BIBLIOTHEQUE']),
    dateExpiration: z.string().optional(),
    photoUrl: z.string().max(500).optional(),
    modeleCarteId: z.string().uuid().optional(),
    categorieTitulaire: z.enum(['ELEVE', 'PERSONNEL', 'ENSEIGNANT', 'RESPONSABLE']).optional(),
});

export const updateCarteSchema = z.object({
    statut: z.enum(['ACTIVE', 'INACTIVE', 'PERDUE', 'EXPIREE']).optional(),
    dateExpiration: z.string().optional(),
    modeleCarteId: z.string().uuid().optional(),
});

export type CreateCarteDto = z.infer<typeof createCarteSchema>;
export type UpdateCarteDto = z.infer<typeof updateCarteSchema>;
