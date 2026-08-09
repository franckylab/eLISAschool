/**
 * ==================================
 * eLISAschool - Service Orchestrateur Notifications
 * ==================================
 * 
 * Routage multi-canal : permet d'envoyer une notification
 * sur plusieurs canaux simultanément (email + SMS + push + in-app).
 * Gère les templates, le retry et la traçabilité.
 * 
 * Phase 8.1 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Notification, TypeNotification, StatutNotification, PrioriteNotification } from '../entities';
import { NotificationTemplate } from '../entities/notification-template.entity';
import { NotificationProviderConfig } from '../entities/notification-provider-config.entity';
import { providerRegistry } from '../providers/provider-registry';
import { EnvoiResult } from '../providers/interfaces';
import { logger } from '@common/utils/logger.util';

// =============================================
// TYPES
// =============================================

export interface NotificationMultiCanal {
    /** Destinataires (IDs utilisateurs ou adresses directes) */
    destinataires: string[];
    /** Type(s) de canal à utiliser */
    canaux: TypeNotification[];
    /** Template à utiliser (nom ou ID) */
    templateNom?: string;
    /** Variables pour le template */
    variables?: Record<string, any>;
    /** Sujet (si pas de template) */
    sujet?: string;
    /** Contenu brut (si pas de template) */
    contenu?: string;
    /** Priorité */
    priorite?: PrioriteNotification;
    /** Établissement concerné */
    etablissementId?: string;
    /** Données supplémentaires (pour push notamment) */
    data?: Record<string, any>;
}

export interface EnvoiMultiCanalResult {
    succes: boolean;
    resultats: Array<{
        canal: TypeNotification;
        resultat: EnvoiResult;
    }>;
    notificationIds: string[];
}

// =============================================
// SERVICE
// =============================================

export class NotificationOrchestratorService {
    private templateRepo: Repository<NotificationTemplate>;
    private providerConfigRepo: Repository<NotificationProviderConfig>;
    private notificationRepo: Repository<Notification>;

    constructor() {
        this.templateRepo = AppDataSource.getRepository(NotificationTemplate);
        this.providerConfigRepo = AppDataSource.getRepository(NotificationProviderConfig);
        this.notificationRepo = AppDataSource.getRepository(Notification);
    }

    // =============================================
    // ENVOI MULTI-CANAL
    // =============================================

    /**
     * Envoie une notification sur plusieurs canaux simultanément.
     * Chaque canal est indépendant — l'échec d'un canal n'empêche pas les autres.
     */
    async envoyerMultiCanal(params: NotificationMultiCanal): Promise<EnvoiMultiCanalResult> {
        const resultats: Array<{ canal: TypeNotification; resultat: EnvoiResult }> = [];
        const notificationIds: string[] = [];

        // Résoudre le template si fourni
        let sujet = params.sujet || '';
        let contenu = params.contenu || '';

        if (params.templateNom) {
            const resolved = await this.resoudreTemplate(
                params.templateNom,
                params.variables || {},
                params.etablissementId,
            );
            sujet = resolved.sujet;
            contenu = resolved.contenu;
        }

        // Envoyer sur chaque canal
        for (const canal of params.canaux) {
            try {
                const notification = await this.creerNotification({
                    type: canal,
                    destinataires: params.destinataires,
                    sujet,
                    contenu,
                    priorite: params.priorite || PrioriteNotification.NORMAL,
                    etablissementId: params.etablissementId,
                    data: params.data,
                });

                notificationIds.push(notification.id);

                // Utiliser le registry pour envoyer avec fallback
                const resultat = await providerRegistry.sendWithFallback(notification);
                resultats.push({ canal, resultat });

                // Mettre à jour le statut
                notification.statut = resultat.succes
                    ? StatutNotification.ENVOYEE
                    : StatutNotification.ECHEC;
                notification.dateEnvoi = new Date();
                await this.notificationRepo.save(notification);

            } catch (error: any) {
                logger.error(`[Orchestrator] Erreur canal ${canal}: ${error.message}`);
                resultats.push({
                    canal,
                    resultat: { succes: false, erreur: error.message },
                });
            }
        }

        const succes = resultats.some((r) => r.resultat.succes);

        return { succes, resultats, notificationIds };
    }

    // =============================================
    // NOTIFICATION CONTEXTUELLE
    // =============================================

    /**
     * Envoie une notification de bienvenue à un nouvel utilisateur.
     */
    async envoyerBienvenue(destinataire: string, variables: Record<string, any>, etablissementId?: string): Promise<EnvoiMultiCanalResult> {
        return this.envoyerMultiCanal({
            destinataires: [destinataire],
            canaux: [TypeNotification.EMAIL, TypeNotification.IN_APP],
            templateNom: 'bienvenue',
            variables,
            priorite: PrioriteNotification.NORMAL,
            etablissementId,
        });
    }

