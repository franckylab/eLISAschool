/**
 * ==================================
 * eLISAschool - Provider Registry
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Registre centralisé des providers de notifications
 * Permet d'enregistrer, récupérer et gérer les providers actifs
 */

import { TypeNotification } from '../entities';
import { INotificationProvider, EnvoiResult } from './interfaces';
import { Notification } from '../entities';
import { logger } from '@common/utils/logger.util';

/**
 * Registre des providers de notifications
 * Pattern Singleton pour garantir un accès global cohérent
 */
class ProviderRegistry {
    private static instance: ProviderRegistry;
    private providers: Map<string, INotificationProvider> = new Map();
    private providersParType: Map<TypeNotification, INotificationProvider[]> = new Map();

    private constructor() {
        // Initialiser les maps par type
        Object.values(TypeNotification).forEach((type) => {
            this.providersParType.set(type, []);
        });
    }

    /**
     * Obtenir l'instance singleton
     */
    static getInstance(): ProviderRegistry {
        if (!ProviderRegistry.instance) {
            ProviderRegistry.instance = new ProviderRegistry();
        }
        return ProviderRegistry.instance;
    }

    /**
     * Enregistrer un provider
     * @param provider Le provider à enregistrer
     */
    register(provider: INotificationProvider): void {
        const key = `${provider.type}:${provider.nom}`;
        this.providers.set(key, provider);

        // Ajouter à la liste par type
        const typeProviders = this.providersParType.get(provider.type) || [];
        typeProviders.push(provider);
        // Trier par priorité (si implémentée)
        this.providersParType.set(provider.type, typeProviders);

        logger.info(`[ProviderRegistry] Provider enregistré: ${key}`);
    }

    /**
     * Retirer un provider
     * @param type Type de notification
     * @param nom Nom du provider
     */
    unregister(type: TypeNotification, nom: string): void {
        const key = `${type}:${nom}`;
        this.providers.delete(key);

        // Retirer de la liste par type
        const typeProviders = this.providersParType.get(type) || [];
        const updated = typeProviders.filter((p) => p.nom !== nom);
        this.providersParType.set(type, updated);

        logger.info(`[ProviderRegistry] Provider retiré: ${key}`);
    }

    /**
     * Obtenir un provider spécifique
     * @param type Type de notification
     * @param nom Nom du provider
     */
    getProvider(type: TypeNotification, nom: string): INotificationProvider | undefined {
        const key = `${type}:${nom}`;
        return this.providers.get(key);
    }

    /**
     * Obtenir le provider par défaut pour un type
     * @param type Type de notification
     */
    getDefaultProvider(type: TypeNotification): INotificationProvider | undefined {
        const typeProviders = this.providersParType.get(type) || [];
        // Retourner le premier provider configuré et actif
        return typeProviders.find((p) => p.estConfiguré());
    }

    /**
     * Obtenir tous les providers pour un type
     * @param type Type de notification
     */
    getProvidersByType(type: TypeNotification): INotificationProvider[] {
        return this.providersParType.get(type) || [];
    }

    /**
     * Obtenir tous les providers enregistrés
     */
    getAllProviders(): INotificationProvider[] {
        return Array.from(this.providers.values());
    }

    /**
     * Envoyer une notification avec fallback
     * Essaie le provider par défaut, puis les autres en cas d'échec
     * @param notification Notification à envoyer
     * @returns Résultat de l'envoi
     */
    async sendWithFallback(notification: Notification): Promise<EnvoiResult> {
        const providers = this.getProvidersByType(notification.type);
        
        // Filtrer uniquement les providers configurés
        const availableProviders = providers.filter((p) => p.estConfiguré());

        if (availableProviders.length === 0) {
            return {
                succes: false,
                erreur: `Aucun provider configuré pour le type ${notification.type}`,
            };
        }

        // Essayer chaque provider dans l'ordre
        for (const provider of availableProviders) {
            try {
                logger.debug(`[ProviderRegistry] Tentative avec ${provider.nom} pour ${notification.id}`);
                const result = await provider.envoyer(notification);

                if (result.succes) {
                    logger.info(`[ProviderRegistry] Succès avec ${provider.nom} pour ${notification.id}`);
                    return result;
                }

                logger.warn(
                    `[ProviderRegistry] Échec avec ${provider.nom}: ${result.erreur}`
                );
            } catch (error) {
                logger.error(
                    `[ProviderRegistry] Erreur avec ${provider.nom}`,
                    error
                );
            }
        }

        return {
            succes: false,
            erreur: `Tous les providers ont échoué pour ${notification.type}`,
        };
    }

    /**
     * Vérifier si un type de notification a au moins un provider configuré
     * @param type Type de notification
     */
    hasProvider(type: TypeNotification): boolean {
        const providers = this.getProvidersByType(type);
        return providers.some((p) => p.estConfiguré());
    }

    /**
     * Compter les providers configurés pour un type
     * @param type Type de notification
     */
    countProviders(type: TypeNotification): number {
        return this.getProvidersByType(type).filter((p) => p.estConfiguré()).length;
    }

    /**
     * Réinitialiser le registre (utile pour les tests)
     */
    reset(): void {
        this.providers.clear();
        this.providersParType.forEach((_, type) => {
            this.providersParType.set(type, []);
        });
        logger.info('[ProviderRegistry] Registre réinitialisé');
    }
}

// Export singleton
export const providerRegistry = ProviderRegistry.getInstance();
export default providerRegistry;
