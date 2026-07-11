import { Router, Request, Response, NextFunction } from 'express';
import { FonctionsService } from '../services';
import { createFonctionSchema, updateFonctionSchema, queryFonctionsSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const fonctionsService = new FonctionsService();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryFonctionsSchema, req.query);
        const etablissementId = req.utilisateur!.etablissementId!;
        const result = await fonctionsService.findAll(query, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/arbre', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const arbre = await fonctionsService.findArbre(etablissementId);
        res.json({ success: true, data: arbre });
    } catch (error) { next(error); }
});

router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const fonctions = await fonctionsService.findAllSimple(etablissementId);
        res.json({ success: true, data: fonctions });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const fonction = await fonctionsService.findOne(req.params.id, etablissementId);
        res.json({ success: true, data: fonction });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createFonctionSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const fonction = await fonctionsService.create(dto, etablissementId);
        res.status(201).json({ success: true, data: fonction });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateFonctionSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const fonction = await fonctionsService.update(req.params.id, dto, etablissementId);
        res.json({ success: true, data: fonction });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await fonctionsService.delete(req.params.id, etablissementId);
        res.json({ success: true, message: 'Fonction supprimée' });
    } catch (error) { next(error); }
});

export const fonctionsController = router;
export default router;
