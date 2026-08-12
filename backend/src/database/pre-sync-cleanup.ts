/**
 * ==================================
 * eLISAschool — Pré-nettoyage base avant synchronize
 * ==================================
 * Supprime les lignes orphelines et gère les incompatibilités
 * de schéma qui empêcheraient TypeORM de créer les contraintes FK.
 * Connexion pg brute, utilisable avant toute initialize().
 */

import { Client } from 'pg';
import { logger } from '@common/utils/logger.util';

export interface DbConnectionConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

async function tableHasColumn(client: Client, table: string, column: string): Promise<boolean> {
    const res = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
        [table, column]
    );
    return res.rows.length > 0;
}

async function tableExists(client: Client, table: string): Promise<boolean> {
    const res = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
        [table]
    );
    return res.rows.length > 0;
}

/**
 * Supprime les orphelins et les tables avec schema obsolète
 * qui empêcheraient la synchronisation TypeORM.
 */
export async function cleanOrphanHeuresCours(config: DbConnectionConfig): Promise<void> {
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
    });

    try {
        await client.connect();

        // ── 1. Structural: classeId → classeAnneeId ──
        const hasHeuresCours = await tableExists(client, 'heures_cours');
        if (hasHeuresCours) {
            const hasClasseAnneeId = await tableHasColumn(client, 'heures_cours', 'classeAnneeId');
            if (!hasClasseAnneeId) {
                // Schema obsolète (pre-v4.0) — laisser TypeORM recréer la table
                logger.info('🧹 heures_cours a schéma obsolète (classeId). Drop pour synchronize...');
                await client.query(`DROP TABLE heures_cours CASCADE`);
                logger.info('✅ heures_cours supprimée (sera recréée par synchronize)');
            } else {
                // Schema OK — nettoyer seulement les orphelins
                const r1 = await client.query(`
                    DELETE FROM heures_cours
                    WHERE "classeAnneeId" IS NOT NULL
                      AND "classeAnneeId"::text != ''
                      AND NOT EXISTS (
                          SELECT 1 FROM classes_annees WHERE id = heures_cours."classeAnneeId"
                      )
                `);
                if (r1.rowCount && r1.rowCount > 0) {
                    logger.info(`🧹 Nettoyé ${r1.rowCount} heures_cours (classeAnneeId orphelin)`);
                }
            }
        }

        // ── 2. HeureCours avec salleId orphelin ──
        if (hasHeuresCours) {
            const r2 = await client.query(`
                DELETE FROM heures_cours
                WHERE "salleId" IS NOT NULL
                  AND "salleId"::text != ''
                  AND NOT EXISTS (
                      SELECT 1 FROM salles WHERE id = heures_cours."salleId"
                  )
            `);
            if (r2.rowCount && r2.rowCount > 0) {
                logger.info(`🧹 Nettoyé ${r2.rowCount} heures_cours (salleId orphelin)`);
            }
        }

        // ── 3. Structural: emploi_du_temps → creneaux_horaires ──
        // Supprimer l'ancienne FK si elle existe (pour éviter conflit avec nouvelle table)
        const hasFkEmploiDuTemps = await client.query(`
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_name = 'heures_cours'
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name LIKE '%creneau%'
        `);
        if (hasFkEmploiDuTemps.rows.length > 0) {
            const hasCreneauxHoraires = await tableExists(client, 'creneaux_horaires');
            const hasEmploiDuTemps = await tableExists(client, 'emploi_du_temps');
            if (!hasCreneauxHoraires && !hasEmploiDuTemps) {
                // Table cible manquante — supprimer la FK pour éviter erreur sync
                for (const row of hasFkEmploiDuTemps.rows) {
                    await client.query(`ALTER TABLE heures_cours DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
                    logger.info(`🧹 Supprimé FK obsolète: ${row.constraint_name}`);
                }
            }
        }

    } catch (err: any) {
        if (err.code === '42P01' || err.code === '3D000') {
            // Tables pas encore créées ou DB inexistante — normal pour premier run
            logger.debug('ℹ Pré-nettoyage ignoré (tables non créées)');
        } else {
            logger.warn(`⚠ Pré-nettoyage heures_cours: ${err.message}`);
        }
    } finally {
        await client.end().catch(() => {});
    }
}

/**
 * Nettoyage des rôles obsolètes dans la table utilisateurs.
 * Migre les valeurs enum supprimées vers les rôles unifiés.
 * DOIT tourner AVANT TypeORM synchronize (sinon ALTER COLUMN échoue).
 */
export async function cleanDeprecatedRoles(config: DbConnectionConfig): Promise<void> {
    const client = new Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
    });

    try {
        await client.connect();

        // Vérifier que la table utilisateurs existe
        const hasUtilisateurs = await tableExists(client, 'utilisateurs');
        if (!hasUtilisateurs) {
            logger.debug('ℹ cleanDeprecatedRoles: table utilisateurs inexistante (premier run)');
            return;
        }

        // Mapping des rôles obsolètes → rôles unifiés
        const roleMapping: Record<string, string> = {
            'PLATEFORME_SUPER_ADMIN': 'SUPER_ADMIN',
            'ADMINISTRATION_PLATEFORME': 'PLATEFORME_ADMIN',
            'SECURITE_PLATEFORME': 'PLATEFORME_SUPPORT',
            'SUPPORT_PLATEFORME': 'PLATEFORME_SUPPORT',
            'COMMERCIAL_PLATEFORME': 'PLATEFORME_BILLING',
            'MONITORING_PLATEFORME': 'PLATEFORME_AUDITOR',
        };

        for (const [oldRole, newRole] of Object.entries(roleMapping)) {
            const result = await client.query(
                `UPDATE utilisateurs SET role = $1, "updatedAt" = NOW() WHERE role = $2`,
                [newRole, oldRole]
            );
            if (result.rowCount && result.rowCount > 0) {
                logger.info(`🧹 Rôle obsolète ${oldRole} → ${newRole} (${result.rowCount} utilisateur(s))`);
            }
        }

        // Supprimer l'utilisateur platform.super@elisaschool.cm s'il existe encore
        const deleteResult = await client.query(
            `DELETE FROM utilisateurs WHERE email = 'platform.super@elisaschool.cm'`
        );
        if (deleteResult.rowCount && deleteResult.rowCount > 0) {
            logger.info(`🧹 Supprimé utilisateur platform.super@elisaschool.cm`);
        }

    } catch (err: any) {
        if (err.code === '42P01' || err.code === '3D000') {
            logger.debug('ℹ cleanDeprecatedRoles: ignoré (tables non créées)');
        } else {
            logger.warn(`⚠ cleanDeprecatedRoles: ${err.message}`);
        }
    } finally {
        await client.end().catch(() => {});
    }
}

/**
 * Raccourci qui lit la config depuis les variables d'environnement.
 */
export function envDbConfig(): DbConnectionConfig {
    return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '7002', 10),
        user: process.env.DB_USER || 'elisaschool_user',
        password: process.env.DB_PASSWORD || 'elisaschool_password',
        database: process.env.DB_NAME || 'elisaschool',
    };
}