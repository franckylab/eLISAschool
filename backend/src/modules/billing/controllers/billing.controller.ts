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
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
    Facture,
    StatutFacture,
    LigneFacture,
    TypeLigneFacture,
    AbonnementModule,
    FeatureFlagTenant,
    ModuleCatalogue,
    CategorieModule,
} from '../entities';
import { FacturationService } from '../services/facturation.service';
import { FeatureFlagService } from '../services/feature-flags.service';
import { quotaService } from '../services/quota.service';
import { FacturePdfService } from '../services/facture-pdf.service';
// TrancheConfigService supprimé (Refonte v3 — tarification prix/élève + franchise)
// Phase 7 Lot A — Refonte SaaS v7 (catalogue modules unifié)
// ModuleResolutionService supprimé (fusion P0.1) — utiliser entitlementService
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
// Refonte SaaS — Unification Modules (migration 200)
import { entitlementService } from '../services/entitlement.service';
// Migration 210 — Refonte Feature Flags (registre centralisé)
import { featureFlagDefinitionService } from '../services/feature-flag-definition.service';
import { CategorieFlag, TypeFlag } from '../entities/feature-flag-definition.entity';
import { ActionFeatureFlag } from '../entities/feature-flag-history.entity';

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
            order: { rang: 'ASC', ordre: 'ASC' },
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
            relations: ['abonnements'],
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
        const {
            nom, slug, description, prixBase, devise,
            rang, estParDefaut, visiblePubliquement,
            tarification, quotas, entitlements, cyclesAutorises, essai,
            ordre, badge,
        } = req.body;

        if (!nom || !slug) {
            throw new AppError('nom et slug requis', 400, 'MISSING_FIELDS');
        }

        // Un seul plan par défaut
        if (estParDefaut === true) {
            await planRepo.update({ estParDefaut: true }, { estParDefaut: false });
        }

        const plan = planRepo.create({
            nom, slug, description,
            prixBase: prixBase ?? tarification?.prixBase ?? 0,
            devise: devise || 'XAF',
            rang: rang || 0,
            estParDefaut: estParDefaut || false,
            visiblePubliquement: visiblePubliquement ?? true,
            tarification: tarification || { prixBase: prixBase || 0, prixParEleve: 0, elevesInclusGratuits: 0 },
            quotas: quotas || {},
            entitlements: entitlements || { modules: [], fonctionnalites: [] },
            cyclesAutorises: cyclesAutorises || ['MENSUEL', 'ANNUEL'],
            essai: essai || { autorise: false },
            statut: StatutPlan.ACTIF,
            ordre: ordre || 0,
            badge,
        });

        const saved = await planRepo.save(plan);
        void entitlementService.invalidate();
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

        // Un seul plan par défaut
        if (req.body.estParDefaut === true) {
            await planRepo.update({ estParDefaut: true }, { estParDefaut: false });
        }

        Object.assign(plan, req.body);
        const saved = await planRepo.save(plan);
        void entitlementService.invalidate();
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

// --- TRANCHES supprimées (Refonte v3 — tarification prix/élève + franchise) ---

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

// --- MODULES OPTIONNELS supprimés (Refonte v3 — catalogue unique modules_catalogue) ---

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
        void entitlementService.invalidate(); // fusion P0.1 — entitlementService remplace moduleResolutionService
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
        void entitlementService.invalidate(); // fusion P0.1
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
        void entitlementService.invalidate(); // fusion P0.1
        res.json({ success: true, data: { id: entree.id } });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/modules/catalogue/sync
 * Re-synchronise le catalogue depuis les seeds (upsert idempotent)
 */
