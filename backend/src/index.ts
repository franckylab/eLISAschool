/**
 * ==================================
 * eLISAschool Backend - Point d'entrée principal
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import 'reflect-metadata';
// IMPORTANT: dotenv.config() DOIT être appelé avant tout autre import
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Charger .env depuis la racine du projet
// Chercher dans l'ordre : processus.cwd()/../../.env, processus.cwd()/.env, __dirname/../../.env
const searchPaths = [
    path.resolve(process.cwd(), '../../.env'),  // backend/src -> racine
    path.resolve(process.cwd(), '.env'),         // racine directe
    path.resolve(__dirname, '../../.env'),       // fallback
];

const envFile = searchPaths.find(p => fs.existsSync(p));
if (envFile) {
    dotenv.config({ path: envFile });
    console.log(`✅ .env chargé depuis: ${envFile}`);
} else {
    console.warn('⚠️  Fichier .env non trouvé, utilisation des valeurs par défaut');
    dotenv.config();  // Fallback
}

import { AppDataSource, initializeDatabase } from '@database/data-source';
import { createApp } from './app';
import { logger } from '@common/utils/logger.util';
import { envConfig } from '@config/env.config';
import { notificationProviderService, seedDefaultNotificationProviders } from '@modules/notifications/services';
import { inAppProvider, providerRegistry } from '@modules/notifications/providers';
import { TypeNotification } from '@modules/notifications/entities';
import { initNotificationCronJobs } from '@modules/notifications/cron-jobs';
import { initFinanceCronJobs } from '@modules/finances/services/cron-jobs';
import { initGamificationCronJobs } from '@modules/gamification/cron-jobs';
import { initScoringPersonnelCronJobs } from '@modules/suivi-personnel/cron-jobs';
import { initSondageCronJobs } from '@modules/sondages/cron-jobs';
import { initAuthCronJobs } from '@modules/auth/cron-jobs';
import { initClassesCronJobs } from '@modules/classes/cron-jobs';
import { initAuditCronJobs } from '@modules/audit/cron-jobs';
import { initEmploiDuTempsCronJobs } from '@modules/emploi-du-temps/cron-jobs';
import { initBillingCronJobs } from '@modules/billing/cron-jobs';
import { initAnneesScolairesCronJobs } from '@modules/annees-scolaires/cron-jobs';
import { initPeriodesCronJobs } from '@modules/periodes/cron-jobs';
import { keyManagerService } from '@modules/configuration/services/key-manager.service';
import { permissionResolverService } from '@modules/auth/services';

// Chargement des variables d'environnement (déjà fait en haut du fichier)
// dotenv.config(); // ← DÉPLACÉ EN HAUT

/**
 * Fonction principale de démarrage du serveur
 */
