/**
 * ==================================
 * eLISAschool - Push Notification Provider (Firebase FCM)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Provider pour les notifications push via Firebase Cloud Messaging
 * Support aussi OneSignal
 */

import admin from 'firebase-admin';
import { TypeNotification, Notification } from '../entities';
import { INotificationProvider, EnvoiResult, QuotaInfo } from './interfaces';
import { logger } from '@common/utils/logger.util';

/**
 * Configuration Firebase FCM
 */
interface FirebaseConfig {
    projectId: string;
    serverKey: string; // Legacy server key
    vapidKey?: string; // Clé VAPID pour web push
    credentials?: Record<string, any>; // Service account credentials (JSON)
}

/**
 * Provider Push avec Firebase FCM
 * Note: Implémentation placeholder - nécessite firebase-admin
 */
export class PushProvider implements INotificationProvider {
    readonly type = TypeNotification.PUSH;
    readonly nom: string;
    readonly service = 'firebase-fcm';
    
    private firebaseConfig: FirebaseConfig | null = null;
    private _configuré = false;
    private initialized = false;

    constructor(nom: string = 'firebase-default') {
        this.nom = nom;
    }

    /**
     * Initialiser le provider avec la configuration Firebase
     */
    initialiser(config: Record<string, any>): void {
        try {
            this.firebaseConfig = {
                projectId: config.project_id || process.env.FIREBASE_PROJECT_ID || '',
                serverKey: config.server_key || process.env.FIREBASE_SERVER_KEY || '',
                vapidKey: config.vapid_key || process.env.FIREBASE_VAPID_KEY,
                credentials: config.credentials,
            };

            // Vérifier que les credentials sont présents
            if (!this.firebaseConfig.projectId || !this.firebaseConfig.serverKey) {
                logger.warn('[PushProvider] Configuration Firebase incomplète');
                this._configuré = false;
                return;
            }

            // Initialiser Firebase Admin si pas déjà fait
            if (!this.initialized) {
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.cert({
                            projectId: this.firebaseConfig.projectId,
                            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                        }),
                    });
                }
                this.initialized = true;
            }

            this._configuré = true;
            logger.info(`[PushProvider] ${this.nom} initialisé avec succès`);
        } catch (error) {
            logger.error(`[PushProvider] Erreur d'initialisation`, error);
            this._configuré = false;
        }
    }

    /**
     * Vérifier si le provider est configuré
     */
    estConfiguré(): boolean {
        return this._configuré && this.firebaseConfig !== null;
    }

    /**
     * Envoyer une notification push via Firebase FCM
     */
    async envoyer(notification: Notification): Promise<EnvoiResult> {
        if (!this.estConfiguré() || !this.firebaseConfig) {
            return {
                succes: false,
                erreur: 'Provider Push non configuré',
            };
        }

        try {
            // Récupérer le token FCM du destinataire depuis metadata
            const fcmToken = notification.metadata?.fcmToken || 
                notification.metadata?.deviceToken;

            if (!fcmToken) {
                return {
                    succes: false,
                    erreur: 'Token FCM du destinataire manquant dans les métadonnées',
                };
            }

            // Construire le message FCM
            const message = {
                token: fcmToken,
                notification: {
                    title: notification.titre,
                    body: notification.contenu,
                },
                data: {
                    notificationId: notification.id,
                    categorie: notification.categorie || '',
                    priorite: notification.priorite,
                    lienAction: notification.lienAction || '',
                    click_action: notification.lienAction ? 'OPEN_URL' : 'DEFAULT',
                },
                android: {
                    priority: notification.priorite === 'URGENTE' ? 'high' : 'normal',
                    notification: {
                        sound: 'default',
                        icon: 'ic_notification',
                        color: '#28a745',
                    },
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1,
                        },
                    },
                },
            };

            // Envoyer via Firebase Admin
            const result = await admin.messaging().send(message as any);

            logger.info(
                `[PushProvider] Push envoyé (token: ${fcmToken.substring(0, 20)}..., ID: ${result})`
            );

            return {
                succes: true,
                idExterne: result,
                details: {
                    token: fcmToken.substring(0, 20) + '...',
                    projectId: this.firebaseConfig.projectId,
                    messageId: result,
                },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error(`[PushProvider] Échec envoi push`, error);

            return {
                succes: false,
                erreur: errorMessage,
            };
        }
    }

    /**
     * Tester la configuration Firebase
     */
    async testerConfiguration(config: Record<string, any>): Promise<boolean> {
        try {
            const projectId = config.project_id || '';
            const serverKey = config.server_key || '';

            if (!projectId || !serverKey) {
                return false;
            }

            // Tester avec firebase-admin
            if (!admin.apps.length) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    }),
                });
            }

            logger.info('[PushProvider] Test de configuration réussi');
            return true;
        } catch (error) {
            logger.error('[PushProvider] Test de configuration échoué', error);
            return false;
        }
    }

    /**
     * Obtenir les informations de quota
     */
    async getQuota(): Promise<QuotaInfo> {
        // Firebase FCM est gratuit et sans quota strict
        return {
            utilise: 0,
            limite: 0, // Illimité
            restant: 0,
            pourcentage: 0,
        };
    }
}

export const pushProvider = new PushProvider();
export default pushProvider;
