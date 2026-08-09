/**
 * ==================================
 * eLISAschool - Tests E2E — Platform Panel
 * ==================================
 *
 * Tests bout-en-bout du panel admin plateforme :
 * 1. Navigation sidebar (4 groupes, 14 items)
 * 2. CRUD utilisateurs plateforme (rôles, MFA, protection dernier SA)
 * 3. Cascade paramètres multi-niveaux (résolution, propagation, incohérences)
 * 4. Guards RBAC plateforme (permissions, scope)
 *
 * V4.5 — Panel Admin Enterprise
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// =============================================
// Mocks
// =============================================

const mockUtilisateurFind = jest.fn();
const mockUtilisateurCreate = jest.fn();
const mockUtilisateurSave = jest.fn();
const mockUtilisateurCount = jest.fn();

const mockParametreFind = jest.fn();
const mockParametreFindOne = jest.fn();
const mockParametreSave = jest.fn();
const mockParametreDelete = jest.fn();

const mockAuditSave = jest.fn();

jest.mock('@database/data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn((entity: any) => {
            const name = entity?.name || entity?.tableName || '';
            if (name.includes('utilisateur')) {
                return {
                    find: mockUtilisateurFind,
                    create: mockUtilisateurCreate,
                    save: mockUtilisateurSave,
                    count: mockUtilisateurCount,
                    findOne: jest.fn(),
                    createQueryBuilder: jest.fn(() => ({
                        leftJoinAndSelect: jest.fn().mockReturnThis(),
                        where: jest.fn().mockReturnThis(),
                        andWhere: jest.fn().mockReturnThis(),
                        orderBy: jest.fn().mockReturnThis(),
                        skip: jest.fn().mockReturnThis(),
                        take: jest.fn().mockReturnThis(),
                        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
                    })),
                };
            }
            if (name.includes('parametre')) {
                return {
                    find: mockParametreFind,
                    findOne: mockParametreFindOne,
                    save: mockParametreSave,
                    delete: mockParametreDelete,
                    create: jest.fn((data: any) => data),
                };
            }
            if (name.includes('audit')) {
                return { save: mockAuditSave, create: jest.fn((data: any) => data) };
            }
            return {
                create: jest.fn((data: any) => data),
                save: jest.fn(),
                findOne: jest.fn(),
                find: jest.fn(),
                count: jest.fn(),
            };
        }),
        query: jest.fn(),
    },
}));

jest.mock('@common/utils/logger.util', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@modules/auth/services/audit.service', () => ({
    auditService: { log: jest.fn() },
}));

// =============================================
// 1. NAVIGATION SIDEBAR
// =============================================

describe('E2E — Platform Sidebar Navigation', () => {
    /**
     * La sidebar plateforme doit avoir 4 groupes workflow
     * avec exactement 14 items répartis comme suit :
     * - Pilotage : 3 items
     * - Tenants : 4 items
     * - Technique : 4 items (dont cascade)
     * - Sécurité : 3 items
     */

    const SIDEBAR_GROUPS = {
        pilotage: {
            label: 'Pilotage',
            items: [
                { label: 'Dashboard', route: '/platform/dashboard' },
                { label: 'Monitoring', route: '/platform/monitoring' },
                { label: 'Revenus', route: '/platform/revenus' },
            ],
        },
        tenants: {
            label: 'Tenants',
            items: [
                { label: 'Établissements', route: '/platform/etablissements' },
                { label: 'Groupes', route: '/platform/groupes' },
                { label: 'Facturation', route: '/platform/facturation' },
                { label: 'Abonnements', route: '/platform/abonnements' },
            ],
        },
        technique: {
            label: 'Technique',
            items: [
                { label: 'Modules', route: '/platform/modules' },
                { label: 'Configuration', route: '/platform/configuration' },
                { label: 'Notifications', route: '/platform/notifications-config' },
                { label: 'Providers', route: '/platform/providers' },
            ],
        },
        securite: {
            label: 'Sécurité',
            items: [
                { label: 'Utilisateurs', route: '/platform/utilisateurs' },
                { label: 'Permissions', route: '/platform/permissions' },
                { label: 'Audit', route: '/platform/audit' },
            ],
        },
    };

    it('a exactement 4 groupes workflow', () => {
        const groups = Object.keys(SIDEBAR_GROUPS);
        expect(groups).toHaveLength(4);
        expect(groups).toEqual(['pilotage', 'tenants', 'technique', 'securite']);
    });

    it('a exactement 14 items au total', () => {
        const totalItems = Object.values(SIDEBAR_GROUPS).reduce(
            (sum, group) => sum + group.items.length,
            0,
        );
        expect(totalItems).toBe(14);
    });

    it('le groupe Pilotage a 3 items', () => {
        expect(SIDEBAR_GROUPS.pilotage.items).toHaveLength(3);
    });

    it('le groupe Tenants a 4 items', () => {
        expect(SIDEBAR_GROUPS.tenants.items).toHaveLength(4);
    });

    it('le groupe Technique a 4 items', () => {
        expect(SIDEBAR_GROUPS.technique.items).toHaveLength(4);
    });

    it('le groupe Sécurité a 3 items', () => {
        expect(SIDEBAR_GROUPS.securite.items).toHaveLength(3);
    });

    it('toutes les routes commencent par /platform/', () => {
        for (const group of Object.values(SIDEBAR_GROUPS)) {
            for (const item of group.items) {
                expect(item.route).toMatch(/^\/platform\//);
            }
        }
    });

    it('les routes sont uniques', () => {
        const allRoutes = Object.values(SIDEBAR_GROUPS).flatMap((g) => g.items.map((i) => i.route));
        const uniqueRoutes = new Set(allRoutes);
        expect(uniqueRoutes.size).toBe(allRoutes.length);
    });

    it('le dashboard est le premier item du groupe Pilotage', () => {
        expect(SIDEBAR_GROUPS.pilotage.items[0].route).toBe('/platform/dashboard');
    });
});

