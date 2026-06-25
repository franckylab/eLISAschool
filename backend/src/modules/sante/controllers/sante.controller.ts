/**
 * ==================================
 * eLISAschool - Contrôleur Module Santé
 * ==================================
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppError } from '@common/filters/error.filter';
import { santeService } from '../services';
import { createDossierMedicalSchema, createConsultationMedicaleSchema, createIncidentSanteSchema } from '../dto';
import { requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';

const router = Router();

function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR');
    }
    return result.data;
}

// ==================== DOSSIERS MÉDICAUX ====================
router.post('/dossiers', requirePermission('sante:dossier:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createDossierMedicalSchema, req.body);
        const dossier = await santeService.createOrUpdateDossier(
            dto,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: dossier });
    } catch (error) {
        next(error);
    }
});

router.get('/dossiers/:patientId', requirePermission('sante:dossier:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typePatient = req.query.typePatient as 'ELEVE' | 'PERSONNEL' | undefined;
        const dossier = await santeService.getDossierByPatient(
            req.params.patientId,
            req.utilisateur!.etablissementId!,
            typePatient
        );
        res.json({ success: true, data: dossier });
    } catch (error) {
        next(error);
    }
});

// ==================== CONSULTATIONS ====================
router.post('/consultations', requirePermission('sante:consultation:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createConsultationMedicaleSchema, req.body);
        const consultation = await santeService.createConsultation(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: consultation });
    } catch (error) {
        next(error);
    }
});

router.get('/patients/:patientId/consultations', requirePermission('sante:consultation:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const periodeId = req.query.periodeId as string; // ← NOUVEAU
        
        const consultations = await santeService.getConsultationsByPatient(
            req.params.patientId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId,
            { periodeId } // ← NOUVEAU
        );
        res.json({ 
            success: true, 
            data: consultations,
            metadata: {
                anneeScolaireId,
                periodeId: periodeId || null, // ← NOUVEAU
            }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== INCIDENTS SANTÉ ====================
router.post('/incidents', requirePermission('sante:incident:write'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createIncidentSanteSchema, req.body);
        const incident = await santeService.createIncidentSante(
            dto,
            req.utilisateur!.id,
            req.utilisateur!.etablissementId!,
            req
        );
        res.status(201).json({ success: true, data: incident });
    } catch (error) {
        next(error);
    }
});

router.get('/patients/:patientId/incidents', requirePermission('sante:incident:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anneeScolaireId = req.query.anneeScolaireId as string;
        if (!anneeScolaireId) {
            throw new AppError('Paramètre anneeScolaireId obligatoire', 400, 'MISSING_ANNEE_SCOLAIRE');
        }
        
        const incidents = await santeService.getIncidentsByPatient(
            req.params.patientId,
            req.utilisateur!.etablissementId!,
            anneeScolaireId // ← NOUVEAU
        );
        res.json({ 
            success: true, 
            data: incidents,
            metadata: {
                anneeScolaireId, // ← NOUVEAU
            }
        });
    } catch (error) {
        next(error);
    }
});

// ==================== DASHBOARD ====================
router.get('/patients/:patientId/dashboard', requirePermission('sante:dossier:read'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dashboard = await santeService.getDashboardSante(
            req.params.patientId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: dashboard });
    } catch (error) {
        next(error);
    }
});

// ==================== STATISTIQUES ====================
router.get('/statistiques', requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const annee = parseInt(req.query.annee as string) || new Date().getFullYear();
        const stats = await santeService.getStatistiquesEtablissement(
            req.utilisateur!.etablissementId!,
            annee
        );
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

export const santeController = router;
export default router;
