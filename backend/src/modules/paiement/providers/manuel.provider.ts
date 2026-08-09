/**
 * ==================================
 * eLISAschool - Provider Manuel
 * ==================================
 * 
 * Paiement manuel — Saisie manuelle après vérification bancaire.
 * Permet aux administrateurs de confirmer les paiements reçus
 * par virement bancaire, dépôt, ou autre moyen hors-ligne.
 * 
 * Phase D.1 — Refonte SaaS v2
 */

import { PaymentProvider, InitierPaiementDTO, PaiementResult, StatutPaiement, WebhookResult, RemboursementResult } from './payment-provider.interface';
import { logger } from '@common/utils/logger.util';
import crypto from 'crypto';

export class ManuelProvider implements PaymentProvider {
    readonly name = 'manuel';
    readonly displayName = 'Paiement Manuel';
    readonly supportedMethods = ['bank_transfer'] as const;

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            // Générer une référence unique pour le paiement manuel
            const reference = dto.reference || `MAN-${Date.now()}`;

            logger.info(
                `[Manuel] Paiement manuel initié — Réf: ${reference} ` +
                `— Montant: ${dto.montant} ${dto.devise} — Description: ${dto.description}`
            );

            // Retourner les instructions de paiement
            return {
                success: true,
                reference,
                statut: 'EN_ATTENTE',
                message: 'Paiement en attente de vérification manuelle. ' +
                    'Veuillez effectuer le virement et contacter l\'administration pour confirmation.',
                metadata: {
                    instructionsBancaires: credentials.instructionsBancaires || {
                        banque: credentials.banque || 'Non configuré',
                        rib: credentials.rib || 'Non configuré',
                        titulaire: credentials.titulaire || 'eLISAschool',
                    },
                    referenceVirement: reference,
                },
            };
        } catch (error) {
            logger.error('[Manuel] Erreur initierPaiement:', error);
            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur paiement manuel',
            };
        }
    }

    async verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement> {
        // Le statut est géré manuellement par l'admin via la base de données
        // Ce provider ne fait pas d'appel API
        return {
            reference,
            statut: 'EN_ATTENTE',
        };
    }

    async traiterWebhook(_payload: any, _signature: string | undefined, _credentials: Record<string, any>): Promise<WebhookResult> {
        // Pas de webhook pour le paiement manuel
        return {
            success: false,
            webhookId: crypto.randomUUID(),
            statut: 'ECHEC',
            message: 'Le paiement manuel ne supporte pas les webhooks. Utilisez la confirmation manuelle.',
        };
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        // Remboursement manuel — nécessite une action humaine
        logger.info(
            `[Manuel] Remboursement manuel demandé — Réf: ${reference} — Montant: ${montant}`
        );

        return {
            success: true,
            reference,
            montantRembourse: montant,
            statut: 'EN_ATTENTE',
            message: 'Remboursement en attente de traitement manuel par l\'administration.',
        };
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        // Le provider manuel est toujours configuré (pas de clé API nécessaire)
        return true;
    }
}
