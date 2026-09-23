/**
 * ==================================
 * eLISAschool - Service Barème Groupe (source unique)
 * ==================================
 *
 * Résolution centralisée des paramètres financiers groupes :
 *   - `billing.remise_groupe.paliers`  : barème dégressivité [{minMembres, remisePct}]
 *   - `billing.plafond_plan`           : plafond phase PLAN (%, défaut 40)
 *   - `billing.plafond_groupe`         : plafond phase GROUPE (%, défaut 40)
 *
 * Cascade SANS doublon : override groupe (`groupeEtablissementId`) → global → défaut codé.
 * Toute lecture billing (facturation, promotions, stats, UI) passe par ce service.
 * En cas de valeur absente/corrompue : défaut codé + log d'alerte, jamais de crash.
 */

import { configurationService } from '@modules/configuration/services/configuration.service';
import { logger } from '@common/utils/logger.util';

export interface PalierRemiseGroupe {
    minMembres: number;
    remisePct: number;
}

export type SourceValeur = 'groupe' | 'global' | 'defaut';

export const CLE_PALIERS_GROUPE = 'billing.remise_groupe.paliers';
export const CLE_PLAFOND_PLAN = 'billing.plafond_plan';
export const CLE_PLAFOND_GROUPE = 'billing.plafond_groupe';

/** Barème par défaut (identique au seed) — utilisé si paramètre absent/corrompu. */
export const DEFAUT_PALIERS_GROUPE: PalierRemiseGroupe[] = [
    { minMembres: 2, remisePct: 5 },
    { minMembres: 4, remisePct: 10 },
    { minMembres: 6, remisePct: 15 },
    { minMembres: 11, remisePct: 20 },
    { minMembres: 21, remisePct: 25 },
];

/** Plafond par défaut des phases PLAN et GROUPE (%). */
export const DEFAUT_PLAFOND_POURCENT = 40;

function paliersValides(paliers: unknown): paliers is PalierRemiseGroupe[] {
    if (!Array.isArray(paliers) || paliers.length === 0) return false;
    const mins = new Set<number>();
    for (const p of paliers) {
        if (typeof p !== 'object' || p === null) return false;
        const min = Number((p as Record<string, unknown>).minMembres);
        const remise = Number((p as Record<string, unknown>).remisePct);
        if (!Number.isInteger(min) || min < 2) return false;
        if (!Number.isFinite(remise) || remise < 0 || remise > 100) return false;
        if (mins.has(min)) return false;
        mins.add(min);
    }
    return true;
}

function plafondValide(valeur: unknown): valeur is number {
    return typeof valeur === 'number' && Number.isFinite(valeur) && valeur >= 0 && valeur <= 100;
}

class BaremeGroupeService {
    /**
     * Taux de dégressivité pour N membres selon un barème (fonction pure partagée).
     * Dernier palier dont minMembres <= N, sinon 0.
     */
    static tauxPour(paliers: PalierRemiseGroupe[], nombreMembres: number): number {
        let taux = 0;
        for (const palier of [...paliers].sort((a, b) => a.minMembres - b.minMembres)) {
            if (nombreMembres >= palier.minMembres) taux = palier.remisePct;
        }
        return taux;
    }

    /** Paliers effectifs : override groupe → global → défaut. */
    async getPaliersEffectifs(groupeId?: string): Promise<{ paliers: PalierRemiseGroupe[]; source: SourceValeur }> {
        if (groupeId) {
            try {
                const override = await configurationService.getParametreGroupe<unknown>(CLE_PALIERS_GROUPE, groupeId);
                if (override !== null && paliersValides(override)) {
                    return { paliers: override, source: 'groupe' };
                }
                if (override !== null) {
                    logger.warn(`[BaremeGroupe] Override paliers invalide pour le groupe ${groupeId} — fallback global`);
                }
            } catch (error) {
                logger.warn(`[BaremeGroupe] Lecture override paliers impossible (${groupeId}) : ${error}`);
            }
        }
        try {
            const global = await configurationService.getParametre<unknown>(CLE_PALIERS_GROUPE);
            if (global !== null && paliersValides(global)) {
                return { paliers: global, source: 'global' };
            }
            if (global !== null) {
                logger.warn('[BaremeGroupe] Paliers globaux invalides — fallback défaut codé');
            }
        } catch (error) {
            logger.warn(`[BaremeGroupe] Lecture paliers globaux impossible : ${error}`);
        }
        return { paliers: DEFAUT_PALIERS_GROUPE, source: 'defaut' };
    }

    /** Plafond PLAN effectif (global uniquement — pas de dimension plan dans la cascade). */
    async getPlafondPlan(): Promise<{ valeur: number; source: SourceValeur }> {
        try {
            const valeur = await configurationService.getParametre<unknown>(CLE_PLAFOND_PLAN);
            const nombre = typeof valeur === 'string' ? Number(valeur) : valeur;
            if (plafondValide(nombre)) return { valeur: nombre, source: 'global' };
            if (valeur !== null) logger.warn('[BaremeGroupe] Plafond PLAN invalide — fallback 40');
        } catch (error) {
            logger.warn(`[BaremeGroupe] Lecture plafond PLAN impossible : ${error}`);
        }
        return { valeur: DEFAUT_PLAFOND_POURCENT, source: 'defaut' };
    }

