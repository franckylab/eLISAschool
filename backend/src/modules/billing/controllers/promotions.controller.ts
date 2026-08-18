/**
 * ==================================
 * eLISAschool - Controller Promotions v4.0
 * ==================================
 *
 * API REST pour le CRUD des promotions et bundles.
 *
 * Routes plateforme (SUPER_ADMIN) : /api/platform/facturation/promotions
 * Routes client (ADMIN)            : /api/billing/promotions
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { AppDataSource } from '@database/data-source';
import { promotionService } from '../services/promotion.service';
import {
    createPromotionSchema,
    updatePromotionSchema,
    createBundleSchema,
    updateBundleSchema,
} from '../dto/promotion.dto';
import { AbonnementClient } from '../entities/abonnement-client.entity';
import { AbonnementPack } from '../entities/abonnement-pack.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';

// =============================================
// ANTI-ABUS COUPONS — Rate limiting IP (5 tentatives/minute)
// =============================================

const COUPON_RATE_LIMIT = 5;
const COUPON_RATE_WINDOW = 60; // secondes

async function couponRateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const windowKey = `coupon:rate:${ip}:${Math.floor(Date.now() / (COUPON_RATE_WINDOW * 1000))}`;

    try {
        const client = await redisService.getClient();
        const count = await client.incr(windowKey);
        if (count === 1) {
            await client.expire(windowKey, COUPON_RATE_WINDOW);
        }

        if (count > COUPON_RATE_LIMIT) {
            const retryAfter = Math.ceil(
                COUPON_RATE_WINDOW - ((Date.now() % (COUPON_RATE_WINDOW * 1000)) / 1000)
            );
            logger.warn(`[Coupon RateLimit] IP ${ip} bloqué — ${count}/${COUPON_RATE_LIMIT} tentatives`);
            res.status(429).json({
                success: false,
                message: 'Trop de tentatives. Veuillez réessayer dans quelques instants.',
                retryAfter,
            });
            return;
        }
    } catch {
        // Redis indisponible — laisser passer (mode dégradé)
    }
    next();
}

// =============================================
// HELPERS
// =============================================

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.flatten());
    }
    return result.data;
}

// =============================================
// ROUTER PLATEFORME (SUPER_ADMIN)
// =============================================

const platformPromotionRouter = Router();

// =============================================
// ROUTES STATIQUES — définies AVANT /:id pour éviter le shadowing Express
// =============================================

// --- BUNDLES CRUD (doit être avant /:id) ---

/**
 * GET /api/platform/facturation/promotions/bundles
 * Liste tous les bundles
 */
