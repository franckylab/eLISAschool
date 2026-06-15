/**
 * ==================================
 * eLISAschool - Entités Classes
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
    Index,
} from 'typeorm';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type de classe (contexte camerounais)
 */
export enum TypeClasse {
    NORMALE = 'NORMALE',
    BILINGUE = 'BILINGUE',
    RENFORCEE = 'RENFORCEE',
    INTERNATIONALE = 'INTERNATIONALE',
}

/**
 * Créneau horaire principal
 */
export enum CreneauHoraire {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_COMPLETE = 'JOURNEE_COMPLETE',
}

@Entity('classes')
@Index(['niveauId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['etablissementId', 'anneeScolaireId'])
@Index(['etablissementId', 'niveauId'])
@Index(['filiereId'])
@Index(['typeClasse'])
export class Classe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // ex: 6ème A, Form 1 A

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // ex: 6E_A

    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => Niveau)
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'uuid', nullable: true })
    professeurPrincipalId?: string;

    @ManyToOne(() => MembrePersonnel)
    @JoinColumn({ name: 'professeurPrincipalId' })
    professeurPrincipal?: MembrePersonnel;

    @Column({ type: 'uuid', nullable: true })
    filiereId?: string;

    @ManyToOne(() => Filiere, { nullable: true })
    @JoinColumn({ name: 'filiereId' })
    filiere?: Filiere;

    @Column({ type: 'int', default: 50 })
    effectifMax!: number;

    @Column({ type: 'int', default: 0 })
    effectifActuel!: number;

    @Column({ type: 'varchar', length: 20, default: TypeClasse.NORMALE })
    typeClasse!: TypeClasse;

    @Column({ type: 'varchar', length: 20, default: CreneauHoraire.MATIN })
    creneauHoraire!: CreneauHoraire;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    /**
     * Établissement auquel la classe appartient (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
