/**
 * ==================================
 * eLISAschool — Controller Paramètres Cascade
 * ==================================
 * Version: 1.0.0
 *
 * Endpoints pour la gestion cascade multi-niveaux :
 *   Système → Global → Groupe → Établissement
 *
 * Préfixe : /api/platform/parametres/cascade
 * Guard : SUPER_ADMIN (appliqué par platform.routes.ts)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { parametresCascadeService } from '../services/parametres-cascade.service';
import { validateDto } from '@common/utils/validate-dto.util';
import {
    updateCascadeGlobalSchema,
    updateCascadeEtablissementSchema,
    updateCascadeGroupeSchema,
    propagerCascadeSchema,
    queryCascadeSchema,
} from '../dto/parametres-cascade.dto';
import { logger } from '@common/utils/logger.util';

const router = Router();

// =============================================
// LISTE DES PARAMÈTRES CASCADABLES
// =============================================

/**
 * GET /api/platform/parametres/cascade
 * Liste tous les paramètres avec leur statut cascade (nombre d'overrides, etc.)
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = await validateDto(queryCascadeSchema, req.query);
        const parametres = await parametresCascadeService.getListeParametresCascade(query);
        res.json({ success: true, data: parametres });
    } catch (error) {
        next(error);
    }
});

// =============================================
// INCOHÉRENCES
// =============================================

/**
 * GET /api/platform/parametres/incoherences
 * Détection des overrides contradictoires ou redondants
 */
router.get('/incoherences', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const incoherences = await parametresCascadeService.getIncoherences();
        res.json({ success: true, data: incoherences });
    } catch (error) {
        next(error);
    }
});

// =============================================
// CASCADE COMPLÈTE POUR UNE CLÉ
// =============================================

/**
 * GET /api/platform/parametres/cascade/:cle
 * Cascade complète (4 niveaux) pour une clé donnée
 */
router.get('/:cle', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const cascade = await parametresCascadeService.getCascade(cle);
        res.json({ success: true, data: cascade });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/platform/parametres/cascade/:cle/etablissement/:etabId
 * Cascade résolue pour un établissement spécifique
 */
router.get('/:cle/etablissement/:etabId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, etabId } = req.params;
        const cascade = await parametresCascadeService.getCascadeForEtablissement(cle, etabId);
        res.json({ success: true, data: cascade });
    } catch (error) {
        next(error);
    }
});

// =============================================
// MODIFICATION DES VALEURS PAR NIVEAU
// =============================================

/**
 * PUT /api/platform/parametres/cascade/:cle/global
 * Modifier la valeur globale d'un paramètre
 */
router.put('/:cle/global', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const dto = await validateDto(updateCascadeGlobalSchema, req.body);
        const utilisateurId = (req as any).utilisateur?.id;
        const result = await parametresCascadeService.updateValeurGlobale(cle, dto.valeur, utilisateurId);
        res.json({ success: true, data: result, message: 'Valeur globale mise à jour' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/parametres/cascade/:cle/groupe/:groupeId
 * Override groupe
 */
router.put('/:cle/groupe/:groupeId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, groupeId } = req.params;
        const dto = await validateDto(updateCascadeGroupeSchema, req.body);
        const utilisateurId = (req as any).utilisateur?.id;
        const result = await parametresCascadeService.updateOverrideGroupe(cle, groupeId, dto.valeur, utilisateurId);
        res.json({ success: true, data: result, message: 'Override groupe mis à jour' });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/platform/parametres/cascade/:cle/etablissement/:etabId
 * Override établissement
 */
router.put('/:cle/etablissement/:etabId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, etabId } = req.params;
        const dto = await validateDto(updateCascadeEtablissementSchema, req.body);
        const utilisateurId = (req as any).utilisateur?.id;
        const result = await parametresCascadeService.updateOverrideEtablissement(cle, etabId, dto.valeur, utilisateurId);
        res.json({ success: true, data: result, message: 'Override établissement mis à jour' });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/platform/parametres/cascade/:cle/etablissement/:etabId
 * Reset override établissement (hérite du niveau supérieur)
 */
router.delete('/:cle/etablissement/:etabId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, etabId } = req.params;
        const utilisateurId = (req as any).utilisateur?.id;
        const result = await parametresCascadeService.resetOverrideEtablissement(cle, etabId, utilisateurId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// =============================================
// PROPAGATION
// =============================================

/**
 * POST /api/platform/parametres/cascade/:cle/propager
 * Appliquer la valeur globale à tous les établissements sans override
 */
router.post('/:cle/propager', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const dto = await validateDto(propagerCascadeSchema, req.body);
        const utilisateurId = (req as any).utilisateur?.id;
        const { etablissementIds } = req.body;

        if (!etablissementIds || !Array.isArray(etablissementIds) || etablissementIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: { message: 'etablissementIds requis (array)', code: 'MISSING_ETABLISSEMENT_IDS' },
            });
        }

        const result = await parametresCascadeService.propagerValeurGlobale(cle, etablissementIds, utilisateurId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

// =============================================
// HISTORIQUE & ROLLBACK
// =============================================

/**
 * GET /api/platform/parametres/cascade/:cle/historique
 * Timeline des modifications du paramètre
 */
router.get('/:cle/historique', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle } = req.params;
        const historique = await parametresCascadeService.getHistorique(cle);
        res.json({ success: true, data: historique });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/platform/parametres/cascade/:cle/rollback/:versionId
 * Restaurer une version antérieure
 */
router.post('/:cle/rollback/:versionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { cle, versionId } = req.params;
        const utilisateurId = (req as any).utilisateur?.id;
        const result = await parametresCascadeService.rollback(cle, versionId, utilisateurId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

export const parametresCascadeController = router;
export default router;
