/**
 * ==================================
 * eLISAschool - Entité GroupeEtablissementLien
 * ==================================
 * Version: 1.0.0
 * 
 * Table de jointure entre groupes et établissements.
 * Permet d'associer plusieurs établissements à un groupe.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { GroupeEtablissement } from './groupe-etablissement.entity';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('groupe_etablissement_liens')
@Index(['groupeId', 'etablissementId'], { unique: true })
export class GroupeEtablissementLien {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    groupeId!: string;

    @ManyToOne(() => GroupeEtablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupeId' })
    groupe!: GroupeEtablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid', nullable: true })
    ajoutePar?: string;

    @CreateDateColumn()
    dateAjout!: Date;
}
