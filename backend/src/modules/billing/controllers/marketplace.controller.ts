/**
 * ==================================
 * eLISAschool - Marketplace Controller (Refonte v3)
 * ==================================
 *
 * Point d'entrée UNIQUE côté tenant pour le marché des modules,
 * fonctionnalités et packs quota.
 *
 * Refonte v3 (migration 213) :
 *   - Catégorisation binaire GRATUIT | PAYANT (fin BASE/PREMIUM/ADDON)
 *   - Statut marché `inclusParPlan` résolu par EntitlementService
 *   - Listage combiné modules + fonctionnalités (feature flags)
 *   - Achat de packs quota au dépassement (prorata du cycle)
 *   - Suppression de ModuleOptionnel (catalogue unique modules_catalogue)
 *
 * Routes client (authMiddleware) :
 *   GET  /api/billing/marketplace                — Modules + fonctionnalités résolus
 *   GET  /api/billing/marketplace/mes-modules    — Tous les modules résolus (toggle ON/OFF)
 *   GET  /api/billing/marketplace/usage          — Usage unifié + quotas effectifs
 *   GET  /api/billing/marketplace/packs          — Packs quota disponibles
 *   POST /api/billing/marketplace/packs/:packId/souscrire — Achat d'un pack
 *   GET  /api/billing/marketplace/:code          — Détail d'un module
 *   PUT  /api/billing/marketplace/:code/toggle   — Activer/désactiver un module
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@database/data-source';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { FeatureFlagDefinition } from '../entities/feature-flag-definition.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { entitlementService } from '../services/entitlement.service';
import { configurationService } from '@modules/configuration/services/configuration.service';
import { packQuotaService } from '../services/pack-quota.service';
import { quotaService } from '../services/quota.service';
import { logger } from '@common/utils/logger.util';

const router = Router();

/**
 * Résout l'etablissementId depuis plusieurs sources (cascade) :
 * 1. req.etablissementId (middleware tenant)
 * 2. req.utilisateur.etablissementId (JWT token)
 * 3. req.query.etablissementId (override SUPER_ADMIN)
 */
function resoudreEtablissementId(req: Request): string | undefined {
    return req.etablissementId
        || req.utilisateur?.etablissementId
        || (req.query.etablissementId as string)
        || undefined;
}

// =============================================
// GET /api/billing/marketplace/mes-modules
// Tous les modules résolus pour l'établissement (avec entitlement + toggle state)
// =============================================
router.get('/mes-modules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const modules = await entitlementService.getResolvedModules(etablissementId);
        const statut = await entitlementService.getStatutAbonnement(etablissementId);

        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
        res.json({
            success: true,
            data: {
                modules,
                abonnement: statut,
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// GET /api/billing/marketplace/usage
// Usage unifié + quotas effectifs (plan + packs)
// =============================================
router.get('/usage', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const quotas = await quotaService.getQuotasEtablissement(etablissementId);
        const statut = await entitlementService.getStatutAbonnement(etablissementId);

        res.json({ success: true, data: { quotas, abonnement: statut } });
    } catch (error) { next(error); }
});

// =============================================
// GET /api/billing/marketplace/packs
// Packs quota disponibles à l'achat
// =============================================
router.get('/packs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const packs = await packQuotaService.findAllPacks({ actif: true });
        res.json({ success: true, data: packs });
    } catch (error) { next(error); }
});

// =============================================
// POST /api/billing/marketplace/packs/:packId/souscrire
// Achat d'un pack quota (prorata du cycle restant)
// =============================================
router.post('/packs/:packId/souscrire', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const souscription = await packQuotaService.souscrirePack(etablissementId, req.params.packId);

        res.status(201).json({
            success: true,
            data: souscription,
            message: 'Pack quota souscrit — le quota effectif est immédiatement disponible',
        });
    } catch (error) { next(error); }
});

