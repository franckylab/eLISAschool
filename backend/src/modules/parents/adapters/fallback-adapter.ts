/**
 * ==================================
 * eLISAschool - Adaptateur Fallback Parents
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Description: Adaptateur par défaut quand le module Parents est inactif.
 * Retourne des résultats vides pour ne pas bloquer les autres modules.
 */

import { IParentNotificationAdapter, ResponsableNotification } from './parent-notification.adapter';

/**
 * Adaptateur fallback — utilisé quand le module Parents est désactivé.
 * Toutes les méthodes retournent des résultats vides.
 */
export class FallbackParentNotificationAdapter implements IParentNotificationAdapter {
    async getResponsablesForNotification(_eleveUtilisateurId: string): Promise<ResponsableNotification[]> {
        return [];
    }

    estModuleActif(): boolean {
        return false;
    }
}
