/**
 * ==================================
 * eLISAschool - Provider Orange Money
 * ==================================
 * 
 * Intégration Orange Money API.
 * Supporte: mobile_money
 * 
 * Phase 5.2 — Refonte SaaS
 */

import {
    PaymentProvider,
    PaymentMethod,
    InitierPaiementDTO,
    PaiementResult,
    StatutPaiement,
    WebhookResult,
    RemboursementResult,
} from './payment-provider.interface';
import { logger } from '@common/utils/logger.util';

export class OrangeMoneyProvider implements PaymentProvider {
    readonly name = 'orange-money';
    readonly displayName = 'Orange Money';
    readonly supportedMethods: PaymentMethod[] = ['mobile_money'];

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const { clientId, clientSecret, merchantKey, environment } = credentials;
            const baseUrl = environment === 'sandbox'
                ? 'https://api.om.orangegroup.com/api/v2'
                : 'https://api.om.orangegroup.com/api/v2';

            // Obtenir le token OAuth
            const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });

            const tokenData = await tokenResponse.json();
            const accessToken = tokenData.access_token;

            // Initier le paiement
            const response = await fetch(`${baseUrl}/webpayment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Merchant-Key': merchantKey,
                },
                body: JSON.stringify({
                    merchant_key: merchantKey,
                    currency: dto.devise,
                    amount: Math.round(dto.montant),
                    order_id: dto.reference,
                    return_url: dto.returnUrl || '',
                    notify_url: dto.notifyUrl || '',
                    customer: {
                        phone_number: dto.customerPhone,
                    },
                }),
            });

            const data = await response.json();

            if (data.order_id || data.payment_url) {
                return {
                    success: true,
                    reference: dto.reference,
                    referenceProvider: data.order_id,
                    urlPaiement: data.payment_url || data.redirect_url,
                    statut: 'INITIEE',
                };
            }

            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: data.message || 'Erreur Orange Money',
            };
        } catch (error: any) {
            logger.error(`[OrangeMoney] Erreur initierPaiement: ${error.message}`);
            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: error.message,
            };
        }
    }

    async verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement> {
        try {
            const { clientId, clientSecret, merchantKey } = credentials;
            const baseUrl = 'https://api.om.orangegroup.com/api/v2';

            const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });

            const tokenData = await tokenResponse.json();

            const response = await fetch(`${baseUrl}/transaction/${reference}`, {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'X-Merchant-Key': merchantKey,
                },
            });

            const data = await response.json();

            return {
                reference,
                statut: this.mapStatut(data.status),
                montant: data.amount ? parseFloat(data.amount) : undefined,
            };
        } catch (error: any) {
            logger.error(`[OrangeMoney] Erreur verifierStatut: ${error.message}`);
            return { reference, statut: 'EN_ATTENTE' };
        }
    }

    async traiterWebhook(payload: any, _signature: string | undefined, _credentials: Record<string, any>): Promise<WebhookResult> {
        return {
            success: true,
            webhookId: payload.transaction_id || `om-${Date.now()}`,
            reference: payload.order_id,
            statut: this.mapStatut(payload.status),
            montant: payload.amount ? parseFloat(payload.amount) : undefined,
        };
    }

    async initierRemboursement(reference: string, montant: number, _credentials: Record<string, any>): Promise<RemboursementResult> {
        return {
            success: false,
            reference,
            montantRembourse: montant,
            statut: 'ECHEC',
            message: 'Remboursement Orange Money non supporté via API',
        };
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!(credentials.clientId && credentials.clientSecret && credentials.merchantKey);
    }

    private mapStatut(status: string): StatutPaiement['statut'] {
        switch (status?.toUpperCase()) {
            case 'SUCCESS':
            case 'COMPLETED': return 'REUSSIE';
            case 'FAILED':
            case 'REJECTED': return 'ECHEC';
            case 'PENDING': return 'EN_ATTENTE';
            default: return 'EN_ATTENTE';
        }
    }
}
