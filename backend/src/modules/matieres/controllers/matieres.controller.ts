/**
 * ==================================
 * eLISAschool - Controller Matières
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MatieresService } from '../services';
import {
    createMatiereSchema, updateMatiereSchema,
    createGroupeMatiereSchema,
    createMatiereNiveauSchema, updateMatiereNiveauSchema,
    affecterEnseignantSchema
} from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new MatieresService();

// Matières CRUD
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const matieres = await service.findAll();
        res.json({ success: true, data: matieres });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMatiereSchema, req.body);
        const matiere = await service.create(dto);
        res.status(201).json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

// Groupes
router.get('/groupes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupes = await service.findAllGroupes();
        res.json({ success: true, data: groupes });
    } catch (error) { next(error); }
});

router.post('/groupes', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createGroupeMatiereSchema, req.body);
        const groupe = await service.createGroupe(dto);
        res.status(201).json({ success: true, data: groupe });
    } catch (error) { next(error); }
});

// Programmes (Matière-Niveau)
router.get('/programme/:niveauId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prog = await service.getProgrammeNiveau(req.params.niveauId);
        res.json({ success: true, data: prog });
    } catch (error) { next(error); }
});

router.post('/programme', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMatiereNiveauSchema, req.body);
        const prog = await service.addMatiereToNiveau(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: prog });
    } catch (error) { next(error); }
});

router.patch('/programme/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereNiveauSchema, req.body);
        const prog = await service.updateProgramme(req.params.id, dto, req.utilisateur?.id!, req.etablissementId);
        res.json({ success: true, data: prog });
    } catch (error) { next(error); }
});

// Affectation Enseignant
router.post('/affectations', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(affecterEnseignantSchema, req.body);
        const affectation = await service.affecterEnseignant(dto, req.utilisateur?.id!, req.etablissementId);
        res.json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

export const matieresController = router;
export default router;
