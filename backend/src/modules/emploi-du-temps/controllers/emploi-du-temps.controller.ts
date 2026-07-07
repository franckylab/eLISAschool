import { Router, Request, Response, NextFunction } from 'express';
import { emploiDuTempsService, templateService } from '../services';
import { emploiDuTempsPdfService } from '../services/emploi-du-temps.pdf';
import {
    creerCreneauSchema,
    modifierCreneauSchema,
    queryCreneauxSchema,
    genererEmploiDuTempsSchema,
    preferenceEmploiDuTempsSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';
import { validateDto, validateQuery } from '@common/utils';
import { CreerTemplateDto } from '../services/template.service';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateQuery(queryCreneauxSchema, req.query);
        const result = await emploiDuTempsService.findAll(query, req.etablissementId!);
        return res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('emploi-du-temps:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(creerCreneauSchema, req.body);
        const anneeScolaireId = req.body.anneeScolaireId;
        if (!anneeScolaireId) throw new AppError('anneeScolaireId requis', 400, 'MISSING_PARAM');
        const creneau = await emploiDuTempsService.creerCreneau(dto, req.etablissementId!, anneeScolaireId);
        return res.status(201).json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

router.post('/generer', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(genererEmploiDuTempsSchema, req.body);
        const result = await emploiDuTempsService.genererEmploiDuTemps(dto, req.etablissementId!);
        return res.status(result.success ? 201 : 200).json({ success: result.success, message: result.message, data: { nombreCreneaux: result.nombreCreneaux, conflits: result.conflits } });
    } catch (error) { next(error); }
});

router.get('/preferences', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const preferences = await emploiDuTempsService.getPreferences(req.etablissementId!);
        return res.json({ success: true, data: preferences });
    } catch (error) { next(error); }
});

router.put('/preferences', authMiddleware, requirePermission('emploi-du-temps:preferences:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(preferenceEmploiDuTempsSchema, req.body);
        const preferences = await emploiDuTempsService.updatePreferences(req.etablissementId!, dto);
        return res.json({ success: true, data: preferences });
    } catch (error) { next(error); }
});

router.get('/templates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await templateService.findAll(req.etablissementId!);
        return res.json({ success: true, data: templates });
    } catch (error) { next(error); }
});

router.post('/templates', authMiddleware, requirePermission('emploi-du-temps:templates:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto: CreerTemplateDto = req.body;
        const template = await templateService.create(dto, req.etablissementId!, req.utilisateur?.id);
        return res.status(201).json({ success: true, data: template });
    } catch (error) { next(error); }
});

router.get('/templates/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const template = await templateService.findOne(req.params.id, req.etablissementId!);
        return res.json({ success: true, data: template });
    } catch (error) { next(error); }
});

router.patch('/templates/:id', authMiddleware, requirePermission('emploi-du-temps:templates:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const template = await templateService.update(req.params.id, req.body, req.etablissementId!);
        return res.json({ success: true, data: template });
    } catch (error) { next(error); }
});

router.delete('/templates/:id', authMiddleware, requirePermission('emploi-du-temps:templates:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await templateService.delete(req.params.id, req.etablissementId!);
        return res.json({ success: true, message: 'Template supprimé' });
    } catch (error) { next(error); }
});

router.post('/templates/:id/dupliquer', authMiddleware, requirePermission('emploi-du-temps:templates:manage'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const template = await templateService.dupliquer(req.params.id, req.etablissementId!, req.body.nom);
        return res.status(201).json({ success: true, data: template });
    } catch (error) { next(error); }
});

router.get('/export/html/:classeAnneeId', authMiddleware, requirePermission('emploi-du-temps:export'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const html = await emploiDuTempsPdfService.generateHTML(req.params.classeAnneeId, { format: 'html', colorBy: (req.query.colorBy as any) || 'matiere' });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    } catch (error) { next(error); }
});

router.get('/export/pdf/:classeAnneeId', authMiddleware, requirePermission('emploi-du-temps:export'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pdf = await emploiDuTempsPdfService.generatePDF(req.params.classeAnneeId, { format: 'pdf', colorBy: (req.query.colorBy as any) || 'matiere' });
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'inline');
        return res.send(pdf);
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const creneau = await emploiDuTempsService.findOne(req.params.id, req.etablissementId!);
        return res.json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('emploi-du-temps:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(modifierCreneauSchema, req.body);
        const creneau = await emploiDuTempsService.updateCreneau(req.params.id, dto, req.etablissementId!);
        return res.json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('emploi-du-temps:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await emploiDuTempsService.supprimerCreneau(req.params.id, req.etablissementId!);
        return res.json({ success: true, message: 'Créneau supprimé' });
    } catch (error) { next(error); }
});

export const emploiDuTempsController = router;
export default router;
