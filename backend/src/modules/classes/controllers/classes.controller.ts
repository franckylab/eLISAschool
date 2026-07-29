/**
 * ==================================
 * eLISAschool - Controller Classes
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ClassesService } from '../services';
import { classesAnneesService } from '../services/classes-annees.service';
import { createClasseSchema, updateClasseSchema, affecterEleveSchema, transfererEleveSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new ClassesService();

/**
 * @route   GET /api/classes
 * @desc    Récupérer les classes avec pagination
 * @access  Authentifié avec permission classes:view
 */
router.get('/', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const sortBy = (req.query.sortBy as string) || 'nom';
        const sortOrder = (req.query.sortOrder as string) === 'DESC' ? 'DESC' : 'ASC';
        const niveauId = req.query.niveauId as string;
        const anneeId = req.query.anneeId as string;
        const search = req.query.search as string;
        const actifParam = req.query.actif as string;
        const actif = actifParam !== undefined ? actifParam === 'true' : undefined;

        const classes = await service.findAll(
            { page, limit, sortBy, sortOrder: sortOrder as 'ASC' | 'DESC', niveauId, anneeScolaireId: anneeId, search, actif },
            req.etablissementId
        );
        res.json({ success: true, data: classes });
    } catch (error) { next(error); }
});

/**
 * @route   GET /api/classes/all
 * @desc    Récupérer toutes les classes (sans pagination, pour dropdowns)
 * @access  Authentifié avec permission classes:view
 */
router.get('/all', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const niveauId = req.query.niveauId as string;
        const anneeId = req.query.anneeId as string;
        const classes = await service.findAll({ page: 1, limit: 1000, sortBy: 'nom', sortOrder: 'ASC' as const, niveauId, anneeScolaireId: anneeId }, req.etablissementId);
        // Retourner uniquement le tableau de classes (pas de métadonnées de pagination)
        res.json({ success: true, data: classes.items || classes });
    } catch (error) { next(error); }
});

/**
 * @route   GET /api/classes/:id/eleves
 * @desc    Récupérer les élèves d'une classe avec pagination et statistiques
 * @access  Authentifié avec permission classes:view
 */
router.get('/:id/eleves', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const search = req.query.search as string;

        const result = await service.findElevesByClasse(
            req.params.id,
            { page, limit, search },
            req.etablissementId
        );
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * @route   POST /api/classes/:id/reconcilier-effectif
 * @desc    Réconcilier le compteur effectifActuel avec le nombre réel d'affectations
 * @access  Authentifié avec permission classes:edit
 */
router.post('/:id/reconcilier-effectif', authMiddleware, requirePermission('classes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await service.reconcilierEffectifByClasse(req.params.id, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * @route   GET /api/classes/:id
 * @desc    Récupérer une classe par ID (avec données annuelles enrichies)
 * @access  Authentifié avec permission classes:view
 */
router.get('/:id', authMiddleware, requirePermission('classes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const classe = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('classes:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createClasseSchema, req.body);
        const classe = await service.create(dto, req.etablissementId, req.utilisateur?.id, req);
        res.status(201).json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('classes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateClasseSchema, req.body);
        const classe = await service.update(req.params.id, dto, req.etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, data: classe });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('classes:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.delete(req.params.id, req.etablissementId, req.utilisateur?.id, req);
        res.json({ success: true, message: 'Classe supprimée' });
    } catch (error) { next(error); }
});

router.post('/affectations', authMiddleware, requirePermission('classes:affecter'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(affecterEleveSchema, req.body);
        const affectation = await service.affecterEleve(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

/**
 * @route   POST /api/classes/affectations/transferer
 * @desc    Transférer un élève vers une nouvelle classe (désactive l'ancienne affectation, ajuste les effectifs)
 * @access  Authentifié avec permission classes:affecter
 */
router.post('/affectations/transferer', authMiddleware, requirePermission('classes:affecter'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(transfererEleveSchema, req.body);
        const affectation = await service.transfererEleve(dto, req.utilisateur?.id!, req.etablissementId);
        res.status(201).json({ success: true, data: affectation });
    } catch (error) { next(error); }
});

/**
 * @route   DELETE /api/classes/affectations/:id
 * @desc    Désaffecter un élève d'une classe (décrémente effectifActuel)
 * @access  Authentifié avec permission classes:affecter
 */
router.delete('/affectations/:id', authMiddleware, requirePermission('classes:affecter'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.desaffecterEleve(req.params.id, req.etablissementId);
        res.json({ success: true, message: 'Élève désaffecté' });
    } catch (error) { next(error); }
});

/**
 * @route   POST /api/classes/:id/activer
 * @desc    Basculer le statut actif/inactif d'une classe
 * @access  Authentifié avec permission classes:edit
 */
router.post('/:id/activer', authMiddleware, requirePermission('classes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { actif } = req.body as { actif: boolean };
        if (typeof actif !== 'boolean') {
            throw new AppError('Le champ "actif" est requis et doit être un booléen', 400, 'VALIDATION_ERROR');
        }
        const classe = await service.toggleActif(req.params.id, actif, req.etablissementId);
        res.json({ success: true, data: classe });
    } catch (error) { next(error); }
});

/**
 * @route   POST /api/classes/:id/promouvoir
 * @desc    Promouvoir une classe année : crée N+1 et réaffecte les élèves actifs
 * @access  Authentifié avec permission classes:edit
 * @param   id - ID de la ClasseAnnee source
 */
router.post('/:id/promouvoir', authMiddleware, requirePermission('classes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resultat = await classesAnneesService.promouvoirClasse(req.params.id, req.etablissementId!);
        res.json({
            success: true,
            data: resultat,
            message: `${resultat.elevesPromus} élève(s) promu(s)`,
        });
    } catch (error) { next(error); }
});

export const classesController = router;
export default router;
