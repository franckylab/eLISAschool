/**
 * ==================================
 * eLISAschool - Seed Organisation
 * ==================================
 * Version: 1.0.0
 *
 * Crée les organisations, unités, postes et hiérarchies
 * pour les 2 établissements par défaut
 */

import { AppDataSource } from '../../data-source';
import { Organisation, TypeOrganisation, StatutOrganisation } from '@modules/organisation/entities/organisation.entity';
import { UniteOrganisationnelle, TypeUniteOrganisationnelle, StatutUnite } from '@modules/organisation/entities/unite-organisationnelle.entity';
import { Poste, NiveauResponsabiliteEnum, StatutPoste } from '@modules/organisation/entities/poste.entity';
import { TypePersonnel } from '@modules/personnel/entities';
import { HierarchiePersonnel, TypeRelationHierarchique, StatutRelation } from '@modules/organisation/entities/hierarchie-personnel.entity';
import { logger } from '@common/utils/logger.util';

interface UniteSeed {
    code: string;
    nom: string;
    type: TypeUniteOrganisationnelle;
    ordre: number;
    parentCode?: string;
    responsableNom?: string;
    localisation?: string;
}

interface PosteSeed {
    code: string;
    intitule: string;
    typeCode: string;
    niveau: NiveauResponsabiliteEnum;
    uniteCode: string;
    occupantNom?: string;
    occupantPrenom?: string;
    nombrePostes: number;
    missions?: string[];
    competences?: string[];
}

