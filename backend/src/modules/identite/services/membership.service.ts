/**
 * ==================================
 * eLISAschool - Service Membership (Dual-Plane)
 * ==================================
 * Modèle C — Auth0 Internalisé
 *
 * Gestion des memberships (pivot identité × contexte).
 * Permet le multi-rôle et multi-établissement.
 */

import { AppDataSource } from '@database/data-source';
import { Membership } from '../entities/membership.entity';
import { Identite } from '../entities/identite.entity';
import { UtilisateurPlateforme } from '../entities/utilisateur-plateforme.entity';
import { PermissionPlateforme } from '../entities/permission-plateforme.entity';
import { ContexteType, RolePlateforme } from '@shared/enums/platform-roles.enum';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

const identiteRepo = AppDataSource.getRepository(Identite);
const utilisateurPlateformeRepo = AppDataSource.getRepository(UtilisateurPlateforme);
const permissionPlateformeRepo = AppDataSource.getRepository(PermissionPlateforme);

export class MembershipService {
    private repo = AppDataSource.getRepository(Membership);

    // =============================================
    // MEMBERSHIPS D'UNE IDENTITÉ
    // =============================================

    async findByIdentite(identiteId: string): Promise<Membership[]> {
        return this.repo.find({
            where: { identiteId },
            order: { contexteType: 'ASC', role: 'ASC' },
        });
    }

    // =============================================
    // MEMBERS D'UN CONTEXTE (tous les membres d'un établissement ou de la plateforme)
    // =============================================

    async findByContexte(contexteType: ContexteType, contexteId?: string): Promise<Membership[]> {
        const where: any = { contexteType };
        if (contexteId) where.contexteId = contexteId;

        return this.repo.find({
            where,
            relations: ['identite'],
            order: { role: 'ASC' },
        });
    }

    // =============================================
    // ASSIGNER UN RÔLE (upsert membership)
    // =============================================

    async assignRole(
        identiteId: string,
        contexteType: ContexteType,
        contexteId: string | null,
        role: string,
    ): Promise<Membership> {
        // Vérifier que l'identité existe
        const identite = await identiteRepo.findOne({ where: { id: identiteId } });
        if (!identite) {
            throw new AppError('Identité non trouvée', 404, 'IDENTITY_NOT_FOUND');
        }

        // Upsert : chercher un membership existant
        const existing = await this.repo.findOne({
            where: {
                identiteId,
                contexteType,
                contexteId: contexteId || undefined,
            },
        });

        if (existing) {
            existing.role = role;
            existing.estActif = true;
            existing.dateActivation = new Date();
            const saved = await this.repo.save(existing);
            logger.info(`[Membership] Rôle mis à jour: ${identiteId} → ${role} (${contexteType})`);
            return saved;
        }

        const membership = this.repo.create({
            identiteId,
            contexteType,
            contexteId: contexteId || undefined,
            role,
            estActif: true,
            dateActivation: new Date(),
        });

        const saved = await this.repo.save(membership);
        logger.info(`[Membership] Créé: ${identiteId} → ${role} (${contexteType})`);
        return saved;
    }

    // =============================================
    // RÉVOQUER UN MEMBERSHIP
    // =============================================

    async revokeMembership(membershipId: string): Promise<{ success: boolean; message: string }> {
        const membership = await this.repo.findOne({ where: { id: membershipId } });
        if (!membership) {
            throw new AppError('Membership non trouvé', 404, 'MEMBERSHIP_NOT_FOUND');
        }

        membership.estActif = false;
        await this.repo.save(membership);
        logger.info(`[Membership] Révoqué: ${membershipId}`);
        return { success: true, message: 'Membership révoqué' };
    }

    // =============================================
    // RÉSOLUTION DES PERMISSIONS (rôle + customs)
    // =============================================

