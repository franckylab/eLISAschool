

/**
 * ==================================
 * eLISAschool - Entité Responsable Élève
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Description: Table de jointure pour gérer la relation multi-parents
 * entre les utilisateurs (rôle PARENT) et les élèves.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities/utilisateur.entity';

/**
 * Type de lien de parenté
 */
export enum LienParente {
    PERE = 'PERE',
    MERE = 'MERE',
    TUTEUR_LEGAL = 'TUTEUR_LEGAL',
    AUTRE = 'AUTRE',
}

/**
 * Entité ResponsableEleve
 * 
 * Gère les relations entre parents/tuteurs et élèves.
 * Permet :
 * - Multi-parents (plusieurs responsables par élève)
 * - Multi-enfants (un parent avec plusieurs enfants)
 * - Permissions granulaires (consultation, paiement)
 * - Distinction responsable légal vs contact secondaire
 */
@Entity('responsables_eleves')
@Index(['enfantId', 'utilisateurId'], { unique: true })
@Index(['enfantId'])
@Index(['utilisateurId'])
export class ResponsableEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * L'utilisateur qui est parent/tuteur (rôle PARENT)
     */
    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    /**
     * L'utilisateur qui est élève (utilisateurId de l'élève)
     * Note: On utilise utilisateurId et non eleve.id car c'est le lien utilisateur qui compte
     */
    @Column({ type: 'uuid' })
    enfantId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'enfantId' })
    enfant!: Utilisateur;

    /**
     * Type de lien de parenté
     */
    @Column({ type: 'varchar', length: 50 })
    lienParente!: LienParente;

    /**
     * Indique si ce responsable a l'autorité légale décisionnelle
     * (inscription, exclusion, orientation, etc.)
     */
    @Column({ type: 'boolean', default: true })
    responsableLegal!: boolean;

    /**
     * Peut consulter les notes, bulletins, présence
     */
    @Column({ type: 'boolean', default: true })
    peutConsulter!: boolean;

    /**
     * Peut effectuer des paiements (cantine, transport, frais)
     */
    @Column({ type: 'boolean', default: false })
    peutPayer!: boolean;

    /**
     * Email de contact (peut être différent de utilisateur.email)
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    email?: string;

    /**
     * Téléphone de contact
     */
    @Column({ type: 'varchar', length: 20, nullable: true })
    telephone?: string;

    /**
     * Adresse postale
     */
    @Column({ type: 'varchar', length: 255, nullable: true })
    adresse?: string;

    /**
     * Champs d'identification additionnels (v2.0)
     */
    @Column({ type: 'varchar', length: 200, nullable: true })
    profession?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    lieuTravail?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneTravail?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    emailTravail?: string;

    @Column({ type: 'text', nullable: true })
    adresseProfessionnelle?: string;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    revenuMensuel?: number;

    @Column({ type: 'varchar', length: 200, nullable: true })
    personneContactUrgence?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    telephoneContactUrgence?: string;

    @Column({ type: 'boolean', default: true })
    autorisationSortie!: boolean;

    @Column({ type: 'boolean', default: true })
    autorisationMedicale!: boolean;

    /**
     * Date d'ajout de cette relation
     */
    @CreateDateColumn({ type: 'timestamp' })
    dateAjout!: Date;

    /**
     * Relation active ou désactivée
     */
    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}
