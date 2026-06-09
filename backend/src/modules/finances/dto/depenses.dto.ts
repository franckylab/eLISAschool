/**
 * ==================================
 * eLISAschool - DTOs Dépenses
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { z } from 'zod';

// ==================================
// Catégories de Dépenses
// ==================================

export const createCategorieDepenseSchema = z.object({
    code: z.string().min(3).max(10).toUpperCase(),
    libelle: z.string().min(3).max(100),
    type: z.enum(['CHARGE_FIXE', 'CHARGE_VARIABLE', 'INVESTISSEMENT']),
    compteComptableCharge: z.string().regex(/^[0-9]{6}$/),
    compteComptableTVA: z.string().regex(/^[0-9]{6}$/).default('445660'),
    budgetAnnuel: z.number().min(0).optional(),
    responsableId: z.string().uuid().optional(),
});

export const updateCategorieDepenseSchema = createCategorieDepenseSchema.partial();

export type CreateCategorieDepenseDto = z.infer<typeof createCategorieDepenseSchema>;
export type UpdateCategorieDepenseDto = z.infer<typeof updateCategorieDepenseSchema>;

// ==================================
// Dépenses
// ==================================

export const createDepenseSchema = z.object({
    categorieDepenseId: z.string().uuid(),
    libelle: z.string().min(3).max(255),
    montantHT: z.number().min(0),
    tva: z.number().min(0).max(100).default(19.25),
    dateFacture: z.string().date(),
    dateEcheance: z.string().date().optional(),
    fournisseur: z.string().min(2).max(150),
    methodePaiement: z.enum(['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE']),
    referenceFacture: z.string().max(100).optional(),
    justificatifPath: z.string().optional(),
    referenceTransaction: z.string().max(100).optional(),
    observations: z.string().optional(),
});

export const updateDepenseSchema = createDepenseSchema.partial();

export const payerDepenseSchema = z.object({
    montantPaye: z.number().min(0),
    methodePaiement: z.enum(['ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE']),
    referenceTransaction: z.string().max(100).optional(),
    datePaiement: z.string().datetime().optional(),
});

export type CreateDepenseDto = z.infer<typeof createDepenseSchema>;
export type UpdateDepenseDto = z.infer<typeof updateDepenseSchema>;
export type PayerDepenseDto = z.infer<typeof payerDepenseSchema>;

// ==================================
// Demandes de Dépenses
// ==================================

export const createDemandeDepenseSchema = z.object({
    categorieDepenseId: z.string().uuid(),
    libelle: z.string().min(3).max(255),
    montantEstime: z.number().min(0),
    urgence: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE']).default('MOYENNE'),
    justification: z.string().min(10),
});

export const validerDemandeSchema = z.object({
    decision: z.enum(['APPROUVEE', 'REJETEE']),
    motifRejet: z.string().optional(),
});

export type CreateDemandeDepenseDto = z.infer<typeof createDemandeDepenseSchema>;
export type ValiderDemandeDto = z.infer<typeof validerDemandeSchema>;

// ==================================
// Bons de Commande
// ==================================

export const createBonCommandeSchema = z.object({
    fournisseur: z.string().min(2).max(150),
    dateCommande: z.string().date(),
    dateLivraisonPrevue: z.string().date().optional(),
    articles: z.array(z.object({
        description: z.string().min(3).max(255),
        quantite: z.number().int().min(1),
        prixUnitaire: z.number().min(0),
        montantTotal: z.number().min(0),
    })).min(1),
});

export type CreateBonCommandeDto = z.infer<typeof createBonCommandeSchema>;

// ==================================
// Factures Fournisseur
// ==================================

export const createFactureFournisseurSchema = z.object({
    numeroFacture: z.string().min(1).max(100),
    depenseId: z.string().uuid().optional(),
    fournisseur: z.string().min(2).max(150),
    dateFacture: z.string().date(),
    dateEcheance: z.string().date().optional(),
    montantHT: z.number().min(0),
    tva: z.number().min(0).max(100).default(19.25),
    montantTTC: z.number().min(0),
    pdfPath: z.string().optional(),
});

export type CreateFactureFournisseurDto = z.infer<typeof createFactureFournisseurSchema>;

// ==================================
// Filtres de recherche
// ==================================

export const queryDepensesSchema = z.object({
    categorieDepenseId: z.string().uuid().optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
    statut: z.enum(['BROUILLON', 'VALIDEE', 'PAYEE', 'PARTIELLEMENT_PAYEE', 'ANNULEE']).optional(),
    fournisseur: z.string().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});

export type QueryDepensesDto = z.infer<typeof queryDepensesSchema>;

export const queryDemandesSchema = z.object({
    statut: z.enum(['BROUILLON', 'SOUMISE', 'APPROUVEE', 'REJETEE', 'ANNULEE']).optional(),
    urgence: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE']).optional(),
    dateDebut: z.string().date().optional(),
    dateFin: z.string().date().optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
});

export type QueryDemandesDto = z.infer<typeof queryDemandesSchema>;
