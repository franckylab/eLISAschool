/**
 * ==================================
 * eLISAschool - Entité ExamenNational
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente les examens officiels et certifications nationales
 * (CEP, BEPC, BACCALAURÉAT, GCE O/A Level, etc.)
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

@Entity('examens_nationaux')
@Index(['niveauId'])
@Index(['code'])
export class ExamenNational {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 150 })
    nom!: string; // "BEPC", "BACCALAURÉAT Série C", "GCE Ordinary Level"

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // "BEPC", "BAC_C", "GCE_OL", "CEP"

    @Column({ type: 'varchar', length: 30 })
    type!: string; // "NATIONAL", "REGIONAL", "INTERNATIONAL"

    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => Niveau)
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'date', nullable: true })
    dateProgrammation?: Date; // Date officielle de l'examen

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    coefficient?: number;

    @Column({ type: 'boolean', default: true })
    estObligatoire!: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    diplomeDelivre?: string; // "BEPC", "BACCALAUREAT", "GCE_CERTIFICATE"

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 20, default: 'FRANCOPHONE', name: 'soussysteme' })
    sousSysteme!: string; // "FRANCOPHONE", "ANGLOPHONE"

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
