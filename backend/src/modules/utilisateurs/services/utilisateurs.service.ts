/**
 * ==================================
 * eLISAschool - Service Utilisateurs
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { Utilisateur, ProfilUtilisateur, StatutUtilisateur, UtilisateurPermission, TypePermission, Permission as PermissionEntity, RoleEntity, UtilisateurEtablissement, AuditSeverity } from '@modules/auth/entities';
import { MembrePersonnel } from '@modules/personnel/entities';
import { Role } from '@shared/enums/roles.enum';
import {
    CreateUtilisateurDto,
    UpdateUtilisateurDto,
    UpdateProfilDto,
    UpdateSecurityDto,
    ChangeRoleDto,
    QueryUtilisateursDto,
    UtilisateurResponseDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction, tokenService } from '@modules/auth';
import { auditUtilisateur } from '@modules/auth/utils/audit-utilisateurs';

/**
 * Interface de résultat paginé
 */
interface PaginatedResult<T> {
    items: T[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

/**
 * Service de gestion des utilisateurs
 */
export class UtilisateursService {
    private utilisateurRepository: Repository<Utilisateur>;
    private profilRepository: Repository<ProfilUtilisateur>;
    private roleEntityRepository: Repository<RoleEntity>;
    private permissionEntityRepository: Repository<import('@modules/auth/entities').Permission>;
    private utilisateurPermissionRepository: Repository<UtilisateurPermission>;
    private utilisateurEtablissementRepository: Repository<UtilisateurEtablissement>;

    constructor() {
        this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
        this.profilRepository = AppDataSource.getRepository(ProfilUtilisateur);
        this.roleEntityRepository = AppDataSource.getRepository(RoleEntity);
        this.permissionEntityRepository = AppDataSource.getRepository(PermissionEntity);
        this.utilisateurPermissionRepository = AppDataSource.getRepository(UtilisateurPermission);
        this.utilisateurEtablissementRepository = AppDataSource.getRepository(UtilisateurEtablissement);
    }

    /**
     * Créer un nouvel utilisateur
     */
    async create(createDto: CreateUtilisateurDto, req?: Request): Promise<UtilisateurResponseDto> {
        // Vérifier l'unicité de l'email
        const existant = await this.utilisateurRepository.findOne({
            where: { email: createDto.email.toLowerCase() },
        });

        if (existant) {
            throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
        }

        // Générer un matricule unique
        let matricule: string;
        let matriculeExiste = true;

        while (matriculeExiste) {
            matricule = Utilisateur.genererMatricule('EL');
            const check = await this.utilisateurRepository.findOne({ where: { matricule } });
            matriculeExiste = !!check;
        }

        // Créer l'utilisateur
        const utilisateur = this.utilisateurRepository.create({
            email: createDto.email.toLowerCase(),
            matricule: matricule!,
            motDePasse: createDto.motDePasse,
            role: createDto.role as Role,
            statut: StatutUtilisateur.ACTIF,
            langue: createDto.langue || 'fr',
        });

        await this.utilisateurRepository.save(utilisateur);

        // Créer le profil
        const profil = this.profilRepository.create({
            utilisateurId: utilisateur.id,
            nom: createDto.nom,
            prenom: createDto.prenom,
            telephone: createDto.telephone,
            genre: createDto.genre as any,
            dateNaissance: createDto.dateNaissance ? new Date(createDto.dateNaissance) : undefined,
            adresse: createDto.adresse,
        });

        await this.profilRepository.save(profil);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.USER_CREATE,
                cible: 'Utilisateur',
                cibleId: utilisateur.id,
                description: `Création utilisateur: ${utilisateur.email} (${utilisateur.matricule})`,
                nouvellesValeurs: { email: utilisateur.email, role: utilisateur.role, matricule: utilisateur.matricule },
                module: 'utilisateurs',
            }, req);
        }

        logger.info(`Utilisateur créé: ${utilisateur.email} (${utilisateur.matricule})`);

