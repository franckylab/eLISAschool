/**
 * eLISAschool - Entités Parking
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('places_parking')
@Index(['etablissementId'])
@Index(['statut'])
@Index(['type'])
@Index(['etablissementId', 'statut'])
export class PlaceParking {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20, unique: true })
    numero!: string;

    @Column({ type: 'varchar', length: 20, default: 'standard' })
    type!: 'standard' | 'pmr' | 'visiteur' | 'reservation';

    @Column({ type: 'varchar', length: 20, default: 'libre' })
    statut!: 'libre' | 'occupee' | 'reservee' | 'maintenance';

    @Column({ type: 'uuid', nullable: true })
    vehiculeId?: string;

    @Column({ type: 'uuid', nullable: true })
    abonnementId?: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    tarifHoraire?: number;

    /**
     * Établissement de la place de parking (multi-tenancy)
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

@Entity('vehicules')
@Index(['etablissementId'])
@Index(['proprietaireId'])
@Index(['immatriculation'])
@Index(['etablissementId', 'proprietaireId'])
export class Vehicule {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    proprietaireId!: string;

    @Column({ type: 'varchar', length: 50 })
    immatriculation!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    marque?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    modele?: string;

    @Column({ type: 'varchar', length: 30, nullable: true })
    couleur?: string;

    @Column({ type: 'varchar', length: 20, default: 'voiture' })
    type!: 'voiture' | 'moto' | 'velo' | 'autre';

    @Column({ type: 'uuid', nullable: true })
    placeParkingId?: string;

    /**
     * Établissement du véhicule (multi-tenancy)
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

@Entity('abonnements_parking')
@Index(['etablissementId'])
@Index(['titulaireId'])
@Index(['vehiculeId'])
@Index(['statut'])
@Index(['etablissementId', 'statut'])
export class AbonnementParking {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    titulaireId!: string;

    @Column({ type: 'uuid' })
    vehiculeId!: string;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    tarif!: number;

    @Column({ type: 'varchar', length: 20, default: 'actif' })
    statut!: 'actif' | 'expire' | 'suspendu';

    /**
     * Établissement de l'abonnement (multi-tenancy)
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
