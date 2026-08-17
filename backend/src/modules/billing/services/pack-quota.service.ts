/**
 * ==================================
 * eLISAschool - PackQuotaService (Refonte v3.1)
 * ==================================
 * Version: 3.1.0
 * Auteur: franck arlos chendjou
 *
 * Achat de quotas supplémentaires au dépassement :
 *   - CRUD des packs (plateforme)
 *   - Souscription par le tenant (prorata du cycle restant)
 *   - quotaEffectif = plan.quotas[ressource] + Σ packs actifs
 *
 * v3.1 — Prorata basé sur la durée réelle du cycle (dateDebut → dateFin)
 *        au lieu de l'approximation fixe 30 jours.
 *
 * Le quota effectif est la base du middleware requireQuota et de
 * l'affichage des jauges du marché.
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { PackQuota, DureeValiditePack } from '../entities/pack-quota.entity';
import { AbonnementPack } from '../entities/abonnement-pack.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { In } from 'typeorm';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export interface QuotaEffectifResult {
    ressource: string;
    /** Quota du plan (0 = illimité) */
    quotaPlan: number;
    /** Quantité ajoutée par les packs souscrits actifs */
    quotaPacks: number;
    /** Quota total (0 = illimité si quotaPlan = 0) */
    quotaEffectif: number;
}

export class PackQuotaService {
    private packRepo: Repository<PackQuota>;
    private aboPackRepo: Repository<AbonnementPack>;
    private abonnementRepo: Repository<AbonnementClient>;

    constructor() {
        this.packRepo = AppDataSource.getRepository(PackQuota);
        this.aboPackRepo = AppDataSource.getRepository(AbonnementPack);
        this.abonnementRepo = AppDataSource.getRepository(AbonnementClient);
    }

    // =============================================
    // CRUD PACKS (plateforme)
    // =============================================

    async createPack(dto: Partial<PackQuota>): Promise<PackQuota> {
        if (!dto.code || !dto.nom || !dto.ressource || !dto.quantite) {
            throw new AppError('Code, nom, ressource et quantité sont obligatoires', 400, 'VALIDATION_ERROR');
        }
        const existant = await this.packRepo.findOne({ where: { code: dto.code } });
        if (existant) {
            throw new AppError(`Un pack avec le code "${dto.code}" existe déjà`, 409, 'PACK_EXISTS');
        }
        const pack = this.packRepo.create(dto);
        const saved = await this.packRepo.save(pack);
        logger.info(`[Packs] Pack créé : ${saved.code} (+${saved.quantite} ${saved.ressource})`);
        return saved;
    }

    async findAllPacks(filters?: { ressource?: string; actif?: boolean }): Promise<PackQuota[]> {
        const where: Record<string, unknown> = {};
        if (filters?.ressource) where.ressource = filters.ressource;
        if (filters?.actif !== undefined) where.actif = filters.actif;
        return this.packRepo.find({ where, order: { ordre: 'ASC' } });
    }

    async findOnePack(id: string): Promise<PackQuota> {
        const pack = await this.packRepo.findOne({ where: { id } });
        if (!pack) throw new AppError('Pack introuvable', 404, 'NOT_FOUND');
        return pack;
    }

    async updatePack(id: string, dto: Partial<PackQuota>): Promise<PackQuota> {
        const pack = await this.findOnePack(id);
        Object.assign(pack, dto);
        return this.packRepo.save(pack);
    }

    async deletePack(id: string): Promise<void> {
        const pack = await this.findOnePack(id);
        const souscrits = await this.aboPackRepo.count({ where: { packId: id, actif: true } });
        if (souscrits > 0) {
            throw new AppError('Ce pack est souscrit par des abonnements — désactivez-le au lieu de le supprimer', 409, 'PACK_SOUSCRIT');
        }
        await this.packRepo.remove(pack);
        logger.info(`[Packs] Pack supprimé : ${pack.code}`);
    }

