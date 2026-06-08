/**
 * ==================================
 * eLISAschool - DTOs Liens
 * ==================================
 * Version: 1.0.0
 * 
 * Schémas de validation pour les liens groupe-établissement.
 * 
 * Note: removeEtablissementSchema n'est pas utilisé dans le controller
 * car la suppression se fait via les params d'URL (groupeId, etablissementId).
 * Conservé pour référence future si besoin de validation explicite.
 */

import { z } from 'zod';

// Non utilisé actuellement - suppression via params URL
// export const removeEtablissementSchema = z.object({
//     groupeId: z.string().uuid(),
//     etablissementId: z.string().uuid(),
// });

// export type RemoveEtablissementDto = z.infer<typeof removeEtablissementSchema>;
