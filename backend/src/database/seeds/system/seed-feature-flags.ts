/**
 * ==========================================
 * eLISAschool - Seed : Feature Flag Definitions (migration 210)
 * ==========================================
 *
 * Seed idempotent des 8 feature flags système transverses.
 * ON CONFLICT (cle) DO NOTHING pour re-exécution sûre.
 *
 * Refonte Feature Flags — Registre centralisé (migration 210)
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { FeatureFlagDefinition, CategorieFlag, TypeFlag } from '@modules/billing/entities/feature-flag-definition.entity';
import { logger } from '@common/utils/logger.util';

/**
 * 8 flags système transverses seedés par défaut.
 *(est_systeme=true → non supprimables via l'API)
 */
const SYSTEM_FLAGS = [
    {
        cle: 'multi_etablissement',
        label: 'Multi-établissement',
        description: 'Permet la gestion de plusieurs établissements depuis un compte administrateur',
        categorie: CategorieFlag.GENERAL,
        type: TypeFlag.PERMISSION,
        valeurDefaut: false,
        planMinimal: 'pro',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'export_pdf',
        label: 'Export PDF',
        description: 'Active la génération de PDF pour les bulletins, factures, rapports et certificats',
        categorie: CategorieFlag.GENERAL,
        type: TypeFlag.RELEASE,
        valeurDefaut: false,
        planMinimal: 'starter',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'api_rest',
        label: 'API REST publique',
        description: 'Expose une API publique pour les intégrations avec des systèmes tiers',
        categorie: CategorieFlag.INTEGRATION,
        type: TypeFlag.PERMISSION,
        valeurDefaut: false,
        planMinimal: 'standard',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'webhooks',
        label: 'Webhooks',
        description: 'Envoi de notifications webhook vers des systèmes externes (CRM, ERP, etc.)',
        categorie: CategorieFlag.INTEGRATION,
        type: TypeFlag.PERMISSION,
        valeurDefaut: false,
        planMinimal: 'pro',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'sso',
        label: 'Single Sign-On',
        description: 'Authentification unifiée via Google Workspace, Microsoft Azure AD ou SAML',
        categorie: CategorieFlag.SECURITY,
        type: TypeFlag.PERMISSION,
        valeurDefaut: false,
        planMinimal: 'enterprise',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'backup_auto',
        label: 'Backup automatique',
        description: 'Sauvegardes automatiques planifiées quotidiennement avec rétention configurable',
        categorie: CategorieFlag.SECURITY,
        type: TypeFlag.RELEASE,
        valeurDefaut: false,
        planMinimal: 'standard',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'white_label',
        label: 'White Label',
        description: 'Personnalisation complète de la marque : domaine personnalisé, logo, couleurs',
        categorie: CategorieFlag.UX,
        type: TypeFlag.PERMISSION,
        valeurDefaut: false,
        planMinimal: 'enterprise',
        rolloutPercentage: 100,
        estSysteme: true,
    },
    {
        cle: 'monitoring_advanced',
        label: 'Monitoring avancé',
        description: 'Métriques détaillées, alertes personnalisées et tableaux de bord temps réel',
        categorie: CategorieFlag.GENERAL,
        type: TypeFlag.RELEASE,
        valeurDefaut: false,
        planMinimal: 'pro',
        rolloutPercentage: 100,
        estSysteme: true,
    },
];

export async function seedFeatureFlags(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(FeatureFlagDefinition);
    let created = 0;
    let skipped = 0;

    for (const flag of SYSTEM_FLAGS) {
        const existing = await repo.findOne({ where: { cle: flag.cle } });
        if (existing) {
            skipped++;
            continue;
        }

        const definition = repo.create({
            ...flag,
            segments: [],
            estActif: true,
        });
        await repo.save(definition);
        created++;
    }

    logger.info(`🚩 Seed feature flags : ${created} créés, ${skipped} ignorés (déjà existants)`);
    return { created, skipped };
}
