import { z } from 'zod';

export const createRequeteSchema = z.object({
    type: z.enum(['CONGE', 'CERTIFICAT', 'ATTESTATION', 'MATERIEL', 'AUTRE']),
    sujet: z.string().min(1).max(255),
    description: z.string().min(1),
    piecesJointes: z.array(z.object({ nom: z.string(), url: z.string() })).optional(),
});

export const traiterRequeteSchema = z.object({
    statut: z.enum(['APPROUVEE', 'REJETEE']),
    commentaire: z.string().optional(),
});

export const queryRequetesSchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    type: z.string().optional(),
    statut: z.string().optional(),
});

export type CreateRequeteDto = z.infer<typeof createRequeteSchema>;
export type TraiterRequeteDto = z.infer<typeof traiterRequeteSchema>;
export type QueryRequetesDto = z.infer<typeof queryRequetesSchema>;