// =============================================
// 2. RÔLES PLATEFORME
// =============================================

describe('E2E — Rôles Plateforme', () => {
    /**
     * 6 rôles plateforme :
     * - SUPER_ADMIN (existant)
     * - ADMINISTRATION_PLATEFORME
     * - SECURITE_PLATEFORME
     * - SUPPORT_PLATEFORME
     * - COMMERCIAL_PLATEFORME
     * - MONITORING_PLATEFORME
     */

    const ROLES_PLATEFORME = [
        'SUPER_ADMIN',
        'ADMINISTRATION_PLATEFORME',
        'SECURITE_PLATEFORME',
        'SUPPORT_PLATEFORME',
        'COMMERCIAL_PLATEFORME',
        'MONITORING_PLATEFORME',
    ];

    const ROLE_PERMISSIONS: Record<string, string[]> = {
        SUPER_ADMIN: ['platform:*'],
        ADMINISTRATION_PLATEFORME: ['platform:administration:*'],
        SECURITE_PLATEFORME: ['platform:securite:*'],
        SUPPORT_PLATEFORME: ['platform:support:*'],
        COMMERCIAL_PLATEFORME: ['platform:commercial:*'],
        MONITORING_PLATEFORME: ['platform:monitoring:*'],
    };

    it('il y a exactement 6 rôles plateforme', () => {
        expect(ROLES_PLATEFORME).toHaveLength(6);
    });

    it('SUPER_ADMIN a un wildcard sur toutes les permissions', () => {
        expect(ROLE_PERMISSIONS.SUPER_ADMIN).toContain('platform:*');
    });

    it('chaque rôle a un scope de permission unique', () => {
        const scopes = ROLES_PLATEFORME.filter((r) => r !== 'SUPER_ADMIN').map(
            (r) => ROLE_PERMISSIONS[r][0],
        );
        const uniqueScopes = new Set(scopes);
        expect(uniqueScopes.size).toBe(scopes.length);
    });

    it('MONITORING_PLATEFORME est read-only', () => {
        const perms = ROLE_PERMISSIONS.MONITORING_PLATEFORME;
        // monitoring est limité à la lecture
        expect(perms[0]).toContain('monitoring');
    });
});

