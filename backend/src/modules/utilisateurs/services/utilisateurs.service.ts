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
import { Utilisateur, ProfilUtilisateur, Role, StatutUtilisateur } from '@modules/auth/entities';
import {
    CreateUtilisateurDto,
    UpdateUtilisateurDto,
    UpdateProfilDto,
    QueryUtilisateursDto,
    UtilisateurResponseDto,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';

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

    constructor() {
        this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
        this.profilRepository = AppDataSource.getRepository(ProfilUtilisateur);
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
            etablissementId: createDto.etablissementId,
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
        const { page, limit, search, role, statut, etablissementId, sortBy, sortOrder } = query;

        // Construction des conditions WHERE
        const where: FindOptionsWhere<Utilisateur> = {};

        if (role) {
            where.role = role as Role;
        }

        if (statut) {
            where.statut = statut as StatutUtilisateur;
        }

        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        // Requête avec pagination optimisée
        const queryBuilder = this.utilisateurRepository
            .createQueryBuilder('u')
            .where(where);

        // Recherche textuelle (uniquement sur email et matricule car profil est récupéré séparément)
        if (search) {
            queryBuilder.andWhere(
                '(u.email ILIKE :search OR u.matricule ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri - validation du champ de tri
        const allowedSortFields = ['createdAt', 'updatedAt', 'email', 'matricule', 'role', 'statut'];
        const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`u.${orderField}`, sortOrder);

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
                return this.formatUtilisateurResponse(u, profil || undefined);
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
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
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

        if (updateDto.etablissementId !== undefined) {
            utilisateur.etablissementId = updateDto.etablissementId || undefined;
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
            profil = this.profilRepository.create({ utilisateurId });
        }

        // Mise à jour des champs
        Object.assign(profil, updateDto);

        await this.profilRepository.save(profil);

        logger.info(`Profil mis à jour: ${utilisateur.email}`);

        return this.formatUtilisateurResponse(utilisateur, profil);
    }

    /**
     * Supprimer un utilisateur
     */
    async remove(id: string): Promise<void> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        await this.utilisateurRepository.remove(utilisateur);

        logger.info(`Utilisateur supprimé: ${utilisateur.email}`);
    }

    /**
     * Changer le statut d'un utilisateur
     */
    async changeStatut(id: string, statut: StatutUtilisateur): Promise<UtilisateurResponseDto> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        utilisateur.statut = statut;
        await this.utilisateurRepository.save(utilisateur);

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: id },
        });

        logger.info(`Statut changé pour ${utilisateur.email}: ${statut}`);

        return this.formatUtilisateurResponse(utilisateur, profil || undefined);
    }

    /**
     * Formater la réponse utilisateur
     */
    private formatUtilisateurResponse(
        utilisateur: Utilisateur,
        profil?: ProfilUtilisateur
    ): UtilisateurResponseDto {
        return {
            id: utilisateur.id,
            email: utilisateur.email,
            matricule: utilisateur.matricule,
            role: utilisateur.role,
            statut: utilisateur.statut,
            emailVerifie: utilisateur.emailVerifie,
            langue: utilisateur.langue,
            etablissementId: utilisateur.etablissementId,
            derniereConnexion: utilisateur.derniereConnexion,
            createdAt: utilisateur.createdAt,
            updatedAt: utilisateur.updatedAt,
            profil: profil ? {
                nom: profil.nom,
                prenom: profil.prenom,
                telephone: profil.telephone,
                genre: profil.genre,
                dateNaissance: profil.dateNaissance,
                photo: profil.photo,
            } : undefined,
        };
    }
}

export const utilisateursService = new UtilisateursService();

export default UtilisateursService;