    // =============================================
    // SOUSCRIPTION (tenant)
    // =============================================

    /**
     * Souscrit un pack pour l'abonnement actif du tenant.
     * Facturation au prorata du cycle restant (durée restante / durée cycle).
     */
    async souscrirePack(etablissementId: string, packId: string): Promise<AbonnementPack> {
        const pack = await this.findOnePack(packId);
        if (!pack.actif) {
            throw new AppError('Ce pack n\'est plus disponible', 400, 'PACK_INACTIF');
        }

        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
            order: { createdAt: 'DESC' },
        });
        if (!abonnement) {
            throw new AppError('Un abonnement actif est requis pour acheter des quotas', 402, 'AUCUN_PLAN_ACTIF');
        }

        // Prorata : jours restants du cycle / durée réelle du cycle
        const now = new Date();
        const dateDebut = new Date(abonnement.dateDebut);
        const dateFin = new Date(abonnement.dateFin);
        const joursRestants = Math.max(0, Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        // Durée réelle du cycle en jours (dateDebut → dateFin)
        const dureeCycleJours = Math.max(1, Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)));
        const prorata = pack.dureeValidite === DureeValiditePack.CYCLE_COURANT
            ? Math.min(1, joursRestants / dureeCycleJours)
            : 1;
        const montantFacture = Math.round(Number(pack.prix) * prorata * 100) / 100;

        const souscription = this.aboPackRepo.create({
            abonnementId: abonnement.id,
            packId: pack.id,
            dateSouscription: now,
            dateFin: pack.dureeValidite === DureeValiditePack.CYCLE_COURANT ? abonnement.dateFin : undefined,
            montantFacture,
            actif: true,
        });
        const saved = await this.aboPackRepo.save(souscription);

        logger.info(`[Packs] Pack ${pack.code} souscrit par tenant ${etablissementId} (prorata ${Math.round(prorata * 100)}%, montant ${montantFacture})`);
        return saved;
    }

    /** Packs souscrits actifs d'un abonnement */
    async getPacksSouscrits(abonnementId: string): Promise<AbonnementPack[]> {
        return this.aboPackRepo.find({
            where: { abonnementId, actif: true },
            relations: ['pack'],
        });
    }

    async desouscrirePack(souscriptionId: string): Promise<void> {
        const souscription = await this.aboPackRepo.findOne({ where: { id: souscriptionId } });
        if (!souscription) throw new AppError('Souscription introuvable', 404, 'NOT_FOUND');
        souscription.actif = false;
        await this.aboPackRepo.save(souscription);
    }

    // =============================================
    // QUOTA EFFECTIF
    // =============================================

    /**
     * Quota effectif d'une ressource pour un établissement :
     * plan.quotas[ressource] + Σ quantités des packs actifs.
     * Retourne 0 = illimité si le plan l'indique.
     */
    async quotaEffectif(etablissementId: string, ressource: string): Promise<QuotaEffectifResult> {
        const abonnement = await this.abonnementRepo.findOne({
            where: { etablissementId, statut: In([StatutAbonnement.ACTIF, StatutAbonnement.ESSAI]) },
            relations: ['plan'],
            order: { createdAt: 'DESC' },
        });

        const quotaPlan = abonnement?.plan?.quotas?.[ressource] ?? 0;
        if (quotaPlan === 0) {
            return { ressource, quotaPlan: 0, quotaPacks: 0, quotaEffectif: 0 };
        }

        let quotaPacks = 0;
        if (abonnement) {
            const souscriptions = await this.getPacksSouscrits(abonnement.id);
            const now = new Date();
            for (const s of souscriptions) {
                if (s.pack?.ressource !== ressource) continue;
                if (s.dateFin && new Date(s.dateFin) < now) continue;
                quotaPacks += s.pack.quantite;
            }
        }

        return { ressource, quotaPlan, quotaPacks, quotaEffectif: quotaPlan + quotaPacks };
    }
}

export const packQuotaService = new PackQuotaService();
export default PackQuotaService;
