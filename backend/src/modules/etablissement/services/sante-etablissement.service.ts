/**
 * ==================================
 * eLISAschool - Service Santé Établissements
 * ==================================
 * Version: 1.0.0
 * Auteur: franck arlos chendjou
 *
 * Score composite pondéré 0-100 par établissement.
 * 4 critères : abonnement (30%), paiements (25%), activité (25%), modules (20%).
 * Cache in-memory TTL 5 min.
 *
 * Refonte Santé Établissements v1.0
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { logger } from '@common/utils/logger.util';
import { StatutAbonnement } from '@modules/billing/entities/abonnement-client.entity';
import { StatutFacture } from '@modules/billing/entities/facture.entity';

// =============================================
// Types
// =============================================

export type CategorieSante = 'sain' | 'attention' | 'critique';

export type PrioriteRecommandation = 'haute' | 'moyenne' | 'basse';

export interface RecommandationSante {
    critere: 'abonnement' | 'paiements' | 'activite' | 'modules';
    priorite: PrioriteRecommandation;
    titre: string;
    description: string;
    action: string;
}

export interface SanteDetailCritere {
    score: number;      // 0-100
    poids: number;      // 0-1 (ex: 0.30)
}

export interface SanteDetailAbonnement extends SanteDetailCritere {
    statut: string;
}

export interface SanteDetailPaiements extends SanteDetailCritere {
    payees: number;
    total: number;
    tauxRecouvrement: number; // 0-100
}

export interface SanteDetailActivite extends SanteDetailCritere {
    elevesActifs: number;
    effectifMax: number;
    connexions30j: number;
    totalUtilisateurs: number;
}

export interface SanteDetailModules extends SanteDetailCritere {
    actifs: number;
    disponibles: number;
}

export interface SanteDetails {
    abonnement: SanteDetailAbonnement;
    paiements: SanteDetailPaiements;
    activite: SanteDetailActivite;
    modules: SanteDetailModules;
}

export interface SanteEtablissementResult {
    etablissementId: string;
    nomEtablissement: string;
    score: number;              // 0-100
    categorie: CategorieSante;
    details: SanteDetails;
    recommandations: RecommandationSante[];
}

export interface ResumeSante {
    sains: number;
    attention: number;
    critiques: number;
    scoreMoyen: number;
    total: number;
}

// =============================================
// Constantes
// =============================================

/** Poids des critères dans le score composite */
const POIDS = {
    ABONNEMENT: 0.30,
    PAIEMENTS: 0.25,
    ACTIVITE: 0.25,
    MODULES: 0.20,
} as const;

/** Nombre total de modules optionnels disponibles (approximation) */
const MODULES_DISPONIBLES = 15;

/** Seuil de score par catégorie */
const SEUILS = {
    SAIN: 75,
    ATTENTION: 40,
} as const;

// =============================================
// Service
// =============================================

export class SanteEtablissementService {
    private etablissementRepo: Repository<any>;
    private abonnementRepo: Repository<any>;
    private factureRepo: Repository<any>;
    private eleveRepo: Repository<any>;
    private utilisateurRepo: Repository<any>;
    private parametreRepo: Repository<any>;

