/**
 * ==================================
 * eLISAschool - Entités Années Scolaires
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { Periode } from '@modules/periodes/entities';

/**
 * Statut workflow d'une année scolaire
 */
export enum StatutAnneeScolaire {
    OUVERTE = 'OUVERTE',
    EN_COURS = 'EN_COURS',
    EN_ATTENTE_CLOTURE = 'EN_ATTENTE_CLOTURE',
    CLOTUREE = 'CLOTUREE',
}

@Entity('annees_scolaires')
@Index(['etablissementId'])
@Index(['libelle', 'etablissementId'], { unique: true })
export class AnneeScolaire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    libelle!: string; // ex: 2024-2025

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // ex: 2024-2025

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    @Column({ type: 'boolean', default: false })
    enCours!: boolean;

    /**
     * Statut workflow de l'année scolaire
     * Remplace l'ancien champ cloturee (boolean) pour éviter la redondance
     */
    @Column({ type: 'varchar', length: 30, default: StatutAnneeScolaire.OUVERTE })
    statut!: StatutAnneeScolaire;

    /**
     * Getter de compatibilité pour l'ancien champ cloturee
     * @deprecated Utiliser statut === StatutAnneeScolaire.CLOTUREE à la place
     */
    get cloturee(): boolean {
        return this.statut === StatutAnneeScolaire.CLOTUREE;
    }

    /**
     * Établissement de l'année scolaire (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Périodes liées à cette année scolaire (trimestres, semestres, séquences)
     */
    @OneToMany(() => Periode, (periode) => periode.anneeScolaire)
    periodes?: Periode[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
