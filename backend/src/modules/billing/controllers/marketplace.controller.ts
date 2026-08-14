/**
 * ==================================
 * eLISAschool - Marketplace Controller
 * ==================================
 * Refonte SaaS v9 — Consolidation & Déduplication
 *
 * Point d'entrée UNIQUE côté tenant pour la gestion des modules.
 * Utilise EntitlementService (source unique) + ConfigurationService (toggle).
 *
 * Routes client (authMiddleware) :
 *   GET  /api/billing/marketplace              — Liste add-ons (teasing)
 *   GET  /api/billing/marketplace/mes-modules  — Tous les modules résolus (toggle ON/OFF)
 *   GET  /api/billing/marketplace/:code        — Détail add-on
 *   PUT  /api/billing/marketplace/:code/toggle — Activer/désactiver un module
 *   POST /api/billing/marketplace/:code/essayer — Essai 7 jours
 *   POST /api/billing/marketplace/:code/souscrire — Souscription
 */

import { Router, Request, Response, NextFunction } from 'express';
import { In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { ModuleOptionnel } from '../entities/module-optionnel.entity';
import { entitlementService } from '../services/entitlement.service';
import { configurationService } from '@modules/configuration/services/configuration.service';
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

        // Modules de base : toujours actifs, non désactivables
        if (moduleCatalogue.categorie === CategorieModule.BASE && !actif) {
            throw new AppError(
                `Le module "${code}" est un module de base et ne peut pas être désactivé`,
                403,
                'MODULE_BASE_NON_DESACTIVABLE',
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
// Liste les add-ons disponibles (teasing — sans prix détaillés)
// =============================================
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const addons = await repo.find({
            where: { estActif: true, categorie: CategorieModule.ADDON },
            order: { ordre: 'ASC' },
        });

        // Vérifier l'état de chaque add-on pour l'établissement
        const results = await Promise.all(
            addons.map(async (addon) => {
                const entitlement = await entitlementService.check(etablissementId, addon.code);
                return {
                    id: addon.id,
                    code: addon.code,
                    nom: addon.nom,
                    description: addon.description,
                    icone: addon.icone,
                    categorie: addon.categorie,
                    accessible: entitlement.accessible,
                    estSouscriptible: addon.estSouscriptible,
                    // Teasing : ne pas exposer les prix détaillés
                    aPrix: addon.prixMensuel > 0 || addon.prixAnnuel > 0,
                    planMinimal: addon.planMinimal,
                };
            })
        );

        res.setHeader('X-Cache-Status', entitlementService.lastCacheStatus);
        res.json({ success: true, data: results });
    } catch (error) { next(error); }
});

