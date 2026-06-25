#!/usr/bin/env node
/**
 * ==================================
 * eLISAschool - Analyse des Permissions Manquantes
 * ==================================
 * Identifie les permissions utilisées dans DEFAULT_ROLE_PERMISSIONS
 * qui ne sont pas définies dans le enum Permission
 */

const fs = require('fs');
const path = require('path');

const rolesEnumPath = path.join(__dirname, '../shared/src/enums/roles.enum.ts');
const content = fs.readFileSync(rolesEnumPath, 'utf-8');

// Extraire le enum Permission
const permissionEnumMatch = content.match(/export enum Permission \{([\s\S]*?)\n\}/);
if (!permissionEnumMatch) {
    console.error('❌ Impossible de trouver le enum Permission');
    process.exit(1);
}

// Parser les permissions définies dans le enum
const definedPermissions = new Set();
const permissionLines = permissionEnumMatch[1].split('\n');
for (const line of permissionLines) {
    const match = line.match(/^\s+(\w+)\s*=\s*'([^']+)'/);
    if (match) {
        definedPermissions.add(match[2]); // La valeur string, ex: 'users:view'
    }
}

console.log(`📊 Permissions définies dans le enum: ${definedPermissions.size}`);

// Extraire toutes les permissions utilisées dans DEFAULT_ROLE_PERMISSIONS
const usedPermissions = new Set();
const permissionRefs = content.match(/Permission\.(\w+)/g) || [];
for (const ref of permissionRefs) {
    // Trouver la valeur de cette permission
    const permName = ref.replace('Permission.', '');
    const valueMatch = content.match(new RegExp(`${permName}\\s*=\\s*'([^']+)'`));
    if (valueMatch) {
        usedPermissions.add(valueMatch[1]);
    }
}

console.log(`📊 Permissions utilisées dans DEFAULT_ROLE_PERMISSIONS: ${usedPermissions.size}`);

// Trouver les permissions utilisées mais non définies
const missingPermissions = [];
for (const perm of usedPermissions) {
    if (!definedPermissions.has(perm)) {
        missingPermissions.push(perm);
    }
}

console.log(`\n❌ Permissions manquantes dans le enum: ${missingPermissions.length}`);
console.log('='.repeat(80));

if (missingPermissions.length > 0) {
    // Grouper par module
    const byModule = {};
    for (const perm of missingPermissions.sort()) {
        const [module] = perm.split(':');
        if (!byModule[module]) {
            byModule[module] = [];
        }
        byModule[module].push(perm);
    }

    console.log('\n📋 Répartition par module:');
    for (const [module, perms] of Object.entries(byModule).sort()) {
        console.log(`\n  ${module} (${perms.length} permissions):`);
        for (const perm of perms) {
            console.log(`    - ${perm}`);
        }
    }

    // Générer le code à ajouter
    console.log('\n\n📝 Code à ajouter dans le enum Permission:');
    console.log('='.repeat(80));
    
    let currentModule = '';
    for (const perm of missingPermissions.sort()) {
        const [module, ...actionParts] = perm.split(':');
        const action = actionParts.join(':');
        
        if (module !== currentModule) {
            if (currentModule !== '') {
                console.log('');
            }
            console.log(`\n    // ${module.toUpperCase()}`);
            currentModule = module;
        }
        
        const constName = perm.toUpperCase().replace(/[^A-Z0-9]/g, '_');
        console.log(`    ${constName} = '${perm}',`);
    }

    console.log('\n\n');
    console.log('='.repeat(80));
    console.log(`Total à ajouter: ${missingPermissions.length} permissions`);
    console.log(`Total après correction: ${definedPermissions.size + missingPermissions.length} permissions`);
} else {
    console.log('\n✅ Toutes les permissions utilisées sont bien définies dans le enum');
}