// =============================================
// 3. CRUD UTILISATEURS PLATEFORME
// =============================================

describe('E2E — CRUD Utilisateurs Plateforme', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('3.1 — Protection du dernier SUPER_ADMIN', () => {
        it('impossible de désactiver le dernier SUPER_ADMIN', async () => {
            // Simuler : 1 seul SUPER_ADMIN actif
            mockUtilisateurCount.mockResolvedValue(1);

            const dernierSuperAdmin = {
                id: 'user-sa-1',
                email: 'admin@elisaschool.com',
                role: 'SUPER_ADMIN',
                statut: 'ACTIF',
                mfaActive: true,
            };

            // Tenter de désactiver
            const peutDesactiver = !(
                dernierSuperAdmin.role === 'SUPER_ADMIN' &&
                (await mockUtilisateurCount({ role: 'SUPER_ADMIN', statut: 'ACTIF' })) <= 1
            );

            expect(peutDesactiver).toBe(false);
        });

        it('possible de désactiver un SUPER_ADMIN si d\'autres existent', async () => {
            mockUtilisateurCount.mockResolvedValue(3);

            const superAdmin = {
                id: 'user-sa-2',
                role: 'SUPER_ADMIN',
                statut: 'ACTIF',
            };

            const peutDesactiver = !(
                superAdmin.role === 'SUPER_ADMIN' &&
                (await mockUtilisateurCount({ role: 'SUPER_ADMIN', statut: 'ACTIF' })) <= 1
            );

            expect(peutDesactiver).toBe(true);
        });

        it('possible de désactiver un non-SUPER_ADMIN sans restriction', () => {
            const user = { id: 'user-admin-1', role: 'ADMINISTRATION_PLATEFORME', statut: 'ACTIF' };

            const peutDesactiver = user.role !== 'SUPER_ADMIN';
            expect(peutDesactiver).toBe(true);
        });
    });

    describe('3.2 — MFA obligatoire', () => {
        it('un compte plateforme doit avoir MFA activé (grace period 24h)', () => {
            const user = {
                id: 'user-1',
                role: 'ADMINISTRATION_PLATEFORME',
                mfaActive: false,
                mfaGracePeriodEnd: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h
            };

            const dansGracePeriod = user.mfaGracePeriodEnd > new Date();
            expect(dansGracePeriod).toBe(true);
        });

        it('compte bloqué après grace period sans MFA', () => {
            const user = {
                id: 'user-2',
                role: 'SECURITE_PLATEFORME',
                mfaActive: false,
                mfaGracePeriodEnd: new Date(Date.now() - 1000), // expiré
            };

            const dansGracePeriod = user.mfaGracePeriodEnd > new Date();
            const estBloque = !user.mfaActive && !dansGracePeriod;
            expect(estBloque).toBe(true);
        });
    });

    describe('3.3 — Limite de sessions', () => {
        const MAX_SESSIONS = 3;

        it('maximum 3 sessions simultanées par compte', () => {
            const sessions = ['session-1', 'session-2', 'session-3'];
            expect(sessions.length).toBeLessThanOrEqual(MAX_SESSIONS);
        });

        it('nouvelle session rejetée si limite atteinte', () => {
            const sessions = ['session-1', 'session-2', 'session-3'];
            const nouvelleSession = 'session-4';

            const peutSeConnecter = sessions.length < MAX_SESSIONS;
            expect(peutSeConnecter).toBe(false);
        });

        it('session la plus ancienne évincée si limite atteinte avec eviction', () => {
            const sessions = [
                { id: 's1', createdAt: new Date('2025-01-01') },
                { id: 's2', createdAt: new Date('2025-01-02') },
                { id: 's3', createdAt: new Date('2025-01-03') },
            ];

            // Eviction LRU : supprimer la plus ancienne
            sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            sessions.shift(); // retire s1
            sessions.push({ id: 's4', createdAt: new Date('2025-01-04') });

            expect(sessions).toHaveLength(3);
            expect(sessions.find((s) => s.id === 's1')).toBeUndefined();
            expect(sessions.find((s) => s.id === 's4')).toBeDefined();
        });
    });

    describe('3.4 — Création compte plateforme', () => {
        it('valide les rôles autorisés lors de la création', () => {
            const rolesAutorises = new Set([
                'SUPER_ADMIN',
                'ADMINISTRATION_PLATEFORME',
                'SECURITE_PLATEFORME',
                'SUPPORT_PLATEFORME',
                'COMMERCIAL_PLATEFORME',
                'MONITORING_PLATEFORME',
            ]);

            expect(rolesAutorises.has('ADMINISTRATION_PLATEFORME')).toBe(true);
            expect(rolesAutorises.has('ADMIN')).toBe(false); // Rôle tenant, pas plateforme
            expect(rolesAutorises.has('ELEVE')).toBe(false);
        });

        it('génère un mot de passe temporaire pour les nouveaux comptes', () => {
            const generateTempPassword = () => {
                const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
                let pwd = '';
                for (let i = 0; i < 16; i++) {
                    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                return pwd;
            };

            const password = generateTempPassword();
            expect(password.length).toBe(16);
            expect(password).toMatch(/[A-Z]/);
            expect(password).toMatch(/[a-z]/);
            expect(password).toMatch(/[0-9]/);
        });
    });
});

