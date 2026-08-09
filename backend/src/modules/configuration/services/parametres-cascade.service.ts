/**
 * ==================================
 * eLISAschool — Service Paramètres Cascade
 * ==================================
 * Version: 1.0.0
 *
 * Résolution cascade multi-niveaux :
 *   Système → Global → Groupe → Établissement
 *
 * Chaque niveau peut avoir un override. La résolution cherche
 * la valeur la plus spécifique disponible.
 */

import { Repository, IsNull } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { ParametreSysteme } from '../entities/parametre-systeme.entity';
import { ParametreVersion } from '../entities/parametre-version.entity';
import { ActionConfiguration, CibleConfiguration } from '../entities/historique-configuration.entity';
import { HistoriqueConfiguration } from '../entities/historique-configuration.entity';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { auditService } from '@modules/auth/services/audit.service';
import { AuditAction } from '@modules/auth/entities/audit-log.entity';

/**
 * Représentation d'un niveau dans la cascade
 */
interface CascadeNiveau {
    niveau: 'systeme' | 'global' | 'groupe' | 'etablissement';
    label: string;
    valeur: any;
    source: string;
    hasOverride: boolean;
    parametreId?: string;
    scopeId?: string;
}

/**
 * Résultat complet de la cascade pour une clé
 */
interface CascadeResult {
    cle: string;
    description?: string;
    module?: string;
    categorie?: string;
    typeValeur?: string;
    propageable: boolean;
    niveaux: CascadeNiveau[];
    valeurResolue: any;
    niveauResolu: string;
}

/**
 * Service de gestion des paramètres cascade multi-niveaux
 */
export class ParametresCascadeService {
    private parametreRepo: Repository<ParametreSysteme>;
    private versionRepo: Repository<ParametreVersion>;
    private historiqueRepo: Repository<HistoriqueConfiguration>;

    constructor() {
        this.parametreRepo = AppDataSource.getRepository(ParametreSysteme);
        this.versionRepo = AppDataSource.getRepository(ParametreVersion);
        this.historiqueRepo = AppDataSource.getRepository(HistoriqueConfiguration);
    }

    // ============================================
    // RÉSOLUTION CASCADE
    // ============================================

    /**
     * Résout la cascade complète pour une clé donnée.
     * Retourne les 4 niveaux avec leurs valeurs et la valeur effective.
     */
    async getCascade(cle: string): Promise<CascadeResult> {
        // Récupérer tous les paramètres pour cette clé (global + groupes + établissements)
        const parametres = await this.parametreRepo.find({
            where: [{ cle }],
            order: { ordre: 'ASC' },
        });

        if (parametres.length === 0) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        // Identifier les différents niveaux
        const global = parametres.find(p => !p.etablissementId && !p.groupeEtablissementId);
        const groupes = parametres.filter(p => p.groupeEtablissementId && !p.etablissementId);
        const etablissements = parametres.filter(p => p.etablissementId);

        // Construire les niveaux
        const niveaux: CascadeNiveau[] = [];

        // Niveau 1 : Système (défaut code — valeurDefaut du paramètre global)
        niveaux.push({
            niveau: 'systeme',
            label: 'Système',
            valeur: global?.valeurDefaut ? this.parseValeur(global.valeurDefaut) : null,
            source: 'Code source / MODULE_REGISTRY',
            hasOverride: !!global?.valeurDefaut,
        });

        // Niveau 2 : Global
        if (global) {
            niveaux.push({
                niveau: 'global',
                label: 'Global',
                valeur: this.parseValeur(global.valeur),
                source: 'Base de données — paramètre global',
                hasOverride: true,
                parametreId: global.id,
            });
        }

        // Niveau 3 : Groupes (overrides par groupe)
        for (const groupe of groupes) {
            niveaux.push({
                niveau: 'groupe',
                label: `Groupe: ${groupe.groupeEtablissementId?.substring(0, 8)}...`,
                valeur: this.parseValeur(groupe.valeur),
                source: `Override groupe ${groupe.groupeEtablissementId}`,
                hasOverride: true,
                parametreId: groupe.id,
                scopeId: groupe.groupeEtablissementId,
            });
        }

        // Niveau 4 : Établissements (overrides individuels)
        for (const etab of etablissements) {
            niveaux.push({
                niveau: 'etablissement',
                label: `Étab: ${etab.etablissementId?.substring(0, 8)}...`,
                valeur: this.parseValeur(etab.valeur),
                source: `Override établissement ${etab.etablissementId}`,
                hasOverride: true,
                parametreId: etab.id,
                scopeId: etab.etablissementId,
            });
        }

        // Résolution : valeur effective = la plus spécifique disponible
        // Ordre : établissement > groupe > global > système
        let valeurResolue: any = null;
        let niveauResolu = 'systeme';

        if (etablissements.length > 0) {
            valeurResolue = this.parseValeur(etablissements[0].valeur);
            niveauResolu = 'etablissement';
        } else if (groupes.length > 0) {
            valeurResolue = this.parseValeur(groupes[0].valeur);
            niveauResolu = 'groupe';
        } else if (global) {
            valeurResolue = this.parseValeur(global.valeur);
            niveauResolu = 'global';
        } else {
            valeurResolue = niveaux[0]?.valeur ?? null;
        }

        return {
            cle,
            description: global?.description,
            module: global?.module,
            categorie: global?.categorie,
            typeValeur: global?.typeValeur,
            propageable: global?.propageable ?? true,
            niveaux,
            valeurResolue,
            niveauResolu,
        };
    }

