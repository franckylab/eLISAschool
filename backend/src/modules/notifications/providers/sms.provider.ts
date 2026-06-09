/**
 * ==================================
 * eLISAschool - SMS Notification Provider (Twilio)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Provider pour les notifications SMS via Twilio
 * Support aussi Vonage, Africa's Talking
 */

import { TypeNotification, Notification } from '../entities';
import { INotificationProvider, EnvoiResult, QuotaInfo } from './interfaces';
import { logger } from '@common/utils/logger.util';

/**
 * Configuration Twilio
 */
interface TwilioConfig {
    accountSid: string;
    authToken: string;
    fromNumber: string;
}

/**
 * Provider SMS avec Twilio
 * Note: Implémentation placeholder - nécessite le package twilio
 */
export class SmsProvider implements INotificationProvider {
    readonly type = TypeNotification.SMS;
    readonly nom: string;
    readonly service = 'twilio';
    
    private twilioConfig: TwilioConfig | null = null;
    private _configuré = false;

    constructor(nom: string = 'twilio-default') {
        this.nom = nom;
    }

    /**
     * Initialiser le provider avec la configuration Twilio
     */
    initialiser(config: Record<string, any>): void {
        try {
            this.twilioConfig = {
                accountSid: config.account_sid || process.env.TWILIO_ACCOUNT_SID || '',
                authToken: config.auth_token || process.env.TWILIO_AUTH_TOKEN || '',
                fromNumber: config.from_number || process.env.TWILIO_FROM_NUMBER || '',
            };

            // Vérifier que les credentials sont présents
            if (!this.twilioConfig.accountSid || !this.twilioConfig.authToken || !this.twilioConfig.fromNumber) {
                logger.warn('[SmsProvider] Configuration Twilio incomplète');
                this._configuré = false;
                return;
            }

            this._configuré = true;
            logger.info(`[SmsProvider] ${this.nom} initialisé avec succès`);
        } catch (error) {
            logger.error(`[SmsProvider] Erreur d'initialisation`, error);
            this._configuré = false;
        }
    }

    /**
     * Vérifier si le provider est configuré
     */
    estConfiguré(): boolean {
        return this._configuré && this.twilioConfig !== null;
    }

    /**
     * Envoyer un SMS
     * TODO: Implémenter avec le package twilio quand installé
     */
    async envoyer(notification: Notification): Promise<EnvoiResult> {
        if (!this.estConfiguré() || !this.twilioConfig) {
            return {
                succes: false,
                erreur: 'Provider SMS non configuré',
            };
        }

        try {
            // Récupérer le téléphone du destinataire depuis metadata
            const telephoneDestinataire = notification.metadata?.telephone || 
                notification.metadata?.destinataireTelephone;

            if (!telephoneDestinataire) {
                return {
                    succes: false,
                    erreur: 'Téléphone du destinataire manquant dans les métadonnées',
                };
            }

            // Tronquer le contenu pour SMS (160 caractères max)
            const contenuSMS = notification.contenu.length > 160 
                ? notification.contenu.substring(0, 157) + '...'
                : notification.contenu;

            const message = `${notification.titre}\n${contenuSMS}`;

            // TODO: Implémenter avec twilio quand le package sera installé
            // const client = require('twilio')(this.twilioConfig.accountSid, this.twilioConfig.authToken);
            // const result = await client.messages.create({
            //     body: message,
            //     from: this.twilioConfig.fromNumber,
            //     to: telephoneDestinataire,
            // });

            logger.info(
                `[SmsProvider] SMS envoyé à ${telephoneDestinataire} (simulation)`
            );

            return {
                succes: true,
                idExterne: `sms-${Date.now()}`, // Placeholder
                cout: 0.05, // Coût estimatif en USD
                details: {
                    to: telephoneDestinataire,
                    from: this.twilioConfig.fromNumber,
                    length: message.length,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error(`[SmsProvider] Échec envoi SMS`, error);

            return {
                succes: false,
                erreur: errorMessage,
            };
        }
    }

    /**
     * Tester la configuration Twilio
     */
    async testerConfiguration(config: Record<string, any>): Promise<boolean> {
        try {
            const accountSid = config.account_sid || '';
            const authToken = config.auth_token || '';

            if (!accountSid || !authToken) {
                return false;
            }

            // TODO: Tester avec twilio quand le package sera installé
            // const client = require('twilio')(accountSid, authToken);
            // await client.api.accounts(accountSid).fetch();

            logger.info('[SmsProvider] Test de configuration réussi (simulation)');
            return true;
        } catch (error) {
            logger.error('[SmsProvider] Test de configuration échoué', error);
            return false;
        }
    }

    /**
     * Obtenir les informations de quota
     */
    async getQuota(): Promise<QuotaInfo> {
        // Twilio utilise un système de crédit/prépaiement
        // À implémenter avec l'API Twilio
        return {
            utilise: 0,
            limite: 0,
            restant: 0,
            pourcentage: 0,
        };
    }
}

export const smsProvider = new SmsProvider();
export default smsProvider;
