/**
 * ==================================
 * eLISAschool - Entité Bulletin Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Extension du bulletin pour supporter le workflow de validation
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Bulletin } from '@modules/bulletins/entities';
import { Utilisateur } from '@modules/auth/entities';

/**
 * Statut de validation du bulletin
 */
export enum StatutValidationBulletin {
    BROUILLON = 'BROUILLON',
    EN_VALIDATION = 'EN_VALIDATION',
    VALIDE = 'VALIDE',
    PUBLIE = 'PUBLIE',
    REJETE = 'REJETE',
}

@Entity('bulletins_workflow')
export class BulletinWorkflow {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid', unique: true })
    bulletinId!: string;

    @ManyToOne(() => Bulletin, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'bulletinId' })
    bulletin!: Bulletin;

    @Column({ type: 'enum', enum: StatutValidationBulletin, default: StatutValidationBulletin.BROUILLON })
    statutValidation!: StatutValidationBulletin;

    @Column({ type: 'int', default: 0 })
    niveauValidationActuel!: number;

    @Column({ type: 'int', default: 2 })
    niveauxRequis!: number;

    @Column({ type: 'uuid', nullable: true })
    validateurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'validateurId' })
    validateur?: Utilisateur;

    @Column({ type: 'timestamp', nullable: true })
    dateValidation?: Date;

    @Column({ type: 'timestamp', nullable: true })
    datePublication?: Date;

    @Column({ type: 'text', nullable: true })
    commentaireValidation?: string;

    @Column({ type: 'simple-json', nullable: true })
    historiqueValidation?: any[];
}
