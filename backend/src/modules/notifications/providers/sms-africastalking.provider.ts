/**
 * ==================================
 * eLISAschool - SMS Provider Africa's Talking
 * ==================================
 * [Phase 5.3] Provider SMS avec Africa's Talking.
 * Couverture étendue en Afrique subsaharienne (Cameroun, Kenya, Nigeria, etc.)
 * API REST — Support SMS, USSD, Voice.
 */

import { TypeNotification, Notification } from '../entities';
import { INotificationProvider, EnvoiResult, QuotaInfo } from './interfaces';
import { logger } from '@common/utils/logger.util';

// =============================================
// Configuration
// =============================================

interface AfricaTalkingConfig {
    apiKey: string;
    username: string;     // 'sandbox' ou compte production
    senderId: string;     // Shortcode ou alphanumeric sender
    baseUrl: string;
}

// =============================================
// Provider
// =============================================

export class AfricaTalkingSmsProvider implements INotificationProvider {
    readonly type = TypeNotification.SMS;
    readonly nom: string;
    readonly service = 'africastalking';

    private config: AfricaTalkingConfig | null = null;
    private _configuré = false;

    constructor(nom: string = 'africastalking-default') {
        this.nom = nom;
    }

    /**
     * Initialiser le provider avec la configuration Africa's Talking.
     */
    initialiser(config: Record<string, any>): void {
        try {
            this.config = {
                apiKey: config.api_key || process.env.AT_API_KEY || '',
                username: config.username || process.env.AT_USERNAME || 'sandbox',
                senderId: config.sender_id || process.env.AT_SENDER_ID || 'eLISAschool',
                baseUrl: config.base_url || process.env.AT_BASE_URL ||
                    (config.username === 'sandbox'
                        ? 'https://api.sandbox.africastalking.com'
                        : 'https://api.africastalking.com'),
            };

            this._configuré = !!(this.config.apiKey && this.config.username);

            if (this._configuré) {
                logger.info(
                    `[AfricaTalking] Provider initialisé — User: ${this.config.username} ` +
                    `— Base: ${this.config.baseUrl}`
                );
            } else {
                logger.warn('[AfricaTalking] Configuration incomplète (apiKey/username manquants)');
            }
        } catch (error) {
            logger.error('[AfricaTalking] Erreur initialisation:', error);
            this._configuré = false;
        }
    }

    estConfiguré(): boolean {
        return this._configuré && this.config !== null;
    }

    /**
     * Envoyer un SMS via Africa's Talking.
     * POST {baseUrl}/version1/messaging
     */
    async envoyer(notification: Notification): Promise<EnvoiResult> {
        if (!this.config || !this._configuré) {
            return { succes: false, erreur: 'Africa\'s Talking non configuré' };
        }

        try {
            const telephoneDestinataire = notification.metadata?.telephone ||
                notification.metadata?.destinataireTelephone;

            if (!telephoneDestinataire) {
                return {
                    succes: false,
                    erreur: 'Téléphone du destinataire manquant dans les métadonnées',
                };
            }

            // Tronquer pour SMS si nécessaire
            const contenuSMS = notification.contenu.length > 160
                ? notification.contenu.substring(0, 157) + '...'
                : notification.contenu;

            const message = notification.titre
                ? `${notification.titre}\n${contenuSMS}`
                : contenuSMS;

            const body = {
                username: this.config.username,
                to: telephoneDestinataire,
                message: message,
                from: this.config.senderId,
            };

            const response = await this.apiCall('/version1/messaging', body);

            const smsMessage = response?.SMSMessageData?.Message;
            const recipients = response?.SMSMessageData?.Recipients || [];
            const premierRecipient = recipients[0];

            logger.info(
                `[AfricaTalking] SMS envoyé — Destinataire: ${telephoneDestinataire} ` +
                `— Status: ${premierRecipient?.status || 'N/A'} ` +
                `— MessageId: ${premierRecipient?.messageId || 'N/A'}`
            );

            const succes = premierRecipient?.status === 'Success';

            return {
                succes,
                idExterne: premierRecipient?.messageId,
                cout: 0, // Africa's Talking facture par crédit
                details: {
                    status: premierRecipient?.status,
                    messageId: premierRecipient?.messageId,
                    cost: premierRecipient?.cost,
                    numberOfMessages: recipients.length,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error('[AfricaTalking] Échec envoi SMS:', error);
            return {
                succes: false,
                erreur: errorMessage,
            };
        }
    }

    /**
     * Tester la configuration Africa's Talking.
     */
    async testerConfiguration(config: Record<string, any>): Promise<boolean> {
        try {
            const testConfig: AfricaTalkingConfig = {
                apiKey: config.api_key || '',
                username: config.username || 'sandbox',
                senderId: config.sender_id || 'test',
                baseUrl: config.base_url || 'https://api.sandbox.africastalking.com',
            };

            if (!testConfig.apiKey || !testConfig.username) return false;

            // Test : récupérer les infos du compte
            // GET {baseUrl}/version1/user?username={username}
            const response = await this.apiCall(
                `/version1/user?username=${testConfig.username}`,
                null,
                testConfig.apiKey,
                testConfig.baseUrl,
            );

            return !!response?.UserData;
        } catch {
            return false;
        }
    }

    async getQuota(): Promise<QuotaInfo> {
        // Africa's Talking utilise un système de crédits
        // Nécessite un appel API pour récupérer le solde
        return {
            utilise: 0,
            limite: 0,
            restant: 0,
            pourcentage: 0,
        };
    }

    // =============================================
    // API interne
    // =============================================

    private async apiCall(
        path: string,
        body: any,
        apiKeyOverride?: string,
        baseUrlOverride?: string,
    ): Promise<any> {
        const apiKey = apiKeyOverride || this.config?.apiKey || '';
        const baseUrl = baseUrlOverride || this.config?.baseUrl || 'https://api.africastalking.com';

        const isGet = body === null;
        const url = `${baseUrl}${path}`;

        // En production : vrai appel HTTP
        // const response = await fetch(url, {
        //     method: isGet ? 'GET' : 'POST',
        //     headers: {
        //         'Accept': 'application/json',
        //         'Content-Type': 'application/json',
        //         'apiKey': apiKey,
        //     },
        //     ...(isGet ? {} : { body: JSON.stringify(body) }),
        // });
        // return response.json();

        logger.info(`[AfricaTalking] API ${isGet ? 'GET' : 'POST'} ${url}`);

        // Placeholder pour les tests
        if (isGet) {
            return { UserData: { balance: 'XAF 50000' } };
        }
        return {
            SMSMessageData: {
                Message: 'Sent to 1/1 Total Cost: XAF 15',
                Recipients: [{
                    statusCode: 101,
                    number: '+237...',
                    status: 'Success',
                    cost: 'XAF 15',
                    messageId: `at_${Date.now()}`,
                }],
            },
        };
    }
}

export const africastalkingProvider = new AfricaTalkingSmsProvider();
export default africastalkingProvider;