    /** Plafond GROUPE effectif : override groupe → global → défaut. */
    async getPlafondGroupe(groupeId?: string): Promise<{ valeur: number; source: SourceValeur }> {
        if (groupeId) {
            try {
                const override = await configurationService.getParametreGroupe<unknown>(CLE_PLAFOND_GROUPE, groupeId);
                const nombre = typeof override === 'string' ? Number(override) : override;
                if (plafondValide(nombre)) return { valeur: nombre, source: 'groupe' };
                if (override !== null) {
                    logger.warn(`[BaremeGroupe] Override plafond GROUPE invalide pour le groupe ${groupeId} — fallback global`);
                }
            } catch (error) {
                logger.warn(`[BaremeGroupe] Lecture override plafond GROUPE impossible (${groupeId}) : ${error}`);
            }
        }
        try {
            const valeur = await configurationService.getParametre<unknown>(CLE_PLAFOND_GROUPE);
            const nombre = typeof valeur === 'string' ? Number(valeur) : valeur;
            if (plafondValide(nombre)) return { valeur: nombre, source: 'global' };
            if (valeur !== null) logger.warn('[BaremeGroupe] Plafond GROUPE global invalide — fallback 40');
        } catch (error) {
            logger.warn(`[BaremeGroupe] Lecture plafond GROUPE impossible : ${error}`);
        }
        return { valeur: DEFAUT_PLAFOND_POURCENT, source: 'defaut' };
    }

    /** Configuration complète + sources (pour l'UI Barèmes : affichage + traçabilité). */
    async getConfigComplete(groupeId?: string): Promise<{
        paliers: PalierRemiseGroupe[];
        sourcePaliers: SourceValeur;
        plafondPlan: number;
        sourcePlafondPlan: SourceValeur;
        plafondGroupe: number;
        sourcePlafondGroupe: SourceValeur;
    }> {
        const [paliers, plafondPlan, plafondGroupe] = await Promise.all([
            this.getPaliersEffectifs(groupeId),
            this.getPlafondPlan(),
            this.getPlafondGroupe(groupeId),
        ]);
        return {
            paliers: paliers.paliers,
            sourcePaliers: paliers.source,
            plafondPlan: plafondPlan.valeur,
            sourcePlafondPlan: plafondPlan.source,
            plafondGroupe: plafondGroupe.valeur,
            sourcePlafondGroupe: plafondGroupe.source,
        };
    }

    /** Taux de dégressivité effectif pour un groupe (paliers effectifs + barème partagé). */
    async getTauxDegressivite(groupeId: string, nombreMembres: number): Promise<{ taux: number; source: SourceValeur }> {
        const { paliers, source } = await this.getPaliersEffectifs(groupeId);
        return { taux: BaremeGroupeService.tauxPour(paliers, nombreMembres), source };
    }

    // ─── Écriture (globale + overrides groupe) ───────────────────
    // Toute écriture passe par configurationService : validation Zod,
    // audit, event temps réel, invalidation cache. Historique dédié loggé ici.

    /** Définit les paliers globaux (tri auto + validation via setParametre). */
    async setPaliersGlobal(paliers: PalierRemiseGroupe[], utilisateurId?: string) {
        return configurationService.setParametre(CLE_PALIERS_GROUPE, paliers, undefined, utilisateurId);
    }

    /** Définit un plafond global (PLAN ou GROUPE). */
    async setPlafondGlobal(cle: typeof CLE_PLAFOND_PLAN | typeof CLE_PLAFOND_GROUPE, valeur: number, utilisateurId?: string) {
        return configurationService.setParametre(cle, valeur, undefined, utilisateurId);
    }

    /** Définit un override groupe (paliers et/ou plafond GROUPE). */
    async setOverrideGroupe(
        groupeId: string,
        valeurs: { paliers?: PalierRemiseGroupe[]; plafondGroupe?: number },
        utilisateurId?: string,
    ) {
        const resultats: Record<string, unknown> = {};
        if (valeurs.paliers !== undefined) {
            resultats.paliers = await configurationService.setParametreGroupe(CLE_PALIERS_GROUPE, valeurs.paliers, groupeId, utilisateurId);
        }
        if (valeurs.plafondGroupe !== undefined) {
            resultats.plafondGroupe = await configurationService.setParametreGroupe(CLE_PLAFOND_GROUPE, valeurs.plafondGroupe, groupeId, utilisateurId);
        }
        return resultats;
    }

    /** Supprime le(s) override(s) groupe (retour au global). */
    async resetOverrideGroupe(groupeId: string, utilisateurId?: string): Promise<string[]> {
        const supprimees: string[] = [];
        for (const cle of [CLE_PALIERS_GROUPE, CLE_PLAFOND_GROUPE]) {
            try {
                await configurationService.resetParametreGroupe(cle, groupeId, utilisateurId);
                supprimees.push(cle);
            } catch (error) {
                // Pas d'override pour cette clé : on continue (idempotent)
                if (!(error instanceof Error) || !String((error as { code?: string }).code ?? '').includes('OVERRIDE_NOT_FOUND')) {
                    throw error;
                }
            }
        }
        return supprimees;
    }
}

export const baremeGroupeService = new BaremeGroupeService();
export { BaremeGroupeService };
export default BaremeGroupeService;
