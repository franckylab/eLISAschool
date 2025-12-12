/**
 * eLISAschool - Entités Requêtes
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

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
export class Requete {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

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

    @Column({ type: 'uuid', nullable: true })
    approbateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'approbateurId' })
    approbateur?: Utilisateur;

    @Column({ type: 'text', nullable: true })
    commentaireApprobation?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateApprobation?: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