    /**
     * Récupère la cascade pour un établissement spécifique (résolution complète)
     */
    async getCascadeForEtablissement(cle: string, etablissementId: string): Promise<CascadeResult & { groupeId?: string }> {
        const parametres = await this.parametreRepo.find({
            where: [{ cle }],
        });

        if (parametres.length === 0) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        const global = parametres.find(p => !p.etablissementId && !p.groupeEtablissementId);
        const etablissement = parametres.find(p => p.etablissementId === etablissementId);
        const groupes = parametres.filter(p => p.groupeEtablissementId && !p.etablissementId);

        const niveaux: CascadeNiveau[] = [];

        niveaux.push({
            niveau: 'systeme',
            label: 'Système',
            valeur: global?.valeurDefaut ? this.parseValeur(global.valeurDefaut) : null,
            source: 'Code source',
            hasOverride: !!global?.valeurDefaut,
        });

        if (global) {
            niveaux.push({
                niveau: 'global',
                label: 'Global',
                valeur: this.parseValeur(global.valeur),
                source: 'Paramètre global',
                hasOverride: true,
                parametreId: global.id,
            });
        }

        for (const groupe of groupes) {
            niveaux.push({
                niveau: 'groupe',
                label: `Groupe: ${groupe.groupeEtablissementId?.substring(0, 8)}...`,
                valeur: this.parseValeur(groupe.valeur),
                source: `Override groupe`,
                hasOverride: true,
                parametreId: groupe.id,
                scopeId: groupe.groupeEtablissementId,
            });
        }

        niveaux.push({
            niveau: 'etablissement',
            label: 'Établissement',
            valeur: etablissement ? this.parseValeur(etablissement.valeur) : null,
            source: etablissement ? 'Override établissement' : 'Hérite du niveau supérieur',
            hasOverride: !!etablissement,
            parametreId: etablissement?.id,
            scopeId: etablissementId,
        });

        // Résolution spécifique à cet établissement
        let valeurResolue: any = null;
        let niveauResolu = 'systeme';

        if (etablissement) {
            valeurResolue = this.parseValeur(etablissement.valeur);
            niveauResolu = 'etablissement';
        } else if (groupes.length > 0) {
            valeurResolue = this.parseValeur(groupes[0].valeur);
            niveauResolu = 'groupe';
        } else if (global) {
            valeurResolue = this.parseValeur(global.valeur);
            niveauResolu = 'global';
        }

        return {
            cle,
            description: global?.description,
            module: global?.module,
            categorie: global?.categorie,
            typeValeur: global?.typeValeur,
            propageable: global?.propageable ?? true,
            niveaux,
            valeurResolue,
            niveauResolu,
        };
    }

    // ============================================
    // MODIFICATION DES VALEURS PAR NIVEAU
    // ============================================

