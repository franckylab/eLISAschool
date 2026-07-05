/**
 * ==================================
 * eLISAschool - Controller Matières
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Changements v2.0:
 * - Support multi-tenant avec etablissementId
 * - Toutes les routes passent etablissementId aux services
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MatieresService } from '../services';
import {
    createMatiereSchema, updateMatiereSchema,
    createGroupeMatiereSchema,
    createMatiereNiveauSchema, updateMatiereNiveauSchema,
    affecterEnseignantSchema,
    queryMatieresSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const service = new MatieresService();

// Matières CRUD
router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryMatieresSchema, req.query);
        const etablissementId = req.utilisateur!.etablissementId!;
        const matieres = await service.findAll(query, etablissementId);
        res.json({ success: true, data: matieres });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMatiereSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const matiere = await service.create(dto, etablissementId);
        res.status(201).json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const matiere = await service.update(req.params.id, dto, etablissementId);
        res.json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await service.delete(req.params.id, etablissementId);
        res.json({ success: true, message: 'Matière supprimée' });
    } catch (error) { next(error); }
});

// Groupes
router.get('/groupes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groupes = await service.findAllGroupes();
        res.json({ success: true, data: groupes });
    } catch (error) { next(error); }
});

router.post('/groupes', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/programme', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMatiereNiveauSchema, req.body);
        const prog = await service.addMatiereToNiveau(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: prog });
    } catch (error) { next(error); }
});

router.patch('/programme/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereNiveauSchema, req.body);
        const prog = await service.updateProgramme(req.params.id, dto, req.utilisateur?.id!, req.etablissementId);
        res.json({ success: true, data: prog });
    } catch (error) { next(error); }
});

// Détail matière
router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const matiere = await service.findOne(req.params.id, etablissementId);
        res.json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

// Programme par matière (les sous-routes sont définies après GET /:id car Express les fait correspondre avant /:id sans conflit)
router.get('/:id/programme', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prog = await service.findProgrammeByMatiere(req.params.id);
        res.json({ success: true, data: prog });
    } catch (error) { next(error); }
});

// Affectations par enseignant
router.get('/enseignants/:id/affectations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const affectations = await service.getAffectationsByEnseignant(req.params.id, etablissementId);
        res.json({ success: true, data: affectations });
    } catch (error) { next(error); }
});

// Affectations par matière
router.get('/:id/affectations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const affectations = await service.findAffectationsByMatiere(req.params.id, etablissementId);
        res.json({ success: true, data: affectations });
    } catch (error) { next(error); }
});

// Configurations par matière
router.get('/:id/configurations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const configs = await service.findConfigurationsByMatiere(req.params.id, etablissementId);
        res.json({ success: true, data: configs });
    } catch (error) { next(error); }
});

// Affectation Enseignant
router.post('/affectations', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(affecterEnseignantSchema, req.body);
        const affectation = await service.affecterEnseignant(dto, req.utilisateur?.id!, req.etablissementId);
        res.json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

router.patch('/affectations/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(affecterEnseignantSchema.partial(), req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const affectation = await service.updateAffectation(req.params.id, dto, etablissementId);
        res.json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

router.delete('/affectations/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await service.deleteAffectation(req.params.id, etablissementId);
        res.json({ success: true, message: 'Affectation supprimée' });
    } catch (error) { next(error); }
});

export const matieresController = router;
export default router;
