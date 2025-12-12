/**
 * eLISAschool - Entités Gamification
 */
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

@Entity('badges')
export class Badge {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 100, unique: true })
    code!: string;

    @Column({ type: 'varchar', length: 255 })
    nom!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ type: 'varchar', length: 500, nullable: true })
    icone?: string;

    @Column({ type: 'int', default: 0 })
    pointsRequis!: number;

    @Column({ type: 'varchar', length: 50, nullable: true })
    categorie?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('points_utilisateurs')
export class PointsUtilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'int', default: 0 })
    pointsTotal!: number;

    @Column({ type: 'int', default: 0 })
    pointsMois!: number;

    @Column({ type: 'int', default: 0 })
    pointsSemaine!: number;

    @Column({ type: 'int', default: 1 })
    niveau!: number;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('historique_points')
export class HistoriquePoints {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'int' })
    points!: number;

    @Column({ type: 'varchar', length: 50 })
    action!: string; // assiduite, note, participation, etc.

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn()
    createdAt!: Date;
}

@Entity('badges_utilisateurs')
export class BadgeUtilisateur {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'uuid' })
    badgeId!: string;

    @ManyToOne(() => Badge)
    @JoinColumn({ name: 'badgeId' })
    badge!: Badge;

    @CreateDateColumn()
    obtenuAt!: Date;
}
