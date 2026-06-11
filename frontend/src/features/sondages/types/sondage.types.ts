/**
 * ==================================
 * eLISAschool - Types Sondages
 * ==================================
 */

export interface Sondage {
    id: string;
    titre: string;
    description?: string;
    question: string;
    options: SondageOption[];
    type: 'unique' | 'multiple' | 'note' | 'texte';
    categorie: 'satisfaction' | 'evaluation' | 'consultation' | 'feedback' | 'autre';
    dateCreation: string;
    dateDebut?: string;
    dateFin?: string;
    createurId: string;
    etablissementId: string;
    statut?: 'brouillon' | 'actif' | 'termine' | 'archive';
    estAnonyme?: boolean;
    choixMultiple?: boolean;
    totalVotes?: number;
    createdAt: string;
    updatedAt: string;
    createur?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    votes?: Vote[];
}

export interface SondageOption {
    id: string;
    sondageId: string;
    texte: string;
    ordre: number;
    nombreVotes?: number;
}

export interface Vote {
    id: string;
    sondageId: string;
    optionId: string;
    utilisateurId?: string;
    valeur?: string;
    dateVote: string;
    estAnonyme?: boolean;
}

export interface CreerSondageDto {
    titre: string;
    description?: string;
    question: string;
    type: 'unique' | 'multiple' | 'note' | 'texte';
    categorie: 'satisfaction' | 'evaluation' | 'consultation' | 'feedback' | 'autre';
    dateDebut?: string;
    dateFin?: string;
    estAnonyme?: boolean;
    choixMultiple?: boolean;
    options: {
        texte: string;
        ordre: number;
    }[];
}

export interface VoterDto {
    optionIds?: string[];
    valeur?: string;
}

export interface SondageFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    categorie?: string;
    statut?: string;
}

export interface StatistiquesSondage {
    totalVotes: number;
    totalParticipants: number;
    tauxParticipation: number;
    repartition: {
        option: string;
        nombre: number;
        pourcentage: number;
    }[];
}
