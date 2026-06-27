/**
 * ==================================
 * eLISAschool - Controller Configuration Scoring
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { configurationScoringService } from '../services';
import { createConfigurationScoringSchema, updateConfigurationScoringSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Routes CRUD
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await configurationScoringService.findAll(req.utilisateur?.etablissementId);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createConfigurationScoringSchema, req.body);
        if (!dto.etablissementId && req.utilisateur?.etablissementId) {
            dto.etablissementId = req.utilisateur.etablissementId;
        }
        const created = await configurationScoringService.create(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = await configurationScoringService.findOne(req.params.id);
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateConfigurationScoringSchema, req.body);
        const updated = await configurationScoringService.update(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await configurationScoringService.delete(req.params.id);
        res.json({ success: true, message: 'Configuration de scoring supprimée' });
    } catch (error) { next(error); }
});

// Route pour obtenir la configuration active
router.get('/active', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        const data = await configurationScoringService.getActiveConfig(
            req.utilisateur!.etablissementId,
            anneeScolaireId
        );
        res.json({ success: true, data });
    } catch (error) { next(error); }
});

export const configurationScoringController = router;
export default router;
