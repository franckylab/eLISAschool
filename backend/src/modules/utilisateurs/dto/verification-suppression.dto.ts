/**
 * ==================================
 * eLISAschool - DTOs Vérification Suppression Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

/**
 * Schéma de réponse pour les impacts par catégorie
 * Accepte soit un nombre direct, soit un objet avec nombre et détails
 */
export const impactCategorieSchema = z.union([
    z.number().int().nonnegative(),
    z.object({
        nombre: z.number().int().nonnegative(),
        details: z.array(z.string()).optional(),
    }),
]);

/**
 * Schéma des impacts détaillés
 */
export const impactsSchema = z.object({
    // Relations directes CASCADE
    profilUtilisateur: impactCategorieSchema,
    permissions: impactCategorieSchema,
    roles: impactCategorieSchema,
    refreshTokens: impactCategorieSchema,
    preferences: impactCategorieSchema,
    dashboardLayouts: impactCategorieSchema,

    // Relations directes SANS CASCADE
    membrePersonnel: impactCategorieSchema,
    responsableEleves: impactCategorieSchema,
    eleves: impactCategorieSchema,
    auditLogs: impactCategorieSchema,
    
    // Données métier créées
    notesCreees: impactCategorieSchema,
    bulletinsGeneres: impactCategorieSchema,
    presencesEnregistrees: impactCategorieSchema,
    absencesEnregistrees: impactCategorieSchema,
    retardsEnregistres: impactCategorieSchema,
    paiementsRecus: impactCategorieSchema,
    transactionsCantine: impactCategorieSchema,
    transactionsTransport: impactCategorieSchema,
    messagesEnvoyes: impactCategorieSchema,
    conversationsCreees: impactCategorieSchema,
    annoncesCreees: impactCategorieSchema,
    sondagesCrees: impactCategorieSchema,
    requetesTraitees: impactCategorieSchema,
    tachesAssignees: impactCategorieSchema,
    evaluationsPersonnel: impactCategorieSchema,
    sanctionsEleves: impactCategorieSchema,
    observationsEleves: impactCategorieSchema,
    felicitationsEleves: impactCategorieSchema,
    consultationsMedicales: impactCategorieSchema,
    incidentsEleves: impactCategorieSchema,
    incidentsPersonnel: impactCategorieSchema,
    
    // Gamification
    pointsUtilisateur: impactCategorieSchema,
    badgesUtilisateur: impactCategorieSchema,
    historiquePoints: impactCategorieSchema,
    historiqueScores: impactCategorieSchema,
    
    // Emploi du temps et enseignement
    emploiDuTemps: impactCategorieSchema,
    classesResponsabilisees: impactCategorieSchema,
    matieresEnseignees: impactCategorieSchema,
});

/**
 * Schéma des éléments critiques bloquants
 */
export const elementsCritiquesSchema = z.object({
    nombreTotal: z.number().int().nonnegative(),
    notesDansBulletinsPublies: z.number().int().nonnegative(),
    bulletinsValidates: z.number().int().nonnegative(),
    paiementsComptabilises: z.number().int().nonnegative(),
    transactionsValidees: z.number().int().nonnegative(),
    cloturesPeriodes: z.number().int().nonnegative(),
    evaluationsFinalisees: z.number().int().nonnegative(),
});

/**
 * Schéma des permissions
 */
export const permissionsSchema = z.object({
    peutSoftDelete: z.boolean(),
    peutCascadeDelete: z.boolean(),
    permissionRequiseSoft: z.string(),
    permissionRequiseCascade: z.string(),
});

/**
 * Schéma du résumé global
 */
export const resumeSchema = z.object({
    totalElementsDirects: z.number().int().nonnegative(),
    totalElementsIndirects: z.number().int().nonnegative(),
    totalElementsMetier: z.number().int().nonnegative(),
    totalElementsCritiques: z.number().int().nonnegative(),
    totalGeneral: z.number().int().nonnegative(),
    categoriesAvecElements: z.number().int().nonnegative(),
});

/**
 * Schéma complet de réponse pour la vérification de suppression
 */
export const verificationSuppressionSchema = z.object({
    utilisateur: z.object({
        id: z.string().uuid(),
        nom: z.string(),
        prenom: z.string(),
        email: z.string(),
        roles: z.array(z.string()),
        statut: z.string(),
    }),
    
    contexte: z.object({
        etablissementId: z.string().uuid().optional(),
        aEtablissementContexte: z.boolean(),
    }),

    impacts: impactsSchema,
    elementsCritiques: elementsCritiquesSchema,
    permissions: permissionsSchema,
    resume: resumeSchema,

    // Statut global
    peutSupprimer: z.boolean(),
    modeRecommande: z.enum(['soft', 'cascade', 'aucun']),
    blocageTotal: z.boolean(),
    raisonBlocage: z.string().optional(),
});

/**
 * Schéma pour la requête DELETE
 */
export const supprimerUtilisateurSchema = z.object({
    mode: z.enum(['soft', 'cascade']),
    motif: z.string().min(10, 'Le motif doit contenir au moins 10 caractères'),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Types TypeScript inférés
 */
export type ImpactCategorie = z.infer<typeof impactCategorieSchema>;
export type Impacts = z.infer<typeof impactsSchema>;
export type ElementsCritiques = z.infer<typeof elementsCritiquesSchema>;
export type PermissionsSuppression = z.infer<typeof permissionsSchema>;
export type ResumeSuppression = z.infer<typeof resumeSchema>;
export type VerificationSuppressionResponse = z.infer<typeof verificationSuppressionSchema>;
export type SupprimerUtilisateurDto = z.infer<typeof supprimerUtilisateurSchema>;
