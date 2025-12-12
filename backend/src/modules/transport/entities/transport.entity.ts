/**
 * eLISAschool - Entités Transport
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

@Entity('lignes_transport')
export class LigneTransport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 20 })
    numeroLigne!: string;

    @Column({ type: 'simple-json' })
    arrets!: { nom: string; heure: string; ordre: number }[];

    @Column({ type: 'uuid', nullable: true })
    chauffeurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'chauffeurId' })
    chauffeur?: Utilisateur;

    @Column({ type: 'varchar', length: 50, nullable: true })
    immatriculation?: string;

    @Column({ type: 'int', default: 50 })
    capacite!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    tarif!: number;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('inscriptions_transport')
export class InscriptionTransport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Utilisateur;

    @Column({ type: 'uuid' })
    ligneId!: string;

    @ManyToOne(() => LigneTransport)
    @JoinColumn({ name: 'ligneId' })
    ligne!: LigneTransport;

    @Column({ type: 'varchar', length: 100 })
    arretMontee!: string;

    @Column({ type: 'varchar', length: 100 })
    arretDescente!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    soldePaye!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('presences_transport')
export class PresenceTransport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    inscriptionId!: string;

    @ManyToOne(() => InscriptionTransport)
    @JoinColumn({ name: 'inscriptionId' })
    inscription!: InscriptionTransport;

    @Column({ type: 'date' })
    date!: Date;

    @Column({ type: 'varchar', length: 20, default: 'aller' })
    trajet!: string; // aller, retour

    @Column({ type: 'boolean', default: false })
    present!: boolean;

    @Column({ type: 'time', nullable: true })
    heureMontee?: string;

    @CreateDateColumn()
    createdAt!: Date;
}
