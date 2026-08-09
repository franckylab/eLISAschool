/**
 * ==================================
 * eLISAschool - Entité ActionCritique
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Workflow d'approbation 2 facteurs (MFA) pour les actions sensibles
 * de la plateforme plateforme.
 *
 * Flux :
 *   1. Demandeur (SUPER_ADMIN) initie → EN_ATTENTE
 *   2. Approbateur (2ᵉ SUPER_ADMIN + MFA TOTP) → APPROUVEE
 *   3. Exécution automatique → EXECUTEE
 *   4. Rejet possible → REJETEE
 *   5. Expiration après 24h → EXPIREE
 *
 * Refonte SaaS v7 — Lot F.2
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Utilisateur } from '@modules/auth/entities/utilisateur.entity';
import { Etablissement } from '@modules/etablissement/entities';

// ==========================================
// Enums
// ==========================================

/**
 * Types d'actions critiques nécessitant une approbation 2F
 */
export enum TypeActionCritique {
    RESILIER = 'RESILIER',
    SUSPENDRE = 'SUSPENDRE',
    UPGRADE = 'UPGRADE',
    SUPPRIMER_ETABLISSEMENT = 'SUPPRIMER_ETABLISSEMENT',
    ACCORDER_AVOIR = 'ACCORDER_AVOIR',
    RESTAURER_BACKUP = 'RESTAURER_BACKUP',
    REINITIALISER_GLOBAL = 'REINITIALISER_GLOBAL',
    MODIFIER_TARIFS = 'MODIFIER_TARIFS',
}

/**
 * Statut du workflow d'approbation
 */
export enum StatutActionCritique {
    EN_ATTENTE = 'EN_ATTENTE',
    APPROUVEE = 'APPROUVEE',
    REJETEE = 'REJETEE',
    EXECUTEE = 'EXECUTEE',
    EXPIREE = 'EXPIREE',
    ANNULEE = 'ANNULEE',
}

/**
 * Durée d'expiration par défaut d'une action critique (24h)
 */
export const ACTION_CRITIQUE_EXPIRATION_HEURES = 24;

/**
 * Nombre maximum de tentatives d'approbation avant blocage
 */
export const ACTION_CRITIQUE_MAX_TENTATIVES = 5;

// ==========================================
// Entité
// ==========================================

@Entity('actions_critiques')
@Index(['statut'])
@Index(['typeAction'])
@Index(['demandeurId'])
@Index(['etablissementId'])
export class ActionCritique {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // --- Type et statut ---

    @Column({ type: 'varchar', length: 30 })
    typeAction!: TypeActionCritique;

    @Column({ type: 'varchar', length: 20, default: StatutActionCritique.EN_ATTENTE })
    statut!: StatutActionCritique;

    // --- Données de l'action ---

    /** Données JSON structurées selon le type d'action */
    @Column({ type: 'jsonb', default: {} })
    payload!: Record<string, unknown>;

    // --- Acteurs du workflow ---

    @Column({ type: 'uuid' })
    demandeurId!: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'demandeurId' })
    demandeur!: Utilisateur;

    @Column({ type: 'uuid', nullable: true })
    approuveurId?: string;

    @ManyToOne(() => Utilisateur, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'approuveurId' })
    approuveur?: Utilisateur;

    // --- Cible de l'action ---

    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    @ManyToOne(() => Etablissement, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    @Column({ type: 'varchar', length: 50, nullable: true })
    cibleType?: string;

    @Column({ type: 'uuid', nullable: true })
    cibleId?: string;

    // --- Résultats ---

    @Column({ type: 'jsonb', nullable: true })
    resultatExecution?: Record<string, unknown>;

    // --- Dates du workflow ---

    @Column({ type: 'timestamp', default: () => 'NOW()' })
    dateDemande!: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateApprobation?: Date;

    @Column({ type: 'timestamp', nullable: true })
    dateExecution?: Date;

    @Column({ type: 'timestamp' })
    dateExpiration!: Date;

    // --- Sécurité MFA ---

    /** Hash de vérification MFA (proof que le code TOTP a été vérifié) */
    @Column({ type: 'varchar', length: 255, nullable: true })
    mfaVerificationHash?: string;

    /** Nombre de tentatives d'approbation échouées */
    @Column({ type: 'int', default: 0 })
    tentativesApprobation!: number;

    // --- Audit contextuel ---

    @Column({ type: 'text', nullable: true })
    raison?: string;

    @Column({ type: 'text', nullable: true })
    motifRejet?: string;

    @Column({ type: 'varchar', length: 45, nullable: true })
    demandeurIp?: string;

    @Column({ type: 'text', nullable: true })
    demandeurUserAgent?: string;

    @Column({ type: 'varchar', length: 45, nullable: true })
    approuveurIp?: string;

    @Column({ type: 'text', nullable: true })
    approuveurUserAgent?: string;

    // --- Timestamps ---

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    // ==========================================
    // Méthodes utilitaires
    // ==========================================

    /**
     * Vérifie si l'action est en attente d'approbation
     */
    get estEnAttente(): boolean {
        return this.statut === StatutActionCritique.EN_ATTENTE;
    }

    /**
     * Vérifie si l'action a expiré
     */
    get estExpiree(): boolean {
        return this.estEnAttente && new Date() > this.dateExpiration;
    }

    /**
     * Vérifie si l'action peut encore être approuvée
     */
    get peutApprouver(): boolean {
        return this.estEnAttente
            && !this.estExpiree
            && this.tentativesApprobation < ACTION_CRITIQUE_MAX_TENTATIVES;
    }

    /**
     * Label lisible du type d'action (français)
     */
    get typeActionLabel(): string {
        const labels: Record<TypeActionCritique, string> = {
            [TypeActionCritique.RESILIER]: 'Résilier l\'abonnement',
            [TypeActionCritique.SUSPENDRE]: 'Suspendre l\'abonnement',
            [TypeActionCritique.UPGRADE]: 'Changer de plan (upgrade)',
            [TypeActionCritique.SUPPRIMER_ETABLISSEMENT]: 'Supprimer l\'établissement',
            [TypeActionCritique.ACCORDER_AVOIR]: 'Accorder un avoir',
            [TypeActionCritique.RESTAURER_BACKUP]: 'Restaurer un backup',
            [TypeActionCritique.REINITIALISER_GLOBAL]: 'Réinitialiser la configuration globale',
            [TypeActionCritique.MODIFIER_TARIFS]: 'Modifier les tarifs',
        };
        return labels[this.typeAction] || this.typeAction;
    }
}
