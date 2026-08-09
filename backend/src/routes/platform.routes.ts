/**
 * ==================================
 * eLISAschool - Routes Plateforme (Control Plane)
 * ==================================
 * Version: 5.1.0
 * Auteur: franck arlos chendjou
 *
 * Routes réservées au propriétaire de la plateforme (SUPER_ADMIN).
 * Séparation structurelle Control Plane / Data Plane.
 * Rapport audit SaaS 2026-08-07
 *
 * Préfixe: /api/platform/
 * Guard global: requireRole('SUPER_ADMIN') sur TOUTES les routes
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
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
import { platformSessionsController } from '@modules/platform-sessions';
import { parametresCascadeController } from '@modules/configuration/controllers/parametres-cascade.controller';
import { identiteController } from '@modules/identite/controllers/identite.controller';
import { platformPermissionsController } from '@modules/identite/controllers/platform-permissions.controller';

const router = Router();

// =============================================
// AUTH PLATEFORME (avant guard — login = public)
// =============================================

/**
 * /api/platform/auth
 * Login, logout, refresh, me — Authentification dual-plane.
 * POST /login est public, les autres routes nécessitent authMiddleware.
 */
router.use('/auth', platformAuthController);

// =============================================
// Guard global — SUPER_ADMIN uniquement
// =============================================
// [P5.1 Audit v6] Toutes les routes /api/platform/* nécessitent le rôle SUPER_ADMIN.
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
//
// Aucune route platform ne bypass ce guard.
// Les routes data-plane (tenant) sont séparées dans app.ts.

router.use(authMiddleware);
router.use(requireRole([Role.SUPER_ADMIN]));

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
// SESSIONS PLATEFORME — Modèle C Dual-Plane
// =============================================

/**
 * /api/platform/sessions
 * Gestion des sessions actives plateforme (CRUD, révocation, limite LRU).
 */
router.use('/sessions', platformSessionsController);

// =============================================
// IDENTITÉS GLOBALES — Modèle C Dual-Plane
// =============================================

/**
 * /api/platform/identites
 * CRUD identités globales (source unique de vérité).
 * Création, modification, suppression, vérification email, memberships.
 */
router.use('/identites', identiteController);

// =============================================
// PERMISSIONS PLATEFORME — Modèle C Dual-Plane
// =============================================

/**
 * /api/platform/permissions
 * Consultation des permissions plateforme, matrice permissions × rôles.
 */
router.use('/permissions', platformPermissionsController);

// =============================================
// BACKUP PAR TENANT — Phase I.1
// =============================================

/**
 * POST /api/platform/backup/:etablissementId
 * Export des données d'un établissement spécifique.
 */
router.post('/backup/:etablissementId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
        const format = (req.query.format as string) || 'json';
        const result = await tenantBackupService.exportTenantData(req.params.etablissementId, format as any);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/backup/:etablissementId/history
 * Historique des backups d'un tenant.
 */
router.get('/backup/:etablissementId/history', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
        const history = tenantBackupService.getBackupHistory(req.params.etablissementId);
        res.json({ success: true, data: history });
    } catch (error) { next(error); }
});

/**
 * POST /api/platform/backup/:etablissementId/restore
 * Restauration des données d'un tenant depuis un backup.
 */
router.post('/backup/:etablissementId/restore', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
        const { backupPath } = req.body;
        if (!backupPath) {
            return res.status(400).json({ success: false, error: { message: 'backupPath requis', code: 'MISSING_BACKUP_PATH' } });
        }
        const result = await tenantBackupService.restoreTenantData(req.params.etablissementId, backupPath);
        res.json(result);
    } catch (error) { next(error); }
});

/**
 * GET /api/platform/backup/all
 * Liste tous les backups de tous les tenants.
 */
router.get('/backup/all', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { tenantBackupService } = await import('@modules/configuration/services/backup/tenant-backup.service');
        const backups = tenantBackupService.getAllBackups();
        res.json({ success: true, data: backups });
    } catch (error) { next(error); }
});

export const platformRouter = router;
export default router;
