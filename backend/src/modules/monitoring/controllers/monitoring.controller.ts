/**
 * ==================================
 * eLISAschool - Controller Monitoring
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MonitoringService } from '../services';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { maintenanceSchema, queryLogsSchema } from '../dto';

const router = Router();
const monitoringService = new MonitoringService();

// Health check (public)
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const health = await monitoringService.healthCheck();
        const statusCode = health.status === 'ok' ? 200 : (health.status === 'degraded' ? 200 : 503);
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({ status: 'down', error: 'Health check failed' });
    }
});

// Métriques système (admin)
router.get('/metrics', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await monitoringService.getSystemMetrics();
        res.json({ success: true, data: metrics });
    } catch (error) { next(error); }
});

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

export const monitoringController = router;
export default router;
