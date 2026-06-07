import { Router, Request, Response, NextFunction } from 'express';
import { TransportService } from '../services/transport.service';
import { createLigneSchema, createInscriptionTransportSchema, enregistrerPresenceSchema } from '../dto';
import { authMiddleware, staffOnly, adminOnly } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const transportService = new TransportService();

router.get('/lignes', async (req, res, next) => {
    try {
        const lignes = await transportService.getLignes();
        res.json({ success: true, data: lignes, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/lignes/:id', async (req, res, next) => {
    try {
        const ligne = await transportService.getLigne(req.params.id);
        res.json({ success: true, data: ligne, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/lignes', authMiddleware, adminOnly, async (req, res, next) => {
    try {
        const dto = validateDto(createLigneSchema, req.body);
        const ligne = await transportService.createLigne(dto);
        res.status(201).json({ success: true, data: ligne, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/lignes/:id/inscriptions', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const inscriptions = await transportService.getInscriptionsByLigne(req.params.id);
        res.json({ success: true, data: inscriptions, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(createInscriptionTransportSchema, req.body);
        const inscription = await transportService.createInscription(dto);
        res.status(201).json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/presences', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const dto = validateDto(enregistrerPresenceSchema, req.body);
        const presence = await transportService.enregistrerPresence(dto);
        res.status(201).json({ success: true, data: presence, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/lignes/:id/presences/aujourd-hui', authMiddleware, staffOnly, async (req, res, next) => {
    try {
        const presences = await transportService.getPresencesDuJour(req.params.id);
        res.json({ success: true, data: presences, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const transportController = router;
