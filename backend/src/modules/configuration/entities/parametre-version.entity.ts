/**
 * ==================================
 * eLISAschool - Entité ParametreVersion
 * ==================================
 * Version: 1.0.0
 * 
 * Historique des versions de chaque paramètre système
 * pour audit, rollback et analyse des changements.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ParametreSysteme } from './parametre-systeme.entity';
import { Utilisateur } from '@modules/utilisateurs/entities';

/**
 * Entité ParametreVersion
 * Stocke chaque modification d'un paramètre avec avant/après
 */
@Entity('parametre_versions')
@Index(['parametreId', 'version'], { unique: true })
@Index(['etablissementId', 'createdAt'])
@Index(['modifiedBy', 'createdAt'])
export class ParametreVersion {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * ID du paramètre modifié
     */
    @Column({ type: 'uuid' })
    parametreId!: string;

    /**
     * Relation vers le paramètre
     */
    @ManyToOne(() => ParametreSysteme, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'parametreId' })
    parametre!: ParametreSysteme;

    /**
     * ID de l'établissement (null = paramètre global)
     */
    @Column({ type: 'uuid', nullable: true })
    etablissementId?: string;

    /**
     * Ancienne valeur (avant modification)
     */
    @Column({ type: 'text', nullable: true })
    ancienneValeur?: string;

    /**
     * Nouvelle valeur (après modification)
     */
    @Column({ type: 'text' })
    nouvelleValeur!: string;

    /**
     * Numéro de version (auto-incrément par paramètre)
     */
    @Column({ type: 'int' })
    version!: number;

    /**
     * ID de l'utilisateur ayant effectué la modification
     */
    @Column({ type: 'uuid', nullable: true })
    modifiedBy?: string;

    /**
     * Relation vers l'utilisateur
     */
    @ManyToOne(() => Utilisateur, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'modifiedBy' })
    utilisateur?: Utilisateur;

    /**
     * Date de création de cette version
     */
    @CreateDateColumn()
    createdAt!: Date;

    // ============================================
    // Helpers
    // ============================================

    /**
     * Retourne un diff lisible entre ancienne et nouvelle valeur
     */
    getDiff(): { changed: boolean; oldValue: any; newValue: any } {
        let oldValue: any = null;
        let newValue: any = null;

        try {
            oldValue = this.ancienneValeur ? JSON.parse(this.ancienneValeur) : null;
        } catch {
            oldValue = this.ancienneValeur;
        }

        try {
            newValue = JSON.parse(this.nouvelleValeur);
        } catch {
            newValue = this.nouvelleValeur;
        }

        return {
            changed: oldValue !== newValue,
            oldValue,
            newValue,
        };
    }
}
