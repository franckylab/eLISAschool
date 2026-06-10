/**
 * ==================================
 * eLISAschool - Service Brouillons Messages
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gestion des brouillons de messages avec Redis
 * Sauvegarde automatique, sync multi-device, expiration
 */

import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';

interface DraftMessage {
    conversationId: string;
    contenu: string;
    piecesJointes?: Array<{ nom: string; url: string; type: string; taille: number }>;
    createdAt: string;
    updatedAt: string;
}

export class MessageDraftService {
    private readonly DRAFT_TTL = 7 * 24 * 60 * 60; // 7 jours en secondes
    private readonly AUTO_SAVE_DELAY = 3000; // 3 secondes

    /**
     * Sauvegarder un brouillon
     */
    async saveDraft(
        conversationId: string,
        userId: string,
        contenu: string,
        piecesJointes?: Array<{ nom: string; url: string; type: string; taille: number }>
    ): Promise<DraftMessage> {
        const key = this.getDraftKey(conversationId, userId);

        const draft: DraftMessage = {
            conversationId,
            contenu,
            piecesJointes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Sauvegarder dans Redis avec TTL
        await redisService.setJSON(key, draft, this.DRAFT_TTL);

        logger.info(`[Draft] Brouillon sauvegardé pour conversation ${conversationId}`);

        return draft;
    }

    /**
     * Récupérer un brouillon
     */
    async getDraft(
        conversationId: string,
        userId: string
    ): Promise<DraftMessage | null> {
        const key = this.getDraftKey(conversationId, userId);

        try {
            const draft = await redisService.getJSON<DraftMessage>(key);
            return draft || null;
        } catch {
            return null;
        }
    }

    /**
     * Supprimer un brouillon
     */
    async deleteDraft(
        conversationId: string,
        userId: string
    ): Promise<void> {
        const key = this.getDraftKey(conversationId, userId);

        await redisService.del(key);

        logger.info(`[Draft] Brouillon supprimé pour conversation ${conversationId}`);
    }

    /**
     * Récupérer tous les brouillons d'un utilisateur
     */
    async getUserDrafts(userId: string): Promise<DraftMessage[]> {
        try {
            const pattern = `messagerie:drafts:${userId}:*`;
            const keys = await redisService.keys(pattern);

            const drafts: DraftMessage[] = [];

            for (const key of keys) {
                const draft = await redisService.getJSON<DraftMessage>(key);
                if (draft) {
                    drafts.push(draft);
                }
            }

            // Trier par date de mise à jour
            drafts.sort((a, b) => 
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return drafts;
        } catch (error) {
            logger.warn(`[Draft] Échec récupération brouillons`, error);
            return [];
        }
    }

    /**
     * Sauvegarde automatique (debounce)
     * À appeler côté client toutes les 3 secondes après modification
     */
    async autoSave(
        conversationId: string,
        userId: string,
        contenu: string,
        piecesJointes?: Array<{ nom: string; url: string; type: string; taille: number }>
    ): Promise<void> {
        // Vérifier si un brouillon existe déjà
        const existing = await this.getDraft(conversationId, userId);

        // Si le contenu est identique, ne pas sauvegarder
        if (existing && existing.contenu === contenu) {
            return;
        }

        // Si le contenu est vide, supprimer le brouillon
        if (!contenu.trim()) {
            await this.deleteDraft(conversationId, userId);
            return;
        }

        // Sauvegarder
        await this.saveDraft(conversationId, userId, contenu, piecesJointes);
    }

    /**
     * Vérifier si un brouillon existe
     */
    async hasDraft(
        conversationId: string,
        userId: string
    ): Promise<boolean> {
        const key = this.getDraftKey(conversationId, userId);
        return await redisService.exists(key);
    }

    /**
     * Nettoyer les brouillons expirés
     */
    async cleanupExpiredDrafts(): Promise<number> {
        try {
            const pattern = 'messagerie:drafts:*';
            const keys = await redisService.keys(pattern);

            let cleaned = 0;

            for (const key of keys) {
                const ttl = await redisService.ttl(key);
                
                // Si TTL < 0 (jamais expiré) ou très faible, supprimer
                if (ttl < 86400) { // Moins d'1 jour restant
                    await redisService.del(key);
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                logger.info(`[Draft] ${cleaned} brouillons expirés nettoyés`);
            }

            return cleaned;
        } catch (error) {
            logger.warn(`[Draft] Échec cleanup`, error);
            return 0;
        }
    }

    /**
     * Statistiques des brouillons
     */
    async getStats(userId: string): Promise<{
        totalDrafts: number;
        oldestDraft: string | null;
        newestDraft: string | null;
    }> {
        const drafts = await this.getUserDrafts(userId);

        if (drafts.length === 0) {
            return {
                totalDrafts: 0,
                oldestDraft: null,
                newestDraft: null,
            };
        }

        return {
            totalDrafts: drafts.length,
            oldestDraft: drafts[drafts.length - 1].updatedAt,
            newestDraft: drafts[0].updatedAt,
        };
    }

    /**
     * Générer la clé Redis pour un brouillon
     */
    private getDraftKey(conversationId: string, userId: string): string {
        return `messagerie:drafts:${userId}:${conversationId}`;
    }
}

export const messageDraftService = new MessageDraftService();
