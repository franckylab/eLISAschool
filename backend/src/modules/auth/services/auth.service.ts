/**
 * ==================================
 * eLISAschool - Service d'authentification v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Utilisateur, ProfilUtilisateur, Role, StatutUtilisateur, UtilisateurEtablissement } from '../entities';
import { TokenService } from './token.service';
import { AuditService, auditService } from './audit.service';
import { AuditAction } from '../entities/audit-log.entity';
import {
    LoginDto,
    RegisterDto,
    LoginResponseDto,
    ForgotPasswordDto,
    ResetPasswordDto,
    ChangePasswordDto,
    JwtPayload,
} from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { generateSecureToken } from '@common/utils/crypto.util';
import { getParamNumber, getParamBoolean, getParam } from '@modules/configuration/utils/config.helper';
import { permissionResolverService } from './permission-resolver.service';

/**
 * Service d'authentification avec configuration centralisée
 */
export class AuthService {
    private utilisateurRepository: Repository<Utilisateur>;
    private profilRepository: Repository<ProfilUtilisateur>;
    private utilisateurEtablissementRepo: Repository<UtilisateurEtablissement>;
    private tokenService: TokenService;

    // Cache local pour les paramètres de sécurité (TTL court: 1 min)
    private securityParamsCache: { data: any; timestamp: number } | null = null;
    private readonly SECURITY_PARAMS_TTL = 60000; // 1 minute

    constructor() {
        this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
        this.profilRepository = AppDataSource.getRepository(ProfilUtilisateur);
        this.utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
        this.tokenService = new TokenService();
    }

    /**
     * Récupère les paramètres de sécurité depuis la configuration
     * Optimisé avec cache local (TTL: 1 min)
     */
    private async getSecurityParams() {
        // Vérifier le cache local
        if (this.securityParamsCache) {
            const age = Date.now() - this.securityParamsCache.timestamp;
            if (age < this.SECURITY_PARAMS_TTL) {
                return this.securityParamsCache.data;
            }
        }

        // Charger depuis la configuration (utilise déjà le cache du configurationService)
        const params = {
            maxLoginAttempts: await getParamNumber('auth.max_login_attempts', 5),
            lockoutDuration: await getParamNumber('auth.lockout_duration', 15),
            sessionDuration: await getParamNumber('auth.session_duration', 1440),
            passwordMinLength: await getParamNumber('auth.password_min_length', 8),
            require2FA: await getParamBoolean('auth.require_2fa', false),
            passwordRequireUppercase: await getParamBoolean('auth.password_require_uppercase', true),
            passwordRequireNumber: await getParamBoolean('auth.password_require_number', true),
        };

        // Mettre en cache
        this.securityParamsCache = { data: params, timestamp: Date.now() };

        return params;
    }

