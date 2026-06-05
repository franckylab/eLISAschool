/**
 * ==================================
 * eLISAschool - Exemple d'Implémentation des Guards de Permissions
 * ==================================
 * Version: 2.0.0
 * 
 * Ce fichier montre COMMENT implémenter les guards de permissions sur les endpoints
 * CRITIQUES et HAUTE PRIORITÉ.
 * 
 * À utiliser comme référence pour implémenter sur les autres modules.
 */

// ==================================
// EXEMPLE 1 : Module Cantine (Haute Priorité)
// ==================================

/*
// Fichier: backend/src/modules/cantine/controllers/cantine.controller.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cantineService } from '../services/cantine.service';
import { requirePermission, requireAnyPermission } from '@modules/auth/middlewares';
import { authMiddleware } from '@modules/auth/middlewares';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

// ==================================
// MENUS
// ==================================

/**
 * POST /api/cantine/menus
 * Créer un menu de cantine
 * Permission requise: cantine:menus:create
 */
router.post(
    '/menus',
    requirePermission('cantine:menus:create'),  // ✅ Guard de permission
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menu = await cantineService.createMenu(req.body);
            res.status(201).json({ success: true, data: menu });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /api/cantine/menus
 * Lister les menus
 * Permission: cantine:menus:view OU cantine:view (OR)
 */
router.get(
    '/menus',
    requireAnyPermission(['cantine:menus:view', 'cantine:view']),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menus = await cantineService.findAllMenus();
            res.json({ success: true, data: menus });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * PATCH /api/cantine/menus/:id
 * Modifier un menu
 * Permission: cantine:menus:edit
 */
router.patch(
    '/menus/:id',
    requirePermission('cantine:menus:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menu = await cantineService.updateMenu(req.params.id, req.body);
            res.json({ success: true, data: menu });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * DELETE /api/cantine/menus/:id
 * Supprimer un menu
 * Permission: cantine:menus:delete
 */
router.delete(
    '/menus/:id',
    requirePermission('cantine:menus:delete'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cantineService.deleteMenu(req.params.id);
            res.json({ success: true, message: 'Menu supprimé' });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// INSCRIPTIONS
// ==================================

/**
 * POST /api/cantine/inscriptions
 * Inscrire un élève à la cantine
 * Permission: cantine:inscriptions:create
 */
router.post(
    '/inscriptions',
    requirePermission('cantine:inscriptions:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const inscription = await cantineService.createInscription(req.body);
            res.status(201).json({ success: true, data: inscription });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /api/cantine/inscriptions/:id/recharger
 * Recharger le solde cantine
 * Permission: cantine:solde:recharger
 */
router.post(
    '/inscriptions/:id/recharger',
    requirePermission('cantine:solde:recharger'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const inscription = await cantineService.rechargerSolde(
                req.params.id,
                req.body.montant
            );
            res.json({ success: true, data: inscription });
        } catch (error) {
            next(error);
        }
    }
);

// ==================================
// CONSOMMATIONS
// ==================================

/**
 * POST /api/cantine/consommations
 * Enregistrer une consommation
 * Permission: cantine:consommations:enregistrer
 */
router.post(
    '/consommations',
    requirePermission('cantine:consommations:enregistrer'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const consommation = await cantineService.enregistrerConsommation(req.body);
            res.status(201).json({ success: true, data: consommation });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
*/

// ==================================
// EXEMPLE 2 : Module Transport (Haute Priorité)
// ==================================

/*
// Fichier: backend/src/modules/transport/controllers/transport.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Lignes de transport
router.post('/lignes', requirePermission('transport:lignes:create'), handler);
router.patch('/lignes/:id', requirePermission('transport:lignes:edit'), handler);
router.delete('/lignes/:id', requirePermission('transport:lignes:delete'), handler);

// Inscriptions
router.post('/inscriptions', requirePermission('transport:inscriptions:create'), handler);

// Présences
router.post('/presences', requirePermission('transport:presences:enregistrer'), handler);
*/

// ==================================
// EXEMPLE 3 : Module Orientation (Haute Priorité)
// ==================================

/*
// Fichier: backend/src/modules/orientation/controllers/orientation.controller.ts

import { requirePermission, requireAnyPermission } from '@modules/auth/middlewares';

// Profils d'orientation
router.post('/profils', requirePermission('orientation:profils:create'), handler);
router.patch('/profils/:eleveId', requirePermission('orientation:profils:edit'), handler);
router.get('/profils/:eleveId', requireAnyPermission(['orientation:profils:view', 'orientation:view']), handler);

// Rendez-vous
router.post('/rdv', requirePermission('orientation:rdv:create'), handler);
router.patch('/rdv/:id', requirePermission('orientation:rdv:edit'), handler);
router.post('/rdv/:id/annuler', requirePermission('orientation:rdv:annuler'), handler);
*/

// ==================================
// EXEMPLE 4 : Module Utilisateurs (Critique)
// ==================================

/*
// Fichier: backend/src/modules/utilisateurs/controllers/utilisateurs.controller.ts

import { requirePermission, requireAllPermissions } from '@modules/auth/middlewares';

// Import d'utilisateurs (nécessite 2 permissions)
router.post(
    '/import',
    requireAllPermissions(['utilisateurs:import', 'utilisateurs:manage']),
    handler
);

// Reset mot de passe
router.post(
    '/:id/reset-password',
    requirePermission('utilisateurs:reset-password'),
    handler
);

// Changement de statut
router.patch(
    '/:id/statut',
    requirePermission('utilisateurs:statut:change'),
    handler
);

// Gestion des établissements
router.post(
    '/:id/etablissements',
    requirePermission('utilisateurs:etablissements:manage'),
    handler
);
*/

// ==================================
// EXEMPLE 5 : Module Notes (Haute Priorité)
// ==================================

/*
// Fichier: backend/src/modules/notes/controllers/notes.controller.ts

import { requirePermission, requireAllPermissions } from '@modules/auth/middlewares';

// Création en masse (nécessite 2 permissions)
router.post(
    '/bulk',
    requireAllPermissions(['notes:create', 'notes:bulk:create']),
    handler
);

// Import de notes
router.post(
    '/import',
    requirePermission('notes:import'),
    handler
);

// Export de notes
router.get(
    '/export',
    requirePermission('notes:export'),
    handler
);

// Statistiques
router.get(
    '/statistiques',
    requirePermission('notes:statistiques:view'),
    handler
);
*/

// ==================================
// EXEMPLE 6 : Module Bulletins (Critique)
// ==================================

/*
// Fichier: backend/src/modules/bulletins/controllers/bulletins.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Publication de bulletin (CRITIQUE)
router.post(
    '/:id/publier',
    requirePermission('bulletins:publier'),
    handler
);

// Édition de bulletin
router.patch(
    '/:id',
    requirePermission('bulletins:edit'),
    handler
);

// Export de bulletins
router.get(
    '/export',
    requirePermission('bulletins:export'),
    handler
);
*/

// ==================================
// EXEMPLE 7 : Module Élèves (Critique)
// ==================================

/*
// Fichier: backend/src/modules/eleves/controllers/eleves.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Radiation d'élève (CRITIQUE)
router.post(
    '/:id/radiation',
    requirePermission('eleves:radiation'),
    handler
);

// Réinscription
router.post(
    '/:id/reinscription',
    requirePermission('eleves:reinscription'),
    handler
);

// Génération de documents
router.post(
    '/:id/documents/generate',
    requirePermission('eleves:documents:generate'),
    handler
);

// Historique
router.get(
    '/:id/historique',
    requirePermission('eleves:historique:view'),
    handler
);
*/

// ==================================
// EXEMPLE 8 : Module Années Scolaires (Critique)
// ==================================

/*
// Fichier: backend/src/modules/annees-scolaires/controllers/annees-scolaires.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Clôture d'année (CRITIQUE)
router.post(
    '/:id/cloturer',
    requirePermission('annees:cloturer'),
    handler
);

// Duplication d'année
router.post(
    '/:id/dupliquer',
    requirePermission('annees:dupliquer'),
    handler
);
*/

// ==================================
// EXEMPLE 9 : Module Monitoring (Critique)
// ==================================

/*
// Fichier: backend/src/modules/monitoring/controllers/monitoring.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Activer/désactiver mode maintenance
router.post(
    '/maintenance',
    requirePermission('monitoring:maintenance:toggle'),
    handler
);

// Voir les métriques
router.get(
    '/metrics',
    requirePermission('monitoring:metrics:view'),
    handler
);

// Voir les statistiques
router.get(
    '/stats',
    requirePermission('monitoring:stats:view'),
    handler
);
*/

// ==================================
// EXEMPLE 10 : Module Auth (Critique)
// ==================================

/*
// Fichier: backend/src/modules/auth/controllers/auth.controller.ts

import { requirePermission } from '@modules/auth/middlewares';

// Déconnexion de toutes les sessions
router.post(
    '/logout-all',
    requirePermission('auth:sessions:manage'),
    handler
);
*/

// ==================================
// CHECKLIST D'IMPLÉMENTATION
// ==================================

/**
 * ENDPOINTS CRITIQUES (15) - À implémenter EN PRIORITÉ
 * 
 * [ ] POST   /api/etablissements                    -> etablissements:create
 * [ ] PATCH  /api/etablissements/:id/activer        -> etablissements:activer
 * [ ] PATCH  /api/etablissements/:id/desactiver     -> etablissements:desactiver
 * [ ] POST   /api/configuration/seed                -> configuration:seed
 * [ ] POST   /api/monitoring/maintenance            -> monitoring:maintenance:toggle
 * [ ] POST   /api/utilisateurs/import               -> utilisateurs:import
 * [ ] POST   /api/utilisateurs/:id/reset-password   -> utilisateurs:reset-password
 * [ ] PATCH  /api/utilisateurs/:id/statut           -> utilisateurs:statut:change
 * [ ] POST   /api/rbac/permissions                  -> permissions:create
 * [ ] PATCH  /api/rbac/permissions/:id              -> permissions:edit
 * [ ] DELETE /api/rbac/permissions/:id              -> permissions:delete
 * [ ] POST   /api/auth/logout-all                   -> auth:sessions:manage
 * [ ] POST   /api/annees-scolaires/:id/cloturer     -> annees:cloturer
 * [ ] POST   /api/eleves/:id/radiation              -> eleves:radiation
 * [ ] POST   /api/bulletins/:id/publier             -> bulletins:publier
 */

/**
 * ENDPOINTS HAUTE PRIORITÉ (35) - À implémenter ENSUITE
 * 
 * Cantine (6):
 * [ ] POST   /api/cantine/menus                     -> cantine:menus:create
 * [ ] PATCH  /api/cantine/menus/:id                 -> cantine:menus:edit
 * [ ] DELETE /api/cantine/menus/:id                 -> cantine:menus:delete
 * [ ] POST   /api/cantine/inscriptions              -> cantine:inscriptions:create
 * [ ] POST   /api/cantine/inscriptions/:id/recharger -> cantine:solde:recharger
 * [ ] POST   /api/cantine/consommations             -> cantine:consommations:enregistrer
 * 
 * Transport (5):
 * [ ] POST   /api/transport/lignes                  -> transport:lignes:create
 * [ ] PATCH  /api/transport/lignes/:id              -> transport:lignes:edit
 * [ ] DELETE /api/transport/lignes/:id              -> transport:lignes:delete
 * [ ] POST   /api/transport/inscriptions            -> transport:inscriptions:create
 * [ ] POST   /api/transport/presences               -> transport:presences:enregistrer
 * 
 * Orientation (5):
 * [ ] POST   /api/orientation/profils               -> orientation:profils:create
 * [ ] PATCH  /api/orientation/profils/:eleveId      -> orientation:profils:edit
 * [ ] POST   /api/orientation/rdv                   -> orientation:rdv:create
 * [ ] PATCH  /api/orientation/rdv/:id               -> orientation:rdv:edit
 * [ ] POST   /api/orientation/rdv/:id/annuler       -> orientation:rdv:annuler
 * 
 * Impressions (5):
 * [ ] POST   /api/impressions/modeles               -> impressions:modeles:create
 * [ ] PATCH  /api/impressions/modeles/:id           -> impressions:modeles:edit
 * [ ] DELETE /api/impressions/modeles/:id           -> impressions:modeles:delete
 * [ ] POST   /api/impressions/file/:id/generer      -> impressions:file:generer
 * [ ] POST   /api/impressions/file/:id/annuler      -> impressions:file:annuler
 * 
 * Matériel (5):
 * [ ] POST   /api/materiel                          -> materiel:create
 * [ ] PATCH  /api/materiel/:id                      -> materiel:edit
 * [ ] DELETE /api/materiel/:id                      -> materiel:delete
 * [ ] POST   /api/materiel/prets                    -> materiel:prets:create
 * [ ] POST   /api/materiel/prets/:id/retour         -> materiel:prets:retour
 * 
 * Cartes (4):
 * [ ] POST   /api/cartes                            -> cartes:create
 * [ ] PATCH  /api/cartes/:id                        -> cartes:edit
 * [ ] POST   /api/cartes/:id/desactiver             -> cartes:desactiver
 * [ ] POST   /api/cartes/:id/perte                  -> cartes:perte:signaler
 * 
 * Classes (2):
 * [ ] POST   /api/classes/affectations              -> classes:affecter
 * [ ] DELETE /api/classes/affectations/:id          -> classes:desaffecter
 * 
 * Clubs (4):
 * [ ] POST   /api/clubs                             -> clubs:create
 * [ ] PATCH  /api/clubs/:id                         -> clubs:edit
 * [ ] DELETE /api/clubs/:id                         -> clubs:delete
 * [ ] POST   /api/clubs/:id/inscriptions            -> clubs:inscriptions:manage
 * 
 * Gamification (3):
 * [ ] POST   /api/gamification/badges               -> gamification:badges:create
 * [ ] POST   /api/gamification/points               -> gamification:points:attribuer
 * [ ] POST   /api/gamification/attribuer-badge      -> gamification:badges:attribuer
 * 
 * Notes (2):
 * [ ] POST   /api/notes/bulk                        -> notes:bulk:create
 * [ ] POST   /api/notes/import                      -> notes:import
 * 
 * Notifications (2):
 * [ ] POST   /api/notifications/bulk                -> notifications:bulk:create
 * [ ] PATCH  /api/notifications/read-all            -> notifications:read-all
 * 
 * Personnel (3):
 * [ ] POST   /api/personnel                         -> personnel:create
 * [ ] PATCH  /api/personnel/:id                     -> personnel:edit
 * [ ] DELETE /api/personnel/:id                     -> personnel:delete
 * 
 * Scoring (2):
 * [ ] POST   /api/scoring/recalculer                -> scoring:recalculer
 * [ ] POST   /api/scoring/regles                    -> scoring:regles:create
 */

// ==================================
// RÉSUMÉ
// ==================================

/**
 * TOTAL D'ENDPOINTS À PROTÉGER: 50
 * 
 * - Critiques: 15 (Semaine 1)
 * - Haute priorité: 35 (Semaine 2-3)
 * 
 * TEMPS ESTIMÉ: 2-3 jours de développement
 * 
 * Le middleware `requirePermission()` gère automatiquement:
 * - ✅ Vérification de l'authentification
 * - ✅ Résolution des permissions (avec cache)
 * - ✅ Fallback vers l'ancien système (enum Role)
 * - ✅ Gestion d'erreurs uniforme (403 INSUFFICIENT_PERMISSIONS)
 */

export default {};
