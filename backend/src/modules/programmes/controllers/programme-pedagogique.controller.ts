import { Router, Request, Response, NextFunction } from 'express';
import { ProgrammePedagogiqueService } from '../services';
import { createProgrammeSchema, updateProgrammeSchema, queryProgrammesSchema, addMatiereProgrammeSchema, updateMatiereProgrammeSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const service = new ProgrammePedagogiqueService();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryProgrammesSchema, req.query);
        const result = await service.findAll(query, req.etablissementId!);
        return res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const programmes = await service.findAllSimple(req.etablissementId!);
        return res.json({ success: true, data: programmes });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const programme = await service.findOne(req.params.id, req.etablissementId!);
        return res.json({ success: true, data: programme });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createProgrammeSchema, req.body);
        const programme = await service.create(dto, req.etablissementId!);
        return res.status(201).json({ success: true, data: programme });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateProgrammeSchema, req.body);
        const programme = await service.update(req.params.id, dto, req.etablissementId!);
        return res.json({ success: true, data: programme });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId!);
        return res.json({ success: true, message: 'Programme supprimé' });
    } catch (error) { next(error); }
});

router.get('/:id/matieres', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const matieres = await service.getMatieres(req.params.id, req.etablissementId!);
        return res.json({ success: true, data: matieres });
    } catch (error) { next(error); }
});

router.post('/:id/matieres', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(addMatiereProgrammeSchema, req.body);
        const pm = await service.addMatiere(req.params.id, dto, req.etablissementId!);
        return res.status(201).json({ success: true, data: pm });
    } catch (error) { next(error); }
});

router.patch('/matieres/:pmId', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereProgrammeSchema, req.body);
        const pm = await service.updateMatiere(req.params.pmId, dto, req.etablissementId!);
        return res.json({ success: true, data: pm });
    } catch (error) { next(error); }
});

router.delete('/matieres/:pmId', authMiddleware, requirePermission('programmes:config:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.removeMatiere(req.params.pmId, req.etablissementId!);
        return res.json({ success: true, message: 'Matière retirée du programme' });
    } catch (error) { next(error); }
});

export const programmePedagogiqueController = router;
