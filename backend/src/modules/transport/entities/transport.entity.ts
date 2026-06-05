/**
 * eLISAschool - Entités Transport
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { Eleve } from '@modules/eleves/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('lignes_transport')
@Index(['etablissementId'])
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

    /**
     * Établissement de la ligne de transport (multi-tenancy)
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

@Entity('inscriptions_transport')
@Index(['etablissementId'])
export class InscriptionTransport {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

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

    /**
     * Établissement de l'inscription transport (multi-tenancy)
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

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
