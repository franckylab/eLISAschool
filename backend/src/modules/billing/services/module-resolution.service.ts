/**
 * ==================================
 * eLISAschool - Service ModuleResolution v2
 * ==================================
 *
 * Résolution des modules pour un tenant à partir du catalogue unique
 * (modules_catalogue) — source de vérité (Lot A — Refonte SaaS v7).
 *
 * Cascade de résolution (actif) :
 *   1. Catalogue (modules_catalogue.actifParDefaut) → base
 *   2. Plan (PlanAbonnement.modulesInclus, par code) → activation
 *   3. AbonnementModule (suppléments souscrits, slug = code) → activation
 *   4. Désactivation explicite (ParametreSysteme modules.{code}.actif=false)
 *      gérée par configurationService.isModuleActive (non dupliquée ici)
 *
 * Cache mémoire TTL 5 min par établissement (pattern FeatureFlagService).
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { AbonnementModule } from '../entities/abonnement-module.entity';
import { ModuleOptionnel } from '../entities/module-optionnel.entity';
import { ModuleCatalogue, CategorieModule } from '../entities/module-catalogue.entity';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';

export type SourceModule = 'catalogue' | 'plan' | 'groupe' | 'supplement';

export interface ModuleResolu {
    id: string;
    code: string;
    nom: string;
    nomEn?: string;
    description?: string;
    categorie: CategorieModule;
    icone: string;
    prixMensuel: number;
    prixAnnuel: number;
    estFacturable: boolean;
    estSouscriptible: boolean;
    actifParDefaut: boolean;
    planMinimal?: string;
    dependencies: string[];
    ordre: number;
    estActif: boolean;
    /** État résolu pour l'établissement */
    actif: boolean;
    /** Origine de l'activation (catalogue par défaut / plan / supplément) */
    source: SourceModule;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

interface CacheEntree {
    valeur: ModuleResolu[];
    expiry: number;
}

export class ModuleResolutionService {
    private catalogueRepo: Repository<ModuleCatalogue>;
    private abonnementRepo: Repository<AbonnementClient>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private moduleOptionnelRepo: Repository<ModuleOptionnel>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private groupeLienRepo: Repository<GroupeEtablissementLien>;

    /** Cache in-memory : etablissementId → { modules, expiry } */
    private cache = new Map<string, CacheEntree>();

    constructor() {
        this.catalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.moduleOptionnelRepo = AppDataSource.getRepository(ModuleOptionnel);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
    }

    /** Invalidation du cache d'un établissement (ou de tous) */
    invalidate(etablissementId?: string): void {
        if (etablissementId) {
            this.cache.delete(etablissementId);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Catalogue complet (plateforme) — tous les modules, sans résolution tenant.
     */
    async getCatalogue(): Promise<ModuleCatalogue[]> {
        return this.catalogueRepo.find({
            where: { estActif: true },
            order: { ordre: 'ASC' },
        });
    }

    /**
     * Résout tous les modules d'un établissement avec état actif + source.
     * Cascade : catalogue → plan → supplément.
     */
    async getResolvedModules(etablissementId: string): Promise<ModuleResolu[]> {
        const c = this.cache.get(etablissementId);
        if (c && Date.now() < c.expiry) return c.valeur;

        const modules = await this.resoudre(etablissementId);

        this.cache.set(etablissementId, {
            valeur: modules,
            expiry: Date.now() + CACHE_TTL_MS,
        });
        return modules;
    }

    private async resoudre(etablissementId: string): Promise<ModuleResolu[]> {
        // Résolution du groupe éventuel pour cet établissement
        const groupeLien = await this.groupeLienRepo.findOne({
            where: { etablissementId },
        });
        const groupeId = groupeLien?.groupeId;

        const [catalogue, abonnement, supplements, modulesGroupe] = await Promise.all([
            this.catalogueRepo.find({
                where: { estActif: true },
                order: { ordre: 'ASC' },
            }),
            this.abonnementRepo.findOne({
                where: { etablissementId, statut: StatutAbonnement.ACTIF },
                relations: ['plan'],
            }),
            this.abonnementModuleRepo.find({
                where: { actif: true },
                relations: ['moduleOptionnel'],
            }),
            // Override groupe (Lot C v7)
            groupeId
                ? this.modulesGroupeRepo.find({ where: { groupeEtablissementId: groupeId } })
                : Promise.resolve([]),
        ]);

        const planInclus = new Set<string>();
        if (abonnement?.plan?.modulesInclus) {
            for (const slug of abonnement.plan.modulesInclus) planInclus.add(slug);
        }
        const supplementsSouscrits = new Set<string>();
        for (const am of supplements) {
            const slug = am.moduleOptionnel?.slug;
            if (slug) supplementsSouscrits.add(slug);
        }

        // Override groupe : code → actif (force activation/désactivation)
        const groupeOverrides = new Map<string, boolean>();
        for (const mg of modulesGroupe) {
            const code = mg.module?.code;
            if (code) groupeOverrides.set(code, mg.actif);
        }

        return catalogue.map((m): ModuleResolu => {
            let actif = m.actifParDefaut;
            let source: SourceModule = 'catalogue';

            // 1. Plan
            if (planInclus.has(m.code)) {
                actif = true;
                source = 'plan';
            }

            // 2. Override groupe (Lot C v7) — entre plan et supplément
            if (groupeOverrides.has(m.code)) {
                actif = groupeOverrides.get(m.code)!;
                source = 'groupe';
            }

            // 3. Supplément souscrit (force activation)
            if (supplementsSouscrits.has(m.code)) {
                actif = true;
                source = 'supplement';
            }

            return {
                id: m.id,
                code: m.code,
                nom: m.nom,
                nomEn: m.nomEn,
                description: m.description,
                categorie: m.categorie,
                icone: m.icone,
                prixMensuel: m.prixMensuel,
                prixAnnuel: m.prixAnnuel,
                estFacturable: m.estFacturable,
                estSouscriptible: m.estSouscriptible,
                actifParDefaut: m.actifParDefaut,
                planMinimal: m.planMinimal,
                dependencies: m.dependencies,
                ordre: m.ordre,
                estActif: m.estActif,
                actif,
                source,
            };
        });
    }

    /**
     * Vérifie si un module est activé pour un établissement.
     */
    async isModuleActive(etablissementId: string, code: string): Promise<boolean> {
        const modules = await this.getResolvedModules(etablissementId);
        return modules.some((m) => m.code === code && m.actif);
    }

    /**
     * Vérifie si un module est facturable (PREMIUM/ADDON) pour le gating premium.
     */
    async isModuleFacturable(code: string): Promise<boolean> {
        const entree = await this.catalogueRepo.findOne({ where: { code, estActif: true } });
        return entree?.estFacturable ?? false;
    }

    /**
     * Vérifie si un module est souscrit par le plan ou en supplément.
     * (source !== 'catalogue' → activation réellement payée/comptée)
     */
    async isModuleSouscrit(etablissementId: string, code: string): Promise<boolean> {
        const modules = await this.getResolvedModules(etablissementId);
        return modules.some((m) => m.code === code && m.actif && m.source !== 'catalogue');
    }
}

export default ModuleResolutionService;

/** Singleton partagé (pattern quotaService / dunningService) */
export const moduleResolutionService = new ModuleResolutionService();