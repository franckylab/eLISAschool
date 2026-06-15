/**
 * ==================================
 * eLISAschool - Entités Périodes
 * ==================================
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
import { AnneeScolaire } from '@modules/annees-scolaires/entities';

/**
 * Statut de la période (support workflow de clôture)
 */
export enum StatutPeriode {
    OUVERTE = 'OUVERTE',
    EN_ATTENTE_CLOTURE = 'EN_ATTENTE_CLOTURE',
    CLOTUREE = 'CLOTUREE',
}

@Entity('types_periodes')
export class TypePeriode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // TRIMESTRE, SEMESTRE, SEQUENCE, TERM

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('periodes')
@Index(['anneeScolaireId'])
@Index(['typeId'])
export class Periode {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // Trimestre 1, Séquence 1...

    @Column({ type: 'uuid' })
    typeId!: string;

    @ManyToOne(() => TypePeriode)
    @JoinColumn({ name: 'typeId' })
    type?: TypePeriode;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'float', default: 1 })
    poids!: number; // Pour le calcul annuel

    /**
     * Statut de la période (support workflow de clôture)
     * Remplace l'ancien champ cloturee (boolean)
     */
    @Column({ type: 'varchar', length: 30, default: StatutPeriode.OUVERTE })
    statut!: StatutPeriode;

    /**
     * Getter de compatibilité pour l'ancien champ cloturee
     * @deprecated Utiliser statut === StatutPeriode.CLOTUREE à la place
     */
    get cloturee(): boolean {
        return this.statut === StatutPeriode.CLOTUREE;
    }

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
