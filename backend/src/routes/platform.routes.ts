/**
 * ==================================
 * eLISAschool - Routes Plateforme (Control Plane)
 * ==================================
 * Version: 7.0.0
 * Auteur: franck arlos chendjou
 *
 * Routes réservées aux utilisateurs plateforme authentifiés.
 * Séparation structurelle Control Plane / Data Plane.
 *
 * Durcissement v9 :
 * - Guard global : requirePlatformAccess() + CASL (plus uniquement SUPER_ADMIN)
 * - G2 : Guards CASL sur routes backup (requirePlatformCasl)
 * - G3 : Validation path traversal sur restore (validateBackupPath)
 * - G7 : Rôles plateforme avec permissions minimales en tenant
 * - G8 : Commentaires mis à jour pour refléter la réalité des guards
 *
 * Audit sécurité v10 :
 * - GAP 6 : platformAuthMiddleware dédié (rejet tokens cross-plane)
 * - GAP 7 : dualCaslMiddleware global sur toutes les routes plateforme
 *
 * Préfixe: /api/platform/
 * Guard: platformAuthMiddleware → dualCaslMiddleware → requirePlatformAccess() + requirePlatformCasl()
 */

import { Router, Request, Response, NextFunction } from 'express';
import { requirePlatformAccess, requirePlatformCasl, dualCaslMiddleware } from '@common/middlewares/dual-casl.middleware';
import { platformAuthMiddleware } from '@common/middlewares/platform-auth.middleware';
import { platformStatsService } from '@modules/dashboard/services/platform-stats.service';

// Controllers existants montés sur les routes plateforme
import { configurationController } from '@modules/configuration';
import { monitoringController } from '@modules/monitoring';
import { auditController } from '@modules/audit';
import { etablissementController } from '@modules/etablissement';
import { dashboardController } from '@modules/dashboard';
import { platformBillingRouter } from '@modules/billing';
import { platformUsersController } from '@modules/platform-users';
import { platformRolesController } from '@modules/platform-roles';
import { platformAuthController } from '@modules/platform-auth';
import { parametresCascadeController } from '@modules/configuration/controllers/parametres-cascade.controller';

const router = Router();

// =============================================
// AUTH PLATEFORME (avant guard — login = public)
// =============================================

/**
 * /api/platform/auth
 * Login, logout, refresh, me — Auth unifiée ADR-005 (source unique).
 * POST /login est public, les autres routes nécessitent authMiddleware.
 */
router.use('/auth', platformAuthController);

// =============================================
// Guard global — Accès plateforme requis
// =============================================
// [ADR-005] Guard : tout utilisateur avec estPlateforme=true et rôle plateforme
// peut accéder aux routes plateforme. Les permissions granulaires sont vérifiées
// par CASL (req.ability) via requirePlatformCasl() sur les routes sensibles.
//
// [P5.1 Audit v6] Toutes les routes /api/platform/* nécessitent un accès plateforme actif.
// [RBAC-2] Séparation plateforme/établissement v5.1.
//
// Routes auditables :
// - GET  /stats                         — Statistiques globales
// - GET  /stats/revenues                — KPIs financiers (MRR, ARR, facturation)
// - GET  /stats/sante                   — Santé établissements + dunning
// - *    /etablissements/*              — CRUD établissements (Control Plane)
// - *    /configuration/*               — Configuration système
// - *    /monitoring/*                  — Infrastructure monitoring
// - *    /audit/*                       — Audit global tous établissements
// - *    /dashboard/*                   — KPIs plateforme
// - *    /facturation/*                 — Plans, abonnements, factures
// - POST /backup/:id                   — Backup tenant
// - GET  /backup/:id/history           — Historique backups
// - POST /backup/:id/restore           — Restauration tenant
// - GET  /backup/all                   — Tous les backups
// ADR-005 (v11) : identites, permissions, sessions supprimés (source unique).
// Les routes data-plane (tenant) sont séparées dans app.ts.

router.use(platformAuthMiddleware);
router.use(dualCaslMiddleware);
router.use(requirePlatformAccess());

// =============================================
// STATISTIQUES PLATEFORME
// =============================================

/**
 * GET /api/platform/stats
 * Agrégats plateforme — nombre établissements, utilisateurs, etc.
 * Cache TTL 60s via PlatformStatsService.
 */
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformStatsService.getStats();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/stats/revenues
 * KPIs financiers — MRR, ARR, facturation, recouvrement.
 * Cache TTL 60s via PlatformStatsService.
 */
