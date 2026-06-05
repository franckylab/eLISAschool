/**
 * ==================================
 * eLISAschool - Controller Messagerie
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { MessagerieService } from '../services/messagerie.service';
import { createConversationSchema, sendMessageSchema, queryConversationsSchema, queryMessagesSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const messagerieService = new MessagerieService();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    return result.data;
}

router.use(authMiddleware);

router.get('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validate(queryConversationsSchema, req.query);
        const result = await messagerieService.getConversations(req.utilisateur!.id, query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createConversationSchema, req.body);
        const conversation = await messagerieService.createConversation(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: conversation, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.get('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validate(queryMessagesSchema, req.query);
        const result = await messagerieService.getMessages(req.params.id, req.utilisateur!.id, query);
        res.json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.post('/conversations/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(sendMessageSchema, req.body);
        const message = await messagerieService.sendMessage(req.params.id, dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: message, timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

router.delete('/messages/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await messagerieService.deleteMessage(req.params.id, req.utilisateur!.id);
        res.json({ success: true, message: 'Message supprimé', timestamp: new Date().toISOString() });
    } catch (error) { next(error); }
});

export const messagerieController = router;