// =============================================
// GET /api/billing/marketplace/:code
// Détail d'un add-on (description complète)
// =============================================
router.get('/:code', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const addon = await repo.findOne({ where: { code, estActif: true } });
        if (!addon) throw new AppError('Add-on non trouvé', 404, 'ADDON_NOT_FOUND');

        const entitlement = await entitlementService.check(etablissementId, code);

        res.json({
            success: true,
            data: {
                id: addon.id,
                code: addon.code,
                nom: addon.nom,
                nomEn: addon.nomEn,
                description: addon.description,
                descriptionEn: addon.descriptionEn,
                icone: addon.icone,
                categorie: addon.categorie,
                prixMensuel: addon.prixMensuel,
                prixAnnuel: addon.prixAnnuel,
                estFacturable: addon.estFacturable,
                dependencies: addon.dependencies,
                accessible: entitlement.accessible,
                entitlementMessage: entitlement.message,
                config: addon.config,
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// POST /api/billing/marketplace/:code/essayer
// Essai 7 jours d'un add-on
// =============================================
router.post('/:code/essayer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        // Vérifier que le module existe et est un ADDON
        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const addon = await repo.findOne({ where: { code, estActif: true, categorie: CategorieModule.ADDON } });
        if (!addon) throw new AppError('Add-on non trouvé ou non disponible', 404, 'ADDON_NOT_FOUND');

        // Vérifier si déjà souscrit
        const dejaSouscrit = await entitlementService.isModuleSouscrit(etablissementId, code);
        if (dejaSouscrit) throw new AppError('Vous avez déjà accès à cet add-on', 409, 'ALREADY_SUBSCRIBED');

        // Créer un abonnement module temporaire (7 jours)
        const amRepo = AppDataSource.getRepository(AbonnementModule);
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const moduleOptionnelRepo = AppDataSource.getRepository(ModuleOptionnel);

        // Trouver l'abonnement actif ou en période d'essai de l'établissement
        const abonnement = await aboRepo.findOne({
            where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
        });
        if (!abonnement) throw new AppError('Aucun abonnement actif ou en essai trouvé. Souscrivez d\'abord à un plan.', 400, 'ABONNEMENT_REQUIS');

        // Si en essai, vérifier que la période n'est pas expirée
        if (abonnement.statut === StatutAbonnement.ESSAI && abonnement.periodeEssaiFin) {
            if (new Date() > abonnement.periodeEssaiFin) {
                throw new AppError('La période d\'essai a expiré. Activez un abonnement pour continuer.', 400, 'ESSAI_EXPIRE');
            }
        }

        // Trouver ou créer le module optionnel correspondant
        let moduleOptionnel = await moduleOptionnelRepo.findOne({ where: { slug: code, actif: true } });
        if (!moduleOptionnel) {
            moduleOptionnel = moduleOptionnelRepo.create({
                nom: addon.nom,
                slug: code,
                description: addon.description || '',
                prixMensuel: addon.prixMensuel,
                prixAnnuel: addon.prixAnnuel,
                actif: true,
            });
            await moduleOptionnelRepo.save(moduleOptionnel);
        }

        // Vérifier si un essai existe déjà
        const essaiExistant = await amRepo.findOne({
            where: { etablissementId, moduleOptionnelId: moduleOptionnel.id, actif: true },
        });
        if (essaiExistant) throw new AppError('Un essai ou abonnement est déjà actif pour cet add-on', 409, 'ESSAI_EXISTS');

        const maintenant = new Date();
        const finEssai = new Date(maintenant.getTime() + 7 * 24 * 60 * 60 * 1000);

        const abonnementModule = amRepo.create({
            abonnementId: abonnement.id,
            etablissementId,
            moduleOptionnelId: moduleOptionnel.id,
            actif: true,
            dateActivation: maintenant,
            dateDesactivation: finEssai, // Fin de l'essai
        });
        await amRepo.save(abonnementModule);

        // Invalider le cache entitlement
        entitlementService.invalidate(etablissementId);

        logger.info(`[Marketplace] Essai 7j activé — Module: ${code} — Établissement: ${etablissementId}`);

        res.status(201).json({
            success: true,
            data: {
                message: `Essai de 7 jours activé pour "${addon.nom}". Expire le ${finEssai.toLocaleDateString('fr-FR')}.`,
                dateFinEssai: finEssai.toISOString(),
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// POST /api/billing/marketplace/:code/souscrire
// Souscription définitive à un add-on
// =============================================
router.post('/:code/souscrire', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code } = req.params;
        const etablissementId = resoudreEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const repo = AppDataSource.getRepository(ModuleCatalogue);
        const addon = await repo.findOne({ where: { code, estActif: true, categorie: CategorieModule.ADDON } });
        if (!addon) throw new AppError('Add-on non trouvé', 404, 'ADDON_NOT_FOUND');

        if (!addon.estSouscriptible) {
            throw new AppError('Cet add-on n\'est pas disponible à la souscription', 403, 'NON_SOUSCRIPTIBLE');
        }

        const moduleOptionnelRepo = AppDataSource.getRepository(ModuleOptionnel);
        const aboRepo = AppDataSource.getRepository(AbonnementClient);

        // Trouver l'abonnement actif ou en période d'essai
        const abonnementActif = await aboRepo.findOne({
            where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
        });
        if (!abonnementActif) throw new AppError('Aucun abonnement actif ou en essai trouvé', 400, 'ABONNEMENT_REQUIS');

        // Si en essai, vérifier que la période n'est pas expirée
        if (abonnementActif.statut === StatutAbonnement.ESSAI && abonnementActif.periodeEssaiFin) {
            if (new Date() > abonnementActif.periodeEssaiFin) {
                throw new AppError('La période d\'essai a expiré. Activez un abonnement pour souscrire à des add-ons.', 400, 'ESSAI_EXPIRE');
            }
        }

        let moduleOptionnel = await moduleOptionnelRepo.findOne({ where: { slug: code, actif: true } });
        if (!moduleOptionnel) {
            moduleOptionnel = moduleOptionnelRepo.create({
                nom: addon.nom,
                slug: code,
                description: addon.description || '',
                prixMensuel: addon.prixMensuel,
                prixAnnuel: addon.prixAnnuel,
                actif: true,
            });
            await moduleOptionnelRepo.save(moduleOptionnel);
        }

        const amRepo = AppDataSource.getRepository(AbonnementModule);

        // Désactiver les anciens abonnements pour ce module
        await amRepo.update(
            { etablissementId, moduleOptionnelId: moduleOptionnel.id, actif: true },
            { actif: false, dateDesactivation: new Date() },
        );

        // Créer le nouvel abonnement
        const nouveauModule = amRepo.create({
            abonnementId: abonnementActif.id,
            etablissementId,
            moduleOptionnelId: moduleOptionnel.id,
            actif: true,
            dateActivation: new Date(),
        });
        await amRepo.save(nouveauModule);

        entitlementService.invalidate(etablissementId);

        logger.info(`[Marketplace] Souscription — Module: ${code} — Établissement: ${etablissementId}`);

        res.status(201).json({
            success: true,
            data: {
                message: `Souscription à "${addon.nom}" confirmée.`,
            },
        });
    } catch (error) { next(error); }
});

export const marketplaceRouter = router;
export default router;
