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
    periode: string; // ex: "2024-T1"
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
}

export interface EvaluationCritere {
    id: string;
    nom: string;
    note: number; // sur 20
    commentaire?: string;
    poids: number; // coefficient
}

export interface CreerEvaluationDto {
    personnelId: string;
    dateEvaluation: string;
    periode: string;
    criteres: Array<{ nom: string; note: number; commentaire?: string; poids: number }>;
    pointsForts?: string;
    axesAmelioration?: string;
    recommendations?: string;
}

export interface StatistiquesEvaluations {
    totalEvaluations: number;
    moyenneGenerale: number;
    parPeriode: { periode: string; nombre: number; moyenne: number; }[];
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
}

export interface EvaluationFiltres {
    personnelId?: string;
    periode?: string;
    statut?: string;
}
