/**
 * ==================================
 * eLISAschool - Service Dashboard Data
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Centralise toutes les méthodes de récupération de données pour les widgets
 * sans modifier les services existants
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { Eleve } from '@modules/eleves/entities';
import { Note } from '@modules/notes/entities';
import Utilisateur from '@modules/auth/entities/utilisateur.entity';
import { ConfigurationModule } from '@modules/configuration/entities';
import { validationWorkflowService } from '@modules/validation-workflow/services';

export class DashboardDataService {
    private eleveRepo: Repository<Eleve>;
    private noteRepo: Repository<Note>;
    private utilisateurRepo: Repository<Utilisateur>;
    private moduleRepo: Repository<ConfigurationModule>;

    constructor() {
        this.eleveRepo = AppDataSource.getRepository(Eleve);
        this.noteRepo = AppDataSource.getRepository(Note);
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        this.moduleRepo = AppDataSource.getRepository(ConfigurationModule);
    }

    // ==================================
    // WIDGETS ÉLÈVES
    // ==================================

    async getElevesStats(context: { etablissementId?: string }): Promise<any> {
        try {
            const where: any = {};
            if (context.etablissementId) {
                where.etablissementId = context.etablissementId;
            }

            const total = await this.eleveRepo.count({ where });
            const actifs = await this.eleveRepo.count({ where: { ...where, statut: 'ACTIF' } });
            const inactifs = await this.eleveRepo.count({ where: { ...where, statut: 'INACTIF' } });
            const males = await this.eleveRepo.count({ where: { ...where, genre: 'M' } });
            const females = await this.eleveRepo.count({ where: { ...where, genre: 'F' } });

            return {
                total,
                actifs,
                inactifs,
                parGenre: {
                    masculin: males,
                    feminin: females,
                }
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getElevesStats:', error);
            return { total: 0, actifs: 0, inactifs: 0, parGenre: { masculin: 0, feminin: 0 } };
        }
    }

    async getElevesRepartitionClasse(context: { etablissementId?: string }): Promise<any> {
        try {
            const qb = this.eleveRepo
                .createQueryBuilder('e')
                .leftJoin('e.classe', 'c')
                .select('c.libelle', 'nom')
                .addSelect('COUNT(e.id)', 'effectif')
                .where('e.statut = :statut', { statut: 'ACTIF' });

            if (context.etablissementId) {
                qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
            }

            qb.groupBy('c.libelle').orderBy('effectif', 'DESC');
            const result = await qb.getRawMany();

            return {
                classes: result.map((r: any) => ({
                    nom: r.nom || 'Sans classe',
                    effectif: parseInt(r.effectif) || 0,
                }))
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getElevesRepartitionClasse:', error);
            return { classes: [] };
        }
    }

    async getElevesDernieresInscriptions(limit: number = 10, context: { etablissementId?: string }): Promise<any> {
        try {
            const qb = this.eleveRepo
                .createQueryBuilder('e')
                .leftJoin('e.classe', 'c')
                .select(['e.id', 'e.matricule', 'e.nom', 'e.prenom', 'e.dateInscription', 'c.libelle'])
                .where('e.statut = :statut', { statut: 'ACTIF' });

            if (context.etablissementId) {
                qb.andWhere('e.etablissementId = :etablissementId', { etablissementId: context.etablissementId });
            }

            qb.orderBy('e.dateInscription', 'DESC').limit(limit);
            const inscriptions = await qb.getMany();

            return {
                inscriptions: inscriptions.map(e => ({
                    id: e.id,
                    matricule: e.matricule,
                    nom: (e as any).nom || '',
                    prenom: (e as any).prenom || '',
                    dateInscription: e.dateInscription,
                    classe: (e as any).classe?.libelle,
                }))
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getElevesDernieresInscriptions:', error);
            return { inscriptions: [] };
        }
    }

    // ==================================
    // WIDGETS NOTES
    // ==================================

    async getNotesMoyennesParPeriode(context: { etablissementId?: string; periode?: string }): Promise<any> {
        try {
            const where: any = { statut: 'VALIDEE' };
            if (context.etablissementId) {
                where.etablissementId = context.etablissementId;
            }

            const notes = await this.noteRepo.find({
                where,
                select: ['valeur', 'bareme', 'periodeId', 'createdAt'],
                relations: ['periode'],
            });

            // Calculer les moyennes par période
            const moyennesParPeriode: any = {};
            for (const note of notes) {
                const periodeKey = (note as any).periode?.libelle || 'Sans période';
                if (!moyennesParPeriode[periodeKey]) {
                    moyennesParPeriode[periodeKey] = { sum: 0, count: 0, bareme: 20 };
                }
                moyennesParPeriode[periodeKey].sum += (note.valeur / note.bareme) * 20;
                moyennesParPeriode[periodeKey].count++;
            }

            const evolution = Object.entries(moyennesParPeriode).map(([periode, data]: [string, any]) => ({
                periode,
                moyenne: Math.round((data.sum / data.count) * 100) / 100,
                nombreNotes: data.count,
            }));

            const moyenneGenerale = notes.length > 0
                ? Math.round((notes.reduce((sum, n) => sum + (n.valeur / n.bareme) * 20, 0) / notes.length) * 100) / 100
                : 0;

            return {
                evolution,
                moyenneGenerale,
                totalNotes: notes.length,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getNotesMoyennesParPeriode:', error);
            return { evolution: [], moyenneGenerale: 0, totalNotes: 0 };
        }
    }

    async getNotesDernieresNotes(limit: number = 20, context: { etablissementId?: string }): Promise<any> {
        try {
            const where: any = {};
            if (context.etablissementId) {
                where.etablissementId = context.etablissementId;
            }

            const notes = await this.noteRepo.find({
                where,
                relations: ['eleve', 'matiere', 'periode'],
                order: { createdAt: 'DESC' },
                take: limit,
            });

            return {
                notes: notes.map(n => ({
                    id: n.id,
                    eleve: `${(n as any).eleve?.nom} ${(n as any).eleve?.prenom}`,
                    matiere: (n as any).matiere?.libelle,
                    periode: (n as any).periode?.libelle,
                    valeur: n.valeur,
                    bareme: n.bareme,
                    coefficient: n.coefficient,
                    date: n.dateEvaluation,
                }))
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getNotesDernieresNotes:', error);
            return { notes: [] };
        }
    }

    async getNotesRepartition(context: { etablissementId?: string }): Promise<any> {
        try {
            const where: any = { statut: 'VALIDEE' };
            if (context.etablissementId) {
                where.etablissementId = context.etablissementId;
            }

            const notes = await this.noteRepo.find({
                where,
                select: ['valeur', 'bareme'],
            });

            const distribution = {
                '0-5': 0,
                '5-10': 0,
                '10-15': 0,
                '15-20': 0,
            };

            for (const note of notes) {
                const noteSur20 = (note.valeur / note.bareme) * 20;
                if (noteSur20 < 5) distribution['0-5']++;
                else if (noteSur20 < 10) distribution['5-10']++;
                else if (noteSur20 < 15) distribution['10-15']++;
                else distribution['15-20']++;
            }

            return { distribution, total: notes.length };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getNotesRepartition:', error);
            return { distribution: { '0-5': 0, '5-10': 0, '10-15': 0, '15-20': 0 }, total: 0 };
        }
    }

    // ==================================
    // WIDGETS MONITORING
    // ==================================

    async getMonitoringHealthWidgets(): Promise<any> {
        try {
            const dbStatus = AppDataSource.isInitialized ? 'connected' : 'disconnected';
            const memoryUsage = process.memoryUsage();
            const uptime = process.uptime();

            return {
                database: dbStatus,
                memory: {
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                },
                uptime: Math.round(uptime / 60), // minutes
                cpuCores: require('os').cpus().length,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getMonitoringHealthWidgets:', error);
            return { database: 'unknown', memory: 'unknown', uptime: 0 };
        }
    }

    async getMonitoringUtilisateursStats(): Promise<any> {
        try {
            const total = await this.utilisateurRepo.count();
            const actifs = await this.utilisateurRepo.count({ where: { statut: 'actif' as any } });

            // Par rôle (approximation)
            const parRole: any = {};
            const utilisateurs = await this.utilisateurRepo.find({
                select: ['role'],
            });

            for (const u of utilisateurs) {
                parRole[u.role] = (parRole[u.role] || 0) + 1;
            }

            return {
                total,
                actifs,
                parRole,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getMonitoringUtilisateursStats:', error);
            return { total: 0, actifs: 0, parRole: {} };
        }
    }

    // ==================================
    // WIDGETS MODULES
    // ==================================

    async getModulesActifs(): Promise<any> {
        try {
            const modules = await this.moduleRepo.find({
                where: { actif: true },
                select: ['id', 'moduleNom', 'actif'],
            });

            return {
                total: modules.length,
                modules: modules.map(m => ({
                    id: m.id,
                    nom: m.moduleNom,
                }))
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getModulesActifs:', error);
            return { total: 0, modules: [] };
        }
    }

    // ==================================
    // WIDGETS CANTINE
    // ==================================

    async getCantineInscriptionsJour(context: { etablissementId?: string }): Promise<any> {
        try {
            // Simulation de données (à adapter selon entité Cantine réelle)
            const today = new Date().toISOString().split('T')[0];
            
            return {
                total: 0,
                petitsDejeuners: 0,
                dejeuners: 0,
                diners: 0,
                date: today,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getCantineInscriptionsJour:', error);
            return { total: 0, petitsDejeuners: 0, dejeuners: 0, diners: 0 };
        }
    }

    async getCantineSoldeMoyen(context: { etablissementId?: string }): Promise<any> {
        try {
            return {
                soldeMoyen: 0,
                totalComptes: 0,
                comptesNegatifs: 0,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getCantineSoldeMoyen:', error);
            return { soldeMoyen: 0, totalComptes: 0, comptesNegatifs: 0 };
        }
    }

    // ==================================
    // WIDGETS TRANSPORT
    // ==================================

    async getTransportInscriptionsActives(context: { etablissementId?: string }): Promise<any> {
        try {
            return {
                total: 0,
                parLigne: [],
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getTransportInscriptionsActives:', error);
            return { total: 0, parLigne: [] };
        }
    }

    // ==================================
    // WIDGETS ABSENCES
    // ==================================

    async getAbsencesRetardsJour(context: { etablissementId?: string }): Promise<any> {
        try {
            return {
                absences: 0,
                retards: 0,
                justificatifs: 0,
                date: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getAbsencesRetardsJour:', error);
            return { absences: 0, retards: 0, justificatifs: 0 };
        }
    }

    // ==================================
    // WIDGETS MESSAGERIE
    // ==================================

    async getMessagerieMessagesNonLus(context: { userId: string }): Promise<any> {
        try {
            return {
                total: 0,
                parExpediteur: [],
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getMessagerieMessagesNonLus:', error);
            return { total: 0, parExpediteur: [] };
        }
    }

    // ==================================
    // WIDGETS NOTIFICATIONS
    // ==================================

    async getNotificationsRecentes(context: { userId: string; limit?: number }): Promise<any> {
        try {
            const limit = context.limit || 10;
            
            return {
                notifications: [],
                total: 0,
                nonLues: 0,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getNotificationsRecentes:', error);
            return { notifications: [], total: 0, nonLues: 0 };
        }
    }

    // ==================================
    // WIDGETS BULLETINS
    // ==================================

    async getBulletinsGenerationStatus(context: { etablissementId?: string }): Promise<any> {
        try {
            return {
                enCours: 0,
                termines: 0,
                total: 0,
                progression: 0,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getBulletinsGenerationStatus:', error);
            return { enCours: 0, termines: 0, total: 0, progression: 0 };
        }
    }

    // ==================================
    // WIDGETS CLASSES
    // ==================================

    async getClassesActives(context: { etablissementId?: string }): Promise<any> {
        try {
            // Cette méthode nécessiterait l'import de l'entité Classe
            return {
                classes: [],
                total: 0,
            };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur getClassesActives:', error);
            return { classes: [], total: 0 };
        }
    }

    // ==================================
    // WIDGETS VALIDATION WORKFLOW
    // ==================================

    /**
     * Statistiques validations par module pour le dashboard
     */
    async getValidationStatsParModule(context: { etablissementId?: string }): Promise<any> {
        try {
            return await validationWorkflowService.getDashboardStats(context.etablissementId);
        } catch (error) {
            logger.error('[DashboardDataService] Erreur validation stats:', error);
            return { parModule: {}, totalGlobal: 0, enCoursGlobal: 0 };
        }
    }

    /**
     * Validations en attente pour l'utilisateur connecté
     */
    async getValidationEnAttente(context: { userId: string; etablissementId?: string }): Promise<any> {
        try {
            // Récupérer le rôle de l'utilisateur pour filtrer
            const utilisateur = await this.utilisateurRepo.findOne({ where: { id: context.userId } });
            const role = utilisateur?.role || 'ADMIN';
            
            const validations = await validationWorkflowService.getValidationsEnAttente(
                role,
                context.etablissementId,
                10
            );
            
            return { validations, total: validations.length };
        } catch (error) {
            logger.error('[DashboardDataService] Erreur validation en attente:', error);
            return { validations: [], total: 0 };
        }
    }

    /**
     * Temps moyen de validation par niveau
     */
    async getValidationTempsMoyen(context: { etablissementId?: string }): Promise<any> {
        try {
            return await validationWorkflowService.getTempsMoyenValidation(undefined, context.etablissementId);
        } catch (error) {
            logger.error('[DashboardDataService] Erreur temps moyen:', error);
            return { parNiveau: {}, moyenneGlobale: 0 };
        }
    }
}

export const dashboardDataService = new DashboardDataService();
