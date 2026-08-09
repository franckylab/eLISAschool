/**
 * ==================================
 * eLISAschool - Interface BackupProvider
 * ==================================
 * 
 * Contrat commun pour tous les providers de backup.
 * Permet le stockage sur différents backends.
 * 
 * Phase 9.1 — Refonte SaaS
 */

export interface BackupFile {
    name: string;
    size: number;
    createdAt: Date;
    path: string;
    metadata?: Record<string, any>;
}

export interface BackupResult {
    success: boolean;
    path?: string;
    size?: number;
    message?: string;
}

export interface RestoreResult {
    success: boolean;
    message?: string;
}

/**
 * Interface BackupProvider — contrat commun pour les providers de backup.
 */
export interface BackupProvider {
    readonly name: string;
    readonly displayName: string;

    /**
     * Sauvegarde un fichier vers le backend de stockage.
     */
    upload(filePath: string, fileName: string, credentials: Record<string, any>): Promise<BackupResult>;

    /**
     * Télécharge un fichier depuis le backend.
     */
    download(remotePath: string, localPath: string, credentials: Record<string, any>): Promise<RestoreResult>;

    /**
     * Liste les fichiers disponibles.
     */
    list(credentials: Record<string, any>, prefix?: string): Promise<BackupFile[]>;

    /**
     * Supprime un fichier.
     */
    delete(remotePath: string, credentials: Record<string, any>): Promise<boolean>;

    /**
     * Vérifie si le provider est configuré.
     */
    estConfigure(credentials: Record<string, any>): boolean;
}
