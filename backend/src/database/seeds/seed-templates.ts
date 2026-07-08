import { AppDataSource } from '../data-source';
import { TemplateOrganisation } from '@modules/organisation/entities';
import { logger } from '@common/utils/logger.util';

interface TemplateDef {
    nom: string;
    description: string;
    structure: any;
}

export async function seedTemplatesOrganisation(): Promise<number> {
    const repo = AppDataSource.getRepository(TemplateOrganisation);
    let count = 0;

    for (const def of TEMPLATES) {
        const exists = await repo.findOne({ where: { nom: def.nom, estSysteme: true, etablissementId: null } });
        if (exists) {
            logger.info(`  ↪ Template "${def.nom}" existe déjà, skip`);
            continue;
        }
        const t = repo.create({
            nom: def.nom,
            description: def.description,
            structure: def.structure,
            estSysteme: true,
            actif: true,
            etablissementId: null,
        });
        await repo.save(t);
        count++;
        logger.info(`  ✅ Template "${def.nom}" créé`);
    }

    return count;
}

// ─── 22 TEMPLATES SYSTÈME ───

const P = {
    DIR: { ref: 'DIR', intitulé: 'Directeur', categoriePoste: 'DIRECTION', niveauResponsabilite: 'DIRECTION_GENERALE', nombrePostes: 1 },
    CENSEUR: { ref: 'CENSEUR', intitulé: 'Censeur', categoriePoste: 'DIRECTION', niveauResponsabilite: 'DIRECTION_ADJOINTE', nombrePostes: 1 },
    SURV: { ref: 'SURV', intitulé: 'Surveillant Général', categoriePoste: 'EDUCATIF', niveauResponsabilite: 'SUPERVISEUR', nombrePostes: 1 },
    RESP_ADMIN: { ref: 'RESP_ADMIN', intitulé: 'Chef Service Administratif', categoriePoste: 'ADMINISTRATIF', niveauResponsabilite: 'RESPONSABLE', nombrePostes: 1 },
    SECRET: { ref: 'SECRET', intitulé: 'Secrétaire', categoriePoste: 'ADMINISTRATIF', niveauResponsabilite: 'EXECUTANT', nombrePostes: 2 },
    COMPTA: { ref: 'COMPTA', intitulé: 'Comptable', categoriePoste: 'ADMINISTRATIF', niveauResponsabilite: 'EXECUTANT', nombrePostes: 1 },
    INTEND: { ref: 'INTEND', intitulé: 'Intendant', categoriePoste: 'ADMINISTRATIF', niveauResponsabilite: 'RESPONSABLE', nombrePostes: 1 },
    CHEF_DEPT: { ref: 'CHEF_DEPT', intitulé: 'Chef de Département', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'COORDINATEUR', nombrePostes: 1 },
    PROF: { ref: 'PROF', intitulé: 'Professeur', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'EXECUTANT', nombrePostes: 10 },
    CHEF_ATEL: { ref: 'CHEF_ATEL', intitulé: 'Chef d\'Atelier', categoriePoste: 'TECHNIQUE', niveauResponsabilite: 'RESPONSABLE', nombrePostes: 1 },
    FORMATEUR: { ref: 'FORMATEUR', intitulé: 'Formateur Technique', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'EXECUTANT', nombrePostes: 5 },
    DOC: { ref: 'DOC', intitulé: 'Documentaliste', categoriePoste: 'DOCUMENTATION', niveauResponsabilite: 'EXECUTANT', nombrePostes: 1 },
    ORIENT: { ref: 'ORIENT', intitulé: 'Conseiller d\'Orientation', categoriePoste: 'ORIENTATION', niveauResponsabilite: 'EXECUTANT', nombrePostes: 1 },
    INFIRM: { ref: 'INFIRM', intitulé: 'Infirmier Scolaire', categoriePoste: 'SANTE', niveauResponsabilite: 'EXECUTANT', nombrePostes: 1 },
    ANIM: { ref: 'ANIM', intitulé: 'Animateur Pédagogique', categoriePoste: 'EDUCATIF', niveauResponsabilite: 'EXECUTANT', nombrePostes: 1 },
};

const H_DIR_CENSEUR = [{ superieurRef: 'DIRECTION', subordonneRef: 'CENSORAT', typeRelation: 'SUPERVISE_DIRECT' }];
const H_DIR_SURV = [{ superieurRef: 'DIRECTION', subordonneRef: 'SURVEILLANCE', typeRelation: 'SUPERVISE_DIRECT' }];

