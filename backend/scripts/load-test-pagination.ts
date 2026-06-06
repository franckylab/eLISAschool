/**
 * ==================================
 * eLISAschool - Script de Test de Charge pour la Pagination
 * ==================================
 * Version: 1.0.0
 * Date: 6 juin 2026
 * 
 * Ce script génère des données de test et mesure les performances
 * du système de pagination avec différents volumes de données.
 */

import { AppDataSource } from '@database/data-source';
import { Eleve } from '@modules/eleves/entities';
import { Note } from '@modules/notes/entities';
import { paginateWithQueryBuilder } from '@common/utils/pagination.util';

// ============================================
// CONFIGURATION
// ============================================

interface TestConfig {
    name: string;
    count: number;
    batchSize: number;
}

const TESTS: TestConfig[] = [
    { name: 'Petit volume', count: 1_000, batchSize: 100 },
    { name: 'Volume moyen', count: 10_000, batchSize: 500 },
    { name: 'Gros volume', count: 100_000, batchSize: 1000 },
    { name: 'Très gros volume', count: 1_000_000, batchSize: 5000 },
];

// ============================================
// GÉNÉRATION DE DONNÉES
// ============================================

async function generateTestData(count: number, batchSize: number) {
    console.log(`\n📦 Génération de ${count.toLocaleString()} enregistrements...`);
    
    const eleveRepo = AppDataSource.getRepository(Eleve);
    const noteRepo = AppDataSource.getRepository(Note);
    
    let generated = 0;
    const startTime = Date.now();
    
    for (let batch = 0; batch < count; batch += batchSize) {
        const batchCount = Math.min(batchSize, count - batch);
        
        // Créer des élèves de test
        const eleves = Array.from({ length: Math.ceil(batchCount / 10) }, (_, i) => {
            const eleve = eleveRepo.create({
                matricule: `TEST-${Date.now()}-${i}`,
                dateNaissance: new Date('2000-01-01'),
                lieuNaissance: 'Ville Test',
                sexe: i % 2 === 0 ? 'M' : 'F',
                nomTuteur: `Tuteur ${i}`,
                telephoneTuteur: `+2376${Math.floor(Math.random() * 100000000)}`,
                statut: 'ACTIF',
                sousSysteme: 'FRANCOPHONE',
            });
            return eleve;
        });
        
        if (eleves.length > 0) {
            await eleveRepo.save(eleves);
            generated += eleves.length;
        }
        
        // Progression
        const progress = ((batch + batchCount) / count * 100).toFixed(1);
        process.stdout.write(`\r   Progression: ${progress}% (${(batch + batchCount).toLocaleString()}/${count.toLocaleString()})`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ ${generated.toLocaleString()} enregistrements créés en ${(duration / 1000).toFixed(2)}s`);
    
    return generated;
}

// ============================================
// TESTS DE PERFORMANCE
// ============================================

interface TestResult {
    test: string;
    volume: number;
    page: number;
    limit: number;
    time: number;
    itemsCount: number;
    totalItems: number;
}

async function runPerformanceTest(volume: number): Promise<TestResult[]> {
    console.log(`\n🚀 Tests de performance avec ${volume.toLocaleString()} enregistrements...`);
    
    const results: TestResult[] = [];
    const eleveRepo = AppDataSource.getRepository(Eleve);
    
    // Tests avec différentes pages et limites
    const testCases = [
        { page: 1, limit: 10 },
        { page: 1, limit: 20 },
        { page: 1, limit: 50 },
        { page: 1, limit: 100 },
        { page: 10, limit: 20 },
        { page: 100, limit: 20 },
        { page: 1000, limit: 20 },
    ];
    
    for (const testCase of testCases) {
        const qb = eleveRepo
            .createQueryBuilder('e')
            .where('e.matricule LIKE :pattern', { pattern: 'TEST-%' })
            .orderBy('e.createdAt', 'DESC');
        
        const startTime = Date.now();
        const result = await paginateWithQueryBuilder(qb, testCase.page, testCase.limit, false);
        const duration = Date.now() - startTime;
        
        results.push({
            test: `Page ${testCase.page}, Limit ${testCase.limit}`,
            volume,
            page: testCase.page,
            limit: testCase.limit,
            time: duration,
            itemsCount: result.items.length,
            totalItems: result.meta.totalItems,
        });
        
        console.log(`   ✓ ${testCase.test}: ${duration}ms (${result.items.length} items)`);
    }
    
    return results;
}

// ============================================
// RAPPORT DE RÉSULTATS
// ============================================

function printReport(results: TestResult[]) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RAPPORT DE PERFORMANCE');
    console.log('='.repeat(80));
    console.log();
    
    // Regrouper par volume
    const byVolume = results.reduce((acc, r) => {
        if (!acc[r.volume]) acc[r.volume] = [];
        acc[r.volume].push(r);
        return acc;
    }, {} as Record<number, TestResult[]>);
    
    for (const [volume, volumeResults] of Object.entries(byVolume)) {
        console.log(`Volume: ${parseInt(volume).toLocaleString()} enregistrements`);
        console.log('-'.repeat(80));
        console.log('Test'.padEnd(30), 'Temps'.padEnd(15), 'Items'.padEnd(10), 'Total');
        console.log('-'.repeat(80));
        
        for (const r of volumeResults) {
            console.log(
                r.test.padEnd(30),
                `${r.time}ms`.padEnd(15),
                r.itemsCount.toString().padEnd(10),
                r.totalItems.toLocaleString()
            );
        }
        console.log();
    }
    
    // Statistiques globales
    const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const minTime = Math.min(...results.map(r => r.time));
    const maxTime = Math.max(...results.map(r => r.time));
    
    console.log('='.repeat(80));
    console.log('📈 STATISTIQUES GLOBALES');
    console.log('='.repeat(80));
    console.log(`Temps moyen: ${avgTime.toFixed(2)}ms`);
    console.log(`Temps minimum: ${minTime}ms`);
    console.log(`Temps maximum: ${maxTime}ms`);
    console.log(`Total des tests: ${results.length}`);
    console.log();
    
    // Recommandations
    console.log('💡 RECOMMANDATIONS');
    console.log('='.repeat(80));
    
    if (avgTime < 50) {
        console.log('✅ Performance EXCELLENTE (< 50ms)');
    } else if (avgTime < 100) {
        console.log('✅ Performance BONNE (< 100ms)');
    } else if (avgTime < 200) {
        console.log('⚠️  Performance MOYENNE (< 200ms)');
        console.log('   → Considérer l\'optimisation des index');
    } else {
        console.log('❌ Performance FAIBLE (> 200ms)');
        console.log('   → Optimiser les index requis');
        console.log('   → Activer useOptimizedCount pour les JOINs');
        console.log('   → Considérer le cache Redis');
    }
    
    console.log();
}

// ============================================
// NETTOYAGE
// ============================================

async function cleanupTestData() {
    console.log('\n🧹 Nettoyage des données de test...');
    
    const eleveRepo = AppDataSource.getRepository(Eleve);
    const result = await eleveRepo
        .createQueryBuilder()
        .delete()
        .where('matricule LIKE :pattern', { pattern: 'TEST-%' })
        .execute();
    
    console.log(`✅ ${result.affected} enregistrements supprimés`);
}

// ============================================
// EXÉCUTION PRINCIPALE
// ============================================

async function main() {
    console.log('=========================================');
    console.log('🧪 Tests de Charge - Pagination v2.0');
    console.log('=========================================');
    
    try {
        // Connexion à la base de données
        await AppDataSource.initialize();
        console.log('✅ Connecté à la base de données\n');
        
        const allResults: TestResult[] = [];
        
        // Exécuter les tests pour chaque volume
        for (const test of TESTS) {
            console.log(`\n${'='.repeat(80)}`);
            console.log(`📦 TEST: ${test.name} (${test.count.toLocaleString()} enregistrements)`);
            console.log('='.repeat(80));
            
            // Générer les données
            await generateTestData(test.count, test.batchSize);
            
            // Exécuter les tests de performance
            const results = await runPerformanceTest(test.count);
            allResults.push(...results);
            
            // Nettoyage
            await cleanupTestData();
        }
        
        // Afficher le rapport global
        printReport(allResults);
        
    } catch (error) {
        console.error('\n❌ Erreur lors des tests:', error);
        process.exit(1);
    } finally {
        // Fermer la connexion
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    main();
}

export { main, generateTestData, runPerformanceTest };
