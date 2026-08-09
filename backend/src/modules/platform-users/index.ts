/**
 * ==================================
 * eLISAschool - Module Utilisateurs Plateforme
 * ==================================
 * CRUD comptes admin plateforme + délégation + audit trail.
 *
 * V2.2 — Panel Admin Enterprise
 */

export * from './controllers/platform-users.controller';
export * from './services/platform-users.service';
export {
    listeUtilisateursSchema,
    creerUtilisateurSchema,
    modifierUtilisateurSchema,
    deleguerSchema,
} from './dto/platform-users.dto';
export type {
    ListeUtilisateursDto,
    CreerUtilisateurDto,
    ModifierUtilisateurDto,
    DeleguerDto,
} from './dto/platform-users.dto';
