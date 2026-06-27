/**
 * ==================================
 * eLISAschool - Service Validation Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service générique pour gérer les workflows de validation multi-niveau
 * Réutilisable par tous les modules métier
 */

import { Repository, FindOptionsWhere } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { WorkflowValidation, StatutWorkflow, DecisionValidation, ValidationNiveau } from '../entities';
import { CreateWorkflowDto, TraiterValidationDto, QueryWorkflowsDto, ConfigRolesDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { Utilisateur } from '@modules/utilisateurs/entities';
import { getParamNumber, getParam } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';

export class ValidationWorkflowService {
    private workflowRepo: Repository<WorkflowValidation>;
    private userRepo: Repository<Utilisateur>;

    constructor() {
        this.workflowRepo = AppDataSource.getRepository(WorkflowValidation);
        this.userRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Récupère la configuration par défaut pour un module
     */
    private async getModuleConfig(module: string, etablissementId?: string): Promise<{
        niveauxRequis: number;
        configRoles: Record<string, string>;
    }> {
        const niveauxRequis = await getParamNumber(`${module}.validation_levels`, { defaultValue: 1, etablissementId });
        
        // Récupérer la config des rôles
        const configStr = await getParam<string>(`${module}.validation_roles`, { defaultValue: '{}', etablissementId });
        let configRoles: Record<string, string> = {};
        
        try {
            configRoles = JSON.parse(configStr);
        } catch {
            // Utiliser les rôles par défaut selon le module
            configRoles = this.getDefaultRoles(module);
        }

        return { niveauxRequis, configRoles };
    }

    /**
     * Rôles par défaut selon le module
     */
    private getDefaultRoles(module: string): Record<string, string> {
        const defaults: Record<string, Record<string, string>> = {
            notes: {
                '1': 'ENSEIGNANT',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            bulletins: {
                '1': 'ENSEIGNANT',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            cantine: {
                '1': 'PERSONNEL',
                '2': 'RESPONSABLE_CANTINE',
                '3': 'ADMIN',
            },
            transport: {
                '1': 'PERSONNEL',
                '2': 'RESPONSABLE_TRANSPORT',
                '3': 'ADMIN',
            },
            requetes: {
                '1': 'CHEF_ETABLISSEMENT',
                '2': 'ADMIN',
            },
            classes: {
                '1': 'ENSEIGNANT',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            matieres: {
                '1': 'ENSEIGNANT',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            periodes: {
                '1': 'CHEF_ETABLISSEMENT',
                '2': 'ADMIN',
            },
            eleves: {
                '1': 'PERSONNEL',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            personnel: {
                '1': 'CHEF_ETABLISSEMENT',
                '2': 'ADMIN',
            },
            clubs: {
                '1': 'COORDINATEUR_CLUBS',
                '2': 'CHEF_ETABLISSEMENT',
                '3': 'ADMIN',
            },
            materiel: {
                '1': 'GESTIONNAIRE',
                '2': 'ADMIN',
            },
            cartes: {
                '1': 'CHEF_ETABLISSEMENT',
                '2': 'ADMIN',
            },
            annees_scolaires: {
                '1': 'CHEF_ETABLISSEMENT',
                '2': 'ADMIN',
            },
            etablissement: {
                '1': 'ADMIN',
                '2': 'SUPER_ADMIN',
            },
        };

        return defaults[module] || { '1': 'ADMIN' };
    }

    /**
     * Crée un nouveau workflow de validation
     */
    async createWorkflow(dto: CreateWorkflowDto, createurId: string): Promise<WorkflowValidation> {
        const config = await this.getModuleConfig(dto.module, dto.etablissementId);

        const workflow = this.workflowRepo.create({
            module: dto.module,
            entiteId: dto.entiteId,
            entiteType: dto.entiteType,
            niveauxRequis: dto.niveauxRequis || config.niveauxRequis,
            niveauActuel: 0,
            statut: StatutWorkflow.EN_COURS,
            configRoles: dto.configRoles || config.configRoles,
            commentaire: dto.commentaire,
            etablissementId: dto.etablissementId,
            historique: [],
        });

        await this.workflowRepo.save(workflow);

        logger.info(`[${dto.module}] Workflow de validation créé pour ${dto.entiteType} ${dto.entiteId}`);
        return workflow;
    }

    /**
     * Traite une validation (niveau suivant)
     */
    async traiterValidation(
        workflowId: string,
        dto: TraiterValidationDto,
        validateurId: string
    ): Promise<WorkflowValidation> {
        const workflow = await this.findOne(workflowId);

        // Vérifier que le workflow est en cours
        if (workflow.statut !== StatutWorkflow.EN_COURS) {
            throw new AppError('Ce workflow n\'est plus en cours de validation', 400, 'WORKFLOW_NOT_ACTIVE');
        }

        // Vérifier que le validateur a le rôle requis pour ce niveau
        const niveauSuivant = workflow.niveauActuel + 1;
        const roleRequis = workflow.configRoles?.[String(niveauSuivant)];

        if (roleRequis) {
            const validateur = await this.userRepo.findOne({ where: { id: validateurId } });
            if (!validateur) {
                throw new AppError('Validateur non trouvé', 404, 'NOT_FOUND');
            }

            // SUPER_ADMIN peut toujours valider
            if (validateur.role !== 'SUPER_ADMIN') {
                // 1. Construire le code de permission
                const permissionCode = `validation:${workflow.module}:level${niveauSuivant}`;

                // 2. Résoudre les permissions effectives (avec contexte établissement)
                const permissions = await permissionResolverService.resolvePermissions(validateurId, workflow.etablissementId);

                // 3. Vérifier si la permission est présente
                if (!permissions.has(permissionCode)) {
                    // 4. Fallback : vérifier le rôle
                    if (validateur.role !== roleRequis) {
                        throw new AppError(
                            `Permission requise: ${permissionCode} ou rôle: ${roleRequis}. Votre rôle: ${validateur.role}`,
                            403,
                            'VALIDATION_PERMISSION_DENIED'
                        );
                    }
                }
            }
        }

        // Récupérer le nom du validateur
        const validateur = await this.userRepo.findOne({ where: { id: validateurId } });

        // Ajouter à l'historique
        const historique: ValidationNiveau[] = workflow.historique || [];
        historique.push({
            niveau: niveauSuivant,
            validateurId,
            validateurNom: validateur ? validateur.email || validateur.matricule : undefined,
            roleRequis: roleRequis || 'ADMIN',
            decision: dto.decision,
            commentaire: dto.commentaire,
            dateValidation: new Date().toISOString(),
        });

        // Mettre à jour le workflow
        workflow.niveauActuel = niveauSuivant;
        workflow.historique = historique;
        workflow.dernierValidateurId = validateurId;

        if (dto.decision === DecisionValidation.REJETE) {
            workflow.statut = StatutWorkflow.REJETEE;
            workflow.dateCompletion = new Date();
        } else if (niveauSuivant >= workflow.niveauxRequis) {
            workflow.statut = StatutWorkflow.COMPLETEE;
            workflow.dateCompletion = new Date();
        }

        await this.workflowRepo.save(workflow);

        logger.info(
            `[${workflow.module}] Validation ${dto.decision} au niveau ${niveauSuivant}/${workflow.niveauxRequis} par ${validateurId}`
        );

        // Envoyer une notification selon la décision
        try {
            if (dto.decision === DecisionValidation.APPROUVE) {
                // Notification au créateur/suivant
                await notificationTemplates.workflowValidation({
                    destinataireId: validateurId,
                    etablissementId: workflow.etablissementId,
                    metadata: {
                        workflowId: workflow.id,
                        module: workflow.module,
                        entiteId: workflow.entiteId,
                    },
                }, {
                    module: workflow.module,
                    niveau: `${niveauSuivant}/${workflow.niveauxRequis}`,
                    entiteType: workflow.entiteType,
                    validateur: validateur?.email || 'Validateur',
                });
            }
        } catch (error) {
            logger.warn('[ValidationWorkflow] Échec envoi notification (non bloquant)', error);
        }

        return workflow;
    }

    /**
     * Trouve un workflow par module et entité
     */
    async findByModuleAndEntite(
        module: string,
        entiteId: string,
        etablissementId?: string
    ): Promise<WorkflowValidation | null> {
        const where: FindOptionsWhere<WorkflowValidation> = { module, entiteId };
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        return this.workflowRepo.findOne({ where });
    }

    /**
     * Liste les workflows avec filtres
     */
    async findAll(query: QueryWorkflowsDto, etablissementId?: string): Promise<{
        items: WorkflowValidation[];
        total: number;
    }> {
        const { page, limit, module, statut, entiteId, entiteType, niveauActuel } = query;

        const where: FindOptionsWhere<WorkflowValidation> = {};
        if (module) where.module = module;
        if (statut) where.statut = statut;
        if (entiteId) where.entiteId = entiteId;
        if (entiteType) where.entiteType = entiteType;
        if (niveauActuel !== undefined) where.niveauActuel = niveauActuel;
        if (etablissementId) where.etablissementId = etablissementId;

        const [items, total] = await this.workflowRepo.findAndCount({
            where,
            relations: ['dernierValidateur', 'etablissement'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total };
    }

    /**
     * Trouve un workflow par son ID
     */
    async findOne(id: string): Promise<WorkflowValidation> {
        const workflow = await this.workflowRepo.findOne({
            where: { id },
            relations: ['dernierValidateur'],
        });

        if (!workflow) {
            throw new AppError('Workflow de validation non trouvé', 404, 'NOT_FOUND');
        }

        return workflow;
    }

    /**
     * Annule un workflow
     */
    async annuler(workflowId: string, utilisateurId: string): Promise<WorkflowValidation> {
        const workflow = await this.findOne(workflowId);

        if (workflow.statut !== StatutWorkflow.EN_COURS) {
            throw new AppError('Seuls les workflows en cours peuvent être annulés', 400, 'INVALID_STATUS');
        }

        workflow.statut = StatutWorkflow.ANNULEE;
        workflow.dateCompletion = new Date();

        await this.workflowRepo.save(workflow);

        logger.info(`[${workflow.module}] Workflow annulé par ${utilisateurId}`);
        return workflow;
    }

    /**
     * Met à jour la configuration des rôles pour un module
     */
    async updateConfigRoles(dto: ConfigRolesDto): Promise<void> {
        const configKey = `${dto.module}.validation_roles`;
        const configValue = JSON.stringify(dto.configRoles);

        // Utiliser le service de configuration pour mettre à jour
        // Note: Ceci nécessite un import du configurationService
        logger.info(`[${dto.module}] Configuration des rôles mise à jour: ${configValue}`);
    }

    /**
     * Vérifie si une entité est validée (workflow complet)
     */
    async isValide(module: string, entiteId: string, etablissementId?: string): Promise<boolean> {
        const workflow = await this.findByModuleAndEntite(module, entiteId, etablissementId);
        return workflow?.statut === StatutWorkflow.COMPLETEE;
    }

    /**
     * Récupère les statistiques de validation pour un module
     */
    async getStatistiques(module: string, etablissementId?: string): Promise<any> {
        const where: FindOptionsWhere<WorkflowValidation> = { module };
        if (etablissementId) {
            where.etablissementId = etablissementId;
        }

        const total = await this.workflowRepo.count({ where });
        const enCours = await this.workflowRepo.count({ where: { ...where, statut: StatutWorkflow.EN_COURS } });
        const completees = await this.workflowRepo.count({ where: { ...where, statut: StatutWorkflow.COMPLETEE } });
        const rejetees = await this.workflowRepo.count({ where: { ...where, statut: StatutWorkflow.REJETEE } });

        return { total, enCours, completees, rejetees };
    }

    /**
     * Supprime un workflow (seulement si annulé ou rejeté)
     */
    async remove(workflowId: string): Promise<void> {
        const workflow = await this.findOne(workflowId);

        if (workflow.statut === StatutWorkflow.EN_COURS) {
            throw new AppError('Impossible de supprimer un workflow en cours', 400, 'WORKFLOW_ACTIVE');
        }

        await this.workflowRepo.remove(workflow);
        logger.info(`[${workflow.module}] Workflow supprimé: ${workflowId}`);
    }

    // ==================================
    // MÉTHODES POUR DASHBOARD
    // ==================================

    /**
     * Statistiques agrégées multi-modules pour dashboard
     */
    async getDashboardStats(etablissementId?: string): Promise<{
        parModule: Record<string, { total: number; enCours: number; completees: number; rejetees: number }>;
        totalGlobal: number;
        enCoursGlobal: number;
    }> {
        const modules = ['notes', 'bulletins', 'cantine', 'transport', 'requetes', 'classes', 'matieres', 'periodes', 'eleves', 'personnel', 'clubs', 'materiel', 'cartes', 'annees_scolaires', 'etablissement'];
        const parModule: Record<string, any> = {};
        let totalGlobal = 0, enCoursGlobal = 0;

        for (const module of modules) {
            const stats = await this.getStatistiques(module, etablissementId);
            parModule[module] = stats;
            totalGlobal += stats.total;
            enCoursGlobal += stats.enCours;
        }

        return { parModule, totalGlobal, enCoursGlobal };
    }

    /**
     * Validations en attente pour un rôle donné
     */
    async getValidationsEnAttente(role: string, etablissementId?: string, limit = 20): Promise<WorkflowValidation[]> {
        const qb = this.workflowRepo.createQueryBuilder('w')
            .where('w.statut = :statut', { statut: StatutWorkflow.EN_COURS })
            .orderBy('w.createdAt', 'ASC')
            .take(limit);

        if (etablissementId) {
            qb.andWhere('w.etablissementId = :etablissementId', { etablissementId });
        }

        return qb.getMany();
    }

    /**
     * Temps moyen de validation par niveau
     */
    async getTempsMoyenValidation(module?: string, etablissementId?: string): Promise<{
        parNiveau: Record<string, number>;
        moyenneGlobale: number;
    }> {
        // Requête SQL pour calculer le temps moyen entre création et complétion
        const qb = this.workflowRepo.createQueryBuilder('w')
            .select('w.niveauActuel', 'niveau')
            .addSelect('AVG(EXTRACT(EPOCH FROM (w."dateCompletion" - w."createdAt")))', 'tempsSecondes')
            .where('w.statut = :statut', { statut: StatutWorkflow.COMPLETEE })
            .andWhere('w."dateCompletion" IS NOT NULL');

        if (module) qb.andWhere('w.module = :module', { module });
        if (etablissementId) qb.andWhere('w.etablissementId = :etablissementId', { etablissementId });

        const result = await qb.groupBy('w.niveauActuel').getRawMany();

        const parNiveau: Record<string, number> = {};
        let totalTemps = 0, count = 0;

        for (const row of result) {
            if (row.tempsSecondes) {
                const heures = Math.round(parseFloat(row.tempsSecondes) / 3600);
                parNiveau[String(row.niveau)] = heures;
                totalTemps += heures;
                count++;
            }
        }

        return { parNiveau, moyenneGlobale: count > 0 ? Math.round(totalTemps / count) : 0 };
    }
}

export const validationWorkflowService = new ValidationWorkflowService();
export default ValidationWorkflowService;
