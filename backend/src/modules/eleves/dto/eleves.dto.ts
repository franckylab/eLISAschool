/**
 * ==================================
 * eLISAschool - DTOs Élèves
 * ==================================
 * Version: 2.0.0
 */

import { z } from 'zod';
import { SousSysteme } from '@modules/etablissement/entities';
import { paginationWithSortSchema, searchSchema } from '@common/dto/pagination.dto';

export const createEleveSchema = z.object({
    utilisateurId: z.string().uuid(),
    matricule: z.string().min(2).max(50),
    dateNaissance: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    lieuNaissance: z.string().min(2).max(100),
    sexe: z.enum(['M', 'F']),
    nationalite: z.string().optional(),
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    nomPere: z.string().optional(),
    nomMere: z.string().optional(),
    nomTuteur: z.string().optional(),
    telephoneTuteur: z.string().optional(),
    dateInscription: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const updateEleveSchema = createEleveSchema.partial().omit({ utilisateurId: true }).extend({
    statut: z.enum(['ACTIF', 'EXCLU', 'ABANDON', 'DIPLOME']).optional(),
    etatDossier: z.enum(['COMPLET', 'INCOMPLET']).optional(),
});

export type CreateEleveDto = z.infer<typeof createEleveSchema>;
export type UpdateEleveDto = z.infer<typeof updateEleveSchema>;

/**
 * Schéma de requête pour la liste des élèves
 */
export const queryElevesSchema = paginationWithSortSchema
    .merge(searchSchema)
    .extend({
        sousSysteme: z.nativeEnum(SousSysteme).optional(),
        classeId: z.string().uuid().optional(),
        statut: z.enum(['ACTIF', 'EXCLU', 'ABANDON', 'DIPLOME']).optional(),
        etablissementId: z.string().uuid().optional(),
    });

export type QueryElevesDto = z.infer<typeof queryElevesSchema>;

// ==================================
// PRÉINSCRIPTION (Formulaire public enrichi)
// ==================================

export const preinscriptionSchema = z.object({
    // ==================================
    // INFORMATIONS ÉLÈVE (complètes)
    // ==================================
    nom: z.string().min(2).max(100),
    prenom: z.string().min(2).max(100),
    dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lieuNaissance: z.string().min(2).max(100),
    sexe: z.enum(['M', 'F']),
    nationalite: z.string().optional(),
    sousSysteme: z.nativeEnum(SousSysteme).default(SousSysteme.FRANCOPHONE),
    
    // Identification additionnelle
    photo: z.string().url().optional(),
    groupeSanguin: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    allergies: z.array(z.string()).optional(),
    
    // Contact d'urgence
    nomContactUrgence: z.string().optional(),
    telephoneContactUrgence: z.string().optional(),
    
    // Adresse complète
    adresseDomicile: z.string().optional(),
    ville: z.string().optional(),
    quartier: z.string().optional(),
    
    // Historique scolaire
    ecoleProvenance: z.string().optional(),
    classeAnterieure: z.string().optional(),
    redoublement: z.boolean().default(false).optional(),
    
    // Situation particulière
    boursier: z.boolean().default(false).optional(),
    regimeInterne: z.boolean().default(false).optional(),
    
    // ==================================
    // INFORMATIONS PARENTS/RESPONSABLES (complètes)
    // ==================================
    
    // Père
    nomPere: z.string().optional(),
    professionPere: z.string().optional(),
    telephonePere: z.string().optional(),
    emailPere: z.string().email().optional(),
    adressePere: z.string().optional(),
    
    // Mère
    nomMere: z.string().optional(),
    professionMere: z.string().optional(),
    telephoneMere: z.string().optional(),
    emailMere: z.string().email().optional(),
    adresseMere: z.string().optional(),
    
    // Tuteur légal (si différent des parents)
    nomTuteur: z.string().optional(),
    lienParenteTuteur: z.string().optional(), // 'ONCLE', 'TANTE', 'GRAND_PERE', etc.
    professionTuteur: z.string().optional(),
    telephoneTuteur: z.string().optional(),
    emailTuteur: z.string().email().optional(),
    adresseTuteur: z.string().optional(),
    
    // Contact principal pour notifications
    email: z.string().email().optional(), // Email principal du responsable
    
    // ==================================
    // INFORMATIONS ÉTABLISSEMENT
    // ==================================
    classeSouhaiteeId: z.string().uuid(),
    codeEtablissement: z.string().min(2), // Pour résoudre l'établissement
    
    // ==================================
    // DOCUMENTS JUSTIFICATIFS (optionnel)
    // ==================================
    documentsJustificatifs: z.array(z.object({
        url: z.string().url(),
        type: z.string(), // 'ACTE_NAISSANCE', 'PHOTO', 'CERTIFICAT_SCOLAIRE', etc.
        nom: z.string().optional(),
    })).optional(),
    
    // ==================================
    // INFORMATIONS COMPLÉMENTAIRES
    // ==================================
    commentaire: z.string().optional(), // Remarques particulières
    situationFamiliale: z.string().optional(), // 'MARIES', 'DIVORCES', 'VEUF', etc.
    personneAutorisee: z.string().optional(), // Personne autorisée à récupérer l'élève
    transportScolaire: z.boolean().default(false).optional(),
    cantine: z.boolean().default(false).optional(),
});

export type PreinscriptionDto = z.infer<typeof preinscriptionSchema>;

// ==================================
// CONVERSION PRÉINSCRIPTION → INSCRIPTION
// ==================================

export const convertirPreinscriptionSchema = z.object({
    classeId: z.string().uuid(),
    anneeScolaireId: z.string().uuid(),
});

export type ConvertirPreinscriptionDto = z.infer<typeof convertirPreinscriptionSchema>;

// ==================================
// FILTRES INSCRIPTIONS
// ==================================

export const queryInscriptionsSchema = paginationWithSortSchema
    .extend({
        etatInscription: z.enum(['BROUILLON', 'COMPLET', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'REFUSE']).optional(),
        typeInscription: z.enum(['AUTO', 'MANUELLE', 'PORTAIL']).optional(),
        estPreinscription: z.boolean().optional(),
        dateDebut: z.string().date().optional(),
        dateFin: z.string().date().optional(),
    });

export type QueryInscriptionsDto = z.infer<typeof queryInscriptionsSchema>;
