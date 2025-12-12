/**
 * ==================================
 * eLISAschool - Entités Messagerie
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
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
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities';

/**
 * Type de conversation
 */
export enum TypeConversation {
    INDIVIDUELLE = 'INDIVIDUELLE',
    GROUPE = 'GROUPE',
    ANNONCE = 'ANNONCE',
}

/**
 * Entité Conversation
 */
@Entity('conversations')
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    titre?: string;

    @Column({ type: 'enum', enum: TypeConversation, default: TypeConversation.INDIVIDUELLE })
    type!: TypeConversation;

    @Column({ type: 'uuid', nullable: true })
    createurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'createurId' })
    createur?: Utilisateur;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'simple-json', nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

/**
 * Entité Participant (membre d'une conversation)
 */
@Entity('participants_conversation')
export class ParticipantConversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    conversationId!: string;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation!: Conversation;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'boolean', default: false })
    estAdmin!: boolean;

    @Column({ type: 'boolean', default: false })
    muet!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    derniereLecture?: Date;

    @CreateDateColumn({ type: 'timestamp' })
    joinedAt!: Date;
}

/**
 * Entité Message
 */
@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    conversationId!: string;

    @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation!: Conversation;

    @Column({ type: 'uuid' })
    expediteurId!: string;

    @ManyToOne(() => Utilisateur)
    @JoinColumn({ name: 'expediteurId' })
    expediteur!: Utilisateur;

    @Column({ type: 'text' })
    contenu!: string;

    @Column({ type: 'varchar', length: 50, default: 'text' })
    typeContenu!: string; // text, image, file, audio

    @Column({ type: 'simple-json', nullable: true })
    piecesJointes?: { nom: string; url: string; type: string; taille: number }[];

    @Column({ type: 'boolean', default: false })
    modifie!: boolean;

    @Column({ type: 'boolean', default: false })
    supprime!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

export default { Conversation, ParticipantConversation, Message };
