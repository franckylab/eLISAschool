/**
 * ==================================
 * eLISAschool - Déclaration de types Express étendus
 * ==================================
 * 
 * Étend l'interface Request d'Express pour inclure
 * l'utilisateur authentifié et l'etablissementId multi-tenancy.
 */

import { UtilisateurAuth } from '@modules/auth/dto';

declare global {
    namespace Express {
        interface Request {
            /**
             * Utilisateur authentifié (attaché par authMiddleware)
             */
            utilisateur?: UtilisateurAuth;

            /**
             * ID de l'établissement pour le filtrage multi-tenancy
             * (attaché par tenantMiddleware, dérivé du JWT)
             */
            etablissementId?: string;
        }
    }
}
