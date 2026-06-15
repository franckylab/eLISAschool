/**
 * ==================================
 * eLISAschool - Entité Template Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 * 
 * Templates réutilisables pour la génération d'emplois du temps
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('templates_emploi_du_temps')
@Index(['etablissementId'])
@Index(['nom'])
export class TemplateEmploiDuTemps {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    // Configuration du template
    @Column({ type: 'jsonb', default: {} })
    configuration!: TemplateConfiguration;

    // Créneaux types
    @Column({ type: 'jsonb', default: [] })
    creneauxTypes!: CreneauType[];

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    estPartage!: boolean; // Visible par autres établissements du même groupe

    @Column({ type: 'varchar', length: 100, nullable: true })
    creePar?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export interface TemplateConfiguration {
    joursTravailles: string[];
    heureDebutCours: string;
    heureFinCours: string;
    dureeCreneauDefaut: number;
    pauses?: Pause[];
}

export interface Pause {
    heureDebut: string;
    heureFin: string;
    nom: string;
}

export interface CreneauType {
    matiereNom: string; // Nom pattern (ex: "Mathématiques")
    volumeHebdomadaire: number;
    jourPrefere?: string;
    heurePreferee?: string;
    typeCreneau: string;
    coefficient?: number;
}
