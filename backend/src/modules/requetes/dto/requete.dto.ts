import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';

export const createRequeteSchema = z.object({
    type: z.enum(['CONGE', 'CERTIFICAT', 'ATTESTATION', 'MATERIEL', 'AUTRE']),
    sujet: z.string().min(1).max(255),
    description: z.string().min(1),
    piecesJointes: z.array(z.object({ nom: z.string(), url: z.string() })).optional(),
});

export const traiterRequeteSchema = z.object({
    decision: z.enum(['APPROUVE', 'REJETE']),
    commentaire: z.string().optional(),
});

export const queryRequetesSchema = paginationSchema.extend({
    type: z.string().optional(),
    statut: z.string().optional(),
});

export type CreateRequeteDto = z.infer<typeof createRequeteSchema>;
export type TraiterRequeteDto = z.infer<typeof traiterRequeteSchema>;
export type QueryRequetesDto = z.infer<typeof queryRequetesSchema>;
