/**
 * ==================================
 * eLISAschool - DTOs Scolarité et Paiements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// ==================================
// Frais de Scolarité
// ==================================

export const createFraisScolariteSchema = z.object({
    anneeScolaireId: z.string().uuid(),
    niveauId: z.string().uuid(),
    cycleId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    classeId: z.string().uuid().optional(),
    fraisInscription: z.number().min(0),
    fraisScolariteAnnuel: z.number().min(0),
    fraisCantineOptionnel: z.number().min(0).optional(),
    fraisTransportOptionnel: z.number().min(0).optional(),
    autresFrais: z.number().min(0).default(0),
    nombreTranches: z.number().int().min(1).max(12).default(3),
    datePremiereEcheance: z.string().date(),
    frequenceEcheance: z.enum(['mensuel', 'trimestriel', 'annuel']).default('mensuel'),
    penaliteRetard: z.number().min(0).max(100).default(0),
    joursGrace: z.number().int().min(0).max(60).default(15),
    remisesPossibles: z.boolean().default(true),
});

export const updateFraisScolariteSchema = createFraisScolariteSchema.partial();

export type CreateFraisScolariteDto = z.infer<typeof createFraisScolariteSchema>;
export type UpdateFraisScolariteDto = z.infer<typeof updateFraisScolariteSchema>;

// ==================================
// Échéancier
// ==================================

export const generateEcheancierSchema = z.object({
    eleveId: z.string().uuid(),
    fraisScolariteId: z.string().uuid().optional(), // Optionnel, sera auto-détecté
});

export type GenerateEcheancierDto = z.infer<typeof generateEcheancierSchema>;

// ==================================
// Paiement
// ==================================

export const createPaiementSchema = z.object({
    eleveId: z.string().uuid(),
    echeancierId: z.string().uuid().optional(),
    montant: z.number().min(0),
    methodePaiement: z.enum(['ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT', 'CHEQUE']),
    referenceTransaction: z.string().max(100).optional(),
    datePaiement: z.string().datetime().optional(),
    observations: z.string().optional(),
});

export const updatePaiementSchema = createPaiementSchema.partial();

export type CreatePaiementDto = z.infer<typeof createPaiementSchema>;
export type UpdatePaiementDto = z.infer<typeof updatePaiementSchema>;

// ==================================
// Remise
// ==================================

export const createRemiseSchema = z.object({
    eleveId: z.string().uuid().optional(),
    fraisScolariteId: z.string().uuid(),
    typeRemise: z.enum(['FRATRIE', 'BOURSE', 'PERSONNEL', 'ANTICIPE', 'AUTRE']),
    scopeRemise: z.enum(['ETABLISSEMENT', 'CYCLE', 'NIVEAU', 'CLASSE', 'SECTION', 'ELEVE']).default('ELEVE'),
    classeId: z.string().uuid().optional(),
    cycleId: z.string().uuid().optional(),
    sectionId: z.string().uuid().optional(),
    pourcentage: z.number().min(0).max(100),
    montant: z.number().min(0),
    motif: z.string().min(10),
}).refine((data) => {
    // Validation conditionnelle selon le scope
    if (data.scopeRemise === 'ELEVE' && !data.eleveId) {
        return false; // eleveId obligatoire pour scope ELEVE
    }
    if (data.scopeRemise === 'CLASSE' && !data.classeId) {
        return false; // classeId obligatoire pour scope CLASSE
    }
    if (data.scopeRemise === 'CYCLE' && !data.cycleId) {
        return false; // cycleId obligatoire pour scope CYCLE
    }
    if (data.scopeRemise === 'SECTION' && !data.sectionId) {
        return false; // sectionId obligatoire pour scope SECTION
    }
    return true;
});

export type CreateRemiseDto = z.infer<typeof createRemiseSchema>;

// ==================================
// Filtres de recherche
// ==================================

export const queryPaiementsSchema = z.object({
    eleveId: z.string().uuid().optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
    methodePaiement: z.enum(['ESPECES', 'MOBILE_MONEY', 'CARTE', 'VIREMENT', 'CHEQUE']).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});

export type QueryPaiementsDto = z.infer<typeof queryPaiementsSchema>;

export const queryEcheanciersSchema = z.object({
    eleveId: z.string().uuid().optional(),
    statut: z.enum(['EN_ATTENTE', 'PAYE', 'PARTIELLEMENT_PAYE', 'ANNULE', 'REMBOURSE']).optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
});

export type QueryEcheanciersDto = z.infer<typeof queryEcheanciersSchema>;
