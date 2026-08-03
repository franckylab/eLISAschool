/**
 * ==================================
 * eLISAschool - Export des entités Auth
 * ==================================
 */

// Utilisateur et enums
export { Utilisateur, StatutUtilisateur } from './utilisateur.entity';
// Note: l'enum Role est exporté depuis @shared/enums/roles.enum
// Note: l'enum Genre est exporté depuis @shared/enums/statuts.enum
export { ProfilUtilisateur } from './profil-utilisateur.entity';
export { Genre } from '@shared/enums/statuts.enum';
export { RefreshToken } from './refresh-token.entity';
export { AuditLog, AuditAction, AuditSeverity } from './audit-log.entity';

// RBAC v3.0 (Multi-tenant strict)
export { Role } from '@shared/enums/roles.enum';  // Enum Role (source de vérité, remplace l'ancien export entité)
export { Role as RoleEntity } from './role.entity';  // Entité TypeORM
export { Permission } from './permission.entity';
// DEPRECATED: UtilisateurRole supprimé - rôles gérés exclusivement via UtilisateurEtablissement
export { UtilisateurPermission, TypePermission } from './utilisateur-permission.entity';
export { UtilisateurEtablissement } from './utilisateur-etablissement.entity';
export { RoleLimitationEtablissement } from './role-limitation-etablissement.entity';

// Préférences utilisateur
export { PreferenceUtilisateur, CategoriePreference } from './preference-utilisateur.entity';

// Gestion de blocage authentification
export { TentativeConnexion, TypeBlocage } from './tentative-connexion.entity';
