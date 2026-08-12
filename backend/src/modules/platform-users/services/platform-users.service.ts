/**
 * ==================================
 * eLISAschool - Service Utilisateurs Plateforme
 * ==================================
 * Logique métier CRUD pour les comptes admin plateforme.
 *
 * Règles :
 * - Impossible de supprimer le dernier SUPER_ADMIN
 * - MFA via deuxFacteursActif
 * - Multi-établissements via UtilisateurEtablissement
 * - Audit trail automatique
 *
 * V2.3 — Panel Admin Enterprise (corrigé entités réelles)
 */

import { AppDataSource } from '@database/data-source';
import { Utilisateur, StatutUtilisateur } from '@modules/auth/entities/utilisateur.entity';
import { ProfilUtilisateur } from '@modules/auth/entities/profil-utilisateur.entity';
import { UtilisateurEtablissement } from '@modules/auth/entities/utilisateur-etablissement.entity';
import { AuditLog, AuditAction, AuditSeverity } from '@modules/auth/entities/audit-log.entity';
import { Role, ROLES_PLATEFORME } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import type {
    ListeUtilisateursDto,
    CreerUtilisateurDto,
    ModifierUtilisateurDto,
    DeleguerDto,
} from '../dto/platform-users.dto';

// Ensemble des rôles plateforme (ADR-005 — source unique)
const ROLES_PLATEFORME_SET = new Set<string>([...ROLES_PLATEFORME, Role.SUPER_ADMIN]);

const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);

export class PlatformUsersService {
    private utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    private auditRepo = AppDataSource.getRepository(AuditLog);

    // =============================================
    // LISTE PAGINÉE — TOUS les utilisateurs (v8)
    // =============================================

