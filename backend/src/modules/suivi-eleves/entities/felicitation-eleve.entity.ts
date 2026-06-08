/**
 * ==================================
 * eLISAschool - Entité FelicitationEleve
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

export enum TypeFelicitation {
    EXCELLENCE_ACADEMIQUE = 'EXCELLENCE_ACADEMIQUE',
    PROGRES_REMARQUABLE = 'PROGRES_REMARQUABLE',
    COMPORTEMENT_EXEMPLAIRE = 'COMPORTEMENT_EXEMPLAIRE',
    ACTIVITE_PARASCOLAIRE = 'ACTIVITE_PARASCOLAIRE',
    MERITE_SPECIAL = 'MERITE_SPECIAL',
}

@Entity('felicitations_eleves')
@Index(['eleveId'])
@Index(['type'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'eleveId']) // ← NOUVEAU
export class FelicitationEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'varchar', length: 40 })
    type!: TypeFelicitation;

    @Column({ type: 'text' })
    motif!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    pointsBonus!: number; // Points gamification

    @Column({ type: 'boolean', default: true })
    visibleBulletin!: boolean;

    @Column({ type: 'boolean', default: true })
    visibleParent!: boolean;

    @Column({ type: 'uuid' })
    attribueParId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'attribueParId' })
    attribuePar?: Utilisateur;

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
