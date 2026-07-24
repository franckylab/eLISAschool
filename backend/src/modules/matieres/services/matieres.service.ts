/**
 * ==================================
 * eLISAschool - Service Matières
 * ==================================
 * Version: 2.1.0
 * 
 * v2.1: Ajout findProgrammesPedagogiquesByMatiere
 */

import { Repository, ILike } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Matiere, GroupeMatiere, MatiereNiveau, AffectationMatiere, StatutAffectationMatiere, StatutMatiereNiveau } from '../entities';
import { ProgrammeMatiere } from '@modules/programmes/entities';
import { CreateMatiereDto, UpdateMatiereDto, CreateGroupeMatiereDto, CreateMatiereNiveauDto, UpdateMatiereNiveauDto, AffecterEnseignantDto, QueryMatieresDto, MoveAffectationDto } from '../dto';
import { anneesScolairesService } from '@modules/annees-scolaires/services';
import { classesService } from '@modules/classes/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { paginateWithRepository, PaginatedResult } from '@common/utils/pagination.util';

export class MatieresService {
    private matiereRepo: Repository<Matiere>;
    private groupeRepo: Repository<GroupeMatiere>;
    private niveauRepo: Repository<MatiereNiveau>;
    private affectationRepo: Repository<AffectationMatiere>;
    private programmeMatiereRepo: Repository<ProgrammeMatiere>;

    constructor() {
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.groupeRepo = AppDataSource.getRepository(GroupeMatiere);
        this.niveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
        this.programmeMatiereRepo = AppDataSource.getRepository(ProgrammeMatiere);
    }

    // ==== MATIERES ====

