/**
 * ==================================
 * eLISAschool - DTOs Suivi-Élèves
 * ==================================
 */

import { z } from 'zod';

export const createIncidentEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(), // ← NOUVEAU: obligatoire
    gravite: z.enum(['MINEUR', 'MODERE', 'GRAVE', 'TRES_GRAVE']),
    type: z.string().min(2).max(200),
    description: z.string().min(10),
    lieu: z.string().optional(),
    temoins: z.string().optional(),
    actionPrise: z.string().optional(),
    signaleParent: z.boolean().default(false),
    // Contexte pédagogique (optionnel)
    classeId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    enseignantId: z.string().uuid().optional(),
});

export const createObservationEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(), // ← NOUVEAU
    type: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRE']),
    categorie: z.string().min(2).max(200),
    commentaire: z.string().min(5),
    pointsImpact: z.number().default(0),
    visibleParent: z.boolean().default(false),
});

export const createSanctionEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(), // ← NOUVEAU
    incidentId: z.string().uuid(),
    type: z.enum(['AVERTISSEMENT', 'BLAME', 'RETENUE', 'EXCLUSION_TEMPORAIRE', 'EXCLUSION_DEFINITIVE', 'CONSEIL_DISCIPLINE']),
    motif: z.string().min(10),
    description: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    joursExclusion: z.number().optional(),
    mesuresAccompagnement: z.string().optional(),
});

export const createFelicitationEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(), // ← NOUVEAU
    type: z.enum(['EXCELLENCE_ACADEMIQUE', 'PROGRES_REMARQUABLE', 'COMPORTEMENT_EXEMPLAIRE', 'ACTIVITE_PARASCOLAIRE', 'MERITE_SPECIAL']),
    motif: z.string().min(10),
    description: z.string().optional(),
    pointsBonus: z.number().default(0),
    visibleBulletin: z.boolean().default(true),
    visibleParent: z.boolean().default(true),
});