    async resolvePermissions(membership: Membership): Promise<string[]> {
        // Permissions de base du rôle (résolues via CASL platform abilities)
        const basePermissions: string[] = [];

        // Permissions custom (overrides jsonb)
        if (membership.permissionsCustom) {
            const customPerms = Object.entries(membership.permissionsCustom)
                .filter(([, enabled]) => enabled)
                .map(([code]) => code);
            basePermissions.push(...customPerms);
        }

        return basePermissions;
    }

    // =============================================
    // MEMBERS PLATEFORME (tous les utilisateurs avec membership PLATEFORME)
    // =============================================

    async findPlatformMembers(): Promise<Membership[]> {
        return this.repo.find({
            where: {
                contexteType: ContexteType.PLATEFORME,
                estActif: true,
            },
            relations: ['identite'],
            order: { role: 'ASC' },
        });
    }

    // =============================================
    // MEMBERSHIPS D'UN ÉTABLISSEMENT
    // =============================================

    async findEtablissementMembers(etablissementId: string): Promise<Membership[]> {
        return this.repo.find({
            where: {
                contexteType: ContexteType.ETABLISSEMENT,
                contexteId: etablissementId,
                estActif: true,
            },
            relations: ['identite'],
            order: { role: 'ASC' },
        });
    }

    // =============================================
    // PERMISSIONS PLATEFORME (CRUD sur la table permissions_plateforme)
    // =============================================

    async getAllPermissionsPlateforme(): Promise<PermissionPlateforme[]> {
        return permissionPlateformeRepo.find({
            order: { module: 'ASC', ordre: 'ASC' },
        });
    }

    async getPermissionsByModule(): Promise<Record<string, PermissionPlateforme[]>> {
        const permissions = await this.getAllPermissionsPlateforme();
        return permissions.reduce((acc: Record<string, PermissionPlateforme[]>, p) => {
            if (!acc[p.module]) acc[p.module] = [];
            acc[p.module].push(p);
            return acc;
        }, {});
    }

    // =============================================
    // MATRICE PERMISSIONS × RÔLES
    // =============================================

    async getMatricePermissions() {
        const permissions = await this.getAllPermissionsPlateforme();
        const roles = Object.values(RolePlateforme);

        // Construire la matrice : pour chaque rôle, lister les permissions accordées
        // via definePlatformAbility (import dynamique pour éviter les dépendances circulaires)
        const { definePlatformAbility } = await import('@shared/casl/platform-abilities');

        const matrice = roles.map(role => {
            const ability = definePlatformAbility(role);
            const permissionsAccordees = permissions
                .filter(p => {
                    // Mapper le code permission vers un subject CASL
                    const [module] = p.code.split(':');
                    const subjectMap: Record<string, string> = {
                        dashboard: 'Monitoring',
                        etablissements: 'Etablissement',
                        facturation: 'Facture',
                        monitoring: 'Monitoring',
                        securite: 'PlatformUser',
                        audit: 'AuditLog',
                        actions: 'ActionCritique',
                        config: 'Configuration',
                    };
                    const subject = subjectMap[module] || 'all';
                    const action = p.code.includes('view') || p.code.includes('read') ? 'read'
                        : p.code.includes('write') || p.code.includes('manage') ? 'manage'
                        : p.code.includes('create') ? 'create'
                        : p.code.includes('update') ? 'update'
                        : p.code.includes('delete') ? 'delete'
                        : p.code.includes('export') ? 'export'
                        : p.code.includes('approve') ? 'approve'
                        : p.code.includes('toggle') ? 'toggle'
                        : 'read';
                    return ability.can(action as any, subject as any);
                })
                .map(p => p.code);

            return {
                role,
                permissions: permissionsAccordees,
                total: permissionsAccordees.length,
            };
        });

        return {
            permissions: permissions.map(p => ({
                code: p.code,
                libelle: p.libelle,
                module: p.module,
                description: p.description,
            })),
            roles: matrice,
            modules: [...new Set(permissions.map(p => p.module))],
        };
    }
}

export const membershipService = new MembershipService();
