/**
 * ==================================
 * eLISAschool - Entités Messagerie
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Entités complètes pour le système de messagerie:
 * - Conversation, ParticipantConversation, Message (modifiées)
 * - MessageReaction, MessageReadStatus, MessageMention, TemplateMessage, MessageFichier (nouvelles)
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
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Type de conversation
 */
export enum TypeConversation {
    INDIVIDUELLE = 'INDIVIDUELLE',
    GROUPE = 'GROUPE',
    CLASSE = 'CLASSE',
    FAMILLE = 'FAMILLE',
}

/**
 * Priorité du message
 */
export enum PrioriteMessage {
    NORMAL = 'normal',
    IMPORTANT = 'important',
    URGENT = 'urgent',
}

/**
 * Type de contenu du message
 */
export enum TypeContenuMessage {
    TEXTE = 'text',
    IMAGE = 'image',
    DOCUMENT = 'document',
    SYSTEME = 'systeme',
}

/**
 * Emoji de réaction
 */
export enum EmojiReaction {
    LIKE = 'like',
    LOVE = 'love',
    RIRE = 'rire',
    TRISTE = 'triste',
    COLERE = 'colere',
    POUCE_HAUT = 'pouce_haut',
}

/**
 * Catégorie de template
 */
export enum CategorieTemplate {
    ABSENCE = 'absence',
    RETARD = 'retard',
    DISCIPLINE = 'discipline',
    INFO_GENERALE = 'info_generale',
    CONVOCATION = 'convocation',
}

/**
 * Entité Conversation
 */
@Entity('conversations')
@Index(['etablissementId', 'updatedAt'])
@Index(['entiteLieeType', 'entiteLieeId'])
export class Conversation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    titre?: string;

    @Column({ type: 'varchar', length: 30, enum: TypeConversation, default: TypeConversation.INDIVIDUELLE })
    type!: TypeConversation;

    @Column({ type: 'uuid', nullable: true })
    createurId?: string;

    @ManyToOne(() => Utilisateur, { nullable: true })
    @JoinColumn({ name: 'createurId' })
    createur?: Utilisateur;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'varchar', length: 50, nullable: true })
    entiteLieeType?: string; // 'classe', 'eleve', 'personnel'

    @Column({ type: 'uuid', nullable: true })
    entiteLieeId?: string;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @Column({ type: 'boolean', default: false })
    archive!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    dateArchive?: Date;

    @Column({ type: 'uuid', nullable: true })
    dernierMessageId?: string;

    // Relation différée pour éviter la référence circulaire
    // @ManyToOne(() => Message, { nullable: true })
    // @JoinColumn({ name: 'dernierMessageId' })
    // dernierMessage?: Message;
    dernierMessage?: any; // Temporaire - éviter référence circulaire

    @Column({ type: 'int', default: 0 })
    countMessages!: number;

    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    @OneToMany(() => ParticipantConversation, participant => participant.conversation)
    participants?: ParticipantConversation[];

    @OneToMany(() => Message, message => message.conversation)
    messages?: Message[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

/**
 * Entité Participant (membre d'une conversation)
 */
@Entity('participants_conversation')
@Index(['conversationId', 'utilisateurId'], { unique: true })
@Index(['utilisateurId', 'archivePerso'])
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

    @Column({ type: 'boolean', default: false })
    epingle!: boolean;

    @Column({ type: 'boolean', default: false })
    archivePerso!: boolean;

    @Column({ type: 'timestamp', nullable: true })
    derniereLecture?: Date;

    @Column({ type: 'uuid', nullable: true })
    dernierMessageLuId?: string;

    // Relation différée pour éviter la référence circulaire
    // @ManyToOne(() => Message, { nullable: true })
    // @JoinColumn({ name: 'dernierMessageLuId' })
    // dernierMessageLu?: Message;
    dernierMessageLu?: any; // Temporaire - éviter référence circulaire

    @CreateDateColumn({ type: 'timestamp' })
    joinedAt!: Date;
}