    /**
     * Connexion d'un utilisateur (v2.0 - multi-mode)
     * Supporte : email, pseudonyme, matricule, QR code, ID
     */
    async login(
        loginDto: LoginDto,
        adresseIp?: string,
        userAgent?: string,
        req?: any
    ): Promise<LoginResponseDto> {
        const securityParams = await this.getSecurityParams();

        // Déterminer l'identifiant à utiliser (nouveau champ ou fallback ancien)
        const identifiant = (loginDto as any).identifiant || loginDto.email;
        if (!identifiant) {
            throw new AppError('Identifiant requis', 400, 'MISSING_IDENTIFIER');
        }

        const identifiantNormalise = identifiant.toLowerCase().trim();

        // Recherche multi-critère optimisée avec OR
        const whereConditions: any[] = [];
        
        // Si contient @, c'est probablement un email
        if (identifiantNormalise.includes('@')) {
            whereConditions.push({ email: identifiantNormalise });
        }
        
        // Chercher dans tous les cas par matricule, pseudonyme, qrCodeId
        whereConditions.push({ matricule: identifiantNormalise });
        whereConditions.push({ pseudonyme: identifiantNormalise });
        whereConditions.push({ qrCodeId: identifiantNormalise });
        
        // Si c'est un UUID valide, chercher par ID
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifiantNormalise)) {
            whereConditions.push({ id: identifiantNormalise });
        }

        const utilisateur = await this.utilisateurRepository.findOne({
            where: whereConditions,
            select: ['id', 'email', 'matricule', 'pseudonyme', 'qrCodeId', 'motDePasse', 'role', 'statut', 'tentativesConnexion', 'bloqueJusqua', 'etablissementId'],
        });

        if (!utilisateur) {
            await auditService.logLogin('unknown', false, req, 'Identifiant non trouvé');
            throw new AppError('Identifiant ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
        }

        // Vérification du blocage
        if (utilisateur.estBloque()) {
            await auditService.logLogin(utilisateur.id, false, req, 'Compte bloqué');
            throw new AppError('Compte temporairement bloqué. Veuillez réessayer plus tard.', 403, 'ACCOUNT_LOCKED');
        }

        // Vérification du statut
        if (utilisateur.statut === StatutUtilisateur.SUSPENDU) {
            await auditService.logLogin(utilisateur.id, false, req, 'Compte suspendu');
            throw new AppError('Compte suspendu. Contactez l\'administrateur.', 403, 'ACCOUNT_SUSPENDED');
        }

        if (utilisateur.statut === StatutUtilisateur.INACTIF) {
            await auditService.logLogin(utilisateur.id, false, req, 'Compte inactif');
            throw new AppError('Compte inactif.', 403, 'ACCOUNT_INACTIVE');
        }

        // Vérification du mot de passe
        const motDePasseValide = await utilisateur.verifierMotDePasse(loginDto.motDePasse);

        if (!motDePasseValide) {
            utilisateur.tentativesConnexion += 1;

            // Blocage selon configuration
            if (utilisateur.tentativesConnexion >= securityParams.maxLoginAttempts) {
                const bloqueJusqua = new Date();
                bloqueJusqua.setMinutes(bloqueJusqua.getMinutes() + securityParams.lockoutDuration);
                utilisateur.bloqueJusqua = bloqueJusqua;
                logger.warn(`Compte bloqué après ${securityParams.maxLoginAttempts} tentatives: ${utilisateur.email}`);
            }

            await this.utilisateurRepository.save(utilisateur);
            await auditService.logLogin(utilisateur.id, false, req, 'Mot de passe incorrect');
            throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
        }

        // Réinitialisation du compteur de tentatives
        utilisateur.tentativesConnexion = 0;
        utilisateur.derniereConnexion = new Date();
        await this.utilisateurRepository.save(utilisateur);

        // Récupération du profil
        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: utilisateur.id },
        });

        // Résolution des permissions (nouveau système RBAC)
        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateur.id);
        const userRoles = await permissionResolverService.getUserRoles(utilisateur.id);

        // Chargement des établissements de l'utilisateur (multi-tenancy v2.0)
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId: utilisateur.id, actif: true },
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        const etablissementsPayload = utilisateurEtablissements.map(ue => ({
            etablissementId: ue.etablissementId,
            role: ue.role,
            etablissementPrincipal: ue.etablissementPrincipal,
            actif: ue.actif
        }));

        // Génération des tokens
        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role, // backward compat
            roles: userRoles.map(r => r.code), // NOUVEAU : tous les rôles
            permissions: Array.from(resolvedPermissions), // NOUVEAU : permissions résolues
            etablissementId: utilisateur.etablissementId, // Legacy (single-établissement)
            etablissements: etablissementsPayload.length > 0 ? etablissementsPayload : undefined, // Multi-établissements
        };

        const accessToken = this.tokenService.generateAccessToken(payload);
        const refreshToken = await this.tokenService.generateRefreshToken(
            utilisateur.id,
            adresseIp,
            userAgent
        );

        // Audit connexion réussie
        await auditService.logLogin(utilisateur.id, true, req);

        logger.info(`Connexion réussie: ${utilisateur.email}`);

        // Durée de session en secondes depuis config
        const expiresIn = securityParams.sessionDuration * 60;

        return {
            accessToken,
            refreshToken,
            expiresIn,
            utilisateur: {
                id: utilisateur.id,
                email: utilisateur.email,
                matricule: utilisateur.matricule,
                role: utilisateur.role,
                nom: profil?.nom || '',
                prenom: profil?.prenom || '',
            },
        };
    }

    /**
     * Inscription d'un nouvel utilisateur
     */
    async register(registerDto: RegisterDto): Promise<{ message: string; utilisateurId: string }> {
        const securityParams = await this.getSecurityParams();

        // Validation longueur mot de passe
        if (registerDto.motDePasse.length < securityParams.passwordMinLength) {
            throw new AppError(
                `Le mot de passe doit contenir au moins ${securityParams.passwordMinLength} caractères`,
                400,
                'PASSWORD_TOO_SHORT'
            );
        }

        // Validation exigences de complexité
        if (securityParams.passwordRequireUppercase && !/[A-Z]/.test(registerDto.motDePasse)) {
            throw new AppError(
                'Le mot de passe doit contenir au moins une lettre majuscule',
                400,
                'PASSWORD_MISSING_UPPERCASE'
            );
        }

        if (securityParams.passwordRequireNumber && !/[0-9]/.test(registerDto.motDePasse)) {
            throw new AppError(
                'Le mot de passe doit contenir au moins un chiffre',
                400,
                'PASSWORD_MISSING_NUMBER'
            );
        }

        const emailExiste = await this.utilisateurRepository.findOne({
            where: { email: registerDto.email.toLowerCase() },
        });

        if (emailExiste) {
            throw new AppError('Cet email est déjà utilisé', 409, 'EMAIL_ALREADY_EXISTS');
        }

        // Génération du matricule unique
        let matricule: string;
        let matriculeExiste = true;

        while (matriculeExiste) {
            matricule = Utilisateur.genererMatricule('EL');
            const existant = await this.utilisateurRepository.findOne({ where: { matricule } });
            matriculeExiste = !!existant;
        }

        // Rôle par défaut depuis config
        const defaultRole = await getParam<string>('utilisateurs.default_role', Role.ELEVE);

        const utilisateur = this.utilisateurRepository.create({
            email: registerDto.email.toLowerCase(),
            matricule: matricule!,
            motDePasse: registerDto.motDePasse,
            role: defaultRole as Role,
            statut: StatutUtilisateur.EN_ATTENTE_VALIDATION,
            langue: registerDto.langue || 'fr',
            tokenVerificationEmail: generateSecureToken(),
        });

        await this.utilisateurRepository.save(utilisateur);

        const profil = this.profilRepository.create({
            utilisateurId: utilisateur.id,
            nom: registerDto.nom,
            prenom: registerDto.prenom,
            telephone: registerDto.telephone,
        });

        await this.profilRepository.save(profil);

        // Audit inscription
        await auditService.log({
            utilisateurId: utilisateur.id,
            action: AuditAction.USER_CREATE,
            description: `Inscription: ${utilisateur.email}`,
            module: 'auth',
        });

        logger.info(`Nouvel utilisateur inscrit: ${utilisateur.email}`);

        return {
            message: 'Inscription réussie. Veuillez vérifier votre email.',
            utilisateurId: utilisateur.id,
        };
    }

    /**
     * Rafraîchit les tokens avec un refresh token valide
     */
    async refreshTokens(
        refreshToken: string,
        adresseIp?: string,
        userAgent?: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const tokenEntity = await this.tokenService.validateRefreshToken(refreshToken);

        if (!tokenEntity) {
            throw new AppError('Token de rafraîchissement invalide ou expiré', 401, 'INVALID_REFRESH_TOKEN');
        }

        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: tokenEntity.utilisateurId },
        });

        if (!utilisateur || utilisateur.statut !== StatutUtilisateur.ACTIF) {
            await this.tokenService.revokeRefreshToken(refreshToken);
            throw new AppError('Utilisateur non autorisé', 401, 'USER_NOT_AUTHORIZED');
        }

        await this.tokenService.revokeRefreshToken(refreshToken);

        // Re-résolution des permissions (pour prendre en compte les changements)
        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateur.id);
        const userRoles = await permissionResolverService.getUserRoles(utilisateur.id);

        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
            roles: userRoles.map(r => r.code),
            permissions: Array.from(resolvedPermissions),
            etablissementId: utilisateur.etablissementId,
        };

        const newAccessToken = this.tokenService.generateAccessToken(payload);
        const newRefreshToken = await this.tokenService.generateRefreshToken(
            utilisateur.id,
            adresseIp,
            userAgent
        );

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    /**
     * Déconnexion - Révoque le refresh token
     */
    async logout(refreshToken: string, utilisateurId?: string, req?: any): Promise<void> {
        await this.tokenService.revokeRefreshToken(refreshToken);

        if (utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.LOGOUT,
                description: 'Déconnexion',
                module: 'auth',
            }, req);
        }

        logger.info('Déconnexion réussie');
    }

    /**
     * Déconnexion de toutes les sessions d'un utilisateur
     */
    async logoutAll(utilisateurId: string): Promise<void> {
        await this.tokenService.revokeAllUserTokens(utilisateurId);
        logger.info(`Toutes les sessions révoquées pour l'utilisateur ${utilisateurId}`);
    }

    /**
     * Demande de réinitialisation de mot de passe
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { email: forgotPasswordDto.email.toLowerCase() },
        });

        if (!utilisateur) {
            return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' };
        }

        const token = generateSecureToken();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1);

        utilisateur.tokenReinitialisationMdp = token;
        utilisateur.expirationTokenMdp = expiration;

        await this.utilisateurRepository.save(utilisateur);

        await auditService.log({
            utilisateurId: utilisateur.id,
            action: AuditAction.PASSWORD_RESET,
            description: 'Demande de réinitialisation de mot de passe',
            module: 'auth',
        });

        logger.info(`Demande de réinitialisation de mot de passe: ${utilisateur.email}`);

        return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' };
    }

    /**
     * Réinitialisation du mot de passe
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto, req?: any): Promise<{ message: string }> {
        const securityParams = await this.getSecurityParams();

        if (resetPasswordDto.nouveauMotDePasse.length < securityParams.passwordMinLength) {
            throw new AppError(
                `Le mot de passe doit contenir au moins ${securityParams.passwordMinLength} caractères`,
                400,
                'PASSWORD_TOO_SHORT'
            );
        }

        const utilisateur = await this.utilisateurRepository.findOne({
            where: { tokenReinitialisationMdp: resetPasswordDto.token },
        });

        if (!utilisateur) {
            throw new AppError('Token invalide ou expiré', 400, 'INVALID_TOKEN');
        }

        if (!utilisateur.expirationTokenMdp || new Date() > utilisateur.expirationTokenMdp) {
            throw new AppError('Token expiré', 400, 'TOKEN_EXPIRED');
        }

        utilisateur.motDePasse = resetPasswordDto.nouveauMotDePasse;
        utilisateur.tokenReinitialisationMdp = undefined;
        utilisateur.expirationTokenMdp = undefined;

        await this.utilisateurRepository.save(utilisateur);
        await this.tokenService.revokeAllUserTokens(utilisateur.id);

        await auditService.logPasswordChange(utilisateur.id, req);

        logger.info(`Mot de passe réinitialisé: ${utilisateur.email}`);

        return { message: 'Mot de passe réinitialisé avec succès.' };
    }

    /**
     * Changement de mot de passe (utilisateur connecté)
     */
    async changePassword(
        utilisateurId: string,
        changePasswordDto: ChangePasswordDto,
        req?: any
    ): Promise<{ message: string }> {
        const securityParams = await this.getSecurityParams();

        if (changePasswordDto.nouveauMotDePasse.length < securityParams.passwordMinLength) {
            throw new AppError(
                `Le mot de passe doit contenir au moins ${securityParams.passwordMinLength} caractères`,
                400,
                'PASSWORD_TOO_SHORT'
            );
        }

        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: utilisateurId },
            select: ['id', 'email', 'motDePasse'],
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const motDePasseValide = await utilisateur.verifierMotDePasse(changePasswordDto.motDePasseActuel);

        if (!motDePasseValide) {
            throw new AppError('Mot de passe actuel incorrect', 400, 'INVALID_CURRENT_PASSWORD');
        }

        utilisateur.motDePasse = changePasswordDto.nouveauMotDePasse;
        await this.utilisateurRepository.save(utilisateur);

        await auditService.logPasswordChange(utilisateurId, req);

        logger.info(`Mot de passe changé: ${utilisateur.email}`);

        return { message: 'Mot de passe changé avec succès.' };
    }

    /**
     * Vérification de l'email
     */
    async verifyEmail(token: string): Promise<{ message: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { tokenVerificationEmail: token },
        });

        if (!utilisateur) {
            throw new AppError('Token de vérification invalide', 400, 'INVALID_TOKEN');
        }

        utilisateur.emailVerifie = true;
        utilisateur.tokenVerificationEmail = undefined;

        if (utilisateur.statut === StatutUtilisateur.EN_ATTENTE_VALIDATION) {
            utilisateur.statut = StatutUtilisateur.ACTIF;
        }

        await this.utilisateurRepository.save(utilisateur);

        logger.info(`Email vérifié: ${utilisateur.email}`);

        return { message: 'Email vérifié avec succès.' };
    }

    /**
     * Récupère l'utilisateur courant
     */
    async getCurrentUser(utilisateurId: string): Promise<any> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: utilisateurId },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId },
        });

        return {
            id: utilisateur.id,
            email: utilisateur.email,
            matricule: utilisateur.matricule,
            role: utilisateur.role,
            statut: utilisateur.statut,
            emailVerifie: utilisateur.emailVerifie,
            langue: utilisateur.langue,
            profil: profil ? {
                nom: profil.nom,
                prenom: profil.prenom,
                telephone: profil.telephone,
                photo: profil.photo,
            } : null,
        };
    }
}

export const authService = new AuthService();
export default AuthService;
