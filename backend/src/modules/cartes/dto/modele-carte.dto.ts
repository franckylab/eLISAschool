/**
 * ==================================
 * eLISAschool - DTOs ModeleCarte
 * ==================================
 */

import { z } from 'zod';
import { OrientationCarte } from '../entities/modele-carte.entity';

export const createModeleCarteSchema = z.object({
    nom: z.string().min(2).max(100),
    type: z.enum(['SCOLAIRE', 'ACCES', 'CANTINE', 'TRANSPORT', 'BIBLIOTHEQUE']),
    largeur: z.number().default(85.6),
    hauteur: z.number().default(53.98),
    orientation: z.enum(['PORTRAIT', 'PAYSAGE']).default('PORTRAIT'),
    champsAffiches: z.array(z.string()),
    couleurPrimaire: z.string().max(7).default('#1E40AF'),
    couleurSecondaire: z.string().max(7).default('#3B82F6'),
    logoUrl: z.string().max(500).optional(),
    templateHtml: z.string().optional(),
    parDefaut: z.boolean().default(false),
});

export const updateModeleCarteSchema = createModeleCarteSchema.partial();

export type CreateModeleCarteDto = z.infer<typeof createModeleCarteSchema>;
export type UpdateModeleCarteDto = z.infer<typeof updateModeleCarteSchema>;
