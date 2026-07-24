import { z } from 'zod';

// ==================== Echelon Structurel ====================
// (fusion de NiveauOrganisation + UsageUnite — refonte v4.0)

export const createEchelonStructurelSchema = z.object({
    niveau: z.number().int().min(0).max(10),
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    couleur: z.string().max(20).optional(),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateEchelonStructurelSchema = createEchelonStructurelSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryEchelonsStructurelsSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    niveau: z.coerce.number().int().optional(),
});

export type CreateEchelonStructurelDto = z.infer<typeof createEchelonStructurelSchema>;
export type UpdateEchelonStructurelDto = z.infer<typeof updateEchelonStructurelSchema>;

// ==================== Niveau Responsabilité ====================

export const createNiveauResponsabiliteSchema = z.object({
    niveau: z.number().int().min(0).max(10),
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateNiveauResponsabiliteSchema = createNiveauResponsabiliteSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryNiveauxResponsabiliteSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    niveau: z.coerce.number().int().optional(),
});

export type CreateNiveauResponsabiliteDto = z.infer<typeof createNiveauResponsabiliteSchema>;
export type UpdateNiveauResponsabiliteDto = z.infer<typeof updateNiveauResponsabiliteSchema>;

// ==================== Template Organisation ====================

export const createTemplateOrganisationSchema = z.object({
    nom: z.string().min(2).max(200),
    description: z.string().optional(),
    structure: z.record(z.any()),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
    actif: z.boolean().default(true),
});

export const updateTemplateOrganisationSchema = createTemplateOrganisationSchema.partial().omit({
    estSysteme: true,
});

export const queryTemplatesOrganisationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    actif: z.coerce.boolean().optional(),
});

export type CreateTemplateOrganisationDto = z.infer<typeof createTemplateOrganisationSchema>;
export type UpdateTemplateOrganisationDto = z.infer<typeof updateTemplateOrganisationSchema>;

// ==================== Mode Rémunération ====================

export const createModeRemunerationSchema = z.object({
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateModeRemunerationSchema = createModeRemunerationSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryModesRemunerationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateModeRemunerationDto = z.infer<typeof createModeRemunerationSchema>;
export type UpdateModeRemunerationDto = z.infer<typeof updateModeRemunerationSchema>;
