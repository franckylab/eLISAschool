import { DataSource } from 'typeorm';
import { AppDataSource } from './data-source';

async function runMigrations() {
    console.log('🚀 Exécution des migrations...');
    
    try {
        // Désactiver synchronize pour éviter les conflits avec les migrations
        const migrationDataSource = new DataSource({
            ...AppDataSource.options,
            synchronize: false,
            migrationsRun: false,
        });
        
        await migrationDataSource.initialize();
        console.log('✅ Base de données connectée');

        const migrations = await migrationDataSource.runMigrations();
        
        if (migrations.length === 0) {
            console.log('ℹ️  Aucune migration à exécuter');
        } else {
            console.log(`✅ ${migrations.length} migration(s) exécutée(s):`);
            migrations.forEach((m: any) => {
                console.log(`   - ${m.name}`);
            });
        }

        await migrationDataSource.destroy();
        console.log('✅ Migrations terminées avec succès!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors de l\'exécution des migrations:', error);
        process.exit(1);
    }
}

runMigrations();
