/**
 * ==================================
 * eLISAschool - DTOs Promotions v4.0
 * ==================================
 *
 * Schémas Zod pour la validation des promotions et packages.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// =============================================
// SCHÉMAS PROMOTION
// =============================================

export const conditionsPromotionSchema = z.object({
    nombreElevesMin: z.number().int().min(0).optional(),
    ancienneteMois: z.number().int().min(0).optional(),
    plansRequis: z.array(z.string().uuid()).optional(),
    packsRequis: z.array(z.string().uuid()).optional(),
    modulesRequis: z.array(z.string().uuid()).optional(),
    ressourceCible: z.string().max(100).optional(),
    nbCycles: z.number().int().min(1).optional(),
    dureeGratuiteMois: z.number().int().min(1).max(120).optional(),
}).optional();

export const configPromotionSchema = z.object({
    prixOriginalPackage: z.number().min(0).optional(),
    reductionPackage: z.number().min(0).optional(),
    noteInterne: z.string().max(500).optional(),
    paliersVolume: z.array(z.object({
        min: z.number().int().min(0),
        max: z.number().int().min(0).nullable(),
        valeur: z.number().min(0),
    })).optional(),
    quotaRessource: z.string().max(100).optional(),
    typeAutomatique: z.enum([
        'MANUELLE', 'NOUVEAU_CLIENT', 'FIDELITE',
        'UPGRADE', 'CROSS_SELL', 'FREE_TRIAL',
    ]).optional(),
    declencheur: z.record(z.unknown()).optional(),
}).optional();

// Schéma de base (ZodObject) — nécessaire pour .partial()/.omit() sur update
const _promotionBase = z.object({
    code: z.string().min(2).max(100),
    nom: z.string().min(2).max(150),
    typePromotion: z.enum(['POURCENTAGE', 'MONTANT_FIXE', 'GRATUITE']),
    scope: z.enum(['PLAN', 'PACK', 'MODULE', 'PACKAGE', 'QUOTA']),
    cibleId: z.string().uuid().optional().nullable(),
    cibleRessource: z.string().max(100).optional().nullable(),
    valeur: z.number().min(0),
    dureeApplication: z.enum(['PREMIERE_FACTURE', 'N_CYCLES', 'PERMANENTE', 'N_MOIS_GRATUIT']),
    conditions: conditionsPromotionSchema,
    config: configPromotionSchema,
    cumulable: z.boolean().default(false),
    priorite: z.number().int().min(0).default(0),
    codeCoupon: z.string().max(100).optional().nullable(),
    maxUtilisations: z.number().int().min(1).optional().nullable(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional().nullable(),
    actif: z.boolean().default(true),
    estProgrammee: z.boolean().default(false),
    dateProgrammation: z.coerce.date().optional().nullable(),
});

// update : .partial().omit() sur le ZodObject de base (avant refinements)
export const updatePromotionSchema = _promotionBase.partial().omit({ code: true });

// create : refinements de cohérence appliqués après le base object
export const createPromotionSchema = _promotionBase
    .refine(
        (data) => !data.dateFin || !data.dateDebut || data.dateFin > data.dateDebut,
        { message: 'La date de fin doit être postérieure à la date de début', path: ['dateFin'] }
    )
    .refine(
        (data) => data.typePromotion !== 'POURCENTAGE' || data.valeur <= 100,
        { message: 'Un pourcentage ne peut pas dépasser 100%', path: ['valeur'] }
    );

export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionDto = z.infer<typeof updatePromotionSchema>;

// =============================================
// SCHÉMAS PACKAGE
// =============================================

export const createPackageSchema = z.object({
    code: z.string().min(2).max(100),
    nom: z.string().min(2).max(150),
    description: z.string().max(500).optional(),
    packIds: z.array(z.string().uuid()).min(2, 'Un package doit contenir au moins 2 packs'),
    typeRemise: z.enum(['POURCENTAGE', 'MONTANT_FIXE']),
    valeur: z.number().min(0),
    codeCoupon: z.string().max(100).optional().nullable(),
    dateDebut: z.coerce.date().optional(),
    dateFin: z.coerce.date().optional().nullable(),
    maxUtilisations: z.number().int().min(1).optional().nullable(),
    actif: z.boolean().default(true),
    priorite: z.number().int().min(0).default(0),
});

export const updatePackageSchema = createPackageSchema.partial().omit({ code: true });

export type CreatePackageDto = z.infer<typeof createPackageSchema>;
export type UpdatePackageDto = z.infer<typeof updatePackageSchema>;
