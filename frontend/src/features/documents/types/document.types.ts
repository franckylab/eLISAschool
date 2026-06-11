/**
 * ==================================
 * eLISAschool - Types Documents
 * ==================================
 */

export interface Document {
    id: string;
    titre: string;
    description?: string;
    categorie: 'pedagogique' | 'administratif' | 'financier' | 'medical' | 'personnel' | 'autre';
    typeFichier: string;
    tailleFichier?: number;
    urlFichier: string;
    uploadParId?: string;
    etablissementId: string;
    estPublic?: boolean;
    tags?: string[];
    version?: string;
    createdAt: string;
    updatedAt: string;
    uploadPar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    telechargements?: number;
}

export interface CreerDocumentDto {
    titre: string;
    description?: string;
    categorie: 'pedagogique' | 'administratif' | 'financier' | 'medical' | 'personnel' | 'autre';
    estPublic?: boolean;
    tags?: string[];
}

export interface ModifierDocumentDto extends Partial<CreerDocumentDto> {}

export interface DocumentFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    categorie?: string;
    tags?: string[];
}

export interface StatistiquesDocuments {
    total: number;
    parCategorie: {
        categorie: string;
        nombre: number;
    }[];
    tailleTotale: number;
    totalTelechargements: number;
}
