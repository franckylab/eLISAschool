/**
 * ==================================
 * eLISAschool - Types Programmes Pédagogiques
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface ProgrammePedagogique {
    id: string;
    nom: string;
    code: string;
    description?: string;
    cycleId?: string;
    cycleNom?: string;
    niveauId?: string;
    niveauNom?: string;
    etablissementId: string;
    actif: boolean;
    nbMatieres?: number;
    nbHeuresHebdo?: number;
    creeAt: string;
    majAt: string;
}

export interface CreerProgrammeDto {
    nom: string;
    code?: string;
    description?: string;
    cycleId?: string;
    niveauId?: string;
}

export interface ModifierProgrammeDto {
    nom?: string;
    description?: string;
    actif?: boolean;
    cycleId?: string;
    niveauId?: string;
}

export interface ProgrammeFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    cycleId?: string;
    niveauId?: string;
    classeId?: string;
    matiereId?: string;
    actif?: boolean;
}
