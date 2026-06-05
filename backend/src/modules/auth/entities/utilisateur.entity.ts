/**
 * ==================================
 * eLISAschool - Entité Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Rôles utilisateur - importés depuis shared
 */
export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    CHEF_ETABLISSEMENT = 'CHEF_ETABLISSEMENT',
    ENSEIGNANT = 'ENSEIGNANT',
    PERSONNEL = 'PERSONNEL',
    RESPONSABLE_CANTINE = 'RESPONSABLE_CANTINE',
    RESPONSABLE_TRANSPORT = 'RESPONSABLE_TRANSPORT',
    PARENT = 'PARENT',
    ELEVE = 'ELEVE',
}

/**
 * Statut utilisateur
 */
export enum StatutUtilisateur {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
}

/**
 * Entité Utilisateur
 * Table principale pour l'authentification et l'identification des utilisateurs
 */
@Entity('utilisateurs')
export class Utilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    matricule!: string;

    @Column({ type: 'varchar', length: 255, select: false })
    motDePasse!: string;

    @Column({ type: 'enum', enum: Role, default: Role.ELEVE })
    role!: Role;

    @Column({ type: 'enum', enum: StatutUtilisateur, default: StatutUtilisateur.EN_ATTENTE_VALIDATION })
    statut!: StatutUtilisateur;

    @Column({ type: 'boolean', default: false })
    emailVerifie!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tokenVerificationEmail?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    tokenReinitialisationMdp?: string;

    @Column({ type: 'timestamp', nullable: true })
    expirationTokenMdp?: Date;

    @Column({ type: 'int', default: 0 })
    tentativesConnexion!: number;

    @Column({ type: 'timestamp', nullable: true })
    bloqueJusqua?: Date;

    @Column({ type: 'timestamp', nullable: true })
    derniereConnexion?: Date;

    @Column({ type: 'varchar', length: 10, default: 'fr' })
    langue!: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    /**
     * Relation vers l'établissement de l'utilisateur.
     * Nullable car le SUPER_ADMIN peut ne pas être rattaché à un établissement.
     */
    @ManyToOne(() => Etablissement, { nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    /**
     * Hash automatique du mot de passe avant insertion
     */
    @BeforeInsert()
    @BeforeUpdate()
    async hashMotDePasse(): Promise<void> {
        if (this.motDePasse && !this.motDePasse.startsWith('$2')) {
            const salt = await bcrypt.genSalt(12);
            this.motDePasse = await bcrypt.hash(this.motDePasse, salt);
        }
    }

    /**
     * Vérifie si le mot de passe correspond
     * @param motDePasse - Mot de passe en clair à vérifier
     */
    async verifierMotDePasse(motDePasse: string): Promise<boolean> {
        return bcrypt.compare(motDePasse, this.motDePasse);
    }

    /**
     * Vérifie si l'utilisateur est bloqué
     */
    estBloque(): boolean {
        if (!this.bloqueJusqua) return false;
        return new Date() < this.bloqueJusqua;
    }

    /**
     * Génère un matricule unique
     */
    static genererMatricule(prefix: string = 'EL'): string {
        const annee = new Date().getFullYear().toString().slice(-2);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${annee}${random}`;
    }
}

export default Utilisateur;
