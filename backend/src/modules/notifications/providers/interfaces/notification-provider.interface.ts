/**
 * ==================================
 * eLISAschool - Interface Notification Provider
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Interface commune pour tous les providers de notifications
 * Permet d'ajouter, configurer et switcher entre providers
 */

import { TypeNotification } from '../../entities';
import { Notification } from '../../entities/notification.entity';

/**
 * Résultat d'un envoi de notification
 */
export interface EnvoiResult {
    succes: boolean;
    idExterne?: string; // ID du provider externe (ex: message ID Twilio)
    erreur?: string;
    cout?: number; // Coût pour les services payants (SMS)
    details?: Record<string, any>; // Métadonnées additionnelles
}

/**
 * Information de quota d'un provider
 */
export interface QuotaInfo {
    utilise: number;
    limite: number;
    restant: number;
    pourcentage: number;
}

/**
 * Interface pour les providers de notifications
 * Chaque type (EMAIL, SMS, PUSH, IN_APP) doit implémenter cette interface
 */
export interface INotificationProvider {
    /** Type de notification géré par ce provider */
    readonly type: TypeNotification;
    
    /** Nom unique du provider (ex: 'smtp-primary', 'firebase-fcm') */
    readonly nom: string;
    
    /** Nom du service (ex: 'nodemailer', 'firebase', 'twilio') */
    readonly service: string;
    
    /**
     * Envoyer une notification
     * @param notification La notification à envoyer
     * @returns Résultat de l'envoi
     */
    envoyer(notification: Notification): Promise<EnvoiResult>;
    
    /**
     * Tester la configuration du provider
     * @param config Configuration JSON à tester
     * @returns true si la configuration est valide
     */
    testerConfiguration(config: Record<string, any>): Promise<boolean>;
    
    /**
     * Récupérer les informations de quota
     * @returns Informations sur l'utilisation du quota
     */
    getQuota?(): Promise<QuotaInfo>;
    
    /**
     * Initialiser le provider avec sa configuration
     * @param config Configuration du provider
     */
    initialiser(config: Record<string, any>): void;
    
    /**
     * Vérifier si le provider est correctement configuré
     * @returns true si prêt à envoyer
     */
    estConfiguré(): boolean;
}

export default INotificationProvider;
