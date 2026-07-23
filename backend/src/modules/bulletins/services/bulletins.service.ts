/**
 * ==================================
 * eLISAschool - Service Bulletins v2.0
 * ==================================
 */

import { Repository, MoreThan, In } from 'typeorm';
import { AppDataSource } from '@database/data-source';
import { Bulletin, BulletinMatiere, BulletinWorkflow, StatutValidationBulletin } from '../entities';
import { GenerateBulletinDto, UpdateBulletinDto, QueryBulletinsDto } from '../dto';
import { AppError } from '@common/filters/error.filter';
import { logger } from '@common/utils/logger.util';
import { parentsService } from '@modules/responsables-eleves/services';
import { periodesService } from '@modules/periodes/services';
import { StatutPeriode } from '@modules/periodes/entities';
import { notesBatchLoaderService } from '@modules/notes/services/notes-batch-loader.service';
import { matieresService } from '@modules/matieres/services';
import { AffectationMatiere, StatutAffectationMatiere } from '@modules/matieres/entities';
import { Eleve } from '@modules/eleves/entities';
import { getParamBoolean, getParamNumber, getParam } from '@modules/configuration/utils/config.helper';
import { notificationTemplates } from '@modules/notifications/services';
import { validationWorkflowService } from '@modules/validation-workflow/services';
import { auditService, AuditAction } from '@modules/auth';

export class BulletinsService {
    private repo: Repository<Bulletin>;
    private matiereRepo: Repository<BulletinMatiere>;

    constructor() {
        this.repo = AppDataSource.getRepository(Bulletin);
        this.matiereRepo = AppDataSource.getRepository(BulletinMatiere);
    }

    private async getBulletinsParams() {
        return {
            includeRanking: await getParamBoolean('bulletins.include_ranking', { defaultValue: true }),
            showAppreciations: await getParamBoolean('bulletins.show_appreciations', { defaultValue: true }),
            validationThreshold: await getParamNumber('bulletins.validation_threshold', { defaultValue: 10 }),
            calculationMethod: await getParam<string>('bulletins.calculation_method', { defaultValue: 'ponderee' }),
            displayCoefficients: await getParamBoolean('bulletins.display_coefficients', { defaultValue: true }),
            templateId: await getParam<string>('bulletins.template_id', { defaultValue: 'default' }),
            requireValidation: await getParamBoolean('bulletins.require_validation', { defaultValue: false }),
        };
    }

