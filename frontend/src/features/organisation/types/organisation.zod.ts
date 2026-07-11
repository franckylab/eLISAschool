import { z } from 'zod';

export const createOrganisationSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    description: z.string().optional(),
    type: z.enum(['ETABLISSEMENT_SCOLAIRE', 'GROUPE_SCOLAIRE', 'ENTREPRISE', 'ASSOCIATION']).default('ETABLISSEMENT_SCOLAIRE'),
    code: z.string().max(50).optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
    telephone: z.string().max(50).optional(),
    adresse: z.string().optional(),
    siteWeb: z.string().url('URL invalide').optional().or(z.literal('')),
});

export const updateOrganisationSchema = createOrganisationSchema.partial().omit({ code: true });

export const createUniteSchema = z.object({
    nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
    description: z.string().optional(),
    type: z.enum(['DIRECTION', 'DEPARTEMENT', 'SERVICE', 'POLE', 'FILIERE', 'CYCLE', 'SECTION', 'COMMISSION', 'EQUIPE', 'AUTRE']),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50),
    parentId: z.string().optional(),
    ordre: z.coerce.number().int().min(0).default(0),
    responsableNom: z.string().max(200).optional(),
    responsableId: z.string().optional(),
    localisation: z.string().max(100).optional(),
    telephone: z.string().max(50).optional(),
    email: z.string().email('Email invalide').optional().or(z.literal('')),
});

export const updateUniteSchema = createUniteSchema.partial().omit({ code: true });

export const createHierarchieSchema = z.object({
    personnelId: z.string({ required_error: 'Le subordonné est requis' }),
    personnelNom: z.string().min(2).max(200),
    superieurId: z.string({ required_error: 'Le supérieur est requis' }),
    superieurNom: z.string().min(2).max(200),
    typeRelation: z.enum(['SUPERVISE_DIRECT', 'SUPERVISE_INDIRECT', 'RATTACHEMENT_FONCTIONNEL', 'COLLABORATION', 'REMPLACEMENT', 'INTERIM']).default('SUPERVISE_DIRECT'),
    posteId: z.string().optional(),
    posteIntitule: z.string().max(100).optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    commentaire: z.string().optional(),
});

export const updateHierarchieSchema = createHierarchieSchema.partial();

export type CreateOrganisationFormData = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationFormData = z.infer<typeof updateOrganisationSchema>;
export type CreateUniteFormData = z.infer<typeof createUniteSchema>;
export type UpdateUniteFormData = z.infer<typeof updateUniteSchema>;
export type CreateHierarchieFormData = z.infer<typeof createHierarchieSchema>;
export type UpdateHierarchieFormData = z.infer<typeof updateHierarchieSchema>;
