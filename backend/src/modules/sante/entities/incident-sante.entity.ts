/**
 * ==================================
 * eLISAschool - Entité IncidentSante
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
import { DossierMedical } from './dossier-medical.entity';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';

export enum TypeIncidentSante {
    ACCIDENT = 'ACCIDENT',
    MALAISE = 'MALAISE',
    MALADIE = 'MALADIE',
    ALLERGIE = 'ALLERGIE',
    AUTRE = 'AUTRE',
}

export enum GraviteIncidentSante {
    MINEUR = 'MINEUR',
    MODERE = 'MODERE',
    GRAVE = 'GRAVE',
    CRITIQUE = 'CRITIQUE',
}

@Entity('incidents_sante')
@Index(['dossierMedicalId'])
@Index(['type'])
@Index(['gravite'])
@Index(['dateIncident'])
@Index(['etablissementId'])
export class IncidentSante {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    dossierMedicalId!: string;

    @ManyToOne(() => DossierMedical)
    @JoinColumn({ name: 'dossierMedicalId' })
    dossierMedical?: DossierMedical;

    @Column({ type: 'timestamp' })
    dateIncident!: Date;

    @Column({ type: 'varchar', length: 20 })
    type!: TypeIncidentSante;

    @Column({ type: 'varchar', length: 20 })
    gravite!: GraviteIncidentSante;

    @Column({ type: 'varchar', length: 200 })
    nature!: string; // Description courte de l'incident

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lieu?: string;

    @Column({ type: 'text', nullable: true })
    premiersSecours?: string;

    @Column({ type: 'text', nullable: true })
    suiteDonnee?: string; // Hospitalisation, repos, etc.

    @Column({ type: 'boolean', default: false })
    hospitalisation!: boolean;

    @Column({ type: 'boolean', default: false })
    signaleParent!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    dateSignalementParent?: Date;

    @Column({ type: 'uuid' })
    declareParId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'declareParId' })
    declarePar?: Utilisateur;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
