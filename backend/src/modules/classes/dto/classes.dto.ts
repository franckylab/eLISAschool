/**
 * ==================================
 * eLISAschool - DTOs Classes
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';
import { TypeClasse, CreneauHoraire } from '../entities/classe.entity';
import { StatutClasseAnnee } from '../entities/classe-annee.entity';

export const createClasseSchema = z.object({
    nom: z.string().min(2).max(100),
    code: z.string().max(50).optional(),
    niveauId: z.string().uuid(),
    filiereId: z.string().uuid().nullable().optional(),
    typeClasse: z.nativeEnum(TypeClasse).default(TypeClasse.NORMALE),
    creneauHoraire: z.nativeEnum(CreneauHoraire).default(CreneauHoraire.MATIN),
    description: z.string().optional(),
    actif: z.boolean().default(true),
    // Champs d'instance annuelle (optionnels — utilisés pour créer le ClasseAnnee)
    anneeScolaireId: z.string().uuid().optional(),
    programmeId: z.string().uuid().nullable().optional(),
    professeurPrincipalId: z.string().uuid().nullable().optional(),
    sallePrincipaleId: z.string().uuid('ID de la salle invalide').optional(),
    effectifMax: z.number().int().min(1).max(200).optional(),
});

export const updateClasseSchema = createClasseSchema.partial();

export const affecterEleveSchema = z.object({
    eleveId: z.string().uuid(),
    classeId: z.string().uuid(),
    dateAffectation: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    motifChangement: z.string().max(100).optional(),
    commentaire: z.string().optional(),
});

export const transfererEleveSchema = z.object({
    eleveId: z.string().uuid(),
    nouvelleClasseId: z.string().uuid(),
    motifChangement: z.string().max(100).default('CHANGEMENT_CLASSE'),
    commentaire: z.string().optional(),
    dateTransfert: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export type CreateClasseDto = z.infer<typeof createClasseSchema>;
export type UpdateClasseDto = z.infer<typeof updateClasseSchema>;
export type AffecterEleveDto = z.infer<typeof affecterEleveSchema>;
export type TransfererEleveDto = z.infer<typeof transfererEleveSchema>;

/**
 * DTOs pour ClasseAnnee
 */
export const createClasseAnneeSchema = z.object({
    classeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
    etablissementId: z.string().uuid(),
    professeurPrincipalId: z.string().uuid().nullable().optional(),
    sallePrincipaleId: z.string().uuid().nullable().optional(),
    effectifMax: z.number().int().min(1).default(50),
    programmeId: z.string().uuid().nullable().optional(),
    notes: z.string().optional(),
});

export const updateClasseAnneeSchema = createClasseAnneeSchema.partial();

export type CreateClasseAnneeDto = z.infer<typeof createClasseAnneeSchema>;
export type UpdateClasseAnneeDto = z.infer<typeof updateClasseAnneeSchema>;

/**
 * Schéma de requête pour la liste des classes
 */
export const queryClassesSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        niveauId: z.string().uuid().optional(),
        anneeScolaireId: z.string().uuid().optional(),
        etablissementId: z.string().uuid().optional(),
        actif: z.string().transform((v) => v === 'true').optional(),
    });

export type QueryClassesDto = z.infer<typeof queryClassesSchema>;
