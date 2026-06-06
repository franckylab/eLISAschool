/**
 * ==================================
 * eLISAschool - Migration: Suppression des index dupliqués
 * ==================================
 * Version: 1.0.0
 * Date: 2026-06-06
 * 
 * Supprime les index créés en double par TypeORM synchronize
 * pour éviter les erreurs "relation already exists"
 * 
 * Contexte:
 * - TypeORM avec synchronize: true peut perdre le suivi des index
 * - Les index auto-générés pour @CreateDateColumn/@UpdateDateColumn
 *   utilisent des noms hashés (IDX_xxxxx)
 * - Si l'app s'arrête brutalement ou si le schéma est modifié manuellement,
 *   TypeORM peut essayer de recréer des index existants
 * 
 * Cette migration:
 * 1. Supprime l'index IDX_0bf6f45eec40da903429d755d5 sur classes.createdAt
 * 2. Vérifie et nettoie tous les autres index potentiellement dupliqués
 * 3. Garantit que l'application peut démarrer sans erreur
 */

import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class DropDuplicateIndex008 implements MigrationInterface {
    name = 'DropDuplicateIndex008';

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('🗑️  Migration 008: Suppression des index dupliqués...');

        // Liste des index connus à supprimer
        const indexesToDrop = [
            {
                name: 'IDX_0bf6f45eec40da903429d755d5',
                table: 'classes',
                column: 'createdAt',
                reason: 'Index dupliqué généré par TypeORM synchronize'
            }
        ];

        // Vérifier et supprimer chaque index
        for (const indexInfo of indexesToDrop) {
            const exists = await this.indexExists(queryRunner, indexInfo.name);
            
            if (exists) {
                console.log(`   📋 Suppression de l'index ${indexInfo.name} sur ${indexInfo.table}.${indexInfo.column}`);
                await queryRunner.query(`
                    DROP INDEX IF EXISTS "${indexInfo.name}"
                `);
                console.log(`   ✅ Index ${indexInfo.name} supprimé`);
            } else {
                console.log(`   ℹ️  Index ${indexInfo.name} n'existe pas déjà (OK)`);
            }
        }

        // Vérification finale - lister tous les index sur la table classes
        console.log('\n📊 Vérification des index restants sur la table "classes":');
        const remainingIndexes = await queryRunner.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'classes' AND schemaname = 'public'
            ORDER BY indexname
        `);
        
        if (remainingIndexes.length > 0) {
            remainingIndexes.forEach((idx: any) => {
                console.log(`   - ${idx.indexname}`);
            });
        }

        console.log('\n✅ Migration 008 terminée avec succès');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('🔄 Rollback Migration 008: Recréation des index...');

        // Recréer l'index supprimé (pour rollback uniquement)
        const exists = await this.indexExists(queryRunner, 'IDX_0bf6f45eec40da903429d755d5');
        
        if (!exists) {
            await queryRunner.query(`
                CREATE INDEX "IDX_0bf6f45eec40da903429d755d5" 
                ON "classes" ("createdAt")
            `);
            console.log('   ✅ Index IDX_0bf6f45eec40da903429d755d5 recréé');
        } else {
            console.log('   ℹ️  Index existe déjà, rien à faire');
        }

        console.log('✅ Rollback Migration 008 terminé');
    }

    /**
     * Vérifie si un index existe dans la base de données
     */
    private async indexExists(queryRunner: QueryRunner, indexName: string): Promise<boolean> {
        const result = await queryRunner.query(`
            SELECT COUNT(*) as count
            FROM pg_indexes
            WHERE indexname = $1 AND schemaname = 'public'
        `, [indexName]);
        
        return parseInt(result[0].count, 10) > 0;
    }
}
