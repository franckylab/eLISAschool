/**
 * ==================================
 * eLISAschool - Controller Notes v2.1
 * ==================================
 * Permissions alignées sur l'enum Permission (shared/src/enums/roles.enum.ts) :
 * - GET  /                → notes:view
 * - GET  /statistiques    → notes:statistiques:view (déclarée AVANT /:id)
 * - GET  /:id             → notes:view
 * - POST /                → notes:create
 * - POST /bulk            → notes:bulk:create
 * - PATCH /:id            → notes:edit
 * - DELETE /:id           → notes:delete
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotesService } from '../services/notes.service';
import {
    createNoteSchema,
    updateNoteSchema,
    createBulkNotesSchema,
    queryNotesSchema,
    queryNotesStatistiquesSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { validateDto } from '@common/utils';

const router = Router();
const notesService = new NotesService();

router.use(authMiddleware);

router.get('/', requirePermission('notes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNotesSchema, req.query);
        const result = await notesService.findAll(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// IMPORTANT : déclarée AVANT GET /:id pour ne pas être capturée par le paramètre :id
router.get('/statistiques', requirePermission('notes:statistiques:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNotesStatistiquesSchema, req.query);
        const stats = await notesService.getStatistiques(query, req.etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/:id/versions', requirePermission('notes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const versions = await notesService.getHistorique(req.params.id, req.etablissementId);
        res.json({ success: true, data: versions });
    } catch (error) { next(error); }
});

router.get('/:id', requirePermission('notes:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/', requirePermission('notes:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createNoteSchema, req.body);
        const note = await notesService.create(dto, req.utilisateur!.id, req.etablissementId, req);
        res.status(201).json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/bulk', requirePermission('notes:bulk:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createBulkNotesSchema, req.body);
        const count = await notesService.createBulk(dto, req.utilisateur!.id, req.etablissementId, req);
        res.status(201).json({ success: true, count, message: `${count} notes créées` });
    } catch (error) { next(error); }
});

router.patch('/:id', requirePermission('notes:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateNoteSchema, req.body);
        const note = await notesService.update(req.params.id, dto, req.utilisateur!.id, req.etablissementId, req);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.delete('/:id', requirePermission('notes:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notesService.remove(req.params.id, req.utilisateur!.id, req.etablissementId, req);
        res.json({ success: true, message: 'Note supprimée' });
    } catch (error) { next(error); }
});

export const notesController = router;
export default router;