    // Cache in-memory — TTL 5 min
    private cacheScores: { value: SanteEtablissementResult[]; timestamp: number } | null = null;
    private cacheResume: { value: ResumeSante; timestamp: number } | null = null;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.etablissementRepo = AppDataSource.getRepository('Etablissement');
        this.abonnementRepo = AppDataSource.getRepository('AbonnementClient');
        this.factureRepo = AppDataSource.getRepository('Facture');
        this.eleveRepo = AppDataSource.getRepository('Eleve');
        this.utilisateurRepo = AppDataSource.getRepository('Utilisateur');
        this.parametreRepo = AppDataSource.getRepository('ParametreSysteme');
    }

    // ==================================
    // Calcul individuel
    // ==================================

    /**
     * Calcule le score de santé d'un établissement unique.
     */
    async calculerScoreEtablissement(etablissementId: string): Promise<SanteEtablissementResult | null> {
        const etablissement = await this.etablissementRepo.findOne({
            where: { id: etablissementId },
            select: ['id', 'nom', 'effectifMax'],
        });

        if (!etablissement) return null;

        const [abonnement, paiements, activite, modules] = await Promise.all([
            this.calculerScoreAbonnement(etablissementId),
            this.calculerScorePaiements(etablissementId),
            this.calculerScoreActivite(etablissementId, etablissement.effectifMax),
            this.calculerScoreModules(etablissementId),
        ]);

        const score = Math.round(
            abonnement.score * POIDS.ABONNEMENT +
            paiements.score * POIDS.PAIEMENTS +
            activite.score * POIDS.ACTIVITE +
            modules.score * POIDS.MODULES
        );

        return {
            etablissementId,
            nomEtablissement: etablissement.nom,
            score,
            categorie: this.determinerCategorie(score),
            details: {
                abonnement: { ...abonnement, poids: POIDS.ABONNEMENT },
                paiements: { ...paiements, poids: POIDS.PAIEMENTS },
                activite: { ...activite, poids: POIDS.ACTIVITE },
                modules: { ...modules, poids: POIDS.MODULES },
            },
            recommandations: this.genererRecommandations({
                abonnement: { ...abonnement, poids: POIDS.ABONNEMENT },
                paiements: { ...paiements, poids: POIDS.PAIEMENTS },
                activite: { ...activite, poids: POIDS.ACTIVITE },
                modules: { ...modules, poids: POIDS.MODULES },
            }),
        };
    }

    // ==================================
    // Calcul batch (tous les établissements)
    // ==================================

    /**
     * Calcule les scores de tous les établissements (batch optimisé).
     * Résultat mis en cache TTL 5 min.
     */
    async calculerScoresTous(): Promise<SanteEtablissementResult[]> {
        // Vérifier cache
        if (this.cacheScores && Date.now() - this.cacheScores.timestamp < this.CACHE_TTL) {
            return this.cacheScores.value;
        }

        const etablissements = await this.etablissementRepo.find({
            select: ['id', 'nom', 'effectifMax'],
        });

        if (etablissements.length === 0) {
            return [];
        }

        // Requêtes agrégées en parallèle (évite N+1)
        const etabIds = etablissements.map(e => e.id);

        const [abonnementsMap, facturesMap, elevesMap, connexionsMap, modulesMap] = await Promise.all([
            this.getAbonnementsParEtablissement(etabIds),
            this.getFacturesParEtablissement(etabIds),
            this.getElevesActifsParEtablissement(etabIds),
            this.getConnexions30jParEtablissement(etabIds),
            this.getModulesActifsParEtablissement(etabIds),
        ]);

        const resultats: SanteEtablissementResult[] = etablissements.map(etab => {
            const id = etab.id;

            // Abonnement
            const statutAbo = abonnementsMap.get(id) || 'ANNULE';
            const scoreAbo = this.scoreAbonnementStatut(statutAbo);

            // Paiements
            const factures = facturesMap.get(id) || { payees: 0, total: 0 };
            const scorePay = this.scorePaiements(factures.payees, factures.total);
            const tauxRecouvrement = factures.total > 0
                ? Math.round((factures.payees / factures.total) * 100)
                : 50;

            // Activité
            const elevesActifs = elevesMap.get(id) || 0;
            const connexions30j = connexionsMap.get(id) || 0;
            const totalUsers = 1; // au moins 1 pour éviter division par 0
            const scoreAct = this.scoreActivite(elevesActifs, etab.effectifMax || 1, connexions30j, totalUsers);

            // Modules
            const modulesActifs = modulesMap.get(id) || 0;
            const scoreMod = this.scoreModules(modulesActifs, MODULES_DISPONIBLES);

            // Score composite
            const score = Math.round(
                scoreAbo * POIDS.ABONNEMENT +
                scorePay * POIDS.PAIEMENTS +
                scoreAct * POIDS.ACTIVITE +
                scoreMod * POIDS.MODULES
            );

            const details: SanteDetails = {
                abonnement: { score: scoreAbo, poids: POIDS.ABONNEMENT, statut: statutAbo },
                paiements: {
                    score: scorePay, poids: POIDS.PAIEMENTS,
                    payees: factures.payees, total: factures.total,
                    tauxRecouvrement,
                },
                activite: {
                    score: scoreAct, poids: POIDS.ACTIVITE,
                    elevesActifs, effectifMax: etab.effectifMax || 0,
                    connexions30j, totalUtilisateurs: totalUsers,
                },
                modules: {
                    score: scoreMod, poids: POIDS.MODULES,
                    actifs: modulesActifs, disponibles: MODULES_DISPONIBLES,
                },
            };

            return {
                etablissementId: id,
                nomEtablissement: etab.nom,
                score,
                categorie: this.determinerCategorie(score),
                details,
                recommandations: this.genererRecommandations(details),
            };
        });

        // Mettre en cache
        this.cacheScores = { value: resultats, timestamp: Date.now() };
        logger.info('[Sante] Scores calculés', { total: resultats.length });

        return resultats;
    }

    // ==================================
    // Résumé agrégé
    // ==================================

    /**
     * Résumé santé : nombre d'établissements par catégorie + score moyen.
     */
    async getResumeSante(): Promise<ResumeSante> {
        // Vérifier cache
        if (this.cacheResume && Date.now() - this.cacheResume.timestamp < this.CACHE_TTL) {
            return this.cacheResume.value;
        }

        const scores = await this.calculerScoresTous();

        const sains = scores.filter(s => s.categorie === 'sain').length;
        const attention = scores.filter(s => s.categorie === 'attention').length;
        const critiques = scores.filter(s => s.categorie === 'critique').length;
        const scoreMoyen = scores.length > 0
            ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
            : 0;

        const resume: ResumeSante = {
            sains,
            attention,
            critiques,
            scoreMoyen,
            total: scores.length,
        };

        this.cacheResume = { value: resume, timestamp: Date.now() };
        return resume;
    }

    // ==================================
    // Helpers — Calcul scores individuels
    // ==================================

    /**
     * Score abonnement basé sur le statut.
     */
    private scoreAbonnementStatut(statut: string): number {
        switch (statut) {
            case StatutAbonnement.ACTIF: return 100;
            case StatutAbonnement.EN_ATTENTE: return 50;
            case StatutAbonnement.EXPIRE: return 20;
            case StatutAbonnement.SUSPENDU: return 0;
            case StatutAbonnement.ANNULE: return 0;
            default: return 0;
        }
    }

    /**
     * Score paiements — basé sur le taux de recouvrement.
     * Pas de factures = 50 (neutre, on ne pénalise pas).
     */
    private scorePaiements(payees: number, total: number): number {
        if (total === 0) return 50;
        return Math.round((payees / total) * 100);
    }

    /**
     * Score activité — combinaison élèves actifs et connexions récentes.
     * 50% effectif, 50% connexions.
     */
    private scoreActivite(elevesActifs: number, effectifMax: number, connexions30j: number, totalUsers: number): number {
        const ratioEleves = effectifMax > 0 ? Math.min(elevesActifs / effectifMax, 1) : 0;
        const ratioConnexions = totalUsers > 0 ? Math.min(connexions30j / totalUsers, 1) : 0;
        return Math.round(ratioEleves * 50 + ratioConnexions * 50);
    }

    /**
     * Score modules — ratio modules actifs / disponibles.
     */
    private scoreModules(actifs: number, disponibles: number): number {
        if (disponibles === 0) return 50;
        return Math.round((actifs / disponibles) * 100);
    }

    /**
     * Détermine la catégorie de santé à partir du score.
     */
    private determinerCategorie(score: number): CategorieSante {
        if (score >= SEUILS.SAIN) return 'sain';
        if (score >= SEUILS.ATTENTION) return 'attention';
        return 'critique';
    }

    // ==================================
    // Helpers — Requêtes agrégées batch
    // ==================================

    /**
     * Statut abonnement le plus récent par établissement.
     */
    private async getAbonnementsParEtablissement(etabIds: string[]): Promise<Map<string, string>> {
        const results = await this.abonnementRepo
            .createQueryBuilder('a')
            .select('a.etablissementId', 'etablissementId')
            .addSelect('a.statut', 'statut')
            .addSelect('MAX(a.createdAt)', 'dernier')
            .where('a.etablissementId IN (:...ids)', { ids: etabIds })
            .groupBy('a.etablissementId')
            .addGroupBy('a.statut')
            .orderBy('dernier', 'DESC')
            .getRawMany();

        // Prendre le statut le plus récent par établissement
        const map = new Map<string, string>();
        for (const row of results) {
            if (!map.has(row.etablissementId)) {
                map.set(row.etablissementId, row.statut);
            }
        }
        return map;
    }

    /**
     * Nombre de factures payées vs total par établissement.
     */
    private async getFacturesParEtablissement(etabIds: string[]): Promise<Map<string, { payees: number; total: number }>> {
        const results = await this.factureRepo
            .createQueryBuilder('f')
            .select('f.etablissementId', 'etablissementId')
            .addSelect('COUNT(*)', 'total')
            .addSelect(`COUNT(*) FILTER (WHERE f.statut = '${StatutFacture.PAYEE}')`, 'payees')
            .where('f.etablissementId IN (:...ids)', { ids: etabIds })
            .andWhere('f.statut != :annulee', { annulee: StatutFacture.ANNULEE })
            .andWhere('f.statut != :brouillon', { brouillon: StatutFacture.BROUILLON })
            .groupBy('f.etablissementId')
            .getRawMany();

        const map = new Map<string, { payees: number; total: number }>();
        for (const row of results) {
            map.set(row.etablissementId, {
                payees: parseInt(row.payees, 10),
                total: parseInt(row.total, 10),
            });
        }
        return map;
    }

    /**
     * Nombre d'élèves actifs par établissement.
     */
    private async getElevesActifsParEtablissement(etabIds: string[]): Promise<Map<string, number>> {
        const results = await this.eleveRepo
            .createQueryBuilder('e')
            .select('e.etablissementId', 'etablissementId')
            .addSelect('COUNT(*)', 'count')
            .where('e.etablissementId IN (:...ids)', { ids: etabIds })
            .andWhere('e.statut = :actif', { actif: 'ACTIF' })
            .groupBy('e.etablissementId')
            .getRawMany();

        const map = new Map<string, number>();
        for (const row of results) {
            map.set(row.etablissementId, parseInt(row.count, 10));
        }
        return map;
    }

    /**
     * Nombre d'utilisateurs avec connexion dans les 30 derniers jours par établissement.
     */
    private async getConnexions30jParEtablissement(etabIds: string[]): Promise<Map<string, number>> {
        const date30j = new Date();
        date30j.setDate(date30j.getDate() - 30);

        const results = await this.utilisateurRepo
            .createQueryBuilder('u')
            .select('ue.etablissementId', 'etablissementId')
            .addSelect('COUNT(DISTINCT u.id)', 'count')
            .innerJoin('utilisateur_etablissements', 'ue', 'ue.utilisateurId = u.id')
            .where('ue.etablissementId IN (:...ids)', { ids: etabIds })
            .andWhere('u.derniereConnexion >= :date30j', { date30j: date30j.toISOString() })
            .groupBy('ue.etablissementId')
            .getRawMany();

        const map = new Map<string, number>();
        for (const row of results) {
            map.set(row.etablissementId, parseInt(row.count, 10));
        }
        return map;
    }

    /**
     * Nombre de modules actifs par établissement (via ParametreSysteme).
     */
    private async getModulesActifsParEtablissement(etabIds: string[]): Promise<Map<string, number>> {
        const results = await this.parametreRepo
            .createQueryBuilder('p')
            .select('p.etablissementId', 'etablissementId')
            .addSelect('COUNT(*)', 'count')
            .where('p.etablissementId IN (:...ids)', { ids: etabIds })
            .andWhere('p.cle LIKE :pattern', { pattern: 'modules.%.actif' })
            .andWhere('p.valeur = :actif', { actif: 'true' })
            .groupBy('p.etablissementId')
            .getRawMany();

        const map = new Map<string, number>();
        for (const row of results) {
            map.set(row.etablissementId, parseInt(row.count, 10));
        }
        return map;
    }

    // ==================================
    // Score abonnement individuel (non-batch)
    // ==================================

    private async calculerScoreAbonnement(etablissementId: string): Promise<{ score: number; statut: string }> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId },
            select: ['statut'],
            order: { createdAt: 'DESC' },
        });
        const statut = abonnement?.statut || 'ANNULE';
        return { score: this.scoreAbonnementStatut(statut), statut };
    }

    private async calculerScorePaiements(etablissementId: string): Promise<{ score: number; payees: number; total: number; tauxRecouvrement: number }> {
        const result = await this.factureRepo
            .createQueryBuilder('f')
            .select('COUNT(*)', 'total')
            .addSelect(`COUNT(*) FILTER (WHERE f.statut = '${StatutFacture.PAYEE}')`, 'payees')
            .where('f.etablissementId = :id', { id: etablissementId })
            .andWhere('f.statut != :annulee', { annulee: StatutFacture.ANNULEE })
            .andWhere('f.statut != :brouillon', { brouillon: StatutFacture.BROUILLON })
            .getRawOne();

        const payees = parseInt(result?.payees || '0', 10);
        const total = parseInt(result?.total || '0', 10);
        const tauxRecouvrement = total > 0 ? Math.round((payees / total) * 100) : 50;

        return { score: this.scorePaiements(payees, total), payees, total, tauxRecouvrement };
    }

    private async calculerScoreActivite(etablissementId: string, effectifMax?: number): Promise<{ score: number; elevesActifs: number; effectifMax: number; connexions30j: number; totalUtilisateurs: number }> {
        const elevesActifs = await this.eleveRepo.count({
            where: { etablissementId, statut: 'ACTIF' },
        });

        const date30j = new Date();
        date30j.setDate(date30j.getDate() - 30);

        const connexionsResult = await this.utilisateurRepo
            .createQueryBuilder('u')
            .innerJoin('utilisateur_etablissements', 'ue', 'ue.utilisateurId = u.id')
            .where('ue.etablissementId = :id', { id: etablissementId })
            .andWhere('u.derniereConnexion >= :date30j', { date30j: date30j.toISOString() })
            .getCount();

        const totalUsers = await this.utilisateurRepo
            .createQueryBuilder('u')
            .innerJoin('utilisateur_etablissements', 'ue', 'ue.utilisateurId = u.id')
            .where('ue.etablissementId = :id', { id: etablissementId })
            .getCount();

        return {
            score: this.scoreActivite(elevesActifs, effectifMax || 1, connexionsResult, totalUsers || 1),
            elevesActifs,
            effectifMax: effectifMax || 0,
            connexions30j: connexionsResult,
            totalUtilisateurs: totalUsers,
        };
    }

    private async calculerScoreModules(etablissementId: string): Promise<{ score: number; actifs: number; disponibles: number }> {
        const actifs = await this.parametreRepo
            .createQueryBuilder('p')
            .where('p.etablissementId = :id', { id: etablissementId })
            .andWhere('p.cle LIKE :pattern', { pattern: 'modules.%.actif' })
            .andWhere('p.valeur = :actif', { actif: 'true' })
            .getCount();

        return { score: this.scoreModules(actifs, MODULES_DISPONIBLES), actifs, disponibles: MODULES_DISPONIBLES };
    }

    // ==================================
    // Recommandations intelligentes
    // ==================================

    /**
     * Génère des recommandations personnalisées basées sur l'analyse des 4 critères.
     * Triées par priorité (haute → basse), max 5 recommandations.
     */
    private genererRecommandations(details: SanteDetails): RecommandationSante[] {
        const recos: RecommandationSante[] = [];

        // --- Abonnement ---
        if (details.abonnement.score <= 20) {
            recos.push({
                critere: 'abonnement',
                priorite: 'haute',
                titre: 'Abonnement expiré ou suspendu',
                description: 'L\'abonnement de cet établissement est inactif. Toutes les fonctionnalités sont bloquées.',
                action: 'Contacter l\'établissement pour renouveler l\'abonnement ou mettre à jour le plan.',
            });
        } else if (details.abonnement.score <= 50) {
            recos.push({
                critere: 'abonnement',
                priorite: 'moyenne',
                titre: 'Abonnement en attente',
                description: 'L\'abonnement est en cours de validation ou d\'expiration.',
                action: 'Vérifier le statut de paiement et confirmer l\'abonnement.',
            });
        }

        // --- Paiements ---
        if (details.paiements.tauxRecouvrement < 50 && details.paiements.total > 0) {
            recos.push({
                critere: 'paiements',
                priorite: 'haute',
                titre: 'Taux de recouvrement faible',
                description: `Seulement ${details.paiements.tauxRecouvrement}% des factures sont payées (${details.paiements.payees}/${details.paiements.total}).`,
                action: 'Relancer les paiements en attente et proposer un échéancier.',
            });
        } else if (details.paiements.tauxRecouvrement < 80 && details.paiements.total > 2) {
            recos.push({
                critere: 'paiements',
                priorite: 'moyenne',
                titre: 'Paiements partiels',
                description: `Le taux de recouvrement est de ${details.paiements.tauxRecouvrement}%. Objectif recommandé : 80%.`,
                action: 'Identifier les factures en retard et envoyer des rappels.',
            });
        }

        // --- Activité ---
        if (details.activite.score < 30) {
            recos.push({
                critere: 'activite',
                priorite: 'haute',
                titre: 'Activité très faible',
                description: `Seulement ${details.activite.elevesActifs} élèves actifs et ${details.activite.connexions30j} connexions récentes.`,
                action: 'Contacter l\'établissement pour comprendre la faible utilisation et proposer un accompagnement.',
            });
        } else if (details.activite.score < 60) {
            if (details.activite.elevesActifs < (details.activite.effectifMax * 0.3)) {
                recos.push({
                    critere: 'activite',
                    priorite: 'moyenne',
                    titre: 'Effectif sous-utilisé',
                    description: `Seulement ${details.activite.elevesActifs} élèves actifs sur ${details.activite.effectifMax} places configurées.`,
                    action: 'Proposer un module d\'inscription en ligne pour faciliter l\'intégration des élèves.',
                });
            }
            if (details.activite.connexions30j < 10) {
                recos.push({
                    critere: 'activite',
                    priorite: 'moyenne',
                    titre: 'Faible engagement utilisateur',
                    description: `Moins de 10 connexions uniques dans les 30 derniers jours.`,
                    action: 'Organiser une session de formation ou envoyer un guide de démarrage rapide.',
                });
            }
        }

        // --- Modules ---
        if (details.modules.actifs <= 2) {
            recos.push({
                critere: 'modules',
                priorite: 'moyenne',
                titre: 'Très peu de modules actifs',
                description: `Seulement ${details.modules.actifs} module(s) actif(s) sur ${details.modules.disponibles} disponibles.`,
                action: 'Présenter les modules clés (notes, bulletins, cantine) et proposer un accompagnement à l\'activation.',
            });
        } else if (details.modules.actifs < Math.ceil(details.modules.disponibles * 0.4)) {
            recos.push({
                critere: 'modules',
                priorite: 'basse',
                titre: 'Modules sous-utilisés',
                description: `${details.modules.actifs} modules actifs sur ${details.modules.disponibles}. Potentiel d'expansion non exploité.`,
                action: 'Suggérer les modules les plus pertinents selon le profil de l\'établissement.',
            });
        }

        // Tri par priorité (haute > moyenne > basse)
        const prioriteOrdre: Record<PrioriteRecommandation, number> = { haute: 0, moyenne: 1, basse: 2 };
        recos.sort((a, b) => prioriteOrdre[a.priorite] - prioriteOrdre[b.priorite]);

        return recos.slice(0, 5);
    }

    // ==================================
    // Invalidation cache
    // ==================================

    /**
     * Invalide tous les caches santé.
     */
    invalidateCache(): void {
        this.cacheScores = null;
        this.cacheResume = null;
    }
}

// Singleton
export const santeEtablissementService = new SanteEtablissementService();
