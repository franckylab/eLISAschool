export interface ParametreSysteme {
    id: string;
    cle: string;
    valeur: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    categorie: string;
    description?: string;
    etablissementId?: string;
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
}

export interface ParametreFiltres {
    page?: number;
    limit?: number;
    categorie?: string;
    recherche?: string;
    etablissementId?: string;
}

export interface ModuleRegistryEntry {
    name: string;
    label: string;
    description: string;
    icon: string;
    basePath: string;
    category: string;
    defaultActive: boolean;
    premium: boolean;
    dependencies: string[];
    defaultRoles: string[];
    actif: boolean;
}

export interface ConfigurationModule {
    id: string;
    moduleNom: string;
    champsPersonnalises: any[];
    widgets: any[];
    parametres: Record<string, any>;
    creeAt: string;
    majAt: string;
}

export interface UpdateConfigModuleDto {
    champsPersonnalises?: any[];
    widgets?: any[];
    parametres?: Record<string, any>;
}

export interface ToggleModuleDto {
    moduleNom: string;
    actif: boolean;
}

export interface ModuleImpact {
    modulesAActiver: string[];
    modulesADesactiver: string[];
    conflits: string[];
}

export interface ModuleState {
    entry: ModuleRegistryEntry;
    config: ConfigurationModule | null;
    actif: boolean;
    isLoading: boolean;
}

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
