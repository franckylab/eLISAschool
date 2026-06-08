/**
 * ==================================
 * eLISAschool - Entité ModeleCarte
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Modèles configurables pour les cartes scolaires
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
import { Etablissement } from '@modules/etablissement/entities';
import { TypeCarte } from './carte.entity';

export enum OrientationCarte {
    PORTRAIT = 'PORTRAIT',
    PAYSAGE = 'PAYSAGE',
}

@Entity('modeles_cartes')
@Index(['etablissementId'])
@Index(['type'])
@Index(['parDefaut'])
export class ModeleCarte {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 50 })
    type!: TypeCarte;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    // Dimensions (en mm, format carte crédit par défaut)
    @Column({ type: 'int', default: 85.6 })
    largeur!: number;

    @Column({ type: 'int', default: 53.98 })
    hauteur!: number;

    @Column({ type: 'varchar', length: 20, default: OrientationCarte.PORTRAIT })
    orientation!: OrientationCarte;

    // Contenu et affichage
    @Column({ type: 'simple-json' })
    champsAffiches!: string[]; // ['photo', 'nom', 'prenom', 'matricule', 'classe', 'annee']

    @Column({ type: 'varchar', length: 7, default: '#1E40AF' })
    couleurPrimaire!: string;

    @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
    couleurSecondaire!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    logoUrl?: string;

    @Column({ type: 'text', nullable: true })
    templateHtml?: string; // Template HTML pour impression

    // Configuration
    @Column({ type: 'boolean', default: false })
    parDefaut!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
