/**
 * ==================================
 * eLISAschool - Entité ConsultationMedicale
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

export enum TypeConsultation {
    INFIRMERIE = 'INFIRMERIE',
    MEDICALE = 'MEDICALE',
    URGENCES = 'URGENCES',
    SUIVI = 'SUIVI',
}

export enum StatutConsultation {
    TERMINEE = 'TERMINEE',
    EN_ATTENTE = 'EN_ATTENTE',
    REFEREE = 'REFEREE',
}

@Entity('consultations_medicales')
@Index(['dossierMedicalId'])
@Index(['consultantId'])
@Index(['dateConsultation'])
@Index(['etablissementId'])
export class ConsultationMedicale {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    dossierMedicalId!: string;

    @ManyToOne(() => DossierMedical)
    @JoinColumn({ name: 'dossierMedicalId' })
    dossierMedical?: DossierMedical;

    @Column({ type: 'uuid' })
    consultantId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'consultantId' })
    consultant?: Utilisateur;

    @Column({ type: 'timestamp' })
    dateConsultation!: Date;

    @Column({ type: 'varchar', length: 20 })
    type!: TypeConsultation;

    @Column({ type: 'varchar', length: 20, default: StatutConsultation.TERMINEE })
    statut!: StatutConsultation;

    @Column({ type: 'text' })
    motif!: string;

    @Column({ type: 'text', nullable: true })
    diagnostic?: string;

    @Column({ type: 'text', nullable: true })
    traitement?: string;

    @Column({ type: 'text', nullable: true })
    observations?: string;

    @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
    temperature?: number;

    @Column({ type: 'decimal', precision: 5, scale: 1, nullable: true })
    tensionArterielle?: number;

    @Column({ type: 'int', nullable: true })
    frequenceCardiaque?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    poids?: number;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    taille?: number;

    @Column({ type: 'boolean', default: false })
    signaleParent!: boolean;

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
