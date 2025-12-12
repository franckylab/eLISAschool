import { z } from 'zod';

export const createMenuSchema = z.object({
    date: z.string(),
    typeRepas: z.enum(['petit-dejeuner', 'dejeuner', 'gouter']).default('dejeuner'),
    platPrincipal: z.string().min(1).max(255),
    accompagnement: z.string().max(255).optional(),
    dessert: z.string().max(255).optional(),
    prix: z.number().min(0),
    allergenes: z.array(z.string()).optional(),
    description: z.string().optional(),
});

export const createInscriptionSchema = z.object({
    eleveId: z.string().uuid(),
    allergies: z.array(z.string()).optional(),
    regimeAlimentaire: z.string().optional(),
});

export const rechargerSoldeSchema = z.object({
    montant: z.number().min(100, 'Montant minimum: 100 FCFA'),
});

export const enregistrerConsommationSchema = z.object({
    inscriptionId: z.string().uuid(),
    menuId: z.string().uuid(),
});

export const queryMenusSchema = z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
});

export type CreateMenuDto = z.infer<typeof createMenuSchema>;
export type CreateInscriptionDto = z.infer<typeof createInscriptionSchema>;
export type RechargerSoldeDto = z.infer<typeof rechargerSoldeSchema>;
export type EnregistrerConsommationDto = z.infer<typeof enregistrerConsommationSchema>;
export type QueryMenusDto = z.infer<typeof queryMenusSchema>;
