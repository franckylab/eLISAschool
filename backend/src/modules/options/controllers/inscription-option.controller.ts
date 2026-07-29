/**
 * ==================================
 * eLISAschool - Controller Options Élèves
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Endpoints REST pour la gestion des inscriptions aux options
 */

import { Router, Request, Response, NextFunction } from 'express';
import { inscriptionOptionService } from '../services';
import { createInscriptionOptionSchema, updateInscriptionOptionSchema, queryInscriptionOptionsSchema, validerInscriptionOptionSchema } from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ==================================
// Routes CRUD
// ==================================

// GET /api/options/inscriptions - Lister les inscriptions
router.get('/inscriptions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(queryInscriptionOptionsSchema, req.query);
        const result = await inscriptionOptionService.findAll(dto, req.utilisateur?.etablissementId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
});

// GET /api/options/inscriptions/:id - Détail
router.get('/inscriptions/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inscription = await inscriptionOptionService.findOne(req.params.id, req.utilisateur?.etablissementId);
        res.json({ success: true, data: inscription });
    } catch (error) {
        next(error);
    }
});

// POST /api/options/inscriptions - Créer une inscription
router.post('/inscriptions', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createInscriptionOptionSchema, req.body);
        const created = await inscriptionOptionService.create(dto, req.utilisateur?.etablissementId!, req.utilisateur?.id);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/options/inscriptions/:id - Mettre à jour
router.patch('/inscriptions/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateInscriptionOptionSchema, req.body);
        const updated = await inscriptionOptionService.update(req.params.id, dto, req.utilisateur?.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/options/inscriptions/:id - Supprimer (abandonner)
router.delete('/inscriptions/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await inscriptionOptionService.delete(req.params.id, req.utilisateur?.etablissementId!, req.utilisateur?.id);
        res.json({ success: true, message: 'Option abandonnée' });
    } catch (error) {
        next(error);
    }
});

// ==================================
// Routes Spécifiques
// ==================================

// GET /api/options/inscriptions/eleve/:eleveId - Options d'un élève
router.get('/inscriptions/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        const etablissementId = req.utilisateur?.etablissementId;
        
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        
        const options = await inscriptionOptionService.findByEleve(
            req.params.eleveId,
            anneeScolaireId,
            etablissementId
        );
        res.json({ success: true, data: options });
    } catch (error) {
        next(error);
    }
});

// POST /api/options/inscriptions/:id/valider - Valider une inscription
router.post('/inscriptions/:id/valider', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(validerInscriptionOptionSchema, req.body);
        const updated = await inscriptionOptionService.valider(
            req.params.id,
            dto.estValidée,
            dto.commentaire,
            req.utilisateur?.etablissementId,
            req.utilisateur?.id
        );
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

// GET /api/options/inscriptions/statistiques - Statistiques
router.get('/inscriptions/statistiques', authMiddleware, requirePermission('config:view'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        const etablissementId = req.utilisateur?.etablissementId;
        
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId requis', 400, 'MISSING_PARAMETER');
        }
        
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        
        const stats = await inscriptionOptionService.getStatistiques(anneeScolaireId, etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

export const inscriptionOptionController = router;
