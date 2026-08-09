/**
 * ==================================
 * eLISAschool - Provider MTN Mobile Money
 * ==================================
 * 
 * Intégration MTN MoMo API (Collection).
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

export class MtnMomoProvider implements PaymentProvider {
    readonly name = 'mtn-momo';
    readonly displayName = 'MTN Mobile Money';
    readonly supportedMethods: PaymentMethod[] = ['mobile_money'];

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const { apiUser, apiKey, subscriptionKey, environment } = credentials;
            const baseUrl = environment === 'sandbox'
                ? 'https://sandbox.momodeveloper.mtn.com'
                : 'https://api-momo.mtn.com';

            // Étape 1: Créer un request-to-pay
            const response = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAccessToken(apiUser, apiKey, baseUrl)}`,
                    'X-Target-Environment': environment || 'sandbox',
                    'X-Reference-Id': dto.reference,
                    'X-Callback-Url': dto.notifyUrl || '',
                    'Ocp-Apim-Subscription-Key': subscriptionKey,
                },
                body: JSON.stringify({
                    amount: String(Math.round(dto.montant)),
                    currency: dto.devise,
                    externalId: dto.reference,
                    payer: {
                        partyIdType: 'MSISDN',
                        partyId: dto.customerPhone,
                    },
                    payerMessage: dto.description,
                    payeeNote: 'eLISAschool',
                }),
            });

            if (response.status === 202) {
                return {
                    success: true,
                    reference: dto.reference,
                    statut: 'EN_ATTENTE',
                    message: 'Paiement initié, en attente de confirmation client',
                };
            }

            const error = await response.text();
            logger.error(`[MTN-MoMo] Erreur initierPaiement: ${response.status} — ${error}`);

            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: `Erreur MTN MoMo: ${response.status}`,
            };
        } catch (error: any) {
            logger.error(`[MTN-MoMo] Exception initierPaiement: ${error.message}`);
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
            const { apiUser, apiKey, subscriptionKey, environment } = credentials;
            const baseUrl = environment === 'sandbox'
                ? 'https://sandbox.momodeveloper.mtn.com'
                : 'https://api-momo.mtn.com';

            const response = await fetch(
                `${baseUrl}/collection/v1_0/requesttopay/${reference}`,
                {
                    headers: {
                        'Authorization': `Bearer ${await this.getAccessToken(apiUser, apiKey, baseUrl)}`,
                        'X-Target-Environment': environment || 'sandbox',
                        'Ocp-Apim-Subscription-Key': subscriptionKey,
                    },
                }
            );

            const data = await response.json();

            return {
                reference,
                referenceProvider: data.financialTransactionId,
                statut: this.mapStatut(data.status),
                montant: data.amount ? parseFloat(data.amount) : undefined,
            };
        } catch (error: any) {
            logger.error(`[MTN-MoMo] Erreur verifierStatut: ${error.message}`);
            return { reference, statut: 'EN_ATTENTE' };
        }
    }

    async traiterWebhook(payload: any, _signature: string | undefined, _credentials: Record<string, any>): Promise<WebhookResult> {
        return {
            success: true,
            webhookId: payload?.financialTransactionId || payload?.referenceId || `mtn-${Date.now()}`,
            reference: payload?.externalId,
            referenceProvider: payload?.financialTransactionId,
            statut: this.mapStatut(payload?.status),
            montant: payload?.amount ? parseFloat(payload.amount) : undefined,
        };
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        return {
            success: false,
            reference,
            montantRembourse: montant,
            statut: 'ECHEC',
            message: 'Remboursement MTN MoMo non supporté via API — contacter le support',
        };
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!(credentials.apiUser && credentials.apiKey && credentials.subscriptionKey);
    }

    // --- Helpers privés ---

    private async getAccessToken(apiUser: string, apiKey: string, baseUrl: string): Promise<string> {
        // En production, le token devrait être mis en cache
        const response = await fetch(`${baseUrl}/collection/token/`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
            },
        });
        const data = await response.json();
        return data.access_token;
    }

    private mapStatut(status: string): StatutPaiement['statut'] {
        switch (status) {
            case 'SUCCESSFUL': return 'REUSSIE';
            case 'FAILED': return 'ECHEC';
            case 'PENDING': return 'EN_ATTENTE';
            default: return 'EN_ATTENTE';
        }
    }
}
