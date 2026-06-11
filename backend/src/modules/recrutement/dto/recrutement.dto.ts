/**
 * ==================================
 * eLISAschool - DTOs Recrutement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

// =====================================================
// OFFRE EMPLOI
// =====================================================

export const createOffreEmploiSchema = z.object({
    posteId: z.string().uuid().optional(),
    uniteOrganisationnelleId: z.string().uuid().optional(),
    titre: z.string().min(5).max(200),
    description: z.string().min(20),
    missions: z.string().optional(),
    profilRecherche: z.string().optional(),
    competencesRequises: z.string().optional(),
    experienceRequise: z.string().optional(),
    niveauEtudeRequis: z.string().max(100).optional(),
    salaireMin: z.number().positive().optional(),
    salaireMax: z.number().positive().optional(),
    typeContratPropose: z.string().max(50).optional(),
    datePublication: z.string().datetime().optional(),
    dateLimite: z.string().datetime().optional(),
    nombrePostesDisponibles: z.number().int().min(1).default(1),
});

export const updateOffreEmploiSchema = createOffreEmploiSchema.partial();

export const queryOffreEmploiSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        statut: z.enum(['BROUILLON', 'PUBLIEE', 'SUSPENDUE', 'TERMINEE', 'ANNULEE']).optional(),
        typeContrat: z.string().max(50).optional(),
    });

export type CreateOffreEmploiDto = z.infer<typeof createOffreEmploiSchema>;
export type UpdateOffreEmploiDto = z.infer<typeof updateOffreEmploiSchema>;
export type QueryOffreEmploiDto = z.infer<typeof queryOffreEmploiSchema>;

// =====================================================
// CANDIDATURE
// =====================================================

export const createCandidatureSchema = z.object({
    offreEmploiId: z.string().uuid(),
    nomComplet: z.string().min(2).max(200),
    email: z.string().email(),
    telephone: z.string().max(20).optional(),
    cvUrl: z.string().optional(),
    lettreMotivationUrl: z.string().optional(),
    portfolioUrl: z.string().optional(),
    niveauEtude: z.string().max(100).optional(),
    anneesExperience: z.number().int().min(0).optional(),
    competences: z.string().optional(),
    commentaires: z.string().optional(),
});

export const updateCandidatureSchema = createCandidatureSchema.partial();

export const evaluerCandidatureSchema = z.object({
    statut: z.enum(['RECUE', 'EN_COURS_EXAMEN', 'PRESLECTIONNEE', 'CONVOQUEE', 'RETENUE', 'REFUSEE', 'LISTE_ATTENTE']),
    noteEvaluation: z.number().min(0).max(20).optional(),
    evaluationCommentaire: z.string().optional(),
});

export const queryCandidatureSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        offreEmploiId: z.string().uuid().optional(),
        statut: z.enum(['RECUE', 'EN_COURS_EXAMEN', 'PRESLECTIONNEE', 'CONVOQUEE', 'RETENUE', 'REFUSEE', 'LISTE_ATTENTE']).optional(),
    });

export type CreateCandidatureDto = z.infer<typeof createCandidatureSchema>;
export type UpdateCandidatureDto = z.infer<typeof updateCandidatureSchema>;
export type EvaluerCandidatureDto = z.infer<typeof evaluerCandidatureSchema>;
export type QueryCandidatureDto = z.infer<typeof queryCandidatureSchema>;

// =====================================================
// ENTRETIEN
// =====================================================

export const createEntretienSchema = z.object({
    candidatureId: z.string().uuid(),
    offreEmploiId: z.string().uuid(),
    type: z.enum(['TELEPHONIQUE', 'TECHNIQUE', 'RH', 'FINAL', 'PANEL']),
    dateEntretien: z.string().datetime(),
    heureDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    heureFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    lieu: z.string().max(200).optional(),
    lienVideoconference: z.string().optional(),
    grilleEvaluation: z.string().optional(),
    evaluateurId: z.string().uuid().optional(),
});

export const updateEntretienSchema = createEntretienSchema.partial();

export const evaluerEntretienSchema = z.object({
    statut: z.enum(['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'REPORTE']),
    compteRendu: z.string().optional(),
    note: z.number().min(0).max(20).optional(),
    pointsFort: z.string().optional(),
    pointsAmeliorer: z.string().optional(),
    decision: z.string().optional(),
});

export const queryEntretienSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        candidatureId: z.string().uuid().optional(),
        offreEmploiId: z.string().uuid().optional(),
        type: z.enum(['TELEPHONIQUE', 'TECHNIQUE', 'RH', 'FINAL', 'PANEL']).optional(),
        statut: z.enum(['PLANIFIE', 'EN_COURS', 'TERMINE', 'ANNULE', 'REPORTE']).optional(),
    });

export type CreateEntretienDto = z.infer<typeof createEntretienSchema>;
export type UpdateEntretienDto = z.infer<typeof updateEntretienSchema>;
export type EvaluerEntretienDto = z.infer<typeof evaluerEntretienSchema>;
export type QueryEntretienDto = z.infer<typeof queryEntretienSchema>;

// =====================================================
// ONBOARDING
// =====================================================

export const createOnboardingSchema = z.object({
    membrePersonnelId: z.string().uuid(),
    offreEmploiId: z.string().uuid(),
    dateDebut: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    dateFinPrevu: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    tuteurId: z.string().uuid().optional(),
    checklist: z.string().optional(),
    formationInitiale: z.string().optional(),
    equipementFourni: z.string().optional(),
});

export const updateOnboardingSchema = createOnboardingSchema.partial();

export const updateChecklistSchema = z.object({
    checklist: z.string(),
    progressionPourcentage: z.number().int().min(0).max(100),
});

export const queryOnboardingSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        membrePersonnelId: z.string().uuid().optional(),
        statut: z.enum(['EN_COURS', 'TERMINE', 'EN_RETARD']).optional(),
    });

export type CreateOnboardingDto = z.infer<typeof createOnboardingSchema>;
export type UpdateOnboardingDto = z.infer<typeof updateOnboardingSchema>;
export type UpdateChecklistDto = z.infer<typeof updateChecklistSchema>;
export type QueryOnboardingDto = z.infer<typeof queryOnboardingSchema>;
