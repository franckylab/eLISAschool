/**
 * ==================================
 * eLISAschool - Module Identité (Dual-Plane)
 * ==================================
 * Modèle C — Auth0 Internalisé
 *
 * Barrel export pour les entités, services et contrôleurs
 * du module d'identité globale.
 */

// Entités
export { Identite } from './entities/identite.entity';
export { UtilisateurPlateforme } from './entities/utilisateur-plateforme.entity';
export { Membership } from './entities/membership.entity';
export { PermissionPlateforme } from './entities/permission-plateforme.entity';

// Services
export { identiteService, IdentiteService } from './services/identite.service';
export { membershipService, MembershipService } from './services/membership.service';

// Contrôleurs
export { identiteController } from './controllers/identite.controller';
export { platformPermissionsController } from './controllers/platform-permissions.controller';

// DTOs
export {
    listeIdentitesSchema,
    creerIdentiteSchema,
    modifierIdentiteSchema,
    assignerRoleSchema,
} from './dto/identite.dto';
export type {
    ListeIdentitesDto,
    CreerIdentiteDto,
    ModifierIdentiteDto,
    AssignerRoleDto,
} from './dto/identite.dto';
