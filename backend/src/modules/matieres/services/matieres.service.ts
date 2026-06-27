/**
 * ==================================
 * eLISAschool - Service Matières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Support multi-tenant avec etablissementId
 * - Toutes les requêtes filtrées par établissement
 * - Unicité des matières par établissement
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Matiere, GroupeMatiere, MatiereNiveau, AffectationMatiere, ConfigurationMatiereClasse, StatutAffectationMatiere, StatutMatiereNiveau, StatutConfigurationMatiereClasse } from '../entities';
import { CreateMatiereDto, UpdateMatiereDto, CreateGroupeMatiereDto, CreateMatiereNiveauDto, UpdateMatiereNiveauDto, AffecterEnseignantDto, QueryMatieresDto, CreateConfigurationMatiereClasseDto, UpdateConfigurationMatiereClasseDto } from '../dto';
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
    private configurationMatiereClasseRepo: Repository<ConfigurationMatiereClasse>;

    constructor() {
        this.matiereRepo = AppDataSource.getRepository(Matiere);
        this.groupeRepo = AppDataSource.getRepository(GroupeMatiere);
        this.niveauRepo = AppDataSource.getRepository(MatiereNiveau);
        this.affectationRepo = AppDataSource.getRepository(AffectationMatiere);
        this.configurationMatiereClasseRepo = AppDataSource.getRepository(ConfigurationMatiereClasse);
    }

    // ==== MATIERES ====

    /**
     * Créer une matière (isolée par établissement)
     */
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

    /**
     * Rechercher toutes les matières avec pagination (filtré par établissement)
     */
    async findAll(query: QueryMatieresDto = {}, etablissementId: string): Promise<PaginatedResult<Matiere>> {
        const { page = 1, limit = 20, groupeId, actif } = query;

        const where: any = { etablissementId };
        
        if (groupeId) {
            where.groupeId = groupeId;
        }

        if (actif !== undefined) {
            where.actif = actif;
        }

        return paginateWithRepository(this.matiereRepo, {
            where,
            order: { nom: 'ASC' },
            page,
            limit,
        });
    }

    /**
     * Mettre à jour une matière (vérification appartenance établissement)
     */
    async update(id: string, dto: UpdateMatiereDto, etablissementId: string): Promise<Matiere> {
        const matiere = await this.matiereRepo.findOne({ 
            where: { id, etablissementId } 
        });
        if (!matiere) throw new AppError('Matière non trouvée', 404, 'NOT_FOUND');
        Object.assign(matiere, dto);
        await this.matiereRepo.save(matiere);
        return matiere;
    }

    /**
     * Supprimer une matière (vérification appartenance établissement)
     */
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

    /**
     * Rechercher tous les groupes avec pagination
     */
    async findAllGroupes(page: number = 1, limit: number = 20): Promise<PaginatedResult<GroupeMatiere>> {
        return paginateWithRepository(this.groupeRepo, {
            order: { ordre: 'ASC' },
            page,
            limit,
        });
    }

    // ==== PROGRAMME (Matière-Niveau) ====

    async addMatiereToNiveau(dto: CreateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const existing = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: dto.niveauId }
        });
        if (existing) throw new AppError('Matière déjà dans ce niveau', 409, 'MATIERE_IN_LEVEL_EXISTS');

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('matieres.require_validation', false);

        const prog = this.niveauRepo.create({
            ...dto,
            statut: requireValidation
                ? StatutMatiereNiveau.EN_ATTENTE_VALIDATION
                : StatutMatiereNiveau.ACTIF,
        });
        await this.niveauRepo.save(prog);

        // Créer un workflow de validation si requis
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

    async getProgrammeNiveau(niveauId: string): Promise<MatiereNiveau[]> {
        return this.niveauRepo.find({
            where: { niveauId },
            relations: ['matiere', 'groupe'],
            order: { groupe: { ordre: 'ASC' }, matiere: { nom: 'ASC' } }
        });
    }

    async updateProgramme(id: string, dto: UpdateMatiereNiveauDto, createurId: string, etablissementId?: string): Promise<MatiereNiveau> {
        const prog = await this.niveauRepo.findOne({ where: { id } });
        if (!prog) throw new AppError('Programme non trouvé', 404, 'NOT_FOUND');
        Object.assign(prog, dto);
        await this.niveauRepo.save(prog);

        // Créer un workflow de validation si requis (pour suivi des modifications)
        const requireValidation = await getParamBoolean('matieres.require_validation', false);
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
        // Récupérer la classe/année et le niveau
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.classeAnneeId },
            relations: ['classe', 'anneeScolaire']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        // Vérifier si matière est enseignée dans ce niveau (programme)
        const prog = await this.niveauRepo.findOne({
            where: { matiereId: dto.matiereId, niveauId: classeAnnee.classe.niveauId }
        });
        // Warning: Pas obligatoire que ce soit dans le programme pour être enseigné ? Si, logiquement.
        if (!prog) throw new AppError('Cette matière n\'est pas au programme de ce niveau', 400, 'MATIERE_NOT_IN_LEVEL');

        // Vérifier si la validation est requise
        const requireValidation = await getParamBoolean('matieres.require_validation', false);

        // Vérifier doublons
        const existing = await this.affectationRepo.findOne({
            where: {
                matiereId: dto.matiereId,
                classeAnneeId: dto.classeAnneeId
            }
        });

        if (existing) {
            existing.enseignantId = dto.enseignantId; // Mise à jour de l'enseignant
            if (dto.volumeHoraireHebdo) existing.volumeHoraireHebdo = dto.volumeHoraireHebdo;
            existing.statut = requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE;
            await this.affectationRepo.save(existing);

            // Créer un workflow si requis
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
            volumeHoraireHebdo: dto.volumeHoraireHebdo,
            statut: requireValidation
                ? StatutAffectationMatiere.EN_ATTENTE_VALIDATION
                : StatutAffectationMatiere.ACTIVE,
        });
        await this.affectationRepo.save(affectation);

        // Créer un workflow de validation si requis
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

    // ==== CONFIGURATION MATIERE CLASSE ====

    /**
     * Créer une configuration matière pour une classe
     */
    async createConfigurationMatiereClasse(
        dto: CreateConfigurationMatiereClasseDto,
        createurId?: string,
        etablissementId?: string
    ): Promise<ConfigurationMatiereClasse> {
        // Récupérer la classe/année pour avoir le niveau
        const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
        const classeAnnee = await classeAnneeRepo.findOne({
            where: { id: dto.classeAnneeId },
            relations: ['classe']
        }) as any;

        if (!classeAnnee) {
            throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
        }

        // Vérifier l'unicité
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

        // Vérifier que le MatiereNiveau existe (pour héritage)
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

        // Workflow de validation si activé
        if (createurId && etablissementId) {
            const requireValidation = await getParamBoolean('matieres.require_validation', false);

            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'matieres',
                    entiteId: config.id,
                    entiteType: 'ConfigurationMatiereClasse',
                    niveauxRequis: 2,
                    etablissementId,
                }, createurId);

                logger.info(`[${etablissementId}] Configuration matière-classe créée en attente de validation: ${config.matiereId} → ${config.classeId}`);
            } else {
                logger.info(`Configuration matière-classe créée: ${config.matiereId} → ${config.classeId}`);
            }
        }

        return config;
    }

    /**
     * Lister les configurations matière-classe
     */
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

    /**
     * Trouver une configuration matière-classe par ID
     */
    async findOneConfigurationMatiereClasse(id: string): Promise<ConfigurationMatiereClasse> {
        const config = await this.configurationMatiereClasseRepo.findOne({
            where: { id },
            relations: ['matiere', 'classe', 'anneeScolaire', 'etablissement'],
        });

        if (!config) {
            throw new AppError('Configuration matière-classe non trouvée', 404, 'NOT_FOUND');
        }

        return config;
    }

    /**
     * Mettre à jour une configuration matière-classe
     */
    async updateConfigurationMatiereClasse(
        id: string,
        dto: UpdateConfigurationMatiereClasseDto
    ): Promise<ConfigurationMatiereClasse> {
        const config = await this.findOneConfigurationMatiereClasse(id);

        Object.assign(config, dto);
        await this.configurationMatiereClasseRepo.save(config);

        logger.info(`Configuration matière-classe mise à jour: ${config.matiereId} → ${config.classeId}`);
        return config;
    }

    /**
     * Supprimer une configuration matière-classe
     */
    async deleteConfigurationMatiereClasse(id: string): Promise<void> {
        const config = await this.findOneConfigurationMatiereClasse(id);

        // Vérifier qu'il n'y a pas d'affectations liées
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
        logger.info(`Configuration matière-classe supprimée: ${config.matiereId} → ${config.classeId}`);
    }

    /**
     * Obtenir la configuration effective d'une matière pour une classe
     * (avec héritage depuis MatiereNiveau si override NULL)
     */
    async getConfigurationEffective(
        matiereId: string,
        classeId: string,
        anneeScolaireId: string,
        etablissementId: string
    ): Promise<{
        coefficient: number;
        bareme: number;
        volumeHoraire: number | null;
        credits: number | null;
        obligatoire: boolean;
    }> {
        // 1. Chercher la configuration spécifique
        const config = await this.configurationMatiereClasseRepo.findOne({
            where: {
                matiereId,
                classeId,
                anneeScolaireId,
                etablissementId,
            },
            relations: ['classe', 'classe.niveau'],
        });

        // 2. Récupérer le MatiereNiveau (fallback)
        const niveauId = config?.classe?.niveauId || (await classesService.findById(classeId)).niveauId;
        const matiereNiveau = await this.niveauRepo.findOne({
            where: {
                matiereId,
                niveauId,
            },
        });

        if (!matiereNiveau) {
            throw new AppError(
                'Programme matière-niveau non trouvé',
                404,
                'MATIERE_NIVEAU_NOT_FOUND'
            );
        }

        // 3. Appliquer l'héritage (override si config existe, sinon fallback)
        return {
            coefficient: config?.coefficient ?? matiereNiveau.coefficient,
            bareme: config?.bareme ?? matiereNiveau.bareme,
            volumeHoraire: config?.volumeHoraireHebdo ?? matiereNiveau.volumeHoraire,
            credits: config?.credits ?? matiereNiveau.credits,
            obligatoire: config?.obligatoire ?? matiereNiveau.obligatoire,
        };
    }
}

export const matieresService = new MatieresService();
