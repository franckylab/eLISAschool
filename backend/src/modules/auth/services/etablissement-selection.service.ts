/**
 * ==================================
 * eLISAschool - Service de Sélection d'Établissement
 * ==================================
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * 
 * Gère la logique de sélection d'établissement lors de la connexion
 * et le changement d'établissement actif pour les utilisateurs multi-tenants.
 * 
 * Fonctionnalités :
 * - Détection du nombre d'établissements actifs
 * - Connexion automatique si 1 seul établissement
 * - Retour de la liste pour sélection si >1 établissement
 * - Génération de token temporaire (5 min) pour forcer la sélection
 * - Génération de token complet après sélection
 * - Permissions contextuelles par établissement
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Utilisateur, UtilisateurEtablissement, Role } from '@modules/auth/entities';
import { Etablissement } from '@modules/etablissement/entities';
import { TokenService } from '@modules/auth/services/token.service';
import { permissionResolverService } from '@modules/auth/services/permission-resolver.service';
import { JwtPayload } from '@modules/auth/dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

/**
 * Interface pour la réponse de pré-connexion
 */
export interface PreLoginResponse {
    requiereSelection: boolean;
    etablissements?: Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
        logoUrl?: string;
    }>;
    tokenTemporaire?: string;
    expiresIn?: number;
}

/**
 * Interface pour la réponse de connexion complète
 */
export interface CompleteLoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    utilisateur: {
        id: string;
        email: string;
        matricule: string;
        role: string;
        nom: string;
        prenom: string;
        etablissementActif: string;
        etablissements: Array<{
            etablissementId: string;
            role: string;
            etablissementPrincipal: boolean;
            actif: boolean;
        }>;
    };
}

export class EtablissementSelectionService {
    private utilisateurRepo: Repository<Utilisateur>;
    private utilisateurEtablissementRepo: Repository<UtilisateurEtablissement>;
    private etablissementRepo: Repository<Etablissement>;
    private tokenService: TokenService;

    constructor() {
        this.utilisateurRepo = AppDataSource.getRepository(Utilisateur);
        this.utilisateurEtablissementRepo = AppDataSource.getRepository(UtilisateurEtablissement);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.tokenService = new TokenService();
    }

