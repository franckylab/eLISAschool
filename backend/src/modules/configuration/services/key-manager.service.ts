/**
 * ==================================
 * eLISAschool - KeyManager Service
 * ==================================
 * Durcissement v9 — Gestion centralisée des clés cryptographiques.
 *
 * Responsabilités :
 * - getActiveKey(type) : retourner la clé active du type donné (cache Redis TTL 1 min)
 * - rotateKey(type) : créer nouvelle version, passer l'ancienne en ROTATION (grace 7j)
 * - init() : au démarrage, vérifier qu'au moins une clé ACTIVE existe par type
 * - cronRotation() : tous les 90 jours, rotation automatique
 *
 * Les valeurs sont chiffrées en base avec AES-256-GCM via MASTER_KEY.
 * MASTER_KEY = ENCRYPTION_KEY (doit être dans .env).
 */

import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import {
    CleCryptographique,
    TypeCleCryptographique,
    StatutCleCryptographique,
} from '../entities/cle-cryptographique.entity';
import { redisService } from '@common/services/redis.service';
import { logger } from '@common/utils/logger.util';

const CACHE_PREFIX = 'keymanager:active:';
const CACHE_TTL = 60; // 1 minute
const GRACE_PERIOD_DAYS = 7;

export class KeyManagerService {
    private cleRepo: Repository<CleCryptographique>;
    private initialized = false;

    constructor() {
        this.cleRepo = AppDataSource.getRepository(CleCryptographique);
    }

    // ==================================
    // Initialisation
    // ==================================

    /**
     * Initialise le KeyManager au démarrage de l'application.
     * Vérifie qu'au moins une clé ACTIVE existe pour chaque type requis.
     * Si des clés manquent, les crée depuis les variables d'environnement.
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        try {
            const typesRequis = [
                TypeCleCryptographique.JWT,
                TypeCleCryptographique.ENCRYPTION,
                TypeCleCryptographique.MFA,
                TypeCleCryptographique.AUDIT_HMAC,
            ];

            for (const type of typesRequis) {
                const activeKey = await this.cleRepo.findOne({
                    where: { type, statut: StatutCleCryptographique.ACTIVE },
                });

                if (!activeKey) {
                    // Créer la clé depuis les variables d'environnement
                    await this.creerDepuisEnv(type);
                    logger.info(`[KeyManager] Clé ${type} créée depuis l'environnement`);
                }
            }

            // Planifier les clés en rotation expirée → REVOQUEE
            await this.purgerClesExpirees();

            this.initialized = true;
            logger.info('[KeyManager] Initialisé avec succès');
        } catch (error) {
            logger.error('[KeyManager] Erreur initialisation', error);
            // En développement, ne pas bloquer le démarrage
            if (process.env.NODE_ENV === 'production') {
                throw error;
            }
        }
    }

    // ==================================
    // Récupération des clés
    // ==================================

    /**
     * Retourne la clé active du type donné.
     * Utilise un cache Redis TTL 1 min pour éviter les queries DB.
     * 
     * @returns La valeur de la clé en clair (déchiffrée)
     */
    async getActiveKey(type: TypeCleCryptographique): Promise<string> {
        const cacheKey = `${CACHE_PREFIX}${type}`;

        // 1. Cache Redis
        try {
            const cached = await redisService.get(cacheKey);
            if (cached) return cached;
        } catch {
            // Redis indisponible
        }

        // 2. Base de données
        const cle = await this.cleRepo.findOne({
            where: { type, statut: StatutCleCryptographique.ACTIVE },
            order: { version: 'DESC' },
        });

        if (!cle) {
            // Fallback sur les variables d'environnement
            return this.getKeyFromEnv(type);
        }

        // 3. Déchiffrer la valeur
        const valeur = this.dechiffrerValeur(cle.valeur);
        if (!valeur) {
            logger.error(`[KeyManager] Erreur déchiffrement clé ${type}`);
            return this.getKeyFromEnv(type);
        }

        // 4. Mettre en cache
        try {
            await redisService.set(cacheKey, valeur, 'EX', CACHE_TTL);
        } catch {
            // Non bloquant
        }

        return valeur;
    }

