/**
 * ==================================
 * eLISAschool - Entité CmsTemplate (templates de pages)
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Templates de pages CMS réutilisables.
 * Permettent d'instancier rapidement des pages avec sections pré-définies.
 * 6 templates système fournis par défaut.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

// ==================================
// Enums
// ==================================

export enum CategorieTemplate {
    ACCUEIL = 'accueil',
    PAGE = 'page',
    SPECIAL = 'special',
}

// ==================================
// CmsTemplate — Templates de pages
// ==================================

@Entity('cms_templates')
@Index(['code'], { unique: true })
@Index(['categorie'])
export class CmsTemplate {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 20, default: CategorieTemplate.PAGE })
    categorie!: string;

    /**
     * Définition des sections par défaut du template.
     * Tableau d'objets { type, titre?, contenu, styles?, ordre }
     */
    @Column({ type: 'jsonb', default: [] })
    sectionsDef!: Record<string, unknown>[];

    @Column({ type: 'varchar', length: 500, nullable: true })
    thumbnail?: string;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
