import { Router, Request, Response, NextFunction } from 'express';
import { configurationOrganisationService } from '../services/configuration.service';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { AppError } from '@common/filters/error.filter';

const router = Router();

router.get('/configuration', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.query.categorie as string;
        const params = categorie
            ? await configurationOrganisationService.getParametresParCategorie(categorie)
            : await configurationOrganisationService.getAllParametres();
        res.json({ success: true, data: params });
    } catch (error) { next(error); }
});

router.get('/configuration/:cle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = await configurationOrganisationService.getParametre(req.params.cle);
        if (!param) throw new AppError(`Paramètre non trouvé: ${req.params.cle}`, 404, 'PARAM_NOT_FOUND');
        res.json({ success: true, data: param });
    } catch (error) { next(error); }
});

router.put('/configuration/:cle', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { valeur } = req.body;
        if (valeur === undefined || valeur === null) throw new AppError('La valeur est requise', 400, 'MISSING_VALUE');
        const param = await configurationOrganisationService.setParametre(req.params.cle, valeur);
        res.json({ success: true, data: param });
    } catch (error) { next(error); }
});

router.post('/configuration/reset/:cle', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = await configurationOrganisationService.resetParametre(req.params.cle);
        res.json({ success: true, data: param, message: 'Paramètre réinitialisé' });
    } catch (error) { next(error); }
});

router.post('/configuration/reset-categorie/:categorie', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await configurationOrganisationService.resetCategorie(req.params.categorie);
        res.json({ success: true, data: { count, categorie: req.params.categorie }, message: `${count} paramètres réinitialisés` });
    } catch (error) { next(error); }
});

router.post('/configuration/reset-all', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await configurationOrganisationService.resetAll();
        res.json({ success: true, data: { count }, message: `${count} paramètres réinitialisés` });
    } catch (error) { next(error); }
});

router.get('/configuration/export', authMiddleware, requirePermission('organisation:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationOrganisationService.exporterConfiguration();
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

router.post('/configuration/import', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { configuration } = req.body;
        if (!configuration || typeof configuration !== 'object') throw new AppError('La configuration est requise et doit être un objet', 400, 'INVALID_CONFIG');
        const count = await configurationOrganisationService.importerConfiguration(configuration);
        res.json({ success: true, data: { count }, message: `${count} paramètres importés` });
    } catch (error) { next(error); }
});

router.get('/configuration/statistiques', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await configurationOrganisationService.getStatistiques();
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

export const configController = router;
export default router;
