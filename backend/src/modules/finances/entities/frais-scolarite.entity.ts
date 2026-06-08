/**
 * ==================================
 * eLISAschool - Entités Frais de Scolarité
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Cycle } from '@modules/cycles/entities';
import { Classe } from '@modules/classes/entities';
import { Section } from './section.entity';

@Entity('frais_scolarite')
@Index(['etablissementId', 'anneeScolaireId', 'niveauId', 'classeId'], { unique: true })
export class FraisScolarite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    @Column({ type: 'uuid' })
    niveauId!: string;

    @ManyToOne(() => Niveau)
    @JoinColumn({ name: 'niveauId' })
    niveau?: Niveau;

    @Column({ type: 'uuid', nullable: true })
    cycleId?: string;

    @ManyToOne(() => Cycle, { nullable: true })
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid', nullable: true })
    sectionId?: string;

    @ManyToOne(() => Section, { nullable: true })
    @JoinColumn({ name: 'sectionId' })
    section?: Section;

    @Column({ type: 'uuid', nullable: true })
    classeId?: string;

    @ManyToOne(() => Classe, { nullable: true })
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fraisInscription!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    fraisScolariteAnnuel!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    fraisCantineOptionnel?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    fraisTransportOptionnel?: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    autresFrais!: number;

    @Column({ type: 'int', default: 3 })
    nombreTranches!: number;

    @Column({ type: 'date' })
    datePremiereEcheance!: Date;

    @Column({ type: 'varchar', length: 20, default: 'mensuel' })
    frequenceEcheance!: string; // 'mensuel', 'trimestriel', 'annuel'

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    penaliteRetard!: number; // Pourcentage

    @Column({ type: 'int', default: 15 })
    joursGrace!: number;

    @Column({ type: 'boolean', default: true })
    remisesPossibles!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
