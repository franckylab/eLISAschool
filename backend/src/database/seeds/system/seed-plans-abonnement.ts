/**
 * ==========================================
 * eLISAschool - Seed : Plans d'abonnement v3.4 (migration 213)
 * ==========================================
 *
 * Seed idempotent des 3 plans plateforme pilotés par JSONB :
 * decouverte (14 900 F), standard (39 900 F), premium (59 900 F).
 *
 * Architecture tarifaire v3.4 :
 *   - Découverte : 14 900 F/mois, 100 élèves inclus, 8 modules cœur
 *   - Standard   : 39 900 F/mois, 300 élèves inclus, 14 modules (RECOMMANDÉ)
 *   - Premium    : 59 900 F/mois, élèves illimités, tous modules + API + SSO
 *
 * Formule v3 : prixBase + max(0, nbÉlèves − franchise) × prixParEleve
 * Quotas : 0 = illimité
 *
 * Idempotence : création uniquement si le slug est absent — les plans
 * restent éditables en profondeur depuis l'espace plateforme.
 *
 * Version: 3.4.0
 * Auteur: franck arlos chendjou
 * ==========================================
 */

import { AppDataSource } from '@database/data-source';
import { PlanAbonnement, StatutPlan } from '@modules/billing/entities/plan-abonnement.entity';
import { logger } from '@common/utils/logger.util';

/** 8 modules cœur du plan Découverte */
const MODULES_DECOUVERTE = [
    'eleves', 'classes', 'notes', 'bulletins',
    'annees-scolaires', 'messagerie', 'emploi-du-temps', 'personnel',
];

/** 14 modules du plan Standard (cœur + gestion avancée) */
const MODULES_STANDARD = [
    ...MODULES_DECOUVERTE,
    'orientation', 'cantine', 'transport', 'comptabilite',
    'bibliotheque', 'gamification',
];

/** Premium = tous les modules disponibles */
const MODULES_PREMIUM = [
    ...MODULES_STANDARD,
    'clubs', 'cartes', 'scoring',
];

/**
 * Définition des 3 plans v3.4 — toutes dimensions en JSONB.
 * 0 = illimité dans le bloc quotas.
 */
const PLANS_V34 = [
    {
        nom: 'Découverte',
        slug: 'decouverte',
        description: 'L\'essentiel pour digitaliser votre établissement — idéal pour démarrer',
        prixBase: 14900,
        rang: 0,
        estParDefaut: false,
        visiblePubliquement: true,
        badge: undefined as string | undefined,
        tarification: { prixBase: 14900, prixParEleve: 100, elevesInclusGratuits: 100 },
        quotas: { eleves: 100, utilisateurs: 10, classes: 8, stockageGo: 10, sms: 200 },
        entitlements: {
            modules: MODULES_DECOUVERTE,
            fonctionnalites: ['export_pdf'],
        },
        cyclesAutorises: ['MENSUEL', 'TRIMESTRIEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 14, quotasReduits: false },
        ordre: 1,
    },
    {
        nom: 'Standard',
        slug: 'standard',
        description: 'La suite complète pour les établissements en croissance — 300 élèves inclus',
        prixBase: 39900,
        rang: 1,
        estParDefaut: true,
        visiblePubliquement: true,
        badge: 'RECOMMANDÉ',
        tarification: { prixBase: 39900, prixParEleve: 80, elevesInclusGratuits: 300 },
        quotas: { eleves: 500, utilisateurs: 30, classes: 25, stockageGo: 50, sms: 1000 },
        entitlements: {
            modules: MODULES_STANDARD,
            fonctionnalites: ['export_pdf', 'backup_auto', 'api_rest'],
        },
        cyclesAutorises: ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 14, quotasReduits: false },
        ordre: 2,
    },
    {
        nom: 'Premium',
        slug: 'premium',
        description: 'Performance maximale — élèves illimités, tous modules, API & SSO',
        prixBase: 59900,
        rang: 2,
        estParDefaut: false,
        visiblePubliquement: true,
        badge: 'MEILLEUR CHOIX',
        tarification: {
            prixBase: 59900, prixParEleve: 50, elevesInclusGratuits: 0,
            paliers: [
                { seuilEleves: 500, prixParEleve: 40 },
                { seuilEleves: 1000, prixParEleve: 30 },
            ],
        },
        quotas: { eleves: 0, utilisateurs: 0, classes: 0, stockageGo: 0, sms: 0 },
        entitlements: {
            modules: MODULES_PREMIUM,
            fonctionnalites: [
                'export_pdf', 'backup_auto', 'api_rest', 'webhooks',
                'monitoring_advanced', 'multi_etablissement', 'sso',
            ],
        },
        cyclesAutorises: ['MENSUEL', 'TRIMESTRIEL', 'SEMESTRIEL', 'ANNUEL'],
        essai: { autorise: true, dureeJours: 30, quotasReduits: false },
        ordre: 3,
    },
];

/**
 * Seed idempotent des 3 plans v3.4.
 * @returns { created, skipped }
 */
export async function seedPlansAbonnement(): Promise<{ created: number; skipped: number }> {
    const repo = AppDataSource.getRepository(PlanAbonnement);
    let created = 0;
    let skipped = 0;

    for (const plan of PLANS_V34) {
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

    logger.info(`📦 Seed plans abonnement v3.4 : ${created} créés, ${skipped} ignorés (déjà existants)`);
    return { created, skipped };
}

export default seedPlansAbonnement;
