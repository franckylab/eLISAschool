/**
 * ==================================
 * eLISAschool - Service d'Agrégation de Données Dashboard
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Orchestre l'exécution des resolveurs de données pour les widgets
 * avec gestion du cache, timeout et résolution dynamique de services
 */

import { WidgetDefinition, WidgetDataResponse, DashboardContext } from '../types/dashboard.types';
import { getWidgetById } from '../utils/widget-registry';
import { dashboardCacheService } from './dashboard-cache.service';
import { dashboardDataService } from './dashboard-data.service';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';

export class DataAggregatorService {
    // Registry des instances de services
    private serviceInstances: Map<string, any> = new Map();
    private executionTimes: Map<string, number[]> = new Map();

    constructor() {
        // Le dashboardDataService est notre service centralisé
        this.registerService('dashboardDataService', dashboardDataService);
    }

    /**
     * Enregistrer un service dans le registry
     */
    registerService(name: string, instance: any): void {
        this.serviceInstances.set(name, instance);
        logger.debug(`[DataAggregator] Service enregistré: ${name}`);
    }

    /**
     * Récupère les données d'un widget
     */
    async getWidgetData(
        widgetId: string,
        context: DashboardContext
    ): Promise<WidgetDataResponse> {
        const startTime = Date.now();
        const cacheKey = `widget:data:${widgetId}:${context.etablissementId || 'global'}:${context.periode || 'all'}`;

        // 1. Vérifier le cache
        const cached = await dashboardCacheService.get(cacheKey);
        if (cached) {
            const resolutionTime = Date.now() - startTime;
            this.recordExecutionTime(widgetId, resolutionTime);
            
            return {
                ...cached,
                cached: true,
                timestamp: new Date(),
            };
        }

        // 2. Récupérer la définition du widget
        const widgetDef = getWidgetById(widgetId);
        if (!widgetDef) {
            throw new AppError(`Widget ${widgetId} non trouvé`, 404, 'WIDGET_NOT_FOUND');
        }

        // 3. Vérifier si le service est disponible
        const [serviceName, methodName] = widgetDef.dataResolver.split('.');
        const service = this.getServiceInstance(serviceName);

        if (!service || typeof service[methodName] !== 'function') {
            logger.warn(`[DataAggregator] Resolver ${widgetDef.dataResolver} non disponible, données mock`);
            
            // Retourner des données mock pour le développement
            return this.getMockData(widgetDef, context);
        }

        // 4. Exécuter le resolver avec timeout
        try {
            const timeout = 5000; // 5 secondes max
            const data = await Promise.race([
                service[methodName](context),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), timeout)
                )
            ]);

            const resolutionTime = Date.now() - startTime;
            this.recordExecutionTime(widgetId, resolutionTime);

            // 5. Construire la réponse
            const response: WidgetDataResponse = {
                data,
                timestamp: new Date(),
                nextRefresh: Date.now() + (widgetDef.cacheTTL * 1000),
                cached: false,
                metadata: {
                    periode: context.periode,
                    etablissementId: context.etablissementId,
                    resolutionTime,
                }
            };

            // 6. Cache le résultat
            await dashboardCacheService.set(cacheKey, response, widgetDef.cacheTTL, context.etablissementId || 'global');

            logger.info(`[DataAggregator] Widget ${widgetId} résolu en ${resolutionTime}ms`);

            return response;
        } catch (error: any) {
            logger.error(`[DataAggregator] Erreur résolution widget ${widgetId}:`, error);
            
            // En cas d'erreur, retourner des données mock ou une erreur gracieuse
            if (error.message === 'Timeout') {
                throw new AppError(`Timeout du widget ${widgetId}`, 504, 'WIDGET_TIMEOUT');
            }

            // Fallback sur mock data en développement
            return this.getMockData(widgetDef, context);
        }
    }

    /**
     * Récupère une instance de service (lazy loading)
     */
    private getServiceInstance(serviceName: string): any {
        if (this.serviceInstances.has(serviceName)) {
            return this.serviceInstances.get(serviceName);
        }

        // Lazy loading des services
        try {
            switch (serviceName) {
                case 'elevesService':
                    const { elevesService } = require('@modules/eleves/services');
                    this.registerService('elevesService', elevesService);
                    return elevesService;

                case 'notesService':
                    const { notesService } = require('@modules/notes/services');
                    this.registerService('notesService', notesService);
                    return notesService;

                case 'cantineService':
                    const { cantineService } = require('@modules/cantine/services');
                    this.registerService('cantineService', cantineService);
                    return cantineService;

                case 'transportService':
                    const { transportService } = require('@modules/transport/services');
                    this.registerService('transportService', transportService);
                    return transportService;

                case 'messagerieService':
                    const { messagerieService } = require('@modules/messagerie/services');
                    this.registerService('messagerieService', messagerieService);
                    return messagerieService;

                case 'notificationsService':
                    const { notificationsService } = require('@modules/notifications/services');
                    this.registerService('notificationsService', notificationsService);
                    return notificationsService;

                case 'bulletinsService':
                    const { bulletinsService } = require('@modules/bulletins/services');
                    this.registerService('bulletinsService', bulletinsService);
                    return bulletinsService;

                case 'classesService':
                    const { classesService } = require('@modules/classes/services');
                    this.registerService('classesService', classesService);
                    return classesService;

                case 'absencesService':
                    // Service à créer
                    logger.warn(`[DataAggregator] Service absencesService non disponible`);
                    return null;

                case 'dashboardService':
                    // Référencement circulaire - utiliser this
                    this.registerService('dashboardService', this);
                    return this;

                default:
                    logger.warn(`[DataAggregator] Service inconnu: ${serviceName}`);
                    return null;
            }
        } catch (error) {
            logger.error(`[DataAggregator] Erreur chargement service ${serviceName}:`, error);
            return null;
        }
    }

    /**
     * Enregistre le temps d'exécution d'un widget
     */
    private recordExecutionTime(widgetId: string, time: number): void {
        if (!this.executionTimes.has(widgetId)) {
            this.executionTimes.set(widgetId, []);
        }
        const times = this.executionTimes.get(widgetId)!;
        times.push(time);

        // Garder seulement les 100 dernières exécutions
        if (times.length > 100) {
            times.shift();
        }
    }

    /**
     * Récupère les statistiques de performance
     */
    getPerformanceStats() {
        const stats = {
            widgets: {} as Record<string, {
                avgTime: number;
                minTime: number;
                maxTime: number;
                calls: number;
            }>,
            cacheStats: dashboardCacheService.getStats(),
        };

        for (const [widgetId, times] of this.executionTimes.entries()) {
            if (times.length === 0) continue;

            const avg = times.reduce((a, b) => a + b, 0) / times.length;
            const min = Math.min(...times);
            const max = Math.max(...times);

            stats.widgets[widgetId] = {
                avgTime: Math.round(avg),
                minTime: Math.round(min),
                maxTime: Math.round(max),
                calls: times.length,
            };
        }

        return stats;
    }

    /**
     * Données mock pour le développement ou fallback
     */
    private getMockData(widgetDef: WidgetDefinition, context: DashboardContext): WidgetDataResponse {
        logger.debug(`[DataAggregator] Données mock pour widget ${widgetDef.id}`);

        const mockData: Record<string, any> = {
            'eleves-stats-general': {
                total: 0,
                actifs: 0,
                inactifs: 0,
                parGenre: { masculin: 0, feminin: 0 },
            },
            'eleves-repartition-classe': {
                classes: [],
            },
            'eleves-nouveaux': {
                inscriptions: [],
            },
            'notes-moyennes-generales': {
                evolution: [],
                moyenneGenerale: 0,
            },
            'notes-dernieres-saisies': {
                notes: [],
            },
            'notes-repartition-notes': {
                distribution: {
                    '0-5': 0,
                    '5-10': 0,
                    '10-15': 0,
                    '15-20': 0,
                }
            },
            'monitoring-sante-systeme': {
                database: 'unknown',
                memory: 'unknown',
                uptime: 0,
            },
            'monitoring-stats-utilisateurs': {
                total: 0,
                actifs: 0,
                parRole: {},
            },
            'cantine-inscriptions-jour': {
                total: 0,
                petitsDejeuners: 0,
                dejeuners: 0,
                diners: 0,
            },
            'cantine-solde-moyen': {
                soldeMoyen: 0,
                totalComptes: 0,
            },
            'transport-inscriptions-actives': {
                total: 0,
                parLigne: [],
            },
            'absences-retards-jour': {
                absences: 0,
                retards: 0,
                justificatifs: 0,
            },
            'messagerie-messages-non-lus': {
                total: 0,
                parExpediteur: [],
            },
            'notifications-recentes': {
                notifications: [],
            },
            'actions-rapides-admin': {
                actions: [
                    { label: 'Ajouter un élève', icon: 'UserPlus', route: '/eleves/nouveau' },
                    { label: 'Saisir des notes', icon: 'Edit', route: '/notes/saisie' },
                    { label: 'Générer bulletins', icon: 'FileText', route: '/bulletins/generation' },
                    { label: 'Envoyer notification', icon: 'Bell', route: '/notifications/envoyer' },
                ]
            },
            'actions-rapides-enseignant': {
                actions: [
                    { label: 'Saisir notes', icon: 'Edit', route: '/notes/saisie' },
                    { label: 'Appel', icon: 'CheckSquare', route: '/absences/appel' },
                    { label: 'Messagerie', icon: 'Mail', route: '/messagerie' },
                ]
            },
            'bulletins-generation-status': {
                enCours: 0,
                termines: 0,
                total: 0,
                progression: 0,
            },
            'classes-liste-active': {
                classes: [],
            },
        };

        return {
            data: mockData[widgetDef.id] || { message: 'Widget en développement' },
            timestamp: new Date(),
            nextRefresh: Date.now() + (widgetDef.cacheTTL * 1000),
            cached: false,
            metadata: {
                periode: context.periode,
                etablissementId: context.etablissementId,
                mock: true,
            }
        };
    }

    /**
     * Actions rapides pour Admin
     */
    async getActionsRapidesAdmin(context: DashboardContext): Promise<any> {
        // Cette méthode peut être étendue avec de la logique dynamique
        return {
            actions: [
                { label: 'Ajouter un élève', icon: 'UserPlus', route: '/eleves/nouveau', permission: 'eleves:create' },
                { label: 'Créer un utilisateur', icon: 'UserPlus', route: '/utilisateurs/nouveau', permission: 'utilisateurs:create' },
                { label: 'Saisir des notes', icon: 'Edit', route: '/notes/saisie', permission: 'notes:create' },
                { label: 'Générer bulletins', icon: 'FileText', route: '/bulletins/generation', permission: 'bulletins:generate' },
                { label: 'Envoyer notification', icon: 'Bell', route: '/notifications/envoyer', permission: 'notifications:send' },
                { label: 'Configuration', icon: 'Settings', route: '/configuration', permission: 'configuration:edit' },
            ]
        };
    }

    /**
     * Actions rapides pour Enseignant
     */
    async getActionsRapidesEnseignant(context: DashboardContext): Promise<any> {
        return {
            actions: [
                { label: 'Saisir notes', icon: 'Edit', route: '/notes/saisie', permission: 'notes:create' },
                { label: 'Faire l\'appel', icon: 'CheckSquare', route: '/absences/appel', permission: 'absences:create' },
                { label: 'Messagerie', icon: 'Mail', route: '/messagerie', permission: 'messages:send' },
                { label: 'Mes classes', icon: 'School', route: '/classes', permission: 'classes:view' },
                { label: 'Bulletin élèves', icon: 'FileText', route: '/bulletins', permission: 'bulletins:view' },
            ]
        };
    }
}

export const dataAggregatorService = new DataAggregatorService();
