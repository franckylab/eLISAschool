/**
 * ==================================
 * eLISAschool - Controller Finances
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes API pour la gestion financière (scolarité + dépenses)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { scolariteService } from '../services/scolarite.service';
import { depensesService } from '../services/depenses.service';
import { financeDashboardService } from '../services/dashboard.service';
import { financeWorkflowService } from '../services/finance-workflow.service';
import { createFraisScolariteSchema, createPaiementSchema, createRemiseSchema, generateEcheancierSchema, createCategorieDepenseSchema, createDepenseSchema, payerDepenseSchema, createDemandeDepenseSchema, validerDemandeSchema, createBonCommandeSchema } from '../dto';
import { authMiddleware } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';
import { FINANCES_DEFAULT_CONFIG } from '../config/finances.config';

const router = Router();

// Helper de validation
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// Helper pour extraire l'etablissementId du JWT
function getEtablissementId(req: Request): string | undefined {
    return (req as any).utilisateur?.etablissementId;
}

function getUserId(req: Request): string {
    return (req as any).utilisateur?.id;
}

// ==================================
// SCOLARITÉ - Configuration
// ==================================

router.post('/scolarite/config', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createFraisScolariteSchema, req.body);
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.configurerFraisScolarite(dto, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/scolarite/config', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const anneeScolaireId = req.query.anneeScolaireId as string;
        const result = await scolariteService.getFraisScolarite(etablissementId, anneeScolaireId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// SCOLARITÉ - Échéanciers
// ==================================

router.post('/echeanciers/generer/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(generateEcheancierSchema, { eleveId: req.params.eleveId });
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.genererEcheancier(dto, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/echeanciers/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.getEcheancierEleve(req.params.eleveId, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// SCOLARITÉ - Paiements
// ==================================

router.post('/paiements', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPaiementSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.enregistrerPaiement(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/paiements/eleve/:eleveId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.getHistoriquePaiements(req.params.eleveId, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/recus/:numeroRecu', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await scolariteService.getRecu(req.params.numeroRecu);
        if (!result) {
            throw new AppError('Reçu non trouvé', 404, 'NOT_FOUND');
        }
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// SCOLARITÉ - Remises
// ==================================

router.post('/remises', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createRemiseSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.appliquerRemise(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// SCOLARITÉ - Relances
// ==================================

router.get('/impayes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const result = await scolariteService.detecterImpayes(etablissementId);
        res.json({ success: true, data: result, total: result.length });
    } catch (error) { next(error); }
});

router.post('/relances/envoyer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const count = await scolariteService.envoyerRelances(etablissementId);
        res.json({ success: true, message: `${count} relances envoyées`, data: { count } });
    } catch (error) { next(error); }
});

// ==================================
// DÉPENSES - Catégories
// ==================================

router.post('/depenses/categories', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createCategorieDepenseSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.creerCategorie(dto, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/depenses/categories', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const type = req.query.type as string;
        const result = await depensesService.listCategories(etablissementId, type);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// DÉPENSES - CRUD
// ==================================

router.post('/depenses', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createDepenseSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.creerDepense(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/depenses', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const filters = {
            categorieDepenseId: req.query.categorieDepenseId,
            dateDebut: req.query.dateDebut,
            dateFin: req.query.dateFin,
            statut: req.query.statut,
            fournisseur: req.query.fournisseur,
            page: parseInt(req.query.page as string) || 1,
            limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
        };
        const result = await depensesService.getDepenses(filters, etablissementId);
        res.json({ success: true, ...result });
    } catch (error) { next(error); }
});

router.patch('/depenses/:id/valider', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const utilisateurRole = (req as any).utilisateur?.role;
        const result = await depensesService.validerDepense(req.params.id, userId, utilisateurRole, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.post('/depenses/:id/payer', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(payerDepenseSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.payerDepense(req.params.id, dto, userId, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// DÉPENSES - Demandes
// ==================================

router.post('/depenses/demandes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createDemandeDepenseSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.creerDemandeDepense(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.get('/depenses/demandes/a-valider', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.getDemandesAValider(etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

router.patch('/depenses/demandes/:id/valider', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(validerDemandeSchema, req.body);
        const validateurId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.validerDemande(req.params.id, dto, validateurId, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// DÉPENSES - Bons de commande
// ==================================

router.post('/depenses/bons-commande', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createBonCommandeSchema, req.body);
        const userId = getUserId(req);
        const etablissementId = getEtablissementId(req);
        const result = await depensesService.creerBonCommande(dto, userId, etablissementId);
        res.status(201).json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// DÉPENSES - Rapports
// ==================================

router.get('/depenses/rapports/synthese', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        const dateDebut = req.query.dateDebut as string;
        const dateFin = req.query.dateFin as string;
        
        if (!dateDebut || !dateFin) {
            throw new AppError('Paramètres dateDebut et dateFin requis', 400, 'MISSING_PARAMS');
        }
        
        const result = await depensesService.getRapportDepenses(dateDebut, dateFin, etablissementId);
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// ==================================
// DASHBOARD FINANCIER
// ==================================

router.get('/dashboard/stats', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non trouvé', 400, 'MISSING_ETABLISSEMENT');
        
        const periode = (req.query.periode as 'mois' | 'trimestre' | 'annee') || 'mois';
        const stats = await financeDashboardService.getDashboardStats(etablissementId, periode);
        res.json({ success: true, data: stats });
    } catch (error) { next(error); }
});

router.get('/dashboard/evolution-paiements', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non trouvé', 400, 'MISSING_ETABLISSEMENT');
        
        const jours = parseInt(req.query.jours as string) || 30;
        const evolution = await financeDashboardService.getEvolutionPaiements(etablissementId, jours);
        res.json({ success: true, data: evolution });
    } catch (error) { next(error); }
});

router.get('/dashboard/top-impayes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non trouvé', 400, 'MISSING_ETABLISSEMENT');
        
        const limit = parseInt(req.query.limit as string) || 10;
        const topImpayes = await financeDashboardService.getTopImpayes(etablissementId, limit);
        res.json({ success: true, data: topImpayes });
    } catch (error) { next(error); }
});

router.get('/dashboard/ratio-revenus-depenses', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const etablissementId = getEtablissementId(req);
        if (!etablissementId) throw new AppError('Établissement non trouvé', 400, 'MISSING_ETABLISSEMENT');
        
        const annee = parseInt(req.query.annee as string) || new Date().getFullYear();
        const ratio = await financeDashboardService.getRatioRevenusDepenses(etablissementId, annee);
        res.json({ success: true, data: ratio });
    } catch (error) { next(error); }
});

// ==================================
// CONFIGURATION & WORKFLOWS
// ==================================

// Obtenir configuration complète
router.get('/config', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ 
            success: true, 
            data: FINANCES_DEFAULT_CONFIG,
            message: 'Configuration par défaut (à personnaliser via parametres)'
        });
    } catch (error) { next(error); }
});

// Obtenir configuration par catégorie
router.get('/config/:categorie', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.params.categorie.toUpperCase();
        const configKey = categorie.toLowerCase() as keyof typeof FINANCES_DEFAULT_CONFIG;
        const config = FINANCES_DEFAULT_CONFIG[configKey];
        
        if (!config) {
            throw new AppError(`Catégorie '${categorie}' non trouvée`, 404, 'CONFIG_CATEGORY_NOT_FOUND');
        }
        
        res.json({ success: true, data: config });
    } catch (error) { next(error); }
});

// Workflow: Valider entité
router.post('/workflow/validate', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityId, entityType, montant } = req.body;
        const etablissementId = getEtablissementId(req);
        const utilisateurId = getUserId(req);
        const utilisateurRole = (req as any).utilisateur?.role;
        
        if (!entityId || !entityType || !montant) {
            throw new AppError('Paramètres requis: entityId, entityType, montant', 400, 'MISSING_PARAMS');
        }
        
        const result = await financeWorkflowService.valider({
            entityId,
            entityType,
            montant: parseFloat(montant),
            etablissementId: etablissementId || '',
            utilisateurId,
            utilisateurRole,
        });
        
        res.json({ success: true, data: result });
    } catch (error) { next(error); }
});

// Workflow: Rejeter entité
router.post('/workflow/reject', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityId, entityType, motif } = req.body;
        const utilisateurRole = (req as any).utilisateur?.role;
        
        if (!entityId || !entityType || !motif) {
            throw new AppError('Paramètres requis: entityId, entityType, motif', 400, 'MISSING_PARAMS');
        }
        
        await financeWorkflowService.rejeter(entityId, entityType, motif, utilisateurRole);
        res.json({ success: true, message: 'Entité rejetée avec succès' });
    } catch (error) { next(error); }
});

// Workflow: Obtenir statut validation
router.get('/workflow/status/:entityType/:entityId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { entityType, entityId } = req.params;
        const montant = parseFloat(req.query.montant as string);
        
        if (!entityType || !entityId || isNaN(montant)) {
            throw new AppError('Paramètres requis: entityType, entityId, montant', 400, 'MISSING_PARAMS');
        }
        
        const status = await financeWorkflowService.getValidationStatus(
            entityId,
            entityType as 'PAIEMENT' | 'DEPENSE' | 'BUDGET',
            montant
        );
        
        res.json({ success: true, data: status });
    } catch (error) { next(error); }
});

// Workflow: Obtenir rôles requis pour montant
router.get('/workflow/roles-required', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const entityType = req.query.entityType as 'PAIEMENT' | 'DEPENSE' | 'BUDGET';
        const montant = parseFloat(req.query.montant as string);
        
        if (!entityType || isNaN(montant)) {
            throw new AppError('Paramètres requis: entityType, montant', 400, 'MISSING_PARAMS');
        }
        
        const roles = financeWorkflowService.getRolesRequisPourMontant(montant, entityType);
        res.json({ success: true, data: { entityType, montant, rolesRequis: roles } });
    } catch (error) { next(error); }
});

export const financesController = router;
