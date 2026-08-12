/**
 * ==================================
 * eLISAschool - Entité Clé Cryptographique
 * ==================================
 * Durcissement v9 — KeyManager en base + rotation automatique.
 *
 * Gère le cycle de vie des clés cryptographiques :
 * - JWT_SECRET (signature tokens)
 * - ENCRYPTION (chiffrement AES-256-GCM)
 * - MFA (chiffrement secrets TOTP)
 * - AUDIT_HMAC (signature chaîne audit logs)
 *
 * Chaque rotation crée une nouvelle version, l'ancienne passe en
 * ROTATION (grace period 7j) puis REVOQUEE.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

/**
 * Types de clés cryptographiques gérées par le KeyManager
 */
export enum TypeCleCryptographique {
    JWT = 'JWT',
    ENCRYPTION = 'ENCRYPTION',
    MFA = 'MFA',
    AUDIT_HMAC = 'AUDIT_HMAC',
}

/**
 * Statut d'une clé dans son cycle de vie
 */
export enum StatutCleCryptographique {
    /** Clé active, utilisée pour les opérations courantes */
    ACTIVE = 'ACTIVE',
    /** Clé en période de grâce (rotation en cours, 7 jours) */
    ROTATION = 'ROTATION',
    /** Clé révoquée, ne doit plus être utilisée */
    REVOQUEE = 'REVOQUEE',
}

@Entity('cles_cryptographiques')
@Index(['type', 'statut'])
@Index(['nom'], { unique: true })
export class CleCryptographique {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Nom unique identifiant la clé (ex: "jwt-primary", "encryption-v2") */
    @Column({ type: 'varchar', length: 100, unique: true })
    nom!: string;

    /** Type de clé (JWT, ENCRYPTION, MFA, AUDIT_HMAC) */
    @Column({ type: 'enum', enum: TypeCleCryptographique })
    type!: TypeCleCryptographique;

    /**
     * Valeur de la clé, chiffrée en AES-256-GCM.
     * La clé de chiffrement est la MASTER_KEY (dans .env).
     */
    @Column({ type: 'text' })
    valeur!: string;

    /** Statut actuel de la clé dans son cycle de vie */
    @Column({
        type: 'enum',
        enum: StatutCleCryptographique,
        default: StatutCleCryptographique.ACTIVE,
    })
    statut!: StatutCleCryptographique;

    /** Date de la dernière rotation de cette clé */
    @Column({ type: 'timestamp', nullable: true })
    dateRotation?: Date;

    /** Date d'expiration optionnelle (null = pas d'expiration) */
    @Column({ type: 'timestamp', nullable: true })
    dateExpiration?: Date;

    /** Numéro de version (auto-incrémenté à chaque rotation) */
    @Column({ type: 'int', default: 1 })
    version!: number;

    /** Durée de rotation configurée en jours (défaut 90) */
    @Column({ type: 'int', default: 90 })
    dureeRotationJours!: number;

    /** Créé par (utilisateur plateforme) */
    @Column({ type: 'uuid', nullable: true })
    creePar?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Vérifie si la clé est expirée
     */
    estExpiree(): boolean {
        if (!this.dateExpiration) return false;
        return new Date() > this.dateExpiration;
    }

    /**
     * Vérifie si la clé est utilisable (active + non expirée)
     */
    estUtilisable(): boolean {
        return this.statut === StatutCleCryptographique.ACTIVE && !this.estExpiree();
    }

    /**
     * Vérifie si la clé doit être tournée (rotation overdue)
     */
    necessiteRotation(): boolean {
        if (this.statut !== StatutCleCryptographique.ACTIVE) return false;
        if (!this.dateRotation) return true; // Jamais tournée

        const joursDepuisRotation = (Date.now() - this.dateRotation.getTime()) / (1000 * 60 * 60 * 24);
        return joursDepuisRotation >= this.dureeRotationJours;
    }
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
