/**
 * ==================================
 * eLISAschool - Service Dunning (Relances Automatiques)
 * ==================================
 * 
 * Gestion des relances automatiques pour les factures impayées.
 * - J+3 : Première relance (email + notification in-app)
 * - J+7 : Deuxième relance (email + SMS)
 * - J+15 : Troisième relance (email + SMS + notification urgente)
 * - J+30 : Suspension automatique de l'abonnement
 * 
 * Phase B.4 — Refonte SaaS v2
 */

import { Repository, LessThanOrEqual, MoreThan } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { Facture, StatutFacture } from '../entities/facture.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { NotificationOrchestratorService } from '@modules/notifications/services/notification-orchestrator.service';
import { TypeNotification } from '@modules/notifications/entities';

export enum NiveauRelance {
    PREMIERE = 1,   // J+3
    DEUXIEME = 2,   // J+7
    TROISIEME = 3,  // J+15
    SUSPENSION = 4, // J+30
}

export interface RelanceResult {
    factureId: string;
    niveau: NiveauRelance;
    joursRetard: number;
    action: string;
}

export class DunningService {
    private factureRepo: Repository<Facture>;
    private abonnementRepo: Repository<AbonnementClient>;
    private orchestrator: NotificationOrchestratorService;

    constructor(orchestrator?: NotificationOrchestratorService) {
        this.factureRepo = AppDataSource.getRepository(Facture);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.orchestrator = orchestrator ?? new NotificationOrchestratorService();
    }

    /**
     * Exécute le processus de dunning — à appeler quotidiennement (cron).
     * Vérifie toutes les factures en retard et applique les relances appropriées.
     */
    async executerDunningQuotidien(): Promise<RelanceResult[]> {
        const results: RelanceResult[] = [];
        const now = new Date();

        // Trouver toutes les factures émises ou en retard non payées
        const facturesEnRetard = await this.factureRepo
            .createQueryBuilder('f')
            .where('f.statut IN (:...statuts)', {
                statuts: [StatutFacture.EMISE, StatutFacture.EN_RETARD],
            })
            .andWhere('f.dateEcheance < :now', { now: now.toISOString().split('T')[0] })
            .getMany();

        for (const facture of facturesEnRetard) {
            const joursRetard = Math.floor(
                (now.getTime() - new Date(facture.dateEcheance).getTime()) / (1000 * 60 * 60 * 24)
            );

            // Mettre à jour le nombre de jours de retard
            facture.nombreJoursRetard = joursRetard;

            try {
                if (joursRetard >= 30 && facture.nombreRelances < NiveauRelance.SUSPENSION) {
                    // SUSPENSION — J+30
                    const result = await this.suspendreAbonnement(facture, joursRetard);
                    results.push(result);
                } else if (joursRetard >= 15 && facture.nombreRelances < NiveauRelance.TROISIEME) {
                    // Troisième relance — J+15
                    const result = await this.envoyerRelance(facture, NiveauRelance.TROISIEME, joursRetard);
                    results.push(result);
                } else if (joursRetard >= 7 && facture.nombreRelances < NiveauRelance.DEUXIEME) {
                    // Deuxième relance — J+7
                    const result = await this.envoyerRelance(facture, NiveauRelance.DEUXIEME, joursRetard);
                    results.push(result);
                } else if (joursRetard >= 3 && facture.nombreRelances < NiveauRelance.PREMIERE) {
                    // Première relance — J+3
                    const result = await this.envoyerRelance(facture, NiveauRelance.PREMIERE, joursRetard);
                    results.push(result);
                }

                // Marquer en retard si pas déjà fait
                if (facture.statut === StatutFacture.EMISE && joursRetard > 0) {
                    facture.statut = StatutFacture.EN_RETARD;
                }

                await this.factureRepo.save(facture);
            } catch (error) {
                logger.error(`[Dunning] Erreur relance facture ${facture.id}:`, error);
            }
        }

        if (results.length > 0) {
            logger.info(`[Dunning] ${results.length} relances effectuées — ${results.filter(r => r.niveau === NiveauRelance.SUSPENSION).length} suspensions`);
        }

        return results;
    }

    /**
     * Envoie une relance pour une facture donnée.
     */
    private async envoyerRelance(
        facture: Facture,
        niveau: NiveauRelance,
        joursRetard: number
    ): Promise<RelanceResult> {
        const now = new Date();
        facture.nombreRelances = niveau;
        facture.dateDerniereRelance = now;

        const messages: Record<number, string> = {
            [NiveauRelance.PREMIERE]: 'Première relance — email + notification in-app',
            [NiveauRelance.DEUXIEME]: 'Deuxième relance — email + SMS',
            [NiveauRelance.TROISIEME]: 'Troisième relance — email + SMS + notification urgente',
        };

        const action = messages[niveau] || `Relance niveau ${niveau}`;

        // Envoyer les notifications via l'orchestrator (non-bloquant)
        try {
            const canauxParNiveau: Record<number, TypeNotification[]> = {
                [NiveauRelance.PREMIERE]: [TypeNotification.EMAIL, TypeNotification.IN_APP],
                [NiveauRelance.DEUXIEME]: [TypeNotification.EMAIL, TypeNotification.SMS],
                [NiveauRelance.TROISIEME]: [TypeNotification.EMAIL, TypeNotification.SMS, TypeNotification.IN_APP],
            };

            await this.orchestrator.envoyerAlerteRetardPaiement(
                [facture.etablissementId], // Les admins de l'établissement seront résolus par l'orchestrator
                facture.numero,
                facture.montantTotal,
                joursRetard,
                facture.etablissementId,
            );
        } catch (notifError) {
            logger.warn(
                `[Dunning] Échec envoi notifications pour facture ${facture.numero} (non bloquant)`,
                notifError
            );
        }

        logger.info(
            `[Dunning] ${action} — Facture: ${facture.numero} ` +
            `— J+${joursRetard} — Montant: ${facture.montantTotal} XAF`
        );

        return {
            factureId: facture.id,
            niveau,
            joursRetard,
            action,
        };
    }

