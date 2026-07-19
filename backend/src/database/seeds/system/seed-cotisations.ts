/**
 * ==================================
 * eLISAschool - Seed Cotisations
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Crée les cotisations sociales par défaut par établissement.
 * Idempotent : met à jour si le code existe déjà dans l'établissement.
 * Modifiable : les utilisateurs peuvent modifier/supprimer après seed.
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { Cotisation, TypeCotisation } from '@modules/personnel/entities/cotisation.entity';
import { logger } from '@common/utils/logger.util';

interface CotisationSeed {
    code: string;
    nom: string;
    type: TypeCotisation;
    tauxPatronal: number;
    tauxSalarial: number;
    plafond?: number;
    description: string;
    actif: boolean;
}

const COTISATIONS_PAR_DEFAUT: CotisationSeed[] = [
    {
        code: 'CNPS_P',
        nom: 'CNPS Patronale',
        type: TypeCotisation.PATRONALE,
        tauxPatronal: 11.50,
        tauxSalarial: 0,
        description: 'Cotisation patronale CNPS (11.5% — prestations familiales, accidents du travail, etc.)',
        actif: true,
    },
    {
        code: 'CNPS_S',
        nom: 'CNPS Salariale',
        type: TypeCotisation.SALARIALE,
        tauxPatronal: 0,
        tauxSalarial: 4.20,
        description: 'Cotisation salariale CNPS (4.2% — retraite, invalidité, décès)',
        actif: true,
    },
    {
        code: 'IRPP',
        nom: 'Impôt sur le Revenu',
        type: TypeCotisation.SALARIALE,
        tauxPatronal: 0,
        tauxSalarial: 0,
        description: 'Impôt sur le revenu des personnes physiques (barème progressif 0–35%)',
        actif: true,
    },
    {
        code: 'AMO',
        nom: 'Assurance Maladie Obligatoire',
        type: TypeCotisation.MIXTE,
        tauxPatronal: 2.50,
        tauxSalarial: 2.50,
        description: 'Assurance maladie obligatoire (part patronale 2.5% + part salariale 2.5%)',
        actif: true,
    },
    {
        code: 'CAC',
        nom: "Crédit d'Apprentissage et de Formation Continue",
        type: TypeCotisation.PATRONALE,
        tauxPatronal: 1.00,
        tauxSalarial: 0,
        description: "Fonds National de l'Emploi / Formation professionnelle (1% employeur)",
        actif: true,
    },
    {
        code: 'MUTUELLE_SANTE',
        nom: 'Mutuelle Santé Complémentaire',
        type: TypeCotisation.MIXTE,
        tauxPatronal: 3.00,
        tauxSalarial: 2.00,
        description: 'Mutuelle santé complémentaire (répartition employeur/salarié selon accord)',
        actif: true,
    },
    {
        code: 'RETRAITE_COMPL',
        nom: 'Retraite Complémentaire',
        type: TypeCotisation.MIXTE,
        tauxPatronal: 2.50,
        tauxSalarial: 1.50,
        description: 'Régime de retraite complémentaire (facultatif, selon politique établissement)',
        actif: true,
    },
];

export async function seedCotisations(etablissementId: string): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(Cotisation);
    const cotisationMap = new Map<string, string>();

    const existants = await repo.find({
        where: { etablissementId },
        select: ['code', 'id'],
    });
    const codesExistants = new Set(existants.map((c) => c.code));
    for (const c of existants) {
        cotisationMap.set(c.code, c.id);
    }

    const codesGlobaux = new Set(
        (await repo.find({ select: ['code'] })).map((c) => c.code),
    );

    let crees = 0;
    for (const data of COTISATIONS_PAR_DEFAUT) {
        if (codesExistants.has(data.code)) {
            await repo.update(
                { code: data.code, etablissementId },
                data as any,
            );
        } else if (codesGlobaux.has(data.code)) {
            logger.warn(`[Seed Cotisations] ${data.code} existe déjà (contrainte unique globale), skip pour ${etablissementId.slice(0, 8)}`);
        } else {
            const entity = repo.create(data as unknown as Cotisation);
            entity.etablissementId = etablissementId;
            const saved = await repo.save(entity);
            cotisationMap.set(saved.code, saved.id);
            codesExistants.add(saved.code);
            codesGlobaux.add(saved.code);
            crees++;
        }
    }

    logger.info(`[Seed Cotisations/${etablissementId.slice(0, 8)}] ${crees} créées, ${COTISATIONS_PAR_DEFAUT.length - crees} déjà existantes`);
    return cotisationMap;
}
