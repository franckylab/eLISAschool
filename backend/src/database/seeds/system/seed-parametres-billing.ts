/**
 * ==================================
 * eLISAschool - Seed Paramètres Billing
 * ==================================
 * Version: 3.0.0
 *
 * Paramètres système pour le module billing/entitlements v3.
 * Utilisés par etablissement.service.ts (onboarding),
 * facturation.service.ts, et le panel admin.
 *
 * Idempotent : upsert par clé unique.
 */

import { AppDataSource } from '../../data-source';
import { ParametreSysteme, TypeValeurParametre, CategorieParametre } from '@modules/configuration/entities/parametre-systeme.entity';
import { logger } from '@common/utils/logger.util';

interface ParametreSeed {
    cle: string;
    valeur: string;
    typeValeur: TypeValeurParametre;
    description: string;
    visible: boolean;
}

function mapType(t: string): TypeValeurParametre {
    switch (t) {
        case 'NUMBER': return TypeValeurParametre.NUMBER;
        case 'BOOLEAN': return TypeValeurParametre.BOOLEAN;
        case 'JSON': return TypeValeurParametre.JSON;
        case 'ENUM': return TypeValeurParametre.STRING; // enum stocké comme STRING
        default: return TypeValeurParametre.STRING;
    }
}

const PARAMETRES_BILLING: ParametreSeed[] = [
    // ─── Onboarding ───
    { cle: 'billing.onboarding_mode', valeur: 'CHOIX_PLAN', typeValeur: mapType('ENUM'), description: 'Mode onboarding (CHOIX_PLAN, PLAN_DEFAUT, ESSAI_AUTO)', visible: true },
    { cle: 'billing.plan_par_defaut', valeur: 'decouverte', typeValeur: mapType('STRING'), description: 'Slug du plan attribué par défaut (onboarding mode PLAN_DEFAUT)', visible: true },

    // ─── Essai ───
    { cle: 'billing.essai.duree_jours', valeur: '14', typeValeur: mapType('NUMBER'), description: 'Durée période d\'essai en jours (défaut 14)', visible: true },
    { cle: 'billing.essai.modules_complets', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Essai donne accès à tous les modules PAYANT du plan choisi', visible: true },
    { cle: 'billing.essai.cb_avant_paiement', valeur: 'false', typeValeur: mapType('BOOLEAN'), description: 'Carte bancaire requise avant essai', visible: true },

    // ─── Facturation ───
    { cle: 'billing.tva_pct', valeur: '19.25', typeValeur: mapType('NUMBER'), description: 'TVA applicable sur abonnements (%)', visible: true },
    { cle: 'billing.devise', valeur: 'FCFA', typeValeur: mapType('STRING'), description: 'Devise de facturation', visible: true },
    { cle: 'billing.numerotation_prefix', valeur: 'FAC-OHADA', typeValeur: mapType('STRING'), description: 'Préfixe numérotation factures (OHADA)', visible: true },
    { cle: 'billing.cycle_par_defaut', valeur: 'MENSUEL', typeValeur: mapType('ENUM'), description: 'Cycle de facturation par défaut (MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL)', visible: true },

    // ─── Expiration & dégradation ───
    { cle: 'billing.expiration.strategie_defaut', valeur: 'standard', typeValeur: mapType('STRING'), description: 'Slug stratégie expiration par défaut', visible: true },
    { cle: 'billing.expiration.jours_grace', valeur: '3', typeValeur: mapType('NUMBER'), description: 'Jours de grâce après expiration avant dégradation', visible: true },

    // ─── Alertes quota ───
    { cle: 'billing.alerte_quota.seuils', valeur: '[80, 90, 100]', typeValeur: mapType('JSON'), description: 'Seuils alertes quota (%) — notification à chaque palier', visible: true },
    { cle: 'billing.alerte_quota.notification_actif', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Notifications alertes quota activées', visible: true },

    // ─── Dunning (relances paiement) ───
    { cle: 'billing.dunning.max_relances', valeur: '4', typeValeur: mapType('NUMBER'), description: 'Nombre maximum de relances avant suspension', visible: true },
    { cle: 'billing.dunning.intervalle_jours', valeur: '3', typeValeur: mapType('NUMBER'), description: 'Intervalle entre relances (jours)', visible: true },
    { cle: 'billing.dunning.suspension_auto', valeur: 'true', typeValeur: mapType('BOOLEAN'), description: 'Suspension automatique après max relances', visible: true },
];

export async function seedParametresBilling(): Promise<{ created: number; updated: number }> {
    const paramRepo = AppDataSource.getRepository(ParametreSysteme);

    logger.info('[Seed] Insertion des paramètres billing v3...');

    let created = 0;
    let updated = 0;

    for (const param of PARAMETRES_BILLING) {
        const existing = await paramRepo.findOne({
            where: { cle: param.cle },
        });

        if (existing) {
            await paramRepo.update(existing.id, {
                valeur: param.valeur,
                typeValeur: param.typeValeur,
                description: param.description,
                visible: param.visible,
            });
            updated++;
        } else {
            await paramRepo.save(paramRepo.create({
                cle: param.cle,
                valeur: param.valeur,
                typeValeur: param.typeValeur,
                description: param.description,
                visible: param.visible,
                module: 'billing',
                categorie: CategorieParametre.MODULE,
                modifiableRuntime: true,
            }));
            created++;
        }
    }

    logger.info(`[Seed] ✅ Paramètres billing: ${created} nouveaux, ${updated} mis à jour (${PARAMETRES_BILLING.length} total)`);
    return { created, updated };
}
