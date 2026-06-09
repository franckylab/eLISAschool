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
import { Periode } from '@modules/periodes/entities';

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

/**
 * Types d'incidents adaptés au contexte africain/camerounais
 */
export enum TypeIncidentEleve {
    // === RETARDS & ABSENCES (critique en Afrique) ===
    RETARD = 'RETARD',
    ABSENCE_NON_JUSTIFIEE = 'ABSENCE_NON_JUSTIFIEE',
    ABSENCE_JUSTIFIEE = 'ABSENCE_JUSTIFIEE',
    ABANDON_TEMPORAIRE = 'ABANDON_TEMPORAIRE', // Saisons rurales
    ABANDON_DEFINITIF = 'ABANDON_DEFINITIF', // Décrochage
    
    // === COMPORTEMENT ===
    INDISCIPLINE = 'INDISCIPLINE',
    IRRESPECT_ENSEIGNANT = 'IRRESPECT_ENSEIGNANT',
    BAGARRE = 'BAGARRE',
    TRICHERIE = 'TRICHERIE', // Examens BEPC/BAC
    TENUE_NON_CONFORME = 'TENUE_NON_CONFORME', // Uniforme
    TELEPHONE_PORTE = 'TELEPHONE_PORTE',
    
    // === PÉDAGOGIQUE ===
    TRAVAIL_NON_FAIT = 'TRAVAIL_NON_FAIT',
    NOTES_INSUFFISANTES = 'NOTES_INSUFFISANTES',
    DIFFICULTES_APPRENTISSAGE = 'DIFFICULTES_APPRENTISSAGE',
    RETARD_ACCUMULE = 'RETARD_ACCUMULE',
    
    // === SPÉCIFIQUE AFRIQUE ===
    FRAIS_SCOLARITE_NON_PAYES = 'FRAIS_SCOLARITE_NON_PAYES',
    RENTREE_TARDIVE = 'RENTREE_TARDIVE',
    TRANSPORT_DIFFICILE = 'TRANSPORT_DIFFICILE',
    TRAVAIL_ENFANT = 'TRAVAIL_ENFANT', // Aide famille
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
@Index(['periodeId']) // ← NOUVEAU: filtre par trimestre
@Index(['anneeScolaireId', 'periodeId']) // ← NOUVEAU: composite année+période
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

    @Column({ type: 'varchar', length: 50 })
    type!: TypeIncidentEleve; // ← MODIFIÉ: enum structuré contexte africain

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

    // ==================== LIEN PÉRIODE/TRIMESTRE ====================
    @Column({ type: 'uuid', nullable: true })
    periodeId?: string; // Trimestre concerné

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

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
