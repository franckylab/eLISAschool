/**
 * ==================================
 * eLISAschool - TypeORM Tenant Isolation Subscriber
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Phase H.2 — Refonte SaaS v3
 * Global subscriber qui injecte automatiquement etablissementId
 * dans chaque entité multi-tenant lors des opérations CRUD.
 *
 * Fonctionnement :
 * - beforeInsert : injecte etablissementId depuis AsyncLocalStorage
 * - beforeUpdate : empêche modification cross-tenant
 * - afterLoad : vérifie cohérence tenant (mode strict optionnel)
 *
 * Intégration avec rls.middleware.ts via AsyncLocalStorage.
 * Ne s'applique PAS aux entités sans etablissementId (config globale, etc.)
 */

import {
    EventSubscriber,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
    LoadEvent,
} from 'typeorm';
import { getCurrentEtablissementId, getTenantContext } from '@common/async-local-storage';
import { logger } from '@common/utils/logger.util';

/**
 * Durcissement v9 — Mode strict d'isolation tenant.
 * En production (ou si STRICT_TENANT_ISOLATION=true) : throw au lieu d'écraser silencieusement.
 * En développement : logger.warn + écraser (comportement legacy).
 */
const STRICT_MODE = process.env.STRICT_TENANT_ISOLATION === 'true'
    || process.env.NODE_ENV === 'production';

/**
 * Liste des entités qui NE doivent PAS être scopées par tenant.
 * Ces entités sont globales (pas de colonne etablissementId).
 */
const GLOBAL_ENTITIES = new Set([
    'ParametreSysteme',
    'PlanAbonnement',
    'TrancheEleves',
    'AbonnementClient',
    'ModuleRegistry',
    'AuditLog',
    'NotificationTemplate',
    'NotificationProviderConfig',
]);

/**
 * Vérifie si une entité possède la colonne etablissementId.
 */
function hasEtablissementColumn(entity: any): boolean {
    if (!entity) return false;
    return 'etablissementId' in entity || 'etablissement_id' in entity;
}

@EventSubscriber()
export class TenantIsolationSubscriber implements EntitySubscriberInterface {

    /**
     * beforeInsert — Injecte automatiquement etablissementId
     * depuis le contexte AsyncLocalStorage.
     */
    async beforeInsert(event: InsertEvent<any>): Promise<void> {
        const entity = event.entity;
        if (!entity || !hasEtablissementColumn(entity)) return;
        if (GLOBAL_ENTITIES.has(entity.constructor.name)) return;

        const currentEtablissementId = getCurrentEtablissementId();

        // Si l'entité a déjà un etablissementId, vérifier la cohérence
        if (entity.etablissementId && currentEtablissementId) {
            if (entity.etablissementId !== currentEtablissementId) {
                const ctx = getTenantContext();
                const msg =
                    `[TenantIsolation] INSERT cross-tenant: ` +
                    `entité=${entity.constructor.name}, ` +
                    `entity.etablissementId=${entity.etablissementId}, ` +
                    `context=${currentEtablissementId}, ` +
                    `utilisateur=${ctx?.utilisateurId || 'inconnu'}`;

                if (STRICT_MODE) {
                    // Durcissement v9 : rejet explicite au lieu d'écraser
                    logger.error(`[TenantIsolation] ${msg} — REJETÉ (mode strict)`);
                    throw new Error(`Cross-tenant détecté : l'entité appartient à un autre établissement (${entity.etablissementId.substring(0, 8)}... ≠ ${currentEtablissementId.substring(0, 8)}...)`);
                }

                logger.warn(`[TenantIsolation] ${msg} — écrasé (mode dev)`);
                // Forcer le contexte courant (protection cross-tenant)
                entity.etablissementId = currentEtablissementId;
            }
            return;
        }

        // Injecter automatiquement si manquant
        if (currentEtablissementId && !entity.etablissementId) {
            entity.etablissementId = currentEtablissementId;
        }
    }

    /**
     * beforeUpdate — Empêche la modification cross-tenant.
     * Si l'entité en base a un etablissementId différent du contexte,
     * l'opération est bloquée.
     */
    async beforeUpdate(event: UpdateEvent<any>): Promise<void> {
        const entity = event.entity;
        if (!entity || !hasEtablissementColumn(entity)) return;
        if (GLOBAL_ENTITIES.has(entity.constructor.name)) return;

        const currentEtablissementId = getCurrentEtablissementId();
        if (!currentEtablissementId) return; // Pas de contexte (SUPER_ADMIN, cron)

        // Vérifier que l'entité appartient au tenant courant
        if (entity.etablissementId && entity.etablissementId !== currentEtablissementId) {
            const ctx = getTenantContext();
            const msg =
                `[TenantIsolation] UPDATE cross-tenant: ` +
                `entité=${entity.constructor.name}, ` +
                `entity.etablissementId=${entity.etablissementId}, ` +
                `context=${currentEtablissementId}, ` +
                `utilisateur=${ctx?.utilisateurId || 'inconnu'}`;

            if (STRICT_MODE) {
                // Durcissement v9 : rejet explicite
                logger.error(`[TenantIsolation] ${msg} — REJETÉ (mode strict)`);
                throw new Error(`Cross-tenant détecté : modification refusée (entité=${entity.etablissementId.substring(0, 8)}... ≠ contexte=${currentEtablissementId.substring(0, 8)}...)`);
            }

            logger.error(`[TenantIsolation] UPDATE cross-tenant BLOQUÉ: ${msg} — écrasé (mode dev)`);
            // Empêcher la modification en forçant le bon etablissementId
            entity.etablissementId = currentEtablissementId;
        }
    }

    /**
     * afterLoad — Vérification post-chargement (mode audit).
     * Log les incohérences mais ne bloque pas (la lecture est autorisée
     * pour SUPER_ADMIN via le sentinel RLS).
     */
    afterLoad(event: LoadEvent<any>): void {
        const entity = event.entity;
        if (!entity || !hasEtablissementColumn(entity)) return;
        if (GLOBAL_ENTITIES.has(entity.constructor?.name)) return;

        const currentEtablissementId = getCurrentEtablissementId();
        if (!currentEtablissementId) return; // Pas de contexte

        // Mode audit : logger si incohérence détectée
        if (entity.etablissementId && entity.etablissementId !== currentEtablissementId) {
            // Ne pas bloquer — juste logger pour monitoring
            // Le RLS PostgreSQL est la dernière ligne de défense
            logger.warn(
                `[TenantIsolation] afterLoad — entité hors tenant: ` +
                `${entity.constructor?.name}(id=${entity.id?.substring(0, 8)}), ` +
                `entity.etab=${entity.etablissementId.substring(0, 8)}, ` +
                `context=${currentEtablissementId.substring(0, 8)}`
            );
        }
    }
}
