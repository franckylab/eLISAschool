/**
 * ==================================
 * eLISAschool - Seed Templates d'Organisation (v5.1)
 * ==================================
 * Version: 5.1.0
 * Auteur: franck arlos chendjou
 *
 * 25 templates catégorisés avec métadonnées (nature, système, langue, niveaux, complexité).
 * Chaque template utilise des fonctionRef existants dans seed-organisation.ts.
 */

import { AppDataSource } from '../../data-source';
import { TemplateOrganisation } from '@modules/organisation/entities';
import {
    NatureJuridique, SystemeEducatif, LangueEnseignement,
    NiveauEnseignement, ComplexiteStructurelle,
    NoeudTemplateOrganisation,
} from '@modules/organisation/entities/template-organisation.entity';
import { Fonction } from '@modules/organisation/entities/fonction.entity';
import { logger } from '@common/utils/logger.util';

// ─── Interface de définition de template ───
interface TemplateDef {
    nom: string;
    nomEn: string;
    description: string;
    nature: NatureJuridique;
    systeme: SystemeEducatif;
    langue: LangueEnseignement;
    niveaux: NiveauEnseignement[];
    complexite: ComplexiteStructurelle;
    categorie: string;
    ordre: number;
    icone: string;
    structure: NoeudTemplateOrganisation;
}

// ─── Helpers de postes réutilisables ───
const P = {
    DIR: { ref: 'DIR', intitule: 'Directeur', niveauResponsabilite: 'DIRECTION_GENERALE', fonctionRef: 'DIR-ETAB', nombrePostes: 1 },
    PROV: { ref: 'PROV', intitule: 'Proviseur', niveauResponsabilite: 'DIRECTION_GENERALE', fonctionRef: 'PROVISEUR', nombrePostes: 1 },
    CENSEUR: { ref: 'CENSEUR', intitule: 'Censeur', niveauResponsabilite: 'DIRECTION_ADJOINTE', fonctionRef: 'CENSEUR', nombrePostes: 1 },
    SURV: { ref: 'SURV', intitule: 'Surveillant Général', niveauResponsabilite: 'SUPERVISEUR', fonctionRef: 'SURV-GEN', nombrePostes: 1 },
    ADMIN: { ref: 'ADMIN', intitule: 'Agent Administratif', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'AGENT-COMPTA', nombrePostes: 1 },
    RESP_ADMIN: { ref: 'RESP_ADMIN', intitule: 'Chef Service Administratif', niveauResponsabilite: 'RESPONSABLE', fonctionRef: 'CHEF-ADM', nombrePostes: 1 },
    SECRET: { ref: 'SECRET', intitule: 'Secrétaire', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'AGENT-COMPTA', nombrePostes: 2 },
    COMPTA: { ref: 'COMPTA', intitule: 'Comptable', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'COMPTABLE', nombrePostes: 1 },
    INTEND: { ref: 'INTEND', intitule: 'Intendant', niveauResponsabilite: 'RESPONSABLE', fonctionRef: 'INTENDANT', nombrePostes: 1 },
    CHEF_DEPT: { ref: 'CHEF_DEPT', intitule: 'Chef de Département', niveauResponsabilite: 'COORDINATEUR', fonctionRef: 'CDEPT', nombrePostes: 1 },
    PROF: { ref: 'PROF', intitule: 'Professeur', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'PROF-TIT', nombrePostes: 10 },
    CHEF_ATEL: { ref: 'CHEF_ATEL', intitule: 'Chef d\'Atelier', niveauResponsabilite: 'RESPONSABLE', fonctionRef: 'RESP-TECH', nombrePostes: 1 },
    FORMATEUR: { ref: 'FORMATEUR', intitule: 'Formateur Technique', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'PROF-TIT', nombrePostes: 5 },
    DOC: { ref: 'DOC', intitule: 'Documentaliste', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'DOCUMENTALISTE', nombrePostes: 1 },
    ORIENT: { ref: 'ORIENT', intitule: 'Conseiller d\'Orientation', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'ORIENTEUR', nombrePostes: 1 },
    INFIRM: { ref: 'INFIRM', intitule: 'Infirmier Scolaire', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'INFIRMIER', nombrePostes: 1 },
    ANIM: { ref: 'ANIM', intitule: 'Animateur Pédagogique', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'ANIMATEUR', nombrePostes: 1 },
    // v5.1 — Fonctions anglophones
    HEAD: { ref: 'HEAD', intitule: 'Head Teacher', niveauResponsabilite: 'DIRECTION_GENERALE', fonctionRef: 'HEAD-TEACHER', nombrePostes: 1 },
    DEPUTY: { ref: 'DEPUTY', intitule: 'Deputy Head Teacher', niveauResponsabilite: 'DIRECTION_ADJOINTE', fonctionRef: 'DEPUTY-HEAD', nombrePostes: 1 },
    HEAD_YEAR: { ref: 'HEAD_YEAR', intitule: 'Head of Year', niveauResponsabilite: 'COORDINATEUR', fonctionRef: 'HEAD-OF-YEAR', nombrePostes: 1 },
    TUTOR: { ref: 'TUTOR', intitule: 'Form Tutor', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'FORM-TUTOR', nombrePostes: 4 },
    BIZ: { ref: 'BIZ', intitule: 'Business Manager', niveauResponsabilite: 'RESPONSABLE', fonctionRef: 'BUSINESS-MGR', nombrePostes: 1 },
    EXAMS: { ref: 'EXAMS', intitule: 'Exams Officer', niveauResponsabilite: 'EXECUTANT', fonctionRef: 'EXAMS-OFF', nombrePostes: 1 },
    // v5.1 — Fonctions bilingues
    COORD_LING: { ref: 'COORD_LING', intitule: 'Coordinateur Linguistique', niveauResponsabilite: 'COORDINATEUR', fonctionRef: 'COORD-LING', nombrePostes: 1 },
    DIR_FR: { ref: 'DIR_FR', intitule: 'Directeur Section FR', niveauResponsabilite: 'DIRECTION_ADJOINTE', fonctionRef: 'DIR-SECTION-FR', nombrePostes: 1 },
    DIR_EN: { ref: 'DIR_EN', intitule: 'Director English Section', niveauResponsabilite: 'DIRECTION_ADJOINTE', fonctionRef: 'DIR-SECTION-EN', nombrePostes: 1 },
};

