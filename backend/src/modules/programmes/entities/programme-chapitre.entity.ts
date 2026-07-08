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
import { ProgrammeMatiere } from './programme-matiere.entity';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';

export enum StatutChapitre {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
}

@Entity('programme_chapitres')
@Index(['programmeMatiereId'])
@Index(['periodeId'])
@Index(['etablissementId'])
@Index(['programmeMatiereId', 'periodeId'])
@Index(['ordre'])
export class ProgrammeChapitre {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    matiereNiveauId?: string;

    @Column({ type: 'uuid', nullable: true })
    programmeMatiereId?: string;

    @ManyToOne(() => ProgrammeMatiere, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'programmeMatiereId' })
    programmeMatiere?: ProgrammeMatiere;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @ManyToOne(() => Periode, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @Column({ type: 'varchar', length: 255 })
    titre!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'text', nullable: true })
    objectifsPedagogiques?: string;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @Column({ type: 'int', nullable: true })
    dureePrevueHeures?: number;

    @Column({ type: 'simple-json', nullable: true })
    prerequis?: string[];

    @Column({ type: 'int', default: 0 })
    progressionPourcentage!: number;

    @Column({ type: 'simple-json', nullable: true })
    ressourcesPedagogiques?: Array<{
        type: 'MANUEL' | 'VIDEO' | 'DOCUMENT' | 'LIEN';
        titre: string;
        url?: string;
        description?: string;
    }>;

    @Column({ type: 'simple-json', nullable: true })
    competencesAssociees?: string[];

    @Column({ type: 'varchar', length: 30, default: StatutChapitre.ACTIF })
    statut!: StatutChapitre;

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
