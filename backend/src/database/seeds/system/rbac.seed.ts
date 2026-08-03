/**
 * ==================================
 * eLISAschool - Seed RBAC (Rôles et Permissions)
 * ==================================
 * Version: 6.0.0
 * Auteur: franck arlos chendjou
 * 
 * Initialise les rôles système, les permissions,
 * et le mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
 * 
 * AMÉLIORATION v6.0 :
 * - Génération AUTOMATIQUE des rôles depuis le enum Role
 * - Génération AUTOMATIQUE des permissions depuis le enum Permission
 * - Métadonnées custom uniquement pour les libellés/descriptions spécifiques
 * - Zéro duplication code/seed
 * 
 * Modules couverts:
 * - Core (etablissements, utilisateurs, auth, configuration)
 * - Académique (élèves, classes, matières, notes, bulletins)
 * - Services (cantine, transport, cartes, clubs)
 * - Avancé (gamification, scoring, orientation, requêtes)
 * - Groupes établissements (9 permissions unifiées)
 * - Workflow validation (15 modules)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../data-source';
import { RoleEntity as Role, Permission } from '@modules/auth/entities';
import { Role as RoleEnum, DEFAULT_ROLE_PERMISSIONS, Permission as PermissionEnum } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Service de seed pour le système RBAC
 */
