/**
 * ==================================
 * eLISAschool - Controller Notes v2.0
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotesService } from '../services/notes.service';
import { createNoteSchema, updateNoteSchema, createBulkNotesSchema, queryNotesSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const notesService = new NotesService();

router.use(authMiddleware);

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryNotesSchema, req.query);
        const result = await notesService.findAll(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.findOne(req.params.id);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/', requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createNoteSchema, req.body);
        const note = await notesService.create(dto, req.utilisateur!.id, req.etablissementId);
        res.status(201).json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/bulk', requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createBulkNotesSchema, req.body);
        const count = await notesService.createBulk(dto, req.utilisateur!.id, req.etablissementId);
        res.status(201).json({ success: true, count, message: `${count} notes créées` });
    } catch (error) { next(error); }
});

router.patch('/:id', requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateNoteSchema, req.body);
        const note = await notesService.update(req.params.id, dto, req.utilisateur!.id);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.delete('/:id', requirePermission('enseignant:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notesService.remove(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Note supprimée' });
    } catch (error) { next(error); }
});

export const notesController = router;
export default router;
