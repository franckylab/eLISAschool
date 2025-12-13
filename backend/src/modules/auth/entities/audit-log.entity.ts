/**
 * ==================================
 * eLISAschool - Entité Audit Log
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Journalisation des actions sensibles pour la sécurité et la traçabilité
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

/**
 * Types d'actions auditées
 */
export enum AuditAction {
    // Authentification
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    LOGIN_FAILED = 'LOGIN_FAILED',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    PASSWORD_RESET = 'PASSWORD_RESET',

    // Utilisateurs
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',
    USER_SUSPEND = 'USER_SUSPEND',
    USER_ACTIVATE = 'USER_ACTIVATE',
    ROLE_CHANGE = 'ROLE_CHANGE',

    // Documents
    DOCUMENT_CREATE = 'DOCUMENT_CREATE',
    DOCUMENT_DELETE = 'DOCUMENT_DELETE',
    DOCUMENT_PRINT = 'DOCUMENT_PRINT',

    // Notes
    NOTE_CREATE = 'NOTE_CREATE',
    NOTE_UPDATE = 'NOTE_UPDATE',
    NOTE_DELETE = 'NOTE_DELETE',
    NOTE_VALIDATE = 'NOTE_VALIDATE',

    // Configuration
    CONFIG_UPDATE = 'CONFIG_UPDATE',
    MODULE_ACTIVATE = 'MODULE_ACTIVATE',
    MODULE_DEACTIVATE = 'MODULE_DEACTIVATE',

    // Finances
    PAYMENT_RECEIVE = 'PAYMENT_RECEIVE',
    REFUND = 'REFUND',

    // Données
    DATA_EXPORT = 'DATA_EXPORT',
    DATA_IMPORT = 'DATA_IMPORT',
    DATA_DELETE_BULK = 'DATA_DELETE_BULK',

    // Accès
    ACCESS_DENIED = 'ACCESS_DENIED',
    PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

/**
 * Niveau de sévérité
 */
export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

/**
 * Entité AuditLog
 */
@Entity('audit_logs')
@Index(['utilisateurId', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['cible', 'cibleId'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    utilisateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'enum', enum: AuditAction })
    action!: AuditAction;

    @Column({ type: 'enum', enum: AuditSeverity, default: AuditSeverity.INFO })
    severity!: AuditSeverity;

    @Column({ type: 'varchar', length: 100, nullable: true })
    cible?: string; // Type d'entité ciblée (Utilisateur, Note, Document, etc.)

    @Column({ type: 'uuid', nullable: true })
    cibleId?: string; // ID de l'entité ciblée

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'simple-json', nullable: true })
    anciennesValeurs?: Record<string, any>;

    @Column({ type: 'simple-json', nullable: true })
    nouvellesValeurs?: Record<string, any>;

    @Column({ type: 'varchar', length: 45, nullable: true })
    ipAddress?: string;

    @Column({ type: 'text', nullable: true })
    userAgent?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    module?: string; // Module concerné

    @Column({ type: 'boolean', default: false })
    estEchec!: boolean;

    @Column({ type: 'text', nullable: true })
    erreur?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

export default AuditLog;
