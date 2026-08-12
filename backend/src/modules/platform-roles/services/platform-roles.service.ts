/**
 * ==================================
 * eLISAschool - Service Role Builder
 * ==================================
 * Gestion des rôles plateforme (défaut + personnalisés).
 *
 * Règles :
 * - Rôles système (estSysteme=true) non supprimables/modifiables
 * - Permissions granulaires par module
 * - Scope global ou par groupe
 *
 * V2.3 — Panel Admin Enterprise
 */

import { AppDataSource } from '@database/data-source';
import { AppError } from '@common/filters/error.filter';
import { Role } from '@modules/auth/entities/role.entity';
import { Permission } from '@modules/auth/entities/permission.entity';
import { Utilisateur, StatutUtilisateur } from '@modules/auth/entities/utilisateur.entity';
import { AuditLog } from '@modules/auth/entities/audit-log.entity';
import { ROLES_PLATEFORME, Role as RoleEnum } from '@shared/enums/roles.enum';
import type { CreerRoleDto, ModifierRoleDto } from '../dto/platform-roles.dto';

const permissionRepo = AppDataSource.getRepository(Permission);
const auditRepo = AppDataSource.getRepository(AuditLog);

// Ensemble des codes de rôles plateforme pour déterminer le scope
const ROLES_PLATEFORME_CODES = new Set<string>(ROLES_PLATEFORME);

// Valeurs valides de l'enum PostgreSQL utilisateurs_role_enum
const ROLE_ENUM_VALUES = new Set<string>(Object.values(RoleEnum));

/**
 * Vérifie si un code de rôle est une valeur valide de l'enum PostgreSQL.
 * Les rôles personnalisés (table `roles`) peuvent avoir des codes arbitraires
 * qui ne sont PAS dans l'enum — donc aucun utilisateur ne peut les avoir.
 */
function estRoleEnumValide(code: string): boolean {
    return ROLE_ENUM_VALUES.has(code);
}

export class PlatformRolesService {
    private repo = AppDataSource.getRepository(Role);

    // =============================================
    // LISTE — avec filtre scope (v8)
    // =============================================

    async getListeRoles(scope?: 'plateforme' | 'tenant' | 'tous') {
        const roles = await this.repo.find({
            relations: ['permissions'],
            order: { estSysteme: 'DESC', libelle: 'ASC' },
        });

        const mapped = roles.map(r => this.mapRole(r));

        // Compter les utilisateurs par rôle (optimisé : 1 seule requête)
        const nbUtilisateursParRole = await this.compterUtilisateursParRole();
        for (const role of mapped) {
            role.nbUtilisateurs = nbUtilisateursParRole.get(role.code) || 0;
        }

        // Filtrer par scope si demandé
        if (scope === 'plateforme') {
            return mapped.filter(r => r.scope === 'plateforme');
        } else if (scope === 'tenant') {
            return mapped.filter(r => r.scope === 'tenant');
        }
        // scope === 'tous' ou undefined → retourner tous les rôles
        return mapped;
    }

    // =============================================
    // DÉTAIL
    // =============================================

