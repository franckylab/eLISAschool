/**
 * ==================================
 * eLISAschool - Types Archives
 * ==================================
 */

export interface Archive {
    id: string;
    titre: string;
    description?: string;
    categorie: 'document' | 'photo' | 'video' | 'audio' | 'autre';
    anneeScolaire?: string;
    tags?: string[];
    fichierUrl: string;
    tailleFichier?: number;
    typeMime?: string;
    archiveParId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    archivePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface CreerArchiveDto {
    titre: string;
    description?: string;
    categorie: string;
    anneeScolaire?: string;
    tags?: string[];
    fichier: File;
}

export interface StatistiquesArchives {
    totalArchives: number;
    parCategorie: { categorie: string; nombre: number; }[];
    tailleTotale: number;
    parAnnee: { annee: string; nombre: number; }[];
    evolutionMensuelle: {
        mois: string;
        nombre: number;
        taille: number;
    }[];
}

export interface ArchiveFiltres {
    categorie?: string;
    anneeScolaire?: string;
    recherche?: string;
    tag?: string;
}
