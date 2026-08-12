/**
 * ==================================
 * eLISAschool - Service MFA (Multi-Factor Authentication)
 * ==================================
 * Version: 3.0.0 — ADR-005 (v11)
 * Auteur: franck arlos chendjou
 *
 * TOTP (Time-based One-Time Password) pour authentification renforcée.
 * Compatible Google Authenticator, Authy, Microsoft Authenticator, etc.
 *
 * ADR-005 : Stockage inline dans utilisateurs (mfaActif, mfaSecretHash,
 * mfaBackupCodesHash, mfaDerniereVerification). Plus de table mfa_configs.
 */

import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Utilisateur } from '../entities';
import { logger } from '@common/utils/logger.util';

/** Durée de validité d'un code TOTP (30 secondes) */
const TOTP_PERIOD = 30;
/** Nombre de chiffres du code */
const TOTP_DIGITS = 6;
/** Nombre de codes de secours générés */
const BACKUP_CODES_COUNT = 10;
/** Algorithme HMAC */
const HMAC_ALGO = 'sha1';
/** Pepper pour le hash des secrets (en prod, dans .env) */
const MFA_PEPPER = process.env.MFA_SECRET_PEPPER || 'elisaschool-mfa-pepper-v6-2025';

export interface MFASetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}

export interface MFAVerifyResult {
    success: boolean;
    message?: string;
}

export interface MFAStatusResult {
    enabled: boolean;
    setupComplete: boolean;
}

