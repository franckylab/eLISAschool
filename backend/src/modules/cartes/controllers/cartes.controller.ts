import { Router } from 'express';
import { CartesService } from '../services/cartes.service';
import { createCarteSchema, updateCarteSchema } from '../dto';
import { authMiddleware, staffOnly } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const cartesService = new CartesService();

function validate<T>(schema: any, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    return result.data;
}

router.use(authMiddleware);

router.get('/utilisateur/:utilisateurId', async (req, res, next) => {
    try {
        const cartes = await cartesService.findByUser(req.params.utilisateurId);
        res.json({ success: true, data: cartes, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/numero/:numeroCarte', staffOnly, async (req, res, next) => {
    try {
        const carte = await cartesService.findByNumero(req.params.numeroCarte);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const carte = await cartesService.findOne(req.params.id);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/', staffOnly, async (req, res, next) => {
    try {
        const dto = validate(createCarteSchema, req.body);
        const carte = await cartesService.create(dto);
        res.status(201).json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/:id', staffOnly, async (req, res, next) => {
    try {
        const dto = validate(updateCarteSchema, req.body);
        const carte = await cartesService.update(req.params.id, dto);
        res.json({ success: true, data: carte, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/desactiver', staffOnly, async (req, res, next) => {
    try {
        const carte = await cartesService.desactiver(req.params.id);
        res.json({ success: true, data: carte, message: 'Carte désactivée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/perte', async (req, res, next) => {
    try {
        const carte = await cartesService.signalerPerte(req.params.id);
        res.json({ success: true, data: carte, message: 'Perte signalée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const cartesController = router;
