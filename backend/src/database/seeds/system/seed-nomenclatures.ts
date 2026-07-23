import { AppDataSource } from '@database/data-source';
import { CategoriePoste } from '@modules/organisation/entities/categorie-poste.entity';
import { NiveauOrganisation } from '@modules/organisation/entities/niveau-organisation.entity';
import { NiveauResponsabilite } from '@modules/organisation/entities/niveau-responsabilite.entity';
import { UsageUnite } from '@modules/organisation/entities/usage-unite.entity';
import { TypeRelationHierarchique } from '@modules/organisation/entities/type-relation-hierarchique.entity';
import { ModeRemunerationEntity } from '@modules/organisation/entities/mode-remuneration.entity';
import { logger } from '@common/utils/logger.util';

async function upsertAll<T extends { id: string }>(
    repo: import('typeorm').Repository<T>,
    rows: Partial<T>[],
    matchKey: keyof T,
): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    for (const row of rows) {
        const where = { [matchKey]: row[matchKey] } as any;
        if ((row as any).etablissementId) where.etablissementId = (row as any).etablissementId;
        const existing = await repo.findOne({ where } as any);
        if (existing) {
            map.set(String(row[matchKey]), existing.id);
            continue;
        }
        const saved = await repo.save(repo.create(row as T));
        map.set(String(row[matchKey]), saved.id);
    }
    return map;
}