    async getDetailRole(id: string) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }
        const mapped = this.mapRole(role);
        // Compter les utilisateurs pour ce rôle
        // Sécurité : si le code du rôle n'est pas dans l'enum PostgreSQL, 0 utilisateurs
        if (estRoleEnumValide(role.code)) {
            mapped.nbUtilisateurs = await AppDataSource.getRepository(Utilisateur).count({
                where: { role: role.code as RoleEnum },
            });
        } else {
            mapped.nbUtilisateurs = 0;
        }
        return mapped;
    }

    // =============================================
    // CRÉATION
    // =============================================

    async creerRole(dto: CreerRoleDto) {
        // Générer un code unique à partir du nom
        const code = dto.nom.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

        // Vérifier unicité du code
        const existing = await this.repo.findOne({ where: { code } });
        if (existing) {
            throw new AppError('Un rôle avec ce nom existe déjà', 409, 'ROLE_NAME_EXISTS');
        }

        // Résoudre les permissions depuis leurs codes
        const permissions = await this.resoudrePermissions(dto.permissions);

        const role = this.repo.create({
            code,
            libelle: dto.nom,
            description: dto.description || null,
            estSysteme: false,
            permissions,
        });

        const saved = await this.repo.save(role);
        return this.mapRole(saved);
    }

    // =============================================
    // MODIFICATION
    // =============================================

    async modifierRole(id: string, dto: ModifierRoleDto) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        if (role.estSysteme) {
            throw new AppError(
                'Impossible de modifier un rôle système',
                403,
                'SYSTEM_ROLE_IMMUTABLE',
            );
        }

        if (dto.nom !== undefined) role.libelle = dto.nom;
        if (dto.description !== undefined) role.description = dto.description;
        if (dto.permissions !== undefined) {
            role.permissions = await this.resoudrePermissions(dto.permissions);
        }

        const saved = await this.repo.save(role);
        return this.mapRole(saved);
    }

    // =============================================
    // SUPPRESSION
    // =============================================

    async supprimerRole(id: string) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        if (role.estSysteme) {
            throw new AppError(
                'Impossible de supprimer un rôle système',
                403,
                'SYSTEM_ROLE_IMMUTABLE',
            );
        }

        await this.repo.remove(role);
        return { success: true, message: 'Rôle supprimé' };
    }

    // =============================================
    // PERMISSIONS DÉTAIL
    // =============================================

    async getPermissions(id: string) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        return {
            roleId: role.id,
            nom: role.libelle,
            permissions: role.permissions.map(p => p.code),
        };
    }

    // =============================================
    // UTILISATEURS PAR RÔLE
    // =============================================

    async getUtilisateursParRole(id: string) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        // La colonne `role` est un enum PostgreSQL — seuls les codes valides sont acceptés
        // Si le code du rôle n'est pas dans l'enum, aucun utilisateur ne peut l'avoir
        if (!estRoleEnumValide(role.code)) {
            return {
                roleId: role.id,
                nomRole: role.libelle,
                total: 0,
                utilisateurs: [],
            };
        }

        const utilisateurs = await AppDataSource.getRepository(Utilisateur).find({
            where: { role: role.code as RoleEnum },
            relations: ['profil'],
            order: { createdAt: 'DESC' },
        });

        return {
            roleId: role.id,
            nomRole: role.libelle,
            total: utilisateurs.length,
            utilisateurs: utilisateurs.map(u => ({
                id: u.id,
                email: u.email,
                pseudonyme: u.pseudonyme,
                prenom: u.profil?.prenom ?? null,
                nom: u.profil?.nom ?? null,
                role: u.role,
                statut: u.statut,
                estActif: u.statut === StatutUtilisateur.ACTIF,
                estPlateforme: u.estPlateforme,
                deuxFacteursActif: u.deuxFacteursActif,
                derniereConnexion: u.derniereConnexion,
            })),
        };
    }

    // =============================================
    // MATRICE PERMISSIONS (tous les modules)
    // =============================================

    async getMatricePermissions() {
        // Charger TOUTES les permissions en base (pas de liste hardcodée)
        const allPermissions = await permissionRepo.find({ order: { code: 'ASC' } });

        // Grouper dynamiquement par prefixe de module
        const moduleMap = new Map<string, string[]>();
        for (const perm of allPermissions) {
            const prefix = perm.code.split(':')[0] || 'autre';
            if (!moduleMap.has(prefix)) moduleMap.set(prefix, []);
            moduleMap.get(prefix)!.push(perm.code);
        }

        const MODULE_LABELS: Record<string, string> = {
            admin: 'Administration',
            users: 'Utilisateurs',
            utilisateurs: 'Utilisateurs (gestion)',
            roles: 'Rôles',
            permissions: 'Permissions',
            auth: 'Authentification',
            etablissements: 'Établissements',
            etablissement: 'Établissement',
            config: 'Configuration',
            configuration: 'Configuration',
            monitoring: 'Monitoring',
            audit: 'Audit',
            network: 'Réseau',
            notifications: 'Notifications',
            messages: 'Messagerie',
            messagerie: 'Messagerie',
            notes: 'Notes',
            bulletins: 'Bulletins',
            'emploi-du-temps': 'Emploi du temps',
            eleves: 'Élèves',
            enseignants: 'Enseignants',
            personnel: 'Personnel',
            'heures-cours': 'Heures de cours',
            contrats: 'Contrats',
            paie: 'Paie',
            classes: 'Classes',
            matieres: 'Matières',
            annees: 'Années scolaires',
            periodes: 'Périodes',
            cantine: 'Cantine',
            transport: 'Transport',
            parking: 'Parking',
            infrastructure: 'Infrastructure',
            materiel: 'Matériel',
            cartes: 'Cartes',
            finances: 'Finances',
            clubs: 'Clubs',
            gamification: 'Gamification',
            programmes: 'Programmes',
            orientation: 'Orientation',
            scoring: 'Scoring',
            impressions: 'Impressions',
            documents: 'Documents',
            requetes: 'Requêtes',
            sondages: 'Sondages',
            sante: 'Santé',
            validation: 'Validation workflow',
            organisation: 'Organisation',
            unites: 'Unités (legacy)',
            postes: 'Postes (legacy)',
            organigramme: 'Organigramme',
            super_admin: 'Super Admin',
            groupes: 'Groupes',
        };

        const modules = Array.from(moduleMap.entries())
            .map(([module, permissions]) => ({
                module,
                label: MODULE_LABELS[module] || module.charAt(0).toUpperCase() + module.slice(1),
                permissions,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));

        return { modules, totalPermissions: allPermissions.length };
    }

    // =============================================
    // UTILITAIRES
    // =============================================

    private mapRole(role: Role) {
        // Déterminer le scope : plateforme si le code est dans ROLES_PLATEFORME, sinon tenant
        const scope = ROLES_PLATEFORME_CODES.has(role.code) ? 'plateforme' : 'tenant';
        
        return {
            id: role.id,
            code: role.code,
            nom: role.libelle,
            libelle: role.libelle,
            description: role.description || null,
            estSysteme: role.estSysteme,
            scope,
            permissions: role.permissions ? role.permissions.map(p => p.code) : [],
            nbUtilisateurs: 0, // Rempli par getListeRoles (batch) ou getDetailRole
            etablissementId: role.etablissementId || null,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        };
    }

    /**
     * Compte les utilisateurs par rôle en une seule requête (optimisé N+1).
     */
    private async compterUtilisateursParRole(): Promise<Map<string, number>> {
        const result = await AppDataSource.getRepository(Utilisateur)
            .createQueryBuilder('u')
            .select('u.role', 'role')
            .addSelect('COUNT(*)', 'count')
            .groupBy('u.role')
            .getRawMany<{ role: string; count: string }>();
        
        const map = new Map<string, number>();
        for (const row of result) {
            map.set(row.role, parseInt(row.count, 10));
        }
        return map;
    }

    /**
     * Résout un tableau de codes permission en entités Permission.
     * Les codes inconnus sont ignorés silencieusement.
     */
    private async resoudrePermissions(codes: string[]): Promise<Permission[]> {
        if (codes.length === 0) return [];
        const permissions = await permissionRepo
            .createQueryBuilder('p')
            .where('p.code IN (:...codes)', { codes })
            .getMany();
        return permissions;
    }

    // =============================================
    // AUDIT TRAIL RÔLE (paginé)
    // =============================================

    async getAuditRole(id: string, page = 1, limit = 50) {
        const role = await this.repo.findOne({ where: { id } });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        // Les audits de rôle sont dans le module 'platform-roles' avec cibleId = roleId
        const qb = auditRepo
            .createQueryBuilder('a')
            .where('a.cibleId = :cibleId', { cibleId: id })
            .orWhere('a.module = :module', { module: 'platform-roles' });

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
    // DUPLICATION DE RÔLE
    // =============================================

    async dupliquerRole(id: string, nouveauNom?: string) {
        const role = await this.repo.findOne({
            where: { id },
            relations: ['permissions'],
        });
        if (!role) {
            throw new AppError('Rôle non trouvé', 404, 'ROLE_NOT_FOUND');
        }

        // Générer le nom et le code du nouveau rôle
        const nom = nouveauNom || `${role.libelle} (copie)`;
        const code = nom.toUpperCase().replace(/[^A-Z0-9]+/g, '_');

        // Vérifier unicité du code
        const suffix = Date.now().toString(36).toUpperCase().slice(-4);
        const uniqueCode = `${code}_${suffix}`;

        const existing = await this.repo.findOne({ where: { code: uniqueCode } });
        if (existing) {
            throw new AppError('Un rôle avec ce code existe déjà', 409, 'ROLE_CODE_EXISTS');
        }

        // Créer le nouveau rôle avec les mêmes permissions
        const nouveauRole = this.repo.create({
            code: uniqueCode,
            libelle: nom,
            description: `Dupliqué depuis "${role.libelle}" le ${new Date().toLocaleDateString('fr-FR')}`,
            estSysteme: false,
            permissions: role.permissions,
            etablissementId: role.etablissementId,
        });

        const saved = await this.repo.save(nouveauRole);
        return this.mapRole(saved);
    }

    // =============================================
    // COMPARAISON PERMISSIONS MULTI-RÔLES
    // =============================================

    async comparerPermissions(roleIds: string[]) {
        if (roleIds.length < 2 || roleIds.length > 5) {
            throw new AppError('Comparer entre 2 et 5 rôles maximum', 400, 'INVALID_COMPARE_COUNT');
        }

        const roles = await this.repo.find({
            where: roleIds.map(id => ({ id })),
            relations: ['permissions'],
        });

        if (roles.length !== roleIds.length) {
            throw new AppError('Un ou plusieurs rôles introuvables', 404, 'ROLES_NOT_FOUND');
        }

        // Construire la matrice de comparaison
        const allPermissions = new Set<string>();
        const rolePermissionsMap = new Map<string, Set<string>>();

        for (const role of roles) {
            const permSet = new Set(role.permissions.map(p => p.code));
            rolePermissionsMap.set(role.id, permSet);
            permSet.forEach(p => allPermissions.add(p));
        }

        // Pour chaque permission, déterminer quels rôles l'ont
        const comparaison = Array.from(allPermissions)
            .sort()
            .map(permCode => {
                const prefix = permCode.split(':')[0] || 'autre';
                const parRole: Record<string, boolean> = {};
                for (const role of roles) {
                    parRole[role.id] = rolePermissionsMap.get(role.id)!.has(permCode);
                }
                return {
                    permission: permCode,
                    module: prefix,
                    parRole,
                };
            });

        // Grouper par module
        const parModule = new Map<string, typeof comparaison>();
        for (const item of comparaison) {
            if (!parModule.has(item.module)) parModule.set(item.module, []);
            parModule.get(item.module)!.push(item);
        }

        return {
            roles: roles.map(r => ({
                id: r.id,
                nom: r.libelle,
                code: r.code,
                nbPermissions: rolePermissionsMap.get(r.id)!.size,
            })),
            modules: Array.from(parModule.entries()).map(([module, items]) => ({
                module,
                permissions: items,
                total: items.length,
            })),
            totalPermissions: allPermissions.size,
        };
    }
}

export const platformRolesService = new PlatformRolesService();
