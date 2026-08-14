/**
 * ==================================
 * eLISAschool - Service Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Etablissement, EtablissementConfig, StatutEtablissement } from '../entities';
import { CreateEtablissementDto, UpdateEtablissementDto, UpdateEtablissementConfigDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { getParamBoolean } from '@modules/configuration/utils/config.helper';
import { StatutPersonnel } from '@modules/personnel/entities';
import { redimensionnerLogo } from '@common/utils/image-processor.util';
import { auditService, AuditAction } from '@modules/auth';
import { santeEtablissementService } from './sante-etablissement.service';
import { cmsTemplateService } from '@modules/cms/services/cms-template.service';
import { AbonnementClient, StatutAbonnement, CycleFacturation } from '@modules/billing/entities/abonnement-client.entity';
import { PlanAbonnement } from '@modules/billing/entities/plan-abonnement.entity';

export interface EtablissementStats {
    totalEtablissements: number;
    etablissementsActifs: number;
    etablissementsInactifs: number;
    parSousSysteme: Record<string, number>;
    parType: Record<string, number>;
}

export interface EtablissementDetailStats {
    etablissementId: string;
    nomEtablissement: string;
    nombreClasses: number;
    nombreEleves: number;
    nombrePersonnel: number;
    nombreNiveaux: number;
    tauxOccupation: number; // effectifActuel / effectifMax * 100
    config: {
        cyclesActifs: number;
        modulesActifs: number;
        planAbonnement?: string;
    };
}

export class EtablissementService {
    private etablissementRepo: Repository<Etablissement>;
    private configRepo: Repository<EtablissementConfig>;

    constructor() {
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.configRepo = AppDataSource.getRepository(EtablissementConfig);
    }

    // ==================================
    // CRUD Établissements
    // ==================================

    /**
     * Crée un nouvel établissement avec sa configuration par défaut
     */
    async create(dto: CreateEtablissementDto, createurId?: string): Promise<Etablissement> {
        const requireValidation = await getParamBoolean('etablissement.require_validation', { defaultValue: false });

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const etablissement = this.etablissementRepo.create({
                ...dto,
                actif: !requireValidation,
                statut: requireValidation ? StatutEtablissement.EN_ATTENTE_VALIDATION : StatutEtablissement.ACTIF,
            });
            await queryRunner.manager.save(etablissement);

            // Création automatique de la configuration par défaut
            const config = this.configRepo.create({
                etablissementId: etablissement.id,
            });
            await queryRunner.manager.save(config);

            // --- P1.1 — Auto-création abonnement période d'essai (14 jours) ---
            try {
                const planRepo = queryRunner.manager.getRepository(PlanAbonnement);
                const planStarter = await planRepo.findOne({ where: { slug: 'starter' } });
                if (planStarter) {
                    const maintenant = new Date();
                    const periodeEssaiFin = new Date(maintenant);
                    periodeEssaiFin.setDate(periodeEssaiFin.getDate() + 14);

                    const abonnementEssai = queryRunner.manager.create(AbonnementClient, {
                        etablissementId: etablissement.id,
                        planId: planStarter.id,
                        dateDebut: maintenant,
                        dateFin: periodeEssaiFin,
                        statut: StatutAbonnement.ESSAI,
                        cycleFacturation: CycleFacturation.MENSUEL,
                        autoRenouvellement: false,
                        montantMensuel: 0,
                        nombreElevesActuel: 0,
                        periodeEssaiFin,
                    });
                    await queryRunner.manager.save(abonnementEssai);
                    logger.info(`[Essai] Abonnement 14 jours créé pour ${dto.nom} (jusqu'au ${periodeEssaiFin.toISOString().split('T')[0]})`);
                }
            } catch (essaiError) {
                // Non-bloquant : l'essai est un best-effort
                logger.warn(`[Essai] Auto-création échouée pour ${dto.nom}: ${(essaiError as Error).message}`);
            }

            await queryRunner.commitTransaction();

            // Créer le workflow de validation si requis
            if (requireValidation && createurId) {
                await validationWorkflowService.createWorkflow({
                    module: 'etablissement',
                    entiteId: etablissement.id,
                    entiteType: 'Etablissement',
                    niveauxRequis: 2,
                    etablissementId: etablissement.id,
                    commentaire: `Création établissement: ${dto.nom}`,
                }, createurId);
            }

            await auditService.log({
                utilisateurId: createurId,
                action: AuditAction.ETABLISSEMENT_CREATE,
                cible: 'Etablissement',
                cibleId: etablissement.id,
                description: requireValidation
                    ? `Création établissement en attente de validation: ${dto.nom}`
                    : `Création établissement: ${dto.nom}`,
                nouvellesValeurs: dto as unknown as Record<string, unknown>,
                module: 'etablissement',
                metadata: { entiteLabel: etablissement.nom, entiteRef: etablissement.codeEtablissement },
            });

            logger.info(`Établissement créé: ${dto.nom} (${etablissement.id})`);

            // Auto-initialisation CMS (thème + pages + menus par défaut) — best effort
            cmsTemplateService.initialiserCmsEtablissement(etablissement.id).catch(err => {
                logger.warn(`[CMS] Auto-initialisation échouée pour ${dto.nom}: ${err.message}`);
            });

            return etablissement;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`Erreur création établissement: ${error.message || error}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Retourne tous les établissements (actifs ou non)
     */
    async findAll(actifOnly: boolean = false): Promise<Etablissement[]> {
        const where: any = {};
        if (actifOnly) where.actif = true;

        return this.etablissementRepo.find({
            where,
            relations: ['configuration'],
            order: { nom: 'ASC' },
        });
    }

    /**
     * Retourne les établissements avec pagination et filtres (pour la plateforme)
     * Enrichit chaque établissement avec son score de santé (scoreSante).
     */
    async findPaginated(options: {
        page?: number;
        limit?: number;
        recherche?: string;
        statut?: string;
        type?: string;
        plan?: string;
        sousSysteme?: string;
        sortBy?: string;
        sortOrder?: 'ASC' | 'DESC';
        inclureSante?: boolean;
    }): Promise<{ data: (Etablissement & { scoreSante?: { score: number; categorie: string } })[]; meta: { totalItems: number; currentPage: number; totalPages: number; itemsPerPage: number } }> {
        const { page = 1, limit = 20, recherche, statut, type, plan, sousSysteme, sortBy = 'nom', sortOrder = 'ASC', inclureSante = false } = options;
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const offset = (page - 1) * safeLimit;

        const qb = this.etablissementRepo.createQueryBuilder('e')
            .leftJoinAndSelect('e.configuration', 'config');

        // Filtre recherche
        if (recherche) {
            qb.andWhere(
                '(e.nom ILIKE :recherche OR e.ville ILIKE :recherche OR e.codeEtablissement ILIKE :recherche)',
                { recherche: `%${recherche}%` },
            );
        }

        // Filtre statut
        if (statut) {
            qb.andWhere('e.statut = :statut', { statut });
        }

        // Filtre type
        if (type) {
            qb.andWhere('e.type = :type', { type });
        }

        // Filtre plan d'abonnement
        if (plan) {
            qb.andWhere('config."planAbonnement" = :plan', { plan });
        }

        // Filtre sous-système
        if (sousSysteme) {
            qb.andWhere('e.sousSysteme = :sousSysteme', { sousSysteme });
        }

        // Tri
        const validSortColumns = ['nom', 'ville', 'createdAt', 'statut', 'type', 'sousSysteme', 'effectifActuel', 'effectifMax'];
        const validConfigSortColumns = ['planAbonnement'];
        const sortDir = sortOrder === 'DESC' ? 'DESC' : 'ASC';

        // Tri natif par scoreSante via LEFT JOIN sur dernière entrée historique
        if (sortBy === 'scoreSante') {
            qb.leftJoin(
                '(SELECT DISTINCT ON ("etablissementId") "etablissementId", score FROM historique_score_sante ORDER BY "etablissementId", "createdAt" DESC)',
                'sante_latest',
                'sante_latest."etablissementId" = e.id',
            );
            qb.orderBy('sante_latest.score', sortDir, 'NULLS LAST');
        } else if (sortBy && validConfigSortColumns.includes(sortBy)) {
            qb.orderBy(`config."${sortBy}"`, sortDir);
        } else {
            const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'nom';
            qb.orderBy(`e.${sortCol}`, sortDir);
        }

        // Pagination
        const [data, totalItems] = await qb
            .take(safeLimit)
            .skip(offset)
            .getManyAndCount();

        // Enrichir avec les scores de santé (non-bloquant)
        let result = data as (Etablissement & { scoreSante?: { score: number; categorie: string } })[];
        if (inclureSante && data.length > 0) {
            try {
                const scores = await santeEtablissementService.calculerScoresTous();
                const scoreMap = new Map(scores.map(s => [s.etablissementId, { score: s.score, categorie: s.categorie }]));
                result = data.map(e => ({
                    ...e,
                    scoreSante: scoreMap.get(e.id) || { score: 0, categorie: 'critique' },
                }));
            } catch {
                // Non-bloquant : si le calcul échoue, retourner sans scores
            }
        }

        return {
            data: result,
            meta: {
                totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / safeLimit),
                itemsPerPage: safeLimit,
            },
        };
    }

    /**
     * Retourne un établissement par son ID
     */
    async findOne(id: string, includeLogo: boolean = false): Promise<Etablissement & { logoUrl?: string }> {
        const etablissement = await this.etablissementRepo.findOne({
            where: { id },
            relations: ['configuration'],
        });
        if (!etablissement) {
            throw new AppError('Établissement non trouvé', 404, 'ETABLISSEMENT_NOT_FOUND');
        }
        
        // Si includeLogo est true, charger le logoBase64 séparément
        const result = etablissement as any;
        if (includeLogo) {
            const withLogo = await this.etablissementRepo.findOne({
                where: { id },
                select: ['id', 'logoBase64'],
            });
            if (withLogo?.logoBase64) {
                result.logoUrl = withLogo.logoBase64;
            }
        }
        
        return result;
    }

    /**
     * Met à jour un établissement
     */
    async update(id: string, dto: UpdateEtablissementDto, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const anciennesValeurs = {
            nom: etablissement.nom,
            code: (etablissement as any).codeEtablissement,
            actif: etablissement.actif,
            statut: etablissement.statut,
        };
        Object.assign(etablissement, dto);
        await this.etablissementRepo.save(etablissement);

        await auditService.log({
            utilisateurId: createurId,
            action: AuditAction.ETABLISSEMENT_UPDATE,
            cible: 'Etablissement',
            cibleId: etablissement.id,
            description: `Mise à jour établissement: ${etablissement.nom}`,
            anciennesValeurs,
            nouvellesValeurs: dto as unknown as Record<string, unknown>,
            module: 'etablissement',
            metadata: { entiteLabel: etablissement.nom, entiteRef: (etablissement as any).codeEtablissement },
        });

        logger.info(`Établissement mis à jour: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    /**
     * Désactive un établissement (suppression logique)
     * Empêche la suppression physique pour préserver l'intégrité des données
     */
    async desactiver(id: string, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const requireValidation = await getParamBoolean('etablissement.require_validation', { defaultValue: false });

        if (requireValidation && createurId) {
            // Ne PAS désactiver, mettre en attente
            etablissement.statut = StatutEtablissement.EN_ATTENTE_DESACTIVATION;
            await this.etablissementRepo.save(etablissement);

            await validationWorkflowService.createWorkflow({
                module: 'etablissement',
                entiteId: id,
                entiteType: 'Etablissement',
                niveauxRequis: 2,
                etablissementId: id,
                commentaire: `Demande de désactivation: ${etablissement.nom}`,
            }, createurId);

            logger.info(`Désactivation en attente de validation: ${etablissement.nom} (${id})`);
            return etablissement;
        }

        // Désactivation logique au lieu de suppression physique
        etablissement.actif = false;
        etablissement.statut = StatutEtablissement.INACTIF;
        await this.etablissementRepo.save(etablissement);

        logger.info(`Établissement désactivé: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    /**
     * Réactive un établissement
     */
    async activer(id: string, createurId?: string): Promise<Etablissement> {
        const etablissement = await this.findOne(id);
        const requireValidation = await getParamBoolean('etablissement.require_validation', { defaultValue: false });

        if (requireValidation && createurId) {
            // Ne PAS activer, mettre en attente
            etablissement.statut = StatutEtablissement.EN_ATTENTE_VALIDATION;
            await this.etablissementRepo.save(etablissement);

            await validationWorkflowService.createWorkflow({
                module: 'etablissement',
                entiteId: id,
                entiteType: 'Etablissement',
                niveauxRequis: 2,
                etablissementId: id,
                commentaire: `Demande de réactivation: ${etablissement.nom}`,
            }, createurId);

            logger.info(`Réactivation en attente de validation: ${etablissement.nom} (${id})`);
            return etablissement;
        }

        etablissement.actif = true;
        etablissement.statut = StatutEtablissement.ACTIF;
        await this.etablissementRepo.save(etablissement);

        logger.info(`Établissement réactivé: ${etablissement.nom} (${id})`);
        return etablissement;
    }

    // ==================================
    // Actions en masse (Bulk)
    // ==================================

    /**
     * Active plusieurs établissements en une seule opération.
     * Utilise une transaction pour garantir l'atomicité.
     */
    async bulkActiver(ids: string[], createurId?: string): Promise<{ ids: string[]; count: number }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const results: string[] = [];
            for (const id of ids) {
                const etablissement = await queryRunner.manager.findOne(Etablissement, { where: { id } });
                if (!etablissement) continue;
                etablissement.actif = true;
                etablissement.statut = StatutEtablissement.ACTIF;
                await queryRunner.manager.save(etablissement);
                results.push(id);
            }

            await queryRunner.commitTransaction();
            logger.info(`Bulk activer: ${results.length}/${ids.length} établissements activés (par ${createurId || 'système'})`);
            return { ids: results, count: results.length };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Désactive plusieurs établissements en une seule opération.
     * Utilise une transaction pour garantir l'atomicité.
     */
    async bulkDesactiver(ids: string[], createurId?: string): Promise<{ ids: string[]; count: number }> {
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const results: string[] = [];
            for (const id of ids) {
                const etablissement = await queryRunner.manager.findOne(Etablissement, { where: { id } });
                if (!etablissement) continue;
                etablissement.actif = false;
                etablissement.statut = StatutEtablissement.INACTIF;
                await queryRunner.manager.save(etablissement);
                results.push(id);
            }

            await queryRunner.commitTransaction();
            logger.info(`Bulk désactiver: ${results.length}/${ids.length} établissements désactivés (par ${createurId || 'système'})`);
            return { ids: results, count: results.length };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ==================================
    // Configuration par établissement
    // ==================================

    /**
     * Récupère la configuration d'un établissement spécifique
     */
    async getConfig(etablissementId: string): Promise<EtablissementConfig> {
        const config = await this.configRepo.findOne({
            where: { etablissementId },
            relations: ['etablissement'],
        });

        if (!config) {
            throw new AppError('Configuration non trouvée pour cet établissement', 404, 'CONFIG_NOT_FOUND');
        }

        return config;
    }

    /**
     * Configuration complète d'un établissement (Control Plane).
     * Enrichit la config de base avec les modules actifs et le catalogue.
     */
    async getConfigComplete(etablissementId: string): Promise<{
        config: EtablissementConfig;
        modulesActifs: { code: string; nom: string; actif: boolean; categorie: string }[];
        resume: {
            totalModulesActifs: number;
            totalModulesCatalogue: number;
            cyclesActifsCount: number;
        };
    }> {
        // 1. Config de base
        const config = await this.getConfig(etablissementId);

        // 2. Catalogue complet des modules
        const catalogueRepo = AppDataSource.getRepository('ModuleCatalogue');
        const catalogue = await catalogueRepo.find({
            where: { estActif: true },
            order: { code: 'ASC' },
        });

        // 3. Vérifier quels modules sont actifs pour cet établissement
        const parametreRepo = AppDataSource.getRepository('ParametreSysteme');
        const parametresModules = await parametreRepo
            .createQueryBuilder('p')
            .where('p.cle LIKE :pattern', { pattern: '%.actif' })
            .andWhere('(p."etablissementId" IS NULL OR p."etablissementId" = :etabId)', { etabId: etablissementId })
            .getMany();

        // Construire une map des overrides établissement
        const overridesEtab = new Map<string, string>();
        const valeursGlobales = new Map<string, string>();
        for (const p of parametresModules) {
            const cle = p.cle as string;
            if (p.etablissementId) {
                overridesEtab.set(cle, p.valeur as string);
            } else {
                valeursGlobales.set(cle, p.valeur as string);
            }
        }

        // 4. Résoudre l'état actif de chaque module
        const modulesActifs = catalogue.map((mod: any) => {
            const cle = `${mod.code}.actif`;
            const valeurOverride = overridesEtab.get(cle);
            const valeurGlobale = valeursGlobales.get(cle);
            const valeurEffective = valeurOverride ?? valeurGlobale;
            const actif = valeurEffective !== undefined
                ? valeurEffective === 'true'
                : (mod.actifParDefaut ?? false);

            return {
                code: mod.code,
                nom: mod.nom || mod.code,
                actif,
                categorie: mod.categorie || 'AUTRE',
            };
        });

        const totalModulesActifs = modulesActifs.filter(m => m.actif).length;

        return {
            config,
            modulesActifs,
            resume: {
                totalModulesActifs,
                totalModulesCatalogue: catalogue.length,
                cyclesActifsCount: config.cyclesActifs?.length || 0,
            },
        };
    }

    /**
     * Met à jour la configuration d'un établissement
     */
    async updateConfig(etablissementId: string, dto: UpdateEtablissementConfigDto): Promise<EtablissementConfig> {
        let config = await this.configRepo.findOne({ where: { etablissementId } });

        if (!config) {
            // Création automatique si elle n'existe pas
            config = this.configRepo.create({ etablissementId, cyclesActifs: [] });
        }

        Object.assign(config, dto);

        if (dto.cyclesActifs) {
            config.cyclesActifs = dto.cyclesActifs;
        }

        await this.configRepo.save(config);
        logger.info(`Configuration mise à jour pour établissement ${etablissementId}`);
        return config;
    }

    // ==================================
    // Statistiques
    // ==================================

    /**
     * Statistiques globales pour la page plateforme établissements.
     * Retourne le format attendu par le frontend :
     * { total, actifs, suspendus, enEssai, totalEleves, totalUtilisateurs, sante, scoreMoyen }
     * 
     * La santé est calculée par le service SanteEtablissement (score composite 0-100).
     */
    async getStats(): Promise<{
        total: number;
        actifs: number;
        suspendus: number;
        enEssai: number;
        totalEleves: number;
        totalUtilisateurs: number;
        sante: { sains: number; attention: number; critiques: number };
        scoreMoyen: number;
        distributionPlans: { plan: string; count: number }[];
        distributionTypes: { type: string; count: number }[];
    }> {
        const tous = await this.etablissementRepo.find({ relations: ['configuration'] });

        // Comptages parallèles pour les agrégats
        const [totalEleves, totalUtilisateurs, abonnementCounts, resumeSante] = await Promise.all([
            AppDataSource.getRepository('Eleve').count({ where: { statut: 'ACTIF' } }),
            AppDataSource.getRepository('Utilisateur').count({ where: { statut: 'ACTIF' } }),
            AppDataSource.getRepository('AbonnementClient')
                .createQueryBuilder('a')
                .select('a.statut', 'statut')
                .addSelect('COUNT(*)', 'count')
                .groupBy('a.statut')
                .getRawMany() as Promise<Array<{ statut: string; count: string }>>,
            santeEtablissementService.getResumeSante(),
        ]);

        // Agrégats abonnements
        const statutCounts: Record<string, number> = {};
        for (const row of abonnementCounts) {
            statutCounts[row.statut] = parseInt(row.count, 10);
        }

        const suspendus = statutCounts['SUSPENDU'] || 0;
        const enEssai = statutCounts['EN_ATTENTE'] || 0;

        // Distribution des plans (via configuration)
        const planCounts = new Map<string, number>();
        for (const e of tous) {
            const plan = (e as any).configuration?.planAbonnement || 'gratuit';
            planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
        }
        const distributionPlans = Array.from(planCounts.entries())
            .map(([plan, count]) => ({ plan, count }))
            .sort((a, b) => b.count - a.count);

        // Distribution des types
        const typeCounts = new Map<string, number>();
        for (const e of tous) {
            const type = e.type || 'AUTRE';
            typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        }
        const distributionTypes = Array.from(typeCounts.entries())
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count);

        return {
            total: tous.length,
            actifs: tous.filter(e => e.actif).length,
            suspendus,
            enEssai,
            totalEleves,
            totalUtilisateurs,
            sante: {
                sains: resumeSante.sains,
                attention: resumeSante.attention,
                critiques: resumeSante.critiques,
            },
            scoreMoyen: resumeSante.scoreMoyen,
            distributionPlans,
            distributionTypes,
        };
    }

    /**
     * Statistiques détaillées d'un établissement
     */
    async getEtablissementStats(etablissementId: string): Promise<EtablissementDetailStats> {
        const etablissement = await this.findOne(etablissementId);
        const config = await this.getConfig(etablissementId).catch(() => null);

        // Compter les classes
        const classesRepo = AppDataSource.getRepository('Classe');
        const nombreClasses = await classesRepo.count({
            where: { etablissementId },
        });

        // Compter les élèves
        const affectationRepo = AppDataSource.getRepository('AffectationEleve');
        const nombreEleves = await affectationRepo.count({
            where: { 
                classe: {
                    etablissementId
                },
                actif: true
            },
            relations: ['classe'],
        });

        // Compter le personnel
        const membreRepo = AppDataSource.getRepository('MembrePersonnel');
        const nombrePersonnel = await membreRepo.count({
            where: { 
                etablissementId, 
                statut: StatutPersonnel.ACTIF
            },
        });

        // Compter les niveaux (via les classes)
        const niveaux = new Set<string>();
        const classes = await classesRepo.find({
            where: { etablissementId },
            relations: ['niveau'],
            select: ['niveauId'],
        });
        classes.forEach(c => {
            if (c.niveauId) niveaux.add(c.niveauId);
        });

        // Taux d'occupation
        const tauxOccupation = etablissement.effectifMax
            ? Math.round((etablissement.effectifActuel / etablissement.effectifMax) * 100)
            : 0;

        return {
            etablissementId,
            nomEtablissement: etablissement.nom,
            nombreClasses,
            nombreEleves,
            nombrePersonnel,
            nombreNiveaux: niveaux.size,
            tauxOccupation,
            config: {
                cyclesActifs: config?.cyclesActifs?.length || 0,
                modulesActifs: 0, // modulesActifs migré vers ParametreSysteme (v3.0+)
                planAbonnement: config?.planAbonnement,
            },
        };
    }

    // ==================================
    // Utilisateurs liés à un établissement (Control Plane)
    // ==================================

    /**
     * Résumé des utilisateurs liés à un établissement.
     * Retourne le total, la répartition par rôle, et les 20 derniers utilisateurs.
     */
    async getUtilisateursResume(etablissementId: string): Promise<{
        total: number;
        actifs: number;
        parRole: { role: string; code: string; count: number }[];
        derniers: {
            id: string;
            email: string;
            nom: string;
            prenom: string;
            role: string;
            actif: boolean;
            derniereConnexion?: string;
            creeLe: string;
        }[];
    }> {
        const ueRepo = AppDataSource.getRepository('UtilisateurEtablissement');

        // 1. Compter par rôle (jointure sur roles)
        const parRole = await ueRepo
            .createQueryBuilder('ue')
            .innerJoin('roles', 'r', 'r.id = ue."roleId"')
            .select('r.code', 'code')
            .addSelect('COUNT(*)', 'count')
            .where('ue."etablissementId" = :etabId', { etabId: etablissementId })
            .andWhere('ue."contexteType" = :ctx', { ctx: 'ETABLISSEMENT' })
            .groupBy('r.code')
            .orderBy('count', 'DESC')
            .getRawMany<Array<{ code: string; count: string }>>();

        // 2. Total + actifs
        const totalRaw = await ueRepo
            .createQueryBuilder('ue')
            .where('ue."etablissementId" = :etabId', { etabId: etablissementId })
            .andWhere('ue."contexteType" = :ctx', { ctx: 'ETABLISSEMENT' })
            .getCount();

        const actifsRaw = await ueRepo
            .createQueryBuilder('ue')
            .where('ue."etablissementId" = :etabId', { etabId: etablissementId })
            .andWhere('ue."contexteType" = :ctx', { ctx: 'ETABLISSEMENT' })
            .andWhere('ue.actif = :actif', { actif: true })
            .getCount();

        // 3. Derniers utilisateurs (20 max)
        const derniers = await ueRepo
            .createQueryBuilder('ue')
            .innerJoin('utilisateurs', 'u', 'u.id = ue."utilisateurId"')
            .leftJoin('profils_utilisateurs', 'p', 'p."utilisateurId" = u.id')
            .innerJoin('roles', 'r', 'r.id = ue."roleId"')
            .select([
                'u.id', 'u.email', 'u."derniereConnexion"', 'u."createdAt"',
                'p.nom', 'p.prenom',
                'r.code', 'ue.actif',
            ])
            .where('ue."etablissementId" = :etabId', { etabId: etablissementId })
            .andWhere('ue."contexteType" = :ctx', { ctx: 'ETABLISSEMENT' })
            .orderBy('ue."creeAt"', 'DESC')
            .limit(20)
            .getRawMany<Array<{
                u_id: string;
                u_email: string;
                u_derniereConnexion: string | null;
                u_createdAt: string;
                p_nom: string | null;
                p_prenom: string | null;
                r_code: string;
                ue_actif: boolean;
            }>>();

        // Labels rôles en français
        const ROLE_LABELS: Record<string, string> = {
            SUPER_ADMIN: 'Super Admin',
            ADMIN: 'Administrateur',
            CHEF_ETABLISSEMENT: 'Chef établissement',
            ENSEIGNANT: 'Enseignant',
            PERSONNEL: 'Personnel',
            RESPONSABLE_CANTINE: 'Resp. cantine',
            RESPONSABLE_TRANSPORT: 'Resp. transport',
            PARENT: 'Parent',
            ELEVE: 'Élève',
        };

        return {
            total: totalRaw,
            actifs: actifsRaw,
            parRole: parRole.map(r => ({
                role: ROLE_LABELS[r.code] || r.code,
                code: r.code,
                count: parseInt(r.count, 10),
            })),
            derniers: derniers.map(d => ({
                id: d.u_id,
                email: d.u_email,
                nom: d.p_nom || '',
                prenom: d.p_prenom || '',
                role: ROLE_LABELS[d.r_code] || d.r_code,
                code: d.r_code,
                actif: d.ue_actif,
                derniereConnexion: d.u_derniereConnexion || undefined,
                creeLe: d.u_createdAt,
            })),
        };
    }

    // ==================================
    // Upload et traitement du logo (v3.0)
    // ==================================

    /**
     * Récupère le logo d'un établissement (avec base64)
     * 
     * @param etablissementId ID de l'établissement
     * @returns { base64, type, taille } ou null si pas de logo
     */
    async getLogo(etablissementId: string): Promise<{
        base64: string;
        type: string;
        taille: number;
    } | null> {
        // Overrider select: false avec select explicite
        const etablissement = await this.etablissementRepo.findOne({
            where: { id: etablissementId },
            select: ['logoBase64', 'logoType', 'logoTaille'],
        });

        if (!etablissement || !etablissement.logoBase64) {
            return null;
        }

        return {
            base64: etablissement.logoBase64,
            type: etablissement.logoType || '',
            taille: etablissement.logoTaille || 0,
        };
    }

    /**
     * Upload et traite le logo d'un établissement
     * 
     * @param etablissementId ID de l'établissement
     * @param logoBase64 Data URI base64 du logo
     * @returns Établissement mis à jour avec logo (sans le base64 pour performance)
     */
    async uploadLogo(etablissementId: string, logoBase64: string): Promise<Etablissement> {
        const etablissement = await this.findOne(etablissementId);

        try {
            // 1. Redimensionnement et validation via utilitaire sharp
            const imageTraitee = await redimensionnerLogo(logoBase64);

            // 2. Mettre à jour l'établissement avec le logo traité
            etablissement.logoBase64 = imageTraitee.base64;
            etablissement.logoType = imageTraitee.type;
            etablissement.logoTaille = imageTraitee.taille;

            await this.etablissementRepo.save(etablissement);

            logger.info(`Logo uploadé pour établissement: ${etablissement.nom} (${etablissementId})`);

            // 3. Retourner sans le base64 (select: false)
            return this.findOne(etablissementId);
        } catch (error: any) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`Erreur upload logo: ${error.message || error}`);
            throw new AppError(
                'Erreur lors de l\'upload du logo',
                500,
                'UPLOAD_LOGO_ERREUR'
            );
        }
    }

    /**
     * Supprime le logo d'un établissement
     * 
     * @param etablissementId ID de l'établissement
     * @returns Établissement mis à jour sans logo
     */
    async supprimerLogo(etablissementId: string): Promise<Etablissement> {
        const etablissement = await this.findOne(etablissementId);

        if (!etablissement.logoBase64) {
            throw new AppError('Aucun logo à supprimer', 400, 'LOGO_ABSENT');
        }

        etablissement.logoBase64 = undefined;
        etablissement.logoType = undefined;
        etablissement.logoTaille = undefined;

        await this.etablissementRepo.save(etablissement);

        logger.info(`Logo supprimé pour établissement: ${etablissement.nom} (${etablissementId})`);
        return etablissement;
    }

    // ==================================
    // Changement de plan d'abonnement (Control Plane)
    // ==================================

    /**
     * Change le plan d'abonnement d'un établissement.
     * Met à jour la config ET loggue dans l'audit.
     */
    async changerPlan(
        etablissementId: string,
        nouveauPlan: 'gratuit' | 'standard' | 'premium' | 'entreprise',
        utilisateurId?: string,
    ): Promise<EtablissementConfig> {
        const etablissement = await this.findOne(etablissementId);
        let config = await this.configRepo.findOne({ where: { etablissementId } });

        if (!config) {
            config = this.configRepo.create({ etablissementId, cyclesActifs: [] });
        }

        const ancienPlan = config.planAbonnement || 'gratuit';
        config.planAbonnement = nouveauPlan;

        // Ajuster les quotas selon le nouveau plan
        const QUOTAS_PAR_PLAN: Record<string, { eleves: number; utilisateurs: number; classes: number; stockage: number }> = {
            gratuit:    { eleves: 50,   utilisateurs: 5,   classes: 3,  stockage: 500 },
            standard:   { eleves: 500,  utilisateurs: 25,  classes: 20, stockage: 2000 },
            premium:    { eleves: 2000, utilisateurs: 100, classes: 80, stockage: 10000 },
            entreprise: { eleves: 10000, utilisateurs: 500, classes: 500, stockage: 50000 },
        };
        const quotas = QUOTAS_PAR_PLAN[nouveauPlan];
        if (quotas) {
            config.maxEleves = quotas.eleves;
            config.maxUtilisateurs = quotas.utilisateurs;
            config.maxClasses = quotas.classes;
            config.stockageMaxMB = quotas.stockage;
        }

        await this.configRepo.save(config);

        logger.info(`Plan changé pour établissement ${etablissement.nom}: ${ancienPlan} → ${nouveauPlan} (par ${utilisateurId || 'système'})`);

        // Log audit (non-bloquant)
        try {
            const { auditService } = await import('@modules/auth/services/audit.service');
            await auditService.log({
                action: 'ETABLISSEMENT_PLAN_CHANGE' as any,
                entityId: etablissementId,
                entityType: 'Etablissement',
                details: { ancienPlan, nouveauPlan, par: utilisateurId },
                utilisateurId: utilisateurId || undefined,
            });
        } catch { /* non-bloquant */ }

        return config;
    }

    // ==================================
    // Paramètres régionaux avec fallback 4 niveaux (v3.0)
    // ==================================

    /**
     * Récupère les paramètres régionaux d'un établissement avec fallback en cascade
     * 
     * Priorité (décroissante) :
     * 1. Valeur sur l'établissement
     * 2. ParametreSysteme (scope etablissementId)
     * 3. ParametreSysteme (global)
     * 4. Valeur par défaut codée en dur
     */
    async getParametresRegionaux(etablissementId: string): Promise<{
        langueDefaut: string;
        devise: string;
        fuseauHoraire: string;
    }> {
        const { getParam } = await import('@modules/configuration/utils/config.helper');

        // Récupérer l'établissement
        const etablissement = await this.etablissementRepo.findOne({
            where: { id: etablissementId },
            select: ['langueDefaut', 'devise', 'fuseauHoraire'],
        });

        // Fallback 4 niveaux pour chaque paramètre
        const langueDefaut = etablissement?.langueDefaut
            || await getParam('app.langue_defaut', { etablissementId, defaultValue: 'fr' })
            || 'fr';

        const devise = etablissement?.devise
            || await getParam('app.devise', { etablissementId, defaultValue: 'XAF' })
            || 'XAF';

        const fuseauHoraire = etablissement?.fuseauHoraire
            || await getParam('app.fuseau_horaire', { etablissementId, defaultValue: 'Africa/Douala' })
            || 'Africa/Douala';

        return { langueDefaut, devise, fuseauHoraire };
    }

    // ==================================
    // Historique connexions (série temporelle)
    // ==================================

    /**
     * Retourne l'historique des connexions des utilisateurs d'un établissement
     * sur les N derniers jours (défaut 30). Utilise les AuditLog action=LOGIN.
     */
    async getHistoriqueConnexions(etablissementId: string, jours: number = 30): Promise<{
        serie: { date: string; connexions: number; utilisateursUniques: number }[];
        total30j: number;
        moyenneJour: number;
        picJour: number;
        utilisateursActifs30j: number;
    }> {
        const { AppDataSource } = await import('@database/data-source');
        const dateDebut = new Date();
        dateDebut.setDate(dateDebut.getDate() - jours);

        // Récupérer les IDs des utilisateurs liés à cet établissement
        const utilisateurs = await AppDataSource.query<{ id: string }[]>(
            `SELECT u.id FROM utilisateurs u
             JOIN utilisateur_etablissements ue ON ue."utilisateurId" = u.id
             WHERE ue."etablissementId" = $1`,
            [etablissementId],
        );
        const userIds = utilisateurs.map(u => u.id);

        if (userIds.length === 0) {
            return { serie: [], total30j: 0, moyenneJour: 0, picJour: 0, utilisateursActifs30j: 0 };
        }

        // Compter les LOGIN par jour pour ces utilisateurs
        const logs = await AppDataSource.query<{ jour: string; connexions: string; uniques: string }[]>(
            `SELECT
                DATE("createdAt") as jour,
                COUNT(*)::text as connexions,
                COUNT(DISTINCT "utilisateurId")::text as uniques
             FROM audit_logs
             WHERE action = 'LOGIN'
               AND "utilisateurId" = ANY($1)
               AND "createdAt" >= $2
             GROUP BY DATE("createdAt")
             ORDER BY jour ASC`,
            [userIds, dateDebut],
        );

        // Construire la série complète (tous les jours, même sans connexion)
        const serieMap = new Map(logs.map(l => [l.jour, { connexions: parseInt(l.connexions), uniques: parseInt(l.uniques) }]));
        const serie: { date: string; connexions: number; utilisateursUniques: number }[] = [];
        let total30j = 0;
        let picJour = 0;

        for (let d = new Date(dateDebut); d <= new Date(); d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            const day = serieMap.get(dateStr) || { connexions: 0, uniques: 0 };
            serie.push({ date: dateStr, connexions: day.connexions, utilisateursUniques: day.uniques });
            total30j += day.connexions;
            if (day.connexions > picJour) picJour = day.connexions;
        }

        // Utilisateurs actifs distincts sur la période
        const actifsResult = await AppDataSource.query<{ count: string }[]>(
            `SELECT COUNT(DISTINCT "utilisateurId")::text as count
             FROM audit_logs
             WHERE action = 'LOGIN'
               AND "utilisateurId" = ANY($1)
               AND "createdAt" >= $2`,
            [userIds, dateDebut],
        );
        const utilisateursActifs30j = parseInt(actifsResult[0]?.count || '0');

        return {
            serie,
            total30j,
            moyenneJour: Math.round(total30j / jours),
            picJour,
            utilisateursActifs30j,
        };
    }
}

export const etablissementService = new EtablissementService();
