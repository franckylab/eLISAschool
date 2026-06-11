/**
 * ==================================
 * eLISAschool - Types Événements
 * ==================================
 */

export interface Evenement {
    id: string;
    titre: string;
    description?: string;
    type: 'reunion' | 'formation' | 'activite' | 'ceremonie' | 'examen' | 'vacances' | 'autre';
    dateDebut: string;
    dateFin?: string;
    lieu?: string;
    organisateurId?: string;
    etablissementId: string;
    statut?: 'programme' | 'en_cours' | 'termine' | 'annule';
    nombreParticipants?: number;
    estPublic?: boolean;
    createdAt: string;
    updatedAt: string;
    organisateur?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    participants?: ParticipantEvenement[];
}

export interface ParticipantEvenement {
    id: string;
    evenementId: string;
    utilisateurId: string;
    statut?: 'inscrit' | 'present' | 'absent' | 'annule';
    dateInscription: string;
    utilisateur?: {
        id: string;
        nom: string;
        prenom: string;
        email: string;
    };
}

export interface CreerEvenementDto {
    titre: string;
    description?: string;
    type: 'reunion' | 'formation' | 'activite' | 'ceremonie' | 'examen' | 'vacances' | 'autre';
    dateDebut: string;
    dateFin?: string;
    lieu?: string;
    estPublic?: boolean;
    participantIds?: string[];
}

export interface ModifierEvenementDto extends Partial<CreerEvenementDto> {}

export interface EvenementFiltres {
    page?: number;
    limit?: number;
    recherche?: string;
    type?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}

export interface StatistiquesEvenements {
    total: number;
    programmes: number;
    enCours: number;
    termines: number;
    totalParticipants: number;
}
