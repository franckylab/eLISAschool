/**
 * ==================================
 * eLISAschool - Analyse Complète des Permissions
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Ce script analyse :
 * 1. Les permissions définies dans le enum Permission
 * 2. Les permissions utilisées dans DEFAULT_ROLE_PERMISSIONS
 * 3. Les permissions dans la base de données
 * 4. Les écarts et incohérences
 * 5. Suggestions d'amélioration
 */

import { AppDataSource } from '../data-source';
import { Permission } from '@modules/auth/entities';
import { Permission as PermissionEnum, Role, DEFAULT_ROLE_PERMISSIONS } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

interface PermissionAnalysis {
    definedInEnum: Set<string>;
    usedInRoles: Set<string>;
    inDatabase: Set<string>;
    missingInEnum: string[];
    missingInDatabase: string[];
    unusedInRoles: string[];
    statsByModule: Record<string, { enum: number; db: number; roles: number }>;
}

async function analyzePermissions(): Promise<PermissionAnalysis> {
    // 1. Permissions définies dans le enum
    const definedInEnum = new Set(Object.values(PermissionEnum));
    
    // 2. Permissions utilisées dans DEFAULT_ROLE_PERMISSIONS
    const usedInRoles = new Set<string>();
    for (const permissions of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
        for (const perm of permissions) {
            usedInRoles.add(perm);
        }
    }
    
    // 3. Statistiques par module
    const statsByModule: Record<string, { enum: number; db: number; roles: number }> = {};
    
    // Compter par module pour le enum
    for (const perm of definedInEnum) {
        const [module] = perm.split(':');
        if (!statsByModule[module]) {
            statsByModule[module] = { enum: 0, db: 0, roles: 0 };
        }
        statsByModule[module].enum++;
    }
    
    // Compter par module pour les rôles
    for (const perm of usedInRoles) {
        const [module] = perm.split(':');
        if (!statsByModule[module]) {
            statsByModule[module] = { enum: 0, db: 0, roles: 0 };
        }
        statsByModule[module].roles++;
    }
    
    // 4. Permissions en base de données
    let inDatabase = new Set<string>();
    let dbStatsByModule: Record<string, number> = {};
    
    try {
        await AppDataSource.initialize();
        const permissionRepo = AppDataSource.getRepository(Permission);
        
        const dbPermissions = await permissionRepo.find({
            select: ['code', 'module', 'actif'],
        });
        
        inDatabase = new Set(dbPermissions.map(p => p.code));
        
        // Stats DB par module
        for (const perm of dbPermissions) {
            const [module] = perm.code.split(':');
            if (!dbStatsByModule[module]) {
                dbStatsByModule[module] = 0;
            }
            dbStatsByModule[module]++;
            
            // Mettre à jour statsByModule
            if (!statsByModule[module]) {
                statsByModule[module] = { enum: 0, db: 0, roles: 0 };
            }
            statsByModule[module].db++;
        }
        
        await AppDataSource.destroy();
    } catch (error) {
        logger.warn('⚠️ Impossible de se connecter à la base de données (analyse partielle)');
    }
    
    // 5. Trouver les incohérences
    const missingInEnum = Array.from(inDatabase).filter(p => !definedInEnum.has(p as PermissionEnum));
    const missingInDatabase = Array.from(definedInEnum).filter(p => !inDatabase.has(p));
    const unusedInRoles = Array.from(definedInEnum).filter(p => !usedInRoles.has(p));
    
    return {
        definedInEnum,
        usedInRoles,
        inDatabase,
        missingInEnum,
        missingInDatabase,
        unusedInRoles,
        statsByModule,
    };
}