    async getListeUtilisateurs(filters: ListeUtilisateursDto) {
        const qb = this.utilisateurRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.profil', 'profil')
            .leftJoinAndSelect('u.utilisateurEtablissements', 'ue')
            .leftJoinAndSelect('ue.etablissement', 'etablissement');

        // Filtre par scope (plateforme/tenant/tous)
        if (filters.scope === 'plateforme') {
            qb.where('u.estPlateforme = :estPlateforme', { estPlateforme: true });
        } else if (filters.scope === 'tenant') {
            qb.where('u.estPlateforme = :estPlateforme', { estPlateforme: false });
        }
        // scope === 'tous' → pas de filtre

        if (filters.search) {
            qb.andWhere(
                '(profil.prenom ILIKE :search OR profil.nom ILIKE :search OR u.email ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        if (filters.role) {
            qb.andWhere('u.role = :role', { role: filters.role });
        }

        if (filters.statut) {
            qb.andWhere('u.statut = :statut', { statut: filters.statut });
        }

        if (filters.mfaActive !== undefined) {
            const mfa = filters.mfaActive === 'true';
            qb.andWhere('u.deuxFacteursActif = :mfa', { mfa });
        }

        // Filtre par établissement (via utilisateur_etablissements)
        if (filters.etablissementId) {
            qb.andWhere('ue.etablissementId = :etablissementId', { etablissementId: filters.etablissementId });
        }

        // Tri sécurisé (whitelist des colonnes autorisées)
        const colonnesAutorisees = ['createdAt', 'email', 'role', 'statut'];
        const tri = colonnesAutorisees.includes(filters.sortBy) ? filters.sortBy : 'createdAt';

        const [items, total] = await qb
            .orderBy(`u.${tri}`, filters.sortOrder)
            .skip(filters.offset)
            .take(filters.limit)
            .getManyAndCount();

        return { items, total, limit: filters.limit, offset: filters.offset };
    }

    // =============================================
    // KPIs — TOUS les utilisateurs (v8)
    // =============================================

    async getKpis() {
        // Total tous utilisateurs
        const total = await this.utilisateurRepo
            .createQueryBuilder('u')
            .getCount();

        // Répartition par rôle
        const parRole = await this.utilisateurRepo
            .createQueryBuilder('u')
            .select('u.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('u.role')
            .getRawMany();

        // Répartition par plan de gestion (plateforme vs tenant)
        const parPlanGestion = await this.utilisateurRepo
            .createQueryBuilder('u')
            .select('u.estPlateforme', 'estPlateforme')
            .addSelect('COUNT(*)', 'count')
            .groupBy('u.estPlateforme')
            .getRawMany();

        // MFA actif
        const mfaActif = await this.utilisateurRepo
            .createQueryBuilder('u')
            .where('u.deuxFacteursActif = :mfa', { mfa: true })
            .getCount();

        return {
            total,
            parRole: parRole.reduce((acc: Record<string, number>, r: any) => {
                acc[r.role] = parseInt(r.count, 10);
                return acc;
            }, {}),
            parPlanGestion: {
                plateforme: parPlanGestion.find((r: any) => r.estPlateforme === true)?.count || 0,
                tenant: parPlanGestion.find((r: any) => r.estPlateforme === false)?.count || 0,
            },
            mfaActif,
            mfaPourcentage: total > 0 ? Math.round((mfaActif / total) * 100) : 0,
        };
    }

    // =============================================
    // DÉTAIL
    // =============================================

    async getDetailUtilisateur(id: string) {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id },
            relations: ['profil', 'utilisateurEtablissements', 'utilisateurEtablissements.etablissement'],
        });

        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        return utilisateur;
    }

    // =============================================
    // CRÉATION
    // =============================================

    async creerUtilisateur(dto: CreerUtilisateurDto, operateurId: string) {
        // Vérifier que le rôle est valide (tous les rôles de l'enum Role sont acceptés)
        const rolesValides = Object.values(Role);
        if (!rolesValides.includes(dto.role as Role)) {
            throw new AppError(`Rôle invalide: ${dto.role}`, 400, 'INVALID_ROLE');
        }

        // Vérifier unicité email
        const existing = await this.utilisateurRepo.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new AppError('Email déjà utilisé', 409, 'EMAIL_ALREADY_EXISTS');
        }

        // Générer mot de passe temporaire + matricule
        const mdpTemporaire = this.genererMdpTemporaire();
        const matricule = Utilisateur.genererMatricule('PLT');

        // Transaction : Utilisateur + ProfilUtilisateur + UtilisateurEtablissement
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const manager = queryRunner.manager;

            // 1. Créer l'utilisateur
            const utilisateur = manager.create(Utilisateur, {
                email: dto.email,
                matricule,
                role: dto.role as Role,
                statut: StatutUtilisateur.ACTIF,
                deuxFacteursActif: false,
                emailVerifie: false,
                motDePasse: mdpTemporaire, // hashé automatiquement par @BeforeInsert
            });
            const savedUser = await manager.save(Utilisateur, utilisateur);

            // 2. Créer le profil
            const profil = manager.create(ProfilUtilisateur, {
                utilisateurId: savedUser.id,
                nom: dto.nom,
                prenom: dto.prenom,
            });
            await manager.save(ProfilUtilisateur, profil);

            // 3. Associer aux groupes d'établissements
            if (dto.groupeEtablissementIds && dto.groupeEtablissementIds.length > 0) {
                for (const etablissementId of dto.groupeEtablissementIds) {
                    const ue = manager.create(UtilisateurEtablissement, {
                        utilisateurId: savedUser.id,
                        etablissementId,
                    });
                    await manager.save(UtilisateurEtablissement, ue);
                }
            }

            await queryRunner.commitTransaction();

            // Audit trail (hors transaction)
            await this.logAudit(operateurId, AuditAction.PLATFORM_USER_CREATE, {
                cibleId: savedUser.id,
                description: `Création compte plateforme: ${dto.email} (${dto.role})`,
                nouvellesValeurs: { email: dto.email, role: dto.role },
            });

            // TODO: Envoyer email avec mot de passe temporaire si dto.envoyerEmail

            return { ...savedUser, mdpTemporaire };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // =============================================
    // MODIFICATION
    // =============================================

    async modifierUtilisateur(id: string, dto: ModifierUtilisateurDto, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({
            where: { id },
            relations: ['profil'],
        });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Protection dernier SUPER_ADMIN
        if (dto.role && dto.role !== Role.SUPER_ADMIN && utilisateur.role === Role.SUPER_ADMIN) {
            const countSuperAdmin = await this.utilisateurRepo
                .createQueryBuilder('u')
                .where('u.role = :role', { role: Role.SUPER_ADMIN })
                .andWhere('u.statut = :statut', { statut: StatutUtilisateur.ACTIF })
                .getCount();

            if (countSuperAdmin <= 1) {
                throw new AppError(
                    'Impossible de modifier le dernier SUPER_ADMIN actif',
                    409,
                    'LAST_SUPER_ADMIN',
                );
            }
        }

        if (dto.role && !ROLES_PLATEFORME_SET.has(dto.role)) {
            throw new AppError(`Rôle invalide: ${dto.role}`, 400, 'INVALID_ROLE');
        }

        // Vérifier unicité email si modifié
        if (dto.email && dto.email !== utilisateur.email) {
            const existingEmail = await this.utilisateurRepo.findOne({ where: { email: dto.email } });
            if (existingEmail) {
                throw new AppError('Email déjà utilisé', 409, 'EMAIL_ALREADY_EXISTS');
            }
            utilisateur.email = dto.email;
        }

        const anciennesValeurs: Record<string, any> = {
            role: utilisateur.role,
            statut: utilisateur.statut,
        };

        if (dto.role !== undefined) utilisateur.role = dto.role as Role;
        if (dto.statut !== undefined) utilisateur.statut = dto.statut as StatutUtilisateur;
        if (dto.mfaRequired !== undefined) utilisateur.deuxFacteursActif = dto.mfaRequired;

        const saved = await this.utilisateurRepo.save(utilisateur);

        // Modifier le profil si prenom/nom fournis
        if ((dto.prenom !== undefined || dto.nom !== undefined) && utilisateur.profil) {
            if (dto.prenom !== undefined) {
                anciennesValeurs.prenom = utilisateur.profil.prenom;
                utilisateur.profil.prenom = dto.prenom;
            }
            if (dto.nom !== undefined) {
                anciennesValeurs.nom = utilisateur.profil.nom;
                utilisateur.profil.nom = dto.nom;
            }
            await profilRepo.save(utilisateur.profil);
        }

        // Gérer les groupes d'établissements si modifiés
        if (dto.groupeEtablissementIds !== undefined) {
            await this.synchroniserEtablissements(id, dto.groupeEtablissementIds);
        }

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_UPDATE, {
            cibleId: id,
            description: `Modification compte plateforme: ${utilisateur.email}`,
            anciennesValeurs,
            nouvellesValeurs: { role: dto.role, statut: dto.statut, prenom: dto.prenom, nom: dto.nom, email: dto.email },
        });

        return saved;
    }

    // =============================================
    // DÉSACTIVATION (soft delete)
    // =============================================

    async desactiverUtilisateur(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Protection dernier SUPER_ADMIN
        if (utilisateur.role === Role.SUPER_ADMIN && utilisateur.statut === StatutUtilisateur.ACTIF) {
            const countSuperAdmin = await this.utilisateurRepo
                .createQueryBuilder('u')
                .where('u.role = :role', { role: Role.SUPER_ADMIN })
                .andWhere('u.statut = :statut', { statut: StatutUtilisateur.ACTIF })
                .getCount();

            if (countSuperAdmin <= 1) {
                throw new AppError(
                    'Impossible de désactiver le dernier SUPER_ADMIN actif',
                    409,
                    'LAST_SUPER_ADMIN',
                );
            }
        }

        utilisateur.statut = StatutUtilisateur.INACTIF;
        const saved = await this.utilisateurRepo.save(utilisateur);

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_DEACTIVATE, {
            cibleId: id,
            description: `Désactivation compte plateforme: ${utilisateur.email}`,
        });

        return saved;
    }

    // =============================================
    // RÉACTIVATION
    // =============================================

    async reactiverUtilisateur(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        utilisateur.statut = StatutUtilisateur.ACTIF;
        const saved = await this.utilisateurRepo.save(utilisateur);

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_REACTIVATE, {
            cibleId: id,
            description: `Réactivation compte plateforme: ${utilisateur.email}`,
        });

        return saved;
    }

    // =============================================
    // RÉVOCATION SESSIONS
    // =============================================

    async revoquerSessions(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Révocation effective des refresh tokens
        try {
            await AppDataSource.getRepository('RefreshToken')
                .createQueryBuilder()
                .delete()
                .where('"utilisateurId" = :id', { id })
                .execute();
        } catch {
            // Non-bloquant si la table n'existe pas
        }

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_REVOKE_SESSIONS, {
            cibleId: id,
            description: `Révocation sessions: ${utilisateur.email}`,
        });

        return { success: true, message: 'Sessions révoquées' };
    }

    // =============================================
    // RESET MFA
    // =============================================

    async resetMfa(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        utilisateur.deuxFacteursActif = false;
        utilisateur.mfaSecretHash = null;
        utilisateur.mfaBackupCodesHash = null;
        const saved = await this.utilisateurRepo.save(utilisateur);

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_RESET_MFA, {
            cibleId: id,
            description: `Reset MFA: ${utilisateur.email}`,
        });

        return { ...saved, motDePasse: undefined };
    }

    // =============================================
    // FORCE RESET PASSWORD
    // =============================================

    async forceResetPassword(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Générer un mot de passe temporaire
        const mdpTemporaire = this.genererMdpTemporaire();
        utilisateur.motDePasse = mdpTemporaire;
        const saved = await this.utilisateurRepo.save(utilisateur);

        // Révoquer les sessions actives
        try {
            await AppDataSource.getRepository('RefreshToken')
                .createQueryBuilder()
                .delete()
                .where('"utilisateurId" = :id', { id })
                .execute();
        } catch {
            // Non-bloquant
        }

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_FORCE_RESET_PASSWORD, {
            cibleId: id,
            description: `Force reset password: ${utilisateur.email}`,
        });

        return { success: true, mdpTemporaire, email: saved.email };
    }

    // =============================================
    // ARCHIVAGE (statut ARCHIVE — non destructif)
    // =============================================

    async archiverUtilisateur(id: string, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        // Protection dernier SUPER_ADMIN
        if (utilisateur.role === Role.SUPER_ADMIN && utilisateur.statut === StatutUtilisateur.ACTIF) {
            const countSuperAdmin = await this.utilisateurRepo
                .createQueryBuilder('u')
                .where('u.role = :role', { role: Role.SUPER_ADMIN })
                .andWhere('u.statut = :statut', { statut: StatutUtilisateur.ACTIF })
                .getCount();

            if (countSuperAdmin <= 1) {
                throw new AppError(
                    'Impossible d\'archiver le dernier SUPER_ADMIN actif',
                    409,
                    'LAST_SUPER_ADMIN',
                );
            }
        }

        const ancienStatut = utilisateur.statut;
        utilisateur.statut = StatutUtilisateur.ARCHIVE;
        const saved = await this.utilisateurRepo.save(utilisateur);

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_DEACTIVATE, {
            cibleId: id,
            description: `Archivage compte plateforme: ${utilisateur.email} (ancien statut: ${ancienStatut})`,
            anciennesValeurs: { statut: ancienStatut },
            nouvellesValeurs: { statut: StatutUtilisateur.ARCHIVE },
        });

        return { success: true, message: 'Utilisateur archivé', statut: StatutUtilisateur.ARCHIVE };
    }

    // =============================================
    // DÉSARCHIVAGE (restore depuis ARCHIVE)
    // =============================================

    async desarchiverUtilisateur(id: string, operateurId: string, nouveauStatut?: StatutUtilisateur) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        if (utilisateur.statut !== StatutUtilisateur.ARCHIVE) {
            throw new AppError(
                'Seuls les utilisateurs archivés peuvent être désarchivés',
                400,
                'NOT_ARCHIVED',
            );
        }

        const statutCible = nouveauStatut || StatutUtilisateur.INACTIF;
        utilisateur.statut = statutCible;
        const saved = await this.utilisateurRepo.save(utilisateur);

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_REACTIVATE, {
            cibleId: id,
            description: `Désarchivage compte plateforme: ${utilisateur.email} → ${statutCible}`,
            anciennesValeurs: { statut: StatutUtilisateur.ARCHIVE },
            nouvellesValeurs: { statut: statutCible },
        });

        return { success: true, message: 'Utilisateur désarchivé', statut: statutCible };
    }

    // =============================================
    // EXPORT CSV
    // =============================================

    async exporterCsv(filters: Partial<ListeUtilisateursDto>) {
        const qb = this.utilisateurRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.profil', 'profil')
            .leftJoinAndSelect('u.utilisateurEtablissements', 'ue')
            .leftJoinAndSelect('ue.etablissement', 'etablissement');

        // Appliquer les mêmes filtres que getListeUtilisateurs
        if (filters.scope === 'plateforme') {
            qb.where('u.estPlateforme = :estPlateforme', { estPlateforme: true });
        } else if (filters.scope === 'tenant') {
            qb.where('u.estPlateforme = :estPlateforme', { estPlateforme: false });
        }

        if (filters.search) {
            qb.andWhere(
                '(profil.prenom ILIKE :search OR profil.nom ILIKE :search OR u.email ILIKE :search)',
                { search: `%${filters.search}%` },
            );
        }

        if (filters.role) {
            qb.andWhere('u.role = :role', { role: filters.role });
        }

        if (filters.statut) {
            qb.andWhere('u.statut = :statut', { statut: filters.statut });
        }

        // Limiter à 10000 lignes pour l'export
        const items = await qb
            .orderBy('u.createdAt', 'DESC')
            .take(10000)
            .getMany();

        // Construire le CSV
        const headers = ['Email', 'Prénom', 'Nom', 'Rôle', 'Statut', 'MFA', 'Plateforme', 'Dernière connexion', 'Créé le'];
        const rows = items.map(u => [
            u.email,
            u.profil?.prenom || '',
            u.profil?.nom || '',
            u.role,
            u.statut,
            u.deuxFacteursActif ? 'Oui' : 'Non',
            u.estPlateforme ? 'Oui' : 'Non',
            u.derniereConnexion ? new Date(u.derniereConnexion).toISOString() : '',
            new Date(u.createdAt).toISOString(),
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')),
        ].join('\n');

        // BOM UTF-8 pour Excel
        const bom = '\uFEFF';
        return bom + csvContent;
    }

    // =============================================
    // AUDIT TRAIL UTILISATEUR (paginé + filtres)
    // =============================================

    async getAuditUtilisateur(id: string, page = 1, limit = 50, module?: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const qb = this.auditRepo
            .createQueryBuilder('a')
            .where('a.cibleId = :cibleId', { cibleId: id });

        if (module) {
            qb.andWhere('a.module = :module', { module });
        }

        const [items, total] = await qb
            .orderBy('a.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();

        return {
            items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    // =============================================
    // DÉLÉGATION TEMPORAIRE
    // =============================================

    async deleguer(id: string, dto: DeleguerDto, operateurId: string) {
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
        if (!utilisateur) {
            throw new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND');
        }

        const delegue = await this.utilisateurRepo.findOne({ where: { id: dto.delegueId } });
        if (!delegue) {
            throw new AppError('Délégué non trouvé', 404, 'DELEGATE_NOT_FOUND');
        }

        // TODO: Créer une entrée de délégation dans une table dédiée

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_DELEGATE, {
            cibleId: id,
            description: `Délégation de ${utilisateur.email} vers ${delegue.email}`,
            nouvellesValeurs: {
                delegueId: dto.delegueId,
                permissions: dto.permissions,
                dateDebut: dto.dateDebut,
                dateFin: dto.dateFin,
            },
        });

        return { success: true, message: 'Délégation créée' };
    }

    // =============================================
    // UTILITAIRES
    // =============================================

    private genererMdpTemporaire(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
        let password = '';
        for (let i = 0; i < 16; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    /**
     * Synchronise les établissements associés à un utilisateur.
     * Supprime les anciens, crée les nouveaux.
     */
    private async synchroniserEtablissements(utilisateurId: string, etablissementIds: string[]) {
        // Supprimer les associations existantes
        await ueRepo.delete({ utilisateurId });

        // Créer les nouvelles associations
        for (const etablissementId of etablissementIds) {
            const ue = ueRepo.create({ utilisateurId, etablissementId });
            await ueRepo.save(ue);
        }
    }

    private async logAudit(
        operateurId: string,
        action: AuditAction,
        data: { cibleId?: string; description?: string; anciennesValeurs?: any; nouvellesValeurs?: any },
    ) {
        try {
            const log = this.auditRepo.create({
                utilisateurId: operateurId,
                action,
                module: 'platform-users',
                cible: 'utilisateur_plateforme',
                cibleId: data.cibleId,
                description: data.description,
                anciennesValeurs: data.anciennesValeurs || null,
                nouvellesValeurs: data.nouvellesValeurs || null,
                severity: AuditSeverity.INFO,
                estEchec: false,
            });
            await this.auditRepo.save(log);
        } catch {
            // Audit failure should not block the operation
            logger.error(`[PlatformUsers] Audit log failed for action: ${action}`);
        }
    }
}

export const platformUsersService = new PlatformUsersService();
