import { z } from 'zod';
import { StatutChapitre } from '../entities/programme-chapitre.entity';

export const createProgrammeChapitreSchema = z.object({
    programmeMatiereId: z.string().uuid('ID programme-matière invalide'),
    periodeId: z.string().uuid('ID période invalide').optional(),
    titre: z.string().min(2, 'Titre trop court').max(255, 'Titre trop long'),
    description: z.string().max(5000, 'Description trop longue').optional(),
    objectifsPedagogiques: z.string().max(5000, 'Objectifs trop longs').optional(),
    ordre: z.coerce.number().int().min(0, "L'ordre doit être positif").default(0),
    dureePrevueHeures: z.coerce.number().int().positive('Durée doit être positive').optional(),
    statut: z.nativeEnum(StatutChapitre).default(StatutChapitre.ACTIF),
});

export const updateProgrammeChapitreSchema = createProgrammeChapitreSchema.partial().omit({
    programmeMatiereId: true,
});

export const queryProgrammeChapitreSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    programmeMatiereId: z.string().uuid().optional(),
    programmeId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    statut: z.nativeEnum(StatutChapitre).optional(),
});

export type CreateProgrammeChapitreDto = z.infer<typeof createProgrammeChapitreSchema>;
export type UpdateProgrammeChapitreDto = z.infer<typeof updateProgrammeChapitreSchema>;
export type QueryProgrammeChapitreDto = z.infer<typeof queryProgrammeChapitreSchema>;
