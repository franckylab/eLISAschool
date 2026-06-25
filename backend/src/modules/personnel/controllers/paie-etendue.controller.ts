/**
 * ==================================
 * eLISAschool - Contrôleur Paie Étendue
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { AppDataSource } from '@database/data-source';
import { Cotisation, TypePrime, TypeRetenue, ElementSalaire } from '../entities';
import {
    createCotisationSchema,
    updateCotisationSchema,
    createTypePrimeSchema,
    updateTypePrimeSchema,
    createTypeRetenueSchema,
    updateTypeRetenueSchema,
    createElementSalaireSchema,
    updateElementSalaireSchema,
} from '../dto';
import { calculPaieService } from '../services/calcul-paie.service';
import { requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

// Helper validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ==================== COTISATIONS ====================
router.get('/cotisations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cotisations = await AppDataSource.getRepository(Cotisation).find({
            where: { etablissementId: req.utilisateur?.etablissementId },
            order: { code: 'ASC' },
        });
        res.json({ success: true, data: cotisations });
    } catch (error) {
        next(error);
    }
});

router.post('/cotisations', requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createCotisationSchema, req.body);
        const cotisation = AppDataSource.getRepository(Cotisation).create({
            ...dto,
            etablissementId: req.utilisateur!.etablissementId!,
        });
        await AppDataSource.getRepository(Cotisation).save(cotisation);
        res.status(201).json({ success: true, data: cotisation });
    } catch (error) {
        next(error);
    }
});

router.patch('/cotisations/:id', requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateCotisationSchema, req.body);
        const cotisation = await AppDataSource.getRepository(Cotisation).findOne({
            where: { id: req.params.id, etablissementId: req.utilisateur?.etablissementId },
        });
        if (!cotisation) throw new AppError('Cotisation non trouvée', 404, 'NOT_FOUND');
        Object.assign(cotisation, dto);
        await AppDataSource.getRepository(Cotisation).save(cotisation);
        res.json({ success: true, data: cotisation });
    } catch (error) {
        next(error);
    }
});

// ==================== PRIMES ====================
router.get('/primes', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const primes = await AppDataSource.getRepository(TypePrime).find({
            where: { etablissementId: req.utilisateur?.etablissementId },
            order: { code: 'ASC' },
        });
        res.json({ success: true, data: primes });
    } catch (error) {
        next(error);
    }
});

router.post('/primes', requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTypePrimeSchema, req.body);
        const prime = AppDataSource.getRepository(TypePrime).create({
            ...dto,
            etablissementId: req.utilisateur!.etablissementId!,
        });
        await AppDataSource.getRepository(TypePrime).save(prime);
        res.status(201).json({ success: true, data: prime });
    } catch (error) {
        next(error);
    }
});

// ==================== RETENUES ====================
router.get('/retenues', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const retenues = await AppDataSource.getRepository(TypeRetenue).find({
            where: { etablissementId: req.utilisateur?.etablissementId },
            order: { code: 'ASC' },
        });
        res.json({ success: true, data: retenues });
    } catch (error) {
        next(error);
    }
});

// ==================== CALCUL PAIE ====================
router.post('/calculer/:membrePersonnelId', requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { mois, annee } = req.body;
        const bulletin = await calculPaieService.calculerBulletin(
            req.params.membrePersonnelId,
            mois,
            annee,
            req.utilisateur!.etablissementId!
        );
        res.status(201).json({ success: true, data: bulletin });
    } catch (error) {
        next(error);
    }
});

router.post('/simuler/:membrePersonnelId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const simulation = await calculPaieService.simulerPaie(
            req.params.membrePersonnelId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: simulation });
    } catch (error) {
        next(error);
    }
});

export const personnelPaieEtendueController = router;
export default router;
