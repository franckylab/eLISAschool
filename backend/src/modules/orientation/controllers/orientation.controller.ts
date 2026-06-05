/**
 * ==================================
 * eLISAschool - Controller Orientation
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { OrientationService } from '../services';
import { createProfilOrientationSchema, updateProfilOrientationSchema, createFicheMetierSchema, createRdvSchema, updateRdvSchema } from '../dto';
import { TypeFiliere } from '../entities';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const orientationService = new OrientationService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// Profils
router.get('/profils/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const profil = await orientationService.getProfil(req.params.eleveId);
        res.json({ success: true, data: profil });
    } catch (error) { next(error); }
});

router.post('/profils', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createProfilOrientationSchema, req.body);
        const profil = await orientationService.createProfil(dto);
        res.status(201).json({ success: true, data: profil });
    } catch (error) { next(error); }
});

router.patch('/profils/:eleveId', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateProfilOrientationSchema, req.body);
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

router.post('/fiches', authMiddleware, requireRoles(Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createFicheMetierSchema, req.body);
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

router.get('/rdv/conseiller/:conseillerId', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rdvs = await orientationService.getRdvsByConseiller(req.params.conseillerId);
        res.json({ success: true, data: rdvs });
    } catch (error) { next(error); }
});

router.post('/rdv', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createRdvSchema, req.body);
        const rdv = await orientationService.createRdv(dto);
        res.status(201).json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

router.patch('/rdv/:id', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateRdvSchema, req.body);
        const rdv = await orientationService.updateRdv(req.params.id, dto);
        res.json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

router.post('/rdv/:id/annuler', authMiddleware, requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rdv = await orientationService.annulerRdv(req.params.id);
        res.json({ success: true, data: rdv });
    } catch (error) { next(error); }
});

export const orientationController = router;
export default router;
