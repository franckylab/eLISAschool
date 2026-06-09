/**
 * ==================================
 * eLISAschool - Email Notification Provider (Nodemailer)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Provider pour les notifications email via Nodemailer
 * Support SMTP, SendGrid, Mailgun, AWS SES
 */

import * as nodemailer from 'nodemailer';
import { TypeNotification, Notification } from '../entities';
import { INotificationProvider, EnvoiResult, QuotaInfo } from './interfaces';
import { logger } from '@common/utils/logger.util';

/**
 * Configuration SMTP pour Nodemailer
 */
interface SMTPConfig {
    host: string;
    port: number;
    secure: boolean; // true pour 465, false pour autres ports
    auth: {
        user: string;
        pass: string;
    };
    from: {
        email: string;
        name: string;
    };
    tls?: {
        rejectUnauthorized: boolean;
    };
}

/**
 * Provider Email avec Nodemailer
 */
export class EmailProvider implements INotificationProvider {
    readonly type = TypeNotification.EMAIL;
    readonly nom: string;
    readonly service = 'nodemailer';
    
    private transporter: nodemailer.Transporter | null = null;
    private smtpConfig: SMTPConfig | null = null;
    private _configuré = false;

    constructor(nom: string = 'smtp-default') {
        this.nom = nom;
    }

    /**
     * Initialiser le provider avec la configuration SMTP
     */
    initialiser(config: Record<string, any>): void {
        try {
            this.smtpConfig = {
                host: config.host || process.env.SMTP_HOST || '',
                port: parseInt(config.port || process.env.SMTP_PORT || '587'),
                secure: config.secure === true || config.port === '465',
                auth: {
                    user: config.user || process.env.SMTP_USER || '',
                    pass: config.pass || config.password || process.env.SMTP_PASSWORD || '',
                },
                from: {
                    email: config.from_email || process.env.SMTP_FROM || 'noreply@elisaschool.cm',
                    name: config.from_name || 'eLISAschool',
                },
                tls: {
                    rejectUnauthorized: config.tls_reject_unauthorized !== false,
                },
            };

            // Créer le transporter
            this.transporter = nodemailer.createTransport({
                host: this.smtpConfig.host,
                port: this.smtpConfig.port,
                secure: this.smtpConfig.secure,
                auth: this.smtpConfig.auth,
                tls: this.smtpConfig.tls,
            });

            this._configuré = true;
            logger.info(`[EmailProvider] ${this.nom} initialisé avec succès`);
        } catch (error) {
            logger.error(`[EmailProvider] Erreur d'initialisation`, error);
            this._configuré = false;
        }
    }

    /**
     * Vérifier si le provider est configuré
     */
    estConfiguré(): boolean {
        return this._configuré && this.transporter !== null;
    }

    /**
     * Envoyer un email
     */
    async envoyer(notification: Notification): Promise<EnvoiResult> {
        if (!this.estConfiguré() || !this.smtpConfig || !this.transporter) {
            return {
                succes: false,
                erreur: 'Provider email non configuré',
            };
        }

        try {
            // Récupérer l'email du destinataire depuis metadata
            const emailDestinataire = notification.metadata?.email || 
                notification.metadata?.destinataireEmail;

            if (!emailDestinataire) {
                return {
                    succes: false,
                    erreur: 'Email du destinataire manquant dans les métadonnées',
                };
            }

            // Construire l'email
            const mailOptions = {
                from: `"${this.smtpConfig.from.name}" <${this.smtpConfig.from.email}>`,
                to: emailDestinataire,
                subject: notification.titre,
                text: notification.contenu,
                html: this.construireHTML(notification),
                headers: {
                    'X-eLISAschool-Notification-ID': notification.id,
                    'X-eLISAschool-Notification-Type': notification.type,
                    'X-eLISAschool-Notification-Priority': notification.priorite,
                },
            };

            // Envoyer l'email
            const info = await this.transporter.sendMail(mailOptions);

            logger.info(
                `[EmailProvider] Email envoyé à ${emailDestinataire} (ID: ${info.messageId})`
            );

            return {
                succes: true,
                idExterne: info.messageId,
                details: {
                    messageId: info.messageId,
                    accepted: info.accepted,
                    rejected: info.rejected,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error(`[EmailProvider] Échec envoi email`, error);

            return {
                succes: false,
                erreur: errorMessage,
            };
        }
    }

    /**
     * Tester la configuration SMTP
     */
    async testerConfiguration(config: Record<string, any>): Promise<boolean> {
        try {
            // Créer un transporter temporaire pour le test
            const testConfig = {
                host: config.host || '',
                port: parseInt(config.port || '587'),
                secure: config.secure === true || config.port === '465',
                auth: {
                    user: config.user || '',
                    pass: config.pass || config.password || '',
                },
                tls: {
                    rejectUnauthorized: config.tls_reject_unauthorized !== false,
                },
            };

            const testTransporter = nodemailer.createTransport(testConfig);
            
            // Vérifier la connexion
            await testTransporter.verify();
            
            logger.info('[EmailProvider] Test de configuration réussi');
            return true;
        } catch (error) {
            logger.error('[EmailProvider] Test de configuration échoué', error);
            return false;
        }
    }

    /**
     * Obtenir les informations de quota
     */
    async getQuota(): Promise<QuotaInfo> {
        // Nodemailer/SMTP n'a généralement pas de quota côté client
        // Les quotas sont gérés par le serveur SMTP
        return {
            utilise: 0,
            limite: 0, // Illimité côté client
            restant: 0,
            pourcentage: 0,
        };
    }

    /**
     * Construire le HTML de l'email à partir de la notification
     */
    private construireHTML(notification: Notification): string {
        const prioriteColors: Record<string, string> = {
            BASSE: '#6c757d',
            NORMALE: '#28a745',
            HAUTE: '#ffc107',
            URGENTE: '#dc3545',
        };

        const couleurPriorite = prioriteColors[notification.priorite] || '#28a745';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${notification.titre}</title>
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                    <h2 style="color: #28a745; margin: 0 0 10px 0;">eLISAschool</h2>
                    <p style="color: #6c757d; margin: 0;">Notification ${notification.categorie || ''}</p>
                </div>
                
                <div style="background: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
                    <h3 style="margin: 0 0 15px 0; color: #333;">${notification.titre}</h3>
                    
                    <div style="background: ${couleurPriorite}; color: white; padding: 5px 10px; border-radius: 3px; display: inline-block; margin-bottom: 15px; font-size: 12px;">
                        Priorité: ${notification.priorite}
                    </div>
                    
                    <div style="margin: 15px 0;">
                        ${notification.contenu.replace(/\n/g, '<br>')}
                    </div>
                    
                    ${notification.lienAction ? `
                        <div style="margin-top: 20px;">
                            <a href="${notification.lienAction}" 
                               style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Voir les détails
                            </a>
                        </div>
                    ` : ''}
                </div>
                
                <div style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <p>Cette notification a été envoyée par eLISAschool</p>
                    <p>Date: ${new Date(notification.createdAt).toLocaleString('fr-FR')}</p>
                </div>
            </body>
            </html>
        `;
    }
}

export const emailProvider = new EmailProvider();
export default emailProvider;