    /**
     * Envoie une alerte quota (80% ou 100%).
     */
    async envoyerAlerteQuota(destinataires: string[], typeQuota: string, pourcentage: number, etablissementId: string): Promise<EnvoiMultiCanalResult> {
        const isBlocked = pourcentage >= 100;
        return this.envoyerMultiCanal({
            destinataires,
            canaux: isBlocked
                ? [TypeNotification.EMAIL, TypeNotification.SMS, TypeNotification.IN_APP]
                : [TypeNotification.EMAIL, TypeNotification.IN_APP],
            templateNom: isBlocked ? 'quota_bloque' : 'quota_alerte',
            variables: { typeQuota, pourcentage, etablissementId },
            priorite: isBlocked ? PrioriteNotification.URGENT : PrioriteNotification.HAUTE,
            etablissementId,
        });
    }

    /**
     * Envoie une notification de facture.
     */
    async envoyerFacture(destinataires: string[], numeroFacture: string, montant: number, dateEcheance: string, etablissementId: string): Promise<EnvoiMultiCanalResult> {
        return this.envoyerMultiCanal({
            destinataires,
            canaux: [TypeNotification.EMAIL, TypeNotification.IN_APP],
            templateNom: 'facture',
            variables: { numeroFacture, montant, dateEcheance },
            priorite: PrioriteNotification.HAUTE,
            etablissementId,
        });
    }

    /**
     * Envoie une alerte de retard paiement.
     */
    async envoyerAlerteRetardPaiement(destinataires: string[], numeroFacture: string, montant: number, joursRetard: number, etablissementId: string): Promise<EnvoiMultiCanalResult> {
        return this.envoyerMultiCanal({
            destinataires,
            canaux: [TypeNotification.EMAIL, TypeNotification.SMS, TypeNotification.IN_APP],
            templateNom: 'retard_paiement',
            variables: { numeroFacture, montant, joursRetard },
            priorite: PrioriteNotification.URGENT,
            etablissementId,
        });
    }

    // =============================================
    // TEMPLATES
    // =============================================

    /**
     * Résout un template avec les variables fournies.
     */
    private async resoudreTemplate(
        templateNom: string,
        variables: Record<string, any>,
        etablissementId?: string,
    ): Promise<{ sujet: string; contenu: string }> {
        // Chercher d'abord un template spécifique au tenant
        let template: NotificationTemplate | null = null;

        if (etablissementId) {
            template = await this.templateRepo.findOne({
                where: { nom: templateNom, etablissementId } as any,
            });
        }

        // Fallback sur le template global
        if (!template) {
            template = await this.templateRepo.findOne({
                where: { nom: templateNom, etablissementId: undefined as any },
            });
        }

        if (!template) {
            logger.warn(`[Orchestrator] Template "${templateNom}" introuvable`);
            return {
                sujet: `[${templateNom}]`,
                contenu: `Template "${templateNom}" non trouvé. Variables: ${JSON.stringify(variables)}`,
            };
        }

        // Remplacer les variables dans le template
        const sujet = this.renderTemplate(template.sujet, variables);
        const contenu = this.renderTemplate(template.contenu, variables);

        return { sujet, contenu };
    }

    /**
     * Remplace les variables {{variable}} dans un template.
     */
    private renderTemplate(template: string, variables: Record<string, any>): string {
        return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
            const keys = path.split('.');
            let value: any = variables;
            for (const key of keys) {
                value = value?.[key];
            }
            return value !== undefined ? String(value) : match;
        });
    }

    // =============================================
    // CRÉATION NOTIFICATION
    // =============================================

    private async creerNotification(params: {
        type: TypeNotification;
        destinataires: string[];
        sujet: string;
        contenu: string;
        priorite: PrioriteNotification;
        etablissementId?: string;
        data?: Record<string, any>;
    }): Promise<Notification> {
        const notification = this.notificationRepo.create({
            type: params.type,
            destinataire: params.destinataires.join(', '),
            sujet: params.sujet,
            contenu: params.contenu,
            priorite: params.priorite,
            statut: StatutNotification.EN_ATTENTE,
            etablissementId: params.etablissementId,
            donnees: params.data ? JSON.stringify(params.data) : undefined,
        } as any);

        return await this.notificationRepo.save(notification);
    }
}

export const notificationOrchestrator = new NotificationOrchestratorService();
export default NotificationOrchestratorService;
