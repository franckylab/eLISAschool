/**
 * ==================================
 * eLISAschool - Entité PromotionUtilisee (Tracking v4.1)
 * ==================================
 *
 * Enregistrement de chaque utilisation de promotion par un établissement.
 * Permet : analytics, reporting, détection abus, audit commercial.
 *
 * Table : promotion_utilisees
 *
 * Version: 4.1.0
 * Auteur: franck arlos chendjou
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('promotion_utilisees')
@Index(['etablissementId'])
@Index(['promotionId'])
@Index(['dateUtilisation'])
export class PromotionUtilisee {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'uuid' })
    promotionId!: string;

    @Column({ type: 'uuid' })
    etablissementId!: string;

    /** ID de la facture sur laquelle la promo a été appliquée */
    @Column({ type: 'uuid', nullable: true })
    factureId?: string;

    /** Code de la promotion (dénormalisé pour requêtes rapides) */
    @Column({ type: 'varchar', length: 100 })
    codePromotion!: string;

    /** Scope de la promotion (PLAN, PACK, MODULE, PACKAGE) */
    @Column({ type: 'varchar', length: 20 })
    scope!: string;

    /** Montant déduit par cette promotion (en devise) */
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    montantDeduit!: number;

    /** Date d'utilisation (date de la facture) */
    @Column({ type: 'timestamp', default: () => 'now()' })
    dateUtilisation!: Date;

    @CreateDateColumn()
    createdAt!: Date;
}
