/**
 * ==================================
 * eLISAschool - Service Élèves
 * ==================================
 */

import { Repository } from 'typeorm';
import { Request } from 'express';
import { AppDataSource } from '@database/data-source';
import { Eleve, StatutEleve } from '../entities';
import { CreateEleveDto, UpdateEleveDto, QueryElevesDto, PreinscriptionDto, ConvertirPreinscriptionDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService, AuditAction } from '@modules/auth';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { notificationsService } from '@modules/notifications/services/notifications.service';
import { TypeNotification, PrioriteNotification } from '@modules/notifications/entities';

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

        // Vérifier si le workflow de validation est requis
        const requireValidation = await getParamBoolean('eleves.require_validation', false);

        const eleve = this.repo.create({
            ...dto,
            dateNaissance: new Date(dto.dateNaissance),
            dateInscription: dto.dateInscription ? new Date(dto.dateInscription) : new Date(),
            etablissementId,
            statut: requireValidation ? StatutEleve.EN_ATTENTE_VALIDATION : StatutEleve.ACTIF,
        });

        await this.repo.save(eleve);

        // Créer le workflow de validation si requis
        if (requireValidation && req?.utilisateur?.id) {
            await validationWorkflowService.createWorkflow({
                module: 'eleves',
                entiteId: eleve.id,
                entiteType: 'Eleve',
                niveauxRequis: 2,
                etablissementId,
                commentaire: `Inscription élève: ${dto.matricule}`,
            }, req.utilisateur.id);
        }
        
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

    // ==================================
    // PRÉINSCRIPTION ET INSCRIPTION
    // ==================================

    /**
     * Créer une préinscription (auto ou par personnel)
     */
    async createPreinscription(dto: PreinscriptionDto, etablissementId?: string): Promise<Eleve> {
        // Générer matricule provisoire
        const annee = new Date().getFullYear();
        const count = await this.repo.count({ where: { estPreinscription: true } });
        const matricule = `PRE-${annee}-${String(count + 1).padStart(5, '0')}`;

        const eleve = this.repo.create({
            utilisateurId: '', // Sera mis à jour lors de la conversion
            matricule,
            dateNaissance: new Date(dto.dateNaissance),
            lieuNaissance: dto.lieuNaissance,
            sexe: dto.sexe,
            nationalite: dto.nationalite,
            sousSysteme: dto.sousSysteme,
            nomPere: dto.nomPere,
            nomMere: dto.nomMere,
            nomTuteur: dto.nomTuteur,
            telephoneTuteur: dto.telephoneTuteur,
            dateInscription: new Date(),
            adresseDomicile: dto.adresseDomicile,
            ville: dto.ville,
            quartier: dto.quartier,
            ecoleProvenance: dto.ecoleProvenance,
            classeAnterieure: dto.classeAnterieure,
            etablissementId,
            typeInscription: dto.email ? 'PORTAIL' : 'MANUELLE',
            etatInscription: 'EN_ATTENTE_VALIDATION',
            statut: StatutEleve.EN_ATTENTE_VALIDATION,
            estPreinscription: true,
            classeSouhaiteeId: dto.classeSouhaiteeId,
        });

        await this.repo.save(eleve);

        // Audit
        await auditService.logCRUD(
            'CREATE',
            'Preinscription',
            'SYSTEM',
            eleve.id,
            undefined,
            {
                matricule,
                nomTuteur: dto.nomTuteur,
                telephoneTuteur: dto.telephoneTuteur,
                classeSouhaiteeId: dto.classeSouhaiteeId,
            }
        );

        logger.info(`Préinscription créée: ${matricule} pour établissement ${etablissementId}`);

        return eleve;
    }

    /**
     * Convertir une préinscription en inscription complète
     */
    async convertirPreinscriptionEnInscription(
        preinscriptionId: string,
        dto: ConvertirPreinscriptionDto,
        personnelId: string,
        req?: Request
    ): Promise<Eleve> {
        const preinscription = await this.findOne(preinscriptionId);

        if (!preinscription.estPreinscription) {
            throw new AppError('Cet élève n\'est pas une préinscription', 400, 'NOT_PREINSCRIPTION');
        }

        if (preinscription.etatInscription !== 'EN_ATTENTE_VALIDATION') {
            throw new AppError('Cette préinscription ne peut pas être convertie', 400, 'INVALID_STATUS');
        }

        const anciennesValeurs = {
            estPreinscription: preinscription.estPreinscription,
            etatInscription: preinscription.etatInscription,
            statut: preinscription.statut,
        };

        preinscription.estPreinscription = false;
        preinscription.etatInscription = 'VALIDE';
        preinscription.statut = StatutEleve.ACTIF;
        preinscription.dateTraitementInscription = new Date();
        preinscription.traitePar = personnelId;

        await this.repo.save(preinscription);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: preinscription.id,
                description: `Conversion préinscription → inscription: ${preinscription.matricule}`,
                anciennesValeurs,
                nouvellesValeurs: {
                    estPreinscription: false,
                    etatInscription: 'VALIDE',
                    statut: StatutEleve.ACTIF,
                },
                module: 'eleves',
            }, req);
        }

        logger.info(`Préinscription convertie en inscription: ${preinscription.matricule}`);

        return preinscription;
    }

    /**
     * Refuser une préinscription
     */
    async refuserPreinscription(
        preinscriptionId: string,
        motif: string,
        personnelId: string,
        req?: Request
    ): Promise<Eleve> {
        const preinscription = await this.findOne(preinscriptionId);

        if (!preinscription.estPreinscription) {
            throw new AppError('Cet élève n\'est pas une préinscription', 400, 'NOT_PREINSCRIPTION');
        }

        if (preinscription.etatInscription !== 'EN_ATTENTE_VALIDATION') {
            throw new AppError('Cette préinscription ne peut pas être refusée', 400, 'INVALID_STATUS');
        }

        preinscription.etatInscription = 'REFUSE';
        preinscription.statut = StatutEleve.EXCLU;
        preinscription.commentaireRefus = motif;
        preinscription.dateTraitementInscription = new Date();
        preinscription.traitePar = personnelId;

        await this.repo.save(preinscription);

        // Audit
        if (req?.utilisateur?.id) {
            await auditService.log({
                utilisateurId: req.utilisateur.id,
                action: AuditAction.ELEVE_UPDATE,
                cible: 'Eleve',
                cibleId: preinscription.id,
                description: `Refus préinscription: ${preinscription.matricule}`,
                nouvellesValeurs: {
                    etatInscription: 'REFUSE',
                    commentaireRefus: motif,
                },
                module: 'eleves',
                severity: 'WARNING' as any,
            }, req);
        }

        logger.info(`Préinscription refusée: ${preinscription.matricule} - Motif: ${motif}`);

        return preinscription;
    }

    /**
     * Lister les préinscriptions en attente
     */
    async findPreinscriptionsEnAttente(
        query: QueryElevesDto,
        etablissementId?: string
    ): Promise<PaginatedResult<Eleve>> {
        const { page, limit, search } = query;

        const qb = this.repo
            .createQueryBuilder('e')
            .leftJoinAndSelect('e.utilisateur', 'u')
            .where('e.estPreinscription = :estPreinscription', { estPreinscription: true })
            .andWhere('e.etatInscription = :etatInscription', { etatInscription: 'EN_ATTENTE_VALIDATION' });

        if (etablissementId) {
            qb.andWhere('e.etablissementId = :etablissementId', { etablissementId });
        }

        if (search) {
            qb.andWhere(
                '(e.matricule ILIKE :search OR e.nomTuteur ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        qb.orderBy('e.createdAt', 'DESC' as const);

        return paginateWithQueryBuilder(qb, page, limit, false);
    }

    /**
     * Upload un document justificatif
     */
    async uploadDocumentJustificatif(
        eleveId: string,
        documentUrl: string,
        type: string,
        req?: Request
    ): Promise<Eleve> {
        const eleve = await this.findOne(eleveId);

        const documents = eleve.documentsJustificatifs || [];
        documents.push({
            url: documentUrl,
            type,
            dateUpload: new Date().toISOString(),
        });

        eleve.documentsJustificatifs = documents;
        await this.repo.save(eleve);

        logger.info(`Document justificatif ajouté pour élève ${eleveId}: ${type}`);

        return eleve;
    }
}

export const elevesService = new ElevesService();
