#!/usr/bin/env node

/**
 * ==================================
 * eLISAschool - Script de Migration requireRoles → requirePermission
 * ==================================
 * Version: 1.0.0
 * 
 * Remplace toutes les occurrences de requireRoles() par requirePermission()
 * avec mapping intelligent des rôles vers les permissions équivalentes.
 */

const fs = require('fs');
const path = require('path');

// ==================================
// MAPPING RÔLES → PERMISSIONS
// ==================================

const ROLE_TO_PERMISSION = {
    // Rôles individuels
    'Role.SUPER_ADMIN': 'super_admin:all',
    'Role.ADMIN': 'admin:manage',
    'Role.CHEF_ETABLISSEMENT': 'chef:manage',
    'Role.ENSEIGNANT': 'enseignant:manage',
    'Role.PERSONNEL': 'personnel:manage',
    'Role.PARENT': 'parent:view',
    'Role.ELEVE': 'eleve:view',
    'Role.RESPONSABLE_CANTINE': 'cantine:manage',
    'Role.RESPONSABLE_TRANSPORT': 'transport:manage',
    'Role.RESPONSABLE_INFRASTRUCTURE': 'infrastructure:manage',
    'Role.DIRECTEUR': 'directeur:manage',
    'Role.CONSEILLER_ORIENTEUR': 'orientation:manage',
    'Role.SURVEILLANT': 'surveillance:manage',
    'Role.COMPTABLE': 'finances:manage',
    'Role.BIBLIOTHECAIRE': 'bibliotheque:manage',
    'Role.STAGIAIRE': 'stage:manage',
};

// Mapping des combinaisons courantes de rôles
const COMBINAISONS_MAPPING = {
    // ADMIN + SUPER_ADMIN → admin:manage (SUPER_ADMIN a super_admin:all automatiquement)
    'Role.ADMIN, Role.SUPER_ADMIN': 'admin:manage',
    'Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT': 'admin:manage',
    'Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR': 'admin:manage',
    'Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT, Role.DIRECTEUR': 'chef:manage',
    'Role.SUPER_ADMIN': 'super_admin:all',
    'Role.ADMIN': 'admin:manage',
    'Role.ENSEIGNANT, Role.ADMIN': 'enseignant:manage',
    'Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT': 'enseignant:manage',
    'Role.ADMIN, Role.SUPER_ADMIN, Role.PERSONNEL': 'personnel:manage',
    'Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_INFRASTRUCTURE': 'infrastructure:manage',
};

// ==================================
// FONCTIONS D'AIDE
// ==================================

/**
 * Extrait les rôles d'une expression requireRoles()
 */
function extractRoles(expression) {
    const match = expression.match(/requireRoles\((.+?)\)/);
    if (!match) return null;
    return match[1].split(',').map(r => r.trim());
}

/**
 * Trouve la permission équivalente pour une combinaison de rôles
 */
function findPermissionForRoles(roles) {
    // Normaliser les rôles (enlever les espaces, ordre alphabétique)
    const normalized = roles.map(r => r.trim()).sort().join(', ');
    
    // Chercher dans les combinaisons connues
    for (const [key, value] of Object.entries(COMBINAISONS_MAPPING)) {
        const keyNormalized = key.split(',').map(r => r.trim()).sort().join(', ');
        if (keyNormalized === normalized) {
            return value;
        }
    }
    
    // Si une seule rôle, retourner la permission directe
    if (roles.length === 1) {
        return ROLE_TO_PERMISSION[roles[0]] || null;
    }
    
    // Si pas de mapping exact, prendre la permission du premier rôle
    // (en supposant que c'est le plus restrictif)
    return ROLE_TO_PERMISSION[roles[0]] || null;
}

/**
 * Remplace requireRoles par requirePermission dans un fichier
 */
function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le fichier contient requireRoles
    if (!content.includes('requireRoles(')) {
        return { migrated: false, changes: 0 };
    }
    
    let changes = 0;
    const originalContent = content;
    
    // Pattern pour matcher requireRoles(...)
    const pattern = /requireRoles\(([^)]+)\)/g;
    
    content = content.replace(pattern, (match, rolesStr) => {
        const roles = rolesStr.split(',').map(r => r.trim());
        const permission = findPermissionForRoles(roles);
        
        if (!permission) {
            console.warn(`⚠️  Impossible de mapper: ${match} dans ${filePath}`);
            return match; // Conserver l'original si pas de mapping
        }
        
        changes++;
        return `requirePermission('${permission}')`;
    });
    
    // Mettre à jour les imports
    if (content.includes("requirePermission('") && changes > 0) {
        // Remplacer l'import de requireRoles par requirePermission
        content = content.replace(
            /import\s+\{\s*([^}]*),?\s*requireRoles\s*,?\s*([^}]*)\s*\}\s+from\s+['"]@modules\/auth\/middlewares['"]/,
            (match, before, after) => {
                const imports = [before, after].filter(Boolean).join(', ');
                if (imports && !imports.includes('requirePermission')) {
                    return `import { ${imports}, requirePermission } from '@modules/auth/middlewares'`;
                }
                return `import { requirePermission } from '@modules/auth/middlewares'`;
            }
        );
        
        // Si requirePermission n'est pas déjà importé
        if (!content.includes("requirePermission") || !content.includes("import")) {
            // Ajouter l'import si nécessaire
            if (content.includes("import { authMiddleware") && !content.includes("requirePermission")) {
                content = content.replace(
                    /import\s+\{\s*authMiddleware\s*\}\s+from\s+['"]@modules\/auth\/middlewares['"]/,
                    "import { authMiddleware, requirePermission } from '@modules/auth/middlewares'"
                );
            }
        }
    }
    
    // Supprimer les imports de Role si plus utilisés
    // (à faire manuellement après vérification)
    
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        return { migrated: true, changes };
    }
    
    return { migrated: false, changes: 0 };
}

/**
 * Parcourt récursivement un dossier et migre tous les fichiers .ts
 */
function migrateDirectory(dirPath, stats = { total: 0, migrated: 0, changes: 0, warnings: 0 }) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Ignorer node_modules et .git
            if (file === 'node_modules' || file === '.git' || file === 'dist') {
                continue;
            }
            migrateDirectory(fullPath, stats);
        } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            stats.total++;
            const result = migrateFile(fullPath);
            
            if (result.migrated) {
                stats.migrated++;
                stats.changes += result.changes;
                console.log(`✅ ${fullPath}: ${result.changes} remplacement(s)`);
            }
        }
    }
    
    return stats;
}

// ==================================
// EXÉCUTION
// ==================================

const backendSrc = path.join(__dirname, '../backend/src');

console.log('🚀 Migration requireRoles → requirePermission\n');
console.log(`📁 Dossier: ${backendSrc}\n`);

const stats = migrateDirectory(backendSrc);

console.log('\n📊 Statistiques:');
console.log(`   Fichiers analysés: ${stats.total}`);
console.log(`   Fichiers migrés: ${stats.migrated}`);
console.log(`   Remplacements: ${stats.changes}`);
console.log(`\n✅ Migration terminée!`);
console.log(`\n⚠️  Prochaines étapes:`);
console.log(`   1. Vérifier les warnings ci-dessus`);
console.log(`   2. Supprimer requireRoles() de role.middleware.ts`);
console.log(`   3. Nettoyer les imports inutilisés (Role)`);
console.log(`   4. Tester manuellement les endpoints critiques`);
