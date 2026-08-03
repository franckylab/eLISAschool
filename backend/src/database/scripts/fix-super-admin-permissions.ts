/**
 * ==================================
 * eLISAschool - Diagnostic et Correction Permissions SUPER_ADMIN
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Ce script :
 * 1. Diagnose le problème des permissions du SUPER_ADMIN
 * 2. Ajoute toutes les permissions manquantes
 * 3. Vérifie le résultat
 */

import { AppDataSource } from '../data-source';
import { RoleEntity as Role, Permission } from '@modules/auth/entities';
import { Permission as PermissionEnum } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

async function main() {
    try {
        await AppDataSource.initialize();
        logger.info('🔌 Connecté à la base de données');

        const roleRepo = AppDataSource.getRepository(Role);
        const permissionRepo = AppDataSource.getRepository(Permission);

        // 1. Compter les permissions totales en base
        const totalPermissionsDB = await permissionRepo.count({ where: { actif: true } });
        logger.info(`📊 Total permissions en base (actif=true): ${totalPermissionsDB}`);

        // 2. Compter les permissions dans le enum
        const totalPermissionsEnum = Object.values(PermissionEnum).length;
        logger.info(`📊 Total permissions dans le enum: ${totalPermissionsEnum}`);

        // 3. Trouver le rôle SUPER_ADMIN
        const superAdminRole = await roleRepo.findOne({
            where: { code: 'SUPER_ADMIN' },
            relations: ['permissions'],
        });

        if (!superAdminRole) {
            logger.error('❌ Rôle SUPER_ADMIN non trouvé');
            process.exit(1);
        }

        const currentPermissionsCount = superAdminRole.permissions?.length || 0;
        logger.info(`📊 Permissions actuelles du SUPER_ADMIN: ${currentPermissionsCount}`);

        // 4. Identifier les permissions manquantes
        const existingPermissionCodes = new Set(
            superAdminRole.permissions?.map((p: Permission) => p.code) || []
        );

        const allPermissionCodes = Object.values(PermissionEnum);
        const missingPermissions = allPermissionCodes.filter(
            code => !existingPermissionCodes.has(code)
        );

        logger.info(`📊 Permissions manquantes: ${missingPermissions.length}`);

        if (missingPermissions.length > 0) {
            logger.info('');
            logger.info('🔧 Ajout des permissions manquantes...');

            // Récupérer les entités de permissions manquantes
            const missingPermissionEntities = await permissionRepo.findBy({
                code: missingPermissions as any,
            });

            logger.info(`   Permissions trouvées en base: ${missingPermissionEntities.length}`);

            // Permissions qui n'existent pas encore en base
            const existingCodes = new Set(missingPermissionEntities.map((p: Permission) => p.code));
            const notInDB = missingPermissions.filter(code => !existingCodes.has(code));

            if (notInDB.length > 0) {
                logger.warn(`   ⚠ ${notInDB.length} permissions du enum n'existent pas en base:`);
                notInDB.slice(0, 10).forEach(code => logger.warn(`      - ${code}`));
                if (notInDB.length > 10) {
                    logger.warn(`      ... et ${notInDB.length - 10} autres`);
                }

                // Créer les permissions manquantes
                logger.info('');
                logger.info('   Création des permissions manquantes...');
                
                for (const code of notInDB) {
                    const [module, ...actionParts] = code.split(':');
                    const action = actionParts.join(':');
                    
                    const permission = permissionRepo.create({
                        code,
                        libelle: `${action} ${module}`,
                        module,
                        action,
                        actif: true,
                    });
                    
                    await permissionRepo.save(permission);
                    missingPermissionEntities.push(permission);
                }
                
                logger.info(`   ✅ ${notInDB.length} permissions créées`);
            }

            // Ajouter toutes les permissions au SUPER_ADMIN
            const currentPermissionIds = new Set(
                superAdminRole.permissions?.map((p: Permission) => p.id) || []
            );

            let addedCount = 0;
            for (const perm of missingPermissionEntities) {
                if (!currentPermissionIds.has(perm.id)) {
                    superAdminRole.permissions = [...(superAdminRole.permissions || []), perm];
                    addedCount++;
                }
            }

            if (addedCount > 0) {
                await roleRepo.save(superAdminRole);
                logger.info(`   ✅ ${addedCount} permissions ajoutées au SUPER_ADMIN`);
            } else {
                logger.info('   ✓ Aucune permission à ajouter (déjà présentes)');
            }
        } else {
            logger.info('✅ Le SUPER_ADMIN a déjà toutes les permissions du enum');
        }

        // 5. Vérification finale
        const updatedRole = await roleRepo.findOne({
            where: { code: 'SUPER_ADMIN' },
            relations: ['permissions'],
        });

        const finalCount = updatedRole?.permissions?.length || 0;
        const finalTotalDB = await permissionRepo.count({ where: { actif: true } });

        logger.info('');
        logger.info('==================================');
        logger.info('RÉSULTAT FINAL');
        logger.info('==================================');
        logger.info(`Permissions du SUPER_ADMIN: ${finalCount}`);
        logger.info(`Total permissions en base: ${finalTotalDB}`);
        
        if (finalCount === finalTotalDB) {
            logger.info('✅ SUCCÈS : Le SUPER_ADMIN a maintenant TOUTES les permissions !');
        } else {
            logger.warn(`⚠️ Il manque encore ${finalTotalDB - finalCount} permissions`);
        }

        // 6. Afficher par module
        logger.info('');
        logger.info('📊 Répartition par module :');
        
        const moduleCounts: Record<string, number> = {};
        for (const perm of updatedRole?.permissions || []) {
            moduleCounts[perm.module] = (moduleCounts[perm.module] || 0) + 1;
        }

        const sortedModules = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1]);
        for (const [module, count] of sortedModules) {
            logger.info(`   ${module}: ${count}`);
        }

        await AppDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(0);
    } catch (error) {
        logger.error('❌ Erreur:', error);
        process.exit(1);
    }
}

main();
