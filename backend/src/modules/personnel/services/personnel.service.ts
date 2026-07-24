/**
 * ==================================
 * eLISAschool - Service Personnel
 * ==================================
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, TypePersonnel, StatutPersonnel } from '../entities';
import { Fonction } from '@modules/organisation/entities';
import { CreatePersonnelDto, UpdatePersonnelDto, CreateTypePersonnelDto, UpdateTypePersonnelDto, QueryPersonnelDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class PersonnelService {
    private personnelRepo: Repository<MembrePersonnel>;
    private typeRepo: Repository<TypePersonnel>;
    private typesCache: { data: TypePersonnel[]; timestamp: number } | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000;

    constructor() {
        this.personnelRepo = AppDataSource.getRepository(MembrePersonnel);
        this.typeRepo = AppDataSource.getRepository(TypePersonnel);
    }

    // ==== TYPES DE PERSONNEL ====

    private invalidateTypesCache(): void {
        this.typesCache = null;
    }

    async createType(dto: CreateTypePersonnelDto): Promise<TypePersonnel> {
        const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
        if (existing) throw new AppError('Code type personnel déjà utilisé', 409, 'TYPE_EXISTS');

        const type = this.typeRepo.create(dto);
        await this.typeRepo.save(type);
        this.invalidateTypesCache();
        return type;
    }

    async getTypes(): Promise<TypePersonnel[]> {
        if (this.typesCache && Date.now() - this.typesCache.timestamp < this.CACHE_TTL) {
            return this.typesCache.data;
        }
        const types = await this.typeRepo.find({ order: { nom: 'ASC' } });
        this.typesCache = { data: types, timestamp: Date.now() };
        return types;
    }

    async findTypeById(id: string): Promise<TypePersonnel> {
        const type = await this.typeRepo.findOne({ where: { id } });
        if (!type) throw new AppError('Type de personnel non trouvé', 404, 'NOT_FOUND');
        return type;
    }

    async updateType(id: string, dto: UpdateTypePersonnelDto): Promise<TypePersonnel> {
        const type = await this.findTypeById(id);

        if (dto.code && dto.code !== type.code) {
            const existing = await this.typeRepo.findOne({ where: { code: dto.code } });
            if (existing) throw new AppError('Code type personnel déjà utilisé', 409, 'TYPE_EXISTS');
        }

        Object.assign(type, dto);
        await this.typeRepo.save(type);
        this.invalidateTypesCache();
        return type;
    }

    async deleteType(id: string): Promise<void> {
        const type = await this.findTypeById(id);
        if (type.estSysteme) throw new AppError('Impossible de supprimer un type système', 403, 'FORBIDDEN');

        const countMembres = await this.personnelRepo.count({ where: { typePersonnelId: id } });
        const countFonctions = await AppDataSource.getRepository(Fonction).count({ where: { typePersonnelId: id } });

        if (countMembres > 0 || countFonctions > 0) {
            throw new AppError(
                `Type utilisé par ${countMembres} membre(s) et ${countFonctions} fonction(s). Veuillez réaffecter avant de supprimer.`,
                409,
                'TYPE_IN_USE',
            );
        }

        await this.typeRepo.remove(type);
        this.invalidateTypesCache();
        logger.info(`Type personnel supprimé: ${type.code} (${id})`);
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
        const requireValidation = await getParamBoolean('personnel.require_validation', { defaultValue: false });

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
        const { page, limit, search, typePersonnelId, typeCode, statut } = query;

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

        if (typeCode) {
            qb.andWhere('tp.code = :typeCode', { typeCode });
        }

        if (statut) {
            qb.andWhere('p.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(p.matricule ILIKE :search OR p.specialites ILIKE :search OR p.diplomes ILIKE :search OR u.email ILIKE :search OR prof.nom ILIKE :search OR prof.prenom ILIKE :search)',
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

    async findOne(id: string, etablissementId?: string): Promise<MembrePersonnel> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;
        const membre = await this.personnelRepo.findOne({
            where,
            relations: ['utilisateur', 'utilisateur.profil', 'typePersonnel'],
        });
        if (!membre) throw new AppError('Membre non trouvé', 404, 'NOT_FOUND');
        return membre;
    }

    async findByUserId(userId: string): Promise<MembrePersonnel | null> {
        return this.personnelRepo.findOne({ where: { utilisateurId: userId }, relations: ['typePersonnel'] });
    }

    async linkUser(membreId: string, utilisateurId: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(membreId);
        if (membre.utilisateurId) {
            throw new AppError('Ce membre est déjà lié à un utilisateur', 409, 'ALREADY_LINKED');
        }
        const utilisateur = await AppDataSource.getRepository('Utilisateur').findOne({ where: { id: utilisateurId } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }
        const existingLink = await this.personnelRepo.findOne({ where: { utilisateurId } });
        if (existingLink) {
            throw new AppError('Cet utilisateur est déjà lié à un autre membre du personnel', 409, 'USER_ALREADY_LINKED');
        }
        membre.utilisateurId = utilisateurId;
        await this.personnelRepo.save(membre);

        await auditService.log({
            utilisateurId: utilisateurId,
            action: AuditAction.USER_UPDATE,
            cible: 'MembrePersonnel',
            cibleId: membreId,
            description: `Utilisateur lié au dossier personnel: ${membre.matricule}`,
            module: 'personnel',
        });

        logger.info(`Utilisateur ${utilisateurId} lié au membre ${membreId}`);
        return this.findOne(membreId);
    }

    async unlinkUser(membreId: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(membreId);
        if (!membre.utilisateurId) {
            throw new AppError('Ce membre n\'a pas d\'utilisateur lié', 400, 'NOT_LINKED');
        }
        membre.utilisateurId = undefined;
        await this.personnelRepo.save(membre);
        logger.info(`Utilisateur délié du membre ${membreId}`);
        return this.findOne(membreId);
    }

    async getPersonnelSansCompte(etablissementId: string): Promise<{ count: number; total: number; pourcentage: number }> {
        const total = await this.personnelRepo.count({ where: { etablissementId } });
        const sansCompte = await this.personnelRepo.count({ where: { etablissementId, utilisateurId: IsNull() } });
        return {
            total,
            count: sansCompte,
            pourcentage: total > 0 ? Math.round((sansCompte / total) * 100) : 0,
        };
    }

    async update(id: string, dto: UpdatePersonnelDto, etablissementId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id, etablissementId);

        if (dto.dateEmbauche) dto.dateEmbauche = new Date(dto.dateEmbauche) as any;

        Object.assign(membre, dto);
        await this.personnelRepo.save(membre);
        return membre;
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const membre = await this.findOne(id, etablissementId);
        await this.personnelRepo.remove(membre);
        logger.info(`Membre personnel supprimé: ${id}`);
    }

    // ─── Inline Edit Methods ───

    async updateStatut(id: string, statut: StatutPersonnel, userId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id);
        const ancienStatut = membre.statut;
        membre.statut = statut;
        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: `Statut modifié: ${ancienStatut} → ${statut}`,
                anciennesValeurs: { statut: ancienStatut },
                nouvellesValeurs: { statut },
                module: 'personnel',
            });
        }

        return membre;
    }

    async updateTypePersonnelMembre(id: string, typePersonnelId: string, userId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id);
        const ancienTypeId = membre.typePersonnelId;
        const ancienType = membre.typePersonnel;

        const type = await this.findTypeById(typePersonnelId);
        if (!type.actif) throw new AppError('Ce type de personnel est inactif', 400, 'TYPE_INACTIF');

        membre.typePersonnelId = typePersonnelId;
        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: `Type personnel modifié: ${ancienType?.nom ?? ancienTypeId} → ${type.nom}`,
                anciennesValeurs: { typePersonnelId: ancienTypeId },
                nouvellesValeurs: { typePersonnelId },
                module: 'personnel',
            });
        }

        return this.findOne(id);
    }

    async updateDateEntree(id: string, dateEmbauche: Date, userId?: string): Promise<MembrePersonnel> {
        const membre = await this.findOne(id);
        const ancienneDate = membre.dateEmbauche;
        membre.dateEmbauche = dateEmbauche;
        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: `Date d'entrée modifiée`,
                anciennesValeurs: { dateEmbauche: ancienneDate },
                nouvellesValeurs: { dateEmbauche },
                module: 'personnel',
            });
        }

        return membre;
    }

    async updateCompetences(
        id: string,
        data: {
            specialites?: string[];
            diplomes?: string;
            specialitePrincipale?: string;
            competences?: string[];
            educationNiveau?: string;
            anneesExperience?: number;
        },
        userId?: string
    ): Promise<MembrePersonnel> {
        const membre = await this.findOne(id);
        const anciennes: Record<string, any> = {};

        if (data.specialites !== undefined) { anciennes.specialites = membre.specialites; membre.specialites = data.specialites; }
        if (data.diplomes !== undefined) { anciennes.diplomes = membre.diplomes; membre.diplomes = data.diplomes; }
        if (data.specialitePrincipale !== undefined) { anciennes.specialitePrincipale = membre.specialitePrincipale; membre.specialitePrincipale = data.specialitePrincipale; }
        if (data.competences !== undefined) { anciennes.competences = membre.competences; membre.competences = data.competences; }
        if (data.educationNiveau !== undefined) { anciennes.educationNiveau = membre.educationNiveau; membre.educationNiveau = data.educationNiveau; }
        if (data.anneesExperience !== undefined) { anciennes.anneesExperience = membre.anneesExperience; membre.anneesExperience = data.anneesExperience; }

        await this.personnelRepo.save(membre);

        if (userId) {
            await auditService.log({
                utilisateurId: userId,
                action: AuditAction.PERSONNEL_UPDATE,
                cible: 'MembrePersonnel',
                cibleId: id,
                description: 'Compétences modifiées',
                anciennesValeurs: anciennes,
                nouvellesValeurs: data,
                module: 'personnel',
            });
        }

        return this.findOne(id);
    }
}

export const personnelService = new PersonnelService();
