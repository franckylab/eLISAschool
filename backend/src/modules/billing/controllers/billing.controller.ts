/**
 * ==================================
 * eLISAschool - Controller Billing API
 * ==================================
 * 
 * Endpoints REST pour la gestion des plans, abonnements,
 * factures, quotas et feature flags.
 * 
 * Routes plateforme (SUPER_ADMIN): /api/platform/facturation/*
 * Routes client (ADMIN): /api/billing/*
 * 
 * Phase 4.5 — Refonte SaaS
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import {
    PlanAbonnement,
    StatutPlan,
    TrancheEleves,
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
    Facture,
    StatutFacture,
    LigneFacture,
    ModuleOptionnel,
    AbonnementModule,
    QuotaUtilisation,
    FeatureFlagTenant,
    ModuleCatalogue,
    CategorieModule,
} from '../entities';
import { FacturationService } from '../services/facturation.service';
import { FeatureFlagService } from '../services/feature-flags.service';
import { quotaService } from '../services/quota.service';
import { FacturePdfService } from '../services/facture-pdf.service';
// Phase 3 — Refonte SaaS v5
import { TrancheConfigService } from '../services/tranche-config.service';
import { ModeFacturationTranches } from '../entities/plan-abonnement.entity';
// Phase 7 Lot A — Refonte SaaS v7 (catalogue modules unifié)
import { moduleResolutionService } from '../services/module-resolution.service';
import { seedModulesCatalogue } from '@database/seeds/system/seed-modules-catalogue';
// Phase 7 Lot C — Refonte SaaS v7 (groupes SaaS)
import { groupeSaaSService } from '../services/groupe-saas.service';
import { ModeFacturationGroupe, RepartitionFacturation } from '../entities/abonnement-groupe.entity';
// Phase 7 Lot D — Refonte SaaS v7 (providers paiement dynamiques)
import { providerPaiementService } from '../services/provider-paiement.service';
import { TypeProviderPaiement } from '../entities/provider-paiement.entity';
import { ScopeAssignment } from '../entities/provider-assignment.entity';
// Phase 7 Lot F — Refonte SaaS v7 (workflow actions critiques)
import { actionCritiqueService } from '../services/action-critique.service';
import { TypeActionCritique, StatutActionCritique } from '../entities/action-critique.entity';

// =============================================
// Router PLATFORME (SUPER_ADMIN)
// =============================================

const platformBillingRouter = Router();

// --- PLANS D'ABONNEMENT ---

/**
 * GET /api/platform/facturation/plans
 * Liste tous les plans d'abonnement
 */
