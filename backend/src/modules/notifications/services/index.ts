/**
 * ==================================
 * eLISAschool - Export des services Notifications
 * ==================================
 */

export { NotificationsService, notificationsService } from './notifications.service';
export { NotificationProviderService, notificationProviderService } from './notification-provider.service';
export { seedDefaultNotificationProviders, resetDailyQuotas } from './seed-providers.service';
export { notificationTemplates, NotificationTemplatesService } from './notification-templates.service';
export { NotificationOrchestratorService, notificationOrchestrator } from './notification-orchestrator.service';
export type { NotificationMultiCanal, EnvoiMultiCanalResult } from './notification-orchestrator.service';
