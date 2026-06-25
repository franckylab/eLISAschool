/**
 * ==================================
 * eLISAschool - Seed Matières Multi-Tenant
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée les matières de base liées à un établissement
 * Support multi-tenant avec etablissementId
 * 
 * Changements v2.0:
 * - Ajout de nouvelles matières
 * - Amélioration des couleurs
 * - Logging détaillé
 */

import { AppDataSource } from '@database/data-source';
import { Matiere } from '@modules/matieres/entities';
import { logger } from '@common/utils/logger.util';

export async function seedMatieres(etablissementId: string): Promise<void> {
    logger.info('📚 Seed des matières (multi-tenant)...');

    const matiereRepo = AppDataSource.getRepository(Matiere);

    const matieresData = [
        // Matières scientifiques
        { nom: 'Mathématiques', code: 'MATH', couleur: '#FF6B6B' },
        { nom: 'Physique-Chimie', code: 'PC', couleur: '#4ECDC4' },
        { nom: 'Sciences de la Vie et de la Terre', code: 'SVT', couleur: '#45B7D1' },
        { nom: 'Informatique', code: 'INFO', couleur: '#96CEB4' },
        
        // Matières littéraires
        { nom: 'Français', code: 'FR', couleur: '#FFEAA7' },
        { nom: 'Anglais', code: 'ANG', couleur: '#DDA0DD' },
        { nom: 'Histoire-Géographie', code: 'HG', couleur: '#98D8C8' },
        { nom: 'Philosophie', code: 'PHILO', couleur: '#F7DC6F' },
        { nom: 'Lettres', code: 'LETT', couleur: '#BB8FCE' },
        
        // Matières complémentaires
        { nom: 'Éducation Physique et Sportive', code: 'EPS', couleur: '#82E0AA' },
        { nom: 'Éducation Artistique', code: 'ART', couleur: '#F8C471' },
        { nom: 'Musique', code: 'MUS', couleur: '#85C1E9' },
        { nom: 'Éducation Morale et Civique', code: 'EMC', couleur: '#D7BDE2' },
        
        // Matières techniques
        { nom: 'Technologie', code: 'TECH', couleur: '#AED6F1' },
        { nom: 'Sciences Économiques', code: 'SE', couleur: '#F9E79F' },
    ];

    let created = 0;
    let skipped = 0;

    for (const data of matieresData) {
        // Vérifier si la matière existe déjà pour cet établissement
        const existing = await matiereRepo.findOne({
            where: {
                nom: data.nom,
                etablissementId,
            },
        });

        if (existing) {
            logger.info(`   ⏭️ Matière existante: ${data.nom}`);
            skipped++;
            continue;
        }

        // Créer la matière avec etablissementId
        const matiere = matiereRepo.create({
            nom: data.nom,
            code: data.code,
            couleur: data.couleur,
            etablissementId,
            actif: true,
        });

        await matiereRepo.save(matiere);
        logger.info(`   ✅ Matière créée: ${data.nom} (${data.code})`);
        created++;
    }

    logger.info(`✅ Matières: ${created} créées, ${skipped} existantes`);
}

// Exécution standalone
if (require.main === module) {
    (async () => {
        try {
            await AppDataSource.initialize();
            logger.info('Database connected');

            // Récupérer l'établissement par défaut
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

            await seedMatieres(etablissement.id);

            await AppDataSource.destroy();
            logger.info('✅ Seed des matières terminé');
            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des matières:', error);
            process.exit(1);
        }
    })();
}
