/**
 * ==================================
 * eLISAschool - Seed Matières-Niveaux
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Associe les matières aux niveaux avec coefficients
 * Support multi-tenant avec etablissementId
 */

import { AppDataSource } from '@database/data-source';
import { Matiere } from '@modules/matieres/entities';
import { MatiereNiveau } from '@modules/matieres/entities/matiere-niveau.entity';
import { Niveau } from '@modules/niveaux/entities';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';

export async function seedMatieresNiveaux(etablissementId: string): Promise<void> {
    logger.info('📚 Seed des matières par niveau...');

    const matiereRepo = AppDataSource.getRepository(Matiere);
    const matiereNiveauRepo = AppDataSource.getRepository(MatiereNiveau);
    const niveauRepo = AppDataSource.getRepository(Niveau);

    // Récupérer toutes les matières de l'établissement
    const matieres = await matiereRepo.find({ where: { etablissementId, actif: true } });
    if (matieres.length === 0) {
        logger.warn('⚠️ Aucune matière trouvée pour cet établissement');
        return;
    }

    // Récupérer tous les niveaux de l'établissement
    const niveaux = await niveauRepo.find({ where: { etablissementId } });
    if (niveaux.length === 0) {
        logger.warn('⚠️ Aucun niveau trouvé pour cet établissement');
        return;
    }

    const matiereMap = new Map<string, string>();
    matieres.forEach(m => matiereMap.set(m.code, m.id));

    const niveauMap = new Map<string, string>();
    niveaux.forEach(n => niveauMap.set(n.code, n.id));

    // Configuration des matières par niveau avec coefficients
    const matieresNiveauxData: Array<{
        niveauCode: string;
        sousSysteme: SousSysteme;
        matieres: Array<{ code: string; coefficient: number; horaireHebdo: number }>;
    }> = [
        // Primaire Francophone (CI-CM2)
        {
            niveauCode: 'CM2',
            sousSysteme: SousSysteme.FRANCOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 3, horaireHebdo: 6 },
                { code: 'FR', coefficient: 3, horaireHebdo: 8 },
                { code: 'ANG', coefficient: 2, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'ART', coefficient: 1, horaireHebdo: 2 },
                { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
            ],
        },
        {
            niveauCode: 'CM1',
            sousSysteme: SousSysteme.FRANCOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 3, horaireHebdo: 6 },
                { code: 'FR', coefficient: 3, horaireHebdo: 8 },
                { code: 'ANG', coefficient: 2, horaireHebdo: 2 },
                { code: 'HG', coefficient: 2, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'ART', coefficient: 1, horaireHebdo: 2 },
                { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
            ],
        },

        // Collège Francophone
        {
            niveauCode: '6EME',
            sousSysteme: SousSysteme.FRANCOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 3, horaireHebdo: 5 },
                { code: 'FR', coefficient: 3, horaireHebdo: 5 },
                { code: 'ANG', coefficient: 2, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
                { code: 'PC', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'ART', coefficient: 1, horaireHebdo: 1 },
                { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
            ],
        },
        {
            niveauCode: '3EME',
            sousSysteme: SousSysteme.FRANCOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 4, horaireHebdo: 5 },
                { code: 'FR', coefficient: 4, horaireHebdo: 5 },
                { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
                { code: 'HG', coefficient: 3, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 3, horaireHebdo: 2 },
                { code: 'PC', coefficient: 3, horaireHebdo: 2 },
                { code: 'PHILO', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'EMC', coefficient: 1, horaireHebdo: 1 },
            ],
        },

        // Lycée Francophone - Série D
        {
            niveauCode: 'TERMINALE',
            sousSysteme: SousSysteme.FRANCOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 7, horaireHebdo: 7 },
                { code: 'SVT', coefficient: 6, horaireHebdo: 6 },
                { code: 'PC', coefficient: 6, horaireHebdo: 6 },
                { code: 'FR', coefficient: 3, horaireHebdo: 3 },
                { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 2 },
                { code: 'PHILO', coefficient: 3, horaireHebdo: 3 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            ],
        },

        // Primaire Anglophone
        {
            niveauCode: 'STD6',
            sousSysteme: SousSysteme.ANGLOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 3, horaireHebdo: 6 },
                { code: 'ANG', coefficient: 3, horaireHebdo: 8 },
                { code: 'FR', coefficient: 2, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'ART', coefficient: 1, horaireHebdo: 2 },
            ],
        },

        // Collège Anglophone
        {
            niveauCode: 'FORM1',
            sousSysteme: SousSysteme.ANGLOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 3, horaireHebdo: 5 },
                { code: 'ANG', coefficient: 3, horaireHebdo: 5 },
                { code: 'FR', coefficient: 2, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 2, horaireHebdo: 2 },
                { code: 'PC', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
                { code: 'ART', coefficient: 1, horaireHebdo: 1 },
            ],
        },
        {
            niveauCode: 'FORM5',
            sousSysteme: SousSysteme.ANGLOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 4, horaireHebdo: 5 },
                { code: 'ANG', coefficient: 4, horaireHebdo: 5 },
                { code: 'FR', coefficient: 3, horaireHebdo: 3 },
                { code: 'HG', coefficient: 3, horaireHebdo: 3 },
                { code: 'SVT', coefficient: 3, horaireHebdo: 2 },
                { code: 'PC', coefficient: 3, horaireHebdo: 2 },
                { code: 'PHILO', coefficient: 2, horaireHebdo: 2 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            ],
        },

        // Lycée Anglophone
        {
            niveauCode: 'UPPER6',
            sousSysteme: SousSysteme.ANGLOPHONE,
            matieres: [
                { code: 'MATH', coefficient: 7, horaireHebdo: 7 },
                { code: 'SVT', coefficient: 6, horaireHebdo: 6 },
                { code: 'PC', coefficient: 6, horaireHebdo: 6 },
                { code: 'ANG', coefficient: 3, horaireHebdo: 3 },
                { code: 'FR', coefficient: 3, horaireHebdo: 3 },
                { code: 'HG', coefficient: 2, horaireHebdo: 2 },
                { code: 'PHILO', coefficient: 3, horaireHebdo: 3 },
                { code: 'EPS', coefficient: 1, horaireHebdo: 2 },
            ],
        },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const config of matieresNiveauxData) {
        const niveauId = niveauMap.get(config.niveauCode);
        if (!niveauId) {
            logger.debug(`  ⏭️ Niveau ${config.niveauCode} non trouvé`);
            continue;
        }

        for (const matiereConfig of config.matieres) {
            const matiereId = matiereMap.get(matiereConfig.code);
            if (!matiereId) {
                logger.debug(`  ⏭️ Matière ${matiereConfig.code} non trouvée`);
                continue;
            }

            // Vérifier si l'association existe déjà
            const existing = await matiereNiveauRepo.findOne({
                where: {
                    matiereId,
                    niveauId,
                },
            });

            if (existing) {
                skippedCount++;
                continue;
            }

            // Créer l'association
            const matiereNiveau = matiereNiveauRepo.create({
                matiereId,
                niveauId,
                coefficient: matiereConfig.coefficient,
                volumeHoraire: matiereConfig.horaireHebdo * 60, // Conversion en minutes
                obligatoire: true,
            });

            await matiereNiveauRepo.save(matiereNiveau);
            createdCount++;
        }
    }

    logger.info(`✅ Matières-Niveaux: ${createdCount} créées, ${skippedCount} existantes`);
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

            await seedMatieresNiveaux(etablissement.id);

            await AppDataSource.destroy();
            logger.info('✅ Seed des matières-niveaux terminé');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des matières-niveaux:', error);
            process.exit(1);
        }
    })();
}

export default seedMatieresNiveaux;
