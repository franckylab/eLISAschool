/**
 * ==================================
 * eLISAschool - Service Personnel
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, TypePersonnel, StatutPersonnel } from '../entities';
import { CreatePersonnelDto, UpdatePersonnelDto, CreateTypePersonnelDto, QueryPersonnelDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';

export class PersonnelService {
    private personnelRepo: Repository<MembrePersonnel>;
    private typeRepo: Repository<TypePersonnel>;

    constructor() {
        this.personnelRepo = AppDataSource.getRepository(MembrePersonnel);
        this.typeRepo = AppDataSource.getRepository(TypePersonnel);
    }

    // ==== TYPES DE PERSONNEL ====

    async createType(dto: CreateTypePersonnelDto): Promise<TypePersonnel> {
        const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
        if (existing) throw new AppError('Code type personnel déjà utilisé', 409, 'TYPE_EXISTS');

        const type = this.typeRepo.create(dto);
        await this.typeRepo.save(type);
        return type;
    }

    async getTypes(): Promise<TypePersonnel[]> {
        return this.typeRepo.find({ order: { nom: 'ASC' } });
    }

    // ==== MEMBRES PERSONNEL ====

    async createMembre(dto: CreatePersonnelDto, etablissementId?: string, createurId?: string): Promise<MembrePersonnel> {
        const existing = await this.personnelRepo.findOne({ where: { matricule: dto.matricule } });
        if (existing) throw new AppError('Matricule déjà utilisé', 409, 'MATRICULE_EXISTS');

        // Vérifier utilisateur unique
        if (dto.utilisateurId) {
            const userUsed = await this.personnelRepo.findOne({ where: { utilisateurId: dto.utilisateurId } });
            if (userUsed) throw new AppError('Cet utilisateur est déjà membre du personnel', 409, 'USER_ALREADY_MEMBER');
        }

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('personnel.require_validation', false);

        const membre = this.personnelRepo.create({
            ...dto,
            dateEmbauche: new Date(dto.dateEmbauche),
            etablissementId,
            statut: requireValidation ? StatutPersonnel.EN_ATTENTE_VALIDATION : StatutPersonnel.ACTIF,
        });
        await this.personnelRepo.save(membre);

        // Créer le workflow de validation si requis
        if (requireValidation && createurId) {
            await validationWorkflowService.createWorkflow({
                module: 'personnel',
                entiteId: membre.id,
                entiteType: 'MembrePersonnel',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Embauche personnel: ${dto.matricule}`,
            }, createurId);
        }

        logger.info(`Nouveau membre personnel: ${dto.matricule}`);
        return membre;
    }

    /**
     * Rechercher tous les membres du personnel avec pagination et filtres
     */
    async findAll(query: QueryPersonnelDto, etablissementId?: string): Promise<PaginatedResult<MembrePersonnel>> {
        const { page, limit, search, typePersonnelId, statut } = query;

        const qb = this.personnelRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.utilisateur', 'u')
            .leftJoinAndSelect('u.profil', 'prof')
            .leftJoinAndSelect('p.typePersonnel', 'tp')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('p.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (typePersonnelId) {
            qb.andWhere('p.typePersonnelId = :typePersonnelId', { typePersonnelId });
        }

        if (statut) {
            qb.andWhere('p.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(p.matricule ILIKE :search OR p.specialites ILIKE :search OR p.diplomes ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'matricule', 'dateEmbauche', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`p.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string): Promise<MembrePersonnel> {
        const membre = await this.personnelRepo.findOne({
            where: { id },
            relations: ['utilisateur', 'utilisateur.profil', 'typePersonnel'],
        });
        if (!membre) throw new AppError('Membre non trouvé', 404, 'NOT_FOUND');
        return membre;
    }

    async findByUserId(userId: string): Promise<MembrePersonnel | null> {
        return this.personnelRepo.findOne({ where: { utilisateurId: userId }, relations: ['typePersonnel'] });
    }

    async update(id: string, dto: UpdatePersonnelDto): Promise<MembrePersonnel> {
        const membre = await this.findOne(id);

        if (dto.dateEmbauche) dto.dateEmbauche = new Date(dto.dateEmbauche) as any;

        Object.assign(membre, dto);
        await this.personnelRepo.save(membre);
        return membre;
    }

    async delete(id: string): Promise<void> {
        const membre = await this.findOne(id);
        await this.personnelRepo.remove(membre);
        logger.info(`Membre personnel supprimé: ${id}`);
    }
}

export const personnelService = new PersonnelService();
