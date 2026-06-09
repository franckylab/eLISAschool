/**
 * ==================================
 * eLISAschool - Entité FelicitationEleve
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
import { Eleve } from '@modules/eleves/entities';
import { Utilisateur } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';

/**
 * Types de félicitations adaptés au contexte africain/camerounais
 */
export enum TypeFelicitation {
    // === ACADÉMIQUE ===
    EXCELLENCE_ACADEMIQUE = 'EXCELLENCE_ACADEMIQUE', // Major classe
    PROGRES_REMARQUABLE = 'PROGRES_REMARQUABLE',
    MEILLEUR_NOTE_MATIERE = 'MEILLEUR_NOTE_MATIERE', // Major matière
    RANG_EXCELLENT = 'RANG_EXCELLENT', // Top 3
    ADMIS_MENTION = 'ADMIS_MENTION', // BEPC/BAC mention TB
    
    // === COMPORTEMENT ===
    COMPORTEMENT_EXEMPLAIRE = 'COMPORTEMENT_EXEMPLAIRE',
    ASSIDUITE_PARFAITE = 'ASSIDUITE_PARFAITE', // 0 absence trimestre
    PONCTUALITE_EXEMPLAIRE = 'PONCTUALITE_EXEMPLAIRE', // 0 retard
    RESPECT_ENSEIGNANTS = 'RESPECT_ENSEIGNANTS',
    AIDE_CAMARADES = 'AIDE_CAMARADES', // Tutorat
    
    // === PARASCOLAIRE ===
    ACTIVITE_PARASCOLAIRE = 'ACTIVITE_PARASCOLAIRE',
    SPORT_EXCELLENCE = 'SPORT_EXCELLENCE',
    CULTURE_EXCELLENCE = 'CULTURE_EXCELLENCE',
    CLUB_EXCELLENCE = 'CLUB_EXCELLENCE',
    
    // === SPÉCIFIQUE AFRIQUE ===
    MERITE_COMMUNAUTAIRE = 'MERITE_COMMUNAUTAIRE', // Aide communauté
    INITIATIVE_ENTREPRENEURIALE = 'INITIATIVE_ENTREPRENEURIALE',
    RESILIENCE_REMARQUABLE = 'RESILIENCE_REMARQUABLE', // Surmonter difficultés
    ENGAGEMENT_CITOYEN = 'ENGAGEMENT_CITOYEN', // Propreté, environnement
    EXCELLENCE_BILINGUE = 'EXCELLENCE_BILINGUE', // Franco/anglo
    TRADITION_CULTURELLE = 'TRADITION_CULTURELLE', // Danses, contes
    SOLIDARITE_REMARQUABLE = 'SOLIDARITE_REMARQUABLE',
}

@Entity('felicitations_eleves')
@Index(['eleveId'])
@Index(['type'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'eleveId']) // ← NOUVEAU
@Index(['periodeId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'periodeId']) // ← NOUVEAU
export class FelicitationEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'varchar', length: 40 })
    type!: TypeFelicitation;

    @Column({ type: 'text' })
    motif!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 0 })
    pointsBonus!: number; // Points gamification

    @Column({ type: 'boolean', default: true })
    visibleBulletin!: boolean;

    @Column({ type: 'boolean', default: true })
    visibleParent!: boolean;

    @Column({ type: 'uuid' })
    attribueParId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'attribueParId' })
    attribuePar?: Utilisateur;

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
    periodeId?: string;

    @ManyToOne(() => Periode, { nullable: true })
    @JoinColumn({ name: 'periodeId' })
    periode?: Periode;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
