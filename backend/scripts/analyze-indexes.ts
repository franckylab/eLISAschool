/**
 * ==================================
 * eLISAschool - Analyse des Index de Base de Données
 * ==================================
 * 
 * Ce script analyse tous les index de la base de données
 * et détecte les potentielles duplications ou problèmes.
 * 
 * Utilisation:
 *   npx ts-node -r tsconfig-paths/register scripts/analyze-indexes.ts
 */

import 'reflect-metadata';
import { AppDataSource } from '../src/database/data-source';

interface IndexInfo {
    tablename: string;
    indexname: string;
    indexdef: string;
}

interface TableSummary {
    table: string;
    indexes: IndexInfo[];
    potentialDuplicates: string[];
}

async function analyzeIndexes(): Promise<void> {
    console.log('�� Analyse des index de la base de données...\n');

    try {
        await AppDataSource.initialize();
        console.log('✅ Connecté à la base de données\n');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        // Récupérer tous les index
        const allIndexes: IndexInfo[] = await queryRunner.query(`
            SELECT 
                tablename,
                indexname,
                indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
            ORDER BY tablename, indexname
        `);

        // Grouper par table
        const tableMap = new Map<string, IndexInfo[]>();
        allIndexes.forEach(idx => {
            if (!tableMap.has(idx.tablename)) {
                tableMap.set(idx.tablename, []);
            }
            tableMap.get(idx.tablename)!.push(idx);
        });

        // Analyser chaque table
        const summaries: TableSummary[] = [];
        let totalIndexes = 0;
        let totalTables = tableMap.size;

        for (const [tableName, indexes] of tableMap) {
            totalIndexes += indexes.length;

            // Détecter les index potentiellement dupliqués
            const potentialDuplicates: string[] = [];
            const columnMap = new Map<string, string[]>();

            indexes.forEach(idx => {
                // Extraire les colonnes de la définition de l'index
                const match = idx.indexdef.match(/\(([^)]+)\)/);
                if (match) {
                    const columns = match[1];
                    if (!columnMap.has(columns)) {
                        columnMap.set(columns, []);
                    }
                    columnMap.get(columns)!.push(idx.indexname);
                }
            });

            // Vérifier les duplications
            columnMap.forEach((indexNames, columns) => {
                if (indexNames.length > 1) {
                    potentialDuplicates.push(
                        `Colonnes "${columns}": ${indexNames.join(', ')}`
                    );
                }
            });

            summaries.push({
                table: tableName,
                indexes,
                potentialDuplicates
            });
        }

        // Afficher le rapport
        console.log('📊 RAPPORT D\'ANALYSE DES INDEX');
        console.log('='.repeat(60));
        console.log(`Tables analysées: ${totalTables}`);
        console.log(`Total des index: ${totalIndexes}`);
        console.log('='.repeat(60));
        console.log('');

        summaries.forEach(summary => {
            console.log(`📋 Table: ${summary.table}`);
            console.log(`   ${summary.indexes.length} index(es)`);
            
            if (summary.potentialDuplicates.length > 0) {
                console.log('   ⚠️  DOUBLONS POTENTIELS:');
                summary.potentialDuplicates.forEach(dup => {
                    console.log(`      - ${dup}`);
                });
            }

            // Afficher les 5 premiers index
            const toShow = summary.indexes.slice(0, 5);
            toShow.forEach(idx => {
                console.log(`   - ${idx.indexname}`);
            });

            if (summary.indexes.length > 5) {
                console.log(`   ... et ${summary.indexes.length - 5} autres`);
            }

            console.log('');
        });

        // Recommandations
        console.log('💡 RECOMMANDATIONS');
        console.log('='.repeat(60));
        
        const tablesWithDuplicates = summaries.filter(s => s.potentialDuplicates.length > 0);
        
        if (tablesWithDuplicates.length > 0) {
            console.log('⚠️  Tables avec des index potentiellement dupliqués:');
            tablesWithDuplicates.forEach(summary => {
                console.log(`   - ${summary.table}:`);
                summary.potentialDuplicates.forEach(dup => {
                    console.log(`     ${dup}`);
                });
            });
            console.log('');
            console.log('👉 Exécutez la migration 008-drop-duplicate-index.ts pour nettoyer');
        } else {
            console.log('✅ Aucun doublon d\'index détecté');
        }

        console.log('');
        console.log('📝 Pour plus de détails sur un index spécifique:');
        console.log('   SELECT * FROM pg_indexes WHERE indexname = \'IDX_NAME\';');
        console.log('');

        await queryRunner.release();
        await AppDataSource.destroy();

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    }
}

analyzeIndexes();