const TEMPLATES: TemplateDef[] = [

    // ═══ 1. LYCÉE D'ENSEIGNEMENT GÉNÉRAL (LEG) ═══
    {
        nom: 'Lycée d\'Enseignement Général',
        description: 'Structure d\'un lycée classique (Proviseur + Censeur + Départements)',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [P.DIR, P.SECRET, P.COMPTA, P.DOC, P.ORIENT, P.INFIRM],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, { ...P.PROF, intitulé: 'Censeur Adjoint', ref: 'CENSEUR_ADJ', nombrePostes: 1 }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 6,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 8 }],
                            hierarchie: [],
                            enfants: [],
                        },
                    ],
                },
                {
                    niveau: 4, usageUnite: 'SURVEILLANCE', nom: 'Surveillance Générale', count: 1,
                    postes: [P.SURV, { ...P.SURV, intitulé: 'Surveillant', ref: 'SURV_ADJ', nombrePostes: 4 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'INTENDANCE', nom: 'Intendance', count: 1,
                    postes: [P.INTEND, P.COMPTA, { ...P.ADMIN, intitulé: 'Agent de gestion', ref: 'AGENT_GEST', nombrePostes: 2 }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 2. LYCÉE TECHNIQUE ═══
    {
        nom: 'Lycée Technique',
        description: 'Structure d\'un lycée technique avec ateliers et chef de travaux',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [P.DIR, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, P.SURV, { ...P.SURV, intitulé: 'Chef des Travaux', ref: 'CHEF_TRAV', categoriePoste: 'TECHNIQUE', niveauResponsabilite: 'DIRECTION_ADJOINTE', nombrePostes: 1 }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département Technique', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.FORMATEUR, nombrePostes: 6 }],
                            hierarchie: [],
                            enfants: [
                                {
                                    niveau: 2, usageUnite: 'ATELIER', nom: 'Atelier', count: 3,
                                    postes: [P.CHEF_ATEL, { ...P.FORMATEUR, nombrePostes: 3 }],
                                    hierarchie: [],
                                    enfants: [],
                                },
                            ],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.SECRET, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 3. COLLÈGE D'ENSEIGNEMENT SECONDAIRE (CES) ═══
    {
        nom: 'Collège d\'Enseignement Secondaire',
        description: 'Structure type d\'un CES avec Principal et Censeur',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Principal', ref: 'PRINCIPAL' }, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Censorat', count: 1,
                    postes: [P.CENSEUR, { ...P.SURV, nombrePostes: 2 }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 5,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            hierarchie: [],
                            enfants: [],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service de Gestion', count: 1,
                    postes: [P.INTEND, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 4. COLLÈGE D'ENSEIGNEMENT TECHNIQUE (CET) ═══
    {
        nom: 'Collège d\'Enseignement Technique',
        description: 'Structure pour un collège technique',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Principal', ref: 'PRINCIPAL' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Chef des Travaux', count: 1,
                    postes: [{ ...P.CENSEUR, intitulé: 'Chef des Travaux', ref: 'CHEF_TRAV', categoriePoste: 'TECHNIQUE', niveauResponsabilite: 'DIRECTION_ADJOINTE', nombrePostes: 1 }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'SECTION', nom: 'Section Technique', count: 3,
                            postes: [{ ...P.CHEF_DEPT, intitulé: 'Chef de Section', ref: 'CHEF_SECTION' }, { ...P.FORMATEUR, nombrePostes: 4 }],
                            hierarchie: [],
                            enfants: [],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.SECRET],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 5. ÉCOLE PRIMAIRE PUBLIQUE ═══
    {
        nom: 'École Primaire Publique',
        description: 'Structure d\'une école primaire avec directeur et cycles',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur d\'École', ref: 'DIR_ECOLE' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 3, usageUnite: 'CYCLE', nom: 'Cycle', count: 3,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Coordinateur de Cycle', ref: 'COORD_CYCLE', niveauResponsabilite: 'COORDINATEUR' },
                             { ...P.PROF, intitulé: 'Instituteur', ref: 'INSTIT', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'EXECUTANT', nombrePostes: 6 }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 6. ÉCOLE MATERNELLE PUBLIQUE ═══
    {
        nom: 'École Maternelle Publique',
        description: 'Structure d\'une école maternelle',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directrice d\'École Maternelle', ref: 'DIR_MAT' }],
            hierarchie: [],
            enfants: [
                {
                    niveau: 3, usageUnite: 'SECTION', nom: 'Section', count: 2,
                    postes: [{ ...P.PROF, intitulé: 'Instituteur(-trice) Maternelle', ref: 'INSTIT_MAT', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'EXECUTANT', nombrePostes: 4 },
                             { ...P.ANIM, intitulé: 'Aide-Maternelle', ref: 'AIDE_MAT', nombrePostes: 2 }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 7. COMPLEXE SCOLAIRE PRIVÉ ═══
    {
        nom: 'Complexe Scolaire Privé',
        description: 'Structure complète maternel-primaire-secondaire',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur Général', ref: 'DG' }, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction du Secondaire', count: 1,
                    postes: [{ ...P.DIR, intitulé: 'Directeur du Secondaire', ref: 'DIR_SECONDAIRE' }, P.CENSEUR, P.SURV],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'DIR_SECONDAIRE', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction du Primaire', count: 1,
                    postes: [{ ...P.DIR, intitulé: 'Directeur du Primaire', ref: 'DIR_PRIMAIRE' }],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'DIR_PRIMAIRE', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'CYCLE', nom: 'Cycle Primaire', count: 3,
                            postes: [{ ...P.PROF, intitulé: 'Instituteur', ref: 'INSTIT_PRIM', nombrePostes: 4 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction de la Maternelle', count: 1,
                    postes: [{ ...P.DIR, intitulé: 'Directrice de la Maternelle', ref: 'DIR_MAT_COMP' }],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'DIR_MAT_COMP', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'SECTION', nom: 'Section Maternelle', count: 2,
                            postes: [{ ...P.PROF, intitulé: 'Institutrice Maternelle', ref: 'INSTIT_MAT_COMP', nombrePostes: 3 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
            ],
        },
    },

    // ═══ 8. GROUPE SCOLAIRE ═══
    {
        nom: 'Groupe Scolaire',
        description: 'Structure pour un groupe scolaire multi-établissements',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Coordination Générale', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Coordonnateur Général', ref: 'COORD_GEN' }, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction d\'Établissement', count: 3,
                    postes: [{ ...P.DIR, intitulé: 'Directeur d\'Établissement', ref: 'DIR_ETAB' }, P.RESP_ADMIN],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'DIR_ETAB', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'SERVICE', nom: 'Service Pédagogique', count: 1,
                            postes: [P.CENSEUR, { ...P.PROF, nombrePostes: 5 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
            ],
        },
    },

    // ═══ 9. ENIEG ═══
    {
        nom: 'ENIEG (École Normale d\'Instituteurs)',
        description: 'Structure d\'une école normale de formation des instituteurs',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur ENIEG', ref: 'DIR_ENIEG' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Scolarité', count: 1,
                    postes: [{ ...P.CENSEUR, intitulé: 'Chef de Scolarité', ref: 'CHEF_SCOL' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département de Formation', count: 3,
                            postes: [P.CHEF_DEPT, { ...P.PROF, intitulé: 'Formateur', ref: 'FORMATEUR_ENIEG', nombrePostes: 5 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SURVEILLANCE', nom: 'Surveillance', count: 1,
                    postes: [P.SURV],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 10. ÉCOLE NORMALE SUPÉRIEURE ═══
    {
        nom: 'École Normale Supérieure',
        description: 'Structure type ENS avec départements de recherche et formation',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur ENS', ref: 'DIR_ENS' }, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction des Études', count: 1,
                    postes: [{ ...P.CENSEUR, intitulé: 'Directeur des Études', ref: 'DIR_ETUDES' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 5,
                            postes: [P.CHEF_DEPT, { ...P.PROF, intitulé: 'Maître de Conférences', ref: 'MC', nombrePostes: 8 },
                                     { ...P.PROF, intitulé: 'Assistant', ref: 'ASSISTANT', nombrePostes: 4 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service Recherche', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Service Recherche', ref: 'CHEF_RECH' }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 11. CETFP ═══
    {
        nom: 'Centre d\'Enseignement Technique et de Formation Professionnelle',
        description: 'CETFP — formation professionnelle avec ateliers',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur CETFP', ref: 'DIR_CETFP' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'CENSORAT', nom: 'Chef des Travaux', count: 1,
                    postes: [{ ...P.CENSEUR, intitulé: 'Chef des Travaux', ref: 'CHEF_TRAV_CETFP', categoriePoste: 'TECHNIQUE', niveauResponsabilite: 'DIRECTION_ADJOINTE' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'ATELIER', nom: 'Atelier', count: 4,
                            postes: [P.CHEF_ATEL, { ...P.FORMATEUR, nombrePostes: 3 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 12. INSTITUT DE FORMATION ═══
    {
        nom: 'Institut de Formation Professionnelle',
        description: 'Institut privé de formation avec coordinateurs',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur d\'Institut', ref: 'DIR_INST' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'POLE', nom: 'Pôle de Formation', count: 3,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Coordinateur de Pôle', ref: 'COORD_POLE' },
                             { ...P.FORMATEUR, nombrePostes: 4 }],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'COORD_POLE', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 13. UNIVERSITÉ (composante) ═══
    {
        nom: 'Université — Composante',
        description: 'Structure d\'un établissement universitaire (Faculté/École)',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Doyenat / Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Doyen / Directeur', ref: 'DOYEN' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Vice-Doyenat', count: 3,
                    postes: [{ ...P.CENSEUR, intitulé: 'Vice-Doyen', ref: 'VICE_DOYEN' }],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'VICE_DOYEN', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service de Scolarité', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Scolarité', ref: 'CHEF_SCOL_UNIV' }, { ...P.ADMIN, intitulé: 'Agent Scolarité', ref: 'AGENT_SCOL', nombrePostes: 3 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 6,
                    postes: [P.CHEF_DEPT, { ...P.PROF, intitulé: 'Professeur des Universités', ref: 'PU', nombrePostes: 10 },
                             { ...P.PROF, intitulé: 'Maître de Conférences', ref: 'MC_UNIV', nombrePostes: 8 },
                             { ...P.PROF, intitulé: 'Assistant', ref: 'ASSIST_UNIV', nombrePostes: 6 }],
                    hierarchie: [], enfants: [],
                },
            ],
        },
    },

    // ═══ 14. GRANDE ÉCOLE PRIVÉE ═══
    {
        nom: 'Grande École Privée',
        description: 'Structure d\'une grande école privée avec départements',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur Général', ref: 'DG_GE' }, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'DIRECTION', nom: 'Direction Académique', count: 1,
                    postes: [{ ...P.CENSEUR, intitulé: 'Directeur Académique', ref: 'DIR_ACAD' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'DEPARTEMENT', nom: 'Département', count: 4,
                            postes: [P.CHEF_DEPT, { ...P.PROF, nombrePostes: 6 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Direction Administrative', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA, P.SECRET],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 15. ÉCOLE DE FORMATION MARITIME ═══
    {
        nom: 'École de Formation Professionnelle Maritime',
        description: 'Structure pour une école maritime avec moniteurs',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [P.DIR, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'POLE', nom: 'Pôle Pédagogique', count: 1,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Chef de la Pédagogie', ref: 'CHEF_PED' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'SECTION', nom: 'Section de Formation', count: 3,
                            postes: [{ ...P.FORMATEUR, intitulé: 'Moniteur Maritime', ref: 'MONITEUR', nombrePostes: 4 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 16. SAR/SM ═══
    {
        nom: 'SAR/SM — Section Artisanale Rurale',
        description: 'Structure d\'une section artisanale rurale',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur SAR/SM', ref: 'DIR_SAR' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'SECTION', nom: 'Chef de Section', count: 1,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Chef de Section', ref: 'CHEF_SECTION_SAR' }],
                    hierarchie: [],
                    enfants: [
                        {
                            niveau: 3, usageUnite: 'ATELIER', nom: 'Atelier Artisanal', count: 3,
                            postes: [P.CHEF_ATEL, { ...P.FORMATEUR, intitulé: 'Maître Artisan', ref: 'MAITRE_ART', nombrePostes: 3 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
            ],
        },
    },

    // ═══ 17. CAF ═══
    {
        nom: 'Centre d\'Animation et de Formation Pédagogique',
        description: 'CAF — formation continue des enseignants',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Délégué CAF', ref: 'DELEGUE_CAF' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'POLE', nom: 'Pôle Pédagogique', count: 1,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Conseiller Pédagogique Principal', ref: 'CP_PRINCIPAL' },
                             { ...P.PROF, intitulé: 'Conseiller Pédagogique', ref: 'CP', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'COORDINATEUR', nombrePostes: 5 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Administratif', count: 1,
                    postes: [P.RESP_ADMIN],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 18. CENTRE D'ORIENTATION ═══
    {
        nom: 'Centre d\'Orientation Scolaire et Professionnelle',
        description: 'Structure d\'un centre d\'orientation',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Chef de Centre d\'Orientation', ref: 'CHEF_COS' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'POLE', nom: 'Pôle d\'Orientation', count: 2,
                    postes: [{ ...P.ORIENT, nombrePostes: 3 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Documentation', count: 1,
                    postes: [P.DOC],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 19. INSPECTION D'ACADÉMIE ═══
    {
        nom: 'Inspection d\'Académie',
        description: 'Structure IA avec inspections et divisions',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Cabinet', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Délégué Régional', ref: 'DELEGUE_REG' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Division des Enseignements', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Division Enseignements', ref: 'CHEF_DIV_ENS' },
                             { ...P.PROF, intitulé: 'Inspecteur Pédagogique', ref: 'INSPECTEUR', categoriePoste: 'ENSEIGNANT', niveauResponsabilite: 'COORDINATEUR', nombrePostes: 5 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Division Administratif', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Division Administratif', ref: 'CHEF_DIV_ADM' }, { ...P.ADMIN, intitulé: 'Agent Administratif', ref: 'AGENT_ADM', nombrePostes: 3 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service de l\'Évaluation', count: 1,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Chef Service Évaluation', ref: 'CHEF_EVAL' }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 20. DÉLÉGATION DÉPARTEMENTALE MINESEC ═══
    {
        nom: 'Délégation Départementale MINESEC',
        description: 'Structure type d\'une délégation départementale',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Délégué Départemental', ref: 'DELEGUE_DEPT' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service des Lycées', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Service Lycées', ref: 'CHEF_SERV_LYC' },
                             { ...P.PROF, intitulé: 'Inspecteur', ref: 'INSPECTEUR_DEPT', nombrePostes: 3 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service des Collèges', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Service Collèges', ref: 'CHEF_SERV_COL' }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service de la Planification', count: 1,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef Service Planification', ref: 'CHEF_PLAN' }, P.COMPTA],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 21. ÉTABLISSEMENT MÉDICO-SOCIAL ═══
    {
        nom: 'Établissement Médico-Social / Centre Spécialisé',
        description: 'Structure pour centre spécialisé avec services éducatifs et médicaux',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction', count: 1,
            postes: [{ ...P.DIR, intitulé: 'Directeur du Centre', ref: 'DIR_CENTRE' }, P.SECRET],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service Éducatif', count: 1,
                    postes: [{ ...P.CHEF_DEPT, intitulé: 'Chef Service Éducatif', ref: 'CHEF_EDUC' },
                             { ...P.ANIM, intitulé: 'Éducateur Spécialisé', ref: 'EDUC', nombrePostes: 5 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service Médical', count: 1,
                    postes: [{ ...P.INFIRM, intitulé: 'Médecin', ref: 'MEDECIN', categoriePoste: 'SANTE', niveauResponsabilite: 'RESPONSABLE', nombrePostes: 1 },
                             { ...P.INFIRM, intitulé: 'Infirmier', ref: 'INFIRM_CENTRE', nombrePostes: 3 }],
                    hierarchie: [],
                    enfants: [],
                },
                {
                    niveau: 3, usageUnite: 'SERVICE', nom: 'Service Psychosocial', count: 1,
                    postes: [{ ...P.ORIENT, intitulé: 'Psychologue', ref: 'PSY', categoriePoste: 'SANTE', niveauResponsabilite: 'EXECUTANT', nombrePostes: 2 }],
                    hierarchie: [],
                    enfants: [],
                },
            ],
        },
    },

    // ═══ 22. ORGANISATION STANDARD ═══
    {
        nom: 'Organisation Standard (template générique)',
        description: 'Template générique adaptable : Direction → Services → Unités',
        structure: {
            niveau: 5, usageUnite: 'DIRECTION', nom: 'Direction Générale', count: 1,
            postes: [P.DIR, P.SECRET, P.COMPTA],
            hierarchie: [],
            enfants: [
                {
                    niveau: 4, usageUnite: 'SERVICE', nom: 'Service', count: 4,
                    postes: [{ ...P.RESP_ADMIN, intitulé: 'Chef de Service', ref: 'CHEF_SERV' },
                             { ...P.ADMIN, intitulé: 'Agent', ref: 'AGENT', nombrePostes: 3 }],
                    hierarchie: [{ superieurRef: 'DIRECTION', subordonneRef: 'CHEF_SERV', typeRelation: 'SUPERVISE_DIRECT' }],
                    enfants: [
                        {
                            niveau: 2, usageUnite: 'BUREAU', nom: 'Bureau', count: 2,
                            postes: [{ ...P.ADMIN, intitulé: 'Chef de Bureau', ref: 'CHEF_BUR', niveauResponsabilite: 'SUPERVISEUR' },
                                     { ...P.ADMIN, intitulé: 'Agent de Bureau', ref: 'AGENT_BUR', nombrePostes: 2 }],
                            hierarchie: [], enfants: [],
                        },
                    ],
                },
            ],
        },
    },
];
