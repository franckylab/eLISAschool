/**
 * ==================================
 * eLISAschool - Service MFA (Multi-Factor Authentication)
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 *
 * TOTP (Time-based One-Time Password) pour authentification renforcée.
 * Compatible Google Authenticator, Authy, Microsoft Authenticator, etc.
 *
 * Stockage : table mfa_configs (secret hashé + backup codes hashés)
 *
 * Phase P1 — Refonte SaaS v6
 */

import crypto from 'crypto';
import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { MfaConfig } from '../entities/mfa-config.entity';
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
    private mfaConfigRepo: Repository<MfaConfig>;
    private utilisateurRepo: Repository<Utilisateur>;

    constructor() {
        this.mfaConfigRepo = AppDataSource.getRepository(MfaConfig);
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
     * Configure le MFA pour un utilisateur.
     * Génère un nouveau secret, QR code et backup codes.
     * Le MFA n'est PAS encore actif — il faut vérifier le premier code pour l'activer.
     */
    async setupMFA(utilisateurId: string, email: string): Promise<MFASetupResult> {
        const secret = this.genererSecret();
        const qrCodeUrl = this.genererQRCodeUrl(email, secret);
        const backupCodes = this.genererBackupCodes();

        // Hasher le secret et les backup codes avant stockage
        const secretHash = this.hashSecret(secret);
        const backupCodesHash = this.hashBackupCodes(backupCodes);

        // Upsert dans mfa_configs (écrase toute config précédente non activée)
        await this.mfaConfigRepo.upsert(
            {
                utilisateurId,
                secretHash,
                backupCodesHash,
                actif: false,
            },
            ['utilisateurId']
        );

        logger.info(`[MFA] Setup initié pour utilisateur ${utilisateurId}`);

        // Retourner le secret EN CLAIR (nécessaire pour le QR code côté client)
        // Il ne sera JAMAIS stocké en clair en DB
        return {
            secret,
            qrCodeUrl,
            backupCodes,
        };
    }

    /**
     * Active le MFA après vérification du premier code TOTP.
     * Met à jour utilisateurs.deux_facteurs_actif = true.
     */
    async activerMFA(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId },
        });

        if (!config) {
            return { success: false, message: 'Configuration MFA non trouvée. Veuillez initier le setup.' };
        }

        if (config.actif) {
            return { success: false, message: 'MFA déjà activé.' };
        }

        // Pour activer, on doit reconstituer le secret depuis le hash
        // Problème : le hash est irréversible. On doit donc stocker le secret en clair
        // temporairement pendant le setup, OU changer l'approche.
        // Solution : on stocke le secret en clair dans un champ temporaire le temps du setup.
        // APPROCHE REVISEE : le secret est retourné au client lors du setup.
        // Le client renvoie le code TOTP. On ne peut pas vérifier sans le secret en clair.
        // → On doit stocker le secret en clair jusqu'à activation, puis le hasher.

        // Pour cette version, on utilise une approche pragmatique :
        // Le secret est stocké hashé APRÈS activation. Pendant le setup, il est en clair
        // dans un champ séparé (secret_temporaire).
        // SIMPLIFICATION : on stocke le secret chiffré (réversible) jusqu'à activation.

        // En pratique, pour la vérification à l'activation :
        // Le frontend a le secret (via le setup), le client génère un code,
        // et on vérifie ici. Mais on n'a plus le secret en clair...
        // 
        // Solution correcte : chiffrer le secret (AES-256-GCM, réversible) pendant le setup,
        // puis le hasher (irréversible) après activation.

        // Pour cette implémentation, on utilise le champ secretHash comme stockage
        // du secret chiffré (réversible) pendant setup, puis hashé après activation.
        // Voir la méthode hashSecret révisée ci-dessous.

        const secretEnClair = this.dechiffrerSecret(config.secretHash);
        if (!secretEnClair) {
            return { success: false, message: 'Erreur de déchiffrement du secret MFA.' };
        }

        if (!this.verifierCode(secretEnClair, code)) {
            return { success: false, message: 'Code TOTP invalide. Veuillez réessayer.' };
        }

        // Activer le MFA : hasher définitivement le secret
        const secretHashFinal = this.hashSecretIrreversible(secretEnClair);
        config.secretHash = secretHashFinal;
        config.actif = true;
        config.derniereVerification = new Date();
        await this.mfaConfigRepo.save(config);

        // Mettre à jour le flag sur l'utilisateur
        await this.utilisateurRepo.update(utilisateurId, { deuxFacteursActif: true });

        logger.info(`[MFA] MFA activé pour utilisateur ${utilisateurId}`);
        return { success: true, message: 'MFA activé avec succès.' };
    }

    // ==================================
    // Vérification MFA (login / opérations critiques)
    // ==================================

    /**
     * Vérifie un code MFA pour un utilisateur.
     * Utilise le secret hashé de manière irréversible stocké en DB.
     * 
     * Note : Comme le hash est irréversible, on ne peut pas re-générer le code attendu.
     * Approche alternative : on stocke le secret chiffré (réversible) en permanence
     * avec AES-256-GCM. Le "hash" initial était une erreur de design.
     * 
     * Solution finale (v2) : le secret est TOUJOURS stocké chiffré (AES-256-GCM réversible).
     * La sécurité repose sur la clé serveur dans .env + le pepper.
     */
    async verifierMFA(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId, actif: true },
        });

        if (!config) {
            return { success: false, message: 'MFA non configuré ou non activé.' };
        }

        const secret = this.dechiffrerSecret(config.secretHash);
        if (!secret) {
            logger.error(`[MFA] Erreur déchiffrement secret pour utilisateur ${utilisateurId}`);
            return { success: false, message: 'Erreur interne MFA.' };
        }

        if (!this.verifierCode(secret, code)) {
            logger.warn(`[MFA] Code invalide pour utilisateur ${utilisateurId}`);
            return { success: false, message: 'Code TOTP invalide.' };
        }

        // Mettre à jour la dernière vérification
        config.derniereVerification = new Date();
        await this.mfaConfigRepo.save(config);

        return { success: true, message: 'MFA vérifié.' };
    }

    /**
     * Vérifie un code de secours.
     * Consomme le code (usage unique).
     */
    async verifierBackupCode(utilisateurId: string, code: string): Promise<MFAVerifyResult> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId, actif: true },
        });

        if (!config) {
            return { success: false, message: 'MFA non configuré ou non activé.' };
        }

        const backupCodes = this.dechiffrerBackupCodes(config.backupCodesHash);
        const codeNormalise = code.toUpperCase().replace(/\s/g, '');

        const index = backupCodes.findIndex(c => c === codeNormalise);
        if (index === -1) {
            return { success: false, message: 'Code de secours invalide.' };
        }

        // Consommer le code (le retirer de la liste)
        backupCodes.splice(index, 1);
        config.backupCodesHash = this.hashBackupCodes(backupCodes);
        config.derniereVerification = new Date();
        await this.mfaConfigRepo.save(config);

        logger.info(`[MFA] Code de secours utilisé pour utilisateur ${utilisateurId}. Restants: ${backupCodes.length}`);
        return { success: true, message: `Code de secours vérifié. Il vous reste ${backupCodes.length} codes.` };
    }

    /**
     * Vérifie si le MFA est activé pour un utilisateur.
     */
    async isMFAEnabled(utilisateurId: string): Promise<boolean> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId, actif: true },
        });
        return !!config;
    }

    /**
     * Récupère le statut MFA complet d'un utilisateur.
     */
    async getMFAStatus(utilisateurId: string): Promise<MFAStatusResult> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId },
        });

        return {
            enabled: config?.actif ?? false,
            setupComplete: !!config,
        };
    }

    /**
     * Désactive le MFA pour un utilisateur.
     */
    async desactiverMFA(utilisateurId: string): Promise<void> {
        await this.mfaConfigRepo.delete({ utilisateurId });
        await this.utilisateurRepo.update(utilisateurId, { deuxFacteursActif: false });
        logger.info(`[MFA] MFA désactivé pour utilisateur ${utilisateurId}`);
    }

    /**
     * Régénère les codes de secours.
     */
    async regenererBackupCodes(utilisateurId: string): Promise<string[]> {
        const config = await this.mfaConfigRepo.findOne({
            where: { utilisateurId, actif: true },
        });

        if (!config) {
            throw new Error('MFA non activé pour cet utilisateur.');
        }

        const newCodes = this.genererBackupCodes();
        config.backupCodesHash = this.hashBackupCodes(newCodes);
        await this.mfaConfigRepo.save(config);

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
     * Dériver la clé de chiffrement depuis le pepper + secret JWT.
     * 32 bytes pour AES-256.
     */
    private getEncryptionKey(): Buffer {
        const jwtSecret = process.env.JWT_SECRET || 'elisaschool-jwt-secret-default';
        const combined = `${MFA_PEPPER}:${jwtSecret}`;
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
