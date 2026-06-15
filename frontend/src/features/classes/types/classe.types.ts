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
    };
    filiereId?: string;
    filiere?: {
        id: string;
        nom: string;
        code: string;
    };
    anneeScolaireId: string;
    professeurPrincipalId?: string;
    professeurPrincipal?: {
        id: string;
        nom: string;
        prenom: string;
    };
    sallePrincipale?: string;
    effectifMax: number;
    effectifActuel: number;
    typeClasse: TypeClasse;
    creneauHoraire: CreneauHoraire;
    description?: string;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerClasseDto {
    nom: string;
    code?: string;
    niveauId: string;
    filiereId?: string | null;
    anneeScolaireId?: string;
    professeurPrincipalId?: string | null;
    sallePrincipale?: string;
    effectifMax?: number;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    description?: string;
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
