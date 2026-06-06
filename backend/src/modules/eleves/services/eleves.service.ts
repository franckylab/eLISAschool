/**
 * ==================================
 * eLISAschool - Service Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { Eleve } from '../entities';
import { CreateEleveDto, UpdateEleveDto, QueryElevesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ElevesService {
    private repo: Repository<Eleve>;

    constructor() {
        this.repo = AppDataSource.getRepository(Eleve);
    }

    async create(dto: CreateEleveDto, etablissementId?: string, req?: Request): Promise<Eleve> {
        // Vérification du matricule existant
        const existing = await this.repo.findOne({ where: { matricule: dto.matricule } });
        if (existing) throw new AppError('Matricule élève déjà existant', 409, 'MATRICULE_EXISTS');

        const userUsed = await this.repo.findOne({ where: { utilisateurId: dto.utilisateurId } });
        if (userUsed) throw new AppError('Cet utilisateur est déjà lié à un dossier élève', 409, 'USER_ALREADY_LINKED');

        const eleve = this.repo.create({
            ...dto,
            dateNaissance: new Date(dto.dateNaissance),
            dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : new Date(),
            etablissementId,
        });

        await this.repo.save(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_CREATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Création dossier élève: ${dto.matricule}`,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        logger.info(`Dossier élève créé: ${dto.matricule}`);
        return eleve;
    }

    /**
     * Rechercher tous les élèves avec pagination et filtres
     */
    async findAll(query: QueryElevesDto, etablissementId?: string): Promise<PaginatedResult<Eleve>> {
        const { page, limit, search, sousSysteme, classeId, statut } = query;

        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.utilisateur', 'u')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (sousSysteme) {
            qb.andWhere('e.sousSysteme = :sousSysteme', { sousSysteme });
        }

        if (statut) {
            qb.andWhere('e.statut = :statut', { statut });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(e.matricule ILIKE :search OR e.nomTuteur ILIKE :search OR e.lieuNaissance ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'matricule', 'nomTuteur', 'dateInscription', 'statut'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
        qb.orderBy(`e.${orderField}`, query.sortOrder);

        // Pagination optimisée
        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    async findOne(id: string): Promise<Eleve> {
        const eleve = await this.repo.findOne({ where: { id }, relations: ['utilisateur'] });
        if (!eleve) throw new AppError('Élève non trouvé', 404, 'NOT_FOUND');
        return eleve;
    }

    async findByUserId(userId: string): Promise<Eleve | null> {
        return this.repo.findOne({ where: { utilisateurId: userId } });
    }

    async update(id: string, dto: UpdateEleveDto, req?: Request): Promise<Eleve> {
        const eleve = await this.findOne(id);
        const anciennesValeurs = {
            matricule: eleve.matricule,
            nomTuteur: eleve.nomTuteur,
            telephoneTuteur: eleve.telephoneTuteur,
        };

        if (dto.dateNaissance) dto.dateNaissance = new Date(dto.dateNaissance) as any;
        if (dto.dateInscription) dto.dateInscription = new Date(dto.dateInscription) as any;

        Object.assign(eleve, dto);
        await this.repo.save(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: eleve.id,
                description: `Modification dossier élève: ${eleve.matricule}`,
                anciennesValeurs,
                nouvellesValeurs: dto,
                module: 'eleves',
            }, req);
        }
        
        return eleve;
    }

    async delete(id: string, req?: Request): Promise<void> {
        const eleve = await this.findOne(id);
        await this.repo.remove(eleve);
        
        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_DELETE,
                cible: 'Eleve',
                cibleId: id,
                description: `Suppression dossier élève: ${eleve.matricule}`,
                anciennesValeurs: { matricule: eleve.matricule },
                module: 'eleves',
                severity: 'WARNING' as any,
            }, req);
        }
        
        logger.info(`Dossier élève supprimé: ${id}`);
    }
}

export const elevesService = new ElevesService();
