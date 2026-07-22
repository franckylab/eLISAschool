import { z } from 'zod';

// ==================== Niveau Organisation ====================

export const createNiveauOrganisationSchema = z.object({
    niveau: z.number().int().min(0).max(10),
    label: z.string().min(2).max(50),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateNiveauOrganisationSchema = createNiveauOrganisationSchema.partial().omit({
    estSysteme: true,
});

export const queryNiveauxOrganisationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    niveau: z.coerce.number().int().optional(),
});

export type CreateNiveauOrganisationDto = z.infer<typeof createNiveauOrganisationSchema>;
export type UpdateNiveauOrganisationDto = z.infer<typeof updateNiveauOrganisationSchema>;

// ==================== Usage Unité ====================

export const createUsageUniteSchema = z.object({
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateUsageUniteSchema = createUsageUniteSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryUsagesUniteSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateUsageUniteDto = z.infer<typeof createUsageUniteSchema>;
export type UpdateUsageUniteDto = z.infer<typeof updateUsageUniteSchema>;

// ==================== Catégorie Poste ====================

export const createCategoriePosteSchema = z.object({
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateCategoriePosteSchema = createCategoriePosteSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryCategoriesPosteSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateCategoriePosteDto = z.infer<typeof createCategoriePosteSchema>;
export type UpdateCategoriePosteDto = z.infer<typeof updateCategoriePosteSchema>;

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

// ==================== Type Relation Hiérarchique ====================

export const createTypeRelationHierarchiqueSchema = z.object({
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    estSysteme: z.boolean().default(false),
});

export const updateTypeRelationHierarchiqueSchema = createTypeRelationHierarchiqueSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryTypesRelationHierarchiqueSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateTypeRelationHierarchiqueDto = z.infer<typeof createTypeRelationHierarchiqueSchema>;
export type UpdateTypeRelationHierarchiqueDto = z.infer<typeof updateTypeRelationHierarchiqueSchema>;

// ==================== Type Personnel ====================

export const createTypePersonnelSchema = z.object({
    code: z.string().min(2).max(50),
    nom: z.string().min(2).max(100),
    description: z.string().max(200).optional(),
    modeRemunerationDefaut: z.string().max(30).optional(),
    actif: z.boolean().default(true),
    estSysteme: z.boolean().default(false),
});

export const updateTypePersonnelSchema = createTypePersonnelSchema.partial().omit({
    code: true,
    estSysteme: true,
});

export const queryTypesPersonnelSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateTypePersonnelDto = z.infer<typeof createTypePersonnelSchema>;
export type UpdateTypePersonnelDto = z.infer<typeof updateTypePersonnelSchema>;
