/**
 * ==================================
 * eLISAschool - Seed RBAC (Rôles et Permissions)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Initialise les rôles système, les ~85 permissions,
 * et le mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Role, Permission, UtilisateurRole, Utilisateur, StatutUtilisateur } from '@modules/auth/entities';
import { Role as RoleEnum, DEFAULT_ROLE_PERMISSIONS, Permission as PermissionEnum } from '@shared/enums/roles.enum';
import { logger } from '@common/utils/logger.util';

/**
 * Service de seed pour le système RBAC
 */
export class RBACSeedService {
    private roleRepo: Repository<Role>;
    private permissionRepo: Repository<Permission>;
    private utilisateurRoleRepo: Repository<UtilisateurRole>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.roleRepo = AppDataSource.getRepository(Role);
        this.permissionRepo = AppDataSource.getRepository(Permission);
        this.utilisateurRoleRepo = AppDataSource.getRepository(UtilisateurRole);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Exécute tous les seeds RBAC
     */
    async runAllSeeds(): Promise<{ roles: number; permissions: number; mappings: number; userRoles: number }> {
        logger.info('🔐 Seed RBAC: Rôles et Permissions...');

        const rolesCount = await this.seedRoles();
        const permissionsCount = await this.seedPermissions();
        const mappingsCount = await this.seedRolePermissions();
        const userRolesCount = await this.seedUtilisateurRoles();

        logger.info(`✅ RBAC Seed terminé: ${rolesCount} rôles, ${permissionsCount} permissions, ${mappingsCount} mappings, ${userRolesCount} user-roles`);

        return {
            roles: rolesCount,
            permissions: permissionsCount,
            mappings: mappingsCount,
            userRoles: userRolesCount,
        };
    }

