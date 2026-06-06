/**
 * ==================================
 * eLISAschool - Migration Paramètres Multi-Établissements
 * ==================================
 * Version: 1.0.0
 * Description: Ajoute le support du scopage par établissement pour ParametreSysteme
 * 
 * CHANGEMENTS:
 * 1. Ajoute colonne etablissement_id (UUID, nullable)
 * 2. Change index unique de (cle) vers (cle, etablissement_id)
 * 3. Ajoute index sur etablissement_id seul
 * 
 * SÉMANTIQUE:
 * - etablissement_id = NULL → Paramètre global (default)
 * - etablissement_id = UUID → Override spécifique à cet établissement
 * 
 * BACKWARD COMPATIBILITY:
 * - Tous les paramètres existants restent avec etablissement_id = NULL
 * - ZERO breaking change
 * - Migration réversible
 * 
 * DATE: 2025-01-19
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class ParametresMultiEtablissements1737300000000 implements MigrationInterface {
    name = 'ParametresMultiEtablissements1737300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('📝 Migration: Scopage des paramètres par établissement...');

        // 1. Ajouter la colonne etablissement_id
        await queryRunner.query(`
            ALTER TABLE parametres_systeme 
            ADD COLUMN etablissement_id UUID NULL
        `);

        console.log('✅ Colonne etablissement_id ajoutée');

        // 2. Supprimer l'ancien index unique sur cle seule
        await queryRunner.query(`
            DROP INDEX IF EXISTS IDX_parametres_systeme_cle
        `);

        // PostgreSQL: Supprimer les contraintes UNIQUE sur cle
        await queryRunner.query(`
            ALTER TABLE parametres_systeme DROP CONSTRAINT IF EXISTS "UQ_65b1e738c8c19c81eb8add4edf0"
        `);
        
        await queryRunner.query(`
            DO $$ 
            BEGIN
                -- Supprimer toutes les contraintes UNIQUE restantes sur cle
                WHILE EXISTS (
                    SELECT 1 FROM pg_constraint 
                    WHERE contype = 'u' 
                    AND conrelid = 'parametres_systeme'::regclass
                    AND conkey = ARRAY(SELECT attnum FROM pg_attribute WHERE attrelid = 'parametres_systeme'::regclass AND attname = 'cle')
                ) LOOP
                    DECLARE
                        constraint_name TEXT;
                    BEGIN
                        SELECT conname INTO constraint_name
                        FROM pg_constraint 
                        WHERE contype = 'u' 
                        AND conrelid = 'parametres_systeme'::regclass
                        LIMIT 1;
                        
                        EXECUTE 'ALTER TABLE parametres_systeme DROP CONSTRAINT ' || quote_ident(constraint_name);
                    END;
                END LOOP;
            END $$;
        `);

        console.log('✅ Ancien index unique supprimé');

        // 3. Créer le nouvel index unique composite (cle, etablissement_id)
        // PostgreSQL traite NULL != NULL dans les index uniques
        // Donc (cle, NULL) et (cle, 'uuid') peuvent coexister
        await queryRunner.query(`
            CREATE UNIQUE INDEX idx_parametres_cle_etablissement 
            ON parametres_systeme(cle, etablissement_id)
        `);

        console.log('✅ Nouvel index unique composite créé: (cle, etablissement_id)');

        // 4. Créer un index simple sur etablissement_id pour les requêtes de filtrage
        await queryRunner.query(`
            CREATE INDEX idx_parametres_etablissement 
            ON parametres_systeme(etablissement_id)
        `);

        console.log('✅ Index sur etablissement_id créé');

        // 5. Ajouter un commentaire sur la colonne
        await queryRunner.query(`
            COMMENT ON COLUMN parametres_systeme.etablissement_id IS 
            'NULL = paramètre global (default), UUID = override par établissement'
        `);

        console.log('✅ Commentaire ajouté sur la colonne');

        // 6. Vérification: compter les paramètres
        const result = await queryRunner.query(`
            SELECT COUNT(*) as total,
                   COUNT(etablissement_id) as scoped,
                   COUNT(*) - COUNT(etablissement_id) as global
            FROM parametres_systeme
        `);

        console.log(`📊 Statistiques:`);
        console.log(`   Total: ${result[0].total}`);
        console.log(`   Globaux (NULL): ${result[0].global}`);
        console.log(`   Scopés (UUID): ${result[0].scoped}`);

        console.log('✅ Migration terminée avec succès!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('↩️ Rollback: Suppression du scopage par établissement...');

        // 1. Supprimer les index
        await queryRunner.query(`DROP INDEX IF EXISTS idx_parametres_cle_etablissement`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_parametres_etablissement`);

        // 2. Recréer l'ancien index unique sur cle seule
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_parametres_cle_unique 
            ON parametres_systeme(cle)
        `);

        // 3. Supprimer la colonne
        await queryRunner.query(`
            ALTER TABLE parametres_systeme 
            DROP COLUMN etablissement_id
        `);

        console.log('✅ Rollback terminé');
    }
}
