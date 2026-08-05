/**
 * ==================================
 * eLISAschool - Types Emploi du Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

// ─── Enums ────────────────────────────────────────────

export type JourSemaine = 'LUNDI' | 'MARDI' | 'MERCREDI' | 'JEUDI' | 'VENDREDI' | 'SAMEDI';
export type TypeCreneau = 'COURS' | 'TD' | 'TP' | 'RECREATION' | 'ETUDE' | 'PERMANENCE' | 'AUTRE';
export type StatutCreneau = 'PLANIFIE' | 'VALIDE';

// ─── Interfaces ───────────────────────────────────────

export interface CreneauHoraire {
    id: string;
    affectationMatiereId: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    typeCreneau: TypeCreneau;
    statut: StatutCreneau;
    salleId?: string;
    periodeId: string;
    anneeScolaireId: string;
    etablissementId: string;
    couleur?: string;
    notes?: string;
    genereAutomatiquement: boolean;
    createdAt: string;
    updatedAt: string;
    dureeMinutes?: number;
    dureeHeures?: number;
    plageHoraire?: string;
    classeAnneeId?: string;
    matiereId?: string;
    enseignantId?: string;
    affectationMatiere?: {
        id: string;
        matiereId: string;
        classeAnneeId: string;
        enseignantId: string;
        coefficient: number | null;
        obligatoire: boolean;
        statutValidation: string;
        matiere?: { id: string; nom: string; code?: string; couleur?: string };
        enseignant?: {
            id: string;
            matricule?: string;
            utilisateur?: {
                id: string;
                profil?: { id: string; nom: string; prenom: string };
            };
        };
        classeAnnee?: {
            id: string;
            classe: { id: string; nom: string; niveau?: string };
            anneeScolaire: { id: string; nom?: string; anneeDebut?: number };
        };
    };
    salle?: { id: string; nom: string; code?: string };
}

export interface PaginatedResponse<T> {
    items: T[];
    meta: {
        currentPage: number;
        itemsPerPage: number;
        totalItems: number;
        totalPages: number;
        itemCount: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface CreneauFilters {
    classeAnneeId?: string;
    enseignantId?: string;
    salleId?: string;
    affectationMatiereId?: string;
    jour?: JourSemaine;
    typeCreneau?: TypeCreneau;
    statut?: StatutCreneau;
    anneeScolaireId?: string;
    periodeId?: string;
    genereAutomatiquement?: boolean;
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
}

export interface PreferenceEDT {
    id: string;
    etablissementId: string;
    heureDebutCours: string;
    heureFinCours: string;
    dureeCreneauStandard: number;
    dureeRecreation: number;
    joursOuvrables: string[];
    maxCreneauxParJour: number;
    maxCreneauxMatiereParJour: number;
    maxCreneauxConsecutifs: number;
    pauseDebut?: string | null;
    pauseFin?: string | null;
    pauseMatineeDebut?: string | null;
    pauseMatineeFin?: string | null;
    pauseApresMidiDebut?: string | null;
    pauseApresMidiFin?: string | null;
    creneauxImposables?: CreneauImposable[];
    repartitionEquilibree: boolean;
    /** Q7 — Matérialisation automatique des instances HeureCours (cron) */
    materialisationAuto?: {
        actif: boolean;
        horaires: { jour: string; heure: string }[];
    };
    createdAt?: string;
    updatedAt?: string;
}

export interface CreneauImposable {
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    motif?: string;
}

// ─── Conflits ───────────────────────────────────────

export type TypeConflit = 'CONFLIT_CLASSE' | 'CONFLIT_ENSEIGNANT' | 'CONFLIT_SALLE' | 'DEPASSEMENT_VOLUME_HORAIRE' | 'CRENEAU_IMPOSABLE';
export type SeveriteConflit = 'BLOQUANT' | 'AVERTISSEMENT';

export interface Conflit {
    type: TypeConflit;
    severite: SeveriteConflit;
    message: string;
    details: Record<string, unknown>;
}

export interface DonneesVerification {
    affectationMatiereId?: string;
    jour: JourSemaine;
    heureDebut: string;
    heureFin: string;
    salleId?: string;
    excludeCreneauId?: string;
}

// ─── Templates ──────────────────────────────────────

export interface TemplateEDTConfiguration {
    joursTravailles?: string[];
    heureDebutCours?: string;
    heureFinCours?: string;
}

export interface TemplateEDT {
    id: string;
    nom: string;
    description?: string;
    etablissementId: string;
    configuration: TemplateEDTConfiguration | null;
    creneauxTypes: string[];
    actif: boolean;
    estPartage: boolean;
    createdAt: string;
}

// ─── Statistiques ───────────────────────────────────

export interface StatistiquesEDT {
    totalCreneaux: number;
    totalHeures: number;
    totalMatieres: number;
    totalClasses: number;
    totalEnseignants: number;
    totalSallesOccupees: number;
    repartitionParJour: Array<{
        jour: string;
        nombreCreneaux: number;
        totalHeures: number;
    }>;
    repartitionParMatiere: Array<{
        matiereId: string;
        matiereNom: string;
        couleur: string | null;
        nombreCreneaux: number;
        totalHeures: number;
        volumeRequis: number | null;
    }>;
    tauxOccupationSalle: number;
    conflitsPotentiels: number;
}

export interface StatistiquesFilters {
    classeAnneeId?: string;
    enseignantId?: string;
    periodeId?: string;
}

// ─── Preview Génération ───────────────────────────

export interface CreneauPreview {
    affectationMatiereId: string;
    matiereNom: string;
    matiereCouleur: string | null;
    enseignantNom: string;
    jour: string;
    heureDebut: string;
    heureFin: string;
    salleId: string | null;
    salleNom: string | null;
    volumeMinutes: number;
    numeroSeance: number;
    totalSeances: number;
}

export interface ConflitPreview {
    type: string;
    matiereNom: string;
    seance: string;
    message: string;
}

export interface ResumePreview {
    totalCreneaux: number;
    totalHeures: number;
    totalConflits: number;
    matieres: number;
    joursOccupes: string[];
}

export interface ResultatPreviewEDT {
    creneaux: CreneauPreview[];
    conflits: ConflitPreview[];
    resume: ResumePreview;
}

// ─── Audit Conflits ─────────────────────────────────

export interface AuditConflitDetail {
    type: TypeConflit;
    severite: SeveriteConflit;
    message: string;
    creneauxIds: string[];
    details: Record<string, unknown>;
}

export interface AuditConflitsResult {
    totalConflits: number;
    conflitsBloquants: number;
    avertissements: number;
    conflits: AuditConflitDetail[];
}

// ─── Propagation créneau → instances (grill-me 2026-08-03) ───

export type TypeConflitInstance = 'ENSEIGNANT' | 'CLASSE' | 'SALLE';

export interface ConflitPropagation {
    date: string;
    type: TypeConflitInstance;
    message: string;
}

export interface RapportPropagation {
    instancesQuiSuivent: number;
    instancesInchangees: number;
    conflits: ConflitPropagation[];
}

export interface ResultatUpdateCreneau {
    success: boolean;
    data: CreneauHoraire;
    rapport?: RapportPropagation;
}

export interface ChangementsCreneau {
    jour?: JourSemaine;
    heureDebut?: string;
    heureFin?: string;
    salleId?: string | null;
    typeCreneau?: TypeCreneau;
    couleur?: string | null;
    notes?: string;
    propagerForce?: boolean;
}
