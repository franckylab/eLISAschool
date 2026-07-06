import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { Cycle } from '@modules/cycles/entities';
import { Niveau } from '@modules/niveaux/entities';
import { ProgrammeMatiere } from './programme-matiere.entity';

export enum ProgrammeType {
    CYCLE = 'CYCLE',
    NIVEAU = 'NIVEAU',
    PERSONNALISE = 'PERSONNALISE',
}

@Entity('programmes_pedagogiques')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
export class ProgrammePedagogique {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 20, default: ProgrammeType.NIVEAU })
    type!: ProgrammeType;

    @Column({ type: 'uuid', nullable: true })
    cycleId?: string;

    @ManyToOne(() => Cycle, { nullable: true })
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid', nullable: true })
    niveauId?: string;

    @ManyToOne(() => Niveau, { nullable: true })
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'int', default: 0 })
    nbHeuresHebdo!: number;

    @Column({ type: 'text', nullable: true })
    objectifsGeneraux?: string;

    @Column({ type: 'json', nullable: true })
    competencesVisees?: string[];

    @Column({ type: 'uuid', nullable: true })
    anneeScolaireId?: string;

    @Column({ type: 'date', nullable: true })
    dateDebut?: string;

    @Column({ type: 'date', nullable: true })
    dateFin?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @OneToMany(() => ProgrammeMatiere, (pm) => pm.programme, { cascade: true })
    matieres?: ProgrammeMatiere[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
