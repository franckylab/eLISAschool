import type { MembrePersonnel } from '@/features/personnel/types/personnel.types';

export interface Enseignant extends MembrePersonnel {
    typePersonnelId?: string;
    typePersonnel?: { id: string; code: string; nom: string };
    specialite?: string;
    qualification?: string;
}

export interface EnseignantFiltres {
    actif?: boolean;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface AffectationEnseignant {
    id: string;
    matiereId: string;
    classeAnneeId: string;
    enseignantId: string;
    etablissementId: string;
    configurationId?: string;
    coefficient: number;
    statut: string;
    dateDebut: string;
    dateFin: string | null;
    actif: boolean;
    createdAt: string;
    updatedAt: string;
    volumeHoraireHebdo?: number | null;
    effectifActuel?: number;
    matiere?: { id: string; nom: string; code: string; couleur: string };
    classeAnnee?: {
        id: string;
        classe: { id: string; nom: string; niveauId?: string };
        anneeScolaire: { id: string; libelle: string };
        effectifActuel?: number;
    };
    configuration?: {
        id: string;
        coefficient?: number | null;
        volumeHoraireHebdo?: number | null;
    };
}

export interface EdtCreneau {
    id: string;
    enseignantId: string;
    classeId: string;
    matiereId: string;
    periodeId: string;
    salleId?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    statutEffectue: string;
    commentaire?: string;
    remplacantId?: string;
    etablissementId: string;
    createdAt: string;
    matiere?: { id: string; nom: string; code?: string };
    classe?: { id: string; nom: string };
    salle?: { id: string; nom: string };
    remplacant?: { id: string; nom?: string; prenom?: string };
}

export interface EdtEnseignant {
    semaine: string;
    jours: Record<string, EdtCreneau[]>;
}

export interface EvaluationEnseignant {
    id: string;
    enseignantId: string;
    evaluateurId: string;
    note: number;
    commentaire?: string;
    categorie: string;
    dateEvaluation: string;
    evaluateur?: { id: string; nom: string; prenom: string };
}

export interface ContratEnseignant {
    id: string;
    membrePersonnelId: string;
    typeContrat: string;
    dateDebut: string;
    dateFin?: string;
    statut: string;
    salaire?: number;
    poste?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BulletinPaie {
    id: string;
    membrePersonnelId: string;
    mois: number;
    annee: number;
    salaireBase: number;
    primes: number;
    retenues: number;
    netAPayer: number;
    statut: string;
    dateEdition: string;
    createdAt: string;
}

export interface ParcoursComplet {
    membre: any;
    contrats: ContratEnseignant[];
    affectations: any[];
    evaluations: any[];
    absences: any[];
    salaireEvolution: any[];
    anciennete: number;
}

export interface AbsenceEnseignant {
    id: string;
    membrePersonnelId: string;
    dateDebut: string;
    dateFin: string;
    motif: string;
    justifiee: boolean;
    statut: string;
    typeAbsence?: string;
    createdAt: string;
}

export interface AssiduiteStats {
    totalAbsences: number;
    justifiees: number;
    nonJustifiees: number;
    tauxAbsenteisme: number;
    periode: { dateDebut: string; dateFin: string };
}

export interface ProgressionProgramme {
    id: string;
    enseignantId: string;
    matiereId: string;
    classeAnneeId: string;
    chapitre: string;
    pourcentage: number;
    dateMiseAJour: string;
    matiere?: { id: string; nom: string };
    classeAnnee?: {
        id: string;
        classe: { id: string; nom: string };
    };
}
