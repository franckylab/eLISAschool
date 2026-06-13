/**
 * ==================================
 * eLISAschool - Entité DiplomeEleve
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Historique des diplômes et examens obtenus par les élèves
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
import { Eleve } from '@modules/eleves/entities';
import { ExamenNational } from '@modules/examens-nationaux/entities';

@Entity('diplomes_eleves')
@Index(['eleveId'])
@Index(['examenNationalId'])
@Index(['eleveId', 'examenNationalId'])
export class DiplomeEleve {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve?: Eleve;

    @Column({ type: 'uuid' })
    examenNationalId!: string;

    @ManyToOne(() => ExamenNational)
    @JoinColumn({ name: 'examenNationalId' })
    examenNational?: ExamenNational;

    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    noteObtenue?: number; // Note obtenue à l'examen

    @Column({ type: 'varchar', length: 50, nullable: true })
    mention?: string; // "Passable", "Assez Bien", "Bien", "Très Bien"

    @Column({ type: 'varchar', length: 20 })
    resultat!: string; // "ADMIS", "REFUSE", "AJOURNE"

    @Column({ type: 'date' })
    dateObtention!: Date; // Date d'obtention du diplôme

    @Column({ type: 'varchar', length: 100, nullable: true })
    numeroDiplome?: string; // Numéro officiel du diplôme

    @Column({ type: 'text', nullable: true })
    observations?: string; // Observations supplémentaires

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string; // Établissement où l'élève a passé l'examen

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
