/**
 * ==================================
 * eLISAschool - Service Facturation (Refonte v4)
 * ==================================
 *
 * Formule v4 (migration 216, promotions multi-scopes) :
 *   montant = (prixBase + max(0, nbÉlèves − franchise) × prixParEleve) × coefCycle
 *             + modules sup. + packs quota
 *             − cascade promotions (5 phases : plan/packs/quota/modules/gratuités)
 *
 * - tarification    : plan.tarification (prixBase, prixParEleve, elevesInclusGratuits, paliers)
 * - coefCycle       : cycles_facturation.remisePourcent (ex-enum dur supprimé)
 * - promotions      : promotionService.appliquerCascade() (cascade 5 phases)
 * - packs           : abonnements_packs (facturés au prorata à la souscription)
 *
 * Conformité OHADA : TVA 19.25%, numéro séquentiel, mentions légales.
 *
 * Version: 4.0.0
 * Auteur: franck arlos chendjou
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { AppError } from '@common/filters/error.filter';
import {
    PlanAbonnement,
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
    Facture,
    StatutFacture,
    LigneFacture,
    TypeLigneFacture,
    AbonnementModule,
    CreditNote,
    StatutCreditNote,
} from '../entities';
import { CycleFacturationConfig } from '../entities/cycle-facturation-config.entity';
import { AbonnementPack } from '../entities/abonnement-pack.entity';
import { promotionService } from './promotion.service';

/** Taux TVA Cameroun : 19.25% stocké en centièmes (1925 = 19.25%) */
const TAUX_TVA_CENTIERES = 1925;

/** Mentions légales OHADA par défaut */
const MENTIONS_LEGALES_OHADA =
    'Facture établie conformément aux dispositions OHADA. ' +
    'TVA conforme à la législation en vigueur. ' +
    'En cas de retard de paiement, des pénalités pourront être appliquées. ' +
    'Dispensé d\'immatriculation au RCCM selon l\'Acte Uniforme OHADA.';

export interface CalculFactureResult {
    montantBase: number;
    /** Élèves supplémentaires au-delà de la franchise (ex-montantTranches) */
    montantElevesSupplementaires: number;
    /** Modules supplémentaires */
    montantOptions: number;
    /** Dont modules sup. (pour cascade promotions) */
    montantModules: number;
    /** Dont packs quota (pour cascade promotions) */
    montantPacks: number;
    montantRemises: number;
    coefCycle: number;
    cycleCode: string;
    montantHT: number;
    montantTVA: number;
    tauxTVA: number;
    montantTotal: number;
    remisesAppliquees: Array<{ remiseId: string; code: string; montantDeduit: number }>;
    /** Détail cascade promotions v4 (par scope) */
    promotionsCascade?: any;
    lignes: Array<{
        description: string;
        type: TypeLigneFacture;
        montant: number;
        quantite: number;
        total: number;
        referenceId?: string;
    }>;
}

export class FacturationService {
    private planRepo: Repository<PlanAbonnement>;
    private abonnementRepo: Repository<AbonnementClient>;
    private factureRepo: Repository<Facture>;
    private ligneFactureRepo: Repository<LigneFacture>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private abonnementPackRepo: Repository<AbonnementPack>;
    private cycleRepo: Repository<CycleFacturationConfig>;
    private creditNoteRepo: Repository<CreditNote>;

    constructor() {
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.factureRepo = AppDataSource.getRepository(Facture);
        this.ligneFactureRepo = AppDataSource.getRepository(LigneFacture);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.abonnementPackRepo = AppDataSource.getRepository(AbonnementPack);
        this.cycleRepo = AppDataSource.getRepository(CycleFacturationConfig);
        this.creditNoteRepo = AppDataSource.getRepository(CreditNote);
    }

    // =============================================
    // CALCUL DU MONTANT (formule v3)
    // =============================================

