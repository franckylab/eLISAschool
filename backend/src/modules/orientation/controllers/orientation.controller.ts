/**
 * ==================================
 * eLISAschool - Controller Orientation
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { OrientationService } from '../services';
import { createProfilOrientationSchema, updateProfilOrientationSchema, createFicheMetierSchema, createRdvSchema, updateRdvSchema } from '../dto';
import { TypeFiliere } from '../entities';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const orientationService = new OrientationService();

// Profils
router.get('/profils/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const profil = await orientationService.getProfil(req.params.eleveId);
        res.json({ success: true, data: profil });
    } catch (error) { next(error); }
});

router.post('/profils', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createProfilOrientationSchema, req.body);
        const profil = await orientationService.createProfil(dto);
        res.status(201).json({ success: true, data: profil });
    } catch (error) { next(error); }
});

router.patch('/profils/:eleveId', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateProfilOrientationSchema, req.body);
        const profil = await orientationService.updateProfil(req.params.eleveId, dto);
        res.json({ success: true, data: profil });
    } catch (error) { next(error); }
});

router.get('/profils/:eleveId/suggestions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const suggestions = await orientationService.suggestFilieres(req.params.eleveId);
        res.json({ success: true, data: suggestions });
    } catch (error) { next(error); }
});

// Fiches métiers
router.get('/fiches', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filiere = req.query.filiere as TypeFiliere | undefined;
        const fiches = await orientationService.getFiches(filiere);
        res.json({ success: true, data: fiches });
    } catch (error) { next(error); }
});

router.get('/fiches/search', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query.q as string || '';
        const fiches = await orientationService.searchFiches(query);
        res.json({ success: true, data: fiches });
    } catch (error) { next(error); }
});

router.get('/fiches/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const fiche = await orientationService.getFiche(req.params.id);
        res.json({ success: true, data: fiche });
    } catch (error) { next(error); }
});

router.post('/fiches', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createFicheMetierSchema, req.body);
        const fiche = await orientationService.createFiche(dto);
        res.status(201).json({ success: true, data: fiche });
    } catch (error) { next(error); }
});

// RDV
router.get('/rdv/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rdvs = await orientationService.getRdvsByEleve(req.params.eleveId);
        res.json({ success: true, data: rdvs });
    } catch (error) { next(error); }
});

router.get('/rdv/conseiller/:conseillerId', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rdvs = await orientationService.getRdvsByConseiller(req.params.conseillerId);
        res.json({ success: true, data: rdvs });
    } catch (error) { next(error); }
});

router.post('/rdv', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createRdvSchema, req.body);
        const rdv = await orientationService.createRdv(dto);
        res.status(201).json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

router.patch('/rdv/:id', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateRdvSchema, req.body);
        const rdv = await orientationService.updateRdv(req.params.id, dto);
        res.json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

router.post('/rdv/:id/annuler', authMiddleware, requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rdv = await orientationService.annulerRdv(req.params.id);
        res.json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

export const orientationController = router;
export default router;
