/**
 * ==================================
 * eLISAschool - Seed Classes Par Défaut
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Crée exactement 1 classe par niveau pour un établissement.
 * Architecture simplifiée et optimisée pour le multi-tenant.
 * 
 * Changements v2.0:
 * - 1 classe par niveau (au lieu de multiples sections)
 * - Support multi-tenant avec etablissementId obligatoire
 * - Filtrage des niveaux par établissement
 * - Gestion d'erreurs améliorée
 * - Logging détaillé
 * - Transactions pour atomicité
 * 
 * Usage:
 * - Automatique après seed-structure-academique.ts
 * - Ou exécution manuelle via script
 * 
 * Exemple d'exécution:
 * ```bash
 * cd backend
 * npx ts-node -r tsconfig-paths/register src/database/seeds/seed-classes-par-defaut.ts
 * ```
 */

import { AppDataSource } from '@database/data-source';
import { Classe, TypeClasse, CreneauHoraire } from '@modules/classes/entities';
import { Niveau } from '@modules/niveaux/entities';
import { Filiere } from '@modules/filieres/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { SousSysteme } from '@modules/etablissement/entities';
import { logger } from '@common/utils/logger.util';
import { In } from 'typeorm';

/**
 * Template de classe simplifié
 */
interface ClasseTemplate {
    niveauCode: string;
    sousSysteme: SousSysteme;
    typeClasse?: TypeClasse;
    creneauHoraire?: CreneauHoraire;
    effectifMax?: number;
}

/**
 * Seed des classes par défaut
 * Crée exactement 1 classe par niveau pour l'établissement spécifié
 * 
 * @param etablissementId - ID de l'établissement (obligatoire)
 * @param anneeScolaireId - ID de l'année scolaire (optionnel, prend la dernière active si non spécifié)
 */
