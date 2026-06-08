/**
 * ==================================
 * eLISAschool - Entité Section
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Sections pédagogiques (Scientifique, Littéraire, Technique, etc.)
 * Utilisé principalement au lycée pour différencier les filières
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
import { Cycle } from '@modules/cycles/entities';

/**
 * Type de section
 */
export enum TypeSection {
    SCIENTIFIQUE = 'SCIENTIFIQUE',
    LITTERAIRE = 'LITTERAIRE',
    ECONOMIQUE = 'ECONOMIQUE',
    TECHNIQUE = 'TECHNIQUE',
    ARTS = 'ARTS',
    SPORT_ETUDES = 'SPORT_ETUDES',
    BILINGUE = 'BILINGUE',
    INTERNATIONALE = 'INTERNATIONALE',
    AUTRE = 'AUTRE',
}

@Entity('sections')
@Index(['etablissementId'])
@Index(['code', 'etablissementId'], { unique: true })
export class Section {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // ex: "Scientifique", "Littéraire", "Bilingue Anglais"

    @Column({ type: 'varchar', length: 20, unique: true })
    code!: string; // ex: "S", "L", "ES", "STI", "ART", "BIL"

    @Column({ type: 'enum', enum: TypeSection, default: TypeSection.AUTRE })
    typeSection!: TypeSection;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'int', default: 1 })
    ordre!: number; // Ordre d'affichage

    @Column({ type: 'uuid', nullable: true })
    cycleId?: string; // Optionnel: lié à un cycle spécifique

    @ManyToOne(() => Cycle, { nullable: true })
    @JoinColumn({ name: 'cycleId' })
    cycle?: Cycle;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'boolean', default: true })
    active!: boolean;

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    coefficientFrais!: number; // Multiplicateur de frais (ex: 1.2 = +20%)

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