router.get('/stats/revenues', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformStatsService.getRevenueStats();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/stats/sante
 * Santé des établissements — répartition (sains/attention/critiques) + dunning.
 * Cache TTL 60s via PlatformStatsService.
 */
router.get('/stats/sante', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformStatsService.getSanteStats();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/stats/complet
 * Stats combinées (platform + revenues + sante) — 1 seul appel au lieu de 3.
 * Cache TTL 60s via PlatformStatsService.
 */
router.get('/stats/complet', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await platformStatsService.getStatsComplet();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// =============================================
// GESTION ÉTABLISSEMENTS (Control Plane)
// =============================================

/**
 * /api/platform/etablissements
 * CRUD propriétaire — gestion des établissements clients.
 * Monte le etablissementController existant avec le guard SUPER_ADMIN.
 */
router.use('/etablissements', etablissementController);

// =============================================
// CONFIGURATION GLOBALE (Control Plane)
// =============================================

/**
 * /api/platform/configuration
 * Configuration applicative globale (paramètres système, modules, backups).
 * Monte le configurationController existant avec le guard SUPER_ADMIN.
 */
router.use('/configuration', configurationController);

// =============================================
// MONITORING INFRASTRUCTURE
// =============================================

/**
 * /api/platform/monitoring
 * Métriques infrastructure, health checks, alertes.
 */
router.use('/monitoring', monitoringController);

// =============================================
// AUDIT GLOBAL
// =============================================

/**
 * /api/platform/audit
 * Logs audit TOUS établissements (filtrable par établissement).
 */
router.use('/audit', auditController);

// =============================================
// DASHBOARD PLATEFORME
// =============================================

/**
 * /api/platform/dashboard
 * KPIs globaux, activité plateforme.
 */
router.use('/dashboard', dashboardController);

// =============================================
// FACTURATION PLATEFORME (Control Plane)
// =============================================

/**
 * /api/platform/facturation
 * Gestion des plans, abonnements, factures, quotas, feature flags.
 * Phase 4 — Refonte SaaS
 */
router.use('/facturation', platformBillingRouter);

// =============================================
// UTILISATEURS PLATEFORME — V2.2
// =============================================

/**
 * /api/platform/utilisateurs
 * CRUD comptes admin plateforme + délégation + audit trail.
 */
router.use('/utilisateurs', platformUsersController);

// =============================================
// ROLE BUILDER (RÔLES PERSONNALISÉS) — V2.3
// =============================================

/**
 * /api/platform/roles
 * Gestion des rôles plateforme (défaut + personnalisés).
 */
router.use('/roles', platformRolesController);

// =============================================
// PARAMÈTRES CASCADE MULTI-NIVEAUX — V3.1
// =============================================

/**
 * /api/platform/parametres/cascade
 * Cascade 4 niveaux : Système → Global → Groupe → Établissement
 * Propagation, historique, rollback, détection incohérences.
 */
router.use('/parametres/cascade', parametresCascadeController);

// =============================================
// BACKUP PAR TENANT — Phase I.1
// Faille G2 corrigée : guards CASL sur toutes les routes backup
// Faille G3 corrigée : validation path traversal sur restore
// =============================================

import path from 'path';
import { AppError } from '@common/filters/error.filter';

/**
 * Helper : valide qu'un chemin de backup est légitime (anti path traversal — G3).
 * Rejette les chemins contenant '..', '~', ou sortant du répertoire de backup.
 */
function validateBackupPath(backupPath: string): string {
    // Rejeter les caractères suspects
    if (backupPath.includes('..') || backupPath.includes('~') || backupPath.includes('\0')) {
        throw new AppError(
            'Chemin de backup invalide : caractères interdits détectés',
            400,
            'INVALID_BACKUP_PATH'
        );
    }

    // Résoudre le chemin absolu et vérifier qu'il reste dans le répertoire de backup
    const backupDir = path.resolve(process.cwd(), 'backups');
    const resolvedPath = path.resolve(backupDir, backupPath);

    if (!resolvedPath.startsWith(backupDir)) {
        throw new AppError(
            'Chemin de backup invalide : hors du répertoire autorisé',
            400,
            'INVALID_BACKUP_PATH'
        );
    }

    return resolvedPath;
}

/**
 * POST /api/platform/backup/:etablissementId
 * Export des données d'un établissement spécifique.
 * Guard CASL : manage Backup (G2).
 */
router.post(
    '/backup/:etablissementId',
    requirePlatformCasl('manage', 'Backup'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
            const format = (req.query.format as string) || 'json';
            const result = await tenantBackupService.exportTenantData(req.params.etablissementId, format as any);
            res.json({ success: true, data: result });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/platform/backup/:etablissementId/history
 * Historique des backups d'un tenant.
 * Guard CASL : manage Backup (G2).
 */
router.get(
    '/backup/:etablissementId/history',
    requirePlatformCasl('manage', 'Backup'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
            const history = tenantBackupService.getBackupHistory(req.params.etablissementId);
            res.json({ success: true, data: history });
        } catch (error) { next(error); }
    }
);

/**
 * POST /api/platform/backup/:etablissementId/restore
 * Restauration des données d'un tenant depuis un backup.
 * Guard CASL : manage Backup (G2) + validation path traversal (G3).
 */
router.post(
    '/backup/:etablissementId/restore',
    requirePlatformCasl('manage', 'Backup'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
            const { backupPath } = req.body;
            if (!backupPath) {
                return res.status(400).json({ success: false, error: { message: 'backupPath requis', code: 'MISSING_BACKUP_PATH' } });
            }

            // Validation path traversal (G3)
            const validatedPath = validateBackupPath(backupPath);

            const result = await tenantBackupService.restoreTenantData(req.params.etablissementId, validatedPath);
            res.json(result);
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/platform/backup/all
 * Liste tous les backups de tous les tenants.
 * Guard CASL : manage Backup (G2).
 */
router.get(
    '/backup/all',
    requirePlatformCasl('manage', 'Backup'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
            const backups = tenantBackupService.getAllBackups();
            res.json({ success: true, data: backups });
        } catch (error) { next(error); }
    }
);

export const platformRouter = router;
export default router;
