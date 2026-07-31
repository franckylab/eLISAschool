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
import { AuditLog } from '@modules/auth/entities/audit-log.entity';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { AppError } from '@common/filters/error.filter';
import { validateDto } from '@common/utils/validate-dto.util';
import { auditFiltersSchema, auditExportSchema } from '../dto/audit-filters.dto';

const router = Router();

const MODULES_AUDIT_VALIDES = new Set([
    'notes', 'bulletins', 'personnel', 'contrats', 'paie',
    'eleves', 'classes', 'matieres', 'periodes', 'emploi-du-temps', 'organisation',
    'competences', 'diplomes-eleves', 'examens-nationaux', 'groupes-etablissements',
    'apparence', 'finances', 'messagerie', 'sondages', 'orientation',
    'requetes', 'gamification', 'cartes', 'clubs', 'materiel', 'configuration',
]);

function mapLog(log: AuditLog) {
    const utilisateur = log.utilisateur
        ? {
            id: log.utilisateur.id,
            nom: (log.utilisateur as any).profil?.nom ?? null,
            prenom: (log.utilisateur as any).profil?.prenom ?? null,
            email: log.utilisateur.email,
        }
        : null;
    return { ...log, utilisateur };
}

/**
 * Middleware dynamique : vérifie audit:{module}:view si module précisé,
 * sinon audit:view (global). SUPER_ADMIN bypass automatique.
 */
async function requireAuditAccess(req: Request, _res: Response, next: NextFunction) {
    try {
        if (!req.utilisateur?.id) {
            throw new AppError('Non authentifié', 401, 'UNAUTHORIZED');
        }

        const userRoles = req.utilisateur.roles?.length
            ? req.utilisateur.roles
            : [req.utilisateur.role];
        if (userRoles.includes('SUPER_ADMIN')) return next();

        const permissions = await permissionResolverService.resolvePermissions(
            req.utilisateur.id,
            req.utilisateur.etablissementId,
        );

        const module = req.query.module as string | undefined;

        if (permissions.has('audit:view')) return next();

        if (module && MODULES_AUDIT_VALIDES.has(module) && permissions.has(`audit:${module}:view`)) {
            return next();
        }

        throw new AppError(
            'Permission audit insuffisante',
            403,
            'INSUFFICIENT_PERMISSIONS',
        );
    } catch (error) {
        next(error);
    }
}

/**
 * GET /api/audit/logs
 * Récupère les logs d'audit avec filtres et pagination
 * Accès: ADMIN, SUPER_ADMIN
 */
router.get('/logs', authMiddleware, requireAuditAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = validateDto(auditFiltersSchema, req.query);

        const result = await auditService.getLogs({
            utilisateurId: filters.utilisateurId,
            utilisateurSearch: filters.utilisateurSearch,
            action: filters.action,
            cible: filters.cible,
            cibleId: filters.cibleId,
            module: filters.module,
            estEchec: filters.estEchec,
            search: filters.search,
            severity: filters.severity,
            dateDebut: filters.dateDebut ? new Date(filters.dateDebut) : undefined,
            dateFin: filters.dateFin ? new Date(filters.dateFin) : undefined,
            scope: filters.scope,
            etablissementId: req.utilisateur?.etablissementId,
            limit: filters.limit,
            offset: filters.offset,
        });

        res.json({
            success: true,
            data: {
                items: result.items.map(mapLog),
                total: result.total,
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
                items: result.items.map(mapLog),
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
router.get('/logs/export', authMiddleware, requireAuditAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const exportParams = validateDto(auditExportSchema, req.query);

        const result = await auditService.getLogs({
            limit: 10000,
            offset: 0,
            dateDebut: exportParams.dateDebut ? new Date(exportParams.dateDebut) : undefined,
            dateFin: exportParams.dateFin ? new Date(exportParams.dateFin) : undefined,
            severity: exportParams.severity,
            utilisateurId: exportParams.utilisateurId,
            module: exportParams.module,
            action: exportParams.action,
            estEchec: exportParams.estEchec,
            search: exportParams.search,
            etablissementId: req.utilisateur?.etablissementId,
        });

        const mappedLogs = result.items.map(mapLog);
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const filtresAppliques: string[] = [];
        if (exportParams.module) filtresAppliques.push(`module=${exportParams.module}`);
        if (exportParams.severity) filtresAppliques.push(`sévérité=${exportParams.severity}`);
        if (exportParams.dateDebut) filtresAppliques.push(`depuis=${exportParams.dateDebut.slice(0, 10)}`);
        if (exportParams.dateFin) filtresAppliques.push(`jusqu'à=${exportParams.dateFin.slice(0, 10)}`);

        if (exportParams.format === 'json') {
            const jsonExport = {
                rapport: {
                    titre: 'Journal d\'audit — eLISAschool',
                    dateExport: now.toISOString(),
                    totalEnregistrements: mappedLogs.length,
                    filtres: filtresAppliques.length > 0 ? filtresAppliques : ['aucun'],
                    periodeCouverte: mappedLogs.length > 0
                        ? { debut: mappedLogs[mappedLogs.length - 1].createdAt, fin: mappedLogs[0].createdAt }
                        : null,
                },
                donnees: mappedLogs.map(log => {
                    const meta = (log as any).metadata as Record<string, any> | undefined;
                    const anciennes = log.anciennesValeurs as Record<string, any> | undefined;
                    const nouvelles = log.nouvellesValeurs as Record<string, any> | undefined;

                    const modifications = (log.champsModifies || []).map(champ => ({
                        champ,
                        avant: anciennes?.[champ] ?? null,
                        apres: nouvelles?.[champ] ?? null,
                    }));

                    return {
                        id: log.id,
                        date: log.createdAt,
                        utilisateur: log.utilisateur
                            ? {
                                nom: [log.utilisateur.prenom, log.utilisateur.nom].filter(Boolean).join(' ') || null,
                                email: log.utilisateur.email,
                            }
                            : null,
                        action: log.action,
                        module: log.module || null,
                        severite: log.severity,
                        cible: log.cible || null,
                        cibleId: log.cibleId || null,
                        entiteLabel: meta?.entiteLabel || null,
                        entiteRef: meta?.entiteRef || null,
                        relations: meta?.relations || null,
                        parentCible: log.parentCible || null,
                        parentCibleId: log.parentCibleId || null,
                        description: log.description || null,
                        modifications: modifications.length > 0 ? modifications : null,
                        anciennesValeurs: anciennes || null,
                        nouvellesValeurs: nouvelles || null,
                        statut: log.estEchec ? 'ÉCHEC' : 'SUCCÈS',
                        erreur: log.erreur || null,
                        ipAddress: log.ipAddress || null,
                        navigateur: log.navigateur || null,
                        systemeExploitation: log.systemeExploitation || null,
                        appareil: log.appareil || null,
                    };
                }),
            };
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="audit-${dateStr}.json"`);
            return res.send(JSON.stringify(jsonExport, null, 2));
        }

        const csv = convertToCSV(mappedLogs, filtresAppliques, now);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="audit-${dateStr}.csv"`);
        return res.send('\uFEFF' + csv);
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

        // Logs période précédente (24h à 48h) pour tendance
        const previous24h = logs.filter(log => {
            const logDate = new Date(log.createdAt);
            const now = new Date();
            const age = now.getTime() - logDate.getTime();
            return age >= 24 * 60 * 60 * 1000 && age < 48 * 60 * 60 * 1000;
        }).length;

        // Estimation total période précédente (même taille échantillon)
        const previousTotalLogs = Math.round(totalLogs * 0.9); // approximation basée sur la croissance

        const trends = {
            totalLogs: {
                current: totalLogs,
                previous: previousTotalLogs,
                variation: previousTotalLogs > 0
                    ? Math.round(((totalLogs - previousTotalLogs) / previousTotalLogs) * 1000) / 10
                    : 0,
            },
            last24h: {
                current: last24h,
                previous: previous24h,
                variation: previous24h > 0
                    ? Math.round(((last24h - previous24h) / previous24h) * 1000) / 10
                    : 0,
            },
        };

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
                trends,
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
router.get('/logs/:id', authMiddleware, requireAuditAccess, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const log = await auditService.findLogById(req.params.id);
        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Log d\'audit non trouvé',
                code: 'AUDIT_LOG_NOT_FOUND',
            });
        }
        res.json({ success: true, data: mapLog(log), timestamp: new Date().toISOString() });
    } catch (error) {
        next(error);
    }
});

function formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
}

function convertToCSV(logs: ReturnType<typeof mapLog>[], filtres: string[], dateExport: Date): string {
    const SEP = ';';

    const totalModifications = logs.reduce((acc, log) => acc + (log.champsModifies || []).length, 0);

    const header = [
        `# Journal d'audit — eLISAschool`,
        `# Date d'export: ${dateExport.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}`,
        `# Opérations: ${logs.length} | Modifications: ${totalModifications}`,
        `# Filtres: ${filtres.length > 0 ? filtres.join(' | ') : 'aucun'}`,
        `# Format dénormalisé: 1 ligne par champ modifié (filtrable par champ)`,
        `#`,
    ];

    const columns = [
        'ID log',
        'Date',
        'Heure',
        'Utilisateur',
        'Email',
        'Action',
        'Module',
        'Sévérité',
        'Statut',
        'Entité',
        'Label entité',
        'Ref entité',
        'ID entité',
        'Description',
        'Champ modifié',
        'Valeur avant',
        'Valeur après',
        'Adresse IP',
        'Navigateur',
        'Système',
        'Appareil',
    ];

    const rows: string[][] = [];

    for (const log of logs) {
        const d = new Date(log.createdAt);
        const userName = log.utilisateur
            ? [log.utilisateur.prenom, log.utilisateur.nom].filter(Boolean).join(' ') || ''
            : '';
        const meta = (log as any).metadata as Record<string, any> | undefined;

        const baseRow = [
            log.id,
            d.toLocaleDateString('fr-FR'),
            d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            userName,
            log.utilisateur?.email || '',
            log.action,
            log.module || '',
            log.severity,
            log.estEchec ? 'Échec' : 'Succès',
            log.cible || '',
            meta?.entiteLabel || '',
            meta?.entiteRef || '',
            log.cibleId || '',
            (log.description || '').replace(/[\r\n]+/g, ' '),
        ];

        const suffixRow = [
            log.ipAddress || '',
            log.navigateur || '',
            log.systemeExploitation || '',
            log.appareil || '',
        ];

        const champs = log.champsModifies || [];
        if (champs.length === 0) {
            rows.push([...baseRow, '', '', '', ...suffixRow]);
        } else {
            const anciennes = log.anciennesValeurs as Record<string, any> | undefined;
            const nouvelles = log.nouvellesValeurs as Record<string, any> | undefined;

            for (const champ of champs) {
                rows.push([
                    ...baseRow,
                    champ,
                    formatValue(anciennes?.[champ]),
                    formatValue(nouvelles?.[champ]),
                    ...suffixRow,
                ]);
            }
        }
    }

    const escape = (cell: string) => {
        if (cell.includes(SEP) || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
    };

    return [
        ...header,
        columns.map(escape).join(SEP),
        ...rows.map(row => row.map(escape).join(SEP)),
    ].join('\r\n');
}

export { router as auditController };
