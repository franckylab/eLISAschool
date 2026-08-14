/**
 * ==================================
 * eLISAschool - Controller Monitoring
 * ==================================
 * 
 * Endpoints monitoring, métriques RED/USE, health checks, alertes.
 * Phase 7 — Refonte SaaS
 * Phase F — Refonte SaaS v2 (Golden Signals, Export rapports, Health distribués)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services';
import { metricsCollector } from '../services/metrics-collector.service';
import { alertingService } from '../services/alerting.service';
import { rapportExportService } from '../services/rapport-export.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { maintenanceSchema, queryLogsSchema } from '../dto';
import { moduleAnalyticsService } from '../services/module-analytics.service';

const router = Router();
const monitoringService = new MonitoringService();

// =============================================
// HEALTH CHECK
// =============================================

// Health check (public — utilisé par les load balancers)
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const health = await monitoringService.healthCheck();
        const statusCode = health.status === 'ok' ? 200 : (health.status === 'degraded' ? 200 : 503);
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({ status: 'down', error: 'Health check failed' });
    }
});

/**
 * GET /monitoring/health/detail
 * Health checks détaillés (DB, API, services externes).
 * Phase 7.2
 */
router.get('/health/detail', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const health = await metricsCollector.checkHealth();
        const overallStatus = health.some((h) => h.status === 'unhealthy')
            ? 'unhealthy'
            : health.some((h) => h.status === 'degraded')
                ? 'degraded'
                : 'healthy';

        res.json({
            success: true,
            data: {
                status: overallStatus,
                checks: health,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) { next(error); }
});

// =============================================
// MÉTRIQUES SYSTÈME & RED/USE
// =============================================

// Métriques système (admin)
router.get('/metrics', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await monitoringService.getSystemMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/metrics/aggregated
 * Métriques agrégées plateforme (RED/USE, Four Golden Signals).
 * Phase 7.2
 */
router.get('/metrics/aggregated', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const period = (req.query.period as '1h' | '24h' | '7d') || '24h';
        const metrics = await metricsCollector.getAggregatedMetrics(period);
        res.json({ success: true, data: metrics });
    } catch (error) { next(error); }
});

// =============================================
// ALERTES
// =============================================

/**
 * GET /monitoring/alerts
 * Alertes actives non acquittées.
 * Phase 7.2
 */
router.get('/alerts', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const alerts = alertingService.getActiveAlerts();
        res.json({ success: true, data: alerts });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/alerts/rules
 * Règles d'alerte configurées.
 * Phase 7.2
 */
router.get('/alerts/rules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rules = alertingService.getRules();
        res.json({ success: true, data: rules });
    } catch (error) { next(error); }
});

/**
 * POST /monitoring/alerts/rules
 * Ajouter une règle d'alerte personnalisée.
 * Phase 7.2
 */
router.post('/alerts/rules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, metric, condition, threshold, severity, message, duration } = req.body;
        if (!name || !metric || !condition || threshold === undefined || !severity) {
            res.status(400).json({ success: false, error: 'name, metric, condition, threshold et severity sont requis' });
            return;
        }
        alertingService.addRule({
            name,
            metric,
            condition,
            threshold,
            severity,
            message,
            duration,
            enabled: true,
        });
        res.json({ success: true, message: `Règle "${name}" ajoutée` });
    } catch (error) { next(error); }
});

/**
 * PATCH /monitoring/alerts/rules/:name
 * Mettre à jour une règle d'alerte.
 */
router.patch('/alerts/rules/:name', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.params.name;
        const { metric, condition, threshold, severity, duration, message, enabled } = req.body;
        const updated = alertingService.updateRule(name, { metric, condition, threshold, severity, duration, message, enabled });
        if (!updated) {
            res.status(404).json({ success: false, error: `Règle "${name}" introuvable` });
            return;
        }
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

/**
 * DELETE /monitoring/alerts/rules/:name
 * Supprimer une règle d'alerte.
 */
router.delete('/alerts/rules/:name', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.params.name;
        const existed = alertingService.getRules().some((r) => r.name === name);
        alertingService.removeRule(name);
        res.json({ success: true, message: existed ? `Règle "${name}" supprimée` : `Aucune règle nommée "${name}"` });
    } catch (error) { next(error); }
});

/**
 * POST /monitoring/alerts/:id/acknowledge
 * Acquitter une alerte.
 * Phase 7.2
 */
router.post('/alerts/:id/acknowledge', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        alertingService.acknowledgeAlert(req.params.id);
        res.json({ success: true, message: 'Alerte acquittée' });
    } catch (error) { next(error); }
});

// =============================================
// STATISTIQUES & MAINTENANCE
// =============================================

// Statistiques app (admin)
router.get('/stats', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await monitoringService.getAppStats();
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

// Mode maintenance
router.get('/maintenance', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const maintenance = await monitoringService.isMaintenanceMode();
        res.json({ success: true, data: { maintenance } });
    } catch (error) { next(error); }
});

