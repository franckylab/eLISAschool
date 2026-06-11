/**
 * ==================================
 * eLISAschool - Types Messagerie
 * ==================================
 */

export interface Message {
    id: string;
    expediteurId: string;
    destinataireId: string;
    sujet: string;
    contenu: string;
    estLu: boolean;
    dateLecture?: string;
    parentMessageId?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    expediteur?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    destinataire?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    reponses?: Message[];
}

export interface Conversation {
    id: string;
    dernierMessage: string;
    dateDernierMessage: string;
    nonLus: number;
    participants: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    }[];
}

export interface CreerMessageDto {
    destinataireId: string;
    sujet: string;
    contenu: string;
    parentMessageId?: string;
}

export interface MessageFiltres {
    destinataireId?: string;
    expediteurId?: string;
    estLu?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface StatistiquesMessagerie {
    totalMessages: number;
    messagesNonLus: number;
    messagesEnvoyes: number;
    messagesRecus: number;
}
