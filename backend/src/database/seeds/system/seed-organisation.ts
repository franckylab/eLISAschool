import { AppDataSource } from '../../data-source';
import { UniteOrganisationnelle, StatutUnite } from '@modules/organisation/entities/unite-organisationnelle.entity';
import { Poste, StatutPoste } from '@modules/organisation/entities/poste.entity';
import { HierarchiePersonnel, StatutRelation } from '@modules/organisation/entities/hierarchie-personnel.entity';
import { Fonction } from '@modules/organisation/entities/fonction.entity';
import { TypePersonnel } from '@modules/organisation/entities/type-personnel.entity';
import { logger } from '@common/utils/logger.util';

interface UniteSeed {
    code: string;
    nom: string;
    usageCode: string;
    niveauOrg: number;
    ordre: number;
    parentCode?: string;
    responsableNom?: string;
    localisation?: string;
}

interface PosteSeed {
    code: string;
    intitule: string;
    categorieCode: string;
    niveauRespCode: string;
    fonctionCode?: string;
    uniteCode: string;
    nombrePostes: number;
    missions?: string[];
    competences?: string[];
}

interface HierarchieSeed {
    subCode: string;
    supCode: string;
}

function makeFonctionTree(typePersMap: Map<string, string>): Array<{ code: string; nom: string; parentCode?: string; typePersonnelCode: string; description: string; niveau: number; ordre: number }> {
    return [
        { code: 'DIR-ETAB', nom: 'Direction d\'Établissement', parentCode: undefined,       typePersonnelCode: 'DIRECTION',   description: 'Direction générale', niveau: 0, ordre: 1 },
        { code: 'PROVISEUR', nom: 'Proviseur',                 parentCode: 'DIR-ETAB',       typePersonnelCode: 'DIRECTION',   description: 'Chef d\'établissement', niveau: 1, ordre: 10 },
        { code: 'PROVISEUR-ADJ', nom: 'Proviseur Adjoint',     parentCode: 'DIR-ETAB',       typePersonnelCode: 'DIRECTION',   description: 'Adjoint au chef d\'établissement', niveau: 1, ordre: 20 },
        { code: 'CENSEUR', nom: 'Censeur',                     parentCode: 'DIR-ETAB',       typePersonnelCode: 'DIRECTION',   description: 'Responsable vie scolaire', niveau: 1, ordre: 30 },
        { code: 'CDEPT', nom: 'Chef de Département',            parentCode: undefined,        typePersonnelCode: 'ENSEIGNANT', description: 'Coordination pédagogique', niveau: 0, ordre: 100 },
        { code: 'PROF-TIT', nom: 'Professeur Titulaire',       parentCode: 'CDEPT',          typePersonnelCode: 'ENSEIGNANT', description: 'Professeur titulaire', niveau: 1, ordre: 110 },
        { code: 'PROF-CERT', nom: 'Professeur Certifié',       parentCode: 'CDEPT',          typePersonnelCode: 'ENSEIGNANT', description: 'Professeur certifié', niveau: 1, ordre: 120 },
        { code: 'PROF-VAC', nom: 'Professeur Vacataire',       parentCode: 'CDEPT',          typePersonnelCode: 'ENSEIGNANT', description: 'Professeur vacataire', niveau: 1, ordre: 130 },
        { code: 'CHEF-ADM', nom: 'Chef Administration',        parentCode: undefined,        typePersonnelCode: 'ADMINISTRATIF', description: 'Responsable administratif', niveau: 0, ordre: 200 },
        { code: 'COMPTABLE', nom: 'Comptable',                 parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Gestion comptable', niveau: 1, ordre: 210 },
        { code: 'AGENT-COMPTA', nom: 'Agent Comptable',        parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Agent comptable', niveau: 1, ordre: 220 },
        { code: 'CHEF-SCOL', nom: 'Chef Scolarité',            parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Gestion scolarité', niveau: 1, ordre: 230 },
        { code: 'AGENT-SCOL', nom: 'Agent Scolarité',          parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Agent scolarité', niveau: 1, ordre: 240 },
        { code: 'RESP-RH', nom: 'Responsable RH',              parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Gestion RH', niveau: 1, ordre: 250 },
        { code: 'INTENDANT', nom: 'Intendant',                 parentCode: 'CHEF-ADM',       typePersonnelCode: 'ADMINISTRATIF', description: 'Gestion intendance', niveau: 1, ordre: 260 },
        { code: 'RESP-SURV', nom: 'Responsable Surveillance',   parentCode: undefined,        typePersonnelCode: 'SERVICE',    description: 'Encadrement surveillance', niveau: 0, ordre: 300 },
        { code: 'SURV-GEN', nom: 'Surveillant Général',        parentCode: 'RESP-SURV',      typePersonnelCode: 'SERVICE',    description: 'Surveillant général', niveau: 1, ordre: 310 },
        { code: 'SURV', nom: 'Surveillant',                    parentCode: 'RESP-SURV',      typePersonnelCode: 'SERVICE',    description: 'Surveillant', niveau: 1, ordre: 320 },
        { code: 'RESP-TECH', nom: 'Responsable Technique',     parentCode: undefined,        typePersonnelCode: 'TECHNIQUE',  description: 'Responsable technique', niveau: 0, ordre: 400 },
        { code: 'TECH-INFO', nom: 'Technicien Informatique',   parentCode: 'RESP-TECH',      typePersonnelCode: 'TECHNIQUE',  description: 'Support informatique', niveau: 1, ordre: 410 },
        { code: 'ANIMATEUR', nom: 'Animateur',                 parentCode: undefined,        typePersonnelCode: 'SERVICE',    description: 'Animation culturelle', niveau: 0, ordre: 500 },
        { code: 'COACH-SPORT', nom: 'Coach Sportif',           parentCode: undefined,        typePersonnelCode: 'SERVICE',    description: 'Encadrement sportif', niveau: 0, ordre: 510 },
    ];
}

export async function seedOrganisation(
    etablissementId: string,
    nomEtablissement: string,
    nomenclatures: {
        categoriesPoste: Map<string, string>;
        niveauxOrganisation: Map<string, string>;
        niveauxResponsabilite: Map<string, string>;
        usagesUnite: Map<string, string>;
        typesRelation: Map<string, string>;
    },
): Promise<void> {
    const uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
    const posteRepo = AppDataSource.getRepository(Poste);
    const hierRepo = AppDataSource.getRepository(HierarchiePersonnel);
    const foncRepo = AppDataSource.getRepository(Fonction);
    const typePersRepo = AppDataSource.getRepository(TypePersonnel);

    const typePersMap = new Map<string, string>();
    const typesPers = await typePersRepo.find({ select: ['id', 'code'] });
    for (const tp of typesPers) typePersMap.set(tp.code, tp.id);

    const prefix = nomEtablissement.includes('Lycée') ? 'LB' : 'CP';

    // --- FONCTIONS (hiérarchiques, par établissement) ---
    const fonctionsMap = new Map<string, string>();
    const fonctionsData = makeFonctionTree(typePersMap);
    for (const f of fonctionsData) {
        const existing = await foncRepo.findOne({ where: { code: f.code, etablissementId } });
        if (existing) {
            fonctionsMap.set(f.code, existing.id);
            continue;
        }
        const parentId = f.parentCode ? fonctionsMap.get(f.parentCode) : undefined;
        const saved = await foncRepo.save(foncRepo.create({
            code: f.code,
            nom: f.nom,
            description: f.description,
            niveau: f.niveau,
            ordre: f.ordre,
            parentId,
            typePersonnelId: typePersMap.get(f.typePersonnelCode),
            chemin: f.parentCode ? `${fonctionsMap.get(f.parentCode)}/${f.code}` : f.code,
            etablissementId,
            estSysteme: true,
            actif: true,
        }));
        fonctionsMap.set(f.code, saved.id);
        logger.info(`  Fonction créée: ${saved.nom} (${saved.code})`);
    }

    // --- UNITÉS ---
    const unitesData: UniteSeed[] = [
        { code: 'DIR', nom: 'Direction', usageCode: 'DIRECTION', niveauOrg: 1, ordre: 1, responsableNom: 'Dr. Jean Dupont', localisation: 'Bureau 101' },
        { code: 'SE-DIR', nom: 'Secrétariat de Direction', usageCode: 'SERVICE', niveauOrg: 2, ordre: 2, parentCode: 'DIR', localisation: 'Bureau 102' },
        { code: 'CONSEIL', nom: 'Conseil d\'Établissement', usageCode: 'COMMISSION', niveauOrg: 2, ordre: 3, parentCode: 'DIR' },
        { code: 'ENS', nom: 'Enseignement', usageCode: 'DEPARTEMENT', niveauOrg: 1, ordre: 10, responsableNom: 'M. Pierre Mbarga', localisation: 'Bâtiment A' },
        { code: 'CENS', nom: 'Censeur', usageCode: 'SERVICE', niveauOrg: 2, ordre: 11, parentCode: 'ENS', responsableNom: 'M. Pierre Mbarga', localisation: 'Bureau 201' },
        { code: 'DEP-FR', nom: 'Département Français', usageCode: 'DEPARTEMENT', niveauOrg: 2, ordre: 12, parentCode: 'ENS', localisation: 'Salle 103' },
        { code: 'DEP-MATH', nom: 'Département Mathématiques', usageCode: 'DEPARTEMENT', niveauOrg: 2, ordre: 13, parentCode: 'ENS', localisation: 'Salle 104' },
        { code: 'DEP-ANG', nom: 'Département Anglais', usageCode: 'DEPARTEMENT', niveauOrg: 2, ordre: 14, parentCode: 'ENS', localisation: 'Salle 105' },
        { code: 'DEP-SCI', nom: 'Département Sciences', usageCode: 'DEPARTEMENT', niveauOrg: 2, ordre: 15, parentCode: 'ENS', localisation: 'Salle 106' },
        { code: 'DEP-HG', nom: 'Département Histoire-Géo', usageCode: 'DEPARTEMENT', niveauOrg: 2, ordre: 16, parentCode: 'ENS', localisation: 'Salle 107' },
        { code: 'VS', nom: 'Vie Scolaire', usageCode: 'SERVICE', niveauOrg: 1, ordre: 20, responsableNom: 'Mme. Aïcha Mahamat', localisation: 'Bâtiment B' },
        { code: 'SURV', nom: 'Surveillance', usageCode: 'SERVICE', niveauOrg: 2, ordre: 21, parentCode: 'VS', localisation: 'Bureau 301' },
        { code: 'ANIM', nom: 'Animation et Clubs', usageCode: 'EQUIPE', niveauOrg: 2, ordre: 22, parentCode: 'VS', localisation: 'Salle polyvalente' },
        { code: 'SPORT', nom: 'Section Sportive', usageCode: 'SERVICE', niveauOrg: 2, ordre: 23, parentCode: 'VS', localisation: 'Terrain A' },
        { code: 'ADM', nom: 'Administration', usageCode: 'DEPARTEMENT', niveauOrg: 1, ordre: 30, responsableNom: 'Mme. Marie Ngo Mback', localisation: 'Bâtiment C' },
        { code: 'COMPTA', nom: 'Comptabilité', usageCode: 'SERVICE', niveauOrg: 2, ordre: 31, parentCode: 'ADM', localisation: 'Bureau 401' },
        { code: 'SCOLARITE', nom: 'Scolarité', usageCode: 'SERVICE', niveauOrg: 2, ordre: 32, parentCode: 'ADM', localisation: 'Bureau 402' },
        { code: 'INTENDANCE', nom: 'Intendance', usageCode: 'SERVICE', niveauOrg: 2, ordre: 33, parentCode: 'ADM', localisation: 'Bureau 403' },
        { code: 'RH', nom: 'Ressources Humaines', usageCode: 'SERVICE', niveauOrg: 2, ordre: 34, parentCode: 'ADM', localisation: 'Bureau 404' },
        { code: 'INFO', nom: 'Informatique', usageCode: 'SERVICE', niveauOrg: 2, ordre: 35, parentCode: 'ADM', localisation: 'Bureau 405' },
    ];

    const unitesMap = new Map<string, UniteOrganisationnelle>();
    for (const u of unitesData) {
        const existing = await uniteRepo.findOne({ where: { code: u.code, etablissementId } });
        if (existing) {
            unitesMap.set(u.code, existing);
            continue;
        }
        const parent = u.parentCode ? unitesMap.get(u.parentCode) : undefined;
        const unite = uniteRepo.create({
            nom: u.nom,
            code: u.code,
            ordre: u.ordre,
            etablissementId,
            parentId: parent?.id,
            usageUniteId: nomenclatures.usagesUnite.get(u.usageCode),
            niveauOrganisationId: nomenclatures.niveauxOrganisation.get(String(u.niveauOrg)),
            responsableNom: u.responsableNom,
            localisation: u.localisation,
            statut: StatutUnite.ACTIF,
            actif: true,
        });
        const saved = await uniteRepo.save(unite);
        unitesMap.set(u.code, saved);
        logger.info(`  Unité créée: ${saved.nom} (${saved.code})`);
    }

    // --- POSTES ---
    const postesData: PosteSeed[] = [
        { code: 'PROVISEUR', intitule: 'Proviseur', categorieCode: 'DIRECTION', niveauRespCode: 'DIRECTION_GENERALE', fonctionCode: 'PROVISEUR', uniteCode: 'DIR', nombrePostes: 1, missions: ['Diriger l\'établissement', 'Superviser l\'équipe pédagogique', 'Représenter l\'établissement'], competences: ['Management', 'Pédagogie', 'Gestion'] },
        { code: 'PROVISEUR-ADJ', intitule: 'Proviseur Adjoint', categorieCode: 'DIRECTION', niveauRespCode: 'DIRECTION_ADJOINTE', fonctionCode: 'PROVISEUR-ADJ', uniteCode: 'DIR', nombrePostes: 1, missions: ['Assister le proviseur', 'Coordonner les départements'] },
        { code: 'SECRETAIRE-DIR', intitule: 'Secrétaire de Direction', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'EXECUTANT', uniteCode: 'SE-DIR', nombrePostes: 1 },
        { code: 'CENSEUR-PRINCIPAL', intitule: 'Censeur', categorieCode: 'DIRECTION', niveauRespCode: 'RESPONSABLE', fonctionCode: 'CENSEUR', uniteCode: 'CENS', nombrePostes: 1, missions: ['Organiser les emplois du temps', 'Suivre la discipline', 'Coordonner les conseils de classe'] },
        { code: 'CD-FRANCAIS', intitule: 'Chef Département Français', categorieCode: 'ENSEIGNANT', niveauRespCode: 'COORDINATEUR', fonctionCode: 'CDEPT', uniteCode: 'DEP-FR', nombrePostes: 1, missions: ['Coordonner l\'équipe de français', 'Organiser les évaluations'] },
        { code: 'CD-MATHS', intitule: 'Chef Département Mathématiques', categorieCode: 'ENSEIGNANT', niveauRespCode: 'COORDINATEUR', fonctionCode: 'CDEPT', uniteCode: 'DEP-MATH', nombrePostes: 1 },
        { code: 'CD-ANGLAIS', intitule: 'Chef Département Anglais', categorieCode: 'ENSEIGNANT', niveauRespCode: 'COORDINATEUR', fonctionCode: 'CDEPT', uniteCode: 'DEP-ANG', nombrePostes: 1 },
        { code: 'CD-SCIENCES', intitule: 'Chef Département Sciences', categorieCode: 'ENSEIGNANT', niveauRespCode: 'COORDINATEUR', fonctionCode: 'CDEPT', uniteCode: 'DEP-SCI', nombrePostes: 1 },
        { code: 'CD-HG', intitule: 'Chef Département Histoire-Géo', categorieCode: 'ENSEIGNANT', niveauRespCode: 'COORDINATEUR', fonctionCode: 'CDEPT', uniteCode: 'DEP-HG', nombrePostes: 1 },
        { code: 'PROF-FR1', intitule: 'Professeur de Français', categorieCode: 'ENSEIGNANT', niveauRespCode: 'EXECUTANT', fonctionCode: 'PROF-TIT', uniteCode: 'DEP-FR', nombrePostes: 5 },
        { code: 'PROF-MATH1', intitule: 'Professeur de Mathématiques', categorieCode: 'ENSEIGNANT', niveauRespCode: 'EXECUTANT', fonctionCode: 'PROF-TIT', uniteCode: 'DEP-MATH', nombrePostes: 4 },
        { code: 'SURV-GEN', intitule: 'Surveillant Général', categorieCode: 'SERVICE', niveauRespCode: 'RESPONSABLE', fonctionCode: 'SURV-GEN', uniteCode: 'SURV', nombrePostes: 1 },
        { code: 'SURV1', intitule: 'Surveillant', categorieCode: 'SERVICE', niveauRespCode: 'EXECUTANT', fonctionCode: 'SURV', uniteCode: 'SURV', nombrePostes: 6 },
        { code: 'COMPTABLE', intitule: 'Comptable', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'EXECUTANT', fonctionCode: 'COMPTABLE', uniteCode: 'COMPTA', nombrePostes: 1 },
        { code: 'AGENT-COMPTA', intitule: 'Agent Comptable', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'EXECUTANT', fonctionCode: 'AGENT-COMPTA', uniteCode: 'COMPTA', nombrePostes: 2 },
        { code: 'CHEF-SCOLARITE', intitule: 'Chef Scolarité', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'RESPONSABLE', fonctionCode: 'CHEF-SCOL', uniteCode: 'SCOLARITE', nombrePostes: 1 },
        { code: 'AGENT-SCOLARITE', intitule: 'Agent Scolarité', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'EXECUTANT', fonctionCode: 'AGENT-SCOL', uniteCode: 'SCOLARITE', nombrePostes: 3 },
        { code: 'INTENDANT', intitule: 'Intendant', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'RESPONSABLE', fonctionCode: 'INTENDANT', uniteCode: 'INTENDANCE', nombrePostes: 1 },
        { code: 'RESP-RH', intitule: 'Responsable RH', categorieCode: 'ADMINISTRATIF', niveauRespCode: 'RESPONSABLE', fonctionCode: 'RESP-RH', uniteCode: 'RH', nombrePostes: 1 },
        { code: 'TECH-INFO', intitule: 'Technicien Informatique', categorieCode: 'TECHNIQUE', niveauRespCode: 'EXECUTANT', fonctionCode: 'TECH-INFO', uniteCode: 'INFO', nombrePostes: 2 },
        { code: 'ANIMATEUR', intitule: 'Animateur Culturel', categorieCode: 'SERVICE', niveauRespCode: 'EXECUTANT', fonctionCode: 'ANIMATEUR', uniteCode: 'ANIM', nombrePostes: 2 },
        { code: 'COACH-SPORT', intitule: 'Coach Sportif', categorieCode: 'SERVICE', niveauRespCode: 'EXECUTANT', fonctionCode: 'COACH-SPORT', uniteCode: 'SPORT', nombrePostes: 3 },
    ];

    const postesMap = new Map<string, Poste>();
    for (const p of postesData) {
        const existing = await posteRepo.findOne({ where: { code: p.code, uniteOrganisationnelle: { etablissementId } } });
        if (existing) {
            postesMap.set(p.code, existing);
            continue;
        }
        const unite = unitesMap.get(p.uniteCode);
        if (!unite) {
            logger.warn(`  Unité ${p.uniteCode} non trouvée pour le poste ${p.code}, skip`);
            continue;
        }
        const poste = posteRepo.create({
            intitule: p.intitule,
            code: p.code,
            uniteOrganisationnelleId: unite.id,
            categoriePosteId: nomenclatures.categoriesPoste.get(p.categorieCode),
            niveauResponsabiliteId: nomenclatures.niveauxResponsabilite.get(p.niveauRespCode),
            fonctionId: p.fonctionCode ? fonctionsMap.get(p.fonctionCode) : undefined,
            nombrePostes: p.nombrePostes,
            missions: p.missions,
            competencesRequises: p.competences,
            statut: StatutPoste.VACANT,
            actif: true,
        });
        const saved = await posteRepo.save(poste);
        postesMap.set(p.code, saved);
        logger.info(`  Poste créé: ${saved.intitule} (${saved.code})`);
    }

    // --- HIÉRARCHIES ---
    const hierarchies: HierarchieSeed[] = [
        { subCode: 'CENSEUR-PRINCIPAL', supCode: 'PROVISEUR' },
        { subCode: 'CD-FRANCAIS', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'CD-MATHS', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'CD-ANGLAIS', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'CD-SCIENCES', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'CD-HG', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'SURV-GEN', supCode: 'CENSEUR-PRINCIPAL' },
        { subCode: 'SECRETAIRE-DIR', supCode: 'PROVISEUR' },
        { subCode: 'COMPTABLE', supCode: 'PROVISEUR-ADJ' },
        { subCode: 'CHEF-SCOLARITE', supCode: 'PROVISEUR-ADJ' },
        { subCode: 'INTENDANT', supCode: 'PROVISEUR-ADJ' },
        { subCode: 'RESP-RH', supCode: 'PROVISEUR-ADJ' },
        { subCode: 'PROVISEUR-ADJ', supCode: 'PROVISEUR' },
    ];
    const typeRelationSuperviseDirect = nomenclatures.typesRelation.get('SUPERVISE_DIRECT');

    for (const h of hierarchies) {
        const sub = postesMap.get(h.subCode);
        const sup = postesMap.get(h.supCode);
        if (!sub || !sup) continue;

        const existing = await hierRepo.findOne({ where: { posteId: sub.id, superieurId: sup.id } });
        if (existing) continue;

        const hier = hierRepo.create({
            posteId: sub.id,
            superieurId: sup.id,
            typeRelationId: typeRelationSuperviseDirect,
            uniteOrganisationnelleId: sub.uniteOrganisationnelleId,
            statut: StatutRelation.ACTIVE,
            actif: true,
            dateDebut: new Date(),
        });
        await hierRepo.save(hier);
        logger.info(`  Hiérarchie: ${sub.code} → ${sup.code}`);
    }

    logger.info(`✅ Organisation seedée pour ${nomEtablissement}`);
    logger.info(`   ${fonctionsMap.size} fonctions, ${unitesMap.size} unités, ${postesMap.size} postes, ${hierarchies.length} hiérarchies`);
}