router.post('/maintenance', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { enabled } = validateDto(maintenanceSchema, req.body);
        await monitoringService.setMaintenanceMode(enabled);
        res.json({ success: true, message: `Mode maintenance ${enabled ? 'activé' : 'désactivé'}` });
    } catch (error) { next(error); }
});

// Logs (admin)
router.get('/logs', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { limit } = validateDto(queryLogsSchema, req.query);
        const logs = await monitoringService.getRecentLogs(limit);
        res.json({ success: true, data: logs });
    } catch (error) { next(error); }
});

// Statut des backups (admin)
router.get('/backups', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const backupStatus = await monitoringService.getBackupStatus();
        res.json({ success: true, data: backupStatus });
    } catch (error) { next(error); }
});

// Informations sur les mises à jour (admin)
router.get('/updates', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateInfo = await monitoringService.getUpdateInfo();
        res.json({ success: true, data: updateInfo });
    } catch (error) { next(error); }
});

// =============================================
// PHASE F — GOLDEN SIGNALS & EXPORT
// =============================================

/**
 * GET /monitoring/golden-signals
 * Four Golden Signals: latency (p50/p95/p99), traffic, errors, saturation.
 * Phase F.1
 */
router.get('/golden-signals', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const signals = await metricsCollector.getGoldenSignals();
        res.json({ success: true, data: signals });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/export/rapport
 * Export rapport plateforme (activite, facturation, securite, complet).
 * Formats: csv, json.
 * Phase F.3
 */
router.get('/export/rapport', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = (req.query.type as string) || 'complet';
        const format = (req.query.format as string) || 'csv';
        const debut = req.query.debut ? new Date(req.query.debut as string) : undefined;
        const fin = req.query.fin ? new Date(req.query.fin as string) : undefined;
        const etablissementId = req.query.etablissementId as string | undefined;

        const rapport = await rapportExportService.genererRapport({
            type: type as any,
            format: format as any,
            periodeDebut: debut,
            periodeFin: fin,
            etablissementId,
        });

        // Envoyer le fichier
        if (format === 'pdf') {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `inline; filename="rapport-${type}.html"`);
        } else {
            const contentType = format === 'csv' ? 'text/csv' : 'application/json';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${rapport.filename}"`);
        }
        res.send(rapport.data);
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/export/ledger
 * Export ledger comptable OHADA en CSV.
 * Phase F.3
 */
router.get('/export/ledger', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.query.etablissementId as string | undefined;
        const debut = req.query.debut ? new Date(req.query.debut as string) : undefined;
        const fin = req.query.fin ? new Date(req.query.fin as string) : undefined;

        const csv = await rapportExportService.exporterLedgerCSV(etablissementId, debut, fin);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="ledger-ohada-${new Date().toISOString().slice(0, 10)}.csv"`);
        res.send(csv);
    } catch (error) { next(error); }
});

import { noisyNeighborService } from '../services/noisy-neighbor.service';

// =============================================
// NOISY NEIGHBOR DETECTION — Phase I.2
// =============================================

/**
 * GET /monitoring/tenants/usage
 * Utilisation des ressources par tenant (dashboard plateforme).
 */
router.get('/tenants/usage', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const usage = noisyNeighborService.getAllTenantUsage();
        res.json({ success: true, data: usage });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/tenants/top
 * Top N tenants par consommation.
 */
router.get('/tenants/top', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const top = noisyNeighborService.getTopTenants(limit);
        res.json({ success: true, data: top });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/tenants/alerts
 * Alertes noisy neighbor actives.
 */
router.get('/tenants/alerts', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const activeOnly = req.query.active !== 'false';
        const alerts = activeOnly
            ? noisyNeighborService.getActiveAlerts()
            : noisyNeighborService.getAllAlerts();
        res.json({ success: true, data: alerts });
    } catch (error) { next(error); }
});

/**
 * POST /monitoring/tenants/alerts/:id/resolve
 * Résoudre une alerte noisy neighbor.
 */
router.post('/tenants/alerts/:id/resolve', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resolved = noisyNeighborService.resolveAlert(req.params.id);
        res.json({ success: resolved, message: resolved ? 'Alerte résolue' : 'Alerte non trouvée' });
    } catch (error) { next(error); }
});

// =============================================
// ANALYTICS MODULES (P6.1)
// =============================================

/**
 * GET /monitoring/analytics/modules
 * Analytics globales des modules (SUPER_ADMIN / ADMIN avec config:read)
 */
router.get('/analytics/modules', authMiddleware, requirePermission('config:read'), async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const analytics = await moduleAnalyticsService.getGlobalAnalytics();
        res.json({ success: true, data: analytics });
    } catch (error) { next(error); }
});

/**
 * GET /monitoring/analytics/modules/:code/usage
 * Détail d'usage pour un module spécifique
 */
router.get('/analytics/modules/:code/usage', authMiddleware, requirePermission('config:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const detail = await moduleAnalyticsService.getModuleUsageDetail(req.params.code);
        if (!detail) {
            res.status(404).json({ success: false, message: 'Module non trouvé' });
            return;
        }
        res.json({ success: true, data: detail });
    } catch (error) { next(error); }
});

export const monitoringController = router;
export default router;
