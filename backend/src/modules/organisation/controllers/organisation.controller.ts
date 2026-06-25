/**
 * ==================================
 * eLISAschool - Controller Organisation
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Routes REST complètes pour la gestion de l'organisation
 * - Organisations (CRUD)
 * - Unités organisationnelles (CRUD + arborescence)
 * - Postes (CRUD + assignation)
 * - Hiérarchie personnel (CRUD + organigramme)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { organisationService } from '../services';
import { organigrammePdfService } from '../services/organigramme.pdf.service';
import { postesVacantsService } from '../services/postes-vacants.service';
import { historiqueService, clonageService } from '../services/historique-clonage.service';
import { configurationOrganisationService } from '../services/configuration.service';
import {
    createOrganisationSchema,
    updateOrganisationSchema,
    createUniteOrganisationnelleSchema,
    updateUniteOrganisationnelleSchema,
    createPosteSchema,
    updatePosteSchema,
    createHierarchiePersonnelSchema,
    updateHierarchiePersonnelSchema,
    filtreUnitesSchema,
    filtrePostesSchema,
} from '../dto';
import { authMiddleware, requirePermission } from '@modules/auth/middlewares';
import { Role } from '@modules/auth/entities';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// Helper de validation Zod
function validate(schema: any, data: unknown): any {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Erreur de validation', 400, 'VALIDATION_ERROR', false, result.error.errors);
    }
    return result.data;
}

// ==================================
// ORGANISATIONS
// ==================================

/**
 * GET /api/organisation/organisations
 * Lister toutes les organisations (avec pagination optionnelle)
 */
