/**
 * ==================================
 * eLISAschool - Interface Storage Provider
 * ==================================
 * Version: 1.0.0
 * 
 * Interface abstraite pour les providers de stockage de backups.
 * Permet de supporter multiples backends (Database, S3, FileSystem)
 * avec failover automatique.
 */

/**
 * Types de backup supportés
 */
export type BackupType = 'config' | 'database' | 'full';

/**
 * Métadonnées d'un backup
 */
export interface BackupMetadata {
    /** ID de l'établissement (null = global) */
    etablissementId?: string | null;
    
    /** Type de backup */
    backupType: BackupType;
    
    /** Version du backup (semver pour config, timestamp pour database) */
    version: string;
    
    /** Checksum SHA-256 pour validation d'intégrité */
    checksum: string;
    
    /** Le backup est-il chiffré ? */
    encrypted: boolean;
    
    /** Le backup est-il compressé ? */
    compressed: boolean;
    
    /** Taille en bytes */
    size: number;
    
    /** Date de création */
    createdAt: Date;
    
    /** Date de rétention (après laquelle le backup peut être supprimé) */
    retentionUntil?: Date;
    
    /** Métadonnées additionnelles */
    metadata?: Record<string, any>;
}

/**
 * Filtres pour la recherche de backups
 */
export interface BackupFilter {
    etablissementId?: string | null;
    backupType?: BackupType;
    dateDebut?: Date;
    dateFin?: Date;
    limit?: number;
    offset?: number;
}

/**
 * Enregistrement de backup retourné par le storage
 */
export interface BackupRecord {
    id: string;
    etablissementId?: string | null;
    backupType: BackupType;
    version: string;
    checksum: string;
    storageProvider: string;
    storageKey: string;
    encrypted: boolean;
    compressed: boolean;
    sizeBytes: number;
    metadata: Record<string, any>;
    retentionUntil?: Date;
    createdAt: Date;
}

/**
 * Usage du stockage
 */
export interface StorageUsage {
    totalBytes: number;
    backupCount: number;
    byType: Record<BackupType, { bytes: number; count: number }>;
    byEtablissement: Record<string, { bytes: number; count: number }>;
}

/**
 * Interface principale pour les providers de stockage
 */
export interface IBackupStorage {
    /**
     * Nom du provider (ex: 'database', 's3', 'filesystem')
     */
    readonly name: string;

    /**
     * Sauvegarde des données dans le storage
     * 
     * @param data Données du backup (déjà compressées/chiffrées si nécessaire)
     * @param metadata Métadonnées du backup
     * @returns Enregistrement du backup créé
     */
    save(data: Buffer, metadata: BackupMetadata): Promise<BackupRecord>;

    /**
     * Charge les données d'un backup depuis le storage
     * 
     * @param recordId ID de l'enregistrement de backup
     * @returns Données du backup
     */
    load(recordId: string): Promise<Buffer>;

    /**
     * Supprime un backup du storage
     * 
     * @param recordId ID de l'enregistrement de backup
     */
    delete(recordId: string): Promise<void>;

    /**
     * Liste les backups disponibles avec filtres optionnels
     * 
     * @param filter Filtres de recherche
     * @returns Liste des enregistrements de backup
     */
    list(filter?: BackupFilter): Promise<BackupRecord[]>;

    /**
     * Retourne l'utilisation du stockage
     * 
     * @returns Statistiques d'utilisation
     */
    getStorageUsage(): Promise<StorageUsage>;

    /**
     * Vérifie la connectivité au storage
     * 
     * @returns true si le storage est accessible
     */
    testConnection(): Promise<boolean>;

    /**
     * Nettoie les backups expirés (au-delà de retentionUntil)
     * 
     * @returns Nombre de backups supprimés
     */
    cleanupExpiredBackups(): Promise<number>;
}
