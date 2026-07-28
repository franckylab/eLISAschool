/**
 * ==================================
 * eLISAschool - DTOs Matières
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationSchema } from '@common/dto/pagination.dto';
import { SousSysteme } from '@modules/etablissement/entities';

export const createMatiereSchema = z.object({
  nom: z.string().min(2).max(100),
  code: z.string().max(50).optional(),
  nomAnglais: z.string().max(100).optional(),
  couleur: z.string().regex(/^#[0-9A-F]{6}$/i).default('#000000'),
  sousSysteme: z.nativeEnum(SousSysteme).optional(),
  actif: z.boolean().default(true),
});

export const updateMatiereSchema = createMatiereSchema.partial();

export const createGroupeMatiereSchema = z.object({
  nom: z.string().min(2).max(100),
  ordre: z.number().int().default(1),
  description: z.string().optional(),
});

export const createMatiereNiveauSchema = z.object({
  matiereId: z.string().uuid(),
  niveauId: z.string().uuid(),
  groupeId: z.string().uuid().optional(),
  coefficient: z.number().min(0).default(1),
  bareme: z.number().int().min(1).default(20),
  volumeHoraire: z.number().int().min(0).optional(),
  obligatoire: z.boolean().default(true),
  periodeId: z.string().uuid('Période invalide').optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
});

export const updateMatiereNiveauSchema = createMatiereNiveauSchema.partial();

export const affecterEnseignantSchema = z.object({
  matiereId: z.string().uuid(),
  classeAnneeId: z.string().uuid(),
  enseignantId: z.string().uuid(),
  coEnseignantIds: z.array(z.string().uuid()).optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  actif: z.boolean().optional(),
  coefficient: z.number().min(0).optional(),
  obligatoire: z.boolean().default(true),
  statutValidation: z.enum(['VALIDE', 'EN_ATTENTE_VALIDATION', 'REJETE']).default('VALIDE'),
});

export const moveAffectationSchema = z.object({
    cibleClasseAnneeId: z.string().uuid(),
});

export type CreateMatiereDto = z.infer<typeof createMatiereSchema>;
export type UpdateMatiereDto = z.infer<typeof updateMatiereSchema>;
export type CreateGroupeMatiereDto = z.infer<typeof createGroupeMatiereSchema>;
export type CreateMatiereNiveauDto = z.infer<typeof createMatiereNiveauSchema>;
export type UpdateMatiereNiveauDto = z.infer<typeof updateMatiereNiveauSchema>;
export type AffecterEnseignantDto = z.infer<typeof affecterEnseignantSchema>;
export type MoveAffectationDto = z.infer<typeof moveAffectationSchema>;

/**
 * Schéma de requête pour la liste des matières
 */
export const queryMatieresSchema = paginationSchema.extend({
    actif: z.string().transform((v) => v === 'true').optional(),
    recherche: z.string().max(100).optional(),
    sousSysteme: z.nativeEnum(SousSysteme).optional(),
});

export type QueryMatieresDto = z.infer<typeof queryMatieresSchema>;
