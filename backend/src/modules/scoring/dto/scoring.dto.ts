/**
 * ==================================
 * eLISAschool - DTOs Configuration Scoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { MethodeCalculMoyenne, SystemeNotation } from '../entities';

export const createConfigurationScoringSchema = z.object({
    etablissementId: z.string().uuid().optional(),
    anneeScolaireId: z.string().uuid().nullable().optional(),
    methodeCalcul: z.nativeEnum(MethodeCalculMoyenne).default(MethodeCalculMoyenne.MOYENNE_PONDEREE),
    systemeNotation: z.nativeEnum(SystemeNotation).default(SystemeNotation.SUR_20),
    noteMinimale: z.number().default(0),
    noteMaximale: z.number().default(20),
    noteValidation: z.number().default(10),
    utiliserCoefficients: z.boolean().default(true),
    coefficientDefaut: z.number().default(1),
    calculerRang: z.boolean().default(true),
    afficherRang: z.boolean().default(true),
    utiliserMentions: z.boolean().default(true),
    configurationMentions: z.array(z.object({
        mention: z.string(),
        noteMin: z.number(),
        noteMax: z.number(),
        couleur: z.string().optional(),
    })).nullable().optional(),
    genererAppreciationsAuto: z.boolean().default(true),
    modeleAppreciation: z.string().nullable().optional(),
    calculerMoyenneClasse: z.boolean().default(true),
    afficherMoyenneClasse: z.boolean().default(true),
    afficherMoyenneMin: z.boolean().default(true),
    afficherMoyenneMax: z.boolean().default(true),
    arrondirNotes: z.boolean().default(false),
    precisionDecimales: z.number().int().min(0).max(4).default(2),
    supprimerNoteBasse: z.boolean().default(false),
    nombreNotesSupprimees: z.number().int().min(0).default(0),
});

export const updateConfigurationScoringSchema = createConfigurationScoringSchema.partial();

export type CreateConfigurationScoringDto = z.infer<typeof createConfigurationScoringSchema>;
export type UpdateConfigurationScoringDto = z.infer<typeof updateConfigurationScoringSchema>;
