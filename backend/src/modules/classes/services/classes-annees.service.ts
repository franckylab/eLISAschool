/**
 * ==================================
 * eLISAschool - Service Classes Années
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des instances annuelles de classes
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ClasseAnnee, StatutClasseAnnee } from '../entities/classe-annee.entity';
import { CreateClasseAnneeDto, UpdateClasseAnneeDto } from '../dto/classes.dto';
import { Salle } from '@modules/salles/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';

export class ClassesAnneesService {
    private classeAnneeRepo: Repository<ClasseAnnee>;

    constructor() {
        this.classeAnneeRepo = AppDataSource.getRepository(ClasseAnnee);
    }

    /**
     * Créer une instance de classe pour une année scolaire
     */
    async create(
        dto: CreateClasseAnneeDto,
        createurId?: string,
        etablissementId?: string
    ): Promise<ClasseAnnee> {
        // Vérifier l'unicité
        const existing = await this.classeAnneeRepo.findOne({
            where: {
                classeId: dto.classeId,
                anneeScolaireId: dto.anneeScolaireId,
            },
        });

        if (existing) {
            throw new AppError(
                'Cette classe existe déjà pour cette année scolaire',
                409,
                'CLASSE_ANNEE_EXISTS'
            );
        }

        let effectifMax = dto.effectifMax ?? 50;

        if (dto.sallePrincipaleId) {
            const salleRepo = AppDataSource.getRepository(Salle);
            const salle = await salleRepo.findOne({ where: { id: dto.sallePrincipaleId } });
            if (salle && effectifMax > salle.capacite) {
                effectifMax = salle.capacite;
            }
        }

        const classeAnnee = this.classeAnneeRepo.create({
            classeId: dto.classeId,
            anneeScolaireId: dto.anneeScolaireId,
            professeurPrincipalId: dto.professeurPrincipalId ?? undefined,
            sallePrincipaleId: dto.sallePrincipaleId ?? undefined,
            effectifMax,
            notes: dto.notes,
            etablissementId,
            statut: StatutClasseAnnee.ACTIVE,
            actif: true,
            effectifActuel: 0,
        });

        await this.classeAnneeRepo.save(classeAnnee);

        // Workflow de validation si activé
        if (createurId && etablissementId) {
            const requireValidation = await getParamBoolean('classes.require_validation', { defaultValue: false });

            if (requireValidation) {
                await validationWorkflowService.createWorkflow(
                    {
                        module: 'classes',
                        entiteId: classeAnnee.id,
                        entiteType: 'ClasseAnnee',
                        niveauxRequis: 2,
                        etablissementId,
                    },
                    createurId
                );

                logger.info(
                    `[${etablissementId}] Classe-année créée en attente de validation: ${classeAnnee.classeId} - ${classeAnnee.anneeScolaireId}`
                );
            } else {
                logger.info(
                    `Classe-année créée: ${classeAnnee.classeId} - ${classeAnnee.anneeScolaireId}`
                );
            }
        }

        return classeAnnee;
    }

    /**
     * Rechercher toutes les classes-années avec pagination et filtres
     */
    async findAll(
        query: any,
        etablissementId?: string
    ): Promise<PaginatedResult<ClasseAnnee>> {
        const { page, limit, search, anneeScolaireId, actif } = query;

        const qb = this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('ca.anneeScolaire', 'as')
            .leftJoinAndSelect('ca.professeurPrincipal', 'pp')
            .where('ca.etablissementId = :etablissementId', { etablissementId });

        if (anneeScolaireId) {
            qb.andWhere('ca.anneeScolaireId = :anneeScolaireId', { anneeScolaireId });
        }

        if (actif !== undefined) {
            qb.andWhere('ca.actif = :actif', { actif: actif === 'true' });
        }

        if (search) {
            qb.andWhere('(c.nom ILIKE :search OR n.nom ILIKE :search)', {
                search: `%${search}%`,
            });
        }

        return paginateWithQueryBuilder(qb, page || 1, limit || 20);
    }

    /**
     * Trouver une classe-année par ID
     */
    async findOne(id: string): Promise<ClasseAnnee> {
        const classeAnnee = await this.classeAnneeRepo.findOne({
            where: { id },
            relations: ['classe', 'classe.niveau', 'anneeScolaire', 'professeurPrincipal'],
        });

        if (!classeAnnee) {
            throw new AppError('Classe-année non trouvée', 404, 'NOT_FOUND');
        }

        return classeAnnee;
    }

    /**
     * Trouver par classe et année scolaire
     */
    async findByClasseAndAnnee(
        classeId: string,
        anneeScolaireId: string
    ): Promise<ClasseAnnee> {
        const classeAnnee = await this.classeAnneeRepo.findOne({
            where: { classeId, anneeScolaireId },
            relations: ['classe', 'anneeScolaire', 'professeurPrincipal'],
        });

        if (!classeAnnee) {
            throw new AppError('Classe-année non trouvée', 404, 'NOT_FOUND');
        }

        return classeAnnee;
    }

    /**
     * Mettre à jour une classe-année
     */
    async update(id: string, dto: UpdateClasseAnneeDto): Promise<ClasseAnnee> {
        const classeAnnee = await this.findOne(id);

        if (dto.sallePrincipaleId !== undefined) {
            classeAnnee.sallePrincipaleId = dto.sallePrincipaleId || undefined;
            if (dto.sallePrincipaleId) {
                const salle = await AppDataSource.getRepository(Salle).findOne({
                    where: { id: dto.sallePrincipaleId },
                });
                if (salle && (dto.effectifMax === undefined || dto.effectifMax > salle.capacite)) {
                    classeAnnee.effectifMax = salle.capacite;
                }
            }
        }

        if (dto.effectifMax !== undefined) {
            if (classeAnnee.sallePrincipaleId) {
                const salle = await AppDataSource.getRepository(Salle).findOne({
                    where: { id: classeAnnee.sallePrincipaleId },
                });
                if (salle && dto.effectifMax > salle.capacite) {
                    throw new AppError(
                        `L'effectif max (${dto.effectifMax}) dépasse la capacité de la salle (${salle.capacite})`,
                        400,
                        'EFFECTIF_EXCEEDS_CAPACITE'
                    );
                }
            }
            classeAnnee.effectifMax = dto.effectifMax;
        }

        if (dto.professeurPrincipalId !== undefined) classeAnnee.professeurPrincipalId = dto.professeurPrincipalId || undefined;
        if (dto.notes !== undefined) classeAnnee.notes = dto.notes;

        await this.classeAnneeRepo.save(classeAnnee);
        logger.info(`Classe-année mise à jour: ${classeAnnee.id}`);
        return classeAnnee;
    }

    /**
     * Supprimer une classe-année
     */
    async delete(id: string): Promise<void> {
        const classeAnnee = await this.findOne(id);

        // Vérifier qu'il n'y a pas d'élèves affectés
        const affectationRepo = AppDataSource.getRepository('AffectationEleve');
        const countEleves = await affectationRepo.count({
            where: { classeAnneeId: id },
        });

        if (countEleves > 0) {
            throw new AppError(
                `Impossible de supprimer : ${countEleves} élève(s) sont affectés à cette classe`,
                400,
                'CLASSE_ANNEE_HAS_ELEVES'
            );
        }

        await this.classeAnneeRepo.remove(classeAnnee);
        logger.info(`Classe-année supprimée: ${classeAnnee.id}`);
    }

    /**
     * Cloner les classes d'une année à une autre
     */
    async clonerAnnee(
        anneeSourceId: string,
        anneeDestinationId: string,
        etablissementId: string
    ): Promise<ClasseAnnee[]> {
        const classesSource = await this.classeAnneeRepo.find({
            where: { anneeScolaireId: anneeSourceId, etablissementId },
            relations: ['classe'],
        });

        const nouvellesClasses: ClasseAnnee[] = [];

        for (const classeSource of classesSource) {
            const nouvelleClasse = this.classeAnneeRepo.create({
                classeId: classeSource.classeId,
                anneeScolaireId: anneeDestinationId,
                etablissementId,
                sallePrincipaleId: classeSource.sallePrincipaleId,
                effectifMax: classeSource.effectifMax,
                effectifActuel: 0,
                actif: true,
                statut: StatutClasseAnnee.ACTIVE,
            });

            await this.classeAnneeRepo.save(nouvelleClasse);
            nouvellesClasses.push(nouvelleClasse);
        }

        logger.info(
            `${nouvellesClasses.length} classes clonées de ${anneeSourceId} vers ${anneeDestinationId}`
        );

        return nouvellesClasses;
    }

    /**
     * Mettre à jour l'effectif actuel
     */
    async updateEffectif(id: string, effectifActuel: number): Promise<ClasseAnnee> {
        const classeAnnee = await this.findOne(id);
        classeAnnee.effectifActuel = effectifActuel;
        await this.classeAnneeRepo.save(classeAnnee);
        return classeAnnee;
    }

    /**
     * Lister les classes-années avec effectif > 0
     */
    async findClassesWithEleves(etablissementId: string): Promise<ClasseAnnee[]> {
        return this.classeAnneeRepo
            .createQueryBuilder('ca')
            .leftJoinAndSelect('ca.classe', 'c')
            .leftJoinAndSelect('c.niveau', 'n')
            .leftJoinAndSelect('ca.anneeScolaire', 'as')
            .where('ca.etablissementId = :etablissementId', { etablissementId })
            .andWhere('ca.effectifActuel > 0')
            .andWhere('ca.actif = true')
            .orderBy('n.nom', 'ASC')
            .addOrderBy('c.nom', 'ASC')
            .getMany();
    }
}

export const classesAnneesService = new ClassesAnneesService();
