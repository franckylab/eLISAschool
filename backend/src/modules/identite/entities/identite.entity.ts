/**
 * ==================================
 * eLISAschool - Entité Identite
 * ==================================
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 *
 * Source unique de vérité pour l'identité globale.
 * Une identité = un email + credentials + MFA.
 * Peut avoir N memberships (plateforme + établissements).
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm';
import bcrypt from 'bcryptjs';
import { StatutIdentite } from '@shared/enums/platform-roles.enum';

/**
 * Entité Identite — identité globale unique.
 * Table : identites
 */
@Entity('identites')
export class Identite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    @Index()
    email!: string;

    @Column({ type: 'boolean', default: false })
    emailVerifie!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    motDePasseHash?: string;

    @Column({ type: 'boolean', default: false })
    mfaActive!: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    mfaSecret?: string;

    @Column({ type: 'timestamp', nullable: true })
    derniereConnexion?: Date;

    @Column({ type: 'varchar', length: 20, default: StatutIdentite.ACTIF })
    @Index()
    statut!: StatutIdentite;

    // =============================================
    // Relations
    // =============================================

    @OneToMany('UtilisateurPlateforme', 'identite')
    utilisateurPlateforme?: import('./utilisateur-plateforme.entity').UtilisateurPlateforme[];

    @OneToMany('Membership', 'identite')
    memberships?: import('./membership.entity').Membership[];

    // =============================================
    // Hooks lifecycle
    // =============================================

    @BeforeInsert()
    @BeforeUpdate()
    async hashMotDePasseAuto(): Promise<void> {
        if (this.motDePasseHash && !this.motDePasseHash.startsWith('$2')) {
            const salt = await bcrypt.genSalt(12);
            this.motDePasseHash = await bcrypt.hash(this.motDePasseHash, salt);
        }
    }

    /**
     * Vérifie si le mot de passe correspond.
     */
    async verifierMotDePasse(motDePasse: string): Promise<boolean> {
        if (!this.motDePasseHash) return false;
        return bcrypt.compare(motDePasse, this.motDePasseHash);
    }
}
