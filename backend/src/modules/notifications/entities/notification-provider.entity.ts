/**
 * ==================================
 * eLISAschool - Entité NotificationProvider
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Stocke la configuration des providers de notifications
 * Permet d'ajouter, configurer, activer/désactiver des providers
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { TypeNotification } from './notification.entity';

/**
 * Services supportés pour chaque type
 */
export enum ServiceNotification {
    // Email
    NODEMAILER = 'nodemailer',
    SENDGRID = 'sendgrid',
    MAILGUN = 'mailgun',
    AWS_SES = 'aws-ses',
    
    // SMS
    TWILIO = 'twilio',
    VONAGE = 'vonage',
    AFRICAS_TALKING = 'africas-talking',
    OVH_SMS = 'ovh-sms',
    
    // Push
    FIREBASE_FCM = 'firebase-fcm',
    ONESIGNAL = 'onesignal',
    
    // In-App
    IN_APP = 'in-app',
}

/**
 * Entité NotificationProvider
 */
@Entity('notification_providers')
@Index(['type', 'actif'])
@Index(['etablissementId'])
@Index(['estDefaut'])
export class NotificationProvider {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Nom affiché du provider (ex: 'SMTP Principal', 'Firebase Production') */
    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    /** Type de notification géré */
    @Column({ type: 'enum', enum: TypeNotification })
    type!: TypeNotification;

    /** Service utilisé (nodemailer, firebase, twilio, etc.) */
    @Column({ type: 'enum', enum: ServiceNotification })
    service!: ServiceNotification;

    /** Provider actif ou non */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /** Est-ce le provider par défaut pour ce type */
    @Column({ type: 'boolean', default: false })
    estDefaut!: boolean;

    /**
     * Configuration JSON du provider
     * Ex SMTP: { host, port, user, password, from, tls }
     * Ex Firebase: { projectId, serverKey, vapidKey }
     * Ex Twilio: { accountSid, authToken, fromNumber }
     */
    @Column({ type: 'simple-json' })
    configuration!: Record<string, any>;

    /** Quota journalier (0 = illimité) */
    @Column({ type: 'int', default: 0 })
    quotaJournalier!: number;

    /** Quota utilisé aujourd'hui */
    @Column({ type: 'int', default: 0 })
    quotaUtilise!: number;

    /** Priorité pour le fallback (1 = primaire, 2 = secondaire, etc.) */
    @Column({ type: 'int', default: 1 })
    priorite!: number;

    /** ID de l'établissement (null = global) */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    /** Description du provider */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Date de dernière tentative d'envoi échouée */
    @Column({ type: 'timestamp', nullable: true })
    derniereErreurAt?: Date;

    /** Message de la dernière erreur */
    @Column({ type: 'text', nullable: true })
    dernierMessageErreur?: string;

    /** Compteur d'erreurs consécutives */
    @Column({ type: 'int', default: 0 })
    erreursConsecutives!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // ============================================
    // Helpers
    // ============================================

    /**
     * Vérifier si le quota est atteint
     */
    isQuotaAtteint(): boolean {
        if (this.quotaJournalier === 0) return false; // Illimité
        return this.quotaUtilise >= this.quotaJournalier;
    }

    /**
     * Incrémenter le quota utilisé
     */
    incrementerQuota(): void {
        this.quotaUtilise++;
    }

    /**
     * Réinitialiser le quota (appelé chaque jour)
     */
    resetQuota(): void {
        this.quotaUtilise = 0;
    }

    /**
     * Enregistrer une erreur
     */
    enregistrerErreur(message: string): void {
        this.derniereErreurAt = new Date();
        this.dernierMessageErreur = message;
        this.erreursConsecutives++;
    }

    /**
     * Réinitialiser le compteur d'erreurs (après un succès)
     */
    resetErreurs(): void {
        this.erreursConsecutives = 0;
        this.derniereErreurAt = undefined;
        this.dernierMessageErreur = undefined;
    }
}

export default NotificationProvider;
