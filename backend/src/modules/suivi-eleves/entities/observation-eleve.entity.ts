/**
 * ==================================
 * eLISAschool - Entité ObservationEleve
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { Eleve } from '@modules/eleves/entities';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';

export enum TypeObservation {
    POSITIVE = 'POSITIVE',
    NEGATIVE = 'NEGATIVE',
    NEUTRE = 'NEUTRE',
}

@Entity('observations_eleves')
@Index(['eleveId'])
@Index(['observateurId'])
@Index(['type'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'eleveId']) // ← NOUVEAU: historique par année
export class ObservationEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    observateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'observateurId' })
    observateur?: Utilisateur;

    @Column({ type: 'varchar', length: 20 })
    type!: TypeObservation;

    @Column({ type: 'varchar', length: 200 })
    categorie!: string; // COMPORTEMENT, PARTICIPATION, PROGRES, EFFORT, AUTRE

    @Column({ type: 'text' })
    commentaire!: string;

    @Column({ type: 'int', default: 0 })
    pointsImpact!: number; // Points gamification

    @Column({ type: 'boolean', default: false })
    visibleParent!: boolean;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // ==================== LIEN PÉRIODE ACADÉMIQUE ====================
    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
