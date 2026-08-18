/**
 * ==================================
 * eLISAschool - Interface Adaptateur Notifications Parents
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Description: Interface de découplage pour les notifications parents.
 * Permet aux autres modules (notes, bulletins, cantine, etc.) de
 * fonctionner même si le module Parents est désactivé.
 */

/**
 * Format simplifié d'un responsable pour les notifications
 */
export interface ResponsableNotification {
    utilisateurId: string;
    email?: string;
    telephone?: string;
    peutConsulter: boolean;
    peutPayer: boolean;
}

/**
 * Interface de l'adaptateur de notifications parents.
 *
 * Les modules dépendants (notes, bulletins, cantine, transport, sante)
 * utilisent cette interface au lieu d'importer directement parentService.
 *
 * Si le module Parents est désactivé, le fallback retourne [].
 */
export interface IParentNotificationAdapter {
    /**
     * Récupérer les responsables d'un élève pour notification.
     * Retourne [] si le module Parents est inactif.
     */
    getResponsablesForNotification(eleveUtilisateurId: string): Promise<ResponsableNotification[]>;

    /**
     * Vérifier si le module Parents est actif.
     */
    estModuleActif(): boolean;
}
