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

export enum TypeSanction {
    AVERTISSEMENT = 'AVERTISSEMENT',
    BLAME = 'BLAME',
    RETENUE = 'RETENUE',
    EXCLUSION_TEMPORAIRE = 'EXCLUSION_TEMPORAIRE',
    EXCLUSION_DEFINITIVE = 'EXCLUSION_DEFINITIVE',
    CONSEIL_DISCIPLINE = 'CONSEIL_DISCIPLINE',
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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