    async findOne(id: string, etablissementId: string): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({
            where: { id, etablissementId },
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        return matiere;
    }

    async create(dto: CreateMatiereDto, etablissementId: string): Promise<Matiere> {
        const existing = await this.matiereRepo.findOne({ 
            where: { nom: dto.nom, etablissementId } 
        });
        if (existing) throw new AppError('Matière déjà existante dans cet établissement', 409, 'MATIERE_EXISTS');

        const matiere = this.matiereRepo.create({
            ...dto,
            etablissementId,
        });
        await this.matiereRepo.save(matiere);
        logger.info(`Matière créée: ${dto.nom} pour établissement ${etablissementId}`);
        return matiere;
    }

    async findAll(query: QueryMatieresDto = {} as QueryMatieresDto, etablissementId: string): Promise<PaginatedResult<Matiere>> {
        const { page = 1, limit = 20, actif, recherche, sousSysteme } = query;

        const baseWhere: any = { etablissementId };
        
        if (actif !== undefined) {
            baseWhere.actif = actif;
        }

        if (sousSysteme !== undefined) {
            baseWhere.sousSysteme = sousSysteme;
        }

        let where: any = baseWhere;

        if (recherche) {
            where = [
                { ...baseWhere, nom: ILike(`%${recherche}%`) },
                { ...baseWhere, code: ILike(`%${recherche}%`) },
            ];
        }

        return paginateWithRepository(this.matiereRepo, {
            where,
            order: { nom: 'ASC' },
            page,
            limit,
        });
    }

    async update(id: string, dto: UpdateMatiereDto, etablissementId: string): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({ 
            where: { id, etablissementId } 
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        Object.assign(matiere, dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    async delete(id: string, etablissementId: string): Promise<void> {
        const matiere = await this.matiereRepo.findOne({ 
            where: { id, etablissementId } 
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        await this.matiereRepo.remove(matiere);
        logger.info(`Matière supprimée: ${id} pour établissement ${etablissementId}`);
    }

    // ==== GROUPES ====

    async createGroupe(dto: CreateGroupeMatiereDto): Promise<GroupeMatiere> {
        const groupe = this.groupeRepo.create(dto);
        await this.groupeRepo.save(groupe);
        return groupe;
    }

    async findAllGroupes(page: number = 1, limit: number = 20): Promise<PaginatedResult<GroupeMatiere>> {
        return paginateWithRepository(this.groupeRepo, {
            order: { ordre: 'ASC' },
            page,
            limit,
        });
    }

    // ==== GRILLE MATIÈRE PAR NIVEAU (MatiereNiveau) ====
    // Source de vérité pour coefficient, barème, volumeHoraire, credits, obligatoire

    async addMatiereToNiveau(dto: CreateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        // La contrainte d'unicité (matiereId, niveauId) est levée pour permettre
        // plusieurs MatiereNiveau (ex: un par programme). Chacun sera lié à
        // un unique programme via ProgrammeMatiere (contrainte d'unicité globale).
        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });

        const prog = this.niveauRepo.create({
            ...dto,
            statut: requireValidation
                ? StatutMatiereNiveau.EN_ATTENTE_VALIDATION
                : StatutMatiereNiveau.ACTIF,
        } as unknown as MatiereNiveau);
        await this.niveauRepo.save(prog);

        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Programme matière-niveau créé en attente de validation: ${prog.id}`);
        } else {
            logger.info(`Programme matière-niveau créé: ${prog.id}`);
        }

        return prog;
    }

    async getMatieresParNiveau(niveauId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { niveauId },
            relations: ['matiere', 'groupe'],
            order: { groupe: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async getAllMatieresNiveaux(etablissementId?: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { matiere: { etablissementId } },
            relations: ['matiere', 'niveau', 'groupe', 'filiere'],
            order: { niveau: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async deleteMatiereNiveau(id: string): Promise<void> {
        const prog = await this.niveauRepo.findOne({ where: { id } });
        if (!prog) throw new AppError('Programme matière-niveau non trouvé', 404, 'NOT_FOUND');
        await this.niveauRepo.remove(prog);
        logger.info(`Programme matière-niveau supprimé: ${id}`);
    }

    async updateMatiereNiveau(id: string, dto: UpdateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const prog = await this.niveauRepo.findOne({ where: { id } });
        if (!prog) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        Object.assign(prog, dto);
        await this.niveauRepo.save(prog);

        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });
        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: prog.id,
                entiteType: 'MatiereNiveau',
                niveauxRequis: 2,
                etablissementId,
                commentaire: 'Modification du programme',
            }, createurId);

            logger.info(`[${etablissementId}] Programme modifié avec workflow: ${id}`);
        }

        return prog;
    }

    // ==== AFFECTATIONS ENSEIGNANTS ====

    async affecterEnseignant(dto: AffecterEnseignantDto, createurId: string, etablissementId?: string): Promise<AffectationMatiere> {
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.classeAnneeId },
            relations: ['classe', 'anneeScolaire']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const prog = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: classeAnnee.classe.niveauId }
        });
        if (!prog) throw new AppError('Cette matière n\'est pas au programme de ce niveau', 400, 'MATIERE_NOT_IN_LEVEL');

        const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });

        const existing = await this.affectationRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId
            }
        });

        if (existing) {
            existing.enseignantId = dto.enseignantId;
            if (dto.dateDebut) existing.dateDebut = new Date(dto.dateDebut);
            if (dto.dateFin !== undefined) existing.dateFin = new Date(dto.dateFin);
            if (dto.coefficient !== undefined) existing.coefficient = dto.coefficient;
            if (dto.actif !== undefined) existing.actif = dto.actif;
            existing.statut = requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE;
            await this.affectationRepo.save(existing);

            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'matieres',
                    entiteId: existing.id,
                    entiteType: 'AffectationMatiere',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: 'Modification affectation enseignant',
                }, createurId);
            }

            return existing;
        }

        const affectation = this.affectationRepo.create({
            matiereId: dto.matiereId,
            classeAnneeId: dto.classeAnneeId,
            enseignantId: dto.enseignantId,
            etablissementId: etablissementId!,
            dateDebut: dto.dateDebut || new Date().toISOString().split('T')[0],
            ...(dto.dateFin ? { dateFin: dto.dateFin } : {}),
            ...(dto.coefficient !== undefined ? { coefficient: dto.coefficient } : {}),
            ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
            statut: requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE,
        });
        await this.affectationRepo.save(affectation);

        if (requireValidation) {
            await validationWorkflowService.createWorkflow({
                module: 'matieres',
                entiteId: affectation.id,
                entiteType: 'AffectationMatiere',
                niveauxRequis: 2,
                etablissementId,
            }, createurId);

            logger.info(`[${etablissementId}] Affectation enseignant créée en attente de validation: ${dto.enseignantId} → ${dto.matiereId}`);
        } else {
            logger.info(`Affectation enseignant créée: ${dto.enseignantId} → ${dto.matiereId}`);
        }

        return affectation;
    }

    // ==== CRUD AFFECTATIONS ====

    async updateAffectation(id: string, dto: Partial<AffecterEnseignantDto>, etablissementId: string): Promise<AffectationMatiere> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');

        if (dto.enseignantId) affectation.enseignantId = dto.enseignantId;
        if (dto.dateDebut) affectation.dateDebut = new Date(dto.dateDebut);
        if (dto.dateFin !== undefined) affectation.dateFin = new Date(dto.dateFin);
        if (dto.actif !== undefined) affectation.actif = dto.actif;
        if (dto.coefficient !== undefined) affectation.coefficient = dto.coefficient;

        await this.affectationRepo.save(affectation);
        logger.info(`Affectation mise à jour: ${id}`);
        return affectation;
    }

    async deleteAffectation(id: string, etablissementId: string): Promise<void> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');
        await this.affectationRepo.remove(affectation);
        logger.info(`Affectation supprimée: ${id}`);
    }

    async moveAffectation(id: string, dto: MoveAffectationDto, etablissementId: string): Promise<AffectationMatiere> {
        const affectation = await this.affectationRepo.findOne({ where: { id, etablissementId } });
        if (!affectation) throw new AppError('Affectation non trouvée', 404, 'NOT_FOUND');

        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const cibleClasseAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.cibleClasseAnneeId },
            relations: ['classe'],
        }) as any;
        if (!cibleClasseAnnee) throw new AppError('Classe/Année cible non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');

        const prog = await this.niveauRepo.findOne({
            where: { matiereId: affectation.matiereId, niveauId: cibleClasseAnnee.classe.niveauId }
        });
        if (!prog) throw new AppError('Cette matière n\'est pas au programme du niveau cible', 400, 'MATIERE_NOT_IN_LEVEL');

        affectation.classeAnneeId = dto.cibleClasseAnneeId;
        await this.affectationRepo.save(affectation);
        logger.info(`Affectation déplacée: ${id} → classe ${dto.cibleClasseAnneeId}`);
        return affectation;
    }

    // ==== CONFIGURATION MATIERE CLASSE ====

    async createConfigurationMatiereClasse(
        dto: CreateConfigurationMatiereClasseDto,
        createurId?: string,
        etablissementId?: string
    ): Promise<ConfigurationMatiereClasse> {
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.classeAnneeId },
            relations: ['classe']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const existing = await this.configurationMatiereClasseRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId,
                etablissementId: dto.etablissementId,
            }
        });

        if (existing) {
            throw new AppError(
                'Cette matière est déjà configurée pour cette classe et cette année scolaire',
                409,
                'CONFIGURATION_MATIERE_CLASSE_EXISTS'
            );
        }

        const matiereNiveau = await this.niveauRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                niveauId: classeAnnee.classe.niveauId,
            }
        });

        if (!matiereNiveau) {
            throw new AppError(
                'Programme matière-niveau non trouvé. Configurez d\'abord le MatiereNiveau.',
                400,
                'MATIERE_NIVEAU_NOT_FOUND'
            );
        }

        const config = this.configurationMatiereClasseRepo.create({
            matiereId: dto.matiereId,
            classeAnneeId: dto.classeAnneeId,
            etablissementId: dto.etablissementId,
            coefficient: dto.coefficient,
            bareme: dto.bareme,
            volumeHoraireHebdo: dto.volumeHoraireHebdo,
            credits: dto.credits,
            obligatoire: dto.obligatoire,
            notes: dto.notes,
            statut: StatutConfigurationMatiereClasse.ACTIVE,
        });

        await this.configurationMatiereClasseRepo.save(config);

        if (createurId && etablissementId) {
            const requireValidation = await getParamBoolean('matieres.require_validation', { defaultValue: false, etablissementId });

            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'matieres',
                    entiteId: config.id,
                    entiteType: 'ConfigurationMatiereClasse',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);

                logger.info(`[${etablissementId}] Configuration matière-classe créée en attente de validation: ${config.matiereId} → ${config.classeAnneeId}`);
            } else {
                logger.info(`Configuration matière-classe créée: ${config.matiereId} → ${config.classeAnneeId}`);
            }
        }

        return config;
    }

    async findAllConfigurationsMatiereClasse(
        etablissementId: string,
        classeAnneeId?: string
    ): Promise<ConfigurationMatiereClasse[]> {
        const where: any = { etablissementId };

        if (classeAnneeId) {
            where.classeAnneeId = classeAnneeId;
        }

        return this.configurationMatiereClasseRepo.find({
            where,
            relations: ['matiere', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire'],
            order: {
                'classeAnnee': { createdAt: 'DESC' },
                'matiere': { nom: 'ASC' },
            },
        });
    }

    async findOneConfigurationMatiereClasse(id: string): Promise<ConfigurationMatiereClasse> {
        const config = await this.configurationMatiereClasseRepo.findOne({
            where: { id },
            relations: ['matiere', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'etablissement'],
        });

        if (!config) {
            throw new AppError('Configuration matière-classe non trouvée', 404, 'NOT_FOUND');
        }

        return config;
    }

    async updateConfigurationMatiereClasse(
        id: string,
        dto: UpdateConfigurationMatiereClasseDto
    ): Promise<ConfigurationMatiereClasse> {
        const config = await this.findOneConfigurationMatiereClasse(id);

        Object.assign(config, dto);
        await this.configurationMatiereClasseRepo.save(config);

        logger.info(`Configuration matière-classe mise à jour: ${config.matiereId} → ${config.classeAnneeId}`);
        return config;
    }

    async deleteConfigurationMatiereClasse(id: string): Promise<void> {
        const config = await this.findOneConfigurationMatiereClasse(id);

        const affectations = await this.affectationRepo.find({
            where: { configurationId: id },
        });

        if (affectations.length > 0) {
            throw new AppError(
                'Impossible de supprimer : cette configuration est utilisée par des affectations enseignants',
                400,
                'CONFIGURATION_MATIERE_CLASSE_IN_USE'
            );
        }

        await this.configurationMatiereClasseRepo.remove(config);
        logger.info(`Configuration matière-classe supprimée: ${config.matiereId} → ${config.classeAnneeId}`);
    }

    async getConfigurationEffective(
        matiereId: string,
        classeAnneeId: string,
        etablissementId: string
    ): Promise<{
        config: ConfigurationMatiereClasse | null;
        programme: { coefficient?: number | null; volumeHoraire?: number | null; obligatoire?: boolean | null; nom?: string | null } | null;
        defaults: { coefficient: number; bareme: number; volumeHoraire: number | null; credits: number | null; obligatoire: boolean; source: string };
        effective: { coefficient: number; bareme: number; volumeHoraireHebdo: number | null; credits: number | null; obligatoire: boolean };
    }> {
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: classeAnneeId },
            relations: ['classe'],
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        const config = await this.configurationMatiereClasseRepo.findOne({
            where: {
                matiereId,
                classeAnneeId,
                etablissementId,
            },
        });

        // Résolution ProgrammeMatiere : si la classe a un programme, cherche
        // le ProgrammeMatiere dont matiereNiveau.matiereId + niveauId correspondent.
        let programmeSource: { coefficient?: number | null; volumeHoraire?: number | null; obligatoire?: boolean | null; nom?: string | null } | null = null;

        if (classeAnnee.programmeId) {
            const pm = await this.programmeMatiereRepo.findOne({
                where: {
                    programmeId: classeAnnee.programmeId,
                    matiereNiveau: {
                        matiereId,
                        niveauId: classeAnnee.classe.niveauId,
                    },
                },
                relations: ['matiereNiveau', 'programme'],
            });

            if (pm) {
                programmeSource = {
                    coefficient: pm.coefficient ?? null,
                    volumeHoraire: pm.volumeHoraire ?? null,
                    obligatoire: pm.obligatoire,
                    nom: (pm.programme as any)?.nom ?? null,
                };
            }
        }

        const matiereNiveau = await this.niveauRepo.findOne({
            where: {
                matiereId,
                niveauId: classeAnnee.classe.niveauId,
            },
        }) as any;

        // Fallback : MatiereNiveau → si ProgrammeMatiere définit une valeur, l'utiliser
        const defaultsMatiereNiveau = matiereNiveau
            ? {
                coefficient: matiereNiveau.coefficient,
                bareme: matiereNiveau.bareme,
                volumeHoraire: matiereNiveau.volumeHoraire ?? null,
                credits: matiereNiveau.credits ?? null,
                obligatoire: matiereNiveau.obligatoire,
            }
            : {
                coefficient: 1,
                bareme: 20,
                volumeHoraire: null,
                credits: null,
                obligatoire: true,
            };

        // Chaîne : ProgrammeMatiere (primaire) → MatiereNiveau (fallback)
        const coefficient = programmeSource?.coefficient ?? defaultsMatiereNiveau.coefficient;
        const volumeHoraire = programmeSource?.volumeHoraire ?? defaultsMatiereNiveau.volumeHoraire;
        const obligatoire = programmeSource?.obligatoire ?? defaultsMatiereNiveau.obligatoire;

        const defaults = {
            coefficient,
            bareme: defaultsMatiereNiveau.bareme,
            volumeHoraire,
            credits: defaultsMatiereNiveau.credits,
            obligatoire,
            source: programmeSource ? 'ProgrammeMatiere' as const : 'MatiereNiveau' as const,
        };

        const effective = {
            coefficient: config?.coefficient ?? defaults.coefficient,
            bareme: config?.bareme ?? defaults.bareme,
            volumeHoraireHebdo: config?.volumeHoraireHebdo ?? defaults.volumeHoraire,
            credits: config?.credits ?? defaults.credits,
            obligatoire: config?.obligatoire ?? defaults.obligatoire,
        };

        return { config: config || null, programme: programmeSource, defaults, effective };
    }

    // ==== GRILLE PAR MATIÈRE (MatiereNiveau filtré par matière) ====

    async findProgrammeByMatiere(matiereId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { matiereId },
            relations: ['niveau', 'groupe', 'filiere'],
            order: { createdAt: 'ASC' },
        });
    }

    // ==== PROGRAMMES PEDAGOGIQUES PAR MATIERE ====

    async findProgrammesPedagogiquesByMatiere(matiereId: string, etablissementId: string): Promise<any[]> {
        const { programmeMatiereService } = await import('@modules/programmes/services/programme-matiere.service');
        return programmeMatiereService.findByMatiere(matiereId, etablissementId);
    }

    // ==== AFFECTATIONS PAR ENSEIGNANT ====

    async getAffectationsByEnseignant(enseignantId: string, etablissementId: string): Promise<any[]> {
        const affectations = await this.affectationRepo.find({
            where: { enseignantId, etablissementId },
            relations: [
                'matiere',
                'classeAnnee',
                'classeAnnee.classe',
                'classeAnnee.anneeScolaire',
                'configuration',
            ],
            order: { createdAt: 'DESC' },
        });

        const matiereIds = [...new Set(affectations.map(a => a.matiereId))];
        const niveauIds = [...new Set(affectations.map(a => a.classeAnnee?.classe?.niveauId).filter(Boolean))];
        const matiereNiveaux: Map<string, MatiereNiveau> = new Map();

        if (matiereIds.length > 0 && niveauIds.length > 0) {
            const nivs = await this.niveauRepo.createQueryBuilder('mn')
                .where('mn.matiereId IN (:...matiereIds)', { matiereIds })
                .andWhere('mn.niveauId IN (:...niveauIds)', { niveauIds })
                .getMany();
            for (const mn of nivs) {
                matiereNiveaux.set(`${mn.matiereId}::${mn.niveauId}`, mn);
            }
        }

        // Collecter les programmeIds pour résolution ProgrammeMatiere
        const programmeIds = [...new Set(affectations.map(a => (a.classeAnnee as any)?.programmeId).filter(Boolean))];
        const programmeMatieres: Map<string, ProgrammeMatiere> = new Map();
        if (programmeIds.length > 0 && matiereIds.length > 0 && niveauIds.length > 0) {
            const pms = await this.programmeMatiereRepo.find({
                where: programmeIds.map(pid => ({
                    programmeId: pid,
                    matiereNiveau: {
                        matiereId: matiereIds[0], // fallback — on va charger plus largement
                    },
                })),
                relations: ['matiereNiveau'],
            }).catch(() => []);
            // Rechargement plus large si nécessaire
            const allPMs = programmeIds.length > 0
                ? await this.programmeMatiereRepo.createQueryBuilder('pm')
                    .leftJoinAndSelect('pm.matiereNiveau', 'mn')
                    .where('pm.programmeId IN (:...programmeIds)', { programmeIds })
                    .andWhere('mn.matiereId IN (:...matiereIds)', { matiereIds })
                    .getMany()
                : [];
            for (const pm of allPMs) {
                programmeMatieres.set(`${pm.matiereNiveau.matiereId}::${pm.matiereNiveau.niveauId}::${pm.programmeId}`, pm);
            }
        }

        return affectations.map((aff) => {
            const niveauId = aff.classeAnnee?.classe?.niveauId;
            const key = niveauId ? `${aff.matiereId}::${niveauId}` : '';
            const matiereNiveau = key ? matiereNiveaux.get(key) : null;
            const config = aff.configuration;

            // Résolution ProgrammeMatiere
            const programmeId = (aff.classeAnnee as any)?.programmeId;
            const pmKey = programmeId && niveauId ? `${aff.matiereId}::${niveauId}::${programmeId}` : '';
            const pm = pmKey ? programmeMatieres.get(pmKey) : null;

            // Chaîne : Config → ProgrammeMatiere → MatiereNiveau → Affectation (deprecated)
            const coefficient = config?.coefficient ?? pm?.coefficient ?? matiereNiveau?.coefficient ?? aff.coefficient ?? 1;
            const volumeHoraireHebdo = config?.volumeHoraireHebdo ?? pm?.volumeHoraire ?? matiereNiveau?.volumeHoraire ?? null;

            return {
                ...aff,
                coefficient,
                volumeHoraireHebdo,
                effectifActuel: aff.classeAnnee?.effectifActuel ?? 0,
            };
        });
    }

    // ==== AFFECTATIONS PAR MATIERE ====

    async findAffectationsByMatiere(matiereId: string, etablissementId: string): Promise<AffectationMatiere[]> {
        return this.affectationRepo.find({
            where: { matiereId, etablissementId },
            relations: ['enseignant', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire'],
            order: { createdAt: 'DESC' },
        });
    }

    // ==== CONFIGURATIONS PAR MATIERE ====

    async findConfigurationsByMatiere(matiereId: string, etablissementId: string): Promise<ConfigurationMatiereClasse[]> {
        return this.configurationMatiereClasseRepo.find({
            where: { matiereId, etablissementId },
            relations: ['classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire'],
            order: { createdAt: 'DESC' },
        });
    }
}

export const matieresService = new MatieresService();
