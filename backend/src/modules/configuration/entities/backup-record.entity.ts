/**
 * ==================================
 * eLISAschool - Entité BackupRecord
 * ==================================
 * Version: 1.0.0
 * 
 * Enregistrement de backup avec support multi-tenant,
 * chiffrement, compression et politiques de rétention.
 */

import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    DeleteDateColumn,
    Index,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Etablissement } from '@modules/etablissement/entities';

/**
 * Types de backup supportés
 */
export enum BackupType {
    CONFIG = 'config',
    DATABASE = 'database',
    FULL = 'full',
}

/**
 * Providers de stockage supportés
 */
export enum StorageProvider {
    DATABASE = 'database',
    S3 = 's3',
    FILESYSTEM = 'filesystem',
}

/**
 * Entité BackupRecord
 * Stocke les métadonnées de chaque backup effectué
 */
@Entity('backup_records')
@Index(['etablissementId', 'backupType', 'createdAt'])
@Index(['checksum'])
@Index(['retentionUntil'])
export class BackupRecord {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * ID de l'établissement (null = backup global/système)
     */
    @Column({ type: 'uuid', nullable: true })
    @Index()
    etablissementId?: string;

    /**
     * Relation vers l'établissement
     */
    @ManyToOne(() => Etablissement, { onDelete: 'CASCADE', nullable: true })
    @JoinColumn({ name: 'etablissementId' })
    etablissement?: Etablissement;

    /**
     * Type de backup
     */
    @Column({
        type: 'enum',
        enum: BackupType,
    })
    backupType!: BackupType;

    /**
     * Version du backup (semver pour config, ISO timestamp pour database)
     */
    @Column({ type: 'varchar', length: 100 })
    version!: string;

    /**
     * Checksum SHA-256 pour validation d'intégrité
     */
    @Column({ type: 'varchar', length: 64 })
    checksum!: string;

    /**
     * Provider de stockage utilisé
     */
    @Column({
        type: 'enum',
        enum: StorageProvider,
        default: StorageProvider.DATABASE,
    })
    storageProvider!: StorageProvider;

    /**
     * Clé unique dans le storage (ex: S3 key, ou ID dans DB)
     */
    @Column({ type: 'varchar', length: 500 })
    storageKey!: string;

    /**
     * Le backup est-il chiffré ?
     */
    @Column({ type: 'boolean', default: false })
    encrypted!: boolean;

    /**
     * Le backup est-il compressé ?
     */
    @Column({ type: 'boolean', default: false })
    compressed!: boolean;

    /**
     * Taille du backup en bytes
     */
    @Column({ type: 'bigint', nullable: true })
    sizeBytes?: number;

    /**
     * Métadonnées additionnelles (JSON)
     */
    @Column({ type: 'jsonb', nullable: true })
    metadata?: Record<string, any>;

    /**
     * Date jusqu'à laquelle le backup doit être conservé
     * NULL = conserver indéfiniment
     */
    @Column({ type: 'timestamp', nullable: true })
    retentionUntil?: Date;

    /**
     * Date de création du backup
     */
    @CreateDateColumn()
    createdAt!: Date;

    /**
     * Date de suppression soft delete
     */
    @DeleteDateColumn()
    deletedAt?: Date;

    // ============================================
    // Helpers
    // ============================================

    /**
     * Vérifie si le backup est expiré
     */
    isExpired(): boolean {
        if (!this.retentionUntil) return false;
        return new Date() > this.retentionUntil;
    }

    /**
     * Retourne la taille formatée (KB, MB, GB)
     */
    getFormattedSize(): string {
        if (!this.sizeBytes) return '0 B';
        
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = this.sizeBytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
}
