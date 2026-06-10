import { Router, Request, Response, NextFunction } from 'express';
import { CantineService } from '../services/cantine.service';
import { createMenuSchema, createInscriptionSchema, rechargerSoldeSchema, enregistrerConsommationSchema, queryMenusSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';
import { CANTINE_DEFAULT_CONFIG } from '../config/cantine.config';

const router = Router();
const cantineService = new CantineService();

router.get('/menus', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryMenusSchema, req.query);
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const result = await cantineService.getMenus(query.dateDebut, query.dateFin, etablissementId, page, limit);
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

router.get('/menus/aujourd-hui', authMiddleware, async (req, res, next) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const menus = await cantineService.getMenuDuJour(etablissementId);
        res.json({ success: true, data: menus, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/menus', authMiddleware, requireRoles(Role.RESPONSABLE_CANTINE, Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
    try {
        const dto = validateDto(createMenuSchema, req.body);
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const menu = await cantineService.createMenu(dto, etablissementId);
        res.status(201).json({ success: true, data: menu, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_CANTINE), async (req, res, next) => {
    try {
        const dto = validateDto(createInscriptionSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const inscription = await cantineService.createInscription(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/inscriptions/:eleveId', authMiddleware, async (req, res, next) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const inscription = await cantineService.getInscription(req.params.eleveId, etablissementId);
        res.json({ success: true, data: inscription, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/inscriptions/:id/recharger', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.RESPONSABLE_CANTINE), async (req, res, next) => {
    try {
        const dto = validateDto(rechargerSoldeSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const inscription = await cantineService.rechargerSolde(req.params.id, dto, userId, etablissementId);
        res.json({ success: true, data: inscription, message: 'Solde rechargé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/consommations', authMiddleware, requireRoles(Role.RESPONSABLE_CANTINE, Role.ADMIN, Role.SUPER_ADMIN), async (req, res, next) => {
    try {
        const dto = validateDto(enregistrerConsommationSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const consommation = await cantineService.enregistrerConsommation(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: consommation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// CONFIGURATION
// ==================================

router.get('/config', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ 
            success: true, 
            data: CANTINE_DEFAULT_CONFIG,
            message: 'Configuration par défaut du module cantine',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

router.post('/config/reset', authMiddleware, requireRoles(Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Ici, on pourrait ajouter une logique pour reset les paramètres en DB
        // Pour l'instant, on retourne la config par défaut
        res.json({ 
            success: true, 
            data: CANTINE_DEFAULT_CONFIG,
            message: 'Configuration réinitialisée aux valeurs par défaut',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

export const cantineController = router;
