/**
 * ==================================
 * eLISAschool - Types Diplômes Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface DiplomeEleve {
    id: string;
    eleveId: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule?: string;
    };
    examenNationalId: string;
    examenNational?: {
        id: string;
        nom: string;
        code: string;
        diplomeDelivre?: string;
    };
    noteObtenue?: number;
    mention?: string;
    resultat: 'ADMIS' | 'REFUSE' | 'AJOURNE';
    dateObtention: string;
    numeroDiplome?: string;
    observations?: string;
    etablissementId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerDiplomeEleveDto {
    eleveId: string;
    examenNationalId: string;
    noteObtenue?: number;
    mention?: string;
    resultat: 'ADMIS' | 'REFUSE' | 'AJOURNE';
    dateObtention: string;
    numeroDiplome?: string;
    observations?: string;
    etablissementId?: string;
}

export interface ModifierDiplomeEleveDto {
    noteObtenue?: number;
    mention?: string;
    resultat?: 'ADMIS' | 'REFUSE' | 'AJOURNE';
    dateObtention?: string;
    numeroDiplome?: string;
    observations?: string;
}

export interface DiplomeEleveFiltres {
    recherche?: string;
    eleveId?: string;
    examenNationalId?: string;
    resultat?: string;
    anneeObtention?: number;
    page?: number;
    limit?: number;
}
