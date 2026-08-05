/**
 * ==================================
 * eLISAschool - DTOs Jours Fériés
 * ==================================
 * Schémas Zod pour la validation des jours fériés
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { PaysJourFerie } from '../entities/jour-ferie.entity';

/** Schéma de base — objet pur (permet .partial() pour l'update) */
const jourFerieBaseSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(150),
    date: z.string().nullable().optional(),
    estRecurrent: z.boolean().default(false),
    mois: z.number().int().min(1).max(12).nullable().optional(),
    jourMois: z.number().int().min(1).max(31).nullable().optional(),
    couleur: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide (format #RRGGBB attendu)').nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    etablissementId: z.string().uuid().nullable().optional(),
    /** Code pays du modèle (ex: 'CM', 'CI'). Null si custom. */
    pays: z.string().length(2).nullable().optional(),
});

/** Raffinement : récurrent ⇒ mois+jourMois, ponctuel ⇒ date */
const jourFerieRefine = (data: { estRecurrent?: boolean; date?: string | null; mois?: number | null; jourMois?: number | null }) => {
    if (data.estRecurrent) {
        return data.mois != null && data.jourMois != null;
    }
    return data.date != null;
};
const JOUR_FERIE_REFINE_MSG = 'Un jour férié récurrent nécessite mois et jourMois. Un jour ponctuel nécessite une date.';

/** Jours max par mois (février = 29 pour tolérer les années bissextiles) */
const JOURS_MAX_PAR_MOIS: Record<number, number> = {
    1: 31, 2: 29, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
};

/** Schéma de création d'un jour férié */
export const createJourFerieSchema = jourFerieBaseSchema
    .refine(jourFerieRefine, { message: JOUR_FERIE_REFINE_MSG })
    .superRefine((data, ctx) => {
        // Validation croisée : jourMois cohérent avec mois
        if (data.estRecurrent && data.mois != null && data.jourMois != null) {
            const maxJour = JOURS_MAX_PAR_MOIS[data.mois] ?? 31;
            if (data.jourMois > maxJour) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Le mois ${data.mois} ne peut pas avoir ${data.jourMois} jours (max ${maxJour})`,
                    path: ['jourMois'],
                });
            }
        }
    });

/** Schéma de mise à jour d'un jour férié (tous les champs optionnels) */
export const updateJourFerieSchema = jourFerieBaseSchema.partial().superRefine((data, ctx) => {
    // Si l'utilisateur modifie estRecurrent vers true, mois+jourMois doivent être présents
    if (data.estRecurrent === true) {
        if (data.mois == null && data.jourMois == null) {
            // On ne peut pas savoir si les valeurs existantes sont valides,
            // mais on signale l'incohérence si les deux sont explicitement null
            if (data.mois === null || data.jourMois === null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: JOUR_FERIE_REFINE_MSG,
                    path: ['estRecurrent'],
                });
            }
        }
    }
    // Si l'utilisateur modifie estRecurrent vers false, une date doit être fournie
    if (data.estRecurrent === false && data.date === null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: JOUR_FERIE_REFINE_MSG,
            path: ['date'],
        });
    }
});

export type CreateJourFerieDto = z.infer<typeof createJourFerieSchema>;
export type UpdateJourFerieDto = z.infer<typeof updateJourFerieSchema>;

/** Schéma pour charger un modèle de jours fériés par pays */
export const chargerModelePaysSchema = z.object({
    pays: z.nativeEnum(PaysJourFerie),
    etablissementId: z.string().uuid().optional(),
});

export type ChargerModelePaysDto = z.infer<typeof chargerModelePaysSchema>;
