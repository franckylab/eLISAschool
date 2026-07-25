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
import { ClasseAnnee } from '@modules/classes/entities';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { BulletinMatiere } from './bulletin-matiere.entity';

@Entity('bulletins')
@Index(['eleveId'])
@Index(['classeAnneeId'])
@Index(['periodeId'])
@Index(['etablissementId'])
@Index(['etablissementId', 'eleveId', 'periodeId'], { unique: true })
export class Bulletin {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee)
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee!: ClasseAnnee;

    @Column({ type: 'uuid', nullable: true })
    anneeScolaireId?: string;

    @Column({ type: 'uuid' })
    periodeId!: string;

    @ManyToOne(() => Periode)
    @JoinColumn({ name: 'periodeId' })
    periode!: Periode;

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

    @OneToMany(() => BulletinMatiere, (bm) => bm.bulletin, { cascade: true })
    bulletinMatieres!: BulletinMatiere[];

    /**
     * Établissement du bulletin (multi-tenancy)
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
