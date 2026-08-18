/**
 * ==================================
 * eLISAschool - Registre Adaptateur Notifications Parents
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Description: Registry singleton pour l'adaptateur de notifications parents.
 * Permet aux autres modules d'accéder aux données parents sans dépendance directe.
 *
 * Initialisation : appelée dans app.ts après chargement du module Parents.
 * Si le module est désactivé, le fallback est utilisé automatiquement.
 */

import { IParentNotificationAdapter, ResponsableNotification } from './parent-notification.adapter';
import { FallbackParentNotificationAdapter } from './fallback-adapter';
import { logger } from '@common/utils/logger.util';

/**
 * Instance courante de l'adaptateur.
 * Par défaut : fallback (module inactif).
 */
let currentAdapter: IParentNotificationAdapter = new FallbackParentNotificationAdapter();

/**
 * Enregistrer l'adaptateur réel (parentService).
 * Appelée dans app.ts lors de l'initialisation si le module est actif.
 */
export function registerParentAdapter(adapter: IParentNotificationAdapter): void {
    currentAdapter = adapter;
    logger.info('[ParentAdapter] Adaptateur réel enregistré (module Parents actif)');
}

/**
 * Réinitialiser vers le fallback (module désactivé).
 */
export function unregisterParentAdapter(): void {
    currentAdapter = new FallbackParentNotificationAdapter();
    logger.info('[ParentAdapter] Adaptateur fallback (module Parents inactif)');
}

/**
 * Obtenir l'adaptateur courant pour les notifications parents.
 * Utilisé par les modules dépendants (notes, bulletins, cantine, transport, sante).
 */
export function getParentNotificationAdapter(): IParentNotificationAdapter {
    return currentAdapter;
}

/**
 * Helper : récupérer les responsables pour notification (raccourci).
 */
export async function getResponsablesForNotification(eleveUtilisateurId: string): Promise<ResponsableNotification[]> {
    return currentAdapter.getResponsablesForNotification(eleveUtilisateurId);
}

/**
 * Vérifier si le module Parents est actif.
 */
export function isParentModuleActive(): boolean {
    return currentAdapter.estModuleActif();
}

export * from './parent-notification.adapter';
export * from './fallback-adapter';
