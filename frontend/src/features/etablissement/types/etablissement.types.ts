/**
 * ==================================
 * eLISAschool - Types Etablissement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

// =============================================
// ENUMS
// =============================================

export enum SousSysteme {
    FRANCOPHONE = 'FRANCOPHONE',
    ANGLOPHONE = 'ANGLOPHONE',
    BICULTUREL = 'BICULTUREL',
}

export enum TypeEtablissement {
    LAIC = 'LAIC',
    CONFESSIONNEL_CATHOLIQUE = 'CONFESSIONNEL_CATHOLIQUE',
    CONFESSIONNEL_PROTESTANT = 'CONFESSIONNEL_PROTESTANT',
    CONFESSIONNEL_ISLAMIQUE = 'CONFESSIONNEL_ISLAMIQUE',
    AUTRE = 'AUTRE',
}

export enum StatutEtablissement {
    ACTIF = 'ACTIF',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    EN_ATTENTE_DESACTIVATION = 'EN_ATTENTE_DESACTIVATION',
    INACTIF = 'INACTIF',
}

// =============================================
// ENTITÉ PRINCIPALE
// =============================================

export interface Etablissement {
    id: string;
    nom: string;
    codeEtablissement?: string;
    slogan?: string;
    
    // Logo établissement (v3.0)
    logoUrl?: string; // Data URI du logo (quand explicitement sélectionné)
    logoType?: string; // 'png', 'jpg', 'svg', 'webp'
    logoTaille?: number; // Taille en octets
    
    sousSysteme: SousSysteme;
    type: TypeEtablissement;
    numeroArrete?: string;
    numeroContribuable?: string;
    numeroCompteBancaire?: string;
    contactEmail?: string;
    contactTelephone?: string;
    adresse?: string;
    siteWeb?: string;
    facebook?: string;
    twitter?: string;
    heuresOuverture?: string;
    heuresFermeture?: string;
    effectifMax?: number;
    effectifActuel: number;
    directeurNom?: string;
    directeurAdjointNom?: string;
    censeurNom?: string;
    surveillantGeneralNom?: string;
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    
    // Paramètres régionaux (v3.0)
    langueDefaut: string; // 'fr', 'en', 'pt'
    devise: string; // 'XAF', 'XOF', 'EUR', 'USD', 'NGN'
    fuseauHoraire: string; // Format IANA timezone
    
    actif: boolean;
    statut: StatutEtablissement;
    createdAt: string;
    updatedAt: string;
    configuration?: EtablissementConfig;
}

// =============================================
// CONFIGURATION ÉTABLISSEMENT
// =============================================

export interface EtablissementConfig {
    id: string;
    etablissementId: string;
    cyclesActifs: string[];
    configurationBulletin?: {
        style?: 'moderne' | 'classique';
        couleurPrimaire?: string;
        afficherRang?: boolean;
        afficherMoyenneGenerale?: boolean;
        afficherAppreciation?: boolean;
        afficherPhoto?: boolean;
        afficherCourbeProgression?: boolean;
    };
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    couleurAccent?: string;
    theme?: 'default' | 'dark' | 'cameroon';
    langueDefaut: string;
    devise: string;
    fuseauHoraire: string;
    messageAccueil?: string;
    modulesActifs?: Record<string, boolean>;
    maxEleves?: number;
    maxUtilisateurs?: number;
    maxClasses?: number;
    stockageMaxMB?: number;
    dateExpirationAbonnement?: string;
    planAbonnement?: 'gratuit' | 'standard' | 'premium' | 'entreprise';
    createdAt: string;
    updatedAt: string;
}

// =============================================
// DTOs
// =============================================

export interface CreerEtablissementDto {
    nom: string;
    codeEtablissement?: string;
    slogan?: string;
    logoUrl?: string;
    sousSysteme?: SousSysteme;
    type?: TypeEtablissement;
    numeroArrete?: string;
    numeroContribuable?: string;
    numeroCompteBancaire?: string;
    contactEmail?: string;
    contactTelephone?: string;
    adresse?: string;
    siteWeb?: string;
    facebook?: string;
    twitter?: string;
    heuresOuverture?: string;
    heuresFermeture?: string;
    effectifMax?: number;
    directeurNom?: string;
    directeurAdjointNom?: string;
    censeurNom?: string;
    surveillantGeneralNom?: string;
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    
    // Paramètres régionaux (v3.0)
    langueDefaut?: 'fr' | 'en' | 'pt';
    devise?: 'XAF' | 'XOF' | 'EUR' | 'USD' | 'NGN';
    fuseauHoraire?: string; // Format IANA timezone
}

export interface ModifierEtablissementDto extends Partial<CreerEtablissementDto> {
    id: string;
    actif?: boolean;
}

export interface ModifierConfigDto {
    cyclesActifs?: string[];
    configurationBulletin?: {
        style?: 'moderne' | 'classique';
        couleurPrimaire?: string;
        afficherRang?: boolean;
        afficherMoyenneGenerale?: boolean;
        afficherAppreciation?: boolean;
        afficherPhoto?: boolean;
        afficherCourbeProgression?: boolean;
    };
    couleurPrimaire?: string;
    couleurSecondaire?: string;
    couleurAccent?: string;
    theme?: 'default' | 'dark' | 'cameroon';
    langueDefaut?: string;
    devise?: string;
    fuseauHoraire?: string;
    messageAccueil?: string;
    modulesActifs?: Record<string, boolean>;
    maxEleves?: number;
    maxUtilisateurs?: number;
    maxClasses?: number;
    stockageMaxMB?: number;
    planAbonnement?: 'gratuit' | 'standard' | 'premium' | 'entreprise';
    dateExpirationAbonnement?: string;
}

// =============================================
// STATISTIQUES
// =============================================

export interface EtablissementStats {
    totalEtablissements: number;
    etablissementsActifs: number;
    etablissementsInactifs: number;
    parSousSysteme: Record<string, number>;
    parType: Record<string, number>;
}

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
// FILTRES
// =============================================

export interface EtablissementFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    sousSysteme?: SousSysteme;
    type?: TypeEtablissement;
    actif?: boolean;
    statut?: StatutEtablissement;
}
