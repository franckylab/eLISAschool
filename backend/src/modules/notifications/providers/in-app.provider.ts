/**
 * ==================================
 * eLISAschool - In-App Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Provider pour les notifications in-app (stockage en base de données)
 * C'est le provider par défaut et le plus simple
 */

import { TypeNotification, Notification } from '../entities';
import { INotificationProvider, EnvoiResult, QuotaInfo } from './interfaces';

/**
 * Provider de notifications in-app
 * Les notifications sont simplement stockées en base et affichées dans l'interface
 */
export class InAppProvider implements INotificationProvider {
    readonly type = TypeNotification.IN_APP;
    readonly nom = 'in-app-default';
    readonly service = 'in-app';
    private configuré = true;

    /**
     * Initialiser le provider
     * In-app ne nécessite pas de configuration externe
     */
    initialiser(_config: Record<string, any>): void {
        this.configuré = true;
    }

    /**
     * Vérifier si le provider est configuré
     * In-app est toujours prêt
     */
    estConfiguré(): boolean {
        return this.configuré;
    }

    /**
     * Envoyer une notification in-app
     * Pour in-app, "envoyer" = marquer comme envoyée (déjà fait par le service)
     */
    async envoyer(_notification: Notification): Promise<EnvoiResult> {
        // In-app: la notification est déjà en base
        // Le statut sera mis à jour par le service appelant
        return {
            succes: true,
            details: {
                methode: 'in-app',
                message: 'Notification stockée en base',
            },
        };
    }

    /**
     * Tester la configuration
     * In-app n'a pas de configuration à tester
     */
    async testerConfiguration(_config: Record<string, any>): Promise<boolean> {
        return true;
    }

    /**
     * Obtenir les informations de quota
     * In-app n'a pas de quota (stockage local)
     */
    async getQuota(): Promise<QuotaInfo> {
        return {
            utilise: 0,
            limite: 0, // Illimité
            restant: 0,
            pourcentage: 0,
        };
    }
}

export const inAppProvider = new InAppProvider();
export default inAppProvider;
