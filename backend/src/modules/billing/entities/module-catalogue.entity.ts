/**
 * ==================================
 * eLISAschool - Entité ModuleCatalogue
 * ==================================
 *
 * Source de vérité unique du catalogue de modules plateforme.
 * Les 3 anciens registres (MODULE_REGISTRY, ModuleRegistryService,
 * MODULES_GRATUITS/PREMIUM) ont été supprimés (migration 200).
 *
 * Cascade de résolution (Lot A — Refonte SaaS v7) :
 *   1. Catalogue (cette table) → actif par défaut (actifParDefaut / BASE)
 *   2. Plan (PlanAbonnement.modulesInclus par code) → activation
 *   3. AbonnementModule (suppléments souscrits, moduleOptionnel.slug)
 *   4. ParametreSysteme modules.{code}.actif (override établissement/global)
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum CategorieModule {
    /** Module de base — toujours disponible, non facturable */
    BASE = 'BASE',
    /** Module premium — inclus dans les plans payants, facturable */
    PREMIUM = 'PREMIUM',
    /** Module addon — souscriptible séparément, facturé en supplément */
    ADDON = 'ADDON',
}

@Entity('modules_catalogue')
@Index(['code'], { unique: true })
@Index(['categorie'])
@Index(['estActif'])
export class ModuleCatalogue {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Code métier unique du module (ex: 'finances') — aligné sur ModuleName */
    @Column({ type: 'varchar', length: 100 })
    code!: string;

    /** Libellé français */
    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    /** Libellé anglais */
    @Column({ type: 'varchar', length: 150, nullable: true })
    nomEn?: string;

    /** Description française */
    @Column({ type: 'text', nullable: true })
    description?: string;

    /** Description anglaise */
    @Column({ type: 'text', nullable: true })
    descriptionEn?: string;

    /** Catégorie commerciale : BASE | PREMIUM | ADDON */
    @Column({ type: 'varchar', length: 20, default: CategorieModule.ADDON })
    categorie!: CategorieModule;

    /** Icône Lucide (nom du composant) */
    @Column({ type: 'varchar', length: 60, default: 'Package' })
    icone!: string;

    /** Prix mensuel en XAF/XOF (entiers) — 0 si non facturable */
    @Column({ type: 'int', default: 0 })
    prixMensuel!: number;

    /** Prix annuel en XAF/XOF (entiers) — 0 si non facturable */
    @Column({ type: 'int', default: 0 })
    prixAnnuel!: number;

    /** Le module est-il facturable ? (BASE → false) */
    @Column({ type: 'boolean', default: false })
    estFacturable!: boolean;

    /** Le module est-il souscriptible en supplément ? */
    @Column({ type: 'boolean', default: false })
    estSouscriptible!: boolean;

    /** Actif par défaut pour tout établissement (BASE → true) */
    @Column({ type: 'boolean', default: false })
    actifParDefaut!: boolean;

    /** Slug du plan minimum requis (ex: 'starter', 'pro') — null = aucun */
    @Column({ type: 'varchar', length: 60, nullable: true })
    planMinimal?: string;

    /** Codes des modules requis (alignés sur ModuleName) */
    @Column({ type: 'simple-array', default: [] })
    dependencies!: string[];

    /** Permissions d'accès associées (RBAC) */
    @Column({ type: 'simple-array', default: [] })
    permissionsRequises!: string[];

    /** Configuration par défaut du module (parallèle defaultSettings registre) */
    @Column({ type: 'jsonb', default: {} })
    config!: Record<string, unknown>;

    /** Ordre d'affichage dans le catalogue */
    @Column({ type: 'int', default: 0 })
    ordre!: number;

    /** Module système (seeds) — non supprimable, protégé */
    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    /** Visible/actif dans le catalogue (toggle global) */
    @Column({ type: 'boolean', default: true })
    estActif!: boolean;

    /** Champ réservé pour RLS — null = global (plateforme) */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

export default ModuleCatalogue;