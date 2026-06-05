/**
 * ==================================
 * eLISAschool - Module RBAC (Role-Based Access Control)
 * ==================================
 * Version: 2.0.0
 * Auteur: xAI Éducation
 * 
 * Module de gestion des rôles et permissions dynamiques
 */

import { Router } from 'express';
import rolesController from './controllers/roles.controller';
import permissionsController from './controllers/permissions.controller';
import userRolesController from './controllers/user-roles.controller';

const router = Router();

// Monter les contrôleurs
router.use('/', rolesController);
router.use('/', permissionsController);
router.use('/', userRolesController);

export default router;

export { rolesService } from './services/roles.service';
export { permissionsService } from './services/permissions.service';
