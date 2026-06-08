/**
 * ==================================
 * eLISAschool - Entités Budget
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Entités pour la gestion budgétaire
 * - Budget: Budget annuel par établissement
 * - LigneBudget: Lignes budgétaires par catégorie
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';
import { CategorieDepense } from './depenses.entity';

// Enums
export enum StatutBudget {
    BROUILLON = 'BROUILLON',
    EN_COURS = 'EN_COURS',
    VALIDE = 'VALIDE',
    CLOTURE = 'CLOTURE'
}

// ==================================
// Budget
// ==================================

@Entity('budgets')
@Index(['etablissementId'])
@Index(['anneeDebut', 'anneeFin'])
@Unique(['code', 'etablissementId'])
export class Budget {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'varchar', length: 20 })
    code!: string; // BUDG-2026

    @Column({ type: 'varchar', length: 255 })
    libelle!: string; // Budget 2025-2026

    @Column({ type: 'date' })
    anneeDebut!: Date; // 2025-09-01

    @Column({ type: 'date' })
    anneeFin!: Date; // 2026-07-31

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantTotalPrevu!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantTotalEngage!: number;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantTotalConsomme!: number;

    @Column({ type: 'varchar', length: 30, default: StatutBudget.BROUILLON })
    statut!: StatutBudget;

    @Column({ type: 'text', nullable: true })
    observations?: string;

    @OneToMany(() => LigneBudget, ligne => ligne.budget)
    lignes!: LigneBudget[];

    @ManyToOne(() => Etablissement)
    @JoinColumn({ name: 'etablissementId' })
    etablissement!: Etablissement;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}

// ==================================
// LigneBudget
// ==================================

@Entity('lignes_budget')
@Index(['budgetId'])
@Index(['categorieDepenseId'])
@Unique(['budgetId', 'categorieDepenseId'])
export class LigneBudget {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantPrevu!: number; // Budget alloué

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantEngage!: number; // Déjà engagé

    @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
    montantConsomme!: number; // Déjà dépensé

    @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true })
    pourcentageAlerte?: number; // Alerte à X% (ex: 80)

    @Column({ type: 'boolean', default: true })
    bloquerSiDepasse!: boolean; // Bloquer si > 100%

    @Column({ type: 'text', nullable: true })
    observations?: string;

    @ManyToOne(() => Budget, budget => budget.lignes)
    @JoinColumn({ name: 'budgetId' })
    budget!: Budget;

    @Column({ type: 'uuid' })
    budgetId!: string;

    @ManyToOne(() => CategorieDepense)
    @JoinColumn({ name: 'categorieDepenseId' })
    categorieDepense!: CategorieDepense;

    @Column({ type: 'uuid' })
    categorieDepenseId!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // ==================================
    // Méthodes utilitaires
    // ==================================

    /**
     * Montant disponible
     */
    get montantDisponible(): number {
        return this.montantPrevu - this.montantEngage;
    }

    /**
     * Pourcentage engagé
     */
    get pourcentageEngage(): number {
        if (this.montantPrevu === 0) return 0;
        return (this.montantEngage / this.montantPrevu) * 100;
    }

    /**
     * Pourcentage consommé
     */
    get pourcentageConsomme(): number {
        if (this.montantPrevu === 0) return 0;
        return (this.montantConsomme / this.montantPrevu) * 100;
    }

    /**
     * Vérifie si le budget est dépassé
     */
    get estDepasse(): boolean {
        return this.montantEngage > this.montantPrevu;
    }

    /**
     * Vérifie si l'alerte doit être déclenchée
     */
    get alerteSeuil(): boolean {
        if (!this.pourcentageAlerte) return false;
        return this.pourcentageEngage >= this.pourcentageAlerte;
    }
}
