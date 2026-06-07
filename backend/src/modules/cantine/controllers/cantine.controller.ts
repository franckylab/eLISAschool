import { Router, Request, Response, NextFunction } from 'express';
import { CantineService } from '../services/cantine.service';
import { createMenuSchema, createInscriptionSchema, rechargerSoldeSchema, enregistrerConsommationSchema, queryMenusSchema } from '../dto';
import { authMiddleware, adminOnly, staffOnly } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const cantineService = new CantineService();

router.get('/menus', async (req, res, next) => {
    try {
        const query = validateDto(queryMenusSchema, req.query);
        const result = await cantineService.getMenus(query.dateDebut, query.dateFin);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/menus/aujourd-hui', async (req, res, next) => {
    try {
        const menus = await cantineService.getMenuDuJour();
        res.json({ success: true, data: menus, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/menus', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(createMenuSchema, req.body);
        const menu = await cantineService.createMenu(dto);
        res.status(201).json({ success: true, data: menu, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(createInscriptionSchema, req.body);
        const inscription = await cantineService.createInscription(dto);
        res.status(201).json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/inscriptions/:eleveId', authMiddleware, async (req, res, next) => {
    try {
        const inscription = await cantineService.getInscription(req.params.eleveId);
        res.json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions/:id/recharger', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(rechargerSoldeSchema, req.body);
        const inscription = await cantineService.rechargerSolde(req.params.id, dto);
        res.json({ success: true, data: inscription, message: 'Solde rechargé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/consommations', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(enregistrerConsommationSchema, req.body);
        const consommation = await cantineService.enregistrerConsommation(dto);
        res.status(201).json({ success: true, data: consommation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const cantineController = router;