export async function seedNomenclatures(): Promise<{
    categoriesPoste: Map<string, string>;
    niveauxOrganisation: Map<string, string>;
    niveauxResponsabilite: Map<string, string>;
    usagesUnite: Map<string, string>;
    typesRelation: Map<string, string>;
    modesRemuneration: Map<string, string>;
}> {
    logger.info('📋 Seed des nomenclatures organisation (globales)...');

    // 1. Catégories de poste
    // Note: les codes sont distincts de TypePersonnel pour éviter la confusion sémantique.
    // Seul DIRECTION est intentionnellement partagé (un directeur occupant un poste de direction).
    const catRepo = AppDataSource.getRepository(CategoriePoste);
    const categoriesPoste = await upsertAll(catRepo, [
        { code: 'DIRECTION', label: 'Direction', description: 'Postes de direction et d\'encadrement supérieur', estSysteme: true },
        { code: 'ENSEIGNEMENT', label: 'Enseignement', description: 'Postes d\'enseignement et de formation', estSysteme: true },
        { code: 'ENCADREMENT', label: 'Encadrement éducatif', description: 'Postes de surveillance, animation et éducation', estSysteme: true },
        { code: 'ADMINISTRATIF', label: 'Administratif', description: 'Postes administratifs et de gestion', estSysteme: true },
        { code: 'TECHNIQUE', label: 'Technique', description: 'Postes techniques et maintenance', estSysteme: true },
        { code: 'DOCUMENTATION', label: 'Documentation', description: 'Postes de documentation et bibliothèque', estSysteme: true },
        { code: 'ORIENTATION', label: 'Orientation', description: 'Postes d\'orientation et conseil', estSysteme: true },
        { code: 'SANTE', label: 'Santé', description: 'Postes médicaux et paramédicaux', estSysteme: true },
        { code: 'SOCIAL', label: 'Social', description: 'Postes d\'assistance sociale et d\'accompagnement', estSysteme: true },
    ], 'code');
    logger.info(`   Catégories poste: ${categoriesPoste.size}`);

    // 2. Niveaux d'organisation
    const nivRepo = AppDataSource.getRepository(NiveauOrganisation);
    const niveauxOrganisation = await upsertAll(nivRepo, [
        { niveau: 0, label: 'Établissement', description: 'Niveau établissement (racine)', estSysteme: true },
        { niveau: 1, label: 'Direction', description: 'Direction et services rattachés', estSysteme: true },
        { niveau: 2, label: 'Département / Service', description: 'Départements pédagogiques et services administratifs', estSysteme: true },
        { niveau: 3, label: 'Sous-service / Équipe', description: 'Sous-services, équipes et cellules', estSysteme: true },
    ], 'niveau');
    logger.info(`   Niveaux organisation: ${niveauxOrganisation.size}`);

    // 3. Niveaux de responsabilité
    const respRepo = AppDataSource.getRepository(NiveauResponsabilite);
    const niveauxResponsabilite = await upsertAll(respRepo, [
        { code: 'DIRECTION_GENERALE', niveau: 0, label: 'Direction Générale', description: 'Responsable principal de l\'établissement', estSysteme: true },
        { code: 'DIRECTION_ADJOINTE', niveau: 1, label: 'Direction Adjointe', description: 'Adjoint à la direction', estSysteme: true },
        { code: 'RESPONSABLE', niveau: 2, label: 'Responsable', description: 'Chef de service ou département', estSysteme: true },
        { code: 'COORDINATEUR', niveau: 3, label: 'Coordinateur', description: 'Coordinateur pédagogique ou administratif', estSysteme: true },
        { code: 'SUPERVISEUR', niveau: 4, label: 'Superviseur', description: 'Superviseur d\'équipe ou de zone', estSysteme: true },
        { code: 'EXECUTANT', niveau: 5, label: 'Exécutant', description: 'Personnel exécutant', estSysteme: true },
        { code: 'STAGIAIRE', niveau: 6, label: 'Stagiaire', description: 'Personnel en stage ou formation', estSysteme: true },
    ], 'code');
    logger.info(`   Niveaux responsabilité: ${niveauxResponsabilite.size}`);

    // 4. Usages d'unité
    const usageRepo = AppDataSource.getRepository(UsageUnite);
    const usagesUnite = await upsertAll(usageRepo, [
        { code: 'DIRECTION', label: 'Direction', description: 'Unité de direction générale', estSysteme: true },
        { code: 'DEPARTEMENT', label: 'Département', description: 'Département pédagogique ou administratif', estSysteme: true },
        { code: 'SERVICE', label: 'Service', description: 'Service spécialisé', estSysteme: true },
        { code: 'COMMISSION', label: 'Commission', description: 'Commission ou comité', estSysteme: true },
        { code: 'EQUIPE', label: 'Équipe', description: 'Équipe ou cellule de travail', estSysteme: true },
        { code: 'ATELIER', label: 'Atelier', description: 'Atelier technique ou artistique', estSysteme: true },
        { code: 'BUREAU', label: 'Bureau', description: 'Bureau ou unité administrative', estSysteme: true },
        { code: 'LABORATOIRE', label: 'Laboratoire', description: 'Laboratoire scientifique', estSysteme: true },
        { code: 'BIBLIOTHEQUE', label: 'Bibliothèque', description: 'Bibliothèque ou centre de documentation', estSysteme: true },
    ], 'code');
    logger.info(`   Usages unité: ${usagesUnite.size}`);

    // 5. Types de relation hiérarchique
    const typeRelRepo = AppDataSource.getRepository(TypeRelationHierarchique);
    const typesRelation = await upsertAll(typeRelRepo, [
        { code: 'SUPERVISE_DIRECT', label: 'Supervise directement', description: 'Relation de supervision directe (N+1)', estSysteme: true },
        { code: 'SUPERVISE_INDIRECT', label: 'Supervise indirectement', description: 'Relation de supervision indirecte (N+2+)', estSysteme: true },
        { code: 'RAPPORTE_A', label: 'Rapporte à', description: 'Relation fonctionnelle (reporting)', estSysteme: true },
    ], 'code');
    logger.info(`   Types relation: ${typesRelation.size}`);

    // 6. Modes de rémunération
    const modeRemRepo = AppDataSource.getRepository(ModeRemunerationEntity);
    const modesRemuneration = await upsertAll(modeRemRepo, [
        { code: 'MENSUEL', label: 'Mensuel', description: 'Salaire fixe mensuel', estSysteme: true },
        { code: 'HORAIRE', label: 'Horaire', description: 'Rémunération à l\'heure', estSysteme: true },
        { code: 'MIXTE', label: 'Mixte', description: 'Fixe + heures supplémentaires', estSysteme: true },
        { code: 'HEBDOMADAIRE', label: 'Hebdomadaire', description: 'Rémunération hebdomadaire lissée sur l\'année', estSysteme: true },
    ], 'code');
    logger.info(`   Modes rémunération: ${modesRemuneration.size}`);

    logger.info('✅ Nomenclatures globales seedées');
    return { categoriesPoste, niveauxOrganisation, niveauxResponsabilite, usagesUnite, typesRelation, modesRemuneration };
}
