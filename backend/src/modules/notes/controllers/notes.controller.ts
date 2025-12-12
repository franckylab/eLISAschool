/**
 * ==================================
 * eLISAschool - Controller Notes
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotesService } from '../services/notes.service';
import { createNoteSchema, updateNoteSchema, createBulkNotesSchema, queryNotesSchema } from '../dto';
import { authMiddleware, requireRoles, staffOnly } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const notesService = new NotesService();

function validate<T>(schema: any, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

router.use(authMiddleware);

/**
 * GET /api/notes
 * Liste des notes avec filtres
 */
router.get('/', staffOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validate(queryNotesSchema, req.query);
        const result = await notesService.findAll(query);

        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notes/eleve/:eleveId
 * Notes d'un élève
 */
router.get('/eleve/:eleveId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eleveId } = req.params;
        const query = validate(queryNotesSchema, { ...req.query, eleveId });
        const result = await notesService.findAll(query);

        res.status(200).json({
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notes/:id
 * Détail d'une note
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.findOne(req.params.id);

        res.status(200).json({
            success: true,
            data: note,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notes
 * Créer une note (enseignants uniquement)
 */
router.post('/', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validate(createNoteSchema, req.body);
        const note = await notesService.create(createDto, req.utilisateur!.id);

        res.status(201).json({
            success: true,
            data: note,
            message: 'Note créée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notes/bulk
 * Saisie de notes en masse
 */
router.post('/bulk', requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const createDto = validate(createBulkNotesSchema, req.body);
        const count = await notesService.createBulk(createDto, req.utilisateur!.id);

        res.status(201).json({
            success: true,
            data: { count },
            message: `${count} notes créées`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/notes/:id
 * Modifier une note
 */
router.patch('/:id', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updateDto = validate(updateNoteSchema, req.body);
        const note = await notesService.update(req.params.id, updateDto, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: note,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notes/:id/valider
 * Valider une note
 */
router.post('/:id/valider', requireRoles(Role.CHEF_ETABLISSEMENT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.valider(req.params.id, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            data: note,
            message: 'Note validée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/notes/:id/publier
 * Publier une note
 */
router.post('/:id/publier', requireRoles(Role.CHEF_ETABLISSEMENT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.publier(req.params.id);

        res.status(200).json({
            success: true,
            data: note,
            message: 'Note publiée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/notes/moyenne/:eleveId/:matiere
 * Calculer la moyenne d'un élève
 */
router.get('/moyenne/:eleveId/:matiere', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eleveId, matiere } = req.params;
        const { trimestre } = req.query as { trimestre?: string };
        const moyenne = await notesService.calculerMoyenne(eleveId, matiere, trimestre);

        res.status(200).json({
            success: true,
            data: { eleveId, matiere, trimestre, moyenne },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/notes/:id
 * Supprimer une note
 */
router.delete('/:id', requireRoles(Role.ENSEIGNANT, Role.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notesService.remove(req.params.id, req.utilisateur!.id);

        res.status(200).json({
            success: true,
            message: 'Note supprimée',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

export const notesController = router;
export default router;
