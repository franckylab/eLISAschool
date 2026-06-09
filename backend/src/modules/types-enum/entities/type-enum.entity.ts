/**
 * ==================================
 * eLISAschool - Entité TypeEnum
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Gestion dynamique des types énumérés simples
 * avec protection des types système (immuables)
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

/**
 * Catégories d'enums gérées dynamiquement
 */
export enum CategorieEnum {
    TYPE_DOCUMENT = 'TYPE_DOCUMENT',
    STATUT_REQUETE = 'STATUT_REQUETE',
    STATUT_DOCUMENT = 'STATUT_DOCUMENT',
    GENRE = 'GENRE',
    TYPE_ETABLISSEMENT = 'TYPE_ETABLISSEMENT',
    STATUT_UTILISATEUR = 'STATUT_UTILISATEUR',
    AUTRE = 'AUTRE',
}

/**
 * Entité TypeEnum
 * Représente un type énuméré personnalisable par établissement
 */
@Entity('types_enum')
@Index(['categorie'])
@Index(['code'])
@Index(['categorie', 'code'], { unique: true })
@Index(['etablissementId'])
export class TypeEnum {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50 })
    categorie!: CategorieEnum; // TYPE_DOCUMENT, STATUT_REQUETE, etc.

    @Column({ type: 'varchar', length: 50 })
    code!: string; // BULLETIN, CERTIFICAT, EN_ATTENTE, etc.

    @Column({ type: 'varchar', length: 100 })
    libelle!: string; // "Bulletin", "Certificat", "En attente", etc.

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean; // true = type système (non supprimable/modifiable)

    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number; // Pour le tri dans les listes

    /**
     * Établissement propriétaire (null = global/système)
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
