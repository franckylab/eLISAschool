/**
 * ==================================
 * eLISAschool - Entité GroupeEtablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Représente un groupe logique d'établissements
 * pour la consolidation des dashboards et rapports.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';
import { GroupeEtablissementLien } from './groupe-etablissement-lien.entity';
import { GroupeAdmin } from './groupe-admin.entity';

@Entity('groupes_etablissements')
@Index(['proprietaireId', 'actif'])
export class GroupeEtablissement {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'uuid' })
    proprietaireId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'proprietaireId' })
    proprietaire!: Utilisateur;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @OneToMany(() => GroupeEtablissementLien, lien => lien.groupe)
    etablissements!: GroupeEtablissementLien[];

    @OneToMany(() => GroupeAdmin, admin => admin.groupe)
    admins!: GroupeAdmin[];

    @CreateDateColumn({ name: 'cree_at' })
    creeAt!: Date;

    @UpdateDateColumn({ name: 'maj_at' })
    majAt!: Date;
}