/**
 * Entité Message
 */
@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['etablissementId', 'expediteurId'])
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

    @Column({ type: 'uuid', nullable: true })
    reponseAId?: string;

    @ManyToOne(() => Message, { nullable: true })
    @JoinColumn({ name: 'reponseAId' })
    reponseA?: Message;

    @OneToMany(() => Message, message => message.reponseA)
    reponses?: Message[];

    @Column({ type: 'text' })
    contenu!: string;

    @Column({ type: 'varchar', length: 50, default: TypeContenuMessage.TEXTE })
    typeContenu!: TypeContenuMessage;

    @Column({ type: 'varchar', length: 20, default: PrioriteMessage.NORMAL })
    priorite!: PrioriteMessage;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'simple-json', nullable: true })
    piecesJointes?: Array<{ nom: string; url: string; type: string; taille: number }>;

    @Column({ type: 'boolean', default: false })
    modifie!: boolean;

    @Column({ type: 'boolean', default: false })
    supprime!: boolean;

    @Column({ type: 'jsonb', nullable: true })
    mentions?: Array<{ userId: string; position: number }>;

    @OneToMany(() => MessageReaction, reaction => reaction.message)
    reactions?: MessageReaction[];

    @OneToMany(() => MessageReadStatus, readStatus => readStatus.message)
    readStatuses?: MessageReadStatus[];

    @OneToMany(() => MessageFichier, fichier => fichier.message)
    fichiers?: MessageFichier[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

/**
 * Entité MessageReaction
 */
@Entity('message_reactions')
@Index(['messageId', 'emoji'])
export class MessageReaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    messageId!: string;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message!: Message;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'varchar', length: 20, enum: EmojiReaction })
    emoji!: EmojiReaction;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

/**
 * Entité MessageReadStatus
 */
@Entity('message_read_status')
@Index(['messageId', 'utilisateurId'], { unique: true })
@Index(['utilisateurId', 'luA'])
export class MessageReadStatus {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    messageId!: string;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message!: Message;

    @Column({ type: 'uuid' })
    utilisateurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'utilisateurId' })
    utilisateur!: Utilisateur;

    @Column({ type: 'timestamp' })
    luA!: Date;
}

/**
 * Entité MessageMention
 */
@Entity('message_mentions')
@Index(['mentionneId', 'lu'])
@Index(['messageId'])
export class MessageMention {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    messageId!: string;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message!: Message;

    @Column({ type: 'uuid' })
    mentionneId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'mentionneId' })
    mentionne!: Utilisateur;

    @Column({ type: 'boolean', default: false })
    lu!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

/**
 * Entité TemplateMessage
 */
@Entity('templates_message')
@Index(['etablissementId', 'categorie', 'actif'])
export class TemplateMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'varchar', length: 50 })
    code!: string;

    @Column({ type: 'varchar', length: 200 })
    titre!: string;

    @Column({ type: 'text' })
    contenu!: string;

    @Column({ type: 'varchar', length: 50, enum: CategorieTemplate })
    categorie!: CategorieTemplate;

    @Column({ type: 'boolean', default: true })
    actif!: boolean;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;
}

/**
 * Entité MessageFichier
 */
@Entity('messages_fichiers')
@Index(['messageId'])
@Index(['etablissementId'])
export class MessageFichier {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    messageId!: string;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message!: Message;

    @Column({ type: 'varchar', length: 255 })
    nomFichier!: string;

    @Column({ type: 'varchar', length: 500 })
    cheminStockage!: string;

    @Column({ type: 'varchar', length: 100 })
    typeMime!: string;

    @Column({ type: 'int' })
    taille!: number;

    @Column({ type: 'varchar', length: 500, nullable: true })
    urlAcces?: string;

    @Column({ type: 'varchar', length: 20, default: 'local' })
    stockage!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;
}

export default {
    Conversation,
    ParticipantConversation,
    Message,
    MessageReaction,
    MessageReadStatus,
    MessageMention,
    TemplateMessage,
    MessageFichier,
};
