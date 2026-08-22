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
import type { ICloturable, StatutCloturable } from '@shared/interfaces/cloturable.interface';

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
export class AnneeScolaire implements ICloturable {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    libelle!: string; // ex: 2024-2025

    @Column({ type: 'date' })
    dateDebut!: Date;

    @Column({ type: 'date' })
    dateFin!: Date;

    /**
     * Statut workflow de l'année scolaire (source unique de vérité)
     * Remplace l'ancien champ enCours (boolean) et cloturee (boolean)
     */
    @Column({ type: 'varchar', length: 30, default: StatutAnneeScolaire.OUVERTE })
    statut!: StatutAnneeScolaire;

    /**
     * Getter de compatibilité — dérivé de statut.
     * Équivalent à `statut === StatutAnneeScolaire.EN_COURS`
     */
    get enCours(): boolean {
        return this.statut === StatutAnneeScolaire.EN_COURS;
    }

    /**
     * Implémentation ICloturable — nom affichable pour logs/messages
     */
    get nomOuLibelle(): string {
        return this.libelle;
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
