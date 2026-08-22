/**
 * ==================================
 * eLISAschool - Entité Note (Refactorisée)
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
    Index,
} from 'typeorm';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Eleve } from '@modules/eleves/entities';
import { Matiere } from '@modules/matieres/entities';
import { ClasseAnnee } from '@modules/classes/entities';
import { Periode } from '@modules/periodes/entities';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type d'évaluation
 */
export enum TypeEvaluation {
    DEVOIR = 'DEVOIR',
    INTERROGATION = 'INTERROGATION',
    EXAMEN = 'EXAMEN',
    PROJET = 'PROJET',
    PARTICIPATION = 'PARTICIPATION',
    AUTRE = 'AUTRE',
}

/**
 * Statut de la note
 */
export enum StatutNote {
    BROUILLON = 'BROUILLON',
    VALIDEE = 'VALIDEE',
    PUBLIEE = 'PUBLIEE',
}

@Entity('notes')
@Index(['eleveId'])
@Index(['matiereId'])
@Index(['periodeId'])
@Index(['enseignantId'])
@Index(['etablissementId'])
@Index(['etablissementId', 'periodeId'])  // Index composite pour requêtes multi-tenant
export class Note {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    eleveId!: string;

    @ManyToOne(() => Eleve)
    @JoinColumn({ name: 'eleveId' })
    eleve!: Eleve;

    /**
     * Enseignant auteur de la note (MembrePersonnel, cohérent avec AffectationMatiere).
     * Nullable : l'utilisateur créateur peut ne pas être rattaché au personnel
     * (ex: administrateur), auquel cas la note est créée sans enseignant.
     */
    @Column({ type: 'uuid', nullable: true })
    enseignantId?: string;

    @ManyToOne(() => MembrePersonnel, { nullable: true })
    @JoinColumn({ name: 'enseignantId' })
    enseignant?: MembrePersonnel;

    @Column({ type: 'uuid' })
    matiereId!: string;

    @ManyToOne(() => Matiere)
    @JoinColumn({ name: 'matiereId' })
    matiere!: Matiere;

    @Column({ type: 'uuid' })
    classeAnneeId!: string;

    @ManyToOne(() => ClasseAnnee)
    @JoinColumn({ name: 'classeAnneeId' })
    classeAnnee!: ClasseAnnee;

    @Column({ type: 'uuid' })
    anneeScolaireId!: string;

    @Column({ type: 'uuid' })
    periodeId!: string;

    @ManyToOne(() => Periode)
    @JoinColumn({ name: 'periodeId' })
    periode!: Periode;

    @Column({ type: 'enum', enum: TypeEvaluation, default: TypeEvaluation.DEVOIR })
    typeEvaluation!: TypeEvaluation;

    @Column({ type: 'varchar', length: 255, nullable: true })
    description?: string; // Titre du devoir (ex: "Interro #1")

    @Column({ type: 'float' })
    valeur!: number;

    @Column({ type: 'float', default: 20 })
    bareme!: number; // ex: 20, 100, 10

    @Column({ type: 'float', default: 1 })
    coefficient!: number; // Poids dans la moyenne

    @Column({ type: 'text', nullable: true })
    commentaire?: string;

    @Column({ type: 'date', nullable: true })
    dateEvaluation?: Date;

    @Column({ type: 'enum', enum: StatutNote, default: StatutNote.BROUILLON })
    statut!: StatutNote;

    @Column({ type: 'uuid', nullable: true })
    validateurId?: string;

    @Column({ type: 'timestamp', nullable: true })
    valideeAt?: Date;

    /**
     * Établissement de la note (multi-tenancy)
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

    /**
     * Calcule la note sur 20 (Standardisation)
     */
    get noteSur20(): number {
        if (this.bareme === 0) return 0;
        return (this.valeur / this.bareme) * 20;
    }
}
