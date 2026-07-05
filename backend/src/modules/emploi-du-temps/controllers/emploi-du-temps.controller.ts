/**
 * ==================================
 * eLISAschool - Controller Emploi-du-Temps
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * Date: 2026-06-14
 */

import { Router, Request, Response, NextFunction } from 'express';
import { emploiDuTempsService, templateService } from '../services';
import { emploiDuTempsPdfService } from '../services/emploi-du-temps.pdf';
import {
    creerCreneauSchema,
    genererEmploiDuTempsSchema,
    preferenceEmploiDuTempsSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';
import { CreerTemplateDto } from '../services/template.service';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ==========================================
// CRUD - Créneaux
// ==========================================

// Créer un créneau manuel
router.post('/', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(creerCreneauSchema, req.body);
        const anneeScolaireId = req.body.anneeScolaireId;

        const creneau = await emploiDuTempsService.creerCreneau(dto, anneeScolaireId);
        res.status(201).json({ success: true, data: creneau });
    } catch (error) { next(error); }
});

// Lister les créneaux d'une classe/année
router.get('/classe-annee/:classeAnneeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classeAnneeId } = req.params;

        const creneaux = await emploiDuTempsService.findByClasseAnnee(classeAnneeId);
        res.json({ success: true, data: creneaux });
    } catch (error) { next(error); }
});

// Lister les créneaux d'un enseignant
router.get('/enseignant/:enseignantId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { enseignantId } = req.params;
        const anneeScolaireId = req.query.anneeScolaireId as string;

        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId requis', 400, 'MISSING_PARAM');
        }

        const creneaux = await emploiDuTempsService.findByEnseignant(enseignantId, anneeScolaireId);
        res.json({ success: true, data: creneaux });
    } catch (error) { next(error); }
});

// Lister les créneaux d'une salle
router.get('/salle/:salleId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { salleId } = req.params;
        const anneeScolaireId = req.query.anneeScolaireId as string;

        const creneaux = await emploiDuTempsService.findBySalle(salleId, anneeScolaireId);
        res.json({ success: true, data: creneaux });
    } catch (error) { next(error); }
});

// Supprimer un créneau
router.delete('/:id', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await emploiDuTempsService.supprimerCreneau(id);
        res.json({ success: true, message: 'Créneau supprimé' });
    } catch (error) { next(error); }
});

// ==========================================
// Génération automatique
// ==========================================

router.post('/generer', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(genererEmploiDuTempsSchema, req.body);
        const result = await emploiDuTempsService.genererEmploiDuTemps(dto);

        if (result.success) {
            res.status(201).json({
                success: true,
                message: result.message,
                data: { nombreCreneaux: result.nombreCreneaux }
            });
        } else {
            res.status(200).json({
                success: false,
                message: result.message,
                data: {
                    nombreCreneaux: result.nombreCreneaux,
                    conflits: result.conflits
                }
            });
        }
    } catch (error) { next(error); }
});

// ==========================================
// Préférences
// ==========================================

// Obtenir les préférences
router.get('/preferences', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const preferences = await emploiDuTempsService.getPreferences(etablissementId);
        res.json({ success: true, data: preferences });
    } catch (error) { next(error); }
});

// Mettre à jour les préférences
router.put('/preferences', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(preferenceEmploiDuTempsSchema, req.body);
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const preferences = await emploiDuTempsService.updatePreferences(etablissementId, dto);
        res.json({ success: true, data: preferences });
    } catch (error) { next(error); }
});

// ==========================================
// Export PDF/HTML
// ==========================================

// Export HTML
router.get('/export/html/:classeAnneeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classeAnneeId } = req.params;
        const colorBy = (req.query.colorBy as any) || 'matiere';

        const html = await emploiDuTempsPdfService.generateHTML(classeAnneeId, {
            format: 'html',
            colorBy,
        });

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) { next(error); }
});

// Export PDF (HTML prêt pour impression)
router.get('/export/pdf/:classeAnneeId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { classeAnneeId } = req.params;
        const colorBy = (req.query.colorBy as any) || 'matiere';

        const pdfBuffer = await emploiDuTempsPdfService.generatePDF(classeAnneeId, {
            format: 'pdf',
            colorBy,
        });

        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'inline');
        res.send(pdfBuffer);
    } catch (error) { next(error); }
});

// ==========================================
// Templates
// ==========================================

// Lister les templates
router.get('/templates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const templates = await templateService.findAll(etablissementId);
        res.json({ success: true, data: templates });
    } catch (error) { next(error); }
});

// Créer un template
router.post('/templates', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto: CreerTemplateDto = req.body;
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const creePar = req.utilisateur?.id;

        const template = await templateService.create(dto, etablissementId, creePar);
        res.status(201).json({ success: true, data: template });
    } catch (error) { next(error); }
});

// Obtenir un template
router.get('/templates/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const template = await templateService.findOne(id, etablissementId);
        res.json({ success: true, data: template });
    } catch (error) { next(error); }
});

// Modifier un template
router.patch('/templates/:id', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const template = await templateService.update(id, req.body, etablissementId);
        res.json({ success: true, data: template });
    } catch (error) { next(error); }
});

// Supprimer un template
router.delete('/templates/:id', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        await templateService.delete(id, etablissementId);
        res.json({ success: true, message: 'Template supprimé' });
    } catch (error) { next(error); }
});

// Dupliquer un template
router.post('/templates/:id/dupliquer', authMiddleware, requirePermission('emploi-du-temps:generer'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const etablissementId = req.utilisateur?.etablissementId;
        if (!etablissementId) {
            throw new AppError('Établissement non identifié', 400, 'MISSING_ETABLISSEMENT');
        }
        const nouveauNom = req.body.nom;
        const template = await templateService.dupliquer(id, etablissementId, nouveauNom);
        res.status(201).json({ success: true, data: template });
    } catch (error) { next(error); }
});

export const emploiDuTempsController = router;
export default router;
