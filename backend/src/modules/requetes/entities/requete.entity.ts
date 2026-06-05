/**
 * eLISAschool - Entités Requêtes
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeRequete {
    CONGE = 'CONGE',
    CERTIFICAT = 'CERTIFICAT',
    ATTESTATION = 'ATTESTATION',
    MATERIEL = 'MATERIEL',
    AUTRE = 'AUTRE',
}

export enum StatutRequete {
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    APPROUVEE = 'APPROUVEE',
    REJETEE = 'REJETEE',
    ANNULEE = 'ANNULEE',
}

@Entity('requetes')
@Index(['etablissementId'])
export class Requete {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    numero!: string;

    @Column({ type: 'uuid' })
    demandeurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'demandeurId' })
    demandeur!: Utilisateur;

    @Column({ type: 'enum', enum: TypeRequete })
    type!: TypeRequete;

    @Column({ type: 'varchar', length: 255 })
    sujet!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'enum', enum: StatutRequete, default: StatutRequete.EN_ATTENTE })
    statut!: StatutRequete;

    @Column({ type: 'simple-json', nullable: true })
    piecesJointes?: { nom: string; url: string }[];

    @Column({ type: 'int', default: 1 })
    niveauxApprobation!: number;

    @Column({ type: 'int', default: 0 })
    niveauActuel!: number;

    @Column({ type: 'uuid', nullable: true })
    approbateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'approbateurId' })
    approbateur?: Utilisateur;

    @Column({ type: 'text', nullable: true })
    commentaireTraitement?: string;

    @Column({ type: 'simple-json', nullable: true })
    historiqueApprobation?: any[];

    @Column({ type: 'timestamp', nullable: true })
    dateTraitement?: Date;

    /**
     * Établissement de la requête (multi-tenancy)
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
