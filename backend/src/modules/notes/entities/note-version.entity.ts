/**
 * ==================================
 * eLISAschool - Entité NoteVersion
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Historique des modifications de notes.
 * Chaque modification d'une note crée un snapshot JSONB de l'état précédent.
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
import { Note } from './note.entity';

@Entity('notes_versions')
@Index(['noteId'])
@Index(['noteId', 'version'], { unique: true })
@Index(['etablissementId'])
export class NoteVersion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    noteId!: string;

    @ManyToOne(() => Note, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'noteId' })
    note!: Note;

    @Column({ type: 'integer' })
    version!: number;

    @Column({ type: 'jsonb' })
    snapshot!: Record<string, unknown>;

    @Column({ type: 'varchar', length: 100 })
    modifiePar!: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    raison?: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    creeeAt!: Date;
}
