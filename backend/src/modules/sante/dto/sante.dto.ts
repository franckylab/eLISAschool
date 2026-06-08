/**
 * ==================================
 * eLISAschool - DTOs Module Santé
 * ==================================
 */

import { z } from 'zod';

export const createDossierMedicalSchema = z.object({
    patientId: z.string().uuid(),
    typePatient: z.enum(['ELEVE', 'PERSONNEL']),
    groupeSanguin: z.string().length(5).optional(),
    allergiesConnues: z.array(z.string()).optional(),
    antécédentsMedicaux: z.array(z.string()).optional(),
    traitementsEnCours: z.array(z.string()).optional(),
    handicaps: z.string().optional(),
    contraintesSpeciales: z.string().optional(),
    medecinTraitant: z.string().max(200).optional(),
    telephoneMedecin: z.string().max(50).optional(),
    assuranceMaladie: z.string().max(200).optional(),
    numeroAssurance: z.string().max(50).optional(),
});

export const createConsultationMedicaleSchema = z.object({
    dossierMedicalId: z.string().uuid(),
    type: z.enum(['INFIRMERIE', 'MEDICALE', 'URGENCES', 'SUIVI']),
    motif: z.string().min(5),
    diagnostic: z.string().optional(),
    traitement: z.string().optional(),
    observations: z.string().optional(),
    temperature: z.number().optional(),
    tensionArterielle: z.number().optional(),
    frequenceCardiaque: z.number().optional(),
    poids: z.number().optional(),
    taille: z.number().optional(),
    signaleParent: z.boolean().default(false),
});

export const createIncidentSanteSchema = z.object({
    dossierMedicalId: z.string().uuid(),
    type: z.enum(['ACCIDENT', 'MALAISE', 'MALADIE', 'ALLERGIE', 'AUTRE']),
    gravite: z.enum(['MINEUR', 'MODERE', 'GRAVE', 'CRITIQUE']),
    nature: z.string().min(5).max(200),
    description: z.string().min(10),
    lieu: z.string().max(100).optional(),
    premiersSecours: z.string().optional(),
    suiteDonnee: z.string().optional(),
    hospitalisation: z.boolean().default(false),
    signaleParent: z.boolean().default(false),
});
