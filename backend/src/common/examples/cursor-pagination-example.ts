/**
 * ==================================
 * eLISAschool - Exemple Cursor-Based Pagination
 * ==================================
 * 
 * Ce fichier montre comment utiliser la pagination par curseur
 * pour l'infinite scroll et les applications temps réel.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
    paginateWithCursor,
    encodeCursor,
    decodeCursor,
    CursorPaginatedResult,
} from '@common/utils/pagination.util';

// ============================================
// EXEMPLE 1 : Infinite Scroll Basique
// ============================================

/**
 * Schéma de requête pour infinite scroll
 */
export const infiniteScrollSchema = z.object({
    cursor: z.string().optional(), // Cursor encodé en base64
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InfiniteScrollDto = z.infer<typeof infiniteScrollSchema>;

/**
 * Service avec pagination par curseur
 */
export class NotificationsInfiniteScrollService {
    private notificationRepo: any; // Repository<Notification>

    /**
     * Récupère les notifications avec infinite scroll
     * 
     * @param utilisateurId - ID de l'utilisateur
     * @param query - Paramètres de requête (cursor + limit)
     * @returns Résultat paginé par curseur
     */
    async getNotifications(
        utilisateurId: string,
        query: InfiniteScrollDto
    ): Promise<CursorPaginatedResult<any>> {
        const { cursor: encodedCursor, limit } = query;

        // Décoder le cursor
        const cursorValue = encodedCursor ? decodeCursor(encodedCursor) : null;

        const qb = this.notificationRepo
            .createQueryBuilder('n')
            .where('n.destinataireId = :utilisateurId', { utilisateurId })
            .andWhere('n.supprime = false');

        // Utiliser la pagination par curseur
        return paginateWithCursor(
            qb,
            'createdAt', // Champ utilisé comme curseur
            cursorValue,
            limit,
            'forward'
        );
    }
}

/**
 * Controller pour infinite scroll
 */
export class NotificationsInfiniteScrollController {
    async getNotifications(req: Request, res: Response) {
        try {
            const query = infiniteScrollSchema.parse(req.query);
            const utilisateurId = req.utilisateur!.id;

            const service = new NotificationsInfiniteScrollService();
            const result = await service.getNotifications(utilisateurId, query);

            // Encoder les curseurs pour la réponse
            const response = {
                success: true,
                data: result.items,
                meta: {
                    nextCursor: result.meta.nextCursor ? encodeCursor(result.meta.nextCursor) : null,
                    previousCursor: result.meta.previousCursor ? encodeCursor(result.meta.previousCursor) : null,
                    itemCount: result.meta.itemCount,
                    hasNextPage: result.meta.hasNextPage,
                    hasPreviousPage: result.meta.hasPreviousPage,
                },
            };

            res.status(200).json(response);
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

// ============================================
// EXEMPLE 2 : Chat en Temps Réel
// ============================================

/**
 * Service de messagerie avec curseur pour le chat
 */
export class ChatService {
    private messageRepo: any; // Repository<Message>

    /**
     * Récupère les messages d'une conversation avec navigation avant/arrière
     * 
     * @param conversationId - ID de la conversation
     * @param cursor - Cursor (message ID)
     * @param limit - Nombre de messages
     * @param direction - Direction (forward pour anciens, backward pour récents)
     */
    async getMessages(
        conversationId: string,
        cursor: string | null,
        limit: number = 50,
        direction: 'forward' | 'backward' = 'forward'
    ): Promise<CursorPaginatedResult<any>> {
        const qb = this.messageRepo
            .createQueryBuilder('m')
            .where('m.conversationId = :conversationId', { conversationId })
            .andWhere('m.supprime = false');

        return paginateWithCursor(qb, 'createdAt', cursor, limit, direction);
    }
}

/**
 * Controller pour le chat
 */
export class ChatController {
    async loadMoreMessages(req: Request, res: Response) {
        try {
            const { conversationId } = req.params;
            const { cursor, limit = 50, direction = 'forward' } = req.query;

            const service = new ChatService();
            const result = await service.getMessages(
                conversationId,
                cursor as string,
                Number(limit),
                direction as 'forward' | 'backward'
            );

            res.status(200).json({
                success: true,
                data: result.items,
                meta: {
                    nextCursor: result.meta.nextCursor ? encodeCursor(result.meta.nextCursor) : null,
                    previousCursor: result.meta.previousCursor ? encodeCursor(result.meta.previousCursor) : null,
                    hasNextPage: result.meta.hasNextPage,
                    hasPreviousPage: result.meta.hasPreviousPage,
                },
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }
}

// ============================================
// EXEMPLE 3 : Feed d'Actualités
// ============================================

/**
 * Service de feed avec curseur sur createdAt
 */
export class FeedService {
    private postRepo: any; // Repository<Post>

    /**
     * Récupère le feed d'actualités
     * Parfait pour infinite scroll sur mobile/web
     */
    async getFeed(
        utilisateurId: string,
        cursor: string | null,
        limit: number = 20
    ): Promise<CursorPaginatedResult<any>> {
        const qb = this.postRepo
            .createQueryBuilder('p')
            .innerJoin('p.auteurs', 'a', 'a.id = :utilisateurId', { utilisateurId })
            .where('p.publie = true')
            .orderBy('p.createdAt', 'DESC');

        return paginateWithCursor(qb, 'createdAt', cursor, limit, 'forward');
    }
}

// ============================================
// COMPARAISON : Offset vs Cursor
// ============================================

/**
 * COMPARAISON DÉTAILLÉE
 * 
 * PAGINATION OFFSET (TRADITIONNELLE)
 * ===================================
 * Avantages :
 * - Simple à comprendre
 * - Permet de sauter à une page spécifique
 * - Bon pour les résultats de recherche
 * 
 * Inconvénients :
 * - Performance dégradée à grande profondeur (OFFSET 100000 = lent)
 * - Problèmes de données dupliquées si insertion/suppression entre les pages
 * - COUNT coûteux sur grosses tables
 * 
 * Utiliser pour :
 * - Résultats de recherche
 * - Tableaux de données avec navigation par pages
 * - Quand l'utilisateur veut aller à une page spécifique
 * 
 * 
 * PAGINATION CURSEUR (INFINITE SCROLL)
 * =====================================
 * Avantages :
 * - Performance CONSTANTE (toujours aussi rapide)
 * - Pas de données dupliquées/manquantes
 * - Pas besoin de COUNT
 * - Parfait pour temps réel
 * 
 * Inconvénients :
 * - Impossible de sauter à une page spécifique
 * - Nécessite un champ de tri unique (ID, timestamp)
 * - Moins intuitif pour certains utilisateurs
 * 
 * Utiliser pour :
 * - Infinite scroll (réseaux sociaux, feeds)
 * - Chat et messagerie
 * - Notifications
 * - Données en temps réel
 * - Applications mobiles
 */

// ============================================
// EXEMPLE D'UTILISATION FRONTEND
// ============================================

/**
 * Exemple d'implémentation côté frontend (JavaScript/TypeScript)
 * 
 * ```typescript
 * // Infinite Scroll avec React
 * import { useState, useEffect } from 'react';
 * 
 * function useInfiniteScroll(apiUrl: string) {
 *   const [items, setItems] = useState([]);
 *   const [cursor, setCursor] = useState<string | null>(null);
 *   const [hasNext, setHasNext] = useState(true);
 *   const [loading, setLoading] = useState(false);
 * 
 *   const loadMore = async () => {
 *     if (!hasNext || loading) return;
 * 
 *     setLoading(true);
 *     const params = new URLSearchParams({
 *       limit: '20',
 *       ...(cursor && { cursor }),
 *     });
 * 
 *     const response = await fetch(`${apiUrl}?${params}`);
 *     const data = await response.json();
 * 
 *     setItems(prev => [...prev, ...data.data]);
 *     setCursor(data.meta.nextCursor);
 *     setHasNext(data.meta.hasNextPage);
 *     setLoading(false);
 *   };
 * 
 *   return { items, loadMore, hasNext, loading };
 * }
 * 
 * // Utilisation dans un composant
 * function NotificationsList() {
 *   const { items, loadMore, hasNext, loading } = useInfiniteScroll('/api/notifications');
 * 
 *   return (
 *     <div>
 *       {items.map(item => <NotificationCard key={item.id} item={item} />)}
 *       {hasNext && <button onClick={loadMore} disabled={loading}>
 *         {loading ? 'Chargement...' : 'Charger plus'}
 *       </button>}
 *     </div>
 *   );
 * }
 * ```
 */

export {};
