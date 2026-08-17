/**
 * ==========================================
 * eLISAschool - Seed : Plans d'abonnement v3 (migration 213)
 * ==========================================
 *
 * Seed idempotent des 5 plans plateforme pilotés par JSONB :
 * decouverte, starter, standard (par défaut), pro, enterprise.
 *
 * Valeurs issues du rapport v3 (§5.3) :
 *   - Découverte : GRATUIT, 0 FCFA/mois, 50 élèves inclus, 6 modules cœur
 *   - Standard   : 25 000 FCFA/mois + 150 F/élève > 200 (RECOMMANDÉ)
 *   - Enterprise : sur devis, visiblePubliquement=false, cycle annuel uniquement
 *
 * Idempotence : création uniquement si le slug est absent — les plans
 * restent éditables en profondeur depuis l'espace plateforme (EX-2).
 *
 * Version: 3.0.0
 * Auteur: franck arlos chendjou
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { PlanAbonnement, StatutPlan } from '@modules/billing/entities/plan-abonnement.entity';
import { logger } from '@common/utils/logger.util';

/** 6 modules cœur du plan Découverte (aligné migration 213) */
const MODULES_DECOUVERTE = ['eleves', 'classes', 'notes', 'bulletins', 'annees-scolaires', 'messagerie'];

/** Modules supplémentaires Starter */
const MODULES_STARTER = [...MODULES_DECOUVERTE, 'emploi-du-temps', 'personnel'];

/** 16 modules du plan Standard (rapport §5.3) */
const MODULES_STANDARD = [
    ...MODULES_STARTER,
    'orientation', 'cantine', 'transport', 'comptabilite',
    'clubs', 'gamification', 'bibliotheque', 'cartes',
];

/** Pro = Standard + scoring */
const MODULES_PRO = [...MODULES_STANDARD, 'scoring'];

/**
 * Définition des 5 plans v3 — toutes dimensions en JSONB.
 * 0 = illimité dans le bloc quotas.
 */
const PLANS_V3 = [
    {
        nom: 'Découverte',
        slug: 'decouverte',
        description: 'Plan gratuit de repli — pour démarrer avec eLISAschool sans engagement',
        prixBase: 0,
        rang: 0,
        estParDefaut: false,
        visiblePubliquement: true,
        badge: undefined as string | undefined,
        tarification: { prixBase: 0, prixParEleve: 0, elevesInclusGratuits: 50 },
        quotas: { eleves: 50, utilisateurs: 5, classes: 3, stockageGo: 5, sms: 100 },
        entitlements: { modules: MODULES_DECOUVERTE, fonctionnalites: ['export_pdf'] },
        cyclesAutorises: ['MENSUEL'],
        essai: { autorise: false },
        ordre: 1,
    },
    {
        nom: 'Starter',
        slug: 'starter',
        description: 'Pour les petits établissements qui démarrent la digitalisation',
        prixBase: 15000,
        rang: 1,
        estParDefaut: false,
        visiblePubliquement: true,
        badge: undefined as string | undefined,
        tarification: { prixBase: 15000, prixParEleve: 100, elevesInclusGratuits: 100 },
        quotas: { eleves: 200, utilisateurs: 15, classes: 10, stockageGo: 20, sms: 500 },
        entitlements: { modules: MODULES_STARTER, fonctionnalites: ['export_pdf'] },
        cyclesAutorises: ['MENSUEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 14, quotasReduits: false },
        ordre: 2,
    },
    {
        nom: 'Standard',
        slug: 'standard',
        description: 'Le plan complet pour établissements en croissance — 200 élèves inclus',
        prixBase: 25000,
        rang: 2,
        estParDefaut: true,
        visiblePubliquement: true,
        badge: 'RECOMMANDÉ',
        tarification: { prixBase: 25000, prixParEleve: 150, elevesInclusGratuits: 200 },
        quotas: { eleves: 500, utilisateurs: 30, classes: 25, stockageGo: 50, sms: 1000 },
        entitlements: { modules: MODULES_STANDARD, fonctionnalites: ['export_pdf', 'backup_auto', 'api_rest'] },
        cyclesAutorises: ['MENSUEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 14, quotasReduits: false },
        ordre: 3,
    },
    {
        nom: 'Pro',
        slug: 'pro',
        description: 'Pour les grands établissements multi-sites exigeants',
        prixBase: 60000,
        rang: 3,
        estParDefaut: false,
        visiblePubliquement: true,
        badge: undefined as string | undefined,
        tarification: {
            prixBase: 60000, prixParEleve: 120, elevesInclusGratuits: 400,
            paliers: [{ seuilEleves: 1000, prixParEleve: 100 }],
        },
        quotas: { eleves: 1500, utilisateurs: 75, classes: 60, stockageGo: 200, sms: 3000 },
        entitlements: {
            modules: MODULES_PRO,
            fonctionnalites: ['export_pdf', 'backup_auto', 'api_rest', 'webhooks', 'monitoring_advanced', 'multi_etablissement'],
        },
        cyclesAutorises: ['MENSUEL', 'TRIMESTRIEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 30, quotasReduits: false },
        ordre: 4,
    },
    {
        nom: 'Enterprise',
        slug: 'enterprise',
        description: 'Sur devis — franchise négociée, SSO, white label, API SLA + remises contrat',
        prixBase: 150000,
        rang: 4,
        estParDefaut: false,
        visiblePubliquement: false,
        badge: undefined as string | undefined,
        // 0 = illimité (franchise négociée au contrat)
        tarification: { prixBase: 150000, prixParEleve: 0, elevesInclusGratuits: 0 },
        quotas: { eleves: 0, utilisateurs: 0, classes: 0, stockageGo: 0, sms: 0 },
        entitlements: {
            modules: MODULES_PRO,
            fonctionnalites: [
                'export_pdf', 'backup_auto', 'api_rest', 'webhooks',
                'monitoring_advanced', 'multi_etablissement', 'sso', 'white_label',
            ],
        },
        cyclesAutorises: ['ANNUEL'],
        essai: { autorise: false },
        ordre: 5,
    },
];

/**
 * Seed idempotent des 5 plans v3.
 * @returns { created, skipped }
 */
export async function seedPlansAbonnement(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(PlanAbonnement);
    let created = 0;
    let skipped = 0;

    for (const plan of PLANS_V3) {
        const existing = await repo.findOne({ where: { slug: plan.slug } });
        if (existing) {
            skipped++;
            continue;
        }

        const entity = repo.create({
            nom: plan.nom,
            slug: plan.slug,
            description: plan.description,
            prixBase: plan.prixBase,
            devise: 'XAF',
            rang: plan.rang,
            estParDefaut: plan.estParDefaut,
            visiblePubliquement: plan.visiblePubliquement,
            badge: plan.badge,
            tarification: plan.tarification,
            quotas: plan.quotas,
            entitlements: plan.entitlements,
            cyclesAutorises: plan.cyclesAutorises,
            essai: plan.essai,
            statut: StatutPlan.ACTIF,
            visible: true,
            ordre: plan.ordre,
            actif: true,
        });
        await repo.save(entity);
        created++;
    }

    // Garantir un plan par défaut (invariant EX-11)
    const defaut = await repo.findOne({ where: { estParDefaut: true } });
    if (!defaut) {
        await repo.update({ slug: 'standard' }, { estParDefaut: true });
        logger.warn('📦 Aucun plan par défaut — "standard" marqué estParDefaut');
    }

    logger.info(`📦 Seed plans abonnement v3 : ${created} créés, ${skipped} ignorés (déjà existants)`);
    return { created, skipped };
}

export default seedPlansAbonnement;
