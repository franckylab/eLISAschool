import { z } from 'zod';
import { JourSemaine, TypeCreneau } from '../entities';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const timeNormalizer = (v: string) => v.length > 5 ? v.substring(0, 5) : v;
const time = (msg?: string) => z.string().regex(timeRegex, msg || 'Format heure invalide (HH:MM)').transform(timeNormalizer);
const optionalTime = () => time().optional();

function heureApresDebut(data: { heureDebut: string; heureFin: string }): boolean {
    const [h1, m1] = timeNormalizer(data.heureDebut).split(':').map(Number);
    const [h2, m2] = timeNormalizer(data.heureFin).split(':').map(Number);
    return h2 * 60 + m2 > h1 * 60 + m1;
}

export const creerCreneauSchema = z.object({
    classeAnneeId: z.string().uuid('ID de la classe/année invalide'),
    matiereId: z.string().uuid('ID de la matière invalide'),
    enseignantId: z.string().uuid('ID de l\'enseignant invalide'),
    salleId: z.string().uuid('ID de la salle invalide').optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]),
    heureDebut: time('Format heure invalide (HH:MM)'),
    heureFin: time('Format heure invalide (HH:MM)'),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).default('COURS'),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
    periodeId: z.string().uuid().optional(),
}).refine(heureApresDebut, { message: 'L\'heure de fin doit être après l\'heure de début' });

export const modifierCreneauSchema = z.object({
    matiereId: z.string().uuid().optional(),
    enseignantId: z.string().uuid().optional(),
    salleId: z.string().uuid().nullable().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).optional(),
    heureDebut: optionalTime(),
    heureFin: optionalTime(),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).optional(),
    couleur: z.string().length(7).nullable().optional(),
    notes: z.string().max(1000).optional(),
    actif: z.boolean().optional(),
}).refine(data => {
    if (data.heureDebut && data.heureFin) return heureApresDebut(data as { heureDebut: string; heureFin: string });
    return true;
}, { message: 'L\'heure de fin doit être après l\'heure de début' });

export const queryCreneauxSchema = z.object({
    classeAnneeId: z.string().uuid().optional(),
    enseignantId: z.string().uuid().optional(),
    salleId: z.string().uuid().optional(),
    matiereId: z.string().uuid().optional(),
    jour: z.enum(Object.values(JourSemaine) as [string, ...string[]]).optional(),
    typeCreneau: z.enum(Object.values(TypeCreneau) as [string, ...string[]]).optional(),
    anneeScolaireId: z.string().uuid().optional(),
    actif: z.coerce.boolean().optional(),
    genereAutomatiquement: z.coerce.boolean().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    inclureHeuresCours: z.coerce.boolean().optional(),
    typeSource: z.enum(['edt', 'heure_cours']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    orderBy: z.enum(['jour', 'heureDebut', 'createdAt', 'matiereId']).default('jour'),
    orderDir: z.enum(['ASC', 'DESC']).default('ASC'),
});

export const genererEmploiDuTempsSchema = z.object({
    classeAnneeId: z.string().uuid('ID de la classe/année invalide'),
    options: z.object({
        regenerer: z.boolean().default(false),
        respecterContraintes: z.boolean().default(true),
    }).optional(),
});

const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).optional();
const optionalStringArray = () => z.array(z.string()).min(1).max(7).optional();

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
    pauseDebut: time().nullable().optional(),
    pauseFin: time().nullable().optional(),
    repartitionEquilibree: z.boolean().optional(),
}).transform((data) => {
    const normalized = { ...data } as any;
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

export type CreerCreneauDto = z.infer<typeof creerCreneauSchema>;
export type ModifierCreneauDto = z.infer<typeof modifierCreneauSchema>;
export type QueryCreneauxDto = z.infer<typeof queryCreneauxSchema>;
export type GenererEmploiDuTempsDto = z.infer<typeof genererEmploiDuTempsSchema>;
export type PreferenceEmploiDuTempsDto = z.infer<typeof preferenceEmploiDuTempsSchema>;

export const createRepartitionHoraireSchemaBase = z.object({
    affectationId: z.string().uuid('ID de l\'affectation invalide'),
    jourSemaine: z.enum(Object.values(JourSemaine) as [string, ...string[]]),
    heureDebut: time('Format heure invalide (HH:MM)'),
    heureFin: time('Format heure invalide (HH:MM)'),
    salleId: z.string().uuid('ID de la salle invalide').optional(),
    periodeId: z.string().uuid('ID de la période invalide').optional(),
    actif: z.boolean().default(true),
});

export const createRepartitionHoraireSchema = createRepartitionHoraireSchemaBase.refine(heureApresDebut, {
    message: 'L\'heure de fin doit être après l\'heure de début'
});

export const updateRepartitionHoraireSchema = createRepartitionHoraireSchemaBase.partial().extend({
    actif: z.boolean().optional(),
}).refine(data => {
    if (data.heureDebut && data.heureFin) return heureApresDebut(data as { heureDebut: string; heureFin: string });
    return true;
}, { message: 'L\'heure de fin doit être après l\'heure de début' });

export type CreateRepartitionHoraireDto = z.infer<typeof createRepartitionHoraireSchema>;
export type UpdateRepartitionHoraireDto = z.infer<typeof updateRepartitionHoraireSchema>;
