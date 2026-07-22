import { z } from 'zod';

export const createPosteSchema = z.object({
    intitule: z.string().min(2, "L'intitulé doit contenir au moins 2 caractères").max(100),
    description: z.string().optional(),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50).transform((v) => v.toUpperCase()),
    categoriePosteId: z.string().uuid().optional().or(z.literal('')),
    niveauResponsabiliteId: z.string().uuid().optional().or(z.literal('')),
    typePersonnelId: z.string().uuid().optional().or(z.literal('')),
    fonctionId: z.string().uuid().optional().or(z.literal('')),
    uniteOrganisationnelleId: z.string({ required_error: "L'unité est requise" }),
    nombrePostes: z.coerce.number().int().min(1).default(1),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({ code: true });

export type CreatePosteFormData = z.infer<typeof createPosteSchema>;
export type UpdatePosteFormData = z.infer<typeof updatePosteSchema>;

export const STATUT_POSTE_OPTIONS = [
    { value: 'ACTIF', label: 'Actif' },
    { value: 'VACANT', label: 'Vacant' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'SUPPRIME', label: 'Supprimé' },
];
