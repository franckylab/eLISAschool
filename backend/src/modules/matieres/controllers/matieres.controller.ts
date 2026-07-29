/**
 * ==================================
 * eLISAschool - Controller Matières
 * ==================================
 * Version: 2.1.0
 * 
 * v2.1: Ajout endpoint programmes-pedagogiques par matière
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MatieresService } from '../services';
import {
    createMatiereSchema, updateMatiereSchema,
    createGroupeMatiereSchema,
    createMatiereNiveauSchema, updateMatiereNiveauSchema,
    affecterEnseignantSchema,
    moveAffectationSchema,
    queryMatieresSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters';

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
        const matiere = await service.create(dto, etablissementId, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const matiere = await service.update(req.params.id, dto, etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: matiere });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await service.delete(req.params.id, etablissementId, req.utilisateur?.id, req);
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

// GRILLE MATIÈRE PAR NIVEAU (MatiereNiveau)
// Source de vérité pour configs matière. Ne pas confondre avec ProgrammePedagogique.
router.get('/programme', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const items = await service.getAllMatieresNiveaux(etablissementId);
        res.json({ success: true, data: items });
    } catch (error) { next(error); }
});

router.get('/programme/:niveauId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        const items = await service.getMatieresParNiveau(req.params.niveauId, etablissementId);
        res.json({ success: true, data: items });
    } catch (error) { next(error); }
});

router.post('/programme', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createMatiereNiveauSchema, req.body);
        const item = await service.addMatiereToNiveau(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: item });
    } catch (error) { next(error); }
});

router.patch('/programme/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateMatiereNiveauSchema, req.body);
        const item = await service.updateMatiereNiveau(req.params.id, dto, req.utilisateur?.id!, req.etablissementId);
        res.json({ success: true, data: item });
    } catch (error) { next(error); }
});

router.delete('/programme/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur!.etablissementId!;
        await service.deleteMatiereNiveau(req.params.id, etablissementId);
        res.json({ success: true, message: 'Programme matière-niveau supprimé' });
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

// Programme par matière (MatiereNiveau)
router.get('/:id/programme', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const prog = await service.findProgrammeByMatiere(req.params.id, req.utilisateur!.etablissementId!);
        res.json({ success: true, data: prog });
    } catch (error) { next(error); }
});

// Programmes pédagogiques par matière (ProgrammePedagogique via ProgrammeMatiere)
router.get('/:id/programmes-pedagogiques', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await service.findProgrammesPedagogiquesByMatiere(req.params.id, req.utilisateur!.etablissementId!);
        res.json({ success: true, data: items });
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

router.patch('/affectations/:id/move', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(moveAffectationSchema, req.body);
        const etablissementId = req.utilisateur!.etablissementId!;
        const affectation = await service.moveAffectation(req.params.id, dto, etablissementId);
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
