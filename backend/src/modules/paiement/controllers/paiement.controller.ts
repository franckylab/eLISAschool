/**
 * ==================================
 * eLISAschool - Controller Paiement API
 * ==================================
 * 
 * Endpoints REST pour la gestion des paiements,
 * configurations providers et webhooks.
 * 
 * Phase 5.4 — Refonte SaaS
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { PaiementService } from '../services/paiement.service';
import { AppDataSource } from '@database/data-source';
import { PaiementWebhook, StatutWebhook } from '../entities';
import { logger } from '@common/utils/logger.util';

const router = Router();
const paiementService = new PaiementService();

// =============================================
// CONFIGURATION PROVIDERS
// =============================================

/**
 * GET /api/paiement/providers
 * Liste les providers disponibles (catalogue)
 */
router.get('/providers', (_req: Request, res: Response, next: NextFunction) => {
    try {
        const providers = paiementService.getProvidersDisponibles();
        res.json({ success: true, data: providers });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/paiement/providers/configures
 * Liste les providers configurés pour l'établissement
 */
router.get('/providers/configures', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const configs = await paiementService.getProvidersConfigures(etablissementId);
        res.json({ success: true, data: configs });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/paiement/providers/configurer
 * Configure un provider pour l'établissement
 */
router.post('/providers/configurer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { providerName, channel, credentials, sandbox, webhookSecret } = req.body;
        if (!providerName || !channel || !credentials) {
            throw new AppError('providerName, channel et credentials requis', 400, 'MISSING_FIELDS');
        }

        const config = await paiementService.configurerProvider(
            etablissementId,
            providerName,
            channel,
            credentials,
            { sandbox, webhookSecret }
        );

        res.status(201).json({ success: true, data: config, message: 'Provider configuré' });
    } catch (error) {
        next(error);
    }
});

// =============================================
// PAIEMENTS
// =============================================

/**
 * POST /api/paiement/initier
 * Initie un paiement
 */
router.post('/initier', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const { provider, montant, devise, description, methodePaiement, returnUrl, customerPhone, factureId } = req.body;

        if (!provider || !montant || !methodePaiement) {
            throw new AppError('provider, montant et methodePaiement requis', 400, 'MISSING_FIELDS');
        }

        const transaction = await paiementService.initierPaiement(
            etablissementId,
            provider,
            {
                montant,
                devise: devise || 'XAF',
                description: description || 'Paiement abonnement eLISAschool',
                methodePaiement,
                returnUrl,
                customerPhone,
            },
            factureId
        );

        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/paiement/statut/:reference
 * Vérifie le statut d'une transaction
 */
router.get('/statut/:reference', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const statut = await paiementService.verifierStatut(req.params.reference);
        res.json({ success: true, data: statut });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/paiement/transactions
 * Historique des transactions
 */
router.get('/transactions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.etablissementId || req.utilisateur?.etablissementId;
        if (!etablissementId) throw new AppError('Établissement non identifié', 400);

        const transactions = await paiementService.getTransactions(etablissementId);
        res.json({ success: true, data: transactions });
    } catch (error) {
        next(error);
    }
});

// =============================================
// WEBHOOKS (pas d'authMiddleware — signature vérifiée par provider)
// =============================================

/**
 * POST /api/paiement/webhooks/:provider
 * Endpoint webhook pour les providers de paiement
 */
router.post('/webhooks/:provider', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const providerName = req.params.provider;
        const signature = req.headers['x-webhook-signature'] as string || req.headers['x-hub-signature-256'] as string;

        const webhook = await paiementService.traiterWebhook(providerName, req.body, signature);

        res.json({ success: true, data: { statut: webhook.statut } });
    } catch (error) {
        next(error);
    }
});

// =============================================
// WEBHOOKS LOGS (auth requis — plateforme)
// =============================================

/**
 * GET /api/paiement/webhooks/logs
 * Liste les webhooks reçus (logs) — filtrable par provider et statut.
 * Utilisé par le panel admin (webhook-logs.tsx).
 */
router.get('/webhooks/logs', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const webhookRepo = AppDataSource.getRepository(PaiementWebhook);
        const { provider, statut, limit = '50' } = req.query;

        const where: Record<string, unknown> = {};
        if (provider) where.provider = provider;
        if (statut) where.statut = statut;

        const webhooks = await webhookRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: Math.min(parseInt(limit as string, 10) || 50, 200),
        });

        // Mapper vers le format attendu par le frontend
        const mapped = webhooks.map((wh) => {
            let payload: Record<string, unknown> = {};
            try { payload = JSON.parse(wh.payload); } catch { /* payload brut */ }

            // Mapper statut backend → frontend
            const statutMap: Record<string, 'SUCCESS' | 'FAILED' | 'PENDING'> = {
                [StatutWebhook.TRAITE]: 'SUCCESS',
                [StatutWebhook.ERREUR]: 'FAILED',
                [StatutWebhook.RECU]: 'PENDING',
                [StatutWebhook.IGNORE]: 'SUCCESS',
            };

            return {
                id: wh.id,
                provider: wh.provider,
                event: (payload.event || payload.type || payload.action || 'unknown') as string,
                statut: statutMap[wh.statut] || 'PENDING',
                payload,
                httpStatus: wh.statut === StatutWebhook.TRAITE ? 200 : wh.statut === StatutWebhook.ERREUR ? 500 : undefined,
                createdAt: wh.createdAt.toISOString(),
                retries: wh.tentativesTraitement,
                error: wh.erreur || undefined,
            };
        });

        res.json({ success: true, data: mapped });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/paiement/webhooks/:id/retry
 * Retenter le traitement d'un webhook en échec.
 */
router.post('/webhooks/:id/retry', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const webhookRepo = AppDataSource.getRepository(PaiementWebhook);
        const webhook = await webhookRepo.findOne({ where: { id: req.params.id } });

        if (!webhook) {
            throw new AppError('Webhook introuvable', 404, 'WEBHOOK_NOT_FOUND');
        }

        if (webhook.statut !== StatutWebhook.ERREUR) {
            throw new AppError('Seuls les webhooks en erreur peuvent être relancés', 400, 'WEBHOOK_NOT_FAILED');
        }

        // Réinitialiser le statut et retenter
        webhook.statut = StatutWebhook.RECU;
        webhook.erreur = undefined;
        webhook.tentativesTraitement += 1;
        await webhookRepo.save(webhook);

        // Retraiter le webhook
        try {
            let payload: Record<string, unknown> = {};
            try { payload = JSON.parse(webhook.payload); } catch { /* ignore */ }

            await paiementService.traiterWebhook(webhook.provider, payload, webhook.signature || undefined);
            logger.info(`[Paiement] Webhook ${webhook.id} relancé avec succès`);

            res.json({ success: true, message: 'Webhook relancé avec succès' });
        } catch (retryError) {
            logger.error(`[Paiement] Échec relance webhook ${webhook.id}:`, retryError);
            res.json({ success: false, message: 'La relance a échoué, voir les logs' });
        }
    } catch (error) {
        next(error);
    }
});

export const paiementController = router;
export default router;
