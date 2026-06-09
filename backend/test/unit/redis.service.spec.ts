/**
 * ==================================
 * eLISAschool - Tests Service Redis
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import { redisService } from '../src/common/services/redis.service';

describe('RedisService', () => {
    beforeAll(async () => {
        // Nettoyer avant les tests
        await redisService.flush();
    });

    afterAll(async () => {
        await redisService.disconnect();
    });

    describe('get/set', () => {
        it('devrait stocker et récupérer une valeur string', async () => {
            await redisService.set('test:key1', 'valeur1');
            const result = await redisService.get('test:key1');
            expect(result).toBe('valeur1');
        });

        it('devrait stocker et récupérer un objet JSON', async () => {
            const obj = { nom: 'Test', valeur: 42 };
            await redisService.setJSON('test:obj1', obj);
            const result = await redisService.getJSON('test:obj1');
            expect(result).toEqual(obj);
        });

        it('devrait retourner null pour une clé inexistante', async () => {
            const result = await redisService.get('test:inexistant');
            expect(result).toBeNull();
        });
    });

    describe('TTL', () => {
        it('devrait expirer une clé après le TTL', async () => {
            await redisService.set('test:ttl', 'expirable', 1); // 1 seconde
            
            // Vérifier qu'elle existe
            const exists1 = await redisService.exists('test:ttl');
            expect(exists1).toBe(true);

            // Attendre l'expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Vérifier qu'elle n'existe plus
            const exists2 = await redisService.exists('test:ttl');
            expect(exists2).toBe(false);
        });
    });

    describe('delete', () => {
        it('devrait supprimer une clé', async () => {
            await redisService.set('test:del', 'à supprimer');
            await redisService.del('test:del');
            const result = await redisService.get('test:del');
            expect(result).toBeNull();
        });
    });

    describe('incr/decr', () => {
        it('devrait incrémenter un compteur', async () => {
            await redisService.set('test:counter', '0');
            const val1 = await redisService.incr('test:counter');
            expect(val1).toBe(1);
            
            const val2 = await redisService.incr('test:counter');
            expect(val2).toBe(2);
        });

        it('devrait décrémenter un compteur', async () => {
            await redisService.set('test:counter2', '5');
            const val = await redisService.decr('test:counter2');
            expect(val).toBe(4);
        });
    });

    describe('keys', () => {
        it('devrait trouver des clés par pattern', async () => {
            await redisService.set('test:pattern:1', 'a');
            await redisService.set('test:pattern:2', 'b');
            await redisService.set('test:other', 'c');

            const keys = await redisService.keys('test:pattern:*');
            expect(keys).toHaveLength(2);
            expect(keys).toContain('test:pattern:1');
            expect(keys).toContain('test:pattern:2');
        });
    });

    describe('stats', () => {
        it('devrait retourner les statistiques Redis', async () => {
            const stats = await redisService.getStats();
            expect(stats.connected).toBe(true);
            expect(stats.usedMemory).toBeDefined();
            expect(stats.connectedClients).toBeDefined();
        });
    });
});
