import { z } from 'zod';
import { ProgrammeType } from '../entities/programme-pedagogique.entity';

export const createProgrammeSchema = z.object({
    nom: z.string().min(2, 'Nom trop court').max(200, 'Nom trop long'),
    code: z.string().min(2).max(50).optional(),
    description: z.string().max(5000).optional(),
    type: z.nativeEnum(ProgrammeType).default(ProgrammeType.NIVEAU),
    cycleId: z.string().uuid('Cycle invalide').optional().nullable(),
    niveauId: z.string().uuid('Niveau invalide').optional().nullable(),
    nbHeuresHebdo: z.coerce.number().int().min(0).default(0),
    objectifsGeneraux: z.string().max(10000).optional(),
    competencesVisees: z.array(z.string()).optional(),
    periodeId: z.string().uuid('Période invalide').optional().nullable(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    actif: z.boolean().default(true),
});

export const updateProgrammeSchema = createProgrammeSchema.partial();

export const queryProgrammesSchema = z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20),
    search: z.string().optional(),
    cycleId: z.string().uuid().optional(),
    niveauId: z.string().uuid().optional(),
    type: z.nativeEnum(ProgrammeType).optional(),
    actif: z.coerce.boolean().optional(),
    sortBy: z.string().default('nom').optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});

export const addMatiereProgrammeSchema = z.object({
    matiereNiveauId: z.string().uuid('Matière-niveau invalide'),
    coefficient: z.number().positive().optional(),
    volumeHoraire: z.number().int().positive().optional(),
    obligatoire: z.boolean().default(true),
    ordre: z.number().int().min(0).default(0),
});

export const updateMatiereProgrammeSchema = addMatiereProgrammeSchema.partial().omit({ matiereNiveauId: true });

export type CreateProgrammeDto = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeDto = z.infer<typeof updateProgrammeSchema>;
export type QueryProgrammesDto = z.infer<typeof queryProgrammesSchema>;
export type AddMatiereProgrammeDto = z.infer<typeof addMatiereProgrammeSchema>;
export type UpdateMatiereProgrammeDto = z.infer<typeof updateMatiereProgrammeSchema>;