// ─── 25 TEMPLATES SYSTÈME ───
const TEMPLATES: TemplateDef[] = [

    // ═══ T01 — LYCÉE D'ENSEIGNEMENT GÉNÉRAL PUBLIC (Standard) ═══
    {
        nom: 'Lycée d\'Enseignement Général Public',
        nomEn: 'Public General High School',
        description: 'Structure standard d\'un lycée d\'enseignement général public camerounais',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'lycee-general',
        ordre: 1,
        icone: 'School',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction du Lycée', count: 1,
            postes: [P.PROV, P.SECRET, P.COMPTA, P.DOC, P.INFIRM],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, P.SURV, { ...P.SURV, intitule: 'Surveillant', ref: 'SURV_ADJ', nombrePostes: 3 }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements disciplinaires', count: 6,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 8 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Intendance', count: 1,
                    postes: [P.INTEND, P.COMPTA, { ...P.ADMIN, intitule: 'Agent de gestion', ref: 'AGENT_GEST', nombrePostes: 2 }],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T02 — LYCÉE D'ENSEIGNEMENT GÉNÉRAL PRIVÉ ═══
    {
        nom: 'Lycée d\'Enseignement Général Privé',
        nomEn: 'Private General High School',
        description: 'Lycée privé d\'enseignement général avec direction renforcée',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'lycee-general',
        ordre: 2,
        icone: 'School',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur Général', ref: 'DG' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Direction Pédagogique', count: 1,
                    postes: [P.CENSEUR, P.SURV, { ...P.DOC, nombrePostes: 1 }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements', count: 5,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Administration', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA, { ...P.ADMIN, nombrePostes: 2 }],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T03 — LYCÉE TECHNIQUE PUBLIC ═══
    {
        nom: 'Lycée Technique Public',
        nomEn: 'Public Technical High School',
        description: 'Lycée technique avec ateliers et chef des travaux',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.TECHNIQUE,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'lycee-technique',
        ordre: 3,
        icone: 'Wrench',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [P.PROV, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Censorat + Chef des Travaux', count: 1,
                    postes: [P.CENSEUR, P.SURV, { ...P.CENSEUR, intitule: 'Chef des Travaux', ref: 'CHEF_TRAV', fonctionRef: 'RESP-TECH' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements Techniques', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.FORMATEUR, nombrePostes: 6 }],
                            enfants: [
                                {
                                    echelonCode: 'ATELIER', nom: 'Atelier', count: 3,
                                    postes: [P.CHEF_ATEL, { ...P.FORMATEUR, nombrePostes: 3 }],
                                    enfants: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.SECRET, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T04 — LYCÉE TECHNIQUE PRIVÉ ═══
    {
        nom: 'Lycée Technique Privé',
        nomEn: 'Private Technical High School',
        description: 'Lycée technique privé avec filières professionnelles',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.TECHNIQUE,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'lycee-technique',
        ordre: 4,
        icone: 'Wrench',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur Général', ref: 'DG' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'FILIERE', nom: 'Filière Technique', count: 3,
                    postes: [{ ...P.CHEF_DEPT, intitule: 'Chef de Filière', ref: 'CHEF_FIL' }, { ...P.FORMATEUR, nombrePostes: 5 }],
                    enfants: [
                        {
                            echelonCode: 'ATELIER', nom: 'Atelier', count: 2,
                            postes: [P.CHEF_ATEL, { ...P.FORMATEUR, nombrePostes: 3 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Administration', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T05 — COLLÈGE D'ENSEIGNEMENT SECONDAIRE ═══
    {
        nom: 'Collège d\'Enseignement Secondaire',
        nomEn: 'Secondary School (CES)',
        description: 'Structure type d\'un CES avec Principal et Censeur',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'college-general',
        ordre: 5,
        icone: 'GraduationCap',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Principal', ref: 'PRINCIPAL', fonctionRef: 'PROVISEUR' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, { ...P.SURV, nombrePostes: 2 }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements', count: 5,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service de Gestion', count: 1,
                    postes: [P.INTEND, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T06 — COLLÈGE TECHNIQUE ═══
    {
        nom: 'Collège d\'Enseignement Technique',
        nomEn: 'Technical Secondary School',
        description: 'Structure pour un collège technique',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.TECHNIQUE,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'college-technique',
        ordre: 6,
        icone: 'Wrench',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Principal', ref: 'PRINCIPAL', fonctionRef: 'PROVISEUR' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Chef des Travaux', count: 1,
                    postes: [{ ...P.CENSEUR, intitule: 'Chef des Travaux', ref: 'CHEF_TRAV', fonctionRef: 'RESP-TECH' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Section Technique', count: 3,
                            postes: [{ ...P.CHEF_DEPT, intitule: 'Chef de Section', ref: 'CHEF_SECTION' }, { ...P.FORMATEUR, nombrePostes: 4 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.SECRET],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T07 — ÉCOLE PRIMAIRE PUBLIQUE ═══
    {
        nom: 'École Primaire Publique',
        nomEn: 'Public Primary School',
        description: 'Structure d\'une école primaire avec directeur et cycles',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-primaire',
        ordre: 7,
        icone: 'BookOpen',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur d\'École', ref: 'DIR_ECOLE' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'CYCLE', nom: 'Cycle pédagogique', count: 3,
                    postes: [
                        { ...P.CHEF_DEPT, intitule: 'Coordinateur de Cycle', ref: 'COORD_CYCLE' },
                        { ...P.PROF, intitule: 'Instituteur', ref: 'INSTIT', nombrePostes: 6 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T08 — ÉCOLE PRIMAIRE PRIVÉE ═══
    {
        nom: 'École Primaire Privée',
        nomEn: 'Private Primary School',
        description: 'École primaire privée avec coordinateurs',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-primaire',
        ordre: 8,
        icone: 'BookOpen',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur', ref: 'DIR_ECOLE_PRIV' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'CYCLE', nom: 'Cycle', count: 3,
                    postes: [
                        { ...P.CHEF_DEPT, intitule: 'Coordinateur', ref: 'COORD' },
                        { ...P.PROF, intitule: 'Instituteur', ref: 'INSTIT_PRIV', nombrePostes: 4 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T09 — ÉCOLE MATERNELLE PUBLIQUE ═══
    {
        nom: 'École Maternelle Publique',
        nomEn: 'Public Nursery School',
        description: 'Structure d\'une école maternelle publique',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.MATERNEL],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-maternelle',
        ordre: 9,
        icone: 'Baby',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directrice d\'École Maternelle', ref: 'DIR_MAT' }],
            enfants: [
                {
                    echelonCode: 'DEPARTEMENT_PEDA', nom: 'Section', count: 2,
                    postes: [
                        { ...P.PROF, intitule: 'Instituteur(-trice) Maternelle', ref: 'INSTIT_MAT', nombrePostes: 4 },
                        { ...P.ANIM, intitule: 'Aide-Maternelle', ref: 'AIDE_MAT', nombrePostes: 2 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T10 — ÉCOLE MATERNELLE PRIVÉE ═══
    {
        nom: 'École Maternelle Privée',
        nomEn: 'Private Nursery School',
        description: 'Structure d\'une école maternelle privée',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.MATERNEL],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-maternelle',
        ordre: 10,
        icone: 'Baby',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directrice', ref: 'DIR_MAT_PRIV' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DEPARTEMENT_PEDA', nom: 'Section', count: 3,
                    postes: [
                        { ...P.PROF, intitule: 'Éducateur(trice)', ref: 'EDUC_MAT', nombrePostes: 3 },
                        { ...P.ANIM, nombrePostes: 2 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T11 — COMPLEXE SCOLAIRE PRIVÉ ═══
    {
        nom: 'Complexe Scolaire Privé',
        nomEn: 'Private School Complex',
        description: 'Structure complète maternel-primaire-secondaire',
        nature: NatureJuridique.COMPLEXE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.MATERNEL, NiveauEnseignement.PRIMAIRE, NiveauEnseignement.COLLEGE, NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'complexe-scolaire',
        ordre: 11,
        icone: 'Building2',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur Général', ref: 'DG' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Direction du Secondaire', count: 1,
                    postes: [{ ...P.DIR, intitule: 'Directeur du Secondaire', ref: 'DIR_SEC' }, P.CENSEUR, P.SURV],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'DIRECTION', nom: 'Direction du Primaire', count: 1,
                    postes: [{ ...P.DIR, intitule: 'Directeur du Primaire', ref: 'DIR_PRIM' }],
                    enfants: [
                        {
                            echelonCode: 'CYCLE', nom: 'Cycle Primaire', count: 3,
                            postes: [{ ...P.PROF, intitule: 'Instituteur', ref: 'INSTIT_PRIM', nombrePostes: 4 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'DIRECTION', nom: 'Direction de la Maternelle', count: 1,
                    postes: [{ ...P.DIR, intitule: 'Directrice Maternelle', ref: 'DIR_MAT_COMP' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Section Maternelle', count: 2,
                            postes: [{ ...P.PROF, intitule: 'Institutrice Maternelle', ref: 'INSTIT_MAT_COMP', nombrePostes: 3 }],
                            enfants: [],
                        },
                    ],
                },
            ],
        },
    },

    // ═══ T12 — COMPLEXE SCOLAIRE BILINGUE ═══
    {
        nom: 'Complexe Scolaire Bilingue',
        nomEn: 'Bilingual School Complex',
        description: 'Complexe scolaire avec sections francophone et anglophone',
        nature: NatureJuridique.COMPLEXE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.BILINGUE,
        niveaux: [NiveauEnseignement.PRIMAIRE, NiveauEnseignement.COLLEGE, NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'complexe-bilingue',
        ordre: 12,
        icone: 'Languages',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur Général', ref: 'DG_BIL' }, P.COORD_LING, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'SECTION_LINGUISTIQUE', nom: 'Section Francophone', count: 1,
                    postes: [P.DIR_FR, P.CENSEUR],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Départements FR', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 5 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SECTION_LINGUISTIQUE', nom: 'English Section', count: 1,
                    postes: [P.DIR_EN, P.DEPUTY],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Departments EN', count: 4,
                            postes: [{ ...P.CHEF_DEPT, ref: 'HOD', intitule: 'Head of Department', fonctionRef: 'CDEPT' }, { ...P.PROF, nombrePostes: 5 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Administration', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T13 — ÉCOLE ANGLOPHONE (Primary) ═══
    {
        nom: 'École Primaire Anglophone',
        nomEn: 'Anglophone Primary School',
        description: 'Structure d\'une école primaire du système anglophone',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.ANGLOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-anglophone',
        ordre: 13,
        icone: 'BookOpen',
        structure: {
            echelonCode: 'DIRECTION', nom: 'School Management', count: 1,
            postes: [P.HEAD, P.SECRET],
            enfants: [
                {
                    echelonCode: 'CYCLE', nom: 'Cycle / Key Stage', count: 3,
                    postes: [P.TUTOR, { ...P.PROF, intitule: 'Teacher', ref: 'TEACHER_EN', nombrePostes: 5 }],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T14 — LYCÉE ANGLOPHONE (Secondary) ═══
    {
        nom: 'Lycée Anglophone',
        nomEn: 'Anglophone Secondary School',
        description: 'Structure d\'un secondary school anglophone',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.ANGLOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE, NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'lycee-anglophone',
        ordre: 14,
        icone: 'School',
        structure: {
            echelonCode: 'DIRECTION', nom: 'School Management', count: 1,
            postes: [P.HEAD, P.DEPUTY, P.SECRET, P.BIZ, P.EXAMS],
            enfants: [
                {
                    echelonCode: 'DEPARTEMENT_PEDA', nom: 'Department', count: 5,
                    postes: [P.HEAD_YEAR, { ...P.PROF, intitule: 'Teacher', ref: 'TECH_EN', nombrePostes: 6 }],
                    enfants: [],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Admin Office', count: 1,
                    postes: [{ ...P.ADMIN, ref: 'ADMIN_EN', nombrePostes: 2 }],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T15 — CETFP ═══
    {
        nom: 'Centre d\'Enseignement Technique et de Formation Professionnelle',
        nomEn: 'Technical and Vocational Training Centre',
        description: 'CETFP — formation professionnelle avec ateliers',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.PROFESSIONNEL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE, NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'centre-formation',
        ordre: 15,
        icone: 'Hammer',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur CETFP', ref: 'DIR_CETFP' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Chef des Travaux', count: 1,
                    postes: [{ ...P.CENSEUR, intitule: 'Chef des Travaux', ref: 'CHEF_TRAV_CETFP', fonctionRef: 'RESP-TECH' }],
                    enfants: [
                        {
                            echelonCode: 'ATELIER', nom: 'Atelier', count: 4,
                            postes: [P.CHEF_ATEL, { ...P.FORMATEUR, nombrePostes: 3 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T16 — INSTITUT DE FORMATION PROFESSIONNELLE ═══
    {
        nom: 'Institut de Formation Professionnelle',
        nomEn: 'Professional Training Institute',
        description: 'Institut privé de formation avec pôles',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.PROFESSIONNEL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.POST_BAC],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'institut-formation',
        ordre: 16,
        icone: 'Briefcase',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur d\'Institut', ref: 'DIR_INST' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'POLE_FORMATION', nom: 'Pôle de Formation', count: 3,
                    postes: [
                        { ...P.CHEF_DEPT, intitule: 'Coordinateur de Pôle', ref: 'COORD_POLE' },
                        { ...P.FORMATEUR, nombrePostes: 4 },
                    ],
                    enfants: [],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T17 — ENIEG (École Normale) ═══
    {
        nom: 'ENIEG — École Normale d\'Instituteurs',
        nomEn: 'Teacher Training College',
        description: 'Structure d\'une école normale de formation des instituteurs',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.NORMAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.POST_BAC],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-normale',
        ordre: 17,
        icone: 'School',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur ENIEG', ref: 'DIR_ENIEG' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Scolarité', count: 1,
                    postes: [{ ...P.CENSEUR, intitule: 'Chef de Scolarité', ref: 'CHEF_SCOL_ENIEG' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Département de Formation', count: 3,
                            postes: [P.CHEF_DEPT, { ...P.PROF, intitule: 'Formateur', ref: 'FORM_ENIEG', nombrePostes: 5 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Surveillance', count: 1,
                    postes: [P.SURV],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T18 — ÉCOLE NORMALE SUPÉRIEURE ═══
    {
        nom: 'École Normale Supérieure',
        nomEn: 'Higher Normal School',
        description: 'Structure type ENS avec départements de recherche et formation',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.SUPERIEUR,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.POST_BAC],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'ens',
        ordre: 18,
        icone: 'University',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur ENS', ref: 'DIR_ENS' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Direction des Études', count: 1,
                    postes: [{ ...P.CENSEUR, intitule: 'Directeur des Études', ref: 'DIR_ETUDES' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Département', count: 5,
                            postes: [
                                P.CHEF_DEPT,
                                { ...P.PROF, intitule: 'Maître de Conférences', ref: 'MC', nombrePostes: 8 },
                                { ...P.PROF, intitule: 'Assistant', ref: 'ASSISTANT', nombrePostes: 4 },
                            ],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Recherche', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitule: 'Chef Service Recherche', ref: 'CHEF_RECH' }],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T19 — UNIVERSITÉ — COMPOSANTE ═══
    {
        nom: 'Université — Composante',
        nomEn: 'University Component (Faculty/School)',
        description: 'Structure d\'un établissement universitaire (Faculté/École)',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.SUPERIEUR,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.POST_BAC],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'universite',
        ordre: 19,
        icone: 'University',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Doyenat / Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Doyen / Directeur', ref: 'DOYEN' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Vice-Doyenat', count: 3,
                    postes: [{ ...P.CENSEUR, intitule: 'Vice-Doyen', ref: 'VICE_DOYEN' }],
                    enfants: [],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service de Scolarité', count: 1,
                    postes: [
                        { ...P.RESP_ADMIN, intitule: 'Chef Scolarité', ref: 'CHEF_SCOL_UNIV' },
                        { ...P.ADMIN, intitule: 'Agent Scolarité', ref: 'AGENT_SCOL_U', nombrePostes: 3 },
                    ],
                    enfants: [],
                },
                {
                    echelonCode: 'DEPARTEMENT_PEDA', nom: 'Département', count: 6,
                    postes: [
                        P.CHEF_DEPT,
                        { ...P.PROF, intitule: 'Professeur des Universités', ref: 'PU', nombrePostes: 10 },
                        { ...P.PROF, intitule: 'Maître de Conférences', ref: 'MC_UNIV', nombrePostes: 8 },
                        { ...P.PROF, intitule: 'Assistant', ref: 'ASSIST_UNIV', nombrePostes: 6 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T20 — GRANDE ÉCOLE PRIVÉE ═══
    {
        nom: 'Grande École Privée',
        nomEn: 'Private Higher Education School',
        description: 'Structure d\'une grande école privée avec départements',
        nature: NatureJuridique.PRIVE_LAIC,
        systeme: SystemeEducatif.SUPERIEUR,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.POST_BAC],
        complexite: ComplexiteStructurelle.AVANCE,
        categorie: 'grande-ecole',
        ordre: 20,
        icone: 'GraduationCap',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur Général', ref: 'DG_GE' }, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Direction Académique', count: 1,
                    postes: [{ ...P.CENSEUR, intitule: 'Directeur Académique', ref: 'DIR_ACAD' }],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Département', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Direction Administrative', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA, P.SECRET],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T21 — ÉCOLE CONFESSIONNELLE ═══
    {
        nom: 'École Confessionnelle',
        nomEn: 'Faith-Based School',
        description: 'Structure d\'une école confessionnelle (catholique, protestante, etc.)',
        nature: NatureJuridique.PRIVE_CONFESSIONNEL,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE, NiveauEnseignement.COLLEGE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-confessionnelle',
        ordre: 21,
        icone: 'Church',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur', ref: 'DIR_CONF' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DIRECTION', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, P.SURV],
                    enfants: [
                        {
                            echelonCode: 'DEPARTEMENT_PEDA', nom: 'Département', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 5 }],
                            enfants: [],
                        },
                    ],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Intendance', count: 1,
                    postes: [P.INTEND, P.COMPTA],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T22 — ÉCOLE ASSOCIATIVE ═══
    {
        nom: 'École Associative',
        nomEn: 'Association School',
        description: 'Structure d\'une école gérée par une association',
        nature: NatureJuridique.PRIVE_ASSOCIATIF,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-associative',
        ordre: 22,
        icone: 'Users',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur', ref: 'DIR_ASSO' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'CYCLE', nom: 'Cycle', count: 2,
                    postes: [
                        { ...P.CHEF_DEPT, intitule: 'Coordinateur', ref: 'COORD_ASSO' },
                        { ...P.PROF, intitule: 'Instituteur', ref: 'INSTIT_ASSO', nombrePostes: 4 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T23 — ÉCOLE COMMUNALE ═══
    {
        nom: 'École Communale',
        nomEn: 'Municipal School',
        description: 'Structure d\'une école gérée par une commune',
        nature: NatureJuridique.PUBLIC_COMMUNAL,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.PRIMAIRE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'ecole-communale',
        ordre: 23,
        icone: 'Building',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Directeur', ref: 'DIR_COMM' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'CYCLE', nom: 'Cycle', count: 3,
                    postes: [
                        { ...P.CHEF_DEPT, intitule: 'Coordinateur', ref: 'COORD_COMM' },
                        { ...P.PROF, intitule: 'Instituteur', ref: 'INSTIT_COMM', nombrePostes: 5 },
                    ],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T24 — CENTRE D'ORIENTATION ═══
    {
        nom: 'Centre d\'Orientation Scolaire et Professionnelle',
        nomEn: 'School and Career Guidance Centre',
        description: 'Structure d\'un centre d\'orientation',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE, NiveauEnseignement.LYCEE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'centre-orientation',
        ordre: 24,
        icone: 'Compass',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitule: 'Chef de Centre', ref: 'CHEF_COS' }, P.SECRET],
            enfants: [
                {
                    echelonCode: 'DEPARTEMENT_PEDA', nom: 'Pôle d\'Orientation', count: 2,
                    postes: [{ ...P.ORIENT, nombrePostes: 3 }],
                    enfants: [],
                },
                {
                    echelonCode: 'SERVICE', nom: 'Service Documentation', count: 1,
                    postes: [P.DOC],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ T25 — ORGANISATION STANDARD (générique) ═══
    {
        nom: 'Organisation Standard (template générique)',
        nomEn: 'Standard Organisation (generic template)',
        description: 'Template générique adaptable : Direction → Services → Unités',
        nature: NatureJuridique.PUBLIC_ETATIQUE,
        systeme: SystemeEducatif.GENERAL,
        langue: LangueEnseignement.FRANCOPHONE,
        niveaux: [NiveauEnseignement.COLLEGE],
        complexite: ComplexiteStructurelle.STANDARD,
        categorie: 'standard',
        ordre: 25,
        icone: 'Settings',
        structure: {
            echelonCode: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [P.DIR, P.SECRET, P.COMPTA],
            enfants: [
                {
                    echelonCode: 'SERVICE', nom: 'Service', count: 4,
                    postes: [
                        { ...P.RESP_ADMIN, intitule: 'Chef de Service', ref: 'CHEF_SERV' },
                        { ...P.ADMIN, intitule: 'Agent', ref: 'AGENT', nombrePostes: 3 },
                    ],
                    enfants: [
                        {
                            echelonCode: 'BUREAU', nom: 'Bureau', count: 2,
                            postes: [
                                { ...P.ADMIN, intitule: 'Chef de Bureau', ref: 'CHEF_BUR', niveauResponsabilite: 'SUPERVISEUR' },
                                { ...P.ADMIN, intitule: 'Agent de Bureau', ref: 'AGENT_BUR', nombrePostes: 2 },
                            ],
                            enfants: [],
                        },
                    ],
                },
            ],
        },
    },
];

// ─── Fonction de seed ───
export async function seedTemplatesOrganisation(): Promise<number> {
    const repo = AppDataSource.getRepository(TemplateOrganisation);

    // Validation croisée : tous les fonctionRef doivent exister
    const fonctionsExistantes = await AppDataSource.getRepository(Fonction).find({ select: ['code'] });
    const codesFonctions = new Set(fonctionsExistantes.map((f) => f.code));
    const refsManquantes: string[] = [];
    const fonctionRefs = new Set<string>();

    function collectRefs(node: NoeudTemplateOrganisation) {
        for (const p of node.postes || []) {
            if (p.fonctionRef) fonctionRefs.add(p.fonctionRef);
        }
        for (const child of node.enfants || []) {
            collectRefs(child);
        }
    }
    for (const tpl of TEMPLATES) {
        collectRefs(tpl.structure);
    }
    for (const ref of fonctionRefs) {
        if (!codesFonctions.has(ref)) refsManquantes.push(ref);
    }
    if (refsManquantes.length > 0) {
        logger.warn(`  ⚠ fonctionRef introuvables dans la base: ${refsManquantes.join(', ')}`);
    }

    let count = 0;
    let updated = 0;

    for (const def of TEMPLATES) {
        const exists = await repo.findOne({ where: { nom: def.nom, estSysteme: true as any } });
        if (exists) {
            // Mise à jour des métadonnées si le template existe déjà
            const changed = exists.nature !== def.nature
                || exists.systeme !== def.systeme
                || exists.langue !== def.langue
                || exists.complexite !== def.complexite
                || exists.nomEn !== def.nomEn;
            if (changed) {
                await repo.update(exists.id, {
                    nature: def.nature,
                    systeme: def.systeme,
                    langue: def.langue,
                    niveaux: def.niveaux,
                    complexite: def.complexite,
                    categorie: def.categorie,
                    ordre: def.ordre,
                    icone: def.icone,
                    nomEn: def.nomEn,
                });
                updated++;
            }
            logger.info(`  ↪ Template "${def.nom}" existe déjà, ${changed ? 'mis à jour' : 'skip'}`);
            continue;
        }
        const t = repo.create({
            nom: def.nom,
            nomEn: def.nomEn,
            description: def.description,
            structure: def.structure,
            nature: def.nature,
            systeme: def.systeme,
            langue: def.langue,
            niveaux: def.niveaux,
            complexite: def.complexite,
            categorie: def.categorie,
            ordre: def.ordre,
            icone: def.icone,
            estSysteme: true,
            actif: true,
            etablissementId: null,
        });
        await repo.save(t);
        count++;
        logger.info(`  ✅ Template "${def.nom}" créé`);
    }

    logger.info(`  Templates: ${count} créés, ${updated} mis à jour`);
    return count;
}
