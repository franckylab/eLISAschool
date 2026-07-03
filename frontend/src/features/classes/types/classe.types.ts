/**
 * ==================================
 * eLISAschool - Types Classe
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

export enum TypeClasse {
    NORMALE = 'NORMALE',
    BILINGUE = 'BILINGUE',
    RENFORCEE = 'RENFORCEE',
    INTERNATIONALE = 'INTERNATIONALE',
}

export enum CreneauHoraire {
    MATIN = 'MATIN',
    APRES_MIDI = 'APRES_MIDI',
    JOURNEE_COMPLETE = 'JOURNEE_COMPLETE',
}

export interface Classe {
    id: string;
    nom: string;
    code: string;
    niveauId: string;
    niveau: {
        id: string;
        nom: string;
        code: string;
        sousSysteme: string;
        cycle?: {
            id: string;
            nom: string;
            code: string;
        };
    };
    filiereId?: string;
    filiere?: {
        id: string;
        nom: string;
        code: string;
    };
    typeClasse: TypeClasse;
    creneauHoraire: CreneauHoraire;
    description?: string;
    actif: boolean;
    etablissementId: string;
    /** Champs enrichis via ClasseAnnee (instance annuelle) */
    effectifActuel?: number;
    effectifMax?: number;
    anneeScolaireId?: string;
    professeurPrincipalId?: string;
    professeurPrincipal?: {
        id: string;
        nom: string;
        prenom: string;
    } | null;
    anneeScolaire?: {
        id: string;
        libelle: string;
        statut?: string;
    } | null;
    salleId?: string;
    salle?: {
        id: string;
        nom: string;
        code: string;
        capacite: number;
    };
    classeAnneeId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerClasseDto {
    nom: string;
    code?: string;
    niveauId: string;
    filiereId?: string | null;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    description?: string;
    /** Champs d'instance annuelle (optionnels) */
    anneeScolaireId?: string;
    professeurPrincipalId?: string | null;
    salleId?: string;
    effectifMax?: number;
}

export interface ModifierClasseDto extends Partial<CreerClasseDto> {
    id: string;
}

export interface ClasseFiltres {
    anneeScolaireId?: string;
    niveau?: string;
    niveauId?: string;
    cycle?: string;
    actif?: boolean;
    recherche?: string;
    statut?: 'actif' | 'inactif';
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

/**
 * DTO pour la création du modèle de classe (étape 1)
 */
export interface CreerClasseModeleDto {
    nom: string;
    code?: string;
    niveauId: string;
    filiereId?: string | null;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    description?: string;
}

/**
 * DTO pour l'instance annuelle de classe (étape 2)
 */
export interface CreerClasseInstanceDto {
    anneeScolaireId: string;
    professeurPrincipalId?: string | null;
    salleId?: string;
    effectifMax?: number;
}

/**
 * DTO combiné pour le formulaire complet
 */
export interface CreerClasseCompletDto extends CreerClasseModeleDto, CreerClasseInstanceDto {}

/**
 * DTO pour l'affectation d'un élève à une classe
 */
export interface AffecterEleveDto {
    eleveId: string;
    classeId: string;
    dateAffectation?: string;
    motifChangement?: string;
    commentaire?: string;
}

/**
 * Statistiques des élèves d'une classe
 */
export interface ElevesClasseStats {
    total: number;
    garcons: number;
    filles: number;
    pourcentageGarcons: number;
    pourcentageFilles: number;
}

/**
 * Résultat de l'endpoint GET /api/classes/:id/eleves
 */
export interface ElevesClasseResult {
    eleves: {
        items: Array<Record<string, any> & { classeId?: string; affectationId?: string }>;
        meta: {
            currentPage: number;
            itemsPerPage: number;
            totalItems: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    };
    stats: ElevesClasseStats;
}
