import { AppDataSource } from '@database/data-source';
import { TypePersonnel } from '@modules/personnel/entities';
import { logger } from '@common/utils/logger.util';

const TYPES_PAR_DEFAUT: Array<Partial<TypePersonnel>> = [
    { code: 'ENSEIGNANT', nom: 'Enseignant', modeRemunerationDefaut: 'MIXTE', actif: true, estSysteme: true },
    { code: 'DIRECTION', nom: 'Direction', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'ADMINISTRATIF', nom: 'Administratif', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
    { code: 'TECHNIQUE', nom: 'Technique', modeRemunerationDefaut: 'HORAIRE', actif: true, estSysteme: true },
    { code: 'SERVICE', nom: 'Service', modeRemunerationDefaut: 'HORAIRE', actif: true, estSysteme: true },
    { code: 'STAGE', nom: 'Stagiaire', modeRemunerationDefaut: 'STAGE', actif: true, estSysteme: true },
    { code: 'TEMPORAIRE', nom: 'Temporaire', modeRemunerationDefaut: 'HORAIRE', actif: true, estSysteme: true },
    { code: 'AUTRE', nom: 'Autre', modeRemunerationDefaut: 'MENSUEL', actif: true, estSysteme: true },
];

export async function seedTypePersonnel(): Promise<Map<string, string>> {
    const repo = AppDataSource.getRepository(TypePersonnel);
    const typePersonnelMap = new Map<string, string>();

    const existants = await repo.find({ select: ['code', 'id'] });
    const codesExistants = new Set(existants.map((t) => t.code));
    for (const t of existants) {
        typePersonnelMap.set(t.code, t.id);
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
