/**
 * ==================================
 * eLISAschool - Controller Notes v2.0
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { NotesService } from '../services/notes.service';
import { createNoteSchema, updateNoteSchema, createBulkNotesSchema, queryNotesSchema } from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
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

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validate(queryNotesSchema, req.query);
        const result = await notesService.findAll(query);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const note = await notesService.findOne(req.params.id);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createNoteSchema, req.body);
        const note = await notesService.create(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.post('/bulk', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createBulkNotesSchema, req.body);
        const count = await notesService.createBulk(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, count, message: `${count} notes créées` });
    } catch (error) { next(error); }
});

router.patch('/:id', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateNoteSchema, req.body);
        const note = await notesService.update(req.params.id, dto, req.utilisateur!.id);
        res.json({ success: true, data: note });
    } catch (error) { next(error); }
});

router.delete('/:id', requireRoles(Role.ENSEIGNANT, Role.ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await notesService.remove(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Note supprimée' });
    } catch (error) { next(error); }
});

export const notesController = router;
export default router;
