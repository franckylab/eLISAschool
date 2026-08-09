/**
 * ==================================
 * eLISAschool - Module Role Builder
 * ==================================
 * Gestion des rôles plateforme (défaut + personnalisés).
 *
 * V2.3 — Panel Admin Enterprise
 */

export * from './controllers/platform-roles.controller';
export * from './services/platform-roles.service';
export { creerRoleSchema, modifierRoleSchema } from './dto/platform-roles.dto';
export type { CreerRoleDto, ModifierRoleDto } from './dto/platform-roles.dto';
