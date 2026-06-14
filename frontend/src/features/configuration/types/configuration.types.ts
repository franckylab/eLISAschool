/**
 * ==================================
 * eLISAschool - Types Configuration
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

/**
 * Types pour la configuration
 * @note Utiliser exclusivement ParametreSysteme avec scopage établissement
 */

// =============================================
// PARAMÈTRES SYSTÈME
// =============================================

export interface ParametreSysteme {
    id: string;
    cle: string;
    valeur: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    categorie: string;
    description?: string;
    etablissementId?: string;
    actif: boolean;
    creeAt: string;
    majAt: string;
}

export interface CreateParametreDto {
    cle: string;
    valeur: string;
    type: string;
    categorie: string;
    description?: string;
}

export interface UpdateParametreDto {
    valeur?: string;
    description?: string;
    actif?: boolean;
}

export interface ParametreFiltres {
    page?: number;
    limit?: number;
    categorie?: string;
    recherche?: string;
    etablissementId?: string;
}

// =============================================
// CONFIGURATION MODULES
// =============================================

export interface ConfigurationModule {
    id: string;
    moduleNom: string;
    actif: boolean;
    ordre: number;
    configuration?: Record<string, any>;
    creeAt: string;
    majAt: string;
}

export interface UpdateConfigModuleDto {
    actif?: boolean;
    ordre?: number;
    configuration?: Record<string, any>;
}

export interface ToggleModuleDto {
    moduleNom: string;
    actif: boolean;
}

// =============================================
// HISTORIQUE CONFIGURATION
// =============================================

export interface HistoriqueConfiguration {
    id: string;
    utilisateurId?: string;
    utilisateurNom?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
    cible: string;
    ancienneValeur?: Record<string, any>;
    nouvelleValeur?: Record<string, any>;
    commentaire?: string;
    creeAt: string;
}

export interface HistoriqueFiltres {
    page?: number;
    limit?: number;
    action?: string;
    cible?: string;
    utilisateurId?: string;
    dateDebut?: string;
    dateFin?: string;
}

// =============================================
// BACKUP
// =============================================

export interface BackupRecord {
    id: string;
    nom: string;
    type: 'config' | 'database' | 'complete';
    taille?: number;
    checksum?: string;
    chiffre: boolean;
    etablissementId?: string;
    creePar?: string;
    creeAt: string;
}

export interface CreateBackupDto {
    type: string;
    nom?: string;
    encrypt?: boolean;
    commentaire?: string;
}