    /**
     * Calcule le montant pour un plan donné selon la formule v3 :
     * (prixBase + max(0, nbÉlèves − franchise) × prixParEleve) × coefCycle
     * − remises + modules supplément + packs.
     */
    async calculerMontantMensuel(
        planId: string,
        nombreEleves: number,
        abonnementId?: string,
        cycleCode: string = CycleFacturation.MENSUEL,
        etablissementId?: string
    ): Promise<CalculFactureResult> {
        const plan = await this.planRepo.findOne({ where: { id: planId } });
        if (!plan) {
            throw new AppError(`Plan ${planId} introuvable`, 404, 'PLAN_NOT_FOUND');
        }

        // Bloc tarification JSONB (repli sur la colonne prixBase legacy)
        const tarification = plan.tarification ?? {
            prixBase: Number(plan.prixBase),
            prixParEleve: 0,
            elevesInclusGratuits: 0,
        };
        const prixBase = Number(tarification.prixBase ?? plan.prixBase);
        const franchise = tarification.elevesInclusGratuits ?? 0;

        const lignes: CalculFactureResult['lignes'] = [];

        // 1. Forfait socle
        lignes.push({
            description: `Plan ${plan.nom} — ${franchise} élèves inclus`,
            type: TypeLigneFacture.BASE,
            montant: prixBase,
            quantite: 1,
            total: prixBase,
        });

        // 2. Élèves supplémentaires (paliers dégressifs éventuels)
        const elevesFacturables = Math.max(0, nombreEleves - franchise);
        let prixUnitaire = Number(tarification.prixParEleve ?? 0);
        if (elevesFacturables > 0 && Array.isArray(tarification.paliers) && tarification.paliers.length > 0) {
            const palier = [...tarification.paliers]
                .sort((a, b) => b.seuilEleves - a.seuilEleves)
                .find((p) => nombreEleves >= p.seuilEleves);
            if (palier) prixUnitaire = Number(palier.prixParEleve);
        }
        const montantEleves = Math.round(elevesFacturables * prixUnitaire * 100) / 100;
        if (elevesFacturables > 0 && montantEleves > 0) {
            lignes.push({
                description: `Élèves supplémentaires (${elevesFacturables} × ${prixUnitaire})`,
                type: TypeLigneFacture.TRANCHE,
                montant: prixUnitaire,
                quantite: elevesFacturables,
                total: montantEleves,
            });
        }

        // 3. Coefficient de cycle (remise du cycle depuis cycles_facturation)
        const cycle = await this.cycleRepo.findOne({ where: { code: cycleCode, actif: true } });
        const remiseCycle = cycle ? Number(cycle.remisePourcent) : 0;
        const coefCycle = 1 - remiseCycle / 100;
        const montantForfaitCycle = Math.round((prixBase + montantEleves) * coefCycle * 100) / 100;
        if (remiseCycle > 0) {
            lignes.push({
                description: `Cycle ${cycle?.nom ?? cycleCode} (−${remiseCycle}%)`,
                type: TypeLigneFacture.REMISE,
                montant: -Math.round((prixBase + montantEleves) * (remiseCycle / 100) * 100) / 100,
                quantite: 1,
                total: -Math.round((prixBase + montantEleves) * (remiseCycle / 100) * 100) / 100,
            });
        }

        let montantModules = 0;
        let montantPacks = 0;
        const modulesSouscritsIds: string[] = [];
        const packsSouscritsIds: string[] = [];
        const packMontants: Record<string, number> = {};
        const packRessources: Record<string, string> = {};

        // 4. Modules souscrits en supplément (catalogue unifié)
        if (abonnementId) {
            const modulesActifs = await this.abonnementModuleRepo.find({
                where: { abonnementId, actif: true },
                relations: ['module'],
            });
            for (const am of modulesActifs) {
                // Collecter les IDs pour le contexte promotions (Phase 3)
                modulesSouscritsIds.push(am.moduleOptionnelId);
                if (am.module?.estActif && am.module.prixMensuel > 0) {
                    const prix = Number(am.module.prixMensuel);
                    montantModules += prix;
                    lignes.push({
                        description: `Module: ${am.module.nom}`,
                        type: TypeLigneFacture.OPTION,
                        montant: prix,
                        quantite: 1,
                        total: prix,
                        referenceId: am.moduleOptionnelId,
                    });
                }
            }

            // 5. Packs quota souscrits actifs (montant proratisé du cycle courant)
            const now = new Date();
            const packs = await this.abonnementPackRepo.find({
                where: { abonnementId, actif: true },
                relations: ['pack'],
            });
            for (const souscription of packs) {
                if (souscription.dateFin && new Date(souscription.dateFin) < now) continue;
                const montantPack = Number(souscription.montantFacture ?? 0);
                // Collecter les IDs et montants pour le contexte promotions (Phase 2 + bundles)
                packsSouscritsIds.push(souscription.packId);
                if (montantPack > 0) {
                    packMontants[souscription.packId] = montantPack;
                }
                // Collecter les ressources pour le filtrage cibleRessource (BUG-2)
                if (souscription.pack?.ressource) {
                    packRessources[souscription.packId] = souscription.pack.ressource;
                }
                if (montantPack <= 0) continue;
                montantPacks += montantPack;
                lignes.push({
                    description: `Pack quota: ${souscription.pack?.nom ?? 'quota supplémentaire'}`,
                    type: TypeLigneFacture.OPTION,
                    montant: montantPack,
                    quantite: 1,
                    total: montantPack,
                    referenceId: souscription.packId,
                });
            }
        }

        const montantOptions = montantModules + montantPacks;
        const sousTotal = Math.round((montantForfaitCycle + montantOptions) * 100) / 100;

        // 6. Promotions commerciales — cascade 5 phases (v4)
        // Phase 1: PLAN (plafond 40%) → Phase 2: PACKS → Phase 3: QUOTA → Phase 4: MODULES → Phase 5: GRATUITS
        const contextePromo: import('./promotion.service').ContextePromotion = {
            planId,
            etablissementId,
            cycleCode,
            nombreEleves,
            packsSouscritsIds,
            modulesSouscritsIds,
            packMontants,
            packRessources,
        };

        // Enrichir avec les données d'abonnement si disponibles
        if (abonnementId) {
            const aboCtx = await this.abonnementRepo.findOne({ where: { id: abonnementId } });
            if (aboCtx) {
                contextePromo.dateDebutAbonnement = aboCtx.dateDebut;
                contextePromo.dateFinAbonnement = aboCtx.dateFin;
            }
            // Calculer le numéro de cycle (nombre de factures émises pour cet abonnement)
            const nbFacturesEmises = await this.factureRepo.count({
                where: { abonnementId },
            });
            contextePromo.numeroCycle = nbFacturesEmises;
        }

        const resultatCascade = await promotionService.appliquerCascade(
            montantForfaitCycle,
            montantPacks,
            montantModules,
            contextePromo
        );

        // Lignes de facture pour chaque promotion appliquée
        const toutesPromos = resultatCascade.toutesPromotions;
        for (const promo of toutesPromos) {
            if (promo.montantDeduit > 0) {
                lignes.push({
                    description: `Promo ${promo.scope}: ${promo.code} (−${promo.montantDeduit.toFixed(0)} F)`,
                    type: TypeLigneFacture.REMISE,
                    montant: -promo.montantDeduit,
                    quantite: 1,
                    total: -promo.montantDeduit,
                    referenceId: promo.promotionId,
                });
            }
        }

        const montantTotalRemises = resultatCascade.montantAvantPromotions - resultatCascade.montantFinal;
        const montantHT = Math.max(0, Math.round(sousTotal - montantTotalRemises));
        const montantTVA = this.calculerTVA(montantHT);

        return {
            montantBase: Math.round(montantForfaitCycle - montantEleves * coefCycle),
            montantElevesSupplementaires: Math.round(montantEleves * coefCycle),
            montantOptions: Math.round(montantOptions),
            montantModules: Math.round(montantModules),
            montantPacks: Math.round(montantPacks),
            montantRemises: Math.round(montantTotalRemises),
            coefCycle,
            cycleCode,
            montantHT,
            montantTVA,
            tauxTVA: TAUX_TVA_CENTIERES,
            montantTotal: montantHT + montantTVA,
            remisesAppliquees: toutesPromos.map((p) => ({
                remiseId: p.promotionId,
                code: p.code,
                montantDeduit: p.montantDeduit,
            })),
            promotionsCascade: resultatCascade,
            lignes,
        };
    }