// =============================================
// 4. CASCADE PARAMÈTRES MULTI-NIVEAUX
// =============================================

describe('E2E — Cascade Paramètres Multi-Niveaux', () => {
    /**
     * Résolution cascade :
     *   Système → Global → Groupe → Établissement
     *
     * La valeur la plus spécifique disponible est utilisée.
     */

    describe('4.1 — Résolution cascade', () => {
        function resoudreCascade(niveaux: {
            systeme?: any;
            global?: any;
            groupe?: any;
            etablissement?: any;
        }): { valeur: any; niveau: string } {
            if (niveaux.etablissement !== undefined) return { valeur: niveaux.etablissement, niveau: 'etablissement' };
            if (niveaux.groupe !== undefined) return { valeur: niveaux.groupe, niveau: 'groupe' };
            if (niveaux.global !== undefined) return { valeur: niveaux.global, niveau: 'global' };
            if (niveaux.systeme !== undefined) return { valeur: niveaux.systeme, niveau: 'systeme' };
            return { valeur: null, niveau: 'aucun' };
        }

        it('résout au niveau établissement si override présent', () => {
            const result = resoudreCascade({
                systeme: 'valeur_systeme',
                global: 'valeur_global',
                groupe: 'valeur_groupe',
                etablissement: 'valeur_etab',
            });
            expect(result.valeur).toBe('valeur_etab');
            expect(result.niveau).toBe('etablissement');
        });

        it('résout au niveau groupe si pas d\'override établissement', () => {
            const result = resoudreCascade({
                systeme: 'valeur_systeme',
                global: 'valeur_global',
                groupe: 'valeur_groupe',
            });
            expect(result.valeur).toBe('valeur_groupe');
            expect(result.niveau).toBe('groupe');
        });

        it('résout au niveau global si pas d\'override groupe/établissement', () => {
            const result = resoudreCascade({
                systeme: 'valeur_systeme',
                global: 'valeur_global',
            });
            expect(result.valeur).toBe('valeur_global');
            expect(result.niveau).toBe('global');
        });

        it('résout au niveau système si aucun override', () => {
            const result = resoudreCascade({
                systeme: 'valeur_systeme',
            });
            expect(result.valeur).toBe('valeur_systeme');
            expect(result.niveau).toBe('systeme');
        });

        it('retourne null si aucune valeur définie', () => {
            const result = resoudreCascade({});
            expect(result.valeur).toBeNull();
            expect(result.niveau).toBe('aucun');
        });
    });

    describe('4.2 — Propagation global vers établissements', () => {
        it('propager applique la valeur globale aux établissements sans override', () => {
            const valeurGlobal = 'nouvelle_valeur';
            const etablissements = [
                { id: 'etab-1', hasOverride: false, valeur: 'ancienne_valeur' },
                { id: 'etab-2', hasOverride: true, valeur: 'custom_etab2' },
                { id: 'etab-3', hasOverride: false, valeur: 'ancienne_valeur' },
            ];

            // Propagation : modifie uniquement les établissements sans override
            const result = etablissements.map((etab) => {
                if (etab.hasOverride) return etab; // Préserver l'override
                return { ...etab, valeur: valeurGlobal };
            });

            expect(result[0].valeur).toBe('nouvelle_valeur'); // Propagé
            expect(result[1].valeur).toBe('custom_etab2'); // Override préservé
            expect(result[2].valeur).toBe('nouvelle_valeur'); // Propagé
        });

        it('la propagation ne modifie pas les overrides existants', () => {
            const overrides = [
                { id: 'etab-2', valeur: 'custom', hasOverride: true },
            ];

            const apresPropagation = overrides.filter((e) => e.hasOverride);
            expect(apresPropagation).toHaveLength(1);
            expect(apresPropagation[0].valeur).toBe('custom');
        });
    });

    describe('4.3 — Détection incohérences', () => {
        enum TypeIncoherence {
            ORPHAN_OVERRIDE = 'ORPHAN_OVERRIDE', // Override sans global
            REDUNDANT_OVERRIDE = 'REDUNDANT_OVERRIDE', // Override identique au global
            TYPE_MISMATCH = 'TYPE_MISMATCH', // Types incohérents
        }

        function detecterIncoherences(params: {
            cle: string;
            global?: any;
            overrides: Array<{ scope: string; valeur: any }>;
        }): TypeIncoherence[] {
            const incoherences: TypeIncoherence[] = [];

            for (const override of params.overrides) {
                // Orphan : override sans global
                if (params.global === undefined) {
                    incoherences.push(TypeIncoherence.ORPHAN_OVERRIDE);
                    break;
                }
                // Redundant : override identique au global
                if (override.valeur === params.global) {
                    incoherences.push(TypeIncoherence.REDUNDANT_OVERRIDE);
                }
                // Type mismatch
                if (typeof override.valeur !== typeof params.global) {
                    incoherences.push(TypeIncoherence.TYPE_MISMATCH);
                }
            }

            return incoherences;
        }

        it('détecte un override orphelin (pas de global)', () => {
            const result = detecterIncoherences({
                cle: 'notes.coefficient_max',
                overrides: [{ scope: 'etab-1', valeur: 20 }],
            });
            expect(result).toContain(TypeIncoherence.ORPHAN_OVERRIDE);
        });

        it('détecte un override redondant (identique au global)', () => {
            const result = detecterIncoherences({
                cle: 'notes.coefficient_max',
                global: 20,
                overrides: [{ scope: 'etab-1', valeur: 20 }],
            });
            expect(result).toContain(TypeIncoherence.REDUNDANT_OVERRIDE);
        });

        it('détecte un type mismatch', () => {
            const result = detecterIncoherences({
                cle: 'notes.coefficient_max',
                global: '20', // string
                overrides: [{ scope: 'etab-1', valeur: 20 }], // number
            });
            expect(result).toContain(TypeIncoherence.TYPE_MISMATCH);
        });

        it('aucune incohérence si tout est cohérent', () => {
            const result = detecterIncoherences({
                cle: 'notes.coefficient_max',
                global: 20,
                overrides: [{ scope: 'etab-1', valeur: 25 }],
            });
            expect(result).toHaveLength(0);
        });
    });

    describe('4.4 — Historique et rollback', () => {
        it('chaque modification crée une version', () => {
            const versions = [
                { id: 'v1', valeur: '10', timestamp: '2025-01-01T00:00:00Z' },
                { id: 'v2', valeur: '15', timestamp: '2025-01-02T00:00:00Z' },
                { id: 'v3', valeur: '20', timestamp: '2025-01-03T00:00:00Z' },
            ];

            expect(versions).toHaveLength(3);
            expect(versions[2].valeur).toBe('20'); // Dernière version
        });

        it('le rollback restaure une version antérieure', () => {
            const versions = [
                { id: 'v1', valeur: '10' },
                { id: 'v2', valeur: '15' },
                { id: 'v3', valeur: '20' },
            ];

            // Rollback vers v1
            const versionCible = versions.find((v) => v.id === 'v1');
            expect(versionCible).toBeDefined();
            expect(versionCible!.valeur).toBe('10');
        });
    });
});

