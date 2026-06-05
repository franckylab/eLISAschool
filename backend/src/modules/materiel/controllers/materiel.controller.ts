import { Router } from 'express';
import { MaterielService } from '../services/materiel.service';
import { createMaterielSchema, pretMaterielSchema, retourMaterielSchema } from '../dto';
import { authMiddleware, staffOnly } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const materielService = new MaterielService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    return result.data;
}

router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const materiels = await materielService.findAll(req.query.categorie as string);
        res.json({ success: true, data: materiels, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/prets', authMiddleware, staffOnly, async (req, res, next) => {
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

router.post('/', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validate(createMaterielSchema, req.body);
        const materiel = await materielService.create(dto);
        res.status(201).json({ success: true, data: materiel, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/prets', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validate(pretMaterielSchema, req.body);
        const pret = await materielService.preter(dto);
        res.status(201).json({ success: true, data: pret, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/prets/:id/retour', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validate(retourMaterielSchema, req.body);
        const pret = await materielService.retourner(req.params.id, dto);
        res.json({ success: true, data: pret, message: 'Matériel retourné', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const materielController = router;
