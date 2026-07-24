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
 * Template de poste (refonte v4.0)
 * categoriePosteId supprimé — dérivé via fonction.typePersonnel
 */
export interface TemplatePoste {
    ref: string;
    intitule: string;
    niveauResponsabiliteId?: string;
    fonctionRef?: string;
    fonctionId?: string;
    description?: string;
    nombrePostes: number;
}

export interface TemplateLienHierarchique {
    superieurRef: string;
    subordonneRef: string;
    typeRelation: string;
}

/**
 * Noeud de template d'organisation (refonte v4.0)
 * usageUnite + niveau → echelonCode (fusion dans EchelonStructurel)
 */
export interface NoeudTemplateOrganisation {
    echelonCode: string;
    nom: string;
    count: number;
    postes?: TemplatePoste[];
    hierarchie?: TemplateLienHierarchique[];
    enfants?: NoeudTemplateOrganisation[];
}

@Entity('templates_organisation')
@Index(['etablissementId'])
@Index(['actif'])
export class TemplateOrganisation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 200 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'jsonb' })
    structure!: NoeudTemplateOrganisation;

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
