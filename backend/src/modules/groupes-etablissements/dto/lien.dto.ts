/**
 * ==================================
 * eLISAschool - DTOs Liens
 * ==================================
 * Version: 1.0.0
 * 
 * Schémas de validation pour les liens groupe-établissement.
 */

import { z } from 'zod';

export const removeEtablissementSchema = z.object({
    groupeId: z.string().uuid(),
    etablissementId: z.string().uuid(),
});

export type RemoveEtablissementDto = z.infer<typeof removeEtablissementSchema>;
