/**
 * ==================================
 * eLISAschool - Entité PreferenceEmploiDuTemps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Préférences de génération d'emploi du temps
 * par établissement et par classe
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('preferences_emploi_du_temps')
@Index(['etablissementId'])
export class PreferenceEmploiDuTemps {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /**
     * Heure de début des cours (ex: "07:30")
     */
    @Column({ type: 'time', default: '07:30' })
    heureDebutCours!: string;

    /**
     * Heure de fin des cours (ex: "17:00")
     */
    @Column({ type: 'time', default: '17:00' })
    heureFinCours!: string;

    /**
     * Durée d'un créneau standard en minutes (ex: 55)
     * Alias: dureeCreneauDefaut (pour compatibilité)
     */
    @Column({ type: 'int', default: 55 })
    dureeCreneauStandard!: number;

    /** Getter pour compatibilité avec le code existant */
    get dureeCreneauDefaut(): number {
        return this.dureeCreneauStandard;
    }

    /**
     * Durée de la récréation en minutes (ex: 15)
     */
    @Column({ type: 'int', default: 15 })
    dureeRecreation!: number;

    /**
     * Jours ouvrables (ex: ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"])
     * Alias: joursTravailles (pour compatibilité)
     */
    @Column({ type: 'text', array: true, default: ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'] })
    joursOuvrables!: string[];

    /** Getter pour compatibilité avec le code existant */
    get joursTravailles(): string[] {
        return this.joursOuvrables;
    }

    /**
     * Nombre maximum de créneaux par jour pour une classe
     */
    @Column({ type: 'int', default: 8 })
    maxCreneauxParJour!: number;

    /**
     * Nombre maximum de créneaux d'une même matière par jour
     */
    @Column({ type: 'int', default: 2 })
    maxCreneauxMatiereParJour!: number;

    /**
     * Nombre maximum de créneaux consécutifs d'une même matière
     */
    @Column({ type: 'int', default: 2 })
    maxCreneauxConsecutifs!: number;

    /**
     * Pause déjeuner (heure début)
     */
    @Column({ type: 'time', nullable: true })
    pauseDebut?: string;

    /**
     * Pause déjeuner (heure fin)
     */
    @Column({ type: 'time', nullable: true })
    pauseFin?: string;

    /**
     * Indique si on veut répartir uniformément les matières dans la semaine
     */
    @Column({ type: 'boolean', default: true })
    repartitionEquilibree!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
