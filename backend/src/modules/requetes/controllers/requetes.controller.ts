import { Router } from 'express';
import { RequetesService } from '../services/requetes.service';
import { createRequeteSchema, traiterRequeteSchema, queryRequetesSchema } from '../dto';
import { authMiddleware, managerOnly } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const requetesService = new RequetesService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    return result.data;
}

router.use(authMiddleware);

router.get('/', managerOnly, async (req, res, next) => {
    try {
        const query = validate(queryRequetesSchema, req.query);
        const result = await requetesService.findAll(query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/mes-requetes', async (req, res, next) => {
    try {
        const query = validate(queryRequetesSchema, req.query);
        const result = await requetesService.findByUser(req.utilisateur!.id, query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const requete = await requetesService.findOne(req.params.id);
        res.json({ success: true, data: requete, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/', async (req, res, next) => {
    try {
        const dto = validate(createRequeteSchema, req.body);
        const requete = await requetesService.create(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: requete, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/traiter', managerOnly, async (req, res, next) => {
    try {
        const dto = validate(traiterRequeteSchema, req.body);
        const requete = await requetesService.traiter(req.params.id, dto, req.utilisateur!.id);
        res.json({ success: true, data: requete, message: `Requête ${dto.statut.toLowerCase()}`, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/annuler', async (req, res, next) => {
    try {
        const requete = await requetesService.annuler(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: requete, message: 'Requête annulée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const requetesController = router;
