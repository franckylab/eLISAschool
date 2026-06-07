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
        // OPTIMISATION : Vérifications en parallèle
        const [existing, userUsed] = await Promise.all([
            this.repo.findOne({ where: { matricule: dto.matricule } }),
            this.repo.findOne({ where: { utilisateurId: dto.utilisateurId } }),
        ]);

        if (existing) throw new AppError('Matricule élève déjà existant', 409, 'MATRICULE_EXISTS');
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

    // ==================================
    // MÉTHODES DASHBOARD
    // ==================================

    /**
     * Statistiques générales pour le dashboard
     */
    async getDashboardStats(context?: { etablissementId?: string }): Promise<{
        total: number;
        actifs: number;
        inactifs: number;
        parGenre: { masculin: number; feminin: number };
    }> {
        const where: any = {};
        if (context?.etablissementId) {
            where.etablissementId = context.etablissementId;
        }

        const total = await this.repo.count({ where });
        const actifs = await this.repo.count({ where: { ...where, statut: 'ACTIF' } });
        const inactifs = await this.repo.count({ where: { ...where, statut: 'INACTIF' } });

        // Par genre
        const males = await this.repo.count({ where: { ...where, genre: 'M' } });
        const females = await this.repo.count({ where: { ...where, genre: 'F' } });

        return {
            total,
            actifs,
            inactifs,
            parGenre: {
                masculin: males,
                feminin: females,
            }
        };
    }

    /**
     * Répartition des élèves par classe
     */
    async getRepartitionParClasse(context?: { etablissementId?: string }): Promise<{
        classes: Array<{ nom: string; effectif: number }>;
    }> {
        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoin('e.classe', 'c')
            .select('c.libelle', 'nom')
            .addSelect('COUNT(e.id)', 'effectif')
            .where('e.statut = :statut', { statut: 'ACTIF' });

        if (context?.etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
        }

        qb.groupBy('c.libelle')
          .orderBy('effectif', 'DESC');

        const result = await qb.getRawMany();

        return {
            classes: result.map((r: any) => ({
                nom: r.nom || 'Sans classe',
                effectif: parseInt(r.effectif),
            }))
        };
    }

    /**
     * Dernières inscriptions d'élèves
     */
    async getDernieresInscriptions(
        limit: number = 10,
        context?: { etablissementId?: string }
    ): Promise<{
        inscriptions: Array<{
            id: string;
            matricule: string;
            nom: string;
            prenom: string;
            dateInscription: Date;
            classe?: string;
        }>;
    }> {
        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoin('e.classe', 'c')
            .select(['e.id', 'e.matricule', 'e.nom', 'e.prenom', 'e.dateInscription', 'c.libelle'])
            .where('e.statut = :statut', { statut: 'ACTIF' });

        if (context?.etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
        }

        qb.orderBy('e.dateInscription', 'DESC')
          .limit(limit);

        const inscriptions = await qb.getMany();

        return {
            inscriptions: inscriptions.map(e => ({
                id: e.id,
                matricule: e.matricule,
                nom: (e as any).nom || '',
                prenom: (e as any).prenom || '',
                dateInscription: e.dateInscription,
                classe: (e as any).classe?.libelle,
            }))
        };
    }
}

export const elevesService = new ElevesService();
