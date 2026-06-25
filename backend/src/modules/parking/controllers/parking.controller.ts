import { Router, Request, Response, NextFunction } from 'express';
import { parkingService } from '../services/parking.service';
import {
    createPlaceParkingSchema,
    updatePlaceParkingSchema,
    createVehiculeSchema,
    updateVehiculeSchema,
    createAbonnementSchema,
    updateAbonnementSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();

// ==================================
// PLACES DE PARKING
// ==================================

router.get('/places', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const filtres: any = {};
        
        if (req.query.type) filtres.type = req.query.type as string;
        if (req.query.statut) filtres.statut = req.query.statut as string;

        const places = await parkingService.getPlaces(etablissementId, filtres);
        res.json({ success: true, data: places, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/places/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const place = await parkingService.getPlace(req.params.id, etablissementId);
        res.json({ success: true, data: place, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/places', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPlaceParkingSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const place = await parkingService.createPlace(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: place, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/places/:id', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePlaceParkingSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const place = await parkingService.updatePlace(req.params.id, dto, userId, etablissementId);
        res.json({ success: true, data: place, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.delete('/places/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        await parkingService.deletePlace(req.params.id, userId, etablissementId);
        res.json({ success: true, message: 'Place supprimée', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// VÉHICULES
// ==================================

router.get('/vehicules', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const vehicules = await parkingService.getVehicules(etablissementId);
        res.json({ success: true, data: vehicules, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/vehicules/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const vehicule = await parkingService.getVehicule(req.params.id, etablissementId);
        res.json({ success: true, data: vehicule, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/vehicules', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createVehiculeSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const vehicule = await parkingService.createVehicule(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: vehicule, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/vehicules/:id', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateVehiculeSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const vehicule = await parkingService.updateVehicule(req.params.id, dto, userId, etablissementId);
        res.json({ success: true, data: vehicule, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.delete('/vehicules/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        await parkingService.deleteVehicule(req.params.id, userId, etablissementId);
        res.json({ success: true, message: 'Véhicule supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// ABONNEMENTS
// ==================================

router.get('/abonnements', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const filtres: any = {};
        
        if (req.query.statut) filtres.statut = req.query.statut as string;

        const abonnements = await parkingService.getAbonnements(etablissementId, filtres);
        res.json({ success: true, data: abonnements, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/abonnements/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const abonnement = await parkingService.getAbonnement(req.params.id, etablissementId);
        res.json({ success: true, data: abonnement, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/abonnements', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createAbonnementSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const abonnement = await parkingService.createAbonnement(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: abonnement, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.patch('/abonnements/:id', authMiddleware, requirePermission('infrastructure:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateAbonnementSchema, req.body);
        const userId = (req as any).utilisateur?.id;
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const abonnement = await parkingService.updateAbonnement(req.params.id, dto, userId, etablissementId);
        res.json({ success: true, data: abonnement, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// STATISTIQUES
// ==================================

router.get('/statistiques', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = (req as any).utilisateur?.etablissementId;
        const stats = await parkingService.getStatistiques(etablissementId);
        res.json({ success: true, data: stats, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

// ==================================
// TÂCHES AUTOMATISÉES
// ==================================

router.post('/expire-abonnements', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await parkingService.expireAbonnements();
        res.json({ 
            success: true, 
            data: { abonnementsExpires: count },
            message: `${count} abonnements expirés`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

export const parkingController = router;