    /**
     * Seed de TOUS les rôles système (sauf administration nationale supprimée)
     */
    private async seedRoles(): Promise<number> {
        const rolesDefinition = [
            // Rôles principaux
            { code: RoleEnum.SUPER_ADMIN, libelle: 'Super Administrateur', description: 'Accès total à toutes les fonctionnalités' },
            { code: RoleEnum.ADMIN, libelle: 'Administrateur', description: 'Administrateur de l\'établissement' },
            { code: RoleEnum.CHEF_ETABLISSEMENT, libelle: 'Chef d\'Établissement', description: 'Direction de l\'établissement' },
            { code: RoleEnum.ENSEIGNANT, libelle: 'Enseignant', description: 'Enseignant (générique)' },
            { code: RoleEnum.PERSONNEL, libelle: 'Personnel', description: 'Personnel non-enseignant (générique)' },
            { code: RoleEnum.PARENT, libelle: 'Parent', description: 'Parent d\'élève (générique)' },
            { code: RoleEnum.ELEVE, libelle: 'Élève', description: 'Élève (générique)' },
            
            // Direction d'établissement
            { code: RoleEnum.PROVISEUR, libelle: 'Proviseur', description: 'Chef d\'établissement secondaire (lycée)' },
            { code: RoleEnum.PRINCIPAL, libelle: 'Principal', description: 'Chef d\'établissement collège' },
            { code: RoleEnum.DIRECTEUR, libelle: 'Directeur', description: 'Chef d\'école primaire' },
            { code: RoleEnum.CENSEUR, libelle: 'Censeur', description: 'Responsable discipline & organisation' },
            { code: RoleEnum.DIRECTEUR_ADJOINT, libelle: 'Directeur Adjoint', description: 'Chef d\'établissement adjoint' },
            { code: RoleEnum.RESPONSABLE_PEDAGOGIQUE, libelle: 'Responsable Pédagogique', description: 'Conseiller pédagogique interne' },
            
            // Enseignants spécialisés
            { code: RoleEnum.PROFESSEUR_CERTIFIE, libelle: 'Professeur Certifié', description: 'Enseignant secondaire certifié' },
            { code: RoleEnum.PROFESSEUR_AGREGE, libelle: 'Professeur Agrégé', description: 'Enseignant lycée (agrégé)' },
            { code: RoleEnum.INSTITUTEUR, libelle: 'Instituteur', description: 'Enseignant primaire' },
            { code: RoleEnum.MAITRE_AUXILIAIRE, libelle: 'Maître Auxiliaire', description: 'Enseignant contractuel' },
            { code: RoleEnum.PROFESSEUR_TECHNIQUE, libelle: 'Professeur Technique', description: 'Enseignant technique/professionnel' },
            { code: RoleEnum.EDUCATEUR_MATERNELLE, libelle: 'Éducateur Maternelle', description: 'Enseignant maternelle' },
            { code: RoleEnum.PROFESSEUR_PRINCIPAL, libelle: 'Professeur Principal', description: 'Responsable de classe' },
            { code: RoleEnum.COORDINATEUR_DISCIPLINE, libelle: 'Coordinateur', description: 'Coordinateur matière/département' },
            
            // Orientation & conseil
            { code: RoleEnum.CONSEILLER_ORIENTEUR, libelle: 'Conseiller d\'Orientation', description: 'Conseiller orientation scolaire' },
            { code: RoleEnum.PSYCHOLOGUE_SCOLAIRE, libelle: 'Psychologue Scolaire', description: 'Psychologue de l\'éducation' },
            { code: RoleEnum.ASSISTANT_SOCIAL, libelle: 'Assistant Social', description: 'Assistant social scolaire' },
            
            // Personnel administratif
            { code: RoleEnum.SECRETAIRE_DIRECTION, libelle: 'Secrétaire de Direction', description: 'Secrétaire de direction' },
            { code: RoleEnum.COMPTABLE, libelle: 'Comptable', description: 'Agent comptable' },
            { code: RoleEnum.GESTIONNAIRE, libelle: 'Gestionnaire', description: 'Gestionnaire matériel/logistique' },
            { code: RoleEnum.BIBLIOTHECAIRE, libelle: 'Bibliothécaire', description: 'Responsable bibliothèque' },
            { code: RoleEnum.DOCUMENTALISTE, libelle: 'Documentaliste', description: 'Responsable documentation' },
            { code: RoleEnum.ARCHIVISTE, libelle: 'Archiviste', description: 'Responsable archives' },
            
            // Personnel technique
            { code: RoleEnum.TECHNICIEN_LABO, libelle: 'Technicien Labo', description: 'Technicien laboratoire sciences' },
            { code: RoleEnum.TECHNICIEN_INFO, libelle: 'Technicien Informatique', description: 'Technicien informatique' },
            { code: RoleEnum.CONSEILLER_TIC, libelle: 'Conseiller TIC', description: 'Conseiller TIC pédagogique' },
            { code: RoleEnum.AIDE_EDUCATEUR, libelle: 'Aide Éducateur', description: 'Assistant pédagogique' },
            
            // Surveillance & vie scolaire
            { code: RoleEnum.SURVEILLANT_GENERAL, libelle: 'Surveillant Général', description: 'Responsable surveillance' },
            { code: RoleEnum.SURVEILLANT, libelle: 'Surveillant', description: 'Maître d\'internat / surveillant' },
            
            // Services spécifiques
            { code: RoleEnum.RESPONSABLE_CANTINE, libelle: 'Responsable Cantine', description: 'Gestion de la cantine' },
            { code: RoleEnum.RESPONSABLE_TRANSPORT, libelle: 'Responsable Transport', description: 'Gestion du transport' },
            { code: RoleEnum.RESPONSABLE_INFRASTRUCTURE, libelle: 'Responsable Infrastructure', description: 'Parking, maintenance, sécurité' },
        ];

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
            }
        }

        return count;
    }

    /**
     * Seed de toutes les permissions (~85)
     */
    private async seedPermissions(): Promise<number> {
        // Permissions existantes (de l'enum)
        const existingPermissions = Object.values(PermissionEnum);

        // Nouvelles permissions pour couvrir tous les modules
        const newPermissions = [
            // ==================================
            // PERMISSIONS CRITIQUES (Sécurité & Admin)
            // ==================================
            
            // Établissements
            { code: 'etablissements:list', libelle: 'Lister tous les établissements', module: 'etablissements', action: 'list' },
            { code: 'etablissements:create', libelle: 'Créer un établissement', module: 'etablissements', action: 'create' },
            { code: 'etablissements:desactiver', libelle: 'Désactiver un établissement', module: 'etablissements', action: 'desactiver' },
            { code: 'etablissements:activer', libelle: 'Activer un établissement', module: 'etablissements', action: 'activer' },
            { code: 'etablissements:config:view', libelle: 'Voir la configuration', module: 'etablissements', action: 'config:view' },
            { code: 'etablissements:config:edit', libelle: 'Modifier la configuration', module: 'etablissements', action: 'config:edit' },

            // Permissions RBAC
            { code: 'permissions:view', libelle: 'Voir les permissions', module: 'permissions', action: 'view' },
            { code: 'permissions:create', libelle: 'Créer une permission', module: 'permissions', action: 'create' },
            { code: 'permissions:edit', libelle: 'Modifier une permission', module: 'permissions', action: 'edit' },
            { code: 'permissions:delete', libelle: 'Supprimer une permission', module: 'permissions', action: 'delete' },

            // Configuration avancée
            { code: 'configuration:seed', libelle: 'Exécuter les seeds', module: 'configuration', action: 'seed' },
            { code: 'configuration:licence:activer', libelle: 'Activer une licence', module: 'configuration', action: 'licence:activer' },

            // Monitoring
            { code: 'monitoring:maintenance:toggle', libelle: 'Activer/désactiver maintenance', module: 'monitoring', action: 'maintenance:toggle' },
            { code: 'monitoring:metrics:view', libelle: 'Voir les métriques', module: 'monitoring', action: 'metrics:view' },
            { code: 'monitoring:stats:view', libelle: 'Voir les statistiques', module: 'monitoring', action: 'stats:view' },
            { code: 'monitoring:health:view', libelle: 'Voir l\'état de santé', module: 'monitoring', action: 'health:view' },

            // Utilisateurs avancé
            { code: 'utilisateurs:manage', libelle: 'Gestion avancée des utilisateurs', module: 'utilisateurs', action: 'manage' },
            { code: 'utilisateurs:import', libelle: 'Importer des utilisateurs', module: 'utilisateurs', action: 'import' },
            { code: 'utilisateurs:export', libelle: 'Exporter les utilisateurs', module: 'utilisateurs', action: 'export' },
            { code: 'utilisateurs:reset-password', libelle: 'Réinitialiser mot de passe', module: 'utilisateurs', action: 'reset-password' },
            { code: 'utilisateurs:profil:update', libelle: 'Mettre à jour le profil', module: 'utilisateurs', action: 'profil:update' },
            { code: 'utilisateurs:statut:change', libelle: 'Changer le statut', module: 'utilisateurs', action: 'statut:change' },
            { code: 'utilisateurs:etablissements:manage', libelle: 'Gérer les établissements', module: 'utilisateurs', action: 'etablissements:manage' },

            // Auth
            { code: 'auth:sessions:manage', libelle: 'Gérer les sessions', module: 'auth', action: 'sessions:manage' },

            // Années scolaires
            { code: 'annees:cloturer', libelle: 'Clôturer une année', module: 'annees', action: 'cloturer' },
            { code: 'annees:dupliquer', libelle: 'Dupliquer une année', module: 'annees', action: 'dupliquer' },

            // ==================================
            // MODULES MÉTIER PRIORITAIRES
            // ==================================

            // Élèves
            { code: 'eleves:radiation', libelle: 'Radier un élève', module: 'eleves', action: 'radiation' },
            { code: 'eleves:reinscription', libelle: 'Réinscrire un élève', module: 'eleves', action: 'reinscription' },
            { code: 'eleves:documents:generate', libelle: 'Générer des documents', module: 'eleves', action: 'documents:generate' },
            { code: 'eleves:historique:view', libelle: 'Voir l\'historique', module: 'eleves', action: 'historique:view' },

            // Bulletins
            { code: 'bulletins:edit', libelle: 'Modifier un bulletin', module: 'bulletins', action: 'edit' },
            { code: 'bulletins:publier', libelle: 'Publier un bulletin', module: 'bulletins', action: 'publier' },
            { code: 'bulletins:export', libelle: 'Exporter les bulletins', module: 'bulletins', action: 'export' },

            // Cantine (granulaire)
            { code: 'cantine:menus:create', libelle: 'Créer un menu', module: 'cantine', action: 'menus:create' },
            { code: 'cantine:menus:edit', libelle: 'Modifier un menu', module: 'cantine', action: 'menus:edit' },
            { code: 'cantine:menus:delete', libelle: 'Supprimer un menu', module: 'cantine', action: 'menus:delete' },
            { code: 'cantine:inscriptions:create', libelle: 'Inscrire à la cantine', module: 'cantine', action: 'inscriptions:create' },
            { code: 'cantine:inscriptions:view', libelle: 'Voir les inscriptions', module: 'cantine', action: 'inscriptions:view' },
            { code: 'cantine:solde:recharger', libelle: 'Recharger le solde', module: 'cantine', action: 'solde:recharger' },
            { code: 'cantine:consommations:enregistrer', libelle: 'Enregistrer une consommation', module: 'cantine', action: 'consommations:enregistrer' },
            { code: 'cantine:consommations:view', libelle: 'Voir les consommations', module: 'cantine', action: 'consommations:view' },
            { code: 'cantine:statistiques:view', libelle: 'Voir les statistiques cantine', module: 'cantine', action: 'statistiques:view' },

            // Cartes
            { code: 'cartes:create', libelle: 'Créer une carte', module: 'cartes', action: 'create' },
            { code: 'cartes:edit', libelle: 'Modifier une carte', module: 'cartes', action: 'edit' },
            { code: 'cartes:desactiver', libelle: 'Désactiver une carte', module: 'cartes', action: 'desactiver' },
            { code: 'cartes:perte:signaler', libelle: 'Signaler une perte', module: 'cartes', action: 'perte:signaler' },
            { code: 'cartes:import', libelle: 'Importer des cartes', module: 'cartes', action: 'import' },

            // Classes
            { code: 'classes:affecter', libelle: 'Affecter un élève', module: 'classes', action: 'affecter' },
            { code: 'classes:desaffecter', libelle: 'Désaffecter un élève', module: 'classes', action: 'desaffecter' },
            { code: 'classes:effectifs:view', libelle: 'Voir les effectifs', module: 'classes', action: 'effectifs:view' },
            { code: 'classes:export', libelle: 'Exporter les classes', module: 'classes', action: 'export' },

            // Clubs
            { code: 'clubs:create', libelle: 'Créer un club', module: 'clubs', action: 'create' },
            { code: 'clubs:edit', libelle: 'Modifier un club', module: 'clubs', action: 'edit' },
            { code: 'clubs:delete', libelle: 'Supprimer un club', module: 'clubs', action: 'delete' },
            { code: 'clubs:inscriptions:manage', libelle: 'Gérer les inscriptions', module: 'clubs', action: 'inscriptions:manage' },
            { code: 'clubs:evenements:create', libelle: 'Créer un événement', module: 'clubs', action: 'evenements:create' },
            { code: 'clubs:evenements:edit', libelle: 'Modifier un événement', module: 'clubs', action: 'evenements:edit' },
            { code: 'clubs:evenements:delete', libelle: 'Supprimer un événement', module: 'clubs', action: 'evenements:delete' },
            { code: 'clubs:evenements:view', libelle: 'Voir les événements', module: 'clubs', action: 'evenements:view' },

            // Gamification
            { code: 'gamification:badges:create', libelle: 'Créer un badge', module: 'gamification', action: 'badges:create' },
            { code: 'gamification:badges:edit', libelle: 'Modifier un badge', module: 'gamification', action: 'badges:edit' },
            { code: 'gamification:badges:delete', libelle: 'Supprimer un badge', module: 'gamification', action: 'badges:delete' },
            { code: 'gamification:points:attribuer', libelle: 'Attribuer des points', module: 'gamification', action: 'points:attribuer' },
            { code: 'gamification:badges:attribuer', libelle: 'Attribuer un badge', module: 'gamification', action: 'badges:attribuer' },
            { code: 'gamification:classement:view', libelle: 'Voir le classement', module: 'gamification', action: 'classement:view' },
            { code: 'gamification:historique:view', libelle: 'Voir l\'historique', module: 'gamification', action: 'historique:view' },

            // Impressions
            { code: 'impressions:modeles:view', libelle: 'Voir les modèles', module: 'impressions', action: 'modeles:view' },
            { code: 'impressions:modeles:create', libelle: 'Créer un modèle', module: 'impressions', action: 'modeles:create' },
            { code: 'impressions:modeles:edit', libelle: 'Modifier un modèle', module: 'impressions', action: 'modeles:edit' },
            { code: 'impressions:modeles:delete', libelle: 'Supprimer un modèle', module: 'impressions', action: 'modeles:delete' },
            { code: 'impressions:file:view', libelle: 'Voir les fichiers', module: 'impressions', action: 'file:view' },
            { code: 'impressions:file:create', libelle: 'Créer un fichier', module: 'impressions', action: 'file:create' },
            { code: 'impressions:file:generer', libelle: 'Générer un fichier', module: 'impressions', action: 'file:generer' },
            { code: 'impressions:file:annuler', libelle: 'Annuler une impression', module: 'impressions', action: 'file:annuler' },
            { code: 'impressions:traiter', libelle: 'Traiter en batch', module: 'impressions', action: 'traiter' },

            // Matériel
            { code: 'materiel:create', libelle: 'Créer un matériel', module: 'materiel', action: 'create' },
            { code: 'materiel:edit', libelle: 'Modifier un matériel', module: 'materiel', action: 'edit' },
            { code: 'materiel:delete', libelle: 'Supprimer un matériel', module: 'materiel', action: 'delete' },
            { code: 'materiel:prets:view', libelle: 'Voir les prêts', module: 'materiel', action: 'prets:view' },
            { code: 'materiel:prets:create', libelle: 'Créer un prêt', module: 'materiel', action: 'prets:create' },
            { code: 'materiel:prets:retour', libelle: 'Enregistrer un retour', module: 'materiel', action: 'prets:retour' },
            { code: 'materiel:inventaire:manage', libelle: 'Gérer l\'inventaire', module: 'materiel', action: 'inventaire:manage' },

            // Matières
            { code: 'matieres:groupes:view', libelle: 'Voir les groupes', module: 'matieres', action: 'groupes:view' },
            { code: 'matieres:groupes:create', libelle: 'Créer un groupe', module: 'matieres', action: 'groupes:create' },
            { code: 'matieres:programme:view', libelle: 'Voir le programme', module: 'matieres', action: 'programme:view' },
            { code: 'matieres:programme:create', libelle: 'Créer un programme', module: 'matieres', action: 'programme:create' },
            { code: 'matieres:programme:edit', libelle: 'Modifier un programme', module: 'matieres', action: 'programme:edit' },
            { code: 'matieres:affectations:create', libelle: 'Créer une affectation', module: 'matieres', action: 'affectations:create' },

            // Messagerie
            { code: 'messagerie:conversations:create', libelle: 'Créer une conversation', module: 'messagerie', action: 'conversations:create' },
            { code: 'messagerie:broadcast', libelle: 'Envoyer un broadcast', module: 'messagerie', action: 'broadcast' },
            { code: 'messagerie:messages:read', libelle: 'Marquer comme lu', module: 'messagerie', action: 'messages:read' },

            // Notes
            { code: 'notes:bulk:create', libelle: 'Créer des notes en masse', module: 'notes', action: 'bulk:create' },
            { code: 'notes:import', libelle: 'Importer des notes', module: 'notes', action: 'import' },
            { code: 'notes:export', libelle: 'Exporter les notes', module: 'notes', action: 'export' },
            { code: 'notes:statistiques:view', libelle: 'Voir les statistiques', module: 'notes', action: 'statistiques:view' },

            // Notifications
            { code: 'notifications:create', libelle: 'Créer une notification', module: 'notifications', action: 'create' },
            { code: 'notifications:bulk:create', libelle: 'Créer en masse', module: 'notifications', action: 'bulk:create' },
            { code: 'notifications:read', libelle: 'Marquer comme lue', module: 'notifications', action: 'read' },
            { code: 'notifications:read-all', libelle: 'Marquer tout comme lu', module: 'notifications', action: 'read-all' },
            { code: 'notifications:delete', libelle: 'Supprimer une notification', module: 'notifications', action: 'delete' },
            { code: 'notifications:count', libelle: 'Voir le compteur', module: 'notifications', action: 'count' },

            // Orientation
            { code: 'orientation:profils:view', libelle: 'Voir les profils', module: 'orientation', action: 'profils:view' },
            { code: 'orientation:profils:create', libelle: 'Créer un profil', module: 'orientation', action: 'profils:create' },
            { code: 'orientation:profils:edit', libelle: 'Modifier un profil', module: 'orientation', action: 'profils:edit' },
            { code: 'orientation:suggestions:view', libelle: 'Voir les suggestions', module: 'orientation', action: 'suggestions:view' },
            { code: 'orientation:fiches:view', libelle: 'Voir les fiches', module: 'orientation', action: 'fiches:view' },
            { code: 'orientation:fiches:create', libelle: 'Créer une fiche', module: 'orientation', action: 'fiches:create' },
            { code: 'orientation:rdv:view', libelle: 'Voir les rendez-vous', module: 'orientation', action: 'rdv:view' },
            { code: 'orientation:rdv:create', libelle: 'Créer un rendez-vous', module: 'orientation', action: 'rdv:create' },
            { code: 'orientation:rdv:edit', libelle: 'Modifier un rendez-vous', module: 'orientation', action: 'rdv:edit' },
            { code: 'orientation:rdv:annuler', libelle: 'Annuler un rendez-vous', module: 'orientation', action: 'rdv:annuler' },

            // Périodes
            { code: 'periodes:types:view', libelle: 'Voir les types', module: 'periodes', action: 'types:view' },
            { code: 'periodes:types:create', libelle: 'Créer un type', module: 'periodes', action: 'types:create' },

            // Personnel
            { code: 'personnel:view', libelle: 'Voir le personnel', module: 'personnel', action: 'view' },
            { code: 'personnel:create', libelle: 'Créer un membre', module: 'personnel', action: 'create' },
            { code: 'personnel:edit', libelle: 'Modifier un membre', module: 'personnel', action: 'edit' },
            { code: 'personnel:delete', libelle: 'Supprimer un membre', module: 'personnel', action: 'delete' },
            { code: 'personnel:types:view', libelle: 'Voir les types', module: 'personnel', action: 'types:view' },
            { code: 'personnel:types:create', libelle: 'Créer un type', module: 'personnel', action: 'types:create' },

            // Requêtes
            { code: 'requetes:traiter', libelle: 'Traiter une requête', module: 'requetes', action: 'traiter' },
            { code: 'requetes:annuler', libelle: 'Annuler une requête', module: 'requetes', action: 'annuler' },

            // Scoring
            { code: 'scoring:points:attribuer', libelle: 'Attribuer des points', module: 'scoring', action: 'points:attribuer' },
            { code: 'scoring:rangs:calculer', libelle: 'Calculer les rangs', module: 'scoring', action: 'rangs:calculer' },
            { code: 'scoring:classement:view', libelle: 'Voir le classement', module: 'scoring', action: 'classement:view' },
            { code: 'scoring:regles:view', libelle: 'Voir les règles', module: 'scoring', action: 'regles:view' },
            { code: 'scoring:regles:create', libelle: 'Créer une règle', module: 'scoring', action: 'regles:create' },
            { code: 'scoring:historique:view', libelle: 'Voir l\'historique', module: 'scoring', action: 'historique:view' },
            { code: 'scoring:recalculer', libelle: 'Recalculer les scores', module: 'scoring', action: 'recalculer' },

            // Transport
            { code: 'transport:lignes:view', libelle: 'Voir les lignes', module: 'transport', action: 'lignes:view' },
            { code: 'transport:lignes:create', libelle: 'Créer une ligne', module: 'transport', action: 'lignes:create' },
            { code: 'transport:lignes:edit', libelle: 'Modifier une ligne', module: 'transport', action: 'lignes:edit' },
            { code: 'transport:lignes:delete', libelle: 'Supprimer une ligne', module: 'transport', action: 'lignes:delete' },
            { code: 'transport:inscriptions:create', libelle: 'Inscrire au transport', module: 'transport', action: 'inscriptions:create' },
            { code: 'transport:inscriptions:view', libelle: 'Voir les inscriptions', module: 'transport', action: 'inscriptions:view' },
            { code: 'transport:presences:enregistrer', libelle: 'Enregistrer une présence', module: 'transport', action: 'presences:enregistrer' },
            { code: 'transport:presences:view', libelle: 'Voir les présences', module: 'transport', action: 'presences:view' },
        ];

        // Fusionner avec les permissions existantes (parser les codes)
        const allPermissions = new Map<string, { code: string; libelle: string; module: string; action: string }>();

        // Ajouter les nouvelles permissions
        for (const perm of newPermissions) {
            allPermissions.set(perm.code, perm);
        }

        // Parser les permissions existantes de l'enum
        for (const permCode of existingPermissions) {
            if (!allPermissions.has(permCode)) {
                const [module, action] = permCode.split(':');
                allPermissions.set(permCode, {
                    code: permCode,
                    libelle: this.generateLibelle(module, action),
                    module,
                    action,
                });
            }
        }

        let count = 0;

        for (const permData of allPermissions.values()) {
            const existing = await this.permissionRepo.findOne({ where: { code: permData.code } });

            if (!existing) {
                const permission = this.permissionRepo.create({
                    ...permData,
                    actif: true,
                });
                await this.permissionRepo.save(permission);
                count++;
            }
        }

        logger.info(`  ✓ ${count} permissions créées (total: ${allPermissions.size})`);
        return count;
    }

    /**
     * Génère un libellé lisible depuis un code de permission
     */
    private generateLibelle(module: string, action: string): string {
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
        };

        const actionLabel = actions[action] || action;
        const moduleLabel = moduleLabels[module] || module;

        return `${actionLabel} ${moduleLabel}`;
    }

    /**
     * Seed du mapping rôle → permissions depuis DEFAULT_ROLE_PERMISSIONS
     */
    private async seedRolePermissions(): Promise<number> {
        let count = 0;

        // Pour chaque rôle dans DEFAULT_ROLE_PERMISSIONS
        for (const [roleCode, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
            const role = await this.roleRepo.findOne({ where: { code: roleCode } });

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

            // Assigner les permissions au rôle
            role.permissions = permissionEntities;
            await this.roleRepo.save(role);
            count += permissionEntities.length;

            logger.debug(`  ✓ ${roleCode}: ${permissionEntities.length} permissions assignées`);
        }

        return count;
    }

    /**
     * Seed des utilisateur_roles pour les utilisateurs existants
     * Migre le champ role (legacy) vers le nouveau système multi-rôles
     */
    private async seedUtilisateurRoles(): Promise<number> {
        const utilisateurs = await this.utilisateurRepo.find();
        let count = 0;

        for (const utilisateur of utilisateurs) {
            // Vérifier si l'utilisateur a déjà des rôles assignés
            const existingRoles = await this.utilisateurRoleRepo.findOne({
                where: { utilisateurId: utilisateur.id },
            });

            if (!existingRoles && utilisateur.role) {
                // Trouver le rôle correspondant
                const role = await this.roleRepo.findOne({
                    where: { code: utilisateur.role },
                });

                if (role) {
                    const utilisateurRole = this.utilisateurRoleRepo.create({
                        utilisateurId: utilisateur.id,
                        roleId: role.id,
                        estPrincipal: true,
                        dateAttribution: new Date(),
                    });
                    await this.utilisateurRoleRepo.save(utilisateurRole);
                    count++;
                    logger.debug(`  ✓ Utilisateur ${utilisateur.email} → Rôle ${role.libelle}`);
                }
            }
        }

        return count;
    }
}

export default RBACSeedService;
