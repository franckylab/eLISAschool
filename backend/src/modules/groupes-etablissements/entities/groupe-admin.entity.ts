/**
 * ==================================
 * eLISAschool - Entité GroupeAdmin
 * ==================================
 * Version: 1.0.0
 * 
 * Permet d'assigner des co-administrateurs à un groupe
 * d'établissements pour la gestion partagée.
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
import Utilisateur from '@modules/auth/entities/utilisateur.entity';

@Entity('groupe_admins')
@Index(['groupeId', 'utilisateurId'], { unique: true })
export class GroupeAdmin {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    groupeId!: string;

    @ManyToOne(() => GroupeEtablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'groupeId' })
    groupe!: GroupeEtablissement;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    assignePar?: string;

    @CreateDateColumn({ name: 'date_assignation' })
    dateAssignation!: Date;
}