async function main() {
    try {
        logger.info('🔍 Analyse complète des permissions...');
        logger.info('');
        
        const analysis = await analyzePermissions();
        
        // Résumé global
        logger.info('📊 RÉSUMÉ GLOBAL');
        logger.info('='.repeat(80));
        logger.info(`Permissions définies dans le enum Permission:    ${analysis.definedInEnum.size}`);
        logger.info(`Permissions utilisées dans DEFAULT_ROLE_PERMISSIONS: ${analysis.usedInRoles.size}`);
        logger.info(`Permissions en base de données:                  ${analysis.inDatabase.size}`);
        logger.info('');
        
        // Incohérences
        if (analysis.missingInEnum.length > 0) {
            logger.warn(`⚠️  Permissions en base mais PAS dans le enum: ${analysis.missingInEnum.length}`);
            for (const perm of analysis.missingInEnum.slice(0, 10)) {
                logger.warn(`    - ${perm}`);
            }
            if (analysis.missingInEnum.length > 10) {
                logger.warn(`    ... et ${analysis.missingInEnum.length - 10} autres`);
            }
            logger.info('');
        }
        
        if (analysis.missingInDatabase.length > 0) {
            logger.warn(`⚠️  Permissions dans le enum mais PAS en base: ${analysis.missingInDatabase.length}`);
            logger.warn('   → Exécutez le seed pour les créer');
            for (const perm of analysis.missingInDatabase.slice(0, 10)) {
                logger.warn(`    - ${perm}`);
            }
            if (analysis.missingInDatabase.length > 10) {
                logger.warn(`    ... et ${analysis.missingInDatabase.length - 10} autres`);
            }
            logger.info('');
        }
        
        if (analysis.unusedInRoles.length > 0) {
            logger.info(`ℹ️  Permissions non utilisées dans les rôles: ${analysis.unusedInRoles.length}`);
            logger.info('   → Ce n\'est pas un problème (permissions disponibles pour usage futur)');
            logger.info('');
        }
        
        // Statistiques par module
        logger.info('📊 STATISTIQUES PAR MODULE');
        logger.info('='.repeat(80));
        logger.info(`${'Module'.padEnd(35)} ${'Enum'.padStart(6)} ${'DB'.padStart(6)} ${'Rôles'.padStart(6)}`);
        logger.info('-'.repeat(80));
        
        const sortedModules = Object.entries(analysis.statsByModule).sort(
            (a, b) => b[1].enum - a[1].enum
        );
        
        for (const [module, stats] of sortedModules) {
            logger.info(
                `${module.padEnd(35)} ${stats.enum.toString().padStart(6)} ${stats.db.toString().padStart(6)} ${stats.roles.toString().padStart(6)}`
            );
        }
        
        logger.info('');
        
        // Recommandations
        logger.info('💡 RECOMMANDATIONS');
        logger.info('='.repeat(80));
        
        if (analysis.missingInDatabase.length > 0) {
            logger.info('1. Exécutez le seed RBAC pour créer les permissions manquantes en base:');
            logger.info('   cd backend && npm run seed:rbac');
            logger.info('');
        }
        
        if (analysis.missingInEnum.length > 0) {
            logger.info('2. Ajoutez les permissions suivantes au enum Permission:');
            for (const perm of analysis.missingInEnum.slice(0, 20)) {
                const [module, ...actionParts] = perm.split(':');
                const action = actionParts.join(':');
                const constName = perm.toUpperCase().replace(/[^A-Z0-9]/g, '_');
                logger.info(`   ${constName} = '${perm}',`);
            }
            logger.info('');
        }
        
        logger.info('3. Pour ajouter de nouvelles permissions:');
        logger.info('   - Ajouter au enum Permission dans shared/src/enums/roles.enum.ts');
        logger.info('   - Ajouter à DEFAULT_ROLE_PERMISSIONS pour les rôles concernés');
        logger.info('   - Exécuter le seed: npm run seed:rbac');
        logger.info('');
        
        // Vérification SUPER_ADMIN
        const superAdminPerms = DEFAULT_ROLE_PERMISSIONS[Role.SUPER_ADMIN] || [];
        logger.info('🔐 VÉRIFICATION SUPER_ADMIN');
        logger.info('='.repeat(80));
        logger.info(`Le SUPER_ADMIN a ${superAdminPerms.length} permission(s) via DEFAULT_ROLE_PERMISSIONS`);
        logger.info(`Cela correspond à Object.values(Permission) = ${analysis.definedInEnum.size} permissions`);
        
        if (superAdminPerms.length === analysis.definedInEnum.size) {
            logger.info('✅ Le SUPER_ADMIN a correctement TOUTES les permissions du enum');
        } else {
            logger.warn('⚠️  Incohérence détectée pour le SUPER_ADMIN');
        }
        
        logger.info('');
        logger.info('='.repeat(80));
        logger.info('✅ Analyse terminée');
        
        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur:', error);
        process.exit(1);
    }
}

main();
