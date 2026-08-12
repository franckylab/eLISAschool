/**
 * ==================================
 * eLISAschool - Service IP Allowlist
 * ==================================
 * Durcissement v9 — Vérification des IPs autorisées pour l'accès plateforme.
 *
 * Cache Redis TTL 5 min pour éviter un query DB à chaque requête.
 * Si la liste est vide → pas de restriction (backward compat).
 */

import { AppDataSource } from '@database/data-source';
import { IpAutorisee } from '../entities/ip-autorisee.entity';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

const CACHE_KEY = 'platform:ip-allowlist';
const CACHE_TTL = 300; // 5 minutes

class IpAllowlistService {
    private repo = AppDataSource.getRepository(IpAutorisee);

    /**
     * Vérifie si une IP est autorisée à accéder à la plateforme.
     * 
     * @returns true si l'IP est autorisée (ou si la liste est vide = pas de restriction)
     */
    async verifierIp(ip: string): Promise<boolean> {
        const allowedIps = await this.getAllowedIps();

        // Liste vide → pas de restriction (backward compat)
        if (allowedIps.length === 0) return true;

        return allowedIps.includes(ip);
    }

    /**
     * Récupère la liste des IPs autorisées (cache Redis ou DB).
     */
    private async getAllowedIps(): Promise<string[]> {
        // 1. Cache Redis
        try {
            const cached = await redisService.getJSON<{ ips: string[] }>(CACHE_KEY);
            if (cached?.ips) return cached.ips;
        } catch {
            // Redis indisponible
        }

        // 2. DB
        const entries = await this.repo.find({
            where: { active: true },
            select: ['ip', 'expireAt'],
        });

        // Filtrer les IPs expirées
        const now = new Date();
        const ips = entries
            .filter(e => !e.expireAt || e.expireAt > now)
            .map(e => e.ip);

        // 3. Mettre en cache
        try {
            await redisService.setJSON(CACHE_KEY, { ips }, CACHE_TTL);
        } catch {
            // Non bloquant
        }

        return ips;
    }

    /**
     * Invalide le cache de la liste (à appeler après modification).
     */
    async invalidateCache(): Promise<void> {
        try {
            await redisService.del(CACHE_KEY);
        } catch {
            // Non bloquant
        }
    }

    /**
     * Ajoute une IP à la liste.
     */
    async ajouter(ip: string, label: string | undefined, createdBy: string, expireAt?: Date): Promise<IpAutorisee> {
        const entry = this.repo.create({ ip, label, active: true, createdBy, expireAt });
        const saved = await this.repo.save(entry);
        await this.invalidateCache();
        logger.info(`[IP Allowlist] IP ajoutée: ${ip} (${label || 'sans label'})`);
        return saved;
    }

    /**
     * Supprime une IP de la liste.
     */
    async supprimer(id: string): Promise<boolean> {
        const result = await this.repo.delete(id);
        if (result.affected && result.affected > 0) {
            await this.invalidateCache();
            logger.info(`[IP Allowlist] IP supprimée: ${id}`);
            return true;
        }
        return false;
    }

    /**
     * Liste toutes les IPs autorisées.
     */
    async lister(): Promise<IpAutorisee[]> {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }
}

export const ipAllowlistService = new IpAllowlistService();
export default ipAllowlistService;
