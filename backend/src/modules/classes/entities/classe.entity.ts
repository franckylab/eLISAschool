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
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('classes')
@Index(['niveauId'])
@Index(['anneeScolaireId'])
@Index(['etablissementId'])
@Index(['etablissementId', 'anneeScolaireId'])
@Index(['etablissementId', 'niveauId'])
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

    @Column({ type: 'varchar', length: 100, nullable: true })
    sallePrincipale?: string;

    @Column({ type: 'int', default: 50 })
    effectifMax!: number;

    @Column({ type: 'int', default: 0 })
    effectifActuel!: number;

    @Column({ type: 'simple-json', nullable: true })
    options?: string[]; // BILINGUE, ARTISTIQUE...

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