export class RBACSeedService {
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
    }

    /**
     * Exécute tous les seeds RBAC
     */
    async runAllSeeds(): Promise<{ roles: number; permissions: number; mappings: number }> {
        logger.info('🔐 Seed RBAC: Rôles et Permissions...');

        const rolesCount = await this.seedRoles();
        const permissionsCount = await this.seedPermissions();
        const mappingsCount = await this.seedRolePermissions();

        logger.info(`✅ RBAC Seed terminé: ${rolesCount} rôles, ${permissionsCount} permissions, ${mappingsCount} mappings`);

        return {
            roles: rolesCount,
            permissions: permissionsCount,
            mappings: mappingsCount,
        };
    }

    /**
     * Métadonnées custom pour les rôles (libellé, description)
     * Seuls les rôles qui ont besoin d'un libellé/description custom sont ici
     * Tous les autres rôles seront générés automatiquement avec fallback intelligent
     */
    private readonly ROLE_METADATA: Partial<Record<string, { libelle: string; description: string }>> = {
        // Rôles principaux
        SUPER_ADMIN: { libelle: 'Super Administrateur', description: 'Accès total à toutes les fonctionnalités' },
        ADMIN: { libelle: 'Administrateur', description: 'Administrateur de l\'établissement' },
        CHEF_ETABLISSEMENT: { libelle: 'Chef d\'Établissement', description: 'Direction de l\'établissement' },
        ENSEIGNANT: { libelle: 'Enseignant', description: 'Enseignant (générique)' },
        PERSONNEL: { libelle: 'Personnel', description: 'Personnel non-enseignant (générique)' },
        PARENT: { libelle: 'Parent', description: 'Parent d\'élève (générique)' },
        ELEVE: { libelle: 'Élève', description: 'Élève (générique)' },
        
        // Direction d'établissement
        PROVISEUR: { libelle: 'Proviseur', description: 'Chef d\'établissement secondaire (lycée)' },
        PRINCIPAL: { libelle: 'Principal', description: 'Chef d\'établissement collège' },
        DIRECTEUR: { libelle: 'Directeur', description: 'Chef d\'école primaire' },
        CENSEUR: { libelle: 'Censeur', description: 'Responsable discipline & organisation' },
        DIRECTEUR_ADJOINT: { libelle: 'Directeur Adjoint', description: 'Chef d\'établissement adjoint' },
        RESPONSABLE_PEDAGOGIQUE: { libelle: 'Responsable Pédagogique', description: 'Conseiller pédagogique interne' },
        
        // Enseignants spécialisés
        PROFESSEUR_CERTIFIE: { libelle: 'Professeur Certifié', description: 'Enseignant secondaire certifié' },
        PROFESSEUR_AGREGE: { libelle: 'Professeur Agrégé', description: 'Enseignant lycée (agrégé)' },
        INSTITUTEUR: { libelle: 'Instituteur', description: 'Enseignant primaire' },
        MAITRE_AUXILIAIRE: { libelle: 'Maître Auxiliaire', description: 'Enseignant contractuel' },
        PROFESSEUR_TECHNIQUE: { libelle: 'Professeur Technique', description: 'Enseignant technique/professionnel' },
        EDUCATEUR_MATERNELLE: { libelle: 'Éducateur Maternelle', description: 'Enseignant maternelle' },
        PROFESSEUR_PRINCIPAL: { libelle: 'Professeur Principal', description: 'Responsable de classe' },
        COORDINATEUR_DISCIPLINE: { libelle: 'Coordinateur', description: 'Coordinateur matière/département' },
        PROFESSEUR_SPECIAL: { libelle: 'Professeur Spécial', description: 'Enseignant éducation spécialisée (handicap)' },
        PROFESSEUR_LANGUES: { libelle: 'Professeur Langues', description: 'Professeur langues étrangères' },
        
        // Orientation & conseil
        CONSEILLER_ORIENTEUR: { libelle: 'Conseiller d\'Orientation', description: 'Conseiller orientation scolaire' },
        PSYCHOLOGUE_SCOLAIRE: { libelle: 'Psychologue Scolaire', description: 'Psychologue de l\'éducation' },
        ASSISTANT_SOCIAL: { libelle: 'Assistant Social', description: 'Assistant social scolaire' },
        MEDECIN_SCOLAIRE: { libelle: 'Médecin Scolaire', description: 'Médecin de l\'Éducation nationale' },
        
        // Personnel administratif
        SECRETAIRE_DIRECTION: { libelle: 'Secrétaire de Direction', description: 'Secrétaire de direction' },
        COMPTABLE: { libelle: 'Comptable', description: 'Agent comptable' },
        GESTIONNAIRE: { libelle: 'Gestionnaire', description: 'Gestionnaire matériel/logistique' },
        BIBLIOTHECAIRE: { libelle: 'Bibliothécaire', description: 'Responsable bibliothèque' },
        DOCUMENTALISTE: { libelle: 'Documentaliste', description: 'Responsable documentation' },
        ARCHIVISTE: { libelle: 'Archiviste', description: 'Responsable archives' },
        ACCUEIL_STANDARD: { libelle: 'Agent d\'Accueil', description: 'Agent d\'accueil' },
        
        // Personnel technique
        TECHNICIEN_LABO: { libelle: 'Technicien Labo', description: 'Technicien laboratoire sciences' },
        TECHNICIEN_INFO: { libelle: 'Technicien Informatique', description: 'Technicien informatique' },
        CONSEILLER_TIC: { libelle: 'Conseiller TIC', description: 'Conseiller TIC pédagogique' },
        AIDE_EDUCATEUR: { libelle: 'Aide Éducateur', description: 'Assistant pédagogique' },
        ANIMATEUR_TICE: { libelle: 'Animateur TICE', description: 'Animateur TICE' },
        
        // Surveillance & vie scolaire
        SURVEILLANT_GENERAL: { libelle: 'Surveillant Général', description: 'Responsable surveillance' },
        SURVEILLANT: { libelle: 'Surveillant', description: 'Maître d\'internat / surveillant' },
        MAITRE_INTERNAT: { libelle: 'Maître d\'Internat', description: 'Responsable internat' },
        CONSEILLER_VIE_SCOLAIRE: { libelle: 'Conseiller Vie Scolaire', description: 'Conseiller Principal d\'Éducation (CPE)' },
        
        // Santé & bien-être
        INFIRMIER_SCOLAIRE: { libelle: 'Infirmier Scolaire', description: 'Infirmier de l\'établissement' },
        NUTRITIONNISTE: { libelle: 'Nutritionniste', description: 'Nutritionniste (cantine)' },
        KINESITHERAPEUTE: { libelle: 'Kinésithérapeute', description: 'Kinésithérapeute scolaire' },
        
        // Cantine & logistique
        CUISINIER: { libelle: 'Cuisinier', description: 'Personnel cuisine' },
        CHAUFFEUR: { libelle: 'Chauffeur', description: 'Chauffeur bus scolaire' },
        AGENT_ENTRETIEN: { libelle: 'Agent d\'Entretien', description: 'Personnel de maintenance' },
        
        // Services spécifiques
        RESPONSABLE_CANTINE: { libelle: 'Responsable Cantine', description: 'Gestion de la cantine' },
        RESPONSABLE_TRANSPORT: { libelle: 'Responsable Transport', description: 'Gestion du transport' },
        RESPONSABLE_INFRASTRUCTURE: { libelle: 'Responsable Infrastructure', description: 'Parking, maintenance, sécurité' },
        
        // Clubs & activités
        COORDINATEUR_CLUBS: { libelle: 'Coordinateur Clubs', description: 'Coordinateur activités parascolaires' },
        ENTRAINEUR_SPORTIF: { libelle: 'Entraîneur Sportif', description: 'Coach sport' },
        ANIMATEUR_CULTUREL: { libelle: 'Animateur Culturel', description: 'Animateur culturel' },
        
        // Spécialisé
        COORDINATEUR_EXAMEN: { libelle: 'Coordinateur Examen', description: 'Responsable examens nationaux' },
        RESPONSABLE_BOURSES: { libelle: 'Responsable Bourses', description: 'Gestionnaire bourses' },
        AUDITEUR_INTERNE: { libelle: 'Auditeur Interne', description: 'Audit interne (MINEDUC)' },
        STATISTICIEN: { libelle: 'Statisticien', description: 'Statisticien éducation' },
        CHARGE_COMMUNICATION: { libelle: 'Chargé de Communication', description: 'Communication institutionnelle' },
    };

    /**
     * Génère automatiquement TOUS les rôles depuis le enum Role
     * Plus besoin de liste hardcodée - tout est dérivé du enum
     */
    private generateRolesDefinition() {
        return Object.values(RoleEnum).map(roleCode => {
            const metadata = this.ROLE_METADATA[roleCode];
            
            // Fallback automatique si pas de métadonnées custom
            return {
                code: roleCode,
                libelle: metadata?.libelle || this.generateRoleLibelle(roleCode),
                description: metadata?.description || `Rôle système ${roleCode}`,
            };
        });
    }

    /**
     * Génère un libellé lisible depuis un code de rôle (fallback intelligent)
     * SUPER_ADMIN → "Super Admin"
     * PROFESSEUR_CERTIFIE → "Professeur Certifié"
     */
    private generateRoleLibelle(code: string): string {
        return code
            .split('_')
            .map((word, index) => {
                const lowerWord = word.toLowerCase();
                // Première lettre en majuscule
                return index === 0 
                    ? lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1)
                    : lowerWord;
            })
            .join(' ');
    }

    /**
     * Seed de TOUS les rôles système (généré automatiquement depuis le enum)
     */
    private async seedRoles(): Promise<number> {
        const rolesDefinition = this.generateRolesDefinition();
        let count = 0;

        for (const roleDef of rolesDefinition) {
            const existing = await this.roleRepo.findOne({ where: { code: roleDef.code } });

            if (!existing) {
                const role = this.roleRepo.create({
                    ...roleDef,
                    estSysteme: true,
                    estActif: true,
                });
                await this.roleRepo.save(role);
                count++;
                logger.debug(`  ✓ Rôle créé: ${roleDef.libelle}`);
            } else {
                // Mettre à jour le libellé/description si changé
                if (existing.libelle !== roleDef.libelle || existing.description !== roleDef.description) {
                    existing.libelle = roleDef.libelle;
                    existing.description = roleDef.description;
                    await this.roleRepo.save(existing);
                    logger.debug(`  ↻ Rôle mis à jour: ${roleDef.libelle}`);
                }
            }
        }

        logger.info(`  ✓ ${count} rôles créés, ${Object.values(RoleEnum).length - count} existants (total: ${Object.values(RoleEnum).length})`);
        return count;
    }

    /**
     * Seed de toutes les permissions (généré automatiquement depuis le enum)
     * 
     * AMÉLIORATION v6.2 :
     * - Statistiques détaillées par module
     * - Détection des permissions désactivées
     * - Rapport complet à la fin
     */
    private async seedPermissions(): Promise<number> {
        // Toutes les permissions du enum Permission (source de vérité unique)
        const enumPermissions = Object.values(PermissionEnum);
        
        // Statistiques par module
        const moduleStats: Record<string, { total: number; created: number; updated: number; skipped: number }> = {};

        let count = 0;
        let updateCount = 0;
        let skipCount = 0;

        for (const permCode of enumPermissions) {
            const existing = await this.permissionRepo.findOne({ where: { code: permCode } });
            
            // Extraire le module pour les stats
            const [module] = permCode.split(':');
            if (!moduleStats[module]) {
                moduleStats[module] = { total: 0, created: 0, updated: 0, skipped: 0 };
            }
            moduleStats[module].total++;

            if (!existing) {
                const [module, ...actionParts] = permCode.split(':');
                const action = actionParts.join(':');
                
                const permission = this.permissionRepo.create({
                    code: permCode,
                    libelle: this.generateLibelle(module, action),
                    module,
                    action,
                    actif: true,
                });
                await this.permissionRepo.save(permission);
                count++;
                moduleStats[module].created++;
                logger.debug(`  ✓ Permission créée: ${permCode}`);
            } else {
                // Mettre à jour le libellé si changé
                const [module, ...actionParts] = permCode.split(':');
                const action = actionParts.join(':');
                const newLibelle = this.generateLibelle(module, action);
                
                if (existing.libelle !== newLibelle) {
                    existing.libelle = newLibelle;
                    await this.permissionRepo.save(existing);
                    updateCount++;
                    moduleStats[module].updated++;
                    logger.debug(`  ↻ Permission mise à jour: ${permCode}`);
                } else {
                    skipCount++;
                    moduleStats[module].skipped++;
                }
            }
        }

        // Rapport détaillé par module
        logger.info('');
        logger.info(`  📊 Résumé des permissions par module:`);
        const sortedModules = Object.entries(moduleStats).sort((a, b) => b[1].total - a[1].total);
        for (const [module, stats] of sortedModules) {
            const details = [];
            if (stats.created > 0) details.push(`${stats.created} créées`);
            if (stats.updated > 0) details.push(`${stats.updated} mises à jour`);
            if (stats.skipped > 0) details.push(`${stats.skipped} inchangées`);
            
            logger.info(`    ${module.padEnd(30)} ${stats.total.toString().padStart(3)} permissions ${details.length > 0 ? '(' + details.join(', ') + ')' : ''}`);
        }
        logger.info('');

        logger.info(`  ✓ ${count} permissions créées, ${updateCount} mises à jour, ${skipCount} inchangées (total enum: ${enumPermissions.length})`);
        return count;
    }

    /**
     * Génère un libellé lisible depuis un code de permission
     */
    private generateLibelle(module: string, action: string): string {
        // Cas spécial : super_admin:all
        if (module === 'super_admin' && action === 'all') {
            return 'Super Admin - Accès Total';
        }

        const actions: Record<string, string> = {
            view: 'Voir',
            create: 'Créer',
            edit: 'Modifier',
            delete: 'Supprimer',
            manage: 'Gérer',
            validate: 'Valider',
            generate: 'Générer',
            print: 'Imprimer',
            send: 'Envoyer',
            broadcast: 'Diffuser',
            approve: 'Approuver',
            toggle: 'Activer/Désactiver',
            reset: 'Réinitialiser',
            restore: 'Restaurer',
            export: 'Exporter',
            import: 'Importer',
            'app:view': 'Voir l\'application',
            'app:edit': 'Modifier l\'application',
            'module:view': 'Voir les modules',
            'module:edit': 'Modifier les modules',
            'module:toggle': 'Activer/Désactiver les modules',
            'param:view': 'Voir les paramètres',
            'param:create': 'Créer des paramètres',
            'param:edit': 'Modifier les paramètres',
            'param:delete': 'Supprimer les paramètres',
            'param:reset': 'Réinitialiser les paramètres',
            'history:view': 'Voir l\'historique',
            'history:restore': 'Restaurer l\'historique',
            'backup:create': 'Créer des sauvegardes',
            'backup:restore': 'Restaurer des sauvegardes',
            'cache:invalidate': 'Invalider le cache',
            'menus:view': 'Voir les menus',
            'menus:create': 'Créer des menus',
            'menus:edit': 'Modifier les menus',
            'menus:delete': 'Supprimer les menus',
            'scolarite:view': 'Voir la scolarité',
            'scolarite:config': 'Configurer la scolarité',
            'paiement:create': 'Créer des paiements',
            'paiement:validate': 'Valider des paiements',
            'paiement:refund': 'Rembourser',
            'paiement:delete': 'Supprimer des paiements',
        };

        const moduleLabels: Record<string, string> = {
            users: 'les utilisateurs',
            roles: 'les rôles',
            notes: 'les notes',
            bulletins: 'les bulletins',
            cantine: 'la cantine',
            transport: 'le transport',
            materiel: 'le matériel',
            clubs: 'les clubs',
            documents: 'les documents',
            cartes: 'les cartes',
            config: 'la configuration',
            monitoring: 'le monitoring',
            messages: 'les messages',
            notifications: 'les notifications',
            requetes: 'les requêtes',
            gamification: 'la gamification',
            super_admin: 'Super Admin',
            sante: 'la santé',
            parking: 'le parking',
            orientation: 'l\'orientation',
            scoring: 'le scoring',
            impressions: 'les impressions',
            sondages: 'les sondages',
            validation: 'la validation',
            infrastructures: 'les infrastructures',
            annonces: 'les annonces',
            suivi_eleves: 'le suivi élèves',
            suivi_personnel: 'le suivi personnel',
            organisation: 'l\'organisation',
            recrutement: 'le recrutement',
            salles: 'les salles',
            options: 'les options',
            personnel: 'le personnel',
            dashboard: 'le tableau de bord',
            eleves: 'les élèves',
            enseignants: 'les enseignants',
            classes: 'les classes',
            matieres: 'les matières',
            annee: 'l\'année scolaire',
            periodes: 'les périodes',
            emploi_du_temps: 'l\'emploi du temps',
            programmes: 'les programmes',
            groupes_etablissements: 'les groupes d\'établissements',
            permissions: 'les permissions',
            auth: 'l\'authentification',
            etablissements: 'les établissements',
            configuration: 'la configuration',
            utilisateurs: 'les utilisateurs',
        };

        const actionLabel = actions[action] || action;
        const moduleLabel = moduleLabels[module] || module;

        return `${actionLabel} ${moduleLabel}`;
    }

    /**
     * Seed du mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
     * 
     * CORRECTION v6.1 : Utilise INSERT au lieu d'écraser les relations existantes
     * pour éviter de perdre les permissions ajoutées par les migrations
     */
    private async seedRolePermissions(): Promise<number> {
        let count = 0;

        // Pour chaque rôle dans DEFAULT_ROLE_PERMISSIONS
        for (const [roleCode, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            const role = await this.roleRepo.findOne({ 
                where: { code: roleCode },
                relations: ['permissions'], // Charger les permissions existantes
            });

            if (!role) {
                logger.warn(`  ⚠ Rôle non trouvé: ${roleCode}`);
                continue;
            }

            // Récupérer ou créer les permissions
            const permissionEntities: Permission[] = [];

            for (const permCode of permissions) {
                let permission = await this.permissionRepo.findOne({ where: { code: permCode } });

                if (!permission) {
                    // Créer la permission si elle n'existe pas
                    const [module, action] = permCode.split(':');
                    permission = this.permissionRepo.create({
                        code: permCode,
                        libelle: this.generateLibelle(module, action),
                        module,
                        action,
                        actif: true,
                    });
                    await this.permissionRepo.save(permission);
                }

                permissionEntities.push(permission);
            }

            // CORRECTION : Ajouter les permissions manquantes au lieu d'écraser
            const existingPermissionIds = new Set(role.permissions?.map(p => p.id) || []);
            let addedCount = 0;

            for (const perm of permissionEntities) {
                if (!existingPermissionIds.has(perm.id)) {
                    // Permission manquante → l'ajouter
                    role.permissions = [...(role.permissions || []), perm];
                    addedCount++;
                }
            }

            // Sauvegarder uniquement si des permissions ont été ajoutées
            if (addedCount > 0) {
                await this.roleRepo.save(role);
                count += addedCount;
                logger.debug(`  ✓ ${roleCode}: ${addedCount} nouvelles permissions ajoutées (total: ${role.permissions.length})`);
            } else {
                logger.debug(`  ✓ ${roleCode}: toutes les permissions sont déjà assignées (${role.permissions.length})`);
            }
        }

        return count;
    }
}

export default RBACSeedService;