        return this.formatUtilisateurResponse(utilisateur, profil);
    }

    /**
     * Récupérer tous les utilisateurs avec pagination et filtres
     */
    async findAll(query: QueryUtilisateursDto): Promise<PaginatedResult<UtilisateurResponseDto>> {
        const { page, limit, search, role, statut, etablissementId, exclureEtablissement, sortBy, sortOrder, actifFiltre } = query;

        // Construction de la requête avec JOIN sur utilisateur_etablissements
        let queryBuilder = this.utilisateurRepository
            .createQueryBuilder('u');

        // LEFT JOIN sur profils_utilisateurs pour recherche et tri par nom/prenom
        queryBuilder.leftJoin('profils_utilisateurs', 'p', 'p."utilisateurId" = u.id')
            .addSelect('p.nom', 'p_nom')
            .addSelect('p.prenom', 'p_prenom');

        // LEFT JOIN sur membrePersonnel pour afficher la liaison dans la colonne Personnel
        queryBuilder
            .leftJoinAndSelect('u.membrePersonnel', 'mp_list');

        // Si filtrage par établissement, utiliser la table de jointure
        if (etablissementId) {
            queryBuilder
                .innerJoin('u.utilisateurEtablissements', 'ue')
                .where('ue.etablissementId = :etablissementId', { etablissementId });

            // Filtre par statut d'affectation (par défaut: uniquement actifs)
            if (actifFiltre === 'actif') {
                queryBuilder.andWhere('ue.actif = :actif', { actif: true });
            } else if (actifFiltre === 'inactif') {
                queryBuilder.andWhere('ue.actif = :actif', { actif: false });
            }
            // Si 'tous', pas de filtre sur ue.actif

            // Filtre par rôle dans l'établissement (pas le rôle global)
            if (role) {
                const roles = role.split(',').map(r => r.trim());
                if (roles.length === 1) {
                    queryBuilder.andWhere('ue.role = :role', { role: roles[0] });
                } else {
                    queryBuilder.andWhere('ue.role IN (:...roles)', { roles });
                }
            }
        } else {
            // Pas de filtrage par établissement → requête simple
            const where: FindOptionsWhere<Utilisateur> = {};

            if (role && !exclureEtablissement) {
                const roles = role.split(',').map(r => r.trim()) as Role[];
                if (roles.length === 1) {
                    where.role = roles[0];
                }
            }

            if (statut) {
                where.statut = statut as StatutUtilisateur;
            }

            queryBuilder.where(where);

            // Gérer les rôles multiples (IN clause)
            if (role && role.includes(',')) {
                const roles = role.split(',').map(r => r.trim());
                queryBuilder.andWhere('u.role IN (:...roles)', { roles });
            }
        }

        // EXCLURE les utilisateurs déjà assignés à un établissement spécifique
        if (exclureEtablissement) {
            queryBuilder.andWhere(`
                u.id NOT IN (
                    SELECT ue."utilisateurId" 
                    FROM utilisateur_etablissements ue 
                    WHERE ue."etablissementId" = :exclureEtablissement 
                    AND ue.actif = true
                )
            `, { exclureEtablissement });
        }

        // Recherche textuelle (email, matricule, nom, prenom via JOIN profil)
        if (search) {
            queryBuilder.andWhere(
                '(u.email ILIKE :search OR u.matricule ILIKE :search OR p.nom ILIKE :search OR p.prenom ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Statut (si pas déjà appliqué dans le WHERE initial)
        if (statut && !etablissementId) {
            queryBuilder.andWhere('u.statut = :statut', { statut });
        }

        // Tri - validation du champ de tri (inclut 'nom' via profil)
        const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'matricule', 'role', 'statut', 'nom', 'pseudonyme', 'maxEtablissementsPersonnel'];
        if (sortBy === 'nom') {
            // Tri par nom du profil (NULLS LAST pour les profils manquants)
            queryBuilder.orderBy('p.nom', sortOrder, 'NULLS LAST');
        } else {
            const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
            queryBuilder.orderBy(`u.${orderField}`, sortOrder);
        }

        // Utiliser le système de pagination optimisé
        const { createPaginatedResult, paginateWithQueryBuilder } = await import('@common/utils/pagination.util');
        
        const result = await paginateWithQueryBuilder(
            queryBuilder,
            page,
            limit,
            true // COUNT optimisé pour les requêtes avec JOINs
        );

        // Récupérer les profils et formater la réponse
        const items = await Promise.all(
            result.items.map(async (u) => {
                const profil = await this.profilRepository.findOne({
                    where: { utilisateurId: u.id },
                });

                // Si filtrage par établissement, récupérer le rôle et le statut d'affectation
                let roleEtablissement: string | undefined;
                let actifDansEtablissement: boolean | undefined;
                if (etablissementId) {
                    const affectation = await AppDataSource.getRepository('UtilisateurEtablissement').findOne({
                        where: { utilisateurId: u.id, etablissementId }
                    });
                    roleEtablissement = affectation?.role;
                    actifDansEtablissement = affectation?.actif;
                }

                return this.formatUtilisateurResponse(u, profil || undefined, roleEtablissement, actifDansEtablissement);
            })
        );

        return createPaginatedResult(items, result.meta.totalItems, page, limit);
    }

    /**
     * Récupérer un utilisateur par ID
     */
    async findOne(id: string): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
            relations: ['membrePersonnel', 'utilisateurPermissions', 'utilisateurPermissions.permission'],
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        // RBAC v3 : charger le rôle depuis l'affectation établissement (si existante)
        const ue = await this.utilisateurEtablissementRepository.findOne({
            where: { utilisateurId: id, actif: true },
            relations: ['role'],
        });
        const roleCode = ue?.role?.code || utilisateur.role;
        const actifDansEtablissement = ue?.actif;

        // Calculer les permissions effectives (via le code rôle UE ou legacy)
        const permissions = await this.computeEffectivePermissions(roleCode, (utilisateur as any).utilisateurPermissions);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined, roleCode, actifDansEtablissement, permissions);
    }

    /**
     * Calcule les permissions effectives d'un utilisateur
     * (permissions du rôle + permissions directes GRANTED - permissions directes DENIED)
     */
    private async computeEffectivePermissions(
        roleCode: string,
        directPermissions?: UtilisateurPermission[]
    ): Promise<string[]> {
        // 1. Récupérer les permissions du rôle depuis la DB
        const roleEntity = await this.roleEntityRepository.findOne({
            where: { code: roleCode },
            relations: ['permissions'],
        });

        const rolePermissions = new Set<string>();
        if (roleEntity?.permissions) {
            for (const p of roleEntity.permissions) {
                rolePermissions.add(p.code);
            }
        }

        // 2. Appliquer les permissions directes (GRANTED ajoute, DENIED retire)
        if (directPermissions) {
            for (const up of directPermissions) {
                const code = up.permission?.code;
                if (!code) continue;
                if (up.type === TypePermission.GRANTED) {
                    rolePermissions.add(code);
                } else if (up.type === TypePermission.DENIED) {
                    rolePermissions.delete(code);
                }
            }
        }

        return Array.from(rolePermissions).sort();
    }

    /**
     * Mettre à jour un utilisateur
     */
    async update(id: string, updateDto: UpdateUtilisateurDto, req?: Request): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const anciennesValeurs = {
            email: utilisateur.email,
            role: utilisateur.role,
            statut: utilisateur.statut,
        };

        // Vérifier l'unicité de l'email si modifié
        if (updateDto.email && updateDto.email !== utilisateur.email) {
            const existant = await this.utilisateurRepository.findOne({
                where: { email: updateDto.email.toLowerCase() },
            });
            if (existant) {
                throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS');
            }
            utilisateur.email = updateDto.email.toLowerCase();
        }

        if (updateDto.role) {
            utilisateur.role = updateDto.role as Role;
        }

        if (updateDto.statut) {
            utilisateur.statut = updateDto.statut as StatutUtilisateur;
        }

        if (updateDto.langue) {
            utilisateur.langue = updateDto.langue;
        }

        if (updateDto.maxEtablissementsPersonnel !== undefined) {
            utilisateur.maxEtablissementsPersonnel = updateDto.maxEtablissementsPersonnel;
        }

        if (updateDto.etablissementId !== undefined) {
            // NOTE: etablissementId supprimé - géré via utilisateur_etablissements
            // if (updateDto.etablissementId) {
        }

        await this.utilisateurRepository.save(utilisateur);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.USER_UPDATE,
                cible: 'Utilisateur',
                cibleId: utilisateur.id,
                description: `Modification utilisateur: ${utilisateur.email}`,
                anciennesValeurs,
                nouvellesValeurs: updateDto,
                module: 'utilisateurs',
            }, req);
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        logger.info(`Utilisateur mis à jour: ${utilisateur.email}`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
    }

    /**
     * Mettre à jour le profil d'un utilisateur
     */
    async updateProfil(utilisateurId: string, updateDto: UpdateProfilDto): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: utilisateurId },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        let profil = await this.profilRepository.findOne({
            where: { utilisateurId },
        });

        if (!profil) {
            profil = this.profilRepository.create({
                utilisateurId,
                nom: updateDto.nom ?? utilisateur.email.split('@')[0] ?? 'Utilisateur',
                prenom: updateDto.prenom ?? '',
            });
        }

        // Mise à jour des champs
        Object.assign(profil, updateDto);

        await this.profilRepository.save(profil);

        logger.info(`Profil mis à jour: ${utilisateur.email}`);

        return this.formatUtilisateurResponse(utilisateur, profil);
    }

    /**
     * Mettre à jour les informations de sécurité d'un utilisateur
     */
    async updateSecurity(id: string, updateDto: UpdateSecurityDto, req?: Request): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const anciennesValeurs: Record<string, any> = {};

        if (updateDto.statut) {
            anciennesValeurs.statut = utilisateur.statut;
            utilisateur.statut = updateDto.statut as StatutUtilisateur;
        }

        if (updateDto.langue) {
            anciennesValeurs.langue = utilisateur.langue;
            utilisateur.langue = updateDto.langue;
        }

        if (updateDto.motDePasse) {
            utilisateur.motDePasse = updateDto.motDePasse;
        }

        if (updateDto.deuxFacteursActif !== undefined) {
            anciennesValeurs.deuxFacteursActif = utilisateur.deuxFacteursActif;
            utilisateur.deuxFacteursActif = updateDto.deuxFacteursActif;
        }

        await this.utilisateurRepository.save(utilisateur);

        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.USER_UPDATE,
                cible: 'Utilisateur',
                cibleId: utilisateur.id,
                description: `Mise à jour sécurité: ${utilisateur.email}`,
                anciennesValeurs,
                nouvellesValeurs: updateDto,
                module: 'utilisateurs',
            }, req);
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        logger.info(`Sécurité mise à jour: ${utilisateur.email}`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
    }

    async changeRole(id: string, changeDto: ChangeRoleDto, req?: Request): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const roleEntity = await this.roleEntityRepository.findOne({
            where: { code: changeDto.role },
        });

        if (!roleEntity) {
            throw new AppError('Rôle introuvable', 404, 'ROLE_NOT_FOUND');
        }

        const ancienRole = utilisateur.role;

        // RBAC v3 : mettre à jour le rôle dans l'établissement (via utilisateur_etablissements)
        const etablissementId = req?.utilisateur?.etablissementId;
        if (etablissementId) {
            let ue = await this.utilisateurEtablissementRepository.findOne({
                where: { utilisateurId: id, etablissementId },
            });

            if (!ue) {
                ue = this.utilisateurEtablissementRepository.create({
                    utilisateurId: id,
                    etablissementId,
                    roleId: roleEntity.id,
                    actif: true,
                });
            } else {
                ue.roleId = roleEntity.id;
            }

            await this.utilisateurEtablissementRepository.save(ue);
        }

        // Backward compat : ne mettre à jour le champ legacy que si le code correspond à l'enum
        const roleEnumValues = Object.values(Role) as string[];
        if (roleEnumValues.includes(changeDto.role)) {
            utilisateur.role = changeDto.role as Role;
            await this.utilisateurRepository.save(utilisateur);
        }

        if (req?.utilisateur?.id) {
            const severity: AuditSeverity = changeDto.role === 'SUPER_ADMIN' ? AuditSeverity.CRITICAL : AuditSeverity.WARNING;
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ROLE_CHANGE,
                cible: 'Utilisateur',
                cibleId: utilisateur.id,
                description: `Changement de rôle: ${utilisateur.email} (${ancienRole} → ${changeDto.role})`,
                anciennesValeurs: { role: ancienRole },
                nouvellesValeurs: { role: changeDto.role },
                module: 'utilisateurs',
                severity,
            }, req);
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        // Charger le rôle mis à jour depuis l'UE (RBAC v3) pour le retour
        const ue = await this.utilisateurEtablissementRepository.findOne({
            where: { utilisateurId: id, actif: true },
            relations: ['role'],
        });
        const roleCode = ue?.role?.code || utilisateur.role;

        logger.info(`Rôle changé: ${utilisateur.email} ${ancienRole} → ${roleCode}`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined, roleCode, undefined);
    }

    /**
     * Supprimer un utilisateur (soft delete)
     * 
     * Stratégie : Soft delete via statut INACTIF + désactivation des affectations
     * pour préserver l'historique d'audit et l'intégrité des données.
     * 
     * @param id ID de l'utilisateur
     * @param motif Motif de la suppression (obligatoire)
     */
    async remove(id: string, motif?: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const utilisateur = await queryRunner.manager.findOne(Utilisateur, {
                where: { id },
            });

            if (!utilisateur) {
                throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
            }

            // VÉRIFICATION : Empêcher la suppression du dernier SUPER_ADMIN
            if (utilisateur.role === Role.SUPER_ADMIN) {
                const superAdminCount = await queryRunner.manager.count(Utilisateur, {
                    where: { role: Role.SUPER_ADMIN, statut: StatutUtilisateur.ACTIF }
                });
                
                if (superAdminCount <= 1) {
                    throw new AppError(
                        'Impossible de supprimer le dernier Super Admin',
                        400,
                        'LAST_SUPER_ADMIN'
                    );
                }
            }

            // ÉTAPE 1 : Désactiver toutes les affectations établissement
            await queryRunner.manager.query(
                `UPDATE utilisateur_etablissements 
                 SET actif = false, "dateFin" = NOW(), motif = COALESCE($2, motif, 'Suppression soft delete')
                 WHERE "utilisateurId" = $1 AND actif = true`,
                [id, motif]
            );

            // ÉTAPE 2 : Soft delete via changement de statut
            utilisateur.statut = StatutUtilisateur.INACTIF;
            await queryRunner.manager.save(utilisateur);

            // ÉTAPE 3 : Invalider les tokens de session (refresh tokens)
            await queryRunner.manager.query(
                `DELETE FROM refresh_tokens WHERE "utilisateurId" = $1`,
                [id]
            );

            // ÉTAPE 4 : Supprimer le profil (données personnelles)
            await queryRunner.manager.query(
                `DELETE FROM profils_utilisateurs WHERE "utilisateurId" = $1`,
                [id]
            );

            // ÉTAPE 5 : Logger le motif dans les audit logs
            logger.info(`Utilisateur supprimé (soft delete): ${utilisateur.email} (${id}) - Motif: ${motif || 'Non spécifié'}`);

            // NOTE : Les audit_logs sont préservés pour traçabilité
            // utilisateurId reste dans les logs mais l'utilisateur est marqué INACTIF

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Supprimer un utilisateur en cascade (hard delete)
     * 
     * ATTENTION : Cette méthode supprime DÉFINITIVEMENT l'utilisateur et toutes ses données liées.
     * Réservée aux super admins uniquement.
     * 
     * Stratégie de suppression :
     * - Données CASCADE (FK ON DELETE CASCADE) : supprimées automatiquement
     * - Données NON-CASCADE directes (FK vers utilisateurId) : supprimées manuellement
     * - Données métier (via MembrePersonnel) : CONSERVÉES pour l'historique académique
     * 
     * @param id ID de l'utilisateur
     * @param motif Motif de la suppression (obligatoire)
     * @param etablissementId Optionnel - contexte établissement
     */
    async removeCascade(id: string, motif: string, etablissementId?: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const utilisateur = await queryRunner.manager.findOne(Utilisateur, {
                where: { id },
            });

            if (!utilisateur) {
                throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
            }

            // VÉRIFICATION CRITIQUE : Empêcher la suppression du dernier SUPER_ADMIN
            if (utilisateur.role === Role.SUPER_ADMIN) {
                const superAdminCount = await queryRunner.manager.count(Utilisateur, {
                    where: { role: Role.SUPER_ADMIN, statut: StatutUtilisateur.ACTIF }
                });
                
                if (superAdminCount <= 1) {
                    throw new AppError(
                        'Impossible de supprimer le dernier Super Admin',
                        400,
                        'LAST_SUPER_ADMIN'
                    );
                }
            }

            logger.warn(`[CASCADE DELETE] Début suppression définitive de ${utilisateur.email} (${id}) - Motif: ${motif}`);

            // =========================================================================
            // ÉTAPE 1 : Supprimer les données avec CASCADE automatique (FK ON DELETE CASCADE)
            // Ces tables seront automatiquement supprimées par PostgreSQL :
            // - profils_utilisateurs
            // - utilisateur_permissions
            // - refresh_tokens
            // - preferences_utilisateur
            // - dashboard_layouts
            // - badges_utilisateurs
            // =========================================================================

            // =========================================================================
            // ÉTAPE 2 : Supprimer les données NON-CASCADE directes (FK vers utilisateurId)
            // =========================================================================
            
            // 2a. MembrePersonnel (lié par utilisateurId)
            // SET NULL géré automatiquement par la FK ON DELETE SET NULL
            // Les dossiers personnel sont conservés pour l'historique

            // 2b. ResponsableEleve (lié par utilisateurId)
            await queryRunner.manager.query(
                `DELETE FROM responsables_eleves WHERE "utilisateurId" = $1`,
                [id]
            );

            // 2c. UtilisateurEtablissement (désactiver pour historique, pas supprimer)
            await queryRunner.manager.query(
                `UPDATE utilisateur_etablissements 
                 SET actif = false, "dateFin" = NOW(), motif = $2
                 WHERE "utilisateurId" = $1`,
                [id, motif]
            );

            // =========================================================================
            // NOTE : Données métier CONSERVÉES (historique académique)
            // =========================================================================
            // Les données suivantes sont CONSERVÉES car elles font partie de l'historique
            // académique et ne doivent PAS être supprimées :
            // - Notes, Bulletins, Présences, Absences, Retards
            // - Paiements, Transactions cantine/transport
            // - Messages, Conversations, Annonces, Sondages
            // - Requêtes, Tâches, Évaluations
            // - Sanctions, Observations, Félicitations
            // - Consultations médicales, Incidents
            // - Emploi du temps, Classes, Matières
            // =========================================================================

            // =========================================================================
            // ÉTAPE 3 : Supprimer l'utilisateur (hard delete)
            // Les données en CASCADE seront supprimées automatiquement par PostgreSQL
            // =========================================================================
            await queryRunner.manager.query(
                `DELETE FROM utilisateurs WHERE id = $1`,
                [id]
            );

            logger.warn(`[CASCADE DELETE] Suppression définitive terminée: ${utilisateur.email} (${id})`);

            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error(`[CASCADE DELETE] Erreur lors de la suppression de ${id}:`, error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Changer le statut d'un utilisateur
     */
    async changeStatut(id: string, statut: StatutUtilisateur, req?: Request): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const ancienStatut = utilisateur.statut;
        utilisateur.statut = statut;
        await this.utilisateurRepository.save(utilisateur);

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        await auditUtilisateur.statutModifie(
            req?.utilisateur?.id || 'system',
            utilisateur.id,
            utilisateur.email,
            ancienStatut,
            statut,
            req,
        );

        logger.info(`Statut changé pour ${utilisateur.email}: ${statut}`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
    }

    /**
     * Forcer la réinitialisation du mot de passe d'un utilisateur
     * Révoque les sessions actives et journalise l'action
     */
    async forcePasswordReset(id: string, req?: Request): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const nbSessions = await tokenService.revokeAllUserTokens(id);

        await auditUtilisateur.motDePasseForce(
            req?.utilisateur?.id || 'system',
            utilisateur.id,
            utilisateur.email,
            req,
        );

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        logger.info(`Mot de passe réinitialisé pour ${utilisateur.email} (${nbSessions} sessions révoquées)`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
    }

    /**
     * Révoquer toutes les sessions actives d'un utilisateur
     */
    async revokeSessions(id: string, req?: Request): Promise<{ sessionsRevokees: number }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const nbSessions = await tokenService.revokeAllUserTokens(id);

        await auditUtilisateur.sessionsRevokees(
            req?.utilisateur?.id || 'system',
            utilisateur.id,
            utilisateur.email,
            nbSessions,
            req,
        );

        logger.info(`${nbSessions} sessions révoquées pour ${utilisateur.email}`);

        return { sessionsRevokees: nbSessions };
    }

    /**
     * Formater la réponse utilisateur
     */
    private formatUtilisateurResponse(
        utilisateur: Utilisateur,
        profil?: ProfilUtilisateur,
        roleEtablissement?: string,
        actifDansEtablissement?: boolean,
        permissions?: string[]
    ): UtilisateurResponseDto {
        const mp = (utilisateur as any).membrePersonnel;
        return {
            id: utilisateur.id,
            email: utilisateur.email,
            matricule: utilisateur.matricule,
            // Nom/prénom à la racine pour accès direct par le frontend
            nom: profil?.nom || '',
            prenom: profil?.prenom || '',
            role: roleEtablissement || utilisateur.role,
            statut: utilisateur.statut,
            emailVerifie: utilisateur.emailVerifie,
            langue: utilisateur.langue,
            deuxFacteursActif: utilisateur.deuxFacteursActif,
            pseudonyme: utilisateur.pseudonyme,
            qrCodeId: utilisateur.qrCodeId,
            maxEtablissementsPersonnel: utilisateur.maxEtablissementsPersonnel,
            // NOTE: etablissementId supprimé - géré via utilisateur_etablissements
            derniereConnexion: utilisateur.derniereConnexion,
            createdAt: utilisateur.createdAt,
            updatedAt: utilisateur.updatedAt,
            permissions,
            profil: profil ? {
                nom: profil.nom,
                prenom: profil.prenom,
                telephone: profil.telephone,
                genre: profil.genre,
                dateNaissance: profil.dateNaissance,
                lieuNaissance: profil.lieuNaissance,
                nationalite: profil.nationalite,
                telephoneSecondaire: profil.telephoneSecondaire,
                adresse: profil.adresse,
                ville: profil.ville,
                quartier: profil.quartier,
                photoUrl: profil.photoUrl,
                photoThumbnail: profil.photoThumbnail,
                pieceRectoUrl: profil.pieceRectoUrl,
                pieceVersoUrl: profil.pieceVersoUrl,
                typePieceIdentite: profil.typePieceIdentite,
                numeroPieceIdentite: profil.numeroPieceIdentite,
                notes: profil.notes,
            } : undefined,
            // Rôle dans l'établissement (si fourni)
            roleEtablissement,
            // Statut d'affectation dans l'établissement (si fourni)
            actifDansEtablissement,
            // Dossier personnel lié
            membrePersonnel: mp ? {
                id: mp.id,
                matricule: mp.matricule,
                statut: mp.statut,
                dateEmbauche: mp.dateEmbauche,
                specialitePrincipale: mp.specialitePrincipale,
                departement: mp.departement,
            } : undefined,
        };
    }
}

export const utilisateursService = new UtilisateursService();

export default UtilisateursService;
