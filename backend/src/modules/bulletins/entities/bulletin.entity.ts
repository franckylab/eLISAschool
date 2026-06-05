/**
 * ==================================
 * eLISAschool - Entités Bulletins
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
    OneToMany
} from 'typeorm';
import { Eleve } from '@modules/eleves/entities';
import { Classe } from '@modules/classes/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('bulletins')
@Index(['eleveId'])
@Index(['classeId'])
@Index(['periodeId'])
@Index(['etablissementId'])
export class Bulletin {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

    @Column({ type: 'uuid' })
    classeId!: string;

    @ManyToOne(() => Classe)
    @JoinColumn({ name: 'classeId' })
    classe!: Classe;

    @Column({ type: 'uuid' })
    periodeId!: string;

    @ManyToOne(() => Periode)
    @JoinColumn({ name: 'periodeId' })
    periode!: Periode;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire!: AnneeScolaire;

    // Données calculées (Stockées pour éviter recalcul complexe historique)
    @Column({ type: 'float', default: 0 })
    moyenneGenerale!: number; // Sur 20

    @Column({ type: 'float', nullable: true })
    moyenneClasse!: number;

    @Column({ type: 'float', nullable: true })
    moyenneMin!: number;

    @Column({ type: 'float', nullable: true })
    moyenneMax!: number;

    @Column({ type: 'int', nullable: true })
    rang!: number;

    @Column({ type: 'simple-json', nullable: true })
    appreciationConseil?: string; // Appréciation globale

    @Column({ type: 'simple-json', nullable: true })
    sanctions?: string[]; // Avertissement, Blâme...

    @Column({ type: 'simple-json', nullable: true })
    encouragements?: string[]; // Tableau d'honneur...

    @Column({ type: 'boolean', default: false })
    publie!: boolean;

    /**
     * Établissement du bulletin (multi-tenancy)
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
