/**
 * ==================================
 * eLISAschool - Types Annonces
 * ==================================
 */

export interface Annonce {
    id: string;
    titre: string;
    contenu: string;
    categorie: 'information' | 'evenement' | 'urgent' | 'rappel' | 'autre';
    priorite?: 'basse' | 'normale' | 'haute' | 'critique';
    datePublication: string;
    dateExpiration?: string;
    estActive: boolean;
    etablissementId: string;
    createurId: string;
    destinataires?: string[];
    createdAt: string;
    updatedAt: string;
    createur?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    vues?: number;
}

export interface CreerAnnonceDto {
    titre: string;
    contenu: string;
    categorie: 'information' | 'evenement' | 'urgent' | 'rappel' | 'autre';
    priorite?: 'basse' | 'normale' | 'haute' | 'critique';
    datePublication: string;
    dateExpiration?: string;
    destinataires?: string[];
}

export interface ModifierAnnonceDto extends Partial<CreerAnnonceDto> {
    id: string;
}

export interface AnnonceFiltres {
    categorie?: string;
    priorite?: string;
    estActive?: boolean;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface StatistiquesAnnonces {
    total: number;
    actives: number;
    expirees: number;
    parCategorie: Record<string, number>;
}
