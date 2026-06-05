/**
 * ==================================
 * eLISAschool - Entités Personnel
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';
import { Utilisateur } from '@modules/utilisateurs/entities/utilisateur.entity';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('types_personnel')
export class TypePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 50, unique: true })
    code!: string; // ENSEIGNANT, DIRECTEUR, SURVEILLANT...

    @Column({ type: 'varchar', length: 100 })
    nom!: string;

    @Column({ type: 'simple-json', nullable: true })
    permissionsDefaut?: string[]; // Liste des codes permissions

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('membres_personnel')
@Index(['utilisateurId'])
@Index(['etablissementId'])
export class MembrePersonnel {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @OneToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur?: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    typePersonnelId?: string;

    @ManyToOne(() => TypePersonnel)
    @JoinColumn({ name: 'typePersonnelId' })
    typePersonnel?: TypePersonnel;

    @Column({ type: 'varchar', length: 50, unique: true })
    matricule!: string;

    @Column({ type: 'date' })
    dateEmbauche!: Date;

    @Column({ type: 'enum', enum: ['ACTIF', 'INACTIF', 'CONGE'], default: 'ACTIF' })
    statut!: 'ACTIF' | 'INACTIF' | 'CONGE';

    @Column({ type: 'simple-json', nullable: true })
    specialites?: string[]; // IDs des matières ou noms

    @Column({ type: 'text', nullable: true })
    diplomes?: string;

    /**
     * Établissement du membre du personnel (multi-tenancy)
     */
    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
