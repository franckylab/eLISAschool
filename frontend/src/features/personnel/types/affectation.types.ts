export interface AffectationPoste {
    id: string;
    membrePersonnelId: string;
    posteId: string;
    contratId?: string;
    uniteOrganisationnelleId?: string;
    dateDebut: string;
    dateFin?: string;
    statut: 'ACTIF' | 'TERMINE' | 'EN_ATTENTE' | 'SUSPENDU';
    typeMutation: 'NOUVELLE' | 'PROMOTION' | 'TRANSFERT' | 'INTERIM' | 'REINTEGRATION';
    salaireAssocie?: number;
    commentaire?: string;
    valideParId?: string;
    dateValidation?: string;
    membrePersonnel?: {
        id: string;
        matricule: string;
        utilisateur?: {
            id: string;
            email: string;
            profil?: { prenom: string; nom: string };
        };
    };
    contrat?: { id: string; typeContrat: string; };
    poste?: {
        id: string;
        intitule: string;
        code: string;
        statut: string;
        nombrePostes: number;
        occupantsCount: number;
        uniteOrganisationnelle?: {
            id: string;
            nom: string;
        };
    };
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreerAffectationDto {
    membrePersonnelId: string;
    posteId: string;
    contratId?: string;
    uniteOrganisationnelleId?: string;
    dateDebut?: string;
    dateFin?: string;
    typeMutation?: 'NOUVELLE' | 'PROMOTION' | 'TRANSFERT' | 'INTERIM' | 'REINTEGRATION';
    salaireAssocie?: number;
    commentaire?: string;
}
