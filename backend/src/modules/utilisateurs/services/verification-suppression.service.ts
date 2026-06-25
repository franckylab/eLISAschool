/**
 * ==================================
 * eLISAschool - Service de Vérification de Suppression Utilisateur
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Service dédié à la vérification des impacts avant suppression d'un utilisateur.
 * Vérifie les relations directes, indirectes (via MembrePersonnel), et les éléments critiques.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import {
    VerificationSuppressionResponse,
    Impacts,
    ElementsCritiques,
} from '../dto';

interface UtilisateurInfo {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    roles: string[];
    statut: string;
}

export class VerificationSuppressionService {
    /**
     * Safely get the numeric value from an ImpactCategorie
     */
    private getNombre(impact: any): number {
        if (typeof impact === 'number') {
            return impact;
        }
        return impact?.nombre || 0;
    }
    /**
     * Vérifie tous les impacts liés à la suppression d'un utilisateur
     * 
     * @param utilisateurId ID de l'utilisateur à supprimer
     * @param etablissementId Optionnel - contexte établissement pour filtrage
     * @param permissions Liste des permissions de l'utilisateur connecté
     * @returns Structure complète avec impacts, éléments critiques et permissions
     */
    async verifierSuppression(
        utilisateurId: string,
        etablissementId?: string,
        permissions?: string[]
    ): Promise<VerificationSuppressionResponse> {
        // 1. Récupérer les informations de l'utilisateur
        const utilisateurInfo = await this.getUtilisateurInfo(utilisateurId);

        // 2. Si pas de contexte établissement, retourner message guidage
        if (!etablissementId) {
            return this.creerReponseSansContexte(utilisateurInfo);
        }

        // 3. Vérifier toutes les catégories d'impacts
        const impacts = await this.verifierImpacts(utilisateurId, etablissementId);
        const elementsCritiques = await this.verifierElementsCritiques(utilisateurId, etablissementId);

        // 4. Calculer les totaux
        const resume = this.calculerResume(impacts, elementsCritiques);

        // 5. Vérifier les permissions
        const peutSoftDelete = permissions?.includes('utilisateurs:delete') || 
                               permissions?.includes('super_admin:all') || false;
        const peutCascadeDelete = permissions?.includes('super_admin:all') || false;

        // 6. Déterminer si suppression possible et mode recommandé
        const blocageTotal = elementsCritiques.nombreTotal > 0;
        const peutSupprimer = peutSoftDelete && !blocageTotal;
        const modeRecommande = blocageTotal ? 'aucun' : (peutCascadeDelete ? 'cascade' : 'soft');
        const raisonBlocage = blocageTotal 
            ? `${elementsCritiques.nombreTotal} élément(s) critique(s) empêchent la suppression en cascade`
            : undefined;

        return {
            utilisateur: utilisateurInfo,
            contexte: {
                etablissementId,
                aEtablissementContexte: true,
            },
            impacts,
            elementsCritiques,
            permissions: {
                peutSoftDelete,
                peutCascadeDelete,
                permissionRequiseSoft: 'utilisateurs:delete',
                permissionRequiseCascade: 'super_admin:all',
            },
            resume,
            peutSupprimer,
            modeRecommande,
            blocageTotal,
            raisonBlocage,
        };
    }

    /**
     * Récupère les informations de base d'un utilisateur
     */
    private async getUtilisateurInfo(utilisateurId: string): Promise<UtilisateurInfo> {
        const query = `
            SELECT 
                u.id,
                u.email,
                u.statut,
                u.pseudonyme,
                u.role,
                p.nom,
                p.prenom
            FROM utilisateurs u
            LEFT JOIN profils_utilisateurs p ON p."utilisateurId" = u.id
            WHERE u.id = $1
        `;

        const result = await AppDataSource.query(query, [utilisateurId]);
        
        if (result.length === 0) {
            throw new AppError('Utilisateur non trouvé', 404, 'NOT_FOUND');
        }

        const row = result[0];
        return {
            id: row.id,
            nom: row.nom || '',
            prenom: row.prenom || '',
            email: row.email,
            roles: row.role ? [row.role] : [],
            statut: row.statut,
        };
    }

    /**
     * Crée une réponse quand il n'y a pas de contexte établissement
     */
    private creerReponseSansContexte(utilisateur: UtilisateurInfo): VerificationSuppressionResponse {
        return {
            utilisateur,
            contexte: {
                aEtablissementContexte: false,
            },
            impacts: this.creerImpactsVides(),
            elementsCritiques: this.creerElementsCritiquesVides(),
            permissions: {
                peutSoftDelete: false,
                peutCascadeDelete: false,
                permissionRequiseSoft: 'utilisateurs:delete',
                permissionRequiseCascade: 'super_admin:all',
            },
            resume: this.creerResumeVide(),
            peutSupprimer: false,
            modeRecommande: 'aucun',
            blocageTotal: false,
            raisonBlocage: 'Veuillez sélectionner un établissement pour voir les impacts détaillés',
        };
    }

    /**
     * Vérifie tous les impacts par catégorie
     */
    private async verifierImpacts(
        utilisateurId: string,
        etablissementId: string
    ): Promise<Impacts> {
        // Rechercher le MembrePersonnel lié (pour relations indirectes)
        const membrePersonnelRepo = AppDataSource.getRepository('MembrePersonnel');
        const membrePersonnel = await membrePersonnelRepo.findOne({
            where: { utilisateurId }
        });

        const impacts: Impacts = {
            // Relations directes CASCADE
            profilUtilisateur: await this.countDirect('ProfilUtilisateur', { utilisateurId }),
            permissions: await this.countDirect('UtilisateurPermission', { utilisateurId }),
            // Rôle stocké directement dans utilisateurs.role - pas de table de jointure
            roles: { nombre: 1 }, // Toujours 1 car le rôle est dans la table utilisateurs
            refreshTokens: await this.countDirect('RefreshToken', { utilisateurId }),
            preferences: await this.countDirect('PreferenceUtilisateur', { utilisateurId }),
            dashboardLayouts: await this.countDirect('DashboardLayout', { utilisateurId }),

            // Relations directes SANS CASCADE
            membrePersonnel: { nombre: membrePersonnel ? 1 : 0 },
            responsableEleves: await this.countResponsableEleves(utilisateurId),
            eleves: await this.countEleves(utilisateurId, etablissementId),
            auditLogs: await this.countDirect('AuditLog', { utilisateurId }),
            
            // Données métier créées (via MembrePersonnel si existe)
            notesCreees: membrePersonnel 
                ? await this.countViaMembrePersonnel('Note', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            bulletinsGeneres: membrePersonnel
                ? await this.countBulletinsGeneres(membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            presencesEnregistrees: membrePersonnel
                ? await this.countViaMembrePersonnel('Presence', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            absencesEnregistrees: membrePersonnel
                ? await this.countViaMembrePersonnel('Absence', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            retardsEnregistres: membrePersonnel
                ? await this.countViaMembrePersonnel('Retard', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            paiementsRecus: await this.countPaiementsRecus(utilisateurId, etablissementId),
            transactionsCantine: await this.countTransactionsCantine(utilisateurId, etablissementId),
            transactionsTransport: await this.countTransactionsTransport(utilisateurId, etablissementId),
            messagesEnvoyes: await this.countMessagesEnvoyes(utilisateurId),
            conversationsCreees: await this.countConversationsCreees(utilisateurId),
            annoncesCreees: await this.countAnnoncesCreees(utilisateurId, etablissementId),
            sondagesCrees: await this.countSondagesCrees(utilisateurId, etablissementId),
            requetesTraitees: await this.countRequetesTraitees(utilisateurId, etablissementId),
            tachesAssignees: await this.countTachesAssignees(utilisateurId, etablissementId),
            evaluationsPersonnel: membrePersonnel
                ? await this.countViaMembrePersonnel('EvaluationPersonnel', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            // Ces entités n'ont pas de champ createurId/auteurId - elles sont liées via MembrePersonnel
            sanctionsEleves: membrePersonnel
                ? await this.countViaMembrePersonnel('SanctionEleve', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            observationsEleves: membrePersonnel
                ? await this.countViaMembrePersonnel('ObservationEleve', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            felicitationsEleves: membrePersonnel
                ? await this.countViaMembrePersonnel('FelicitationEleve', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            consultationsMedicales: membrePersonnel
                ? await this.countViaMembrePersonnel('ConsultationMedicale', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            incidentsEleves: await this.countIncidentsEleves(utilisateurId, etablissementId),
            incidentsPersonnel: await this.countIncidentsPersonnel(utilisateurId, etablissementId),
            
            // Gamification - ces entités n'existent pas dans ce projet
            pointsUtilisateur: { nombre: 0 },
            badgesUtilisateur: await this.countDirect('BadgeUtilisateur', { utilisateurId }),
            historiquePoints: { nombre: 0 },
            historiqueScores: membrePersonnel
                ? await this.countViaMembrePersonnel('HistoriqueScorePersonnel', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            
            // Emploi du temps et enseignement
            emploiDuTemps: membrePersonnel
                ? await this.countViaMembrePersonnel('EmploiDuTemps', membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            classesResponsabilisees: membrePersonnel
                ? await this.countClassesResponsabilisees(membrePersonnel.id, etablissementId)
                : { nombre: 0 },
            matieresEnseignees: membrePersonnel
                ? await this.countMatieresEnseignees(membrePersonnel.id, etablissementId)
                : { nombre: 0 },
        };

        // Logs détaillés pour débogage
        logger.info(`[VerificationSuppression] Résultats pour utilisateur ${utilisateurId}:`, {
            profilUtilisateur: this.getNombre(impacts.profilUtilisateur),
            permissionsDirectes: this.getNombre(impacts.permissions),
            roles: this.getNombre(impacts.roles),
            refreshTokens: this.getNombre(impacts.refreshTokens),
            preferences: this.getNombre(impacts.preferences),
            dashboardLayouts: this.getNombre(impacts.dashboardLayouts),
            membrePersonnel: this.getNombre(impacts.membrePersonnel),
            responsableEleves: this.getNombre(impacts.responsableEleves),
            elevesDirects: this.getNombre(impacts.eleves),
            auditLogs: this.getNombre(impacts.auditLogs),
            notesCreees: this.getNombre(impacts.notesCreees),
            bulletinsGeneres: this.getNombre(impacts.bulletinsGeneres),
            presencesEnregistrees: this.getNombre(impacts.presencesEnregistrees),
            absencesEnregistrees: this.getNombre(impacts.absencesEnregistrees),
            retardsEnregistres: this.getNombre(impacts.retardsEnregistres),
            paiementsRecus: this.getNombre(impacts.paiementsRecus),
            transactionsCantine: this.getNombre(impacts.transactionsCantine),
            transactionsTransport: this.getNombre(impacts.transactionsTransport),
            messagesEnvoyes: this.getNombre(impacts.messagesEnvoyes),
            conversationsCreees: this.getNombre(impacts.conversationsCreees),
            annoncesCreees: this.getNombre(impacts.annoncesCreees),
            sondagesCrees: this.getNombre(impacts.sondagesCrees),
            requetesTraitees: this.getNombre(impacts.requetesTraitees),
            tachesAssignees: this.getNombre(impacts.tachesAssignees),
            evaluationsPersonnel: this.getNombre(impacts.evaluationsPersonnel),
            sanctionsEleves: this.getNombre(impacts.sanctionsEleves),
            observationsEleves: this.getNombre(impacts.observationsEleves),
            felicitationsEleves: this.getNombre(impacts.felicitationsEleves),
            consultationsMedicales: this.getNombre(impacts.consultationsMedicales),
            incidentsEleves: this.getNombre(impacts.incidentsEleves),
            incidentsPersonnel: this.getNombre(impacts.incidentsPersonnel),
            badgesUtilisateur: this.getNombre(impacts.badgesUtilisateur),
            historiqueScores: this.getNombre(impacts.historiqueScores),
            emploiDuTemps: this.getNombre(impacts.emploiDuTemps),
            classesResponsabilisees: this.getNombre(impacts.classesResponsabilisees),
            matieresEnseignees: this.getNombre(impacts.matieresEnseignees),
        });

        // Calculer le total
        const total = Object.values(impacts).reduce((sum: number, impact) => {
            return sum + this.getNombre(impact);
        }, 0);
        
        logger.info(`[VerificationSuppression] Total éléments liés: ${total}`);

        return impacts;
    }

    /**
     * Vérifie les éléments critiques bloquants
     */
    private async verifierElementsCritiques(
        utilisateurId: string,
        etablissementId: string
    ): Promise<ElementsCritiques> {
        const membrePersonnelRepo = AppDataSource.getRepository('MembrePersonnel');
        const membrePersonnel = await membrePersonnelRepo.findOne({
            where: { utilisateurId }
        });

        // Notes dans bulletins publiés
        const notesDansBulletinsPublies = membrePersonnel
            ? await this.countNotesDansBulletinsPublies(membrePersonnel.id, etablissementId)
            : 0;

        // Bulletins validés
        const bulletinsValidates = membrePersonnel
            ? await this.countBulletinsValidates(membrePersonnel.id, etablissementId)
            : 0;

        // Paiements comptabilisés
        const paiementsComptabilises = await this.countPaiementsComptabilises(utilisateurId, etablissementId);

        // Transactions validées (cantine/transport)
        const transactionsValidees = await this.countTransactionsValidees(utilisateurId, etablissementId);

        // Clôtures de périodes
        const cloturesPeriodes = await this.countCloturesPeriodes(utilisateurId, etablissementId);

        // Évaluations finalisées
        const evaluationsFinalisees = membrePersonnel
            ? await this.countEvaluationsFinalisees(membrePersonnel.id, etablissementId)
            : 0;

        const nombreTotal = 
            notesDansBulletinsPublies +
            bulletinsValidates +
            paiementsComptabilises +
            transactionsValidees +
            cloturesPeriodes +
            evaluationsFinalisees;

        return {
            nombreTotal,
            notesDansBulletinsPublies,
            bulletinsValidates,
            paiementsComptabilises,
            transactionsValidees,
            cloturesPeriodes,
            evaluationsFinalisees,
        };
    }

    // ============================================================
    // MÉTHODES UTILITAIRES DE COMPTAGE
    // ============================================================

    /**
     * Comptage direct sur une entité avec filtre utilisateurId
     */
    private async countDirect(entityName: string, where: any): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository(entityName);
            const count = await repo.count({ where });
            return { nombre: count };
        } catch (error) {
            logger.warn(`[VerificationSuppression] Erreur comptage ${entityName}:`, error);
            return { nombre: 0 };
        }
    }

    /**
     * Comptage via MembrePersonnel (relations indirectes)
     */
    private async countViaMembrePersonnel(
        entityName: string,
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository(entityName);
            const count = await repo.count({
                where: {
                    enseignantId: membrePersonnelId,
                    etablissementId
                }
            });
            return { nombre: count };
        } catch (error) {
            logger.warn(`[VerificationSuppression] Erreur comptage ${entityName}:`, error);
            return { nombre: 0 };
        }
    }

    /**
     * Comptage via créateur (auteurId/createurId/utilisateurId)
     */
    private async countViaCreateur(
        entityName: string,
        utilisateurId: string,
        etablissementId: string,
        createurFieldName: string = 'createurId'
    ): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository(entityName);
            const count = await repo.count({
                where: {
                    [createurFieldName]: utilisateurId,
                    etablissementId
                }
            });
            return { nombre: count };
        } catch (error) {
            logger.warn(`[VerificationSuppression] Erreur comptage ${entityName}:`, error);
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des élèves dont l'utilisateur est responsable
     */
    private async countResponsableEleves(utilisateurId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('ResponsableEleve');
            const count = await repo.count({
                where: { utilisateurId, actif: true }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des élèves dans l'établissement
     */
    private async countEleves(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Eleve');
            const count = await repo.count({
                where: { utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des bulletins générés
     */
    private async countBulletinsGeneres(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<{ nombre: number }> {
        try {
            // Bulletins via les notes de l'enseignant
            const query = `
                SELECT COUNT(DISTINCT b.id)
                FROM bulletins b
                INNER JOIN notes n ON n."bulletinId" = b.id
                WHERE n."enseignantId" = $1
                AND b."etablissementId" = $2
            `;
            const result = await AppDataSource.query(query, [membrePersonnelId, etablissementId]);
            return { nombre: parseInt(result[0]?.count || '0') };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des paiements reçus
     */
    private async countPaiementsRecus(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Paiement');
            const count = await repo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId 
                }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des transactions cantine
     */
    private async countTransactionsCantine(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('TransactionCantine');
            const count = await repo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId 
                }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des transactions transport
     */
    private async countTransactionsTransport(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('TransactionTransport');
            const count = await repo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId 
                }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des messages envoyés
     */
    private async countMessagesEnvoyes(utilisateurId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Message');
            const count = await repo.count({
                where: { expediteurId: utilisateurId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des conversations créées
     */
    private async countConversationsCreees(utilisateurId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Conversation');
            const count = await repo.count({
                where: { createurId: utilisateurId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des annonces créées
     */
    private async countAnnoncesCreees(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Annonce');
            const count = await repo.count({
                where: { createurId: utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des sondages créés
     */
    private async countSondagesCrees(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Sondage');
            const count = await repo.count({
                where: { auteurId: utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des requêtes traitées
     */
    private async countRequetesTraitees(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Requete');
            const count = await repo.count({
                where: { traiteParId: utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des tâches assignées
     */
    private async countTachesAssignees(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Tache');
            const count = await repo.count({
                where: { assigneeAId: utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des incidents élèves
     */
    private async countIncidentsEleves(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            // IncidentEleve est lié via MembrePersonnel, pas directement à utilisateurId
            const membreRepo = AppDataSource.getRepository('MembrePersonnel');
            const membre = await membreRepo.findOne({
                where: { utilisateurId }
            });
            
            if (!membre) {
                return { nombre: 0 };
            }

            const repo = AppDataSource.getRepository('IncidentEleve');
            const count = await repo.count({
                where: { declareParId: membre.id, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des incidents personnel
     */
    private async countIncidentsPersonnel(utilisateurId: string, etablissementId: string): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('IncidentPersonnel');
            const count = await repo.count({
                where: { signaleParId: utilisateurId, etablissementId }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des classes responsabilisées
     */
    private async countClassesResponsabilisees(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('Classe');
            const count = await repo.count({
                where: { 
                    professeurPrincipalId: membrePersonnelId,
                    etablissementId 
                }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    /**
     * Comptage des matières enseignées
     */
    private async countMatieresEnseignees(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<{ nombre: number }> {
        try {
            const repo = AppDataSource.getRepository('AffectationMatiere');
            const count = await repo.count({
                where: { 
                    enseignantId: membrePersonnelId,
                    etablissementId 
                }
            });
            return { nombre: count };
        } catch (error) {
            return { nombre: 0 };
        }
    }

    // ============================================================
    // MÉTHODES ÉLÉMENTS CRITIQUES
    // ============================================================

    /**
     * Comptage des notes dans des bulletins publiés
     */
    private async countNotesDansBulletinsPublies(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const query = `
                SELECT COUNT(DISTINCT n.id)
                FROM notes n
                INNER JOIN bulletins b ON b.id = n."bulletinId"
                WHERE n."enseignantId" = $1
                AND b."etablissementId" = $2
                AND b.statut IN ('PUBLIE', 'VALIDE', 'CLOTURE')
            `;
            const result = await AppDataSource.query(query, [membrePersonnelId, etablissementId]);
            return parseInt(result[0]?.count || '0');
        } catch (error) {
            return 0;
        }
    }

    /**
     * Comptage des bulletins validés
     */
    private async countBulletinsValidates(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const query = `
                SELECT COUNT(DISTINCT b.id)
                FROM bulletins b
                INNER JOIN notes n ON n."bulletinId" = b.id
                WHERE n."enseignantId" = $1
                AND b."etablissementId" = $2
                AND b.statut IN ('VALIDE', 'CLOTURE')
            `;
            const result = await AppDataSource.query(query, [membrePersonnelId, etablissementId]);
            return parseInt(result[0]?.count || '0');
        } catch (error) {
            return 0;
        }
    }

    /**
     * Comptage des paiements comptabilisés
     */
    private async countPaiementsComptabilises(
        utilisateurId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const repo = AppDataSource.getRepository('Paiement');
            const count = await repo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId,
                    statut: 'COMPTABILISE'
                }
            });
            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Comptage des transactions validées
     */
    private async countTransactionsValidees(
        utilisateurId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const cantineRepo = AppDataSource.getRepository('TransactionCantine');
            const cantineCount = await cantineRepo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId,
                    statut: 'VALIDEE'
                }
            });

            const transportRepo = AppDataSource.getRepository('TransactionTransport');
            const transportCount = await transportRepo.count({
                where: { 
                    traitePar: utilisateurId,
                    etablissementId,
                    statut: 'VALIDEE'
                }
            });

            return cantineCount + transportCount;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Comptage des clôtures de périodes
     */
    private async countCloturesPeriodes(
        utilisateurId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const repo = AppDataSource.getRepository('CloturePeriode');
            const count = await repo.count({
                where: { 
                    clotureParId: utilisateurId,
                    etablissementId 
                }
            });
            return count;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Comptage des évaluations finalisées
     */
    private async countEvaluationsFinalisees(
        membrePersonnelId: string,
        etablissementId: string
    ): Promise<number> {
        try {
            const repo = AppDataSource.getRepository('EvaluationPersonnel');
            const count = await repo.count({
                where: { 
                    evalueId: membrePersonnelId,
                    etablissementId,
                    statut: 'FINALISEE'
                }
            });
            return count;
        } catch (error) {
            return 0;
        }
    }

    // ============================================================
    // MÉTHODES UTILITAIRES
    // ============================================================

    /**
     * Crée un objet impacts vide
     */
    private creerImpactsVides(): Impacts {
        return {
            profilUtilisateur: { nombre: 0 },
            permissions: { nombre: 0 },
            roles: { nombre: 0 },
            refreshTokens: { nombre: 0 },
            preferences: { nombre: 0 },
            dashboardLayouts: { nombre: 0 },
            membrePersonnel: { nombre: 0 },
            responsableEleves: { nombre: 0 },
            eleves: { nombre: 0 },
            auditLogs: { nombre: 0 },
            notesCreees: { nombre: 0 },
            bulletinsGeneres: { nombre: 0 },
            presencesEnregistrees: { nombre: 0 },
            absencesEnregistrees: { nombre: 0 },
            retardsEnregistres: { nombre: 0 },
            paiementsRecus: { nombre: 0 },
            transactionsCantine: { nombre: 0 },
            transactionsTransport: { nombre: 0 },
            messagesEnvoyes: { nombre: 0 },
            conversationsCreees: { nombre: 0 },
            annoncesCreees: { nombre: 0 },
            sondagesCrees: { nombre: 0 },
            requetesTraitees: { nombre: 0 },
            tachesAssignees: { nombre: 0 },
            evaluationsPersonnel: { nombre: 0 },
            sanctionsEleves: { nombre: 0 },
            observationsEleves: { nombre: 0 },
            felicitationsEleves: { nombre: 0 },
            consultationsMedicales: { nombre: 0 },
            incidentsEleves: { nombre: 0 },
            incidentsPersonnel: { nombre: 0 },
            pointsUtilisateur: { nombre: 0 },
            badgesUtilisateur: { nombre: 0 },
            historiquePoints: { nombre: 0 },
            historiqueScores: { nombre: 0 },
            emploiDuTemps: { nombre: 0 },
            classesResponsabilisees: { nombre: 0 },
            matieresEnseignees: { nombre: 0 },
        };
    }

    /**
     * Crée un objet elementsCritiques vide
     */
    private creerElementsCritiquesVides(): ElementsCritiques {
        return {
            nombreTotal: 0,
            notesDansBulletinsPublies: 0,
            bulletinsValidates: 0,
            paiementsComptabilises: 0,
            transactionsValidees: 0,
            cloturesPeriodes: 0,
            evaluationsFinalisees: 0,
        };
    }

    /**
     * Crée un objet resume vide
     */
    private creerResumeVide(): any {
        return {
            totalElementsDirects: 0,
            totalElementsIndirects: 0,
            totalElementsMetier: 0,
            totalElementsCritiques: 0,
            totalGeneral: 0,
            categoriesAvecElements: 0,
        };
    }

    /**
     * Calcule le résumé global
     */
    private calculerResume(impacts: Impacts, elementsCritiques: ElementsCritiques): any {
        const totalElementsDirects = 
            this.getNombre(impacts.profilUtilisateur) +
            this.getNombre(impacts.permissions) +
            this.getNombre(impacts.roles) +
            this.getNombre(impacts.refreshTokens) +
            this.getNombre(impacts.preferences) +
            this.getNombre(impacts.dashboardLayouts) +
            this.getNombre(impacts.membrePersonnel) +
            this.getNombre(impacts.responsableEleves) +
            this.getNombre(impacts.eleves) +
            this.getNombre(impacts.auditLogs);

        const totalElementsIndirects = 
            this.getNombre(impacts.emploiDuTemps) +
            this.getNombre(impacts.classesResponsabilisees) +
            this.getNombre(impacts.matieresEnseignees) +
            this.getNombre(impacts.evaluationsPersonnel) +
            this.getNombre(impacts.historiqueScores);

        const totalElementsMetier = 
            this.getNombre(impacts.notesCreees) +
            this.getNombre(impacts.bulletinsGeneres) +
            this.getNombre(impacts.presencesEnregistrees) +
            this.getNombre(impacts.absencesEnregistrees) +
            this.getNombre(impacts.retardsEnregistres) +
            this.getNombre(impacts.paiementsRecus) +
            this.getNombre(impacts.transactionsCantine) +
            this.getNombre(impacts.transactionsTransport) +
            this.getNombre(impacts.messagesEnvoyes) +
            this.getNombre(impacts.conversationsCreees) +
            this.getNombre(impacts.annoncesCreees) +
            this.getNombre(impacts.sondagesCrees) +
            this.getNombre(impacts.requetesTraitees) +
            this.getNombre(impacts.tachesAssignees) +
            this.getNombre(impacts.sanctionsEleves) +
            this.getNombre(impacts.observationsEleves) +
            this.getNombre(impacts.felicitationsEleves) +
            this.getNombre(impacts.consultationsMedicales) +
            this.getNombre(impacts.incidentsEleves) +
            this.getNombre(impacts.incidentsPersonnel) +
            this.getNombre(impacts.pointsUtilisateur) +
            this.getNombre(impacts.badgesUtilisateur) +
            this.getNombre(impacts.historiquePoints);

        const totalGeneral = totalElementsDirects + totalElementsIndirects + totalElementsMetier;
        
        let categoriesAvecElements = 0;
        Object.values(impacts).forEach((impact) => {
            const nombre = this.getNombre(impact);
            if (nombre > 0) {
                categoriesAvecElements++;
            }
        });

        return {
            totalElementsDirects,
            totalElementsIndirects,
            totalElementsMetier,
            totalElementsCritiques: elementsCritiques.nombreTotal,
            totalGeneral,
            categoriesAvecElements,
        };
    }
}

// Singleton export
export const verificationSuppressionService = new VerificationSuppressionService();
