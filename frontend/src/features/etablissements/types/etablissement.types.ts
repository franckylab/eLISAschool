/**
 * ==================================
 * eLISAschool - Types Établissements
 * ==================================
 * Version: 2.0.0 — Enrichi pour page détail plateforme
 */

// =============================================
// Enums
// =============================================

export type TypeEtablissement = 'LAIC' | 'CONFESSIONNEL_CATHOLIQUE' | 'CONFESSIONNEL_PROTESTANT' | 'CONFESSIONNEL_ISLAMIQUE' | 'AUTRE';
export type SousSysteme = 'FRANCOPHONE' | 'ANGLOPHONE' | 'BICULTUREL';
export type StatutEtablissement = 'ACTIF' | 'EN_ATTENTE_VALIDATION' | 'EN_ATTENTE_DESACTIVATION' | 'INACTIF';

// =============================================
// Constantes de labels (partagées index + détail)
// =============================================

export const TYPE_LABELS: Record<string, string> = {
    LAIC: 'Laïc',
    CONFESSIONNEL_CATHOLIQUE: 'Catholique',
    CONFESSIONNEL_PROTESTANT: 'Protestant',
    CONFESSIONNEL_ISLAMIQUE: 'Islamique',
    AUTRE: 'Autre',
};

export const SOUS_SYSTEME_LABELS: Record<string, string> = {
    FRANCOPHONE: 'Francophone',
    ANGLOPHONE: 'Anglophone',
    BICULTUREL: 'Biculturel',
};

export const STATUT_LABELS: Record<string, string> = {
    ACTIF: 'Actif',
    EN_ATTENTE_VALIDATION: 'En attente',
    EN_ATTENTE_DESACTIVATION: 'Désactivation',
    INACTIF: 'Inactif',
};

/** Styles pour les badges statut (index page — thème clair) */
export const STATUT_STYLES: Record<string, string> = {
    ACTIF: 'bg-green-100 text-green-800',
    EN_ATTENTE_VALIDATION: 'bg-yellow-100 text-yellow-800',
    EN_ATTENTE_DESACTIVATION: 'bg-orange-100 text-orange-800',
    INACTIF: 'bg-gray-100 text-gray-800',
};

/** Config statut pour le header détail (thème sombre / gradient) */
export const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    ACTIF: { label: 'Actif', bg: 'bg-green-500/20', text: 'text-green-200', dot: 'bg-green-400' },
    EN_ATTENTE_VALIDATION: { label: 'En attente', bg: 'bg-yellow-500/20', text: 'text-yellow-200', dot: 'bg-yellow-400' },
    EN_ATTENTE_DESACTIVATION: { label: 'Désactivation', bg: 'bg-orange-500/20', text: 'text-orange-200', dot: 'bg-orange-400' },
    INACTIF: { label: 'Inactif', bg: 'bg-gray-500/20', text: 'text-gray-200', dot: 'bg-gray-400' },
};

export const PLAN_LABELS: Record<string, string> = {
    gratuit: 'Gratuit',
    standard: 'Standard',
    premium: 'Premium',
    entreprise: 'Enterprise',
};

// =============================================
// Interface principale
// =============================================

export interface Etablissement {
    id: string;
    nom: string;
    codeEtablissement?: string;
    slogan?: string;
    adresse?: string;
    ville?: string;
    contactEmail?: string;
    contactTelephone?: string;
    type: TypeEtablissement;
    sousSysteme: SousSysteme;
    statut: StatutEtablissement;
    actif: boolean;
    effectifActuel?: number;
    effectifMax?: number;
    createdAt: string;
    updatedAt: string;

    // Champs étendus (v2.0 — page détail)
    numeroArrete?: string;
    numeroContribuable?: string;
    numeroCompteBancaire?: string;
    siteWeb?: string;
    facebook?: string;
    twitter?: string;
    heuresOuverture?: string;
    heuresFermeture?: string;
    directeurNom?: string;
    directeurAdjointNom?: string;
    censeurNom?: string;
    surveillantGeneralNom?: string;
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    langueDefaut?: string;
    devise?: string;
    fuseauHoraire?: string;
    logoBase64?: string;
    logoType?: string;
    logoTaille?: number;

    // Localisation géographique (v8.0)
    pays?: string;
    region?: string;
    quartier?: string;
    latitude?: number;
    longitude?: number;

    // Identifiants officiels (v8.0)
    numeroEnregistrement?: string;
    numeroIdentification?: string;
    numeroAutorisation?: string;

    // Contenu public (v8.0)
    descriptionPublique?: string;

    // Relation configuration (chargée via findOne avec includeLogo)
    configuration?: EtablissementConfig;
}

// =============================================
// Configuration établissement
// =============================================

export interface EtablissementConfig {
    id: string;
    etablissementId: string;
    cyclesActifs: string[];
    configurationBulletin?: {
        style?: string;
        couleurPrimaire?: string;
        afficherRang?: boolean;
        afficherMoyenneGenerale?: boolean;
        afficherAppreciation?: boolean;
        afficherPhoto?: boolean;
        afficherCourbeProgression?: boolean;
    };
    maxEleves?: number;
    maxUtilisateurs?: number;
    maxClasses?: number;
    stockageMaxMB?: number;
    dateExpirationAbonnement?: string;
    planAbonnement?: string;
    autoRenouvellement?: boolean;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// Configuration complète (avec modules actifs)
// =============================================

export interface ModuleActifItem {
    code: string;
    nom: string;
    actif: boolean;
    categorie: string;
}

export interface ConfigCompleteResult {
    config: EtablissementConfig;
    modulesActifs: ModuleActifItem[];
    resume: {
        totalModulesActifs: number;
        totalModulesCatalogue: number;
        cyclesActifsCount: number;
    };
}

// =============================================
// Stats détail établissement
// =============================================

export interface EtablissementDetailStats {
    etablissementId: string;
    nomEtablissement: string;
    nombreClasses: number;
    nombreEleves: number;
    nombrePersonnel: number;
    nombreNiveaux: number;
    tauxOccupation: number;
    config: {
        cyclesActifs: number;
        modulesActifs: number;
        planAbonnement?: string;
    };
}

// =============================================
// DTOs
// =============================================

export interface CreerEtablissementDto {
    nom: string;
    codeEtablissement?: string;
    slogan?: string;
    adresse?: string;
    ville?: string;
    contactEmail?: string;
    contactTelephone?: string;
    type?: string;
    sousSysteme?: string;
}

export interface ModifierEtablissementDto extends Partial<CreerEtablissementDto> {
    id: string;
}

export interface EtablissementFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    statut?: string;
    type?: string;
    sousSysteme?: string;
}

