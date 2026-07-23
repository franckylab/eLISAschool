/**
 * ==================================
 * eLISAschool - Seed Types de Retenues
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Crée les types de retenues par défaut par établissement.
 * Idempotent : met à jour si le code existe déjà.
 * Modifiable : les utilisateurs peuvent modifier/supprimer après seed.
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { TypeRetenue, TypeRetenueFrequence } from '@modules/paie/entities/type-retenue.entity';
import { logger } from '@common/utils/logger.util';

interface TypeRetenueSeed {
    code: string;
    nom: string;
    frequence: TypeRetenueFrequence;
    montantMax?: number;
    description: string;
}

const TYPES_RETENUES_PAR_DEFAUT: TypeRetenueSeed[] = [
    {
        code: 'AVANCE',
        nom: 'Avance sur Salaire',
        frequence: TypeRetenueFrequence.PONCTUELLE,
        montantMax: 500000,
        description: 'Avance exceptionnelle sur salaire (montant max 500 000 FCFA)',
    },
    {
        code: 'PRET',
        nom: "Prêt Employeur",
        frequence: TypeRetenueFrequence.RECURRENTE,
        description: "Prêt consenti par l'établissement avec remboursement mensualisé",
    },
    {
        code: 'SANCTION',
        nom: 'Retenue Disciplinaire',
        frequence: TypeRetenueFrequence.PONCTUELLE,
        description: 'Sanction financière après procédure disciplinaire',
    },
    {
        code: 'SAISIE_ARRET',
        nom: 'Saisie-Arrêt sur Salaire',
        frequence: TypeRetenueFrequence.RECURRENTE,
        description: 'Saisie-arrêt judiciaire sur rémunération',
    },
    {
        code: 'EPARGNE',
        nom: 'Épargne Salariale',
        frequence: TypeRetenueFrequence.RECURRENTE,
        description: 'Épargne volontaire prélevée à la source',
    },
];

export async function seedTypesRetenues(etablissementId: string): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(TypeRetenue);
    const retenueMap = new Map<string, string>();

    const existants = await repo.find({
        where: { etablissementId },
        select: ['code', 'id'],
    });
    const codesExistants = new Set(existants.map((r) => r.code));
    for (const r of existants) {
        retenueMap.set(r.code, r.id);
    }

    const codesGlobaux = new Set(
        (await repo.find({ select: ['code'] })).map((r) => r.code),
    );

    let crees = 0;
    for (const data of TYPES_RETENUES_PAR_DEFAUT) {
        if (codesExistants.has(data.code)) {
            await repo.update(
                { code: data.code, etablissementId },
                data as any,
            );
        } else if (codesGlobaux.has(data.code)) {
            logger.warn(`[Seed TypesRetenues] ${data.code} existe déjà (contrainte unique globale), skip pour ${etablissementId.slice(0, 8)}`);
        } else {
            const entity = repo.create(data as unknown as TypeRetenue);
            entity.etablissementId = etablissementId;
            const saved = await repo.save(entity);
            retenueMap.set(saved.code, saved.id);
            codesExistants.add(saved.code);
            codesGlobaux.add(saved.code);
            crees++;
        }
    }

    logger.info(`[Seed TypesRetenues/${etablissementId.slice(0, 8)}] ${crees} créés, ${TYPES_RETENUES_PAR_DEFAUT.length - crees} déjà existants`);
    return retenueMap;
}
