/**
 * ==================================
 * eLISAschool - Seed des Providers de Notifications
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 * 
 * Insère automatiquement les providers par défaut au premier démarrage
 * Profite de synchronize:true pour créer la table automatiquement
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { NotificationProvider, ServiceNotification, TypeNotification } from '../entities';
import { logger } from '@common/utils/logger.util';

/**
 * Seed automatique des providers par défaut
 */
export async function seedDefaultNotificationProviders(): Promise<number> {
    const repo: Repository<NotificationProvider> = AppDataSource.getRepository(NotificationProvider);
    
    // Vérifier si des providers existent déjà
    const count = await repo.count();
    if (count > 0) {
        logger.info(`ℹ️  ${count} providers déjà existants (seed ignoré)`);
        return count;
    }
    
    logger.info('🌱 Aucun provider trouvé, création des providers par défaut...');
    
    // Providers par défaut
    const defaultProviders: Partial<NotificationProvider>[] = [
        {
            nom: 'In-App (Défaut)',
            type: TypeNotification.IN_APP,
            service: ServiceNotification.IN_APP,
            actif: true,
            estDefaut: true,
            configuration: {},
            quotaJournalier: 0, // Illimité
            priorite: 1,
            description: 'Provider In-App par défaut - Notifications dans l\'application',
        },
        {
            nom: 'SMTP (À configurer)',
            type: TypeNotification.EMAIL,
            service: ServiceNotification.NODEMAILER,
            actif: false, // Désactivé par défaut, à configurer via l'API
            estDefaut: true,
            configuration: {
                host: 'smtp.example.com',
                port: 587,
                secure: false,
                auth: {
                    user: 'votre-email@example.com',
                    pass: 'votre-mot-de-passe',
                },
                from: {
                    name: 'eLISAschool',
                    email: 'noreply@elisaschool.cm',
                },
            },
            quotaJournalier: 1000,
            priorite: 1,
            description: 'Provider Email SMTP - À configurer avec vos identifiants',
        },
        {
            nom: 'Twilio (À configurer)',
            type: TypeNotification.SMS,
            service: ServiceNotification.TWILIO,
            actif: false,
            estDefaut: true,
            configuration: {
                accountSid: 'votre-account-sid',
                authToken: 'votre-auth-token',
                fromNumber: '+1234567890',
            },
            quotaJournalier: 500,
            priorite: 1,
            description: 'Provider SMS Twilio - À configurer avec vos identifiants',
        },
        {
            nom: 'Firebase FCM (À configurer)',
            type: TypeNotification.PUSH,
            service: ServiceNotification.FIREBASE_FCM,
            actif: false,
            estDefaut: true,
            configuration: {
                projectId: 'votre-project-id',
                serverKey: 'votre-server-key',
                vapidKey: 'votre-vapid-key',
            },
            quotaJournalier: 5000,
            priorite: 1,
            description: 'Provider Push Firebase FCM - À configurer avec vos identifiants',
        },
    ];
    
    // Insérer les providers
    const providers = defaultProviders.map((dto) => repo.create(dto));
    await repo.save(providers);
    
    logger.info(`✅ ${providers.length} providers par défaut créés:`);
    providers.forEach((p) => {
        logger.info(`   - ${p.nom} (${p.type} - ${p.actif ? 'actif' : 'inactif'})`);
    });
    
    return providers.length;
}

/**
 * Reset les quotas quotidiens (à appeler via un cron job)
 */
export async function resetDailyQuotas(): Promise<void> {
    const repo = AppDataSource.getRepository(NotificationProvider);
    
    const result = await repo
        .createQueryBuilder()
        .update(NotificationProvider)
        .set({ quotaUtilise: 0 })
        .where('quota_utilise > 0')
        .execute();
    
    if (result.affected && result.affected > 0) {
        logger.info(`🔄 Quotas quotidiens réinitialisés pour ${result.affected} providers`);
    }
}