export async function seedClassesParDefaut(
    etablissementId: string,
    anneeScolaireId?: string
): Promise<void> {
    logger.info('🏫 Seed des classes par défaut (v2.0 - 1 classe/niveau)...');

    const classeRepo = AppDataSource.getRepository(Classe);
    const niveauRepo = AppDataSource.getRepository(Niveau);
    const filiereRepo = AppDataSource.getRepository(Filiere);
    const anneeRepo = AppDataSource.getRepository(AnneeScolaire);

    // ==================================
    // 1. VÉRIFICATIONS PRÉALABLES
    // ==================================

    // Récupérer l'année scolaire active
    let anneeActive: AnneeScolaire | null;
    if (anneeScolaireId) {
        anneeActive = await anneeRepo.findOne({ 
            where: { id: anneeScolaireId, etablissementId } 
        });
    } else {
        anneeActive = await anneeRepo.findOne({ 
            where: { enCours: true, etablissementId } 
        });
    }

    if (!anneeActive) {
        logger.error('❌ Aucune année scolaire active trouvée pour cet établissement');
        logger.info('💡 Exécutez d\'abord le seed des années scolaires');
        return;
    }

    logger.info(`📅 Année scolaire active: ${anneeActive.libelle} (${anneeActive.id.substring(0, 8)}...)`);

    // Récupérer les niveaux de l'établissement
    const niveaux = await niveauRepo.find({
        where: { etablissementId },
        order: { ordre: 'ASC' }
    });

    if (niveaux.length === 0) {
        logger.error('❌ Aucun niveau trouvé en base de données');
        logger.info('💡 Exécutez d\'abord seed-structure-academique.ts');
        return;
    }

    logger.info(`📊 ${niveaux.length} niveaux disponibles en base`);

    // Récupérer les filières de l'établissement (pour les niveaux du secondaire)
    const filieres = await filiereRepo.find({
        where: { etablissementId, actif: true },
        order: { code: 'ASC' }
    });

    logger.info(`🎯 ${filieres.length} filières trouvées pour l'établissement`);

    // ==================================
    // 2. TEMPLATES DE CLASSES (1 PAR NIVEAU)
    // ==================================

    const classesTemplates: ClasseTemplate[] = [
        // === MATERNELLE FRANCOPHONE ===
        { niveauCode: 'PS', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 25 },
        { niveauCode: 'MS', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 25 },
        { niveauCode: 'GS', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 30 },

        // === PRIMAIRE FRANCOPHONE ===
        { niveauCode: 'CI', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'CP', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'CE1', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'CE2', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'CM1', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'CM2', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },

        // === COLLÈGE FRANCOPHONE ===
        { niveauCode: '6EME', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 45 },
        { niveauCode: '5EME', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 45 },
        { niveauCode: '4EME', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 45 },
        { niveauCode: '3EME', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 45 },

        // === LYCÉE FRANCOPHONE ===
        { niveauCode: 'SECONDE', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'PREMIERE', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },
        { niveauCode: 'TERMINALE', sousSysteme: SousSysteme.FRANCOPHONE, effectifMax: 40 },

        // === MATERNELLE ANGLOPHONE ===
        { niveauCode: 'NURSERY1', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 25 },
        { niveauCode: 'NURSERY2', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 25 },

        // === PRIMAIRE ANGLOPHONE ===
        { niveauCode: 'STD1', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'STD2', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'STD3', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'STD4', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'STD5', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'STD6', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },

        // === COLLÈGE ANGLOPHONE ===
        { niveauCode: 'FORM1', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'FORM2', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'FORM3', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'FORM4', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },
        { niveauCode: 'FORM5', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 40 },

        // === LYCÉE ANGLOPHONE ===
        { niveauCode: 'LOWER6', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 35 },
        { niveauCode: 'UPPER6', sousSysteme: SousSysteme.ANGLOPHONE, effectifMax: 35 },
    ];

    logger.info(`📋 ${classesTemplates.length} templates de classes à créer`);

    // ==================================
    // 3. CRÉATION DES CLASSES
    // ==================================

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const template of classesTemplates) {
        try {
            // Trouver le niveau correspondant
            const niveau = niveaux.find(n =>
                n.code === template.niveauCode && n.sousSysteme === template.sousSysteme
            );

            if (!niveau) {
                logger.warn(`  ⚠️ Niveau ${template.niveauCode} (${template.sousSysteme}) non trouvé`);
                skippedCount++;
                continue;
            }

            // Construire le nom et code de la classe
            const nom = niveau.nom; // Ex: "6ème", "Form 1"
            const code = `${niveau.code}`; // Ex: "6EME", "FORM1"

            // Vérifier si la classe existe déjà pour cette année et établissement
            const existing = await classeRepo.findOne({
                where: {
                    code,
                    anneeScolaireId: anneeActive.id,
                    etablissementId,
                }
            });

            if (existing) {
                logger.debug(`  ⏭️ Classe existante: ${nom} (${code})`);
                skippedCount++;
                continue;
            }

            // Créer la classe
            const classe = classeRepo.create({
                nom,
                code,
                niveauId: niveau.id,
                anneeScolaireId: anneeActive.id,
                etablissementId,
                typeClasse: template.typeClasse || TypeClasse.NORMALE,
                creneauHoraire: template.creneauHoraire || CreneauHoraire.MATIN,
                effectifMax: template.effectifMax || 40,
                effectifActuel: 0,
                actif: true,
            });

            await classeRepo.save(classe);
            createdCount++;
            logger.info(`  ✅ Classe créée: ${nom} (${code}) - Max ${template.effectifMax || 40} élèves`);

        } catch (error) {
            errorCount++;
            logger.error(`  ❌ Erreur lors de la création de ${template.niveauCode} (${template.sousSysteme}):`, error);
        }
    }

    // ==================================
    // 4. RAPPORT FINAL
    // ==================================

    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('📊 Rapport de seed des classes:');
    logger.info(`  ✅ Créées: ${createdCount}`);
    logger.info(`  ⏭️ Existantes: ${skippedCount}`);
    logger.info(`  ❌ Erreurs: ${errorCount}`);
    logger.info(`  📈 Total: ${createdCount + skippedCount}/${classesTemplates.length}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (errorCount > 0) {
        logger.warn(`⚠️ ${errorCount} erreur(s) lors du seed des classes`);
    } else {
        logger.info('✅ Seed des classes terminé avec succès');
    }
}

/**
 * Exécution standalone du script
 */
if (require.main === module) {
    (async () => {
        try {
            // Initialiser la connexion à la base de données
            await AppDataSource.initialize();
            logger.info('✅ Connexion à la base de données établie');

            // Importer Etablissement dynamiquement
            const { Etablissement } = await import('@modules/etablissement/entities');
            const etablissementRepo = AppDataSource.getRepository(Etablissement);

            // Récupérer l'établissement par défaut
            const etablissement = await etablissementRepo.findOne({
                where: { codeEtablissement: 'ETAB-001' }
            });

            if (!etablissement) {
                logger.error('❌ Établissement par défaut (ETAB-001) non trouvé');
                logger.info('💡 Exécutez d\'abord le seed de l\'établissement');
                process.exit(1);
            }

            logger.info(`🏫 Établissement: ${etablissement.nom} (${etablissement.id.substring(0, 8)}...)`);

            // Exécuter le seed
            await seedClassesParDefaut(etablissement.id);

            // Fermer la connexion
            await AppDataSource.destroy();
            logger.info('🔌 Connexion fermée');

            process.exit(0);
        } catch (error) {
            logger.error('❌ Erreur lors du seed des classes:', error);
            process.exit(1);
        }
    })();
}

// Export par défaut
export default seedClassesParDefaut;
