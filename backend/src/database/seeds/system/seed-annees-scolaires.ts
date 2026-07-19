/**
 * ==================================
 * eLISAschool - Seed Années Scolaires
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les années scolaires pour un établissement
 * Support multi-tenant avec etablissementId
 */

import { AppDataSource } from '@database/data-source';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { logger } from '@common/utils/logger.util';

export async function seedAnneesScolaires(etablissementId: string): Promise<string | null> {
    logger.info('📅 Seed des années scolaires...');

    const anneeRepo = AppDataSource.getRepository(AnneeScolaire);

    const anneesData = [
        {
            libelle: '2024-2025',
            code: '2024-2025',
            dateDebut: new Date('2024-09-01'),
            dateFin: new Date('2025-07-31'),
            enCours: false,
        },
        {
            libelle: '2025-2026',
            code: '2025-2026',
            dateDebut: new Date('2025-09-01'),
            dateFin: new Date('2026-07-31'),
            enCours: true,
        },
        {
            libelle: '2026-2027',
            code: '2026-2027',
            dateDebut: new Date('2026-09-01'),
            dateFin: new Date('2027-07-31'),
            enCours: false,
        },
    ];

    let anneeActiveId: string | null = null;

    for (const data of anneesData) {
        const existing = await anneeRepo.findOne({
            where: {
                libelle: data.libelle,
                etablissementId,
            },
        });

        if (existing) {
            logger.info(`   ⏭️ Année existante: ${data.libelle}`);
            if (data.enCours) {
                anneeActiveId = existing.id;
            }
            continue;
        }

        const annee = anneeRepo.create({
            ...data,
            etablissementId,
        });

        await anneeRepo.save(annee);
        logger.info(`   ✅ Année créée: ${data.libelle}${data.enCours ? ' (ACTIVE)' : ''}`);
        
        if (data.enCours) {
            anneeActiveId = annee.id;
        }
    }

    logger.info(`✅ Années scolaires seedées. Année active: ${anneeActiveId ? 'oui' : 'non'}`);
    return anneeActiveId;
}

// Exécution standalone
if (require.main === module) {
    (async () => {
        try {
            await AppDataSource.initialize();
            logger.info('Database connected');

            const { Etablissement } = await import('@modules/etablissement/entities');
            const etablissementRepo = AppDataSource.getRepository(Etablissement);
            const etablissement = await etablissementRepo.findOne({
                where: { codeEtablissement: 'ETAB-001' },
            });

            if (!etablissement) {
                logger.error('Établissement par défaut non trouvé');
                process.exit(1);
            }

            logger.info(`Établissement: ${etablissement.nom} (${etablissement.id})`);

            await seedAnneesScolaires(etablissement.id);

            await AppDataSource.destroy();
            logger.info('✅ Seed des années scolaires terminé');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des années scolaires:', error);
            process.exit(1);
        }
    })();
}

export default seedAnneesScolaires;
