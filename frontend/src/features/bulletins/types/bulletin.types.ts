/**
 * ==================================
 * eLISAschool - Types Bulletin
 * ==================================
 */

export interface Bulletin {
    id: string;
    eleveId: string;
    periodeId: string;
    classeId: string;
    anneeScolaireId: string;
    etablissementId: string;
    moyenneGenerale: number;
    rang: number;
    effectifClasse: number;
    appreciation?: string;
    estValide?: boolean;
    dateGeneration?: string;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    classe?: {
        id: string;
        nom: string;
        code: string;
    };
    periode?: {
        id: string;
        nom: string;
        type: string;
    };
    matieres?: BulletinMatiere[];
}

export interface BulletinMatiere {
    id: string;
    matiereId: string;
    moyenne: number;
    coefficient: number;
    rang?: number;
    appreciation?: string;
    matiere?: {
        id: string;
        nom: string;
        code: string;
    };
    enseignant?: {
        id: string;
        nom: string;
        prenom: string;
    };
}

export interface GenererBulletinDto {
    eleveId: string;
    periodeId: string;
    classeId: string;
    anneeScolaireId: string;
}

export interface BulletinFiltres {
    eleveId?: string;
    periodeId?: string;
    classeId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
