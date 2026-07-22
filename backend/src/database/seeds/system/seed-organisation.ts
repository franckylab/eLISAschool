/**
 * ==================================
 * eLISAschool - Seed Organisation
 * ==================================
 * Version: 2.0.0
 *
 * Crée les unités, postes et hiérarchies
 * pour les 2 établissements par défaut
 * (rattachées directement à l'établissement)
 */

import { AppDataSource } from '../../data-source';
import { UniteOrganisationnelle, StatutUnite } from '@modules/organisation/entities/unite-organisationnelle.entity';
import { Poste, StatutPoste } from '@modules/organisation/entities/poste.entity';
import { HierarchiePersonnel, StatutRelation } from '@modules/organisation/entities/hierarchie-personnel.entity';
import { logger } from '@common/utils/logger.util';

interface UniteSeed {
    code: string;
    nom: string;
    typeCode: string;
    ordre: number;
    parentCode?: string;
    responsableNom?: string;
    localisation?: string;
}

interface PosteSeed {
    code: string;
    intitule: string;
    typeCode: string;
    niveauCode: string;
    uniteCode: string;
    nombrePostes: number;
    missions?: string[];
    competences?: string[];
}

export async function seedOrganisation(etablissementId: string, nomEtablissement: string): Promise<void> {
    const uniteRepo = AppDataSource.getRepository(UniteOrganisationnelle);
    const posteRepo = AppDataSource.getRepository(Poste);
    const hierRepo = AppDataSource.getRepository(HierarchiePersonnel);

    const prefix = nomEtablissement.includes('Lycée') ? 'LB' : 'CP';

    const unitesData: UniteSeed[] = [
        { code: 'DIR', nom: 'Direction', typeCode: 'DIRECTION', ordre: 1, responsableNom: 'Dr. Jean Dupont', localisation: 'Bureau 101' },
        { code: 'SE-DIR', nom: 'Secrétariat de Direction', typeCode: 'SERVICE', ordre: 2, parentCode: 'DIR', localisation: 'Bureau 102' },
        { code: 'CONSEIL', nom: 'Conseil d\'Établissement', typeCode: 'COMMISSION', ordre: 3, parentCode: 'DIR' },

        { code: 'ENS', nom: 'Enseignement', typeCode: 'DEPARTEMENT', ordre: 10, responsableNom: 'M. Pierre Mbarga', localisation: 'Bâtiment A' },
        { code: 'CENS', nom: 'Censeur', typeCode: 'SERVICE', ordre: 11, parentCode: 'ENS', responsableNom: 'M. Pierre Mbarga', localisation: 'Bureau 201' },
        { code: 'DEP-FR', nom: 'Département Français', typeCode: 'DEPARTEMENT', ordre: 12, parentCode: 'ENS', localisation: 'Salle 103' },
        { code: 'DEP-MATH', nom: 'Département Mathématiques', typeCode: 'DEPARTEMENT', ordre: 13, parentCode: 'ENS', localisation: 'Salle 104' },
        { code: 'DEP-ANG', nom: 'Département Anglais', typeCode: 'DEPARTEMENT', ordre: 14, parentCode: 'ENS', localisation: 'Salle 105' },
        { code: 'DEP-SCI', nom: 'Département Sciences', typeCode: 'DEPARTEMENT', ordre: 15, parentCode: 'ENS', localisation: 'Salle 106' },
        { code: 'DEP-HG', nom: 'Département Histoire-Géo', typeCode: 'DEPARTEMENT', ordre: 16, parentCode: 'ENS', localisation: 'Salle 107' },

        { code: 'VS', nom: 'Vie Scolaire', typeCode: 'SERVICE', ordre: 20, responsableNom: 'Mme. Aïcha Mahamat', localisation: 'Bâtiment B' },
        { code: 'SURV', nom: 'Surveillance', typeCode: 'SERVICE', ordre: 21, parentCode: 'VS', localisation: 'Bureau 301' },
        { code: 'ANIM', nom: 'Animation et Clubs', typeCode: 'EQUIPE', ordre: 22, parentCode: 'VS', localisation: 'Salle polyvalente' },
        { code: 'SPORT', nom: 'Section Sportive', typeCode: 'SERVICE', ordre: 23, parentCode: 'VS', localisation: 'Terrain A' },

        { code: 'ADM', nom: 'Administration', typeCode: 'DEPARTEMENT', ordre: 30, responsableNom: 'Mme. Marie Ngo Mback', localisation: 'Bâtiment C' },
        { code: 'COMPTA', nom: 'Comptabilité', typeCode: 'SERVICE', ordre: 31, parentCode: 'ADM', localisation: 'Bureau 401' },
        { code: 'SCOLARITE', nom: 'Scolarité', typeCode: 'SERVICE', ordre: 32, parentCode: 'ADM', localisation: 'Bureau 402' },
        { code: 'INTENDANCE', nom: 'Intendance', typeCode: 'SERVICE', ordre: 33, parentCode: 'ADM', localisation: 'Bureau 403' },
        { code: 'RH', nom: 'Ressources Humaines', typeCode: 'SERVICE', ordre: 34, parentCode: 'ADM', localisation: 'Bureau 404' },
        { code: 'INFO', nom: 'Informatique', typeCode: 'SERVICE', ordre: 35, parentCode: 'ADM', localisation: 'Bureau 405' },
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
        { code: 'PROVISEUR', intitule: 'Proviseur', typeCode: 'DIRECTION',         niveauCode: 'DIRECTION_GENERALE', uniteCode: 'DIR', nombrePostes: 1, missions: ['Diriger l\'établissement', 'Superviser l\'équipe pédagogique', 'Représenter l\'établissement'], competences: ['Management', 'Pédagogie', 'Gestion'] },
        { code: 'PROVISEUR-ADJ', intitule: 'Proviseur Adjoint', typeCode: 'DIRECTION',         niveauCode: 'DIRECTION_ADJOINTE', uniteCode: 'DIR', nombrePostes: 1, missions: ['Assister le proviseur', 'Coordonner les départements'] },
        { code: 'SECRETAIRE-DIR', intitule: 'Secrétaire de Direction', typeCode: 'ADMINISTRATIF',         niveauCode: 'EXECUTANT', uniteCode: 'SE-DIR', nombrePostes: 1 },
        { code: 'CENSEUR-PRINCIPAL', intitule: 'Censeur', typeCode: 'DIRECTION',         niveauCode: 'RESPONSABLE', uniteCode: 'CENS', nombrePostes: 1, missions: ['Organiser les emplois du temps', 'Suivre la discipline', 'Coordonner les conseils de classe'] },
        { code: 'CD-FRANCAIS', intitule: 'Chef Département Français', typeCode: 'ENSEIGNANT',         niveauCode: 'COORDINATEUR', uniteCode: 'DEP-FR', nombrePostes: 1, missions: ['Coordonner l\'équipe de français', 'Organiser les évaluations'] },
        { code: 'CD-MATHS', intitule: 'Chef Département Mathématiques', typeCode: 'ENSEIGNANT',         niveauCode: 'COORDINATEUR', uniteCode: 'DEP-MATH', nombrePostes: 1 },
        { code: 'CD-ANGLAIS', intitule: 'Chef Département Anglais', typeCode: 'ENSEIGNANT',         niveauCode: 'COORDINATEUR', uniteCode: 'DEP-ANG', nombrePostes: 1 },
        { code: 'CD-SCIENCES', intitule: 'Chef Département Sciences', typeCode: 'ENSEIGNANT',         niveauCode: 'COORDINATEUR', uniteCode: 'DEP-SCI', nombrePostes: 1 },
        { code: 'CD-HG', intitule: 'Chef Département Histoire-Géo', typeCode: 'ENSEIGNANT',         niveauCode: 'COORDINATEUR', uniteCode: 'DEP-HG', nombrePostes: 1 },
        { code: 'PROF-FR1', intitule: 'Professeur de Français', typeCode: 'ENSEIGNANT',         niveauCode: 'EXECUTANT', uniteCode: 'DEP-FR', nombrePostes: 5 },
        { code: 'PROF-MATH1', intitule: 'Professeur de Mathématiques', typeCode: 'ENSEIGNANT',         niveauCode: 'EXECUTANT', uniteCode: 'DEP-MATH', nombrePostes: 4 },
        { code: 'SURV-GEN', intitule: 'Surveillant Général', typeCode: 'ADMINISTRATIF',         niveauCode: 'RESPONSABLE', uniteCode: 'SURV', nombrePostes: 1 },
        { code: 'SURV1', intitule: 'Surveillant', typeCode: 'ADMINISTRATIF',         niveauCode: 'EXECUTANT', uniteCode: 'SURV', nombrePostes: 6 },
        { code: 'COMPTABLE', intitule: 'Comptable', typeCode: 'ADMINISTRATIF',         niveauCode: 'EXECUTANT', uniteCode: 'COMPTA', nombrePostes: 1 },
        { code: 'AGENT-COMPTA', intitule: 'Agent Comptable', typeCode: 'ADMINISTRATIF',         niveauCode: 'EXECUTANT', uniteCode: 'COMPTA', nombrePostes: 2 },
        { code: 'CHEF-SCOLARITE', intitule: 'Chef Scolarité', typeCode: 'ADMINISTRATIF',         niveauCode: 'RESPONSABLE', uniteCode: 'SCOLARITE', nombrePostes: 1 },
        { code: 'AGENT-SCOLARITE', intitule: 'Agent Scolarité', typeCode: 'ADMINISTRATIF',         niveauCode: 'EXECUTANT', uniteCode: 'SCOLARITE', nombrePostes: 3 },
        { code: 'INTENDANT', intitule: 'Intendant', typeCode: 'ADMINISTRATIF',         niveauCode: 'RESPONSABLE', uniteCode: 'INTENDANCE', nombrePostes: 1 },
        { code: 'RESP-RH', intitule: 'Responsable RH', typeCode: 'ADMINISTRATIF',         niveauCode: 'RESPONSABLE', uniteCode: 'RH', nombrePostes: 1 },
        { code: 'TECH-INFO', intitule: 'Technicien Informatique', typeCode: 'TECHNIQUE',         niveauCode: 'EXECUTANT', uniteCode: 'INFO', nombrePostes: 2 },
        { code: 'ANIMATEUR', intitule: 'Animateur Culturel', typeCode: 'SERVICE',         niveauCode: 'EXECUTANT', uniteCode: 'ANIM', nombrePostes: 2 },
        { code: 'COACH-SPORT', intitule: 'Coach Sportif', typeCode: 'SERVICE',         niveauCode: 'EXECUTANT', uniteCode: 'SPORT', nombrePostes: 3 },
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
            nombrePostes: p.nombrePostes,
            missions: p.missions,
            competencesRequises: p.competences,
            statut: StatutPoste.VACANT,
            actif: true,
        });
        const saved = await posteRepo.save(poste);
        postesMap.set(p.code, saved);
        logger.info(`  Poste créé: ${saved.intitule} (${saved.code}) [${saved.statut}]`);
    }

    const hierarchies = [
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

    for (const h of hierarchies) {
        const sub = postesMap.get(h.subCode);
        const sup = postesMap.get(h.supCode);
        if (!sub || !sup) continue;

        const existing = await hierRepo.findOne({ where: { posteId: sub.id, superieurId: sup.id } });
        if (existing) continue;

        const hier = hierRepo.create({
            statut: StatutRelation.ACTIVE,
            actif: true,
            posteId: sub.id,
            uniteOrganisationnelleId: sub.uniteOrganisationnelleId,
            dateDebut: new Date(),
        });
        await hierRepo.save(hier);
        logger.info(`  Hiérarchie: poste ${sub.code} → poste ${sup.code}`);
    }

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
