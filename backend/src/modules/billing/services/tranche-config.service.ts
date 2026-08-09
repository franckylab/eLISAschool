/**
 * ==================================
 * eLISAschool - Service TrancheConfig
 * ==================================
 * 
 * Résolution en cascade des tranches de pricing :
 *   1. TrancheSupplement (établissement) → priorité 1
 *   2. TrancheGroupe (groupe) → priorité 2 (Lot C v7)
 *   3. TrancheEleves (plan) → priorité 3
 *   4. Tranches système (défaut global) → fallback
 * 
 * Phase 3.1 — Refonte SaaS v5
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { TrancheSupplement } from '../entities/tranche-supplement.entity';
import { TrancheEleves, PlanAbonnement, AbonnementClient, StatutAbonnement, ModeFacturationTranches } from '../entities';
import { TrancheGroupe } from '../entities/tranche-groupe.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { logger } from '@common/utils/logger.util';

export interface ResolvedTranche {
    id: string;
    ordre: number;
    minEleves: number;
    maxEleves: number | null;
    montantSupplementaire: number;
    label?: string;
    source: 'etablissement' | 'groupe' | 'plan' | 'systeme';
    trancheOriginaleId?: string;
}

/** Résultat complet du calcul de tranches — Lot B v7 */
export interface CalculTranchesResult {
    montantBase: number;
    montantTranches: number;
    nbEleves: number;
    plafondPlan: number;
    plafondMaxEleves: number | null;
    mode: ModeFacturationTranches;
    trancheActive: ResolvedTranche | null;
    detail: Array<{ tranche: ResolvedTranche; applicable: boolean; montant: number }>;
    depassement: {
        estEnDepassement: boolean;
        depassementPourcent: number;
        toleranceAtteinte: boolean;
    };
}

export class TrancheConfigService {
    private trancheSuppRepo: Repository<TrancheSupplement>;
    private trancheRepo: Repository<TrancheEleves>;
    private abonnementRepo: Repository<AbonnementClient>;
    private trancheGroupeRepo: Repository<TrancheGroupe>;
    private groupeLienRepo: Repository<GroupeEtablissementLien>;

    constructor() {
        this.trancheSuppRepo = AppDataSource.getRepository(TrancheSupplement);
        this.trancheRepo = AppDataSource.getRepository(TrancheEleves);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.trancheGroupeRepo = AppDataSource.getRepository(TrancheGroupe);
        this.groupeLienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
    }

