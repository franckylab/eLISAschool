/**
 * ==================================
 * eLISAschool - Controller Bulletins v2.1
 * ==================================
 * Permissions alignées sur l'enum Permission (shared/src/enums/roles.enum.ts) :
 * - GET  /                 → bulletins:view
 * - GET  /status           → bulletins:view
 * - POST /generate         → bulletins:generate
 * - GET  /eleve/:eleveId   → bulletins:view
 * - GET  /:id/export       → bulletins:export (HTML A4 imprimable)
 * - GET  /:id              → bulletins:view
 * - PATCH /:id             → bulletins:edit (+ bulletins:publier si publie: true)
 * - DELETE /:id            → bulletins:delete
 */

import { Router, Request, Response, NextFunction } from 'express';
import { BulletinsService, bulletinPdfService } from '../services';
import { generateBulletinSchema, updateBulletinSchema, queryBulletinsSchema } from '../dto';
import { authMiddleware, requirePermission, checkPermission } from '@modules/auth/middlewares';
import { auditService, AuditAction } from '@modules/auth';
import { validateDto } from '@common/utils';
import { AppError } from '@common/filters/error.filter';

const router = Router();
const service = new BulletinsService();

router.get('/', authMiddleware, requirePermission('bulletins:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = validateDto(queryBulletinsSchema, req.query);
        const result = await service.findAllPaginated(query, req.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/status', authMiddleware, requirePermission('bulletins:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const status = await service.getGenerationStatus({
            etablissementId: req.etablissementId,
            periodeId: req.query.periodeId as string | undefined,
        });
        res.json({ success: true, data: status });
    } catch (error) { next(error); }
});

router.post('/generate', authMiddleware, requirePermission('bulletins:generate'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(generateBulletinSchema, req.body);
        const bulletins = await service.generate(dto, req.etablissementId, req.utilisateur!.id);
        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.BULLETIN_GENERATE,
            cible: 'Bulletin',
            description: `${bulletins.length} bulletin(s) généré(s)`,
            module: 'bulletins',
        });
        res.json({ success: true, count: bulletins.length, data: bulletins });
    } catch (error) { next(error); }
});

router.get('/eleve/:eleveId', authMiddleware, requirePermission('bulletins:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletins = await service.findByEleve(req.params.eleveId, req.etablissementId);
        res.json({ success: true, data: bulletins });
    } catch (error) { next(error); }
});

/**
 * Export HTML A4 imprimable d'un bulletin
 * (pas de librairie PDF backend : le document HTML est imprimable tel quel)
 */
router.get('/:id/export', authMiddleware, requirePermission('bulletins:export'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletin = await service.findOne(req.params.id, req.etablissementId);
        const html = bulletinPdfService.genererHtml(bulletin);

        await auditService.log({
            utilisateurId: req.utilisateur!.id,
            action: AuditAction.BULLETIN_EXPORT,
            cible: 'Bulletin',
            cibleId: req.params.id,
            description: 'Export bulletin HTML',
            module: 'bulletins',
        });

        const nomEleve = bulletin.eleve
            ? `${bulletin.eleve.nom}-${bulletin.eleve.prenom}`.replace(/[^a-zA-Z0-9-]/g, '_')
            : bulletin.id;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `inline; filename="bulletin-${nomEleve}.html"`);
        res.send(html);
    } catch (error) { next(error); }
});

router.get('/:id', authMiddleware, requirePermission('bulletins:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const bulletin = await service.findOne(req.params.id, req.etablissementId);
        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

router.patch('/:id', authMiddleware, requirePermission('bulletins:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validateDto(updateBulletinSchema, req.body);

        // Garde supplémentaire : publier un bulletin exige bulletins:publier
        if (dto.publie === true) {
            const roles = (req.utilisateur!.roles?.length ? req.utilisateur!.roles : [req.utilisateur!.role]);
            const isSuperAdmin = roles.includes('SUPER_ADMIN');
            if (!isSuperAdmin) {
                const peutPublier = await checkPermission(
                    req.utilisateur!.id,
                    'bulletins:publier',
                    req.utilisateur!.etablissementId
                );
                if (!peutPublier) {
                    throw new AppError('Permission requise: bulletins:publier', 403, 'INSUFFICIENT_PERMISSIONS');
                }
            }
        }

        const bulletin = await service.update(req.params.id, dto, req.etablissementId);

        if (dto.publie !== undefined) {
            await auditService.log({
                utilisateurId: req.utilisateur!.id,
                action: AuditAction.BULLETIN_PUBLIER,
                cible: 'Bulletin',
                cibleId: req.params.id,
                description: dto.publie ? 'Bulletin publié' : 'Bulletin dépublié',
                module: 'bulletins',
            });
        }

        res.json({ success: true, data: bulletin });
    } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requirePermission('bulletins:delete'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await service.remove(req.params.id, req.utilisateur!.id, req.etablissementId);
        res.json({ success: true, message: 'Bulletin supprimé' });
    } catch (error) { next(error); }
});

export const bulletinsController = router;
export default router;
