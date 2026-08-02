/**
 * ==================================
 * eLISAschool - Entité CreneauHoraire
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-07-24
 *
 * Fusion EmploiDuTemps + RepartitionHoraire → CreneauHoraire.
 * Le créneau référence affectationMatiereId comme source unique
 * (enseignant + matière + classe-année).
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { AffectationMatiere } from '@modules/matieres/entities';
import { Salle } from '@modules/salles/entities';

// ─── Enums ─────────────────────────────────────────────────────

export enum JourSemaine {
    LUNDI = 'LUNDI',
    MARDI = 'MARDI',
    MERCREDI = 'MERCREDI',
    JEUDI = 'JEUDI',
    VENDREDI = 'VENDREDI',
    SAMEDI = 'SAMEDI',
}

export enum TypeCreneau {
    COURS = 'COURS',
    TP = 'TP',
    TD = 'TD',
    RECREATION = 'RECREATION',
    ETUDE = 'ETUDE',
    PERMANENCE = 'PERMANENCE',
    AUTRE = 'AUTRE',
}

export enum StatutCreneau {
    PLANIFIE = 'PLANIFIE',
    VALIDE = 'VALIDE',
}

// ─── Entité ────────────────────────────────────────────────────

@Entity('creneaux_horaires')
@Index(['etablissementId'])
@Index(['jour'])
@Index(['affectationMatiereId', 'jour'])
@Index(['salleId', 'jour'])
@Index(['anneeScolaireId'])
@Index(['periodeId'])
@Index(['etablissementId', 'jour', 'heureDebut', 'heureFin']) // Détection conflits
export class CreneauHoraire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Source unique : affectation matière (enseignant + matière + classe-année) */
    @Column({ type: 'uuid' })
    affectationMatiereId!: string;

    @ManyToOne(() => AffectationMatiere)
    @JoinColumn({ name: 'affectationMatiereId' })
    affectationMatiere?: AffectationMatiere;

    @Column({ type: 'enum', enum: JourSemaine })
    jour!: JourSemaine;

    /** Format HH:MM */
    @Column({ type: 'varchar', length: 5 })
    heureDebut!: string;

    /** Format HH:MM */
    @Column({ type: 'varchar', length: 5 })
    heureFin!: string;

    @Column({ type: 'enum', enum: TypeCreneau, default: TypeCreneau.COURS })
    typeCreneau!: TypeCreneau;

    @Column({ type: 'enum', enum: StatutCreneau, default: StatutCreneau.PLANIFIE })
    statut!: StatutCreneau;

    @Column({ type: 'uuid', nullable: true })
    salleId?: string;

    @ManyToOne(() => Salle, { nullable: true })
    @JoinColumn({ name: 'salleId' })
    salle?: Salle;

    @Column({ type: 'uuid', nullable: true })
    periodeId?: string;

    @Column({ type: 'uuid', nullable: true })
    anneeScolaireId?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @Column({ type: 'varchar', length: 7, nullable: true })
    couleur?: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    @Column({ type: 'boolean', default: false })
    genereAutomatiquement!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    // ─── Getters dérivés ───────────────────────────────────────

    /** Durée en minutes */
    get dureeMinutes(): number {
        const [h1, m1] = this.heureDebut.split(':').map(Number);
        const [h2, m2] = this.heureFin.split(':').map(Number);
        return (h2 * 60 + m2) - (h1 * 60 + m1);
    }

    /** Durée en heures */
    get dureeHeures(): number {
        return this.dureeMinutes / 60;
    }

    /** Plage horaire formatée */
    get plageHoraire(): string {
        return `${this.heureDebut}-${this.heureFin}`;
    }

    /** Résolu via affectationMatiere */
    get classeAnneeId(): string | undefined {
        return this.affectationMatiere?.classeAnneeId;
    }

    get matiereId(): string | undefined {
        return this.affectationMatiere?.matiereId;
    }

    get enseignantId(): string | undefined {
        return this.affectationMatiere?.enseignantId;
    }
}
