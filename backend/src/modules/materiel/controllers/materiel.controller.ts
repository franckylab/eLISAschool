import { Router } from 'express';
import { MaterielService } from '../services/materiel.service';
import { createMaterielSchema, pretMaterielSchema, retourMaterielSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const materielService = new MaterielService();

router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const materiels = await materielService.findAll(req.query.categorie as string);
        res.json({ success: true, data: materiels, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/prets', authMiddleware, async (req, res, next) => {
    try {
        const prets = await materielService.getPretsEnCours();
        res.json({ success: true, data: prets, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        const materiel = await materielService.findOne(req.params.id);
        res.json({ success: true, data: materiel, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, async (req, res, next) => {
    try {
        const dto = validateDto(createMaterielSchema, req.body);
        const materiel = await materielService.create(dto, undefined, req.utilisateur?.id);
        res.status(201).json({ success: true, data: materiel, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/prets', authMiddleware, async (req, res, next) => {
    try {
        const dto = validateDto(pretMaterielSchema, req.body);
        const pret = await materielService.preter(dto, undefined, req.utilisateur?.id);
        res.status(201).json({ success: true, data: pret, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/prets/:id/retour', authMiddleware, async (req, res, next) => {
    try {
        const dto = validateDto(retourMaterielSchema, req.body);
        const pret = await materielService.retourner(req.params.id, dto);
        res.json({ success: true, data: pret, message: 'Matériel retourné', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const materielController = router;
