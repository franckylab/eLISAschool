/**
 * ==================================
 * eLISAschool - Export des entités Auth
 * ==================================
 */

export { Utilisateur, Role, StatutUtilisateur } from './utilisateur.entity';
export { ProfilUtilisateur, Genre } from './profil-utilisateur.entity';
export { RefreshToken } from './refresh-token.entity';
export { AuditLog, AuditAction, AuditSeverity } from './audit-log.entity';

// Nouvelles entités RBAC (v2.0)
export { default as RoleEntity } from './role.entity';
export { default as Permission } from './permission.entity';
export { default as UtilisateurRole } from './utilisateur-role.entity';
export { default as UtilisateurPermission, TypePermission } from './utilisateur-permission.entity';
export { default as UtilisateurEtablissement } from './utilisateur-etablissement.entity';
export { default as RoleLimitationEtablissement } from './role-limitation-etablissement.entity';
