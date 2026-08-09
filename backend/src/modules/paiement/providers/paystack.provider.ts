/**
 * ==================================
 * eLISAschool - Provider Paystack
 * ==================================
 * 
 * Paystack — Cartes bancaires + mobile money (Nigeria, Ghana, Afrique du Sud).
 * API REST, supporte NGN, GHS, USD, ZAR.
 * 
 * Phase D.1 — Refonte SaaS v2
 */

import { PaymentProvider, InitierPaiementDTO, PaiementResult, StatutPaiement, WebhookResult, RemboursementResult } from './payment-provider.interface';
import { logger } from '@common/utils/logger.util';
import crypto from 'crypto';

export class PaystackProvider implements PaymentProvider {
    readonly name = 'paystack';
    readonly displayName = 'Paystack';
    readonly supportedMethods = ['mobile_money', 'card'] as const;

    private readonly apiUrl = 'https://api.paystack.co';

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const body = {
                amount: dto.montant * 100, // Paystack utilise les kobo/stotter
                currency: dto.devise || 'NGN',
                email: dto.customerEmail || 'customer@example.com',
                reference: dto.reference,
                callback_url: dto.returnUrl || '',
                metadata: {
                    description: dto.description,
                    ...(dto.metadata || {}),
                },
                channels: ['card', 'mobile_money'],
            };

            const response = await this.apiCall('POST', '/transaction/initialize', body, credentials.secretKey);

            logger.info(`[Paystack] Paiement initié — Réf: ${dto.reference} — Montant: ${dto.montant} ${dto.devise}`);

            return {
                success: true,
                reference: dto.reference,
                referenceProvider: response?.data?.reference,
                urlPaiement: response?.data?.authorization_url,
                statut: 'INITIEE',
            };
        } catch (error) {
            logger.error('[Paystack] Erreur initierPaiement:', error);
            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur Paystack',
            };
        }
    }

    async verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement> {
        try {
            const response = await this.apiCall('GET', `/transaction/verify/${reference}`, null, credentials.secretKey);

            return {
                reference,
                referenceProvider: response?.data?.reference,
                statut: response?.data?.status === 'success' ? 'REUSSIE' : 
                        response?.data?.status === 'failed' ? 'ECHEC' : 'EN_ATTENTE',
                montant: response?.data?.amount ? response.data.amount / 100 : undefined,
                datePaiement: response?.data?.paid_at ? new Date(response.data.paid_at) : undefined,
            };
        } catch (error) {
            logger.error('[Paystack] Erreur verifierStatut:', error);
            return { reference, statut: 'ECHEC' };
        }
    }

    async traiterWebhook(payload: any, signature: string | undefined, credentials: Record<string, any>): Promise<WebhookResult> {
        try {
            // Vérifier la signature HMAC-SHA512
            if (signature && credentials.secretKey) {
                const expectedSig = crypto
                    .createHmac('sha512', credentials.secretKey)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                if (signature !== expectedSig) {
                    throw new Error('Signature webhook Paystack invalide');
                }
            }

            const event = payload?.event;
            const data = payload?.data;

            return {
                success: true,
                webhookId: data?.reference || crypto.randomUUID(),
                reference: data?.reference,
                statut: event === 'charge.success' ? 'REUSSIE' :
                        event === 'charge.failed' ? 'ECHEC' :
                        event === 'transfer.success' ? 'REMBOURSEE' : 'EN_ATTENTE',
                montant: data?.amount ? data.amount / 100 : undefined,
            };
        } catch (error) {
            logger.error('[Paystack] Erreur traiterWebhook:', error);
            return {
                success: false,
                webhookId: 'unknown',
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur webhook Paystack',
            };
        }
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        try {
            const response = await this.apiCall('POST', '/refund', {
                reference,
                amount: montant * 100,
            }, credentials.secretKey);

            return {
                success: true,
                reference,
                referenceProvider: response?.data?.reference,
                montantRembourse: montant,
                statut: 'REUSSIE',
            };
        } catch (error) {
            logger.error('[Paystack] Erreur remboursement:', error);
            return {
                success: false,
                reference,
                montantRembourse: montant,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur remboursement Paystack',
            };
        }
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!credentials.secretKey;
    }

    private async apiCall(method: string, path: string, body: any, secretKey: string): Promise<any> {
        // En production : vrai appel HTTP vers api.paystack.co
        logger.info(`[Paystack] API ${method} ${path}`);
        return { data: { reference: `ps_${Date.now()}`, authorization_url: `${this.apiUrl}/redirect`, status: 'pending', amount: 0 } };
    }
}
