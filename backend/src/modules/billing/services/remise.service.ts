/**
 * ==================================
 * eLISAschool - RemiseService (Refonte v3.1)
 * ==================================
 * Version: 3.1.0
 * Auteur: franck arlos chendjou
 *
 * CRUD des remises d'abonnement SaaS + moteur d'application :
 * priorité, cumul, durée d'application, cibles (GLOBAL/PLAN/TENANT/CYCLE).
 *
 * v3.1 — Filtrage conditionnel (conditionElevesMin, conditionAncienneteMois)
 *        + plafond global 40% sur le cumul des remises.
 *        + suppression double application remise cycle.
 *
 * Stratégie d'application (appliquer) :
 *   1. Filtrer les remises valides (actives, dates, maxUtilisations, cible, conditions)
 *   2. Trier par priorite DESC
 *   3. Si une remise non cumulable existe → elle gagne seule
 *   4. Sinon cumul des remises cumulables (plancher : montant >= 0)
 *   5. Plafond global 40% : la déduction totale ne peut dépasser 40% du montant initial
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { RemiseAbonnement, TypeRemise, CibleRemise, DureeApplicationRemise } from '../entities/remise-abonnement.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface ContexteApplicationRemise {
    planId?: string;
    etablissementId?: string;
    cycleCode?: string;
    /** Index du cycle en cours (0 = première facture) */
    numeroCycle?: number;
    /** Code coupon éventuellement saisi par le tenant */
    codeCoupon?: string;
    /** Nombre d'élèves de l'établissement (pour filtrage conditionElevesMin) */
    nombreEleves?: number;
    /** Date de début de l'abonnement (pour calcul d'ancienneté) */
    dateDebutAbonnement?: Date;
    /** Date de fin de l'abonnement (pour calcul cycle réel) */
    dateFinAbonnement?: Date;
}

export interface ResultatApplicationRemise {
    montantFinal: number;
    montantAvantRemise: number;
    remisesAppliquees: Array<{ remiseId: string; code: string; type: TypeRemise; valeur: number; montantDeduit: number }>;
}

export class RemiseService {
    private repo: Repository<RemiseAbonnement>;

    constructor() {
        this.repo = AppDataSource.getRepository(RemiseAbonnement);
    }

    // =============================================
    // CRUD
    // =============================================

    async create(dto: Partial<RemiseAbonnement>): Promise<RemiseAbonnement> {
        if (!dto.code || !dto.nom) {
            throw new AppError('Le code et le nom de la remise sont obligatoires', 400, 'VALIDATION_ERROR');
        }
        const existante = await this.repo.findOne({ where: { code: dto.code } });
        if (existante) {
            throw new AppError(`Une remise avec le code "${dto.code}" existe déjà`, 409, 'REMISE_EXISTS');
        }
        if (dto.typeRemise === TypeRemise.POURCENTAGE && (dto.valeur! <= 0 || dto.valeur! > 100)) {
            throw new AppError('Une remise en pourcentage doit être comprise entre 0 et 100', 400, 'VALIDATION_ERROR');
        }
        const remise = this.repo.create(dto);
        const saved = await this.repo.save(remise);
        logger.info(`[Remises] Remise créée : ${saved.code} (${saved.typeRemise} ${saved.valeur})`);
        return saved;
    }

    async findAll(filters?: { cible?: CibleRemise; actif?: boolean }): Promise<RemiseAbonnement[]> {
        const where: Record<string, unknown> = {};
        if (filters?.cible) where.cible = filters.cible;
        if (filters?.actif !== undefined) where.actif = filters.actif;
        return this.repo.find({ where, order: { priorite: 'DESC', createdAt: 'DESC' } });
    }

    async findOne(id: string): Promise<RemiseAbonnement> {
        const remise = await this.repo.findOne({ where: { id } });
        if (!remise) {
            throw new AppError('Remise introuvable', 404, 'NOT_FOUND');
        }
        return remise;
    }

    async findByCoupon(codeCoupon: string): Promise<RemiseAbonnement | null> {
        return this.repo.findOne({ where: { codeCoupon, actif: true } });
    }

    async update(id: string, dto: Partial<RemiseAbonnement>): Promise<RemiseAbonnement> {
        const remise = await this.findOne(id);
        Object.assign(remise, dto);
        return this.repo.save(remise);
    }

    async delete(id: string): Promise<void> {
        const remise = await this.findOne(id);
        await this.repo.remove(remise);
        logger.info(`[Remises] Remise supprimée : ${remise.code}`);
    }

    // =============================================
    // MOTEUR D'APPLICATION
    // =============================================

    /** Plafond global de déduction (40% du montant initial) */
    private static readonly PLAFOND_REMISE_POURCENT = 40;

