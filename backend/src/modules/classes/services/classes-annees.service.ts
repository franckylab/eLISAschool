/**
 * ==================================
 * eLISAschool - Service Classes Années
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des instances annuelles de classes
 */

import { Repository, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ClasseAnnee, StatutClasseAnnee } from '../entities/classe-annee.entity';
import { CreateClasseAnneeDto, UpdateClasseAnneeDto } from '../dto/classes.dto';
import { Salle } from '@modules/salles/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithQueryBuilder, PaginatedResult } from '@common/utils/pagination.util';
import { Classe } from '../entities/classe.entity';
import { Niveau } from '@modules/niveaux/entities';
import { Cycle } from '@modules/cycles/entities';
import { AnneeScolaire } from '@modules/annees-scolaires/entities';
import { AffectationEleve } from '../entities/affectation-eleve.entity';

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
            programmeId: dto.programmeId ?? undefined,
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
        if (dto.programmeId !== undefined) classeAnnee.programmeId = dto.programmeId || undefined;
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
                programmeId: (classeSource as any).programmeId,
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

    /**
     * Promouvoir une classe : crée la ClasseAnnee N+1 et réaffecte les élèves actifs.
     *
     * Logique :
     * 1. Trouve le niveau suivant (même cycle ordre+1, ou premier niveau du cycle suivant)
     * 2. Trouve ou crée la Classe cible (même filière, typeClasse, établissement)
     * 3. Trouve l'année scolaire suivante
     * 4. Trouve ou crée la ClasseAnnee cible
     * 5. Ferme les affectations actives et crée les nouvelles
     */
    async promouvoirClasse(
        classeAnneeId: string,
        etablissementId: string,
    ): Promise<{ classeAnneeCible: ClasseAnnee; elevesPromus: number }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Charger la source avec toutes les relations nécessaires
            const source = await queryRunner.manager.findOne(ClasseAnnee, {
                where: { id: classeAnneeId, etablissementId },
                relations: ['classe', 'classe.niveau', 'classe.niveau.cycle', 'anneeScolaire'],
            });
            if (!source) throw new AppError('Classe année non trouvée', 404, 'NOT_FOUND');
            if (!source.classe?.niveau) throw new AppError('Niveau de la classe introuvable', 400, 'NIVEAU_INTRouvable');

            const niveauSource = source.classe.niveau;
            const cycleSource = niveauSource.cycle;
            if (!cycleSource) throw new AppError('Cycle du niveau introuvable', 400, 'CYCLE_INTRouvable');
            const niveauRepo = queryRunner.manager.getRepository(Niveau);
            const cycleRepo = queryRunner.manager.getRepository(Cycle);

            // 2. Trouver le niveau suivant
            let niveauCible = await niveauRepo.findOne({
                where: {
                    cycleId: cycleSource.id,
                    ordre: niveauSource.ordre + 1,
                    actif: true,
                },
            });

            if (!niveauCible) {
                // Dernier niveau du cycle → premier niveau du cycle suivant
                const cycleSuivant = await cycleRepo.findOne({
                    where: { ordre: cycleSource.ordre + 1, etablissementId },
                });
                if (!cycleSuivant) {
                    throw new AppError(
                        `Aucun niveau supérieur après "${niveauSource.nom}" (${cycleSource.nom} est le dernier cycle)`,
                        400,
                        'PAS_NIVEAU_SUPERIEUR',
                    );
                }
                niveauCible = await niveauRepo.findOne({
                    where: { cycleId: cycleSuivant.id, actif: true, etablissementId },
                    order: { ordre: 'ASC' },
                });
                if (!niveauCible) {
                    throw new AppError('Aucun niveau actif trouvé dans le cycle suivant', 400, 'PAS_NIVEAU_SUPERIEUR');
                }
            }

            // 3. Trouver ou créer la Classe cible
            const classeRepo = queryRunner.manager.getRepository(Classe);
            let classeCible = await classeRepo.findOne({
                where: {
                    niveauId: niveauCible.id,
                    filiereId: source.classe.filiereId ?? undefined,
                    typeClasse: source.classe.typeClasse,
                    etablissementId,
                    actif: true,
                },
            });

            if (!classeCible) {
                const nomCible = `${niveauCible.nom}${source.classe.nom.replace(niveauSource.nom, '')}`;
                classeCible = classeRepo.create({
                    nom: nomCible,
                    code: `${niveauCible.code || niveauCible.nom}_${source.classe.code?.split('_')[1] || 'A'}`.toUpperCase(),
                    niveauId: niveauCible.id,
                    filiereId: source.classe.filiereId,
                    typeClasse: source.classe.typeClasse,
                    creneauHoraire: source.classe.creneauHoraire,
                    etablissementId,
                });
                await queryRunner.manager.save(classeCible);
                logger.info(`[Promotion] Classe créée: ${classeCible.nom} (niveau: ${niveauCible.nom})`);
            }

            // 4. Trouver l'année scolaire suivante
            const anneeRepo = queryRunner.manager.getRepository(AnneeScolaire);
            const anneeSource = source.anneeScolaire;
            const anneeCible = await anneeRepo.findOne({
                where: {
                    etablissementId,
                    dateDebut: anneeSource!.dateFin,
                },
            });
            if (!anneeCible) {
                throw new AppError(
                    `Aucune année scolaire commençant le ${anneeSource!.dateFin.toISOString().split('T')[0]}`,
                    400,
                    'ANNEE_SUIVANTE_INTRouVABLE',
                );
            }

            // 5. Trouver ou créer la ClasseAnnee cible
            let classeAnneeCible = await this.classeAnneeRepo.findOne({
                where: { classeId: classeCible.id, anneeScolaireId: anneeCible.id },
            });
            if (!classeAnneeCible) {
                classeAnneeCible = this.classeAnneeRepo.create({
                    classeId: classeCible.id,
                    anneeScolaireId: anneeCible.id,
                    etablissementId,
                    effectifMax: source.effectifMax,
                    effectifActuel: 0,
                    actif: true,
                    statut: StatutClasseAnnee.ACTIVE,
                });
                await queryRunner.manager.save(classeAnneeCible);
                logger.info(`[Promotion] ClasseAnnee créée: ${classeCible.nom} → ${anneeCible.libelle}`);
            }

            // 6. Réaffecter les élèves actifs
            const affectationRepo = queryRunner.manager.getRepository(AffectationEleve);
            const affectationsActives = await affectationRepo.find({
                where: {
                    classeAnneeId: source.id,
                    actif: true,
                    etablissementId,
                },
            });

            const aujourdHui = new Date();
            let compteur = 0;

            for (const affect of affectationsActives) {
                // Fermer l'ancienne affectation
                affect.actif = false;
                affect.dateSortie = aujourdHui;
                affect.motifChangement = 'PASSAGE_NIVEAU';
                affect.statut = 'INACTIVE' as any;
                await queryRunner.manager.save(affect);

                // Créer la nouvelle affectation
                const nouvelleAffect = affectationRepo.create({
                    eleveId: affect.eleveId,
                    classeId: classeCible.id,
                    classeAnneeId: classeAnneeCible.id,
                    anneeScolaireId: anneeCible.id,
                    dateAffectation: aujourdHui,
                    motifChangement: 'PASSAGE_NIVEAU',
                    actif: true,
                    statut: 'ACTIVE' as any,
                    etablissementId,
                });
                await queryRunner.manager.save(nouvelleAffect);
                compteur++;
            }

            // Mettre à jour l'effectif de la classe cible
            classeAnneeCible.effectifActuel = compteur;
            await queryRunner.manager.save(classeAnneeCible);

            // Clôturer la classe source
            source.statut = StatutClasseAnnee.CLOTUREE;
            source.actif = false;
            await queryRunner.manager.save(source);

            await queryRunner.commitTransaction();
            logger.info(`[Promotion] ${compteur} élève(s) promu(s) de "${source.classe.nom}" vers "${classeCible.nom}"`);

            return { classeAnneeCible, elevesPromus: compteur };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}

export const classesAnneesService = new ClassesAnneesService();
