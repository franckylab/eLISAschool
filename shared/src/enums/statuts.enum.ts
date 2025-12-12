/**
 * ==================================
 * eLISAschool - Énumérations des statuts
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

/**
 * Statut des requêtes internes
 */
export enum StatutRequete {
    BROUILLON = 'BROUILLON',
    EN_ATTENTE = 'EN_ATTENTE',
    EN_COURS = 'EN_COURS',
    APPROUVE = 'APPROUVE',
    REJETE = 'REJETE',
    ANNULE = 'ANNULE',
}

/**
 * Statut des documents
 */
export enum StatutDocument {
    BROUILLON = 'BROUILLON',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
    VALIDE = 'VALIDE',
    ARCHIVE = 'ARCHIVE',
    SUPPRIME = 'SUPPRIME',
}

/**
 * Type de document
 */
export enum TypeDocument {
    BULLETIN = 'BULLETIN',
    CERTIFICAT = 'CERTIFICAT',
    ATTESTATION = 'ATTESTATION',
    CARTE_SCOLAIRE = 'CARTE_SCOLAIRE',
    CARTE_CANTINE = 'CARTE_CANTINE',
    CARTE_TRANSPORT = 'CARTE_TRANSPORT',
    FORMULAIRE = 'FORMULAIRE',
    CONTRAT = 'CONTRAT',
    FACTURE = 'FACTURE',
    RECU = 'RECU',
    AUTRE = 'AUTRE',
}

/**
 * Type de notification
 */
export enum TypeNotification {
    PUSH = 'PUSH',
    EMAIL = 'EMAIL',
    IN_APP = 'IN_APP',
    SMS = 'SMS',
}

/**
 * Statut de notification
 */
export enum StatutNotification {
    EN_ATTENTE = 'EN_ATTENTE',
    ENVOYEE = 'ENVOYEE',
    LUE = 'LUE',
    ECHEC = 'ECHEC',
}

/**
 * Type de paiement
 */
export enum TypePaiement {
    SCOLARITE = 'SCOLARITE',
    CANTINE = 'CANTINE',
    TRANSPORT = 'TRANSPORT',
    CLUB = 'CLUB',
    AUTRE = 'AUTRE',
}

/**
 * Statut de paiement
 */
export enum StatutPaiement {
    EN_ATTENTE = 'EN_ATTENTE',
    PAYE = 'PAYE',
    PARTIELLEMENT_PAYE = 'PARTIELLEMENT_PAYE',
    ANNULE = 'ANNULE',
    REMBOURSE = 'REMBOURSE',
}

/**
 * Type d'établissement scolaire
 */
export enum TypeEtablissement {
    MATERNELLE = 'MATERNELLE',
    PRIMAIRE = 'PRIMAIRE',
    COLLEGE = 'COLLEGE',
    LYCEE = 'LYCEE',
    MIXTE = 'MIXTE',
}

/**
 * Statut utilisateur
 */
export enum StatutUtilisateur {
    ACTIF = 'ACTIF',
    INACTIF = 'INACTIF',
    SUSPENDU = 'SUSPENDU',
    EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
}

/**
 * Genre
 */
export enum Genre {
    MASCULIN = 'M',
    FEMININ = 'F',
    AUTRE = 'A',
}

export default {
    StatutRequete,
    StatutDocument,
    TypeDocument,
    TypeNotification,
    StatutNotification,
    TypePaiement,
    StatutPaiement,
    TypeEtablissement,
    StatutUtilisateur,
    Genre,
};
