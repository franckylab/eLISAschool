/**
 * ==================================
 * eLISAschool - Contrôleur Audit Trail
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * API REST pour consultation et export des logs d'audit
 */

import { Router, Request, Response, NextFunction } from 'express';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { validateDto } from '@common/utils/validate-dto.util';
import { auditFiltersSchema, auditExportSchema } from '../dto/audit-filters.dto';

const router = Router();

/**
 * GET /api/audit/logs
 * Récupère les logs d'audit avec filtres et pagination
 * Accès: ADMIN, SUPER_ADMIN
 */
router.get('/logs', authMiddleware, requirePermission('monitoring:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = validateDto(auditFiltersSchema, req.query);

        const result = await auditService.getLogs({
            utilisateurId: filters.utilisateurId,
            action: filters.action,
            cible: filters.cible,
            severity: filters.severity,
            dateDebut: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
            dateFin: filters.dateFin ? new Date(filters.dateFin) : undefined,
            limit: filters.limit,
            offset: filters.offset,
        });

        // Filtre côté client pour les champs non supportés par le service
        let items = result.items;

        if (filters.module) {
            items = items.filter(log => log.module === filters.module);
        }

        if (filters.cibleId) {
            items = items.filter(log => log.cibleId === filters.cibleId);
        }

        if (filters.estEchec !== undefined) {
            items = items.filter(log => log.estEchec === filters.estEchec);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            items = items.filter(log =>
                log.description?.toLowerCase().includes(searchLower) ||
                log.cible?.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            data: {
                items,
                total: items.length,
                limit: filters.limit,
                offset: filters.offset,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/audit/logs/:id
 * Récupère le détail d'un log d'audit
 * Accès: ADMIN, SUPER_ADMIN
 */
router.get('/logs/:id', authMiddleware, requirePermission('monitoring:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const logs = await auditService.getLogs({ limit: 1 });
        const log = logs.items.find(l => l.id === req.params.id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Log d\'audit non trouvé',
                code: 'AUDIT_LOG_NOT_FOUND',
            });
        }

        res.json({
            success: true,
            data: log,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/audit/logs/me
 * Récupère les logs de l'utilisateur courant
 * Accès: Tous les utilisateurs authentifiés
 */
router.get('/logs/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
        const offset = parseInt(req.query.offset as string) || 0;

        const result = await auditService.getLogs({
            utilisateurId: req.utilisateur!.id,
            limit,
            offset,
        });

        res.json({
            success: true,
            data: {
                items: result.items,
                total: result.total,
                limit,
                offset,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/audit/logs/export
 * Export les logs d'audit en CSV ou JSON
 * Accès: ADMIN, SUPER_ADMIN
 */
router.get('/logs/export', authMiddleware, requirePermission('monitoring:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const exportParams = validateDto(auditExportSchema, req.query);

        // Récupérer les logs (max 10000 pour l'export)
        const result = await auditService.getLogs({
            limit: 10000,
            offset: 0,
            dateDebut: exportParams.dateDebut ? new Date(exportParams.dateDebut) : undefined,
            dateFin: exportParams.dateFin ? new Date(exportParams.dateFin) : undefined,
            severity: exportParams.severity,
            utilisateurId: exportParams.utilisateurId,
        });

        let items = result.items;
        if (exportParams.module) {
            items = items.filter(log => log.module === exportParams.module);
        }

        if (exportParams.format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
            return res.json(items);
        }

        // Export CSV
        const csv = convertToCSV(items);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        return res.send('\uFEFF' + csv); // BOM pour Excel
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/audit/logs/statistics
 * Statistiques sur les logs d'audit
 * Accès: ADMIN, SUPER_ADMIN
 */
router.get('/logs/statistics', authMiddleware, requirePermission('monitoring:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Récupérer tous les logs (on pourrait optimiser avec des requêtes agrégées)
        const result = await auditService.getLogs({ limit: 10000, offset: 0 });
        const logs = result.items;

        // Statistiques par action
        const actionsCount: Record<string, number> = {};
        logs.forEach(log => {
            actionsCount[log.action] = (actionsCount[log.action] || 0) + 1;
        });

        // Statistiques par module
        const modulesCount: Record<string, number> = {};
        logs.forEach(log => {
            if (log.module) {
                modulesCount[log.module] = (modulesCount[log.module] || 0) + 1;
            }
        });

        // Statistiques par sévérité
        const severityCount: Record<string, number> = {};
        logs.forEach(log => {
            severityCount[log.severity] = (severityCount[log.severity] || 0) + 1;
        });

        // Top utilisateurs
        const usersCount: Record<string, { count: number; utilisateurId?: string }> = {};
        logs.forEach(log => {
            if (log.utilisateurId) {
                if (!usersCount[log.utilisateurId]) {
                    usersCount[log.utilisateurId] = {
                        count: 0,
                        utilisateurId: log.utilisateurId,
                    };
                }
                usersCount[log.utilisateurId].count++;
            }
        });

        const topUsers = Object.values(usersCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Taux d'échec
        const totalLogs = logs.length;
        const failedLogs = logs.filter(log => log.estEchec).length;
        const failureRate = totalLogs > 0 ? (failedLogs / totalLogs) * 100 : 0;

        // Logs récents (dernières 24h)
        const last24h = logs.filter(log => {
            const logDate = new Date(log.createdAt);
            const now = new Date();
            return (now.getTime() - logDate.getTime()) < 24 * 60 * 60 * 1000;
        }).length;

        res.json({
            success: true,
            data: {
                totalLogs,
                last24h,
                failureRate: failureRate.toFixed(2) + '%',
                actionsCount,
                modulesCount,
                severityCount,
                topUsers,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * Convertit les logs en format CSV
 */
function convertToCSV(logs: any[]): string {
    const headers = [
        'Date',
        'Utilisateur ID',
        'Action',
        'Module',
        'Sévérité',
        'Cible',
        'Cible ID',
        'Description',
        'IP',
        'Échec',
        'Erreur',
    ];

    const rows = logs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.utilisateurId || '',
        log.action,
        log.module || '',
        log.severity,
        log.cible || '',
        log.cibleId || '',
        (log.description || '').replace(/"/g, '""'),
        log.ipAddress || '',
        log.estEchec ? 'Oui' : 'Non',
        (log.erreur || '').replace(/"/g, '""'),
    ]);

    const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ];

    return csvRows.join('\n');
}

export { router as auditController };
