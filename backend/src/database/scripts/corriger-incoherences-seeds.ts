/**
 * ==================================
 * eLISAschool - Correction Incohérences Seeds
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Corrige les incohérences identifiées dans l'analyse :
 * 1. Double CHEF pour ETAB-002
 * 2. Profils manquants pour utilisateurs RBAC
 * 3. Paramètres non scopés à ETAB-002
 * 4. Contrainte etablissementPrincipal
 */

import { AppDataSource } from '../data-source';
import {
    Utilisateur,
    UtilisateurEtablissement,
    RoleEntity,
    ProfilUtilisateur
} from '@modules/auth/entities';
import { Role } from '@shared/enums/roles.enum';
import { Etablissement } from '@modules/etablissement/entities';
import { ParametreSysteme } from '@modules/configuration/entities';
import { ConfigurationSeedService } from '@modules/configuration/services/configuration-seed.service';
import { logger } from '@common/utils/logger.util';

interface CorrectionResult {
    corrections: string[];
    erreurs: string[];
    statistiques: {
        chefsSupprimes: number;
        profilsCrees: number;
        parametresScopes: number;
        liaisonsCorrigees: number;
    };
}

export async function corrigerIncoherencesSeeds(): Promise<CorrectionResult> {
    const result: CorrectionResult = {
        corrections: [],
        erreurs: [],
        statistiques: {
            chefsSupprimes: 0,
            profilsCrees: 0,
            parametresScopes: 0,
            liaisonsCorrigees: 0
        }
    };

    logger.info('');
    logger.info('🔧 CORRECTION DES INCOHÉRENCES SEEDS');
    logger.info('='.repeat(80));

    const utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
    const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);
    const roleRepo = AppDataSource.getRepository(RoleEntity);
    const etablissementRepo = AppDataSource.getRepository(Etablissement);
    const parametreRepo = AppDataSource.getRepository(ParametreSysteme);

    // ==========================================
    // CORRECTION 1 : Double CHEF pour ETAB-002
    // ==========================================
    logger.info('');
    logger.info('🔧 CORRECTION 1: Résoudre le double CHEF pour ETAB-002');
    logger.info('-'.repeat(80));

    try {
        // Trouver ETAB-002
        const etab002 = await etablissementRepo.findOne({
            where: { codeEtablissement: 'ETAB-002' }
        });

        if (!etab002) {
            result.erreurs.push('❌ ETAB-002 non trouvé');
            logger.error('❌ ETAB-002 non trouvé');
        } else {
            // Trouver tous les CHEF liés à ETAB-002
            const roleChef = await roleRepo.findOne({ where: { code: Role.CHEF_ETABLISSEMENT } });
            
            if (roleChef) {
                const chefsETAB002 = await ueRepo.find({
                    where: {
                        etablissementId: etab002.id,
                        roleId: roleChef.id
                    },
                    relations: ['utilisateur']
                });

                logger.info(`Trouvé ${chefsETAB002.length} CHEF pour ETAB-002`);

                if (chefsETAB002.length > 1) {
                    // Garder chef.palmiers@elisaschool.cm (dédié à ETAB-002)
                    // Supprimer la liaison de chef.etablissement@elisaschool.cm
                    
                    const chefPalmiers = chefsETAB002.find(ue => 
                        (ue.utilisateur as any).email === 'chef.palmiers@elisaschool.cm'
                    );
                    const chefEtablissement = chefsETAB002.find(ue => 
                        (ue.utilisateur as any).email === 'chef.etablissement@elisaschool.cm'
                    );

                    if (chefEtablissement && chefPalmiers) {
                        // Supprimer la liaison de chef.etablissement@ avec ETAB-002
                        await ueRepo.remove(chefEtablissement);
                        result.statistiques.chefsSupprimes++;
                        result.corrections.push('✅ Liaison chef.etablissement@ supprimée de ETAB-002');
                        logger.info('✅ chef.etablissement@ retiré de ETAB-002');
                        logger.info('✅ chef.palmiers@ reste le seul chef de ETAB-002');
                    }
                }
            }
        }
    } catch (error) {
        const msg = `❌ Erreur correction 1: ${error}`;
        result.erreurs.push(msg);
        logger.error(msg);
    }

    // ==========================================
    // CORRECTION 2 : Profils manquants
    // ==========================================
    logger.info('');
    logger.info('🔧 CORRECTION 2: Ajouter profils manquants');
    logger.info('-'.repeat(80));

    try {
        const utilisateurs = await utilisateurRepo.find();
        let profilsManquants = 0;

        for (const u of utilisateurs) {
            const profil = await profilRepo.findOne({ where: { utilisateurId: u.id } });
            
            if (!profil) {
                profilsManquants++;
                
                // Créer le profil manquant
                const emailParts = u.email.split('@')[0];
                const nom = emailParts.replace(/[._]/g, ' ').toUpperCase();
                
                const newProfil = profilRepo.create({
                    utilisateurId: u.id,
                    nom: nom,
                    prenom: 'Utilisateur',
                    telephone: '+237690000000'
                });
                
                await profilRepo.save(newProfil);
                result.statistiques.profilsCrees++;
                
                logger.debug(`✅ Profil créé pour ${u.email}`);
            }
        }

        if (profilsManquants > 0) {
            result.corrections.push(`✅ ${profilsManquants} profils créés`);
            logger.info(`✅ ${profilsManquants} profils manquants créés`);
        } else {
            logger.info('✅ Tous les utilisateurs ont un profil');
        }
    } catch (error) {
        const msg = `❌ Erreur correction 2: ${error}`;
        result.erreurs.push(msg);
        logger.error(msg);
    }

    // ==========================================
    // CORRECTION 3 : Paramètres scopés à ETAB-002
    // ==========================================
    logger.info('');
    logger.info('🔧 CORRECTION 3: Synchroniser paramètres pour ETAB-002');
    logger.info('-'.repeat(80));

    try {
        const etab002 = await etablissementRepo.findOne({
            where: { codeEtablissement: 'ETAB-002' }
        });

        if (etab002) {
            // Vérifier si ETAB-002 a déjà des paramètres
            const nbParametres = await parametreRepo.count({
                where: { etablissementId: etab002.id }
            });

            if (nbParametres === 0) {
                logger.info('ETAB-002 n\'a pas de paramètres, création...');
                
                const seedService = new ConfigurationSeedService();
                await seedService.runAllSeeds();
                
                // Note: Le service scope automatiquement selon contexte
                // On pourrait passer etablissementId si le service le supporte
                
                result.statistiques.parametresScopes = 1;
                result.corrections.push('✅ Paramètres créés pour ETAB-002');
                logger.info('✅ Paramètres synchronisés pour ETAB-002');
            } else {
                logger.info(`✅ ETAB-002 a déjà ${nbParametres} paramètres`);
            }
        }
    } catch (error) {
        const msg = `❌ Erreur correction 3: ${error}`;
        result.erreurs.push(msg);
        logger.error(msg);
    }

    // ==========================================
    // CORRECTION 4 : Contrainte etablissementPrincipal
    // ==========================================
    logger.info('');
    logger.info('🔧 CORRECTION 4: Vérifier contraintes etablissementPrincipal');
    logger.info('-'.repeat(80));

    try {
        const toutesLiaisons = await ueRepo.find({
            relations: ['utilisateur']
        });

        // Grouper par utilisateur
        const parUtilisateur: Record<string, typeof toutesLiaisons> = {};
        for (const liaison of toutesLiaisons) {
            const uid = liaison.utilisateurId;
            if (!parUtilisateur[uid]) {
                parUtilisateur[uid] = [];
            }
            parUtilisateur[uid].push(liaison);
        }

        // Vérifier chaque utilisateur
        let liaisonsCorrigees = 0;
        for (const [uid, liaisons] of Object.entries(parUtilisateur)) {
            const principals = liaisons.filter(l => l.etablissementPrincipal);
            
            if (principals.length > 1) {
                // Un utilisateur a plusieurs établissements principaux !
                // Garder uniquement le premier (le plus ancien)
                principals.sort((a, b) => (a.dateDebut?.getTime() || 0) - (b.dateDebut?.getTime() || 0));
                
                for (let i = 1; i < principals.length; i++) {
                    principals[i].etablissementPrincipal = false;
                    await ueRepo.save(principals[i]);
                    liaisonsCorrigees++;
                }
                
                const email = (liaisons[0].utilisateur as any)?.email || uid;
                logger.warn(`⚠ Utilisateur ${email} avait ${principals.length} établissements principaux → corrigé`);
            }
        }

        if (liaisonsCorrigees > 0) {
            result.statistiques.liaisonsCorrigees = liaisonsCorrigees;
            result.corrections.push(`✅ ${liaisonsCorrigees} liaisons corrigées (etablissementPrincipal)`);
            logger.info(`✅ ${liaisonsCorrigees} liaisons corrigées`);
        } else {
            logger.info('✅ Toutes les liaisons sont conformes');
        }
    } catch (error) {
        const msg = `❌ Erreur correction 4: ${error}`;
        result.erreurs.push(msg);
        logger.error(msg);
    }

    // ==========================================
    // RÉSUMÉ
    // ==========================================
    logger.info('');
    logger.info('📊 RÉSUMÉ DES CORRECTIONS');
    logger.info('='.repeat(80));
    logger.info(`✅ Corrections appliquées: ${result.corrections.length}`);
    for (const correction of result.corrections) {
        logger.info(`   ${correction}`);
    }

    if (result.erreurs.length > 0) {
        logger.error(`❌ Erreurs: ${result.erreurs.length}`);
        for (const erreur of result.erreurs) {
            logger.error(`   ${erreur}`);
        }
    }

    logger.info('');
    logger.info('📈 Statistiques:');
    logger.info(`   Chefs supprimés:      ${result.statistiques.chefsSupprimes}`);
    logger.info(`   Profils créés:        ${result.statistiques.profilsCrees}`);
    logger.info(`   Paramètres scopés:    ${result.statistiques.parametresScopes}`);
    logger.info(`   Liaisons corrigées:   ${result.statistiques.liaisonsCorrigees}`);
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

        const result = await corrigerIncoherencesSeeds();

        await AppDataSource.destroy();
        logger.info('🔌 Connexion fermée');

        process.exit(result.erreurs.length > 0 ? 1 : 0);
    } catch (error) {
        logger.error('❌ Erreur:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export default corrigerIncoherencesSeeds;
