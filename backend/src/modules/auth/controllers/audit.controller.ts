/**
 * ==================================
 * eLISAschool - Controller Audit Logs
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { auditRotationService } from '../services/audit-rotation.service';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { z } from 'zod';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError(
            `Données invalides: ${result.error.errors[0]?.message}`,
            400,
            'VALIDATION_ERROR'
        );
    }
    return result.data;
}

// Schémas
const rotationSchema = z.object({
    joursArchive: z.number().int().min(7).max(365).optional(),
    joursConservation: z.number().int().min(30).max(730).optional(),
    joursNettoyage: z.number().int().min(90).max(730).optional(),
});

// ==================================
// ROUTES AUTHENTIFIÉES - ADMIN UNIQUEMENT
// ==================================

/**
 * GET /api/audit/statistiques-stockage
 * Obtenir les statistiques de stockage des logs
 */
router.get('/statistiques-stockage', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await auditRotationService.getStatistiquesStockage();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/audit/archives
 * Lister les archives disponibles
 */
router.get('/archives', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const archives = auditRotationService.listerArchives();
        res.json({ success: true, data: archives });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/audit/rotation
 * Exécuter manuellement la rotation des logs
 */
router.post('/rotation', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(rotationSchema, req.body);

        const resultat = await auditRotationService.executerRotation();

        logger.warn('[Audit] Rotation manuelle exécutée', {
            utilisateurId: req.utilisateur?.id,
            ...resultat,
        });

        res.json({ success: true, data: resultat });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/audit/archiver
 * Archiver manuellement les anciens logs
 */
router.post('/archiver', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jours = parseInt(req.body.jours || '30', 10);

        const resultat = await auditRotationService.archiverAnciensLogs(jours);

        logger.warn('[Audit] Archivage manuel exécuté', {
            utilisateurId: req.utilisateur?.id,
            jours,
            ...resultat,
        });

        res.json({ success: true, data: resultat });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/audit/nettoyer
 * Nettoyer manuellement les logs obsolètes
 */
router.post('/nettoyer', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jours = parseInt(req.body.jours || '180', 10);

        const resultat = await auditRotationService.nettoyerLogsObsolètes(jours);

        logger.warn('[Audit] Nettoyage manuel exécuté', {
            utilisateurId: req.utilisateur?.id,
            jours,
            ...resultat,
        });

        res.json({ success: true, data: resultat });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/audit/archives/:nom
 * Supprimer une archive spécifique
 */
router.delete('/archives/:nom', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nom } = req.params;
        const fs = require('fs');
        const path = require('path');

        const ARCHIVE_DIR = path.join(process.cwd(), 'logs', 'audit-archive');
        const cheminArchive = path.join(ARCHIVE_DIR, nom);

        // Sécurité: vérifier que le chemin est bien dans le dossier d'archive
        if (!cheminArchive.startsWith(ARCHIVE_DIR)) {
            throw new AppError('Chemin invalide', 400);
        }

        if (!fs.existsSync(cheminArchive)) {
            throw new AppError('Archive non trouvée', 404);
        }

        const stats = fs.statSync(cheminArchive);
        fs.unlinkSync(cheminArchive);

        logger.warn('[Audit] Archive supprimée', {
            nom,
            tailleKo: Math.round(stats.size / 1024),
            utilisateurId: req.utilisateur?.id,
        });

        res.json({ success: true, message: 'Archive supprimée' });
    } catch (error) {
        next(error);
    }
});

export const auditController = router;
