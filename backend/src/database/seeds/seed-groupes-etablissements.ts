/**
 * ==================================
 * eLISAschool - Seed Module Groupes d'Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-17
 * 
 * Crée :
 * - Paramètres système pour l'activation du module
 * - Un groupe de démonstration avec le premier établissement
 * - Attribution du super admin comme administrateur du groupe
 */

import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';

export async function seedGroupesEtablissements(
    etablissementPrincipalId: string,
    superAdminId: string
): Promise<void> {
    logger.info('[Seed] Début seed module groupes d\'établissements...');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
        // ==================================
        // 1. Paramètres système du module
        // ==================================

        // Paramètre d'activation du module
        await queryRunner.query(`
            INSERT INTO parametres_systeme (
                cle, valeur, "typeValeur", "module", description, 
                "etablissementId", visible, "createdAt", "updatedAt"
            )
            VALUES (
                'groupes-etablissements.actif',
                'true',
                'BOOLEAN',
                'groupes-etablissements',
                'Activer le module groupes d''établissements',
                NULL,
                true,
                NOW(),
                NOW()
            )
            ON CONFLICT (cle, "etablissementId") DO NOTHING;
        `);
        logger.info('[Seed] ✅ Paramètre groupes-etablissements.actif créé');

        // ==================================
        // 2. Vérifier si un groupe existe déjà
        // ==================================

        const groupeExistant = await queryRunner.query(`
            SELECT id FROM groupes_etablissements WHERE code = 'GROUPE_DEMO' LIMIT 1
        `);

        if (groupeExistant && groupeExistant.length > 0) {
            logger.info('[Seed] Groupe de démonstration déjà existant, skip...');
            return;
        }

        // ==================================
        // 3. Créer un groupe de démonstration
        // ==================================

        const groupeResult = await queryRunner.query(`
            INSERT INTO groupes_etablissements (
                nom, description, "proprietaireId", code, actif,
                cree_at, maj_at
            )
            VALUES (
                'Groupe Démonstration',
                'Groupe de démonstration pour tester la consolidation multi-établissements',
                $1,
                'GROUPE_DEMO',
                true,
                NOW(),
                NOW()
            )
            RETURNING id
        `, [superAdminId]);

        const groupeId = groupeResult[0].id;
        logger.info(`[Seed] ✅ Groupe de démonstration créé: ${groupeId}`);

        // ==================================
        // 4. Associer l'établissement principal au groupe
        // ==================================

        await queryRunner.query(`
            INSERT INTO groupe_etablissement_liens (
                "groupeId", "etablissementId", "ajoutePar",
                date_ajout
            )
            VALUES (
                $1, $2, $3,
                NOW()
            )
            ON CONFLICT ("groupeId", "etablissementId") DO NOTHING
        `, [groupeId, etablissementPrincipalId, superAdminId]);

        logger.info('[Seed] ✅ Établissement principal ajouté au groupe');

        // ==================================
        // 5. Ajouter le super admin comme administrateur du groupe
        // ==================================

        await queryRunner.query(`
            INSERT INTO groupe_admins (
                "groupeId", "utilisateurId", "assignePar",
                date_assignation
            )
            VALUES (
                $1, $2, $3,
                NOW()
            )
            ON CONFLICT ("groupeId", "utilisateurId") DO NOTHING
        `, [groupeId, superAdminId, superAdminId]);

        logger.info('[Seed] ✅ Super admin ajouté comme administrateur du groupe');

        // ==================================
        // 6. Créer un second groupe pour tester (optionnel)
        // ==================================

        // Vérifier si le second établissement existe
        const etablissements = await queryRunner.query(`
            SELECT id, nom FROM etablissements ORDER BY "createdAt" ASC LIMIT 2
        `);

        if (etablissements.length >= 2) {
            const secondEtablissement = etablissements[1];

            const groupe2Result = await queryRunner.query(`
                INSERT INTO groupes_etablissements (
                    nom, description, "proprietaireId", code, actif,
                    cree_at, maj_at
                )
                VALUES (
                    'Groupe Multi-Établissements',
                    'Groupe test pour la consolidation de plusieurs établissements',
                    $1,
                    'GROUPE_MULTI',
                    true,
                    NOW(),
                    NOW()
                )
                RETURNING id
            `, [superAdminId]);

            const groupe2Id = groupe2Result[0].id;
            logger.info(`[Seed] ✅ Second groupe créé: ${groupe2Id}`);

            // Ajouter les 2 établissements
            for (const etablissement of etablissements) {
                await queryRunner.query(`
                    INSERT INTO groupe_etablissement_liens (
                        "groupeId", "etablissementId", "ajoutePar",
                        date_ajout
                    )
                    VALUES (
                        $1, $2, $3,
                        NOW()
                    )
                    ON CONFLICT ("groupeId", "etablissementId") DO NOTHING
                `, [groupe2Id, etablissement.id, superAdminId]);
            }

            logger.info('[Seed] ✅ 2 établissements ajoutés au second groupe');

            // Admin également
            await queryRunner.query(`
                INSERT INTO groupe_admins (
                    "groupeId", "utilisateurId", "assignePar",
                    date_assignation
                )
                VALUES (
                    $1, $2, $3,
                    NOW()
                )
                ON CONFLICT ("groupeId", "utilisateurId") DO NOTHING
            `, [groupe2Id, superAdminId, superAdminId]);
        }

        logger.info('[Seed] ✅ Seed module groupes d\'établissements terminé avec succès');
    } catch (error) {
        logger.error('[Seed] ❌ Erreur seed module groupes d\'établissements:', error);
        throw error;
    } finally {
        await queryRunner.release();
    }
}
