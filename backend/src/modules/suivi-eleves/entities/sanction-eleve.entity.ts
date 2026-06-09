/**
 * ==================================
 * eLISAschool - Entité SanctionEleve
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
import { IncidentEleve } from './incident-eleve.entity';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { Periode } from '@modules/periodes/entities';

/**
 * Types de sanctions adaptés au contexte africain/camerounais
 * Approche progressive: observation → exclusion
 */
export enum TypeSanction {
    // === SANCTIONS LÉGÈRES (gestion interne) ===
    OBSERVATION_ORALE = 'OBSERVATION_ORALE', // Verbale
    OBSERVATION_ECRITE = 'OBSERVATION_ECRITE', // Carnet
    EXCUSES_PUBLIQUES = 'EXCUSES_PUBLIQUES', // Devant classe
    
    // === SANCTIONS MOYENNES (direction) ===
    AVERTISSEMENT = 'AVERTISSEMENT', // Lettre parents
    BLAME = 'BLAME', // Conseil de classe
    RETENUE = 'RETENUE', // Après cours
    TRAVAIL_COMMUNAUTE = 'TRAVAIL_COMMUNAUTE', // Nettoyage, jardin
    
    // === SANCTIONS GRAVES (conseil discipline) ===
    EXCLUSION_TEMPORAIRE = 'EXCLUSION_TEMPORAIRE', // 1-3 jours
    EXCLUSION_TEMPORAIRE_LONGUE = 'EXCLUSION_TEMPORAIRE_LONGUE', // 1-4 semaines
    CONSEIL_DISCIPLINE = 'CONSEIL_DISCIPLINE',
    EXCLUSION_DEFINITIVE = 'EXCLUSION_DEFINITIVE',
    INTERDICTION_EXAMEN = 'INTERDICTION_EXAMEN', // BEPC/BAC (très grave)
    
    // === SPÉCIFIQUE AFRIQUE ===
    AMENDE_SYMBOLIQUE = 'AMENDE_SYMBOLIQUE', // Participation école
    EXCUSES_DEVANT_CHEF = 'EXCUSES_DEVANT_CHEF', // Chef traditionnel
    CONVOCATION_CHEF_FAMILLE = 'CONVOCATION_CHEF_FAMILLE', // Oncle/grand-père
    SUIVI_SPECIAL = 'SUIVI_SPECIAL', // Mentorat enseignant
}

export enum StatutSanction {
    PROPOSEE = 'PROPOSEE',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDEE = 'VALIDEE',
    PRONONCEE = 'PRONONCEE',
    EN_COURS = 'EN_COURS',
    EXECUTEE = 'EXECUTEE',
    ANNULEE = 'ANNULEE',
}

@Entity('sanctions_eleves')
@Index(['eleveId'])
@Index(['incidentId'], { unique: true })
@Index(['type'])
@Index(['statut'])
@Index(['etablissementId'])
@Index(['anneeScolaireId']) // ← NOUVEAU
@Index(['anneeScolaireId', 'eleveId']) // ← NOUVEAU
@Index(['periodeId']) // ← NOUVEAU: filtre par trimestre
@Index(['anneeScolaireId', 'periodeId']) // ← NOUVEAU: composite
export class SanctionEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid', unique: true })
    incidentId!: string;

    @ManyToOne(() => IncidentEleve)
    @JoinColumn({ name: 'incidentId' })
    incident?: IncidentEleve;

    @Column({ type: 'varchar', length: 30 })
    type!: TypeSanction;

    @Column({ type: 'varchar', length: 20, default: StatutSanction.PRONONCEE })
    statut!: StatutSanction;

    @Column({ type: 'text' })
    motif!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'timestamp', nullable: true })
    dateDebut?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateFin?: Date;

    @Column({ type: 'int', nullable: true })
    joursExclusion?: number;

    @Column({ type: 'text', nullable: true })
    mesuresAccompagnement?: string;

    @Column({ type: 'uuid' })
    decideParId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'decideParId' })
    decidePar?: Utilisateur;

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
