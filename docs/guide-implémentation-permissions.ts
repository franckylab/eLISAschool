/**
 * ==================================
 * eLISAschool - Guide d'Implémentation des Permissions RBAC
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Document de référence pour implémenter les guards de permissions
 * sur les endpoints de l'API eLISAschool
 */

// ==================================
// EXEMPLES D'IMPLÉMENTATION
// ==================================

/**
 * MÉTHODE 1 : Guard sur un endpoint spécifique
 */
/*
import { checkPermission } from '@modules/auth/guards/permission.guard';

// Dans un contrôleur
router.post('/cantine/menus', checkPermission('cantine:menus:create'), async (req, res) => {
    // Seul un utilisateur avec la permission 'cantine:menus:create' peut accéder
    const menu = await cantineService.createMenu(req.body);
    res.json({ success: true, data: menu });
});
*/

/**
 * MÉTHODE 2 : Middleware pour plusieurs permissions (OR)
 */
/*
import { hasAnyPermission } from '@modules/auth/guards/permission.guard';

router.get('/bulletins/:id', hasAnyPermission(['bulletins:view', 'bulletins:edit']), async (req, res) => {
    // L'utilisateur doit avoir AU MOINS UNE des permissions
    const bulletin = await bulletinService.findById(req.params.id);
    res.json({ success: true, data: bulletin });
});
*/

/**
 * MÉTHODE 3 : Middleware pour plusieurs permissions (AND)
 */
/*
import { hasAllPermissions } from '@modules/auth/guards/permission.guard';

router.post('/notes/bulk', hasAllPermissions(['notes:create', 'notes:bulk:create']), async (req, res) => {
    // L'utilisateur doit avoir TOUTES les permissions
    const notes = await notesService.createBulk(req.body);
    res.json({ success: true, data: notes });
});
*/

/**
 * MÉTHODE 4 : Vérification dans un service
 */
/*
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';

class CantineService {
    async createMenu(menuData: any, utilisateurId: string) {
        // Vérifier la permission
        const hasPermission = await permissionResolverService.hasPermission(
            utilisateurId,
            'cantine:menus:create'
        );

        if (!hasPermission) {
            throw new AppError('Permission insuffisante', 403, 'INSUFFICIENT_PERMISSIONS');
        }

        // Créer le menu
        return this.menuRepo.save(menuData);
    }
}
*/

// ==================================
// ENDPOINTS À PROTÉGER (Priorité)
// ==================================

/**
 * LISTE DES ENDPOINTS CRITIQUES À PROTÉGER IMMÉDIATEMENT
 */
export const ENDPOINTS_CRITIQUES_A_PROTEGER = [
    // Établissements (SUPER_ADMIN uniquement)
    { method: 'POST', path: '/api/etablissements', permission: 'etablissements:create' },
    { method: 'PATCH', path: '/api/etablissements/:id/activer', permission: 'etablissements:activer' },
    { method: 'PATCH', path: '/api/etablissements/:id/desactiver', permission: 'etablissements:desactiver' },

    // Configuration avancée
    { method: 'POST', path: '/api/configuration/seed', permission: 'configuration:seed' },
    { method: 'POST', path: '/api/configuration/licence', permission: 'configuration:licence:activer' },

    // Monitoring
    { method: 'POST', path: '/api/monitoring/maintenance', permission: 'monitoring:maintenance:toggle' },

    // Utilisateurs avancé
    { method: 'POST', path: '/api/utilisateurs/import', permission: 'utilisateurs:import' },
    { method: 'POST', path: '/api/utilisateurs/:id/reset-password', permission: 'utilisateurs:reset-password' },
    { method: 'PATCH', path: '/api/utilisateurs/:id/statut', permission: 'utilisateurs:statut:change' },

    // RBAC (ADMIN uniquement)
    { method: 'POST', path: '/api/rbac/permissions', permission: 'permissions:create' },
    { method: 'PATCH', path: '/api/rbac/permissions/:id', permission: 'permissions:edit' },
    { method: 'DELETE', path: '/api/rbac/permissions/:id', permission: 'permissions:delete' },

    // Auth
    { method: 'POST', path: '/api/auth/logout-all', permission: 'auth:sessions:manage' },

    // Années scolaires
    { method: 'POST', path: '/api/annees-scolaires/:id/cloturer', permission: 'annees:cloturer' },

    // Élèves
    { method: 'POST', path: '/api/eleves/:id/radiation', permission: 'eleves:radiation' },

    // Bulletins
    { method: 'POST', path: '/api/bulletins/:id/publier', permission: 'bulletins:publier' },
];

