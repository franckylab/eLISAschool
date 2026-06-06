/**
 * ==================================
 * eLISAschool - DTOs Élèves
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { SousSysteme } from '@modules/etablissement/entities';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createEleveSchema = z.object({
    utilisateurId: z.string().uuid(),
    matricule: z.string().min(2).max(50),
    dateNaissance: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    lieuNaissance: z.string().min(2).max(100),
    sexe: z.enum(['M', 'F']),
    nationalite: z.string().optional(),
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    nomPere: z.string().optional(),
    nomMere: z.string().optional(),
    nomTuteur: z.string().optional(),
    telephoneTuteur: z.string().optional(),
    dateInscription: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateEleveSchema = createEleveSchema.partial().omit({ utilisateurId: true }).extend({
    statut: z.enum(['ACTIF', 'EXCLU', 'ABANDON', 'DIPLOME']).optional(),
    etatDossier: z.enum(['COMPLET', 'INCOMPLET']).optional(),
});

export type CreateEleveDto = z.infer<typeof createEleveSchema>;
export type UpdateEleveDto = z.infer<typeof updateEleveSchema>;

/**
 * Schéma de requête pour la liste des élèves
 */
export const queryElevesSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        sousSysteme: z.nativeEnum(SousSysteme).optional(),
        classeId: z.string().uuid().optional(),
        statut: z.enum(['ACTIF', 'EXCLU', 'ABANDON', 'DIPLOME']).optional(),
        etablissementId: z.string().uuid().optional(),
    });

export type QueryElevesDto = z.infer<typeof queryElevesSchema>;
