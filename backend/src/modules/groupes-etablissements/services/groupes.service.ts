/**
 * ==================================
 * eLISAschool - Service Groupes Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Gestion CRUD des groupes et associations établissements/admins.
 */

import { Repository, In } from 'typeorm';
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

export class GroupesService {
    private groupeRepo: Repository<GroupeEtablissement>;
    private lienRepo: Repository<GroupeEtablissementLien>;
    private adminRepo: Repository<GroupeAdmin>;
    private etablissementRepo: Repository<Etablissement>;

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
    async updateGroupe(groupeId: string, dto: UpdateGroupeDto): Promise<GroupeEtablissement> {
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
        logger.info(`Groupe modifié: ${groupeId}`);
        return updated;
    }

    /**
     * Supprime un groupe (soft delete via actif=false)
     */
    async deleteGroupe(groupeId: string, utilisateurId: string): Promise<void> {
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'NOT_FOUND');
        }

        // Vérifier que c'est le propriétaire
        if (groupe.proprietaireId !== utilisateurId) {
            throw new AppError('Vous n\'êtes pas le propriétaire de ce groupe', 403, 'FORBIDDEN');
        }

        groupe.actif = false;
        await this.groupeRepo.save(groupe);

        // Invalider le cache
        await this.invalidateGroupeCache(groupeId);

        logger.info(`Groupe supprimé (soft): ${groupeId} par ${utilisateurId}`);
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

        await this.addEtablissementsTransaction(
            AppDataSource.manager,
            groupeId,
            etablissementIds,
            ajoutePar
        );

        // Invalider cache consolidé
        await this.invalidateGroupeCache(groupeId);

        logger.info(`${etablissementIds.length} établissement(s) ajouté(s) au groupe ${groupeId}`);
    }

    /**
     * Version transactionnelle pour usage interne
     */
    private async addEtablissementsTransaction(
        manager: any,
        groupeId: string,
        etablissementIds: string[],
        ajoutePar: string
    ): Promise<void> {
        const liens = etablissementIds.map(id =>
            this.lienRepo.create({
                groupeId,
                etablissementId: id,
                ajoutePar,
            })
        );
        await manager.save(GroupeEtablissementLien, liens);
    }

    /**
     * Retire un établissement d'un groupe
     */
    async removeEtablissement(groupeId: string, etablissementId: string): Promise<void> {
        const result = await this.lienRepo.delete({ groupeId, etablissementId });
        if (result.affected === 0) {
            throw new AppError('Lien non trouvé', 404, 'NOT_FOUND');
        }

        // Invalider cache consolidé
        await this.invalidateGroupeCache(groupeId);

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

        logger.info(`Admin ${utilisateurId} ajouté au groupe ${groupeId}`);
    }

    /**
     * Retire un administrateur du groupe
     */
    async removeAdmin(groupeId: string, utilisateurId: string): Promise<void> {
        const result = await this.adminRepo.delete({ groupeId, utilisateurId });
        if (result.affected === 0) {
            throw new AppError('Admin non trouvé', 404, 'NOT_FOUND');
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
