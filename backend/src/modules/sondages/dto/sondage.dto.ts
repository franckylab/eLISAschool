/**
 * ==================================
 * eLISAschool - DTOs du module Sondage
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { StatutSondage, NiveauAccesAnalyses, VisibiliteTemplate } from '../entities';

// ==================== Templates ====================

export const createTemplateSondageSchema = z.object({
    nom: z.string().min(2).max(200),
    description: z.string().optional(),
    question: z.string().min(5),
    options: z
        .array(z.object({ texte: z.string().min(1), ordre: z.number().optional() }))
        .min(2)
        .max(20),
    parametres: z
        .object({
            estAnonyme: z.boolean().optional(),
            choixMultiple: z.boolean().optional(),
            dureeLimite: z.string().optional(),
        })
        .optional(),
    categorie: z.string().max(50).optional(),
    visibilite: z.nativeEnum(VisibiliteTemplate).default(VisibiliteTemplate.PRIVE),
    tags: z.array(z.string()).optional(),
});

export const updateTemplateSondageSchema = createTemplateSondageSchema.partial();

export type CreateTemplateSondageDto = z.infer<typeof createTemplateSondageSchema>;
export type UpdateTemplateSondageDto = z.infer<typeof updateTemplateSondageSchema>;

// ==================== Sondages ====================

export const creerSondageSchema = z.object({
    question: z.string().min(5).max(2000),
    options: z
        .array(z.object({ texte: z.string().min(1), ordre: z.number().optional() }))
        .min(2)
        .max(20),
    parametres: z
        .object({
            estAnonyme: z.boolean().optional(),
            choixMultiple: z.boolean().optional(),
            dureeLimite: z.string().optional(), // Format: "3j", "5h", etc.
        })
        .optional(),
    destinataires: z.object({
        mode: z.enum(['individuel', 'conversation_groupe']),
        utilisateur_ids: z.array(z.string().uuid()).min(1).max(500),
    }),
    date_envoi: z.string().datetime().optional(), // Pour programmation
    creer_conversation: z.boolean().default(false),
    template_id: z.string().uuid().optional(),
});

export const voteSondageSchema = z.object({
    option_ids: z.array(z.string().uuid()).min(1),
});

export const updateSondageSchema = z.object({
    question: z.string().min(5).max(2000).optional(),
    dateLimite: z.string().datetime().optional(),
    niveauAccesAnalyses: z.nativeEnum(NiveauAccesAnalyses).optional(),
    utilisateursAutorisesAnalyses: z.array(z.string().uuid()).optional(),
});

export type CreerSondageDto = z.infer<typeof creerSondageSchema>;
export type VoteSondageDto = z.infer<typeof voteSondageSchema>;
export type UpdateSondageDto = z.infer<typeof updateSondageSchema>;

// ==================== Analyses ====================

export const updateAnalysesPermissionsSchema = z.object({
    niveau_acces: z.nativeEnum(NiveauAccesAnalyses),
    utilisateurs_autorises: z.array(z.string().uuid()).optional(),
});

export type UpdateAnalysesPermissionsDto = z.infer<typeof updateAnalysesPermissionsSchema>;

// ==================== Filtres ====================

export const filtreUtilisateursSchema = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
    type: z.enum(['personnel', 'eleve', 'responsable']).optional(),
    fonction: z.string().optional(),
    departement: z.string().optional(),
    recherche: z.string().optional(),
});

export type FiltreUtilisateursDto = z.infer<typeof filtreUtilisateursSchema>;

// ==================== Programmation ====================

export const programmerSondageSchema = creerSondageSchema.extend({
    date_envoi: z.string().datetime(),
});

export type ProgrammerSondageDto = z.infer<typeof programmerSondageSchema>;
