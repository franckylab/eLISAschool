/**
 * ==================================
 * eLISAschool - Service de Résolution des Widgets
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Résout les widgets disponibles pour un utilisateur selon :
 * - Ses rôles
 * - Ses permissions
 * - L'établissement actif
 * - La configuration du module
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { WidgetDefinition, UserWidgetConfig, DashboardLayout } from '../types/dashboard.types';
import { WIDGET_REGISTRY, getWidgetById } from '../utils/widget-registry';
import { PermissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { dashboardCacheService } from './dashboard-cache.service';
import { logger } from '@common/utils/logger.util';
import Utilisateur from '@modules/auth/entities/utilisateur.entity';

export class WidgetResolverService {
    private permissionResolver: PermissionResolverService;
    private layoutRepo: Repository<any>; // Sera typé après création de l'entité
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.permissionResolver = new PermissionResolverService();
        this.layoutRepo = AppDataSource.getRepository('DashboardLayout');
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    /**
     * Résout tous les widgets disponibles pour un utilisateur
     */
    async resolveWidgetsForUser(
        utilisateurId: string,
        etablissementId?: string
    ): Promise<{
        widgets: WidgetDefinition[];
        layout: UserWidgetConfig[];
        metadata: {
            totalAvailable: number;
            totalVisible: number;
            lastRefresh: Date;
            nextRefresh: number;
        };
    }> {
        const cacheKey = `dashboard:widgets:${utilisateurId}:${etablissementId || 'global'}`;
        const context = `${utilisateurId}:${etablissementId || 'global'}`;

        // Vérifier le cache
        const cached = await dashboardCacheService.get(cacheKey);
        if (cached) {
            logger.debug(`[WidgetResolver] Cache hit pour ${cacheKey}`);
            return cached;
        }

        try {
            // 1. Récupérer les permissions de l'utilisateur
            const userPermissions = await this.permissionResolver.resolvePermissions(utilisateurId);
            const permissionArray = Array.from(userPermissions);

            // 2. Récupérer les rôles de l'utilisateur
            const utilisateur = await this.utilisateurRepo.findOne({
                where: { id: utilisateurId },
                relations: ['roles', 'roles.role'],
            });

            if (!utilisateur) {
                throw new Error('Utilisateur non trouvé');
            }

            const userRoles = [utilisateur.role];

            // 3. Filtrer les widgets par rôles et permissions
            const availableWidgets = WIDGET_REGISTRY.filter(widget => {
                // Filtre par rôles
                const hasRole = widget.roles.length === 0 || 
                    widget.roles.some(r => userRoles.includes(r));

                // Filtre par permissions (TOUTES doivent être présentes)
                const hasPermissions = widget.permissions.length === 0 ||
                    widget.permissions.every(p => userPermissions.has(p));

                // Filtre par établissement (si widget scoped)
                const hasEtablissement = !widget.etablissementScope || !!etablissementId;

                return hasRole && hasPermissions && hasEtablissement;
            });

            // 4. Récupérer le layout sauvegardé de l'utilisateur
            const userLayout = await this.getUserLayout(utilisateurId, etablissementId);

            // 5. Merge des widgets avec le layout utilisateur
            const widgets = availableWidgets.map(widget => {
                const layoutConfig = userLayout?.widgets?.find(w => w.id === widget.id);
                
                return {
                    ...widget,
                    visible: layoutConfig?.visible ?? true,
                    ordre: layoutConfig?.ordre ?? widget.complexite ?? 5,
                    position: layoutConfig?.position ?? { x: 0, y: 0 },
                    taille: layoutConfig?.taille ?? { width: 1, height: 1 },
                    config: { ...widget.defaultConfig, ...layoutConfig?.config },
                };
            });

            // 6. Trier par ordre
            widgets.sort((a, b) => (a as any).ordre - (b as any).ordre);

            // 7. Calculer les métadonnées
            const totalVisible = widgets.filter(w => (w as any).visible).length;

            const result = {
                widgets: widgets as any,
                layout: userLayout?.widgets || [],
                metadata: {
                    totalAvailable: availableWidgets.length,
                    totalVisible,
                    lastRefresh: new Date(),
                    nextRefresh: Date.now() + 300000, // 5 minutes
                }
            };

            // 8. Cache le résultat
            await dashboardCacheService.set(cacheKey, result, 300, context);

            logger.info(`[WidgetResolver] Résolu ${availableWidgets.length} widgets pour user ${utilisateurId}`);

            return result;
        } catch (error) {
            logger.error(`[WidgetResolver] Erreur résolution widgets:`, error);
            throw error;
        }
    }

    /**
     * Vérifie si un utilisateur a accès à un widget spécifique
     */
    async checkWidgetAccess(
        widgetId: string,
        utilisateurId: string
    ): Promise<boolean> {
        const widgetDef = getWidgetById(widgetId);
        if (!widgetDef) {
            logger.warn(`[WidgetResolver] Widget non trouvé: ${widgetId}`);
            return false;
        }

        try {
            const userPermissions = await this.permissionResolver.resolvePermissions(utilisateurId);
            const utilisateur = await this.utilisateurRepo.findOne({
                where: { id: utilisateurId },
            });

            if (!utilisateur) return false;

            const userRoles = [utilisateur.role];

            // Vérifier les rôles
            const hasRole = widgetDef.roles.length === 0 ||
                widgetDef.roles.some(r => userRoles.includes(r));

            // Vérifier les permissions
            const hasPermissions = widgetDef.permissions.length === 0 ||
                widgetDef.permissions.every(p => userPermissions.has(p));

            return hasRole && hasPermissions;
        } catch (error) {
            logger.error(`[WidgetResolver] Erreur vérification accès widget ${widgetId}:`, error);
            return false;
        }
    }

    /**
     * Récupère le layout sauvegardé d'un utilisateur
     */
    private async getUserLayout(
        utilisateurId: string,
        etablissementId?: string
    ): Promise<DashboardLayout | null> {
        try {
            const layout = await this.layoutRepo.findOne({
                where: {
                    utilisateurId,
                    etablissementId: etablissementId || null,
                    actif: true,
                },
                order: { updatedAt: 'DESC' },
            });

            return layout as DashboardLayout | null;
        } catch (error) {
            logger.warn(`[WidgetResolver] Layout non trouvé pour user ${utilisateurId}, utilisation du layout par défaut`);
            return null;
        }
    }

    /**
     * Sauvegarde le layout d'un utilisateur
     */
    async saveUserLayout(
        utilisateurId: string,
        layout: Partial<DashboardLayout>,
        etablissementId?: string
    ): Promise<DashboardLayout> {
        const context = `${utilisateurId}:${etablissementId || 'global'}`;

        try {
            // Chercher un layout existant
            let existingLayout = await this.layoutRepo.findOne({
                where: {
                    utilisateurId,
                    etablissementId: etablissementId || null,
                },
            });

            if (existingLayout) {
                // Mettre à jour
                existingLayout.widgets = layout.widgets || existingLayout.widgets;
                existingLayout.nom = layout.nom || existingLayout.nom;
                existingLayout.actif = layout.actif ?? existingLayout.actif;
                existingLayout.updatedAt = new Date();
                
                await this.layoutRepo.save(existingLayout);
                logger.info(`[WidgetResolver] Layout mis à jour pour user ${utilisateurId}`);
            } else {
                // Créer un nouveau layout
                const newLayout = this.layoutRepo.create({
                    utilisateurId,
                    etablissementId: etablissementId || null,
                    nom: layout.nom || 'Mon Dashboard',
                    widgets: layout.widgets || [],
                    actif: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                existingLayout = await this.layoutRepo.save(newLayout);
                logger.info(`[WidgetResolver] Nouveau layout créé pour user ${utilisateurId}`);
            }

            // Invalider le cache des widgets
            await dashboardCacheService.invalidateByContext(context);

            return existingLayout as DashboardLayout;
        } catch (error) {
            logger.error(`[WidgetResolver] Erreur sauvegarde layout:`, error);
            throw error;
        }
    }

    /**
     * Réinitialise le layout d'un utilisateur (retour aux valeurs par défaut)
     */
    async resetUserLayout(
        utilisateurId: string,
        etablissementId?: string
    ): Promise<void> {
        const context = `${utilisateurId}:${etablissementId || 'global'}`;

        try {
            await this.layoutRepo.delete({
                utilisateurId,
                etablissementId: etablissementId || null,
            });

            // Invalider le cache
            await dashboardCacheService.invalidateByContext(context);

            logger.info(`[WidgetResolver] Layout réinitialisé pour user ${utilisateurId}`);
        } catch (error) {
            logger.error(`[WidgetResolver] Erreur réinitialisation layout:`, error);
            throw error;
        }
    }
}

export const widgetResolverService = new WidgetResolverService();
