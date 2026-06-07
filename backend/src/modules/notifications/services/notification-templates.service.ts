/**
 * ==================================
 * eLISAschool - Service de Templates de Notifications
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Templates réutilisables pour les notifications métier
 * Centralise la création de notifications pour tous les modules
 */

import { notificationsService } from '../services/notifications.service';
import { TypeNotification, PrioriteNotification } from '../entities';
import { logger } from '@common/utils/logger.util';

/**
 * Interface pour les variables de template
 */
export interface TemplateVariables {
    [key: string]: string | number | boolean | undefined;
}

/**
 * Interface pour le contexte de notification
 */
export interface NotificationContext {
    destinataireId: string;
    etablissementId?: string;
    metadata?: Record<string, any>;
}

/**
 * Service de templates de notifications
 */
export class NotificationTemplatesService {
    /**
     * Remplacer les variables dans un template
     */
    private renderTemplate(template: string, variables: TemplateVariables): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''));
        }
        return result;
    }

    /**
     * ============================================
     * TEMPLATES - MODULE NOTES
     * ============================================
     */

    /**
     * Notification : Nouvelle note ajoutée
     */
    async nouvelleNote(context: NotificationContext, variables: {
        eleveNom: string;
        matiere: string;
        note: number;
        bareme: number;
        periode: string;
        enseignant: string;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('📝 Nouvelle note - {{matiere}}', variables),
                contenu: this.renderTemplate(
                    'Une nouvelle note de {{note}}/{{bareme}} a été ajoutée pour {{eleveNom}} en {{matiere}} ({{periode}}) par {{enseignant}}.',
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'note_create',
                    ...variables,
                },
                priorite: PrioriteNotification.NORMALE,
            });

            logger.info(`[Template] Notification nouvelle note envoyée à ${context.destinataireId}`);
        } catch (error) {
            logger.error('[Template] Erreur envoi notification nouvelle note', error);
        }
    }

    /**
     * Notification : Note modifiée
     */
    async noteModifiee(context: NotificationContext, variables: {
        eleveNom: string;
        matiere: string;
        ancienneNote: number;
        nouvelleNote: number;
        bareme: number;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('✏️ Note modifiée - {{matiere}}', variables),
                contenu: this.renderTemplate(
                    'La note de {{eleveNom}} en {{matiere}} a été modifiée : {{ancienneNote}} → {{nouvelleNote}}/{{bareme}}.',
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'note_update',
                    ...variables,
                },
                priorite: PrioriteNotification.NORMALE,
            });
        } catch (error) {
            logger.error('[Template] Erreur envoi notification note modifiée', error);
        }
    }

    /**
     * ============================================
     * TEMPLATES - MODULE BULLETINS
     * ============================================
     */

    /**
     * Notification : Bulletin disponible
     */
    async bulletinDisponible(context: NotificationContext, variables: {
        eleveNom: string;
        periode: string;
        moyenne: number;
        rang?: number;
        totalEleves?: number;
    }): Promise<void> {
        try {
            const rangText = variables.rang ? ` (Rang: {{rang}}/{{totalEleves}})` : '';
            
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('📄 Bulletin disponible - {{periode}}', variables),
                contenu: this.renderTemplate(
                    `Le bulletin de {{eleveNom}} pour {{periode}} est disponible. Moyenne: {{moyenne}}/20${rangText}.`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'bulletin_available',
                    ...variables,
                },
                priorite: PrioriteNotification.HAUTE,
            });

            // Email avec plus de détails
            if (context.metadata?.email) {
                await notificationsService.create({
                    type: TypeNotification.EMAIL,
                    titre: this.renderTemplate('Bulletin {{periode}} - {{eleveNom}}', variables),
                    contenu: this.renderTemplate(
                        `Le bulletin trimestriel de {{eleveNom}} pour la période {{periode}} est maintenant disponible.\n\n` +
                        `Moyenne générale: {{moyenne}}/20\n` +
                        (variables.rang ? `Rang: {{rang}}/{{totalEleves}}\n\n` : '') +
                        `Vous pouvez consulter le bulletin complet dans l'application eLISAschool.`,
                        variables
                    ),
                    destinataireId: context.destinataireId,
                    metadata: {
                        ...context.metadata,
                        type: 'bulletin_email',
                        ...variables,
                    },
                    priorite: PrioriteNotification.HAUTE,
                });
            }

            logger.info(`[Template] Notification bulletin disponible envoyée à ${context.destinataireId}`);
        } catch (error) {
            logger.error('[Template] Erreur envoi notification bulletin', error);
        }
    }

    /**
     * ============================================
     * TEMPLATES - MODULE ÉLÈVES (Absences)
     * ============================================
     */

    /**
     * Notification : Absence non justifiée
     */
    async absenceNonJustifiee(context: NotificationContext, variables: {
        eleveNom: string;
        date: string;
        heures: number;
        matiere?: string;
    }): Promise<void> {
        try {
            const matiereText = variables.matiere ? ` en {{matiere}}` : '';
            
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('⚠️ Absence non justifiée', variables),
                contenu: this.renderTemplate(
                    `{{eleveNom}} a été absent(e) le {{date}} pendant {{heures}} heure(s){{matiereText}}. Merci de justifier cette absence.`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'absence_unjustified',
                    action: 'justifier',
                    ...variables,
                },
                priorite: PrioriteNotification.URGENTE,
            });

            // SMS pour les absences urgentes
            if (context.metadata?.telephone) {
                await notificationsService.create({
                    type: TypeNotification.SMS,
                    titre: 'Absence',
                    contenu: this.renderTemplate(
                        `eLISAschool: Absence non justifiée de {{eleveNom}} le {{date}}. Merci de contacter l'établissement.`,
                        variables
                    ),
                    destinataireId: context.destinataireId,
                    metadata: {
                        ...context.metadata,
                        type: 'absence_sms',
                        ...variables,
                    },
                    priorite: PrioriteNotification.URGENTE,
                });
            }

            logger.info(`[Template] Notification absence envoyée à ${context.destinataireId}`);
        } catch (error) {
            logger.error('[Template] Erreur envoi notification absence', error);
        }
    }

    /**
     * Notification : Retard
     */
    async retard(context: NotificationContext, variables: {
        eleveNom: string;
        date: string;
        minutes: number;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('⏰ Retard signalé', variables),
                contenu: this.renderTemplate(
                    '{{eleveNom}} est arrivé(e) en retard le {{date}} ({{minutes}} minutes).',
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'retard',
                    ...variables,
                },
                priorite: PrioriteNotification.NORMALE,
            });
        } catch (error) {
            logger.error('[Template] Erreur envoi notification retard', error);
        }
    }

    /**
     * ============================================
     * TEMPLATES - MODULE CANTINE
     * ============================================
     */

    /**
     * Notification : Rappel paiement cantine
     */
    async rappelPaiementCantine(context: NotificationContext, variables: {
        eleveNom: string;
        montant: number;
        echeance: string;
        solde: number;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('💰 Rappel paiement cantine', variables),
                contenu: this.renderTemplate(
                    `Paiement cantine pour {{eleveNom}}: {{montant}} FCFA à payer avant le {{echeance}}. Solde actuel: {{solde}} FCFA.`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'cantine_payment_reminder',
                    ...variables,
                },
                priorite: PrioriteNotification.HAUTE,
            });

            // Email avec détails
            if (context.metadata?.email) {
                await notificationsService.create({
                    type: TypeNotification.EMAIL,
                    titre: this.renderTemplate('Rappel: Paiement cantine {{eleveNom}}', variables),
                    contenu: this.renderTemplate(
                        `Bonjour,\n\n` +
                        `Nous vous rappelons que le paiement de la cantine pour {{eleveNom}} est attendu.\n\n` +
                        `Montant à payer: {{montant}} FCFA\n` +
                        `Date limite: {{echeance}}\n` +
                        `Solde actuel: {{solde}} FCFA\n\n` +
                        `Merci d'effectuer le paiement dans les délais.\n\n` +
                        `Cordialement,\n` +
                        `L'établissement`,
                        variables
                    ),
                    destinataireId: context.destinataireId,
                    metadata: {
                        ...context.metadata,
                        type: 'cantine_email',
                        ...variables,
                    },
                    priorite: PrioriteNotification.HAUTE,
                });
            }
        } catch (error) {
            logger.error('[Template] Erreur envoi notification cantine', error);
        }
    }

    /**
     * Notification : Menu du jour
     */
    async menuDuJour(context: NotificationContext, variables: {
        date: string;
        entree: string;
        plat: string;
        dessert: string;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('🍽️ Menu du {{date}}', variables),
                contenu: this.renderTemplate(
                    `Menu cantine du {{date}}:\nEntrée: {{entree}}\nPlat: {{plat}}\nDessert: {{dessert}}`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'cantine_menu',
                    ...variables,
                },
                priorite: PrioriteNotification.NORMALE,
            });
        } catch (error) {
            logger.error('[Template] Erreur envoi notification menu cantine', error);
        }
    }

    /**
     * ============================================
     * TEMPLATES - MODULE TRANSPORT
     * ============================================
     */

    /**
     * Notification : Retard bus
     */
    async retardBus(context: NotificationContext, variables: {
        ligne: string;
        retard: number;
        raison?: string;
    }): Promise<void> {
        try {
            const raisonText = variables.raison ? ` Raison: {{raison}}` : '';
            
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('🚌 Retard bus - Ligne {{ligne}}', variables),
                contenu: this.renderTemplate(
                    `Le bus de la ligne {{ligne}} aura un retard de {{retard}} minute(s).{{raisonText}}`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'transport_delay',
                    ...variables,
                },
                priorite: PrioriteNotification.URGENTE,
            });

            // SMS pour les retards importants
            if (context.metadata?.telephone && variables.retard > 15) {
                await notificationsService.create({
                    type: TypeNotification.SMS,
                    titre: 'Retard bus',
                    contenu: this.renderTemplate(
                        `eLISAschool: Bus ligne {{ligne}} en retard de {{retard}} min.{{raisonText}}`,
                        variables
                    ),
                    destinataireId: context.destinataireId,
                    metadata: {
                        ...context.metadata,
                        type: 'transport_sms',
                        ...variables,
                    },
                    priorite: PrioriteNotification.URGENTE,
                });
            }
        } catch (error) {
            logger.error('[Template] Erreur envoi notification retard bus', error);
        }
    }

    /**
     * Notification : Changement d'itinéraire
     */
    async changementItineraire(context: NotificationContext, variables: {
        ligne: string;
        nouveauTrajet: string;
        dateEffet: string;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: this.renderTemplate('🔄 Changement itinéraire - Ligne {{ligne}}', variables),
                contenu: this.renderTemplate(
                    `L'itinéraire du bus {{ligne}} sera modifié à partir du {{dateEffet}}.\nNouveau trajet: {{nouveauTrajet}}`,
                    variables
                ),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'transport_route_change',
                    ...variables,
                },
                priorite: PrioriteNotification.HAUTE,
            });
        } catch (error) {
            logger.error('[Template] Erreur envoi notification changement itinéraire', error);
        }
    }

    /**
     * ============================================
     * TEMPLATES - GÉNÉRIQUES
     * ============================================
     */

    /**
     * Notification : Message de l'administration
     */
    async messageAdministration(context: NotificationContext, variables: {
        titre: string;
        message: string;
        expediteur: string;
    }): Promise<void> {
        try {
            await notificationsService.create({
                type: TypeNotification.IN_APP,
                titre: variables.titre,
                contenu: this.renderTemplate('{{message}}\n\nDe: {{expediteur}}', variables),
                destinataireId: context.destinataireId,
                metadata: {
                    ...context.metadata,
                    type: 'admin_message',
                    ...variables,
                },
                priorite: PrioriteNotification.HAUTE,
            });

            if (context.metadata?.email) {
                await notificationsService.create({
                    type: TypeNotification.EMAIL,
                    titre: `[eLISAschool] ${variables.titre}`,
                    contenu: variables.message,
                    destinataireId: context.destinataireId,
                    metadata: {
                        ...context.metadata,
                        type: 'admin_email',
                        ...variables,
                    },
                    priorite: PrioriteNotification.HAUTE,
                });
            }
        } catch (error) {
            logger.error('[Template] Erreur envoi message administration', error);
        }
    }
}

// Singleton export
export const notificationTemplates = new NotificationTemplatesService();