    /**
     * Pré-login : détecte si sélection d'établissement requise
     * 
     * @param utilisateurId ID de l'utilisateur authentifié
     * @returns PréLoginResponse avec liste ou token temporaire
     */
    async preLogin(
        utilisateurId: string,
        adresseIp?: string,
        userAgent?: string
    ): Promise<PreLoginResponse> {
        // Charger les établissements actifs avec détails
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId, actif: true },
            relations: ['etablissement'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        // Cas 0 : Aucun établissement (legacy ou SUPER_ADMIN global)
        if (utilisateurEtablissements.length === 0) {
            const utilisateur = await this.utilisateurRepo.findOne({
                where: { id: utilisateurId },
                select: ['etablissementId']
            });

            return {
                requiereSelection: false,
                // Pas de liste - connexion directe avec fallback legacy
            };
        }

        // Cas 1 : Un seul établissement → connexion automatique
        if (utilisateurEtablissements.length === 1) {
            return {
                requiereSelection: false,
            };
        }

        // Cas 2+ : Plusieurs établissements → sélection requise
        const etablissementsDisponibles = utilisateurEtablissements.map(ue => ({
            id: ue.etablissementId,
            nom: ue.etablissement?.nom || 'Établissement',
            code: (ue.etablissement as any)?.code,
            role: ue.role,
            etablissementPrincipal: ue.etablissementPrincipal,
            logoUrl: ue.etablissement?.logoUrl,
        }));

        // Générer un token TEMPORAIRE avec expiration courte (5 min)
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId },
            select: ['id', 'email', 'role']
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'NOT_FOUND');
        }

        const resolvedPermissions = await permissionResolverService.resolvePermissions(utilisateurId);
        const userRoles = await permissionResolverService.getUserRoles(utilisateurId);

        const payloadTemporaire: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
            roles: userRoles.map(r => r.code),
            permissions: Array.from(resolvedPermissions),
            etablissementId: undefined, // ← Token incomplet - sélection requise
            etablissements: utilisateurEtablissements.map(ue => ({
                etablissementId: ue.etablissementId,
                role: ue.role,
                etablissementPrincipal: ue.etablissementPrincipal,
                actif: ue.actif
            })),
        };

        // Token temporaire avec expiration courte (5 minutes = 300 secondes)
        const accessTokenTemporaire = this.tokenService.generateAccessToken(payloadTemporaire, '5m');

        logger.info(
            `[EtablissementSelection] Utilisateur ${utilisateur.email} - ${utilisateurEtablissements.length} établissements détectés`
        );

        return {
            requiereSelection: true,
            etablissements: etablissementsDisponibles,
            tokenTemporaire: accessTokenTemporaire,
            expiresIn: 300, // 5 minutes
        };
    }

    /**
     * Génère un token complet après sélection d'établissement
     * 
     * @param utilisateurId ID de l'utilisateur
     * @param etablissementId ID de l'établissement sélectionné
     * @param adresseIp IP du client
     * @param userAgent User-Agent du client
     * @returns CompleteLoginResponse avec token complet
     */
    async completeLogin(
        utilisateurId: string,
        etablissementId: string,
        adresseIp?: string,
        userAgent?: string
    ): Promise<CompleteLoginResponse> {
        // Vérifier que l'utilisateur a accès à cet établissement
        const affectation = await this.utilisateurEtablissementRepo.findOne({
            where: { utilisateurId, etablissementId, actif: true },
            relations: ['etablissement']
        });

        if (!affectation) {
            throw new AppError(
                'Accès non autorisé à cet établissement',
                403,
                'ETABLISSEMENT_ACCESS_DENIED'
            );
        }

        // Charger tous les établissements de l'utilisateur
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId, actif: true },
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        // Charger l'utilisateur
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id: utilisateurId },
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'NOT_FOUND');
        }

        // Charger le profil
        const profilRepo = AppDataSource.getRepository('ProfilUtilisateur');
        const profil = await profilRepo.findOne({
            where: { utilisateurId }
        }) as any;

        // Résoudre les permissions (version actuelle - sera améliorée avec contexte établissement)
        // TODO v3.1 : Implémenter resolvePermissionsForEtablissement dans permissionResolverService
        const permissionsEtablissement = await permissionResolverService.resolvePermissions(utilisateurId);

        const userRoles = await permissionResolverService.getUserRoles(utilisateurId);

        const etablissementsPayload = utilisateurEtablissements.map(ue => ({
            etablissementId: ue.etablissementId,
            role: ue.role,
            etablissementPrincipal: ue.etablissementPrincipal,
            actif: ue.actif
        }));

        // Payload JWT complet avec rôle contextuel
        const payload: JwtPayload = {
            sub: utilisateur.id,
            email: utilisateur.email,
            role: utilisateur.role,
            roles: userRoles.map(r => r.code),
            permissions: Array.from(permissionsEtablissement), // Permissions contextuelles
            etablissementId: etablissementId,
            roleDansEtablissement: affectation.role, // NOUVEAU v3.0
            etablissements: etablissementsPayload,
        };

        const accessToken = this.tokenService.generateAccessToken(payload);
        const refreshToken = await this.tokenService.generateRefreshToken(
            utilisateurId,
            adresseIp,
            userAgent
        );

        logger.info(
            `[EtablissementSelection] Connexion complète: ${utilisateur.email} → Établissement ${etablissementId} (${affectation.role})`
        );

        return {
            accessToken,
            refreshToken,
            expiresIn: 86400, // 24 heures (sera override par config)
            utilisateur: {
                id: utilisateur.id,
                email: utilisateur.email,
                matricule: utilisateur.matricule,
                role: utilisateur.role,
                nom: profil?.nom || '',
                prenom: profil?.prenom || '',
                etablissementActif: etablissementId,
                etablissements: etablissementsPayload,
            },
        };
    }

    /**
     * Récupère la liste des établissements disponibles pour un utilisateur
     * 
     * @param utilisateurId ID de l'utilisateur
     * @returns Liste des établissements avec rôles
     */
    async getEtablissementsDisponibles(utilisateurId: string): Promise<Array<{
        id: string;
        nom: string;
        code?: string;
        role: string;
        etablissementPrincipal: boolean;
        logoUrl?: string;
        actif: boolean;
    }>> {
        const utilisateurEtablissements = await this.utilisateurEtablissementRepo.find({
            where: { utilisateurId, actif: true },
            relations: ['etablissement'],
            order: { etablissementPrincipal: 'DESC', creeAt: 'ASC' }
        });

        return utilisateurEtablissements.map(ue => ({
            id: ue.etablissementId,
            nom: ue.etablissement?.nom || 'Établissement',
            code: (ue.etablissement as any)?.code,
            role: ue.role,
            etablissementPrincipal: ue.etablissementPrincipal,
            logoUrl: ue.etablissement?.logoUrl,
            actif: ue.actif,
        }));
    }
}

export const etablissementSelectionService = new EtablissementSelectionService();
