/**
 * ==================================
 * eLISAschool - Controller Impressions
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ImpressionsService } from '../services';
import { createModeleSchema, updateModeleSchema, createImpressionSchema } from '../dto';
import { TypeDocument } from '../entities';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const impressionsService = new ImpressionsService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Modèles
router.get('/modeles', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = req.query.type as TypeDocument | undefined;
        const modeles = await impressionsService.getModeles(type);
        res.json({ success: true, data: modeles });
    } catch (error) { next(error); }
});

router.get('/modeles/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const modele = await impressionsService.getModele(req.params.id);
        res.json({ success: true, data: modele });
    } catch (error) { next(error); }
});

router.post('/modeles', authMiddleware, requireRoles(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createModeleSchema, req.body);
        const modele = await impressionsService.createModele(dto);
        res.status(201).json({ success: true, data: modele });
    } catch (error) { next(error); }
});

router.patch('/modeles/:id', authMiddleware, requireRoles(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateModeleSchema, req.body);
        const modele = await impressionsService.updateModele(req.params.id, dto);
        res.json({ success: true, data: modele });
    } catch (error) { next(error); }
});

router.delete('/modeles/:id', authMiddleware, requireRoles(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await impressionsService.deleteModele(req.params.id);
        res.json({ success: true, message: 'Modèle supprimé' });
    } catch (error) { next(error); }
});

// File d'impression
router.get('/file', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const file = await impressionsService.getFileImpression(req.utilisateur?.id);
        res.json({ success: true, data: file });
    } catch (error) { next(error); }
});

router.post('/file', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createImpressionSchema, req.body);
        const impression = await impressionsService.createImpression(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: impression });
    } catch (error) { next(error); }
});

router.get('/file/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const impression = await impressionsService.getImpression(req.params.id);
        res.json({ success: true, data: impression });
    } catch (error) { next(error); }
});

router.post('/file/:id/annuler', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const impression = await impressionsService.annulerImpression(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: impression });
    } catch (error) { next(error); }
});

router.post('/file/:id/generer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fichierUrl = await impressionsService.genererDocument(req.params.id);
        res.json({ success: true, data: { fichierUrl } });
    } catch (error) { next(error); }
});

// Traitement batch
router.post('/traiter', authMiddleware, requireRoles(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await impressionsService.traiterFileImpression();
        res.json({ success: true, data: { traites: count } });
    } catch (error) { next(error); }
});

export const impressionsController = router;
export default router;