    async generate(dto: GenerateBulletinDto, etablissementId?: string): Promise<Bulletin[]> {
        const params = await this.getBulletinsParams();
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
                    eleves = await eleveRepo.find({ where: { id: In(eleveIds) } });
                }
            }

            if (eleves.length === 0) {
                throw new AppError('Aucun élève trouvé dans cette classe', 404, 'NO_ELEVES');
            }

            const bulletins: Bulletin[] = [];

            const programme = await matieresService.getMatieresParNiveau(classeAnnee.classe.niveauId);

            const affectationRepo = AppDataSource.getRepository(AffectationMatiere);
            const affectationsClasse = await affectationRepo.find({
                where: {
                    classeAnneeId: dto.classeAnneeId,
                    statut: StatutAffectationMatiere.ACTIVE
                }
            });

            const coeffAffectationMap = new Map<string, number>();
            for (const aff of affectationsClasse) {
                if (aff.coefficient !== null && aff.coefficient !== undefined) {
                    coeffAffectationMap.set(aff.matiereId, aff.coefficient);
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

            const moyennesMap = await notesBatchLoaderService.batchLoadMoyennes(batchKeys);
            logger.info(`[Bulletins] Batch loading: ${batchKeys.length} combinaisons en 1 requête`);

            // Calculer les stats par matière pour la classe (moyenne/min/max classe)
            const matiereStatsMap = await this.calculerStatsMatieres(
                dto.classeAnneeId,
                periode.id,
                programme.map(p => p.matiereId),
                coeffAffectationMap,
                params.calculationMethod === 'ponderee'
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
                        coefficient = coeffAffectationMap.get(matiereNiveau.matiereId)
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

                const isNew = !bulletin;
                if (!bulletin) {
                    bulletin = new Bulletin();
                    Object.assign(bulletin, {
                        eleveId: eleve.id,
                        classeAnneeId: dto.classeAnneeId,
                        periodeId: periode.id,
                        anneeScolaireId: classeAnnee.anneeScolaireId,
                        etablissementId,
                    });
                }

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
                        coefficient = coeffAffectationMap.get(matiereNiveau.matiereId)
                            ?? matiereNiveau.coefficient
                            ?? 1;
                    }

                    const stats = matiereStatsMap.get(matiereNiveau.matiereId);

                    const bm = this.matiereRepo.create({
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

                // Créer le workflow de validation si requis
                if (params.requireValidation && isNew) {
                    try {
                        await validationWorkflowService.createWorkflow({
                            module: 'bulletins',
                            entiteId: bulletin.id,
                            entiteType: 'Bulletin',
                            niveauxRequis: 2,
                            etablissementId,
                        }, 'system');
                    } catch (error) {
                        logger.warn(`[Bulletins] Échec création workflow pour bulletin ${bulletin.id} (non bloquant)`, error);
                    }
                }

                bulletins.push(bulletin);
            }

            if (params.includeRanking) {
                await this.calculerRangs(dto.classeAnneeId, periode.id, etablissementId, queryRunner);
                await this.calculerRangsMatieres(dto.classeAnneeId, periode.id, queryRunner);
            }

            await queryRunner.commitTransaction();
            logger.info(`[${etablissementId}] ${bulletins.length} bulletins générés pour la classe ${classeAnnee.classe?.nom || dto.classeAnneeId}`);

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
     * Calcule les statistiques par matière pour l'ensemble de la classe
     */
    private async calculerStatsMatieres(
        classeAnneeId: string,
        periodeId: string,
        matiereIds: string[],
        coeffMap: Map<string, number>,
        ponderer: boolean
    ): Promise<Map<string, { moyenne: number; min: number; max: number; nbNotes: number }>> {
        const result = new Map<string, { moyenne: number; min: number; max: number; nbNotes: number }>();

        if (matiereIds.length === 0) return result;

        try {
            const query = `
                SELECT 
                    n.matiere_id,
                    AVG(n.valeur / n.bareme * 20 * n.coefficient) / AVG(n.coefficient) as moyenne,
                    MIN(n.valeur / n.bareme * 20) as min_note,
                    MAX(n.valeur / n.bareme * 20) as max_note,
                    COUNT(*) as nb_notes
                FROM notes n
                INNER JOIN affectations_eleves ae ON ae.eleve_id = n.eleve_id
                WHERE ae.classe_annee_id = $1
                AND n.periode_id = $2
                AND n.matiere_id = ANY($3)
                AND n.statut = 'PUBLIEE'
                AND ae.actif = true
                GROUP BY n.matiere_id
            `;

            const rows = await this.repo.query(query, [classeAnneeId, periodeId, matiereIds]);

            for (const row of rows) {
                result.set(row.matiere_id, {
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
    private async calculerRangsMatieres(classeAnneeId: string, periodeId: string, queryRunner?: any): Promise<void> {
        const manager = queryRunner?.manager || AppDataSource;

        const bulletins = await (queryRunner?.manager || this.repo).find(Bulletin, {
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

        // Calculer les rangs par matière
        for (const [matiereId, entries] of parMatiere) {
            entries.sort((a, b) => b.moyenne - a.moyenne);
            let rang = 1;
            for (let i = 0; i < entries.length; i++) {
                if (i > 0 && entries[i].moyenne === entries[i - 1].moyenne) {
                    rang = rang; // même rang
                } else {
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

    private async calculerRangs(classeAnneeId: string, periodeId: string, etablissementId?: string, queryRunner?: any): Promise<void> {
        const where: any = { classeAnneeId, periodeId };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletins = await (queryRunner?.manager || this.repo).find(Bulletin, {
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

            await (queryRunner?.manager || this.repo).save(bulletins[i]);
        }

        logger.info(`[${etablissementId}] Rangs calculés pour ${bulletins.length} bulletins`);
    }

    async getGenerationStatus(context: { etablissementId?: string; periodeId?: string }): Promise<{
        total: number;
        generes: number;
        enCours: number;
        progression: number;
    }> {
        const where: any = {};
        if (context.etablissementId) where.etablissementId = context.etablissementId;
        if (context.periodeId) where.periodeId = context.periodeId;

        const total = await this.repo.count({ where });
        const generes = await this.repo.count({ where: { ...where, moyenneGenerale: MoreThan(0) } });
        const enCours = total - generes;
        const progression = total > 0 ? Math.round((generes / total) * 100) : 0;

        return { total, generes, enCours, progression };
    }

    async findAllPaginated(query: QueryBulletinsDto, etablissementId?: string): Promise<{ items: Bulletin[]; total: number }> {
        const { page, limit, eleveId, classeAnneeId, periodeId, publie } = query;

        const where: any = {};
        if (eleveId) where.eleveId = eleveId;
        if (classeAnneeId) where.classeAnneeId = classeAnneeId;
        if (periodeId) where.periodeId = periodeId;
        if (publie !== undefined) where.publie = publie;
        if (etablissementId) where.etablissementId = etablissementId;

        const [items, total] = await this.repo.findAndCount({
            where,
            relations: ['eleve', 'classeAnnee', 'classeAnnee.classe', 'periode', 'matieres', 'matieres.matiere'],
            order: { createdAt: 'DESC' },
            skip: ((page || 1) - 1) * (limit || 20),
            take: limit || 20,
        });

        return { items, total };
    }

    async findByEleve(eleveId: string, etablissementId?: string): Promise<Bulletin[]> {
        const where: any = { eleveId };
        if (etablissementId) where.etablissementId = etablissementId;

        return this.repo.find({
            where,
            relations: ['periode', 'classeAnnee', 'classeAnnee.classe', 'matieres', 'matieres.matiere'],
            order: { periode: { dateDebut: 'ASC' } }
        });
    }

    async findOne(id: string, etablissementId?: string): Promise<Bulletin> {
        const where: any = { id };
        if (etablissementId) where.etablissementId = etablissementId;

        const bulletin = await this.repo.findOne({
            where,
            relations: ['eleve', 'classeAnnee', 'classeAnnee.classe', 'periode', 'matieres', 'matieres.matiere'],
        });

        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'BULLETIN_NOT_FOUND');
        return bulletin;
    }

    async update(id: string, dto: UpdateBulletinDto): Promise<Bulletin> {
        const bulletin = await this.repo.findOne({ where: { id } });
        if (!bulletin) throw new AppError('Bulletin non trouvé', 404, 'NOT_FOUND');

        Object.assign(bulletin, dto);
        await this.repo.save(bulletin);
        return bulletin;
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
