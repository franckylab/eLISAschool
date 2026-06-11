#!/usr/bin/env node

/**
 * ==================================
 * eLISAschool - Script de Vérification des Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Vérifie les incohérences entre les permissions définies dans l'enum
 * et les permissions utilisées dans le code frontend
 */

const fs = require('fs');
const path = require('path');

const ROLES_ENUM_PATH = path.join(__dirname, '../../shared/src/enums/roles.enum.ts');
const FRONTEND_SRC = path.join(__dirname, '../../frontend/src');

console.log('🔍 Vérification des permissions eLISAschool...\n');

// 1. Extraire les permissions de l'enum
function extractPermissionsFromEnum() {
    const content = fs.readFileSync(ROLES_ENUM_PATH, 'utf-8');
    const permissionRegex = /^\s+([A-Z_]+)\s*=\s*['"]([^'"]+)['"]/gm;
    const permissions = new Map();
    
    let match;
    while ((match = permissionRegex.exec(content)) !== null) {
        permissions.set(match[2], match[1]);
    }
    
    return permissions;
}

// 2. Extraire les permissions utilisées dans le frontend
function extractPermissionsFromFrontend() {
    const usedPermissions = new Set();
    const files = getAllFiles(FRONTEND_SRC, ['.ts', '.tsx']);
    
    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Pattern: hasPermission('xxx:yyy')
        const hasPermRegex = /hasPermission\(['"]([^'"]+)['"]\)/g;
        let match;
        while ((match = hasPermRegex.exec(content)) !== null) {
            usedPermissions.add(match[1]);
        }
        
        // Pattern: permission="xxx:yyy"
        const permPropRegex = /permission=['"]([^'"]+)['"]/g;
        while ((match = permPropRegex.exec(content)) !== null) {
            usedPermissions.add(match[1]);
        }
        
        // Pattern: permissions={['xxx', 'yyy']}
        const permsArrayRegex = /permissions=\{?\[([^\]]+)\]/g;
        while ((match = permsArrayRegex.exec(content)) !== null) {
            const perms = match[1].match(/['"]([^'"]+)['"]/g);
            if (perms) {
                perms.forEach(p => {
                    const clean = p.replace(/['"]/g, '');
                    usedPermissions.add(clean);
                });
            }
        }
    });
    
    return usedPermissions;
}

// 3. Helper: Récupérer tous les fichiers
function getAllFiles(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git')) {
                results = results.concat(getAllFiles(file, extensions));
            }
        } else if (extensions.some(ext => file.endsWith(ext))) {
            results.push(file);
        }
    });
    
    return results;
}

// 4. Vérifier les incohérences
function checkInconsistencies() {
    const enumPermissions = extractPermissionsFromEnum();
    const usedPermissions = extractPermissionsFromFrontend();
    
    console.log(`📊 Permissions dans l'enum : ${enumPermissions.size}`);
    console.log(`📊 Permissions utilisées dans le frontend : ${usedPermissions.size}\n`);
    
    // Permissions utilisées mais pas dans l'enum
    const missingInEnum = [];
    usedPermissions.forEach(perm => {
        if (!enumPermissions.has(perm)) {
            missingInEnum.push(perm);
        }
    });
    
    if (missingInEnum.length > 0) {
        console.log('⚠️  Permissions utilisées mais NON DÉFINIES dans l\'enum :');
        missingInEnum.forEach(perm => {
            console.log(`   - ${perm}`);
        });
        console.log('');
    } else {
        console.log('✅ Toutes les permissions utilisées sont définies dans l\'enum\n');
    }
    
    // Permissions dans l'enum mais jamais utilisées
    const unusedPermissions = [];
    enumPermissions.forEach((key, perm) => {
        if (!usedPermissions.has(perm)) {
            unusedPermissions.push(perm);
        }
    });
    
    if (unusedPermissions.length > 0) {
        console.log(`💡 Permissions définies mais JAMAIS UTILISÉES (${unusedPermissions.length}) :`);
        unusedPermissions.slice(0, 20).forEach(perm => {
            console.log(`   - ${perm}`);
        });
        if (unusedPermissions.length > 20) {
            console.log(`   ... et ${unusedPermissions.length - 20} autres`);
        }
        console.log('');
    }
    
    // Statistiques par module
    const moduleStats = {};
    enumPermissions.forEach((key, perm) => {
        const module = perm.split(':')[0];
        if (!moduleStats[module]) {
            moduleStats[module] = { total: 0, used: 0 };
        }
        moduleStats[module].total++;
        if (usedPermissions.has(perm)) {
            moduleStats[module].used++;
        }
    });
    
    console.log('📈 Statistiques par module :');
    console.log('─'.repeat(60));
    Object.entries(moduleStats)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([module, stats]) => {
            const percentage = Math.round((stats.used / stats.total) * 100);
            const bar = '█'.repeat(percentage / 5) + '░'.repeat(20 - percentage / 5);
            console.log(`${module.padEnd(20)} ${stats.used.toString().padStart(3)}/${stats.total.toString().padStart(3)} ${bar} ${percentage}%`);
        });
    
    console.log('\n✅ Vérification terminée !');
    
    // Retourner un code d'erreur si permissions manquantes
    return missingInEnum.length > 0 ? 1 : 0;
}

// Exécuter la vérification
try {
    const exitCode = checkInconsistencies();
    process.exit(exitCode);
} catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
    process.exit(1);
}
