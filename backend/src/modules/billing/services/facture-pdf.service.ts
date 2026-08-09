/**
 * ==================================
 * eLISAschool - Service Export PDF Factures
 * ==================================
 * 
 * Prépare les données de facture pour l'export PDF.
 * Format structuré conforme OHADA pour génération côté frontend (jsPDF).
 * 
 * Phase P1.4 — Refonte SaaS v4
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { Facture, StatutFacture } from '../entities/facture.entity';
import { LigneFacture, TypeLigneFacture } from '../entities/ligne-facture.entity';
import { AbonnementClient } from '../entities/abonnement-client.entity';
import { AppError } from '@common/filters/error.filter';

// =============================================
// TYPES
// =============================================

export interface FacturePdfData {
    // En-tête plateforme
    plateforme: {
        nom: string;
        adresse: string;
        telephone: string;
        email: string;
        logo?: string;
        rcNumber?: string;
        niu?: string;
    };
    // Informations facture
    facture: {
        numero: string;
        numeroOHADA: string;
        dateEmission: string;
        dateEcheance: string;
        datePaiement?: string;
        statut: string;
        statutLabel: string;
        devise: string;
    };
    // Client (établissement)
    client: {
        id: string;
        nom: string;
        adresse?: string;
        telephone?: string;
        email?: string;
    };
    // Abonnement
    abonnement: {
        planNom: string;
        cycleFacturation: string;
        dateDebut: string;
        dateFin: string;
    };
    // Lignes de facture
    lignes: Array<{
        description: string;
        type: string;
        typeLabel: string;
        quantite: number;
        montantUnitaire: number;
        montantTotal: number;
        ordre: number;
    }>;
    // Totaux
    totaux: {
        montantBase: number;
        montantTranches: number;
        montantOptions: number;
        montantPenalites: number;
        montantHT: number;
        montantTVA: number;
        tauxTVA: string; // Ex: "19.25%"
        montantTotal: number;
        montantPaye: number;
        montantRestant: number;
    };
    // Mentions légales
    mentionsLegales: string;
    // Conditions de paiement
    conditionsPaiement: string;
    // Notes
    notes?: string;
    // Pied de page
    piedPage: {
        genereLe: string;
        generePar: string;
    };
}

// =============================================
// SERVICE
// =============================================

export class FacturePdfService {
    private factureRepo: Repository<Facture>;

    constructor() {
        this.factureRepo = AppDataSource.getRepository(Facture);
    }

    /**
     * Prépare les données complètes d'une facture pour génération PDF.
     */
    async preparerDonneesPdf(factureId: string): Promise<FacturePdfData> {
        const facture = await this.factureRepo.findOne({
            where: { id: factureId },
            relations: ['lignes', 'abonnement', 'abonnement.plan'],
        });

        if (!facture) {
            throw new AppError('Facture introuvable', 404, 'FACTURE_NOT_FOUND');
        }

        const abonnement = facture.abonnement;
        const plan = abonnement?.plan;

        // Labels des statuts
        const statutLabels: Record<string, string> = {
            BROUILLON: 'Brouillon',
            EMISE: 'Émise',
            PAYEE: 'Payée',
            EN_RETARD: 'En retard',
            PARTIELLEMENT_PAYEE: 'Partiellement payée',
            ANNULEE: 'Annulée',
            EN_PAIEMENT: 'En cours de paiement',
            AVOIR: 'Avoir',
        };

        const typeLigneLabels: Record<string, string> = {
            BASE: 'Abonnement de base',
            TRANCHE: 'Tranche supplémentaire',
            OPTION: 'Module optionnel',
            PENALITE: 'Pénalité de retard',
            REMISE: 'Réduction',
            PRORATA: 'Prorata temporis',
        };

        // Construire les lignes
        const lignes = (facture.lignes || [])
            .sort((a, b) => a.ordre - b.ordre)
            .map(ligne => ({
                description: ligne.description,
                type: ligne.type,
                typeLabel: typeLigneLabels[ligne.type] || ligne.type,
                quantite: Number(ligne.quantite),
                montantUnitaire: Number(ligne.montant),
                montantTotal: Number(ligne.total),
                ordre: ligne.ordre,
            }));

        // Taux TVA formaté
        const tauxTVA = `${(facture.tauxTVA / 100).toFixed(2)}%`;

        // Montant restant
        const montantRestant = facture.montantTotal - facture.montantPaye;

        return {
            plateforme: {
                nom: 'eLISAschool',
                adresse: 'Douala, Cameroun',
                telephone: '+237 6XX XXX XXX',
                email: 'contact@elisaschool.com',
                rcNumber: 'RC-DLA-2024-B-00XXX',
                niu: 'P0XXXXXXX',
            },
            facture: {
                numero: facture.numero,
                numeroOHADA: facture.numeroOHADA || facture.numero,
                dateEmission: new Date(facture.dateEmission).toLocaleDateString('fr-FR'),
                dateEcheance: new Date(facture.dateEcheance).toLocaleDateString('fr-FR'),
                datePaiement: facture.datePaiement
                    ? new Date(facture.datePaiement).toLocaleDateString('fr-FR')
                    : undefined,
                statut: facture.statut,
                statutLabel: statutLabels[facture.statut] || facture.statut,
                devise: facture.devise,
            },
            client: {
                id: facture.etablissementId,
                nom: `Établissement ${facture.etablissementId.substring(0, 8)}`,
            },
            abonnement: {
                planNom: plan?.nom || 'N/A',
                cycleFacturation: abonnement?.cycleFacturation || 'MENSUEL',
                dateDebut: abonnement?.dateDebut
                    ? new Date(abonnement.dateDebut).toLocaleDateString('fr-FR')
                    : 'N/A',
                dateFin: abonnement?.dateFin
                    ? new Date(abonnement.dateFin).toLocaleDateString('fr-FR')
                    : 'N/A',
            },
            lignes,
            totaux: {
                montantBase: facture.montantBase,
                montantTranches: facture.montantTranches,
                montantOptions: facture.montantOptions,
                montantPenalites: facture.montantPenalites,
                montantHT: facture.montantHT,
                montantTVA: facture.montantTVA,
                tauxTVA,
                montantTotal: facture.montantTotal,
                montantPaye: facture.montantPaye,
                montantRestant,
            },
            mentionsLegales: facture.mentionsLegales || '',
            conditionsPaiement:
                'Paiement à 30 jours. Passé ce délai, des pénalités de retard seront appliquées. ' +
                'Conformément aux dispositions OHADA.',
            notes: facture.notes || undefined,
            piedPage: {
                genereLe: new Date().toLocaleDateString('fr-FR'),
                generePar: 'eLISAschool Platform',
            },
        };
    }

    /**
     * Formate un montant en XAF pour affichage.
     */
    static formaterMontant(montant: number, devise: string = 'XAF'): string {
        return new Intl.NumberFormat('fr-FR', {
            style: 'decimal',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(montant) + ` ${devise}`;
    }
}

export default FacturePdfService;
