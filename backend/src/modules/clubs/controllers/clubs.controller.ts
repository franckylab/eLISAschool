import { Router } from 'express';
import { ClubsService } from '../services/clubs.service';
import { createClubSchema, inscrireClubSchema, createEvenementSchema } from '../dto';
import { authMiddleware, adminOnly, staffOnly } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const clubsService = new ClubsService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    return result.data;
}

router.get('/', async (req, res, next) => {
    try {
        const clubs = await clubsService.getClubs();
        res.json({ success: true, data: clubs, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
    try {
        const club = await clubsService.getClub(req.params.id);
        res.json({ success: true, data: club, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const dto = validate(createClubSchema, req.body);
        const club = await clubsService.createClub(dto);
        res.status(201).json({ success: true, data: club, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id/inscrits', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const inscrits = await clubsService.getInscrits(req.params.id);
        res.json({ success: true, data: inscrits, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validate(inscrireClubSchema, req.body);
        const inscription = await clubsService.inscrire(dto);
        res.status(201).json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/:id/evenements', async (req, res, next) => {
    try {
        const evenements = await clubsService.getEvenements(req.params.id);
        res.json({ success: true, data: evenements, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/:id/evenements', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validate(createEvenementSchema, req.body);
        const evenement = await clubsService.createEvenement(req.params.id, dto);
        res.status(201).json({ success: true, data: evenement, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const clubsController = router;
