import { Router, Request, Response, NextFunction } from 'express';
import { TransportService } from '../services/transport.service';
import { createLigneSchema, createInscriptionTransportSchema, enregistrerPresenceSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { TRANSPORT_DEFAULT_CONFIG } from '../config/transport.config';

const router = Router();
const transportService = new TransportService();

router.get('/lignes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await transportService.getLignes(etablissementId, page, limit);
        res.json({ 
            success: true, 
            data: result.data, 
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: Math.ceil(result.total / result.limit),
                hasNext: result.page * result.limit < result.total,
                hasPrev: result.page > 1
            },
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

router.get('/lignes/:id', authMiddleware, async (req, res, next) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const ligne = await transportService.getLigne(req.params.id, etablissementId);
        res.json({ success: true, data: ligne, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/lignes', authMiddleware, requireRoles(Role.RESPONSABLE_TRANSPORT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
    try {
        const dto = validateDto(createLigneSchema, req.body);
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const ligne = await transportService.createLigne(dto, etablissementId);
        res.status(201).json({ success: true, data: ligne, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/lignes/:id/inscriptions', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_TRANSPORT), async (req, res, next) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const inscriptions = await transportService.getInscriptionsByLigne(req.params.id, etablissementId);
        res.json({ success: true, data: inscriptions, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_TRANSPORT), async (req, res, next) => {
    try {
        const dto = validateDto(createInscriptionTransportSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const inscription = await transportService.createInscription(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/presences', authMiddleware, requireRoles(Role.RESPONSABLE_TRANSPORT, Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
    try {
        const dto = validateDto(enregistrerPresenceSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const presence = await transportService.enregistrerPresence(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: presence, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/lignes/:id/presences/aujourd-hui', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_TRANSPORT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const presences = await transportService.getPresencesDuJour(req.params.id, etablissementId);
        res.json({ success: true, data: presences, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// CONFIGURATION
// ==================================

router.get('/config', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ 
            success: true, 
            data: TRANSPORT_DEFAULT_CONFIG,
            message: 'Configuration par défaut du module transport',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

router.post('/config/reset', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ 
            success: true, 
            data: TRANSPORT_DEFAULT_CONFIG,
            message: 'Configuration réinitialisée aux valeurs par défaut',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

export const transportController = router;
