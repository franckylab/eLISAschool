import { AppDataSource } from '@database/data-source';
import { TypePersonnel } from '@modules/personnel/entities';
import { logger } from '@common/utils/logger.util';

const OLD_TO_NEW_CODE: Record<string, string> = {
    ENSEIGNANT: 'TYPE_ENSEIGNANT',
    DIRECTION: 'TYPE_DIRECTION',
    ADMINISTRATIF: 'TYPE_ADMINISTRATIF',
    TECHNIQUE: 'TYPE_TECHNIQUE',
    SERVICE: 'TYPE_SERVICE',
    SANTE: 'TYPE_SANTE',
    SOCIAL: 'TYPE_SOCIAL',
    AUTRE: 'TYPE_AUTRE',
};

const TYPES_PAR_DEFAUT: Array<Partial<TypePersonnel>> = [
    { code: 'TYPE_ENSEIGNANT', nom: 'Enseignant', modeRemunerationDefaut: 'MIXTE', actif: true, estSysteme: true },
    { code: 'TYPE_DIRECTION', nom: 'Direction', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'TYPE_ADMINISTRATIF', nom: 'Administratif', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'TYPE_TECHNIQUE', nom: 'Technique', modeRemunerationDefaut: 'HORAIRE', actif: true, estSysteme: true },
    { code: 'TYPE_SERVICE', nom: 'Service', modeRemunerationDefaut: 'HORAIRE', actif: true, estSysteme: true },
    { code: 'TYPE_SANTE', nom: 'Santé', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'TYPE_SOCIAL', nom: 'Social', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'TYPE_AUTRE', nom: 'Autre', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: false },
];

export async function seedTypePersonnel(): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(TypePersonnel);
    const typePersonnelMap = new Map<string, string>();

    let existants = await repo.find({ select: ['code', 'id'] });
    const codesExistants = new Set(existants.map((t) => t.code));
    for (const t of existants) {
        typePersonnelMap.set(t.code, t.id);
    }

    // Migration: renommer les anciens codes (sans préfixe TYPE_) vers les nouveaux
    for (const [oldCode, newCode] of Object.entries(OLD_TO_NEW_CODE)) {
        const oldRecord = existants.find((t) => t.code === oldCode);
        if (oldRecord) {
            await repo.update(oldRecord.id, { code: newCode });
            existants = await repo.find({ select: ['code', 'id'] });
            codesExistants.delete(oldCode);
            codesExistants.add(newCode);
            typePersonnelMap.set(newCode, oldRecord.id);
            logger.info(`  Migration: ${oldCode} → ${newCode}`);
        }
    }

    let crees = 0;
    for (const tp of TYPES_PAR_DEFAUT) {
        if (codesExistants.has(tp.code!)) {
            await repo.update({ code: tp.code! }, {
                nom: tp.nom,
                modeRemunerationDefaut: tp.modeRemunerationDefaut,
                actif: tp.actif,
                estSysteme: tp.estSysteme,
            });
        } else {
            const nouveau = repo.create(tp as TypePersonnel);
            const saved = await repo.save(nouveau);
            typePersonnelMap.set(saved.code, saved.id);
            codesExistants.add(saved.code);
            crees++;
        }
    }

    logger.info(`[Seed TypePersonnel] ${crees} créés, ${TYPES_PAR_DEFAUT.length - crees} déjà existants`);
    return typePersonnelMap;
}
