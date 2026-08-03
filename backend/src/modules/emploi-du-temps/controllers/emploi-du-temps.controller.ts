import { Router, Request, Response, NextFunction } from 'express';
import { emploiDuTempsService, templateService } from '../services';
import { emploiDuTempsPdfService } from '../services/emploi-du-temps.pdf';
import {
    creerCreneauSchema,
    modifierCreneauSchema,
    queryCreneauxSchema,
    genererEmploiDuTempsSchema,
    preferenceEmploiDuTempsSchema,
    verifierConflitsSchema,
} from '../dto';
import { conflitDetectionService } from '../services/conflit-detection.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { auditService, AuditAction } from '@modules/auth';
import { AppError } from '@common/filters/error.filter';
import { validateDto, validateQuery } from '@common/utils';
import { CreerTemplateDto } from '../services/template.service';

const router = Router();

router.get('/', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateQuery(queryCreneauxSchema, req.query);
        const result = await emploiDuTempsService.findAll(query, req.etablissementId!);
        return res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/', authMiddleware, requirePermission('emploi-du-temps:create'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(creerCreneauSchema, req.body);
        const creneau = await emploiDuTempsService.creerCreneau(dto, req.etablissementId!);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.CRENEAU_CREATE,
            cible: 'CreneauHoraire',
            cibleId: creneau.id,
            description: `Créneau créé: ${dto.jour} ${dto.heureDebut}-${dto.heureFin}`,
            module: 'emploi-du-temps',
        });
        return res.status(201).json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

router.post('/previsualiser', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(genererEmploiDuTempsSchema, req.body);
        const result = await emploiDuTempsService.previsualiserGeneration(dto, req.etablissementId!);
        return res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/generer', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(genererEmploiDuTempsSchema, req.body);
        const result = await emploiDuTempsService.genererEmploiDuTemps(dto, req.etablissementId!, req.utilisateur?.id, req);
        return res.status(result.success ? 201 : 200).json({ success: result.success, message: result.message, data: { nombreCreneaux: result.nombreCreneaux, conflits: result.conflits } });
    } catch (error) { next(error); }
});

router.get('/preferences', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/templates', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/templates/:id', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/verifier-conflits', authMiddleware, requirePermission('emploi-du-temps:verifier-conflits'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(verifierConflitsSchema, req.body);
        const conflits = await conflitDetectionService.detecterConflits(dto, req.etablissementId!);
        return res.json({ success: true, data: conflits });
    } catch (error) { next(error); }
});

router.get('/audit-conflits', authMiddleware, requirePermission('emploi-du-temps:verifier-conflits'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { periodeId, anneeScolaireId } = req.query as Record<string, string | undefined>;
        const audit = await conflitDetectionService.auditConflitsGlobaux(req.etablissementId!, { periodeId, anneeScolaireId });
        return res.json({ success: true, data: audit });
    } catch (error) { next(error); }
});

router.get('/statistiques', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classeAnneeId, enseignantId, periodeId } = req.query as Record<string, string | undefined>;
        const stats = await emploiDuTempsService.getStatistiques(req.etablissementId!, { classeAnneeId, enseignantId, periodeId });
        return res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/export/html/:classeAnneeId', authMiddleware, requirePermission('emploi-du-temps:export'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string || '';
        const html = await emploiDuTempsPdfService.generateHTML(req.params.classeAnneeId, anneeScolaireId, { format: 'html', colorBy: (req.query.colorBy as string) || 'matiere' });
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.EDT_EXPORT,
            cible: 'EmploiDuTemps',
            cibleId: req.params.classeAnneeId,
            description: 'Export HTML emploi du temps',
            module: 'emploi-du-temps',
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    } catch (error) { next(error); }
});

router.get('/export/pdf/:classeAnneeId', authMiddleware, requirePermission('emploi-du-temps:export'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string || '';
        const pdf = await emploiDuTempsPdfService.generatePDF(req.params.classeAnneeId, anneeScolaireId, { format: 'pdf', colorBy: (req.query.colorBy as string) || 'matiere' });
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.EDT_EXPORT,
            cible: 'EmploiDuTemps',
            cibleId: req.params.classeAnneeId,
            description: 'Export PDF emploi du temps',
            module: 'emploi-du-temps',
        });
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'inline');
        return res.send(pdf);
    } catch (error) { next(error); }
});

router.post('/:id/valider', authMiddleware, requirePermission('emploi-du-temps:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const creneau = await emploiDuTempsService.validerCreneau(req.params.id, req.etablissementId!);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.CRENEAU_VALIDER,
            cible: 'CreneauHoraire',
            cibleId: req.params.id,
            description: 'Créneau validé',
            module: 'emploi-du-temps',
        });
        return res.json({ success: true, data: creneau, message: 'Créneau validé' });
    } catch (error) { next(error); }
});

router.post('/valider-classe/:classeAnneeId', authMiddleware, requirePermission('emploi-du-temps:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const resultat = await emploiDuTempsService.validerCreneauxClasse(req.params.classeAnneeId, req.etablissementId!);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.EDT_VALIDER,
            cible: 'EmploiDuTemps',
            cibleId: req.params.classeAnneeId,
            description: `Validation en lot: ${resultat.valide} créneau(x)`,
            module: 'emploi-du-temps',
        });
        return res.json({ success: true, data: resultat, message: `${resultat.valide} créneau(x) validé(s)` });
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('emploi-du-temps:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const creneau = await emploiDuTempsService.findOne(req.params.id, req.etablissementId!);
        return res.json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('emploi-du-temps:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(modifierCreneauSchema, req.body);
        const { creneau, rapport } = await emploiDuTempsService.updateCreneau(req.params.id, dto, req.etablissementId!, req.utilisateur?.id, req);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.CRENEAU_UPDATE,
            cible: 'CreneauHoraire',
            cibleId: req.params.id,
            description: rapport
                ? `Créneau modifié (propagation: ${rapport.instancesQuiSuivent} instance(s), ${rapport.instancesInchangees} inchangée(s), ${rapport.conflits.length} en conflit)`
                : 'Créneau modifié',
            module: 'emploi-du-temps',
        });
        return res.json({ success: true, data: creneau, rapport });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('emploi-du-temps:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { instancesAnnulees } = await emploiDuTempsService.supprimerCreneau(req.params.id, req.etablissementId!, req.utilisateur?.id, req);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.CRENEAU_DELETE,
            cible: 'CreneauHoraire',
            cibleId: req.params.id,
            description: `Créneau supprimé (${instancesAnnulees} instance(s) future(s) annulée(s))`,
            module: 'emploi-du-temps',
        });
        return res.json({ success: true, message: 'Créneau supprimé', data: { instancesAnnulees } });
    } catch (error) { next(error); }
});

export const emploiDuTempsController = router;
export default router;
