/**
 * ==================================
 * eLISAschool - Service Personnel
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MembrePersonnel, TypePersonnel } from '../entities';
import { CreatePersonnelDto, UpdatePersonnelDto, CreateTypePersonnelDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

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

    async createMembre(dto: CreatePersonnelDto): Promise<MembrePersonnel> {
        const existing = await this.personnelRepo.findOne({ where: { matricule: dto.matricule } });
        if (existing) throw new AppError('Matricule déjà utilisé', 409, 'MATRICULE_EXISTS');

        // Vérifier utilisateur unique
        const userUsed = await this.personnelRepo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (userUsed) throw new AppError('Cet utilisateur est déjà membre du personnel', 409, 'USER_ALREADY_MEMBER');

        const membre = this.personnelRepo.create({
            ...dto,
            dateEmbauche: new Date(dto.dateEmbauche),
        });
        await this.personnelRepo.save(membre);
        logger.info(`Nouveau membre personnel: ${dto.matricule}`);
        return membre;
    }

    async findAll(typeId?: string): Promise<MembrePersonnel[]> {
        const where: any = {};
        if (typeId) where.typePersonnelId = typeId;
        return this.personnelRepo.find({
            where,
            relations: ['utilisateur', 'typePersonnel'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<MembrePersonnel> {
        const membre = await this.personnelRepo.findOne({
            where: { id },
            relations: ['utilisateur', 'typePersonnel'],
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