// =============================================
// Activité Établissement (Control Plane)
// =============================================

// =============================================
// Utilisateurs liés à un établissement (Control Plane)
// =============================================

export interface UtilisateursResumeRole {
    role: string;
    code: string;
    count: number;
}

export interface UtilisateurDernier {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    code?: string;
    actif: boolean;
    derniereConnexion?: string;
    creeLe: string;
}

export interface UtilisateursResumeResult {
    total: number;
    actifs: number;
    parRole: UtilisateursResumeRole[];
    derniers: UtilisateurDernier[];
}

// =============================================
// Activité Établissement (Control Plane)
// =============================================

export interface ActiviteVentilation {
    parCycle: { cycle: string; code: string; nombre: number }[];
    parGenre: { masculin: number; feminin: number; autre: number };
    ratioPersonnelEleves: number;
    nouvellesInscriptions: number;
    dernieresInscriptions: { nomEleve: string; dateInscription: string; classe?: string }[];
}

export interface ActiviteModule {
    nom: string;
    actif: boolean;
    activeLe?: string;
}

export interface ActiviteModuleChangement {
    module: string;
    action: string;
    date: string;
}

export interface ActiviteModules {
    actifs: ActiviteModule[];
    totalActifs: number;
    derniersChangements: ActiviteModuleChangement[];
}

export interface ActiviteAuditEntry {
    id: string;
    action: string;
    module?: string;
    cible?: string;
    cibleId?: string;
    description?: string;
    utilisateurId?: string;
    utilisateurEmail?: string;
    severity: string;
    createdAt: string;
}

export interface ActiviteTimeline {
    compteurs: { module: string; count: number }[];
    evenements: ActiviteAuditEntry[];
}

export interface ActiviteAbonnement {
    plan: string;
    statut: string;
    dateFin: string;
    montantMensuel: number;
    autoRenouvellement: boolean;
}

export interface ActiviteFinances {
    paiementsMois: number;
    montantPaiementsMois: number;
    facturesEnAttente: number;
    montantEnAttente: number;
    tauxRecouvrement: number;
    retardMoyenJours: number;
    abonnement: ActiviteAbonnement | null;
}

export interface ActiviteEtablissementResult {
    etablissementId: string;
    ventilation: ActiviteVentilation;
    modules: ActiviteModules;
    timeline: ActiviteTimeline;
    finances: ActiviteFinances;
}

// =============================================
// Factures établissement (Control Plane)
// =============================================

export type StatutFacture = 'BROUILLON' | 'EMISE' | 'PAYEE' | 'EN_RETARD' | 'PARTIELLEMENT_PAYEE' | 'ANNULEE' | 'EN_PAIEMENT' | 'AVOIR';

export interface FactureEtablissement {
    id: string;
    numero: string;
    numeroOHADA?: string;
    etablissementId: string;
    montantHT: number;
    montantTVA: number;
    montantTotal: number;
    montantPaye: number;
    statut: StatutFacture;
    dateEmission: string;
    dateEcheance: string;
    datePaiement?: string;
    devise: string;
    createdAt: string;
    updatedAt: string;
}

// =============================================
// Historique connexions (série temporelle)
// =============================================

export interface ConnexionJour {
    date: string;
    connexions: number;
    utilisateursUniques: number;
}

export interface HistoriqueConnexionsResult {
    serie: ConnexionJour[];
    total30j: number;
    moyenneJour: number;
    picJour: number;
    utilisateursActifs30j: number;
}

// =============================================
// Journal d'audit (logs par établissement)
// =============================================

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLogEntry {
    id: string;
    action: string;
    severity: AuditSeverity;
    description?: string;
    cible?: string;
    cibleId?: string;
    module?: string;
    utilisateur?: {
        id: string;
        nom?: string;
        prenom?: string;
        email?: string;
        role?: string;
    };
    ipAddress?: string;
    appareil?: string;
    navigateur?: string;
    estEchec: boolean;
    createdAt: string;
}

export interface AuditLogResponse {
    data: AuditLogEntry[];
    meta: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
        itemsPerPage: number;
    };
}

// =============================================
// Historique scores santé (sparkline)
// =============================================

export interface HistoriqueScoreSante {
    id: string;
    score: number;
    categorie: string;
    scoreAbonnement?: number;
    scorePaiements?: number;
    scoreActivite?: number;
    scoreModules?: number;
    createdAt: string;
}

// =============================================
// Évolution mensuelle des paiements
// =============================================

export interface EvolutionPaiementMois {
    mois: string; // 'YYYY-MM'
    montantTotal: number;
    montantPaye: number;
    nbFactures: number;
}

// =============================================
// Distribution (plans, types)
// =============================================

export interface DistributionItem {
    label: string;
    count: number;
    color?: string;
}
