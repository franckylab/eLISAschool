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
     * Établissement de l'affectation (multi-tenancy)
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
