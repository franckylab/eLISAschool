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
import { ProgrammePedagogique } from './programme-pedagogique.entity';
import { MatiereNiveau } from '@modules/matieres/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('programmes_matieres')
@Index(['programmeId'])
@Index(['matiereNiveauId'])
@Index(['programmeId', 'matiereNiveauId'], { unique: true })
export class ProgrammeMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    programmeId!: string;

    @ManyToOne(() => ProgrammePedagogique, (p) => p.matieres, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programmeId' })
    programme?: ProgrammePedagogique;

    @Column({ type: 'uuid' })
    matiereNiveauId!: string;

    @ManyToOne(() => MatiereNiveau)
    @JoinColumn({ name: 'matiereNiveauId' })
    matiereNiveau?: MatiereNiveau;

    @Column({ type: 'float', nullable: true })
    coefficient?: number;

    @Column({ type: 'int', nullable: true })
    volumeHoraire?: number;

    @Column({ type: 'boolean', default: true })
    obligatoire!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

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