/**
 * LISTE DES ENDPOINTS HAUTE PRIORITÉ À PROTÉGER
 */
export const ENDPOINTS_HAUTE_PRIORITE = [
    // Cantine
    { method: 'POST', path: '/api/cantine/menus', permission: 'cantine:menus:create' },
    { method: 'PATCH', path: '/api/cantine/menus/:id', permission: 'cantine:menus:edit' },
    { method: 'DELETE', path: '/api/cantine/menus/:id', permission: 'cantine:menus:delete' },
    { method: 'POST', path: '/api/cantine/inscriptions', permission: 'cantine:inscriptions:create' },
    { method: 'POST', path: '/api/cantine/inscriptions/:id/recharger', permission: 'cantine:solde:recharger' },
    { method: 'POST', path: '/api/cantine/consommations', permission: 'cantine:consommations:enregistrer' },

    // Transport
    { method: 'POST', path: '/api/transport/lignes', permission: 'transport:lignes:create' },
    { method: 'PATCH', path: '/api/transport/lignes/:id', permission: 'transport:lignes:edit' },
    { method: 'DELETE', path: '/api/transport/lignes/:id', permission: 'transport:lignes:delete' },
    { method: 'POST', path: '/api/transport/inscriptions', permission: 'transport:inscriptions:create' },
    { method: 'POST', path: '/api/transport/presences', permission: 'transport:presences:enregistrer' },

    // Orientation
    { method: 'POST', path: '/api/orientation/profils', permission: 'orientation:profils:create' },
    { method: 'PATCH', path: '/api/orientation/profils/:eleveId', permission: 'orientation:profils:edit' },
    { method: 'POST', path: '/api/orientation/rdv', permission: 'orientation:rdv:create' },
    { method: 'PATCH', path: '/api/orientation/rdv/:id', permission: 'orientation:rdv:edit' },
    { method: 'POST', path: '/api/orientation/rdv/:id/annuler', permission: 'orientation:rdv:annuler' },

    // Impressions
    { method: 'POST', path: '/api/impressions/modeles', permission: 'impressions:modeles:create' },
    { method: 'PATCH', path: '/api/impressions/modeles/:id', permission: 'impressions:modeles:edit' },
    { method: 'DELETE', path: '/api/impressions/modeles/:id', permission: 'impressions:modeles:delete' },
    { method: 'POST', path: '/api/impressions/file/:id/generer', permission: 'impressions:file:generer' },
    { method: 'POST', path: '/api/impressions/file/:id/annuler', permission: 'impressions:file:annuler' },

    // Matériel
    { method: 'POST', path: '/api/materiel', permission: 'materiel:create' },
    { method: 'PATCH', path: '/api/materiel/:id', permission: 'materiel:edit' },
    { method: 'DELETE', path: '/api/materiel/:id', permission: 'materiel:delete' },
    { method: 'POST', path: '/api/materiel/prets', permission: 'materiel:prets:create' },
    { method: 'POST', path: '/api/materiel/prets/:id/retour', permission: 'materiel:prets:retour' },

    // Cartes
    { method: 'POST', path: '/api/cartes', permission: 'cartes:create' },
    { method: 'PATCH', path: '/api/cartes/:id', permission: 'cartes:edit' },
    { method: 'POST', path: '/api/cartes/:id/desactiver', permission: 'cartes:desactiver' },
    { method: 'POST', path: '/api/cartes/:id/perte', permission: 'cartes:perte:signaler' },

    // Classes
    { method: 'POST', path: '/api/classes/affectations', permission: 'classes:affecter' },
    { method: 'DELETE', path: '/api/classes/affectations/:id', permission: 'classes:desaffecter' },

    // Clubs
    { method: 'POST', path: '/api/clubs', permission: 'clubs:create' },
    { method: 'PATCH', path: '/api/clubs/:id', permission: 'clubs:edit' },
    { method: 'DELETE', path: '/api/clubs/:id', permission: 'clubs:delete' },
    { method: 'POST', path: '/api/clubs/:id/inscriptions', permission: 'clubs:inscriptions:manage' },

    // Gamification
    { method: 'POST', path: '/api/gamification/badges', permission: 'gamification:badges:create' },
    { method: 'POST', path: '/api/gamification/points', permission: 'gamification:points:attribuer' },
    { method: 'POST', path: '/api/gamification/attribuer-badge', permission: 'gamification:badges:attribuer' },

    // Notes
    { method: 'POST', path: '/api/notes/bulk', permission: 'notes:bulk:create' },
    { method: 'POST', path: '/api/notes/import', permission: 'notes:import' },

    // Notifications
    { method: 'POST', path: '/api/notifications/bulk', permission: 'notifications:bulk:create' },
    { method: 'PATCH', path: '/api/notifications/read-all', permission: 'notifications:read-all' },

    // Personnel
    { method: 'POST', path: '/api/personnel', permission: 'personnel:create' },
    { method: 'PATCH', path: '/api/personnel/:id', permission: 'personnel:edit' },
    { method: 'DELETE', path: '/api/personnel/:id', permission: 'personnel:delete' },

    // Scoring
    { method: 'POST', path: '/api/scoring/recalculer', permission: 'scoring:recalculer' },
    { method: 'POST', path: '/api/scoring/regles', permission: 'scoring:regles:create' },
];

