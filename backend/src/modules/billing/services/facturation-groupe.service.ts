/**
 * ==================================
 * eLISAschool - Service Facturation Groupes
 * ==================================
 * 
 * Facturation des groupes d'établissements — 3 modèles :
 * - Individuelle : chaque établissement a sa propre facture
 * - Consolidée : une seule facture pour tout le groupe
 * - Hybride (recommandé) : facture de base au groupe + dépassements individuels
 * 
 * Gère la dégressivité, la répartition au prorata, et les crédits.
 * 
 * Phase P1.2 — Refonte SaaS v4
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities/groupe-etablissement.entity';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities/groupe-etablissement-lien.entity';
import {
    AbonnementClient,
    StatutAbonnement,
} from '../entities/abonnement-client.entity';
import {
    Facture,
    StatutFacture,
} from '../entities/facture.entity';
import { LigneFacture, TypeLigneFacture } from '../entities/ligne-facture.entity';
import { FacturationService } from './facturation.service';

// =============================================
// TYPES
// =============================================

export enum ModeleFacturationGroupe {
    INDIVIDUELLE = 'INDIVIDUELLE',
    CONSOLIDEE = 'CONSOLIDEE',
    HYBRIDE = 'HYBRIDE',
}

export interface FacturationGroupeResult {
    groupeId: string;
    modele: ModeleFacturationGroupe;
    periode: string; // YYYY-MM
    factures: Array<{
        etablissementId: string;
        factureId?: string;
        montant: number;
        statut: string;
    }>;
    montantTotalGroupe: number;
    degressivite: number; // Pourcentage de réduction (0-100)
}

export interface ConsommationMembre {
    etablissementId: string;
    nomEtablissement: string;
    nombreEleves: number;
    montantBase: number;
    montantTranches: number;
    montantOptions: number;
    montantTotal: number;
}

// =============================================
// SERVICE
// =============================================

export class FacturationGroupeService {
    private groupeRepo: Repository<GroupeEtablissement>;
    private lienRepo: Repository<GroupeEtablissementLien>;
    private abonnementRepo: Repository<AbonnementClient>;
    private factureRepo: Repository<Facture>;
    private facturationService: FacturationService;

    constructor() {
        this.groupeRepo = AppDataSource.getRepository(GroupeEtablissement);
        this.lienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
        this.factureRepo = AppDataSource.getRepository(Facture);
        this.facturationService = new FacturationService();
    }

    // =============================================
    // CALCUL CONSOMMATION
    // =============================================

    /**
     * Calcule la consommation de chaque membre du groupe pour une période donnée.
     */
    async calculerConsommationMembres(
        groupeId: string,
        periode: string // YYYY-MM
    ): Promise<ConsommationMembre[]> {
        const liens = await this.lienRepo.find({
            where: { groupeId },
            relations: ['etablissement'],
        });

        const membres: ConsommationMembre[] = [];

        for (const lien of liens) {
            const abonnement = await this.abonnementRepo.findOne({
                where: {
                    etablissementId: lien.etablissementId,
                    statut: StatutAbonnement.ACTIF,
                },
                relations: ['plan'],
            });

            if (!abonnement?.plan) continue;

            // Compter les élèves réels de l'établissement (Refonte v3)
            const nbEleves = await AppDataSource.query(
                `SELECT COUNT(*)::int as count FROM eleves WHERE "etablissementId" = $1 AND "statut" = 'ACTIF'`,
                [lien.etablissementId]
            ).then((r: Array<{ count: number }>) => r[0]?.count ?? 0);

            // Calculer le montant pour cet établissement (formule v3)
            const calcul = await this.facturationService.calculerMontantMensuel(
                abonnement.planId,
                nbEleves,
                abonnement.id,
                undefined,
                lien.etablissementId,
            );

            membres.push({
                etablissementId: lien.etablissementId,
                nomEtablissement: lien.etablissement?.nom || lien.etablissementId.substring(0, 8),
                nombreEleves: nbEleves,
                montantBase: Number(abonnement.plan.prixBase),
                montantTranches: calcul.montantElevesSupplementaires || 0,
                montantOptions: calcul.montantOptions || 0,
                montantTotal: calcul.montantTotal || Number(abonnement.plan.prixBase),
            });
        }

        return membres;
    }

    // =============================================
    // DEGRESSIVITE
    // =============================================

    /**
     * Calcule le pourcentage de dégressivité selon le nombre de membres.
     * Plus le groupe est grand, plus la réduction est importante.
     */
    calculerDegressivite(nombreMembres: number): number {
        if (nombreMembres <= 1) return 0;
        if (nombreMembres <= 3) return 5;   // 5% pour 2-3 membres
        if (nombreMembres <= 5) return 10;  // 10% pour 4-5 membres
        if (nombreMembres <= 10) return 15; // 15% pour 6-10 membres
        if (nombreMembres <= 20) return 20; // 20% pour 11-20 membres
        return 25; // 25% pour 21+ membres
    }

    /**
     * Applique la dégressivité sur un montant.
     */
    appliquerDegressivite(montant: number, pourcentageReduction: number): number {
        return Math.round(montant * (1 - pourcentageReduction / 100));
    }

    // =============================================
    // FACTURATION PAR MODÈLE
    // =============================================

    /**
     * Génère les factures pour un groupe selon le modèle choisi.
     */
    async genererFacturesGroupe(
        groupeId: string,
        modele: ModeleFacturationGroupe,
        periode: string, // YYYY-MM
    ): Promise<FacturationGroupeResult> {
        const groupe = await this.groupeRepo.findOne({
            where: { id: groupeId, actif: true },
        });

        if (!groupe) {
            throw new Error(`Groupe ${groupeId} introuvable ou inactif`);
        }

        const membres = await this.calculerConsommationMembres(groupeId, periode);
        const degressivite = this.calculerDegressivite(membres.length);

        let result: FacturationGroupeResult;

        switch (modele) {
            case ModeleFacturationGroupe.INDIVIDUELLE:
                result = await this.facturationIndividuelle(groupe, membres, periode);
                break;
            case ModeleFacturationGroupe.CONSOLIDEE:
                result = await this.facturationConsolidee(groupe, membres, periode, degressivite);
                break;
            case ModeleFacturationGroupe.HYBRIDE:
                result = await this.facturationHybride(groupe, membres, periode, degressivite);
                break;
            default:
                throw new Error(`Modèle de facturation inconnu: ${modele}`);
        }

        logger.info(
            `[FacturationGroupe] ✅ Factures générées — Groupe: ${groupe.nom} ` +
            `— Modèle: ${modele} — ${result.factures.length} factures ` +
            `— Total: ${result.montantTotalGroupe} XAF — Dégressivité: ${degressivite}%`
        );

        return result;
    }

    /**
     * Modèle INDIVIDUEL — Chaque établissement a sa propre facture.
     */
    private async facturationIndividuelle(
        groupe: GroupeEtablissement,
        membres: ConsommationMembre[],
        periode: string,
    ): Promise<FacturationGroupeResult> {
        const factures: FacturationGroupeResult['factures'] = [];
        let montantTotalGroupe = 0;

        for (const membre of membres) {
            try {
                const abonnement = await this.abonnementRepo.findOne({
                    where: { etablissementId: membre.etablissementId, statut: StatutAbonnement.ACTIF },
                });

                if (!abonnement) continue;

                const facture = await this.facturationService.genererFactureMensuelle(abonnement.id);

                factures.push({
                    etablissementId: membre.etablissementId,
                    factureId: facture.id,
                    montant: facture.montantTotal,
                    statut: facture.statut,
                });

                montantTotalGroupe += facture.montantTotal;
            } catch (error) {
                logger.error(
                    `[FacturationGroupe] Erreur facture individuelle — ${membre.etablissementId}:`,
                    error
                );
                factures.push({
                    etablissementId: membre.etablissementId,
                    montant: 0,
                    statut: 'ERREUR',
                });
            }
        }

        return {
            groupeId: groupe.id,
            modele: ModeleFacturationGroupe.INDIVIDUELLE,
            periode,
            factures,
            montantTotalGroupe,
            degressivite: 0,
        };
    }

    /**
     * Modèle CONSOLIDÉE — Une seule facture pour tout le groupe.
     */
    private async facturationConsolidee(
        groupe: GroupeEtablissement,
        membres: ConsommationMembre[],
        periode: string,
        degressivite: number,
    ): Promise<FacturationGroupeResult> {
        const factures: FacturationGroupeResult['factures'] = [];

        // Calculer le montant total avant dégressivité
        const montantAvantReduction = membres.reduce((sum, m) => sum + m.montantTotal, 0);
        const montantApresReduction = this.appliquerDegressivite(montantAvantReduction, degressivite);

        // Répartir le montant réduit au prorata de la consommation de chaque membre
        const totalConsommation = membres.reduce((sum, m) => sum + m.montantTotal, 0);

        // Trouver un abonnement du groupe pour créer la facture consolidée
        const premierMembre = membres[0];
        if (!premierMembre) {
            return {
                groupeId: groupe.id,
                modele: ModeleFacturationGroupe.CONSOLIDEE,
                periode,
                factures: [],
                montantTotalGroupe: 0,
                degressivite,
            };
        }

        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId: premierMembre.etablissementId, statut: StatutAbonnement.ACTIF },
        });

        if (!abonnement) {
            return {
                groupeId: groupe.id,
                modele: ModeleFacturationGroupe.CONSOLIDEE,
                periode,
                factures: [],
                montantTotalGroupe: 0,
                degressivite,
            };
        }

        // Créer la facture consolidée
        const [annee, mois] = periode.split('-').map(Number);
        const dateEmission = new Date(annee, mois - 1, 1);
        const dateEcheance = new Date(annee, mois - 1, 15);

        const lignes: Partial<LigneFacture>[] = membres.map(membre => ({
            description: `${membre.nomEtablissement} — ${membre.nombreEleves} élèves`,
            quantite: 1,
            montant: totalConsommation > 0
                ? Math.round((membre.montantTotal / totalConsommation) * montantApresReduction)
                : 0,
            total: totalConsommation > 0
                ? Math.round((membre.montantTotal / totalConsommation) * montantApresReduction)
                : 0,
            type: TypeLigneFacture.BASE,
        }));

        // Ajouter la ligne de réduction si applicable (Refonte v3 : type REMISE)
        if (degressivite > 0) {
            lignes.push({
                description: `Réduction groupe (${degressivite}%) — ${groupe.nom}`,
                quantite: 1,
                montant: -(montantAvantReduction - montantApresReduction),
                total: -(montantAvantReduction - montantApresReduction),
                type: TypeLigneFacture.REMISE,
            });
        }

        const facture = this.factureRepo.create({
            abonnementId: abonnement.id,
            etablissementId: premierMembre.etablissementId,
            numero: `FAC-GROUP-${groupe.code}-${periode}`,
            dateEmission,
            dateEcheance,
            montantBase: membres.reduce((sum, m) => sum + m.montantBase, 0),
            montantTranches: membres.reduce((sum, m) => sum + m.montantTranches, 0),
            montantOptions: 0,
            montantHT: montantApresReduction,
            montantTVA: Math.round(montantApresReduction * 0.1925),
            tauxTVA: 1925,
            montantTotal: Math.round(montantApresReduction * 1.1925),
            statut: StatutFacture.EMISE,
            notes: `Facture consolidée — Groupe: ${groupe.nom} — ${membres.length} établissements — Dégressivité: ${degressivite}%`,
            lignes,
        });

        const savedFacture = await this.factureRepo.save(facture);

        // Enregistrer les factures membres (pour traçabilité)
        for (const membre of membres) {
            const montantMembre = totalConsommation > 0
                ? Math.round((membre.montantTotal / totalConsommation) * montantApresReduction)
                : 0;

            factures.push({
                etablissementId: membre.etablissementId,
                factureId: savedFacture.id,
                montant: montantMembre,
                statut: 'PARTAGE',
            });
        }

        return {
            groupeId: groupe.id,
            modele: ModeleFacturationGroupe.CONSOLIDEE,
            periode,
            factures,
            montantTotalGroupe: savedFacture.montantTotal,
            degressivite,
        };
    }

    /**
     * Modèle HYBRIDE — Facture de base au groupe + dépassements individuels.
     * Recommandé : chaque membre paie sa part de base + ses dépassements.
     */
    private async facturationHybride(
        groupe: GroupeEtablissement,
        membres: ConsommationMembre[],
        periode: string,
        degressivite: number,
    ): Promise<FacturationGroupeResult> {
        const factures: FacturationGroupeResult['factures'] = [];
        let montantTotalGroupe = 0;

        // 1. Facture de base consolidée (prix de base des plans)
        const montantBaseTotal = membres.reduce((sum, m) => sum + m.montantBase, 0);
        const montantBaseReduit = this.appliquerDegressivite(montantBaseTotal, degressivite);

        // 2. Pour chaque membre : facture individuelle pour les dépassements (tranches + options)
        for (const membre of membres) {
            const depassements = membre.montantTranches + membre.montantOptions;

            if (depassements > 0) {
                try {
                    const abonnement = await this.abonnementRepo.findOne({
                        where: { etablissementId: membre.etablissementId, statut: StatutAbonnement.ACTIF },
                    });

                    if (abonnement) {
                        const facture = await this.facturationService.genererFactureMensuelle(abonnement.id);
                        factures.push({
                            etablissementId: membre.etablissementId,
                            factureId: facture.id,
                            montant: facture.montantTotal,
                            statut: facture.statut,
                        });
                        montantTotalGroupe += facture.montantTotal;
                    }
                } catch (error) {
                    logger.error(
                        `[FacturationGroupe] Erreur dépassements — ${membre.etablissementId}:`,
                        error
                    );
                }
            }

            // Part de base du membre (proportionnelle)
            const partBase = montantBaseTotal > 0
                ? Math.round((membre.montantBase / montantBaseTotal) * montantBaseReduit)
                : 0;

            factures.push({
                etablissementId: membre.etablissementId,
                montant: partBase,
                statut: 'BASE_GROUPE',
            });

            montantTotalGroupe += partBase;
        }

        return {
            groupeId: groupe.id,
            modele: ModeleFacturationGroupe.HYBRIDE,
            periode,
            factures,
            montantTotalGroupe,
            degressivite,
        };
    }

    // =============================================
    // RÉPARTITION
    // =============================================

    /**
     * Répartit une facture consolidée entre les membres du groupe au prorata.
     */
    repartirFactureConsolidee(
        montantTotal: number,
        membres: ConsommationMembre[],
    ): Array<{ etablissementId: string; montant: number; pourcentage: number }> {
        const totalConsommation = membres.reduce((sum, m) => sum + m.montantTotal, 0);

        if (totalConsommation === 0) {
            return membres.map(m => ({
                etablissementId: m.etablissementId,
                montant: 0,
                pourcentage: 0,
            }));
        }

        return membres.map(membre => {
            const pourcentage = (membre.montantTotal / totalConsommation) * 100;
            const montant = Math.round((membre.montantTotal / totalConsommation) * montantTotal);
            return {
                etablissementId: membre.etablissementId,
                montant,
                pourcentage: Math.round(pourcentage * 100) / 100,
            };
        });
    }

    // =============================================
    // STATISTIQUES
    // =============================================

    /**
     * Récupère les statistiques de facturation d'un groupe.
     */
    async getStatistiquesGroupe(groupeId: string): Promise<{
        nombreMembres: number;
        montantTotalMois: number;
        modeleFacturation: string;
        degressivite: number;
        consommationParMembre: ConsommationMembre[];
    }> {
        const liens = await this.lienRepo.count({ where: { groupeId } });
        const periode = new Date().toISOString().slice(0, 7);
        const consommation = await this.calculerConsommationMembres(groupeId, periode);
        const montantTotal = consommation.reduce((sum, m) => sum + m.montantTotal, 0);

        return {
            nombreMembres: liens,
            montantTotalMois: montantTotal,
            modeleFacturation: ModeleFacturationGroupe.HYBRIDE, // Par défaut
            degressivite: this.calculerDegressivite(liens),
            consommationParMembre: consommation,
        };
    }
}

export default FacturationGroupeService;
