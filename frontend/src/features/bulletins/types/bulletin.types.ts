/**
 * ==================================
 * eLISAschool - Types Bulletin
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * Types alignés sur le backend (module bulletins v2) :
 * - POST /api/bulletins/generate { classeAnneeId, periodeId, eleveId? }
 * - PATCH /api/bulletins/:id { appreciationConseil?, sanctions?, encouragements?, publie? }
 * - GET /api/bulletins/:id/export → document HTML A4 imprimable
 */

export interface Bulletin {
    id: string;
    eleveId: string;
    classeAnneeId: string;
    anneeScolaireId: string;
    periodeId: string;
    etablissementId: string;
    moyenneGenerale: number;
    moyenneClasse?: number | null;
    moyenneMin?: number | null;
    moyenneMax?: number | null;
    rang?: number | null;
    appreciationConseil?: string;
    sanctions?: string[];
    encouragements?: string[];
    publie: boolean;
    createdAt: string;
    updatedAt: string;
    eleve?: {
        id: string;
        nom: string;
        prenom: string;
        matricule: string;
    };
    classeAnnee?: {
        id: string;
        classe?: { id: string; nom: string; code?: string };
        anneeScolaire?: { id: string; nom?: string; libelle?: string; anneeDebut?: number };
    };
    periode?: {
        id: string;
        nom: string;
    };
    bulletinMatieres?: BulletinMatiere[];
}

export interface BulletinMatiere {
    id: string;
    bulletinId: string;
    matiereId: string;
    moyenne: number;
    coefficient: number;
    rangMatiere?: number | null;
    moyenneClasse?: number | null;
    moyenneMinClasse?: number | null;
    moyenneMaxClasse?: number | null;
    appreciation?: string;
    nombreNotes: number;
    matiere?: {
        id: string;
        nom: string;
        code?: string;
    };
}

/**
 * DTO de génération — POST /api/bulletins/generate.
 * Si eleveId est omis, génération pour toute la classe.
 */
export interface GenererBulletinsDto {
    classeAnneeId: string;
    periodeId: string;
    eleveId?: string;
}

/**
 * DTO de modification — PATCH /api/bulletins/:id.
 * publie: true exige la permission bulletins:publier côté backend.
 */
export interface ModifierBulletinDto {
    id: string;
    appreciationConseil?: string;
    sanctions?: string[];
    encouragements?: string[];
    publie?: boolean;
}

export interface BulletinFiltres {
    eleveId?: string;
    classeAnneeId?: string;
    periodeId?: string;
    publie?: string;
    recherche?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