    /**
     * Résout les tranches applicables pour un établissement.
     * Cascade : établissement → groupe → plan → système.
     * 
     * @param etablissementId - ID de l'établissement
     * @returns Liste des tranches résolues, triées par ordre
     */
    async getResolvedTranches(etablissementId: string): Promise<ResolvedTranche[]> {
        // 1. Récupérer l'abonnement actif et le plan
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: StatutAbonnement.ACTIF },
            relations: ['plan'],
        });

        if (!abonnement?.plan) {
            logger.warn(`[TrancheConfig] Aucun abonnement actif pour ${etablissementId}`);
            return [];
        }

        const plan = abonnement.plan;

        // 2. Résolution du groupe éventuel pour cet établissement (Lot C v7)
        const groupeLien = await this.groupeLienRepo.findOne({
            where: { etablissementId },
        });
        const groupeId = groupeLien?.groupeId;

        // 3. Récupérer les tranches du plan + overrides établissement + overrides groupe
        const [planTranches, etabTranches, groupeTranches] = await Promise.all([
            this.trancheRepo.find({
                where: { planId: plan.id, actif: true },
                order: { ordre: 'ASC' },
            }),
            this.trancheSuppRepo.find({
                where: { etablissementId, actif: true },
                order: { ordre: 'ASC' },
            }),
            groupeId
                ? this.trancheGroupeRepo.find({
                    where: { groupeEtablissementId: groupeId, actif: true },
                    order: { ordre: 'ASC' },
                })
                : Promise.resolve([]),
        ]);

        // 4. Fusionner : les overrides établissement remplacent les tranches plan
        //    si trancheOriginaleId correspond, sinon elles s'ajoutent
        const resolved: ResolvedTranche[] = [];
        const overriddenIds = new Set(etabTranches.map(t => t.trancheOriginaleId).filter(Boolean));

        // Ajouter les overrides établissement (priorité 1)
        for (const t of etabTranches) {
            resolved.push({
                id: t.id,
                ordre: t.ordre,
                minEleves: t.minEleves,
                maxEleves: t.maxEleves,
                montantSupplementaire: t.montantSupplementaire,
                label: t.label,
                source: 'etablissement',
                trancheOriginaleId: t.trancheOriginaleId,
            });
        }

        // Ajouter les overrides groupe (priorité 2 — Lot C v7)
        for (const t of groupeTranches) {
            resolved.push({
                id: t.id,
                ordre: t.ordre,
                minEleves: t.minEleves,
                maxEleves: t.maxEleves,
                montantSupplementaire: t.montantSupplementaire,
                label: t.label,
                source: 'groupe',
                trancheOriginaleId: t.trancheOriginaleId,
            });
        }

        // Ajouter les tranches plan non override (priorité 3)
        for (const t of planTranches) {
            if (overriddenIds.has(t.id)) continue; // Remplacée par un override
            resolved.push({
                id: t.id,
                ordre: t.ordre,
                minEleves: t.minEleves,
                maxEleves: t.maxEleves,
                montantSupplementaire: t.montantSupplementaire,
                label: t.label,
                source: 'plan',
            });
        }

        // Trier par ordre
        resolved.sort((a, b) => a.ordre - b.ordre);
        return resolved;
    }

    /**
     * Calcule le supplément total pour un nombre d'élèves donné.
     */
    async calculateSupplement(etablissementId: string, nbEleves: number): Promise<{
        tranches: ResolvedTranche[];
        totalSupplement: number;
        detail: Array<{ tranche: ResolvedTranche; applicable: boolean; montant: number }>;
    }> {
        const tranches = await this.getResolvedTranches(etablissementId);
        let totalSupplement = 0;
        const detail: Array<{ tranche: ResolvedTranche; applicable: boolean; montant: number }> = [];

        for (const tranche of tranches) {
            const inRange =
                nbEleves > tranche.minEleves &&
                (tranche.maxEleves === null || nbEleves <= tranche.maxEleves);

            detail.push({
                tranche,
                applicable: inRange,
                montant: inRange ? tranche.montantSupplementaire : 0,
            });

            if (inRange) {
                totalSupplement += tranche.montantSupplementaire;
            }
        }

        return { tranches, totalSupplement, detail };
    }

    /**
     * Calcul complet des tranches pour un établissement avec un nombre d'élèves donné.
     * Lot B v7 — Supporte les modes auto et declaratif.
     * 
     * Mode auto : recomputation par nb élèves réel + identification de la tranche active.
     * Mode declaratif : tranche souscrite manuellement, facturation fixe.
     * 
     * @param etablissementId - ID de l'établissement
     * @param nbEleves - Nombre d'élèves actuel
     * @returns Résultat complet avec montantBase, montantTranches, tranche active, dépassement
     */
    async calculerMontantTranches(etablissementId: string, nbEleves: number): Promise<CalculTranchesResult> {
        // 1. Récupérer l'abonnement actif avec le plan
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: StatutAbonnement.ACTIF },
            relations: ['plan'],
        });

        if (!abonnement?.plan) {
            logger.warn(`[TrancheConfig] calculerMontantTranches — Aucun abonnement actif pour ${etablissementId}`);
            return {
                montantBase: 0,
                montantTranches: 0,
                nbEleves,
                plafondPlan: 0,
                plafondMaxEleves: null,
                mode: ModeFacturationTranches.AUTO,
                trancheActive: null,
                detail: [],
                depassement: { estEnDepassement: false, depassementPourcent: 0, toleranceAtteinte: false },
            };
        }

        const plan = abonnement.plan;
        const tranches = await this.getResolvedTranches(etablissementId);

        // 2. Calculer le supplément de tranches
        let montantTranches = 0;
        let trancheActive: ResolvedTranche | null = null;
        const detail: Array<{ tranche: ResolvedTranche; applicable: boolean; montant: number }> = [];

        for (const tranche of tranches) {
            const inRange =
                nbEleves > tranche.minEleves &&
                (tranche.maxEleves === null || nbEleves <= tranche.maxEleves);

            detail.push({
                tranche,
                applicable: inRange,
                montant: inRange ? tranche.montantSupplementaire : 0,
            });

            if (inRange) {
                montantTranches += tranche.montantSupplementaire;
                trancheActive = tranche;
            }
        }

        // 3. Calcul du dépassement
        const plafondPlan = plan.maxEleves;
        const plafondMaxEleves = plan.plafondMaxEleves ?? null;
        const seuilAlerte = plafondMaxEleves
            ? plafondMaxEleves * (1 + plan.toleranceDepassement / 100)
            : null;

        const estEnDepassement = plafondMaxEleves !== null && nbEleves > plafondMaxEleves;
        const depassementPourcent = plafondMaxEleves && plafondMaxEleves > 0
            ? Math.round(((nbEleves - plafondMaxEleves) / plafondMaxEleves) * 100)
            : 0;
        const toleranceAtteinte = seuilAlerte !== null && nbEleves > seuilAlerte;

        return {
            montantBase: Number(plan.prixBase),
            montantTranches,
            nbEleves,
            plafondPlan,
            plafondMaxEleves,
            mode: plan.modeFacturationTranches,
            trancheActive,
            detail,
            depassement: {
                estEnDepassement,
                depassementPourcent,
                toleranceAtteinte,
            },
        };
    }

    /**
     * Simulation de calcul de tranches sans abonnement actif.
     * Utilisé pour le simulateur plateforme (impact seuils).
     * 
     * @param plan - Plan d'abonnement complet
     * @param tranchesPlan - Tranches du plan
     * @param nbEleves - Nombre d'élèves à simuler
     * @returns Résultat de simulation
     */
    simulerMontantTranches(
        plan: PlanAbonnement,
        tranchesPlan: ResolvedTranche[],
        nbEleves: number,
    ): CalculTranchesResult {
        let montantTranches = 0;
        let trancheActive: ResolvedTranche | null = null;
        const detail: Array<{ tranche: ResolvedTranche; applicable: boolean; montant: number }> = [];

        for (const tranche of tranchesPlan) {
            const inRange =
                nbEleves > tranche.minEleves &&
                (tranche.maxEleves === null || nbEleves <= tranche.maxEleves);

            detail.push({
                tranche,
                applicable: inRange,
                montant: inRange ? tranche.montantSupplementaire : 0,
            });

            if (inRange) {
                montantTranches += tranche.montantSupplementaire;
                trancheActive = tranche;
            }
        }

        const plafondMaxEleves = plan.plafondMaxEleves ?? null;
        const estEnDepassement = plafondMaxEleves !== null && nbEleves > plafondMaxEleves;
        const depassementPourcent = plafondMaxEleves && plafondMaxEleves > 0
            ? Math.round(((nbEleves - plafondMaxEleves) / plafondMaxEleves) * 100)
            : 0;

        return {
            montantBase: Number(plan.prixBase),
            montantTranches,
            nbEleves,
            plafondPlan: plan.maxEleves,
            plafondMaxEleves,
            mode: plan.modeFacturationTranches,
            trancheActive,
            detail,
            depassement: {
                estEnDepassement,
                depassementPourcent,
                toleranceAtteinte: depassementPourcent > plan.toleranceDepassement,
            },
        };
    }

    /**
     * Crée ou met à jour un override de tranche pour un établissement.
     */
    async upsertEtablissementTranche(
        etablissementId: string,
        data: {
            ordre: number;
            minEleves: number;
            maxEleves?: number | null;
            montantSupplementaire: number;
            label?: string;
            trancheOriginaleId?: string;
        }
    ): Promise<TrancheSupplement> {
        let existing = await this.trancheSuppRepo.findOne({
            where: { etablissementId, ordre: data.ordre },
        });

        if (existing) {
            Object.assign(existing, {
                minEleves: data.minEleves,
                maxEleves: data.maxEleves ?? null,
                montantSupplementaire: data.montantSupplementaire,
                label: data.label,
                trancheOriginaleId: data.trancheOriginaleId,
            });
        } else {
            existing = this.trancheSuppRepo.create({
                etablissementId,
                ordre: data.ordre,
                minEleves: data.minEleves,
                maxEleves: data.maxEleves ?? null,
                montantSupplementaire: data.montantSupplementaire,
                label: data.label,
                trancheOriginaleId: data.trancheOriginaleId,
            });
        }

        const saved = await this.trancheSuppRepo.save(existing);

        logger.info(
            `[TrancheConfig] Upsert — Établissement: ${etablissementId}, ` +
            `Tranche ${data.minEleves}-${data.maxEleves ?? '∞'}: ${data.montantSupplementaire}`
        );

        return saved;
    }

    /**
     * Supprime un override de tranche pour un établissement.
     */
    async deleteEtablissementTranche(etablissementId: string, trancheId: string): Promise<void> {
        await this.trancheSuppRepo.delete({ id: trancheId, etablissementId });
        logger.info(`[TrancheConfig] Delete — Tranche ${trancheId} pour ${etablissementId}`);
    }
}

export default TrancheConfigService;
