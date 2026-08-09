/**
 * ==========================================
 * eLISAschool - Seed : Catalogue modules unifié (Lot A — v7)
 * ==========================================
 *
 * Peuple `modules_catalogue` depuis MODULE_REGISTRY (shared) —
 * la source de vérité unique du catalogue.
 *
 * Classement commercial déterministe :
 *   - CRITIQUE : fonctions de base (jamais facturées, actives par défaut)
 *   - PREMIUM  : modules premium du registre (inclus dans les plans payants)
 *   - ADDON    : modules souscriptibles séparément (facturés en supplément)
 *
 * Idempotent : upsert par `code`. estSysteme=true (protégés, non supprimables).
 *
 * Phase 7 — Lot A (Refonte SaaS v7)
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { MODULE_REGISTRY, ModuleConfig } from '@shared/config/config.registry';
import { ModuleName } from '@shared/enums/modules.enum';
import { ModuleCatalogue, CategorieModule } from '@modules/billing/entities/module-catalogue.entity';
import { logger } from '@common/utils/logger.util';

/** Modules critiques — toujours disponibles, actifs par défaut, jamais facturés */
const MODULES_CRITIQUES: ModuleName[] = [
    ModuleName.AUTH,
    ModuleName.UTILISATEURS,
    ModuleName.CONFIGURATION,
    ModuleName.NOTIFICATIONS,
    ModuleName.NOTES,
    ModuleName.PERIODES,
    ModuleName.ELEVES,
    ModuleName.RESPONSABLES_ELEVES,
    ModuleName.PROGRAMMES,
    ModuleName.EMPLOI_DU_TEMPS,
    ModuleName.SUIVI_ELEVES,
    ModuleName.SUIVI_PERSONNEL,
    ModuleName.ORGANISATION,
    ModuleName.POSTES,
    ModuleName.SALLES,
    ModuleName.OPTIONS,
    ModuleName.PERSONNEL,
    ModuleName.CONTRATS,
    ModuleName.PAIE,
    ModuleName.DASHBOARD,
];

/** Prix mensuels des modules facturables (XAF entiers) ; annuel = mensuel × 10 */
const PRIX_MODULES: Record<string, { mensuel: number; planMinimal?: string }> = {
    bulletins: { mensuel: 5000 },
    orientation: { mensuel: 5000 },
    finances: { mensuel: 10000, planMinimal: 'pro' },
    gamification: { mensuel: 3000 },
    scoring: { mensuel: 5000 },
    peripheriques: { mensuel: 2000 },
    messagerie: { mensuel: 2000 },
    requetes: { mensuel: 2000 },
    sondages: { mensuel: 2000 },
    annonces: { mensuel: 1500 },
    cantine: { mensuel: 8000 },
    transport: { mensuel: 10000 },
    parking: { mensuel: 5000 },
    materiel: { mensuel: 5000 },
    clubs: { mensuel: 3000 },
    cartes: { mensuel: 3000 },
    documents: { mensuel: 3000 },
    impressions: { mensuel: 2000 },
    sante: { mensuel: 5000 },
    monitoring: { mensuel: 5000 },
    recrutement: { mensuel: 8000 },
};

function categoriePour(code: ModuleName): CategorieModule {
    if (MODULES_CRITIQUES.includes(code)) return CategorieModule.CRITIQUE;
    const cfg = MODULE_REGISTRY[code];
    if (cfg?.premium) return CategorieModule.PREMIUM;
    return CategorieModule.ADDON;
}

export async function seedModulesCatalogue(force: boolean = false): Promise<number> {
    const repo = AppDataSource.getRepository(ModuleCatalogue);
    let creees = 0;
    let misesAJour = 0;

    const entrees = Object.entries(MODULE_REGISTRY) as [ModuleName, ModuleConfig][];

    for (const [code, cfg] of entrees) {
        const categorie = categoriePour(code);
        const prix = PRIX_MODULES[code];

        const donnees = {
            code,
            nom: cfg.label,
            nomEn: cfg.label,
            description: cfg.description,
            categorie,
            icone: cfg.icon,
            prixMensuel: prix?.mensuel ?? 0,
            prixAnnuel: prix ? prix.mensuel * 10 : 0,
            estFacturable: categorie !== CategorieModule.CRITIQUE,
            estSouscriptible: categorie !== CategorieModule.CRITIQUE,
            actifParDefaut: categorie === CategorieModule.CRITIQUE,
            planMinimal: prix?.planMinimal,
            dependencies: cfg.dependencies as string[],
            permissionsRequises: cfg.permissions as string[],
            config: cfg.defaultSettings ?? {},
            ordre: entrees.findIndex(([c]) => c === code),
            estSysteme: true,
            estActif: true,
        };

        const existante = await repo.findOne({ where: { code } });

        if (existante) {
            if (force || !existante.estActif) {
                Object.assign(existante, donnees);
                await repo.save(existante);
                misesAJour++;
            }
        } else {
            await repo.save(repo.create(donnees));
            creees++;
        }
    }

    logger.info(
        `🌱 Catalogue modules : ${creees} créées, ${misesAJour} mises à jour (total ${entrees.length})`
    );
    return entrees.length;
}

export default seedModulesCatalogue;