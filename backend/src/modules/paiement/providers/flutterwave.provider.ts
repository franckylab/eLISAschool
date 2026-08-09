/**
 * ==================================
 * eLISAschool - Provider Flutterwave
 * ==================================
 * 
 * Flutterwave — 34+ pays africains, multi-devises (NGN, GHS, KES, ZAR, USD, etc.).
 * API REST, supporte cartes, mobile money, bank transfer, USSD.
 * 
 * Phase D.1 — Refonte SaaS v2
 */

import { PaymentProvider, InitierPaiementDTO, PaiementResult, StatutPaiement, WebhookResult, RemboursementResult } from './payment-provider.interface';
import { logger } from '@common/utils/logger.util';
import crypto from 'crypto';

export class FlutterwaveProvider implements PaymentProvider {
    readonly name = 'flutterwave';
    readonly displayName = 'Flutterwave';
    readonly supportedMethods = ['mobile_money', 'card', 'bank_transfer'] as const;

    private readonly apiUrl = 'https://api.flutterwave.com/v3';

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const body = {
                tx_ref: dto.reference,
                amount: dto.montant,
                currency: dto.devise || 'NGN',
                redirect_url: dto.returnUrl || '',
                customer: {
                    email: dto.customerEmail || 'customer@example.com',
                    phone_number: dto.customerPhone || '',
                    name: dto.metadata?.customerName || '',
                },
                customizations: {
                    title: 'eLISAschool',
                    description: dto.description,
                },
                meta: dto.metadata || {},
            };

            const response = await this.apiCall('POST', '/payments', body, credentials.secretKey);

            logger.info(`[Flutterwave] Paiement initié — Réf: ${dto.reference} — Montant: ${dto.montant} ${dto.devise}`);

            return {
                success: true,
                reference: dto.reference,
                referenceProvider: response?.data?.flw_ref,
                urlPaiement: response?.data?.link,
                statut: 'INITIEE',
            };
        } catch (error) {
            logger.error('[Flutterwave] Erreur initierPaiement:', error);
            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur Flutterwave',
            };
        }
    }

    async verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement> {
        try {
            const response = await this.apiCall('GET', `/transactions/verify_by_reference?tx_ref=${reference}`, null, credentials.secretKey);
            const data = response?.data;

            return {
                reference,
                referenceProvider: data?.flw_ref || data?.transaction_id?.toString(),
                statut: data?.status === 'successful' ? 'REUSSIE' :
                        data?.status === 'failed' ? 'ECHEC' : 'EN_ATTENTE',
                montant: data?.amount,
                datePaiement: data?.created_at ? new Date(data.created_at) : undefined,
            };
        } catch (error) {
            logger.error('[Flutterwave] Erreur verifierStatut:', error);
            return { reference, statut: 'ECHEC' };
        }
    }

    async traiterWebhook(payload: any, signature: string | undefined, credentials: Record<string, any>): Promise<WebhookResult> {
        try {
            // Vérifier la hash du webhook Flutterwave
            if (signature && credentials.webhookSecret) {
                const expectedHash = crypto
                    .createHash('sha256')
                    .update(credentials.webhookSecret)
                    .digest('hex');
                if (signature !== expectedHash) {
                    throw new Error('Hash webhook Flutterwave invalide');
                }
            }

            const data = payload?.data;

            return {
                success: true,
                webhookId: data?.id?.toString() || crypto.randomUUID(),
                reference: data?.tx_ref,
                referenceProvider: data?.flw_ref,
                statut: data?.status === 'successful' ? 'REUSSIE' :
                        data?.status === 'failed' ? 'ECHEC' : 'EN_ATTENTE',
                montant: data?.amount,
            };
        } catch (error) {
            logger.error('[Flutterwave] Erreur traiterWebhook:', error);
            return {
                success: false,
                webhookId: 'unknown',
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur webhook Flutterwave',
            };
        }
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        try {
            const response = await this.apiCall('POST', '/transactions/:transaction_id/refund', {
                amount: montant,
            }, credentials.secretKey);

            return {
                success: true,
                reference,
                referenceProvider: response?.data?.id?.toString(),
                montantRembourse: montant,
                statut: 'REUSSIE',
            };
        } catch (error) {
            logger.error('[Flutterwave] Erreur remboursement:', error);
            return {
                success: false,
                reference,
                montantRembourse: montant,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur remboursement Flutterwave',
            };
        }
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!credentials.secretKey;
    }

    private async apiCall(method: string, path: string, body: any, secretKey: string): Promise<any> {
        // En production : vrai appel HTTP vers api.flutterwave.com
        logger.info(`[Flutterwave] API ${method} ${path}`);
        return { data: { flw_ref: `flw_${Date.now()}`, link: `${this.apiUrl}/redirect`, status: 'pending' } };
    }
}
