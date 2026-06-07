/**
 * ==================================
 * eLISAschool - DTOs Rapports de Validation
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Schémas Zod et types pour la génération de rapports de validation
 */

import { z } from 'zod';

/**
 * Schéma pour générer un rapport de validation
 */
export const generateRapportSchema = z.object({
    module: z.string().optional(),
    periodeDebut: z.string().datetime(),
    periodeFin: z.string().datetime(),
    validateurId: z.string().uuid().optional(),
    etablissementId: z.string().uuid().optional(),
});

/**
 * Schéma pour l'export de rapports
 */
export const exportRapportSchema = z.object({
    format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

export type GenerateRapportDto = z.infer<typeof generateRapportSchema>;
export type ExportRapportDto = z.infer<typeof exportRapportSchema>;

/**
 * Interface du rapport de validation
 */
export interface RapportValidation {
    periode: { 
        debut: Date; 
        fin: Date; 
        label: string;
    };
    module: string;
    statistiques: {
        total: number;
        enCours: number;
        completees: number;
        rejetees: number;
        tauxCompletion: number;
        tempsMoyenHeures: number;
    };
    details: DetailValidateur[];
    generePar: string;
    genereAt: Date;
}

/**
 * Détails par validateur
 */
export interface DetailValidateur {
    validateurId: string;
    validateurNom: string;
    nombreTraitees: number;
    tempsMoyenHeures: number;
}
