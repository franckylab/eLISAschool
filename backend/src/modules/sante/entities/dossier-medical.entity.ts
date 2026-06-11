/**
 * ==================================
 * eLISAschool - Entité DossierMedical
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Dossier médical de base pour une personne (élève ou personnel)
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
import { Eleve } from '@modules/eleves/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';

export enum TypePatient {
    ELEVE = 'ELEVE',
    PERSONNEL = 'PERSONNEL',
}

@Entity('dossiers_medicaux')
@Index(['patientId'])
@Index(['typePatient'])
@Index(['etablissementId'])
@Index(['etablissementId', 'patientId'], { unique: true }) // Unique composite pour multi-tenant
@Index(['periodeId']) // ← NOUVEAU: filtre par trimestre (nullable)
export class DossierMedical {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    patientId!: string;

    @Column({ type: 'varchar', length: 20 })
    typePatient!: TypePatient;

    // Relations conditionnelles (gérées applicativement)
    // NOTE: Ces relations ne créent PAS de FK en base - la FK est gérée par la migration SQL
    @ManyToOne(() => Eleve, { nullable: true })
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'personnelId' })
    membrePersonnel?: MembrePersonnel;

    // Colonnes pour les relations explicites (optionnelles, gérées par l'application)
    @Column({ type: 'uuid', nullable: true })
    eleveId?: string;

    @Column({ type: 'uuid', nullable: true })
    personnelId?: string;

    @Column({ type: 'varchar', length: 5, nullable: true })
    groupeSanguin?: string;

    @Column({ type: 'simple-json', nullable: true })
    allergiesConnues?: string[];

    @Column({ type: 'simple-json', nullable: true })
    antecedentsMedicaux?: string[];

    @Column({ type: 'simple-json', nullable: true })
    traitementsEnCours?: string[];

    @Column({ type: 'text', nullable: true })
    handicaps?: string;

    @Column({ type: 'text', nullable: true })
    contraintesSpeciales?: string; // Régimes alimentaires, limitations physiques, etc.

    @Column({ type: 'varchar', length: 200, nullable: true })
    medecinTraitant?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    telephoneMedecin?: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    assuranceMaladie?: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    numeroAssurance?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // ==================== LIEN PÉRIODE/TRIMESTRE (optionnel) ====================
    @Column({ type: 'uuid', nullable: true })
    periodeId?: string; // Dossier peut être lié à un trimestre spécifique

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
