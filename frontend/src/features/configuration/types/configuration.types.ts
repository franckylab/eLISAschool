/**
 * ==================================
 * eLISAschool - Types Configuration
 * ==================================
 * Types partagés pour le système de configuration plateforme et établissement
 * Source unique : ParametreSysteme (backend entity)
 */

/** Type de valeur du paramètre (miroir de TypeValeurParametre backend) */
export type TypeValeurParametre = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY' | 'ENCRYPTED';

/** Catégorie de paramètre (miroir de CategorieParametre backend) */
export type CategorieParametre = 'SYSTEME' | 'SECURITE' | 'ETABLISSEMENT' | 'MODULE' | 'THEME' | 'NOTIFICATION' | 'REGIONAL' | 'CUSTOM';

/** Option de select pour les paramètres avec choix prédéfinis */
export interface OptionParametre {
    value: string;
    label: string;
}

/** Paramètre système — source unique de vérité (ADR-005) */
export interface ParametreSysteme {
    id: string;
    cle: string;
    valeur: string;
    typeValeur: TypeValeurParametre;
    categorie: CategorieParametre;
    module?: string;
    description?: string;
    valeurDefaut?: string;
    modifiableRuntime: boolean;
    visible: boolean;
    ordre: number;
    validation?: string;
    propageable: boolean;
    options?: OptionParametre[];
    etablissementId?: string;
    groupeEtablissementId?: string;
    createdAt: string;
    updatedAt: string;
}

/** DTO création paramètre */
export interface CreateParametreDto {
    cle: string;
    valeur: string;
    typeValeur: TypeValeurParametre;
    categorie: CategorieParametre;
    module?: string;
    description?: string;
    valeurDefaut?: string;
    options?: OptionParametre[];
}

/** DTO mise à jour paramètre */
export interface UpdateParametreDto {
    valeur?: string;
    description?: string;
}

/** DTO mise à jour en bulk (PUT /parametres/bulk) */
export interface UpdateParametreBulkItem {
    cle: string;
    valeur: any;
    etablissementId?: string;
}

/** DTO bulk complet */
export interface UpdateParametresBulkDto {
    parametres: UpdateParametreBulkItem[];
}

/** Filtres de recherche paramètres */
export interface ParametreFiltres {
    page?: number;
    limit?: number;
    categorie?: CategorieParametre;
    module?: string;
    recherche?: string;
    etablissementId?: string;
}

/** Catégorie module — source unique : ModuleCatalogue DB (Refonte v3 — binaire) */
export type ModuleCategory = 'GRATUIT' | 'PAYANT';

export interface ModuleRegistryEntry {
    name: string;
    label: string;
    description: string;
    icon: string;
    basePath: string;
    category: ModuleCategory;
    defaultActive: boolean;
    premium: boolean;
    dependencies: string[];
    defaultRoles: string[];
    actif: boolean;
    // Champs entitlement (migration 200 — Refonte SaaS unification modules)
    estAccessible: boolean;
    estVisible: boolean;
    raisonBlocage: string | null;
    messageBlocage: string | null;
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
    // Champs entitlement (migration 200)
    estAccessible: boolean;
    estVisible: boolean;
    raisonBlocage: string | null;
    messageBlocage: string | null;
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
