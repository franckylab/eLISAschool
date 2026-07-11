/**
 * ==================================
 * eLISAschool - DTOs Contrat Personnel
 * ==================================
 * Version: 1.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const modeRemunerationSchema = z.enum(['MENSUEL', 'HORAIRE', 'MIXTE', 'HEBDOMADAIRE']);

export const createContratSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    typeContrat: z.enum(['CDD', 'CDI', 'VACATAIRE', 'STAGIAIRE']),
    typeContratId: z.string().uuid().optional(),
    fonctionId: z.string().uuid().optional(),
    posteId: z.string().uuid().optional(),
    fonctionsSecondairesIds: z.array(z.string().uuid()).optional(),
    dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    salaireBase: z.coerce.number().min(0).default(0),
    tarifHoraire: z.coerce.number().positive().optional(),
    modeRemuneration: modeRemunerationSchema.optional(),
    heuresContractuellesMois: z.coerce.number().positive().optional(),
    tarifHebdomadaire: z.coerce.number().positive().optional(),
    statut: z.enum(['ACTIF', 'EXPIRE', 'RENEGOCIE', 'ROMPU']).default('ACTIF'),
    renouvellementAuto: z.boolean().default(false),
    clauses: z.string().optional(),
});

export const updateContratSchema = createContratSchema.partial().omit({ membrePersonnelId: true });

export const queryContratSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        membrePersonnelId: z.string().uuid().optional(),
        typeContrat: z.enum(['CDD', 'CDI', 'VACATAIRE', 'STAGIAIRE']).optional(),
        statut: z.enum(['ACTIF', 'EXPIRE', 'RENEGOCIE', 'ROMPU']).optional(),
    });

export type CreateContratDto = z.infer<typeof createContratSchema>;
export type UpdateContratDto = z.infer<typeof updateContratSchema>;
export type QueryContratDto = z.infer<typeof queryContratSchema>;
