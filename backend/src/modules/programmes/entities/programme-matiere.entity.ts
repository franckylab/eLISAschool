/**
 * ==================================
 * eLISAschool - Bridge Programme ↔ MatiereNiveau
 * ==================================
 *
 * RÔLE : Associe une MatiereNiveau (grille matière par niveau) à un
 * ProgrammePedagogique (programme pédagogique nommé).
 *
 * Les champs coefficient/volumeHoraire/obligatoire sont les VALEURS
 * PRIMAIRES utilisées dans la chaîne de résolution :
 *   ProgrammeMatiere (primaire)
 *       → MatiereNiveau (fallback)
 *           → ConfigurationMatiereClasse (override par classe)
 *
 * IMPORTANT : Chaque matiereNiveauId ne peut appartenir qu'à UN SEUL
 * programme (contrainte d'unicité globale sur matiereNiveauId).
 * Cela garantit une résolution sans ambiguïté : niveau de classe
 * → programme associé (via ClasseAnnee.programmeId)
 * → ProgrammeMatiere pour cette matière.
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
import { ProgrammePedagogique } from './programme-pedagogique.entity';
import { MatiereNiveau } from '@modules/matieres/entities';
import { Etablissement } from '@modules/etablissement/entities';

@Entity('programmes_matieres')
@Index(['programmeId'])
@Index('idx_programmes_matieres_matiere_niveau_id', ['matiereNiveauId'], { unique: true })
@Index('idx_programmes_matieres_programme_etablissement', ['programmeId', 'etablissementId'])
export class ProgrammeMatiere {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    programmeId!: string;

    @ManyToOne(() => ProgrammePedagogique, (p) => p.matieres, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'programmeId' })
    programme?: ProgrammePedagogique;

    @Column({ type: 'uuid' })
    matiereNiveauId!: string;

    @ManyToOne(() => MatiereNiveau)
    @JoinColumn({ name: 'matiereNiveauId' })
    matiereNiveau?: MatiereNiveau;

    /** PRIMAIRE (résolu dans la chaîne) : coefficient de la matière dans ce programme. Fallback: MatiereNiveau.coefficient */
    @Column({ type: 'float', nullable: true })
    coefficient?: number;

    /** PRIMAIRE (résolu dans la chaîne) : volume horaire de la matière dans ce programme. Fallback: MatiereNiveau.volumeHoraire */
    @Column({ type: 'int', nullable: true })
    volumeHoraire?: number;

    /** PRIMAIRE (résolu dans la chaîne) : la matière est-elle obligatoire ? Fallback: MatiereNiveau.obligatoire */
    @Column({ type: 'boolean', default: true })
    obligatoire!: boolean;

    @Column({ type: 'int', default: 0 })
    ordre!: number;

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
