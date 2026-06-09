/**
 * ==================================
 * eLISAschool - Listener de Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * EventEmitter pour les changements de configuration
 * Permet aux modules de s'abonner aux modifications
 */

import { EventEmitter } from 'events';
import { CibleConfiguration, ActionConfiguration } from '../entities/historique-configuration.entity';
import { logger } from '@common/utils/logger.util';

/**
 * Événement de changement de configuration
 */
export interface ConfigChangeEvent {
    action: ActionConfiguration;
    cible: CibleConfiguration;
    cibleId?: string;
    cibleNom?: string;
    ancienneValeur?: any;
    nouvelleValeur?: any;
    timestamp: Date;
    utilisateurId?: string;
}

/**
 * Types d'événements
 */
export enum ConfigEvent {
    /** Tout changement de configuration */
    CHANGE = 'config:change',
    /** Changement de configuration app */
    APP_CHANGE = 'config:app:change',
    /** Changement de configuration module */
    MODULE_CHANGE = 'config:module:change',
    /** Changement de paramètre */
    PARAM_CHANGE = 'config:param:change',
    /** Cache invalidé */
    CACHE_INVALIDATED = 'config:cache:invalidated',
    /** Configuration restaurée */
    RESTORED = 'config:restored',
}

/**
 * Listener centralisé pour les changements de configuration
 */
class ConfigurationListener extends EventEmitter {
    private static instance: ConfigurationListener;

    private constructor() {
        super();
        this.setMaxListeners(50);
    }

    static getInstance(): ConfigurationListener {
        if (!ConfigurationListener.instance) {
            ConfigurationListener.instance = new ConfigurationListener();
        }
        return ConfigurationListener.instance;
    }

    /**
     * Émet un événement de changement de configuration
     */
    emitChange(event: ConfigChangeEvent): void {
        // Émet l'événement général
        this.emit(ConfigEvent.CHANGE, event);

        // Émet l'événement spécifique selon la cible
        switch (event.cible) {
            case CibleConfiguration.APP:
                this.emit(ConfigEvent.APP_CHANGE, event);
                break;
            case CibleConfiguration.MODULE:
                this.emit(ConfigEvent.MODULE_CHANGE, event);
                // Émet aussi pour le module spécifique
                if (event.cibleNom) {
                    this.emit(`config:module:${event.cibleNom}:change`, event);
                }
                break;
            case CibleConfiguration.PARAMETRE:
                this.emit(ConfigEvent.PARAM_CHANGE, event);
                // Émet aussi pour le paramètre spécifique
                if (event.cibleNom) {
                    this.emit(`config:param:${event.cibleNom}:change`, event);
                }
                break;
        }

        logger.debug(`[ConfigListener] Événement émis: ${event.cible}/${event.action}`);
    }

    /**
     * Émet un événement d'invalidation de cache
     */
    emitCacheInvalidated(type?: 'app' | 'modules' | 'parametres'): void {
        this.emit(ConfigEvent.CACHE_INVALIDATED, { type, timestamp: new Date() });
        logger.debug(`[ConfigListener] Cache invalidé: ${type || 'all'}`);
    }

    /**
     * Émet un événement de restauration
     */
    emitRestored(details: { from: string; timestamp: Date }): void {
        this.emit(ConfigEvent.RESTORED, details);
        logger.info(`[ConfigListener] Configuration restaurée depuis ${details.from}`);
    }

    /**
     * S'abonne aux changements d'un paramètre spécifique
     */
    onParamChange(cle: string, callback: (event: ConfigChangeEvent) => void): void {
        this.on(`config:param:${cle}:change`, callback);
    }

    /**
     * S'abonne aux changements d'un module spécifique
     */
    onModuleChange(moduleName: string, callback: (event: ConfigChangeEvent) => void): void {
        this.on(`config:module:${moduleName}:change`, callback);
    }

    /**
     * S'abonne à tous les changements
     */
    onChange(callback: (event: ConfigChangeEvent) => void): void {
        this.on(ConfigEvent.CHANGE, callback);
    }

    /**
     * Retire un listener
     */
    offChange(callback: (event: ConfigChangeEvent) => void): void {
        this.off(ConfigEvent.CHANGE, callback);
    }
}

export const configurationListener = ConfigurationListener.getInstance();
export default configurationListener;
