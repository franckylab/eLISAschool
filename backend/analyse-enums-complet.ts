/**
 * Analyse complète des enums dans les entités
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

async function analyserEnums() {
    const entityPattern = path.join(__dirname, 'src', 'modules', '**', 'entities', '*.entity.ts');
    const entityFiles = glob.sync(entityPattern);
    
    console.log('📊 ANALYSE COMPLÈTE DES ENUMS DANS LES ENTITÉS\n');
    console.log('='.repeat(80));
    
    // 1. Analyser les imports d'enums
    const enumUsageStats = {
        totalEntities: entityFiles.length,
        entitiesWithEnums: 0,
        totalEnumColumns: 0,
        localEnums: 0,
        importedEnums: 0,
        sharedEnums: 0,
    };
    
    const enumDetails: Array<{
        file: string;
        entity: string;
        enumName: string;
        source: 'local' | 'imported' | '@shared';
        importPath?: string;
    }> = [];
    
    for (const file of entityFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const entityName = path.basename(file).replace('.entity.ts', '');
        
        // Chercher @Column avec enum
        const enumColumns = content.matchAll(/@Column\(\{[^}]*enum:\s*([A-Za-z_][A-Za-z0-9_.]*)[^}]*\}\)/g);
        let fileHasEnum = false;
        
        for (const match of enumColumns) {
            fileHasEnum = true;
            enumUsageStats.totalEnumColumns++;
            const enumName = match[1];
            
            // Vérifier la source
            const localPattern = new RegExp(`(export\\s+)?enum\\s+${enumName}\\s*\\{`);
            const importPattern = new RegExp(`import\\s+\\{[^}]*\\b${enumName}\\b[^}]*\\}\\s+from\\s+['"]([^'"]+)['"]`);
            
            const isLocal = localPattern.test(content);
            const importMatch = content.match(importPattern);
            
            if (isLocal) {
                enumUsageStats.localEnums++;
                enumDetails.push({
                    file: path.relative(__dirname, file),
                    entity: entityName,
                    enumName,
                    source: 'local',
                });
            } else if (importMatch) {
                const importPath = importMatch[1];
                const isShared = importPath.startsWith('@shared') || importPath.includes('shared');
                if (isShared) {
                    enumUsageStats.sharedEnums++;
                    enumDetails.push({
                        file: path.relative(__dirname, file),
                        entity: entityName,
                        enumName,
                        source: '@shared',
                        importPath,
                    });
                } else {
                    enumUsageStats.importedEnums++;
                    enumDetails.push({
                        file: path.relative(__dirname, file),
                        entity: entityName,
                        enumName,
                        source: 'imported',
                        importPath,
                    });
                }
            }
        }
        
        if (fileHasEnum) {
            enumUsageStats.entitiesWithEnums++;
        }
    }
    
    // Afficher les statistiques
    console.log('\n📈 STATISTIQUES GLOBALES\n');
    console.log(`Total entités analysées: ${enumUsageStats.totalEntities}`);
    console.log(`Entités avec enums: ${enumUsageStats.entitiesWithEnums}`);
    console.log(`Total colonnes avec enums: ${enumUsageStats.totalEnumColumns}`);
    console.log(`\nRépartition des sources:`);
    console.log(`  • Enums locaux: ${enumUsageStats.localEnums}`);
    console.log(`  • Enums importés (autres modules): ${enumUsageStats.importedEnums}`);
    console.log(`  • Enums importés (@shared): ${enumUsageStats.sharedEnums}`);
    
    // 2. Afficher les enums locaux par module
    console.log('\n\n📦 ENUMS LOCAUX PAR MODULE\n');
    console.log('='.repeat(80));
    
    const enumsByModule = new Map<string, Array<{entity: string, enumName: string}>>();
    
    enumDetails
        .filter(d => d.source === 'local')
        .forEach(d => {
            const moduleMatch = d.file.match(/src\/modules\/([^\/]+)/);
            if (moduleMatch) {
                const moduleName = moduleMatch[1];
                if (!enumsByModule.has(moduleName)) {
                    enumsByModule.set(moduleName, []);
                }
                enumsByModule.get(moduleName)!.push({
                    entity: d.entity,
                    enumName: d.enumName,
                });
            }
        });
    
    for (const [module, enums] of Array.from(enumsByModule.entries()).sort()) {
        console.log(`\n📁 Module: ${module}`);
        enums.forEach(e => {
            console.log(`   • ${e.enumName} (dans ${e.entity})`);
        });
    }
    
    // 3. Enums partagés (@shared)
    console.log('\n\n🌐 ENUMS PARTAGÉS (@shared)\n');
    console.log('='.repeat(80));
    
    const sharedEnums = enumDetails.filter(d => d.source === '@shared');
    if (sharedEnums.length > 0) {
        sharedEnums.forEach(d => {
            console.log(`• ${d.enumName}`);
            console.log(`  Utilisé dans: ${d.file}`);
            console.log(`  Importé de: ${d.importPath}\n`);
        });
    } else {
        console.log('Aucun enum importé depuis @shared détecté');
    }
    
    // 4. Conflits potentiels
    console.log('\n\n⚠️  CONFLITS POTENTIELS\n');
    console.log('='.repeat(80));
    
    const enumNames = new Map<string, string[]>();
    enumDetails.filter(d => d.source === 'local').forEach(d => {
        if (!enumNames.has(d.enumName)) {
            enumNames.set(d.enumName, []);
        }
        enumNames.get(d.enumName)!.push(d.file);
    });
    
    let conflictCount = 0;
    for (const [enumName, files] of enumNames) {
        if (files.length > 1) {
            conflictCount++;
            console.log(`\n⚠️  Enum "${enumName}" défini dans ${files.length} fichiers:`);
            files.forEach(f => console.log(`   - ${f}`));
        }
    }
    
    if (conflictCount === 0) {
        console.log('✅ Aucun conflit détecté');
    }
    
    console.log('\n\n✅ ANALYSE TERMINÉE');
}

analyserEnums().catch(console.error);