platformBillingRouter.get('/plans', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plans = await planRepo.find({
            relations: ['tranches'],
            order: { ordre: 'ASC' },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/plans/:id
 * Détail d'un plan
 */
platformBillingRouter.get('/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({
            where: { id: req.params.id },
            relations: ['tranches', 'abonnements'],
        });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');
        res.json({ success: true, data: plan });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/plans
 * Créer un plan d'abonnement
 */
platformBillingRouter.post('/plans', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const { nom, slug, description, prixBase, devise, maxEleves, maxUtilisateurs, maxClasses, stockageMaxGo, smsInclus, modulesInclus, featureFlags, ordre, badge } = req.body;

        const plan = planRepo.create({
            nom, slug, description, prixBase,
            devise: devise || 'XAF',
            maxEleves: maxEleves || 300,
            maxUtilisateurs: maxUtilisateurs || 0,
            maxClasses: maxClasses || 0,
            stockageMaxGo: stockageMaxGo || 0,
            smsInclus: smsInclus || 0,
            modulesInclus: modulesInclus || [],
            featureFlags: featureFlags || {},
            statut: StatutPlan.ACTIF,
            ordre: ordre || 0,
            badge,
        });

        const saved = await planRepo.save(plan);
        res.status(201).json({ success: true, data: saved, message: 'Plan créé avec succès' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/plans/:id
 * Modifier un plan
 */
platformBillingRouter.put('/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({ where: { id: req.params.id } });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');

        Object.assign(plan, req.body);
        const saved = await planRepo.save(plan);
        res.json({ success: true, data: saved, message: 'Plan mis à jour' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/plans/:id
 * Désactiver un plan (soft delete)
 */
platformBillingRouter.delete('/plans/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({ where: { id: req.params.id } });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');

        plan.actif = false;
        plan.statut = StatutPlan.ARRETE;
        await planRepo.save(plan);

        res.json({ success: true, message: 'Plan désactivé' });
    } catch (error) {
        next(error);
    }
});

// --- TRANCHES ---

/**
 * POST /api/platform/facturation/plans/:planId/tranches
 * Ajouter une tranche à un plan
 */
platformBillingRouter.post('/plans/:planId/tranches', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trancheRepo = AppDataSource.getRepository(TrancheEleves);
        const { minEleves, maxEleves, montantSupplementaire, label } = req.body;

        const tranche = trancheRepo.create({
            planId: req.params.planId,
            minEleves,
            maxEleves: maxEleves ?? null,
            montantSupplementaire,
            label,
        });

        const saved = await trancheRepo.save(tranche);
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/tranches/:id
 * Modifier une tranche
 */
platformBillingRouter.put('/tranches/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trancheRepo = AppDataSource.getRepository(TrancheEleves);
        const tranche = await trancheRepo.findOne({ where: { id: req.params.id } });
        if (!tranche) throw new AppError('Tranche introuvable', 404, 'TRANCHE_NOT_FOUND');

        Object.assign(tranche, req.body);
        const saved = await trancheRepo.save(tranche);
        res.json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/tranches/:id
 * Supprimer une tranche
 */
platformBillingRouter.delete('/tranches/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trancheRepo = AppDataSource.getRepository(TrancheEleves);
        const tranche = await trancheRepo.findOne({ where: { id: req.params.id } });
        if (!tranche) throw new AppError('Tranche introuvable', 404, 'TRANCHE_NOT_FOUND');

        await trancheRepo.remove(tranche);
        res.json({ success: true, message: 'Tranche supprimée' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/plans/:planId/tranches
 * Supprimer toutes les tranches d'un plan (pour synchronisation)
 */
platformBillingRouter.delete('/plans/:planId/tranches', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const trancheRepo = AppDataSource.getRepository(TrancheEleves);
        const tranches = await trancheRepo.find({ where: { planId: req.params.planId } });
        if (tranches.length > 0) {
            await trancheRepo.remove(tranches);
        }
        res.json({ success: true, data: { deleted: tranches.length } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/tranches/simulate?planId=...&nbEleves=500
 * Simule l'impact des tranches pour un plan donné (Lot B v7)
 */
platformBillingRouter.get('/tranches/simulate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const planId = req.query.planId as string;
        const nbEleves = parseInt(req.query.nbEleves as string, 10);
        if (!planId || isNaN(nbEleves)) throw new AppError('planId et nbEleves requis', 400);

        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({
            where: { id: planId },
            relations: ['tranches'],
        });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');

        const tranchesPlan = (plan.tranches ?? [])
            .filter(t => t.actif)
            .sort((a, b) => a.ordre - b.ordre)
            .map(t => ({
                id: t.id,
                ordre: t.ordre,
                minEleves: t.minEleves,
                maxEleves: t.maxEleves,
                montantSupplementaire: t.montantSupplementaire,
                label: t.label,
                source: 'plan' as const,
            }));

        const trancheConfigService = new TrancheConfigService();
        const result = trancheConfigService.simulerMontantTranches(plan, tranchesPlan, nbEleves);

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// --- ABONNEMENTS CLIENTS ---

/**
 * GET /api/platform/facturation/abonnements
 * Liste tous les abonnements clients
 */
platformBillingRouter.get('/abonnements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const qb = aboRepo.createQueryBuilder('abo')
            .leftJoinAndSelect('abo.plan', 'plan')
            .leftJoinAndSelect('abo.etablissement', 'etablissement')
            .orderBy('abo.createdAt', 'DESC');

        // Filtres
        if (req.query.statut) {
            qb.andWhere('abo.statut = :statut', { statut: req.query.statut });
        }
        if (req.query.planId) {
            qb.andWhere('abo.planId = :planId', { planId: req.query.planId });
        }

        const [data, total] = await qb.getManyAndCount();
        res.json({ success: true, data, total });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/abonnements
 * Souscrire un établissement à un plan
 */
platformBillingRouter.post('/abonnements', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId, planId, cycleFacturation } = req.body;
        if (!etablissementId || !planId) {
            throw new AppError('etablissementId et planId requis', 400, 'MISSING_FIELDS');
        }

        const facturationService = new FacturationService();
        const abonnement = await facturationService.souscrireAbonnement(
            etablissementId,
            planId,
            cycleFacturation || CycleFacturation.MENSUEL
        );

        // Synchroniser les quotas
        await quotaService.synchroniserQuotas(etablissementId);

        res.status(201).json({ success: true, data: abonnement, message: 'Abonnement souscrit' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/abonnements/:id/upgrade
 * Upgrader un abonnement vers un plan supérieur
 */
platformBillingRouter.put('/abonnements/:id/upgrade', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nouveauPlanId } = req.body;
        if (!nouveauPlanId) throw new AppError('nouveauPlanId requis', 400, 'MISSING_FIELD');

        const facturationService = new FacturationService();
        const abonnement = await facturationService.changerPlan(req.params.id, nouveauPlanId);

        // Resynchroniser les quotas
        await quotaService.synchroniserQuotas(abonnement.etablissementId);

        res.json({ success: true, data: abonnement, message: 'Abonnement mis à jour' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/abonnements/:id/suspendre
 * Suspendre un abonnement
 */
platformBillingRouter.put('/abonnements/:id/suspendre', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({ where: { id: req.params.id } });
        if (!abonnement) throw new AppError('Abonnement introuvable', 404, 'ABONNEMENT_NOT_FOUND');

        abonnement.statut = StatutAbonnement.SUSPENDU;
        await aboRepo.save(abonnement);

        res.json({ success: true, data: abonnement, message: 'Abonnement suspendu' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/abonnements/:id/reactiver
 * Réactiver un abonnement suspendu
 */
platformBillingRouter.put('/abonnements/:id/reactiver', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({ where: { id: req.params.id } });
        if (!abonnement) throw new AppError('Abonnement introuvable', 404, 'ABONNEMENT_NOT_FOUND');
        if (abonnement.statut !== StatutAbonnement.SUSPENDU) {
            throw new AppError('Seuls les abonnements suspendus peuvent être réactivés', 400, 'INVALID_STATUT');
        }

        abonnement.statut = StatutAbonnement.ACTIF;
        await aboRepo.save(abonnement);

        res.json({ success: true, data: abonnement, message: 'Abonnement réactivé' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/abonnements/:id/resilier
 * Résilier un abonnement (irréversible)
 */
platformBillingRouter.put('/abonnements/:id/resilier', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { motif } = req.body;
        const facturationService = new FacturationService();
        const abonnement = await facturationService.resilierAbonnement(req.params.id, motif);

        res.json({ success: true, data: abonnement, message: 'Abonnement résilié' });
    } catch (error) {
        next(error);
    }
});

// --- FACTURES ---

/**
 * GET /api/platform/facturation/factures
 * Liste toutes les factures
 */
platformBillingRouter.get('/factures', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const factureRepo = AppDataSource.getRepository(Facture);
        const qb = factureRepo.createQueryBuilder('f')
            .leftJoinAndSelect('f.abonnement', 'abo')
            .leftJoinAndSelect('f.lignes', 'lignes')
            .orderBy('f.dateEmission', 'DESC');

        if (req.query.statut) {
            qb.andWhere('f.statut = :statut', { statut: req.query.statut });
        }
        if (req.query.etablissementId) {
            qb.andWhere('f.etablissementId = :etablissementId', { etablissementId: req.query.etablissementId });
        }

        const [data, total] = await qb.getManyAndCount();
        res.json({ success: true, data, total });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/factures/:id
 * Détail d'une facture
 */
platformBillingRouter.get('/factures/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const factureRepo = AppDataSource.getRepository(Facture);
        const facture = await factureRepo.findOne({
            where: { id: req.params.id },
            relations: ['lignes', 'abonnement', 'abonnement.plan'],
        });
        if (!facture) throw new AppError('Facture introuvable', 404, 'FACTURE_NOT_FOUND');
        res.json({ success: true, data: facture });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/factures/:id/generer
 * Régénérer une facture (brouillon → émise)
 */
platformBillingRouter.post('/factures/:id/generer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const factureRepo = AppDataSource.getRepository(Facture);
        const facture = await factureRepo.findOne({ where: { id: req.params.id } });
        if (!facture) throw new AppError('Facture introuvable', 404, 'FACTURE_NOT_FOUND');
        if (facture.statut !== StatutFacture.BROUILLON) {
            throw new AppError('Seules les factures en brouillon peuvent être émises', 400, 'INVALID_STATUT');
        }

        facture.statut = StatutFacture.EMISE;
        await factureRepo.save(facture);

        res.json({ success: true, data: facture, message: 'Facture émise' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/factures/:id/pdf-data
 * Récupérer les données structurées pour génération PDF (jsPDF frontend)
 */
platformBillingRouter.get('/factures/:id/pdf-data', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pdfService = new FacturePdfService();
        const data = await pdfService.preparerDonneesPdf(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// --- MODULES OPTIONNELS ---

/**
 * GET /api/platform/facturation/modules
 * Liste les modules optionnels
 */
platformBillingRouter.get('/modules', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleRepo = AppDataSource.getRepository(ModuleOptionnel);
        const modules = await moduleRepo.find({ order: { ordre: 'ASC' } });
        res.json({ success: true, data: modules });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/modules
 * Créer un module optionnel
 */
platformBillingRouter.post('/modules', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleRepo = AppDataSource.getRepository(ModuleOptionnel);
        const module = moduleRepo.create(req.body);
        const saved = await moduleRepo.save(module);
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/modules/:id
 * Modifier un module optionnel
 */
platformBillingRouter.put('/modules/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleRepo = AppDataSource.getRepository(ModuleOptionnel);
        const module = await moduleRepo.findOne({ where: { id: req.params.id } });
        if (!module) throw new AppError('Module introuvable', 404, 'MODULE_NOT_FOUND');

        Object.assign(module, req.body);
        const saved = await moduleRepo.save(module);
        res.json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/modules/:id
 * Supprimer un module optionnel
 */
platformBillingRouter.delete('/modules/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const moduleRepo = AppDataSource.getRepository(ModuleOptionnel);
        const module = await moduleRepo.findOne({ where: { id: req.params.id } });
        if (!module) throw new AppError('Module introuvable', 404, 'MODULE_NOT_FOUND');

        await moduleRepo.remove(module);
        res.json({ success: true, message: 'Module supprimé' });
    } catch (error) {
        next(error);
    }
});

// --- CATALOGUE MODULES UNIFIÉ (Lot A — Refonte SaaS v7) ---
// Source de vérité unique : modules_catalogue (remplace les 3 registres divergents)

/**
 * GET /api/platform/facturation/modules/catalogue
 * Liste le catalogue complet (filtres : categorie, search)
 */
platformBillingRouter.get('/modules/catalogue', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const { categorie, search, actif } = req.query as {
            categorie?: string;
            search?: string;
            actif?: string;
        };

        const qb = repo.createQueryBuilder('m').orderBy('m.ordre', 'ASC');

        if (categorie && (Object.values(CategorieModule) as string[]).includes(categorie)) {
            qb.andWhere('m.categorie = :categorie', { categorie });
        }
        if (search) {
            qb.andWhere('(m.nom ILIKE :search OR m.code ILIKE :search)', { search: `%${search}%` });
        }
        if (actif === 'true') qb.andWhere('m.estActif = true');
        if (actif === 'false') qb.andWhere('m.estActif = false');

        const modules = await qb.getMany();
        res.json({ success: true, data: modules });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/modules/catalogue
 * Créer une entrée catalogue
 */
platformBillingRouter.post('/modules/catalogue', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const { code, nom, ...reste } = req.body;

        if (!code || !nom) {
            throw new AppError('Le code et le nom sont requis', 400, 'VALIDATION_ERROR');
        }

        const existant = await repo.findOne({ where: { code } });
        if (existant) {
            throw new AppError(`Un module avec le code "${code}" existe déjà`, 409, 'MODULE_EXISTS');
        }

        const entree = repo.create({ code, nom, ...reste });
        const saved = await repo.save(entree);
        void moduleResolutionService.invalidate(); // P3.1 v7 — async fire-and-forget
        res.status(201).json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/modules/catalogue/:id
 * Modifier une entrée catalogue (code protégé si estSysteme)
 */
platformBillingRouter.put('/modules/catalogue/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const entree = await repo.findOne({ where: { id: req.params.id } });
        if (!entree) throw new AppError('Module catalogue introuvable', 404, 'MODULE_NOT_FOUND');

        if (entree.estSysteme && req.body.code && req.body.code !== entree.code) {
            throw new AppError('Le code d\'un module système ne peut pas être modifié', 400, 'CODE_PROTEGE');
        }

        Object.assign(entree, req.body);
        const saved = await repo.save(entree);
        void moduleResolutionService.invalidate(); // P3.1 v7 — async fire-and-forget
        res.json({ success: true, data: saved });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/modules/catalogue/:id
 * Supprimer une entrée catalogue (système protégées)
 */
platformBillingRouter.delete('/modules/catalogue/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const entree = await repo.findOne({ where: { id: req.params.id } });
        if (!entree) throw new AppError('Module catalogue introuvable', 404, 'MODULE_NOT_FOUND');

        if (entree.estSysteme) {
            throw new AppError(
                'Ce module est un module système (seed). Désactivez-le plutôt que de le supprimer.',
                403,
                'MODULE_SYSTEME_PROTEGE'
            );
        }

        await repo.remove(entree);
        void moduleResolutionService.invalidate(); // P3.1 v7 — async fire-and-forget
        res.json({ success: true, data: { id: entree.id } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/modules/catalogue/sync
 * Re-synchronise le catalogue depuis MODULE_REGISTRY (upsert idempotent)
 */
platformBillingRouter.post('/modules/catalogue/sync', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const total = await seedModulesCatalogue(true);
        void moduleResolutionService.invalidate(); // P3.1 v7 — async fire-and-forget
        res.json({ success: true, data: { total } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/modules/catalogue/resolution
 * Résolution des modules activés pour un établissement (cascade catalogue → plan → supplément)
 */
platformBillingRouter.get('/modules/catalogue/resolution', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.query as { etablissementId?: string };
        if (!etablissementId) {
            throw new AppError('Paramètre etablissementId requis', 400, 'VALIDATION_ERROR');
        }
        const modules = await moduleResolutionService.getResolvedModules(etablissementId);
        res.json({ success: true, data: modules });
    } catch (error) {
        next(error);
    }
});

// --- FEATURE FLAGS (plateforme) ---

/**
 * GET /api/platform/facturation/feature-flags/:etablissementId
 * Voir tous les flags d'un établissement
 */
platformBillingRouter.get('/feature-flags/:etablissementId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const featureFlagService = new FeatureFlagService();
        const flags = await featureFlagService.getAllFlags(req.params.etablissementId);
        res.json({ success: true, data: flags });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/facturation/feature-flags
 * Toggle un flag pour un établissement
 */
platformBillingRouter.put('/feature-flags', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId, flagName, enabled } = req.body;
        if (!etablissementId || !flagName || enabled === undefined) {
            throw new AppError('etablissementId, flagName et enabled requis', 400, 'MISSING_FIELDS');
        }

        const featureFlagService = new FeatureFlagService();
        const result = await featureFlagService.toggleFlag(
            flagName,
            etablissementId,
            enabled,
            req.utilisateur?.id
        );

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// --- QUOTAS ---

/**
 * GET /api/platform/facturation/quotas/:etablissementId
 * Voir les quotas d'un établissement
 */
platformBillingRouter.get('/quotas/:etablissementId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const quotas = await quotaService.getQuotasEtablissement(req.params.etablissementId);
        res.json({ success: true, data: quotas });
    } catch (error) {
        next(error);
    }
});

// =============================================
// Router CLIENT (établissement)
// =============================================

const clientBillingRouter = Router();

/**
 * GET /api/billing/mon-abonnement
 * Voir son abonnement actuel
 */
clientBillingRouter.get('/mon-abonnement', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({
            where: { etablissementId, statut: StatutAbonnement.ACTIF },
            relations: ['plan', 'plan.tranches'],
        });

        if (!abonnement) {
            res.json({ success: true, data: null, message: 'Aucun abonnement actif' });
            return;
        }

        // Ajouter les quotas
        const quotas = await quotaService.getQuotasEtablissement(etablissementId);

        res.json({
            success: true,
            data: {
                ...abonnement,
                quotas,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/mes-factures
 * Voir ses factures
 */
clientBillingRouter.get('/mes-factures', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const factureRepo = AppDataSource.getRepository(Facture);
        const factures = await factureRepo.find({
            where: { etablissementId },
            relations: ['lignes'],
            order: { dateEmission: 'DESC' },
        });

        res.json({ success: true, data: factures });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/feature-flags
 * Voir les feature flags actifs pour son établissement
 */
clientBillingRouter.get('/feature-flags', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const featureFlagService = new FeatureFlagService();
        const flags = await featureFlagService.getAllFlags(etablissementId);

        res.json({ success: true, data: flags });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/quotas
 * Voir ses quotas
 */
clientBillingRouter.get('/quotas', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const quotas = await quotaService.getQuotasEtablissement(etablissementId);

        res.json({ success: true, data: quotas });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/plans
 * Liste des plans disponibles (catalogue public pour les clients)
 */
clientBillingRouter.get('/plans', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plans = await planRepo.find({
            where: { actif: true, visible: true },
            relations: ['tranches'],
            order: { ordre: 'ASC' },
        });
        res.json({ success: true, data: plans });
    } catch (error) {
        next(error);
    }
});

// =============================================
// SELF-SERVICE — Phase K.5
// =============================================

/**
 * POST /api/billing/simuler
 * Simuler un plan avec un nombre d'élèves donné
 */
clientBillingRouter.post('/simuler', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId, nombreEleves, cycleFacturation } = req.body;
        if (!planId || !nombreEleves) {
            throw new AppError('planId et nombreEleves requis', 400, 'MISSING_FIELDS');
        }

        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({
            where: { id: planId, actif: true },
            relations: ['tranches'],
        });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');

        // Calcul du montant selon les tranches
        let montantSupplementaire = 0;
        if (plan.tranches && nombreEleves > plan.maxEleves) {
            const elevesSupplementaires = nombreEleves - plan.maxEleves;
            for (const tranche of plan.tranches.sort((a, b) => a.minEleves - b.minEleves)) {
                if (elevesSupplementaires >= tranche.minEleves) {
                    const elevesDansTranche = tranche.maxEleves
                        ? Math.min(elevesSupplementaires - tranche.minEleves + 1, tranche.maxEleves - tranche.minEleves + 1)
                        : elevesSupplementaires - tranche.minEleves + 1;
                    if (elevesDansTranche > 0) {
                        montantSupplementaire += elevesDansTranche * tranche.montantSupplementaire;
                    }
                }
            }
        }

        const montantTotal = plan.prixBase + montantSupplementaire;
        const cycle = cycleFacturation || 'MENSUEL';

        res.json({
            success: true,
            data: {
                plan: { id: plan.id, nom: plan.nom, slug: plan.slug },
                nombreEleves,
                prixBase: plan.prixBase,
                montantSupplementaire,
                montantTotal,
                devise: plan.devise,
                cycleFacturation: cycle,
                modulesInclus: plan.modulesInclus,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/billing/abonnement/upgrade
 * Changer de plan (self-service)
 */
clientBillingRouter.patch('/abonnement/upgrade', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { nouveauPlanId } = req.body;
        if (!nouveauPlanId) throw new AppError('nouveauPlanId requis', 400, 'MISSING_FIELD');

        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({
            where: { etablissementId, statut: StatutAbonnement.ACTIF },
        });
        if (!abonnement) throw new AppError('Aucun abonnement actif', 404, 'ABONNEMENT_NOT_FOUND');

        const facturationService = new FacturationService();
        const updated = await facturationService.changerPlan(abonnement.id, nouveauPlanId);

        // Resynchroniser les quotas
        await quotaService.synchroniserQuotas(etablissementId);

        res.json({ success: true, data: updated, message: 'Plan mis à jour avec succès' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/factures/:id/payer
 * Initier le paiement d'une facture
 */
clientBillingRouter.post('/factures/:id/payer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { provider, methodePaiement } = req.body;
        if (!provider) throw new AppError('provider requis', 400, 'MISSING_FIELD');

        const factureRepo = AppDataSource.getRepository(Facture);
        const facture = await factureRepo.findOne({
            where: { id: req.params.id, etablissementId },
            relations: ['lignes', 'abonnement'],
        });
        if (!facture) throw new AppError('Facture introuvable', 404, 'FACTURE_NOT_FOUND');
        if (facture.statut === StatutFacture.PAYEE) {
            throw new AppError('Facture déjà payée', 409, 'FACTURE_DEJA_PAYEE');
        }

        // Marquer la facture comme en cours de paiement
        facture.statut = StatutFacture.EN_PAIEMENT;
        await factureRepo.save(facture);

        // Retourner les informations de paiement
        res.json({
            success: true,
            data: {
                factureId: facture.id,
                numero: facture.numero,
                montantTotal: facture.montantTotal,
                devise: facture.devise,
                provider,
                methodePaiement: methodePaiement || 'mobile_money',
                statut: facture.statut,
                instructions: `Redirigez vers le provider ${provider} pour compléter le paiement`,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/factures/:id/avoir
 * Demander un avoir (credit note)
 */
clientBillingRouter.post('/factures/:id/avoir', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { motif, montant } = req.body;
        if (!motif) throw new AppError('motif requis', 400, 'MISSING_FIELD');

        const factureRepo = AppDataSource.getRepository(Facture);
        const facture = await factureRepo.findOne({
            where: { id: req.params.id, etablissementId },
            relations: ['lignes'],
        });
        if (!facture) throw new AppError('Facture introuvable', 404, 'FACTURE_NOT_FOUND');
        if (facture.statut !== StatutFacture.PAYEE && facture.statut !== StatutFacture.EMISE) {
            throw new AppError('Seules les factures émises ou payées peuvent faire l\'objet d\'un avoir', 400, 'INVALID_STATUT');
        }

        const montantAvoir = montant || facture.montantTotal;
        if (montantAvoir > facture.montantTotal) {
            throw new AppError('Le montant de l\'avoir ne peut pas dépasser le montant de la facture', 400, 'MONTANT_EXCESSIF');
        }

        // Créer un avoir (facture négative)
        const avoir = factureRepo.create({
            abonnementId: facture.abonnementId,
            etablissementId,
            numero: `AV-${facture.numero}`,
            dateEmission: new Date(),
            dateEcheance: new Date(),
            montantTotal: -montantAvoir,
            montantPaye: 0,
            statut: StatutFacture.AVOIR,
            devise: facture.devise,
            lignes: [{
                description: `Avoir sur facture ${facture.numero} — Motif: ${motif}`,
                quantite: 1,
                montantUnitaire: -montantAvoir,
                montantTotal: -montantAvoir,
            }],
        });

        const saved = await factureRepo.save(avoir);
        res.status(201).json({ success: true, data: saved, message: 'Avoir créé avec succès' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/historique-plans
 * Historique des changements de plan
 */
clientBillingRouter.get('/historique-plans', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnements = await aboRepo.find({
            where: { etablissementId },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
            take: 20,
        });

        res.json({
            success: true,
            data: abonnements.map(abo => ({
                id: abo.id,
                planNom: abo.plan?.nom || 'Inconnu',
                statut: abo.statut,
                montantMensuel: abo.montantMensuel,
                dateDebut: abo.dateDebut,
                dateFin: abo.dateFin,
                createdAt: abo.createdAt,
            })),
        });
    } catch (error) {
        next(error);
    }
});

// =============================================
// TRANCHE CONFIG & MODULES — Routes client (ADMIN)
// =============================================

const trancheConfigService = new TrancheConfigService();

/**
 * GET /api/billing/tranches/resolved
 * Résout les tranches applicables (cascade : établissement → plan → système)
 */
clientBillingRouter.get('/tranches/resolved', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const tranches = await trancheConfigService.getResolvedTranches(etablissementId);
        res.json({ success: true, data: tranches });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/tranches/simulate?nbEleves=500
 * Simule le calcul complet des tranches (Lot B v7)
 */
clientBillingRouter.get('/tranches/simulate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        const nbEleves = parseInt(req.query.nbEleves as string, 10);
        if (!etablissementId || isNaN(nbEleves)) throw new AppError('Paramètres invalides', 400);

        const result = await trancheConfigService.calculerMontantTranches(etablissementId, nbEleves);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * POST /api/billing/simuler
 * Simulation complète : prix base + tranches + TVA (Lot B v7)
 * Body: { nombreEleves: number }
 */
clientBillingRouter.post('/simuler', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        const { nombreEleves } = req.body;
        if (!etablissementId || !nombreEleves) throw new AppError('Établissement et nombreEleves requis', 400);

        const calcul = await trancheConfigService.calculerMontantTranches(etablissementId, nombreEleves);

        // Calcul TVA OHADA (19.25%)
        const TAUX_TVA = 1925; // centièmes
        const montantHT = calcul.montantBase + calcul.montantTranches;
        const montantTVA = Math.round(montantHT * TAUX_TVA / 10000);
        const montantTotal = montantHT + montantTVA;

        res.json({
            success: true,
            data: {
                montantBase: calcul.montantBase,
                montantTranches: calcul.montantTranches,
                montantHT,
                tauxTVA: TAUX_TVA / 100,
                montantTVA,
                montantTotal,
                nbEleves: calcul.nbEleves,
                trancheActive: calcul.trancheActive,
                mode: calcul.mode,
                depassement: calcul.depassement,
            },
        });
    } catch (error) { next(error); }
});

/**
 * PUT /api/billing/tranches
 * Crée ou met à jour un override de tranche pour l'établissement
 */
clientBillingRouter.put('/tranches', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { ordre, minEleves, maxEleves, montantSupplementaire, label, trancheOriginaleId } = req.body;
        if (ordre === undefined || minEleves === undefined || montantSupplementaire === undefined) {
            throw new AppError('Champs requis : ordre, minEleves, montantSupplementaire', 400);
        }

        const saved = await trancheConfigService.upsertEtablissementTranche(etablissementId, {
            ordre, minEleves, maxEleves, montantSupplementaire, label, trancheOriginaleId,
        });
        res.json({ success: true, data: saved, message: 'Tranche enregistrée' });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/billing/tranches/:id
 * Supprime un override de tranche
 */
clientBillingRouter.delete('/tranches/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        await trancheConfigService.deleteEtablissementTranche(etablissementId, req.params.id);
        res.json({ success: true, message: 'Tranche supprimée' });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/modules/resolved
 * Résout les modules activés pour l'établissement
 */
clientBillingRouter.get('/modules/resolved', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const modules = await moduleResolutionService.getResolvedModules(etablissementId);
        res.json({ success: true, data: modules });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/modules/catalogue
 * Liste tous les modules optionnels disponibles
 */
clientBillingRouter.get('/modules/catalogue', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const modules = await moduleResolutionService.getCatalogue();
        res.json({ success: true, data: modules });
    } catch (error) { next(error); }
});

// =============================================
// Routes GROUPES SAAS (Plateforme — SUPER_ADMIN)
// =============================================

// --- CRUD GROUPES ---

/**
 * GET /api/platform/facturation/groupes
 * Liste tous les groupes d'établissements
 */
platformBillingRouter.get('/groupes', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const groupes = await groupeSaaSService.getAllGroupes();
        res.json({ success: true, data: groupes });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/groupes/:id
 * Détail d'un groupe
 */
platformBillingRouter.get('/groupes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupeSaaSService.getGroupe(req.params.id);
        res.json({ success: true, data: groupe });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/groupes
 * Créer un groupe
 */
platformBillingRouter.post('/groupes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nom, description, code } = req.body;
        if (!nom || !code) throw new AppError('Nom et code requis', 400, 'VALIDATION_ERROR');

        const proprietaireId = req.utilisateur?.id;
        if (!proprietaireId) throw new AppError('Utilisateur non identifié', 401);

        const groupe = await groupeSaaSService.createGroupe({ nom, description, code, proprietaireId });
        res.status(201).json({ success: true, data: groupe });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/platform/facturation/groupes/:id
 * Modifier un groupe
 */
platformBillingRouter.patch('/groupes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupe = await groupeSaaSService.updateGroupe(req.params.id, req.body);
        res.json({ success: true, data: groupe });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/platform/facturation/groupes/:id
 * Supprimer un groupe
 */
platformBillingRouter.delete('/groupes/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await groupeSaaSService.deleteGroupe(req.params.id);
        res.json({ success: true, message: 'Groupe supprimé' });
    } catch (error) { next(error); }
});

// --- MEMBRES DU GROUPE ---

/**
 * POST /api/platform/facturation/groupes/:id/membres
 * Ajouter un établissement au groupe
 */
platformBillingRouter.post('/groupes/:id/membres', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.body;
        if (!etablissementId) throw new AppError('etablissementId requis', 400, 'VALIDATION_ERROR');

        const lien = await groupeSaaSService.addMembre(req.params.id, etablissementId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: lien });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/platform/facturation/groupes/:id/membres/:etablissementId
 * Retirer un établissement du groupe
 */
platformBillingRouter.delete('/groupes/:id/membres/:etablissementId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await groupeSaaSService.removeMembre(req.params.id, req.params.etablissementId);
        res.json({ success: true, message: 'Membre retiré du groupe' });
    } catch (error) { next(error); }
});

// --- CONFIGURATION SAAS DU GROUPE ---

/**
 * GET /api/platform/facturation/groupes/:id/modules
 * Liste les modules configurés pour le groupe
 */
platformBillingRouter.get('/groupes/:id/modules', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const modules = await groupeSaaSService.getModulesGroupe(req.params.id);
        res.json({ success: true, data: modules });
    } catch (error) { next(error); }
});

/**
 * PUT /api/platform/facturation/groupes/:id/modules/:moduleId
 * Active/désactive un module pour le groupe
 */
platformBillingRouter.put('/groupes/:id/modules/:moduleId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actif } = req.body;
        if (typeof actif !== 'boolean') throw new AppError('actif (boolean) requis', 400, 'VALIDATION_ERROR');

        const mg = await groupeSaaSService.setModuleGroupe(req.params.id, req.params.moduleId, actif, req.utilisateur?.id);
        res.json({ success: true, data: mg });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/groupes/:id/tranches
 * Liste les tranches configurées pour le groupe
 */
platformBillingRouter.get('/groupes/:id/tranches', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const tranches = await groupeSaaSService.getTranchesGroupe(req.params.id);
        res.json({ success: true, data: tranches });
    } catch (error) { next(error); }
});

/**
 * PUT /api/platform/facturation/groupes/:id/tranches
 * Configure les tranches pour le groupe (remplace l'existant)
 */
platformBillingRouter.put('/groupes/:id/tranches', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tranches } = req.body;
        if (!Array.isArray(tranches)) throw new AppError('tranches (array) requis', 400, 'VALIDATION_ERROR');

        const result = await groupeSaaSService.setTranchesGroupe(req.params.id, tranches);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/groupes/:id/abonnement
 * Récupère l'abonnement du groupe
 */
platformBillingRouter.get('/groupes/:id/abonnement', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ab = await groupeSaaSService.getAbonnementGroupe(req.params.id);
        res.json({ success: true, data: ab });
    } catch (error) { next(error); }
});

/**
 * PUT /api/platform/facturation/groupes/:id/abonnement
 * Configure l'abonnement du groupe
 */
platformBillingRouter.put('/groupes/:id/abonnement', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId, modeFacturation, repartitionFacturation, tarifDegressif, dateDebut, dateFin } = req.body;
        if (!planId) throw new AppError('planId requis', 400, 'VALIDATION_ERROR');

        const ab = await groupeSaaSService.setAbonnementGroupe(req.params.id, {
            planId,
            modeFacturation: modeFacturation as ModeFacturationGroupe,
            repartitionFacturation: repartitionFacturation as RepartitionFacturation,
            tarifDegressif,
            dateDebut: dateDebut ? new Date(dateDebut) : undefined,
            dateFin: dateFin ? new Date(dateFin) : undefined,
            creePar: req.utilisateur?.id,
        });
        res.json({ success: true, data: ab });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/groupes/:id/abonnement/suspendre
 * Suspend l'abonnement du groupe
 */
platformBillingRouter.post('/groupes/:id/abonnement/suspendre', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const ab = await groupeSaaSService.suspendreAbonnementGroupe(req.params.id);
        res.json({ success: true, data: ab });
    } catch (error) { next(error); }
});

// =============================================
// Routes PROVIDERS PAIEMENT (Plateforme — SUPER_ADMIN)
// =============================================

// --- CRUD PROVIDERS ---

/**
 * GET /api/platform/facturation/providers
 * Liste tous les providers de paiement
 */
platformBillingRouter.get('/providers', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const providers = await providerPaiementService.getAll();
        res.json({ success: true, data: providers });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/providers/active
 * Liste les providers actifs
 */
platformBillingRouter.get('/providers/active', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const providers = await providerPaiementService.getActive();
        res.json({ success: true, data: providers });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/providers/:id
 * Détail d'un provider
 */
platformBillingRouter.get('/providers/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = await providerPaiementService.getById(req.params.id);
        res.json({ success: true, data: provider });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/providers
 * Créer un provider
 */
platformBillingRouter.post('/providers', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nom, slug, type, icone, description, canaux, credentials, webhookSecret, sandbox, actif, metadata } = req.body;
        if (!nom || !slug || !type || !credentials) {
            throw new AppError('nom, slug, type et credentials requis', 400, 'VALIDATION_ERROR');
        }

        const provider = await providerPaiementService.create({
            nom, slug, type: type as TypeProviderPaiement, icone, description,
            canaux: canaux || [], credentials, webhookSecret, sandbox, actif, metadata,
        }, req.utilisateur?.id);
        res.status(201).json({ success: true, data: provider });
    } catch (error) { next(error); }
});

/**
 * PATCH /api/platform/facturation/providers/:id
 * Modifier un provider
 */
platformBillingRouter.patch('/providers/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const provider = await providerPaiementService.update(req.params.id, req.body);
        res.json({ success: true, data: provider });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/platform/facturation/providers/:id
 * Supprimer un provider
 */
platformBillingRouter.delete('/providers/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await providerPaiementService.delete(req.params.id);
        res.json({ success: true, message: 'Provider supprimé' });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/providers/:id/test
 * Tester la connexion d'un provider
 */
platformBillingRouter.post('/providers/:id/test', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await providerPaiementService.testConnexion(req.params.id);
        res.json({ success: result.success, data: result });
    } catch (error) { next(error); }
});

// --- ASSIGNMENTS ---

/**
 * GET /api/platform/facturation/providers/:id/assignments
 * Liste les assignments d'un provider
 */
platformBillingRouter.get('/providers/:id/assignments', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const assignments = await providerPaiementService.getAssignments(req.params.id);
        res.json({ success: true, data: assignments });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/providers/assign
 * Assigner un provider à un scope (global/plan/établissement)
 */
platformBillingRouter.post('/providers/assign', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { providerId, scope, planId, etablissementId, priorite } = req.body;
        if (!providerId || !scope) {
            throw new AppError('providerId et scope requis', 400, 'VALIDATION_ERROR');
        }

        const assignment = await providerPaiementService.assign({
            providerId,
            scope: scope as ScopeAssignment,
            planId,
            etablissementId,
            priorite,
        });
        res.status(201).json({ success: true, data: assignment });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/platform/facturation/providers/assignments/:id
 * Supprimer une assignment
 */
platformBillingRouter.delete('/providers/assignments/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await providerPaiementService.unassign(req.params.id);
        res.json({ success: true, message: 'Assignment supprimée' });
    } catch (error) { next(error); }
});

// =============================================
// WORKFLOW ACTIONS CRITIQUES (Lot F v7)
// =============================================

/**
 * GET /api/platform/facturation/actions-critiques/statistiques
 * Statistiques globales des actions critiques
 */
platformBillingRouter.get('/actions-critiques/statistiques', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await actionCritiqueService.getStatistiques();
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/actions-critiques
 * Liste les actions critiques avec filtres et pagination
 */
platformBillingRouter.get('/actions-critiques', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = {
            statut: req.query.statut as StatutActionCritique | undefined,
            typeAction: req.query.typeAction as TypeActionCritique | undefined,
            demandeurId: req.query.demandeurId as string | undefined,
            etablissementId: req.query.etablissementId as string | undefined,
            page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        };
        const result = await actionCritiqueService.listerActions(filters);
        res.json({
            success: true,
            data: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
            stats: {
                enAttente: result.enAttente,
                approuvees: result.approuvees,
                rejetees: result.rejetees,
                executees: result.executees,
                expirees: result.expirees,
            },
        });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/actions-critiques/:id
 * Détail d'une action critique
 */
platformBillingRouter.get('/actions-critiques/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const action = await actionCritiqueService.getAction(req.params.id);
        res.json({ success: true, data: action });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/actions-critiques
 * Demander une action critique (workflow 2F)
 */
platformBillingRouter.post('/actions-critiques', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { typeAction, payload, raison, cibleType, cibleId, etablissementId } = req.body;
        if (!typeAction || !payload) {
            throw new AppError('typeAction et payload requis', 400, 'VALIDATION_ERROR');
        }

        // Vérifier que le type est valide
        if (!Object.values(TypeActionCritique).includes(typeAction)) {
            throw new AppError(`Type d'action invalide: ${typeAction}`, 400, 'TYPE_ACTION_INVALIDE');
        }

        const demandeurId = (req as any).utilisateur?.id;
        if (!demandeurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'NON_AUTHENTIFIE');
        }

        const action = await actionCritiqueService.demanderAction(
            { typeAction, payload, raison, cibleType, cibleId, etablissementId },
            demandeurId,
            req,
        );
        res.status(201).json({ success: true, data: action });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/actions-critiques/:id/approuver
 * Approuver une action critique avec vérification MFA TOTP
 */
platformBillingRouter.post('/actions-critiques/:id/approuver', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { codeMFA, commentaire } = req.body;
        if (!codeMFA) {
            throw new AppError('codeMFA requis (code TOTP à 6 chiffres)', 400, 'VALIDATION_ERROR');
        }

        const approuveurId = (req as any).utilisateur?.id;
        if (!approuveurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'NON_AUTHENTIFIE');
        }

        const action = await actionCritiqueService.approuverAction(
            req.params.id,
            approuveurId,
            { codeMFA, commentaire },
            req,
        );
        res.json({ success: true, data: action });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/actions-critiques/:id/rejeter
 * Rejeter une action critique avec motif
 */
platformBillingRouter.post('/actions-critiques/:id/rejeter', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { motif } = req.body;
        if (!motif) {
            throw new AppError('motif de rejet requis', 400, 'VALIDATION_ERROR');
        }

        const rejecteurId = (req as any).utilisateur?.id;
        if (!rejecteurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'NON_AUTHENTIFIE');
        }

        const action = await actionCritiqueService.rejeterAction(
            req.params.id,
            rejecteurId,
            { motif },
            req,
        );
        res.json({ success: true, data: action });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/actions-critiques/:id/annuler
 * Annuler une action critique (par le demandeur)
 */
platformBillingRouter.post('/actions-critiques/:id/annuler', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const demandeurId = (req as any).utilisateur?.id;
        if (!demandeurId) {
            throw new AppError('Utilisateur non authentifié', 401, 'NON_AUTHENTIFIE');
        }

        const action = await actionCritiqueService.annulerAction(
            req.params.id,
            demandeurId,
            req,
        );
        res.json({ success: true, data: action });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/actions-critiques/:id/executer
 * Marquer une action comme exécutée (après l'opération réelle)
 */
platformBillingRouter.post('/actions-critiques/:id/executer', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resultat = req.body.resultat || { succes: true };
        const action = await actionCritiqueService.executerAction(
            req.params.id,
            resultat,
            req,
        );
        res.json({ success: true, data: action });
    } catch (error) { next(error); }
});

// =============================================
// Exports
// =============================================

export { platformBillingRouter, clientBillingRouter };
export default { platformBillingRouter, clientBillingRouter };
