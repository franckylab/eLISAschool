/**
 * Script de diagnostic amélioré - identifie l'entité exacte causant l'erreur
 */

import { DataSource } from 'typeorm';

async function testEntities() {
    console.log('🔍 Diagnostic TypeORM - Identification de l\'entité problématique\n');

    // Charger dynamiquement toutes les entités
    const entityFiles = await import('glob');
    const path = await import('path');
    const fs = await import('fs');

    const entityPattern = path.join(__dirname, 'src', 'modules', '**', 'entities', '*.entity.ts');
    const files = entityFiles.sync(entityPattern);
    
    console.log(`📁 ${files.length} fichiers d'entités trouvés\n`);

    // Regrouper les entités par fichier pour les charger
    const allEntities: any[] = [];
    
    for (const file of files) {
        try {
            const entityModule = await import(file);
            
            // Extraire toutes les classes Entity du module
            for (const exportName of Object.keys(entityModule)) {
                const exported = entityModule[exportName];
                // Vérifier si c'est une classe (fonction constructeur)
                if (typeof exported === 'function' && exported.prototype) {
                    // Vérifier si c'est une entité TypeORM (a le décorateur Entity)
                    const hasEntityDecorator = Reflect.getMetadata('design:type', exported) || 
                                             exported.toString().includes('Entity');
                    if (hasEntityDecorator || exportName[0] === exportName[0].toUpperCase()) {
                        allEntities.push(exported);
                    }
                }
            }
        } catch (error: any) {
            console.warn(`⚠️  Erreur chargement ${file}: ${error.message}`);
        }
    }

    console.log(`📦 ${allEntities.length} entités chargées\n`);
    console.log('🧪 Tentative de synchronisation...\n');

    // Configurer DataSource avec logging détaillé
    const { databaseConfig } = await import('./src/config/database.config');
    
    try {
        const dataSource = new DataSource({
            ...databaseConfig,
            synchronize: true,
            logging: ['query', 'error', 'warn'],
        });

        await dataSource.initialize();
        console.log('\n✅ Synchronisation réussie - Aucune entité problématique détectée');
        
        await dataSource.destroy();
    } catch (error: any) {
        console.error('\n❌ ERREUR lors de la synchronisation:');
        console.error('='.repeat(80));
        console.error(error.message);
        console.error('='.repeat(80));
        
        // Extraire le nom de l'entité du message d'erreur ou du stack trace
        if (error.stack) {
            const stackLines = error.stack.split('\n');
            console.error('\n📍 Stack trace (5 premières lignes):');
            stackLines.slice(0, 5).forEach(line => console.error(line));
        }
        
        // Chercher des indices dans le message
        const entityMatch = error.message.match(/entity[:\s]+([A-Za-z_]+)/i);
        if (entityMatch) {
            console.error(`\n🎯 Entité suspectée: ${entityMatch[1]}`);
        }
        
        const tableMatch = error.message.match(/table[:\s]+([A-Za-z_]+)/i);
        if (tableMatch) {
            console.error(`\n🎯 Table suspectée: ${tableMatch[1]}`);
        }
    }
}

testEntities().catch(console.error);
