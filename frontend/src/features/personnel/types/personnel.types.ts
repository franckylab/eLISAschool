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
        // Infos personnelles (pass-through pour le backend)
        nom: form.nom || undefined,
        prenom: form.prenom || undefined,
        dateNaissance: form.dateNaissance || undefined,
        sexe: form.sexe || undefined,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
        departement: form.departement || undefined,
    };
}

export interface ModifierPersonnelDto extends Partial<CreerPersonnelDto> {
    id: string;
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