/**
 * EXEMPLE COMPLET D'IMPLÉMENTATION DANS UN CONTRÔLEUR
 */
/*
// Fichier: backend/src/modules/cantine/controllers/cantine.controller.ts

import { Router, Request, Response, NextFunction } from 'express';
import { cantineService } from '../services/cantine.service';
import { checkPermission } from '@modules/auth/guards/permission.guard';
import { authMiddleware } from '@modules/auth/middlewares';

const router = Router();

// Toutes les routes nécessitent d'être authentifié
router.use(authMiddleware);

// ✅ Protégé par permission
router.post('/menus', 
    checkPermission('cantine:menus:create'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menu = await cantineService.createMenu(req.body);
            res.status(201).json({ success: true, data: menu });
        } catch (error) {
            next(error);
        }
    }
);

// ✅ Protégé par permission
router.patch('/menus/:id',
    checkPermission('cantine:menus:edit'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const menu = await cantineService.updateMenu(req.params.id, req.body);
            res.json({ success: true, data: menu });
        } catch (error) {
            next(error);
        }
    }
);

// ✅ Protégé par permission
router.post('/inscriptions/:id/recharger',
    checkPermission('cantine:solde:recharger'),
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

export default router;
*/

// ==================================
// CHECKLIST D'IMPLÉMENTATION
// ==================================

/**
 * ÉTAPE 1 : Guards Critiques (Semaine 1)
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
 * ÉTAPE 2 : Guards Haute Priorité (Semaine 2-3)
 * 
 * [ ] Cantine (6 endpoints)
 * [ ] Transport (5 endpoints)
 * [ ] Orientation (5 endpoints)
 * [ ] Impressions (5 endpoints)
 * [ ] Matériel (5 endpoints)
 * [ ] Cartes (4 endpoints)
 * [ ] Classes (2 endpoints)
 * [ ] Clubs (4 endpoints)
 * [ ] Gamification (3 endpoints)
 * [ ] Notes (2 endpoints)
 * [ ] Notifications (2 endpoints)
 * [ ] Personnel (3 endpoints)
 * [ ] Scoring (2 endpoints)
 */

/**
 * ÉTAPE 3 : Tests & Validation (Semaine 4)
 * 
 * [ ] Tester chaque guard avec un utilisateur sans permission (doit retourner 403)
 * [ ] Tester chaque guard avec un utilisateur avec permission (doit retourner 200)
 * [ ] Tester le fallback vers l'ancien système (enum Role)
 * [ ] Tester le cache des permissions (invalidation après modification)
 * [ ] Tester les permissions personnalisées (GRANTED/DENIED)
 * [ ] Tester le multi-rôles (permissions combinées)
 */

// ==================================
// RÉSUMÉ
// ==================================

/**
 * TOTAL D'ENDPOINTS À PROTÉGER : ~50
 * 
 * - Critiques : 15 endpoints
 * - Haute priorité : 35 endpoints
 * 
 * TEMPS ESTIMÉ : 2-3 jours de développement
 * 
 * Après implémentation, le système RBAC d'eLISAschool sera COMPLÈTEMENT
 * fonctionnel avec une couverture de 100% sur toutes les opérations sensibles.
 */

export default {
    ENDPOINTS_CRITIQUES_A_PROTEGER,
    ENDPOINTS_HAUTE_PRIORITE,
};