    // ==================================
    // Rotation des clés
    // ==================================

    /**
     * Effectue la rotation d'une clé :
     * 1. Passe l'ancienne clé en ROTATION (grace period 7j)
     * 2. Crée une nouvelle clé ACTIVE avec version incrémentée
     * 3. Invalide le cache
     */
    async rotateKey(type: TypeCleCryptographique, creePar?: string): Promise<{
        ancienneVersion: number;
        nouvelleVersion: number;
    }> {
        // 1. Trouver la clé active actuelle
        const cleActive = await this.cleRepo.findOne({
            where: { type, statut: StatutCleCryptographique.ACTIVE },
            order: { version: 'DESC' },
        });

        const ancienneVersion = cleActive?.version || 0;

        // 2. Passer l'ancienne en ROTATION
        if (cleActive) {
            cleActive.statut = StatutCleCryptographique.ROTATION;
            cleActive.dateRotation = new Date();
            // Définir la date d'expiration (grace period = 7 jours)
            cleActive.dateExpiration = new Date(Date.now() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
            await this.cleRepo.save(cleActive);
        }

        // 3. Générer une nouvelle clé
        const nouvelleValeur = this.genererValeur(type);
        const nouvelleCle = this.cleRepo.create({
            nom: `${type.toLowerCase()}-v${ancienneVersion + 1}`,
            type,
            valeur: this.chiffrerValeur(nouvelleValeur),
            statut: StatutCleCryptographique.ACTIVE,
            version: ancienneVersion + 1,
            dateRotation: new Date(),
            dureeRotationJours: cleActive?.dureeRotationJours || 90,
            creePar,
        });

        await this.cleRepo.save(nouvelleCle);

        // 4. Invalider le cache
        try {
            await redisService.del(`${CACHE_PREFIX}${type}`);
        } catch {
            // Non bloquant
        }

        logger.info(
            `[KeyManager] Rotation clé ${type} : v${ancienneVersion} → v${ancienneVersion + 1}`
        );

        return {
            ancienneVersion,
            nouvelleVersion: ancienneVersion + 1,
        };
    }

    /**
     * Vérifie toutes les clés et effectue les rotations nécessaires
     * (clés dont la date de rotation dépasse la durée configurée).
     */
    async verifierEtTournerCles(): Promise<{ rotations: { type: string; from: number; to: number }[] }> {
        const rotations: { type: string; from: number; to: number }[] = [];

        const clesActives = await this.cleRepo.find({
            where: { statut: StatutCleCryptographique.ACTIVE },
        });

        for (const cle of clesActives) {
            if (cle.necessiteRotation()) {
                const result = await this.rotateKey(cle.type);
                rotations.push({
                    type: cle.type,
                    from: result.ancienneVersion,
                    to: result.nouvelleVersion,
                });
            }
        }

        if (rotations.length > 0) {
            logger.info(`[KeyManager] Rotations automatiques : ${rotations.length} clé(s) tournée(s)`);
        }

        return { rotations };
    }

    // ==================================
    // Purge des clés expirées
    // ==================================

    /**
     * Passe les clés en ROTATION dont la période de grâce est terminée → REVOQUEE.
     */
    async purgerClesExpirees(): Promise<number> {
        const now = new Date();
        const clesEnRotation = await this.cleRepo.find({
            where: { statut: StatutCleCryptographique.ROTATION },
        });

        let count = 0;
        for (const cle of clesEnRotation) {
            if (cle.dateExpiration && cle.dateExpiration < now) {
                cle.statut = StatutCleCryptographique.REVOQUEE;
                await this.cleRepo.save(cle);
                count++;
                logger.info(`[KeyManager] Clé ${cle.nom} révoquée (grace period terminée)`);
            }
        }

        return count;
    }

    // ==================================
    // Information
    // ==================================

    /**
     * Liste toutes les clés avec leur statut.
     */
    async listerCles(): Promise<CleCryptographique[]> {
        return this.cleRepo.find({
            order: { type: 'ASC', version: 'DESC' },
            select: ['id', 'nom', 'type', 'statut', 'version', 'dateRotation', 'dateExpiration', 'dureeRotationJours', 'createdAt'],
        });
    }

    /**
     * Retourne l'historique des versions pour un type donné.
     */
    async getHistorique(type: TypeCleCryptographique): Promise<CleCryptographique[]> {
        return this.cleRepo.find({
            where: { type },
            order: { version: 'DESC' },
            select: ['id', 'nom', 'statut', 'version', 'dateRotation', 'dateExpiration', 'createdAt'],
        });
    }

    // ==================================
    // Méthodes privées
    // ==================================

    /**
     * Crée une clé depuis les variables d'environnement.
     */
    private async creerDepuisEnv(type: TypeCleCryptographique): Promise<void> {
        const valeur = this.getKeyFromEnv(type);
        const cle = this.cleRepo.create({
            nom: `${type.toLowerCase()}-v1`,
            type,
            valeur: this.chiffrerValeur(valeur),
            statut: StatutCleCryptographique.ACTIVE,
            version: 1,
            dateRotation: new Date(),
            dureeRotationJours: 90,
        });
        await this.cleRepo.save(cle);
    }

    /**
     * Récupère la valeur d'une clé depuis les variables d'environnement.
     */
    private getKeyFromEnv(type: TypeCleCryptographique): string {
        switch (type) {
            case TypeCleCryptographique.JWT:
                return process.env.JWT_SECRET || this.genererAleatoire(64);
            case TypeCleCryptographique.ENCRYPTION:
                return process.env.ENCRYPTION_KEY || this.genererAleatoire(32);
            case TypeCleCryptographique.MFA:
                return process.env.ENCRYPTION_KEY || this.genererAleatoire(32);
            case TypeCleCryptographique.AUDIT_HMAC:
                return process.env.AUDIT_HMAC_KEY || process.env.ENCRYPTION_KEY || this.genererAleatoire(64);
            default:
                throw new Error(`Type de clé inconnu : ${type}`);
        }
    }

    /**
     * Génère une nouvelle valeur aléatoire selon le type de clé.
     */
    private genererValeur(type: TypeCleCryptographique): string {
        switch (type) {
            case TypeCleCryptographique.JWT:
                return crypto.randomBytes(64).toString('hex');
            case TypeCleCryptographique.ENCRYPTION:
                return crypto.randomBytes(32).toString('hex').substring(0, 32);
            case TypeCleCryptographique.MFA:
                return crypto.randomBytes(32).toString('hex');
            case TypeCleCryptographique.AUDIT_HMAC:
                return crypto.randomBytes(64).toString('hex');
            default:
                return crypto.randomBytes(32).toString('hex');
        }
    }

    /**
     * Génère une chaîne aléatoire de la longueur donnée.
     */
    private genererAleatoire(length: number): string {
        return crypto.randomBytes(length).toString('hex').substring(0, length);
    }

    /**
     * Chiffre une valeur avec AES-256-GCM pour stockage en base.
     * La clé de chiffrement est dérivée de ENCRYPTION_KEY.
     */
    private chiffrerValeur(valeur: string): string {
        const masterKey = this.getMasterKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);

        let encrypted = cipher.update(valeur, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Format : iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Déchiffre une valeur stockée en base.
     */
    private dechiffrerValeur(stored: string): string | null {
        try {
            const parts = stored.split(':');
            if (parts.length !== 3) return null;

            const [ivHex, authTagHex, encrypted] = parts;
            const masterKey = this.getMasterKey();
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return null;
        }
    }

    /**
     * Dériver la clé master depuis ENCRYPTION_KEY.
     */
    private getMasterKey(): Buffer {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        if (!encryptionKey && process.env.NODE_ENV === 'production') {
            throw new Error('[KeyManager] ENCRYPTION_KEY est obligatoire en production');
        }
        const baseKey = encryptionKey || 'dev-master-key-ephemere';
        return crypto.createHash('sha256').update(baseKey).digest();
    }
}

export const keyManagerService = new KeyManagerService();
export default KeyManagerService;
