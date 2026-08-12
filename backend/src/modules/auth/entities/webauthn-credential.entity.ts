/**
 * ==================================
 * eLISAschool - Entité WebAuthn Credential
 * ==================================
 * Durcissement v9 — WebAuthn/FIDO2 Passwordless + MFA
 *
 * Stocke les credentials WebAuthn (passkeys, YubiKey, etc.)
 * associées à un utilisateur pour l'authentification sans mot de passe
 * ou comme facteur d'authentification supplémentaire.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Utilisateur } from './utilisateur.entity';

@Entity('webauthn_credentials')
@Index(['utilisateurId'])
@Index(['credentialId'], { unique: true })
export class WebAuthnCredential {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    /** Identifiant unique de la credential (fourni par l'authentificateur) */
    @Column({ type: 'text' })
    credentialId!: string;

    /** Clé publique de la credential (encodée en base64) */
    @Column({ type: 'text' })
    publicKey!: string;

    /** Compteur de signatures (détection de clonage d'authentificateur) */
    @Column({ type: 'bigint', default: 0 })
    counter!: number;

    /** Transports supportés par l'authentificateur (usb, nfc, ble, internal, hybrid) */
    @Column({ type: 'simple-json', nullable: true })
    transports?: string[];

    /** Indique si la credential est sauvegardée (backup eligible) */
    @Column({ type: 'boolean', default: false })
    estBackedUp!: boolean;

    /** Label descriptif donné par l'utilisateur (ex: "YubiKey Bureau", "iPhone Passkey") */
    @Column({ type: 'varchar', length: 100, nullable: true })
    label?: string;

    /** Date de dernière utilisation de la credential */
    @Column({ type: 'timestamp', nullable: true })
    derniereUtilisation?: Date;

    /** AAGUID de l'authentificateur (identifie le fabricant/modèle) */
    @Column({ type: 'varchar', length: 36, nullable: true })
    aaguid?: string;

    /** Type d'authentificateur (platform = device, cross-platform = external) */
    @Column({ type: 'varchar', length: 20, nullable: true })
    authenticatorType?: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

// Export nommé pour TypeORM (détection automatique via glob pattern)
