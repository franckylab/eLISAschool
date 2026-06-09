/**
 * ==================================
 * eLISAschool - Entité ProgrammeChapitre
 * ==================================
 * Module: Programmes Pédagogiques
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
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
import { MatiereNiveau } from '@modules/matieres/entities';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Statut du chapitre de programme (support workflow de validation)
 */
export enum StatutChapitre {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    INACTIF = 'INACTIF',
}

@Entity('programme_chapitres')
@Index(['matiereNiveauId'])
@Index(['periodeId'])
@Index(['etablissementId'])
@Index(['matiereNiveauId', 'periodeId'])
@Index(['ordre'])
export class ProgrammeChapitre {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    matiereNiveauId!: string;

    @ManyToOne(() => MatiereNiveau, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'matiereNiveauId' })
    matiereNiveau?: MatiereNiveau;

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
