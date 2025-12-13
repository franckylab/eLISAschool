/**
 * ==================================
 * eLISAschool - DTOs Matières
 * ==================================
 */

import { z } from 'zod';

export const createMatiereSchema = z.object({
  nom: z.string().min(2).max(100),
  code: z.string().max(50).optional(),
  nomAnglais: z.string().max(100).optional(),
  couleur: z.string().regex(/^#[0-9A-F]{6}$/i).default('#000000'),
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
  credits: z.number().min(0).optional(),
  bareme: z.number().int().min(1).default(20),
  volumeHoraire: z.number().int().min(0).optional(),
  obligatoire: z.boolean().default(true),
});

export const updateMatiereNiveauSchema = createMatiereNiveauSchema.partial();

export const affecterEnseignantSchema = z.object({
  matiereId: z.string().uuid(),
  classeId: z.string().uuid(),
  enseignantId: z.string().uuid(),
  volumeHoraireHebdo: z.number().int().optional(),
});

export type CreateMatiereDto = z.infer<typeof createMatiereSchema>;
export type UpdateMatiereDto = z.infer<typeof updateMatiereSchema>;
export type CreateGroupeMatiereDto = z.infer<typeof createGroupeMatiereSchema>;
export type CreateMatiereNiveauDto = z.infer<typeof createMatiereNiveauSchema>;
export type UpdateMatiereNiveauDto = z.infer<typeof updateMatiereNiveauSchema>;
export type AffecterEnseignantDto = z.infer<typeof affecterEnseignantSchema>;
