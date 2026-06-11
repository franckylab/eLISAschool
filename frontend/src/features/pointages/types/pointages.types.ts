/**
 * ==================================
 * eLISAschool - Types Pointages
 * ==================================
 */

export interface Pointage {
    id: string;
    personnelId: string;
    date: string;
    heureArrivee: string;
    heureDepart?: string;
    heuresTravaillees: number;
    statut: 'present' | 'absent' | 'retard' | 'absence_justifiee';
    remarque?: string;
    etablissementId: string;
    createdAt: string;
    updatedAt: string;
    personnel?: {
        id: string;
        nom: string;
        prenom: string;
        poste?: string;
    };
}

export interface CreerPointageDto {
    personnelId: string;
    date: string;
    heureArrivee: string;
    heureDepart?: string;
    statut: string;
    remarque?: string;
}

export interface StatistiquesPointages {
    totalPointages: number;
    presents: number;
    absents: number;
    retards: number;
    tauxPresence: number;
    moyenneHeures: number;
    evolutionMensuelle: {
        mois: string;
        presents: number;
        absents: number;
        retards: number;
    }[];
}

export interface PointageFiltres {
    personnelId?: string;
    statut?: string;
    dateDebut?: string;
    dateFin?: string;
}
