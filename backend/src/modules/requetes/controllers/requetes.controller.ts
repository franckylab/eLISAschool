import { Router } from 'express';
import { RequetesService } from '../services/requetes.service';
import { createRequeteSchema, traiterRequeteSchema, queryRequetesSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const requetesService = new RequetesService();

router.use(authMiddleware);

router.get('/', requirePermission('config:edit'), async (req, res, next) => {
    try {
        const query = validateDto(queryRequetesSchema, req.query);
        const result = await requetesService.findAll({ 
            ...query, 
            page: query.page || 1, 
            limit: query.limit || 20,
            type: query.type as any,
            statut: query.statut as any
        });
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/mes-requetes', async (req, res, next) => {
    try {
        const query = validateDto(queryRequetesSchema, req.query);
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
        const dto = validateDto(createRequeteSchema, req.body);
        const requete = await requetesService.create(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: requete, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/traiter', requirePermission('config:edit'), async (req, res, next) => {
    try {
        const dto = validateDto(traiterRequeteSchema, req.body);
        const requete = await requetesService.traiter(req.params.id, dto, req.utilisateur!.id);
        res.json({ success: true, data: requete, message: `Requête ${dto.decision.toLowerCase()}`, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/annuler', async (req, res, next) => {
    try {
        const requete = await requetesService.annuler(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: requete, message: 'Requête annulée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const requetesController = router;
