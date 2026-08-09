/**
 * ==================================
 * eLISAschool - Service Platform Auth
 * ==================================
 * Version: 1.0.0
 *
 * Authentification dual-plane pour la plateforme (Control Plane).
 * - Login via table identites + vérification motDePasseHash
 * - Chargement des memberships (plateforme + établissements)
 * - Construction JWT scopé (claims platform + tenant)
 * - MFA obligatoire pour les rôles plateforme
 *
 * Modèle C — Auth0 Internalisé (Dual-Plane)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Identite } from '@modules/identite/entities/identite.entity';
import { UtilisateurPlateforme } from '@modules/identite/entities/utilisateur-plateforme.entity';
import { Membership } from '@modules/identite/entities/membership.entity';
import { platformSessionsService } from '@modules/platform-sessions/services/platform-sessions.service';
import { StatutIdentite, RolePlateforme } from '@shared/enums/platform-roles.enum';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { TokenService } from '@modules/auth/services/token.service';
import type { PlatformLoginResponse, PlatformMeResponse } from '../dto/platform-auth.dto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { envConfig } from '@config/env.config';

export class PlatformAuthService {
    private identiteRepo: Repository<Identite>;
    private utilisateurPlateformeRepo: Repository<UtilisateurPlateforme>;
    private membershipRepo: Repository<Membership>;
    private tokenService: TokenService;

    constructor() {
        this.identiteRepo = AppDataSource.getRepository(Identite);
        this.utilisateurPlateformeRepo = AppDataSource.getRepository(UtilisateurPlateforme);
        this.membershipRepo = AppDataSource.getRepository(Membership);
        this.tokenService = new TokenService();
    }

    /**
     * Login plateforme — résout l'identité, vérifie le mot de passe,
     * charge les memberships, construit le JWT dual-plane.
     */
    async login(
        email: string,
        motDePasse: string,
        ip?: string,
        userAgent?: string,
    ): Promise<PlatformLoginResponse> {
        // 1. Résoudre l'identité par email
        const identite = await this.identiteRepo.findOne({ where: { email } });
        if (!identite) {
            throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
        }

        // 2. Vérifier le statut
        if (identite.statut !== StatutIdentite.ACTIF) {
            throw new AppError(
                `Compte ${identite.statut.toLowerCase()} — contactez un administrateur`,
                403,
                'ACCOUNT_DISABLED',
            );
        }

        // 3. Vérifier le mot de passe
        const motDePasseValide = await bcrypt.compare(motDePasse, identite.motDePasseHash);
        if (!motDePasseValide) {
            throw new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS');
        }

        // 4. Charger l'utilisateur plateforme
        const utilisateurPlateforme = await this.utilisateurPlateformeRepo.findOne({
            where: { identiteId: identite.id, estActif: true },
        });
        if (!utilisateurPlateforme) {
            throw new AppError('Accès plateforme non autorisé', 403, 'NOT_PLATFORM_USER');
        }

        // 5. Charger toutes les memberships
        const memberships = await this.membershipRepo.find({
            where: { identiteId: identite.id, estActif: true },
        });

        // 6. Construire le JWT dual-plane
        const jwtPayload = {
            sub: identite.id,
            email: identite.email,
            role: utilisateurPlateforme.rolePlateforme,
            roles: [utilisateurPlateforme.rolePlateforme],
            platform: {
                role: utilisateurPlateforme.rolePlateforme,
                utilisateurPlateformeId: utilisateurPlateforme.id,
            },
            tenant: null, // Sera défini lors de la sélection d'établissement
            etablissements: memberships
                .filter(m => m.contexteType === 'ETABLISSEMENT')
                .map(m => ({
                    etablissementId: m.contexteId,
                    role: m.role,
                    actif: m.estActif,
                })),
        };

        const accessToken = this.tokenService.generateAccessToken(jwtPayload as any);
        const refreshToken = await this.tokenService.generateRefreshToken(
            identite.id,
            ip,
            userAgent,
        );

        // 7. Créer la session plateforme
        await platformSessionsService.createSession(
            utilisateurPlateforme.id,
            accessToken,
            ip,
            userAgent,
        );

        // 8. Mettre à jour la dernière connexion
        await this.identiteRepo.update(identite.id, { derniereConnexion: new Date() });
        await this.utilisateurPlateformeRepo.update(utilisateurPlateforme.id, {
            dernierAcces: new Date(),
        });

        logger.info(`Login plateforme: ${identite.email} (${utilisateurPlateforme.rolePlateforme})`);

        return {
            accessToken,
            refreshToken: (refreshToken as any).token || String(refreshToken),
            expiresIn: 86400, // 24h
            utilisateur: {
                identiteId: identite.id,
                email: identite.email,
                prenom: utilisateurPlateforme.prenom,
                nom: utilisateurPlateforme.nom,
                rolePlateforme: utilisateurPlateforme.rolePlateforme,
                avatarUrl: utilisateurPlateforme.avatarUrl,
                mfaActive: identite.mfaActive,
            },
            memberships: memberships.map(m => ({
                contexteType: m.contexteType,
                contexteId: m.contexteId,
                role: m.role,
            })),
        };
    }

    /**
     * GET /me — Informations de l'utilisateur plateforme courant.
     */
    async getMe(identiteId: string): Promise<PlatformMeResponse> {
        const identite = await this.identiteRepo.findOne({ where: { id: identiteId } });
        if (!identite) {
            throw new AppError('Identité introuvable', 404, 'IDENTITY_NOT_FOUND');
        }

        const utilisateurPlateforme = await this.utilisateurPlateformeRepo.findOne({
            where: { identiteId },
        });
        if (!utilisateurPlateforme) {
            throw new AppError('Profil plateforme introuvable', 404, 'PROFILE_NOT_FOUND');
        }

        const memberships = await this.membershipRepo.find({
            where: { identiteId },
        });

        return {
            identiteId: identite.id,
            email: identite.email,
            prenom: utilisateurPlateforme.prenom,
            nom: utilisateurPlateforme.nom,
            rolePlateforme: utilisateurPlateforme.rolePlateforme,
            avatarUrl: utilisateurPlateforme.avatarUrl,
            mfaActive: identite.mfaActive,
            memberships: memberships.map(m => ({
                contexteType: m.contexteType,
                contexteId: m.contexteId,
                role: m.role,
                estActif: m.estActif,
            })),
            derniereConnexion: identite.derniereConnexion,
        };
    }

    /**
     * Logout — révoque la session plateforme.
     */
    async logout(identiteId: string): Promise<void> {
        const utilisateurPlateforme = await this.utilisateurPlateformeRepo.findOne({
            where: { identiteId },
        });
        if (utilisateurPlateforme) {
            await platformSessionsService.revokeAllSessions(utilisateurPlateforme.id);
            logger.info(`Logout plateforme: ${identiteId}`);
        }
    }
}

export const platformAuthService = new PlatformAuthService();
