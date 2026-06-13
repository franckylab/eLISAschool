/**
 * ==================================
 * eLISAschool - Types Examens Nationaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface ExamenNational {
    id: string;
    nom: string;
    code: string;
    type: 'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL';
    niveauId: string;
    niveau?: {
        id: string;
        nom: string;
        code: string;
    };
    dateProgrammation?: string;
    coefficient?: number;
    estObligatoire: boolean;
    diplomeDelivre?: string;
    description?: string;
    sousSysteme: 'FRANCOPHONE' | 'ANGLOPHONE';
    actif: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreerExamenNationalDto {
    nom: string;
    code: string;
    type: 'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL';
    niveauId: string;
    dateProgrammation?: string;
    coefficient?: number;
    estObligatoire?: boolean;
    diplomeDelivre?: string;
    description?: string;
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE';
    actif?: boolean;
}

export interface ModifierExamenNationalDto {
    nom?: string;
    code?: string;
    type?: 'NATIONAL' | 'REGIONAL' | 'INTERNATIONAL';
    niveauId?: string;
    dateProgrammation?: string;
    coefficient?: number;
    estObligatoire?: boolean;
    diplomeDelivre?: string;
    description?: string;
    sousSysteme?: 'FRANCOPHONE' | 'ANGLOPHONE';
    actif?: boolean;
}

export interface ExamenNationalFiltres {
    recherche?: string;
    niveauId?: string;
    type?: string;
    sousSysteme?: string;
    actif?: boolean;
    page?: number;
    limit?: number;
}
