import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Classe, AffectationEleve, StatutAffectationEleve, ClasseAnnee } from '../entities';
import { CreateClasseDto, UpdateClasseDto, AffecterEleveDto, QueryClassesDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { salleService } from '@modules/salles/services/salle.service';
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

    async create(dto: CreateClasseDto, etablissementId?: string): Promise<Classe> {
        const classe = this.classeRepo.create({
            nom: dto.nom,
            code: dto.code,
            niveauId: dto.niveauId,
            filiereId: dto.filiereId ?? undefined,
            typeClasse: dto.typeClasse,
            creneauHoraire: dto.creneauHoraire,
            description: dto.description,
            actif: dto.actif ?? true,
            etablissementId,
        });
        await this.classeRepo.save(classe);
        logger.info(`Classe créée: ${dto.nom}`);

        try {
            let anneeScolaireId = dto.anneeScolaireId;
            if (!anneeScolaireId) {
                const anneeActive = await anneesScolairesService.findActive();
                anneeScolaireId = anneeActive?.id;
            }

            if (anneeScolaireId && etablissementId) {
                let effectifMax = dto.effectifMax ?? 50;

                if (dto.sallePrincipaleId) {
                    const salle = await salleService.findOne(dto.sallePrincipaleId, etablissementId);
                    if (dto.effectifMax === undefined || dto.effectifMax > salle.capacite) {
                        effectifMax = salle.capacite;
                    }
                }

                const classeAnnee = this.classeAnneeRepo.create({
                    classeId: classe.id,
                    anneeScolaireId,
                    etablissementId,
                    professeurPrincipalId: dto.professeurPrincipalId ?? undefined,
                    sallePrincipaleId: dto.sallePrincipaleId ?? undefined,
                    programmeId: dto.programmeId ?? undefined,
                    effectifMax,
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

    async findAll(query: QueryClassesDto, etablissementId?: string): Promise<PaginatedResult<Classe>> {
        const { page, limit, search, niveauId, anneeScolaireId, actif } = query;

        const qb = this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('n.cycle', 'cycle')
            .leftJoinAndSelect('c.filiere', 'f')
            .leftJoinAndSelect('ca.sallePrincipale', 's')
            .leftJoinAndSelect('ca.anneeScolaire', 'a')
            .leftJoinAndSelect('ca.professeurPrincipal', 'pp')
            .where('1=1');

        if (etablissementId) {
            qb.andWhere('ca.etablissementId = :etablissementId', { etablissementId });
        }

        if (niveauId) {
            qb.andWhere('c.niveauId = :niveauId', { niveauId });
        }

        if (anneeScolaireId) {
            qb.andWhere('ca.anneeScolaireId = :anneeScolaireId', { anneeScolaireId });
        }

        if (actif !== undefined) {
            qb.andWhere('ca.actif = :actif', { actif });
        }

        if (search) {
            qb.andWhere(
                '(c.nom ILIKE :search OR c.code ILIKE :search OR n.nom ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        const allowedFields = ['createdAt', 'nom', 'code', 'effectifActuel'];
        const orderField = allowedFields.includes(query.sortBy) ? query.sortBy : 'nom';
        qb.orderBy(`c.${orderField}`, query.sortOrder);

        const result = await paginateWithQueryBuilder(qb, page, limit, false);

        return {
            items: result.items.map((ca: any) => ({
                ...ca.classe,
                effectifActuel: ca.effectifActuel || 0,
                effectifMax: ca.effectifMax || 50,
                salle: ca.sallePrincipale || null,
                sallePrincipaleId: ca.sallePrincipaleId || null,
                anneeScolaireId: ca.anneeScolaireId,
                programmeId: ca.programmeId || null,
                professeurPrincipalId: ca.professeurPrincipalId,
                professeurPrincipal: ca.professeurPrincipal || null,
                anneeScolaire: ca.anneeScolaire || null,
                classeAnneeId: ca.id,
            })) as unknown as Classe[],
            meta: result.meta,
        };
    }

    async findById(id: string): Promise<Classe> {
        const classe = await this.classeRepo.findOne({
            where: { id },
            relations: ['niveau', 'filiere'],
        });
        if (!classe) throw new AppError('Classe non trouvée', 404, 'NOT_FOUND');
        return classe;
    }

    async findOne(id: string, etablissementId?: string): Promise<Classe> {
        const where: any = {};
        if (etablissementId) where.etablissementId = etablissementId;

        const qb = this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('n.cycle', 'cycle')
            .leftJoinAndSelect('c.filiere', 'f')
            .leftJoinAndSelect('ca.sallePrincipale', 's')
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

        const classe = classeAnnee.classe;
        return Object.assign(classe, {
            effectifActuel: classeAnnee.effectifActuel || 0,
            effectifMax: classeAnnee.effectifMax || 50,
            salle: classeAnnee.sallePrincipale || null,
            sallePrincipaleId: classeAnnee.sallePrincipaleId || null,
            anneeScolaireId: classeAnnee.anneeScolaireId,
            programmeId: classeAnnee.programmeId || null,
            professeurPrincipalId: classeAnnee.professeurPrincipalId,
            professeurPrincipal: classeAnnee.professeurPrincipal || null,
            anneeScolaire: classeAnnee.anneeScolaire || null,
            classeAnneeId: classeAnnee.id,
        });
    }

    async update(id: string, dto: UpdateClasseDto, etablissementId?: string): Promise<Classe> {
        const classe = await this.findOne(id, etablissementId);
        const champsValides = ['nom', 'code', 'niveauId', 'filiereId', 'typeClasse', 'creneauHoraire', 'description', 'actif'];
        for (const champ of champsValides) {
            if ((dto as any)[champ] !== undefined) {
                (classe as any)[champ] = (dto as any)[champ];
            }
        }
        await this.classeRepo.save(classe);
        logger.info(`[${etablissementId}] Classe modifiée: ${classe.nom}`);

        if (dto.sallePrincipaleId !== undefined || dto.effectifMax !== undefined || dto.programmeId !== undefined) {
            const classeAnneeId = (classe as any).classeAnneeId;
            if (classeAnneeId) {
                const classeAnnee = await this.classeAnneeRepo.findOne({ where: { id: classeAnneeId } });
                if (classeAnnee) {
                    if (dto.sallePrincipaleId !== undefined) {
                        classeAnnee.sallePrincipaleId = dto.sallePrincipaleId || undefined;
                        if (dto.sallePrincipaleId) {
                            const salle = await salleService.findOne(dto.sallePrincipaleId, etablissementId!);
                            classeAnnee.effectifMax = salle.capacite;
                        }
                    }
                    if (dto.effectifMax !== undefined) {
                        classeAnnee.effectifMax = Math.min(dto.effectifMax, classeAnnee.effectifMax || Infinity);
                    }
                    if (dto.programmeId !== undefined) {
                        classeAnnee.programmeId = dto.programmeId || undefined;
                    }
                    await this.classeAnneeRepo.save(classeAnnee);
                }
            }
        }

        return classe;
    }

    async delete(id: string, etablissementId?: string): Promise<void> {
        const classe = await this.findOne(id, etablissementId);
        const count = await this.affectationRepo.count({ where: { classeId: id, actif: true } });
        if (count > 0) throw new AppError('La classe contient des élèves actifs', 400, 'CLASS_NOT_EMPTY');

        await this.classeRepo.remove(classe);
        logger.info(`[${etablissementId}] Classe supprimée: ${id}`);
    }

    // ==== ÉLÈVES DE LA CLASSE ====

    async findElevesByClasse(
        classeId: string,
        options: { page: number; limit: number; search?: string },
        etablissementId?: string
    ): Promise<{
        eleves: PaginatedResult<any>;
        stats: { total: number; garcons: number; filles: number; pourcentageGarcons: number; pourcentageFilles: number };
    }> {
        const { page, limit, search } = options;

        const qb = this.affectationRepo
            .createQueryBuilder('ae')
            .innerJoinAndSelect('ae.eleve', 'e')
            .leftJoinAndSelect('e.utilisateur', 'u')
            .where('ae.classeId = :classeId', { classeId })
            .andWhere('ae.actif = :actif', { actif: true })
            .andWhere('ae.statut = :statut', { statut: StatutAffectationEleve.ACTIVE });

        if (etablissementId) {
            qb.andWhere('ae.etablissementId = :etablissementId', { etablissementId });
        }

        if (search) {
            qb.andWhere(
                '(e.nom ILIKE :search OR e.prenom ILIKE :search OR e.matricule ILIKE :search)',
                { search: `%${search}%` }
            );
        }

        qb.orderBy('e.nom', 'ASC').addOrderBy('e.prenom', 'ASC');

        const elevesPagines = await paginateWithQueryBuilder(qb, page, limit, false);

        const items = elevesPagines.items.map((ae: any) => ({
            ...ae.eleve,
            classeId: ae.classeId,
            affectationId: ae.id,
            dateAffectation: ae.dateAffectation,
        }));

        const statsQb = this.affectationRepo
            .createQueryBuilder('ae')
            .innerJoin('ae.eleve', 'e')
            .where('ae.classeId = :classeId', { classeId })
            .andWhere('ae.actif = :actif', { actif: true })
            .andWhere('ae.statut = :statut', { statut: StatutAffectationEleve.ACTIVE });

        if (etablissementId) {
            statsQb.andWhere('ae.etablissementId = :etablissementId', { etablissementId });
        }

        const statsBrutes = await statsQb
            .select([
                'COUNT(*) as total',
                "SUM(CASE WHEN e.sexe = 'M' THEN 1 ELSE 0 END) as garcons",
                "SUM(CASE WHEN e.sexe = 'F' THEN 1 ELSE 0 END) as filles",
            ])
            .getRawOne();

        const total = parseInt(statsBrutes?.total || '0');
        const garcons = parseInt(statsBrutes?.garcons || '0');
        const filles = parseInt(statsBrutes?.filles || '0');

        return {
            eleves: {
                items,
                meta: elevesPagines.meta,
            },
            stats: {
                total,
                garcons,
                filles,
                pourcentageGarcons: total > 0 ? (garcons / total) * 100 : 0,
                pourcentageFilles: total > 0 ? (filles / total) * 100 : 0,
            },
        };
    }

    async compterElevesActifs(classeId: string, anneeScolaireId?: string): Promise<number> {
        const where: any = { classeId, actif: true, statut: StatutAffectationEleve.ACTIVE };
        if (anneeScolaireId) where.anneeScolaireId = anneeScolaireId;
        return this.affectationRepo.count({ where });
    }

    async reconcilierEffectif(classeAnneeId: string): Promise<{ ancien: number; nouveau: number }> {
        const classeAnnee = await this.classeAnneeRepo.findOne({ where: { id: classeAnneeId } });
        if (!classeAnnee) throw new AppError('Classe-année non trouvée', 404, 'NOT_FOUND');

        const effectifReel = await this.compterElevesActifs(classeAnnee.classeId, classeAnnee.anneeScolaireId);
        const ancienEffectif = classeAnnee.effectifActuel;

        if (ancienEffectif !== effectifReel) {
            classeAnnee.effectifActuel = effectifReel;
            await this.classeAnneeRepo.save(classeAnnee);
            logger.info(`[Réconciliation] ClasseAnnee ${classeAnneeId}: effectif ${ancienEffectif} → ${effectifReel}`);
        }

        return { ancien: ancienEffectif, nouveau: effectifReel };
    }

    async reconcilierEffectifByClasse(classeId: string, etablissementId?: string): Promise<{ ancien: number; nouveau: number; effectifReel: number }> {
        const classeAnnee = await this.classeAnneeRepo.findOne({
            where: { classeId, actif: true },
            order: { createdAt: 'DESC' },
        });

        if (!classeAnnee) {
            const effectifReel = await this.compterElevesActifs(classeId);
            return { ancien: 0, nouveau: effectifReel, effectifReel };
        }

        const effectifReel = await this.compterElevesActifs(classeAnnee.classeId, classeAnnee.anneeScolaireId);
        const ancienEffectif = classeAnnee.effectifActuel;

        if (ancienEffectif !== effectifReel) {
            classeAnnee.effectifActuel = effectifReel;
            await this.classeAnneeRepo.save(classeAnnee);
            logger.info(`[Réconciliation] Classe ${classeId} (ClasseAnnee ${classeAnnee.id}): effectif ${ancienEffectif} → ${effectifReel}`);
        }

        return { ancien: ancienEffectif, nouveau: effectifReel, effectifReel };
    }

    async toggleActif(id: string, actif: boolean, etablissementId?: string): Promise<Classe> {
        const classe = await this.findOne(id, etablissementId);
        classe.actif = actif;
        await this.classeRepo.save(classe);
        logger.info(`[${etablissementId}] Classe ${actif ? 'activée' : 'désactivée'}: ${classe.nom}`);
        return classe;
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

            // Vérifier la capacité de la salle principale avant affectation
            const classeAnneeId = (classe as any).classeAnneeId;
            if (classeAnneeId) {
                const classeAnnee = await this.classeAnneeRepo.findOne({
                    where: { id: classeAnneeId },
                    relations: ['sallePrincipale'],
                });
                if (classeAnnee?.sallePrincipale && classeAnnee.effectifActuel >= classeAnnee.sallePrincipale.capacite) {
                    throw new AppError(
                        `Capacité de la salle atteinte (${classeAnnee.sallePrincipale.capacite} places)`,
                        400,
                        'SALLE_CAPACITY_EXCEEDED'
                    );
                }
            }

            const requireValidation = await getParamBoolean('classes.require_validation', { defaultValue: false });

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

            if (!requireValidation && classeAnneeId) {
                await queryRunner.manager.increment(ClasseAnnee, { id: classeAnneeId }, 'effectifActuel', 1);
            }

            await queryRunner.commitTransaction();

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

    async desaffecterEleve(affectationId: string, etablissementId?: string): Promise<void> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const affectation = await this.affectationRepo.findOne({
                where: { id: affectationId },
            });

            if (!affectation) {
                throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
            }

            affectation.actif = false;
            affectation.statut = StatutAffectationEleve.INACTIVE;
            await queryRunner.manager.save(affectation);

            if (affectation.classeAnneeId) {
                const classeAnnee = await queryRunner.manager.findOne(ClasseAnnee, {
                    where: { id: affectation.classeAnneeId },
                });
                if (classeAnnee && classeAnnee.effectifActuel > 0) {
                    await queryRunner.manager.decrement(
                        ClasseAnnee,
                        { id: affectation.classeAnneeId },
                        'effectifActuel',
                        1
                    );
                    logger.info(`[${etablissementId}] Effectif décrémenté: ClasseAnnee ${affectation.classeAnneeId}`);
                }
            }

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] Élève désaffecté: ${affectationId}`);
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`[${etablissementId}] Erreur désaffectation élève: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

export const classesService = new ClassesService();
