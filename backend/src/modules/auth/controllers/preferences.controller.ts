/**
 * ==================================
 * eLISAschool - Contrôleur Préférences Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * API REST complète pour la gestion des préférences
 */

import { Router, Request, Response, NextFunction } from 'express';
import { preferenceUtilisateurService, DEFAULT_PREFERENCES, CategoriePreference } from '../services/preference-utilisateur.service';
import { authMiddleware, requireRoles } from '@modules/auth/middlewares';
import { Role } from '@shared/enums/roles.enum';
import { z } from 'zod';
import { AppError } from '@common/filters/error.filter';

const router = Router();

// ============================================
// Schémas de validation
// ============================================

const setPreferenceSchema = z.object({
    cle: z.string().min(1).max(100),
    valeur: z.any(),
    typeValeur: z.enum(['string', 'number', 'boolean', 'json', 'array']).optional(),
});

const resetCategorySchema = z.object({
    categorie: z.nativeEnum(CategoriePreference),
});

// Helper validation
function validateDto<T>(schema: z.ZodSchema<T>, data: unknown): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new AppError('Données invalides', 400, 'VALIDATION_ERROR', result.error.errors);
    }
    return result.data;
}

// ============================================
// Routes publiques (auth requise)
// ============================================

// Obtenir toutes mes préférences
router.get('/my', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const preferences = await preferenceUtilisateurService.getAllPreferences(userId);
        res.json({ 
            success: true, 
            data: preferences,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Obtenir mes préférences groupées par catégorie
router.get('/my/grouped', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const grouped = await preferenceUtilisateurService.getPreferencesByCategory(userId);
        res.json({ 
            success: true, 
            data: grouped,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Obtenir une préférence spécifique
router.get('/my/:cle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const cle = req.params.cle;
        const valeur = await preferenceUtilisateurService.getPreference(userId, cle);
        res.json({ 
            success: true, 
            data: { cle, valeur },
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Définir une préférence
router.post('/set', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const dto = validateDto(setPreferenceSchema, req.body);
        
        const pref = await preferenceUtilisateurService.setPreference(
            userId,
            dto.cle,
            dto.valeur,
            dto.typeValeur
        );
        
        res.json({ 
            success: true, 
            data: pref,
            message: 'Préférence sauvegardée',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Réinitialiser une préférence
router.post('/reset/:cle', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const cle = req.params.cle;
        
        await preferenceUtilisateurService.resetPreference(userId, cle);
        
        res.json({ 
            success: true, 
            message: 'Préférence réinitialisée',
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Réinitialiser une catégorie
router.post('/reset-category', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const dto = validateDto(resetCategorySchema, req.body);
        
        const count = await preferenceUtilisateurService.resetCategoryPreferences(
            userId,
            dto.categorie
        );
        
        res.json({ 
            success: true, 
            data: { count },
            message: `${count} préférence(s) réinitialisée(s)`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Réinitialiser toutes les préférences
router.post('/reset-all', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const count = await preferenceUtilisateurService.resetAllPreferences(userId);
        
        res.json({ 
            success: true, 
            data: { count },
            message: `${count} préférence(s) supprimée(s)`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Restaurer les valeurs par défaut
router.post('/restore-defaults', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const count = await preferenceUtilisateurService.restoreDefaultPreferences(userId);
        
        res.json({ 
            success: true, 
            data: { count },
            message: `${count} préférence(s) restaurée(s) aux valeurs par défaut`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Configurer héritage config globale
router.post('/inheritance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.utilisateur!.id;
        const { cle, herite } = req.body;

        if (!cle || typeof herite !== 'boolean') {
            throw new AppError('Clé et héritage requis', 400, 'VALIDATION_ERROR');
        }
        
        await preferenceUtilisateurService.setGlobalInheritance(userId, cle, herite);
        
        res.json({ 
            success: true, 
            message: `Héritage ${herite ? 'activé' : 'désactivé'}`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// ============================================
// Routes ADMIN
// ============================================

// Obtenir les valeurs par défaut du système
router.get('/defaults', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({ 
            success: true, 
            data: DEFAULT_PREFERENCES,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Obtenir les préférences d'un utilisateur (admin)
router.get('/user/:userId', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        const preferences = await preferenceUtilisateurService.getAllPreferences(userId);
        res.json({ 
            success: true, 
            data: preferences,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

// Réinitialiser les préférences d'un utilisateur (admin)
router.post('/user/:userId/reset-all', authMiddleware, requireRoles(Role.ADMIN, Role.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        const count = await preferenceUtilisateurService.resetAllPreferences(userId);
        
        res.json({ 
            success: true, 
            data: { count },
            message: `Préférences de l'utilisateur réinitialisées`,
            timestamp: new Date().toISOString() 
        });
    } catch (error) { next(error); }
});

export const preferencesController = router;
