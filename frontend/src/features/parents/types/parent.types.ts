/**
 * ==================================
 * eLISAschool - Types Parents (Module Parents)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 */

export interface Parent {
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

export interface CreerParentDto {
    utilisateurId: string;
    enfantId: string;
    lienParente: string;
    responsableLegal?: boolean;
    telephone?: string;
    email?: string;
}

export interface ModifierParentDto {
    lienParente?: string;
    responsableLegal?: boolean;
    telephone?: string;
    email?: string;
}

export interface ParentFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    lienParente?: string;
    responsableLegal?: boolean;
    utilisateurId?: string;
    enfantId?: string;
    eleveId?: string;
}