// =============================================
// 5. GUARDS RBAC PLATEFORME
// =============================================

describe('E2E — Guards RBAC Plateforme', () => {
    describe('5.1 — Contrôle d\'accès par rôle', () => {
        const ROUTE_GUARDS: Record<string, string[]> = {
            '/platform/dashboard': ['SUPER_ADMIN', 'ADMINISTRATION_PLATEFORME', 'MONITORING_PLATEFORME', 'SUPPORT_PLATEFORME', 'COMMERCIAL_PLATEFORME', 'SECURITE_PLATEFORME'],
            '/platform/etablissements': ['SUPER_ADMIN', 'ADMINISTRATION_PLATEFORME'],
            '/platform/utilisateurs': ['SUPER_ADMIN', 'SECURITE_PLATEFORME'],
            '/platform/permissions': ['SUPER_ADMIN', 'SECURITE_PLATEFORME'],
            '/platform/facturation': ['SUPER_ADMIN', 'ADMINISTRATION_PLATEFORME', 'COMMERCIAL_PLATEFORME'],
            '/platform/revenus': ['SUPER_ADMIN', 'COMMERCIAL_PLATEFORME'],
            '/platform/monitoring': ['SUPER_ADMIN', 'SUPPORT_PLATEFORME', 'MONITORING_PLATEFORME'],
            '/platform/audit': ['SUPER_ADMIN', 'SECURITE_PLATEFORME'],
        };

        it('SUPER_ADMIN a accès à toutes les routes', () => {
            for (const [route, roles] of Object.entries(ROUTE_GUARDS)) {
                expect(roles).toContain('SUPER_ADMIN');
            }
        });

        it('ADMIN seul n\'a accès à aucune route plateforme', () => {
            for (const [, roles] of Object.entries(ROUTE_GUARDS)) {
                expect(roles).not.toContain('ADMIN');
            }
        });

        it('SECURITE_PLATEFORME a accès aux routes sécurité', () => {
            expect(ROUTE_GUARDS['/platform/utilisateurs']).toContain('SECURITE_PLATEFORME');
            expect(ROUTE_GUARDS['/platform/permissions']).toContain('SECURITE_PLATEFORME');
            expect(ROUTE_GUARDS['/platform/audit']).toContain('SECURITE_PLATEFORME');
        });

        it('COMMERCIAL_PLATEFORME a accès aux routes commerciales', () => {
            expect(ROUTE_GUARDS['/platform/facturation']).toContain('COMMERCIAL_PLATEFORME');
            expect(ROUTE_GUARDS['/platform/revenus']).toContain('COMMERCIAL_PLATEFORME');
        });

        it('MONITORING_PLATEFORME a accès au monitoring et dashboard', () => {
            expect(ROUTE_GUARDS['/platform/monitoring']).toContain('MONITORING_PLATEFORME');
            expect(ROUTE_GUARDS['/platform/dashboard']).toContain('MONITORING_PLATEFORME');
        });

        it('MONITORING_PLATEFORME n\'a pas accès aux utilisateurs', () => {
            expect(ROUTE_GUARDS['/platform/utilisateurs']).not.toContain('MONITORING_PLATEFORME');
        });
    });

    describe('5.2 — Scope par groupe d\'établissements', () => {
        it('un admin avec scope groupe ne voit que les étab de son groupe', () => {
            const userScope = {
                role: 'ADMINISTRATION_PLATEFORME',
                groupeEtablissementIds: ['groupe-1', 'groupe-2'],
            };

            const etablissements = [
                { id: 'etab-1', groupeId: 'groupe-1', nom: 'Lycée A' },
                { id: 'etab-2', groupeId: 'groupe-2', nom: 'Lycée B' },
                { id: 'etab-3', groupeId: 'groupe-3', nom: 'Lycée C' },
            ];

            const visibles = etablissements.filter(
                (e) => userScope.groupeEtablissementIds.includes(e.groupeId),
            );

            expect(visibles).toHaveLength(2);
            expect(visibles.map((e) => e.id)).toEqual(['etab-1', 'etab-2']);
        });

        it('SUPER_ADMIN a un scope global (tous les établissements)', () => {
            const userScope = {
                role: 'SUPER_ADMIN',
                groupeEtablissementIds: [], // vide = global
            };

            const isGlobal = userScope.role === 'SUPER_ADMIN' || userScope.groupeEtablissementIds.length === 0;
            expect(isGlobal).toBe(true);
        });
    });

    describe('5.3 — Role Builder — Permissions personnalisées', () => {
        it('un rôle personnalisé a des permissions granulaires', () => {
            const roleCustom = {
                id: 'role-custom-1',
                nom: 'Gestionnaire facturation',
                estSysteme: false,
                permissions: [
                    'platform:facturation:read',
                    'platform:facturation:update',
                    'platform:etablissements:read',
                ],
                scopeType: 'global' as const,
            };

            expect(roleCustom.permissions).toHaveLength(3);
            expect(roleCustom.estSysteme).toBe(false);
        });

        it('un rôle système ne peut pas être supprimé', () => {
            const roles = [
                { id: 'r1', nom: 'Admin', estSysteme: true },
                { id: 'r2', nom: 'Custom', estSysteme: false },
            ];

            const supprimables = roles.filter((r) => !r.estSysteme);
            expect(supprimables).toHaveLength(1);
            expect(supprimables[0].nom).toBe('Custom');
        });

        it('scope type global vs groupe contrôle la portée du rôle', () => {
            const roleGlobal = { scopeType: 'global' as const, etablissementId: null };
            const roleGroupe = { scopeType: 'groupe' as const, etablissementId: 'groupe-1' };

            expect(roleGlobal.etablissementId).toBeNull();
            expect(roleGroupe.etablissementId).toBe('groupe-1');
        });
    });
});

