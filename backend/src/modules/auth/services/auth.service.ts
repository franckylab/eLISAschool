/**
 * ==================================
 * eLISAschool - Service d'authentification
 * ==================================
 * Version: 1.0.0
 * Auteur: xAI Éducation
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Utilisateur, ProfilUtilisateur, Role, StatutUtilisateur } from '../entities';
import { TokenService } from './token.service';
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

/**
 * Service d'authentification
 * Gère toutes les opérations liées à l'authentification des utilisateurs
 */
export class AuthService {
    private utilisateurRepository: Repository<Utilisateur>;
    private profilRepository: Repository<ProfilUtilisateur>;
    private tokenService: TokenService;

    constructor() {
        this.utilisateurRepository = AppDataSource.getRepository(Utilisateur);
        this.profilRepository = AppDataSource.getRepository(ProfilUtilisateur);
        this.tokenService = new TokenService();
    }

    /**
     * Connexion d'un utilisateur
     * @param loginDto - Données de connexion
     * @param adresseIp - Adresse IP du client
     * @param userAgent - User-Agent du client
     */
    async login(
        loginDto: LoginDto,
        adresseIp?: string,
        userAgent?: string
    ): Promise<LoginResponseDto> {
        // Recherche de l'utilisateur par email
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { email: loginDto.email.toLowerCase() },
            select: ['id', 'email', 'matricule', 'motDePasse', 'role', 'statut', 'tentativesConnexion', 'bloqueJusqua', 'etablissementId'],
        });

        if (!utilisateur) {
            logger.warn(`Tentative de connexion échouée: email non trouvé - ${loginDto.email}`);
            throw new AppError('Email ou mot de passe incorrect', 401, 'INVALID_CREDENTIALS');
        }

        // Vérification du blocage
        if (utilisateur.estBloque()) {
            logger.warn(`Compte bloqué: ${utilisateur.email}`);
            throw new AppError('Compte temporairement bloqué. Veuillez réessayer plus tard.', 403, 'ACCOUNT_LOCKED');
        }

        // Vérification du statut
        if (utilisateur.statut === StatutUtilisateur.SUSPENDU) {
            throw new AppError('Compte suspendu. Contactez l\'administrateur.', 403, 'ACCOUNT_SUSPENDED');
        }

        if (utilisateur.statut === StatutUtilisateur.INACTIF) {
            throw new AppError('Compte inactif.', 403, 'ACCOUNT_INACTIVE');
        }

        // Vérification du mot de passe
        const motDePasseValide = await utilisateur.verifierMotDePasse(loginDto.motDePasse);

        if (!motDePasseValide) {
            // Incrémente le compteur de tentatives
            utilisateur.tentativesConnexion += 1;

            // Blocage après 5 tentatives
            if (utilisateur.tentativesConnexion >= 5) {
                const bloqueJusqua = new Date();
                bloqueJusqua.setMinutes(bloqueJusqua.getMinutes() + 15);
                utilisateur.bloqueJusqua = bloqueJusqua;
                logger.warn(`Compte bloqué après tentatives multiples: ${utilisateur.email}`);
            }

            await this.utilisateurRepository.save(utilisateur);

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

        // Génération des tokens
        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
            etablissementId: utilisateur.etablissementId,
        };

        const accessToken = this.tokenService.generateAccessToken(payload);
        const refreshToken = await this.tokenService.generateRefreshToken(
            utilisateur.id,
            adresseIp,
            userAgent
        );

        logger.info(`Connexion réussie: ${utilisateur.email}`);

        return {
            accessToken,
            refreshToken,
            expiresIn: 7 * 24 * 60 * 60, // 7 jours en secondes
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
     * @param registerDto - Données d'inscription
     */
    async register(registerDto: RegisterDto): Promise<{ message: string; utilisateurId: string }> {
        // Vérification de l'unicité de l'email
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

        // Création de l'utilisateur
        const utilisateur = this.utilisateurRepository.create({
            email: registerDto.email.toLowerCase(),
            matricule: matricule!,
            motDePasse: registerDto.motDePasse,
            role: Role.ELEVE, // Rôle par défaut
            statut: StatutUtilisateur.EN_ATTENTE_VALIDATION,
            langue: registerDto.langue || 'fr',
            tokenVerificationEmail: generateSecureToken(),
        });

        await this.utilisateurRepository.save(utilisateur);

        // Création du profil
        const profil = this.profilRepository.create({
            utilisateurId: utilisateur.id,
            nom: registerDto.nom,
            prenom: registerDto.prenom,
            telephone: registerDto.telephone,
        });

        await this.profilRepository.save(profil);

        logger.info(`Nouvel utilisateur inscrit: ${utilisateur.email}`);

        // TODO: Envoyer email de vérification

        return {
            message: 'Inscription réussie. Veuillez vérifier votre email.',
            utilisateurId: utilisateur.id,
        };
    }

    /**
     * Rafraîchit les tokens avec un refresh token valide
     * @param refreshToken - Token de rafraîchissement
     * @param adresseIp - Adresse IP du client
     * @param userAgent - User-Agent du client
     */
    async refreshTokens(
        refreshToken: string,
        adresseIp?: string,
        userAgent?: string
    ): Promise<{ accessToken: string; refreshToken: string }> {
        // Validation du refresh token
        const tokenEntity = await this.tokenService.validateRefreshToken(refreshToken);

        if (!tokenEntity) {
            throw new AppError('Token de rafraîchissement invalide ou expiré', 401, 'INVALID_REFRESH_TOKEN');
        }

        // Récupération de l'utilisateur
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: tokenEntity.utilisateurId },
        });

        if (!utilisateur || utilisateur.statut !== StatutUtilisateur.ACTIF) {
            await this.tokenService.revokeRefreshToken(refreshToken);
            throw new AppError('Utilisateur non autorisé', 401, 'USER_NOT_AUTHORIZED');
        }

        // Révocation de l'ancien token
        await this.tokenService.revokeRefreshToken(refreshToken);

        // Génération des nouveaux tokens
        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
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
     * @param refreshToken - Token à révoquer
     */
    async logout(refreshToken: string): Promise<void> {
        await this.tokenService.revokeRefreshToken(refreshToken);
        logger.info('Déconnexion réussie');
    }

    /**
     * Déconnexion de toutes les sessions d'un utilisateur
     * @param utilisateurId - ID de l'utilisateur
     */
    async logoutAll(utilisateurId: string): Promise<void> {
        await this.tokenService.revokeAllUserTokens(utilisateurId);
        logger.info(`Toutes les sessions révoquées pour l'utilisateur ${utilisateurId}`);
    }

    /**
     * Demande de réinitialisation de mot de passe
     * @param forgotPasswordDto - Email de l'utilisateur
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { email: forgotPasswordDto.email.toLowerCase() },
        });

        // On ne révèle pas si l'email existe ou non
        if (!utilisateur) {
            return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' };
        }

        // Génération du token de réinitialisation
        const token = generateSecureToken();
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 1); // Expire dans 1 heure

        utilisateur.tokenReinitialisationMdp = token;
        utilisateur.expirationTokenMdp = expiration;

        await this.utilisateurRepository.save(utilisateur);

        // TODO: Envoyer email avec le lien de réinitialisation

        logger.info(`Demande de réinitialisation de mot de passe: ${utilisateur.email}`);

        return { message: 'Si cet email existe, vous recevrez un lien de réinitialisation.' };
    }

    /**
     * Réinitialisation du mot de passe
     * @param resetPasswordDto - Token et nouveau mot de passe
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { tokenReinitialisationMdp: resetPasswordDto.token },
        });

        if (!utilisateur) {
            throw new AppError('Token invalide ou expiré', 400, 'INVALID_TOKEN');
        }

        if (!utilisateur.expirationTokenMdp || new Date() > utilisateur.expirationTokenMdp) {
            throw new AppError('Token expiré', 400, 'TOKEN_EXPIRED');
        }

        // Mise à jour du mot de passe
        utilisateur.motDePasse = resetPasswordDto.nouveauMotDePasse;
        utilisateur.tokenReinitialisationMdp = undefined;
        utilisateur.expirationTokenMdp = undefined;

        await this.utilisateurRepository.save(utilisateur);

        // Révocation de tous les tokens existants
        await this.tokenService.revokeAllUserTokens(utilisateur.id);

        logger.info(`Mot de passe réinitialisé: ${utilisateur.email}`);

        return { message: 'Mot de passe réinitialisé avec succès.' };
    }

    /**
     * Changement de mot de passe (utilisateur connecté)
     * @param utilisateurId - ID de l'utilisateur
     * @param changePasswordDto - Ancien et nouveau mot de passe
     */
    async changePassword(
        utilisateurId: string,
        changePasswordDto: ChangePasswordDto
    ): Promise<{ message: string }> {
        const utilisateur = await this.utilisateurRepository.findOne({
            where: { id: utilisateurId },
            select: ['id', 'email', 'motDePasse'],
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Vérification de l'ancien mot de passe
        const motDePasseValide = await utilisateur.verifierMotDePasse(changePasswordDto.motDePasseActuel);

        if (!motDePasseValide) {
            throw new AppError('Mot de passe actuel incorrect', 400, 'INVALID_CURRENT_PASSWORD');
        }

        // Mise à jour du mot de passe
        utilisateur.motDePasse = changePasswordDto.nouveauMotDePasse;
        await this.utilisateurRepository.save(utilisateur);

        logger.info(`Mot de passe changé: ${utilisateur.email}`);

        return { message: 'Mot de passe changé avec succès.' };
    }

    /**
     * Vérification de l'email
     * @param token - Token de vérification
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
     * Récupère l'utilisateur courant à partir de l'ID
     * @param utilisateurId - ID de l'utilisateur
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

// Instance singleton
export const authService = new AuthService();

export default AuthService;
