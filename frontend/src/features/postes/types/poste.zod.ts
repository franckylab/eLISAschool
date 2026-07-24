import { z } from 'zod';

export const createPosteSchema = z.object({
    intitule: z.string().min(2, "L'intitulé doit contenir au moins 2 caractères").max(100),
    description: z.string().optional(),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50).transform((v) => v.toUpperCase()),
    niveauResponsabiliteId: z.string().uuid().optional().or(z.literal('')),
    fonctionId: z.string({ required_error: 'La fonction est requise' }).uuid(),
    uniteOrganisationnelleId: z.string({ required_error: "L'unité est requise" }),
    nombrePostes: z.coerce.number().int().min(1).default(1),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({ code: true });

export type CreatePosteFormData = z.infer<typeof createPosteSchema>;
export type UpdatePosteFormData = z.infer<typeof updatePosteSchema>;

export const STATUT_POSTE_OPTIONS = [
    { value: 'ACTIF', labelKey: 'statutPoste_ACTIF' },
    { value: 'VACANT', labelKey: 'statutPoste_VACANT' },
    { value: 'EN_ATTENTE', labelKey: 'statutPoste_EN_ATTENTE' },
    { value: 'SUPPRIME', labelKey: 'statutPoste_SUPPRIME' },
];
