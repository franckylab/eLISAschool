/**
 * ==================================
 * eLISAschool - Controller Personnel
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { PersonnelService } from '../services';
import { createPersonnelSchema, updatePersonnelSchema, createTypePersonnelSchema, updateTypePersonnelSchema, queryPersonnelSchema, updateStatutSchema, updateTypePersonnelMembreSchema, updateDateEntreeSchema, updateCompetencesSchema, linkUtilisateurSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new PersonnelService();

// Types Personnel
router.get('/types', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const types = await service.getTypes();
        res.json({ success: true, data: types });
    } catch (error) { next(error); }
});

router.post('/types', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createTypePersonnelSchema, req.body);
        const type = await service.createType(dto);
        res.status(201).json({ success: true, data: type });
    } catch (error) { next(error); }
});

router.get('/types/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const type = await service.findTypeById(req.params.id);
        res.json({ success: true, data: type });
    } catch (error) { next(error); }
});

router.patch('/types/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypePersonnelSchema, req.body);
        const type = await service.updateType(req.params.id, dto);
        res.json({ success: true, data: type });
    } catch (error) { next(error); }
});

router.delete('/types/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.deleteType(req.params.id);
        res.json({ success: true, message: 'Type de personnel supprimé' });
    } catch (error) { next(error); }
});

// Membres
router.get('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryPersonnelSchema, req.query);
        // Support frontend `actif` boolean → statut 'ACTIF'
        if (query.actif === true) {
            (query as any).statut = 'ACTIF';
        }
        const membres = await service.findAll(query, req.etablissementId);
        res.json({ success: true, data: membres });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const membre = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createPersonnelSchema, req.body);
        const membre = await service.createMembre(dto, req.etablissementId, req.utilisateur?.id);
        res.status(201).json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updatePersonnelSchema, req.body);
        const membre = await service.update(req.params.id, dto, req.etablissementId);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
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
        const membre = await service.linkUser(id, dto.utilisateurId);
        res.json({ success: true, data: membre, message: 'Utilisateur lié au dossier personnel' });
    } catch (error) { next(error); }
});

router.post('/:id/unlink-user', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const membre = await service.unlinkUser(id);
        res.json({ success: true, data: membre, message: 'Utilisateur délié du dossier personnel' });
    } catch (error) { next(error); }
});

router.get('/stats/sans-compte', authMiddleware, requirePermission('personnel:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await service.getPersonnelSansCompte(req.etablissementId!);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

// ─── Inline Edit Endpoints ───

router.post('/:id/statut', authMiddleware, requirePermission('personnel:edit:identity'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateStatutSchema, req.body);
        const membre = await service.updateStatut(req.params.id, dto.statut as any, req.utilisateur?.id);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/:id/type-personnel', authMiddleware, requirePermission('personnel:edit:type'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateTypePersonnelMembreSchema, req.body);
        const membre = await service.updateTypePersonnelMembre(req.params.id, dto.typePersonnelId, req.utilisateur?.id);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/:id/date-entree', authMiddleware, requirePermission('personnel:edit:identity'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateDateEntreeSchema, req.body);
        const membre = await service.updateDateEntree(req.params.id, new Date(dto.dateEmbauche), req.utilisateur?.id);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

router.post('/:id/competences', authMiddleware, requirePermission('personnel:edit:competences'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateCompetencesSchema, req.body);
        const membre = await service.updateCompetences(req.params.id, dto, req.utilisateur?.id);
        res.json({ success: true, data: membre });
    } catch (error) { next(error); }
});

export const personnelController = router;
export default router;