    // =============================================
    // GENERATION DE FACTURE
    // =============================================

    /**
     * Génère une facture pour un abonnement.
     */
    async genererFacture(abonnementId: string): Promise<Facture> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { id: abonnementId },
            relations: ['plan'],
        });

        if (!abonnement) {
            throw new AppError(`Abonnement ${abonnementId} introuvable`, 404, 'ABONNEMENT_NOT_FOUND');
        }

        // Calculer le nombre d'élèves actuel
        const { Eleve } = await import('@modules/eleves/entities');
        const eleveRepo = AppDataSource.getRepository(Eleve);
        const nombreEleves = await eleveRepo.count({
            where: { etablissementId: abonnement.etablissementId } as any,
        });

        // Calculer le montant (formule v3 avec cycle et remises)
        const calcul = await this.calculerMontantMensuel(
            abonnement.planId,
            nombreEleves,
            abonnementId,
            abonnement.cycleFacturation as unknown as string,
            abonnement.etablissementId
        );

        // Générer les numéros de facture
        const numero = await this.genererNumeroFacture();
        const numeroOHADA = await this.genererNumeroFactureOHADA();

        // Dates
        const now = new Date();
        const dateEcheance = new Date(now);
        dateEcheance.setDate(dateEcheance.getDate() + 30); // 30 jours pour payer

        // Créer la facture (conforme OHADA)
        const facture = this.factureRepo.create({
            numero,
            numeroOHADA,
            abonnementId: abonnement.id,
            etablissementId: abonnement.etablissementId,
            dateEmission: now,
            dateEcheance,
            montantBase: calcul.montantBase,
            montantTranches: calcul.montantElevesSupplementaires,
            montantOptions: calcul.montantOptions,
            montantPenalites: 0,
            montantHT: calcul.montantHT,
            montantTVA: calcul.montantTVA,
            tauxTVA: calcul.tauxTVA,
            montantTotal: calcul.montantTotal,
            montantPaye: 0,
            statut: StatutFacture.EMISE,
            devise: abonnement.plan.devise || 'XAF',
            mentionsLegales: MENTIONS_LEGALES_OHADA,
        });

        const savedFacture = await this.factureRepo.save(facture);

        // Créer les lignes de facture
        for (let i = 0; i < calcul.lignes.length; i++) {
            const ligneData = calcul.lignes[i];
            const ligne = this.ligneFactureRepo.create({
                factureId: savedFacture.id,
                description: ligneData.description,
                type: ligneData.type,
                montant: ligneData.montant,
                quantite: ligneData.quantite,
                total: ligneData.total,
                ordre: i,
                referenceId: ligneData.referenceId,
            });
            await this.ligneFactureRepo.save(ligne);
        }

        // Incrémenter les compteurs d'utilisation des promotions appliquées + traçabilité (v4.1)
        if (calcul.remisesAppliquees.length > 0) {
            const toutesPromos = calcul.promotionsCascade?.toutesPromotions ?? [];

            // Séparer les promotions classiques des bundles (scope=BUNDLE)
            const promoIds = calcul.remisesAppliquees
                .map((r) => r.remiseId)
                .filter((id) => !toutesPromos.some((p: any) => p.promotionId === id && p.scope === 'BUNDLE'));
            const bundlePromos = toutesPromos.filter((p: any) => p.scope === 'BUNDLE');

            // Tracking promotions classiques
            if (promoIds.length > 0) {
                await promotionService.enregistrerUtilisation(promoIds, {
                    etablissementId: abonnement.etablissementId,
                    factureId: savedFacture.id,
                    remises: calcul.remisesAppliquees
                        .filter((r) => promoIds.includes(r.remiseId))
                        .map((r) => {
                            const promoDetail = toutesPromos.find((p: any) => p.promotionId === r.remiseId);
                            return {
                                remiseId: r.remiseId,
                                code: r.code,
                                scope: promoDetail?.scope ?? 'PLAN',
                                montantDeduit: r.montantDeduit,
                            };
                        }),
                });
            }

            // Tracking bundles (BUG-3 FIX)
            if (bundlePromos.length > 0) {
                await promotionService.enregistrerUtilisationBundle(
                    bundlePromos.map((p: any) => p.promotionId),
                    {
                        etablissementId: abonnement.etablissementId,
                        factureId: savedFacture.id,
                        bundles: bundlePromos.map((p: any) => ({
                            bundleId: p.promotionId,
                            code: p.code,
                            montantDeduit: p.montantDeduit,
                        })),
                    }
                );
            }
        }

        // Mettre à jour l'abonnement
        abonnement.nombreElevesActuel = nombreEleves;
        abonnement.montantMensuel = calcul.montantTotal;
        abonnement.prochaineFacturation = await this.prochaineDateFacturation(abonnement.cycleFacturation as unknown as string, now);
        await this.abonnementRepo.save(abonnement);

        logger.info(
            `[Billing] Facture ${numero} générée — Établissement: ${abonnement.etablissementId} ` +
            `— Montant: ${calcul.montantTotal} ${abonnement.plan.devise || 'XAF'} — ${nombreEleves} élèves`
        );

        return savedFacture;
    }

    /**
     * Alias de genererFacture() pour compatibilité
     * (cron factures mensuelles, facturation groupe).
     */
    async genererFactureMensuelle(abonnementId: string): Promise<Facture> {
        return this.genererFacture(abonnementId);
    }

    // =============================================
    // PRORATA TEMPORIS (upgrade/downgrade mid-cycle)
    // =============================================

    /**
     * Calcule le prorata pour un changement de plan en cours de cycle.
     */
    async calculerProrata(
        abonnementId: string,
        nouveauPlanId: string
    ): Promise<{ credit: number; debit: number; solde: number }> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { id: abonnementId },
            relations: ['plan'],
        });

        if (!abonnement) {
            throw new AppError(`Abonnement ${abonnementId} introuvable`, 404, 'ABONNEMENT_NOT_FOUND');
        }

        const nouveauPlan = await this.planRepo.findOne({ where: { id: nouveauPlanId } });
        if (!nouveauPlan) {
            throw new AppError(`Plan ${nouveauPlanId} introuvable`, 404, 'PLAN_NOT_FOUND');
        }

        const now = new Date();
        const dateFin = new Date(abonnement.dateFin);

        // Jours restants dans le cycle
        const joursRestants = Math.max(1, Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        const joursTotal = Math.max(1, Math.ceil((dateFin.getTime() - abonnement.dateDebut.getTime()) / (1000 * 60 * 60 * 24)));

        // Crédit = montant non consommé de l'ancien plan
        const montantJourAncien = Number(abonnement.montantMensuel) / joursTotal;
        const credit = montantJourAncien * joursRestants;

        // Débit = coût du nouveau plan pour la période restante
        const calculNouveau = await this.calculerMontantMensuel(
            nouveauPlanId,
            abonnement.nombreElevesActuel,
            undefined,
            abonnement.cycleFacturation as unknown as string,
            abonnement.etablissementId
        );
        const montantJourNouveau = calculNouveau.montantTotal / joursTotal;
        const debit = montantJourNouveau * joursRestants;

        return {
            credit: Math.round(credit * 100) / 100,
            debit: Math.round(debit * 100) / 100,
            solde: Math.round((debit - credit) * 100) / 100,
        };
    }

    // =============================================
    // SOUSCRIPTION ABONNEMENT
    // =============================================

    /**
     * Souscrit un établissement à un plan (cycle configurable v3).
     */
    async souscrireAbonnement(
        etablissementId: string,
        planId: string,
        cycleFacturation: CycleFacturation | string = CycleFacturation.MENSUEL
    ): Promise<AbonnementClient> {
        // Vérifier qu'il n'y a pas déjà un abonnement actif
        const existing = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: StatutAbonnement.ACTIF,
            },
        });

        if (existing) {
            throw new AppError(`L'établissement a déjà un abonnement actif (${existing.id})`, 409, 'ABONNEMENT_EXISTANT');
        }

        const plan = await this.planRepo.findOne({ where: { id: planId } });
        if (!plan) {
            throw new AppError(`Plan ${planId} introuvable`, 404, 'PLAN_NOT_FOUND');
        }

        const cycleCode = cycleFacturation as string;

        // Le cycle doit être autorisé par le plan et actif en base
        if (Array.isArray(plan.cyclesAutorises) && plan.cyclesAutorises.length > 0 && !plan.cyclesAutorises.includes(cycleCode)) {
            throw new AppError(`Le cycle ${cycleCode} n'est pas autorisé pour le plan ${plan.nom}`, 400, 'CYCLE_NON_AUTORISE');
        }
        const cycle = await this.cycleRepo.findOne({ where: { code: cycleCode } });
        if (cycle && !cycle.actif) {
            throw new AppError(`Le cycle ${cycleCode} n'est plus disponible`, 400, 'CYCLE_INACTIF');
        }

        // Calculer le montant initial
        const { Eleve } = await import('@modules/eleves/entities');
        const eleveRepo = AppDataSource.getRepository(Eleve);
        const nombreEleves = await eleveRepo.count({
            where: { etablissementId } as any,
        });

        const calcul = await this.calculerMontantMensuel(planId, nombreEleves, undefined, cycleCode, etablissementId);

        const now = new Date();
        const dateFin = await this.prochaineDateFacturation(cycleCode, now);

        const abonnement = this.abonnementRepo.create({
            etablissementId,
            planId,
            dateDebut: now,
            dateFin,
            statut: StatutAbonnement.ACTIF,
            cycleFacturation: cycleCode as unknown as CycleFacturation,
            autoRenouvellement: true,
            montantMensuel: calcul.montantTotal,
            nombreElevesActuel: nombreEleves,
            prochaineFacturation: dateFin,
        });

        const saved = await this.abonnementRepo.save(abonnement);

        // Générer la première facture
        await this.genererFacture(saved.id);

        logger.info(
            `[Billing] Abonnement souscrit — Établissement: ${etablissementId} ` +
            `— Plan: ${plan.nom} — Cycle: ${cycleCode} — Montant: ${calcul.montantTotal}`
        );

        return saved;
    }

    // =============================================
    // UPGRADE / DOWNGRADE
    // =============================================

    /**
     * Change le plan d'un abonnement avec calcul prorata.
     */
    async changerPlan(abonnementId: string, nouveauPlanId: string): Promise<AbonnementClient> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { id: abonnementId },
        });

        if (!abonnement) {
            throw new AppError(`Abonnement ${abonnementId} introuvable`, 404, 'ABONNEMENT_NOT_FOUND');
        }

        const nouveauPlan = await this.planRepo.findOne({ where: { id: nouveauPlanId } });
        if (!nouveauPlan) {
            throw new AppError(`Plan ${nouveauPlanId} introuvable`, 404, 'PLAN_NOT_FOUND');
        }

        const cycleCode = abonnement.cycleFacturation as unknown as string;
        if (Array.isArray(nouveauPlan.cyclesAutorises) && nouveauPlan.cyclesAutorises.length > 0 && !nouveauPlan.cyclesAutorises.includes(cycleCode)) {
            throw new AppError(`Le cycle ${cycleCode} n'est pas autorisé pour le plan ${nouveauPlan.nom}`, 400, 'CYCLE_NON_AUTORISE');
        }

        // Calculer le prorata
        const prorata = await this.calculerProrata(abonnementId, nouveauPlanId);

        // Mettre à jour l'abonnement
        abonnement.planId = nouveauPlanId;

        // Recalculer le montant avec le nouveau plan
        const calcul = await this.calculerMontantMensuel(
            nouveauPlanId,
            abonnement.nombreElevesActuel,
            abonnementId,
            cycleCode,
            abonnement.etablissementId
        );
        abonnement.montantMensuel = calcul.montantTotal;

        await this.abonnementRepo.save(abonnement);

        // Si le solde est positif (upgrade), générer une facture de complément
        if (prorata.solde > 0) {
            const facture = this.factureRepo.create({
                numero: await this.genererNumeroFacture(),
                abonnementId: abonnement.id,
                etablissementId: abonnement.etablissementId,
                dateEmission: new Date(),
                dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                montantBase: prorata.solde,
                montantTranches: 0,
                montantOptions: 0,
                montantPenalites: 0,
                montantHT: prorata.solde,
                montantTVA: 0,
                montantTotal: prorata.solde,
                montantPaye: 0,
                statut: StatutFacture.EMISE,
                notes: `Prorata upgrade — Crédit: ${prorata.credit}, Débit: ${prorata.debit}`,
            });
            await this.factureRepo.save(facture);
        }

        logger.info(
            `[Billing] Changement de plan — Abonnement: ${abonnementId} ` +
            `— Prorata: ${prorata.solde > 0 ? '+' : ''}${prorata.solde}`
        );

        return abonnement;
    }

    // =============================================
    // RÉSILIATION
    // =============================================

    /**
     * Résilie un abonnement (passage à ANNULE).
     * Désactive l'accès et génère une facture de clôture si nécessaire.
     */
    async resilierAbonnement(abonnementId: string, motif?: string): Promise<AbonnementClient> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { id: abonnementId },
            relations: ['plan'],
        });

        if (!abonnement) {
            throw new AppError(`Abonnement ${abonnementId} introuvable`, 404, 'ABONNEMENT_NOT_FOUND');
        }

        if (abonnement.statut === StatutAbonnement.ANNULE) {
            throw new AppError('Cet abonnement est déjà résilié', 409, 'DEJA_RESILIE');
        }

        // Désactiver l'abonnement
        abonnement.statut = StatutAbonnement.ANNULE;
        abonnement.autoRenouvellement = false;
        abonnement.dateFin = new Date();
        if (motif) {
            abonnement.notes = motif;
        }

        await this.abonnementRepo.save(abonnement);

        logger.info(
            `[Billing] Abonnement résilié — ID: ${abonnementId} ` +
            `— Établissement: ${abonnement.etablissementId}` +
            (motif ? ` — Motif: ${motif}` : '')
        );

        return abonnement;
    }

    // =============================================
    // UTILITAIRES
    // =============================================

    /**
     * Calcule la TVA sur un montant HT.
     * Taux Cameroun : 19.25% par défaut.
     * Montants en entiers (XAF/XOF), pas de float.
     */
    calculerTVA(montantHT: number): number {
        return Math.round((montantHT * TAUX_TVA_CENTIERES) / 10000);
    }

    /**
     * Date de fin de cycle : now + dureeMois du cycle configuré
     * (repli MENSUEL si le cycle est absent de cycles_facturation).
     */
    private async prochaineDateFacturation(cycleCode: string, depuis: Date): Promise<Date> {
        const cycle = await this.cycleRepo.findOne({ where: { code: cycleCode } });
        const dureeMois = cycle?.dureeMois ?? (cycleCode === CycleFacturation.ANNUEL ? 12 : 1);
        const dateFin = new Date(depuis);
        dateFin.setMonth(dateFin.getMonth() + dureeMois);
        return dateFin;
    }

    /**
     * Génère un numéro de facture unique.
     */
    private async genererNumeroFacture(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `FAC-${year}`;

        const lastFacture = await this.factureRepo
            .createQueryBuilder('f')
            .where('f.numero LIKE :prefix', { prefix: `${prefix}-%` })
            .orderBy('f.createdAt', 'DESC')
            .getOne();

        let sequence = 1;
        if (lastFacture) {
            const parts = lastFacture.numero.split('-');
            sequence = parseInt(parts[2], 10) + 1;
        }

        return `${prefix}-${String(sequence).padStart(4, '0')}`;
    }

    /**
     * Génère un numéro de facture OHADA séquentiel.
     * Format : FAC-OHADA-YYYY-NNNNNN (6 chiffres de séquence)
     * Conforme au Livre III OHADA — numérotation séquentielle ininterrompue.
     */
    private async genererNumeroFactureOHADA(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `FAC-OHADA-${year}`;

        const lastFacture = await this.factureRepo
            .createQueryBuilder('f')
            .where('f.numeroOHADA LIKE :prefix', { prefix: `${prefix}-%` })
            .orderBy('f.createdAt', 'DESC')
            .getOne();

        let sequence = 1;
        if (lastFacture && lastFacture.numeroOHADA) {
            const parts = lastFacture.numeroOHADA.split('-');
            const lastSeq = parseInt(parts[3], 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        return `${prefix}-${String(sequence).padStart(6, '0')}`;
    }

    // =============================================
    // AVOIRS (CREDIT NOTES)
    // =============================================

    /**
     * Crée un avoir (credit note) lié à une facture.
     * Conforme OHADA : numéro séquentiel, TVA séparée, mentions légales.
     *
     * @param factureId — ID de la facture d'origine
     * @param montantHT — Montant HT de l'avoir (en XAF/XOF entiers)
     * @param raison — Raison de l'avoir
     */
    async creerAvoir(
        factureId: string,
        montantHT: number,
        raison: string
    ): Promise<CreditNote> {
        const facture = await this.factureRepo.findOne({
            where: { id: factureId },
        });

        if (!facture) {
            throw new AppError(`Facture ${factureId} introuvable`, 404, 'FACTURE_NOT_FOUND');
        }

        if (facture.statut === StatutFacture.ANNULEE) {
            throw new AppError(`Impossible de créer un avoir sur une facture annulée`, 409, 'FACTURE_ANNULEE');
        }

        // Calcul TVA
        const tauxTVA = facture.tauxTVA || TAUX_TVA_CENTIERES;
        const montantTVA = Math.round((montantHT * tauxTVA) / 10000);
        const montantTTC = montantHT + montantTVA;

        // Numéro séquentiel avoir
        const numero = await this.genererNumeroAvoir();

        const creditNote = this.creditNoteRepo.create({
            numero,
            factureId,
            etablissementId: facture.etablissementId,
            montantHT,
            montantTVA,
            montantTTC,
            raison,
            statut: StatutCreditNote.EMIS,
            dateEmission: new Date(),
            mentionsLegales: `Avoir lié à la facture ${facture.numero}. ${MENTIONS_LEGALES_OHADA}`,
        });

        const saved = await this.creditNoteRepo.save(creditNote);

        logger.info(
            `[Billing] Avoir ${numero} créé — Facture: ${facture.numero} ` +
            `— Montant HT: ${montantHT} XAF — TVA: ${montantTVA} XAF — TTC: ${montantTTC} XAF`
        );

        return saved;
    }

    /**
     * Génère un numéro d'avoir séquentiel OHADA.
     * Format : AV-OHADA-YYYY-NNNNNN
     */
    private async genererNumeroAvoir(): Promise<string> {
        const year = new Date().getFullYear();
        const prefix = `AV-OHADA-${year}`;

        const lastAvoir = await this.creditNoteRepo
            .createQueryBuilder('c')
            .where('c.numero LIKE :prefix', { prefix: `${prefix}-%` })
            .orderBy('c.createdAt', 'DESC')
            .getOne();

        let sequence = 1;
        if (lastAvoir) {
            const parts = lastAvoir.numero.split('-');
            const lastSeq = parseInt(parts[3], 10);
            if (!isNaN(lastSeq)) {
                sequence = lastSeq + 1;
            }
        }

        return `${prefix}-${String(sequence).padStart(6, '0')}`;
    }
}

export default FacturationService;
