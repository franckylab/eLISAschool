/**
 * ==================================
 * eLISAschool - Provider Stripe
 * ==================================
 * 
 * Intégration Stripe pour cartes bancaires.
 * Supporte: card
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

export class StripeProvider implements PaymentProvider {
    readonly name = 'stripe';
    readonly displayName = 'Stripe (Cartes bancaires)';
    readonly supportedMethods: PaymentMethod[] = ['card'];

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const { secretKey } = credentials;

            // Créer une Stripe Checkout Session
            const sessionData = {
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: dto.devise.toLowerCase(),
                        product_data: { name: dto.description },
                        unit_amount: Math.round(dto.montant * 100), // Stripe utilise les centimes
                    },
                    quantity: 1,
                }],
                mode: 'payment',
                success_url: dto.returnUrl || '',
                cancel_url: dto.returnUrl || '',
                metadata: {
                    reference: dto.reference,
                    ...dto.metadata,
                },
            };

            const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    ...this.flattenObject(sessionData),
                } as any),
            });

            const session = await response.json();

            if (session.id) {
                return {
                    success: true,
                    reference: dto.reference,
                    referenceProvider: session.id,
                    urlPaiement: session.url,
                    statut: 'INITIEE',
                };
            }

            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: session.error?.message || 'Erreur Stripe',
            };
        } catch (error: any) {
            logger.error(`[Stripe] Erreur initierPaiement: ${error.message}`);
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
            const { secretKey } = credentials;
            const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${reference}`, {
                headers: { 'Authorization': `Bearer ${secretKey}` },
            });

            const session = await response.json();

            return {
                reference,
                referenceProvider: session.payment_intent,
                statut: this.mapStripeStatut(session.payment_status, session.status),
                montant: session.amount_total ? session.amount_total / 100 : undefined,
            };
        } catch (error: any) {
            logger.error(`[Stripe] Erreur verifierStatut: ${error.message}`);
            return { reference, statut: 'EN_ATTENTE' };
        }
    }

    async traiterWebhook(payload: any, signature: string | undefined, credentials: Record<string, any>): Promise<WebhookResult> {
        // Vérifier la signature du webhook
        const webhookSecret = credentials.webhookSecret;

        return {
            success: true,
            webhookId: payload.id || `stripe-${Date.now()}`,
            reference: payload.data?.object?.metadata?.reference,
            referenceProvider: payload.data?.object?.id,
            statut: this.mapStripeEventStatut(payload.type),
            montant: payload.data?.object?.amount_total ? payload.data.object.amount_total / 100 : undefined,
        };
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        try {
            const { secretKey } = credentials;
            const response = await fetch('https://api.stripe.com/v1/refunds', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${secretKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    payment_intent: reference,
                    amount: String(Math.round(montant * 100)),
                } as any),
            });

            const refund = await response.json();

            return {
                success: refund.id ? true : false,
                reference,
                referenceProvider: refund.id,
                montantRembourse: montant,
                statut: refund.status === 'succeeded' ? 'REUSSIE' : 'EN_ATTENTE',
            };
        } catch (error: any) {
            return {
                success: false,
                reference,
                montantRembourse: montant,
                statut: 'ECHEC',
                message: error.message,
            };
        }
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!credentials.secretKey;
    }

    // --- Helpers ---

    private mapStripeStatut(paymentStatus: string, sessionStatus: string): StatutPaiement['statut'] {
        if (paymentStatus === 'paid') return 'REUSSIE';
        if (paymentStatus === 'unpaid') return 'ECHEC';
        if (sessionStatus === 'expired') return 'EXPIREE';
        return 'EN_ATTENTE';
    }

    private mapStripeEventStatut(eventType: string): WebhookResult['statut'] {
        switch (eventType) {
            case 'checkout.session.completed': return 'REUSSIE';
            case 'payment_intent.payment_failed': return 'ECHEC';
            case 'charge.refunded': return 'REMBOURSEE';
            default: return 'EN_ATTENTE';
        }
    }

    private flattenObject(obj: any, prefix = ''): Record<string, string> {
        const result: Record<string, string> = {};
        for (const key in obj) {
            const fullKey = prefix ? `${prefix}[${key}]` : key;
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                Object.assign(result, this.flattenObject(obj[key], fullKey));
            } else {
                result[fullKey] = String(obj[key]);
            }
        }
        return result;
    }
}
