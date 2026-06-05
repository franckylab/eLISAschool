/**
 * ==================================
 * eLISAschool - Service UtilisateurEtablissement
 * ==================================
 * Version: 2.0.0
 * 
 * Gère les affectations d'utilisateurs à plusieurs établissements.
 * Permet l'ajout, la suppression, le changement d'établissement principal.
 */

import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { UtilisateurEtablissement } from '../entities';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface AffecterUtilisateurDto {
    utilisateurId: string;
    etablissementId: string;
    role: Role;
    etablissementPrincipal?: boolean;
    dateDebut?: string;
    dateFin?: string;
    motif?: string;
}

export class UtilisateurEtablissementService {
    private repo: Repository<UtilisateurEtablissement>;

    constructor() {
        this.repo = AppDataSource.getRepository(UtilisateurEtablissement);
    }

    /**
     * Ajoute un établissement à un utilisateur
     */
    async ajouter(dto: AffecterUtilisateurDto, creePar?: string): Promise<UtilisateurEtablissement> {
        // Vérifier si l'affectation existe déjà
        const existing = await this.repo.findOne({
            where: {
                utilisateurId: dto.utilisateurId,
                etablissementId: dto.etablissementId
            }
        });

        if (existing) {
            if (existing.actif) {
                throw new AppError(
                    'L\'utilisateur est déjà affecté à cet établissement',
                    409,
                    'ALREADY_ASSIGNED'
                );
            }
            // Réactiver l'affectation existante
            existing.actif = true;
            existing.role = dto.role;
            existing.dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : existing.dateDebut;
            existing.dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;
            existing.motif = dto.motif || existing.motif;
            return await this.repo.save(existing);
        }

        // Si c'est l'établissement principal, désactiver les autres
        if (dto.etablissementPrincipal) {
            await this.repo.update(
                { utilisateurId: dto.utilisateurId, etablissementPrincipal: true },
                { etablissementPrincipal: false }
            );
        }

        // Créer la nouvelle affectation
        const affectation = this.repo.create({
            utilisateurId: dto.utilisateurId,
            etablissementId: dto.etablissementId,
            role: dto.role,
            etablissementPrincipal: dto.etablissementPrincipal || false,
            actif: true,
            dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
            dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
            motif: dto.motif,
            creePar,
        });

        await this.repo.save(affectation);
        logger.info(`Utilisateur ${dto.utilisateurId} affecté à l'établissement ${dto.etablissementId}`);

        return affectation;
    }

    /**
     * Retire un établissement à un utilisateur (désactivation logique)
     */
    async retirer(utilisateurId: string, etablissementId: string): Promise<void> {
        const affectation = await this.repo.findOne({
            where: { utilisateurId, etablissementId, actif: true }
        });

        if (!affectation) {
            throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        }

        // Vérifier que ce n'est pas le seul établissement
        const count = await this.repo.count({
            where: { utilisateurId, actif: true }
        });

        if (count <= 1) {
            throw new AppError(
                'Impossible de retirer le dernier établissement d\'un utilisateur',
                400,
                'LAST_ETABLISSEMENT'
            );
        }

        // Désactiver l'affectation
        affectation.actif = false;
        affectation.dateFin = new Date();
        await this.repo.save(affectation);

        logger.info(`Utilisateur ${utilisateurId} retiré de l'établissement ${etablissementId}`);
    }

    /**
     * Définit l'établissement principal d'un utilisateur
     */
    async definirPrincipal(utilisateurId: string, etablissementId: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Vérifier que l'affectation existe
            const affectation = await queryRunner.manager.findOne(UtilisateurEtablissement, {
                where: { utilisateurId, etablissementId, actif: true }
            });

            if (!affectation) {
                throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
            }

            // Désactiver tous les autres établissements principaux
            await queryRunner.manager.update(
                UtilisateurEtablissement,
                { utilisateurId, etablissementPrincipal: true },
                { etablissementPrincipal: false }
            );

            // Définir le nouvel établissement principal
            affectation.etablissementPrincipal = true;
            await queryRunner.manager.save(affectation);

            await queryRunner.commitTransaction();
            logger.info(`Établissement principal de ${utilisateurId} défini sur ${etablissementId}`);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Liste les établissements d'un utilisateur
     */
    async findByUtilisateur(utilisateurId: string): Promise<UtilisateurEtablissement[]> {
        return this.repo.find({
            where: { utilisateurId, actif: true },
            relations: ['etablissement'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });
    }

    /**
     * Vérifie si un utilisateur a accès à un établissement
     */
    async hasAccess(utilisateurId: string, etablissementId: string): Promise<boolean> {
        const count = await this.repo.count({
            where: { utilisateurId, etablissementId, actif: true }
        });
        return count > 0;
    }

    /**
     * Récupère l'établissement principal d'un utilisateur
     */
    async getPrincipal(utilisateurId: string): Promise<UtilisateurEtablissement | null> {
        return this.repo.findOne({
            where: { utilisateurId, etablissementPrincipal: true, actif: true },
            relations: ['etablissement']
        });
    }

    /**
     * Met à jour le rôle d'un utilisateur dans un établissement
     */
    async updateRole(
        utilisateurId: string,
        etablissementId: string,
        newRole: Role
    ): Promise<UtilisateurEtablissement> {
        const affectation = await this.repo.findOne({
            where: { utilisateurId, etablissementId, actif: true }
        });

        if (!affectation) {
            throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        }

        affectation.role = newRole;
        return await this.repo.save(affectation);
    }
}

export const utilisateurEtablissementService = new UtilisateurEtablissementService();
export default UtilisateurEtablissementService;