    /**
     * Suspend l'abonnement d'un établissement pour facture impayée à J+30.
     */
    private async suspendreAbonnement(
        facture: Facture,
        joursRetard: number
    ): Promise<RelanceResult> {
        const now = new Date();
        facture.nombreRelances = NiveauRelance.SUSPENSION;
        facture.dateDerniereRelance = now;
        facture.dateSuspension = now;

        // Suspendre l'abonnement
        const abonnement = await this.abonnementRepo.findOne({
            where: { id: facture.abonnementId },
        });

        if (abonnement && abonnement.statut === StatutAbonnement.ACTIF) {
            abonnement.statut = StatutAbonnement.SUSPENDU;
            await this.abonnementRepo.save(abonnement);

            // Notification de suspension (non-bloquant)
            try {
                await this.orchestrator.envoyerMultiCanal({
                    destinataires: [facture.etablissementId],
                    canaux: [TypeNotification.EMAIL, TypeNotification.SMS, TypeNotification.IN_APP],
                    sujet: '⚠️ Abonnement suspendu — Paiement en retard',
                    contenu: `Votre abonnement eLISAschool a été suspendu en raison d'un paiement en retard de ${joursRetard} jours. ` +
                        `Facture ${facture.numero} — Montant: ${facture.montantTotal} XAF. ` +
                        `Veuillez régulariser votre situation pour réactiver votre accès.`,
                    etablissementId: facture.etablissementId,
                });
            } catch (notifError) {
                logger.warn(
                    `[Dunning] Échec notification suspension pour ${facture.numero} (non bloquant)`,
                    notifError
                );
            }

            logger.warn(
                `[Dunning] 🚨 Abonnement suspendu — Facture: ${facture.numero} ` +
                `— Établissement: ${facture.etablissementId} — J+${joursRetard} ` +
                `— Montant impayé: ${facture.montantTotal} XAF`
            );
        }

        return {
            factureId: facture.id,
            niveau: NiveauRelance.SUSPENSION,
            joursRetard,
            action: 'Suspension automatique — abonnement passé en SUSPENDU',
        };
    }

    /**
     * Réactive un abonnement après paiement d'une facture suspendue.
     */
    async reactiverAbonnement(factureId: string): Promise<void> {
        const facture = await this.factureRepo.findOne({
            where: { id: factureId },
        });

        if (!facture) return;

        const abonnement = await this.abonnementRepo.findOne({
            where: { id: facture.abonnementId },
        });

        if (abonnement && abonnement.statut === StatutAbonnement.SUSPENDU) {
            abonnement.statut = StatutAbonnement.ACTIF;
            await this.abonnementRepo.save(abonnement);

            logger.info(
                `[Dunning] Abonnement réactivé — Facture: ${facture.numero} ` +
                `— Établissement: ${facture.etablissementId}`
            );
        }
    }

    /**
     * Récupère les statistiques de dunning.
     */
    async getStatistiquesDunning(): Promise<{
        facturesEnRetard: number;
        totalImpaye: number;
        relancesEnvoyees: number;
        suspensionsActives: number;
    }> {
        const facturesEnRetard = await this.factureRepo.count({
            where: { statut: StatutFacture.EN_RETARD },
        });

        const totalImpayeResult = await this.factureRepo
            .createQueryBuilder('f')
            .select('SUM(f.montantTotal - f.montantPaye)', 'total')
            .where('f.statut IN (:...statuts)', {
                statuts: [StatutFacture.EMISE, StatutFacture.EN_RETARD],
            })
            .getRawOne();

        const suspensionsActives = await this.abonnementRepo.count({
            where: { statut: StatutAbonnement.SUSPENDU },
        });

        const relancesEnvoyees = await this.factureRepo
            .createQueryBuilder('f')
            .select('SUM(f.nombreRelances)', 'total')
            .where('f.nombreRelances > 0')
            .getRawOne();

        return {
            facturesEnRetard,
            totalImpaye: Math.round(Number(totalImpayeResult?.total) || 0),
            relancesEnvoyees: Math.round(Number(relancesEnvoyees?.total) || 0),
            suspensionsActives,
        };
    }
}

export default DunningService;

// Singleton — instance partagée (évite les instanciations multiples)
export const dunningService = new DunningService();