platformPromotionRouter.get('/bundles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actif } = req.query;
        const filters: any = {};
        if (actif !== undefined) filters.actif = actif === 'true';

        const bundles = await promotionService.findAllBundles(filters);
        res.json({ success: true, data: bundles });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/promotions/bundles/:id
 * Détail d'un bundle
 */
platformPromotionRouter.get('/bundles/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bundle = await promotionService.findOneBundle(req.params.id);
        res.json({ success: true, data: bundle });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions/bundles
 * Créer un bundle
 */
platformPromotionRouter.post('/bundles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createBundleSchema, req.body);
        const created = await promotionService.createBundle(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/platform/facturation/promotions/bundles/:id
 * Modifier un bundle
 */
platformPromotionRouter.patch('/bundles/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateBundleSchema, req.body);
        const updated = await promotionService.updateBundle(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/promotions/bundles/:id
 * Supprimer un bundle
 */
platformPromotionRouter.delete('/bundles/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await promotionService.deleteBundle(req.params.id);
        res.json({ success: true, message: 'Bundle supprimé' });
    } catch (error) {
        next(error);
    }
});

// --- STATISTIQUES / ANALYTICS / SIMULATION (doit être avant /:id) ---

/**
 * GET /api/platform/facturation/promotions/usage-stats
 * Statistiques d'utilisation des promotions (paginé + agrégation + résumé)
 */
platformPromotionRouter.get('/usage-stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(100, parseInt(req.query.limit as string) || 20);
        const scope = req.query.scope as string | undefined;
        const etablissementId = req.query.etablissementId as string | undefined;

        const data = await promotionService.getUsageStats({ page, limit, scope, etablissementId });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/promotions/usage-stats/export
 * Export CSV des statistiques d'utilisation
 */
platformPromotionRouter.get('/usage-stats/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = req.query.scope as string | undefined;
        const etablissementId = req.query.etablissementId as string | undefined;

        const csv = await promotionService.genererExportCSV({ scope, etablissementId });
        const filename = `promotions-usage-${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/promotions/export
 * Export CSV de la configuration des promotions
 */
platformPromotionRouter.get('/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const scope = req.query.scope as string | undefined;
        const actif = req.query.actif === 'true' ? true : req.query.actif === 'false' ? false : undefined;

        const csv = await promotionService.exporterPromotionsCSV({ scope, actif });
        const filename = `promotions-config-${new Date().toISOString().slice(0, 10)}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions/import
 * Import CSV de promotions (upsert par code unique)
 * Body : CSV text/plain ou multipart/form-data (champ "file")
 */
platformPromotionRouter.post('/import', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        let csvContent: string;

        // Support text/plain direct
        if (typeof req.body === 'string') {
            csvContent = req.body;
        } else if (req.body?.csv) {
            csvContent = req.body.csv;
        } else {
            throw new AppError('Contenu CSV requis (body text/plain ou { csv: string })', 400, 'CSV_MISSING');
        }

        // Sécurité : limiter la taille du CSV (500 Ko max)
        const MAX_CSV_SIZE = 500 * 1024;
        if (csvContent.length > MAX_CSV_SIZE) {
            throw new AppError(
                `Fichier CSV trop volumineux (${(csvContent.length / 1024).toFixed(0)} Ko). Maximum autorisé : ${MAX_CSV_SIZE / 1024} Ko`,
                413,
                'CSV_TOO_LARGE'
            );
        }

        const result = await promotionService.importerPromotionsCSV(csvContent);

        res.json({
            success: true,
            data: result,
            message: `${result.created} créées, ${result.updated} mises à jour${result.errors.length > 0 ? `, ${result.errors.length} erreurs` : ''}`,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/promotions/analytics
 * Analytics avancées (répartition scope, évolution mensuelle, top promos, auto-promo, taux activité)
 */
platformPromotionRouter.get('/analytics', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.query.etablissementId as string | undefined;
        const data = await promotionService.getAnalytics(etablissementId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions/simuler
 * Simuler la cascade de promotions sur un contexte donné
 */
platformPromotionRouter.post('/simuler', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { montantPlan, montantPacks, montantModules, contexte } = req.body;

        if (typeof montantPlan !== 'number' || typeof montantPacks !== 'number' || typeof montantModules !== 'number') {
            throw new AppError('montantPlan, montantPacks et montantModules requis (nombre)', 400, 'VALIDATION_ERROR');
        }

        const resultat = await promotionService.appliquerCascade(montantPlan, montantPacks, montantModules, contexte ?? {});
        res.json({ success: true, data: resultat });
    } catch (error) {
        next(error);
    }
});

// =============================================
// ROUTES PROMOTIONS CRUD (avec /:id param)
// =============================================

/**
 * GET /api/platform/facturation/promotions
 * Liste toutes les promotions (avec filtres scope, actif)
 */
platformPromotionRouter.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { scope, actif, page, limit } = req.query;
        const filters: any = {};
        if (scope) filters.scope = scope as string;
        if (actif !== undefined) filters.actif = actif === 'true';

        const result = await promotionService.findAll({
            ...filters,
            page: page ? parseInt(page as string) : 1,
            limit: limit ? Math.min(parseInt(limit as string), 100) : 50,
        });

        res.json({
            success: true,
            data: result.data,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions
 * Créer une promotion
 */
platformPromotionRouter.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPromotionSchema, req.body);
        const created = await promotionService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/facturation/promotions/:id
 * Détail d'une promotion
 */
platformPromotionRouter.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const promotion = await promotionService.findOne(req.params.id);
        res.json({ success: true, data: promotion });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/platform/facturation/promotions/:id
 * Modifier une promotion
 */
platformPromotionRouter.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updatePromotionSchema, req.body);
        const updated = await promotionService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/facturation/promotions/:id
 * Supprimer une promotion
 */
platformPromotionRouter.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await promotionService.delete(req.params.id);
        res.json({ success: true, message: 'Promotion supprimée' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions/:id/toggle
 * Activer/désactiver une promotion
 */
platformPromotionRouter.post('/:id/toggle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const promotion = await promotionService.findOne(req.params.id);
        const updated = await promotionService.update(promotion.id, { actif: !promotion.actif });
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/facturation/promotions/:id/dupliquer
 * Dupliquer une promotion (copie avec nouveau code unique)
 */
platformPromotionRouter.post('/:id/dupliquer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const copie = await promotionService.dupliquer(req.params.id);
        res.status(201).json({ success: true, data: copie });
    } catch (error) {
        next(error);
    }
});

export { platformPromotionRouter };

// =============================================
// ROUTER CLIENT (ADMIN établissement)
// =============================================

const clientPromotionRouter = Router();

/**
 * GET /api/billing/promotions/eligibles
 * Liste les promotions éligibles pour le tenant actuel
 */
clientPromotionRouter.get('/eligibles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const codeCoupon = req.query.codeCoupon as string | undefined;

        const eligibles = await promotionService.trouverPromotionsEligibles({
            etablissementId,
            codeCoupon,
        });

        res.json({ success: true, data: eligibles });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/promotions/bundles/eligibles
 * Liste les bundles éligibles pour le tenant actuel
 */
clientPromotionRouter.get('/bundles/eligibles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const packsSouscritsIds = req.query.packsSouscritsIds
            ? (req.query.packsSouscritsIds as string).split(',')
            : [];

        const eligibles = await promotionService.trouverBundlesEligibles({
            packsSouscritsIds,
        });

        res.json({ success: true, data: eligibles });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/promotions/verifier-coupon
 * Vérifier la validité d'un code coupon
 */
clientPromotionRouter.post('/verifier-coupon', authMiddleware, couponRateLimitMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { codeCoupon } = req.body;
        if (!codeCoupon || typeof codeCoupon !== 'string') {
            throw new AppError('Code coupon requis', 400, 'VALIDATION_ERROR');
        }

        // Recherche directe en DB (au lieu de charger toutes les promotions)
        const matching = await promotionService.trouverParCoupon(codeCoupon.trim());

        if (!matching) {
            throw new AppError('Code coupon invalide ou expiré', 404, 'COUPON_INVALIDE');
        }

        const etablissementId = (req as any).etablissementId;
        const valide = promotionService.estValide(matching, { codeCoupon, etablissementId });
        res.json({
            success: true,
            data: {
                valide,
                promotion: {
                    code: matching.code,
                    nom: matching.nom,
                    typePromotion: matching.typePromotion,
                    scope: matching.scope,
                    valeur: Number(matching.valeur),
                    dateFin: matching.dateFin,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing/promotions/preview-cascade
 * Simule la cascade des promotions pour le tenant actuel (aperçu prochaine facture).
 * Utilise le contexte réel d'abonnement du tenant.
 */
clientPromotionRouter.post('/preview-cascade', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const { codeCoupon } = req.body;

        // Récupérer l'abonnement actif du tenant
        const aboRepo = AppDataSource.getRepository(AbonnementClient);
        const abonnement = await aboRepo.findOne({
            where: { etablissementId, statut: 'ACTIF' as any },
            relations: ['plan'],
        });

        if (!abonnement) {
            return res.json({
                success: true,
                data: { message: 'Aucun abonnement actif', cascade: null },
            });
        }

        // Construire le contexte réel
        const packRepo = AppDataSource.getRepository(AbonnementPack);
        const moduleRepo = AppDataSource.getRepository(AbonnementModule);

        const packsActifs = await packRepo.find({
            where: { abonnementId: abonnement.id, actif: true },
            relations: ['pack'],
        });
        const modulesActifs = await moduleRepo.find({
            where: { abonnementId: abonnement.id, actif: true },
            relations: ['module'],
        });

        const packsSouscritsIds = packsActifs.map((p) => p.packId);
        const modulesSouscritsIds = modulesActifs.map((m) => m.moduleOptionnelId);
        const packMontants: Record<string, number> = {};
        const packRessources: Record<string, string> = {};
        let montantPacks = 0;
        for (const p of packsActifs) {
            const montant = Number(p.montantFacture ?? 0);
            if (montant > 0) {
                packMontants[p.packId] = montant;
                montantPacks += montant;
            }
            if (p.pack?.ressource) packRessources[p.packId] = p.pack.ressource;
        }

        // Calculer le montant réel des modules depuis le catalogue
        const moduleMontants: Record<string, number> = {};
        let montantModules = 0;
        for (const m of modulesActifs) {
            const prix = Number(m.module?.prixMensuel ?? 0);
            if (prix > 0) {
                moduleMontants[m.moduleOptionnelId] = prix;
                montantModules += prix;
            }
        }

        const montantPlan = Math.max(0, Number(abonnement.montantMensuel ?? 0) - montantPacks);

        const ctx = {
            planId: abonnement.planId,
            etablissementId,
            codeCoupon: codeCoupon?.trim()?.toUpperCase(),
            packsSouscritsIds,
            modulesSouscritsIds,
            packMontants,
            packRessources,
            moduleMontants,
            dateDebutAbonnement: abonnement.dateDebut,
            dateFinAbonnement: abonnement.dateFin,
        };

        const cascade = await promotionService.appliquerCascade(
            montantPlan,
            montantPacks,
            montantModules,
            ctx,
        );

        res.json({ success: true, data: { cascade, abonnement: { plan: abonnement.plan?.nom, statut: abonnement.statut } } });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing/promotions/historique
 * Historique des promotions appliquées pour le tenant actuel (paginé).
 */
clientPromotionRouter.get('/historique', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

        const data = await promotionService.getUsageStats({ page, limit, etablissementId });
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

export { clientPromotionRouter };
export default platformPromotionRouter;
