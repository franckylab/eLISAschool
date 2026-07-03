/**
 * ==================================
 * eLISAschool - Entité Répartition Horaire
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Définit la répartition hebdomadaire des heures d'enseignement
 * pour une affectation matière (Enseignant → Matière → Classe)
 * Permet de générer automatiquement l'emploi du temps
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
import { AffectationMatiere } from '@modules/matieres/entities';
import { Salle } from '@modules/salles/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { JourSemaine } from './emploi-du-temps.entity';

@Entity('repartitions_horaires')
@Index(['affectationId'])
@Index(['jourSemaine'])
@Index(['etablissementId'])
@Index(['affectationId', 'jourSemaine', 'heureDebut']) // Pour détection de conflits
export class RepartitionHoraire {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    affectationId!: string;

    @ManyToOne(() => AffectationMatiere, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'affectationId' })
    affectation?: AffectationMatiere;

    @Column({ type: 'varchar', length: 20 })
    jourSemaine!: JourSemaine;

    @Column({ type: 'time' })
    heureDebut!: string; // "08:00"

    @Column({ type: 'time' })
    heureFin!: string; // "10:00"

    @Column({ type: 'float', default: 2 })
    nombreHeures!: number; // Durée du créneau en heures

    @Column({ type: 'uuid', nullable: true })
    salleId?: string;

    @ManyToOne(() => Salle, { nullable: true })
    @JoinColumn({ name: 'salleId' })
    salle?: Salle;

    @Column({ type: 'int', default: 1 })
    priorite!: number; // 1 = haute priorité, 5 = flexible

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    /**
     * Établissement de la répartition (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
