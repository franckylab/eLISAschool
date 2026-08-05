/**
 * ==================================
 * eLISAschool - Entité JourFerie
 * ==================================
 * Gestion des jours fériés (fixes récurrents ou ponctuels)
 * Multi-tenant : etablissementId null = global (tous établissements)
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
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
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Codes pays supportés pour les modèles de jours fériés.
 * Afrique centrale + UEMOA (15 pays).
 */
export enum PaysJourFerie {
    CM = 'CM', // Cameroun
    CI = 'CI', // Côte d'Ivoire
    SN = 'SN', // Sénégal
    CG = 'CG', // Congo-Brazzaville
    CD = 'CD', // RD Congo
    GA = 'GA', // Gabon
    BF = 'BF', // Burkina Faso
    ML = 'ML', // Mali
    BJ = 'BJ', // Bénin
    TG = 'TG', // Togo
    NE = 'NE', // Niger
    GN = 'GN', // Guinée
    TD = 'TD', // Tchad
    CF = 'CF', // RCA
    GQ = 'GQ', // Guinée Équatoriale
}

/** Pays par défaut (Cameroun) */
export const PAYS_DEFAUT = PaysJourFerie.CM;

@Entity('jours_feries')
@Index(['etablissementId'])
@Index(['date'])
@Index(['estRecurrent', 'mois', 'jourMois'])
@Index(['pays'])
export class JourFerie {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Nom du jour férié (ex: "Fête Nationale", "Noël") */
    @Column({ type: 'varchar', length: 150 })
    nom!: string;

    /**
     * Date complète (pour les jours fériés ponctuels, ex: variables religieux)
     * Null si estRecurrent = true (utilisé mois/jourMois à la place)
     */
    @Column({ type: 'date', nullable: true })
    date?: Date | null;

    /** Si true, se répète chaque année (mois + jourMois) */
    @Column({ type: 'boolean', default: false })
    estRecurrent!: boolean;

    /** Mois (1-12) — utilisé si estRecurrent = true */
    @Column({ type: 'int', nullable: true })
    mois?: number | null;

    /** Jour du mois (1-31) — utilisé si estRecurrent = true */
    @Column({ type: 'int', nullable: true })
    jourMois?: number | null;

    /** Couleur d'affichage dans le calendrier (hex, ex: '#dc3545') */
    @Column({ type: 'varchar', length: 7, nullable: true })
    couleur?: string | null;

    /** Description optionnelle */
    @Column({ type: 'text', nullable: true })
    description?: string | null;

    /**
     * Établissement concerné. Null = global (tous les établissements).
     * Permet d'avoir des jours fériés spécifiques par établissement.
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string | null;

    @ManyToOne(() => Etablissement, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement | null;

    /**
     * Code pays du modèle (ex: 'CM', 'CI'). Null si jour férié custom (hors modèle).
     * Permet de charger un modèle complet par pays.
     */
    @Column({ type: 'varchar', length: 2, nullable: true })
    pays?: string | null;

    /** Marquer comme système (non supprimable via UI, modifiable) */
    @Column({ type: 'boolean', default: false })
    estSysteme!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // ─── Getters dérivés ───────────────────────────────────────

    /** Retourne la date du jour férié pour une année donnée */
    getDatePourAnnee(annee: number): Date | null {
        if (this.estRecurrent && this.mois && this.jourMois) {
            return new Date(annee, this.mois - 1, this.jourMois);
        }
        if (this.date) {
            return new Date(this.date);
        }
        return null;
    }

    /** Vérifie si ce jour férié tombe à une date donnée (comparaison locale, pas UTC) */
    correspondADate(date: Date): boolean {
        if (this.estRecurrent && this.mois && this.jourMois) {
            return date.getMonth() + 1 === this.mois && date.getDate() === this.jourMois;
        }
        if (this.date) {
            // Parser "YYYY-MM-DD" en local (pas new Date() qui interprète en UTC)
            const dateStr = typeof this.date === 'string' ? this.date : this.date.toISOString().slice(0, 10);
            const [annee, mois, jour] = dateStr.split('-').map(Number);
            if (!annee || !mois || !jour) return false;
            return date.getFullYear() === annee
                && date.getMonth() + 1 === mois
                && date.getDate() === jour;
        }
        return false;
    }

    // ─── Propriété transiente (non persistée, calculée au runtime) ──

    /** Date calculée pour un JF récurrent dans une année/plage donnée */
    dateCalculee?: Date | null;
}
