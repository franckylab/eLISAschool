/**
 * ==================================
 * eLISAschool - Entités Matières
 * ==================================
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from 'typeorm';

@Entity('groupes_matieres')
export class GroupeMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100 })
    nom!: string; // Scientifique, Littéraire, Groupe 1...

    @Column({ type: 'int', default: 1 })
    ordre!: number;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('matieres')
export class Matiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    nom!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    code!: string; // MATH, ENG...

    @Column({ type: 'varchar', length: 100, nullable: true })
    nomAnglais?: string;

    @Column({ type: 'varchar', length: 20, default: '#000000' })
    couleur!: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