    /**
     * Modifie la valeur globale d'un paramètre
     */
    async updateValeurGlobale(
        cle: string,
        valeur: any,
        utilisateurId?: string
    ): Promise<ParametreSysteme> {
        const param = await this.parametreRepo.findOne({
            where: { cle, etablissementId: IsNull(), groupeEtablissementId: IsNull() },
        });

        if (!param) {
            throw new AppError(`Paramètre global "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        if (!param.modifiableRuntime) {
            throw new AppError('Ce paramètre ne peut pas être modifié en runtime', 400, 'PARAM_NOT_MODIFIABLE');
        }

        const ancienneValeur = param.valeur;
        param.valeur = JSON.stringify(valeur);

        await this.parametreRepo.save(param);
        await this.enregistrerVersion(param, ancienneValeur, param.valeur, utilisateurId);
        await this.enregistrerHistorique(param, ancienneValeur, param.valeur, 'global', utilisateurId);

        logger.info(`[Cascade] Valeur globale mise à jour: ${cle}`);
        return param;
    }

    /**
     * Crée ou modifie un override établissement
     */
    async updateOverrideEtablissement(
        cle: string,
        etablissementId: string,
        valeur: any,
        utilisateurId?: string
    ): Promise<ParametreSysteme> {
        // Vérifier que le paramètre global existe
        const paramGlobal = await this.parametreRepo.findOne({
            where: { cle, etablissementId: IsNull(), groupeEtablissementId: IsNull() },
        });

        if (!paramGlobal) {
            throw new AppError(`Paramètre global "${cle}" non trouvé. Créez-le d'abord.`, 404, 'PARAM_NOT_FOUND');
        }

        // Chercher l'override existant
        let override = await this.parametreRepo.findOne({
            where: { cle, etablissementId },
        });

        if (override) {
            const ancienneValeur = override.valeur;
            override.valeur = JSON.stringify(valeur);
            await this.parametreRepo.save(override);
            await this.enregistrerVersion(override, ancienneValeur, override.valeur, utilisateurId);
            await this.enregistrerHistorique(override, ancienneValeur, override.valeur, `etablissement:${etablissementId}`, utilisateurId);
            logger.info(`[Cascade] Override établissement mis à jour: ${cle} → ${etablissementId}`);
            return override;
        }

        // Créer un nouvel override
        override = this.parametreRepo.create({
            cle,
            valeur: JSON.stringify(valeur),
            typeValeur: paramGlobal.typeValeur,
            categorie: paramGlobal.categorie,
            module: paramGlobal.module,
            description: `Override établissement — ${paramGlobal.description || cle}`,
            etablissementId,
            modifiableRuntime: true,
            visible: paramGlobal.visible,
            ordre: paramGlobal.ordre,
            propageable: false,
        });

        await this.parametreRepo.save(override);
        await this.enregistrerVersion(override, null, override.valeur, utilisateurId);
        await this.enregistrerHistorique(override, null, override.valeur, `etablissement:${etablissementId}`, utilisateurId);

        logger.info(`[Cascade] Override établissement créé: ${cle} → ${etablissementId}`);
        return override;
    }

    /**
     * Supprime un override établissement (réinitialise à l'héritage)
     */
    async resetOverrideEtablissement(
        cle: string,
        etablissementId: string,
        utilisateurId?: string
    ): Promise<{ success: boolean; message: string }> {
        const override = await this.parametreRepo.findOne({
            where: { cle, etablissementId },
        });

        if (!override) {
            throw new AppError(`Aucun override trouvé pour "${cle}" sur l'établissement ${etablissementId}`, 404, 'OVERRIDE_NOT_FOUND');
        }

        const ancienneValeur = override.valeur;
        await this.parametreRepo.remove(override);
        await this.enregistrerHistorique(
            { cle, id: override.id } as ParametreSysteme,
            ancienneValeur, null, `reset:${etablissementId}`, utilisateurId
        );

        logger.info(`[Cascade] Override réinitialisé: ${cle} → ${etablissementId}`);
        return { success: true, message: `Override supprimé. L'établissement ${etablissementId} hérite maintenant du niveau supérieur.` };
    }

    /**
     * Crée ou modifie un override groupe
     */
    async updateOverrideGroupe(
        cle: string,
        groupeId: string,
        valeur: any,
        utilisateurId?: string
    ): Promise<ParametreSysteme> {
        const paramGlobal = await this.parametreRepo.findOne({
            where: { cle, etablissementId: IsNull(), groupeEtablissementId: IsNull() },
        });

        if (!paramGlobal) {
            throw new AppError(`Paramètre global "${cle}" non trouvé.`, 404, 'PARAM_NOT_FOUND');
        }

        let override = await this.parametreRepo.findOne({
            where: { cle, groupeEtablissementId: groupeId, etablissementId: IsNull() },
        });

        if (override) {
            const ancienneValeur = override.valeur;
            override.valeur = JSON.stringify(valeur);
            await this.parametreRepo.save(override);
            await this.enregistrerVersion(override, ancienneValeur, override.valeur, utilisateurId);
            logger.info(`[Cascade] Override groupe mis à jour: ${cle} → groupe ${groupeId}`);
            return override;
        }

        override = this.parametreRepo.create({
            cle,
            valeur: JSON.stringify(valeur),
            typeValeur: paramGlobal.typeValeur,
            categorie: paramGlobal.categorie,
            module: paramGlobal.module,
            description: `Override groupe — ${paramGlobal.description || cle}`,
            groupeEtablissementId: groupeId,
            modifiableRuntime: true,
            visible: paramGlobal.visible,
            ordre: paramGlobal.ordre,
            propageable: false,
        });

        await this.parametreRepo.save(override);
        await this.enregistrerVersion(override, null, override.valeur, utilisateurId);

        logger.info(`[Cascade] Override groupe créé: ${cle} → groupe ${groupeId}`);
        return override;
    }

    // ============================================
    // PROPAGATION
    // ============================================

    /**
     * Propage la valeur globale à tous les établissements
     * qui n'ont pas d'override explicite.
     */
    async propagerValeurGlobale(
        cle: string,
        etablissementIds: string[],
        utilisateurId?: string
    ): Promise<{ propages: number; ignores: number; details: { etabId: string; action: string }[] }> {
        const paramGlobal = await this.parametreRepo.findOne({
            where: { cle, etablissementId: IsNull(), groupeEtablissementId: IsNull() },
        });

        if (!paramGlobal) {
            throw new AppError(`Paramètre global "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        if (!paramGlobal.propageable) {
            throw new AppError('Ce paramètre n\'est pas propageable', 400, 'PARAM_NOT_PROPAGABLE');
        }

        // Récupérer les overrides existants
        const overridesExistants = await this.parametreRepo.find({
            where: { cle },
            select: ['etablissementId'],
        });
        const etabsAvecOverride = new Set(
            overridesExistants
                .filter(p => p.etablissementId)
                .map(p => p.etablissementId!)
        );

        let propages = 0;
        let ignores = 0;
        const details: { etabId: string; action: string }[] = [];

        for (const etabId of etablissementIds) {
            if (etabsAvecOverride.has(etabId)) {
                ignores++;
                details.push({ etabId, action: 'ignore (override existant)' });
                continue;
            }

            // Créer l'override avec la valeur globale
            const nouveau = this.parametreRepo.create({
                cle,
                valeur: paramGlobal.valeur,
                typeValeur: paramGlobal.typeValeur,
                categorie: paramGlobal.categorie,
                module: paramGlobal.module,
                description: `Propagé depuis global — ${paramGlobal.description || cle}`,
                etablissementId: etabId,
                modifiableRuntime: true,
                visible: paramGlobal.visible,
                ordre: paramGlobal.ordre,
                propageable: false,
            });

            await this.parametreRepo.save(nouveau);
            propages++;
            details.push({ etabId, action: 'propagé' });
        }

        await this.enregistrerHistorique(
            paramGlobal,
            paramGlobal.valeur,
            `propagation à ${propages} établissements`,
            'propagation',
            utilisateurId
        );

        logger.info(`[Cascade] Propagation: ${cle} → ${propages} étab, ${ignores} ignorés`);
        return { propages, ignores, details };
    }

    // ============================================
    // HISTORIQUE & ROLLBACK
    // ============================================

    /**
     * Récupère l'historique des modifications d'un paramètre (via ParametreVersion)
     */
    async getHistorique(cle: string): Promise<any[]> {
        const parametres = await this.parametreRepo.find({ where: { cle } });
        const parametreIds = parametres.map(p => p.id);

        if (parametreIds.length === 0) {
            throw new AppError(`Paramètre "${cle}" non trouvé`, 404, 'PARAM_NOT_FOUND');
        }

        const versions = await this.versionRepo
            .createQueryBuilder('v')
            .leftJoinAndSelect('v.utilisateur', 'u')
            .where('v.parametreId IN (:...ids)', { ids: parametreIds })
            .orderBy('v.createdAt', 'DESC')
            .limit(100)
            .getMany();

        return versions.map(v => ({
            id: v.id,
            parametreId: v.parametreId,
            etablissementId: v.etablissementId,
            version: v.version,
            ancienneValeur: v.ancienneValeur ? this.parseValeur(v.ancienneValeur) : null,
            nouvelleValeur: this.parseValeur(v.nouvelleValeur),
            modifiedBy: v.modifiedBy,
            modifiedByName: v.utilisateur
                ? `${v.utilisateur.prenom || ''} ${v.utilisateur.nom || ''}`.trim()
                : 'Système',
            createdAt: v.createdAt,
        }));
    }

    /**
     * Restaure une version antérieure d'un paramètre
     */
    async rollback(
        cle: string,
        versionId: string,
        utilisateurId?: string
    ): Promise<{ success: boolean; message: string; valeurRestaurée: any }> {
        const version = await this.versionRepo.findOne({
            where: { id: versionId },
        });

        if (!version) {
            throw new AppError('Version non trouvée', 404, 'VERSION_NOT_FOUND');
        }

        const param = await this.parametreRepo.findOne({
            where: { id: version.parametreId },
        });

        if (!param) {
            throw new AppError('Paramètre associé non trouvé', 404, 'PARAM_NOT_FOUND');
        }

        if (param.cle !== cle) {
            throw new AppError('La version ne correspond pas à la clé demandée', 400, 'VERSION_MISMATCH');
        }

        const ancienneValeur = param.valeur;
        const valeurRestaurée = this.parseValeur(version.ancienneValeur || version.nouvelleValeur);

        param.valeur = JSON.stringify(valeurRestaurée);
        await this.parametreRepo.save(param);
        await this.enregistrerVersion(param, ancienneValeur, param.valeur, utilisateurId);
        await this.enregistrerHistorique(param, ancienneValeur, param.valeur, `rollback:${versionId}`, utilisateurId);

        logger.info(`[Cascade] Rollback: ${cle} → version ${version.version}`);
        return {
            success: true,
            message: `Version ${version.version} restaurée avec succès`,
            valeurRestaurée,
        };
    }

    // ============================================
    // DÉTECTION INCOHÉRENCES
    // ============================================

    /**
     * Détecte les overrides contradictoires ou incohérents
     */
    async getIncoherences(): Promise<{
        total: number;
        incoherences: Array<{
            cle: string;
            type: string;
            description: string;
            etablissementId?: string;
            groupeId?: string;
        }>;
    }> {
        const incoherences: Array<{
            cle: string;
            type: string;
            description: string;
            etablissementId?: string;
            groupeId?: string;
        }> = [];

        // Récupérer tous les paramètres visibles
        const tousParametres = await this.parametreRepo.find({
            where: { visible: true },
            order: { cle: 'ASC', ordre: 'ASC' },
        });

        // Grouper par clé
        const parCle = new Map<string, ParametreSysteme[]>();
        for (const p of tousParametres) {
            const liste = parCle.get(p.cle) || [];
            liste.push(p);
            parCle.set(p.cle, liste);
        }

        for (const [cle, parametres] of parCle) {
            const global = parametres.find(p => !p.etablissementId && !p.groupeEtablissementId);
            const overrides = parametres.filter(p => p.etablissementId || p.groupeEtablissementId);

            // Vérification 1 : pas de paramètre global
            if (!global && overrides.length > 0) {
                incoherences.push({
                    cle,
                    type: 'ORPHAN_OVERRIDE',
                    description: `Des overrides existent sans paramètre global pour "${cle}"`,
                });
            }

            // Vérification 2 : overrides avec même valeur que le global (inutiles)
            if (global) {
                for (const override of overrides) {
                    if (override.valeur === global.valeur) {
                        incoherences.push({
                            cle,
                            type: 'REDUNDANT_OVERRIDE',
                            description: `Override identique au global pour "${cle}"`,
                            etablissementId: override.etablissementId || undefined,
                            groupeId: override.groupeEtablissementId || undefined,
                        });
                    }
                }
            }

            // Vérification 3 : types de valeur incohérents entre overrides
            const types = new Set(overrides.map(o => o.typeValeur));
            if (types.size > 1) {
                incoherences.push({
                    cle,
                    type: 'TYPE_MISMATCH',
                    description: `Types de valeur incohérents entre overrides pour "${cle}"`,
                });
            }
        }

        return { total: incoherences.length, incoherences };
    }

    /**
     * Liste tous les paramètres avec leur statut cascade (pour la vue d'ensemble)
     */
    async getListeParametresCascade(options?: {
        module?: string;
        categorie?: string;
        search?: string;
    }): Promise<Array<{
        cle: string;
        description?: string;
        module?: string;
        categorie?: string;
        propageable: boolean;
        nbOverrides: number;
        hasGlobal: boolean;
    }>> {
        const qb = this.parametreRepo.createQueryBuilder('p')
            .select('p.cle', 'cle')
            .addSelect('p.description', 'description')
            .addSelect('p.module', 'module')
            .addSelect('p.categorie', 'categorie')
            .addSelect('p.propageable', 'propageable')
            .addSelect('COUNT(*) FILTER (WHERE p."etablissementId" IS NOT NULL OR p."groupeEtablissementId" IS NOT NULL)', 'nbOverrides')
            .addSelect('BOOL_OR(p."etablissementId" IS NULL AND p."groupeEtablissementId" IS NULL)', 'hasGlobal')
            .where('p.visible = true')
            .groupBy('p.cle')
            .addGroupBy('p.description')
            .addGroupBy('p.module')
            .addGroupBy('p.categorie')
            .addGroupBy('p.propageable')
            .orderBy('p.module', 'ASC')
            .addOrderBy('p.cle', 'ASC');

        if (options?.module) {
            qb.andWhere('p.module = :module', { module: options.module });
        }
        if (options?.categorie) {
            qb.andWhere('p.categorie = :categorie', { categorie: options.categorie });
        }
        if (options?.search) {
            qb.andWhere('(p.cle LIKE :search OR p.description LIKE :search)', { search: `%${options.search}%` });
        }

        const raw = await qb.getRawMany();

        return raw.map((r: any) => ({
            cle: r.cle,
            description: r.description,
            module: r.module,
            categorie: r.categorie,
            propageable: r.propageable,
            nbOverrides: parseInt(r.nbOverrides, 10) || 0,
            hasGlobal: r.hasGlobal === true || r.hasGlobal === 't',
        }));
    }

    // ============================================
    // HELPERS PRIVÉS
    // ============================================

    private parseValeur(valeur: string): any {
        try {
            return JSON.parse(valeur);
        } catch {
            return valeur;
        }
    }

    private async enregistrerVersion(
        param: ParametreSysteme,
        ancienneValeur: string | null,
        nouvelleValeur: string,
        utilisateurId?: string
    ): Promise<void> {
        // Déterminer le prochain numéro de version
        const lastVersion = await this.versionRepo
            .createQueryBuilder('v')
            .where('v.parametreId = :parametreId', { parametreId: param.id })
            .orderBy('v.version', 'DESC')
            .getOne();

        const nextVersion = (lastVersion?.version || 0) + 1;

        const version = this.versionRepo.create({
            parametreId: param.id,
            etablissementId: param.etablissementId || undefined,
            ancienneValeur: ancienneValeur || undefined,
            nouvelleValeur,
            version: nextVersion,
            modifiedBy: utilisateurId || undefined,
        });

        await this.versionRepo.save(version);
    }

    private async enregistrerHistorique(
        param: ParametreSysteme,
        ancienneValeur: string | null,
        nouvelleValeur: string | null,
        scope: string,
        utilisateurId?: string
    ): Promise<void> {
        const entry = this.historiqueRepo.create({
            utilisateurId: utilisateurId || undefined,
            action: ActionConfiguration.UPDATE,
            cible: CibleConfiguration.PARAMETRE,
            cibleId: param.id,
            cibleNom: `cascade:${param.cle}:${scope}`,
            description: `Modification cascade — ${param.cle} (${scope})`,
            ancienneValeur: ancienneValeur ? this.parseValeur(ancienneValeur) : undefined,
            nouvelleValeur: nouvelleValeur ? this.parseValeur(nouvelleValeur) : undefined,
            restaurable: true,
        });

        await this.historiqueRepo.save(entry);
    }
}

// Singleton
export const parametresCascadeService = new ParametresCascadeService();
