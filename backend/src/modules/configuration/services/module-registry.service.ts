/**
 * ==================================
 * eLISAschool - Service Module Registry (Avancé)
 * ==================================
 * 
 * Registre avancé des modules avec :
 * - Activation/désactivation par plan ET par tenant (override)
 * - Cascade : global → groupe → établissement
 * - planMinimum, featureFlag, prixOptionnel
 * - Preview impact avant activation
 * 
 * Phase 10.1 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ConfigurationModule } from '../entities/configuration-module.entity';
import { ParametreSysteme, CategorieParametre, TypeValeurParametre } from '../entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

// =============================================
// TYPES
// =============================================

export interface ModuleDefinition {
    /** Identifiant unique du module */
    id: string;
    /** Nom affiché */
    nom: string;
    /** Description */
    description: string;
    /** Icône (nom ou emoji) */
    icone: string;
    /** Catégorie */
    categorie: 'core' | 'pedagogie' | 'gestion' | 'communication' | 'optionnel';
    /** Plan minimum requis pour activer ce module */
    planMinimum?: string;
    /** Feature flag associé */
    featureFlag?: string;
    /** Prix mensuel optionnel (si module payant supplémentaire) */
    prixMensuel?: number;
    /** Prix annuel optionnel */
    prixAnnuel?: number;
    /** Quotas associés au module */
    quotas?: Array<{
        type: string;
        limite: number;
        label: string;
    }>;
    /** Dépendances (IDs d'autres modules) */
    dependances?: string[];
    /** Si le module est actif par défaut */
    actifParDefaut: boolean;
    /** Ordre d'affichage */
    ordre: number;
}

export interface ModuleActivationStatus {
    moduleId: string;
    nom: string;
    actif: boolean;
    /** Raison si le module n'est pas actif */
    raisonInactif?: string;
    /** Source de l'activation : 'plan' | 'override' | 'global' */
    sourceActivation: 'plan' | 'override_tenant' | 'global' | 'defaut';
    /** Configuration spécifique au tenant */
    configTenant?: Record<string, any>;
}

export interface ModuleActivationPreview {
    module: ModuleDefinition;
    impact: {
        prixSupplementaire: number;
        quotasAjoutes: Array<{ type: string; limite: number }>;
        modulesDebloques: string[];
        modulesDesactives: string[]; // Modules qui dépendent de celui-ci
    };
}

// =============================================
// DÉFINITION DES MODULES
// =============================================

const MODULE_DEFINITIONS: ModuleDefinition[] = [
    // Core
    {
        id: 'auth',
        nom: 'Authentification',
        description: 'Gestion des utilisateurs, rôles, permissions',
        icone: '🔐',
        categorie: 'core',
        actifParDefaut: true,
        ordre: 1,
    },
    {
        id: 'eleves',
        nom: 'Élèves',
        description: 'Gestion des élèves, inscriptions, dossiers',
        icone: '🎓',
        categorie: 'core',
        actifParDefaut: true,
        ordre: 2,
    },
    // Pédagogie
    {
        id: 'notes',
        nom: 'Notes & Bulletins',
        description: 'Saisie des notes, calcul des moyennes, bulletins',
        icone: '📝',
        categorie: 'pedagogie',
        actifParDefaut: true,
        ordre: 10,
    },
    {
        id: 'emploi_du_temps',
        nom: 'Emploi du temps',
        description: 'Créneaux horaires, heures de cours, planning',
        icone: '📅',
        categorie: 'pedagogie',
        featureFlag: 'module_edt',
        actifParDefaut: true,
        ordre: 11,
    },
    {
        id: 'orientation',
        nom: 'Orientation',
        description: 'Suivi orientation, fiches conseil de classe',
        icone: '🧭',
        categorie: 'pedagogie',
        planMinimum: 'pro',
        featureFlag: 'module_orientation',
        actifParDefaut: false,
        ordre: 12,
    },
    // Gestion
    {
        id: 'cantine',
        nom: 'Cantine',
        description: 'Inscriptions repas, menus, facturation cantine',
        icone: '🍽️',
        categorie: 'gestion',
        featureFlag: 'module_cantine',
        prixMensuel: 5000,
        actifParDefaut: false,
        ordre: 20,
    },
    {
        id: 'transport',
        nom: 'Transport',
        description: 'Gestion transport scolaire, itinéraires',
        icone: '🚌',
        categorie: 'gestion',
        featureFlag: 'module_transport',
        prixMensuel: 3000,
        actifParDefaut: false,
        ordre: 21,
    },
    {
        id: 'finances',
        nom: 'Finances',
        description: 'Gestion financière, frais scolaires, paiements',
        icone: '💰',
        categorie: 'gestion',
        featureFlag: 'module_finances',
        actifParDefaut: false,
        ordre: 22,
    },
    {
        id: 'bibliotheque',
        nom: 'Bibliothèque',
        description: 'Gestion ouvrages, prêts, catalogues',
        icone: '📚',
        categorie: 'gestion',
        featureFlag: 'module_bibliotheque',
        prixMensuel: 2000,
        actifParDefaut: false,
        ordre: 23,
    },
    // Communication
    {
        id: 'messagerie',
        nom: 'Messagerie',
        description: 'Communication interne, messages, annonces',
        icone: '💬',
        categorie: 'communication',
        actifParDefaut: true,
        ordre: 30,
    },
    {
        id: 'notifications',
        nom: 'Notifications',
        description: 'Notifications email, SMS, push, in-app',
        icone: '🔔',
        categorie: 'communication',
        actifParDefaut: true,
        ordre: 31,
    },
    // Optionnel
    {
        id: 'clubs',
        nom: 'Clubs & Activités',
        description: 'Gestion clubs, activités parascolaires',
        icone: '⚽',
        categorie: 'optionnel',
        featureFlag: 'module_clubs',
        actifParDefaut: false,
        ordre: 40,
    },
    {
        id: 'gamification',
        nom: 'Gamification',
        description: 'Points, badges, classements, récompenses',
        icone: '🏆',
        categorie: 'optionnel',
        planMinimum: 'pro',
        featureFlag: 'module_gamification',
        prixMensuel: 3000,
        actifParDefaut: false,
        ordre: 41,
    },
    {
        id: 'comptabilite',
        nom: 'Comptabilité',
        description: 'Comptabilité générale, bilan, rapports',
        icone: '📊',
        categorie: 'optionnel',
        planMinimum: 'enterprise',
        featureFlag: 'module_comptabilite',
        prixMensuel: 10000,
        actifParDefaut: false,
        ordre: 42,
    },
];

