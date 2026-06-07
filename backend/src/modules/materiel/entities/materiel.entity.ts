/**
 * eLISAschool - Entités Matériel
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';

export enum CategorieMateriel {
    LIVRE = 'LIVRE',
    BUREAU = 'BUREAU',
    ORDINATEUR = 'ORDINATEUR',
    SPORTIF = 'SPORTIF',
    AUDIOVISUEL = 'AUDIOVISUEL',
    AUTRE = 'AUTRE',
}

export enum EtatMateriel {
    NEUF = 'NEUF',
    BON = 'BON',
    USAGE = 'USAGE',
    ABIME = 'ABIME',
    HS = 'HS',
}

/**
 * Statut workflow du matériel
 */
export enum StatutMateriel {
    DISPONIBLE = 'DISPONIBLE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INDISPONIBLE = 'INDISPONIBLE',
}

@Entity('materiels')
@Index(['etablissementId'])
export class Materiel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    reference?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    numeroSerie?: string;

    @Column({ type: 'enum', enum: CategorieMateriel })
    categorie!: CategorieMateriel;

    @Column({ type: 'enum', enum: EtatMateriel, default: EtatMateriel.BON })
    etat!: EtatMateriel;

    @Column({ type: 'int', default: 1 })
    quantite!: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    localisation?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    valeur?: number;

    @Column({ type: 'date', nullable: true })
    dateAcquisition?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: true })
    disponible!: boolean;

    @Column({ type: 'varchar', length: 30, default: StatutMateriel.DISPONIBLE })
    statut!: StatutMateriel;

    /**
     * Établissement du matériel (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

/**
 * Statut workflow d'un prêt de matériel
 */
export enum StatutPretMateriel {
    EN_COURS = 'EN_COURS',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    RETOURNE = 'RETOURNE',
    REFUSE = 'REFUSE',
}

@Entity('prets_materiels')
export class PretMateriel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    materielId!: string;

    @ManyToOne(() => Materiel)
    @JoinColumn({ name: 'materielId' })
    materiel!: Materiel;

    @Column({ type: 'uuid' })
    emprunteurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'emprunteurId' })
    emprunteur!: Utilisateur;

    @Column({ type: 'int', default: 1 })
    quantite!: number;

    @Column({ type: 'date' })
    datePret!: Date;

    @Column({ type: 'date', nullable: true })
    dateRetourPrevue?: Date;

    @Column({ type: 'date', nullable: true })
    dateRetourEffective?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: false })
    retourne!: boolean;

    @Column({ type: 'varchar', length: 30, default: StatutPretMateriel.EN_COURS })
    statut!: StatutPretMateriel;

    /**
     * Établissement du prêt (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;
}
