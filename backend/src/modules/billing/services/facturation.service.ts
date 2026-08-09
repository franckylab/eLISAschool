/**
 * ==================================
 * eLISAschool - Service Facturation
 * ==================================
 * 
 * Calcul automatique des tranches, génération de factures,
 * prorata temporis pour upgrade/downgrade mid-cycle.
 * Conformité OHADA : TVA 19.25%, numéro séquentiel, mentions légales.
 * 
 * Phase 4.2 — Refonte SaaS
 * Phase B.2 — Refonte SaaS v2 (OHADA, TVA, avoirs)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import {
    PlanAbonnement,
    TrancheEleves,
    AbonnementClient,
    StatutAbonnement,
    CycleFacturation,
    Facture,
    StatutFacture,
    LigneFacture,
    TypeLigneFacture,
    ModuleOptionnel,
    AbonnementModule,
    CreditNote,
    StatutCreditNote,
} from '../entities';

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
    montantTranches: number;
    montantOptions: number;
    montantHT: number;
    montantTVA: number;
    tauxTVA: number;
    montantTotal: number;
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
    private trancheRepo: Repository<TrancheEleves>;
    private abonnementRepo: Repository<AbonnementClient>;
    private factureRepo: Repository<Facture>;
    private ligneFactureRepo: Repository<LigneFacture>;
    private moduleOptionnelRepo: Repository<ModuleOptionnel>;
    private abonnementModuleRepo: Repository<AbonnementModule>;
    private creditNoteRepo: Repository<CreditNote>;

    constructor() {
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
        this.trancheRepo = AppDataSource.getRepository(TrancheEleves);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.factureRepo = AppDataSource.getRepository(Facture);
        this.ligneFactureRepo = AppDataSource.getRepository(LigneFacture);
        this.moduleOptionnelRepo = AppDataSource.getRepository(ModuleOptionnel);
        this.abonnementModuleRepo = AppDataSource.getRepository(AbonnementModule);
        this.creditNoteRepo = AppDataSource.getRepository(CreditNote);
    }

    // =============================================
    // CALCUL DU MONTANT MENSUEL (base + tranches + options)
    // =============================================

    /**
     * Calcule le montant mensuel pour un établissement donné
     * en fonction du plan, du nombre d'élèves et des modules optionnels.
     */
    async calculerMontantMensuel(planId: string, nombreEleves: number, abonnementId?: string): Promise<CalculFactureResult> {
        const plan = await this.planRepo.findOne({
            where: { id: planId },
            relations: ['tranches'],
        });

        if (!plan) {
            throw new Error(`Plan ${planId} introuvable`);
        }

        const lignes: CalculFactureResult['lignes'] = [];
        let montantBase = plan.prixBase;
        let montantTranches = 0;
        let montantOptions = 0;

        // 1. Ligne de base
        lignes.push({
            description: `Plan ${plan.nom} — jusqu'à ${plan.maxEleves} élèves`,
            type: TypeLigneFacture.BASE,
            montant: Number(plan.prixBase),
            quantite: 1,
            total: Number(plan.prixBase),
        });

        // 2. Calcul des tranches applicables
        if (nombreEleves > plan.maxEleves) {
            const tranches = plan.tranches
                ?.filter((t) => t.actif)
                .sort((a, b) => a.minEleves - b.minEleves) || [];

            for (const tranche of tranches) {
                // La tranche s'applique si le nombre d'élèves dépasse minEleves
                if (nombreEleves > tranche.minEleves) {
                    // Calcul combien d'élèves sont dans cette tranche
                    const elevesDansTranche = tranche.maxEleves
                        ? Math.min(nombreEleves, tranche.maxEleves) - tranche.minEleves
                        : nombreEleves - tranche.minEleves;

                    if (elevesDansTranche > 0) {
                        // Le montant est fixe par tranche (pas par élève)
                        const montantTranche = Number(tranche.montantSupplementaire);
                        montantTranches += montantTranche;

                        const label = tranche.label || `Tranche ${tranche.minEleves + 1}-${tranche.maxEleves || '∞'} élèves`;
                        lignes.push({
                            description: label,
                            type: TypeLigneFacture.TRANCHE,
                            montant: montantTranche,
                            quantite: 1,
                            total: montantTranche,
                            referenceId: tranche.id,
                        });
                    }
                }
            }
        }

        // 3. Modules optionnels
        if (abonnementId) {
            const modulesActifs = await this.abonnementModuleRepo.find({
                where: { abonnementId, actif: true },
                relations: ['moduleOptionnel'],
            });

            for (const am of modulesActifs) {
                if (am.moduleOptionnel?.actif) {
                    const prix = Number(am.moduleOptionnel.prixMensuel);
                    montantOptions += prix;
                    lignes.push({
                        description: `Module: ${am.moduleOptionnel.nom}`,
                        type: TypeLigneFacture.OPTION,
                        montant: prix,
                        quantite: 1,
                        total: prix,
                        referenceId: am.moduleOptionnelId,
                    });
                }
            }
        }

        return {
            montantBase,
            montantTranches,
            montantOptions,
            montantHT: montantBase + montantTranches + montantOptions,
            montantTVA: this.calculerTVA(montantBase + montantTranches + montantOptions),
            tauxTVA: TAUX_TVA_CENTIERES,
            montantTotal: montantBase + montantTranches + montantOptions + this.calculerTVA(montantBase + montantTranches + montantOptions),
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
            throw new Error(`Abonnement ${abonnementId} introuvable`);
        }

        // Calculer le nombre d'élèves actuel
        const { Eleve } = await import('@modules/eleves/entities');
        const eleveRepo = AppDataSource.getRepository(Eleve);
        const nombreEleves = await eleveRepo.count({
            where: { etablissementId: abonnement.etablissementId } as any,
        });

        // Calculer le montant
        const calcul = await this.calculerMontantMensuel(
            abonnement.planId,
            nombreEleves,
            abonnementId
        );

        // Générer le numéro de facture
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
            montantTranches: calcul.montantTranches,
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

        // Mettre à jour l'abonnement
        abonnement.nombreElevesActuel = nombreEleves;
        abonnement.montantMensuel = calcul.montantTotal;
        abonnement.prochaineFacturation = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        await this.abonnementRepo.save(abonnement);

        logger.info(
            `[Billing] Facture ${numero} générée — Établissement: ${abonnement.etablissementId} ` +
            `— Montant: ${calcul.montantTotal} ${calcul.montantTotal ? 'XAF' : ''} — ${nombreEleves} élèves`
        );

        return savedFacture;
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
            throw new Error(`Abonnement ${abonnementId} introuvable`);
        }

        const nouveauPlan = await this.planRepo.findOne({ where: { id: nouveauPlanId } });
        if (!nouveauPlan) {
            throw new Error(`Plan ${nouveauPlanId} introuvable`);
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
            abonnement.nombreElevesActuel
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
     * Souscrit un établissement à un plan.
     */
    async souscrireAbonnement(
        etablissementId: string,
        planId: string,
        cycleFacturation: CycleFacturation = CycleFacturation.MENSUEL
    ): Promise<AbonnementClient> {
        // Vérifier qu'il n'y a pas déjà un abonnement actif
        const existing = await this.abonnementRepo.findOne({
            where: {
                etablissementId,
                statut: StatutAbonnement.ACTIF,
            },
        });

        if (existing) {
            throw new Error(`L'établissement a déjà un abonnement actif (${existing.id})`);
        }

        const plan = await this.planRepo.findOne({ where: { id: planId } });
        if (!plan) {
            throw new Error(`Plan ${planId} introuvable`);
        }

        // Calculer le montant initial
        const { Eleve } = await import('@modules/eleves/entities');
        const eleveRepo = AppDataSource.getRepository(Eleve);
        const nombreEleves = await eleveRepo.count({
            where: { etablissementId } as any,
        });

        const calcul = await this.calculerMontantMensuel(planId, nombreEleves);

        const now = new Date();
        const dateFin = new Date(now);
        if (cycleFacturation === CycleFacturation.MENSUEL) {
            dateFin.setMonth(dateFin.getMonth() + 1);
        } else {
            dateFin.setFullYear(dateFin.getFullYear() + 1);
        }

        const abonnement = this.abonnementRepo.create({
            etablissementId,
            planId,
            dateDebut: now,
            dateFin,
            statut: StatutAbonnement.ACTIF,
            cycleFacturation,
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
            `— Plan: ${plan.nom} — Montant: ${calcul.montantTotal}`
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
            throw new Error(`Abonnement ${abonnementId} introuvable`);
        }

        const nouveauPlan = await this.planRepo.findOne({ where: { id: nouveauPlanId } });
        if (!nouveauPlan) {
            throw new Error(`Plan ${nouveauPlanId} introuvable`);
        }

        // Calculer le prorata
        const prorata = await this.calculerProrata(abonnementId, nouveauPlanId);

        // Mettre à jour l'abonnement
        abonnement.planId = nouveauPlanId;

        // Recalculer le montant avec le nouveau plan
        const calcul = await this.calculerMontantMensuel(
            nouveauPlanId,
            abonnement.nombreElevesActuel,
            abonnementId
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
            throw new Error(`Abonnement ${abonnementId} introuvable`);
        }

        if (abonnement.statut === StatutAbonnement.ANNULE) {
            throw new Error('Cet abonnement est déjà résilié');
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
            throw new Error(`Facture ${factureId} introuvable`);
        }

        if (facture.statut === StatutFacture.ANNULEE) {
            throw new Error(`Impossible de créer un avoir sur une facture annulée`);
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