export async function seedOrganisation(etablissementId: string, nomEtablissement: string): Promise<void> {
    const orgRepo = AppDataSource.getRepository(Organisation);
    const uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
    const posteRepo = AppDataSource.getRepository(Poste);
    const hierRepo = AppDataSource.getRepository(HierarchiePersonnel);

    const prefix = nomEtablissement.includes('Lycée') ? 'LB' : 'CP';

    let organisation = await orgRepo.findOne({ where: { etablissementId } });
    if (!organisation) {
        organisation = orgRepo.create({
            nom: nomEtablissement,
            code: `ORG-${prefix}`,
            type: TypeOrganisation.ETABLISSEMENT_SCOLAIRE,
            statut: StatutOrganisation.ACTIF,
            actif: true,
            etablissementId,
            description: `Organisation structurelle de ${nomEtablissement}`,
        });
        await orgRepo.save(organisation);
        logger.info(`Organisation créée: ${organisation.nom}`);
    } else {
        // Mettre à jour nom/code si différent
        if (organisation.code !== `ORG-${prefix}` || organisation.nom !== nomEtablissement) {
            organisation.nom = nomEtablissement;
            organisation.code = `ORG-${prefix}`;
            await orgRepo.save(organisation);
        }
        logger.info(`Organisation déjà existante: ${organisation.nom}`);
    }

    const unitesData: UniteSeed[] = [
        { code: 'DIR', nom: 'Direction', type: TypeUniteOrganisationnelle.DIRECTION, ordre: 1, responsableNom: 'Dr. Jean Dupont', localisation: 'Bureau 101' },
        { code: 'SE-DIR', nom: 'Secrétariat de Direction', type: TypeUniteOrganisationnelle.SERVICE, ordre: 2, parentCode: 'DIR', localisation: 'Bureau 102' },
        { code: 'CONSEIL', nom: 'Conseil d\'Établissement', type: TypeUniteOrganisationnelle.COMMISSION, ordre: 3, parentCode: 'DIR' },

        { code: 'ENS', nom: 'Enseignement', type: TypeUniteOrganisationnelle.DEPARTEMENT, ordre: 10, responsableNom: 'M. Pierre Mbarga', localisation: 'Bâtiment A' },
        { code: 'CENS', nom: 'Censeur', type: TypeUniteOrganisationnelle.SERVICE, ordre: 11, parentCode: 'ENS', responsableNom: 'M. Pierre Mbarga', localisation: 'Bureau 201' },
        { code: 'DEP-FR', nom: 'Département Français', type: TypeUniteOrganisationnelle.POLE, ordre: 12, parentCode: 'ENS', localisation: 'Salle 103' },
        { code: 'DEP-MATH', nom: 'Département Mathématiques', type: TypeUniteOrganisationnelle.POLE, ordre: 13, parentCode: 'ENS', localisation: 'Salle 104' },
        { code: 'DEP-ANG', nom: 'Département Anglais', type: TypeUniteOrganisationnelle.POLE, ordre: 14, parentCode: 'ENS', localisation: 'Salle 105' },
        { code: 'DEP-SCI', nom: 'Département Sciences', type: TypeUniteOrganisationnelle.POLE, ordre: 15, parentCode: 'ENS', localisation: 'Salle 106' },
        { code: 'DEP-HG', nom: 'Département Histoire-Géo', type: TypeUniteOrganisationnelle.POLE, ordre: 16, parentCode: 'ENS', localisation: 'Salle 107' },

        { code: 'VS', nom: 'Vie Scolaire', type: TypeUniteOrganisationnelle.SERVICE, ordre: 20, responsableNom: 'Mme. Aïcha Mahamat', localisation: 'Bâtiment B' },
        { code: 'SURV', nom: 'Surveillance', type: TypeUniteOrganisationnelle.SERVICE, ordre: 21, parentCode: 'VS', localisation: 'Bureau 301' },
        { code: 'ANIM', nom: 'Animation et Clubs', type: TypeUniteOrganisationnelle.POLE, ordre: 22, parentCode: 'VS', localisation: 'Salle polyvalente' },
        { code: 'SPORT', nom: 'Section Sportive', type: TypeUniteOrganisationnelle.SECTION, ordre: 23, parentCode: 'VS', localisation: 'Terrain A' },

        { code: 'ADM', nom: 'Administration', type: TypeUniteOrganisationnelle.DEPARTEMENT, ordre: 30, responsableNom: 'Mme. Marie Ngo Mback', localisation: 'Bâtiment C' },
        { code: 'COMPTA', nom: 'Comptabilité', type: TypeUniteOrganisationnelle.SERVICE, ordre: 31, parentCode: 'ADM', localisation: 'Bureau 401' },
        { code: 'SCOLARITE', nom: 'Scolarité', type: TypeUniteOrganisationnelle.SERVICE, ordre: 32, parentCode: 'ADM', localisation: 'Bureau 402' },
        { code: 'INTENDANCE', nom: 'Intendance', type: TypeUniteOrganisationnelle.SERVICE, ordre: 33, parentCode: 'ADM', localisation: 'Bureau 403' },
        { code: 'RH', nom: 'Ressources Humaines', type: TypeUniteOrganisationnelle.SERVICE, ordre: 34, parentCode: 'ADM', localisation: 'Bureau 404' },
        { code: 'INFO', nom: 'Informatique', type: TypeUniteOrganisationnelle.POLE, ordre: 35, parentCode: 'ADM', localisation: 'Bureau 405' },
    ];

    const unitesMap = new Map<string, UniteOrganisationnelle>();
    for (const u of unitesData) {
        const existing = await uniteRepo.findOne({ where: { code: u.code, organisationId: organisation.id } });
        if (existing) {
            unitesMap.set(u.code, existing);
            continue;
        }
        const parent = u.parentCode ? unitesMap.get(u.parentCode) : undefined;
        const unite = uniteRepo.create({
            nom: u.nom,
            code: u.code,
            type: u.type,
            ordre: u.ordre,
            organisationId: organisation.id,
            parentId: parent?.id,
            responsableNom: u.responsableNom,
            localisation: u.localisation,
            statut: StatutUnite.ACTIF,
            actif: true,
        });
        const saved = await uniteRepo.save(unite);
        unitesMap.set(u.code, saved);
        logger.info(`  Unité créée: ${saved.nom} (${saved.code})`);
    }

    const postesData: PosteSeed[] = [
        { code: 'PROVISEUR', intitule: 'Proviseur', typeCode: 'DIRECTION',         niveau: NiveauResponsabiliteEnum.DIRECTION_GENERALE, uniteCode: 'DIR', occupantNom: 'Jean', occupantPrenom: 'Dupont', nombrePostes: 1, missions: ['Diriger l\'établissement', 'Superviser l\'équipe pédagogique', 'Représenter l\'établissement'], competences: ['Management', 'Pédagogie', 'Gestion'] },
        { code: 'PROVISEUR-ADJ', intitule: 'Proviseur Adjoint', typeCode: 'DIRECTION',         niveau: NiveauResponsabiliteEnum.DIRECTION_ADJOINTE, uniteCode: 'DIR', occupantNom: 'Marie', occupantPrenom: 'Ngo Mback', nombrePostes: 1, missions: ['Assister le proviseur', 'Coordonner les départements'] },
        { code: 'SECRETAIRE-DIR', intitule: 'Secrétaire de Direction', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'SE-DIR', occupantNom: 'Brigitte', occupantPrenom: 'Ekoa', nombrePostes: 1 },
        { code: 'CENSEUR-PRINCIPAL', intitule: 'Censeur', typeCode: 'DIRECTION',         niveau: NiveauResponsabiliteEnum.RESPONSABLE, uniteCode: 'CENS', occupantNom: 'Pierre', occupantPrenom: 'Mbarga', nombrePostes: 1, missions: ['Organiser les emplois du temps', 'Suivre la discipline', 'Coordonner les conseils de classe'] },
        { code: 'CD-FRANCAIS', intitule: 'Chef Département Français', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.COORDINATEUR, uniteCode: 'DEP-FR', occupantNom: 'Paul', occupantPrenom: 'Biyé', nombrePostes: 1, missions: ['Coordonner l\'équipe de français', 'Organiser les évaluations'] },
        { code: 'CD-MATHS', intitule: 'Chef Département Mathématiques', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.COORDINATEUR, uniteCode: 'DEP-MATH', occupantNom: 'Joseph', occupantPrenom: 'Tagne', nombrePostes: 1 },
        { code: 'CD-ANGLAIS', intitule: 'Chef Département Anglais', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.COORDINATEUR, uniteCode: 'DEP-ANG', occupantNom: 'Susan', occupantPrenom: 'Foncha', nombrePostes: 1 },
        { code: 'CD-SCIENCES', intitule: 'Chef Département Sciences', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.COORDINATEUR, uniteCode: 'DEP-SCI', occupantNom: 'David', occupantPrenom: 'Ekodo', nombrePostes: 1 },
        { code: 'CD-HG', intitule: 'Chef Département Histoire-Géo', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.COORDINATEUR, uniteCode: 'DEP-HG', occupantNom: 'François', occupantPrenom: 'Mbida', nombrePostes: 1 },
        { code: 'PROF-FR1', intitule: 'Professeur de Français', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'DEP-FR', nombrePostes: 5 },
        { code: 'PROF-MATH1', intitule: 'Professeur de Mathématiques', typeCode: 'ENSEIGNANT',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'DEP-MATH', nombrePostes: 4 },
        { code: 'SURV-GEN', intitule: 'Surveillant Général', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.RESPONSABLE, uniteCode: 'SURV', occupantNom: 'Aïcha', occupantPrenom: 'Mahamat', nombrePostes: 1 },
        { code: 'SURV1', intitule: 'Surveillant', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'SURV', nombrePostes: 6 },
        { code: 'COMPTABLE', intitule: 'Comptable', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'COMPTA', occupantNom: 'Thomas', occupantPrenom: 'Ndongo', nombrePostes: 1 },
        { code: 'AGENT-COMPTA', intitule: 'Agent Comptable', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'COMPTA', nombrePostes: 2 },
        { code: 'CHEF-SCOLARITE', intitule: 'Chef Scolarité', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.RESPONSABLE, uniteCode: 'SCOLARITE', occupantNom: 'Claire', occupantPrenom: 'Onguene', nombrePostes: 1 },
        { code: 'AGENT-SCOLARITE', intitule: 'Agent Scolarité', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'SCOLARITE', nombrePostes: 3 },
        { code: 'INTENDANT', intitule: 'Intendant', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.RESPONSABLE, uniteCode: 'INTENDANCE', nombrePostes: 1 },
        { code: 'RESP-RH', intitule: 'Responsable RH', typeCode: 'ADMINISTRATIF',         niveau: NiveauResponsabiliteEnum.RESPONSABLE, uniteCode: 'RH', nombrePostes: 1 },
        { code: 'TECH-INFO', intitule: 'Technicien Informatique', typeCode: 'TECHNIQUE',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'INFO', nombrePostes: 2 },
        { code: 'ANIMATEUR', intitule: 'Animateur Culturel', typeCode: 'SERVICE',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'ANIM', nombrePostes: 2 },
        { code: 'COACH-SPORT', intitule: 'Coach Sportif', typeCode: 'SERVICE',         niveau: NiveauResponsabiliteEnum.EXECUTANT, uniteCode: 'SPORT', nombrePostes: 3 },
    ];

    const typesPersonnel = await AppDataSource.getRepository(TypePersonnel).find();
    const typePersonnelMap = new Map(typesPersonnel.map(tp => [tp.code, tp.id]));

    const postesMap = new Map<string, Poste>();
    for (const p of postesData) {
        const existing = await posteRepo.findOne({ where: { code: p.code, uniteOrganisationnelle: { organisationId: organisation.id } } });
        if (existing) {
            postesMap.set(p.code, existing);
            continue;
        }
        const unite = unitesMap.get(p.uniteCode);
        if (!unite) {
            logger.warn(`  Unité ${p.uniteCode} non trouvée pour le poste ${p.code}, skip`);
            continue;
        }
        const occupantNom = p.occupantNom && p.occupantPrenom ? `${p.occupantPrenom} ${p.occupantNom}` : undefined;
        const poste = posteRepo.create({
            intitulé: p.intitule,
            code: p.code,
            typePersonnelId: typePersonnelMap.get(p.typeCode),
            niveauResponsabilite: p.niveau,
            uniteOrganisationnelleId: unite.id,
            occupantNom,
            occupantId: undefined, // Ne pas créer de faux IDs — FK vers membres_personnel
            nombrePostes: p.nombrePostes,
            missions: p.missions,
            competencesRequises: p.competences,
            statut: occupantNom ? StatutPoste.ACTIF : StatutPoste.VACANT,
            actif: true,
        });
        const saved = await posteRepo.save(poste);
        postesMap.set(p.code, saved);
        logger.info(`  Poste créé: ${saved.intitulé} (${saved.code}) [${saved.statut}]`);
    }

    const hierarchies = [
        { subCode: 'CENSEUR-PRINCIPAL', supCode: 'PROVISEUR', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CD-FRANCAIS', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CD-MATHS', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CD-ANGLAIS', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CD-SCIENCES', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CD-HG', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'SURV-GEN', supCode: 'CENSEUR-PRINCIPAL', type: TypeRelationHierarchique.SUPERVISE_INDIRECT },
        { subCode: 'SECRETAIRE-DIR', supCode: 'PROVISEUR', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'COMPTABLE', supCode: 'PROVISEUR-ADJ', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'CHEF-SCOLARITE', supCode: 'PROVISEUR-ADJ', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'INTENDANT', supCode: 'PROVISEUR-ADJ', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'RESP-RH', supCode: 'PROVISEUR-ADJ', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
        { subCode: 'PROVISEUR-ADJ', supCode: 'PROVISEUR', type: TypeRelationHierarchique.SUPERVISE_DIRECT },
    ];

    for (const h of hierarchies) {
        const sub = postesMap.get(h.subCode);
        const sup = postesMap.get(h.supCode);
        if (!sub || !sup || !sub.occupantNom || !sup.occupantNom) continue;
        if (!sub.occupantId || !sup.occupantId) continue;

        const existing = await hierRepo.findOne({ where: { personnelId: sub.occupantId, superieurId: sup.occupantId } });
        if (existing) continue;

        const hier = hierRepo.create({
            personnelId: sub.occupantId,
            personnelNom: sub.occupantNom,
            superieurId: sup.occupantId,
            superieurNom: sup.occupantNom,
            typeRelation: h.type,
            statut: StatutRelation.ACTIVE,
            actif: true,
            posteId: sub.id,
            posteIntitule: sub.intitulé,
            uniteOrganisationnelleId: sub.uniteOrganisationnelleId,
            uniteNom: unitesMap.get([...unitesMap.entries()].find(([, u]) => u.id === sub.uniteOrganisationnelleId)?.[0] ?? '')?.nom,
            dateDebut: new Date(),
        });
        await hierRepo.save(hier);
        logger.info(`  Hiérarchie: ${sub.occupantNom} → ${sup.occupantNom} (${h.type})`);
    }

    await orgRepo.save(organisation);

    logger.info(`✅ Organisation seedée pour ${nomEtablissement}`);
    logger.info(`   ${unitesMap.size} unités, ${postesMap.size} postes, ${hierarchies.length} relations hiérarchiques`);
}

export async function seedOrganisations(): Promise<void> {
    const etabRepo = AppDataSource.getRepository('Etablissement');
    const etablissements = await etabRepo.find() as any[];

    for (const etab of etablissements) {
        await seedOrganisation(etab.id, etab.nom);
    }
}

export default seedOrganisations;
