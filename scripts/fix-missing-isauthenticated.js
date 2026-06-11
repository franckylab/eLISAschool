/**
 * ==================================
 * eLISAschool - Correction des déclarations isAuthenticated manquantes
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_SRC = '/home/franckylab/projets/eLISAschool/frontend/src';

// Trouver les fichiers avec le problème
const result = execSync(
    `cd ${FRONTEND_SRC} && for file in features/*/hooks/use-*.ts; do ` +
    `if grep -q "enabled: isAuthenticated" "$file" && ! grep -q "const { isAuthenticated }" "$file"; then ` +
    `echo "$file"; fi; done`,
    { encoding: 'utf8' }
);

const files = result.trim().split('\n').filter(f => f);

console.log(`🔧 Correction de ${files.length} fichiers...\n`);

let corrected = 0;
let errors = 0;

files.forEach((relativePath, index) => {
    const filePath = path.join(FRONTEND_SRC, relativePath);
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Trouver la première fonction qui utilise useQuery
        // et ajouter const { isAuthenticated } = useAuthStore();
        
        // Pattern: trouver "export function use" et ajouter après l'accolade ouvrante
        const functionPattern = /(export function use\w+\([^)]*\)\s*\{)\n/;
        
        if (functionPattern.test(content)) {
            // Ajouter la déclaration après la première fonction
            content = content.replace(
                functionPattern,
                '$1\n    const { isAuthenticated } = useAuthStore();\n'
            );
            
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ [${index + 1}/${files.length}] ${relativePath}`);
            corrected++;
        } else {
            console.log(`⚠️  [${index + 1}/${files.length}] ${relativePath} - Pattern non trouvé`);
        }
    } catch (error) {
        console.error(`❌ [${index + 1}/${files.length}] ${relativePath}: ${error.message}`);
        errors++;
    }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Résumé:`);
console.log(`   ✅ Corrigés: ${corrected}`);
console.log(`   ❌ Erreurs: ${errors}`);
console.log(`   📁 Total: ${files.length}`);
console.log('='.repeat(60));
