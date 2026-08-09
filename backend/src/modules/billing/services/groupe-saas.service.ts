/**
 * ==================================
 * eLISAschool - Service GroupeSaaS
 * ==================================
 * 
 * Gestion des groupes d'établissements SaaS :
 *   - CRUD groupes (nom, description, code, actif)
 *   - Gestion des membres (ajout/retrait établissements)
 *   - Configuration SaaS par groupe (modules, tranches, abonnement)
 * 
 * Lot C v7 — Refonte SaaS
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { TrancheGroupe } from '../entities/tranche-groupe.entity';
import { AbonnementGroupe, StatutAbonnementGroupe, ModeFacturationGroupe, RepartitionFacturation } from '../entities/abonnement-groupe.entity';
import { ModuleCatalogue } from '../entities/module-catalogue.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';

export class GroupeSaaSService {
    private groupeRepo: Repository<GroupeEtablissement>;
    private lienRepo: Repository<GroupeEtablissementLien>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private trancheGroupeRepo: Repository<TrancheGroupe>;
    private abonnementGroupeRepo: Repository<AbonnementGroupe>;
    private moduleCatalogueRepo: Repository<ModuleCatalogue>;
    private planRepo: Repository<PlanAbonnement>;

    constructor() {
        this.groupeRepo = AppDataSource.getRepository(GroupeEtablissement);
        this.lienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.trancheGroupeRepo = AppDataSource.getRepository(TrancheGroupe);
        this.abonnementGroupeRepo = AppDataSource.getRepository(AbonnementGroupe);
        this.moduleCatalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
    }

    // ─── CRUD Groupes ─────────────────────────────────────────────

    async createGroupe(data: {
        nom: string;
        description?: string;
        code: string;
        proprietaireId: string;
    }): Promise<GroupeEtablissement> {
        // Vérifier unicité du code
        const existing = await this.groupeRepo.findOne({ where: { code: data.code } });
        if (existing) {
            throw new AppError(`Un groupe avec le code '${data.code}' existe déjà`, 409, 'GROUPE_CODE_EXISTS');
        }

        const groupe = this.groupeRepo.create({
            nom: data.nom,
            description: data.description,
            code: data.code,
            proprietaireId: data.proprietaireId,
            actif: true,
        });

        await this.groupeRepo.save(groupe);
        logger.info(`[GroupeSaaS] Groupe créé: ${groupe.nom} (${groupe.code})`);
        return groupe;
    }

    async getGroupe(groupeId: string): Promise<GroupeEtablissement> {
        const groupe = await this.groupeRepo.findOne({
            where: { id: groupeId },
            relations: ['etablissements', 'etablissements.etablissement'],
        });
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'GROUPE_NOT_FOUND');
        }
        return groupe;
    }

    async getAllGroupes(): Promise<GroupeEtablissement[]> {
        return this.groupeRepo.find({
            relations: ['etablissements', 'etablissements.etablissement'],
            order: { nom: 'ASC' },
        });
    }

    async updateGroupe(groupeId: string, data: Partial<{
        nom: string;
        description: string;
        actif: boolean;
    }>): Promise<GroupeEtablissement> {
        const groupe = await this.getGroupe(groupeId);
        Object.assign(groupe, data);
        await this.groupeRepo.save(groupe);
        logger.info(`[GroupeSaaS] Groupe mis à jour: ${groupe.id}`);
        return groupe;
    }

    async deleteGroupe(groupeId: string): Promise<void> {
        const groupe = await this.getGroupe(groupeId);
        await this.groupeRepo.remove(groupe);
        logger.info(`[GroupeSaaS] Groupe supprimé: ${groupe.id}`);
    }

    // ─── Membres du groupe ─────────────────────────────────────────

    async addMembre(groupeId: string, etablissementId: string, ajoutePar?: string): Promise<GroupeEtablissementLien> {
        // Vérifier que le groupe existe
        await this.getGroupe(groupeId);

        // Vérifier que le lien n'existe pas déjà
        const existing = await this.lienRepo.findOne({
            where: { groupeId, etablissementId },
        });
        if (existing) {
            throw new AppError('Cet établissement est déjà membre du groupe', 409, 'MEMBRE_ALREADY_EXISTS');
        }

        const lien = this.lienRepo.create({
            groupeId,
            etablissementId,
            ajoutePar,
        });

        await this.lienRepo.save(lien);
        logger.info(`[GroupeSaaS] Membre ajouté au groupe ${groupeId}: ${etablissementId}`);
        return lien;
    }

    async removeMembre(groupeId: string, etablissementId: string): Promise<void> {
        const lien = await this.lienRepo.findOne({
            where: { groupeId, etablissementId },
        });
        if (!lien) {
            throw new AppError('Membre non trouvé dans ce groupe', 404, 'MEMBRE_NOT_FOUND');
        }
        await this.lienRepo.remove(lien);
        logger.info(`[GroupeSaaS] Membre retiré du groupe ${groupeId}: ${etablissementId}`);
    }

    // ─── Modules groupe ────────────────────────────────────────────

    async getModulesGroupe(groupeId: string): Promise<ModulesGroupe[]> {
        return this.modulesGroupeRepo.find({
            where: { groupeEtablissementId: groupeId },
            relations: ['module'],
            order: { module: { ordre: 'ASC' } },
        });
    }

    async setModuleGroupe(groupeId: string, moduleCatalogueId: string, actif: boolean, creePar?: string): Promise<ModulesGroupe> {
        // Vérifier que le module existe
        const module = await this.moduleCatalogueRepo.findOne({ where: { id: moduleCatalogueId } });
        if (!module) {
            throw new AppError('Module non trouvé', 404, 'MODULE_NOT_FOUND');
        }

        // Upsert
        let mg = await this.modulesGroupeRepo.findOne({
            where: { groupeEtablissementId: groupeId, moduleCatalogueId },
        });
        if (mg) {
            mg.actif = actif;
        } else {
            mg = this.modulesGroupeRepo.create({
                groupeEtablissementId: groupeId,
                moduleCatalogueId,
                actif,
                creePar,
            });
        }
        await this.modulesGroupeRepo.save(mg);
        return mg;
    }

    // ─── Tranches groupe ───────────────────────────────────────────

    async getTranchesGroupe(groupeId: string): Promise<TrancheGroupe[]> {
        return this.trancheGroupeRepo.find({
            where: { groupeEtablissementId: groupeId, actif: true },
            order: { ordre: 'ASC' },
        });
    }

    async setTranchesGroupe(groupeId: string, tranches: Array<{
        ordre: number;
        minEleves: number;
        maxEleves?: number;
        montantSupplementaire: number;
        label?: string;
    }>): Promise<TrancheGroupe[]> {
        // Supprimer les tranches existantes
        await this.trancheGroupeRepo.delete({ groupeEtablissementId: groupeId });

        // Créer les nouvelles
        const entities = tranches.map(t => this.trancheGroupeRepo.create({
            groupeEtablissementId: groupeId,
            ordre: t.ordre,
            minEleves: t.minEleves,
            maxEleves: t.maxEleves ?? null,
            montantSupplementaire: t.montantSupplementaire,
            label: t.label,
            actif: true,
        }));

        await this.trancheGroupeRepo.save(entities);
        logger.info(`[GroupeSaaS] Tranches groupe mises à jour: ${groupeId} (${tranches.length} tranches)`);
        return entities;
    }

    // ─── Abonnement groupe ─────────────────────────────────────────

    async getAbonnementGroupe(groupeId: string): Promise<AbonnementGroupe | null> {
        return this.abonnementGroupeRepo.findOne({
            where: { groupeEtablissementId: groupeId },
            relations: ['plan'],
        });
    }

    async setAbonnementGroupe(groupeId: string, data: {
        planId: string;
        modeFacturation?: ModeFacturationGroupe;
        repartitionFacturation?: RepartitionFacturation;
        tarifDegressif?: Record<string, number>;
        dateDebut?: Date;
        dateFin?: Date;
        creePar?: string;
    }): Promise<AbonnementGroupe> {
        // Vérifier que le plan existe
        const plan = await this.planRepo.findOne({ where: { id: data.planId } });
        if (!plan) {
            throw new AppError('Plan non trouvé', 404, 'PLAN_NOT_FOUND');
        }

        // Upsert
        let ab = await this.abonnementGroupeRepo.findOne({
            where: { groupeEtablissementId: groupeId },
        });
        if (ab) {
            Object.assign(ab, {
                planId: data.planId,
                modeFacturation: data.modeFacturation ?? ab.modeFacturation,
                repartitionFacturation: data.repartitionFacturation ?? ab.repartitionFacturation,
                tarifDegressif: data.tarifDegressif ?? ab.tarifDegressif,
                dateDebut: data.dateDebut ?? ab.dateDebut,
                dateFin: data.dateFin ?? ab.dateFin,
                statut: StatutAbonnementGroupe.ACTIF,
            });
        } else {
            ab = this.abonnementGroupeRepo.create({
                groupeEtablissementId: groupeId,
                planId: data.planId,
                modeFacturation: data.modeFacturation ?? ModeFacturationGroupe.CONSOLIDEE,
                repartitionFacturation: data.repartitionFacturation ?? RepartitionFacturation.PROPORTIONNELLE,
                tarifDegressif: data.tarifDegressif,
                dateDebut: data.dateDebut ?? new Date(),
                dateFin: data.dateFin,
                statut: StatutAbonnementGroupe.ACTIF,
                creePar: data.creePar,
            });
        }
        await this.abonnementGroupeRepo.save(ab);
        logger.info(`[GroupeSaaS] Abonnement groupe configuré: ${groupeId} → plan ${data.planId}`);
        return ab;
    }

    async suspendreAbonnementGroupe(groupeId: string): Promise<AbonnementGroupe> {
        const ab = await this.abonnementGroupeRepo.findOne({
            where: { groupeEtablissementId: groupeId },
        });
        if (!ab) {
            throw new AppError('Aucun abonnement trouvé pour ce groupe', 404, 'ABONNEMENT_NOT_FOUND');
        }
        ab.statut = StatutAbonnementGroupe.SUSPENDU;
        await this.abonnementGroupeRepo.save(ab);
        logger.info(`[GroupeSaaS] Abonnement groupe suspendu: ${groupeId}`);
        return ab;
    }
}

export default GroupeSaaSService;
export const groupeSaaSService = new GroupeSaaSService();
