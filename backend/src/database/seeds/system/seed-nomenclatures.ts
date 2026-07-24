import { AppDataSource } from '@database/data-source';
import { EchelonStructurel } from '@modules/organisation/entities/echelon-structurel.entity';
import { NiveauResponsabilite } from '@modules/organisation/entities/niveau-responsabilite.entity';
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
    echelonsStructurels: Map<string, string>;
    niveauxResponsabilite: Map<string, string>;
    modesRemuneration: Map<string, string>;
}> {
    logger.info('📋 Seed des nomenclatures organisation (globales)...');

    // 1. Échelons structurels (fusion niveaux organisation + usages unité)
    const echRepo = AppDataSource.getRepository(EchelonStructurel);
    const echelonsStructurels = await upsertAll(echRepo, [
        // Anciens niveaux d'organisation
        { code: 'ETABLISSEMENT', niveau: 0, label: 'Établissement', description: 'Niveau établissement (racine)', estSysteme: true },
        { code: 'DIRECTION', niveau: 1, label: 'Direction', description: 'Direction et services rattachés', estSysteme: true },
        { code: 'DEPARTEMENT', niveau: 2, label: 'Département / Service', description: 'Départements pédagogiques et services administratifs', estSysteme: true },
        { code: 'SOUS_SERVICE', niveau: 3, label: 'Sous-service / Équipe', description: 'Sous-services, équipes et cellules', estSysteme: true },
        // Anciens usages d'unité
        { code: 'DIRECTION_GENERAL', niveau: 1, label: 'Direction générale', description: 'Unité de direction générale', estSysteme: true },
        { code: 'DEPARTEMENT_PEDA', niveau: 2, label: 'Département pédagogique', description: 'Département pédagogique', estSysteme: true },
        { code: 'SERVICE', niveau: 2, label: 'Service', description: 'Service spécialisé', estSysteme: true },
        { code: 'COMMISSION', niveau: 3, label: 'Commission', description: 'Commission ou comité', estSysteme: true },
        { code: 'EQUIPE', niveau: 3, label: 'Équipe', description: 'Équipe ou cellule de travail', estSysteme: true },
        { code: 'ATELIER', niveau: 3, label: 'Atelier', description: 'Atelier technique ou artistique', estSysteme: true },
        { code: 'BUREAU', niveau: 3, label: 'Bureau', description: 'Bureau ou unité administrative', estSysteme: true },
        { code: 'LABORATOIRE', niveau: 3, label: 'Laboratoire', description: 'Laboratoire scientifique', estSysteme: true },
        { code: 'BIBLIOTHEQUE', niveau: 3, label: 'Bibliothèque', description: 'Bibliothèque ou centre de documentation', estSysteme: true },
    ], 'code');
    logger.info(`   Échelons structurels: ${echelonsStructurels.size}`);

    // 2. Niveaux de responsabilité
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

    // 3. Modes de rémunération
    const modeRemRepo = AppDataSource.getRepository(ModeRemunerationEntity);
    const modesRemuneration = await upsertAll(modeRemRepo, [
        { code: 'MENSUEL', label: 'Mensuel', description: 'Salaire fixe mensuel', estSysteme: true },
        { code: 'HORAIRE', label: 'Horaire', description: 'Rémunération à l\'heure', estSysteme: true },
        { code: 'MIXTE', label: 'Mixte', description: 'Fixe + heures supplémentaires', estSysteme: true },
        { code: 'HEBDOMADAIRE', label: 'Hebdomadaire', description: 'Rémunération hebdomadaire lissée sur l\'année', estSysteme: true },
    ], 'code');
    logger.info(`   Modes rémunération: ${modesRemuneration.size}`);

    logger.info('✅ Nomenclatures globales seedées');
    return { echelonsStructurels, niveauxResponsabilite, modesRemuneration };
}