    /** Une remise est-elle valide pour ce contexte ? */
    private estValide(remise: RemiseAbonnement, ctx: ContexteApplicationRemise): boolean {
        if (!remise.actif) return false;

        const now = new Date();
        if (remise.dateDebut && now < new Date(remise.dateDebut)) return false;
        if (remise.dateFin && now > new Date(remise.dateFin)) return false;
        if (remise.maxUtilisations !== null && remise.maxUtilisations !== undefined && remise.utilisations >= remise.maxUtilisations) {
            return false;
        }

        // ─── Conditions d'éligibilité (v3.1) ───
        // Condition sur le nombre d'élèves
        if (remise.conditionElevesMin !== null && remise.conditionElevesMin !== undefined) {
            const nbEleves = ctx.nombreEleves ?? 0;
            if (nbEleves < remise.conditionElevesMin) return false;
        }

        // Condition sur l'ancienneté (en mois révolus)
        if (remise.conditionAncienneteMois !== null && remise.conditionAncienneteMois !== undefined) {
            if (!ctx.dateDebutAbonnement) return false;
            const moisAnciennete = this.calculerAncienneteMois(ctx.dateDebutAbonnement, now);
            if (moisAnciennete < remise.conditionAncienneteMois) return false;
        }

        // Durée d'application selon le numéro de cycle
        const numeroCycle = ctx.numeroCycle ?? 0;
        if (remise.dureeApplication === DureeApplicationRemise.PREMIERE_FACTURE && numeroCycle > 0) return false;
        if (remise.dureeApplication === DureeApplicationRemise.N_CYCLES && numeroCycle >= (remise.nbCycles ?? 0)) return false;

        // Cible
        switch (remise.cible) {
            case CibleRemise.PLAN:
                return remise.cibleId === ctx.planId;
            case CibleRemise.TENANT:
                return remise.cibleId === ctx.etablissementId;
            case CibleRemise.CYCLE:
                return remise.cibleCycle === ctx.cycleCode;
            default:
                return true;
        }
    }

    /**
     * Calcule l'ancienneté en mois révolus entre deux dates.
     */
    private calculerAncienneteMois(dateDebut: Date, dateReference: Date): number {
        const years = dateReference.getFullYear() - dateDebut.getFullYear();
        const months = dateReference.getMonth() - dateDebut.getMonth();
        let totalMois = years * 12 + months;
        // Ajuster si le jour du mois n'est pas encore atteint
        if (dateReference.getDate() < dateDebut.getDate()) {
            totalMois--;
        }
        return Math.max(0, totalMois);
    }

    /**
     * Applique les remises valides à un montant.
     * Règles : priorité DESC, non-cumulable exclusive, cumul sinon, plancher 0.
     * Plafond global 40% : la déduction totale ne dépasse jamais 40% du montant initial.
     */
    async appliquer(montant: number, ctx: ContexteApplicationRemise): Promise<ResultatApplicationRemise> {
        const candidates = await this.repo.find({ where: { actif: true } });
        const valides = candidates
            .filter((r) => this.estValide(r, ctx))
            .sort((a, b) => (b.priorite ?? 0) - (a.priorite ?? 0));

        const appliquees: ResultatApplicationRemise['remisesAppliquees'] = [];
        let total = montant;

        // Plafond de déduction maximum (40% du montant initial)
        const deductionMax = montant * (RemiseService.PLAFOND_REMISE_POURCENT / 100);
        let totalDeduit = 0;

        for (const remise of valides) {
            // Un coupon saisi rend éligibles uniquement les remises coupon correspondantes
            if (ctx.codeCoupon && remise.codeCoupon && remise.codeCoupon !== ctx.codeCoupon) continue;

            // Vérifier si le plafond est déjà atteint
            if (totalDeduit >= deductionMax) break;

            if (!remise.cumulable && appliquees.length > 0) {
                // Non cumulable mais d'autres déjà appliquées → on la saute
                continue;
            }
            if (!remise.cumulable && appliquees.length === 0) {
                // Exclusive : appliquée seule, stop ensuite
                let deduit = this.calculerDeduction(remise, total);
                // Écrêter si le plafond est dépassé
                if (totalDeduit + deduit > deductionMax) {
                    deduit = Math.round((deductionMax - totalDeduit) * 100) / 100;
                }
                if (deduit <= 0) break;
                total = Math.max(0, total - deduit);
                totalDeduit += deduit;
                appliquees.push({ remiseId: remise.id, code: remise.code, type: remise.typeRemise, valeur: Number(remise.valeur), montantDeduit: deduit });
                break;
            }

            let deduit = this.calculerDeduction(remise, total);
            // Écrêter si le plafond est dépassé
            if (totalDeduit + deduit > deductionMax) {
                deduit = Math.round((deductionMax - totalDeduit) * 100) / 100;
            }
            if (deduit <= 0) continue;
            total = Math.max(0, total - deduit);
            totalDeduit += deduit;
            appliquees.push({ remiseId: remise.id, code: remise.code, type: remise.typeRemise, valeur: Number(remise.valeur), montantDeduit: deduit });
        }

        return {
            montantFinal: Math.round(total * 100) / 100,
            montantAvantRemise: montant,
            remisesAppliquees: appliquees,
        };
    }

    /** Incrémente le compteur d'utilisations après facturation effective */
    async enregistrerUtilisation(remiseIds: string[]): Promise<void> {
        for (const id of remiseIds) {
            await this.repo.increment({ id }, 'utilisations', 1);
        }
    }

    private calculerDeduction(remise: RemiseAbonnement, montant: number): number {
        const valeur = Number(remise.valeur);
        if (remise.typeRemise === TypeRemise.POURCENTAGE) {
            return Math.round(montant * (valeur / 100) * 100) / 100;
        }
        return Math.min(valeur, montant);
    }
}

export const remiseService = new RemiseService();
export default RemiseService;
