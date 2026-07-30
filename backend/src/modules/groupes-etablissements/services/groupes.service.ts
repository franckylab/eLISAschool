/**
 * ==================================
 * eLISAschool - Service Groupes Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion CRUD des groupes et associations établissements/admins.
 */

import { Repository, In, EntityManager } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    GroupeEtablissement,
    GroupeEtablissementLien,
    GroupeAdmin,
} from '../entities';
import { CreateGroupeDto, UpdateGroupeDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { Etablissement } from '@modules/etablissement/entities';
import { dashboardCacheService } from '@modules/dashboard/services/dashboard-cache.service';
import { logger } from '@common/utils/logger.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class GroupesService {
    private groupeRepo: Repository<GroupeEtablissement>;
    private lienRepo: Repository<GroupeEtablissementLien>;
    private adminRepo: Repository<GroupeAdmin>;
    private etablissementRepo: Repository<Etablissement>;

    // Limite maximale d'établissements par groupe
    private readonly MAX_ETABLISSEMENTS_PAR_GROUPE = 50;

    constructor() {
        this.groupeRepo = AppDataSource.getRepository(GroupeEtablissement);
        this.lienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.adminRepo = AppDataSource.getRepository(GroupeAdmin);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
    }

    // ==================================
    // CRUD Groupe
    // ==================================

    /**
     * Crée un nouveau groupe avec ses établissements initiaux
     */
    async createGroupe(dto: CreateGroupeDto, utilisateurId: string): Promise<GroupeEtablissement> {
        // Vérifier unicité du code
        const existing = await this.groupeRepo.findOne({ where: { code: dto.code } });
        if (existing) {
            throw new AppError('Ce code de groupe existe déjà', 409, 'GROUPE_CODE_EXISTS');
        }

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Créer le groupe
            const groupe = this.groupeRepo.create({
                nom: dto.nom,
                description: dto.description,
                code: dto.code,
                proprietaireId: utilisateurId,
                actif: true,
            });
            await queryRunner.manager.save(groupe);

            // Ajouter les établissements initiaux
            if (dto.etablissementIds && dto.etablissementIds.length > 0) {
                await this.addEtablissementsTransaction(queryRunner.manager, groupe.id, dto.etablissementIds, utilisateurId);
            }

            // Le créateur est admin par défaut
            const admin = this.adminRepo.create({
                groupeId: groupe.id,
                utilisateurId,
                assignePar: utilisateurId,
            });
            await queryRunner.manager.save(admin);

            await queryRunner.commitTransaction();

            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_CREATE,
                cible: 'GroupeEtablissement',
                cibleId: groupe.id,
                description: `Création du groupe ${groupe.nom} (${groupe.code})`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom, entiteRef: groupe.code },
            });

            logger.info(`Groupe créé: ${groupe.nom} (${groupe.id}) par ${utilisateurId}`);
            return groupe;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error(`Erreur création groupe: ${error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Récupère les groupes avec pagination côté base de données
     * Optimisé pour les grandes quantités de données
     */
    async findAllPaginated(
        utilisateurId: string,
        utilisateurRole: string,
        page: number = 1,
        limit: number = 20,
        search?: string,
        actif?: boolean
    ): Promise<{ groupes: GroupeEtablissement[]; total: number }> {
        const offset = (page - 1) * limit;

        // Construire la requête de base AVEC les relations chargées
        let query = this.groupeRepo
            .createQueryBuilder('g')
            .leftJoinAndSelect('g.etablissements', 'liens') // ✅ Charger les liens
            .leftJoin('liens.etablissement', 'etab') // ✅ Joindre établissements (sans select)
            .where('g.actif = :actif', { actif: actif !== undefined ? actif : true });

        // Filtrer par accès utilisateur
        if (utilisateurRole !== 'SUPER_ADMIN') {
            query = query
                .leftJoin('g.admins', 'a')
                .andWhere('g.proprietaireId = :uid OR a.utilisateurId = :uid', { uid: utilisateurId });
        }

        // Filtre de recherche
        if (search) {
            query = query.andWhere(
                '(LOWER(g.nom) LIKE LOWER(:search) OR LOWER(g.code) LIKE LOWER(:search) OR LOWER(g.description) LIKE LOWER(:search))',
                { search: `%${search}%` }
            );
        }

        // Compter le total AVANT pagination
        const total = await query.getCount();

        // Ajouter les relations nécessaires et la pagination
        const groupes = await query
            .addSelect('etab.id') // ✅ Sélectionner juste l'ID pour le comptage
            .leftJoinAndSelect('g.proprietaire', 'proprietaire')
            .orderBy('g.nom', 'ASC')
            .skip(offset)
            .take(limit)
            .getMany();

        return { groupes, total };
    }

    /**
     * Récupère TOUS les groupes actifs (pour SUPER_ADMIN)
     * @deprecated Utiliser findAllPaginated() pour de meilleures performances
     */
    async getAllGroupes(): Promise<GroupeEtablissement[]> {
        return this.groupeRepo
            .createQueryBuilder('g')
            .where('g.actif = true')
            .leftJoinAndSelect('g.etablissements', 'liens')
            .leftJoinAndSelect('liens.etablissement', 'etab')
            .leftJoinAndSelect('g.proprietaire', 'proprietaire')
            .orderBy('g.nom', 'ASC')
            .getMany();
    }

    /**
     * Récupère tous les groupes d'un utilisateur (propriétaire OU admin)
     */
    async getGroupesForUser(utilisateurId: string): Promise<GroupeEtablissement[]> {
        return this.groupeRepo
            .createQueryBuilder('g')
            .leftJoin('g.admins', 'a')
            .where('g.proprietaireId = :uid OR a.utilisateurId = :uid', { uid: utilisateurId })
            .andWhere('g.actif = true')
            .leftJoinAndSelect('g.etablissements', 'liens')
            .leftJoinAndSelect('liens.etablissement', 'etab')
            .orderBy('g.nom', 'ASC')
            .getMany();
    }

    /**
     * Récupère un groupe par son ID avec détails
     */
    async getGroupeById(groupeId: string): Promise<GroupeEtablissement | null> {
        return this.groupeRepo.findOne({
            where: { id: groupeId, actif: true },
            relations: ['etablissements', 'etablissements.etablissement', 'admins', 'admins.utilisateur'],
        });
    }

    /**
     * Met à jour un groupe
     */
    async updateGroupe(groupeId: string, dto: UpdateGroupeDto, utilisateurId?: string): Promise<GroupeEtablissement> {
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier unicité du code si modifié
        if (dto.nom && dto.nom !== groupe.nom) {
            Object.assign(groupe, { nom: dto.nom });
        }
        if (dto.description !== undefined) {
            Object.assign(groupe, { description: dto.description });
        }
        if (dto.actif !== undefined) {
            Object.assign(groupe, { actif: dto.actif });
        }

        const updated = await this.groupeRepo.save(groupe);

        if (utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_UPDATE,
                cible: 'GroupeEtablissement',
                cibleId: groupe.id,
                description: `Modification du groupe ${groupe.nom}`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom },
            });
        }

        logger.info(`Groupe modifié: ${groupeId}`);
        return updated;
    }

    /**
     * Supprime un groupe (soft delete via actif=false)
     * 
     * Règles métier :
     * - Seul le propriétaire peut supprimer
     * - Soft delete : actif=false (pas de suppression physique)
     * - Libère les établissements (suppression des liens)
     * - Supprime les admins du groupe
     * - Invalide le cache
     */
    async deleteGroupe(groupeId: string, utilisateurId: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const groupe = await queryRunner.manager.findOne(GroupeEtablissement, { 
                where: { id: groupeId } 
            });
            
            if (!groupe) {
                throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
            }

            // Vérifier que c'est le propriétaire
            if (groupe.proprietaireId !== utilisateurId) {
                throw new AppError('Vous n\'êtes pas le propriétaire de ce groupe', 403, 'FORBIDDEN');
            }

            // Vérifier si déjà supprimé
            if (!groupe.actif) {
                throw new AppError('Ce groupe est déjà supprimé', 400, 'GROUPE_DEJA_SUPPRIME');
            }

            // 1. Soft delete du groupe
            groupe.actif = false;
            await queryRunner.manager.save(GroupeEtablissement, groupe);

            // 2. Supprimer tous les liens établissements (libère les établissements)
            await queryRunner.manager.delete(GroupeEtablissementLien, { groupeId });
            
            // 3. Supprimer tous les admins du groupe
            await queryRunner.manager.delete(GroupeAdmin, { groupeId });

            await queryRunner.commitTransaction();

            // 4. Invalider le cache (après commit)
            await this.invalidateGroupeCache(groupeId);

            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_DELETE,
                cible: 'GroupeEtablissement',
                cibleId: groupe.id,
                description: `Suppression du groupe ${groupe.nom} (${groupe.code})`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom, entiteRef: groupe.code },
            });

            logger.info(`Groupe supprimé (soft): ${groupeId} par ${utilisateurId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error(`Erreur suppression groupe ${groupeId}: ${error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ==================================
    // Gestion des établissements
    // ==================================

    /**
     * Ajoute des établissements à un groupe
     */
    async addEtablissements(
        groupeId: string,
        etablissementIds: string[],
        ajoutePar: string
    ): Promise<void> {
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId, actif: true } });
        if (!groupe) {
            throw new AppError('Groupe non trouvé ou inactif', 404, 'NOT_FOUND');
        }

        // Vérifier la limite maximale
        const currentCount = await this.lienRepo.count({ where: { groupeId } });
        if (currentCount + etablissementIds.length > this.MAX_ETABLISSEMENTS_PAR_GROUPE) {
            throw new AppError(
                `Un groupe ne peut pas avoir plus de ${this.MAX_ETABLISSEMENTS_PAR_GROUPE} établissements (${currentCount} actuels + ${etablissementIds.length} demandés)`,
                400,
                'GROUPE_MAX_ETABLISSEMENTS'
            );
        }

        await this.addEtablissementsTransaction(
            AppDataSource.manager,
            groupeId,
            etablissementIds,
            ajoutePar
        );

        // Invalider cache consolidé
        await this.invalidateGroupeCache(groupeId);

        await auditService.log({
            utilisateurId: ajoutePar,
            action: AuditAction.GROUPE_ETAB_AJOUTER,
            cible: 'GroupeEtablissement',
            cibleId: groupeId,
            description: `${etablissementIds.length} établissement(s) ajouté(s) au groupe ${groupe.nom}`,
            module: 'groupes-etablissements',
            metadata: { entiteLabel: groupe.nom, nombre: etablissementIds.length },
        });

        logger.info(`${etablissementIds.length} établissement(s) ajouté(s) au groupe ${groupeId}`);
    }

    /**
     * Version transactionnelle pour usage interne
     * Règle métier : un établissement ne peut appartenir qu'à UN SEUL groupe
     */
    private async addEtablissementsTransaction(
        manager: EntityManager,
        groupeId: string,
        etablissementIds: string[],
        ajoutePar: string
    ): Promise<void> {
        // 1. Vérifier si les établissements appartiennent déjà à un AUTRE groupe
        const allLiens = await manager.find(GroupeEtablissementLien, {
            where: { etablissementId: In(etablissementIds) },
        });
        
        // Filtrer les établissements qui appartiennent à un autre groupe
        const etablissementsDansAutreGroupe = allLiens
            .filter(l => l.groupeId !== groupeId)
            .map(l => l.etablissementId);
        
        if (etablissementsDansAutreGroupe.length > 0) {
            const etabIds = [...new Set(etablissementsDansAutreGroupe)].slice(0, 3).join(', ');
            throw new AppError(
                `Ces établissements appartiennent déjà à un autre groupe : ${etabIds}${etablissementsDansAutreGroupe.length > 3 ? '...' : ''}`,
                409,
                'ETABLISSEMENT_DEJA_DANS_GROUPE'
            );
        }
        
        // 2. Vérifier les liens existants dans CE groupe pour éviter les doublons
        const existingLiensCeGroupe = await manager.find(GroupeEtablissementLien, {
            where: { groupeId, etablissementId: In(etablissementIds) },
            select: ['etablissementId'],
        });
        
        const existingIds = new Set(existingLiensCeGroupe.map(l => l.etablissementId));
        const newIds = etablissementIds.filter(id => !existingIds.has(id));
        
        if (newIds.length === 0) {
            logger.info(`Tous les établissements sont déjà assignés au groupe ${groupeId}`);
            return; // Rien à ajouter
        }
        
        const liens = newIds.map(id =>
            this.lienRepo.create({
                groupeId,
                etablissementId: id,
                ajoutePar,
            })
        );
        await manager.save(GroupeEtablissementLien, liens);
        
        if (newIds.length < etablissementIds.length) {
            logger.info(`${etablissementIds.length - newIds.length} établissement(s) déjà assigné(s), ignorés`);
        }
    }

    /**
     * Retire un établissement d'un groupe
     */
    async removeEtablissement(groupeId: string, etablissementId: string, utilisateurId?: string): Promise<void> {
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
        const result = await this.lienRepo.delete({ groupeId, etablissementId });
        if (result.affected === 0) {
            throw new AppError('Lien non trouvé', 404, 'NOT_FOUND');
        }

        // Invalider cache consolidé
        await this.invalidateGroupeCache(groupeId);

        if (groupe && utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_ETAB_RETIRER,
                cible: 'GroupeEtablissement',
                cibleId: groupeId,
                description: `Établissement ${etablissementId} retiré du groupe ${groupe.nom}`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom },
            });
        }

        logger.info(`Établissement ${etablissementId} retiré du groupe ${groupeId}`);
    }

    /**
     * Liste les établissements d'un groupe
     */
    async getEtablissementsDuGroupe(groupeId: string): Promise<Etablissement[]> {
        const liens = await this.lienRepo.find({
            where: { groupeId },
            relations: ['etablissement'],
            order: { dateAjout: 'ASC' },
        });
        return liens.map(l => l.etablissement);
    }

    // ==================================
    // Gestion des admins
    // ==================================

    /**
     * Ajoute un administrateur au groupe
     */
    async addAdmin(groupeId: string, utilisateurId: string, assignePar: string): Promise<void> {
        // Vérifier si déjà admin
        const existing = await this.adminRepo.findOne({
            where: { groupeId, utilisateurId },
        });
        if (existing) {
            throw new AppError('Cet utilisateur est déjà administrateur du groupe', 409, 'ADMIN_EXISTS');
        }

        const admin = this.adminRepo.create({
            groupeId,
            utilisateurId,
            assignePar,
        });
        await this.adminRepo.save(admin);

        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });

        await auditService.log({
            utilisateurId: assignePar,
            action: AuditAction.GROUPE_ADMIN_AJOUTER,
            cible: 'GroupeEtablissement',
            cibleId: groupeId,
            description: `Admin ${utilisateurId} ajouté au groupe ${groupe?.nom ?? groupeId}`,
            module: 'groupes-etablissements',
            metadata: { entiteLabel: groupe?.nom ?? groupeId },
        });

        logger.info(`Admin ${utilisateurId} ajouté au groupe ${groupeId}`);
    }

    /**
     * Retire un administrateur du groupe
     */
    async removeAdmin(groupeId: string, utilisateurId: string, retirePar?: string): Promise<void> {
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
        const result = await this.adminRepo.delete({ groupeId, utilisateurId });
        if (result.affected === 0) {
            throw new AppError('Admin non trouvé', 404, 'NOT_FOUND');
        }

        if (groupe && retirePar) {
            await auditService.log({
                utilisateurId: retirePar,
                action: AuditAction.GROUPE_ADMIN_RETIRER,
                cible: 'GroupeEtablissement',
                cibleId: groupeId,
                description: `Admin ${utilisateurId} retiré du groupe ${groupe.nom}`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom },
            });
        }

        logger.info(`Admin ${utilisateurId} retiré du groupe ${groupeId}`);
    }

    // ==================================
    // Vérification d'accès
    // ==================================

    /**
     * Vérifie si un utilisateur a accès à un groupe
     * (propriétaire OU admin)
     */
    async verifyAccess(groupeId: string, utilisateurId: string): Promise<boolean> {
        const groupe = await this.groupeRepo.findOne({
            where: { id: groupeId, actif: true },
            relations: ['admins'],
        });

        if (!groupe) {
            return false;
        }

        // Propriétaire
        if (groupe.proprietaireId === utilisateurId) {
            return true;
        }

        // Admin
        const isAdmin = groupe.admins?.some(a => a.utilisateurId === utilisateurId) ?? false;
        return isAdmin;
    }

    // ==================================
    // Helpers
    // ==================================

    /**
     * Invalide le cache consolidé d'un groupe
     */
    private async invalidateGroupeCache(groupeId: string): Promise<void> {
        await dashboardCacheService.set(
            `precalc:groupe:${groupeId}`,
            null,
            0,
            `groupe:${groupeId}`
        );
    }
}

// Singleton export
export const groupesService = new GroupesService();