// =============================================
// PUT /api/billing/marketplace/:code/toggle
// Activer ou désactiver un module (override tenant via ParametreSysteme)
// =============================================
router.put('/:code/toggle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const { actif } = req.body as { actif: boolean };
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        if (typeof actif !== 'boolean') {
            throw new AppError('Le champ "actif" (boolean) est requis', 400, 'VALIDATION_ERROR');
        }

        // Vérifier que le module existe dans le catalogue
        const catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        const moduleCatalogue = await catalogueRepo.findOne({ where: { code, estActif: true } });
        if (!moduleCatalogue) {
            throw new AppError(`Module "${code}" non trouvé ou désactivé`, 404, 'MODULE_NOT_FOUND');
        }

        // Vérifier l'entitlement (le module doit être accessible pour être toggle)
        const entitlement = await entitlementService.check(etablissementId, code);
        if (!entitlement.accessible && actif) {
            throw new AppError(
                `Impossible d'activer "${code}" : ${entitlement.message || 'module non accessible'}`,
                403,
                entitlement.raison,
            );
        }

        // Modules critiques : toujours actifs, non désactivables (v3 — ex "modules de base")
        if (moduleCatalogue.estCritique && !actif) {
            throw new AppError(
                `Le module "${code}" est un module critique et ne peut pas être désactivé`,
                403,
                'MODULE_CRITIQUE_NON_DESACTIVABLE',
            );
        }

        // Toggle via configurationService (gère les dépendances + ParametreSysteme)
        const result = await configurationService.toggleModule(
            code,
            actif,
            etablissementId,
            req.utilisateur?.id,
            req,
        );

        // Invalider le cache entitlement pour refléter le changement
        entitlementService.invalidate(etablissementId);

        logger.info(
            `[Marketplace] Toggle module "${code}" → ${actif ? 'ACTIF' : 'INACTIF'} — Établissement: ${etablissementId}`,
        );

        res.json({
            success: true,
            data: {
                code,
                actif,
                message: result.message,
                modulesAutoActive: result.modulesAutoActive || [],
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// GET /api/billing/marketplace
// Liste combinée modules + fonctionnalités avec statut marché v3
// (inclusParPlan / gratuit / payant / usage)
// =============================================
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        // Modules résolus (source : EntitlementService — inclusParPlan inclus)
        const modulesResolus = await entitlementService.getResolvedModules(etablissementId);

        // Fonctionnalités du plan (feature flag definitions + entitlements plan)
        const flagRepo = AppDataSource.getRepository(FeatureFlagDefinition);
        const flags = await flagRepo.find({ where: { estActif: true }, order: { categorie: 'ASC', cle: 'ASC' } });
        const statut = await entitlementService.getStatutAbonnement(etablissementId);

        let fonctionnalitesPlan: string[] = [];
        if (statut.planSlug) {
            const planRepo = AppDataSource.getRepository(PlanAbonnement);
            const plan = await planRepo.findOne({ where: { slug: statut.planSlug } });
            fonctionnalitesPlan = plan?.entitlements?.fonctionnalites ?? [];
        }

        const fonctionnalites = flags.map((flag) => ({
            cle: flag.cle,
            nom: flag.label,
            description: flag.description,
            categorie: flag.categorie,
            categorieCommerciale: flag.categorieCommerciale,
            incluseParPlan: fonctionnalitesPlan.includes(flag.cle),
        }));

        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
        res.json({
            success: true,
            data: {
                modules: modulesResolus,
                fonctionnalites,
                abonnement: statut,
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// GET /api/billing/marketplace/:code
// Détail d'un module (description complète + statut marché)
// =============================================
router.get('/:code', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const moduleCatalogue = await repo.findOne({ where: { code, estActif: true } });
        if (!moduleCatalogue) throw new AppError('Module non trouvé', 404, 'MODULE_NOT_FOUND');

        const entitlement = await entitlementService.check(etablissementId, code);

        res.json({
            success: true,
            data: {
                id: moduleCatalogue.id,
                code: moduleCatalogue.code,
                nom: moduleCatalogue.nom,
                nomEn: moduleCatalogue.nomEn,
                description: moduleCatalogue.description,
                descriptionEn: moduleCatalogue.descriptionEn,
                icone: moduleCatalogue.icone,
                categorie: moduleCatalogue.categorie,
                estCritique: moduleCatalogue.estCritique,
                prixMensuel: moduleCatalogue.prixMensuel,
                prixAnnuel: moduleCatalogue.prixAnnuel,
                estFacturable: moduleCatalogue.estFacturable,
                dependencies: moduleCatalogue.dependencies,
                accessible: entitlement.accessible,
                inclusParPlan: entitlement.source === 'plan',
                entitlementMessage: entitlement.message,
                config: moduleCatalogue.config,
            },
        });
    } catch (error) { next(error); }
});

export const marketplaceRouter = router;
export default router;
