/**
 * ==================================
 * eLISAschool - Types Personnel
 * ==================================
 * Version: 2.1.0
 * Auteur: franck arlos chendjou
 *
 * NOTE — Single Source of Truth :
 * - MembrePersonnel porte UNIQUEMENT les champs professionnels
 * - Les données personnelles (nom, prenom, telephone, adresse, dateNaissance, genre)
 *   sont sur Utilisateur.profil OU aplaties sur Utilisateur
 * - Les champs specialite, qualification, poste, dateEntree, dateSortie,
 *   etablissementOrigine, typeContrat ont été SUPPRIMÉS (legacy)
 *   → utiliser specialitePrincipale, diplomes, posteExact, dateEmbauche
 */

import type { CategorieFonction, CategorieSource } from '@/lib/categorie-fonction';
import type { PostePartial } from '@/features/contrats/types/contrat.types';

export type { PostePartial };

export interface MembrePersonnel {
    id: string;
    utilisateurId?: string;
    utilisateur?: {
        id: string;
        email: string;
        matricule: string;
        role: string;
        statut: string;
        profil?: {
            id: string;
            nom: string;
            prenom: string;
            genre?: string;
            dateNaissance?: string;
            telephone?: string;
            adresse?: string;
            photo?: string;
        };
    };
    /** Catégorie dérivée (fonction principale → affectation poste), jamais stockée */
    categorie?: CategorieFonction | null;
    estEnseignant?: boolean;
    categorieSource?: CategorieSource;
    matricule: string;
    dateEmbauche: string;
    statut: string;
    specialites?: string[];
    diplomes?: string;
    posteExact?: string;
    service?: string;
    specialitePrincipale?: string;
    anneesExperience?: number;
    educationNiveau?: string;
    departement?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerPersonnelDto {
    utilisateurId?: string;
    matricule: string;
    dateEmbauche: string;
    statut?: 'ACTIF' | 'INACTIF' | 'CONGE';
    specialites?: string[];
    diplomes?: string;
}

export interface PersonnelFormData {
    matricule?: string;
    dateEmbauche?: string;
    statut?: string;
    specialitePrincipale?: string;
    specialites?: string[];
    diplomes?: string;
    departement?: string;
}

export function fromFormToCreateDto(form: PersonnelFormData): CreerPersonnelDto {
    return {
        matricule: form.matricule || `EMP-${Date.now().toString(36).toUpperCase()}`,
        dateEmbauche: form.dateEmbauche || new Date().toISOString().split('T')[0],
        statut: ((form.statut || 'actif') === 'en_conge' ? 'CONGE' : (form.statut || 'actif').toUpperCase()) as 'ACTIF' | 'INACTIF' | 'CONGE',
        specialites: form.specialitePrincipale ? [form.specialitePrincipale] : form.specialites || undefined,
        diplomes: form.diplomes || undefined,
    };
}

export interface ModifierPersonnelDto extends Partial<CreerPersonnelDto> {
    id: string;
}

export interface ModeRemunerationInfo {
    id: string;
    code: string;
    label: string;
}

export interface ContratPersonnel {
    id: string;
    membrePersonnelId: string;
    typeContrat: string;
    typeContratId?: string | null;
    fonctionId?: string | null;
    fonction?: { id: string; nom: string; code?: string } | null;
    posteId?: string | null;
    poste?: PostePartial | null;
    dateDebut: string;
    dateFin?: string | null;
    salaireBase: number;
    tarifHoraire?: number | null;
    modeRemunerationId?: string | null;
    modeRemuneration?: ModeRemunerationInfo | null;
    heuresContractuellesMois?: number | null;
    tarifHebdomadaire?: number | null;
    statut: string;
    renouvellementAuto?: boolean;
    clauses?: string | null;
    membrePersonnel?: {
        id: string;
        matricule: string;
        utilisateur?: {
            id: string;
            email: string;
            profil?: { nom: string; prenom: string };
        };
    };
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BulletinPaie {
    id: string;
    membrePersonnelId: string;
    contratId: string;
    mois: number;
    annee: number;
    salaireBase: number;
    heuresEffectuees: number;
    montantHeuresSup: number;
    primes: number;
    deductions: number;
    salaireNet: number;
    statut: string;
    datePaiement?: string;
    membrePersonnel?: MembrePersonnel | null;
    createdAt: string;
}

export interface ElementSalaire {
    id: string;
    bulletinPaieId: string;
    type: 'GAIN' | 'RETENUE';
    categorie: 'SALAIRE_BASE' | 'PRIME' | 'INDEMNITE' | 'COTISATION' | 'HEURE_SUP' | 'HEURE_COURS' | 'RETENUE' | 'AUTRE';
    libelle: string;
    montant: number;
    baseCalcul?: number | null;
    taux?: number | null;
    ordreAffichage: number;
    createdAt: string;
}

export interface Cotisation {
    id: string;
    code: string;
    nom: string;
    type: 'PATRONALE' | 'SALARIALE' | 'MIXTE';
    tauxPatronal: number;
    tauxSalarial: number;
    plafond?: number;
    description?: string;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TypePrime {
    id: string;
    code: string;
    nom: string;
    typeCalcul: 'FIXE' | 'POURCENTAGE' | 'VARIABLE';
    valeur: number;
    description?: string;
    actif: boolean;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TypeRetenue {
    id: string;
    code: string;
    nom: string;
    frequence: 'PONCTUELLE' | 'RECURRENTE';
    montantMax?: number;
    description?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TypeContratPersonnalise {
    id: string;
    code: string;
    nom: string;
    description?: string;
    categorie: string;
    modeRemunerationId?: string | null;
    modeRemuneration?: ModeRemunerationInfo | null;
    actif: boolean;
    estSysteme: boolean;
    ordre: number;
    renouvellementAutoDefaut: boolean;
    dureeMaxMois?: number;
    etablissementId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DetailMatiereSimulation {
    matiereNom: string;
    heures: number;
    tarifHoraire: number;
    montant: number;
}

export interface SimulationResult {
    salaireBase: number;
    heuresEffectuees: number;
    heuresSup: number;
    montantHeuresSup: number;
    detailParMatiere: DetailMatiereSimulation[];
    primes: number;
    cotisationsPatronales: number;
    cotisationsSalariales: number;
    totalRetenues: number;
    salaireNet: number;
    coutTotalEmployeur: number;
    elements: ElementSalaire[];
}

export interface RapportPaieMensuel {
    nombreBulletins: number;
    totalSalairesBase: number;
    totalHeuresSup: number;
    totalPrimes: number;
    totalDeductions: number;
    totalSalairesNets: number;
}

export interface PersonnelFiltres {
    poste?: string;
    departement?: string;
    typeContrat?: 'cdi' | 'cdd' | 'vacataire' | 'stage';
    statut?: 'actif' | 'inactif' | 'en_conge' | 'demission';
    categorie?: CategorieFonction;
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

export interface AbsenceEnseignant {
    id: string;
    membrePersonnelId: string;
    date: string;
    type: string;
    statutJustification: string;
    motif?: string | null;
    justification?: string | null;
    heureDebut?: string | null;
    heureFin?: string | null;
    createdAt: string;
}

export interface AssiduiteStats {
    totalAbsences: number;
    justifiees: number;
    nonJustifiees: number;
    tauxAbsenteisme: number;
    periode: { dateDebut: string; dateFin: string };
}

export interface AffectationPayload {
    matiereId: string;
    classeAnneeId: string;
    enseignantId: string;
    coefficient?: number;
    dateDebut?: string;
    dateFin?: string;
    actif?: boolean;
}

export interface ParcoursComplet {
    membre: MembrePersonnel;
    contrats: ContratPersonnel[];
    affectations: AffectationEnseignant[];
    evaluations: EvaluationEnseignant[];
    statistiquesAbsences: AssiduiteStats;
    evolutionSalariale: BulletinPaie[];
    anciennete: { annees: number; mois: number; jours: number };
    score: number;
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
