/**
 * ==================================
 * eLISAschool - Controller Jours Fériés
 * ==================================
 * CRUD REST API pour la gestion des jours fériés
 * Routes : /api/emploi-du-temps/jours-feries
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { jourFerieService } from '../services/jour-ferie.service';
import { createJourFerieSchema, updateJourFerieSchema, chargerModelePaysSchema } from '../dto/jour-ferie.dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Permission } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();

/** Helper de validation Zod */
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ─── Routes statiques AVANT les routes dynamiques /:id ─────────

/**
 * GET / — Lister tous les jours fériés
 * Query : ?annee=2026 | ?dateDebut=...&dateFin=...
 */
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const { annee, dateDebut, dateFin, page, limit } = req.query;

        let data;
        if (dateDebut && dateFin && typeof dateDebut === 'string' && typeof dateFin === 'string') {
            data = await jourFerieService.findByPlageDates(dateDebut, dateFin, etablissementId);
        } else if (annee && typeof annee === 'string') {
            data = await jourFerieService.findByAnnee(parseInt(annee, 10), etablissementId);
        } else {
            const p = page ? parseInt(page as string, 10) : undefined;
            const l = limit ? parseInt(limit as string, 10) : undefined;
            data = await jourFerieService.findAll(etablissementId, p, l);
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /check/:date — Vérifier si une date est un jour férié
 */
router.get('/check/:date', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const date = new Date(req.params.date);
        if (isNaN(date.getTime())) {
            throw new AppError('Date invalide', 400, 'DATE_INVALIDE');
        }
        const data = await jourFerieService.estJourFerie(date, etablissementId);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /modeles — Lister les modèles de jours fériés disponibles par pays
 */
router.get('/modeles', authMiddleware, async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await jourFerieService.listerModelesPays();
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /generer-variables — Générer les jours fériés variables (Computus) pour une année
 * Body : { annee: number, pays?: string }
 */
router.post('/generer-variables', authMiddleware, requirePermission(Permission.EMPLOI_DU_TEMPS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).etablissementId;
        const { annee, pays } = req.body;
        if (!annee || typeof annee !== 'number' || annee < 2000 || annee > 2100) {
            throw new AppError('Année invalide (2000-2100)', 400, 'ANNEE_INVALIDE');
        }
        if (!etablissementId) {
            throw new AppError('etablissementId requis', 400, 'ETABLISSEMENT_REQUIS');
        }
        const data = await jourFerieService.genererVariablesAnnee(annee, etablissementId, pays, req);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /charger-modele — Charger un modèle de jours fériés par pays pour l'établissement
 */
router.post('/charger-modele', authMiddleware, requirePermission(Permission.EMPLOI_DU_TEMPS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(chargerModelePaysSchema, req.body);
        // etablissementId : middleware (ADMIN lié) > body (SUPER_ADMIN multi-établissement)
        const etablissementId = (req as any).etablissementId || dto.etablissementId;
        if (!etablissementId) {
            throw new AppError('etablissementId requis (dans le body ou via le middleware)', 400, 'ETABLISSEMENT_REQUIS');
        }
        const data = await jourFerieService.chargerModelePays(dto.pays, etablissementId, req);
        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * POST / — Créer un jour férié
 */
router.post('/', authMiddleware, requirePermission(Permission.EMPLOI_DU_TEMPS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createJourFerieSchema, req.body);
        const created = await jourFerieService.create(dto, req);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

// ─── Routes dynamiques /:id en dernier ─────────────────────────

/**
 * GET /:id — Détail d'un jour férié
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await jourFerieService.findOne(req.params.id);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /:id — Mettre à jour un jour férié
 */
router.patch('/:id', authMiddleware, requirePermission(Permission.EMPLOI_DU_TEMPS_EDIT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateJourFerieSchema, req.body);
        const updated = await jourFerieService.update(req.params.id, dto, req);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /:id — Supprimer un jour férié (non système)
 */
router.delete('/:id', authMiddleware, requirePermission(Permission.EMPLOI_DU_TEMPS_DELETE), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await jourFerieService.delete(req.params.id, req);
        res.json({ success: true, message: 'Jour férié supprimé' });
    } catch (error) {
        next(error);
    }
});

export const joursFeriesController = router;
