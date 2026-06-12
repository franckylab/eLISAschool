/**
 * ==================================
 * eLISAschool - Types Responsables Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

export interface ResponsableEleve {
    id: string;
    utilisateurId: string;
    enfantId: string;
    eleveNom?: string;
    elevePrenom?: string;
    lienParente: 'PERE' | 'MERE' | 'TUTEUR' | 'AUTRE';
    responsableLegal: boolean;
    telephone?: string;
    email?: string;
    adresse?: string;
    profession?: string;
    creeAt: string;
    majAt: string;
}

export interface CreerResponsableEleveDto {
    utilisateurId: string;
    enfantId: string;
    lienParente: string;
    responsableLegal?: boolean;
    telephone?: string;
    email?: string;
}

export interface ModifierResponsableEleveDto {
    lienParente?: string;
    responsableLegal?: boolean;
    telephone?: string;
    email?: string;
}

export interface ResponsableEleveFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    lienParente?: string;
    responsableLegal?: boolean;
}