// =============================================
// SERVICE
// =============================================

export class ModuleRegistryService {
    private configModuleRepo: Repository<ConfigurationModule>;
    private parametreRepo: Repository<ParametreSysteme>;
    private definitions: Map<string, ModuleDefinition>;

    constructor() {
        this.configModuleRepo = AppDataSource.getRepository(ConfigurationModule);
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);

        // Indexer les définitions
        this.definitions = new Map();
        for (const def of MODULE_DEFINITIONS) {
            this.definitions.set(def.id, def);
        }
    }

    // =============================================
    // DÉFINITIONS
    // =============================================

    /**
     * Récupère toutes les définitions de modules.
     */
    getAllDefinitions(): ModuleDefinition[] {
        return MODULE_DEFINITIONS.sort((a, b) => a.ordre - b.ordre);
    }

    /**
     * Récupère la définition d'un module.
     */
    getDefinition(moduleId: string): ModuleDefinition | undefined {
        return this.definitions.get(moduleId);
    }

    /**
     * Récupère les modules par catégorie.
     */
    getModulesByCategorie(): Record<string, ModuleDefinition[]> {
        const grouped: Record<string, ModuleDefinition[]> = {};
        for (const def of MODULE_DEFINITIONS) {
            if (!grouped[def.categorie]) {
                grouped[def.categorie] = [];
            }
            grouped[def.categorie].push(def);
        }
        return grouped;
    }

    // =============================================
    // ACTIVATION
    // =============================================

    /**
     * Vérifie si un module est actif pour un établissement.
     * Cascade : override tenant → plan flags → feature flag → défaut
     */
    async isModuleActif(moduleId: string, etablissementId: string): Promise<boolean> {
        const def = this.definitions.get(moduleId);
        if (!def) return false;

        // 1. Vérifier override tenant (paramètre système)
        const override = await this.parametreRepo.findOne({
            where: {
                cle: `modules.${moduleId}.actif`,
                etablissementId,
            },
        });

        if (override) {
            return override.valeur === 'true';
        }

        // 2. Vérifier feature flag
        if (def.featureFlag) {
            try {
                const { featureFlagService } = await import('@modules/billing/services/feature-flags.service');
                const isEnabled = await featureFlagService.isEnabled(def.featureFlag, etablissementId);
                if (isEnabled) return true;
            } catch {
                // Si le service billing n'est pas disponible, continuer
            }
        }

        // 3. Retourner la valeur par défaut
        return def.actifParDefaut;
    }

    /**
     * Active ou désactive un module pour un établissement (override).
     */
    async setModuleActif(moduleId: string, etablissementId: string, actif: boolean): Promise<void> {
        const def = this.definitions.get(moduleId);
        if (!def) {
            throw new Error(`Module "${moduleId}" inconnu`);
        }

        // Vérifier les dépendances si activation
        if (actif && def.dependances) {
            for (const depId of def.dependances) {
                const depActif = await this.isModuleActif(depId, etablissementId);
                if (!depActif) {
                    throw new Error(
                        `Le module "${moduleId}" nécessite le module "${depId}" qui n'est pas actif`
                    );
                }
            }
        }

        // Créer ou mettre à jour le paramètre
        let parametre = await this.parametreRepo.findOne({
            where: { cle: `modules.${moduleId}.actif`, etablissementId },
        });

        if (parametre) {
            parametre.valeur = String(actif);
        } else {
            parametre = this.parametreRepo.create({
                cle: `modules.${moduleId}.actif`,
                valeur: String(actif),
                typeValeur: TypeValeurParametre.BOOLEAN,
                categorie: CategorieParametre.MODULE,
                module: moduleId,
                etablissementId,
                description: `Activation du module ${def.nom}`,
               modifiableRuntime: true,
            });
        }

        await this.parametreRepo.save(parametre);

        logger.info(
            `[ModuleRegistry] Module "${moduleId}" ${actif ? 'activé' : 'désactivé'} ` +
            `pour établissement ${etablissementId}`
        );
    }

    /**
     * Récupère le statut de tous les modules pour un établissement.
     */
    async getModulesStatus(etablissementId: string): Promise<ModuleActivationStatus[]> {
        const statuses: ModuleActivationStatus[] = [];

        for (const def of this.getAllDefinitions()) {
            const actif = await this.isModuleActif(def.id, etablissementId);

            // Déterminer la source d'activation
            let sourceActivation: ModuleActivationStatus['sourceActivation'] = 'defaut';
            const override = await this.parametreRepo.findOne({
                where: { cle: `modules.${def.id}.actif`, etablissementId },
            });

            if (override) {
                sourceActivation = 'override_tenant';
            } else if (def.actifParDefaut) {
                sourceActivation = 'defaut';
            }

            let raisonInactif: string | undefined;
            if (!actif) {
                if (def.planMinimum) {
                    raisonInactif = `Nécessite le plan "${def.planMinimum}" ou supérieur`;
                } else if (def.featureFlag) {
                    raisonInactif = `Feature flag "${def.featureFlag}" non activé`;
                } else {
                    raisonInactif = 'Module désactivé';
                }
            }

            statuses.push({
                moduleId: def.id,
                nom: def.nom,
                actif,
                raisonInactif,
                sourceActivation,
            });
        }

        return statuses;
    }

    // =============================================
    // PREVIEW IMPACT
    // =============================================

    /**
     * Prévisualise l'impact de l'activation d'un module.
     */
    async previewActivationImpact(moduleId: string, etablissementId: string): Promise<ModuleActivationPreview | null> {
        const def = this.definitions.get(moduleId);
        if (!def) return null;

        const impact = {
            prixSupplementaire: def.prixMensuel || 0,
            quotasAjoutes: def.quotas?.map((q) => ({ type: q.type, limite: q.limite })) || [],
            modulesDebloques: [] as string[],
            modulesDesactives: [] as string[],
        };

        // Trouver les modules qui seraient débloqués
        for (const other of MODULE_DEFINITIONS) {
            if (other.dependances?.includes(moduleId)) {
                const isActif = await this.isModuleActif(other.id, etablissementId);
                if (!isActif) {
                    impact.modulesDebloques.push(other.nom);
                }
            }
        }

        return { module: def, impact };
    }

    // =============================================
    // CONFIGURATION MODULE
    // =============================================

    /**
     * Récupère la configuration spécifique d'un module pour un établissement.
     */
    async getModuleConfig(moduleId: string, etablissementId: string): Promise<Record<string, any>> {
        const config = await this.configModuleRepo.findOne({
            where: { moduleNom: moduleId, etablissementId } as any,
        });

        return config?.parametres || {};
    }

    /**
     * Met à jour la configuration d'un module pour un établissement.
     */
    async setModuleConfig(moduleId: string, etablissementId: string, parametres: Record<string, any>): Promise<void> {
        let config = await this.configModuleRepo.findOne({
            where: { moduleNom: moduleId, etablissementId } as any,
        });

        if (config) {
            config.parametres = { ...config.parametres, ...parametres };
        } else {
            config = this.configModuleRepo.create({
                moduleNom: moduleId,
                etablissementId,
                parametres,
                champsPersonnalises: [],
                widgets: [],
            });
        }

        await this.configModuleRepo.save(config);
        logger.info(`[ModuleRegistry] Config module "${moduleId}" mise à jour pour ${etablissementId}`);
    }
}

export const moduleRegistry = new ModuleRegistryService();
export default ModuleRegistryService;