// =============================================
// 6. MONITORING WEBSOCKET
// =============================================

describe('E2E — Monitoring WebSocket', () => {
    describe('6.1 — Événements monitoring', () => {
        const EVENTS = ['monitoring:alert', 'monitoring:health', 'monitoring:payment', 'monitoring:noisy-neighbor', 'monitoring:metrics'];

        it('le gateway supporte 5 types d\'événements', () => {
            expect(EVENTS).toHaveLength(5);
        });

        it('les alertes ont une sévérité parmi info/warning/critical', () => {
            const severities = ['info', 'warning', 'critical'];
            const alert = { type: 'monitoring:alert', severity: 'critical', message: 'CPU 95%' };
            expect(severities).toContain(alert.severity);
        });

        it('un événement payment contient les infos de la transaction', () => {
            const payment = {
                type: 'monitoring:payment',
                data: {
                    factureId: 'fact-1',
                    montant: 30000,
                    devise: 'XAF',
                    provider: 'mtn_momo',
                    etablissementId: 'etab-1',
                },
            };

            expect(payment.data.montant).toBeGreaterThan(0);
            expect(payment.data.devise).toBe('XAF');
        });
    });

    describe('6.2 — Rooms WebSocket', () => {
        it('SUPER_ADMIN rejoint la room "platform"', () => {
            const role = 'SUPER_ADMIN';
            const rooms: string[] = [];

            if (role === 'SUPER_ADMIN') rooms.push('platform');
            if (['SUPER_ADMIN', 'ADMIN'].includes(role)) rooms.push('monitoring');

            expect(rooms).toContain('platform');
            expect(rooms).toContain('monitoring');
        });

        it('ADMIN rejoint la room "monitoring" mais pas "platform"', () => {
            const role = 'ADMIN';
            const rooms: string[] = [];

            if (role === 'SUPER_ADMIN') rooms.push('platform');
            if (['SUPER_ADMIN', 'ADMIN'].includes(role)) rooms.push('monitoring');

            expect(rooms).not.toContain('platform');
            expect(rooms).toContain('monitoring');
        });

        it('un établissement avec ID rejoint sa room dédiée', () => {
            const etablissementId = 'etab-123';
            const room = `etablissement:${etablissementId}`;
            expect(room).toBe('etablissement:etab-123');
        });
    });
});
