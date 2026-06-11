/**
 * ==================================
 * eLISAschool - Controller Recrutement
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * API REST complète pour le module de recrutement :
 * - 25+ endpoints pour offres, candidatures, entretiens, onboarding
 * - Autorisations RBAC granulaires
 * - Validation Zod complète
 */

import { Router, Request, Response, NextFunction } from 'express';
import { recrutementService } from '../services';
import {
    createOffreEmploiSchema,
    updateOffreEmploiSchema,
    createCandidatureSchema,
    evaluerCandidatureSchema,
    createEntretienSchema,
    evaluerEntretienSchema,
    createOnboardingSchema,
    updateChecklistSchema,
} from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// =====================================================
// OFFRES D'EMPLOI
// =====================================================

router.get('/offres', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
            search: req.query.search as string,
            statut: req.query.statut as any,
            typeContrat: req.query.typeContrat as string,
            sortBy: (req.query.sortBy as string) || 'createdAt',
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        };

        const result = await recrutementService.findOffres(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/offres/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const offre = await recrutementService.findOffreById(req.params.id, req.etablissementId!);
        res.json({ success: true, data: offre });
    } catch (error) { next(error); }
});

router.post('/offres', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createOffreEmploiSchema, req.body);
        const offre = await recrutementService.createOffre(dto, req.utilisateur!.id, req.etablissementId!, req);
        res.status(201).json({ success: true, data: offre });
    } catch (error) { next(error); }
});

router.patch('/offres/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateOffreEmploiSchema, req.body);
        const offre = await recrutementService.updateOffre(req.params.id, dto, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: offre });
    } catch (error) { next(error); }
});

router.post('/offres/:id/publier', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const offre = await recrutementService.publierOffre(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: offre, message: 'Offre publiée' });
    } catch (error) { next(error); }
});

router.post('/offres/:id/cloturer', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const offre = await recrutementService.clôturerOffre(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: offre, message: 'Offre clôturée' });
    } catch (error) { next(error); }
});

router.get('/offres/statistiques', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await recrutementService.getStatistiquesOffres(req.etablissementId!);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

// =====================================================
// CANDIDATURES
// =====================================================

router.get('/candidatures', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
            search: req.query.search as string,
            offreEmploiId: req.query.offreEmploiId as string,
            statut: req.query.statut as any,
            sortBy: (req.query.sortBy as string) || 'createdAt',
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        };

        const result = await recrutementService.findCandidatures(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/candidatures/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidature = await recrutementService.findCandidatureById(req.params.id, req.etablissementId!);
        res.json({ success: true, data: candidature });
    } catch (error) { next(error); }
});

router.post('/candidatures', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createCandidatureSchema, req.body);
        const candidature = await recrutementService.createCandidature(dto, req.etablissementId!, req);
        res.status(201).json({ success: true, data: candidature });
    } catch (error) { next(error); }
});

router.post('/candidatures/:id/evaluer', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(evaluerCandidatureSchema, req.body);
        const candidature = await recrutementService.evaluerCandidature(req.params.id, dto, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: candidature });
    } catch (error) { next(error); }
});

router.post('/candidatures/:id/shortlist', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidature = await recrutementService.shortlistCandidature(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: candidature, message: 'Candidat présélectionné' });
    } catch (error) { next(error); }
});

router.post('/candidatures/:id/convoquer', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidature = await recrutementService.convoquerCandidature(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: candidature, message: 'Candidat convoqué pour entretien' });
    } catch (error) { next(error); }
});

router.post('/candidatures/:id/retenir', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidature = await recrutementService.retenirCandidature(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: candidature, message: 'Candidat retenu - Prêt pour onboarding' });
    } catch (error) { next(error); }
});

router.post('/candidatures/:id/refuser', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const candidature = await recrutementService.refuserCandidature(req.params.id, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: candidature, message: 'Candidature refusée' });
    } catch (error) { next(error); }
});

router.get('/candidatures/offres/:offreId/pipeline', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const pipeline = await recrutementService.getPipelineStats(req.params.offreId, req.etablissementId!);
        res.json({ success: true, data: pipeline });
    } catch (error) { next(error); }
});

// =====================================================
// ENTRETIENS
// =====================================================

router.get('/entretiens', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
            search: req.query.search as string,
            candidatureId: req.query.candidatureId as string,
            offreEmploiId: req.query.offreEmploiId as string,
            type: req.query.type as any,
            statut: req.query.statut as any,
            sortBy: (req.query.sortBy as string) || 'dateEntretien',
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC',
        };

        const result = await recrutementService.findEntretiens(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/entretiens/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entretien = await recrutementService.findEntretienById(req.params.id, req.etablissementId!);
        res.json({ success: true, data: entretien });
    } catch (error) { next(error); }
});

router.post('/entretiens', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createEntretienSchema, req.body);
        const entretien = await recrutementService.createEntretien(dto, req.utilisateur!.id, req.etablissementId!, req);
        res.status(201).json({ success: true, data: entretien });
    } catch (error) { next(error); }
});

router.post('/entretiens/:id/evaluer', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(evaluerEntretienSchema, req.body);
        const entretien = await recrutementService.evaluerEntretien(req.params.id, dto, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: entretien });
    } catch (error) { next(error); }
});

// =====================================================
// ONBOARDING
// =====================================================

router.get('/onboarding', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = {
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
            search: req.query.search as string,
            membrePersonnelId: req.query.membrePersonnelId as string,
            statut: req.query.statut as any,
            sortBy: (req.query.sortBy as string) || 'createdAt',
            sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
        };

        const result = await recrutementService.findOnboardings(query, req.etablissementId!);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/onboarding/:id', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const onboarding = await recrutementService.findOnboardingById(req.params.id, req.etablissementId!);
        res.json({ success: true, data: onboarding });
    } catch (error) { next(error); }
});

router.post('/onboarding', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createOnboardingSchema, req.body);
        const onboarding = await recrutementService.createOnboarding(dto, req.utilisateur!.id, req.etablissementId!, req);
        res.status(201).json({ success: true, data: onboarding });
    } catch (error) { next(error); }
});

router.patch('/onboarding/:id/checklist', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateChecklistSchema, req.body);
        const onboarding = await recrutementService.updateChecklist(req.params.id, dto, req.utilisateur!.id, req.etablissementId!, req);
        res.json({ success: true, data: onboarding });
    } catch (error) { next(error); }
});

router.get('/onboarding/statistiques', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN, Role.CHEF_ETABLISSEMENT), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await recrutementService.getOnboardingStats(req.etablissementId!);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

export const recrutementController = router;
export default router;
