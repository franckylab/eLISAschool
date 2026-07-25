/**
 * ==================================
 * eLISAschool - Service d'authentification v2.0
 * ==================================
 * Version: 2.0.0
 * Auteur: franck arlos chendjou
 * 
 * Utilise le système de configuration centralisé
 */

import { Repository, ILike } from 'typeorm';
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
import { blocageAuthService, StatutBlocageComplet } from './blocage-auth.service';

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
            maxLoginAttempts: await getParamNumber('auth.max_login_attempts', { defaultValue: 5 }),
            lockoutDuration: await getParamNumber('auth.lockout_duration', { defaultValue: 15 }),
            sessionDuration: await getParamNumber('auth.session_duration', { defaultValue: 1440 }),
            passwordMinLength: await getParamNumber('auth.password_min_length', { defaultValue: 8 }),
            require2FA: await getParamBoolean('auth.require_2fa', { defaultValue: false }),
            passwordRequireUppercase: await getParamBoolean('auth.password_require_uppercase', { defaultValue: true }),
            passwordRequireNumber: await getParamBoolean('auth.password_require_number', { defaultValue: true }),
        };

        // Mettre en cache
        this.securityParamsCache = { data: params, timestamp: Date.now() };

        return params;
    }

    /**
     * Vérifie le statut de blocage d'un utilisateur sans incrémenter les tentatives
     * Utilisé pour le polling frontend pendant le blocage
     * NOUVEAU: Utilise le système de blocage à deux niveaux
     */
    async getBlocageStatus(identifiant: string, adresseIp?: string, userAgent?: string): Promise<{
        bloque: boolean;
        bloqueJusqua: string | null;
        tempsRestantSecondes: number;
        tentativesActuelles: number;
        tentativesRestantes: number;
        maxTentatives: number;
        // NOUVEAU: Détails complets du blocage à deux niveaux
        blocageSpecifique?: any;
        blocageGeneral?: any;
        typeBlocage?: string | null;
    }> {
        const ip = adresseIp || 'unknown';
        
        // Utiliser le système de blocage à deux niveaux
        const statutComplet = await blocageAuthService.verifierBlocage(
            identifiant,
            ip,
            userAgent
        );

        return {
            bloque: statutComplet.bloque,
            bloqueJusqua: statutComplet.blocageSpecifique.bloqueJusqua || statutComplet.blocageGeneral.bloqueJusqua,
            tempsRestantSecondes: Math.max(
                statutComplet.blocageSpecifique.tempsRestantSecondes,
                statutComplet.blocageGeneral.tempsRestantSecondes
            ),
            tentativesActuelles: statutComplet.blocageSpecifique.tentativesActuelles,
            tentativesRestantes: statutComplet.blocageSpecifique.tentativesRestantes,
            maxTentatives: statutComplet.blocageSpecifique.maxTentatives,
            // Détails complets du blocage à deux niveaux
            blocageSpecifique: statutComplet.blocageSpecifique,
            blocageGeneral: statutComplet.blocageGeneral,
            typeBlocage: statutComplet.typeBlocage,
        };
    }

    /**
     * Connexion d'un utilisateur (v2.0 - multi-mode)
     * Supporte : email, pseudonyme, matricule, QR code, ID
     * Avec système de blocage à deux niveaux (spécifique + général)
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

        // SÉCURITÉ: Validation et sanitisation de l'identifiant
        if (identifiant.length > 255) {
            throw new AppError('Identifiant trop long', 400, 'INVALID_IDENTIFIER');
        }
        
        // Vérifier qu'il n'y a pas de caractères SQL injection
        const sqlInjectionPatterns = [
            /(\b(union|select|insert|update|delete|drop|alter|create|execute|exec)\b)/i,
            /(--|;|\/\*|\*\/|xp_)/,
            /(\b(or|and)\b\s+\d+\s*=\s*\d+)/i,
        ];
        
        for (const pattern of sqlInjectionPatterns) {
            if (pattern.test(identifiant)) {
                logger.warn(`[Auth] Tentative d'injection SQL détectée: ${identifiant.substring(0, 50)}...`);
                throw new AppError('Identifiant ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
            }
        }

        const identifiantNormalise = identifiant.toLowerCase().trim();

        // NOUVEAU: Vérifier le statut de blocage (spécifique + général)
        const statutBlocage = await blocageAuthService.verifierBlocage(
            identifiantNormalise,
            adresseIp || 'unknown',
            userAgent
        );

        // Si bloqué, retourner erreur détaillée
        if (statutBlocage.bloque) {
            await auditService.logLogin('unknown', false, req, `Compte bloqué (${statutBlocage.typeBlocage})`);
            
            const tempsRestant = statutBlocage.blocageSpecifique.tempsRestantSecondes > 0 
                ? statutBlocage.blocageSpecifique.tempsRestantSecondes
                : statutBlocage.blocageGeneral.tempsRestantSecondes;
            
            const minutes = Math.floor(tempsRestant / 60);
            const secondes = tempsRestant % 60;
            
            const error = new AppError(
                `Trop de tentatives échouées. Veuillez réessayer dans ${minutes}:${String(secondes).padStart(2, '0')}.`,
                403,
                'ACCOUNT_LOCKED'
            );
            
            (error as any).details = {
                bloque: true,
                typeBlocage: statutBlocage.typeBlocage,
                bloqueSpecifique: statutBlocage.blocageSpecifique,
                bloqueGeneral: statutBlocage.blocageGeneral,
                tempsRestantSecondes: tempsRestant,
            };
            
            throw error;
        }

        // Recherche multi-critère optimisée avec OR
        const whereConditions: any[] = [];
        
        if (identifiantNormalise.includes('@')) {
            whereConditions.push({ email: identifiantNormalise });
        }
        
        whereConditions.push({ matricule: ILike(identifiantNormalise) });
        whereConditions.push({ pseudonyme: ILike(identifiantNormalise) });
        whereConditions.push({ qrCodeId: ILike(identifiantNormalise) });
        
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifiantNormalise)) {
            whereConditions.push({ id: identifiantNormalise });
        }

        const utilisateur = await this.utilisateurRepository.findOne({
            where: whereConditions,
            select: ['id', 'email', 'matricule', 'pseudonyme', 'qrCodeId', 'motDePasse', 'role', 'statut'],
        });

        if (!utilisateur) {
            // NOUVEAU: Enregistrer l'échec dans le système de blocage
            await blocageAuthService.enregistrerEchec(
                identifiantNormalise,
                adresseIp || 'unknown',
                'Identifiant non trouvé',
                userAgent
            );
            await auditService.logLogin('unknown', false, req, 'Identifiant non trouvé');
            throw new AppError('Identifiant ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
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
        if (!loginDto.motDePasse || loginDto.motDePasse.length > 128) {
            throw new AppError('Mot de passe invalide', 400, 'INVALID_PASSWORD');
        }
        
        const motDePasseValide = await utilisateur.verifierMotDePasse(loginDto.motDePasse);

        if (!motDePasseValide) {
            // Enregistrer l'échec dans le système de blocage à deux niveaux
            const resultatBlocage = await blocageAuthService.enregistrerEchec(
                identifiantNormalise,
                adresseIp || 'unknown',
                'Mot de passe incorrect',
                userAgent
            );
            
            await auditService.logLogin(utilisateur.id, false, req, 'Mot de passe incorrect');
            
            // Créer l'erreur avec les détails du système de blocage
            const error = new AppError('Identifiant ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
            (error as any).details = {
                bloque: resultatBlocage.bloque,
                typeBlocage: resultatBlocage.statut.typeBlocage,
                blocageSpecifique: resultatBlocage.statut.blocageSpecifique,
                blocageGeneral: resultatBlocage.statut.blocageGeneral,
                tentativesRestantes: resultatBlocage.statut.blocageSpecifique.tentativesRestantes,
                tentativesActuelles: resultatBlocage.statut.blocageSpecifique.tentativesActuelles,
            };
            throw error;
        }

        // SUCCÈS: Réinitialiser les compteurs de blocage
        await blocageAuthService.reinitialiserApresSucces(
            identifiantNormalise,
            adresseIp || 'unknown',
            userAgent
        );

        // Mettre à jour la dernière connexion
        utilisateur.derniereConnexion = new Date();
        await this.utilisateurRepository.save(utilisateur);

        // Récupération du profil
        const profil = await this.profilRepository.findOne({
            where: { utilisateurId: utilisateur.id },
        });

        // Chargement des établissements de l'utilisateur (multi-tenancy v2.0)
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId: utilisateur.id, actif: true },
            relations: ['role'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        // VALIDATION FAIL-FAST: Vérifier que l'utilisateur a AU MOINS 1 établissement
        if (utilisateurEtablissements.length === 0) {
            await auditService.logLogin(utilisateur.id, false, req, 'Aucun établissement associé');
            throw new AppError(
                'Aucun établissement associé à votre compte. Veuillez contacter l\'administrateur.',
                403,
                'NO_ETABLISSEMENT'
            );
        }

        const etablissementsPayload = utilisateurEtablissements.map(ue => ({
            etablissementId: ue.etablissementId,
            role: ue.role.code,
            etablissementPrincipal: ue.etablissementPrincipal,
            actif: ue.actif
        }));

        // Décider du mode de connexion
        const requiereSelection = utilisateurEtablissements.length > 1;
        const etablissementActifId = !requiereSelection && utilisateurEtablissements.length === 1
            ? utilisateurEtablissements[0].etablissementId
            : undefined; // Sera défini après sélection si multi-établissements

        // Résolution des permissions (nouveau système RBAC)
        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateur.id, etablissementActifId);
        const userRoles = await permissionResolverService.getUserRoles(utilisateur.id, etablissementActifId);

        // Génération des tokens
        const primaryEtablissement = utilisateurEtablissements.find(ue => ue.etablissementPrincipal) || utilisateurEtablissements[0];
        const roleToUse = etablissementActifId 
            ? (utilisateurEtablissements.find(ue => ue.etablissementId === etablissementActifId)?.role.code || utilisateur.role) 
            : utilisateur.role;
            
        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: roleToUse, // Use establishment-specific role if available
            roles: userRoles.map(r => r.code), // NOUVEAU : tous les rôles
            // Permissions absentes du JWT (résolues côté serveur) : évite HTTP 431 (header > 16KB)
            etablissementId: etablissementActifId, // Défini si mono-établissement
            etablissements: etablissementsPayload, // TOUJOURS présent après validation
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

        // Charger les détails des établissements pour la réponse
        const etablissementRepo = AppDataSource.getRepository('Etablissement');
        const etablissementsDetails = await Promise.all(
            utilisateurEtablissements.map(async (ue) => {
                const etab = await etablissementRepo.findOne({
                    where: { id: ue.etablissementId },
                    select: ['id', 'nom', 'codeEtablissement', 'logoBase64', 'logoType']
                }) as any;
                
                // Convertir logoBase64 en format URL si disponible
                let logoUrl: string | undefined = undefined;
                if (etab?.logoBase64) {
                    logoUrl = etab.logoBase64;
                }
                
                return {
                    id: ue.etablissementId,
                    nom: etab?.nom || 'Établissement',
                    code: etab?.codeEtablissement,
                    role: ue.role.code,
                    etablissementPrincipal: ue.etablissementPrincipal,
                    logoUrl,
                };
            })
        );

        return {
            accessToken,
            refreshToken,
            expiresIn,
            requiereSelectionEtablissement: requiereSelection,
            tokenTemporaire: requiereSelection,
            utilisateur: {
                id: utilisateur.id,
                email: utilisateur.email,
                matricule: utilisateur.matricule,
                role: roleToUse,
                nom: profil?.nom || '',
                prenom: profil?.prenom || '',
                etablissementActif: etablissementActifId,
                etablissements: etablissementsPayload,
                permissions: Array.from(resolvedPermissions),
            },
            etablissementsDisponibles: etablissementsDetails,
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
        const defaultRole = await getParam<string>('utilisateurs.default_role', { defaultValue: 'ELEVE' });

        const utilisateur = new Utilisateur();
        utilisateur.email = registerDto.email.toLowerCase();
        utilisateur.matricule = matricule!;
        utilisateur.motDePasse = registerDto.motDePasse;
        utilisateur.role = defaultRole as any;
        utilisateur.statut = StatutUtilisateur.EN_ATTENTE_VALIDATION;
        utilisateur.langue = registerDto.langue || 'fr';
        utilisateur.tokenVerificationEmail = generateSecureToken();

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

        // Récupérer l'établissement principal pour le JWT
        const affectationPrincipale = await this.utilisateurEtablissementRepo.findOne({
            where: { utilisateurId: utilisateur.id, etablissementPrincipal: true, actif: true },
            relations: ['role'],
        });

        // Re-résolution des rôles (les permissions sont résolues côté serveur, jamais dans le JWT)
        const userRoles = await permissionResolverService.getUserRoles(utilisateur.id, affectationPrincipale?.etablissementId);

        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: affectationPrincipale?.role.code || utilisateur.role,
            roles: userRoles.map(r => r.code),
            etablissementId: affectationPrincipale?.etablissementId, // v4.0: via utilisateur_etablissements
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
    async getCurrentUser(utilisateurId: string, activeEtablissementId?: string): Promise<any> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: utilisateurId },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const profil = await this.profilRepository.findOne({
            where: { utilisateurId },
        });

        // NOUVEAU: Charger les établissements de l'utilisateur
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId, actif: true },
            relations: ['role'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        // Déterminer l'établissement actif (spécifié, principal ou premier)
        let etablissementActifId = activeEtablissementId;
        logger.info(`[getCurrentUser] Détermination de l'établissement actif pour l'utilisateur ${utilisateur.email}. Spécifié: ${activeEtablissementId}`);

        if (etablissementActifId && !utilisateurEtablissements.some(ue => ue.etablissementId === etablissementActifId)) {
            logger.warn(`[getCurrentUser] L'établissement spécifié ${etablissementActifId} n'est pas valide ou n'est pas actif pour l'utilisateur ${utilisateur.email}`);
            etablissementActifId = undefined;
        }

        if (!etablissementActifId) {
            const principal = utilisateurEtablissements.find(ue => ue.etablissementPrincipal);
            if (principal) {
                etablissementActifId = principal.etablissementId;
                logger.info(`[getCurrentUser] Utilisation de l'établissement principal par défaut: ${etablissementActifId}`);
            } else if (utilisateurEtablissements.length > 0) {
                etablissementActifId = utilisateurEtablissements[0].etablissementId;
                logger.info(`[getCurrentUser] Aucun établissement principal trouvé. Utilisation du premier établissement disponible: ${etablissementActifId}`);
            } else {
                logger.warn(`[getCurrentUser] Aucun établissement actif trouvé pour l'utilisateur ${utilisateur.email}`);
            }
        } else {
            logger.info(`[getCurrentUser] L'établissement spécifié ${etablissementActifId} est valide et a été sélectionné`);
        }

        // Résoudre les permissions de l'utilisateur avec l'établissement actif
        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateurId, etablissementActifId);
        const userRoles = await permissionResolverService.getUserRoles(utilisateurId, etablissementActifId);

        // Get the establishment-specific role to use
        const currentEtablissement = etablissementActifId 
            ? utilisateurEtablissements.find(ue => ue.etablissementId === etablissementActifId)
            : null;
        const roleToUse = currentEtablissement?.role.code || utilisateur.role;

        return {
            id: utilisateur.id,
            email: utilisateur.email,
            matricule: utilisateur.matricule,
            role: roleToUse,
            roles: userRoles.map(r => ({ code: r.code, libelle: r.libelle, estPrincipal: r.estPrincipal })),
            statut: utilisateur.statut,
            emailVerifie: utilisateur.emailVerifie,
            langue: utilisateur.langue,
            permissions: Array.from(resolvedPermissions),
            // NOUVEAU: Informations multi-tenant
            etablissementActif: etablissementActifId || null,
            etablissements: utilisateurEtablissements.map(ue => ({
                etablissementId: ue.etablissementId,
                role: ue.role.code,
                etablissementPrincipal: ue.etablissementPrincipal,
                actif: ue.actif
            })),
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
