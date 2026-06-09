/**
 * ==================================
 * eLISAschool - Controller du module Sondage
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { Router, Request, Response, NextFunction } from 'express';
import { sondageService } from '../services';
import {
    createTemplateSondageSchema,
    updateTemplateSondageSchema,
    creerSondageSchema,
    voteSondageSchema,
    updateSondageSchema,
    updateAnalysesPermissionsSchema,
    filtreUtilisateursSchema,
    programmerSondageSchema,
} from '../dto';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { StatutSondage } from '../entities';

const router = Router();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ==================== Templates ====================

router.get('/templates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await sondageService.findTemplates(
            req.utilisateur!.etablissementId!,
            req.utilisateur!.id
        );
        res.json({ success: true, data: templates });
    } catch (error) {
        next(error);
    }
});

router.post('/templates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createTemplateSondageSchema, req.body);
        const template = await sondageService.createTemplate(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.status(201).json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
});

router.patch('/templates/:templateId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateTemplateSondageSchema, req.body);
        const template = await sondageService.updateTemplate(
            req.params.templateId,
            dto,
            req.utilisateur!.id
        );
        res.json({ success: true, data: template });
    } catch (error) {
        next(error);
    }
});

router.delete('/templates/:templateId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        await sondageService.deleteTemplate(req.params.templateId, req.utilisateur!.id);
        res.json({ success: true, message: 'Template supprimé' });
    } catch (error) {
        next(error);
    }
});

// ==================== Sondages ====================

router.post('/bulk', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(creerSondageSchema, req.body);
        const sondage = await sondageService.createSondage(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );

        if (dto.template_id) {
            try {
                await sondageService.incrementTemplateUsage(dto.template_id);
            } catch (error) {
                // Non bloquant
            }
        }

        res.status(201).json({
            success: true,
            data: {
                message_id: sondage.id,
                nombre_destinataires: sondage.nombreDestinataires,
                mode_envoi: sondage.modeDestinataires,
                conversation_creee: sondage.creerConversation,
                created_at: sondage.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/programmer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(programmerSondageSchema, req.body);

        // Vérifier que la date est dans le futur
        const dateEnvoi = new Date(dto.date_envoi);
        if (dateEnvoi <= new Date()) {
            throw new AppError('La date d\'envoi doit être dans le futur', 400, 'INVALID_DATE');
        }

        const sondage = await sondageService.createSondage(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );

        res.status(201).json({
            success: true,
            data: {
                id: sondage.id,
                statut: sondage.statut,
                date_envoi: sondage.dateProgrammation,
                nombre_destinataires: sondage.nombreDestinataires,
                created_at: sondage.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/programmes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sondages = await sondageService.getSondagesProgrammes(req.utilisateur!.etablissementId!);
        res.json({ success: true, data: sondages });
    } catch (error) {
        next(error);
    }
});

router.delete('/programmes/:programmeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sondage = await sondageService.findOne(req.params.programmeId, req.utilisateur!.etablissementId!);

        if (sondage.statut !== 'programme') {
            throw new AppError('Ce sondage a déjà été envoyé', 400, 'ALREADY_SENT');
        }

        if (sondage.auteurId !== req.utilisateur!.id) {
            throw new AppError('Vous n\'êtes pas autorisé à annuler ce sondage', 403, 'PERMISSION_DENIED');
        }

        await sondageService.updateSondage(
            req.params.programmeId,
            { niveauAccesAnalyses: sondage.niveauAccesAnalyses },
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );

        res.json({ success: true, message: 'Sondage programmé annulé' });
    } catch (error) {
        next(error);
    }
});

router.post('/:sondageId/vote', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(voteSondageSchema, req.body);
        const votes = await sondageService.vote(
            dto,
            req.params.sondageId,
            req.utilisateur!.id
        );
        res.json({ success: true, data: votes });
    } catch (error) {
        next(error);
    }
});

router.get('/:sondageId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sondage = await sondageService.findOne(
            req.params.sondageId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: sondage });
    } catch (error) {
        next(error);
    }
});

router.get('/', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const statut = req.query.statut as StatutSondage | undefined;

        const [sondages, total] = await sondageService.findAll(
            req.utilisateur!.etablissementId!,
            page,
            limit,
            statut
        );

        res.json({
            success: true,
            data: sondages,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:sondageId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateSondageSchema, req.body);
        const sondage = await sondageService.updateSondage(
            req.params.sondageId,
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: sondage });
    } catch (error) {
        next(error);
    }
});

router.post('/:sondageId/fermer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const sondage = await sondageService.fermerSondage(
            req.params.sondageId,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: sondage });
    } catch (error) {
        next(error);
    }
});

// ==================== Analyses ====================

router.get('/:sondageId/analyses', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const analyses = await sondageService.getAnalyses(
            req.params.sondageId,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: analyses });
    } catch (error) {
        next(error);
    }
});

router.patch('/:sondageId/analyses/permissions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateAnalysesPermissionsSchema, req.body);
        const sondage = await sondageService.updateAnalysesPermissions(
            req.params.sondageId,
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: sondage });
    } catch (error) {
        next(error);
    }
});

router.get('/:sondageId/analyses/export', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const analyses = await sondageService.getAnalyses(
            req.params.sondageId,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!
        );

        const format = req.query.format as string;
        const stats = analyses.statistiques;
        const repartition = stats.repartition_par_option;

        if (format === 'csv') {
            let csv = 'Option,Nombre de votes,Pourcentage\n';
            repartition.forEach((item: any) => {
                csv += `${item.option_texte},${item.nombre_votes},${item.pourcentage.toFixed(2)}%\n`;
            });
            csv += `\nTotal,${stats.total_votes},100%\n`;
            csv += `Taux de participation,${stats.taux_participation}% (${stats.total_votes}/${stats.total_destinataires})\n`;

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=sondage-${req.params.sondageId}.csv`);
            res.send(csv);
        } else {
            res.json({ success: true, data: analyses });
        }
    } catch (error) {
        next(error);
    }
});

// ==================== Utilisateurs (filtres) ====================

router.get('/utilisateurs/filtres', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(filtreUtilisateursSchema, req.query);
        const result = await sondageService.findUtilisateursFiltres(
            dto,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

export const sondagesController = router;
export default router;
