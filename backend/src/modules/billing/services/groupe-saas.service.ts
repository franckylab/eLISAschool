/**
 * ==================================
 * eLISAschool - Service GroupeSaaS
 * ==================================
 * 
 * Gestion des groupes d'établissements SaaS :
 *   - CRUD groupes (nom, description, code, actif)
 *   - Gestion des membres (ajout/retrait établissements)
 *   - Configuration SaaS par groupe (modules, abonnement)
 * 
 * Lot C v7 — Refonte SaaS
 * Refonte v3 (migration 213) : tranches groupe supprimées (tarification prix/élève + franchise)
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { GroupeEtablissement } from '@modules/groupes-etablissements/entities';
import { GroupeEtablissementLien } from '@modules/groupes-etablissements/entities';
import { ModulesGroupe } from '../entities/modules-groupe.entity';
import { ModuleCatalogue } from '../entities/module-catalogue.entity';
import { PlanAbonnement } from '../entities/plan-abonnement.entity';
import { AbonnementClient, StatutAbonnement } from '../entities/abonnement-client.entity';
import { Facture } from '../entities/facture.entity';
import { LigneFacture, TypeLigneFacture } from '../entities/ligne-facture.entity';
import { BaremeGroupeService, DEFAUT_PALIERS_GROUPE, baremeGroupeService } from './bareme-groupe.service';
import { Etablissement } from '@modules/etablissement/entities';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

export class GroupeSaaSService {
    private groupeRepo: Repository<GroupeEtablissement>;
    private lienRepo: Repository<GroupeEtablissementLien>;
    private modulesGroupeRepo: Repository<ModulesGroupe>;
    private moduleCatalogueRepo: Repository<ModuleCatalogue>;
    private planRepo: Repository<PlanAbonnement>;
    private etablissementRepo: Repository<Etablissement>;
    private factureRepo: Repository<Facture>;
    private ligneFactureRepo: Repository<LigneFacture>;
    private abonnementClientRepo: Repository<AbonnementClient>;

    /** Cohérence avec GroupesService : un groupe = 50 établissements max. */
    private readonly MAX_ETABLISSEMENTS_PAR_GROUPE = 50;

    constructor() {
        this.groupeRepo = AppDataSource.getRepository(GroupeEtablissement);
        this.lienRepo = AppDataSource.getRepository(GroupeEtablissementLien);
        this.modulesGroupeRepo = AppDataSource.getRepository(ModulesGroupe);
        this.moduleCatalogueRepo = AppDataSource.getRepository(ModuleCatalogue);
        this.planRepo = AppDataSource.getRepository(PlanAbonnement);
        this.etablissementRepo = AppDataSource.getRepository(Etablissement);
        this.factureRepo = AppDataSource.getRepository(Facture);
        this.ligneFactureRepo = AppDataSource.getRepository(LigneFacture);
        this.abonnementClientRepo = AppDataSource.getRepository(AbonnementClient);
    }

    /** Normalise un code groupe : trim + UPPERCASE (cohérence tenant/platform). */
    private normaliserCode(code: string): string {
        return code.trim().toUpperCase();
    }

    // ─── CRUD Groupes ─────────────────────────────────────────────

    async createGroupe(data: {
        nom: string;
        description?: string;
        code: string;
        proprietaireId: string;
    }): Promise<GroupeEtablissement> {
        const nom = data.nom?.trim();
        const code = this.normaliserCode(data.code ?? '');
        if (!nom || !code) {
            throw new AppError('Nom et code requis', 400, 'VALIDATION_ERROR');
        }
        // Vérifier unicité du code (insensible à la casse via normalisation)
        const existing = await this.groupeRepo.findOne({ where: { code } });
        if (existing) {
            throw new AppError(`Un groupe avec le code '${code}' existe déjà`, 409, 'GROUPE_CODE_EXISTS');
        }

        const groupe = this.groupeRepo.create({
            nom,
            description: data.description?.trim() || undefined,
            code,
            proprietaireId: data.proprietaireId,
            actif: true,
        });

        await this.groupeRepo.save(groupe);
        logger.info(`[GroupeSaaS] Groupe créé: ${groupe.nom} (${groupe.code})`);
        await auditService.log({
            utilisateurId: data.proprietaireId,
            action: AuditAction.GROUPE_CREATE,
            cible: 'GroupeEtablissement',
            cibleId: groupe.id,
            description: `Création du groupe ${groupe.nom} (${groupe.code}) depuis la plateforme`,
            module: 'groupes-etablissements',
            metadata: { entiteLabel: groupe.nom, entiteRef: groupe.code },
        });
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

    async getAllGroupes(actif?: boolean): Promise<GroupeEtablissement[]> {
        return this.groupeRepo.find({
            where: actif === undefined ? undefined : { actif },
            relations: ['etablissements', 'etablissements.etablissement'],
            order: { nom: 'ASC' },
        });
    }

    async updateGroupe(groupeId: string, data: Partial<{
        nom: string;
        description: string;
        actif: boolean;
    }>, utilisateurId?: string): Promise<GroupeEtablissement> {
        const groupe = await this.getGroupe(groupeId);
        if (data.nom !== undefined) groupe.nom = data.nom.trim() || groupe.nom;
        if (data.description !== undefined) groupe.description = data.description?.trim() || undefined;
        if (data.actif !== undefined) groupe.actif = data.actif;
        await this.groupeRepo.save(groupe);
        logger.info(`[GroupeSaaS] Groupe mis à jour: ${groupe.id}`);
        if (utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_UPDATE,
                cible: 'GroupeEtablissement',
                cibleId: groupe.id,
                description: `Modification du groupe ${groupe.nom} depuis la plateforme`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom, entiteRef: groupe.code },
            });
        }
        return groupe;
    }

    /**
     * Suppression logique (soft delete) — cohérence avec GroupesService :
     * actif=false + libération des membres.
     * Les overrides modules sont conservés pour un éventuel rétablissement.
     * (Facturation groupe supprimée : aucune facture groupe à gérer.)
     */
    async deleteGroupe(groupeId: string, utilisateurId?: string): Promise<void> {
        const groupe = await this.getGroupe(groupeId);
        if (!groupe.actif) {
            throw new AppError('Ce groupe est déjà désactivé', 400, 'GROUPE_DEJA_SUPPRIME');
        }
        groupe.actif = false;
        await this.groupeRepo.save(groupe);
        // Libère les établissements (un établissement = un seul groupe)
        await this.lienRepo.delete({ groupeId });
        logger.info(`[GroupeSaaS] Groupe désactivé (soft): ${groupe.id}`);
        if (utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.GROUPE_DELETE,
                cible: 'GroupeEtablissement',
                cibleId: groupe.id,
                description: `Désactivation du groupe ${groupe.nom} (${groupe.code}) depuis la plateforme`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom, entiteRef: groupe.code },
            });
        }
    }

    // ─── Membres du groupe ─────────────────────────────────────────

    async addMembre(groupeId: string, etablissementId: string, ajoutePar?: string): Promise<GroupeEtablissementLien> {
        // Vérifier que le groupe existe et est actif
        const groupe = await this.getGroupe(groupeId);
        if (!groupe.actif) {
            throw new AppError('Groupe inactif — réactivez-le avant d’ajouter des membres', 400, 'GROUPE_INACTIF');
        }

        // Vérifier que l'établissement existe
        const etablissement = await this.etablissementRepo.findOne({ where: { id: etablissementId } });
        if (!etablissement) {
            throw new AppError('Établissement introuvable', 404, 'ETABLISSEMENT_NOT_FOUND');
        }

        // Vérifier que le lien n'existe pas déjà dans CE groupe
        const existing = await this.lienRepo.findOne({
            where: { groupeId, etablissementId },
        });
        if (existing) {
            throw new AppError('Cet établissement est déjà membre du groupe', 409, 'MEMBRE_ALREADY_EXISTS');
        }

        // Règle métier (cohérence GroupesService) : un établissement = un seul groupe
        const ailleurs = await this.lienRepo.findOne({ where: { etablissementId } });
        if (ailleurs && ailleurs.groupeId !== groupeId) {
            throw new AppError(
                'Cet établissement appartient déjà à un autre groupe — retirez-le d’abord',
                409,
                'ETABLISSEMENT_DEJA_DANS_GROUPE',
            );
        }

        // Limite maximale (cohérence GroupesService)
        const currentCount = await this.lienRepo.count({ where: { groupeId } });
        if (currentCount + 1 > this.MAX_ETABLISSEMENTS_PAR_GROUPE) {
            throw new AppError(
                `Un groupe ne peut pas avoir plus de ${this.MAX_ETABLISSEMENTS_PAR_GROUPE} établissements`,
                400,
                'GROUPE_MAX_ETABLISSEMENTS',
            );
        }

        const lien = this.lienRepo.create({
            groupeId,
            etablissementId,
            ajoutePar,
        });

        await this.lienRepo.save(lien);
        logger.info(`[GroupeSaaS] Membre ajouté au groupe ${groupeId}: ${etablissementId}`);
        if (ajoutePar) {
            await auditService.log({
                utilisateurId: ajoutePar,
                action: AuditAction.GROUPE_ETAB_AJOUTER,
                cible: 'GroupeEtablissement',
                cibleId: groupeId,
                description: `Établissement ${etablissement.nom} ajouté au groupe ${groupe.nom} depuis la plateforme`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom },
            });
        }
        return lien;
    }

    async removeMembre(groupeId: string, etablissementId: string, retirePar?: string): Promise<void> {
        const lien = await this.lienRepo.findOne({
            where: { groupeId, etablissementId },
        });
        if (!lien) {
            throw new AppError('Membre non trouvé dans ce groupe', 404, 'MEMBRE_NOT_FOUND');
        }
        await this.lienRepo.remove(lien);
        logger.info(`[GroupeSaaS] Membre retiré du groupe ${groupeId}: ${etablissementId}`);
        if (retirePar) {
            const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
            await auditService.log({
                utilisateurId: retirePar,
                action: AuditAction.GROUPE_ETAB_RETIRER,
                cible: 'GroupeEtablissement',
                cibleId: groupeId,
                description: `Établissement retiré du groupe ${groupe?.nom ?? groupeId} depuis la plateforme`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe?.nom ?? groupeId },
            });
        }
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
        // Vérifier que le groupe existe et est actif
        const groupe = await this.groupeRepo.findOne({ where: { id: groupeId } });
        if (!groupe) {
            throw new AppError('Groupe non trouvé', 404, 'GROUPE_NOT_FOUND');
        }
        if (!groupe.actif) {
            throw new AppError('Groupe inactif', 400, 'GROUPE_INACTIF');
        }
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
        if (creePar) {
            await auditService.log({
                utilisateurId: creePar,
                action: AuditAction.GROUPE_UPDATE,
                cible: 'GroupeEtablissement',
                cibleId: groupeId,
                description: `Module ${module.code} ${actif ? 'activé' : 'désactivé'} pour le groupe ${groupe.nom}`,
                module: 'groupes-etablissements',
                metadata: { entiteLabel: groupe.nom, entiteRef: module.code },
            });
        }
        return mg;
    }

    // Méthodes getTranchesGroupe/setTranchesGroupe supprimées
    // (Refonte v3 — tarification prix/élève + franchise)
    // Méthodes abonnement groupe supprimées (suppression facturation groupe — dégressivité sur factures individuelles)

    // ─── Vue consolidée (lecture seule) ──────────────────────────
    // La facturation groupe est supprimée : chaque établissement est facturé
    // individuellement (dégressivité groupe = ligne REMISE sur sa facture).
    // Cette méthode agrège les factures individuelles des membres pour la
    // Vue Consolidée du Control Plane (stats + export CSV client).

    /** Barème dégressivité par défaut — délégué au résolveur unique (sans doublon). */
    static degressiviteParMembres(nombreMembres: number): number {
        return BaremeGroupeService.tauxPour(DEFAUT_PALIERS_GROUPE, nombreMembres);
    }

    async getStatsGroupe(groupeId: string): Promise<{
        nombreMembres: number;
        montantTotalMois: number;
        degressivite: number;
        economieMois: number;
        facturesMois: number;
        montantTotalHT: number;
        montantTotalTVA: number;
        montantTotalTTC: number;
        repartitionParPlan: Array<{ plan: string; count: number }>;
        facturesRecentes: Array<{
            id: string;
            numero: string;
            etablissement: string;
            date: string;
            montant: number;
            statut: string;
        }>;
    }> {
        const groupe = await this.getGroupe(groupeId);
        const liens = await this.lienRepo.find({
            where: { groupeId },
            relations: ['etablissement'],
        });
        const etablissementIds = liens.map((l) => l.etablissementId);
        const nombreMembres = liens.length;
        // Taux effectif (override groupe → global → défaut) pour un affichage cohérent
        const { taux: degressivite } = await baremeGroupeService.getTauxDegressivite(groupeId, nombreMembres);

        if (!etablissementIds.length) {
            return {
                nombreMembres: 0,
                montantTotalMois: 0,
                degressivite: 0,
                economieMois: 0,
                facturesMois: 0,
                montantTotalHT: 0,
                montantTotalTVA: 0,
                montantTotalTTC: 0,
                repartitionParPlan: [],
                facturesRecentes: [],
            };
        }

        const now = new Date();
        const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);

        // Factures du mois courant des membres
        const facturesMois = await this.factureRepo
            .createQueryBuilder('f')
            .where('f."etablissementId" IN (:...ids)', { ids: etablissementIds })
            .andWhere('f."dateEmission" >= :debut', { debut: debutMois })
            .getMany();

        const montantTotalHT = facturesMois.reduce((s, f) => s + Number(f.montantHT ?? 0), 0);
        const montantTotalTVA = facturesMois.reduce((s, f) => s + Number(f.montantTVA ?? 0), 0);
        const montantTotalTTC = facturesMois.reduce((s, f) => s + Number(f.montantTotal ?? 0), 0);

        // Économie dégressivité = somme des lignes REMISE groupe sur les factures du mois
        const lignesRemise = await this.ligneFactureRepo
            .createQueryBuilder('l')
            .innerJoin('l.facture', 'f')
            .where('f."etablissementId" IN (:...ids)', { ids: etablissementIds })
            .andWhere('f."dateEmission" >= :debut', { debut: debutMois })
            .andWhere('l.type = :type', { type: TypeLigneFacture.REMISE })
            .andWhere('l.description ILIKE :motif', { motif: `Remise groupe ${groupe.nom}%` })
            .getMany();
        const economieMois = Math.abs(lignesRemise.reduce((s, l) => s + Number(l.total ?? 0), 0));

        // Répartition par plan (abonnements actifs des membres)
        const abonnements = await this.abonnementClientRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.plan', 'plan')
            .where('a."etablissementId" IN (:...ids)', { ids: etablissementIds })
            .andWhere('a.statut = :statut', { statut: StatutAbonnement.ACTIF })
            .getMany();
        const parPlan = new Map<string, number>();
        for (const a of abonnements) {
            const nom = a.plan?.nom ?? 'Sans plan';
            parPlan.set(nom, (parPlan.get(nom) ?? 0) + 1);
        }

        // 10 factures récentes des membres (noms via les liens chargés)
        const nomParEtab = new Map(liens.map((l) => [l.etablissementId, l.etablissement?.nom ?? l.etablissementId]));
        const recentes = await this.factureRepo
            .createQueryBuilder('f')
            .where('f."etablissementId" IN (:...ids)', { ids: etablissementIds })
            .orderBy('f."dateEmission"', 'DESC')
            .take(10)
            .getMany();

        return {
            nombreMembres,
            montantTotalMois: montantTotalTTC,
            degressivite,
            economieMois,
            facturesMois: facturesMois.length,
            montantTotalHT,
            montantTotalTVA,
            montantTotalTTC,
            repartitionParPlan: Array.from(parPlan.entries()).map(([plan, count]) => ({ plan, count })),
            facturesRecentes: recentes.map((f) => ({
                id: f.id,
                numero: f.numero,
                etablissement: nomParEtab.get(f.etablissementId) ?? f.etablissementId,
                date: f.dateEmission instanceof Date ? f.dateEmission.toISOString() : String(f.dateEmission),
                montant: Number(f.montantTotal ?? 0),
                statut: String(f.statut),
            })),
        };
    }
}

export default GroupeSaaSService;
export const groupeSaaSService = new GroupeSaaSService();
