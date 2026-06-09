/**
 * ==================================
 * eLISAschool - Utilitaire de chiffrement AES-256
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 */

import crypto from 'crypto';

// Algorithme de chiffrement
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 * @returns Buffer de la clé de 32 octets
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key || key.length !== 32) {
        throw new Error('La clé de chiffrement doit faire exactement 32 caractères');
    }

    return Buffer.from(key, 'utf-8');
}

/**
 * Chiffre une chaîne de caractères avec AES-256-GCM
 * @param plaintext - Texte en clair à chiffrer
 * @returns Texte chiffré encodé en base64 (IV + AuthTag + CipherText)
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf-8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: IV (hex) + AuthTag (hex) + Encrypted (hex)
    const result = iv.toString('hex') + authTag.toString('hex') + encrypted;

    return Buffer.from(result, 'hex').toString('base64');
}

/**
 * Déchiffre une chaîne chiffrée avec AES-256-GCM
 * @param ciphertext - Texte chiffré encodé en base64
 * @returns Texte en clair déchiffré
 */
export function decrypt(ciphertext: string): string {
    const key = getEncryptionKey();

    // Décodage base64
    const data = Buffer.from(ciphertext, 'base64').toString('hex');

    // Extraction des composants
    const iv = Buffer.from(data.substring(0, IV_LENGTH * 2), 'hex');
    const authTag = Buffer.from(data.substring(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2), 'hex');
    const encrypted = data.substring((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');

    return decrypted;
}

/**
 * Génère un hash SHA-256 d'une chaîne
 * @param data - Données à hacher
 * @returns Hash en hexadécimal
 */
export function hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Génère un token aléatoire sécurisé
 * @param length - Longueur du token en octets (défaut: 32)
 * @returns Token en hexadécimal
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Compare deux chaînes de manière sécurisée (timing-safe)
 * @param a - Première chaîne
 * @param b - Deuxième chaîne
 * @returns true si les chaînes sont identiques
 */
export function secureCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

export default {
    encrypt,
    decrypt,
    hash,
    generateSecureToken,
    secureCompare,
};
