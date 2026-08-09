/**
 * ==================================
 * eLISAschool - Utilitaire de Chiffrement
 * ==================================
 * 
 * Chiffrement/déchiffrement AES-256-GCM pour les données sensibles.
 * Utilisé pour les credentials providers (payment, SMS, email).
 * 
 * Phase P5.3 — Refonte SaaS v6
 */

import crypto from 'crypto';
import { logger } from './logger.util';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits pour GCM (recommandé NIST)
const TAG_LENGTH = 16; // 128 bits auth tag
const KEY_LENGTH = 32; // 256 bits

/**
 * Dériver une clé de chiffrement depuis les variables d'environnement.
 * Utilise ENCRYPTION_KEY ou fallback sur JWT_SECRET.
 */
function getEncryptionKey(): Buffer {
    const raw = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'eLISAschool-default-key-change-me';
    // SHA-256 pour garantir exactement 32 bytes
    return crypto.createHash('sha256').update(raw).digest();
}

/**
 * Chiffre une chaîne (typiquement JSON.stringify d'credentials).
 * Retourne le format: iv:authTag:encrypted (base64).
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Format: iv:tag:encrypted (tout en base64)
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Déchiffre une chaîne chiffrée par encrypt().
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();
    const parts = ciphertext.split(':');

    if (parts.length !== 3) {
        throw new Error('Format de chiffrement invalide (attendu iv:tag:encrypted)');
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = Buffer.from(parts[2], 'base64');

    if (iv.length !== IV_LENGTH) {
        throw new Error('IV de longueur invalide');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}

/**
 * Chiffre un objet JSON (credentials, secrets, etc.).
 */
export function encryptJSON(data: Record<string, any>): string {
    return encrypt(JSON.stringify(data));
}

/**
 * Déchiffre vers un objet JSON.
 */
export function decryptJSON<T = Record<string, any>>(ciphertext: string): T | null {
    try {
        const plaintext = decrypt(ciphertext);
        return JSON.parse(plaintext) as T;
    } catch (error: any) {
        logger.error(`[Encryption] Erreur déchiffrement: ${error.message}`);
        return null;
    }
}

/**
 * Vérifie si une chaîne est chiffrée (format iv:tag:encrypted).
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(':');
    if (parts.length !== 3) return false;
    try {
        // Vérifier que chaque partie est du base64 valide
        Buffer.from(parts[0], 'base64');
        Buffer.from(parts[1], 'base64');
        Buffer.from(parts[2], 'base64');
        return parts[0].length > 0 && parts[1].length > 0 && parts[2].length > 0;
    } catch {
        return false;
    }
}

/**
 * Chiffre les credentials s'ils ne le sont pas déjà (idempotent).
 */
export function encryptIfNeeded(credentials: string | Record<string, any>): string {
    const json = typeof credentials === 'string' ? credentials : JSON.stringify(credentials);

    // Si déjà chiffré, retourner tel quel
    if (typeof credentials === 'string' && isEncrypted(credentials)) {
        return credentials;
    }

    return encrypt(json);
}

export const encryptionUtil = {
    encrypt,
    decrypt,
    encryptJSON,
    decryptJSON,
    isEncrypted,
    encryptIfNeeded,
};

export default encryptionUtil;
