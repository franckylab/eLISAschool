/**
 * ==================================
 * eLISAschool - Seed Types de Primes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Crée les types de primes par défaut par établissement.
 * Idempotent : met à jour si le code existe déjà.
 * Modifiable : les utilisateurs peuvent modifier/supprimer après seed.
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { TypePrime, TypePrimeCalcul } from '@modules/personnel/entities/type-prime.entity';
import { logger } from '@common/utils/logger.util';

interface TypePrimeSeed {
    code: string;
    nom: string;
    typeCalcul: TypePrimeCalcul;
    valeur: number;
    description: string;
    actif: boolean;
}

const TYPES_PRIMES_PAR_DEFAUT: TypePrimeSeed[] = [
    {
        code: 'ANCIENNETE',
        nom: "Prime d'Ancienneté",
        typeCalcul: TypePrimeCalcul.POURCENTAGE,
        valeur: 5,
        description: 'Prime selon années de service (5% du salaire de base par échelon)',
        actif: true,
    },
    {
        code: 'TRANSPORT',
        nom: 'Indemnité de Transport',
        typeCalcul: TypePrimeCalcul.FIXE,
        valeur: 25000,
        description: 'Forfait transport mensuel',
        actif: true,
    },
    {
        code: 'LOGEMENT',
        nom: 'Indemnité de Logement',
        typeCalcul: TypePrimeCalcul.FIXE,
        valeur: 50000,
        description: 'Forfait logement mensuel',
        actif: true,
    },
    {
        code: 'RENDEMENT',
        nom: 'Prime de Rendement',
        typeCalcul: TypePrimeCalcul.VARIABLE,
        valeur: 0,
        description: 'Prime variable selon évaluation de performance individuelle',
        actif: true,
    },
    {
        code: 'CORRECTION_EXAMEN',
        nom: "Prime de Correction d'Examens",
        typeCalcul: TypePrimeCalcul.VARIABLE,
        valeur: 0,
        description: "Rémunération pour correction d'épreuves d'examens nationaux (selon nombre de copies)",
        actif: true,
    },
    {
        code: 'ENCADREMENT',
        nom: "Prime d'Encadrement Pédagogique",
        typeCalcul: TypePrimeCalcul.FIXE,
        valeur: 35000,
        description: 'Prime pour encadrement de stages, mémoires ou projets pédagogiques',
        actif: true,
    },
];

export async function seedTypesPrimes(etablissementId: string): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(TypePrime);
    const primeMap = new Map<string, string>();

    const existants = await repo.find({
        where: { etablissementId },
        select: ['code', 'id'],
    });
    const codesExistants = new Set(existants.map((p) => p.code));
    for (const p of existants) {
        primeMap.set(p.code, p.id);
    }

    const codesGlobaux = new Set(
        (await repo.find({ select: ['code'] })).map((p) => p.code),
    );

    let crees = 0;
    for (const data of TYPES_PRIMES_PAR_DEFAUT) {
        if (codesExistants.has(data.code)) {
            await repo.update(
                { code: data.code, etablissementId },
                data as any,
            );
        } else if (codesGlobaux.has(data.code)) {
            logger.warn(`[Seed TypesPrimes] ${data.code} existe déjà (contrainte unique globale), skip pour ${etablissementId.slice(0, 8)}`);
        } else {
            const entity = repo.create(data as unknown as TypePrime);
            entity.etablissementId = etablissementId;
            const saved = await repo.save(entity);
            primeMap.set(saved.code, saved.id);
            codesExistants.add(saved.code);
            codesGlobaux.add(saved.code);
            crees++;
        }
    }

    logger.info(`[Seed TypesPrimes/${etablissementId.slice(0, 8)}] ${crees} créés, ${TYPES_PRIMES_PAR_DEFAUT.length - crees} déjà existants`);
    return primeMap;
}
