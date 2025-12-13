/**
 * ==================================
 * eLISAschool - DTOs Impressions
 * ==================================
 */

import { z } from 'zod';
import { TypeDocument } from '../entities';

export const createModeleSchema = z.object({
    nom: z.string().min(3).max(255),
    type: z.nativeEnum(TypeDocument),
    description: z.string().optional(),
    template: z.string().min(10),
    entete: z.object({
        logoEtablissement: z.boolean().optional(),
        logoElisaschool: z.boolean().optional(),
        nomEtablissement: z.boolean().optional(),
        numeroAdmin: z.boolean().optional(),
        adresse: z.boolean().optional(),
        slogan: z.boolean().optional(),
    }).optional(),
    piedDePage: z.object({
        numeroPage: z.boolean().optional(),
        date: z.boolean().optional(),
        version: z.boolean().optional(),
    }).optional(),
    styles: z.record(z.string()).optional(),
    parDefaut: z.boolean().default(false),
});

export const updateModeleSchema = createModeleSchema.partial();

export const createImpressionSchema = z.object({
    type: z.nativeEnum(TypeDocument),
    modeleId: z.string().uuid().optional(),
    titre: z.string().min(3).max(255),
    donnees: z.record(z.any()).optional(),
    nombreCopies: z.number().min(1).max(100).default(1),
});

export const genererBulletinSchema = z.object({
    eleveId: z.string().uuid(),
    periodeId: z.string().uuid().optional(),
    modeleId: z.string().uuid().optional(),
});

export const genererBulletinsMasseSchema = z.object({
    classeId: z.string().uuid(),
    periodeId: z.string().uuid().optional(),
    modeleId: z.string().uuid().optional(),
});

export type CreateModeleDto = z.infer<typeof createModeleSchema>;
export type UpdateModeleDto = z.infer<typeof updateModeleSchema>;
export type CreateImpressionDto = z.infer<typeof createImpressionSchema>;
export type GenererBulletinDto = z.infer<typeof genererBulletinSchema>;
export type GenererBulletinsMasseDto = z.infer<typeof genererBulletinsMasseSchema>;
