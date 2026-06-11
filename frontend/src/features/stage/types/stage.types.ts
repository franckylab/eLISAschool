/**
 * ==================================
 * eLISAschool - Types Stage
 * ==================================
 */

export interface Stage {
    id: string;
    titre: string;
    description: string;
    entrepriseId: string;
    eleveId: string;
    tuteurExterneId?: string;
    tuteurInterneId?: string;
    dateDebut: string;
    dateFin: string;
    lieu: string;
    sujet: string;
    objectifs: string[];
    statut: 'en_recherche' | 'valide' | 'en_cours' | 'termine' | 'evalue';
    conventionUrl?: string;
    rapportUrl?: string;
    evaluation?: {
        note: number;
        appreciation: string;
        date: string;
    };
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    entreprise?: {
        id: string;
        nom: string;
        secteur?: string;
        adresse?: string;
    };
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        classe?: string;
    };
    tuteurExterne?: {
        id: string;
        nom: string;
        prenom: string;
        fonction?: string;
    };
    tuteurInterne?: {
        id: string;
        nom: string;
        prenom: string;
        role?: string;
    };
}

export interface Entreprise {
    id: string;
    nom: string;
    secteur?: string;
    adresse?: string;
    ville?: string;
    telephone?: string;
    email?: string;
    siteWeb?: string;
    contactNom?: string;
    contactTelephone?: string;
    contactEmail?: string;
    nbStagesAccueillis: number;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerStageDto {
    titre: string;
    description: string;
    entrepriseId: string;
    eleveId: string;
    dateDebut: string;
    dateFin: string;
    lieu: string;
    sujet: string;
    objectifs: string[];
}

export interface StatistiquesStages {
    totalStages: number;
    parStatut: { statut: string; nombre: number; }[];
    stagesEnCours: number;
    stagesTermines: number;
    tauxInsertion: number; // pourcentage
    entreprisesPartenaires: number;
    evolutionMensuelle: {
        mois: string;
        stages: number;
    }[];
}

export interface FiltresStage {
    statut?: string;
    eleveId?: string;
    entrepriseId?: string;
    dateDebut?: string;
    dateFin?: string;
}
