/**
 * ==================================
 * eLISAschool - Vérification Cohérence Seeds
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Vérifie la cohérence complète :
 * - Établissements créés
 * - Utilisateurs liés aux établissements
 * - Rôles et permissions par utilisateur
 * - Détections d'incohérences
 */

import { AppDataSource } from '../data-source';
import {
    Utilisateur,
    UtilisateurEtablissement,
    Role as RoleEntity,
    Permission as PermissionEntity,
    ProfilUtilisateur
} from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { Role, Permission } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

interface VerificationResult {
    etablissements: {
        total: number;
        details: Array<{ id: string; nom: string; code: string }>;
    };
    utilisateurs: {
        total: number;
        sansEtablissement: number;
        avecProfil: number;
        sansProfil: number;
    };
    liaisonsUtilisateurEtablissement: {
        total: number;
        inactives: number;
        etablissementPrincipal: number;
    };
    roles: {
        totalEnBase: number;
        totalDansEnum: number;
        manquants: string[];
        enPlus: string[];
    };
    permissions: {
        totalEnBase: number;
        totalDansEnum: number;
        manquantes: string[];
        enPlus: string[];
    };
    incoherences: string[];
}

export async function verifierCohérenceSeeds(): Promise<VerificationResult> {
    const result: VerificationResult = {
        etablissements: { total: 0, details: [] },
        utilisateurs: { total: 0, sansEtablissement: 0, avecProfil: 0, sansProfil: 0 },
        liaisonsUtilisateurEtablissement: { total: 0, inactives: 0, etablissementPrincipal: 0 },
        roles: { totalEnBase: 0, totalDansEnum: 0, manquants: [], enPlus: [] },
        permissions: { totalEnBase: 0, totalDansEnum: 0, manquantes: [], enPlus: [] },
        incoherences: []
    };

    logger.info('');
    logger.info('🔍 VÉRIFICATION COHÉRENCE SEEDS');
    logger.info('='.repeat(80));

    // ==========================================
    // 1. VÉRIFIER LES ÉTABLISSEMENTS
    // ==========================================
    logger.info('');
    logger.info('📋 1. ÉTABLISSEMENTS');
    logger.info('-'.repeat(80));

    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const etablissements = await etablissementRepo.find({
        order: { createdAt: 'ASC' }
    });

    result.etablissements.total = etablissements.length;
    result.etablissements.details = etablissements.map(e => ({
        id: e.id,
        nom: e.nom,
        code: e.codeEtablissement || 'SANS_CODE'
    }));

    if (etablissements.length === 0) {
        result.incoherences.push('❌ Aucun établissement en base');
        logger.error('❌ Aucun établissement trouvé');
    } else {
        logger.info(`✅ ${etablissements.length} établissement(s) trouvé(s):`);
        for (const e of etablissements) {
            logger.info(`   🏫 ${e.nom} (${e.codeEtablissement}) - ID: ${e.id.substring(0, 8)}`);
        }
    }

    // ==========================================
    // 2. VÉRIFIER LES UTILISATEURS
    // ==========================================
    logger.info('');
    logger.info('👥 2. UTILISATEURS');
    logger.info('-'.repeat(80));

    const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);

    const utilisateurs = await utilisateurRepo.find({
        order: { createdAt: 'ASC' }
    });

    result.utilisateurs.total = utilisateurs.length;

    // Vérifier les profils
    for (const u of utilisateurs) {
        const profil = await profilRepo.findOne({ where: { utilisateurId: u.id } });
        if (profil) {
            result.utilisateurs.avecProfil++;
        } else {
            result.utilisateurs.sansProfil++;
            result.incoherences.push(`⚠ Utilisateur ${u.email} sans profil`);
        }
    }

    // Vérifier les liaisons établissement
    for (const u of utilisateurs) {
        const liaisons = await ueRepo.find({ where: { utilisateurId: u.id } });
        if (liaisons.length === 0) {
            result.utilisateurs.sansEtablissement++;
            result.incoherences.push(`❌ Utilisateur ${u.email} (${u.role}) sans établissement`);
        }
    }

    logger.info(`✅ ${utilisateurs.length} utilisateur(s) trouvé(s):`);
    logger.info(`   ✓ Avec profil: ${result.utilisateurs.avecProfil}`);
    if (result.utilisateurs.sansProfil > 0) {
        logger.warn(`   ⚠ Sans profil: ${result.utilisateurs.sansProfil}`);
    }
    if (result.utilisateurs.sansEtablissement > 0) {
        logger.error(`   ❌ Sans établissement: ${result.utilisateurs.sansEtablissement}`);
    }

    // Afficher les utilisateurs par rôle
    const utilisateursParRole: Record<string, number> = {};
    for (const u of utilisateurs) {
        const role = u.role || 'SANS_ROLE';
        utilisateursParRole[role] = (utilisateursParRole[role] || 0) + 1;
    }

    logger.info('');
    logger.info('   Répartition par rôle:');
    for (const [role, count] of Object.entries(utilisateursParRole).sort()) {
        logger.info(`   ${role.padEnd(30)} ${count} utilisateur(s)`);
    }

    // ==========================================
    // 3. VÉRIFIER LES LIAISONS UTILISATEUR-ÉTABLISSEMENT
    // ==========================================
    logger.info('');
    logger.info('🔗 3. LIAISONS UTILISATEUR-ÉTABLISSEMENT');
    logger.info('-'.repeat(80));

    const toutesLiaisons = await ueRepo.find({
        relations: ['role'],
        order: { creeAt: 'ASC' }
    });

    result.liaisonsUtilisateurEtablissement.total = toutesLiaisons.length;
    result.liaisonsUtilisateurEtablissement.inactives = toutesLiaisons.filter(l => !l.actif).length;
    result.liaisonsUtilisateurEtablissement.etablissementPrincipal = toutesLiaisons.filter(l => l.etablissementPrincipal).length;

    logger.info(`✅ ${toutesLiaisons.length} liaison(s) trouvée(s):`);
    logger.info(`   ✓ Actives: ${toutesLiaisons.filter(l => l.actif).length}`);
    if (result.liaisonsUtilisateurEtablissement.inactives > 0) {
        logger.info(`   ⏸ Inactives: ${result.liaisonsUtilisateurEtablissement.inactives}`);
    }
    logger.info(`   🏠 Établissements principaux: ${result.liaisonsUtilisateurEtablissement.etablissementPrincipal}`);

    // Détecter les utilisateurs sans rôle dans la liaison
    const liaisonsSansRole = toutesLiaisons.filter(l => !l.roleId);
    if (liaisonsSansRole.length > 0) {
        result.incoherences.push(`❌ ${liaisonsSansRole.length} liaison(s) sans rôle`);
        logger.error(`   ❌ Liaisons sans rôle: ${liaisonsSansRole.length}`);
    }

    // Afficher les liaisons par établissement
    const liaisonsParEtab: Record<string, number> = {};
    for (const l of toutesLiaisons) {
        const etabId = l.etablissementId.substring(0, 8);
        liaisonsParEtab[etabId] = (liaisonsParEtab[etabId] || 0) + 1;
    }

    logger.info('');
    logger.info('   Répartition par établissement:');
    for (const [etabId, count] of Object.entries(liaisonsParEtab)) {
        const etab = etablissements.find(e => e.id.startsWith(etabId));
        const nom = etab ? etab.nom : 'Inconnu';
        logger.info(`   🏫 ${nom} (${etabId})... → ${count} utilisateur(s)`);
    }

    // ==========================================
    // 4. VÉRIFIER LES RÔLES
    // ==========================================
    logger.info('');
    logger.info('🎭 4. RÔLES');
    logger.info('-'.repeat(80));

    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const rolesEnBase = await roleRepo.find();

    result.roles.totalEnBase = rolesEnBase.length;
    result.roles.totalDansEnum = Object.values(Role).length;

    const codesEnBase = new Set(rolesEnBase.map(r => r.code));
    const codesDansEnum = new Set(Object.values(Role));

    // Rôles manquants en base
    result.roles.manquants = Array.from(codesDansEnum).filter(code => !codesEnBase.has(code as string)) as string[];
    if (result.roles.manquants.length > 0) {
        result.incoherences.push(`❌ ${result.roles.manquants.length} rôle(s) manquant(s) en base`);
    }

    // Rôles en base mais pas dans enum
    result.roles.enPlus = Array.from(codesEnBase).filter(code => !codesDansEnum.has(code as any)) as string[];
    if (result.roles.enPlus.length > 0) {
        result.incoherences.push(`⚠ ${result.roles.enPlus.length} rôle(s) obsolète(s) en base`);
    }

    logger.info(`✅ ${rolesEnBase.length} rôle(s) en base (enum: ${Object.values(Role).length})`);

    if (result.roles.manquants.length > 0) {
        logger.error(`   ❌ Manquants: ${result.roles.manquants.join(', ')}`);
    }
    if (result.roles.enPlus.length > 0) {
        logger.warn(`   ⚠ Obsolètes: ${result.roles.enPlus.join(', ')}`);
    }

    // ==========================================
    // 5. VÉRIFIER LES PERMISSIONS
    // ==========================================
    logger.info('');
    logger.info('🔑 5. PERMISSIONS');
    logger.info('-'.repeat(80));

    const permissionRepo = AppDataSource.getRepository(PermissionEntity);
    const permissionsEnBase = await permissionRepo.find();

    result.permissions.totalEnBase = permissionsEnBase.length;
    result.permissions.totalDansEnum = Object.values(Permission).length;

    const permsEnBase = new Set(permissionsEnBase.map(p => p.code));
    const permsDansEnum = new Set(Object.values(Permission));

    // Permissions manquantes en base
    result.permissions.manquantes = Array.from(permsDansEnum).filter(code => !permsEnBase.has(code as string)) as string[];
    if (result.permissions.manquantes.length > 0) {
        result.incoherences.push(`❌ ${result.permissions.manquantes.length} permission(s) manquante(s) en base`);
    }

    // Permissions en base mais pas dans enum
    result.permissions.enPlus = Array.from(permsEnBase).filter(code => !permsDansEnum.has(code as any)) as string[];
    if (result.permissions.enPlus.length > 0) {
        result.incoherences.push(`⚠ ${result.permissions.enPlus.length} permission(s) obsolète(s) en base`);
    }

    logger.info(`✅ ${permissionsEnBase.length} permission(s) en base (enum: ${Object.values(Permission).length})`);

    if (result.permissions.manquantes.length > 0) {
        logger.error(`   ❌ Manquantes: ${result.permissions.manquantes.length}`);
        // Afficher les 10 premières
        result.permissions.manquantes.slice(0, 10).forEach(p => logger.error(`      - ${p}`));
        if (result.permissions.manquantes.length > 10) {
            logger.error(`      ... et ${result.permissions.manquantes.length - 10} autres`);
        }
    }
    if (result.permissions.enPlus.length > 0) {
        logger.warn(`   ⚠ Obsolètes: ${result.permissions.enPlus.length}`);
    }

    // ==========================================
    // 6. VÉRIFIER LES PERMISSIONS PAR RÔLE
    // ==========================================
    logger.info('');
    logger.info('🎯 6. PERMISSIONS PAR RÔLE');
    logger.info('-'.repeat(80));

    for (const role of rolesEnBase.sort((a, b) => a.code.localeCompare(b.code))) {
        const permissionsRole = await roleRepo.findOne({
            where: { id: role.id },
            relations: ['permissions']
        }) as any;

        const nbPermissions = permissionsRole?.permissions?.length || 0;

        // SUPER_ADMIN devrait avoir toutes les permissions
        if (role.code === 'SUPER_ADMIN') {
            const nbAttendu = Object.values(Permission).length;
            if (nbPermissions < nbAttendu) {
                result.incoherences.push(`❌ SUPER_ADMIN n'a que ${nbPermissions}/${nbAttendu} permissions`);
                logger.error(`   ❌ ${role.code.padEnd(30)} ${nbPermissions}/${nbAttendu} permissions`);
            } else {
                logger.info(`   ✅ ${role.code.padEnd(30)} ${nbPermissions} permissions (TOUTES)`);
            }
        } else {
            logger.info(`   ${role.code.padEnd(30)} ${nbPermissions} permissions`);
        }
    }

    // ==========================================
    // 7. RÉSUMÉ DES INCOHÉRENCES
    // ==========================================
    logger.info('');
    logger.info('🚨 RÉSUMÉ DES INCOHÉRENCES');
    logger.info('='.repeat(80));

    if (result.incoherences.length === 0) {
        logger.info('✅ AUCUNE incohérence détectée !');
    } else {
        logger.error(`❌ ${result.incoherences.length} incohérence(s) détectée(s):`);
        logger.info('');
        for (const incoherence of result.incoherences) {
            logger.error(`   ${incoherence}`);
        }
    }

    // ==========================================
    // 8. STATISTIQUES GLOBALES
    // ==========================================
    logger.info('');
    logger.info('📊 STATISTIQUES GLOBALES');
    logger.info('='.repeat(80));
    logger.info(`   Établissements:            ${result.etablissements.total}`);
    logger.info(`   Utilisateurs:              ${result.utilisateurs.total}`);
    logger.info(`   Utilisateurs sans étab:    ${result.utilisateurs.sansEtablissement}`);
    logger.info(`   Utilisateurs sans profil:  ${result.utilisateurs.sansProfil}`);
    logger.info(`   Liaisons UE:               ${result.liaisonsUtilisateurEtablissement.total}`);
    logger.info(`   Liaisons inactives:        ${result.liaisonsUtilisateurEtablissement.inactives}`);
    logger.info(`   Rôles en base:             ${result.roles.totalEnBase}/${result.roles.totalDansEnum}`);
    logger.info(`   Rôles manquants:           ${result.roles.manquants.length}`);
    logger.info(`   Permissions en base:       ${result.permissions.totalEnBase}/${result.permissions.totalDansEnum}`);
    logger.info(`   Permissions manquantes:    ${result.permissions.manquantes.length}`);
    logger.info(`   Incohérences totales:      ${result.incoherences.length}`);
    logger.info('');

    return result;
}

/**
 * Point d'entrée standalone
 */
async function main() {
    try {
        await AppDataSource.initialize();
        logger.info('✅ Connexion DB établie');

        const result = await verifierCohérenceSeeds();

        await AppDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(result.incoherences.length > 0 ? 1 : 0);
    } catch (error) {
        logger.error('❌ Erreur:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default verifierCohérenceSeeds;
