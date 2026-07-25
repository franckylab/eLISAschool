/**
 * ==================================
 * eLISAschool - DTOs Nomenclatures Organisation
 * ==================================
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 *
 * Schémas de validation Zod pour les 4 nomenclatures :
 * - Échelons structurels (fusion NiveauOrganisation + UsageUnite)
 * - Niveaux de responsabilité
 * - Modes de rémunération
 * - Templates d'organisation
 */

import { z } from 'zod';
import {
    NatureJuridique,
    SystemeEducatif,
    LangueEnseignement,
    NiveauEnseignement,
    ComplexiteStructurelle,
} from '../entities/template-organisation.entity';

// ==================== Echelon Structurel ====================
// (fusion de NiveauOrganisation + UsageUnite — refonte v4.0)

export const createEchelonStructurelSchema = z.object({
    niveau: z.number().int().min(0).max(10),
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    couleur: z.string().max(20).optional(),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
    // estSysteme volontairement absent : réservé aux seeds (jamais injectable par le client)
});

export const updateEchelonStructurelSchema = createEchelonStructurelSchema.partial().omit({
    code: true,
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
});

export const updateNiveauResponsabiliteSchema = createNiveauResponsabiliteSchema.partial().omit({
    code: true,
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
    nomEn: z.string().max(200).optional(),
    description: z.string().optional(),
    structure: z.record(z.any()),
    etablissementId: z.string().uuid().optional(),
    actif: z.boolean().default(true),
    // Catégorisation (v5.1)
    nature: z.nativeEnum(NatureJuridique).optional(),
    systeme: z.nativeEnum(SystemeEducatif).optional(),
    langue: z.nativeEnum(LangueEnseignement).optional(),
    niveaux: z.array(z.nativeEnum(NiveauEnseignement)).optional(),
    complexite: z.nativeEnum(ComplexiteStructurelle).optional(),
    categorie: z.string().max(50).optional(),
    ordre: z.number().int().min(0).default(0),
    icone: z.string().max(20).optional(),
    metadata: z.record(z.unknown()).optional(),
});

export const updateTemplateOrganisationSchema = createTemplateOrganisationSchema.partial();

export const queryTemplatesOrganisationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
    actif: z.coerce.boolean().optional(),
    // Filtres de catégorisation (v5.1)
    nature: z.string().optional(),
    systeme: z.string().optional(),
    langue: z.string().optional(),
    niveau: z.string().optional(),
    complexite: z.string().optional(),
    categorie: z.string().optional(),
});

export type CreateTemplateOrganisationDto = z.infer<typeof createTemplateOrganisationSchema>;
export type UpdateTemplateOrganisationDto = z.infer<typeof updateTemplateOrganisationSchema>;

// ==================== Filtrage Templates (v5.1) ====================

export const filtrerTemplatesSchema = z.object({
    nature: z.string().optional(),
    systeme: z.string().optional(),
    langue: z.string().optional(),
    niveau: z.string().optional(),
    complexite: z.string().optional(),
    categorie: z.string().optional(),
    search: z.string().optional(),
    actif: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export type FiltrerTemplatesDto = z.infer<typeof filtrerTemplatesSchema>;

// ==================== Clonage Template (v5.1) ====================

export const clonerTemplateSchema = z.object({
    nom: z.string().min(2).max(200).optional(),
    etablissementId: z.string().uuid(),
});

export type ClonerTemplateDto = z.infer<typeof clonerTemplateSchema>;

// ==================== Mode Rémunération ====================

export const createModeRemunerationSchema = z.object({
    code: z.string().min(2).max(50),
    label: z.string().min(2).max(100),
    description: z.string().optional(),
    etablissementId: z.string().uuid().optional(),
});

export const updateModeRemunerationSchema = createModeRemunerationSchema.partial().omit({
    code: true,
});

export const queryModesRemunerationSchema = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    search: z.string().optional(),
});

export type CreateModeRemunerationDto = z.infer<typeof createModeRemunerationSchema>;
export type UpdateModeRemunerationDto = z.infer<typeof updateModeRemunerationSchema>;
