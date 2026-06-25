/**
 * ==================================
 * eLISAschool - Controller Classes
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ClassesService } from '../services';
import { createClasseSchema, updateClasseSchema, affecterEleveSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new ClassesService();

/**
 * @route   GET /api/classes
 * @desc    Récupérer les classes avec pagination
 * @access  Authentifié avec permission classes:view
 */
router.get('/', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveauId = req.query.niveauId as string;
        const anneeId = req.query.anneeId as string;
        const classes = await service.findAll({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'DESC' as const, niveauId, anneeScolaireId: anneeId }, req.etablissementId);
        res.json({ success: true, data: classes });
    } catch (error) { next(error); }
});

/**
 * @route   GET /api/classes/all
 * @desc    Récupérer toutes les classes (sans pagination, pour dropdowns)
 * @access  Authentifié avec permission classes:view
 */
router.get('/all', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveauId = req.query.niveauId as string;
        const anneeId = req.query.anneeId as string;
        const classes = await service.findAll({ page: 1, limit: 1000, sortBy: 'nom', sortOrder: 'ASC' as const, niveauId, anneeScolaireId: anneeId }, req.etablissementId);
        // Retourner uniquement le tableau de classes (pas de métadonnées de pagination)
        res.json({ success: true, data: classes.items || classes });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('classes:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createClasseSchema, req.body);
        const classe = await service.create(dto, req.etablissementId);
        res.status(201).json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('classes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateClasseSchema, req.body);
        const classe = await service.update(req.params.id, dto);
        res.json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('classes:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id);
        res.json({ success: true, message: 'Classe supprimée' });
    } catch (error) { next(error); }
});

router.post('/affectations', authMiddleware, requirePermission('classes:affecter'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(affecterEleveSchema, req.body);
        const affectation = await service.affecterEleve(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

export const classesController = router;
export default router;
