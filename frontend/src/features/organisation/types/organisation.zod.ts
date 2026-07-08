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

export const createPosteSchema = z.object({
    intitulé: z.string().min(2, "L'intitulé doit contenir au moins 2 caractères").max(100),
    description: z.string().optional(),
    code: z.string().min(2, 'Le code doit contenir au moins 2 caractères').max(50),
    type: z.enum(['DIRECTION', 'ENSEIGNANT', 'ADMINISTRATIF', 'TECHNIQUE', 'SERVICE', 'STAGE', 'TEMPORAIRE', 'AUTRE']).default('ADMINISTRATIF'),
    niveauResponsabilite: z.enum(['DIRECTION_GENERALE', 'DIRECTION_ADJOINTE', 'RESPONSABLE', 'COORDINATEUR', 'SUPERVISEUR', 'EXECUTANT', 'STAGIAIRE']).default('EXECUTANT'),
    uniteOrganisationnelleId: z.string({ required_error: "L'unité est requise" }),
    occupantId: z.string().optional(),
    occupantNom: z.string().max(200).optional(),
    nombrePostes: z.coerce.number().int().min(1).default(1),
    superviseurId: z.string().optional(),
    superviseurNom: z.string().max(200).optional(),
    competencesRequises: z.array(z.string()).optional(),
    missions: z.array(z.string()).optional(),
});

export const updatePosteSchema = createPosteSchema.partial().omit({ code: true });

export const assignerOccupantSchema = z.object({
    occupantId: z.string({ required_error: "L'occupant est requis" }),
    occupantNom: z.string().min(1, "Le nom de l'occupant est requis").max(200),
});

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
export type CreatePosteFormData = z.infer<typeof createPosteSchema>;
export type UpdatePosteFormData = z.infer<typeof updatePosteSchema>;
export type AssignerOccupantFormData = z.infer<typeof assignerOccupantSchema>;
export type CreateHierarchieFormData = z.infer<typeof createHierarchieSchema>;
export type UpdateHierarchieFormData = z.infer<typeof updateHierarchieSchema>;
