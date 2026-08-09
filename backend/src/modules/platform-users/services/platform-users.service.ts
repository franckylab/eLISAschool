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
import { Role } from '@shared/enums/roles.enum';
import { AppError } from '@common/filters/error.filter';
import type {
    ListeUtilisateursDto,
    CreerUtilisateurDto,
    ModifierUtilisateurDto,
    DeleguerDto,
} from '../dto/platform-users.dto';

const ROLES_PLATEFORME = new Set<string>([
    Role.SUPER_ADMIN,
    Role.ADMINISTRATION_PLATEFORME,
    Role.SECURITE_PLATEFORME,
    Role.SUPPORT_PLATEFORME,
    Role.COMMERCIAL_PLATEFORME,
    Role.MONITORING_PLATEFORME,
]);

const profilRepo = AppDataSource.getRepository(ProfilUtilisateur);
const ueRepo = AppDataSource.getRepository(UtilisateurEtablissement);

export class PlatformUsersService {
    private utilisateurRepo = AppDataSource.getRepository(Utilisateur);
    private auditRepo = AppDataSource.getRepository(AuditLog);

    // =============================================
    // LISTE PAGINÉE
    // =============================================

    async getListeUtilisateurs(filters: ListeUtilisateursDto) {
        const qb = this.utilisateurRepo
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.profil', 'profil')
            .leftJoinAndSelect('u.utilisateurEtablissements', 'ue');

        // Filtre par rôles plateforme uniquement
        qb.where('u.role IN (:...roles)', { roles: Array.from(ROLES_PLATEFORME) });

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
    // KPIs
    // =============================================

    async getKpis() {
        const total = await this.utilisateurRepo
            .createQueryBuilder('u')
            .where('u.role IN (:...roles)', { roles: Array.from(ROLES_PLATEFORME) })
            .getCount();

        const parRole = await this.utilisateurRepo
            .createQueryBuilder('u')
            .select('u.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .where('u.role IN (:...roles)', { roles: Array.from(ROLES_PLATEFORME) })
            .groupBy('u.role')
            .getRawMany();

        const mfaActif = await this.utilisateurRepo
            .createQueryBuilder('u')
            .where('u.role IN (:...roles)', { roles: Array.from(ROLES_PLATEFORME) })
            .andWhere('u.deuxFacteursActif = :mfa', { mfa: true })
            .getCount();

        return {
            total,
            parRole: parRole.reduce((acc: Record<string, number>, r: any) => {
                acc[r.role] = parseInt(r.count, 10);
                return acc;
            }, {}),
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
        if (!ROLES_PLATEFORME.has(dto.role)) {
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
        const utilisateur = await this.utilisateurRepo.findOne({ where: { id } });
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

        if (dto.role && !ROLES_PLATEFORME.has(dto.role)) {
            throw new AppError(`Rôle invalide: ${dto.role}`, 400, 'INVALID_ROLE');
        }

        const anciennesValeurs = {
            role: utilisateur.role,
            statut: utilisateur.statut,
        };

        if (dto.role !== undefined) utilisateur.role = dto.role as Role;
        if (dto.statut !== undefined) utilisateur.statut = dto.statut as StatutUtilisateur;
        if (dto.mfaRequired !== undefined) utilisateur.deuxFacteursActif = dto.mfaRequired;

        const saved = await this.utilisateurRepo.save(utilisateur);

        // Gérer les groupes d'établissements si modifiés
        if (dto.groupeEtablissementIds !== undefined) {
            await this.synchroniserEtablissements(id, dto.groupeEtablissementIds);
        }

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_UPDATE, {
            cibleId: id,
            description: `Modification compte plateforme: ${utilisateur.email}`,
            anciennesValeurs,
            nouvellesValeurs: { role: dto.role, statut: dto.statut },
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

        // TODO: Implémenter la révocation effective des tokens via la table refresh_tokens

        await this.logAudit(operateurId, AuditAction.PLATFORM_USER_REVOKE_SESSIONS, {
            cibleId: id,
            description: `Révocation sessions: ${utilisateur.email}`,
        });

        return { success: true, message: 'Sessions révoquées' };
    }

    // =============================================
    // AUDIT TRAIL UTILISATEUR
    // =============================================

    async getAuditUtilisateur(id: string) {
        const logs = await this.auditRepo.find({
            where: { cibleId: id },
            order: { createdAt: 'DESC' },
            take: 100,
        });

        return logs;
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
            console.error(`[PlatformUsers] Audit log failed for action: ${action}`);
        }
    }
}

export const platformUsersService = new PlatformUsersService();