export class MFAService {
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    }

    // ==================================
    // TOTP — Fonctions pures
    // ==================================

    /**
     * Génère un secret TOTP (20 bytes = 160 bits, encodé base32).
     */
    genererSecret(): string {
        const buffer = crypto.randomBytes(20);
        return this.base32Encode(buffer);
    }

    /**
     * Génère l'URL du QR code pour Google Authenticator.
     * Format: otpauth://totp/ISSUER:ACCOUNT?secret=SECRET&issuer=ISSUER&algorithm=ALGO&digits=6&period=30
     */
    genererQRCodeUrl(email: string, secret: string): string {
        const issuer = 'eLISAschool';
        const encodedIssuer = encodeURIComponent(issuer);
        const encodedEmail = encodeURIComponent(email);

        return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${HMAC_ALGO.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
    }

    /**
     * Génère un code TOTP pour un secret et un timestamp donnés.
     */
    genererCodeTOTP(secret: string, timestamp?: number): string {
        const time = Math.floor((timestamp || Date.now() / 1000) / TOTP_PERIOD);
        const timeBuffer = Buffer.alloc(8);
        timeBuffer.writeUInt32BE(0, 0);
        timeBuffer.writeUInt32BE(time, 4);

        const secretBuffer = this.base32Decode(secret);
        const hmac = crypto.createHmac(HMAC_ALGO, secretBuffer).update(timeBuffer).digest();

        const offset = hmac[hmac.length - 1] & 0xf;
        const code = (
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff)
        ) % Math.pow(10, TOTP_DIGITS);

        return code.toString().padStart(TOTP_DIGITS, '0');
    }

    /**
     * Vérifie un code TOTP avec une fenêtre de tolérance (±1 période = 90s).
     */
    verifierCode(secret: string, code: string): boolean {
        const now = Math.floor(Date.now() / 1000);

        for (let i = -1; i <= 1; i++) {
            const expectedCode = this.genererCodeTOTP(secret, now + i * TOTP_PERIOD);
            if (code === expectedCode) {
                return true;
            }
        }

        return false;
    }

    // ==================================
    // Setup & Activation
    // ==================================

    /**
     * Configure le MFA pour un utilisateur (ADR-005 : colonnes inline).
     * Génère un nouveau secret, QR code et backup codes.
     * Le MFA n'est PAS encore actif — il faut vérifier le premier code pour l'activer.
     */
    async setupMFA(utilisateurId: string, email: string): Promise<MFASetupResult> {
        const secret = this.genererSecret();
        const qrCodeUrl = this.genererQRCodeUrl(email, secret);
        const backupCodes = this.genererBackupCodes();

        // Chiffrer le secret et les backup codes avant stockage
        const secretChiffre = this.chiffrerSecret(secret);
        const backupCodesChiffres = this.hashBackupCodes(backupCodes);

        // Stocker dans les colonnes inline de utilisateurs
        await this.utilisateurRepo.update(utilisateurId, {
            mfaSecretHash: secretChiffre,
            mfaBackupCodesHash: backupCodesChiffres,
            mfaActif: false, // Pas encore activé
        });

        logger.info(`[MFA] Setup initié pour utilisateur ${utilisateurId}`);

        return {
            secret,
            qrCodeUrl,
            backupCodes,
        };
    }

    /**
     * Active le MFA après vérification du premier code TOTP (ADR-005 : inline).
     */
    async activerMFA(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId },
            select: ['id', 'mfaSecretHash', 'mfaActif'],
        });

        if (!utilisateur || !utilisateur.mfaSecretHash) {
            return { success: false, message: 'Configuration MFA non trouvée. Veuillez initier le setup.' };
        }

        if (utilisateur.mfaActif) {
            return { success: false, message: 'MFA déjà activé.' };
        }

        // Déchiffrer le secret (chiffré réversiblement pendant le setup)
        const secretEnClair = this.dechiffrerSecret(utilisateur.mfaSecretHash);
        if (!secretEnClair) {
            return { success: false, message: 'Erreur de déchiffrement du secret MFA.' };
        }

        if (!this.verifierCode(secretEnClair, code)) {
            return { success: false, message: 'Code TOTP invalide. Veuillez réessayer.' };
        }

        // Activer le MFA : hasher définitivement le secret + activer le flag
        const secretHashFinal = this.hashSecretIrreversible(secretEnClair);
        await this.utilisateurRepo.update(utilisateurId, {
            mfaSecretHash: secretHashFinal,
            mfaActif: true,
            mfaDerniereVerification: new Date(),
            deuxFacteursActif: true,
        });

        logger.info(`[MFA] MFA activé pour utilisateur ${utilisateurId}`);
        return { success: true, message: 'MFA activé avec succès.' };
    }

    // ==================================
    // Vérification MFA (login / opérations critiques)
    // ==================================

    /**
     * Vérifie un code MFA pour un utilisateur (ADR-005 : colonnes inline).
     */
    async verifierMFA(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId, mfaActif: true },
            select: ['id', 'mfaSecretHash'],
        });

        if (!utilisateur || !utilisateur.mfaSecretHash) {
            return { success: false, message: 'MFA non configuré ou non activé.' };
        }

        const secret = this.dechiffrerSecret(utilisateur.mfaSecretHash);
        if (!secret) {
            logger.error(`[MFA] Erreur déchiffrement secret pour utilisateur ${utilisateurId}`);
            return { success: false, message: 'Erreur interne MFA.' };
        }

        if (!this.verifierCode(secret, code)) {
            logger.warn(`[MFA] Code invalide pour utilisateur ${utilisateurId}`);
            return { success: false, message: 'Code TOTP invalide.' };
        }

        // Mettre à jour la dernière vérification
        await this.utilisateurRepo.update(utilisateurId, { mfaDerniereVerification: new Date() });

        return { success: true, message: 'MFA vérifié.' };
    }

    /**
     * Vérifie un code de secours. Consomme le code (usage unique).
     */
    async verifierBackupCode(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId, mfaActif: true },
            select: ['id', 'mfaBackupCodesHash'],
        });

        if (!utilisateur || !utilisateur.mfaBackupCodesHash) {
            return { success: false, message: 'MFA non configuré ou non activé.' };
        }

        const backupCodes = this.dechiffrerBackupCodes(utilisateur.mfaBackupCodesHash);
        const codeNormalise = code.toUpperCase().replace(/\s/g, '');

        const index = backupCodes.findIndex(c => c === codeNormalise);
        if (index === -1) {
            return { success: false, message: 'Code de secours invalide.' };
        }

        // Consommer le code (le retirer de la liste)
        backupCodes.splice(index, 1);
        await this.utilisateurRepo.update(utilisateurId, {
            mfaBackupCodesHash: this.hashBackupCodes(backupCodes),
            mfaDerniereVerification: new Date(),
        });

        logger.info(`[MFA] Code de secours utilisé pour utilisateur ${utilisateurId}. Restants: ${backupCodes.length}`);
        return { success: true, message: `Code de secours vérifié. Il vous reste ${backupCodes.length} codes.` };
    }

    /**
     * Vérifie si le MFA est activé pour un utilisateur (ADR-005 : lecture directe colonne).
     */
    async isMFAEnabled(utilisateurId: string): Promise<boolean> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId },
            select: ['id', 'mfaActif'],
        });
        return utilisateur?.mfaActif ?? false;
    }

    /**
     * Récupère le statut MFA complet d'un utilisateur.
     */
    async getMFAStatus(utilisateurId: string): Promise<MFAStatusResult> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId },
            select: ['id', 'mfaActif', 'mfaSecretHash'],
        });

        return {
            enabled: utilisateur?.mfaActif ?? false,
            setupComplete: !!utilisateur?.mfaSecretHash,
        };
    }

    /**
     * Désactive le MFA pour un utilisateur (ADR-005 : reset colonnes inline).
     */
    async desactiverMFA(utilisateurId: string): Promise<void> {
        await this.utilisateurRepo.update(utilisateurId, {
            mfaActif: false,
            mfaSecretHash: undefined as any,
            mfaBackupCodesHash: undefined as any,
            mfaDerniereVerification: undefined as any,
            deuxFacteursActif: false,
        });
        logger.info(`[MFA] MFA désactivé pour utilisateur ${utilisateurId}`);
    }

    /**
     * Régénère les codes de secours.
     */
    async regenererBackupCodes(utilisateurId: string): Promise<string[]> {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId, mfaActif: true },
        });

        if (!utilisateur) {
            throw new Error('MFA non activé pour cet utilisateur.');
        }

        const newCodes = this.genererBackupCodes();
        await this.utilisateurRepo.update(utilisateurId, {
            mfaBackupCodesHash: this.hashBackupCodes(newCodes),
        });

        logger.info(`[MFA] Backup codes régénérés pour utilisateur ${utilisateurId}`);
        return newCodes;
    }

    // ==================================
    // Fonctions privées — Chiffrement
    // ==================================

    /**
     * Génère des codes de secours aléatoires.
     */
    private genererBackupCodes(): string[] {
        const codes: string[] = [];
        for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
        }
        return codes;
    }

    /**
     * Chiffre un secret TOTP pour stockage (AES-256-GCM, réversible).
     * Le secret doit être réversible pour la vérification TOTP côté serveur.
     */
    private chiffrerSecret(secret: string): string {
        const key = this.getEncryptionKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(secret, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Format : iv:authTag:encrypted
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    }

    /**
     * Déchiffre un secret TOTP stocké.
     */
    private dechiffrerSecret(stored: string): string | null {
        try {
            const parts = stored.split(':');
            if (parts.length !== 3) return null;

            const [ivHex, authTagHex, encrypted] = parts;
            const key = this.getEncryptionKey();
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch {
            return null;
        }
    }

    /**
     * Hash des backup codes pour stockage (JSON array de codes chiffrés).
     * Les backup codes sont aussi chiffrés (réversible) car on doit les comparer.
     */
    private hashBackupCodes(codes: string[]): string {
        const encrypted = codes.map(c => this.chiffrerSecret(c));
        return JSON.stringify(encrypted);
    }

    /**
     * Déchiffre les backup codes stockés.
     */
    private dechiffrerBackupCodes(stored: string): string[] {
        try {
            const encrypted: string[] = JSON.parse(stored);
            return encrypted
                .map(c => this.dechiffrerSecret(c))
                .filter((c): c is string => c !== null);
        } catch {
            return [];
        }
    }

    /**
     * Méthode conservée pour compatibilité — hash irréversible (non utilisé en v2).
     */
    private hashSecretIrreversible(secret: string): string {
        return crypto.createHmac('sha256', MFA_PEPPER).update(secret).digest('hex');
    }

    /**
     * @deprecated Utiliser chiffrerSecret() à la place.
     */
    private hashSecret(secret: string): string {
        // En v2, on chiffre (réversible) au lieu de hasher (irréversible)
        // car on a besoin du secret pour vérifier les codes TOTP
        return this.chiffrerSecret(secret);
    }

    /**
     * Dériver la clé de chiffrement MFA depuis le pepper + ENCRYPTION_KEY.
     * 32 bytes pour AES-256.
     * 
     * Durcissement v9 : utilise ENCRYPTION_KEY (pas JWT_SECRET).
     * En production, ENCRYPTION_KEY est obligatoire.
     */
    private getEncryptionKey(): Buffer {
        const encryptionKey = process.env.ENCRYPTION_KEY;
        
        if (!encryptionKey && process.env.NODE_ENV === 'production') {
            throw new Error(
                '[Sécurité MFA] ENCRYPTION_KEY est obligatoire en production pour le chiffrement des secrets MFA.'
            );
        }
        
        // Utiliser ENCRYPTION_KEY si disponible, sinon fallback développement uniquement
        const baseKey = encryptionKey || 'dev-mfa-key-ephemere';
        const combined = `${MFA_PEPPER}:${baseKey}`;
        return crypto.createHash('sha256').update(combined).digest();
    }

    // ==================================
    // Base32 (RFC 4648)
    // ==================================

    private base32Encode(buffer: Buffer): string {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        for (const byte of buffer) {
            bits += byte.toString(2).padStart(8, '0');
        }

        let result = '';
        for (let i = 0; i < bits.length; i += 5) {
            const chunk = bits.slice(i, i + 5).padEnd(5, '0');
            result += alphabet[parseInt(chunk, 2)];
        }

        return result;
    }

    private base32Decode(str: string): Buffer {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        for (const char of str.toUpperCase()) {
            const index = alphabet.indexOf(char);
            if (index === -1) continue;
            bits += index.toString(2).padStart(5, '0');
        }

        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
        }

        return Buffer.from(bytes);
    }
}

export const mfaService = new MFAService();
export default MFAService;
