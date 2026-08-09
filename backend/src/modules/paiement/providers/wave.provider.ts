/**
 * ==================================
 * eLISAschool - Provider Wave
 * ==================================
 * 
 * Wave — Paiement mobile money (Sénégal, Côte d'Ivoire, Cameroun).
 * API REST, frais ~1%, pas de frais pour le receveur.
 * 
 * Phase D.1 — Refonte SaaS v2
 */

import { PaymentProvider, InitierPaiementDTO, PaiementResult, StatutPaiement, WebhookResult, RemboursementResult } from './payment-provider.interface';
import { logger } from '@common/utils/logger.util';
import crypto from 'crypto';

export class WaveProvider implements PaymentProvider {
    readonly name = 'wave';
    readonly displayName = 'Wave';
    readonly supportedMethods = ['mobile_money'] as const;

    private readonly apiUrl: Record<string, string> = {
        SN: 'https://api.wave.com/v1',
        CI: 'https://api.wave.com/v1',
        CM: 'https://api.wave.com/v1',
    };

    async initierPaiement(dto: InitierPaiementDTO, credentials: Record<string, any>): Promise<PaiementResult> {
        try {
            const country = credentials.country || 'CM';
            const apiUrl = this.apiUrl[country] || this.apiUrl.CM;

            // Wave utilise un POST pour créer un checkout
            const body = {
                amount: dto.montant, // En centimes (XOF/XAF * 100)
                currency: dto.devise || 'XOF',
                purpose: dto.description,
                return_url: dto.returnUrl || '',
                webhook: dto.notifyUrl || '',
                reference: dto.reference,
            };

            // Simulation API (en production : fetch vers l'API Wave)
            const response = await this.apiCall('POST', `${apiUrl}/checkouts`, body, credentials.apiKey);

            logger.info(`[Wave] Paiement initié — Réf: ${dto.reference} — Montant: ${dto.montant} ${dto.devise}`);

            return {
                success: true,
                reference: dto.reference,
                referenceProvider: response?.id,
                urlPaiement: response?.checkout_url,
                statut: 'INITIEE',
            };
        } catch (error) {
            logger.error('[Wave] Erreur initierPaiement:', error);
            return {
                success: false,
                reference: dto.reference,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur Wave',
            };
        }
    }

    async verifierStatut(reference: string, credentials: Record<string, any>): Promise<StatutPaiement> {
        try {
            const apiUrl = this.apiUrl[credentials.country || 'CM'];
            const response = await this.apiCall('GET', `${apiUrl}/checkouts/${reference}`, null, credentials.apiKey);

            return {
                reference,
                referenceProvider: response?.provider_reference,
                statut: this.mapStatut(response?.status),
                montant: response?.amount,
                datePaiement: response?.paid_at ? new Date(response.paid_at) : undefined,
            };
        } catch (error) {
            logger.error('[Wave] Erreur verifierStatut:', error);
            return { reference, statut: 'ECHEC' };
        }
    }

    async traiterWebhook(payload: any, signature: string | undefined, credentials: Record<string, any>): Promise<WebhookResult> {
        try {
            // Vérifier la signature HMAC
            if (signature && credentials.webhookSecret) {
                const expectedSig = crypto
                    .createHmac('sha256', credentials.webhookSecret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                if (signature !== expectedSig) {
                    throw new Error('Signature webhook invalide');
                }
            }

            return {
                success: true,
                webhookId: payload?.id || crypto.randomUUID(),
                reference: payload?.reference,
                referenceProvider: payload?.provider_reference,
                statut: this.mapStatut(payload?.status),
                montant: payload?.amount,
            };
        } catch (error) {
            logger.error('[Wave] Erreur traiterWebhook:', error);
            return {
                success: false,
                webhookId: payload?.id || 'unknown',
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur webhook Wave',
            };
        }
    }

    async initierRemboursement(reference: string, montant: number, credentials: Record<string, any>): Promise<RemboursementResult> {
        try {
            const apiUrl = this.apiUrl[credentials.country || 'CM'];
            const response = await this.apiCall('POST', `${apiUrl}/refunds`, {
                checkout_reference: reference,
                amount: montant,
            }, credentials.apiKey);

            return {
                success: true,
                reference,
                referenceProvider: response?.id,
                montantRembourse: montant,
                statut: 'REUSSIE',
            };
        } catch (error) {
            logger.error('[Wave] Erreur remboursement:', error);
            return {
                success: false,
                reference,
                montantRembourse: montant,
                statut: 'ECHEC',
                message: error instanceof Error ? error.message : 'Erreur remboursement Wave',
            };
        }
    }

    async estConfigure(credentials: Record<string, any>): Promise<boolean> {
        return !!credentials.apiKey && !!credentials.country;
    }

    private mapStatut(status: string): StatutPaiement['statut'] {
        const mapping: Record<string, StatutPaiement['statut']> = {
            'pending': 'EN_ATTENTE',
            'paid': 'REUSSIE',
            'failed': 'ECHEC',
            'expired': 'EXPIREE',
            'refunded': 'REMBOURSEE',
        };
        return mapping[status] || 'EN_ATTENTE';
    }

    private async apiCall(method: string, url: string, body: any, apiKey: string): Promise<any> {
        // En production : vrai appel HTTP
        // Pour l'instant : simulation pour ne pas bloquer le développement
        logger.info(`[Wave] API ${method} ${url}`);
        return { id: `wave_${Date.now()}`, checkout_url: url, status: 'pending' };
    }
}