router.get('/organisations', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        
        // Si pagination demandée
        if (req.query.page || req.query.limit) {
            const { data, total } = await organisationService.findAllOrganisationsPaginated(
                page,
                limit,
                req.utilisateur?.etablissementId
            );
            res.json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            });
        } else {
            // Sans pagination (compatibilité)
            const organisations = await organisationService.findAllOrganisations(req.utilisateur?.etablissementId);
            res.json({ success: true, data: organisations });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/organisations
 * Créer une nouvelle organisation
 */
router.post('/organisations', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createOrganisationSchema, req.body);
        const created = await organisationService.createOrganisation(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/organisations/:id
 * Obtenir une organisation par ID
 */
router.get('/organisations/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organisation = await organisationService.findOrganisationById(
            req.params.id,
            req.utilisateur?.etablissementId
        );
        res.json({ success: true, data: organisation });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/organisation/organisations/:id
 * Modifier une organisation
 */
router.patch('/organisations/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateOrganisationSchema, req.body);
        const updated = await organisationService.updateOrganisation(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/organisation/organisations/:id
 * Supprimer une organisation (avec vérification)
 */
router.delete('/organisations/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier qu'il n'y a pas d'unités actives
        const organisation = await organisationService.findOrganisationById(
            req.params.id,
            req.utilisateur?.etablissementId
        );

        const unitesActives = await organisationService.countUnitesActives(req.params.id);
        if (unitesActives > 0) {
            throw new AppError(
                `Impossible de supprimer : ${unitesActives} unité(s) active(s). Archivez d'abord les unités.`,
                400,
                'ORGANISATION_HAS_ACTIVE_UNITES'
            );
        }

        await organisationService.deleteOrganisation(req.params.id);
        res.json({ success: true, message: 'Organisation supprimée' });
    } catch (error) {
        next(error);
    }
});

// ==================================
// UNITÉS ORGANISATIONNELLES
// ==================================

/**
 * GET /api/organisation/unites
 * Lister les unités avec filtres (avec pagination optionnelle)
 */
router.get('/unites', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validate(filtreUnitesSchema, req.query);
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        // Si pagination demandée
        if (req.query.page || req.query.limit) {
            const { data, total } = await organisationService.findUnitesPaginated(
                filtres,
                page,
                limit,
                req.utilisateur?.etablissementId
            );
            res.json({
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            });
        } else {
            const unites = await organisationService.findUnites(filtres, req.utilisateur?.etablissementId);
            res.json({ success: true, data: unites });
        }
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/unites
 * Créer une nouvelle unité
 */
router.post('/unites', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createUniteOrganisationnelleSchema, req.body);
        const created = await organisationService.createUnite(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/unites/:id
 * Obtenir une unité par ID
 */
router.get('/unites/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const unite = await organisationService.findUniteById(
            req.params.id,
            req.utilisateur?.etablissementId
        );
        res.json({ success: true, data: unite });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/organisation/unites/:id
 * Modifier une unité
 */
router.patch('/unites/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateUniteOrganisationnelleSchema, req.body);
        const updated = await organisationService.updateUnite(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/organisation/unites/:id
 * Supprimer une unité
 */
router.delete('/unites/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteUnite(req.params.id);
        res.json({ success: true, message: 'Unité supprimée' });
    } catch (error) {
        next(error);
    }
});

// ==================================
// ARBORESCENCE ET CHEMIN HIÉRARCHIQUE
// ==================================

/**
 * GET /api/organisation/arborescence/:organisationId
 * Construire l'arborescence complète d'une organisation
 */
router.get('/arborescence/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier que l'organisation appartient à l'établissement
        await organisationService.findOrganisationById(
            req.params.organisationId,
            req.utilisateur?.etablissementId
        );
        
        const arborescence = await organisationService.buildArborescence(req.params.organisationId);
        res.json({ success: true, data: arborescence });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/chemin/:uniteId
 * Obtenir le chemin hiérarchique d'une unité (de la racine à l'unité)
 */
router.get('/chemin/:uniteId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const chemin = await organisationService.getCheminHierarchique(req.params.uniteId);
        res.json({ success: true, data: chemin });
    } catch (error) {
        next(error);
    }
});

// ==================================
// POSTES
// ==================================

/**
 * GET /api/organisation/postes
 * Lister les postes avec filtres
 */
router.get('/postes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filtres = validate(filtrePostesSchema, req.query);
        const postes = await organisationService.findPostes(filtres, req.utilisateur?.etablissementId);
        res.json({ success: true, data: postes });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/postes
 * Créer un nouveau poste
 */
router.post('/postes', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createPosteSchema, req.body);
        const created = await organisationService.createPoste(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/postes/:id
 * Obtenir un poste par ID
 */
router.get('/postes/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poste = await organisationService.findPosteById(
            req.params.id,
            req.utilisateur?.etablissementId
        );
        res.json({ success: true, data: poste });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/organisation/postes/:id
 * Modifier un poste
 */
router.patch('/postes/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updatePosteSchema, req.body);
        const updated = await organisationService.updatePoste(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/organisation/postes/:id
 * Supprimer un poste
 */
router.delete('/postes/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deletePoste(req.params.id);
        res.json({ success: true, message: 'Poste supprimé' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/postes/:id/assigner
 * Assigner un occupant à un poste
 */
router.post('/postes/:id/assigner', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { occupantId, occupantNom } = req.body;
        if (!occupantId || !occupantNom) {
            throw new AppError('occupantId et occupantNom sont requis', 400, 'VALIDATION_ERROR');
        }
        const poste = await organisationService.assignerOccupant(req.params.id, occupantId, occupantNom);
        res.json({ success: true, data: poste });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/postes/:id/liberer
 * Libérer un poste (retirer l'occupant)
 */
router.post('/postes/:id/liberer', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const poste = await organisationService.libererPoste(req.params.id);
        res.json({ success: true, data: poste });
    } catch (error) {
        next(error);
    }
});

// ==================================
// HIÉRARCHIE PERSONNEL
// ==================================

/**
 * GET /api/organisation/hierarchie
 * Lister les relations hiérarchiques
 */
router.get('/hierarchie', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const personnelId = req.query.personnelId as string | undefined;
        const hierarchies = await organisationService.findHierarchies(
            req.utilisateur!.etablissementId!,
            personnelId
        );
        res.json({ success: true, data: hierarchies });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/hierarchie
 * Créer une relation hiérarchique
 */
router.post('/hierarchie', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(createHierarchiePersonnelSchema, req.body);
        const created = await organisationService.createHierarchie(dto);
        res.status(201).json({ success: true, data: created });
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/organisation/hierarchie/:id
 * Modifier une relation hiérarchique
 */
router.patch('/hierarchie/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const dto = validate(updateHierarchiePersonnelSchema, req.body);
        const updated = await organisationService.updateHierarchie(req.params.id, dto);
        res.json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/organisation/hierarchie/:id
 * Supprimer une relation hiérarchique (soft delete)
 */
router.delete('/hierarchie/:id', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        await organisationService.deleteHierarchie(req.params.id);
        res.json({ success: true, message: 'Relation hiérarchique supprimée' });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/hierarchie/superieurs/:personnelId
 * Obtenir les supérieurs d'une personne
 */
router.get('/hierarchie/superieurs/:personnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const superieurs = await organisationService.findSuperieurs(
            req.params.personnelId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: superieurs });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/hierarchie/subordonnes/:superieurId
 * Obtenir les subordonnés d'un supérieur
 */
router.get('/hierarchie/subordonnes/:superieurId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const subordonnes = await organisationService.findSubordonnes(
            req.params.superieurId,
            req.utilisateur!.etablissementId!
        );
        res.json({ success: true, data: subordonnes });
    } catch (error) {
        next(error);
    }
});

// ==================================
// STATISTIQUES ET ORGANIGRAMME
// ==================================

/**
 * GET /api/organisation/statistiques/:organisationId
 * Obtenir les statistiques d'une organisation
 */
router.get('/statistiques/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier que l'organisation appartient à l'établissement
        await organisationService.findOrganisationById(
            req.params.organisationId,
            req.utilisateur?.etablissementId
        );
        
        const stats = await organisationService.getStatistiquesOrganisation(req.params.organisationId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/organigramme/:organisationId
 * Obtenir l'organigramme complet (arborescence + postes)
 */
router.get('/organigramme/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier que l'organisation appartient à l'établissement
        await organisationService.findOrganisationById(
            req.params.organisationId,
            req.utilisateur?.etablissementId
        );
        
        const organigramme = await organisationService.getOrganigramme(req.params.organisationId);
        res.json({ success: true, data: organigramme });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/valider-arborescence/:organisationId
 * Valider la cohérence complète de l'arborescence
 */
router.get('/valider-arborescence/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier que l'organisation appartient à l'établissement
        await organisationService.findOrganisationById(
            req.params.organisationId,
            req.utilisateur?.etablissementId
        );
        
        const validation = await organisationService.validerArborescence(req.params.organisationId);
        res.json({ success: true, data: validation });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/export-pdf/:organisationId
 * Exporter l'organigramme en HTML (prêt pour PDF)
 */
router.get('/export-pdf/:organisationId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Vérifier que l'organisation appartient à l'établissement
        await organisationService.findOrganisationById(
            req.params.organisationId,
            req.utilisateur?.etablissementId
        );
        
        const html = await organigrammePdfService.genererOrganigrammeHTML(req.params.organisationId);
        
        // Retourner le HTML (l'utilisateur peut l'imprimer en PDF depuis le navigateur)
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/postes-vacants
 * Vérifier les postes vacants depuis longtemps
 */
router.get('/postes-vacants', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await postesVacantsService.verifierPostesVacants(req.utilisateur?.etablissementId);
        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/statistiques-vacance
 * Statistiques sur les postes vacants
 */
router.get('/statistiques-vacance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await postesVacantsService.getStatistiquesVacance(req.utilisateur?.etablissementId);
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/historique/:personnelId
 * Historique des mouvements d'un personnel
 */
router.get('/historique/:personnelId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const historique = historiqueService.getHistoriquePersonnel(req.params.personnelId, limit);
        res.json({ success: true, data: historique });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/mouvements-recents
 * Derniers mouvements dans l'établissement
 */
router.get('/mouvements-recents', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const limit = parseInt(req.query.limit as string) || 100;
        const mouvements = historiqueService.getMouvementsRecents(req.utilisateur?.etablissementId, limit);
        res.json({ success: true, data: mouvements });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/clone-unite/:uniteId
 * Cloner une unité avec ses postes
 */
router.post('/clone-unite/:uniteId', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { nouveauCode, nouveauNom } = req.body;
        
        if (!nouveauCode) {
            throw new AppError('Le paramètre nouveauCode est requis', 400, 'MISSING_CODE');
        }

        const result = await clonageService.clonerUnite(req.params.uniteId, nouveauCode, nouveauNom);
        res.status(201).json({
            success: true,
            data: {
                unite: result.unite,
                postesClones: result.postesClones.length,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/clone-structure/:uniteId
 * Cloner une structure complète (unité + enfants)
 */
router.post('/clone-structure/:uniteId', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { prefixeCode } = req.body;
        
        if (!prefixeCode) {
            throw new AppError('Le paramètre prefixeCode est requis', 400, 'MISSING_PREFIX');
        }

        const result = await clonageService.clonerStructureComplete(req.params.uniteId, prefixeCode);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// ==================== CONFIGURATION ====================

/**
 * GET /api/organisation/configuration
 * Obtenir tous les paramètres configurables
 */
router.get('/configuration', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const categorie = req.query.categorie as string;
        
        let params;
        if (categorie) {
            params = await configurationOrganisationService.getParametresParCategorie(categorie);
        } else {
            params = await configurationOrganisationService.getAllParametres();
        }
        
        res.json({ success: true, data: params });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/configuration/:cle
 * Obtenir un paramètre spécifique
 */
router.get('/configuration/:cle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = await configurationOrganisationService.getParametre(req.params.cle);
        if (!param) {
            throw new AppError(`Paramètre non trouvé: ${req.params.cle}`, 404, 'PARAM_NOT_FOUND');
        }
        res.json({ success: true, data: param });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/organisation/configuration/:cle
 * Modifier un paramètre
 */
router.put('/configuration/:cle', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { valeur } = req.body;
        
        if (valeur === undefined || valeur === null) {
            throw new AppError('La valeur est requise', 400, 'MISSING_VALUE');
        }

        const param = await configurationOrganisationService.setParametre(req.params.cle, valeur);
        res.json({ success: true, data: param });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/configuration/reset/:cle
 * Réinitialiser un paramètre à sa valeur par défaut
 */
router.post('/configuration/reset/:cle', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const param = await configurationOrganisationService.resetParametre(req.params.cle);
        res.json({ success: true, data: param, message: 'Paramètre réinitialisé' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/configuration/reset-categorie/:categorie
 * Réinitialiser tous les paramètres d'une catégorie
 */
router.post('/configuration/reset-categorie/:categorie', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await configurationOrganisationService.resetCategorie(req.params.categorie);
        res.json({ success: true, data: { count, categorie: req.params.categorie }, message: `${count} paramètres réinitialisés` });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/configuration/reset-all
 * Réinitialiser TOUS les paramètres
 */
router.post('/configuration/reset-all', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const count = await configurationOrganisationService.resetAll();
        res.json({ success: true, data: { count }, message: `${count} paramètres réinitialisés` });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/configuration/export
 * Exporter la configuration courante
 */
router.get('/configuration/export', authMiddleware, requirePermission('config:edit'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await configurationOrganisationService.exporterConfiguration();
        res.json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/organisation/configuration/import
 * Importer une configuration
 */
router.post('/configuration/import', authMiddleware, requirePermission('super_admin:all'), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { configuration } = req.body;
        
        if (!configuration || typeof configuration !== 'object') {
            throw new AppError('La configuration est requise et doit être un objet', 400, 'INVALID_CONFIG');
        }

        const count = await configurationOrganisationService.importerConfiguration(configuration);
        res.json({ success: true, data: { count }, message: `${count} paramètres importés` });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/organisation/configuration/statistiques
 * Statistiques de configuration
 */
router.get('/configuration/statistiques', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await configurationOrganisationService.getStatistiques();
        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
});

export const organisationController = router;
export default router;
