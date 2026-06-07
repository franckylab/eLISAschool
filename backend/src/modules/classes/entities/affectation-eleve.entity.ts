/**
 * ==================================
 * eLISAschool - Entités Affectation Eleve
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
import { Classe } from './classe.entity';
import { Eleve } from '@modules/eleves/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut de l'affectation élève (support workflow de validation)
 */
export enum StatutAffectationEleve {
    ACTIVE = 'ACTIVE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIVE = 'INACTIVE',
}

@Entity('affectations_eleves')
@Index(['eleveId'])
@Index(['classeId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
export class AffectationEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    classeId!: string;

    @ManyToOne(() => Classe)
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @Column({ type: 'date' })
    dateAffectation!: Date;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Statut de l'affectation (support workflow de validation)
     */
    @Column({ type: 'varchar', length: 30, default: StatutAffectationEleve.ACTIVE })
    statut!: StatutAffectationEleve;

    /**
     * Établissement de l'affectation (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Index(['eleveId', 'anneeScolaireId'], { unique: true })

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
