/**
 * ==================================
 * eLISAschool - Controller Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PersonnelService } from '../services';
import { createPersonnelSchema, updatePersonnelSchema, queryPersonnelSchema, updateStatutSchema, updateDateEntreeSchema, updateCompetencesSchema, linkUtilisateurSchema } from '../dto';
import { authMiddleware, requirePermission, requireAnyPermission } from '@modules/auth/middlewares';
import { StatutPersonnel } from '../entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new PersonnelService();

// Membres
router.get('/', authMiddleware, requireAnyPermission(['personnel:view', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryPersonnelSchema, req.query);
        // Support frontend `actif` boolean → statut 'ACTIF'
        if (query.actif === true) {
            query.statut = 'ACTIF';
        }
        const membres = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: membres });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requireAnyPermission(['personnel:view', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membre = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireAnyPermission(['personnel:create', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPersonnelSchema, req.body);
        const membre = await service.createMembre(dto, req.etablissementId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requireAnyPermission(['personnel:edit', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePersonnelSchema, req.body);
        const membre = await service.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireAnyPermission(['personnel:delete', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Membre supprimé' });
    } catch (error) { next(error); }
});

// ─── Link/Unlink User ───

router.post('/:id/link-user', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const dto = validateDto(linkUtilisateurSchema, req.body);
        const membre = await service.linkUser(id, dto.utilisateurId, req.etablissementId);
        res.json({ success: true, data: membre, message: 'Utilisateur lié au dossier personnel' });
    } catch (error) { next(error); }
});

router.post('/:id/unlink-user', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const membre = await service.unlinkUser(id, req.etablissementId);
        res.json({ success: true, data: membre, message: 'Utilisateur délié du dossier personnel' });
    } catch (error) { next(error); }
});

router.get('/stats/sans-compte', authMiddleware, requireAnyPermission(['personnel:view', 'personnel:manage']), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await service.getPersonnelSansCompte(req.etablissementId!);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

// ─── Inline Edit Endpoints ───

router.post('/:id/statut', authMiddleware, requirePermission('personnel:edit:identity'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateStatutSchema, req.body);
        const membre = await service.updateStatut(req.params.id, dto.statut as StatutPersonnel, req.utilisateur?.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/:id/date-entree', authMiddleware, requirePermission('personnel:edit:identity'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateDateEntreeSchema, req.body);
        const membre = await service.updateDateEntree(req.params.id, new Date(dto.dateEmbauche), req.utilisateur?.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/:id/competences', authMiddleware, requirePermission('personnel:edit:competences'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCompetencesSchema, req.body);
        const membre = await service.updateCompetences(req.params.id, dto, req.utilisateur?.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

export const personnelController = router;
export default router;
