/**
 * ==================================
 * eLISAschool - Service Bulletins v2.1
 * ==================================
 * - SQL stats matières corrigé (colonnes camelCase quotées) + filtre établissement
 * - Statuts comptés unifiés : VALIDEE + PUBLIEE
 * - Config bulletins.require_validation (fallback bulletins.validation_workflow)
 * - anneeScolaireId + moyenneClasse/moyenneMin/moyenneMax renseignés à la génération
 * - Pagination standardisée PaginatedResult + recherche serveur
 * - Suppression de bulletin (refus si publié)
 */

import { Repository, MoreThan, In, FindOptionsWhere, QueryRunner } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Bulletin, BulletinMatiere, BulletinWorkflow } from '../entities';
import { GenerateBulletinDto, UpdateBulletinDto, QueryBulletinsDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { periodesService } from '@modules/periodes/services';
import { StatutPeriode } from '@modules/periodes/entities';
import { notesBatchLoaderService } from '@modules/notes/services/notes-batch-loader.service';
import { StatutNote } from '@modules/notes/entities';
import { matieresService, coefficientResolverService } from '@modules/matieres/services';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { Eleve } from '@modules/eleves/entities';
import { getParamBoolean, getParamNumber, getParam } from '@modules/configuration/utils/config.helper';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { notificationTemplates } from '@modules/notifications/services';
import { auditService, AuditAction } from '@modules/auth';
import { PaginatedResult, createPaginatedResult } from '@common/utils/pagination.util';

export class BulletinsService {
    private repo: Repository<Bulletin>;
    private bulletinMatiereRepo: Repository<BulletinMatiere>;
    private workflowRepo: Repository<BulletinWorkflow>;

    constructor() {
        this.repo = AppDataSource.getRepository(Bulletin);
        this.bulletinMatiereRepo = AppDataSource.getRepository(BulletinMatiere);
        this.workflowRepo = AppDataSource.getRepository(BulletinWorkflow);
    }

    /**
     * Lecture de bulletins.require_validation avec rétro-compatibilité
     * sur l'ancienne clé seedée bulletins.validation_workflow
     */
    private async getRequireValidation(etablissementId?: string): Promise<boolean> {
        const val = await getParam<boolean | string | undefined>('bulletins.require_validation', {
            etablissementId,
            defaultValue: undefined,
        });
        if (val !== undefined && val !== null) {
            return typeof val === 'boolean' ? val : val === 'true' || val === '1';
        }
        // Fallback : ancienne clé (installations seedées avant le renommage)
        return getParamBoolean('bulletins.validation_workflow', { etablissementId, defaultValue: false });
    }

    private async getBulletinsParams(etablissementId?: string) {
        return {
            includeRanking: await getParamBoolean('bulletins.include_ranking', { etablissementId, defaultValue: true }),
            showAppreciations: await getParamBoolean('bulletins.show_appreciations', { etablissementId, defaultValue: true }),
            validationThreshold: await getParamNumber('bulletins.validation_threshold', { etablissementId, defaultValue: 10 }),
            calculationMethod: await getParam<string>('bulletins.calculation_method', { etablissementId, defaultValue: 'ponderee' }),
            displayCoefficients: await getParamBoolean('bulletins.display_coefficients', { etablissementId, defaultValue: true }),
            templateId: await getParam<string>('bulletins.template_id', { etablissementId, defaultValue: 'default' }),
            requireValidation: await this.getRequireValidation(etablissementId),
            validationLevels: await getParamNumber('bulletins.validation_levels', { etablissementId, defaultValue: 2 }),
        };
    }

    async generate(dto: GenerateBulletinDto, etablissementId?: string, utilisateurId?: string): Promise<Bulletin[]> {
        const params = await this.getBulletinsParams(etablissementId);
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const classeAnneeRepo = AppDataSource.getRepository('ClasseAnnee');
            const classeAnnee = await classeAnneeRepo.findOne({
                where: { id: dto.classeAnneeId },
                relations: ['classe', 'anneeScolaire']
            }) as any;

            if (!classeAnnee) {
                throw new AppError('Classe/Année non trouvée', 404, 'CLASSE_ANNEE_NOT_FOUND');
            }

            const periode = await periodesService.findOne(dto.periodeId);

            if (periode.statut === StatutPeriode.CLOTUREE) {
                const lockOnCloture = await getParamBoolean('periodes.lock_on_cloture', { defaultValue: true });
                if (lockOnCloture) {
                    throw new AppError(
                        'Impossible de générer des bulletins pour une période clôturée',
                        400,
                        'PERIODE_CLOTUREE_IMMUTABLE',
                    );
                }
            }

            if (periode.anneeScolaireId !== classeAnnee.anneeScolaireId) {
                throw new AppError('La période ne correspond pas à l\'année scolaire de la classe', 400, 'PERIODE_MISMATCH');
            }

            const eleveRepo = AppDataSource.getRepository(Eleve);
            let eleves: Eleve[] = [];
            if (dto.eleveId) {
                const eleve = await eleveRepo.findOne({ where: { id: dto.eleveId } });
                if (eleve) eleves.push(eleve);
            } else {
                const affectationRepo = AppDataSource.getRepository('AffectationEleve');
                const affectations = await affectationRepo.find({
                    where: { classeAnneeId: dto.classeAnneeId, actif: true },
                }) as any[];

                const eleveIds = affectations.map((a: any) => a.eleveId);
                if (eleveIds.length > 0) {
                    eleves = await eleveRepo.findBy({ id: In(eleveIds) });
                }
            }

            if (eleves.length === 0) {
                throw new AppError('Aucun élève trouvé dans cette classe', 404, 'NO_ELEVES');
            }

            const bulletins: Bulletin[] = [];

            const programme = await matieresService.getMatieresParNiveau(
                classeAnnee.classe.niveauId,
                etablissementId ?? classeAnnee.classe.etablissementId
            );

            // Résolution centralisée des coefficients (Affectation → Programme → MatiereNiveau)
            const coefficientsMap = new Map<string, number>();
            if (etablissementId) {
                const resolus = await coefficientResolverService.resoudreCoefficients(
                    dto.classeAnneeId,
                    programme.map(p => p.matiereId),
                    etablissementId
                );
                for (const [matiereId, resolu] of resolus) {
                    coefficientsMap.set(matiereId, resolu.coefficient);
                }
            } else {
                // Fallback sans tenant : affectations matières actives uniquement
                const affectationRepo = AppDataSource.getRepository(AffectationMatiere);
                const affectationsClasse = await affectationRepo.find({
                    where: {
                        classeAnneeId: dto.classeAnneeId,
                        statut: StatutAffectationMatiere.ACTIVE
                    }
                });
                for (const aff of affectationsClasse) {
                    if (aff.coefficient !== null && aff.coefficient !== undefined) {
                        coefficientsMap.set(aff.matiereId, aff.coefficient);
                    }
                }
            }

            const batchKeys = [];
            for (const eleve of eleves) {
                for (const matiereNiveau of programme) {
                    batchKeys.push({
                        eleveId: eleve.id,
                        matiereId: matiereNiveau.matiereId,
                        periodeId: periode.id,
                    });
                }
            }

            const moyennesMap = await notesBatchLoaderService.batchLoadMoyennes(batchKeys, etablissementId);
            logger.info(`[Bulletins] Batch loading: ${batchKeys.length} combinaisons en 1 requête`);

            // Calculer les stats par matière pour la classe (moyenne/min/max classe)
            const matiereStatsMap = await this.calculerStatsMatieres(
                dto.classeAnneeId,
                periode.id,
                programme.map(p => p.matiereId),
                etablissementId
            );

            for (const eleve of eleves) {
                if (etablissementId && eleve.etablissementId !== etablissementId) {
                    throw new AppError(`L'élève ${eleve.id} n'appartient pas à cet établissement`, 403, 'WRONG_ETABLISSEMENT');
                }

                let totalPoints = 0;
                let totalCoeffs = 0;

                const eleveMoyennes = moyennesMap.get(eleve.id) || new Map();

                for (const matiereNiveau of programme) {
                    const moyenneMatiere = eleveMoyennes.get(matiereNiveau.matiereId) || 0;

                    let coefficient = 1;
                    if (params.calculationMethod === 'ponderee') {
                        coefficient = coefficientsMap.get(matiereNiveau.matiereId)
                            ?? matiereNiveau.coefficient
                            ?? 1;
                    }

                    totalPoints += moyenneMatiere * coefficient;
                    totalCoeffs += coefficient;
                }

                const moyenneGenerale = totalCoeffs > 0 ? totalPoints / totalCoeffs : 0;

                let bulletin = await this.repo.findOne({
                    where: { eleveId: eleve.id, classeAnneeId: dto.classeAnneeId, periodeId: periode.id }
                });

                if (!bulletin) {
                    bulletin = new Bulletin();
                    Object.assign(bulletin, {
                        eleveId: eleve.id,
                        classeAnneeId: dto.classeAnneeId,
                        periodeId: periode.id,
                        etablissementId,
                    });
                }

                // Renseigner l'année scolaire (via la période)
                bulletin.anneeScolaireId = periode.anneeScolaireId;
                bulletin.moyenneGenerale = parseFloat(moyenneGenerale.toFixed(2));

                await queryRunner.manager.save(bulletin);

                // Supprimer les anciennes BulletinMatiere et recréer
                await queryRunner.manager
                    .createQueryBuilder()
                    .delete()
                    .from(BulletinMatiere)
                    .where('bulletinId = :bulletinId', { bulletinId: bulletin.id })
                    .execute();

                // Créer les BulletinMatiere pour chaque matière du programme
                for (const matiereNiveau of programme) {
                    const moyenneMatiere = eleveMoyennes.get(matiereNiveau.matiereId) || 0;
                    let coefficient = 1;
                    if (params.calculationMethod === 'ponderee') {
                        coefficient = coefficientsMap.get(matiereNiveau.matiereId)
                            ?? matiereNiveau.coefficient
                            ?? 1;
                    }

                    const stats = matiereStatsMap.get(matiereNiveau.matiereId);

                    const bm = this.bulletinMatiereRepo.create({
                        bulletinId: bulletin.id,
                        matiereId: matiereNiveau.matiereId,
                        moyenne: parseFloat(moyenneMatiere.toFixed(2)),
                        coefficient,
                        moyenneClasse: stats?.moyenne,
                        moyenneMinClasse: stats?.min,
                        moyenneMaxClasse: stats?.max,
                        nombreNotes: stats?.nbNotes ?? 0,
                    });

                    await queryRunner.manager.save(bm);
                }

                bulletins.push(bulletin);
            }

            // Renseigner moyenneClasse/moyenneMin/moyenneMax à partir
            // des moyennes générales des bulletins générés (avant calcul des rangs)
            if (bulletins.length > 0) {
                const moyennesGen = bulletins.map(b => b.moyenneGenerale || 0);
                const moyenneClasse = parseFloat(
                    (moyennesGen.reduce((acc, v) => acc + v, 0) / moyennesGen.length).toFixed(2)
                );
                const moyenneMin = parseFloat(Math.min(...moyennesGen).toFixed(2));
                const moyenneMax = parseFloat(Math.max(...moyennesGen).toFixed(2));

                for (const bulletin of bulletins) {
                    bulletin.moyenneClasse = moyenneClasse;
                    bulletin.moyenneMin = moyenneMin;
                    bulletin.moyenneMax = moyenneMax;
                    await queryRunner.manager.save(bulletin);
                }
            }

            if (params.includeRanking) {
                await this.calculerRangs(dto.classeAnneeId, periode.id, etablissementId, queryRunner);
                await this.calculerRangsMatieres(dto.classeAnneeId, periode.id, queryRunner);
            }

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] ${bulletins.length} bulletins générés pour la classe ${classeAnnee.classe?.nom || dto.classeAnneeId}`);

            // Audit
            if (utilisateurId) {
                await auditService.log({
                    utilisateurId,
                    action: AuditAction.BULLETIN_GENERATE,
                    cible: 'Bulletin',
                    description: `${bulletins.length} bulletin(s) généré(s) pour ${classeAnnee.classe?.nom || dto.classeAnneeId}`,
                    cibleId: dto.classeAnneeId,
                    module: 'bulletins',
                    etablissementId,
                    metadata: {
                        entiteLabel: `${bulletins.length} bulletins - ${classeAnnee.classe?.nom || dto.classeAnneeId}`,
                        classeAnneeId: dto.classeAnneeId,
                        periodeId: dto.periodeId,
                    },
                });
            }

            // Invalider le cache batch loader après génération
            notesBatchLoaderService.clearCache();

            try {
                await this.envoyerNotificationsBulletins(bulletins, classeAnnee.classe, periode, etablissementId);
            } catch (error) {
                logger.warn('[Bulletins] Échec envoi notifications (non bloquant)', error);
            }

            return bulletins;
        } catch (error: any) {
            await queryRunner.rollbackTransaction();
            logger.error(`[${etablissementId}] Erreur génération bulletins: ${error.message}`);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Calcule les statistiques par matière pour l'ensemble de la classe.
     * NB: colonnes camelCase quotées (pas de NamingStrategy dans le projet).
     * Les notes VALIDEE et PUBLIEE comptent.
     */
    private async calculerStatsMatieres(
        classeAnneeId: string,
        periodeId: string,
        matiereIds: string[],
        etablissementId?: string
    ): Promise<Map<string, { moyenne: number; min: number; max: number; nbNotes: number }>> {
        const result = new Map<string, { moyenne: number; min: number; max: number; nbNotes: number }>();

        if (matiereIds.length === 0) return result;

        try {
            const conditions: string[] = [
                `ae."classeAnneeId" = $1`,
                `n."periodeId" = $2`,
                `n."matiereId" = ANY($3)`,
                `n.statut::text = ANY($4)`,
                `ae.actif = true`,
            ];
            const parametres: unknown[] = [
                classeAnneeId,
                periodeId,
                matiereIds,
                [StatutNote.VALIDEE, StatutNote.PUBLIEE],
            ];

            if (etablissementId) {
                parametres.push(etablissementId);
                conditions.push(`n."etablissementId" = $${parametres.length}`);
            }

            const query = `
                SELECT
                    n."matiereId",
                    AVG(n.valeur / NULLIF(n.bareme, 0) * 20 * n.coefficient) / NULLIF(AVG(n.coefficient), 0) as moyenne,
                    MIN(n.valeur / NULLIF(n.bareme, 0) * 20) as min_note,
                    MAX(n.valeur / NULLIF(n.bareme, 0) * 20) as max_note,
                    COUNT(*) as nb_notes
                FROM notes n
                INNER JOIN affectations_eleves ae ON ae."eleveId" = n."eleveId"
                WHERE ${conditions.join('\n                AND ')}
                GROUP BY n."matiereId"
            `;

            const rows = await this.repo.query(query, parametres);

            for (const row of rows) {
                result.set(row.matiereId, {
                    moyenne: parseFloat(parseFloat(row.moyenne).toFixed(2)),
                    min: parseFloat(parseFloat(row.min_note).toFixed(2)),
                    max: parseFloat(parseFloat(row.max_note).toFixed(2)),
                    nbNotes: parseInt(row.nb_notes, 10),
                });
            }
        } catch (error) {
            logger.warn('[Bulletins] Erreur calcul stats matières (non bloquant)', error);
        }

        return result;
    }

    /**
     * Calcule les rangs par matière pour tous les bulletins d'une classe
     */
    private async calculerRangsMatieres(classeAnneeId: string, periodeId: string, queryRunner?: QueryRunner): Promise<void> {
        const manager = queryRunner ? queryRunner.manager : AppDataSource.manager;

        const bulletinRepo = queryRunner
            ? queryRunner.manager.getRepository(Bulletin)
            : this.repo;

        const bulletins = await bulletinRepo.find({
            where: { classeAnneeId, periodeId },
        });

        if (bulletins.length === 0) return;

        const bulletinIds = bulletins.map((b: Bulletin) => b.id);

        const matieres = await manager.createQueryBuilder()
            .select('bm.matiereId', 'matiereId')
            .addSelect('bm.bulletinId', 'bulletinId')
            .addSelect('bm.moyenne', 'moyenne')
            .from(BulletinMatiere, 'bm')
            .where('bm.bulletinId IN (:...ids)', { ids: bulletinIds })
            .orderBy('bm.moyenne', 'DESC')
            .getRawMany();

        // Grouper par matière
        const parMatiere = new Map<string, { bulletinId: string; moyenne: number }[]>();
        for (const row of matieres) {
            if (!parMatiere.has(row.matiereId)) {
                parMatiere.set(row.matiereId, []);
            }
            parMatiere.get(row.matiereId)!.push({ bulletinId: row.bulletinId, moyenne: row.moyenne });
        }

        // Calculer les rangs par matière (ex-aequo partagent le même rang)
        for (const [matiereId, entries] of parMatiere) {
            entries.sort((a, b) => b.moyenne - a.moyenne);
            let rang = 1;
            for (let i = 0; i < entries.length; i++) {
                if (!(i > 0 && entries[i].moyenne === entries[i - 1].moyenne)) {
                    rang = i + 1;
                }

                await manager.createQueryBuilder()
                    .update(BulletinMatiere)
                    .set({ rangMatiere: rang })
                    .where('bulletinId = :bulletinId AND matiereId = :matiereId', {
                        bulletinId: entries[i].bulletinId,
                        matiereId,
                    })
                    .execute();
            }
        }
    }

    private async calculerRangs(classeAnneeId: string, periodeId: string, etablissementId?: string, queryRunner?: QueryRunner): Promise<void> {
        const where: FindOptionsWhere<Bulletin> = { classeAnneeId, periodeId };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletinRepo = queryRunner
            ? queryRunner.manager.getRepository(Bulletin)
            : this.repo;

        const bulletins = await bulletinRepo.find({
            where,
            order: { moyenneGenerale: 'DESC' }
        });

        if (bulletins.length === 0) return;

        bulletins.sort((a: Bulletin, b: Bulletin) => (b.moyenneGenerale || 0) - (a.moyenneGenerale || 0));

        let rang = 1;
        for (let i = 0; i < bulletins.length; i++) {
            if (i > 0 && bulletins[i].moyenneGenerale === bulletins[i - 1].moyenneGenerale) {
                bulletins[i].rang = bulletins[i - 1].rang;
            } else {
                bulletins[i].rang = rang;
            }
            rang++;

            await bulletinRepo.save(bulletins[i]);
        }

        logger.info(`[${etablissementId}] Rangs calculés pour ${bulletins.length} bulletins`);
    }

    async getGenerationStatus(context: { etablissementId?: string; periodeId?: string }): Promise<{
        total: number;
        generes: number;
        enCours: number;
        progression: number;
    }> {
        const where: FindOptionsWhere<Bulletin> = {};
        if (context.etablissementId) where.etablissementId = context.etablissementId;
        if (context.periodeId) where.periodeId = context.periodeId;

        const total = await this.repo.count({ where });
        const generes = await this.repo.count({ where: { ...where, moyenneGenerale: MoreThan(0) } });
        const enCours = total - generes;
        const progression = total > 0 ? Math.round((generes / total) * 100) : 0;

        return { total, generes, enCours, progression };
    }

    async findAllPaginated(query: QueryBulletinsDto, etablissementId?: string): Promise<PaginatedResult<Bulletin>> {
        const { page, limit, eleveId, classeAnneeId, periodeId, publie, recherche } = query;

        const qb = this.repo.createQueryBuilder('bulletin')
            .leftJoinAndSelect('bulletin.eleve', 'eleve')
            .leftJoinAndSelect('bulletin.classeAnnee', 'classeAnnee')
            .leftJoinAndSelect('classeAnnee.classe', 'classe')
            .leftJoinAndSelect('bulletin.periode', 'periode')
            .leftJoinAndSelect('bulletin.bulletinMatieres', 'bulletinMatieres')
            .leftJoinAndSelect('bulletinMatieres.matiere', 'matiere');

        if (eleveId) qb.andWhere('bulletin.eleveId = :eleveId', { eleveId });
        if (classeAnneeId) qb.andWhere('bulletin.classeAnneeId = :classeAnneeId', { classeAnneeId });
        if (periodeId) qb.andWhere('bulletin.periodeId = :periodeId', { periodeId });
        if (publie !== undefined) qb.andWhere('bulletin.publie = :publie', { publie });
        if (etablissementId) qb.andWhere('bulletin.etablissementId = :etablissementId', { etablissementId });

        // Recherche serveur : nom/prénom de l'élève
        if (recherche) {
            qb.andWhere(
                '(eleve.nom ILIKE :recherche OR eleve.prenom ILIKE :recherche)',
                { recherche: `%${recherche}%` }
            );
        }

        qb.orderBy('bulletin.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [items, total] = await qb.getManyAndCount();

        return createPaginatedResult(items, total, page, limit);
    }

    async findOne(id: string, etablissementId?: string): Promise<Bulletin> {
        const where: FindOptionsWhere<Bulletin> = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletin = await this.repo.findOne({
            where,
            relations: ['eleve', 'classeAnnee', 'classeAnnee.classe', 'classeAnnee.anneeScolaire', 'periode', 'bulletinMatieres', 'bulletinMatieres.matiere', 'etablissement'],
        });

        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'BULLETIN_NOT_FOUND');
        return bulletin;
    }

    async findByEleve(
        eleveId: string,
        etablissementId?: string,
        options?: { publie?: boolean }
    ): Promise<Bulletin[]> {
        const where: FindOptionsWhere<Bulletin> = { eleveId };
        if (etablissementId) where.etablissementId = etablissementId;
        if (options?.publie !== undefined) where.publie = options.publie;

        return this.repo.find({
            where,
            relations: ['periode', 'classeAnnee', 'classeAnnee.classe', 'bulletinMatieres', 'bulletinMatieres.matiere'],
            // DESC : le premier élément est toujours le bulletin le plus récent
            order: { periode: { dateDebut: 'DESC' } }
        });
    }

    async update(id: string, dto: UpdateBulletinDto, utilisateurId?: string, etablissementId?: string): Promise<Bulletin> {
        const where: FindOptionsWhere<Bulletin> = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletin = await this.repo.findOne({ where });
        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'NOT_FOUND');

        const snapshotAvant: Record<string, unknown> = {
            appreciationConseil: bulletin.appreciationConseil,
            sanctions: bulletin.sanctions,
            encouragements: bulletin.encouragements,
            publie: bulletin.publie,
        };

        // Si demande de publication et workflow requis, créer le workflow
        if (dto.publie === true && !bulletin.publie) {
            const requireValidation = await getParamBoolean('bulletins.require_validation', { defaultValue: true, etablissementId });
            if (requireValidation) {
                await validationWorkflowService.createWorkflow({
                    module: 'bulletins',
                    entiteId: bulletin.id,
                    entiteType: 'Bulletin',
                    niveauxRequis: 2,
                    etablissementId,
                    commentaire: 'Demande de publication du bulletin',
                }, utilisateurId ?? '');

                logger.info(`[Bulletins] Publication en attente de validation: ${id}`);
                return bulletin;
            }
        }

        Object.assign(bulletin, dto);
        await this.repo.save(bulletin);

        if (utilisateurId) {
            await auditService.log({
                utilisateurId,
                action: AuditAction.BULLETIN_UPDATE,
                cible: 'Bulletin',
                cibleId: id,
                description: 'Bulletin mis à jour',
                anciennesValeurs: snapshotAvant,
                nouvellesValeurs: dto as Record<string, unknown>,
                module: 'bulletins',
            });
        }

        return bulletin;
    }

    /**
     * Suppression d'un bulletin (et de ses BulletinMatiere en cascade)
     * Refusée si le bulletin est publié.
     */
    async remove(id: string, utilisateurId: string, etablissementId?: string): Promise<void> {
        const where: FindOptionsWhere<Bulletin> = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletin = await this.repo.findOne({ where });
        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'BULLETIN_NOT_FOUND');

        if (bulletin.publie) {
            throw new AppError('Impossible de supprimer un bulletin publié', 400, 'BULLETIN_PUBLIE');
        }

        // Supprimer explicitement les lignes matières (le FK onDelete CASCADE
        // couvre aussi ce cas, mais on garantit la cohérence applicative)
        await this.bulletinMatiereRepo.delete({ bulletinId: id });

        await this.repo.remove(bulletin);

        await auditService.log({
            utilisateurId,
            action: AuditAction.BULLETIN_DELETE,
            cible: 'Bulletin',
            cibleId: id,
            description: `Bulletin supprimé (élève: ${bulletin.eleveId}, période: ${bulletin.periodeId})`,
            module: 'bulletins',
        });

        logger.info(`[Bulletins] Bulletin ${id} supprimé par ${utilisateurId}`);
    }

    private async envoyerNotificationsBulletins(
        bulletins: Bulletin[],
        classe: any,
        periode: any,
        etablissementId?: string
    ): Promise<void> {
        const eleveRepo = AppDataSource.getRepository(Eleve);
        const totalEleves = bulletins.length;

        for (const bulletin of bulletins) {
            try {
                const eleve = await eleveRepo.findOne({
                    where: { id: bulletin.eleveId },
                    relations: ['utilisateur'],
                });

                if (!eleve?.utilisateurId) continue;

                const responsables = await parentsService.getResponsablesForNotification(eleve.utilisateurId);
                if (!responsables || responsables.length === 0) continue;

                for (const resp of responsables) {
                    await notificationTemplates.bulletinDisponible({
                        destinataireId: resp.utilisateurId,
                        etablissementId,
                        metadata: {
                            bulletinId: bulletin.id,
                            eleveId: eleve.id,
                            email: resp.email,
                        },
                    }, {
                        eleveNom: `Élève ${eleve.id.substring(0, 8)}`,
                        periode: periode.nom,
                        moyenne: bulletin.moyenneGenerale || 0,
                        rang: bulletin.rang || undefined,
                        totalEleves: totalEleves,
                    });
                }

                logger.info(`[Bulletins] Notification envoyée pour élève ${eleve.id.substring(0, 8)}`);
            } catch (error) {
                logger.warn(`[Bulletins] Erreur notification bulletin ${bulletin.id}`, error);
            }
        }
    }
}

export const bulletinsService = new BulletinsService();
