/**
 * ==================================
 * eLISAschool - DTOs Suivi-Élèves
 * ==================================
 * Version: 2.1.0 - Contexte africain + periodeId
 * ==================================
 */

import { z } from 'zod';
import { TypeIncidentEleve } from '../entities/incident-eleve.entity';
import { TypeSanction } from '../entities/sanction-eleve.entity';
import { TypeFelicitation } from '../entities/felicitation-eleve.entity';

export const createIncidentEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    periodeId: z.string().uuid().optional(), // ← NOUVEAU: trimestre concerné
    gravite: z.enum(['MINEUR', 'MODERE', 'GRAVE', 'TRES_GRAVE']),
    type: z.nativeEnum(TypeIncidentEleve), // ← NOUVEAU: enum structuré
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
    anneeScolaireId: z.string().uuid(),
    periodeId: z.string().uuid().optional(), // ← NOUVEAU
    type: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRE']),
    categorie: z.string().min(2).max(200),
    commentaire: z.string().min(5),
    pointsImpact: z.number().default(0),
    visibleParent: z.boolean().default(false),
});

export const createSanctionEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    periodeId: z.string().uuid().optional(), // ← NOUVEAU
    incidentId: z.string().uuid(),
    type: z.nativeEnum(TypeSanction), // ← NOUVEAU: 18 types progressifs
    motif: z.string().min(10),
    description: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    joursExclusion: z.number().optional(),
    mesuresAccompagnement: z.string().optional(),
});

export const createFelicitationEleveSchema = z.object({
    eleveId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    periodeId: z.string().uuid().optional(), // ← NOUVEAU
    type: z.nativeEnum(TypeFelicitation), // ← NOUVEAU: 20 types contextualisés
    motif: z.string().min(10),
    description: z.string().optional(),
    pointsBonus: z.number().default(0),
    visibleBulletin: z.boolean().default(true),
    visibleParent: z.boolean().default(true),
});

// Types inférés
export type CreateIncidentEleveDto = z.infer<typeof createIncidentEleveSchema>;
export type CreateObservationEleveDto = z.infer<typeof createObservationEleveSchema>;
export type CreateSanctionEleveDto = z.infer<typeof createSanctionEleveSchema>;
export type CreateFelicitationEleveDto = z.infer<typeof createFelicitationEleveSchema>;
