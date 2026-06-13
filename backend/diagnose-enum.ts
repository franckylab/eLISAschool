/**
 * Script de diagnostic pour identifier l'entité causant l'erreur TypeORM:
 * "columnMetadata.enum.map is not a function"
 */

import { DataSource } from 'typeorm';
import { databaseConfig } from './src/config/database.config';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

async function diagnoseEnumIssue() {
    console.log('🔍 Diagnostic de l\'erreur TypeORM: columnMetadata.enum.map is not a function\n');

    // 1. Trouver toutes les entités
    const entityPattern = path.join(__dirname, 'src', 'modules', '**', 'entities', '*.entity.ts');
    const entityFiles = glob.sync(entityPattern);
    
    console.log(`📁 ${entityFiles.length} fichiers d'entités trouvés\n`);

    // 2. Analyser chaque entité pour les colonnes avec enum
    const problematicEntities: Array<{
        file: string;
        entity: string;
        column: string;
        enumValue: string;
        issue: string;
    }> = [];

    for (const file of entityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        // Chercher les décorateurs @Column avec enum
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const enumMatch = line.match(/@Column\(\{[^}]*enum:\s*([A-Za-z_][A-Za-z0-9_.]*)[^}]*\}\)/);
            
            if (enumMatch) {
                const enumName = enumMatch[1];
                const entityName = path.basename(file).replace('.entity.ts', '');
                
                // Vérifier si l'enum est importé ou défini localement
                const importPattern = new RegExp(`import\\s+\\{[^}]*\\b${enumName}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"]`);
                const localEnumPattern = new RegExp(`(export\\s+)?enum\\s+${enumName}\\s*\\{`);
                
                const importMatch = content.match(importPattern);
                const localEnumMatch = content.match(localEnumPattern);
                
                if (!importMatch && !localEnumMatch) {
                    problematicEntities.push({
                        file: path.relative(__dirname, file),
                        entity: entityName,
                        column: 'unknown',
                        enumValue: enumName,
                        issue: `Enum "${enumName}" n'est ni importé ni défini localement`
                    });
                }
            }
        }
    }

    // 3. Tester la connexion TypeORM entité par entité
    console.log('🧪 Test de chargement des entités...\n');
    
    try {
        const dataSource = new DataSource({
            ...databaseConfig,
            synchronize: true,
            logging: false,
        });

        await dataSource.initialize();
        console.log('✅ Connexion réussie - Les entités se chargent correctement\n');
        
        await dataSource.destroy();
    } catch (error: any) {
        console.error('❌ Erreur lors du chargement des entités:');
        console.error(error.message);
        console.error('\nStack trace:');
        console.error(error.stack);
    }

    // 4. Rapport
    console.log('\n📊 RAPPORT DE DIAGNOSTIC\n');
    console.log('='.repeat(80));
    
    if (problematicEntities.length === 0) {
        console.log('✅ Aucune entité problématique détectée par analyse statique\n');
    } else {
        console.log(`⚠️  ${problematicEntities.length} entité(s) potentiellement problématique(s):\n`);
        problematicEntities.forEach((item, idx) => {
            console.log(`${idx + 1}. ${item.file}`);
            console.log(`   Entité: ${item.entity}`);
            console.log(`   Enum: ${item.enumValue}`);
            console.log(`   Problème: ${item.issue}\n`);
        });
    }

    // 5. Vérifier les conflits de noms d'enums
    console.log('\n🔎 Vérification des conflits de noms d\'enums...\n');
    
    const enumDefinitions: Map<string, string[]> = new Map();
    
    for (const file of entityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const enumMatches = content.matchAll(/export\s+enum\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{/g);
        
        for (const match of enumMatches) {
            const enumName = match[1];
            if (!enumDefinitions.has(enumName)) {
                enumDefinitions.set(enumName, []);
            }
            enumDefinitions.get(enumName)!.push(path.relative(__dirname, file));
        }
    }

    const conflicts = Array.from(enumDefinitions.entries())
        .filter(([_, files]) => files.length > 1);

    if (conflicts.length > 0) {
        console.log(`⚠️  ${conflicts.length} conflit(s) de noms d'enums détecté(s):\n`);
        conflicts.forEach(([enumName, files], idx) => {
            console.log(`${idx + 1}. Enum "${enumName}" défini dans:`);
            files.forEach(file => console.log(`   - ${file}`));
            console.log('');
        });
    } else {
        console.log('✅ Aucun conflit de noms d\'enums détecté\n');
    }
}

// Exécuter le diagnostic
diagnoseEnumIssue().catch(console.error);
