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

export interface DetailMatiereSimulation {
    matiereNom: string;
    heures: number;
    tarifHoraire: number;
    montant: number;
}

export interface RapportPaieMensuel {
    nombreBulletins: number;
    totalSalairesBase: number;
    totalHeuresSup: number;
    totalPrimes: number;
    totalDeductions: number;
    totalSalairesNets: number;
}

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
    categorie?: string;
    matricule: string;
    dateEmbauche: string;
    statut: string;
    specialites?: string[];
    diplomes?: string;
    posteExact?: string;
    service?: string;
    specialitePrincipale?: string;
    departement?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BulletinFiltres {
    membrePersonnelId?: string;
    mois?: number;
    annee?: number;
    statut?: string;
    page?: number;
    limit?: number;
}

export interface CotisationFiltres {
    actif?: boolean;
    type?: string;
    page?: number;
    limit?: number;
}

export interface PrimeFiltres {
    actif?: boolean;
    page?: number;
    limit?: number;
}

export interface RetenueFiltres {
    page?: number;
    limit?: number;
}
