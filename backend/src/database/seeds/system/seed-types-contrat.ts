/**
 * ==================================
 * eLISAschool - Seed Types de Contrat
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Crée les 8 types de contrat système (globaux, est_systeme=true).
 * Idempotent : met à jour si le code existe déjà.
 * ==================================
 */

import { AppDataSource } from '@database/data-source';
import { IsNull } from 'typeorm';
import { TypeContratPersonnalise, CategorieContrat } from '@modules/personnel/entities/type-contrat.entity';
import { ModeRemunerationEntity } from '@modules/organisation/entities';
import { logger } from '@common/utils/logger.util';

interface TypeContratSeed {
    code: string;
    nom: string;
    description: string;
    categorie: CategorieContrat;
    modeRemunerationCode: string;
    estSysteme: true;
    actif: true;
    ordre: number;
    renouvellementAutoDefaut: false;
    dureeMaxMois?: number;
}

const TYPES_CONTRAT_SYSTEME: TypeContratSeed[] = [
    {
        code: 'CDI',
        nom: 'Contrat à Durée Indéterminée',
        description: 'Contrat sans limite de durée, garantissant une stabilité professionnelle',
        categorie: CategorieContrat.EMPLOI_PERMANENT,
        modeRemunerationCode: 'MENSUEL',
        estSysteme: true,
        actif: true,
        ordre: 1,
        renouvellementAutoDefaut: false,
    },
    {
        code: 'CDD',
        nom: 'Contrat à Durée Déterminée',
        description: 'Contrat avec une durée limitée, généralement pour un remplacement ou surcroit d\'activité',
        categorie: CategorieContrat.EMPLOI_TEMPORAIRE,
        modeRemunerationCode: 'MENSUEL',
        estSysteme: true,
        actif: true,
        ordre: 2,
        renouvellementAutoDefaut: false,
        dureeMaxMois: 36,
    },
    {
        code: 'VACATAIRE',
        nom: 'Vacataire',
        description: 'Intervention ponctuelle rémunérée à l\'heure ou à la vacation',
        categorie: CategorieContrat.EMPLOI_TEMPORAIRE,
        modeRemunerationCode: 'HORAIRE',
        estSysteme: true,
        actif: true,
        ordre: 3,
        renouvellementAutoDefaut: false,
        dureeMaxMois: 12,
    },
    {
        code: 'STAGIAIRE',
        nom: 'Stagiaire',
        description: 'Convention de stage académique ou professionnel',
        categorie: CategorieContrat.STAGE_FORMATION,
        modeRemunerationCode: 'MENSUEL',
        estSysteme: true,
        actif: true,
        ordre: 4,
        renouvellementAutoDefaut: false,
        dureeMaxMois: 6,
    },
    {
        code: 'FREELANCE',
        nom: 'Prestataire / Freelance',
        description: 'Prestation de service indépendante, facturée à la mission ou à l\'heure',
        categorie: CategorieContrat.FREELANCE,
        modeRemunerationCode: 'HORAIRE',
        estSysteme: true,
        actif: true,
        ordre: 5,
        renouvellementAutoDefaut: false,
    },
    {
        code: 'TEMPS_PARTIEL',
        nom: 'Temps Partiel',
        description: 'Contrat à temps partiel avec répartition horaire spécifique',
        categorie: CategorieContrat.TEMPS_PARTIEL,
        modeRemunerationCode: 'MIXTE',
        estSysteme: true,
        actif: true,
        ordre: 6,
        renouvellementAutoDefaut: false,
    },
    {
        code: 'APPRENTISSAGE',
        nom: 'Contrat d\'Apprentissage',
        description: 'Formation en alternance alliant théorie et pratique en entreprise',
        categorie: CategorieContrat.APPRENTISSAGE,
        modeRemunerationCode: 'MIXTE',
        estSysteme: true,
        actif: true,
        ordre: 7,
        renouvellementAutoDefaut: false,
        dureeMaxMois: 24,
    },
    {
        code: 'AUTRE',
        nom: 'Autre',
        description: 'Type de contrat non classé dans les catégories précédentes',
        categorie: CategorieContrat.AUTRE,
        modeRemunerationCode: 'MENSUEL',
        estSysteme: true,
        actif: true,
        ordre: 8,
        renouvellementAutoDefaut: false,
    },
];

export async function seedTypesContrat(): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(TypeContratPersonnalise);
    const modeRemunRepo = AppDataSource.getRepository(ModeRemunerationEntity);
    const typeContratMap = new Map<string, string>();

    // Charger les modes de rémunération pour résoudre les FK
    const modesRemun = await modeRemunRepo.find();
    const modeRemunMap = new Map<string, string>();
    for (const m of modesRemun) {
        modeRemunMap.set(m.code, m.id);
    }

    const existants = await repo.find({
        where: { estSysteme: true, etablissementId: IsNull() },
        select: ['code', 'id'],
    });
    const codesExistants = new Set(existants.map((t) => t.code));
    for (const t of existants) {
        typeContratMap.set(t.code, t.id);
    }

    let crees = 0;
    for (const tc of TYPES_CONTRAT_SYSTEME) {
        const modeRemunerationId = modeRemunMap.get(tc.modeRemunerationCode) || null;
        if (codesExistants.has(tc.code)) {
            await repo.update(
                { code: tc.code, etablissementId: IsNull() },
                {
                    nom: tc.nom,
                    description: tc.description,
                    categorie: tc.categorie,
                    modeRemunerationId,
                    actif: tc.actif,
                    ordre: tc.ordre,
                    renouvellementAutoDefaut: tc.renouvellementAutoDefaut,
                    dureeMaxMois: tc.dureeMaxMois,
                },
            );
        } else {
            const nouveau = repo.create({
                code: tc.code,
                nom: tc.nom,
                description: tc.description,
                categorie: tc.categorie,
                modeRemunerationId,
                estSysteme: tc.estSysteme,
                actif: tc.actif,
                ordre: tc.ordre,
                renouvellementAutoDefaut: tc.renouvellementAutoDefaut,
                dureeMaxMois: tc.dureeMaxMois,
            } as TypeContratPersonnalise);
            const saved = await repo.save(nouveau);
            typeContratMap.set(saved.code, saved.id);
            codesExistants.add(saved.code);
            crees++;
        }
    }

    logger.info(`[Seed TypesContrat] ${crees} créés, ${TYPES_CONTRAT_SYSTEME.length - crees} déjà existants`);
    return typeContratMap;
}
