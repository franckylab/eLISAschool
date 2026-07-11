import { z } from 'zod';
import type { TypePoste, NiveauResponsabilite } from './poste.types';

export const createPosteSchema = z.object({
    intitulé: z.string().min(2, "L'intitulé doit contenir au moins 2 caractères").max(100),
    description: z.string().optional(),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50).transform((v) => v.toUpperCase()),
    type: z.enum(['DIRECTION', 'ENSEIGNANT', 'ADMINISTRATIF', 'TECHNIQUE', 'SERVICE', 'STAGE', 'TEMPORAIRE', 'AUTRE'] as const).default('ADMINISTRATIF'),
    niveauResponsabilite: z.enum(['DIRECTION_GENERALE', 'DIRECTION_ADJOINTE', 'RESPONSABLE', 'COORDINATEUR', 'SUPERVISEUR', 'EXECUTANT', 'STAGIAIRE'] as const).default('EXECUTANT'),
    fonctionId: z.string().optional(),
    uniteOrganisationnelleId: z.string({ required_error: "L'unité est requise" }),
    occupantId: z.string().optional(),
    occupantNom: z.string().max(200).optional(),
    nombrePostes: z.coerce.number().int().min(1).default(1),
    modeRemunerationDefaut: z.string().max(30).optional(),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({ code: true });

export const assignerOccupantSchema = z.object({
    occupantId: z.string({ required_error: "L'occupant est requis" }),
    occupantNom: z.string().min(1, "Le nom de l'occupant est requis").max(200),
});

export type CreatePosteFormData = z.infer<typeof createPosteSchema>;
export type UpdatePosteFormData = z.infer<typeof updatePosteSchema>;
export type AssignerOccupantFormData = z.infer<typeof assignerOccupantSchema>;

export const TYPES_POSTE_OPTIONS = [
    { value: 'DIRECTION' as TypePoste, label: 'Direction' },
    { value: 'ENSEIGNANT' as TypePoste, label: 'Enseignant' },
    { value: 'ADMINISTRATIF' as TypePoste, label: 'Administratif' },
    { value: 'TECHNIQUE' as TypePoste, label: 'Technique' },
    { value: 'SERVICE' as TypePoste, label: 'Service' },
    { value: 'STAGE' as TypePoste, label: 'Stage' },
    { value: 'TEMPORAIRE' as TypePoste, label: 'Temporaire' },
    { value: 'AUTRE' as TypePoste, label: 'Autre' },
];

export const NIVEAUX_RESPONSABILITE_OPTIONS = [
    { value: 'DIRECTION_GENERALE' as NiveauResponsabilite, label: 'Direction générale' },
    { value: 'DIRECTION_ADJOINTE' as NiveauResponsabilite, label: 'Direction adjointe' },
    { value: 'RESPONSABLE' as NiveauResponsabilite, label: 'Responsable' },
    { value: 'COORDINATEUR' as NiveauResponsabilite, label: 'Coordinateur' },
    { value: 'SUPERVISEUR' as NiveauResponsabilite, label: 'Superviseur' },
    { value: 'EXECUTANT' as NiveauResponsabilite, label: 'Exécutant' },
    { value: 'STAGIAIRE' as NiveauResponsabilite, label: 'Stagiaire' },
];

export const STATUT_POSTE_OPTIONS = [
    { value: 'ACTIF', label: 'Actif' },
    { value: 'VACANT', label: 'Vacant' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'SUPPRIME', label: 'Supprimé' },
];

export const MODES_REMUNERATION_OPTIONS = [
    { value: 'MENSUEL', label: 'Mensuel' },
    { value: 'HORAIRE', label: 'Horaire' },
    { value: 'MIXTE', label: 'Mixte' },
    { value: 'HEBDOMADAIRE', label: 'Hebdomadaire' },
    { value: 'FORFAIT', label: 'Forfait' },
    { value: 'STAGE', label: 'Stage' },
];