async function bootstrap(): Promise<void> {
    try {
        // Initialisation de la connexion à la base de données
        logger.info('🔌 Connexion à la base de données PostgreSQL...');
        await initializeDatabase();
        logger.info('✅ Connexion à la base de données établie avec succès');

        // Durcissement v9 — Initialiser le KeyManager (clés cryptographiques en base)
        try {
            await keyManagerService.init();
            logger.info('🔐 KeyManager initialisé — clés cryptographiques vérifiées');
        } catch (error) {
            logger.warn('⚠️ KeyManager: initialisation ignorée (non bloquant)', error);
        }

        // Backfill sécurisé des postes sans fonctionId (migration différée)
        try {
            const backfilled = await AppDataSource.query(
                `UPDATE postes SET "fonctionId" = (
                    SELECT f."id" FROM fonctions f
                    JOIN unites_organisationnelles uo ON uo."id" = postes."uniteOrganisationnelleId"
                    WHERE f."code" = 'AGENT-COMPTA' AND f."etablissementId" = uo."etablissementId"
                    LIMIT 1
                ) WHERE "fonctionId" IS NULL`
            );
            if (backfilled?.[1] > 0) {
                logger.info(`✅ ${backfilled[1]} postes backfillés avec la fonction AGENT-COMPTA`);
            }
        } catch (error) {
            logger.warn('⚠️ Backfill fonctionId ignoré (non bloquant)', error);
        }

        // Précharger le cache des permissions APRÈS la connexion DB
        try {
            await permissionResolverService.preloadGlobalPermissions();
        } catch (error) {
            logger.warn('⚠️  Erreur lors du préchargement des permissions (non bloquant)', error);
        }

        // Chargement des providers de notifications
        // NOTE: synchronize:true crée automatiquement la table notification_providers
        // Le seed insère les providers par défaut si la table est vide
        try {
            logger.info('📧 Initialisation du système de notifications...');
            
            // Seed automatique des providers par défaut (si table vide)
            const seedCount = await seedDefaultNotificationProviders();
            
            // Enregistrer le provider In-App par défaut (toujours disponible)
            providerRegistry.register(inAppProvider);
            logger.info('✅ Provider In-App enregistré');
            
            // Charger TOUS les providers depuis la DB (y compris les nouveaux seedés)
            const loadedCount = await notificationProviderService.loadActiveProviders();
            if (loadedCount > 0) {
                logger.info(`✅ ${loadedCount} providers chargés depuis la base de données`);
            } else {
                logger.info('ℹ️  Aucun provider actif en DB (In-App uniquement)');
            }
            
            // Vérifier les providers disponibles
            const emailProviders = providerRegistry.countProviders(TypeNotification.EMAIL);
            const smsProviders = providerRegistry.countProviders(TypeNotification.SMS);
            const pushProviders = providerRegistry.countProviders(TypeNotification.PUSH);
            const inAppProviders = providerRegistry.countProviders(TypeNotification.IN_APP);
            
            logger.info(`📊 Providers actifs: In-App=${inAppProviders}, Email=${emailProviders}, SMS=${smsProviders}, Push=${pushProviders}`);
        } catch (error) {
            logger.warn('⚠️  Système de notifications en mode dégradé (In-App uniquement)', error);
        }

        // Création et configuration de l'application Express
        const app = createApp();
        const port = envConfig.app.port;

        // Initialiser les cron jobs (uniquement en production ou si activé)
        if (envConfig.app.nodeEnv === 'production' || process.env.ENABLE_CRON_JOBS === 'true') {
            initNotificationCronJobs();
            initFinanceCronJobs();
            initGamificationCronJobs();
            initScoringPersonnelCronJobs();
            initSondageCronJobs();
            initAuthCronJobs();
            initClassesCronJobs();
            initAuditCronJobs();
            initEmploiDuTempsCronJobs();
            initBillingCronJobs();
            initAnneesScolairesCronJobs();
            initPeriodesCronJobs();
            logger.info('✅ Cron jobs activés (notifications + finances + gamification + scoring personnel + sondages + auth + classes + audit + emploi-du-temps + billing + années-scolaires + périodes)');
        } else {
            logger.info('ℹ️  Cron jobs désactivés (mode développement)');
            logger.info('💡 Pour activer: ENABLE_CRON_JOBS=true ou NODE_ENV=production');
        }

        // Initialiser Redis (non-bloquant)
        try {
            const { redisService } = await import('@common/services/redis.service');
            const redisAvailable = await redisService.isAvailable();
            if (redisAvailable) {
                logger.info('✅ Redis connecté et opérationnel');
            } else {
                logger.warn('⚠️  Redis non disponible - Utilisation du cache in-memory (fallback)');
            }
        } catch (error) {
            logger.warn('⚠️  Redis non disponible - Utilisation du cache in-memory (fallback)');
        }

        // Démarrage du serveur HTTP
        // Express écoute par défaut sur 0.0.0.0 (toutes les interfaces)
        // Ce qui permet l'accès depuis le réseau local
        app.listen(port, '0.0.0.0', () => {
            const os = require('os');
            const interfaces = os.networkInterfaces();
            const addresses: string[] = [];
            
            // Collecter toutes les adresses IP accessibles
            for (const name of Object.keys(interfaces)) {
                for (const iface of interfaces[name] || []) {
                    if (iface.family === 'IPv4' && !iface.internal) {
                        addresses.push(iface.address);
                    }
                }
            }
            
            logger.info(`🚀 Serveur eLISAschool démarré sur le port ${port}`);
            logger.info(`📚 Documentation API: http://localhost:${port}/api/docs`);
            logger.info(`🏥 Health check: http://localhost:${port}/api/health`);
            logger.info(`🌍 Environnement: ${envConfig.app.nodeEnv}`);
            logger.info(`🌐 Écoute sur: 0.0.0.0:${port} (toutes les interfaces)`);
            
            if (addresses.length > 0) {
                logger.info(`📡 Accès réseau local :`);
                addresses.forEach(addr => {
                    logger.info(`   → http://${addr}:${port}/api/health`);
                });
            }
            
            // Log CORS info en développement
            if (envConfig.app.isDevelopment) {
                logger.info(`🔓 CORS: Tous sous-réseaux privés (10.x, 172.16-31.x, 192.168.x) + localhost`);
            }
        });

        // Gestion de l'arrêt gracieux
        process.on('SIGTERM', async () => {
            logger.info('📴 Signal SIGTERM reçu, arrêt gracieux...');
            await AppDataSource.destroy();
            process.exit(0);
        });

        process.on('SIGINT', async () => {
            logger.info('📴 Signal SIGINT reçu, arrêt gracieux...');
            await AppDataSource.destroy();
            process.exit(0);
        });

    } catch (error) {
        logger.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Lancement de l'application
bootstrap();
