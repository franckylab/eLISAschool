/**
 * ==================================
 * eLISAschool - Script d'ajout automatique d'authentification aux hooks
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Ce script ajoute `enabled: isAuthenticated` à tous les hooks useQuery
 * et importe useAuthStore si nécessaire
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_SRC = '/home/franckylab/projets/eLISAschool/frontend/src/features';

// Trouver tous les fichiers use-*.ts dans les hooks
function findHookFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat && stat.isDirectory()) {
            if (file === 'hooks') {
                // Chercher les fichiers use-*.ts
                const hookFiles = fs.readdirSync(filePath)
                    .filter(f => f.startsWith('use-') && f.endsWith('.ts'));
                hookFiles.forEach(f => {
                    results.push(path.join(filePath, f));
                });
            } else {
                results = results.concat(findHookFiles(filePath));
            }
        }
    });
    
    return results;
}

// Ajouter useAuthStore et enabled à un hook
function processHookFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Vérifier si le fichier contient useQuery
    if (!content.includes('useQuery(')) {
        return { modified: false, reason: 'Pas de useQuery' };
    }
    
    // Vérifier si enabled: isAuthenticated existe déjà
    if (content.includes('enabled: isAuthenticated')) {
        return { modified: false, reason: 'Déjà présent' };
    }
    
    // 1. Ajouter l'import useAuthStore si nécessaire
    if (!content.includes('useAuthStore')) {
        // Trouver l'import de @tanstack/react-query
        const reactQueryImport = "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';";
        
        if (content.includes(reactQueryImport)) {
            content = content.replace(
                reactQueryImport,
                reactQueryImport + "\nimport { useAuthStore } from '@/stores/auth.store';"
            );
        } else {
            // Essayer un autre pattern
            const importMatch = content.match(/import \{ useQuery[^}]*\} from '@tanstack\/react-query';/);
            if (importMatch) {
                content = content.replace(
                    importMatch[0],
                    importMatch[0] + "\nimport { useAuthStore } from '@/stores/auth.store';"
                );
            }
        }
    }
    
    // 2. Ajouter enabled: isAuthenticated dans les useQuery
    // Pattern: trouver les useQuery({ ... }) et ajouter enabled avant staleTime ou à la fin
    const useQueryPattern = /(useQuery\(\{[\s\S]*?)(staleTime:)/g;
    
    if (useQueryPattern.test(content)) {
        // Réinitialiser le regex
        useQueryPattern.lastIndex = 0;
        content = content.replace(useQueryPattern, '$1enabled: isAuthenticated,\n        $2');
    } else {
        // Pattern alternatif: ajouter avant la fermeture du premier useQuery
        const queryStart = content.indexOf('useQuery({');
        if (queryStart !== -1) {
            // Trouver la première occurrence de staleTime ou la fermeture
            const staleTimeIndex = content.indexOf('staleTime:', queryStart);
            const closingBrace = content.indexOf('});', queryStart);
            
            if (staleTimeIndex !== -1 && staleTimeIndex < closingBrace) {
                content = content.slice(0, staleTimeIndex) + 
                         'enabled: isAuthenticated,\n        ' + 
                         content.slice(staleTimeIndex);
            }
        }
    }
    
    // Vérifier si des modifications ont été faites
    if (content === originalContent) {
        return { modified: false, reason: 'Aucune modification possible' };
    }
    
    // Écrire le fichier
    fs.writeFileSync(filePath, content, 'utf8');
    return { modified: true };
}

// Main
console.log('🔧 Ajout de isAuthenticated à tous les hooks...\n');

const hookFiles = findHookFiles(FRONTEND_SRC);
console.log(`📊 ${hookFiles.length} hooks trouvés\n`);

let modified = 0;
let skipped = 0;
let errors = 0;

hookFiles.forEach((filePath, index) => {
    const relativePath = path.relative('/home/franckylab/projets/eLISAschool/frontend/src', filePath);
    
    try {
        const result = processHookFile(filePath);
        
        if (result.modified) {
            console.log(`✅ [${index + 1}/${hookFiles.length}] ${relativePath}`);
            modified++;
        } else {
            console.log(`⏭️  [${index + 1}/${hookFiles.length}] ${relativePath} (${result.reason})`);
            skipped++;
        }
    } catch (error) {
        console.error(`❌ [${index + 1}/${hookFiles.length}] ${relativePath}: ${error.message}`);
        errors++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Résumé:`);
console.log(`   ✅ Modifiés: ${modified}`);
console.log(`   ⏭️  Passés: ${skipped}`);
console.log(`   ❌ Erreurs: ${errors}`);
console.log(`   📁 Total: ${hookFiles.length}`);
console.log('='.repeat(60));
