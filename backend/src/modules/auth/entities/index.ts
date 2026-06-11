/**
 * ==================================
 * eLISAschool - Export des entités Auth
 * ==================================
 */

// Utilisateur et enums
export { Utilisateur, StatutUtilisateur } from './utilisateur.entity';
// Note: l'enum Role est exporté depuis @shared/enums/roles.enum
export { ProfilUtilisateur, Genre } from './profil-utilisateur.entity';
export { RefreshToken } from './refresh-token.entity';
export { AuditLog, AuditAction, AuditSeverity } from './audit-log.entity';

// RBAC v2.0
export { Role } from './role.entity';  // Entité Role (TypeORM)
export { Permission } from './permission.entity';
export { UtilisateurRole } from './utilisateur-role.entity';
export { UtilisateurPermission, TypePermission } from './utilisateur-permission.entity';
export { UtilisateurEtablissement } from './utilisateur-etablissement.entity';
export { RoleLimitationEtablissement } from './role-limitation-etablissement.entity';

// Préférences utilisateur
export { PreferenceUtilisateur, CategoriePreference } from './preference-utilisateur.entity';
