/**
 * ==================================
 * eLISAschool - DTO Emploi-du-Temps
 * ==================================
 */

import { z } from 'zod';
import { JourSemaine, TypeCreneau } from '../entities';

export const creerCreneauSchema = z.object({
    classeId: z.string().uuid('ID de la classe invalide'),
    matiereId: z.string().uuid('ID de la matière invalide'),
    enseignantId: z.string().uuid('ID de l\'enseignant invalide'),
    salleId: z.string().uuid('ID de la salle invalide').optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).describe('Jour invalide'),
    heureDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format heure invalide (HH:MM)'),
    heureFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format heure invalide (HH:MM)'),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).default('COURS'),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
}).refine(data => {
    // Vérifier que heureFin > heureDebut
    const [h1, m1] = data.heureDebut.split(':').map(Number);
    const [h2, m2] = data.heureFin.split(':').map(Number);
    return h2 * 60 + m2 > h1 * 60 + m1;
}, {
    message: 'L\'heure de fin doit être après l\'heure de début'
});

export const modifierCreneauSchema = z.object({
    matiereId: z.string().uuid('ID de la matière invalide').optional(),
    enseignantId: z.string().uuid('ID de l\'enseignant invalide').optional(),
    salleId: z.string().uuid('ID de la salle invalide').optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).optional(),
    heureDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    heureFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).optional(),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
}).refine(data => {
    // Vérifier que heureFin > heureDebut si les deux sont présents
    if (data.heureDebut && data.heureFin) {
        const [h1, m1] = data.heureDebut.split(':').map(Number);
        const [h2, m2] = data.heureFin.split(':').map(Number);
        return h2 * 60 + m2 > h1 * 60 + m1;
    }
    return true;
}, {
    message: 'L\'heure de fin doit être après l\'heure de début'
});

export const genererEmploiDuTempsSchema = z.object({
    classeId: z.string().uuid('ID de la classe invalide'),
    anneeScolaireId: z.string().uuid('ID de l\'année scolaire invalide'),
    etablissementId: z.string().uuid('ID de l\'établissement invalide'),
    options: z.object({
        regenerer: z.boolean().default(false),
        respecterContraintes: z.boolean().default(true),
    }).optional(),
});

export const preferenceEmploiDuTempsSchema = z.object({
    heureDebutCours: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    heureFinCours: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    dureeCreneauStandard: z.number().int().min(30).max(120),
    dureeRecreation: z.number().int().min(5).max(30),
    joursOuvrables: z.array(z.string()).min(1).max(7),
    maxCreneauxParJour: z.number().int().min(4).max(12),
    maxCreneauxMatiereParJour: z.number().int().min(1).max(4),
    maxCreneauxConsecutifs: z.number().int().min(1).max(3),
    pauseDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    pauseFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable().optional(),
    repartitionEquilibree: z.boolean().default(true),
});

export type CreerCreneauDto = z.infer<typeof creerCreneauSchema>;
export type ModifierCreneauDto = z.infer<typeof modifierCreneauSchema>;
export type GenererEmploiDuTempsDto = z.infer<typeof genererEmploiDuTempsSchema>;
export type PreferenceEmploiDuTempsDto = z.infer<typeof preferenceEmploiDuTempsSchema>;

// ==================================
// DTOs pour Répartition Horaire
// ==================================

export const createRepartitionHoraireSchemaBase = z.object({
    affectationId: z.string().uuid('ID de l\'affectation invalide'),
    jourSemaine: z.enum(Object.values(JourSemaine) as [string, ...string[]], {
        errorMap: () => ({ message: 'Jour de la semaine invalide' })
    }),
    heureDebut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format heure invalide (HH:MM)'),
    heureFin: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format heure invalide (HH:MM)'),
    salleId: z.string().uuid('ID de la salle invalide').optional(),
    periodeId: z.string().uuid('ID de la période invalide').optional(),
    actif: z.boolean().default(true),
});

export const createRepartitionHoraireSchema = createRepartitionHoraireSchemaBase.refine(data => {
    const [h1, m1] = data.heureDebut.split(':').map(Number);
    const [h2, m2] = data.heureFin.split(':').map(Number);
    return h2 * 60 + m2 > h1 * 60 + m1;
}, {
    message: 'L\'heure de fin doit être après l\'heure de début'
});

export const updateRepartitionHoraireSchema = createRepartitionHoraireSchemaBase.partial().extend({
    actif: z.boolean().optional(),
}).refine(data => {
    if (data.heureDebut && data.heureFin) {
        const [h1, m1] = data.heureDebut.split(':').map(Number);
        const [h2, m2] = data.heureFin.split(':').map(Number);
        return h2 * 60 + m2 > h1 * 60 + m1;
    }
    return true;
}, {
    message: 'L\'heure de fin doit être après l\'heure de début'
});

export type CreateRepartitionHoraireDto = z.infer<typeof createRepartitionHoraireSchema>;
export type UpdateRepartitionHoraireDto = z.infer<typeof updateRepartitionHoraireSchema>;

