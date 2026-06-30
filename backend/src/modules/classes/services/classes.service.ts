/**
 * ==================================
 * eLISAschool - Service Classes
 * ==================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Classe, AffectationEleve, StatutAffectationEleve, ClasseAnnee } from '../entities';
import { CreateClasseDto, UpdateClasseDto, AffecterEleveDto, QueryClassesDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ClassesService {
    private classeRepo: Repository<Classe>;
    private classeAnneeRepo: Repository<ClasseAnnee>;
    private affectationRepo: Repository<AffectationEleve>;

    constructor() {
        this.classeRepo = AppDataSource.getRepository(Classe);
        this.classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
        this.affectationRepo = AppDataSource.getRepository(AffectationEleve);
    }

    /**
     * Créer une classe (modèle permanent) + instance année scolaire si année active
     */
    async create(dto: CreateClasseDto, etablissementId?: string): Promise<Classe> {
        // Créer le modèle permanent de classe
        const classe = this.classeRepo.create({
            nom: dto.nom,
            code: dto.code,
            niveauId: dto.niveauId,
            filiereId: dto.filiereId ?? undefined,
            typeClasse: dto.typeClasse,
            creneauHoraire: dto.creneauHoraire,
            description: dto.description,
            sallePrincipale: dto.sallePrincipale,
            actif: dto.actif ?? true,
            etablissementId,
        });
        await this.classeRepo.save(classe);
        logger.info(`Classe créée: ${dto.nom}`);

        // Créer automatiquement une instance pour l'année scolaire active
        try {
            // Utiliser l'année fournie ou l'année active
            let anneeScolaireId = dto.anneeScolaireId;
            if (!anneeScolaireId) {
                const anneeActive = await anneesScolairesService.findActive();
                anneeScolaireId = anneeActive?.id;
            }

            if (anneeScolaireId && etablissementId) {
                const classeAnnee = this.classeAnneeRepo.create({
                    classeId: classe.id,
                    anneeScolaireId,
                    etablissementId,
                    professeurPrincipalId: dto.professeurPrincipalId ?? undefined,
                    effectifMax: dto.effectifMax ?? 50,
                    effectifActuel: 0,
                    actif: true,
                    statut: 'ACTIVE' as any,
                });
                await this.classeAnneeRepo.save(classeAnnee);
                logger.info(`Classe-année auto-créée: ${classe.id} - ${anneeScolaireId}`);
            }
        } catch (error) {
            logger.warn(`Création classe-ok mais échec création classe-année: ${(error as any).message}`);
        }

        return classe;
    }

    /**
     * Rechercher toutes les classes avec pagination et filtres
     * Requête via ClasseAnnee pour inclure professeur principal, année scolaire, effectifs
     */
    async findAll(query: QueryClassesDto, etablissementId?: string): Promise<PaginatedResult<Classe>> {
        const { page, limit, search, niveauId, anneeScolaireId, actif } = query;

        const qb = this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('n.cycle', 'cycle')
            .leftJoinAndSelect('c.filiere', 'f')
            .leftJoinAndSelect('ca.anneeScolaire', 'a')
            .leftJoinAndSelect('ca.professeurPrincipal', 'pp')
            .where('1=1');

        // Filtre par établissement (multi-tenancy)
        if (etablissementId) {
            qb.andWhere('ca.etablissementId = :etablissementId', { etablissementId });
        }

        // Filtres optionnels
        if (niveauId) {
            qb.andWhere('c.niveauId = :niveauId', { niveauId });
        }

        if (anneeScolaireId) {
            qb.andWhere('ca.anneeScolaireId = :anneeScolaireId', { anneeScolaireId });
        }

        if (actif !== undefined) {
            qb.andWhere('ca.actif = :actif', { actif });
        }

        // Recherche textuelle
        if (search) {
            qb.andWhere(
                '(c.nom ILIKE :search OR c.code ILIKE :search OR n.nom ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        // Tri avec validation
        const allowedFields = ['createdAt', 'nom', 'code', 'effectifActuel'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'nom';
        qb.orderBy(`c.${orderField}`, query.sortOrder);

        // Pagination
        const result = await paginateWithQueryBuilder(qb, page, limit, false);

        // Aplatir les données pour le frontend (classe + données annuelles)
        return {
            items: result.items.map((ca: any) => ({
                ...ca.classe,
                effectifActuel: ca.effectifActuel || 0,
                effectifMax: ca.effectifMax || 50,
                anneeScolaireId: ca.anneeScolaireId,
                professeurPrincipalId: ca.professeurPrincipalId,
                professeurPrincipal: ca.professeurPrincipal || null,
                anneeScolaire: ca.anneeScolaire || null,
                classeAnneeId: ca.id,
            })) as unknown as Classe[],
            meta: result.meta,
        };
    }

    /**
     * Trouver une classe par ID (sans données annuelles, pour usage interne)
     */
    async findById(id: string): Promise<Classe> {
        const classe = await this.classeRepo.findOne({
            where: { id },
            relations: ['niveau', 'filiere'],
        });
        if (!classe) throw new AppError('Classe non trouvée', 404, 'NOT_FOUND');
        return classe;
    }

    /**
     * Trouver une classe par ID (via ClasseAnnee pour données complètes)
     */
    async findOne(id: string, etablissementId?: string): Promise<Classe> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;

        // Chercher la classe-année la plus récente pour cette classe
        const qb = this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('n.cycle', 'cycle')
            .leftJoinAndSelect('c.filiere', 'f')
            .leftJoinAndSelect('ca.anneeScolaire', 'a')
            .leftJoinAndSelect('ca.professeurPrincipal', 'pp')
            .where('c.id = :id', { id });

        if (etablissementId) {
            qb.andWhere('ca.etablissementId = :etablissementId', { etablissementId });
        }

        qb.orderBy('ca.createdAt', 'DESC').limit(1);

        const classeAnnee = await qb.getOne();

        if (!classeAnnee || !classeAnnee.classe) {
            throw new AppError('Classe non trouvée', 404, 'NOT_FOUND');
        }

        // Retourner l'entité Classe enrichie avec les données annuelles
        const classe = classeAnnee.classe;
        return Object.assign(classe, {
            effectifActuel: classeAnnee.effectifActuel || 0,
            effectifMax: classeAnnee.effectifMax || 50,
            anneeScolaireId: classeAnnee.anneeScolaireId,
            professeurPrincipalId: classeAnnee.professeurPrincipalId,
            professeurPrincipal: classeAnnee.professeurPrincipal || null,
            anneeScolaire: classeAnnee.anneeScolaire || null,
            classeAnneeId: classeAnnee.id,
        });
    }

    async update(id: string, dto: UpdateClasseDto, etablissementId?: string): Promise<Classe> {
        const classe = await this.findOne(id, etablissementId);
        // Ne mettre à jour que les champs du modèle permanent (Classe)
        const champsValides = ['nom', 'code', 'niveauId', 'filiereId', 'typeClasse', 'creneauHoraire', 'description', 'sallePrincipale', 'actif'];
        for (const champ of champsValides) {
            if ((dto as any)[champ] !== undefined) {
                (classe as any)[champ] = (dto as any)[champ];
            }
        }
        await this.classeRepo.save(classe);
        logger.info(`[${etablissementId}] Classe modifiée: ${classe.nom}`);
        return classe;
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const classe = await this.findOne(id, etablissementId);
        // Vérifier s'il y a des élèves affectés à cette classe
        const count = await this.affectationRepo.count({ where: { classeId: id, actif: true } });
        if (count > 0) throw new AppError('La classe contient des élèves actifs', 400, 'CLASS_NOT_EMPTY');

        await this.classeRepo.remove(classe);
        logger.info(`[${etablissementId}] Classe supprimée: ${id}`);
    }

    // ==== AFFECTATIONS ====

    async affecterEleve(dto: AffecterEleveDto, createurId: string, etablissementId?: string): Promise<AffectationEleve> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const classe = await this.findOne(dto.classeId, etablissementId);
            const anneeScolaireId = (classe as any).anneeScolaireId;

            if (!anneeScolaireId) {
                throw new AppError('Aucune année scolaire active pour cette classe', 400, 'NO_ACTIVE_YEAR');
            }

            // Vérifier si déjà affecté cette année
            const existing = await this.affectationRepo.findOne({
                where: {
                    eleveId: dto.eleveId,
                    anneeScolaireId,
                    actif: true
                }
            });

            if (existing) {
                if (existing.classeId === dto.classeId) {
                    await queryRunner.commitTransaction();
                    return existing;
                }
                throw new AppError('Élève déjà affecté à une classe pour cette année', 409, 'ALREADY_ASSIGNED');
            }

            // Vérifier si la validation est requise
            const requireValidation = await getParamBoolean('classes.require_validation', { defaultValue: false });

            // Récupérer le classeAnneeId si disponible
            const classeAnneeId = (classe as any).classeAnneeId;

            const affectation = this.affectationRepo.create({
                eleveId: dto.eleveId,
                classeId: dto.classeId,
                classeAnneeId: classeAnneeId || undefined,
                anneeScolaireId,
                dateAffectation: dto.dateAffectation ? new Date(dto.dateAffectation) : new Date(),
                motifChangement: dto.motifChangement,
                commentaire: dto.commentaire,
                etablissementId,
                statut: requireValidation
                    ? StatutAffectationEleve.EN_ATTENTE_VALIDATION
                    : StatutAffectationEleve.ACTIVE,
            });

            await queryRunner.manager.save(affectation);

            // Mettre à jour effectif seulement si validation non requise
            if (!requireValidation && classeAnneeId) {
                await queryRunner.manager.increment(ClasseAnnee, { id: classeAnneeId }, 'effectifActuel', 1);
            }

            await queryRunner.commitTransaction();

            // Créer un workflow de validation si requis
            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'classes',
                    entiteId: affectation.id,
                    entiteType: 'AffectationEleve',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);

                logger.info(`[${etablissementId}] Affectation élève créée en attente de validation: ${dto.eleveId} → ${classe.nom}`);
            } else {
                logger.info(`[${etablissementId}] Élève ${dto.eleveId} affecté à la classe ${classe.nom}`);
            }

            return affectation;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`[${etablissementId}] Erreur affectation élève: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

export const classesService = new ClassesService();
