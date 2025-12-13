/**
 * ==================================
 * eLISAschool - Controller Etablissement
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EtablissementService } from '../services';
import { updateEtablissementSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const etablissementService = new EtablissementService();

function validate<T>(schema: any, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// GET configuration (Public ou protégé ?) - Protégé lecture simple pour commencer
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await etablissementService.getConfig();
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

// PATCH configuration (Admin seulement)
router.patch('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateEtablissementSchema, req.body);
        const config = await etablissementService.updateConfig(dto);
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

export const etablissementController = router;
export default router;
