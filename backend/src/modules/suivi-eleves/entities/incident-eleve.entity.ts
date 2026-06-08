/**
 * ==================================
 * eLISAschool - Entité IncidentEleve
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Suivi des incidents disciplinaires des élèves
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
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Classe } from '@modules/classes/entities';
import { Matiere } from '@modules/matieres/entities';

export enum GraviteIncident {
    MINEUR = 'MINEUR',
    MODERE = 'MODERE',
    GRAVE = 'GRAVE',
    TRES_GRAVE = 'TRES_GRAVE',
}

export enum StatutIncident {
    SIGNALE = 'SIGNALE',
    EN_COURS = 'EN_COURS',
    RESOLU = 'RESOLU',
    SANCTIONNE = 'SANCTIONNE',
}

@Entity('incidents_eleves')
@Index(['eleveId'])
@Index(['declarantId'])
@Index(['gravite'])
@Index(['statut'])
@Index(['dateIncident'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU: filtre par année
@Index(['etablissementId', 'eleveId']) // Composite pour requêtes multi-tenant
@Index(['etablissementId', 'dateIncident']) // Composite pour filtrage chronologique
@Index(['eleveId', 'dateIncident']) // Composite pour historique élève
@Index(['anneeScolaireId', 'eleveId']) // ← NOUVEAU: historique par année
@Index(['anneeScolaireId', 'gravite']) // ← NOUVEAU: stats par gravité
@Index(['classeId']) // ← NOUVEAU: contexte pédagogique
@Index(['matiereId']) // ← NOUVEAU: contexte matière
export class IncidentEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    declarantId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'declarantId' })
    declarant?: Utilisateur;

    @Column({ type: 'timestamp' })
    dateIncident!: Date;

    @Column({ type: 'varchar', length: 20 })
    gravite!: GraviteIncident;

    @Column({ type: 'varchar', length: 20, default: StatutIncident.SIGNALE })
    statut!: StatutIncident;

    @Column({ type: 'varchar', length: 200 })
    type!: string; // BAGARRE, RETARD, ABSENCE, TRICHE, INSUBORDINATION, AUTRE

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    lieu?: string;

    @Column({ type: 'text', nullable: true })
    temoins?: string;

    @Column({ type: 'text', nullable: true })
    actionPrise?: string;

    @Column({ type: 'uuid', nullable: true })
    sanctionId?: string;

    @Column({ type: 'boolean', default: false })
    signaleParent!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    dateSignalementParent?: Date;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // ==================== LIEN PÉRIODE ACADÉMIQUE ====================
    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @ManyToOne(() => AnneeScolaire)
    @JoinColumn({ name: 'anneeScolaireId' })
    anneeScolaire?: AnneeScolaire;

    // ==================== CONTEXTE PÉDAGOGIQUE ====================
    @Column({ type: 'uuid', nullable: true })
    classeId?: string; // Classe au moment de l'incident

    @ManyToOne(() => Classe, { nullable: true })
    @JoinColumn({ name: 'classeId' })
    classe?: Classe;

    @Column({ type: 'uuid', nullable: true })
    matiereId?: string; // Si incident pendant un cours

    @ManyToOne(() => Matiere, { nullable: true })
    @JoinColumn({ name: 'matiereId' })
    matiere?: Matiere;

    @Column({ type: 'uuid', nullable: true })
    enseignantId?: string; // Enseignant responsable du cours

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'enseignantId' })
    enseignantResponsable?: Utilisateur;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