platformBillingRouter.post('/modules/catalogue/sync', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const total = await seedModulesCatalogue(true);
        void entitlementService.invalidate(); // fusion P0.1
        res.json({ success: true, data: { total } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/modules/catalogue/resolution
 * Résolution des modules activés pour un établissement (cascade entitlement complète)
 */
platformBillingRouter.get('/modules/catalogue/resolution', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { etablissementId } = req.query as { etablissementId?: string };
        if (!etablissementId) {
            throw new AppError('Paramètre etablissementId requis', 400, 'VALIDATION_ERROR');
        }
        const modules = await entitlementService.getResolvedModules(etablissementId);
        res.json({ success: true, data: modules });
    } catch (error) {
        next(error);
    }
});

// =============================================
// MODULE BUILDER (Plateforme — SUPER_ADMIN)
// =============================================

/**
 * POST /api/platform/facturation/modules/builder/:id/duplicate
 * Dupliquer un module du catalogue
 */
platformBillingRouter.post('/modules/builder/:id/duplicate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const original = await repo.findOne({ where: { id: req.params.id } });
        if (!original) throw new AppError('Module introuvable', 404, 'MODULE_NOT_FOUND');

        const { code, nom } = req.body;
        const nouveauCode = code || `${original.code}_copy`;
        const existant = await repo.findOne({ where: { code: nouveauCode } });
        if (existant) throw new AppError(`Un module avec le code "${nouveauCode}" existe déjà`, 409, 'MODULE_EXISTS');

        const duplique = repo.create({
            ...original,
            id: undefined,
            code: nouveauCode,
            nom: nom || `${original.nom} (copie)`,
            estSysteme: false,
            createdAt: undefined,
            updatedAt: undefined,
        });
        const saved = await repo.save(duplique);
        void entitlementService.invalidate();
        res.status(201).json({ success: true, data: saved });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/modules/builder/import
 * Importer un module depuis un JSON
 */
platformBillingRouter.post('/modules/builder/import', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const data = req.body;

        if (!data.code || !data.nom) {
            throw new AppError('Les champs "code" et "nom" sont requis', 400, 'VALIDATION_ERROR');
        }

        const existant = await repo.findOne({ where: { code: data.code } });
        if (existant) {
            throw new AppError(`Un module avec le code "${data.code}" existe déjà`, 409, 'MODULE_EXISTS');
        }

        const entree = repo.create({
            ...data,
            estSysteme: false,
        });
        const saved = await repo.save(entree);
        void entitlementService.invalidate();
        res.status(201).json({ success: true, data: saved });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/modules/builder/:id/export
 * Exporter un module en JSON
 */
platformBillingRouter.get('/modules/builder/:id/export', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const module = await repo.findOne({ where: { id: req.params.id } });
        if (!module) throw new AppError('Module introuvable', 404, 'MODULE_NOT_FOUND');

        const exportData = {
            code: module.code,
            nom: module.nom,
            nomEn: module.nomEn,
            description: module.description,
            descriptionEn: module.descriptionEn,
            categorie: module.categorie,
            icone: module.icone,
            prixMensuel: module.prixMensuel,
            prixAnnuel: module.prixAnnuel,
            estFacturable: module.estFacturable,
            estSouscriptible: module.estSouscriptible,
            actifParDefaut: module.actifParDefaut,
            planMinimal: module.planMinimal,
            dependencies: module.dependencies,
            permissionsRequises: module.permissionsRequises,
            config: module.config,
            ordre: module.ordre,
        };

        res.json({ success: true, data: exportData });
    } catch (error) { next(error); }
});

// --- FEATURE FLAGS (plateforme) ---

// --- DÉFINITIONS (registre centralisé — Migration 210) ---

/**
 * GET /api/platform/facturation/feature-flags/definitions
 * Liste toutes les définitions de feature flags
 */
platformBillingRouter.get('/feature-flags/definitions', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const definitions = await featureFlagDefinitionService.findAllDefinitions();
        res.json({ success: true, data: definitions });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/feature-flags/definitions/expired
 * Flags avec expiration dépassée
 */
platformBillingRouter.get('/feature-flags/definitions/expired', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const expired = await featureFlagDefinitionService.findExpiredFlags();
        const orphans = await featureFlagDefinitionService.findOrphanFlags();
        res.json({ success: true, data: { expired, orphans } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/feature-flags/definitions/by-category
 * Flags groupés par catégorie
 */
platformBillingRouter.get('/feature-flags/definitions/by-category', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const grouped = await featureFlagDefinitionService.getFlagsByCategorie();
        res.json({ success: true, data: grouped });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/feature-flags/definitions
 * Créer une nouvelle définition de feature flag
 */
platformBillingRouter.post('/feature-flags/definitions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, label, description, categorie, type, valeurDefaut, planMinimal, rolloutPercentage, segments, estSysteme, expiresAt } = req.body;
        if (!cle || !label) {
            throw new AppError('cle et label requis', 400, 'MISSING_FIELDS');
        }

        const definition = await featureFlagDefinitionService.createDefinition(
            { cle, label, description, categorie, type, valeurDefaut, planMinimal, rolloutPercentage, segments, estSysteme, expiresAt: expiresAt ? new Date(expiresAt) : undefined },
            req.utilisateur?.id
        );

        res.status(201).json({ success: true, data: definition });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/platform/facturation/feature-flags/definitions/:id
 * Modifier une définition
 */
platformBillingRouter.patch('/feature-flags/definitions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const dto = req.body;

        if (dto.expiresAt) {
            dto.expiresAt = new Date(dto.expiresAt);
        }

        const definition = await featureFlagDefinitionService.updateDefinition(id, dto, req.utilisateur?.id);
        res.json({ success: true, data: definition });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/feature-flags/definitions/:id
 * Supprimer une définition (sauf est_systeme=true)
 */
platformBillingRouter.delete('/feature-flags/definitions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await featureFlagDefinitionService.deleteDefinition(req.params.id, req.utilisateur?.id);
        res.json({ success: true, message: 'Définition supprimée' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/feature-flags/history
 * Historique d'audit des feature flags (paginé)
 */
platformBillingRouter.get('/feature-flags/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, limit, flagDefinitionId, etablissementId, action } = req.query;
        const history = await featureFlagDefinitionService.getHistory({
            page: page ? parseInt(page as string, 10) : undefined,
            limit: limit ? parseInt(limit as string, 10) : undefined,
            flagDefinitionId: flagDefinitionId as string,
            etablissementId: etablissementId as string,
            action: action as ActionFeatureFlag,
        });
        res.json({ success: true, data: { data: history.data, total: history.total } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/feature-flags/:etablissementId/metadata
 * Flags + métadonnées pour un établissement
 */
platformBillingRouter.get('/feature-flags/:etablissementId/metadata', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const featureFlagService = new FeatureFlagService();
        const flags = await featureFlagService.getAllFlagsWithMetadata(req.params.etablissementId);
        res.json({ success: true, data: flags });
    } catch (error) {
        next(error);
    }
});

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

        // Log dans l'historique
        const definition = await featureFlagDefinitionService.findDefinitionByCle(flagName);
        if (definition) {
            await featureFlagDefinitionService.logHistory({
                flagDefinitionId: definition.id,
                etablissementId,
                action: enabled ? ActionFeatureFlag.TOGGLE_ON : ActionFeatureFlag.TOGGLE_OFF,
                ancienneValeur: String(!enabled),
                nouvelleValeur: String(enabled),
                modifiePar: req.utilisateur?.id,
            });
        }

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
            relations: ['plan'],
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
            where: { actif: true, visible: true, visiblePubliquement: true },
            order: { rang: 'ASC', ordre: 'ASC' },
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
 * Simuler un plan avec un nombre d'élèves donné (formule v3 :
 * prixBase + max(0, nbÉlèves − franchise) × prixParEleve, coef cycle).
 */
clientBillingRouter.post('/simuler', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { planId, nombreEleves, cycleFacturation } = req.body;
        if (!planId || !nombreEleves) {
            throw new AppError('planId et nombreEleves requis', 400, 'MISSING_FIELDS');
        }

        const planRepo = AppDataSource.getRepository(PlanAbonnement);
        const plan = await planRepo.findOne({ where: { id: planId, actif: true } });
        if (!plan) throw new AppError('Plan introuvable', 404, 'PLAN_NOT_FOUND');

        const facturationService = new FacturationService();
        const calcul = await facturationService.calculerMontantMensuel(
            planId,
            nombreEleves,
            undefined,
            cycleFacturation || 'MENSUEL'
        );

        res.json({
            success: true,
            data: {
                plan: { id: plan.id, nom: plan.nom, slug: plan.slug },
                nombreEleves,
                prixBase: calcul.montantBase,
                montantElevesSupplementaires: calcul.montantElevesSupplementaires,
                coefCycle: calcul.coefCycle,
                montantHT: calcul.montantHT,
                montantTVA: calcul.montantTVA,
                montantTotal: calcul.montantTotal,
                devise: plan.devise,
                cycleFacturation: calcul.cycleCode,
                modulesInclus: plan.entitlements?.modules ?? [],
                fonctionnalitesIncluses: plan.entitlements?.fonctionnalites ?? [],
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
                type: TypeLigneFacture.REMISE,
                quantite: 1,
                montant: -montantAvoir,
                total: -montantAvoir,
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
// MODULES — Routes client (ADMIN)
// Routes tranches supprimées (Refonte v3 — tarification prix/élève + franchise)
// =============================================

/**
 * GET /api/billing/modules/resolved
 * Résout les modules activés pour l'établissement (via entitlementService — source unique)
 */
clientBillingRouter.get('/modules/resolved', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const modules = await entitlementService.getResolvedModules(etablissementId);
        res.json({ success: true, data: modules });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/entitlement/resolve?codes=a,b,c
 * Refonte v3 — résolution batch des entitlements pour une liste de modules.
 * Retourne le verdict complet par code (accessible, raison, source, plan…).
 */
clientBillingRouter.get('/entitlement/resolve', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const codesParam = (req.query.codes as string) || '';
        const codes = codesParam.split(',').map((c) => c.trim()).filter(Boolean);

        const [resultats, statutAbo] = await Promise.all([
            codes.length ? entitlementService.resolveBatch(etablissementId, codes) : entitlementService.checkAll(etablissementId),
            entitlementService.getStatutAbonnement(etablissementId),
        ]);

        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
        res.json({
            success: true,
            data: {
                modules: resultats,
                abonnement: statutAbo,
            },
        });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/modules/catalogue
 * Catalogue filtré : modules accessibles + upgradables (teasing sans prix).
 * Source unique : entitlementService (fusion P0.1 — Faille G1 corrigée)
 */
clientBillingRouter.get('/modules/catalogue', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const allModules = await entitlementService.checkAll(etablissementId);

        // Filtrer : accessibles + upgradables (visibles mais non accessibles, SANS prix)
        const accessibles = allModules
            .filter((m) => m.entitlement.accessible)
            .map((m) => ({
                code: m.code,
                nom: m.nom,
                icone: m.icone,
                categorie: m.categorie,
                accessible: true,
                source: m.entitlement.source,
                raison: m.entitlement.raison,
            }));

        const upgradables = allModules
            .filter((m) => !m.entitlement.accessible && m.entitlement.visible)
            .map((m) => ({
                code: m.code,
                nom: m.nom,
                icone: m.icone,
                categorie: m.categorie,
                accessible: false,
                raison: m.entitlement.raison,
                planMinimalRequis: m.entitlement.planMinimalRequis,
                planActuel: m.entitlement.planActuel,
            }));

        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
        res.json({ success: true, data: { accessibles, upgradables } });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/modules/mes-modules
 * Catalogue filtré pour l'établissement : modules actifs + upgradables (teasing sans prix).
 * Source unique de vérité : entitlementService.
 *
 * Réponse : {
 *   actifs: ModuleResolu[],       — modules accessibles (avec raison, source)
 *   upgradables: ModuleTeasing[],  — modules non accessibles mais visibles (SANS prix)
 *   abonnement: { statut, plan, dateFin } | null
 * }
 *
 * Refonte SaaS — Unification Modules (migration 200) — Faille G1
 */
clientBillingRouter.get('/modules/mes-modules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        // Résolution complète via entitlementService (source unique de vérité)
        const allModules = await entitlementService.checkAll(etablissementId);

        // Séparer actifs / upgradables
        const actifs = allModules
            .filter((m) => m.entitlement.accessible)
            .map((m) => ({
                code: m.code,
                nom: m.nom,
                categorie: m.categorie,
                accessible: true,
                raison: m.entitlement.raison,
                source: m.entitlement.source,
                planActuel: m.entitlement.planActuel,
            }));

        const upgradables = allModules
            .filter((m) => !m.entitlement.accessible && m.entitlement.visible)
            .map((m) => ({
                code: m.code,
                nom: m.nom,
                icone: m.icone || '',
                description: m.entitlement.message || null,
                categorie: m.categorie,
                accessible: false,
                raison: m.entitlement.raison,
                planMinimalRequis: m.entitlement.planMinimalRequis,
                planActuel: m.entitlement.planActuel,
            }));

        // Info abonnement
        const statutAbo = await entitlementService.getStatutAbonnement(etablissementId);

        // Date fin abonnement (si actif)
        let dateFin: string | null = null;
        if (statutAbo.actif) {
            const aboRepo = AppDataSource.getRepository(AbonnementClient);
            const abo = await aboRepo.findOne({
                where: { etablissementId, statut: StatutAbonnement.ACTIF },
                select: ['dateFin'],
            });
            dateFin = abo?.dateFin?.toISOString() || null;
        }

        // P1.3 — Header X-Cache-Status (HIT|MISS|STALE) — doit être avant res.json()
        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);

        res.json({
            success: true,
            data: {
                actifs,
                upgradables,
                abonnement: statutAbo.statut !== 'AUCUN'
                    ? { ...statutAbo, dateFin }
                    : null,
            },
        });
    } catch (error) { next(error); }
});

// --- REMISES (client — lecture) ---

/**
 * @deprecated v4.0 — Utiliser GET /api/billing/promotions/eligibles à la place.
 */
clientBillingRouter.get('/remises', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { remiseService } = await import('../services/remise.service');
        const remises = await remiseService.findAll({ actif: true });
        res.json({ success: true, data: remises });
    } catch (error) { next(error); }
});

/**
 * @deprecated v4.0 — Utiliser POST /api/billing/promotions/verifier-coupon à la place.
 */
clientBillingRouter.get('/remises/verify', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const code = (req.query.code as string || '').trim();
        if (!code) {
            res.json({ success: true, data: { valide: false, message: 'Code requis' } });
            return;
        }
        const { remiseService } = await import('../services/remise.service');
        const remise = await remiseService.findByCoupon(code);
        if (!remise) {
            res.json({ success: true, data: { valide: false, message: 'Code promo invalide ou expiré' } });
            return;
        }
        // Vérifier les conditions supplémentaires
        const now = new Date();
        if (remise.dateFin && now > new Date(remise.dateFin)) {
            res.json({ success: true, data: { valide: false, message: 'Code promo expiré' } });
            return;
        }
        if (remise.maxUtilisations !== null && remise.maxUtilisations !== undefined && remise.utilisations >= remise.maxUtilisations) {
            res.json({ success: true, data: { valide: false, message: 'Code promo épuisé' } });
            return;
        }
        res.json({
            success: true,
            data: {
                valide: true,
                code: remise.code,
                nom: remise.nom,
                typeRemise: remise.typeRemise,
                valeur: Number(remise.valeur),
            },
        });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/mon-abonnement/detail
 * Détail complet de l'abonnement : plan + packs + remises + quotas effectifs
 */
clientBillingRouter.get('/mon-abonnement/detail', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({
            where: [
                { etablissementId, statut: StatutAbonnement.ACTIF },
                { etablissementId, statut: StatutAbonnement.ESSAI },
            ],
            relations: ['plan'],
            order: { createdAt: 'DESC' },
        });

        if (!abonnement) {
            res.json({ success: true, data: null });
            return;
        }

        // Packs souscrits
        const { packQuotaService } = await import('../services/pack-quota.service');
        const packsSouscrits = await packQuotaService.getPacksSouscrits(abonnement.id);

        // Promotions actives (v4) — contexte enrichci pour évaluation correcte des conditions
        const { promotionService } = await import('../services/promotion.service');
        const promosEligibles = await promotionService.trouverPromotionsEligibles({
            planId: abonnement.planId,
            etablissementId,
            nombreEleves: abonnement.nombreElevesActuel,
            dateDebutAbonnement: abonnement.dateDebut,
            dateFinAbonnement: abonnement.dateFin,
            packsSouscritsIds: packsSouscrits.map((p: any) => p.packId || p.id),
        });

        // Quotas effectifs par ressource
        const ressources = ['eleves', 'utilisateurs', 'classes', 'stockageGo', 'sms'];
        const quotasEffectifs: Record<string, any> = {};
        for (const ressource of ressources) {
            const qe = await packQuotaService.quotaEffectif(etablissementId, ressource);
            // Utilisation actuelle
            const { UsageUnifie } = await import('../entities/usage-unifie.entity');
            const usageRepo = AppDataSource.getRepository(UsageUnifie);
            const utilisation = await usageRepo.count({
                where: { etablissementId, ressource } as any,
            });
            quotasEffectifs[ressource] = { ...qe, utilisation };
        }

        res.json({
            success: true,
            data: {
                ...abonnement,
                packsSouscrits,
                promotionsEligibles: promosEligibles,
                quotasEffectifs,
            },
        });
    } catch (error) { next(error); }
});

// --- PACKS QUOTA (client — catalogue + souscription) ---

/**
 * GET /api/billing/packs
 * Catalogue des packs quota disponibles
 */
clientBillingRouter.get('/packs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { packQuotaService } = await import('../services/pack-quota.service');
        const packs = await packQuotaService.findAllPacks({ actif: true });
        res.json({ success: true, data: packs });
    } catch (error) { next(error); }
});

/**
 * GET /api/billing/packs/souscrits
 * Packs souscrits par le tenant
 */
clientBillingRouter.get('/packs/souscrits', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({
            where: [
                { etablissementId, statut: StatutAbonnement.ACTIF },
                { etablissementId, statut: StatutAbonnement.ESSAI },
            ],
            order: { createdAt: 'DESC' },
        });
        if (!abonnement) {
            res.json({ success: true, data: [] });
            return;
        }
        const { packQuotaService } = await import('../services/pack-quota.service');
        const souscrits = await packQuotaService.getPacksSouscrits(abonnement.id);
        res.json({ success: true, data: souscrits });
    } catch (error) { next(error); }
});

/**
 * POST /api/billing/packs/:id/souscrire
 * Souscrire un pack quota (facturation prorata)
 */
clientBillingRouter.post('/packs/:id/souscrire', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);
        const { packQuotaService } = await import('../services/pack-quota.service');
        const souscription = await packQuotaService.souscrirePack(etablissementId, req.params.id);
        res.status(201).json({ success: true, data: souscription });
    } catch (error) { next(error); }
});

// --- CYCLES DE FACTURATION (client — lecture) ---

/**
 * GET /api/billing/cycles
 * Cycles de facturation disponibles
 */
clientBillingRouter.get('/cycles', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const { CycleFacturationConfig } = await import('../entities/cycle-facturation-config.entity');
        const cycleRepo = AppDataSource.getRepository(CycleFacturationConfig);
        const cycles = await cycleRepo.find({ where: { actif: true }, order: { ordre: 'ASC' } });
        res.json({ success: true, data: cycles });
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

// Routes tranches groupe supprimées (Refonte v3 — tarification prix/élève + franchise)

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
// ANALYTICS MODULES (P6.1 — client)
// =============================================

/**
 * GET /api/billing/analytics/mes-modules
 * Usage des modules pour l'établissement authentifié
 */
clientBillingRouter.get('/analytics/mes-modules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { moduleAnalyticsService } = await import('@modules/monitoring/services/module-analytics.service');
        const usage = await moduleAnalyticsService.getEtablissementUsage(etablissementId);
        res.json({ success: true, data: usage });
    } catch (error) { next(error); }
});

// =============================================
// WEBHOOKS MODULES (P7.1 — plateforme)
// =============================================

/**
 * GET /api/platform/facturation/webhooks/modules
 * Liste les webhooks configurés
 */
platformBillingRouter.get('/webhooks/modules', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const { webhookDeliveryService } = await import('../services/webhook-delivery.service');
        const webhooks = await webhookDeliveryService.listWebhooks();
        res.json({ success: true, data: webhooks });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/facturation/webhooks/modules
 * Configurer un nouveau webhook
 */
platformBillingRouter.post('/webhooks/modules', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url, secret, events, description } = req.body;
        if (!url || !secret) throw new AppError('URL et secret requis', 400, 'VALIDATION_ERROR');

        const { webhookDeliveryService } = await import('../services/webhook-delivery.service');
        const webhook = await webhookDeliveryService.addWebhook({
            url,
            secret,
            events: events || ['*'],
            actif: true,
            description,
        });
        res.status(201).json({ success: true, data: webhook });
    } catch (error) { next(error); }
});

/**
 * DELETE /api/platform/facturation/webhooks/modules/:id
 * Supprimer un webhook
 */
platformBillingRouter.delete('/webhooks/modules/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { webhookDeliveryService } = await import('../services/webhook-delivery.service');
        const removed = await webhookDeliveryService.removeWebhook(req.params.id);
        if (!removed) throw new AppError('Webhook non trouvé', 404, 'WEBHOOK_NOT_FOUND');
        res.json({ success: true, message: 'Webhook supprimé' });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/facturation/webhooks/modules/logs
 * Logs de delivery des webhooks
 */
platformBillingRouter.get('/webhooks/modules/logs', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const { webhookDeliveryService } = await import('../services/webhook-delivery.service');
        const logs = await webhookDeliveryService.getLogs(limit);
        res.json({ success: true, data: logs });
    } catch (error) { next(error); }
});

// Routes COMMERCE v3 (remises, packs, cycles) — voir platform.routes.ts
// Ces routes sont montées directement sur le router plateforme (/api/platform/*)
// et ne doivent PAS être dupliquées ici dans platformBillingRouter.

// =============================================
// Exports
// =============================================

export { platformBillingRouter, clientBillingRouter };
export default { platformBillingRouter, clientBillingRouter };
