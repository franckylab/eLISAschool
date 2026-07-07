/**
 * ==================================
 * eLISAschool - Types Évaluations
 * ==================================
 */

export interface Evaluation {
    id: string;
    personnelId: string;
    evalueParId: string;
    dateEvaluation: string;
    periode: string; // ex: "2024-T1" (legacy)
    periodeId?: string; // FK vers periodes (nouveau)
    noteGlobale: number; // sur 20
    criteres: EvaluationCritere[];
    pointsForts?: string;
    axesAmelioration?: string;
    recommendations?: string;
    statut: 'brouillon' | 'finalisee' | 'partagee';
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    personnel?: {
        id: string;
        nom: string;
        prenom: string;
        poste?: string;
    };
    evaluePar?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
    periodeObj?: {
        id: string;
        nom: string;
        dateDebut: string;
        dateFin: string;
    };
    page?: number;
    limit?: number;
}

export interface EvaluationCritere {
    id: string;
    nom: string;
    note: number; // sur 20
    commentaire?: string;
    poids: number; // coefficient
    page?: number;
    limit?: number;
}

export interface CreerEvaluationDto {
    personnelId: string;
    dateEvaluation: string;
    periode?: string;
    periodeId?: string;
    criteres: Array<{ nom: string; note: number; commentaire?: string; poids: number }>;
    pointsForts?: string;
    axesAmelioration?: string;
    recommendations?: string;
    page?: number;
    limit?: number;
}

export interface StatistiquesEvaluations {
    totalEvaluations: number;
    moyenneGenerale: number;
    parPeriode: { periode: string; periodeId?: string; nombre: number; moyenne: number; }[];
    distribution: {
        excellent: number; // >= 16
        bon: number; // 12-15
        moyen: number; // 8-11
        insuffisant: number; // < 8
    };
    evolutionMensuelle: {
        mois: string;
        nombre: number;
        moyenne: number;
    }[];
    page?: number;
    limit?: number;
}

export interface EvaluationFiltres {
    personnelId?: string;
    periode?: string;
    statut?: string;
    page?: number;
    limit?: number;
}
