/**
 * ==================================
 * eLISAschool - Types Personnel
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * NOTE: Le backend stocke les infos personnelles (nom, prenom, email) sur
 * Utilisateur + ProfilUtilisateur. Les champs legacy ci-dessous (nom, prenom,
 * email, poste, ...) sont conservés pour compatibilité d'affichage côté
 * frontend ; ils sont undefinied tant que l'affichage n'est pas migré vers
 * les relations utilisateur.profil.
 */

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
    typePersonnelId?: string;
    typePersonnel?: { id: string; code: string; nom: string };
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
    etablissementOrigine?: string;
    // Champs legacy pour compatibilité d'affichage
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    sexe?: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    poste?: string;
    departement?: string;
    typeContrat?: string;
    dateEntree?: string;
    dateSortie?: string;
    specialite?: string;
    qualification?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerPersonnelDto {
    utilisateurId?: string;
    typePersonnelId?: string;
    matricule: string;
    dateEmbauche: string;
    statut?: 'ACTIF' | 'INACTIF' | 'CONGE';
    specialites?: string[];
    diplomes?: string;
}

export function fromFormToCreateDto(form: Record<string, any>): CreerPersonnelDto & Record<string, any> {
    return {
        matricule: form.matricule || `EMP-${Date.now().toString(36).toUpperCase()}`,
        dateEmbauche: form.dateEntree || form.dateEmbauche || new Date().toISOString().split('T')[0],
        statut: ((form.statut || 'actif') === 'en_conge' ? 'CONGE' : (form.statut || 'actif').toUpperCase()) as 'ACTIF' | 'INACTIF' | 'CONGE',
        specialites: form.specialite ? [form.specialite] : form.specialites || undefined,
        diplomes: form.diplomes || form.qualification || undefined,
        typePersonnelId: form.typePersonnelId || undefined,
        nom: form.nom || undefined,
        prenom: form.prenom || undefined,
        dateNaissance: form.dateNaissance || undefined,
        sexe: form.sexe || undefined,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
    };
}

export interface ModifierPersonnelDto extends Partial<CreerPersonnelDto> {
    id: string;
}

export type ModeRemuneration = 'MENSUEL' | 'HORAIRE' | 'MIXTE' | 'HEBDOMADAIRE';

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
    modeRemuneration?: ModeRemuneration | null;
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

export interface PostePartial {
    id: string;
    intitulé: string;
    code: string;
    uniteOrganisationnelle?: { id: string; nom: string };
    fonction?: { id: string; nom: string };
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
    modeRemuneration: ModeRemuneration;
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
    typePersonnelId?: string;
    actif?: boolean;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
