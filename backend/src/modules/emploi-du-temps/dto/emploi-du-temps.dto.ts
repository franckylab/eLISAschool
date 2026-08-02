/**
 * ==================================
 * eLISAschool - DTOs Emploi du Temps (CreneauHoraire)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Refonte : fusion EmploiDuTemps + RepartitionHoraire → CreneauHoraire.
 * Le créneau référence affectationMatiereId comme source unique.
 * ==================================
 */

import { z } from 'zod';
import { JourSemaine, TypeCreneau, StatutCreneau } from '../entities';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeNormalizer = (v: string) => v.length > 5 ? v.substring(0, 5) : v;
const time = (msg?: string) => z.string().regex(timeRegex, msg || 'Format heure invalide (HH:MM)').transform(timeNormalizer);
const optionalTime = () => time().optional();

function heureApresDebut(data: { heureDebut: string; heureFin: string }): boolean {
    const [h1, m1] = timeNormalizer(data.heureDebut).split(':').map(Number);
    const [h2, m2] = timeNormalizer(data.heureFin).split(':').map(Number);
    return h2 * 60 + m2 > h1 * 60 + m1;
}

// ─── Schémas CreneauHoraire ────────────────────────────────────

export const creerCreneauSchema = z.object({
    /** Source : affectation matière (enseignant + matière + classe-année) */
    affectationMatiereId: z.string().uuid('ID de l\'affectation invalide'),
    salleId: z.string().uuid('ID de la salle invalide').nullable().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]),
    heureDebut: time('Format heure invalide (HH:MM)'),
    heureFin: time('Format heure invalide (HH:MM)'),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).default(TypeCreneau.COURS),
    statut: z.enum(Object.values(StatutCreneau) as [string, ...string[]]).default(StatutCreneau.PLANIFIE),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
    periodeId: z.string().uuid().optional(),
    anneeScolaireId: z.string().uuid().optional(),
}).refine(heureApresDebut, { message: 'L\'heure de fin doit être après l\'heure de début' });

export const modifierCreneauSchema = z.object({
    affectationMatiereId: z.string().uuid().optional(),
    salleId: z.string().uuid().nullable().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).optional(),
    heureDebut: optionalTime(),
    heureFin: optionalTime(),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).optional(),
    statut: z.enum(Object.values(StatutCreneau) as [string, ...string[]]).optional(),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
}).refine(data => {
    if (data.heureDebut && data.heureFin) return heureApresDebut(data as { heureDebut: string; heureFin: string });
    return true;
}, { message: 'L\'heure de fin doit être après l\'heure de début' });

export const queryCreneauxSchema = z.object({
    /** Filtrer par affectation matière */
    affectationMatiereId: z.string().uuid().optional(),
    /** Filtres dérivés via jointure affectation */
    classeAnneeId: z.string().uuid().optional(),
    enseignantId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    salleId: z.string().uuid().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).optional(),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).optional(),
    statut: z.enum(Object.values(StatutCreneau) as [string, ...string[]]).optional(),
    anneeScolaireId: z.string().uuid().optional(),
    periodeId: z.string().uuid().optional(),
    genereAutomatiquement: z.coerce.boolean().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(500).default(50),
    orderBy: z.enum(['jour', 'heureDebut', 'createdAt']).default('jour'),
    orderDir: z.enum(['ASC', 'DESC']).default('ASC'),
});

// ─── Génération EDT ────────────────────────────────────────────

export const genererEmploiDuTempsSchema = z.object({
    classeAnneeId: z.string().uuid('ID de la classe/année invalide'),
    templateId: z.string().uuid('ID du template invalide').optional(),
    options: z.object({
        regenerer: z.boolean().default(false),
        respecterContraintes: z.boolean().default(true),
    }).optional(),
});

// ─── Préférences EDT ───────────────────────────────────────────

const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).optional();
const optionalStringArray = () => z.array(z.string()).min(1).max(7).optional();

/** Schéma d'un créneau imposable */
export const creneauImposableSchema = z.object({
    jour: z.string(),
    heureDebut: time(),
    heureFin: time(),
    motif: z.string().max(200).optional(),
});

export const preferenceEmploiDuTempsSchema = z.object({
    heureDebutCours: optionalTime(),
    heureFinCours: optionalTime(),
    dureeCreneauStandard: optionalInt(30, 120),
    /** Alias frontend pour dureeCreneauStandard */
    dureeCreneauDefaut: optionalInt(30, 120),
    dureeRecreation: optionalInt(5, 30),
    joursOuvrables: optionalStringArray(),
    /** Alias frontend pour joursOuvrables */
    joursTravailles: optionalStringArray(),
    maxCreneauxParJour: optionalInt(4, 12),
    maxCreneauxMatiereParJour: optionalInt(1, 4),
    maxCreneauxConsecutifs: optionalInt(1, 3),
    /** Pause déjeuner */
    pauseDebut: time().nullable().optional(),
    pauseFin: time().nullable().optional(),
    /** Pause matinée / récréation */
    pauseMatineeDebut: time().nullable().optional(),
    pauseMatineeFin: time().nullable().optional(),
    /** Pause après-midi */
    pauseApresMidiDebut: time().nullable().optional(),
    pauseApresMidiFin: time().nullable().optional(),
    /** Créneaux imposables (exclusions fines) */
    creneauxImposables: z.array(creneauImposableSchema).optional(),
    repartitionEquilibree: z.boolean().optional(),
}).transform((data) => {
    const normalized = { ...data } as Record<string, unknown>;
    if (data.dureeCreneauDefaut !== undefined && data.dureeCreneauStandard === undefined) {
        normalized.dureeCreneauStandard = data.dureeCreneauDefaut;
    }
    if (data.joursTravailles !== undefined && data.joursOuvrables === undefined) {
        normalized.joursOuvrables = data.joursTravailles;
    }
    delete normalized.dureeCreneauDefaut;
    delete normalized.joursTravailles;
    return normalized;
});

// ─── Vérification de conflits ──────────────────────────────────

export const verifierConflitsSchema = z.object({
    affectationMatiereId: z.string().uuid().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]),
    heureDebut: time(),
    heureFin: time(),
    salleId: z.string().uuid().nullable().optional(),
    /** Exclure un créneau spécifique de la vérification (pour l'édition) */
    excludeCreneauId: z.string().uuid().optional(),
}).refine(heureApresDebut, { message: 'L\'heure de fin doit être après l\'heure de début' });

// ─── Types inférés ─────────────────────────────────────────────

export type CreerCreneauDto = z.infer<typeof creerCreneauSchema>;
export type ModifierCreneauDto = z.infer<typeof modifierCreneauSchema>;
export type QueryCreneauxDto = z.infer<typeof queryCreneauxSchema>;
export type GenererEmploiDuTempsDto = z.infer<typeof genererEmploiDuTempsSchema>;
export type PreferenceEmploiDuTempsDto = z.infer<typeof preferenceEmploiDuTempsSchema>;
export type CreneauImposableDto = z.infer<typeof creneauImposableSchema>;
export type VerifierConflitsDto = z.infer<typeof verifierConflitsSchema>;
