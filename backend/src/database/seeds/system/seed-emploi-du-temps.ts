import { AppDataSource } from '../../data-source';
import { ParametreSysteme, TypeValeurParametre, CategorieParametre } from '@modules/configuration/entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

export async function seedEmploiDuTemps(): Promise<void> {
    logger.info('[Seed] Début seed module emploi-du-temps...');

    const paramRepo = AppDataSource.getRepository(ParametreSysteme);

    const params = [
        {
            cle: 'emploi-du-temps.actif',
            valeur: 'false',
            typeValeur: TypeValeurParametre.BOOLEAN,
            module: 'emploi-du-temps',
            description: 'Activer le module emploi-du-temps',
        },
        {
            cle: 'emploi-du-temps.require_validation',
            valeur: 'false',
            typeValeur: TypeValeurParametre.BOOLEAN,
            module: 'emploi-du-temps',
            description: 'Exiger une validation pour la création d\'emploi du temps',
        },
    ];

    for (const param of params) {
        const existing = await paramRepo.findOne({
            where: { cle: param.cle },
        });

        if (existing) {
            logger.debug(`  ⏭ Paramètre déjà existant: ${param.cle}`);
            continue;
        }

        await paramRepo.save(paramRepo.create({
            ...param,
            categorie: CategorieParametre.MODULE,
            visible: true,
            modifiableRuntime: true,
        }));

        logger.info(`[Seed] ✅ Paramètre ${param.cle} créé`);
    }

    logger.info('[Seed] ✅ Seed module emploi-du-temps terminé avec succès');
}
