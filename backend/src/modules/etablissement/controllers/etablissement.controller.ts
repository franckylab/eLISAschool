/**
 * ==================================
 * eLISAschool - Controller Etablissement (multi-établissements)
 * ==================================
 * Version: 2.0.0
 */

import { Router, Request, Response, NextFunction } from 'express';
import { IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { EtablissementService } from '../services';
import { santeEtablissementService } from '../services/sante-etablissement.service';
import { activiteEtablissementService } from '../services/activite-etablissement.service';
import { configurationService } from '@modules/configuration/services/configuration.service';
import {
    createEtablissementSchema,
    updateEtablissementSchema,
    updateEtablissementConfigSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { validateDto } from '@common/utils';
import { HistoriqueScoreSante } from '../entities/historique-score-sante.entity';

const router = Router();
const etablissementService = new EtablissementService();

// ==================================
// CRUD Établissements
// ==================================

/**
 * GET /api/etablissements
 * Liste tous les établissements (SUPER_ADMIN uniquement)
 * Supporte la pagination via query params: ?page=1&limit=20&recherche=xxx&statut=ACTIF
 */
router.get(
    '/',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { page, limit, recherche, statut, type, plan, sousSysteme, sortBy, sortOrder, inclureSante } = req.query;

            // Si pagination demandée, utiliser findPaginated
            if (page || limit) {
                const result = await etablissementService.findPaginated({
                    page: page ? parseInt(page as string) : undefined,
                    limit: limit ? parseInt(limit as string) : undefined,
                    recherche: recherche as string,
                    statut: statut as string,
                    type: type as string,
                    plan: plan as string,
                    sousSysteme: sousSysteme as string,
                    sortBy: sortBy as string,
                    sortOrder: sortOrder as 'ASC' | 'DESC',
                    inclureSante: inclureSante === 'true',
                });
                return res.json({ success: true, ...result });
            }

            // Sinon, retourner tous les établissements (rétrocompatibilité)
            const etablissements = await etablissementService.findAll();
            res.json({ success: true, data: etablissements });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/export
 * Export CSV complet de tous les établissements (SUPER_ADMIN uniquement).
 * Query: mêmes filtres que la liste (recherche, statut, type, plan, sousSysteme)
 * IMPORTANT : doit être définie AVANT /:id pour éviter le match "export" comme UUID
 */
router.get(
    '/export',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { recherche, statut, type, plan, sousSysteme } = req.query;

            // Récupérer tous les établissements avec les filtres appliqués
            const qb = AppDataSource.getRepository('Etablissement').createQueryBuilder('e')
                .leftJoinAndSelect('e.configuration', 'config');

            if (recherche) {
                qb.andWhere(
                    '(e.nom ILIKE :recherche OR e.ville ILIKE :recherche OR e.codeEtablissement ILIKE :recherche)',
                    { recherche: `%${recherche}%` },
                );
            }
            if (statut) qb.andWhere('e.statut = :statut', { statut });
            if (type) qb.andWhere('e.type = :type', { type });
            if (plan) qb.andWhere('config."planAbonnement" = :plan', { plan });
            if (sousSysteme) qb.andWhere('e.sousSysteme = :sousSysteme', { sousSysteme });

            const etablissements = await qb.orderBy('e.nom', 'ASC').getMany();

            // Scores santé
            const scores = await santeEtablissementService.calculerScoresTous();
            const santeMap = new Map(scores.map(s => [s.etablissementId, s]));

            // Générer CSV
            const headers = [
                'Nom', 'Code', 'Ville', 'Type', 'Système', 'Plan',
                'Effectif Actuel', 'Effectif Max', 'Taux Occupation (%)',
                'Statut', 'Score Santé', 'Catégorie Santé',
                'Email', 'Téléphone', 'Directeur', 'Date création',
            ];

            const TYPE_LABELS: Record<string, string> = {
                LAIC: 'Laïc', CONFESSIONNEL_CATHOLIQUE: 'Catholique',
                CONFESSIONNEL_PROTESTANT: 'Protestant', CONFESSIONNEL_ISLAMIQUE: 'Islamique', AUTRE: 'Autre',
            };
            const SOUS_SYSTEME_LABELS: Record<string, string> = {
                FRANCOPHONE: 'Francophone', ANGLOPHONE: 'Anglophone', BICULTUREL: 'Biculturel',
            };
            const PLAN_LABELS: Record<string, string> = {
                gratuit: 'Gratuit', standard: 'Standard', premium: 'Premium', entreprise: 'Entreprise',
            };
            const STATUT_LABELS: Record<string, string> = {
                ACTIF: 'Actif', EN_ATTENTE_VALIDATION: 'En attente',
                EN_ATTENTE_DESACTIVATION: 'Désactivation', INACTIF: 'Inactif',
            };

            const rows = etablissements.map((e: any) => {
                const sante = santeMap.get(e.id);
                const tauxOccupation = e.effectifActuel && e.effectifMax
                    ? Math.round((e.effectifActuel / e.effectifMax) * 100) : '';
                return [
                    e.nom, e.codeEtablissement || '', e.ville || '',
                    TYPE_LABELS[e.type] || e.type || '',
                    SOUS_SYSTEME_LABELS[e.sousSysteme] || e.sousSysteme || '',
                    PLAN_LABELS[e.configuration?.planAbonnement || ''] || e.configuration?.planAbonnement || '',
                    e.effectifActuel ?? '', e.effectifMax ?? '',
                    tauxOccupation,
                    STATUT_LABELS[e.statut] || e.statut || '',
                    sante?.score ?? '', sante?.categorie ?? '',
                    e.contactEmail || '', e.contactTelephone || '', e.directeurNom || '',
                    e.createdAt ? new Date(e.createdAt).toISOString().slice(0, 10) : '',
                ];
            });

            const csvContent = [
                headers.join(';'),
                ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')),
            ].join('\n');

            // BOM UTF-8 pour Excel
            const bom = '\uFEFF';
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="etablissements_${new Date().toISOString().slice(0, 10)}.csv"`);
            res.send(bom + csvContent);
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/stats
 * Statistiques globales des établissements (SUPER_ADMIN uniquement)
 * IMPORTANT : doit être définie AVANT /:id pour éviter le match "stats" comme UUID
 */
router.get(
    '/stats',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (_req: Request, res: Response, next: NextFunction) => {
        try {
            const stats = await etablissementService.getStats();
            res.json({ success: true, data: stats });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/sante
 * Liste les scores de santé de tous les établissements (score composite 0-100).
 * Supporte filtre par catégorie : ?categorie=sain|attention|critique
 * IMPORTANT : doit être définie AVANT /:id pour éviter le match "sante" comme UUID
 */
router.get(
    '/sante',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const scores = await santeEtablissementService.calculerScoresTous();
            const { categorie } = req.query;

            // Filtrer par catégorie si demandé
            const filtered = categorie
                ? scores.filter(s => s.categorie === categorie)
                : scores;

            res.json({ success: true, data: filtered });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/sante/tendances
 * Tendances santé de tous les établissements (comparer score actuel vs dernier historique).
 * Retourne un map { etablissementId: 'hausse' | 'baisse' | 'stable' | null }.
 * Doit être définie AVANT /:id pour éviter le match "sante/tendances" comme UUID.
 */
router.get(
    '/sante/tendances',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Récupérer les scores actuels
            const scores = await santeEtablissementService.calculerScoresTous();
            if (scores.length === 0) {
                return res.json({ success: true, data: [] });
            }

            // 2. Récupérer le dernier snapshot historique pour chaque établissement
            const historiqueRepo = AppDataSource.getRepository(HistoriqueScoreSante);
            const derniersScores = await historiqueRepo
                .createQueryBuilder('h')
                .select('h."etablissementId"', 'etablissementId')
                .addSelect('h."score"', 'score')
                .distinctOn(['h."etablissementId"'])
                .orderBy('h."etablissementId"', 'ASC')
                .addOrderBy('h."createdAt"', 'DESC')
                .getRawMany();

            // 3. Construire le map de tendances
            const historiqueMap = new Map(derniersScores.map((h: any) => [h.etablissementId, h.score]));

            const tendances = scores.map((s) => {
                const ancienScore = historiqueMap.get(s.etablissementId);
                let tendance: 'hausse' | 'baisse' | 'stable' | null = null;
                if (ancienScore !== undefined) {
                    const diff = s.score - ancienScore;
                    if (diff >= 3) tendance = 'hausse';
                    else if (diff <= -3) tendance = 'baisse';
                    else tendance = 'stable';
                }
                return {
                    etablissementId: s.etablissementId,
                    score: s.score,
                    tendance,
                    diff: ancienScore !== undefined ? s.score - ancienScore : null,
                };
            });

            res.json({ success: true, data: tendances });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id
 * Retourne un établissement spécifique
 */
router.get(
    '/:id',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.findOne(req.params.id, true);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements
 * Crée un nouvel établissement (SUPER_ADMIN uniquement)
 */
router.post(
    '/',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(createEtablissementSchema, req.body);
            const etablissement = await etablissementService.create(dto, req.utilisateur?.id);
            res.status(201).json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id
 * Met à jour un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementSchema, req.body);
            const etablissement = await etablissementService.update(req.params.id, dto);
            res.json({ success: true, data: etablissement });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/desactiver
 * Désactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/desactiver',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.desactiver(req.params.id, req.utilisateur?.id);
            res.json({ success: true, data: etablissement, message: 'Établissement désactivé' });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/activer
 * Réactive un établissement (SUPER_ADMIN uniquement)
 */
router.patch(
    '/:id/activer',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const etablissement = await etablissementService.activer(req.params.id, req.utilisateur?.id);
            res.json({ success: true, data: etablissement, message: 'Établissement réactivé' });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/plan
 * Change le plan d'abonnement d'un établissement (SUPER_ADMIN uniquement).
 * Ajuste automatiquement les quotas selon le plan choisi.
 * Body: { plan: 'gratuit' | 'standard' | 'premium' | 'entreprise' }
 */
router.patch(
    '/:id/plan',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { plan } = req.body;
            if (!plan || !['gratuit', 'standard', 'premium', 'entreprise'].includes(plan)) {
                return next(new AppError('Plan invalide. Valeurs acceptées : gratuit, standard, premium, entreprise', 400, 'PLAN_INVALIDE'));
            }
            const config = await etablissementService.changerPlan(req.params.id, plan, req.utilisateur?.id);
            res.json({ success: true, data: config, message: `Plan changé vers ${plan}` });
        } catch (error) { next(error); }
    }
);

// ==================================
// Actions en masse (Bulk)
// ==================================

/**
 * POST /api/etablissements/bulk/activer
 * Réactive plusieurs établissements en une seule opération
 * Body: { ids: string[] }
 */
router.post(
    '/bulk/activer',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return next(new AppError('La liste des IDs est requise', 400, 'IDS_REQUIS'));
            }
            if (ids.length > 50) {
                return next(new AppError('Maximum 50 établissements par opération', 400, 'TROP_D_IDS'));
            }
            const results = await etablissementService.bulkActiver(ids, req.utilisateur?.id);
            res.json({
                success: true,
                data: results,
                message: `${results.length} établissement(s) réactivé(s)`,
            });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/bulk/desactiver
 * Désactive plusieurs établissements en une seule opération
 * Body: { ids: string[] }
 */
router.post(
    '/bulk/desactiver',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { ids } = req.body;
            if (!Array.isArray(ids) || ids.length === 0) {
                return next(new AppError('La liste des IDs est requise', 400, 'IDS_REQUIS'));
            }
            if (ids.length > 50) {
                return next(new AppError('Maximum 50 établissements par opération', 400, 'TROP_D_IDS'));
            }
            const results = await etablissementService.bulkDesactiver(ids, req.utilisateur?.id);
            res.json({
                success: true,
                data: results,
                message: `${results.length} établissement(s) désactivé(s)`,
            });
        } catch (error) { next(error); }
    }
);

// ==================================
// Configuration par établissement
// ==================================

/**
 * GET /api/etablissements/:id/config
 * Retourne la configuration d'un établissement
 */
router.get(
    '/:id/config',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = await etablissementService.getConfig(req.params.id);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/config-complete
 * Configuration complète avec modules actifs et catalogue (Control Plane).
 */
router.get(
    '/:id/config-complete',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await etablissementService.getConfigComplete(req.params.id);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }
);

/**
 * PATCH /api/etablissements/:id/config
 * Met à jour la configuration d'un établissement (ADMIN, SUPER_ADMIN)
 */
router.patch(
    '/:id/config',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(updateEtablissementConfigSchema, req.body);
            const config = await etablissementService.updateConfig(req.params.id, dto);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
);

// (Routes /stats et /sante déplacées avant /:id pour éviter le match Express)

// ==================================
// Santé d'un établissement spécifique (score composite 0-100)
// ==================================

/**
 * GET /api/etablissements/:id/sante
 * Score de santé détaillé d'un établissement spécifique.
 */
router.get(
    '/:id/sante',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            // Vérification d'appartenance (même règle que /:id/stats)
            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les données de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const sante = await santeEtablissementService.calculerScoreEtablissement(targetId);
            if (!sante) {
                return next(new AppError('Établissement introuvable', 404, 'NOT_FOUND'));
            }

            res.json({ success: true, data: sante });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/sante/recalculer-tous
 * Force le recalcul des scores de santé pour TOUS les établissements.
 * SUPER_ADMIN uniquement.
 */
router.post(
    '/sante/recalculer-tous',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Invalider le cache global
            santeEtablissementService.invalidateCache();

            // Recalculer tous les scores
            const scores = await santeEtablissementService.calculerScoresTous();

            const scoreMoyen = scores.length > 0
                ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
                : 0;

            logger.info(`[Santé] Recalcul batch: ${scores.length} établissement(s), score moyen: ${scoreMoyen}/100`);
            res.json({
                success: true,
                message: `${scores.length} score(s) de santé recalculé(s)`,
                data: {
                    nbEtablissements: scores.length,
                    scoreMoyen,
                    distribution: {
                        sains: scores.filter(s => s.categorie === 'sain').length,
                        attention: scores.filter(s => s.categorie === 'attention').length,
                        critiques: scores.filter(s => s.categorie === 'critique').length,
                    },
                },
            });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/:id/sante/recalculer
 * Force le recalcul du score de santé (invalide le cache).
 * SUPER_ADMIN uniquement.
 */
router.post(
    '/:id/sante/recalculer',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;

            // Invalider le cache global pour forcer un recalcul frais
            santeEtablissementService.invalidateCache();

            // Recalculer le score
            const sante = await santeEtablissementService.calculerScoreEtablissement(targetId);
            if (!sante) {
                return next(new AppError('Établissement introuvable', 404, 'NOT_FOUND'));
            }

            logger.info(`[Santé] Score recalculé pour ${targetId}: ${sante.score}/100 (${sante.categorie})`);

            // Sauvegarder un snapshot dans l'historique (non-bloquant)
            try {
                const historiqueRepo = AppDataSource.getRepository(HistoriqueScoreSante);
                const snapshot = historiqueRepo.create({
                    etablissementId: targetId,
                    score: sante.score,
                    categorie: sante.categorie,
                    scoreAbonnement: Math.round(sante.details.abonnement.score),
                    scorePaiements: Math.round(sante.details.paiements.score),
                    scoreActivite: Math.round(sante.details.activite.score),
                    scoreModules: Math.round(sante.details.modules.score),
                });
                await historiqueRepo.save(snapshot);
            } catch (err) {
                logger.warn(`[Santé] Échec sauvegarde historique pour ${targetId} (non bloquant)`, err);
            }

            res.json({ success: true, data: sante, message: 'Score de santé recalculé' });
        } catch (error) { next(error); }
    }
);

// ==================================
// Historique scores santé + Évolution finances
// ==================================

/**
 * GET /api/etablissements/:id/sante/historique
 * Historique des scores de santé (snapshots à chaque recalcul).
 * Retourne les 90 derniers points pour la sparkline frontend.
 */
router.get(
    '/:id/sante/historique',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError('Accès refusé', 403, 'FORBIDDEN'));
            }

            const limit = Math.min(parseInt(req.query.limit as string) || 90, 365);
            const historiqueRepo = AppDataSource.getRepository(HistoriqueScoreSante);

            const historique = await historiqueRepo.find({
                where: { etablissementId: targetId },
                order: { createdAt: 'ASC' },
                take: limit,
                select: ['id', 'score', 'categorie', 'scoreAbonnement', 'scorePaiements', 'scoreActivite', 'scoreModules', 'createdAt'],
            });

            res.json({ success: true, data: historique });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/finances/evolution
 * Évolution mensuelle des paiements sur les 12 derniers mois.
 * Agrège les factures par mois (montant total, montant payé, nombre factures).
 */
router.get(
    '/:id/finances/evolution',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError('Accès refusé', 403, 'FORBIDDEN'));
            }

            const factureRepo = AppDataSource.getRepository('Facture');

            // Agrégation mensuelle sur les 12 derniers mois
            const evolution = await factureRepo
                .createQueryBuilder('f')
                .select("TO_CHAR(f.\"dateEmission\", 'YYYY-MM')", 'mois')
                .addSelect('SUM(f."montantTotal")', 'montantTotal')
                .addSelect('SUM(f."montantPaye")', 'montantPaye')
                .addSelect('COUNT(*)', 'nbFactures')
                .where('f."etablissementId" = :id', { id: targetId })
                .andWhere('f."dateEmission" >= NOW() - INTERVAL \'12 months\'')
                .groupBy("TO_CHAR(f.\"dateEmission\", 'YYYY-MM')")
                .orderBy('mois', 'ASC')
                .getRawMany();

            const data = evolution.map((row: any) => ({
                mois: row.mois,
                montantTotal: Math.round(parseFloat(row.montantTotal) || 0),
                montantPaye: Math.round(parseFloat(row.montantPaye) || 0),
                nbFactures: parseInt(row.nbFactures, 10),
            }));

            res.json({ success: true, data });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/resume
 * Résumé agrégé — combine les données clés en un seul appel.
 * Optimisation : réduit le nombre de requêtes parallèles frontend.
 */
router.get(
    '/:id/resume',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError('Accès refusé', 403, 'FORBIDDEN'));
            }

            // Requêtes parallèles — toutes indépendantes
            const [etablissement, stats, sante, config, dernierScore] = await Promise.all([
                etablissementService.findOne(targetId),
                etablissementService.getEtablissementStats(targetId),
                santeEtablissementService.calculerScoreEtablissement(targetId),
                etablissementService.getConfig(targetId),
                // Dernier score historique (tendance)
                AppDataSource.getRepository(HistoriqueScoreSante).findOne({
                    where: { etablissementId: targetId },
                    order: { createdAt: 'DESC' },
                    select: ['score', 'categorie', 'createdAt'],
                }),
            ]);

            // Calcul de la tendance (comparer dernier score historique vs score actuel)
            let tendance: 'hausse' | 'baisse' | 'stable' | null = null;
            if (dernierScore && sante) {
                const diff = sante.score - dernierScore.score;
                if (diff >= 3) tendance = 'hausse';
                else if (diff <= -3) tendance = 'baisse';
                else tendance = 'stable';
            }

            res.json({
                success: true,
                data: {
                    etablissement,
                    stats,
                    sante: sante ? {
                        score: sante.score,
                        categorie: sante.categorie,
                        details: sante.details,
                        tendance,
                        dernierCalcul: dernierScore?.createdAt || null,
                    } : null,
                    config,
                },
            });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/comparaison
 * Comparaison d'un établissement avec les moyennes plateforme.
 * Retourne les métriques locales vs moyennes globales pour positionnement.
 */
router.get(
    '/:id/comparaison',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError('Accès refusé', 403, 'FORBIDDEN'));
            }

            // Métriques locales
            const [statsLocales, scoreSante, activite] = await Promise.all([
                etablissementService.getEtablissementStats(targetId),
                santeEtablissementService.calculerScoreEtablissement(targetId).catch(() => null),
                activiteEtablissementService.getActiviteComplete(targetId).catch(() => null),
            ]);

            // Moyennes plateforme (agrégation SQL directe — plus performant)
            const qb = AppDataSource.createQueryBuilder();
            const moyennes = await qb
                .select([
                    'COUNT(DISTINCT e.id)', 'totalEtablissements',
                    'COALESCE(AVG(e."effectifActuel"), 0)', 'moyenneEleves',
                    'COALESCE(AVG(e."effectifMax"), 0)', 'moyenneCapacite',
                    'COALESCE(AVG(CASE WHEN e."effectifMax" > 0 THEN (e."effectifActuel"::float / e."effectifMax") * 100 ELSE 0 END), 0)', 'moyenneTauxOccupation',
                ])
                .from('etablissements', 'e')
                .where('e.statut != :statut', { statut: 'BROUILLON' })
                .getRawOne();

            // Moyennes scores santé (non-bloquant)
            let moyenneScoreSante = 0;
            try {
                const scores = await santeEtablissementService.calculerScoresTous();
                if (scores.length > 0) {
                    moyenneScoreSante = Math.round(scores.reduce((s, x) => s + x.score, 0) / scores.length);
                }
            } catch { /* non-bloquant */ }

            // Moyennes personnel et classes (approximation depuis stats locales)
            const totalEtab = parseInt(moyennes.totalEtablissements) || 1;
            const moyenneClasses = Math.round(parseInt(moyennes.moyenneEleves) / 30) || 0;
            const moyennePersonnel = Math.round(parseInt(moyennes.moyenneEleves) / 15) || 0;

            res.json({
                success: true,
                data: {
                    local: {
                        eleves: statsLocales.nombreEleves,
                        personnel: statsLocales.nombrePersonnel,
                        classes: statsLocales.nombreClasses,
                        tauxOccupation: statsLocales.tauxOccupation,
                        scoreSante: scoreSante?.score ?? null,
                        categorieSante: scoreSante?.categorie ?? null,
                        modulesActifs: activite?.modules?.totalActifs ?? null,
                        inscriptionsMois: activite?.ventilation?.nouvellesInscriptions ?? 0,
                    },
                    plateforme: {
                        totalEtablissements: totalEtab,
                        moyenneEleves: Math.round(parseFloat(moyennes.moyenneEleves)),
                        moyenneCapacite: Math.round(parseFloat(moyennes.moyenneCapacite)),
                        moyenneTauxOccupation: Math.round(parseFloat(moyennes.moyenneTauxOccupation)),
                        moyenneScoreSante,
                        moyenneClasses,
                        moyennePersonnel,
                    },
                },
            });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/etablissements/:id/stats
 * Statistiques d'un établissement spécifique
 * [0.2] Vérification d'appartenance — Rapport audit SaaS 2026
 */
router.get(
    '/:id/stats',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            // [0.2] Non-SUPER_ADMIN ne peut voir que les stats de son propre établissement
            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les statistiques de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const stats = await etablissementService.getEtablissementStats(targetId);
            res.json({ success: true, data: stats });
        } catch (error) { next(error); }
    }
);

// ==================================
// Activité complète d'un établissement (ventilation, modules, timeline, finances)
// ==================================

/**
 * GET /api/etablissements/:id/activite
 * Métriques d'activité complètes d'un établissement (Control Plane).
 * Inclut : ventilation effectifs, modules actifs, timeline AuditLog, finances.
 */
router.get(
    '/:id/activite',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            // Vérification d'appartenance (même règle que /:id/stats)
            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les données de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const activite = await activiteEtablissementService.getActiviteComplete(targetId);
            res.json({ success: true, data: activite });
        } catch (error) { next(error); }
    }
);

// ==================================
// Utilisateurs liés à un établissement (Control Plane)
// ==================================

/**
 * GET /api/etablissements/:id/utilisateurs
 * Résumé des utilisateurs liés à un établissement (rôles, derniers inscrits).
 */
router.get(
    '/:id/utilisateurs',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les données de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const data = await etablissementService.getUtilisateursResume(targetId);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }
);

// ==================================
// Gestion du logo (v3.0)
// ==================================

/**
 * GET /api/etablissements/:id/logo
 * Récupère le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.get(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const logo = await etablissementService.getLogo(req.params.id);
            
            if (!logo) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'LOGO_ABSENT', message: 'Aucun logo trouvé pour cet établissement' },
                });
            }
            
            res.json({ success: true, data: logo });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/:id/logo
 * Upload le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.post(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { logoBase64 } = req.body;
            if (!logoBase64) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'LOGO_REQUIS', message: 'Le logo (base64) est requis' },
                });
            }
            const etablissement = await etablissementService.uploadLogo(req.params.id, logoBase64);
            res.json({ success: true, data: etablissement, message: 'Logo uploadé avec succès' });
        } catch (error) { next(error); }
    }
);

/**
 * DELETE /api/etablissements/:id/logo
 * Supprime le logo d'un établissement (SUPER_ADMIN, ADMIN, CHEF_ETABLISSEMENT)
 */
router.delete(
    '/:id/logo',
    authMiddleware,
    requirePermission('config:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await etablissementService.supprimerLogo(req.params.id);
            res.json({ success: true, message: 'Logo supprimé avec succès' });
        } catch (error) { next(error); }
    }
);

// ==================================
// Historique connexions (série temporelle)
// ==================================

/**
 * GET /api/etablissements/:id/connexions
 * Historique des connexions des utilisateurs de l'établissement (30 derniers jours).
 * Retourne une série temporelle + KPIs (total, moyenne, pic, utilisateurs actifs).
 * Query: ?jours=30 (défaut 30, max 90)
 */
router.get(
    '/:id/connexions',
    authMiddleware,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const userRole = req.utilisateur?.role;
            const userEtabId = req.etablissementId;

            // Vérification d'appartenance
            if (userRole !== Role.SUPER_ADMIN && targetId !== userEtabId) {
                return next(new AppError(
                    'Accès refusé — vous ne pouvez consulter que les données de votre établissement',
                    403,
                    'FORBIDDEN'
                ));
            }

            const jours = Math.min(Math.max(parseInt(req.query.jours as string) || 30, 7), 90);
            const data = await etablissementService.getHistoriqueConnexions(targetId, jours);
            res.json({ success: true, data });
        } catch (error) { next(error); }
    }
);

// ==================================
// Journal d'audit par établissement (Control Plane)
// ==================================

/**
 * GET /api/etablissements/:id/audit
 * Journal d'audit filtré par établissement (paginé).
 * Query: ?page=1&limit=20&action=xxx&severity=info|warning|error|critical&module=xxx
 */
router.get(
    '/:id/audit',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;
            const page = Math.max(parseInt(req.query.page as string) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 5), 100);
            const { action, severity, module: moduleFilter } = req.query;

            const auditRepo = AppDataSource.getRepository('AuditLog');
            const qb = auditRepo.createQueryBuilder('a')
                .leftJoinAndSelect('a.utilisateur', 'u')
                .where('a.etablissementId = :etabId', { etabId: targetId });

            // Filtres optionnels
            if (action) {
                qb.andWhere('a.action = :action', { action });
            }
            if (severity) {
                qb.andWhere('a.severity = :severity', { severity });
            }
            if (moduleFilter) {
                qb.andWhere('a.module = :module', { module: moduleFilter });
            }

            // Compter le total
            const total = await qb.getCount();

            // Pagination + tri
            const logs = await qb
                .orderBy('a.createdAt', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();

            res.json({
                success: true,
                data: logs,
                meta: {
                    totalItems: total,
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    itemsPerPage: limit,
                },
            });
        } catch (error) { next(error); }
    }
);

// ==================================
// Actions Configuration (Platform)
// ==================================

/**
 * POST /api/etablissements/:id/sync-config
 * Synchronise la configuration de l'établissement :
 * recrée les paramètres par défaut manquants (scopés établissement).
 * SUPER_ADMIN uniquement.
 */
router.post(
    '/:id/sync-config',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;

            // Récupérer tous les paramètres globaux (sans etablissementId)
            const parametresGlobaux = await AppDataSource
                .getRepository('ParametreSysteme')
                .find({ where: { etablissementId: IsNull() } });

            // Récupérer les paramètres déjà existants pour cet établissement
            const parametresRepo = AppDataSource.getRepository('ParametreSysteme');
            const parametresExistants = await parametresRepo.find({
                where: { etablissementId: targetId },
                select: ['cle'],
            });
            const clesExistantes = new Set(parametresExistants.map((p: any) => p.cle));

            // Créer les paramètres manquants en copiant les globaux
            let nbCrees = 0;
            for (const param of parametresGlobaux) {
                if (!clesExistantes.has((param as any).cle)) {
                    const nouveau = parametresRepo.create({
                        cle: (param as any).cle,
                        valeur: (param as any).valeur,
                        typeValeur: (param as any).typeValeur,
                        categorie: (param as any).categorie,
                        module: (param as any).module,
                        description: (param as any).description,
                        label: (param as any).label,
                        etablissementId: targetId,
                    });
                    await parametresRepo.save(nouveau);
                    nbCrees++;
                }
            }

            // Invalider le cache configuration
            configurationService.invalidateCache();

            logger.info(`[Config] Synchronisation pour ${targetId}: ${nbCrees} paramètre(s) créé(s)`);
            res.json({
                success: true,
                message: `Configuration synchronisée : ${nbCrees} paramètre(s) par défaut créé(s)`,
                data: { nbCrees },
            });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/etablissements/:id/reset-config
 * Réinitialise la configuration de l'établissement :
 * supprime tous les paramètres scopés à l'établissement (retour aux valeurs globales).
 * SUPER_ADMIN uniquement.
 */
router.post(
    '/:id/reset-config',
    authMiddleware,
    requirePermission('super_admin:all'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = req.params.id;

            const parametresRepo = AppDataSource.getRepository('ParametreSysteme');

            // Compter avant suppression
            const count = await parametresRepo.count({ where: { etablissementId: targetId } });

            // Supprimer tous les paramètres scopés à cet établissement
            await parametresRepo.delete({ etablissementId: targetId });

            // Invalider le cache configuration
            configurationService.invalidateCache();

            logger.info(`[Config] Réinitialisation pour ${targetId}: ${count} paramètre(s) supprimé(s)`);
            res.json({
                success: true,
                message: `Configuration réinitialisée : ${count} paramètre(s) personnalisé(s) supprimé(s)`,
                data: { nbSupprimes: count },
            });
        } catch (error) { next(error); }
    }
);

export const etablissementController = router;
export default router;
