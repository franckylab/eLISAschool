/**
 * ==================================
 * eLISAschool - Controller Validation Workflow
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ValidationWorkflowService } from '../services';
import { validationRapportService } from '../services/validation-rapport.service';
import { createWorkflowSchema, traiterValidationSchema, queryWorkflowsSchema, configRolesSchema } from '../dto';
import { generateRapportSchema } from '../dto/validation-rapport.dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { validateDto } from '@common/utils';

const router = Router();
const workflowService = new ValidationWorkflowService();

router.use(authMiddleware);

/**
 * GET /api/validation-workflows
 * Liste tous les workflows avec filtres
 */
router.get('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryWorkflowsSchema, req.query);
        const result = await workflowService.findAll(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

/**
 * GET /api/validation-workflows/:id
 * Détails d'un workflow
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workflow = await workflowService.findOne(req.params.id);
        res.json({ success: true, data: workflow });
    } catch (error) { next(error); }
});

/**
 * GET /api/validation-workflows/stats/:module
 * Statistiques pour un module
 */
router.get('/stats/:module', requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await workflowService.getStatistiques(req.params.module, req.etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

/**
 * POST /api/validation-workflows
 * Crée un nouveau workflow
 */
router.post('/', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(createWorkflowSchema, req.body);
        const workflow = await workflowService.createWorkflow(dto, req.utilisateur!.id);
        res.status(201).json({ success: true, data: workflow });
    } catch (error) { next(error); }
});

/**
 * POST /api/validation-workflows/:id/valider
 * Traite une validation (niveau suivant)
 */
router.post('/:id/valider', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(traiterValidationSchema, req.body);
        const workflow = await workflowService.traiterValidation(req.params.id, dto, req.utilisateur!.id);
        
        const message = workflow.statut === 'COMPLETEE' 
            ? 'Validation finale approuvée' 
            : workflow.statut === 'REJETEE' 
            ? 'Validation rejetée' 
            : `Validation niveau ${workflow.niveauActuel} approuvée`;
        
        res.json({ success: true, data: workflow, message });
    } catch (error) { next(error); }
});

/**
 * POST /api/validation-workflows/:id/annuler
 * Annule un workflow
 */
router.post('/:id/annuler', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const workflow = await workflowService.annuler(req.params.id, req.utilisateur!.id);
        res.json({ success: true, data: workflow, message: 'Workflow annulé' });
    } catch (error) { next(error); }
});

/**
 * PUT /api/validation-workflows/config/:module
 * Configure les rôles pour un module
 */
router.put('/config/:module', requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(configRolesSchema, { ...req.body, module: req.params.module });
        await workflowService.updateConfigRoles(dto);
        res.json({ success: true, message: 'Configuration des rôles mise à jour' });
    } catch (error) { next(error); }
});

/**
 * GET /api/validation-workflows/check/:module/:entiteId
 * Vérifie si une entité est validée
 */
router.get('/check/:module/:entiteId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isValide = await workflowService.isValide(
            req.params.module,
            req.params.entiteId,
            req.etablissementId
        );
        res.json({ success: true, data: { isValide } });
    } catch (error) { next(error); }
});

// ==================================
// ROUTES RAPPORTS DE VALIDATION
// ==================================

/**
 * GET /api/validation-workflows/rapports/summary
 * Génère un rapport synthétique de validation
 */
router.get('/rapports/summary',
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(generateRapportSchema, req.query);
            const rapport = await validationRapportService.generateRapport({
                ...dto,
                periodeDebut: new Date(dto.periodeDebut),
                periodeFin: new Date(dto.periodeFin),
            });
            res.json({ success: true, data: rapport });
        } catch (error) { next(error); }
    }
);

/**
 * GET /api/validation-workflows/rapports/export/csv
 * Exporte un rapport en format CSV
 */
router.get('/rapports/export/csv',
    requireRoles(Role.ADMIN, Role.SUPER_ADMIN),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const dto = validateDto(generateRapportSchema, req.query);
            const rapport = await validationRapportService.generateRapport({
                ...dto,
                periodeDebut: new Date(dto.periodeDebut),
                periodeFin: new Date(dto.periodeFin),
            });

            const csv = await validationRapportService.exportCSV(rapport);

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="rapport-validation-${Date.now()}.csv"`);
            res.send(csv);
        } catch (error) { next(error); }
    }
);

export const validationWorkflowController = router;
export default router;
