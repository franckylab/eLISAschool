/**
 * ==================================
 * eLISAschool - Types Établissements
 * ==================================
 */

export interface Etablissement {
    id: string;
    nom: string;
    code?: string;
    slogan?: string;
    adresse?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    logo?: string;
    typeEtablissement?: 'LAIC' | 'CONFESSIONNEL_CATHOLIQUE' | 'CONFESSIONNEL_PROTESTANT' | 'CONFESSIONNEL_ISLAMIQUE' | 'AUTRE';
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE' | 'BICULTUREL';
    statut?: 'ACTIF' | 'EN_ATTENTE_VALIDATION' | 'EN_ATTENTE_DESACTIVATION' | 'INACTIF';
    dateCreation?: string;
    nbEleves?: number;
    nbPersonnel?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreerEtablissementDto {
    nom: string;
    code?: string;
    slogan?: string;
    adresse?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    typeEtablissement?: string;
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
    typeEtablissement?: string;
    sousSysteme?: string;
}
